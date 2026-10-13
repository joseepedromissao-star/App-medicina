/**
 * AuraMed - Módulo Pediátrico (fase inicial: PARADA CARDIORRESPIRATÓRIA PEDIÁTRICA)
 *
 * Este módulo é SEPARADO dos motores de adulto (que recusam idade < 18 anos e peso < 30 kg de propósito).
 * Princípios:
 *  - Idade em MESES e peso com ORIGEM obrigatória (medido ou estimado); peso estimado gera aviso.
 *  - Faixas de plausibilidade por faixa etária (detectam erro de digitação, ex.: 7 kg em vez de 70 kg).
 *  - Dose por kg com TETO (dose máxima), sempre mostrando quando o teto foi aplicado.
 *  - Entrada inválida => ClinicalInputError. Nada é corrigido em silêncio.
 *  - Só entram fármacos/energias com fonte conferida. Atropina, adenosina, cardioversão, bicarbonato, cálcio etc.
 *    NÃO estão neste módulo e devem sair como "NÃO CALCULADO" até serem cadastrados com fonte.
 *
 * Fonte principal: algoritmo de parada cardíaca pediátrica do PALS 2025 (AHA/AAP 2025) e o cartão do PALS 2025.
 * Todos os resultados saem com validacaoClinica 'PENDENTE' até revisão por médico.
 */

import type { CalculationExplanation } from '../types/clinical';
import { ClinicalInputError, checkRange, throwIfErrors, type Range } from './validation';

export type WeightOrigin = 'medido' | 'estimado';

export interface PediatricInput {
  ageMonths: number; // 0 a < 216 (18 anos)
  weightKg: number;
  weightOrigin: WeightOrigin;
}

export interface AgeBand {
  id: string;
  label: string;
  minMonths: number; // inclusive
  maxMonths: number; // exclusivo
  weightKg: Range; // faixa de PLAUSIBILIDADE (não é referência de normalidade)
}

/** Faixas de plausibilidade para detectar erro de digitação. Ajustáveis pelo revisor médico. */
export const PEDIATRIC_AGE_BANDS: AgeBand[] = [
  { id: 'rn', label: 'Recém-nascido (até 1 mês)', minMonths: 0, maxMonths: 1, weightKg: [1.5, 6] },
  { id: 'lactente', label: 'Lactente (1 a 12 meses)', minMonths: 1, maxMonths: 12, weightKg: [2.5, 14] },
  { id: 'crianca_pequena', label: 'Criança pequena (1 a 5 anos)', minMonths: 12, maxMonths: 60, weightKg: [6, 30] },
  { id: 'crianca', label: 'Criança (5 a 12 anos)', minMonths: 60, maxMonths: 144, weightKg: [12, 80] },
  { id: 'adolescente', label: 'Adolescente (12 a 17 anos)', minMonths: 144, maxMonths: 216, weightKg: [25, 200] },
];

export const PEDIATRIC_FONTE_ALGORITMO = 'Algoritmo de parada cardíaca pediátrica, PALS 2025 (AHA/AAP)';
export const PEDIATRIC_FONTE_CARTAO = 'Cartão de bolso do PALS 2025 (parada cardíaca pediátrica)';

export interface PediatricValidation {
  band: AgeBand;
  warnings: string[];
}

/** Valida a entrada pediátrica. Lança ClinicalInputError se algo for inválido. */
export function validatePediatricInput(input: PediatricInput): PediatricValidation {
  const errors: string[] = [];
  const { ageMonths, weightKg, weightOrigin } = input;

  if (typeof ageMonths !== 'number' || !Number.isFinite(ageMonths) || ageMonths < 0) {
    errors.push(`Idade inválida: ${String(ageMonths)} (informe a idade em meses, a partir de 0).`);
  } else if (ageMonths >= 216) {
    errors.push(`Idade de ${Math.floor(ageMonths / 12)} anos: este módulo é só para menores de 18 anos; use o módulo adulto.`);
  }
  if (weightOrigin !== 'medido' && weightOrigin !== 'estimado') {
    errors.push(`Origem do peso obrigatória: informe "medido" ou "estimado" (recebido: ${String(weightOrigin)}).`);
  }
  throwIfErrors(errors); // idade e origem precisam estar corretas para escolher a faixa

  const band = PEDIATRIC_AGE_BANDS.find((b) => ageMonths >= b.minMonths && ageMonths < b.maxMonths) as AgeBand;
  checkRange(errors, `Peso (${band.label})`, weightKg, band.weightKg, 'kg');
  throwIfErrors(errors);

  const warnings: string[] = [];
  if (weightOrigin === 'estimado') {
    warnings.push('PESO ESTIMADO: as doses por kg dependem dele. Substitua pelo peso medido assim que possível.');
  }
  if (band.id === 'adolescente') {
    warnings.push('ADOLESCENTE: a AHA orienta seguir a conduta de adulto em adolescentes com sinais de puberdade. Avalie a maturação e, se pós-puberal, use o protocolo adulto.');
  }
  return { band, warnings };
}

// ---------------------------------------------------------------------------
// Parada cardiorrespiratória pediátrica
// ---------------------------------------------------------------------------

export interface PedDoseItem {
  id: string;
  nome: string;
  doseMg?: number; // dose absoluta em mg
  doseTexto: string; // texto pronto para a tela
  volumeMl?: number; // volume na concentração informada
  concentracao?: string;
  tetoAplicado: boolean;
  observacao: string;
  fonte: string;
  statusRecomendacao: 'CONFIRMADA' | 'VERIFICAR';
  validacaoClinica: 'PENDENTE';
  explanation: CalculationExplanation;
}

export interface PedDefibrillation {
  firstJ: number; // 2 J/kg
  secondJ: number; // 4 J/kg
  subsequentMinJ: number; // ≥ 4 J/kg
  subsequentMaxJ: number; // 10 J/kg
  nota: string;
  fonte: string;
  statusRecomendacao: 'CONFIRMADA';
  validacaoClinica: 'PENDENTE';
}

export interface PediatricArrestResult {
  band: AgeBand;
  weightKg: number;
  weightOrigin: WeightOrigin;
  warnings: string[];
  defibrillation: PedDefibrillation;
  items: PedDoseItem[];
}

const r1 = (n: number) => Math.round(n * 10) / 10;
const r2 = (n: number) => Math.round(n * 100) / 100;
const r3 = (n: number) => Math.round(n * 1000) / 1000;

function explain(
  engineName: string,
  equation: string,
  vars: Record<string, string>,
  steps: { label: string; formula: string; valuesSubstituted: string; result: string }[],
  value: number,
  unit: string,
  interpretation: string,
  fonte: string,
  notes: string[]
): CalculationExplanation {
  return {
    engineName,
    clinicalPurpose: 'Dose por peso na parada cardiorrespiratória pediátrica',
    reference: fonte,
    primaryEquation: equation,
    variablesUsed: vars,
    steps,
    finalResult: { value, unit, interpretation, severity: 'normal' },
    clinicalNotes: notes,
  };
}

/** Doses e energias da parada cardiorrespiratória pediátrica, por peso. */
export function calculatePediatricArrest(input: PediatricInput): PediatricArrestResult {
  const { band, warnings } = validatePediatricInput(input);
  const w = input.weightKg;
  const wTxt = `${w} kg (${input.weightOrigin})`;

  // --- Desfibrilação: 2 J/kg, depois 4 J/kg, depois ≥ 4 J/kg até 10 J/kg ou dose de adulto ---
  const defibrillation: PedDefibrillation = {
    firstJ: r1(2 * w),
    secondJ: r1(4 * w),
    subsequentMinJ: r1(4 * w),
    subsequentMaxJ: r1(10 * w),
    nota: 'Choques seguintes: de 4 J/kg até no máximo 10 J/kg, sem ultrapassar a dose de adulto do desfibrilador (vale o menor valor). Ajuste ao passo de energia do equipamento.',
    fonte: PEDIATRIC_FONTE_ALGORITMO,
    statusRecomendacao: 'CONFIRMADA',
    validacaoClinica: 'PENDENTE',
  };

  const items: PedDoseItem[] = [];

  // --- Epinefrina IV/IO: 0,01 mg/kg (0,1 mL/kg da solução de 0,1 mg/mL), máx. 1 mg, a cada 3–5 min ---
  {
    const raw = 0.01 * w;
    const dose = Math.min(raw, 1);
    const teto = raw > 1;
    const vol = r2(dose / 0.1);
    items.push({
      id: 'ped-epinefrina',
      nome: 'Epinefrina IV/IO',
      doseMg: r3(dose),
      doseTexto: `${r3(dose)} mg (${vol} mL da solução de 0,1 mg/mL) a cada 3 a 5 min`,
      volumeMl: vol,
      concentracao: '0,1 mg/mL',
      tetoAplicado: teto,
      observacao: teto ? 'Dose máxima de 1 mg aplicada (0,01 mg/kg ultrapassaria o teto).' : 'Dose máxima por administração: 1 mg.',
      fonte: PEDIATRIC_FONTE_ALGORITMO,
      statusRecomendacao: 'CONFIRMADA',
      validacaoClinica: 'PENDENTE',
      explanation: explain(
        'Epinefrina na PCR pediátrica',
        'Dose (mg) = mín(0,01 mg/kg × peso, 1 mg); volume (mL) = dose ÷ 0,1 mg/mL',
        { Peso: wTxt, Concentração: '0,1 mg/mL (1:10.000)' },
        [
          { label: '1. Dose por peso', formula: '0,01 × peso', valuesSubstituted: `0,01 × ${w}`, result: `${r3(raw)} mg` },
          { label: '2. Teto', formula: 'mín(dose, 1 mg)', valuesSubstituted: `mín(${r3(raw)}, 1)`, result: `${r3(dose)} mg` },
          { label: '3. Volume', formula: 'dose ÷ 0,1 mg/mL', valuesSubstituted: `${r3(dose)} ÷ 0,1`, result: `${vol} mL` },
        ],
        r3(dose), 'mg', `${r3(dose)} mg = ${vol} mL a 0,1 mg/mL`, PEDIATRIC_FONTE_ALGORITMO,
        ['Confira a concentração do frasco: a solução de 0,1 mg/mL é a de 1:10.000 (não confundir com a de 1 mg/mL).']
      ),
    });
  }

  // --- Amiodarona IV/IO: 5 mg/kg em bolus (máx. 300 mg); repetir até 3 doses, com máx. de 150 mg nas seguintes ---
  {
    const raw = 5 * w;
    const d1 = Math.min(raw, 300);
    const dRep = Math.min(raw, 150);
    items.push({
      id: 'ped-amiodarona-1',
      nome: 'Amiodarona IV/IO (1ª dose, FV/TV sem pulso refratária)',
      doseMg: r1(d1),
      doseTexto: `${r1(d1)} mg em bolus`,
      tetoAplicado: raw > 300,
      observacao: raw > 300 ? 'Dose máxima de 300 mg aplicada.' : 'Dose máxima da 1ª dose: 300 mg.',
      fonte: PEDIATRIC_FONTE_ALGORITMO,
      statusRecomendacao: 'CONFIRMADA',
      validacaoClinica: 'PENDENTE',
      explanation: explain(
        'Amiodarona na PCR pediátrica (1ª dose)',
        'Dose (mg) = mín(5 mg/kg × peso, 300 mg)',
        { Peso: wTxt },
        [
          { label: '1. Dose por peso', formula: '5 × peso', valuesSubstituted: `5 × ${w}`, result: `${r1(raw)} mg` },
          { label: '2. Teto', formula: 'mín(dose, 300 mg)', valuesSubstituted: `mín(${r1(raw)}, 300)`, result: `${r1(d1)} mg` },
        ],
        r1(d1), 'mg', `${r1(d1)} mg em bolus`, PEDIATRIC_FONTE_ALGORITMO,
        ['Reservada a FV/TV sem pulso que persiste após choques.']
      ),
    });
    items.push({
      id: 'ped-amiodarona-repeticao',
      nome: 'Amiodarona IV/IO (2ª e 3ª doses, se refratária)',
      doseMg: r1(dRep),
      doseTexto: `${r1(dRep)} mg em bolus (até 3 doses no total)`,
      tetoAplicado: raw > 150,
      observacao: raw > 150 ? 'Dose máxima de 150 mg aplicada nas doses seguintes.' : 'Dose máxima das doses seguintes: 150 mg.',
      fonte: PEDIATRIC_FONTE_ALGORITMO,
      statusRecomendacao: 'CONFIRMADA',
      validacaoClinica: 'PENDENTE',
      explanation: explain(
        'Amiodarona na PCR pediátrica (repetição)',
        'Dose (mg) = mín(5 mg/kg × peso, 150 mg)',
        { Peso: wTxt },
        [
          { label: '1. Dose por peso', formula: '5 × peso', valuesSubstituted: `5 × ${w}`, result: `${r1(raw)} mg` },
          { label: '2. Teto das doses seguintes', formula: 'mín(dose, 150 mg)', valuesSubstituted: `mín(${r1(raw)}, 150)`, result: `${r1(dRep)} mg` },
        ],
        r1(dRep), 'mg', `${r1(dRep)} mg por dose repetida`, PEDIATRIC_FONTE_ALGORITMO,
        ['O algoritmo permite repetir até um total de 3 doses.']
      ),
    });
  }

  // --- Lidocaína (alternativa à amiodarona): 1 mg/kg de ataque; repetição e manutenção conforme o cartão ---
  {
    const load = 1 * w;
    items.push({
      id: 'ped-lidocaina-ataque',
      nome: 'Lidocaína IV/IO (ataque, alternativa à amiodarona)',
      doseMg: r2(load),
      doseTexto: `${r2(load)} mg em dose de ataque`,
      tetoAplicado: false,
      observacao: 'Alternativa à amiodarona na FV/TV sem pulso refratária.',
      fonte: PEDIATRIC_FONTE_ALGORITMO,
      statusRecomendacao: 'CONFIRMADA',
      validacaoClinica: 'PENDENTE',
      explanation: explain(
        'Lidocaína na PCR pediátrica (ataque)',
        'Dose (mg) = 1 mg/kg × peso',
        { Peso: wTxt },
        [{ label: '1. Dose por peso', formula: '1 × peso', valuesSubstituted: `1 × ${w}`, result: `${r2(load)} mg` }],
        r2(load), 'mg', `${r2(load)} mg`, PEDIATRIC_FONTE_ALGORITMO, []
      ),
    });
    items.push({
      id: 'ped-lidocaina-repeticao-manutencao',
      nome: 'Lidocaína IV/IO (repetição e manutenção)',
      doseMg: r2(0.5 * w),
      doseTexto: `repetição ${r2(0.5 * w)} mg (0,5 mg/kg); manutenção ${r1(20 * w)} a ${r1(50 * w)} mcg/min (20 a 50 mcg/kg/min)`,
      tetoAplicado: false,
      observacao: 'Valores de repetição e manutenção vêm do cartão de bolso do PALS 2025; conferir no texto da guideline antes de usar.',
      fonte: PEDIATRIC_FONTE_CARTAO,
      statusRecomendacao: 'VERIFICAR',
      validacaoClinica: 'PENDENTE',
      explanation: explain(
        'Lidocaína na PCR pediátrica (repetição/manutenção)',
        'Repetição (mg) = 0,5 mg/kg × peso; manutenção (mcg/min) = 20 a 50 mcg/kg/min × peso',
        { Peso: wTxt },
        [
          { label: '1. Repetição', formula: '0,5 × peso', valuesSubstituted: `0,5 × ${w}`, result: `${r2(0.5 * w)} mg` },
          { label: '2. Manutenção', formula: '(20 a 50) × peso', valuesSubstituted: `(20 a 50) × ${w}`, result: `${r1(20 * w)} a ${r1(50 * w)} mcg/min` },
        ],
        r2(0.5 * w), 'mg', `repetição ${r2(0.5 * w)} mg`, PEDIATRIC_FONTE_CARTAO, ['Conversão para mL/h exige a concentração da diluição, ainda não cadastrada.']
      ),
    });
  }

  return { band, weightKg: w, weightOrigin: input.weightOrigin, warnings, defibrillation, items };
}

/** Texto de escopo exibido pelo app quando a calculadora pediátrica é aberta. */
export const PEDIATRIC_SCOPE_NOTE =
  'Módulo pediátrico em fase inicial: só parada cardiorrespiratória (epinefrina, amiodarona, lidocaína e energia de choque). Atropina, adenosina, cardioversão, bicarbonato, cálcio, fluidos, sedação e demais protocolos pediátricos NÃO estão cadastrados.';

export { ClinicalInputError };
