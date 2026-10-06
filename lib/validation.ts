/**
 * AuraMed - Validação de entradas clínicas
 *
 * Princípio: o motor NUNCA "conserta" uma entrada inválida em silêncio.
 * Entrada fora da faixa de plausibilidade => ClinicalInputError (a UI mostra as mensagens).
 *
 * As faixas abaixo servem para detectar ERRO DE DIGITAÇÃO (ex.: peso 7 em vez de 70).
 * NÃO são metas terapêuticas. Ajustáveis pelo revisor médico.
 */

export class ClinicalInputError extends Error {
  readonly errors: string[];
  constructor(errors: string[]) {
    super(errors.join(' | '));
    this.name = 'ClinicalInputError';
    this.errors = errors;
  }
}

export type Range = readonly [number, number];

export const LIMITS = {
  age: [18, 120] as Range, // anos (equações/regimes deste módulo são para adultos)
  weightKg: [30, 300] as Range,
  heightCm: [120, 230] as Range,
  creatinineMgDl: [0.2, 20] as Range,
  sbp: [40, 300] as Range,
  dbp: [20, 200] as Range,
  hr: [20, 250] as Range,
  rr: [4, 70] as Range,
  spo2: [50, 100] as Range,
  gcs: [3, 15] as Range,
  temperatureC: [30, 44] as Range,
} as const;

/** Limite superior típico de taxa de bomba de infusão (mL/h). Acima disso, o cálculo é recusado. */
export const MAX_PUMP_RATE_ML_H = 999;
/** Acima disso, o cálculo é permitido, mas com alerta. */
export const HIGH_RATE_WARNING_ML_H = 300;

function show(v: unknown): string {
  return typeof v === 'number' && Number.isNaN(v) ? 'NaN' : String(v);
}

export function checkRange(errors: string[], label: string, value: unknown, range: Range, unit = ''): void {
  const [min, max] = range;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    errors.push(`${label} inválido(a): ${show(value)} (esperado ${min}–${max}${unit ? ' ' + unit : ''}).`);
  }
}

export function checkPositive(errors: string[], label: string, value: unknown, unit = ''): void {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    errors.push(`${label} inválido(a): ${show(value)} (deve ser um número maior que zero${unit ? ' ' + unit : ''}).`);
  }
}

export function checkSex(errors: string[], sex: unknown): void {
  if (sex !== 'M' && sex !== 'F') errors.push(`Sexo inválido: ${show(sex)} (use 'M' ou 'F').`);
}

export function throwIfErrors(errors: string[]): void {
  if (errors.length > 0) throw new ClinicalInputError(errors);
}

