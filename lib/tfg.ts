/**
 * AuraMed - Motor de Cálculo de Taxa de Filtração Glomerular (TFG)
 * 1. CKD-EPI 2021 (sem variável racial)
 * 2. Cockcroft-Gault (base de muitas bulas para ajuste de dose)
 *
 * Todas as funções validam as entradas e lançam ClinicalInputError se algo estiver
 * fora da faixa de plausibilidade (nada é "corrigido" em silêncio).
 */

import type { CalculationExplanation, SeverityLevel } from '../types/clinical';
import { LIMITS, checkRange, checkSex, throwIfErrors } from './validation';

export type WeightPolicy = 'auto' | 'real' | 'ideal' | 'ajustado';

/**
 * Política de peso padrão do Cockcroft-Gault, definida pelo revisor: PESO AJUSTADO.
 * ABW = IBW(Devine) + 0,4 × (peso real − IBW). Se o peso real for menor ou igual ao ideal, usa-se o peso real.
 * Para mudar a política do app inteiro, altere somente esta constante. [Registrar a fonte/protocolo institucional.]
 */
export const DEFAULT_CG_WEIGHT_POLICY: WeightPolicy = 'ajustado';

export interface TfgResult {
  ckdEpi2021: number; // mL/min/1.73m²
  cockcroftGault: number; // mL/min
  idealWeightKg: number;
  adjustedWeightKg: number;
  weightUsedForCg: number;
  weightTypeUsed: 'real' | 'ideal' | 'ajustado';
  kdigoStage: string;
  severity: SeverityLevel;
  clinicalInterpretation: string;
  explanationCkdEpi: CalculationExplanation;
  explanationCockcroftGault: CalculationExplanation;
}

const WARNING_CREATININE =
  'Estimativa válida apenas com creatinina estável. Em lesão renal aguda, diálise, extremos de peso/massa muscular ou gestação, trate o valor como aproximação e use julgamento clínico.';

/** Peso ideal pela fórmula de Devine (1974). Altura deve estar entre 120 e 230 cm. */
export function calculateDevineIdealWeight(heightCm: number, sex: 'M' | 'F'): number {
  const errors: string[] = [];
  checkRange(errors, 'Altura', heightCm, LIMITS.heightCm, 'cm');
  checkSex(errors, sex);
  throwIfErrors(errors);

  const inchesOver5Feet = Math.max(0, heightCm / 2.54 - 60);
  const base = sex === 'M' ? 50 : 45.5;
  return Number((base + 2.3 * inchesOver5Feet).toFixed(1));
}

/** Peso ajustado: ABW = IBW + 0,4 × (real − IBW). Se real ≤ ideal, devolve o real. */
export function calculateAdjustedWeight(actualWeightKg: number, idealWeightKg: number): number {
  const errors: string[] = [];
  checkRange(errors, 'Peso', actualWeightKg, LIMITS.weightKg, 'kg');
  checkRange(errors, 'Peso ideal', idealWeightKg, LIMITS.weightKg, 'kg');
  throwIfErrors(errors);

  if (actualWeightKg <= idealWeightKg) return actualWeightKg;
  return Number((idealWeightKg + 0.4 * (actualWeightKg - idealWeightKg)).toFixed(1));
}

/** Faixas KDIGO por valor de TFG (usadas aqui apenas como faixa descritiva; estadiamento de DRC exige cronicidade). */
export function classifyKdigoStage(gfr: number): { stage: string; severity: SeverityLevel; description: string } {
  if (gfr >= 90) return { stage: 'G1', severity: 'normal', description: 'Função renal normal ou elevada' };
  if (gfr >= 60) return { stage: 'G2', severity: 'low', description: 'Perda leve da função renal' };
  if (gfr >= 45) return { stage: 'G3a', severity: 'moderate', description: 'Perda leve a moderada da função renal' };
  if (gfr >= 30) return { stage: 'G3b', severity: 'moderate', description: 'Perda moderada a grave da função renal' };
  if (gfr >= 15) return { stage: 'G4', severity: 'high', description: 'Perda grave da função renal (requer ajuste rigoroso)' };
  return { stage: 'G5', severity: 'critical', description: 'Falência renal / Uremia (considerar TRS)' };
}

/**
 * CKD-EPI 2021 (Inker LA et al., N Engl J Med 2021; 385:1737-1749)
 * eGFR = 142 × min(Scr/κ,1)^α × max(Scr/κ,1)^-1,200 × 0,9938^idade × (1,012 se mulher)
 */
export function calculateCkdEpi2021(age: number, sex: 'M' | 'F', creatinineMgDl: number): {
  gfr: number;
  explanation: CalculationExplanation;
} {
  const errors: string[] = [];
  checkRange(errors, 'Idade', age, LIMITS.age, 'anos');
  checkSex(errors, sex);
  checkRange(errors, 'Creatinina', creatinineMgDl, LIMITS.creatinineMgDl, 'mg/dL');
  throwIfErrors(errors);

  const scr = creatinineMgDl;
  const isFemale = sex === 'F';
  const kappa = isFemale ? 0.7 : 0.9;
  const alpha = isFemale ? -0.241 : -0.302;
  const sexFactor = isFemale ? 1.012 : 1.0;

  const ratio = scr / kappa;
  const termMin = Math.pow(Math.min(ratio, 1.0), alpha);
  const termMax = Math.pow(Math.max(ratio, 1.0), -1.2);
  const termAge = Math.pow(0.9938, age);

  const gfr = Math.round(142 * termMin * termMax * termAge * sexFactor);
  const kdigo = classifyKdigoStage(gfr);

  const explanation: CalculationExplanation = {
    engineName: 'CKD-EPI 2021 (sem variável racial)',
    clinicalPurpose: 'Estimativa da TFG para diagnóstico e estadiamento (indexada a 1,73 m²)',
    reference: 'CKD-EPI 2021 (creatinina), recomendada por KDIGO/NKF/ASN.',
    primaryEquation: 'eGFR = 142 × min(Scr/κ, 1)^α × max(Scr/κ, 1)^-1,200 × 0,9938^Idade × [1,012 se feminino]',
    variablesUsed: {
      Idade: `${age} anos`,
      Sexo: isFemale ? 'Feminino (κ = 0,7; α = −0,241; fator = 1,012)' : 'Masculino (κ = 0,9; α = −0,302; fator = 1,000)',
      'Creatinina sérica': `${scr.toFixed(2)} mg/dL`,
    },
    steps: [
      { label: '1. Razão Scr/κ', formula: 'Scr / κ', valuesSubstituted: `${scr.toFixed(2)} / ${kappa}`, result: ratio.toFixed(4) },
      { label: '2. Termo min', formula: 'min(Scr/κ, 1)^α', valuesSubstituted: `min(${ratio.toFixed(3)}, 1)^(${alpha})`, result: termMin.toFixed(4) },
      { label: '3. Termo max', formula: 'max(Scr/κ, 1)^-1,200', valuesSubstituted: `max(${ratio.toFixed(3)}, 1)^(-1,200)`, result: termMax.toFixed(4) },
      { label: '4. Fator idade e sexo', formula: '0,9938^Idade × FatorSexo', valuesSubstituted: `0,9938^${age} × ${sexFactor}`, result: (termAge * sexFactor).toFixed(4) },
      {
        label: '5. Resultado',
        formula: '142 × TermoMin × TermoMax × FatorIdadeSexo',
        valuesSubstituted: `142 × ${termMin.toFixed(4)} × ${termMax.toFixed(4)} × ${(termAge * sexFactor).toFixed(4)}`,
        result: `${gfr} mL/min/1,73m²`,
      },
    ],
    finalResult: { value: gfr, unit: 'mL/min/1,73m²', interpretation: `${kdigo.stage}: ${kdigo.description}`, severity: kdigo.severity },
    clinicalNotes: ['Equação sem termo racial, recomendada por KDIGO e NKF.'],
    warningAlert: WARNING_CREATININE,
  };

  return { gfr, explanation };
}

/**
 * Cockcroft-Gault (1976): ClCr = [(140 − idade) × peso] / (72 × Scr) × (0,85 se mulher)
 *
 * Convenção de peso: padrão = DEFAULT_CG_WEIGHT_POLICY ('ajustado', decisão do revisor). A política 'auto'
 * (real se abaixo do ideal; ajustado se > 130% do ideal; real nos demais casos) continua disponível, assim como
 * 'real' e 'ideal'. A política usada é sempre exibida no resultado.
 */
export function calculateCockcroftGault(
  age: number,
  sex: 'M' | 'F',
  actualWeightKg: number,
  heightCm: number,
  creatinineMgDl: number,
  weightPolicy: WeightPolicy = DEFAULT_CG_WEIGHT_POLICY
): {
  clcr: number;
  weightUsed: number;
  weightType: 'real' | 'ideal' | 'ajustado';
  explanation: CalculationExplanation;
} {
  const errors: string[] = [];
  checkRange(errors, 'Idade', age, LIMITS.age, 'anos');
  checkSex(errors, sex);
  checkRange(errors, 'Peso', actualWeightKg, LIMITS.weightKg, 'kg');
  checkRange(errors, 'Altura', heightCm, LIMITS.heightCm, 'cm');
  checkRange(errors, 'Creatinina', creatinineMgDl, LIMITS.creatinineMgDl, 'mg/dL');
  throwIfErrors(errors);

  const scr = creatinineMgDl;
  const isFemale = sex === 'F';
  const sexFactor = isFemale ? 0.85 : 1.0;

  const idealWeight = calculateDevineIdealWeight(heightCm, sex);
  const adjustedWeight = calculateAdjustedWeight(actualWeightKg, idealWeight);

  let weightUsed: number;
  let weightType: 'real' | 'ideal' | 'ajustado';

  if (weightPolicy === 'real') {
    weightUsed = actualWeightKg; weightType = 'real';
  } else if (weightPolicy === 'ideal') {
    weightUsed = idealWeight; weightType = 'ideal';
  } else if (weightPolicy === 'ajustado') {
    weightUsed = adjustedWeight;
    weightType = adjustedWeight === actualWeightKg ? 'real' : 'ajustado'; // se ABW = peso real, o valor usado é o real
  } else if (actualWeightKg < idealWeight) {
    weightUsed = actualWeightKg; weightType = 'real';
  } else if (actualWeightKg > idealWeight * 1.3) {
    weightUsed = adjustedWeight; weightType = 'ajustado';
  } else {
    weightUsed = actualWeightKg; weightType = 'real';
  }

  const numerator = (140 - age) * weightUsed;
  const denominator = 72 * scr;
  const clcr = Math.round((numerator / denominator) * sexFactor);
  const band = classifyKdigoStage(clcr);

  const explanation: CalculationExplanation = {
    engineName: 'Cockcroft-Gault',
    clinicalPurpose: 'Estimativa de clearance de creatinina (mL/min, não indexado) usada em muitas bulas para ajuste de dose',
    reference: 'Cockcroft-Gault (1976); peso ideal de Devine; peso ajustado = IBW + 0,4 × (real − IBW).',
    primaryEquation: 'ClCr (mL/min) = [(140 − Idade) × Peso] / [72 × Scr] × [0,85 se feminino]',
    variablesUsed: {
      Idade: `${age} anos`,
      Sexo: isFemale ? 'Feminino (fator 0,85)' : 'Masculino (fator 1,00)',
      'Peso real': `${actualWeightKg} kg`,
      Altura: `${heightCm} cm`,
      'Peso ideal (Devine)': `${idealWeight} kg`,
      'Peso ajustado': `${adjustedWeight} kg`,
      'Política de peso':
        weightPolicy === 'auto'
          ? 'automática (convenção a validar)'
          : weightPolicy === DEFAULT_CG_WEIGHT_POLICY
          ? `${weightPolicy} (padrão definido pelo revisor)`
          : `forçada: ${weightPolicy}`,
      'Peso utilizado': `${weightUsed} kg (${weightType})`,
      'Creatinina sérica': `${scr.toFixed(2)} mg/dL`,
    },
    steps: [
      { label: '1. Diferença de idade', formula: '140 − Idade', valuesSubstituted: `140 − ${age}`, result: `${140 - age}` },
      { label: '2. Numerador', formula: '(140 − Idade) × PesoUtilizado', valuesSubstituted: `${140 - age} × ${weightUsed}`, result: numerator.toFixed(1) },
      { label: '3. Denominador', formula: '72 × Scr', valuesSubstituted: `72 × ${scr.toFixed(2)}`, result: denominator.toFixed(2) },
      {
        label: '4. Fator de sexo',
        formula: '(Numerador / Denominador) × FatorSexo',
        valuesSubstituted: `(${numerator.toFixed(1)} / ${denominator.toFixed(2)}) × ${sexFactor}`,
        result: `${clcr} mL/min`,
      },
    ],
    finalResult: {
      value: clcr,
      unit: 'mL/min',
      interpretation: `Clearance estimado de ${clcr} mL/min (faixa de função renal para dose: ${band.stage})`,
      severity: band.severity,
    },
    clinicalNotes: [
      'Confirme no registro de cada fármaco qual estimativa (Cockcroft-Gault ou TFG indexada) e qual peso a bula/guideline exige.',
      ...(weightPolicy === 'ajustado'
        ? ['Política do serviço: peso ajustado = ideal + 0,4 × (real − ideal); se o peso real for menor ou igual ao ideal, usa-se o real.']
        : []),
    ],
    warningAlert: WARNING_CREATININE,
  };

  return { clcr, weightUsed, weightType, explanation };
}

/** TFG completa (CKD-EPI + Cockcroft-Gault). Valida tudo uma única vez. */
export function calculateFullTfg(
  age: number,
  sex: 'M' | 'F',
  weightKg: number,
  heightCm: number,
  creatinineMgDl: number,
  weightPolicy: WeightPolicy = DEFAULT_CG_WEIGHT_POLICY
): TfgResult {
  const ckd = calculateCkdEpi2021(age, sex, creatinineMgDl);
  const cg = calculateCockcroftGault(age, sex, weightKg, heightCm, creatinineMgDl, weightPolicy);
  const idealWeight = calculateDevineIdealWeight(heightCm, sex);
  const adjustedWeight = calculateAdjustedWeight(weightKg, idealWeight);
  const kdigo = classifyKdigoStage(ckd.gfr);

  return {
    ckdEpi2021: ckd.gfr,
    cockcroftGault: cg.clcr,
    idealWeightKg: idealWeight,
    adjustedWeightKg: adjustedWeight,
    weightUsedForCg: cg.weightUsed,
    weightTypeUsed: cg.weightType,
    kdigoStage: kdigo.stage,
    severity: kdigo.severity,
    clinicalInterpretation: `${kdigo.stage} (${kdigo.description})`,
    explanationCkdEpi: ckd.explanation,
    explanationCockcroftGault: cg.explanation,
  };
}
