/**
 * AuraMed - Motor de Doses e Infusões Contínuas
 * Conversões: mcg/kg/min, mcg/min, UI/min, mg/h ↔ mL/h.
 *
 * Regras de segurança deste módulo:
 *  - Entrada inválida (zero, negativa, NaN, fora da faixa) => ClinicalInputError. Nada é "corrigido" em silêncio.
 *  - A concentração é SEMPRE derivada de (quantidade ÷ volume final); não existe concentração digitada à parte
 *    que possa divergir da bolsa (erro que existia na vasopressina).
 *  - Dose acima da faixa usual => resultado com severidade 'critical' e aviso explícito.
 *  - Taxa acima do limite de bomba (999 mL/h) => recusada.
 *
 * Todos os presets estão com validacaoClinica 'PENDENTE' até revisão por médico/farmacêutico.
 */

import type { CalculationExplanation, SeverityLevel } from '../types/clinical';
import {
  ClinicalInputError,
  HIGH_RATE_WARNING_ML_H,
  LIMITS,
  MAX_PUMP_RATE_ML_H,
  checkPositive,
  checkRange,
  throwIfErrors,
  type Range,
} from './validation';

export type DoseUnit = 'mcg/kg/min' | 'mcg/min' | 'mg/h' | 'UI/min' | 'UI/h';
export type AmountUnit = 'mg' | 'UI';
export type ConcentrationUnit = 'mcg/mL' | 'UI/mL';

export interface StandardInfusionPreset {
  id: string;
  drugId: string; // liga ao registro de fármacos e ao gerador de conduta
  isDefaultForDrug: boolean;
  name: string;
  drugClass: string;
  amount: number; // quantidade TOTAL de fármaco na bolsa
  amountUnit: AmountUnit;
  diluentVolumeMl: number; // VOLUME FINAL da solução (fármaco + diluente)
  diluentType: 'SG 5%' | 'SF 0.9%' | 'Pura';
  unit: DoseUnit;
  usualMinDose: number;
  usualMaxDose: number;
  startingDose: number;
  requiresWeight: boolean;
  isHighAlert: boolean;
  highAlertNotes: string;
  extravasationAntidote?: string;
  toxicityAntidote?: string;
  titrationAdvice: string;
  hemodynamicGoal: string;
  fonte: string;
  validacaoClinica: 'VALIDADO' | 'PENDENTE';
}

const FONTE_PENDENTE = 'Diluição e faixas da Fase 0 — fonte a ser definida pelo revisor (guideline/bula/protocolo institucional).';

export const STANDARD_DRUG_PRESETS: StandardInfusionPreset[] = [
  {
    id: 'nora_padrao',
    drugId: 'noradrenalina',
    isDefaultForDrug: true,
    name: 'Noradrenalina - Diluição Padrão',
    drugClass: 'Vasopressor (agonista alfa-1 > beta-1)',
    amount: 4,
    amountUnit: 'mg',
    diluentVolumeMl: 250,
    diluentType: 'SG 5%',
    unit: 'mcg/kg/min',
    usualMinDose: 0.05,
    usualMaxDose: 1.0,
    startingDose: 0.1,
    requiresWeight: true,
    isHighAlert: true,
    highAlertNotes:
      'ALTA VIGILÂNCIA (ISMP). Risco de necrose tecidual por extravasamento. Preferir acesso venoso central; acesso periférico transitório apenas conforme protocolo institucional, com inspeção frequente do sítio [parâmetros a definir pelo revisor]. Conferir se "4 mg" refere-se à base ou ao sal (hemitartarato) na apresentação da farmácia.',
    extravasationAntidote: 'Fentolamina infiltrada localmente em caso de extravasamento [dose/diluição a confirmar na bula/protocolo].',
    titrationAdvice: 'Titular em intervalos curtos conforme resposta da PAM [intervalo e passo a definir pelo revisor].',
    hemodynamicGoal:
      'PAM-alvo conforme Surviving Sepsis Campaign 2026 (65 mmHg, aceitando ±5; sugestão de 60–65 mmHg em ≥ 65 anos); lactato em queda; diurese > 0,5 mL/kg/h.',
    fonte: FONTE_PENDENTE,
    validacaoClinica: 'PENDENTE',
  },
  {
    id: 'nora_concentrada',
    drugId: 'noradrenalina',
    isDefaultForDrug: false,
    name: 'Noradrenalina - Diluição Concentrada (restrição hídrica)',
    drugClass: 'Vasopressor',
    amount: 8,
    amountUnit: 'mg',
    diluentVolumeMl: 250,
    diluentType: 'SG 5%',
    unit: 'mcg/kg/min',
    usualMinDose: 0.05,
    usualMaxDose: 1.5,
    startingDose: 0.1,
    requiresWeight: true,
    isHighAlert: true,
    highAlertNotes: 'ALTA VIGILÂNCIA. Diluição concentrada: uso exclusivo em acesso venoso central, bomba de infusão e dupla checagem.',
    extravasationAntidote: 'Fentolamina infiltrada localmente [dose/diluição a confirmar].',
    titrationAdvice: 'Titular em passos pequenos [passo a definir pelo revisor].',
    hemodynamicGoal: 'PAM-alvo conforme Surviving Sepsis Campaign 2026.',
    fonte: FONTE_PENDENTE,
    validacaoClinica: 'PENDENTE',
  },
  {
    id: 'dobuta_padrao',
    drugId: 'dobutamina',
    isDefaultForDrug: true,
    name: 'Dobutamina - Diluição Padrão',
    drugClass: 'Inotrópico (agonista beta-1 > beta-2)',
    amount: 250,
    amountUnit: 'mg',
    diluentVolumeMl: 250,
    diluentType: 'SG 5%',
    unit: 'mcg/kg/min',
    usualMinDose: 2.5,
    usualMaxDose: 20.0,
    startingDose: 2.5,
    requiresWeight: true,
    isHighAlert: true,
    highAlertNotes: 'ALTA VIGILÂNCIA. Risco de taquiarritmias e hipotensão inicial. Monitorização contínua de ECG.',
    titrationAdvice: 'Titular conforme perfusão e arritmias [intervalo e passo a definir pelo revisor].',
    hemodynamicGoal: 'Melhora da perfusão tecidual (lactato, ScvO2, enchimento capilar).',
    fonte: FONTE_PENDENTE,
    validacaoClinica: 'PENDENTE',
  },
  {
    id: 'dobuta_concentrada',
    drugId: 'dobutamina',
    isDefaultForDrug: false,
    name: 'Dobutamina - Diluição Concentrada',
    drugClass: 'Inotrópico (agonista beta-1 > beta-2)',
    amount: 500,
    amountUnit: 'mg',
    diluentVolumeMl: 250,
    diluentType: 'SG 5%',
    unit: 'mcg/kg/min',
    usualMinDose: 2.5,
    usualMaxDose: 20.0,
    startingDose: 2.5,
    requiresWeight: true,
    isHighAlert: true,
    highAlertNotes: 'ALTA VIGILÂNCIA. Diluição concentrada: dupla checagem obrigatória.',
    titrationAdvice: 'Titular conforme perfusão e arritmias.',
    hemodynamicGoal: 'Melhora da perfusão tecidual.',
    fonte: FONTE_PENDENTE,
    validacaoClinica: 'PENDENTE',
  },
  {
    id: 'vasopressina_padrao',
    drugId: 'vasopressina',
    isDefaultForDrug: true,
    name: 'Vasopressina - Diluição Padrão (20 UI em 100 mL)',
    drugClass: 'Vasopressor (agonista V1a)',
    amount: 20, // UI — corrigido: antes constava 0,4 "mg", inconsistente com 0,2 UI/mL
    amountUnit: 'UI',
    diluentVolumeMl: 100,
    diluentType: 'SF 0.9%',
    unit: 'UI/min',
    usualMinDose: 0.01,
    usualMaxDose: 0.04,
    startingDose: 0.03,
    requiresWeight: false,
    isHighAlert: true,
    highAlertNotes: 'ALTA VIGILÂNCIA. Dose em UI/min (não em mcg). Risco de isquemia mesentérica/coronariana/periférica com doses altas.',
    titrationAdvice: 'Dose fixa; não titular como as catecolaminas [confirmar regime na guideline].',
    hemodynamicGoal: 'Poupador de noradrenalina no choque séptico (adjuvante).',
    fonte: FONTE_PENDENTE,
    validacaoClinica: 'PENDENTE',
  },
  {
    id: 'nipride_padrao',
    drugId: 'nitroprussiato',
    isDefaultForDrug: true,
    name: 'Nitroprussiato de Sódio - Diluição Padrão',
    drugClass: 'Vasodilatador misto (arterial e venoso)',
    amount: 50,
    amountUnit: 'mg',
    diluentVolumeMl: 250,
    diluentType: 'SG 5%',
    unit: 'mcg/kg/min',
    usualMinDose: 0.25,
    usualMaxDose: 5.0,
    startingDose: 0.5,
    requiresWeight: true,
    isHighAlert: true,
    highAlertNotes:
      'ALTA VIGILÂNCIA. Risco de intoxicação por cianeto/tiocianato em infusões altas ou prolongadas e em insuficiência renal/hepática [limiares a confirmar]. Frasco e equipo fotoprotetores. Monitorização invasiva da PA.',
    toxicityAntidote: 'Intoxicação por cianeto: hidroxocobalamina, ou nitrito de sódio + tiossulfato de sódio [conferir protocolo].',
    titrationAdvice: 'Titular com monitorização contínua da PA [intervalo a definir pelo revisor].',
    hemodynamicGoal: 'Redução controlada da PA conforme o cenário (metas variam: dissecção, AVC, eclâmpsia, EAP).',
    fonte: FONTE_PENDENTE,
    validacaoClinica: 'PENDENTE',
  },
  {
    id: 'tridil_padrao',
    drugId: 'nitroglicerina',
    isDefaultForDrug: true,
    name: 'Nitroglicerina - Diluição Padrão',
    drugClass: 'Vasodilatador predominantemente venoso/coronariano',
    amount: 50,
    amountUnit: 'mg',
    diluentVolumeMl: 250,
    diluentType: 'SG 5%',
    unit: 'mcg/min',
    usualMinDose: 5,
    usualMaxDose: 200,
    startingDose: 10,
    requiresWeight: false,
    isHighAlert: true,
    highAlertNotes:
      'Contraindicada com inibidor de PDE-5 recente (sildenafila/tadalafila) e em infarto de VD. Usar equipo compatível (não-PVC).',
    titrationAdvice: 'Titular conforme sintomas e PA [intervalo e passo a definir pelo revisor].',
    hemodynamicGoal: 'Alívio de angina e da congestão no edema agudo de pulmão.',
    fonte: FONTE_PENDENTE,
    validacaoClinica: 'PENDENTE',
  },
];

/** Concentração derivada de quantidade ÷ volume final. Única fonte de verdade. */
export function concentrationOf(p: StandardInfusionPreset): { value: number; unit: ConcentrationUnit } {
  return p.amountUnit === 'mg'
    ? { value: (p.amount * 1000) / p.diluentVolumeMl, unit: 'mcg/mL' }
    : { value: p.amount / p.diluentVolumeMl, unit: 'UI/mL' };
}

export function findDefaultPreset(drugId: string): StandardInfusionPreset | undefined {
  return STANDARD_DRUG_PRESETS.find((p) => p.drugId === drugId && p.isDefaultForDrug);
}

export function describeDilution(p: StandardInfusionPreset): string {
  const c = concentrationOf(p);
  return `${p.amount} ${p.amountUnit} em ${p.diluentVolumeMl} mL ${p.diluentType} (${Number(c.value.toFixed(4))} ${c.unit})`;
}

// ---------------------------------------------------------------------------
// Núcleo de cálculo
// ---------------------------------------------------------------------------

export interface InfusionOptions {
  weightRangeKg?: Range; // padrão: adulto (30–300 kg)
  doseRange?: { min: number; max: number }; // faixa usual do fármaco, para severidade/aviso
}

export interface InfusionResult {
  rateMlHr: number;
  warnings: string[];
  explanation: CalculationExplanation;
}

const num = (n: number) => Number(n.toFixed(4)).toString();
const round1 = (n: number) => Math.round(n * 10) / 10;

function doseSeverity(dose: number, range?: { min: number; max: number }): { severity: SeverityLevel; warning?: string } {
  if (!range) return { severity: 'normal' };
  if (dose > range.max) return { severity: 'critical', warning: `Dose ${num(dose)} acima da faixa usual (máx. ${range.max}). Confirmar intenção e dupla checagem.` };
  if (dose >= 0.75 * range.max) return { severity: 'high', warning: `Dose ${num(dose)} próxima do limite superior da faixa usual (${range.max}).` };
  if (dose < range.min) return { severity: 'normal', warning: `Dose ${num(dose)} abaixo da faixa usual (mín. ${range.min}).` };
  return { severity: 'normal' };
}

function rateCore(a: {
  engineName: string;
  dose: number;
  doseUnit: DoseUnit;
  weightKg?: number;
  concentration: number;
  concentrationUnit: string;
  perHour: number; // fator para converter dose em quantidade/hora (60 para /min, 1 para /h)
  opts?: InfusionOptions;
}): InfusionResult {
  const errors: string[] = [];
  checkPositive(errors, 'Dose', a.dose, a.doseUnit);
  checkPositive(errors, 'Concentração', a.concentration, a.concentrationUnit);
  if (a.weightKg !== undefined) checkRange(errors, 'Peso', a.weightKg, a.opts?.weightRangeKg ?? LIMITS.weightKg, 'kg');
  throwIfErrors(errors);

  const weightFactor = a.weightKg ?? 1;
  const hourly = a.dose * weightFactor * a.perHour;
  const rateRaw = hourly / a.concentration;

  if (rateRaw > MAX_PUMP_RATE_ML_H) {
    throw new ClinicalInputError([
      `Taxa calculada (${num(rateRaw)} mL/h) excede o limite de bomba (${MAX_PUMP_RATE_ML_H} mL/h). Verifique dose, peso e concentração.`,
    ]);
  }

  const rateMlHr = round1(rateRaw);
  const warnings: string[] = [];
  const ds = doseSeverity(a.dose, a.opts?.doseRange);
  if (ds.warning) warnings.push(ds.warning);
  if (rateRaw > HIGH_RATE_WARNING_ML_H) warnings.push(`Taxa alta (${rateMlHr} mL/h): reconfirmar peso, dose e concentração.`);
  if (rateRaw < 0.1) warnings.push('Taxa abaixo da resolução usual da bomba (0,1 mL/h): considerar diluição menos concentrada.');

  const perHourLabel = a.perHour === 60 ? '× 60 min' : '';
  const weightLabel = a.weightKg !== undefined ? ` × ${a.weightKg} kg` : '';
  const explanation: CalculationExplanation = {
    engineName: a.engineName,
    clinicalPurpose: 'Programação de bomba de infusão contínua (BIC)',
    reference: 'Análise dimensional: taxa (mL/h) = quantidade por hora ÷ concentração da solução.',
    primaryEquation: `Taxa (mL/h) = [Dose (${a.doseUnit})${a.weightKg !== undefined ? ' × Peso (kg)' : ''}${a.perHour === 60 ? ' × 60 min/h' : ''}] / Concentração (${a.concentrationUnit})`,
    variablesUsed: {
      'Dose alvo': `${num(a.dose)} ${a.doseUnit}`,
      ...(a.weightKg !== undefined ? { Peso: `${a.weightKg} kg` } : {}),
      Concentração: `${num(a.concentration)} ${a.concentrationUnit}`,
    },
    steps: [
      {
        label: '1. Quantidade por hora',
        formula: `Dose${a.weightKg !== undefined ? ' × Peso' : ''}${a.perHour === 60 ? ' × 60' : ''}`,
        valuesSubstituted: `${num(a.dose)}${weightLabel} ${perHourLabel}`.trim(),
        result: `${num(hourly)} ${a.concentrationUnit.split('/')[0]}/h`,
      },
      {
        label: '2. Volume por hora',
        formula: 'Quantidade por hora / Concentração',
        valuesSubstituted: `${num(hourly)} / ${num(a.concentration)}`,
        result: `${rateMlHr} mL/h`,
      },
    ],
    finalResult: {
      value: rateMlHr,
      unit: 'mL/h',
      interpretation: `Programar a BIC para ${rateMlHr} mL/h (${num(a.dose)} ${a.doseUnit})`,
      severity: ds.severity,
    },
    clinicalNotes: ['Confirme a concentração com o rótulo da bolsa e faça dupla checagem antes de liberar a taxa na bomba.'],
    ...(warnings.length ? { warningAlert: warnings.join(' ') } : {}),
  };

  return { rateMlHr, warnings, explanation };
}

/** mcg/kg/min → mL/h */
export function convertMcgKgMinToMlHr(
  doseMcgKgMin: number,
  weightKg: number,
  concentrationMcgMl: number,
  opts?: InfusionOptions
): InfusionResult {
  return rateCore({
    engineName: 'Conversão: mcg/kg/min ➔ mL/h',
    dose: doseMcgKgMin,
    doseUnit: 'mcg/kg/min',
    weightKg,
    concentration: concentrationMcgMl,
    concentrationUnit: 'mcg/mL',
    perHour: 60,
    opts,
  });
}

/** mcg/min → mL/h (sem peso) */
export function convertMcgMinToMlHr(doseMcgMin: number, concentrationMcgMl: number, opts?: InfusionOptions): InfusionResult {
  return rateCore({
    engineName: 'Conversão: mcg/min ➔ mL/h',
    dose: doseMcgMin,
    doseUnit: 'mcg/min',
    concentration: concentrationMcgMl,
    concentrationUnit: 'mcg/mL',
    perHour: 60,
    opts,
  });
}

/** UI/min → mL/h (ex.: vasopressina) */
export function convertUiMinToMlHr(doseUiMin: number, concentrationUiMl: number, opts?: InfusionOptions): InfusionResult {
  return rateCore({
    engineName: 'Conversão: UI/min ➔ mL/h',
    dose: doseUiMin,
    doseUnit: 'UI/min',
    concentration: concentrationUiMl,
    concentrationUnit: 'UI/mL',
    perHour: 60,
    opts,
  });
}

/** mg/h → mL/h (concentração em mg/mL) */
export function convertMgHrToMlHr(doseMgHr: number, concentrationMgMl: number, opts?: InfusionOptions): InfusionResult {
  return rateCore({
    engineName: 'Conversão: mg/h ➔ mL/h',
    dose: doseMgHr,
    doseUnit: 'mg/h',
    concentration: concentrationMgMl,
    concentrationUnit: 'mg/mL',
    perHour: 1,
    opts,
  });
}

/** mL/h → mcg/kg/min (cálculo reverso, a partir do visor da bomba) */
export function convertMlHrToMcgKgMin(
  rateMlHr: number,
  weightKg: number,
  concentrationMcgMl: number,
  opts?: InfusionOptions
): { doseMcgKgMin: number; warnings: string[]; explanation: CalculationExplanation } {
  const errors: string[] = [];
  checkPositive(errors, 'Taxa', rateMlHr, 'mL/h');
  checkPositive(errors, 'Concentração', concentrationMcgMl, 'mcg/mL');
  checkRange(errors, 'Peso', weightKg, opts?.weightRangeKg ?? LIMITS.weightKg, 'kg');
  if (Number.isFinite(rateMlHr) && rateMlHr > MAX_PUMP_RATE_ML_H) {
    errors.push(`Taxa (${rateMlHr} mL/h) excede o limite de bomba (${MAX_PUMP_RATE_ML_H} mL/h).`);
  }
  throwIfErrors(errors);

  const hourly = rateMlHr * concentrationMcgMl;
  const doseMcgKgMin = Number((hourly / (weightKg * 60)).toFixed(3));
  const ds = doseSeverity(doseMcgKgMin, opts?.doseRange);
  const warnings = ds.warning ? [ds.warning] : [];

  const explanation: CalculationExplanation = {
    engineName: 'Cálculo reverso: mL/h ➔ mcg/kg/min',
    clinicalPurpose: 'Identificar a dose que o paciente recebe a partir da taxa exibida na bomba',
    reference: 'Análise dimensional: dose = (taxa × concentração) ÷ (peso × 60).',
    primaryEquation: 'Dose (mcg/kg/min) = [Taxa (mL/h) × Concentração (mcg/mL)] / [Peso (kg) × 60 min/h]',
    variablesUsed: {
      'Taxa atual na bomba': `${num(rateMlHr)} mL/h`,
      Concentração: `${num(concentrationMcgMl)} mcg/mL`,
      Peso: `${weightKg} kg`,
    },
    steps: [
      { label: '1. Fármaco por hora', formula: 'Taxa × Concentração', valuesSubstituted: `${num(rateMlHr)} × ${num(concentrationMcgMl)}`, result: `${num(hourly)} mcg/h` },
      { label: '2. Normalização por peso e minuto', formula: 'Total / (Peso × 60)', valuesSubstituted: `${num(hourly)} / (${weightKg} × 60)`, result: `${doseMcgKgMin} mcg/kg/min` },
    ],
    finalResult: {
      value: doseMcgKgMin,
      unit: 'mcg/kg/min',
      interpretation: `${num(rateMlHr)} mL/h corresponde a ${doseMcgKgMin} mcg/kg/min`,
      severity: ds.severity,
    },
    ...(warnings.length ? { warningAlert: warnings.join(' ') } : {}),
  };

  return { doseMcgKgMin, warnings, explanation };
}

export interface DoseFromRateResult {
  dose: number;
  unit: DoseUnit;
  warnings: string[];
  explanation: CalculationExplanation;
}

/**
 * Cálculo reverso GENÉRICO: taxa lida na bomba (mL/h) → dose na unidade do preset.
 * Use esta função na interface (e não convertMlHrToMcgKgMin) para qualquer fármaco:
 * a conversão correta depende da unidade (mcg/kg/min usa peso; UI/min e mcg/min não usam).
 */
export function calculateDoseFromRate(p: StandardInfusionPreset, rateMlHr: number, weightKg?: number): DoseFromRateResult {
  const errors: string[] = [];
  checkPositive(errors, 'Taxa', rateMlHr, 'mL/h');
  if (Number.isFinite(rateMlHr) && rateMlHr > MAX_PUMP_RATE_ML_H) {
    errors.push(`Taxa (${rateMlHr} mL/h) excede o limite de bomba (${MAX_PUMP_RATE_ML_H} mL/h).`);
  }
  const needsWeight = p.unit === 'mcg/kg/min';
  if (needsWeight) checkRange(errors, 'Peso', weightKg, LIMITS.weightKg, 'kg');
  throwIfErrors(errors);

  const c = concentrationOf(p);
  const concValue = p.unit === 'mg/h' ? c.value / 1000 : c.value; // mg/mL quando a dose é em mg/h
  const concUnit = p.unit === 'mg/h' ? 'mg/mL' : c.unit;
  const perHour = p.unit === 'mcg/kg/min' || p.unit === 'mcg/min' || p.unit === 'UI/min' ? 60 : 1;
  const weight = needsWeight ? (weightKg as number) : 1;

  const hourly = rateMlHr * concValue;
  const dose = Number((hourly / (perHour * weight)).toFixed(3));
  const ds = doseSeverity(dose, { min: p.usualMinDose, max: p.usualMaxDose });
  const warnings = ds.warning ? [ds.warning] : [];

  const explanation: CalculationExplanation = {
    engineName: `Cálculo reverso: mL/h ➔ ${p.unit}`,
    clinicalPurpose: 'Identificar a dose que o paciente recebe a partir da taxa exibida na bomba',
    reference: 'Análise dimensional: dose = (taxa × concentração) ÷ (fator de tempo × peso, quando aplicável).',
    primaryEquation: `Dose (${p.unit}) = [Taxa (mL/h) × Concentração (${concUnit})] / [${perHour === 60 ? '60 min/h' : '1'}${needsWeight ? ' × Peso (kg)' : ''}]`,
    variablesUsed: {
      'Taxa atual na bomba': `${num(rateMlHr)} mL/h`,
      Concentração: `${num(concValue)} ${concUnit}`,
      ...(needsWeight ? { Peso: `${weightKg} kg` } : {}),
    },
    steps: [
      { label: '1. Quantidade por hora', formula: 'Taxa × Concentração', valuesSubstituted: `${num(rateMlHr)} × ${num(concValue)}`, result: `${num(hourly)} ${concUnit.split('/')[0]}/h` },
      {
        label: '2. Normalização',
        formula: `Total / (${perHour === 60 ? '60' : '1'}${needsWeight ? ' × Peso' : ''})`,
        valuesSubstituted: `${num(hourly)} / (${perHour}${needsWeight ? ` × ${weightKg}` : ''})`,
        result: `${dose} ${p.unit}`,
      },
    ],
    finalResult: { value: dose, unit: p.unit, interpretation: `${num(rateMlHr)} mL/h corresponde a ${dose} ${p.unit}`, severity: ds.severity },
    ...(warnings.length ? { warningAlert: warnings.join(' ') } : {}),
  };

  return { dose, unit: p.unit, warnings, explanation };
}

/**
 * Calcula a taxa (mL/h) de um preset para uma dose (padrão: dose inicial do preset),
 * escolhendo o conversor pela unidade do preset. A faixa usual do preset gera aviso/severidade.
 */
export function calculateInfusionRate(p: StandardInfusionPreset, dose: number = p.startingDose, weightKg?: number): InfusionResult {
  const c = concentrationOf(p);
  const opts: InfusionOptions = { doseRange: { min: p.usualMinDose, max: p.usualMaxDose } };

  switch (p.unit) {
    case 'mcg/kg/min':
      if (weightKg === undefined) throw new ClinicalInputError(['Peso é obrigatório para dose em mcg/kg/min.']);
      return convertMcgKgMinToMlHr(dose, weightKg, c.value, opts);
    case 'mcg/min':
      return convertMcgMinToMlHr(dose, c.value, opts);
    case 'UI/min':
      return convertUiMinToMlHr(dose, c.value, opts);
    case 'mg/h':
      return convertMgHrToMlHr(dose, c.value / 1000, opts);
    case 'UI/h':
      return rateCore({
        engineName: 'Conversão: UI/h ➔ mL/h',
        dose,
        doseUnit: 'UI/h',
        concentration: c.value,
        concentrationUnit: 'UI/mL',
        perHour: 1,
        opts,
      });
  }
}
