/**
 * AuraMed - Suíte Vitest dos motores clínicos
 * Rodar: npx vitest run
 *
 * Foco: (1) valores de referência, (2) entradas inválidas são RECUSADAS (nunca corrigidas em silêncio),
 * (3) invariantes de dados (massa ÷ volume = concentração), (4) segurança da conduta.
 */
import { describe, expect, it } from 'vitest';
import {
  calculateAdjustedWeight,
  calculateCkdEpi2021,
  calculateCockcroftGault,
  calculateDevineIdealWeight,
  calculateFullTfg,
} from '../tfg';
import {
  STANDARD_DRUG_PRESETS,
  calculateDoseFromRate,
  calculateInfusionRate,
  concentrationOf,
  convertMcgKgMinToMlHr,
  convertMcgMinToMlHr,
  convertMgHrToMlHr,
  convertMlHrToMcgKgMin,
  convertUiMinToMlHr,
  findDefaultPreset,
} from '../infusion';
import { derivePatientMetrics, generateStratifiedConduct, validatePatientData } from '../conduta-engine';
import { CLINICAL_DRUGS, dilutionsFor } from '../../data/farmacos';
import { ClinicalInputError } from '../validation';
import type { ConductPhase, PatientData } from '../../types/clinical';

const paciente = (over: Partial<PatientData> = {}): PatientData => ({
  id: 'teste',
  age: 68,
  sex: 'M',
  weightKg: 70,
  heightCm: 172,
  sbp: 80,
  dbp: 40,
  hr: 120,
  rr: 24,
  spo2: 92,
  temperature: 38.5,
  gcs: 14,
  creatinineMgDl: 1.0,
  allergies: [],
  pregnancy: false,
  dialysis: false,
  liverFailure: false,
  activeBleeding: false,
  ...over,
});

const fases = (): ConductPhase[] => [
  {
    phaseTitle: 'Fase teste',
    timeWindow: '0-1h',
    items: [
      { id: 'nora', title: 'Noradrenalina', detail: 'Vasopressor', priority: 'emergency',
        drugPrescription: { drugId: 'noradrenalina', drugName: 'Noradrenalina', calculatedDose: '', route: 'EV em BIC contínua', dilution: 'x', safetyDoubleCheck: false, targetParameter: 'PAM' } },
      { id: 'vaso', title: 'Vasopressina', detail: 'Adjuvante', priority: 'high',
        drugPrescription: { drugId: 'vasopressina', drugName: 'Vasopressina', calculatedDose: '', route: 'EV em BIC contínua', dilution: 'x', safetyDoubleCheck: false, targetParameter: 'PAM' } },
      { id: 'enox', title: 'Enoxaparina', detail: 'Anticoagulação', priority: 'high',
        drugPrescription: { drugId: 'enoxaparina', drugName: 'Enoxaparina', calculatedDose: '', route: 'SC', dilution: 'Pura', safetyDoubleCheck: false, targetParameter: 'Anti-Xa' } },
      { id: 'desc', title: 'Fármaco desconhecido', detail: 'Sem regime', priority: 'routine',
        drugPrescription: { drugId: 'inexistente', drugName: 'Inexistente', calculatedDose: '', route: 'EV em bólus', dilution: '-', safetyDoubleCheck: false, targetParameter: '-' } },
    ],
  },
];
const item = (r: ReturnType<typeof generateStratifiedConduct>, id: string) => r.phases[0].items.find((i) => i.id === id)!;

// ---------------------------------------------------------------------------
describe('TFG - valores de referência', () => {
  it('CKD-EPI 2021: homem 60a, Cr 1,0 => 86', () => expect(calculateCkdEpi2021(60, 'M', 1.0).gfr).toBe(86));
  it('CKD-EPI 2021: mulher 60a, Cr 1,0 => 64', () => expect(calculateCkdEpi2021(60, 'F', 1.0).gfr).toBe(64));
  it('CKD-EPI 2021: homem 60a, Cr 1,2 => 69', () => expect(calculateCkdEpi2021(60, 'M', 1.2).gfr).toBe(69));
  it('CKD-EPI 2021: mulher 45a, Cr 3,5 => 16', () => expect(calculateCkdEpi2021(45, 'F', 3.5).gfr).toBe(16));
  it('Devine: homem 175 cm => 70,5 kg', () => expect(calculateDevineIdealWeight(175, 'M')).toBeCloseTo(70.5, 1));
  it('Devine: mulher 160 cm => 52,4 kg', () => expect(calculateDevineIdealWeight(160, 'F')).toBeCloseTo(52.4, 1));
  it('Devine: homem 178 cm => 73,2 kg (não 73,0)', () => expect(calculateDevineIdealWeight(178, 'M')).toBeCloseTo(73.2, 1));
  it('Peso ajustado: real ≤ ideal devolve o real', () => expect(calculateAdjustedWeight(50, 60)).toBe(50));
  it('Cockcroft-Gault: homem 70a, 70 kg, 175 cm, Cr 1,2 => 57 (peso real)', () => {
    const r = calculateCockcroftGault(70, 'M', 70, 175, 1.2);
    expect(r.clcr).toBe(57);
    expect(r.weightType).toBe('real');
  });
  it('Cockcroft-Gault: obesa usa peso ajustado (> 130% do ideal)', () => {
    const r = calculateCockcroftGault(55, 'F', 130, 160, 1.0);
    expect(r.weightType).toBe('ajustado');
    expect(r.weightUsed).toBeCloseTo(83.4, 1);
    expect(r.clcr).toBe(84);
  });
  it('política padrão é peso AJUSTADO (decisão do revisor): 80 kg, 175 cm, 60 anos, Cr 1,0 => 83 mL/min', () => {
    const r = calculateCockcroftGault(60, 'M', 80, 175, 1.0);
    expect(r.weightType).toBe('ajustado');
    expect(r.weightUsed).toBeCloseTo(74.3, 1);
    expect(r.clcr).toBe(83);
  });
  it('mesmo paciente com política real => 89 mL/min; com auto (≤ 130% do ideal) também usa o real', () => {
    expect(calculateCockcroftGault(60, 'M', 80, 175, 1.0, 'real').clcr).toBe(89);
    expect(calculateCockcroftGault(60, 'M', 80, 175, 1.0, 'auto').clcr).toBe(89);
  });
  it('peso real abaixo do ideal: a política ajustada usa o peso real e informa "real"', () => {
    const r = calculateCockcroftGault(60, 'M', 60, 175, 1.0);
    expect(r.weightUsed).toBe(60);
    expect(r.weightType).toBe('real');
  });
  it('a TFG completa usa a política padrão e a exibe na explicação', () => {
    const r = calculateFullTfg(60, 'M', 80, 175, 1.0);
    expect(r.cockcroftGault).toBe(83);
    expect(r.weightTypeUsed).toBe('ajustado');
    expect(r.explanationCockcroftGault.variablesUsed['Política de peso']).toContain('ajustado');
  });
  it('Política de peso pode ser forçada', () => {
    expect(calculateCockcroftGault(55, 'F', 130, 160, 1.0, 'real').weightType).toBe('real');
  });
  it('TFG completa devolve ambas as estimativas e avisos', () => {
    const r = calculateFullTfg(60, 'M', 80, 175, 1.0);
    expect(r.ckdEpi2021).toBe(86);
    expect(r.explanationCkdEpi.warningAlert).toContain('creatinina estável');
  });
});

describe('TFG - entradas inválidas são recusadas', () => {
  const casos: [string, () => unknown][] = [
    ['creatinina NaN', () => calculateCkdEpi2021(60, 'M', NaN)],
    ['creatinina 0', () => calculateCkdEpi2021(60, 'M', 0)],
    ['creatinina negativa', () => calculateCkdEpi2021(60, 'M', -1)],
    ['idade pediátrica (12 anos)', () => calculateCkdEpi2021(12, 'M', 0.6)],
    ['idade absurda (150)', () => calculateCockcroftGault(150, 'M', 70, 175, 1.0)],
    ['altura 0', () => calculateCockcroftGault(60, 'M', 70, 0, 1.0)],
    ['peso 0', () => calculateCockcroftGault(60, 'M', 0, 175, 1.0)],
    ['sexo inválido', () => calculateCkdEpi2021(60, 'X' as 'M', 1.0)],
    ['Devine com altura 0', () => calculateDevineIdealWeight(0, 'M')],
  ];
  casos.forEach(([nome, fn]) => it(`lança ClinicalInputError: ${nome}`, () => expect(fn).toThrow(ClinicalInputError)));
});

// ---------------------------------------------------------------------------
describe('Infusão - valores de referência', () => {
  it('noradrenalina 0,1 mcg/kg/min, 70 kg, 16 mcg/mL => 26,3 mL/h', () => {
    expect(convertMcgKgMinToMlHr(0.1, 70, 16).rateMlHr).toBeCloseTo(26.3, 1);
  });
  it('mcg/min: nitroglicerina 10 mcg/min, 200 mcg/mL => 3 mL/h', () => {
    expect(convertMcgMinToMlHr(10, 200).rateMlHr).toBeCloseTo(3.0, 1);
  });
  it('vasopressina 0,03 UI/min, 0,2 UI/mL => 9 mL/h', () => {
    expect(convertUiMinToMlHr(0.03, 0.2).rateMlHr).toBeCloseTo(9.0, 1);
  });
  it('mg/h: 5 mg/h a 1 mg/mL => 5 mL/h', () => {
    expect(convertMgHrToMlHr(5, 1).rateMlHr).toBeCloseTo(5.0, 1);
  });
  it('reverso: 26,3 mL/h, 70 kg, 16 mcg/mL => ~0,1 mcg/kg/min', () => {
    expect(convertMlHrToMcgKgMin(26.3, 70, 16).doseMcgKgMin).toBeCloseTo(0.1, 2);
  });
  it('ida e volta: dose → mL/h → dose, em grade de pesos/doses/concentrações', () => {
    for (const peso of [40, 55, 70, 90, 120]) {
      for (const dose of [0.05, 0.1, 0.25, 0.5, 1.0]) {
        for (const conc of [16, 32, 64]) {
          const rate = convertMcgKgMinToMlHr(dose, peso, conc).rateMlHr;
          const back = convertMlHrToMcgKgMin(rate, peso, conc).doseMcgKgMin;
          // erro máximo = resolução de 0,1 mL/h da bomba
          const tolerancia = (0.05 * conc) / (peso * 60) + 0.0006;
          expect(Math.abs(back - dose)).toBeLessThanOrEqual(tolerancia);
        }
      }
    }
  });
  it('dose acima da faixa usual => severidade crítica e aviso', () => {
    const r = convertMcgKgMinToMlHr(2.0, 70, 16, { doseRange: { min: 0.05, max: 1.0 } });
    expect(r.explanation.finalResult.severity).toBe('critical');
    expect(r.warnings.join(' ')).toContain('acima da faixa usual');
  });
  it('severidade depende do fármaco: dobutamina 5 mcg/kg/min NÃO é crítica', () => {
    const p = findDefaultPreset('dobutamina')!;
    expect(calculateInfusionRate(p, 5, 70).explanation.finalResult.severity).toBe('normal');
  });
});

describe('Infusão - entradas inválidas são recusadas', () => {
  const casos: [string, () => unknown][] = [
    ['peso 0', () => convertMcgKgMinToMlHr(0.1, 0, 16)],
    ['peso NaN', () => convertMcgKgMinToMlHr(0.1, NaN, 16)],
    ['peso 7 (erro de digitação de 70)', () => convertMcgKgMinToMlHr(0.1, 7, 16)],
    ['concentração 0', () => convertMcgKgMinToMlHr(0.1, 70, 0)],
    ['concentração negativa', () => convertMcgKgMinToMlHr(0.1, 70, -16)],
    ['dose negativa', () => convertMcgKgMinToMlHr(-0.1, 70, 16)],
    ['dose 0', () => convertMcgKgMinToMlHr(0, 70, 16)],
    ['dose NaN', () => convertMcgKgMinToMlHr(NaN, 70, 16)],
    ['taxa acima do limite da bomba', () => convertMcgKgMinToMlHr(10, 100, 16)],
    ['reverso com peso 0', () => convertMlHrToMcgKgMin(26.3, 0, 16)],
    ['reverso com taxa acima da bomba', () => convertMlHrToMcgKgMin(1500, 70, 16)],
    ['preset por peso sem informar o peso', () => calculateInfusionRate(findDefaultPreset('noradrenalina')!, 0.1)],
  ];
  casos.forEach(([nome, fn]) => it(`lança ClinicalInputError: ${nome}`, () => expect(fn).toThrow(ClinicalInputError)));
});

describe('Infusão - cálculo reverso genérico (corrige a conversão da interface)', () => {
  const preset = (id: string) => STANDARD_DRUG_PRESETS.find((p) => p.id === id)!;
  it('vasopressina: 9 mL/h => 0,03 UI/min (a interface antiga mostrava ~0)', () => {
    const r = calculateDoseFromRate(preset('vasopressina_padrao'), 9);
    expect(r.dose).toBeCloseTo(0.03, 3);
    expect(r.unit).toBe('UI/min');
  });
  it('nitroglicerina: 3 mL/h => 10 mcg/min (a interface antiga mostrava 0,143)', () => {
    expect(calculateDoseFromRate(preset('tridil_padrao'), 3).dose).toBeCloseTo(10, 3);
  });
  it('noradrenalina: 26,3 mL/h, 70 kg => ~0,1 mcg/kg/min', () => {
    expect(calculateDoseFromRate(preset('nora_padrao'), 26.3, 70).dose).toBeCloseTo(0.1, 2);
  });
  it('ida e volta em TODOS os presets, na dose inicial (erro limitado à resolução de 0,1 mL/h)', () => {
    STANDARD_DRUG_PRESETS.forEach((p) => {
      const peso = p.requiresWeight ? 70 : undefined;
      const rate = calculateInfusionRate(p, p.startingDose, peso).rateMlHr;
      const back = calculateDoseFromRate(p, rate, peso).dose;
      const c = concentrationOf(p);
      const divisor = (p.unit === 'mcg/kg/min' ? 60 * 70 : p.unit === 'mcg/min' || p.unit === 'UI/min' ? 60 : 1) * (p.unit === 'mg/h' ? 1000 : 1);
      const tolerancia = (0.05 * c.value) / divisor + 0.0006;
      expect(Math.abs(back - p.startingDose)).toBeLessThanOrEqual(tolerancia);
    });
  });
  it('peso é ignorado quando a unidade não depende dele (vasopressina sem peso não lança)', () => {
    expect(() => calculateDoseFromRate(preset('vasopressina_padrao'), 9)).not.toThrow();
  });
  it('dose recebida acima da faixa usual => severidade crítica', () => {
    const r = calculateDoseFromRate(preset('vasopressina_padrao'), 18); // 0,06 UI/min
    expect(r.explanation.finalResult.severity).toBe('critical');
    expect(r.warnings.join(' ')).toContain('acima da faixa usual');
  });
  const invalidos: [string, () => unknown][] = [
    ['mcg/kg/min sem peso', () => calculateDoseFromRate(preset('nora_padrao'), 26.3)],
    ['mcg/kg/min com peso 0', () => calculateDoseFromRate(preset('nora_padrao'), 26.3, 0)],
    ['taxa 0', () => calculateDoseFromRate(preset('vasopressina_padrao'), 0)],
    ['taxa NaN', () => calculateDoseFromRate(preset('vasopressina_padrao'), NaN)],
    ['taxa acima do limite da bomba', () => calculateDoseFromRate(preset('vasopressina_padrao'), 1500)],
  ];
  invalidos.forEach(([nome, fn]) => it(`lança ClinicalInputError: ${nome}`, () => expect(fn).toThrow(ClinicalInputError)));
});

describe('Presets e registro - invariantes de dados', () => {
  it('concentração é derivada de quantidade ÷ volume (referências)', () => {
    expect(concentrationOf(STANDARD_DRUG_PRESETS.find((p) => p.id === 'nora_padrao')!).value).toBeCloseTo(16, 6);
    expect(concentrationOf(STANDARD_DRUG_PRESETS.find((p) => p.id === 'nora_concentrada')!).value).toBeCloseTo(32, 6);
    expect(concentrationOf(STANDARD_DRUG_PRESETS.find((p) => p.id === 'dobuta_padrao')!).value).toBeCloseTo(1000, 6);
    expect(concentrationOf(STANDARD_DRUG_PRESETS.find((p) => p.id === 'nipride_padrao')!).value).toBeCloseTo(200, 6);
  });
  it('vasopressina: 20 UI em 100 mL = 0,2 UI/mL (unidade UI/mL, não mcg)', () => {
    const c = concentrationOf(STANDARD_DRUG_PRESETS.find((p) => p.id === 'vasopressina_padrao')!);
    expect(c.value).toBeCloseTo(0.2, 6);
    expect(c.unit).toBe('UI/mL');
  });
  it('cada fármaco tem exatamente um preset padrão por drugId', () => {
    const ids = new Set(STANDARD_DRUG_PRESETS.map((p) => p.drugId));
    ids.forEach((id) => expect(STANDARD_DRUG_PRESETS.filter((p) => p.drugId === id && p.isDefaultForDrug)).toHaveLength(1));
  });
  it('diluições do registro coincidem com os presets', () => {
    CLINICAL_DRUGS.forEach((d) => {
      const esperado = dilutionsFor(d.id);
      expect(d.standardDilutions).toHaveLength(esperado.length);
      d.standardDilutions.forEach((dil, i) => expect(dil.concentration).toBeCloseTo(esperado[i].concentration, 9));
    });
  });
  it('faixas do registro e dos presets de mesmo fármaco concordam em unidade', () => {
    CLINICAL_DRUGS.forEach((d) => {
      const p = findDefaultPreset(d.id);
      if (p) expect(p.unit).toBe(d.dosingUnit);
    });
  });
  it('todo fármaco de alta vigilância exige dupla checagem', () => {
    CLINICAL_DRUGS.filter((d) => d.highAlert.isHighAlert).forEach((d) => expect(d.highAlert.doubleCheckRequired).toBe(true));
  });
  it('nenhum dado clínico sai marcado como VALIDADO sem revisão humana', () => {
    CLINICAL_DRUGS.forEach((d) => expect(d.validacaoClinica).toBe('PENDENTE'));
    STANDARD_DRUG_PRESETS.forEach((p) => expect(p.validacaoClinica).toBe('PENDENTE'));
  });
  it('antídoto de cianeto não está no campo de extravasamento', () => {
    const nipride = STANDARD_DRUG_PRESETS.find((p) => p.id === 'nipride_padrao')!;
    expect(nipride.extravasationAntidote).toBeUndefined();
    expect(nipride.toxicityAntidote).toContain('cianeto');
  });
});

// ---------------------------------------------------------------------------
describe('Conduta - dados e métricas', () => {
  it('paciente válido não gera pendências', () => expect(validatePatientData(paciente())).toHaveLength(0));
  it('métricas: PAM = (PAS + 2·PAD)/3', () => expect(derivePatientMetrics(paciente({ sbp: 80, dbp: 40 })).map).toBe(53));
  it('altura 0 é recusada (antes gerava IMC infinito)', () => expect(() => derivePatientMetrics(paciente({ heightCm: 0 }))).toThrow(ClinicalInputError));
  it('PAD > PAS é recusada', () => expect(validatePatientData(paciente({ sbp: 80, dbp: 90 })).join(' ')).toContain('PAD maior'));
});

describe('Conduta - cálculo de doses', () => {
  it('noradrenalina: 70 kg, dose inicial 0,1 => 26,3 mL/h e dupla checagem', () => {
    const r = generateStratifiedConduct(paciente(), 'x', 'Teste', fases());
    expect(r.status).toBe('COMPLETO');
    expect(item(r, 'nora').drugPrescription!.infusionRateMlHr).toBeCloseTo(26.3, 1);
    expect(item(r, 'nora').drugPrescription!.safetyDoubleCheck).toBe(true);
  });
  it('vasopressina: 0,03 UI/min => 9 mL/h', () => {
    const r = generateStratifiedConduct(paciente(), 'x', 'Teste', fases());
    expect(item(r, 'vaso').drugPrescription!.infusionRateMlHr).toBeCloseTo(9.0, 1);
  });
  it('a diluição exibida vem do preset, não de texto do protocolo', () => {
    const r = generateStratifiedConduct(paciente(), 'x', 'Teste', fases());
    expect(item(r, 'nora').drugPrescription!.dilution).toContain('16 mcg/mL');
  });
  it('doses de referência pendentes de validação são marcadas como tal', () => {
    const r = generateStratifiedConduct(paciente(), 'x', 'Teste', fases());
    expect(item(r, 'nora').drugPrescription!.calculatedDose).toContain('PENDENTE');
  });
  it('enoxaparina: 70 kg => 70 mg a cada 12 h', () => {
    const r = generateStratifiedConduct(paciente(), 'x', 'Teste', fases());
    expect(item(r, 'enox').drugPrescription!.calculatedDose).toContain('70 mg');
    expect(item(r, 'enox').drugPrescription!.calculatedDose).toContain('12 h');
  });
  it('enoxaparina com ClCr < 30 (limiar do registro): intervalo de 24 h e aviso de ajuste', () => {
    const r = generateStratifiedConduct(paciente({ creatinineMgDl: 4.0 }), 'x', 'Teste', fases());
    expect(item(r, 'enox').drugPrescription!.calculatedDose).toContain('24 h');
    expect(item(r, 'enox').detail).toContain('AJUSTE RENAL');
  });
  it('dose digitada no protocolo para fármaco fora do registro é DESCARTADA (ex.: "100 mg")', () => {
    const fasesAlteplase = fases();
    fasesAlteplase[0].items = [
      { id: 'alt', title: 'Alteplase', detail: 'Trombólise', priority: 'emergency',
        drugPrescription: { drugId: 'alteplase', drugName: 'Alteplase', calculatedDose: '100 mg', route: 'EV em bólus', dilution: '100 mg em 100 mL', safetyDoubleCheck: false, targetParameter: '-' } },
    ];
    const r = generateStratifiedConduct(paciente(), 'x', 'Teste', fasesAlteplase);
    expect(item(r, 'alt').drugPrescription!.calculatedDose).toContain('NÃO CALCULADO');
    expect(item(r, 'alt').drugPrescription!.calculatedDose).not.toContain('100 mg');
  });
  it('fármaco sem regime no registro NÃO sai com dose em branco', () => {
    const r = generateStratifiedConduct(paciente(), 'x', 'Teste', fases());
    expect(item(r, 'desc').drugPrescription!.calculatedDose).toContain('NÃO CALCULADO');
    expect(r.clipboardSummary).not.toMatch(/Dose: \s*\|/);
  });
});

describe('Conduta - segurança', () => {
  it('peso inválido bloqueia TODOS os cálculos e não imprime taxa', () => {
    const r = generateStratifiedConduct(paciente({ weightKg: 0 }), 'x', 'Teste', fases());
    expect(r.status).toBe('DADOS_INVALIDOS');
    expect(r.pendencias.join(' ')).toContain('Peso');
    r.phases[0].items.forEach((i) => {
      expect(i.drugPrescription!.calculatedDose).toContain('NÃO CALCULADO');
      expect(i.drugPrescription!.infusionRateMlHr).toBeUndefined();
    });
    expect(r.clipboardSummary).not.toContain('mL/h');
  });
  it('peso digitado com erro (7 kg) bloqueia em vez de calcular taxa 10x menor', () => {
    expect(generateStratifiedConduct(paciente({ weightKg: 7 }), 'x', 'Teste', fases()).status).toBe('DADOS_INVALIDOS');
  });
  it('sangramento ativo bloqueia a enoxaparina e gera alerta', () => {
    const r = generateStratifiedConduct(paciente({ activeBleeding: true }), 'x', 'Teste', fases());
    expect(item(r, 'enox').drugPrescription!.calculatedDose).toContain('NÃO CALCULADO');
    expect(r.criticalAlerts.join(' ')).toContain('SANGRAMENTO ATIVO');
  });
  it('alergias registradas geram alerta', () => {
    const r = generateStratifiedConduct(paciente({ allergies: ['Penicilina'] }), 'x', 'Teste', fases());
    expect(r.criticalAlerts.join(' ')).toContain('Penicilina');
  });
  it('diálise e gestação geram alertas; diálise não aplica ajuste renal automático', () => {
    const r = generateStratifiedConduct(paciente({ dialysis: true, pregnancy: true, creatinineMgDl: 4.0 }), 'x', 'Teste', fases());
    const a = r.criticalAlerts.join(' ');
    expect(a).toContain('DIÁLISE');
    expect(a).toContain('GESTAÇÃO');
    expect(item(r, 'enox').detail).toContain('diálise');
    expect(item(r, 'enox').drugPrescription!.calculatedDose).not.toContain('24 h');
  });
  it('Glasgow ≤ 8: alerta de via aérea sem "indicação formal" categórica', () => {
    const a = generateStratifiedConduct(paciente({ gcs: 7 }), 'x', 'Teste', fases()).criticalAlerts.join(' ');
    expect(a).toContain('VIA AÉREA');
    expect(a).toContain('causas reversíveis');
    expect(a).not.toContain('Indicação formal');
  });
  it('PAM < 65: alerta neutro quanto ao tipo de choque (não manda repor volume)', () => {
    const a = generateStratifiedConduct(paciente(), 'x', 'Teste', fases()).criticalAlerts.join(' ');
    expect(a).toContain('ALERTA HEMODINÂMICO');
    expect(a).toContain('tipo de choque');
    expect(a).not.toContain('ressuscitação volêmica');
  });
  it('mensagem de contraste não manda adiar exame essencial', () => {
    const a = generateStratifiedConduct(paciente({ creatinineMgDl: 4.0 }), 'x', 'Teste', fases()).criticalAlerts.join(' ');
    expect(a).toContain('sem adiar exame essencial');
  });
});
