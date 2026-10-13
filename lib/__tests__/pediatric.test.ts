/**
 * AuraMed - testes do módulo pediátrico (PCR pediátrica). Rodar: npx vitest run
 * Valores de referência: algoritmo de parada cardíaca pediátrica do PALS 2025 (AHA/AAP).
 */
import { describe, expect, it } from 'vitest';
import { PEDIATRIC_AGE_BANDS, calculatePediatricArrest, validatePediatricInput } from '../pediatric';
import { calculateCkdEpi2021, calculateCockcroftGault } from '../tfg';
import { convertMcgKgMinToMlHr } from '../infusion';
import { ClinicalInputError } from '../validation';

const ped = (ageMonths: number, weightKg: number, weightOrigin: 'medido' | 'estimado' = 'medido') => ({ ageMonths, weightKg, weightOrigin });
const item = (r: ReturnType<typeof calculatePediatricArrest>, id: string) => r.items.find((i) => i.id === id)!;

describe('PCR pediátrica - valores de referência (criança de 15 kg, 4 anos)', () => {
  const r = calculatePediatricArrest(ped(48, 15));
  it('epinefrina: 0,01 mg/kg = 0,15 mg = 1,5 mL de 0,1 mg/mL', () => {
    expect(item(r, 'ped-epinefrina').doseMg).toBeCloseTo(0.15, 3);
    expect(item(r, 'ped-epinefrina').volumeMl).toBeCloseTo(1.5, 2);
    expect(item(r, 'ped-epinefrina').tetoAplicado).toBe(false);
  });
  it('amiodarona: 5 mg/kg = 75 mg', () => expect(item(r, 'ped-amiodarona-1').doseMg).toBeCloseTo(75, 1));
  it('amiodarona repetida: 75 mg (abaixo do teto de 150 mg)', () => expect(item(r, 'ped-amiodarona-repeticao').doseMg).toBeCloseTo(75, 1));
  it('lidocaína de ataque: 1 mg/kg = 15 mg', () => expect(item(r, 'ped-lidocaina-ataque').doseMg).toBeCloseTo(15, 2));
  it('desfibrilação: 2 J/kg = 30 J; 4 J/kg = 60 J; seguintes de 60 a 150 J (10 J/kg)', () => {
    expect(r.defibrillation.firstJ).toBe(30);
    expect(r.defibrillation.secondJ).toBe(60);
    expect(r.defibrillation.subsequentMinJ).toBe(60);
    expect(r.defibrillation.subsequentMaxJ).toBe(150);
  });
});

describe('PCR pediátrica - lactente e tetos', () => {
  it('lactente de 3,5 kg: epinefrina 0,035 mg = 0,35 mL; choques 7 J e 14 J', () => {
    const r = calculatePediatricArrest(ped(4, 3.5));
    expect(item(r, 'ped-epinefrina').doseMg).toBeCloseTo(0.035, 3);
    expect(item(r, 'ped-epinefrina').volumeMl).toBeCloseTo(0.35, 2);
    expect(r.defibrillation.firstJ).toBe(7);
    expect(r.defibrillation.secondJ).toBe(14);
  });
  it('adolescente de 120 kg: epinefrina limitada a 1 mg (10 mL) e amiodarona a 300 mg / 150 mg', () => {
    const r = calculatePediatricArrest(ped(200, 120));
    expect(item(r, 'ped-epinefrina').doseMg).toBe(1);
    expect(item(r, 'ped-epinefrina').volumeMl).toBeCloseTo(10, 2);
    expect(item(r, 'ped-epinefrina').tetoAplicado).toBe(true);
    expect(item(r, 'ped-amiodarona-1').doseMg).toBe(300);
    expect(item(r, 'ped-amiodarona-1').tetoAplicado).toBe(true);
    expect(item(r, 'ped-amiodarona-repeticao').doseMg).toBe(150);
  });
  it('a dose de epinefrina NUNCA passa de 1 mg, para qualquer peso plausível', () => {
    [25, 30, 60, 90, 120, 150, 200].forEach((kg) => {
      const r = calculatePediatricArrest(ped(200, kg));
      expect(item(r, 'ped-epinefrina').doseMg as number).toBeLessThanOrEqual(1);
      expect(item(r, 'ped-amiodarona-1').doseMg as number).toBeLessThanOrEqual(300);
    });
  });
  it('a nota de choque lembra do limite da dose de adulto', () => {
    expect(calculatePediatricArrest(ped(48, 15)).defibrillation.nota).toContain('dose de adulto');
  });
});

describe('PCR pediátrica - avisos', () => {
  it('peso estimado gera aviso', () => {
    expect(calculatePediatricArrest(ped(48, 15, 'estimado')).warnings.join(' ')).toContain('PESO ESTIMADO');
  });
  it('peso medido não gera aviso de estimativa', () => {
    expect(calculatePediatricArrest(ped(48, 15, 'medido')).warnings.join(' ')).not.toContain('PESO ESTIMADO');
  });
  it('adolescente gera aviso para seguir a conduta de adulto se pós-puberal', () => {
    expect(calculatePediatricArrest(ped(180, 55)).warnings.join(' ')).toContain('ADOLESCENTE');
  });
  it('lidocaína de repetição/manutenção fica marcada VERIFICAR; a de ataque, CONFIRMADA', () => {
    const r = calculatePediatricArrest(ped(48, 15));
    expect(item(r, 'ped-lidocaina-repeticao-manutencao').statusRecomendacao).toBe('VERIFICAR');
    expect(item(r, 'ped-lidocaina-ataque').statusRecomendacao).toBe('CONFIRMADA');
  });
  it('nenhum resultado sai marcado como VALIDADO sem revisão médica', () => {
    const r = calculatePediatricArrest(ped(48, 15));
    r.items.forEach((i) => expect(i.validacaoClinica).toBe('PENDENTE'));
    expect(r.defibrillation.validacaoClinica).toBe('PENDENTE');
  });
  it('todo item tem fonte e "como calculei"', () => {
    calculatePediatricArrest(ped(48, 15)).items.forEach((i) => {
      expect(i.fonte.length).toBeGreaterThan(0);
      expect(i.explanation.steps.length).toBeGreaterThan(0);
    });
  });
});

describe('Módulo pediátrico - entradas inválidas são recusadas', () => {
  const casos: [string, () => unknown][] = [
    ['idade de 18 anos (usar o módulo adulto)', () => calculatePediatricArrest(ped(216, 60))],
    ['idade negativa', () => calculatePediatricArrest(ped(-1, 10))],
    ['idade NaN', () => calculatePediatricArrest(ped(NaN, 10))],
    ['peso 0', () => calculatePediatricArrest(ped(48, 0))],
    ['peso NaN', () => calculatePediatricArrest(ped(48, NaN))],
    ['peso de adulto para lactente de 3 meses (70 kg)', () => calculatePediatricArrest(ped(3, 70))],
    ['peso de 7 kg para criança de 11 anos (digitou 7 em vez de 70)', () => calculatePediatricArrest(ped(132, 7))],
    ['peso de lactente para adolescente (4 kg aos 15 anos)', () => calculatePediatricArrest(ped(180, 4))],
    ['origem do peso ausente', () => calculatePediatricArrest({ ageMonths: 48, weightKg: 15 } as never)],
    ['origem do peso inválida', () => calculatePediatricArrest({ ageMonths: 48, weightKg: 15, weightOrigin: 'chute' } as never)],
  ];
  casos.forEach(([nome, fn]) => it(`lança ClinicalInputError: ${nome}`, () => expect(fn).toThrow(ClinicalInputError)));
  it('validatePediatricInput devolve a faixa etária correta', () => {
    expect(validatePediatricInput(ped(0, 3)).band.id).toBe('rn');
    expect(validatePediatricInput(ped(6, 7)).band.id).toBe('lactente');
    expect(validatePediatricInput(ped(36, 14)).band.id).toBe('crianca_pequena');
    expect(validatePediatricInput(ped(96, 25)).band.id).toBe('crianca');
    expect(validatePediatricInput(ped(215, 60)).band.id).toBe('adolescente');
  });
  it('as faixas etárias cobrem de 0 a 18 anos sem buracos nem sobreposição', () => {
    for (let i = 1; i < PEDIATRIC_AGE_BANDS.length; i++) expect(PEDIATRIC_AGE_BANDS[i].minMonths).toBe(PEDIATRIC_AGE_BANDS[i - 1].maxMonths);
    expect(PEDIATRIC_AGE_BANDS[0].minMonths).toBe(0);
    expect(PEDIATRIC_AGE_BANDS[PEDIATRIC_AGE_BANDS.length - 1].maxMonths).toBe(216);
  });
});

describe('Fronteira adulto/pediatria: os motores de adulto continuam recusando crianças', () => {
  it('TFG de adulto recusa 12 anos e 25 kg', () => {
    expect(() => calculateCkdEpi2021(12, 'M', 0.6)).toThrow(ClinicalInputError);
    expect(() => calculateCockcroftGault(12, 'M', 25, 140, 0.6)).toThrow(ClinicalInputError);
  });
  it('infusão com peso pediátrico (10 kg) é recusada pelo motor de adulto', () => {
    expect(() => convertMcgKgMinToMlHr(0.1, 10, 16)).toThrow(ClinicalInputError);
  });
});
