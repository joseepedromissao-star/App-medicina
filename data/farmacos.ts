/**
 * AuraMed - Registro de Fármacos de Emergência e UTI
 * Classificação ISMP Brasil (medicamentos potencialmente perigosos / alta vigilância)
 *
 * As diluições NÃO são redigitadas aqui: vêm dos presets de lib/infusion.ts (fonte única de verdade),
 * então concentração, massa e volume nunca divergem entre os arquivos.
 * Todos os registros estão com validacaoClinica 'PENDENTE' até revisão médica/farmacêutica.
 */

import type { DrugDilution, Farmaco } from '../types/clinical';
import { STANDARD_DRUG_PRESETS, concentrationOf } from '../lib/infusion';

export function dilutionsFor(drugId: string): DrugDilution[] {
  return STANDARD_DRUG_PRESETS.filter((p) => p.drugId === drugId).map((p) => {
    const c = concentrationOf(p);
    return {
      presetName: p.name,
      amount: p.amount,
      amountUnit: p.amountUnit,
      diluentVolumeMl: p.diluentVolumeMl,
      diluentType: p.diluentType,
      concentration: c.value,
      concentrationUnit: c.unit,
      isConcentratedLine: !p.isDefaultForDrug,
    };
  });
}

const FONTE_PENDENTE = 'Registro da Fase 0 — fonte (guideline/bula) a ser definida e conferida pelo revisor.';

export const CLINICAL_DRUGS: Farmaco[] = [
  {
    id: 'noradrenalina',
    name: 'Noradrenalina (Hemitartarato)',
    brandNames: [], // preencher com nomes comerciais brasileiros conferidos (ANVISA)
    drugClass: 'Vasopressor de 1ª linha (alfa-1 potente, discreto beta-1)',
    indication: 'Choque séptico, choque vasodilatador, choque cardiogênico com hipotensão grave',
    dosingUnit: 'mcg/kg/min',
    requiresWeight: true,
    minDose: 0.05,
    maxDose: 1.5,
    usualDoseStart: 0.1,
    doseTitrationStep: 'Titular em passos pequenos conforme resposta da PAM [passo/intervalo a definir pelo revisor]',
    standardDilutions: dilutionsFor('noradrenalina'),
    fonte: FONTE_PENDENTE,
    validacaoClinica: 'PENDENTE',
    highAlert: {
      isHighAlert: true,
      ismpClass: 'Vasopressores e inotrópicos injetáveis',
      doubleCheckRequired: true,
      extravasationRisk: true,
      antidoteOrReversal: 'Fentolamina infiltrada na área isquêmica em extravasamento [dose/diluição e janela a confirmar na bula/protocolo].',
      warningNotes: [
        'Exige bomba de infusão contínua com dupla checagem de dose/peso.',
        'Preferir acesso venoso central; acesso periférico transitório apenas conforme protocolo institucional.',
        'Não infundir na mesma linha de soluções alcalinas (ex.: bicarbonato).',
      ],
    },
    hemodynamicGoal: 'PAM-alvo conforme Surviving Sepsis Campaign 2026 (65 mmHg, ±5; sugestão de 60–65 mmHg em ≥ 65 anos).',
  },
  {
    id: 'dobutamina',
    name: 'Dobutamina (Cloridrato)',
    brandNames: [],
    drugClass: 'Inotrópico beta-1 seletivo com discreto beta-2',
    indication: 'Choque cardiogênico, disfunção miocárdica pós-PCR, choque séptico com baixo débito persistente',
    dosingUnit: 'mcg/kg/min',
    requiresWeight: true,
    minDose: 2.5,
    maxDose: 20.0,
    usualDoseStart: 2.5,
    doseTitrationStep: 'Titular conforme perfusão e arritmias [passo/intervalo a definir pelo revisor]',
    standardDilutions: dilutionsFor('dobutamina'),
    fonte: FONTE_PENDENTE,
    validacaoClinica: 'PENDENTE',
    highAlert: {
      isHighAlert: true,
      ismpClass: 'Agonistas adrenérgicos injetáveis',
      doubleCheckRequired: true,
      extravasationRisk: false,
      warningNotes: [
        'Pode precipitar taquiarritmias atriais/ventriculares e isquemia miocárdica em coronariopatas.',
        'Em doses baixas pode causar hipotensão inicial por vasodilatação beta-2.',
      ],
    },
    hemodynamicGoal: 'Melhora da perfusão tecidual (lactato, ScvO2, enchimento capilar).',
  },
  {
    id: 'vasopressina',
    name: 'Vasopressina (Argipressina)',
    brandNames: [],
    drugClass: 'Vasopressor não adrenérgico (receptor V1a)',
    indication: 'Choque séptico: adjuvante para poupar noradrenalina [critério de início conforme SSC 2026 — confirmar]',
    dosingUnit: 'UI/min',
    requiresWeight: false,
    minDose: 0.01,
    maxDose: 0.04,
    usualDoseStart: 0.03,
    doseTitrationStep: 'Dose fixa; não titular como as catecolaminas [confirmar regime na guideline]',
    standardDilutions: dilutionsFor('vasopressina'),
    fonte: FONTE_PENDENTE,
    validacaoClinica: 'PENDENTE',
    highAlert: {
      isHighAlert: true,
      ismpClass: 'Vasopressores injetáveis',
      doubleCheckRequired: true,
      extravasationRisk: true,
      warningNotes: [
        'Doses altas associam-se a isquemia mesentérica, coronariana e de extremidades.',
        'Dose em UI/min (não em mcg): conferir a unidade na bomba e no rótulo.',
      ],
    },
    hemodynamicGoal: 'Redução da dose de noradrenalina mantendo a PAM-alvo.',
  },
  {
    id: 'enoxaparina',
    name: 'Enoxaparina Sódica',
    brandNames: ['Clexane'],
    drugClass: 'Heparina de baixo peso molecular (HBPM)',
    indication: 'SCA sem supra de ST, TEP/TVP agudo, profilaxia de TEV [regime por indicação a confirmar]',
    dosingUnit: 'mg/kg',
    requiresWeight: true,
    minDose: 1.0,
    maxDose: 1.0,
    usualDoseStart: 1.0,
    intervalHours: 12,
    standardDilutions: [],
    fonte: FONTE_PENDENTE,
    validacaoClinica: 'PENDENTE',
    contraindicacoesAbsolutas: ['sangramento_ativo'],
    highAlert: {
      isHighAlert: true,
      ismpClass: 'Anticoagulantes injetáveis',
      doubleCheckRequired: true,
      extravasationRisk: false,
      antidoteOrReversal: 'Sulfato de protamina (reversão parcial; relação mg:mg depende do tempo desde a última dose — conferir na bula).',
      warningNotes: [
        'RISCO DE SANGRAMENTO. Contraindicada em sangramento ativo; avaliar plaquetopenia, punção espinhal recente e história de HIT.',
        'Ajuste renal: com ClCr (Cockcroft-Gault) abaixo do limiar, reduzir frequência ou preferir HNF [limiar a confirmar pelo protocolo institucional].',
      ],
    },
    renalAdjustment: {
      thresholdClcrMlMin: 30,
      adjustedIntervalHours: 24,
      recommendation: 'ClCr < 30 mL/min: dose terapêutica de 1 mg/kg a cada 24 h (em vez de 12 h) ou preferir HNF em BIC com controle de TTPa [confirmar].',
    },
  },
];

