/**
 * AuraMed - Suíte de Testes do Motor de Escores Clínicos (lib/scores-engine.ts)
 * Testes com casos clínicos de referência para:
 *  - PSI/PORT (homem 85 anos = 85 classe III; mulher 90 anos = 80 classe III; não confirmado = incompleto)
 *  - NEWS2 (só PAS 85 = 3 com aviso de parâmetro isolado; 0 = 12h; 1-4 = 4-6h; 5-6 = urgente; >=7 = emergência)
 *  - ATS/IDSA (1 maior = grave; 2 menores = não grave; 3 menores = grave)
 */

import { describe, it, expect } from 'vitest';
import { CLINICAL_SCORES } from '../data/scores';
import {
  calculatePsiDemographicPoints,
  sumScore,
  interpretScore,
  calculateAndInterpretScore,
} from '../lib/scores-engine';
import type { PatientData } from '../types/clinical';

const mockPatient = (over: Partial<PatientData> = {}): PatientData => ({
  id: 'pt-1',
  age: 85,
  sex: 'M',
  weightKg: 70,
  heightCm: 170,
  sbp: 120,
  dbp: 80,
  hr: 80,
  rr: 18,
  spo2: 96,
  temperature: 36.5,
  gcs: 15,
  creatinineMgDl: 1.0,
  allergies: [],
  pregnancy: false,
  dialysis: false,
  liverFailure: false,
  activeBleeding: false,
  ...over,
});

describe('scores-engine: PSI / PORT (Pneumonia Severity Index)', () => {
  const psiScore = CLINICAL_SCORES.find((s) => s.id === 'psi_port')!;

  it('calcula pontos demográficos: homem = idade, mulher = idade - 10', () => {
    expect(calculatePsiDemographicPoints(85, 'M')).toBe(85);
    expect(calculatePsiDemographicPoints(90, 'F')).toBe(80);
    expect(calculatePsiDemographicPoints(50, 'F')).toBe(40);
  });

  it('caso clínico 1: homem 85 anos sem outros critérios = 85 (classe III)', () => {
    const pt = mockPatient({ age: 85, sex: 'M' });
    const responses: Record<string, number> = {};
    psiScore.criteria.forEach((c) => {
      responses[c.id] = 0; // todos os 19 critérios não-demográficos negativos
    });

    const res = calculateAndInterpretScore(psiScore, responses, pt, true);
    expect(res.rawPoints).toBe(0);
    expect(res.demographicPoints).toBe(85);
    expect(res.totalScore).toBe(85);
    expect(res.isComplete).toBe(true);
    expect(res.interpretation).toBeDefined();
    expect(res.interpretation?.label).toContain('Classe III');
    expect(res.interpretation?.severity).toBe('moderate');
  });

  it('caso clínico 2: mulher 90 anos sem outros critérios = 80 (classe III)', () => {
    const pt = mockPatient({ age: 90, sex: 'F' });
    const responses: Record<string, number> = {};
    psiScore.criteria.forEach((c) => {
      responses[c.id] = 0;
    });

    const res = calculateAndInterpretScore(psiScore, responses, pt, true);
    expect(res.rawPoints).toBe(0);
    expect(res.demographicPoints).toBe(80);
    expect(res.totalScore).toBe(80);
    expect(res.isComplete).toBe(true);
    expect(res.interpretation?.label).toContain('Classe III');
    expect(res.interpretation?.severity).toBe('moderate');
  });

  it('sem paciente confirmado (isConfirmed === false), o PSI fica INCOMPLETO', () => {
    const pt = mockPatient({ age: 85, sex: 'M' });
    const responses: Record<string, number> = {};
    psiScore.criteria.forEach((c) => {
      responses[c.id] = 0;
    });

    const res = calculateAndInterpretScore(psiScore, responses, pt, false);
    expect(res.isComplete).toBe(false);
    expect(res.interpretation).toBeUndefined();
    expect(res.demographicPoints).toBe(0);
  });
});

describe('scores-engine: NEWS2 (National Early Warning Score 2)', () => {
  const newsScore = CLINICAL_SCORES.find((s) => s.id === 'news2')!;

  it('caso clínico 3: paciente só com PAS 85 mmHg = 3 pontos com aviso de parâmetro isolado e resposta urgente', () => {
    const responses: Record<string, number> = {
      news_rr: 0,
      news_spo2: 0,
      news_o2: 0,
      news_sbp: 3, // PAS <= 90 mmHg dá 3 pontos
      news_hr: 0,
      news_consciousness: 0,
      news_temp: 0,
    };

    const res = calculateAndInterpretScore(newsScore, responses, null, false);
    expect(res.totalScore).toBe(3);
    expect(res.isComplete).toBe(true);
    expect(res.isolatedThreeParamWarning).toBe('Parâmetro isolado com 3 pontos: resposta urgente');
    expect(res.interpretation).toBeDefined();
    expect(res.interpretation?.severity).toBe('moderate');
    expect(res.interpretation?.label).toContain('Parâmetro Isolado = 3');
  });

  it('estratificação por faixas separadas de NEWS2', () => {
    // 0 -> monitorização a cada 12h
    const r0 = interpretScore(newsScore, 0, { news_rr: 0 }, true);
    expect(r0.interpretation?.min).toBe(0);
    expect(r0.interpretation?.max).toBe(0);
    expect(r0.interpretation?.recommendation).toContain('12 horas');

    // 1-4 -> monitorização a cada 4-6h (sem parâmetro isolado com 3)
    const r2 = interpretScore(newsScore, 2, { news_rr: 1, news_hr: 1 }, true);
    expect(r2.interpretation?.min).toBe(1);
    expect(r2.interpretation?.max).toBe(4);
    expect(r2.interpretation?.recommendation).toContain('4 a 6 horas');

    // 5-6 -> resposta urgente
    const r5 = interpretScore(newsScore, 5, { news_rr: 2, news_spo2: 2, news_hr: 1 }, true);
    expect(r5.interpretation?.min).toBe(5);
    expect(r5.interpretation?.max).toBe(6);
    expect(r5.interpretation?.recommendation).toContain('urgente');

    // >= 7 -> emergência médica
    const r7 = interpretScore(newsScore, 8, { news_rr: 3, news_hr: 3, news_o2: 2 }, true);
    expect(r7.interpretation?.min).toBe(7);
    expect(r7.interpretation?.severity).toBe('critical');
    expect(r7.interpretation?.recommendation).toContain('Emergência médica');
  });
});

describe('scores-engine: ATS/IDSA PAC Grave', () => {
  const atsScore = CLINICAL_SCORES.find((s) => s.id === 'ats_idsa_pac_grave')!;

  it('caso clínico 4: 1 critério maior = GRAVE (indicação direta de UTI)', () => {
    const responses: Record<string, number> = {
      major_shock: 3,
      major_imv: 0,
      minor_rr: 0,
      minor_pao2_fio2: 0,
      minor_multilobar: 0,
      minor_confusion: 0,
      minor_bun: 0,
      minor_leukopenia: 0,
      minor_thrombocytopenia: 0,
      minor_hypothermia: 0,
      minor_hypotension: 0,
    };

    const res = calculateAndInterpretScore(atsScore, responses, null, false);
    expect(res.totalScore).toBe(3);
    expect(res.isComplete).toBe(true);
    expect(res.interpretation?.severity).toBe('critical');
    expect(res.interpretation?.label).toContain('PAC GRAVE');
    expect(res.interpretation?.recommendation).toContain('UTI');
  });

  it('caso clínico 5: 2 critérios menores = NÃO GRAVE (critérios de UTI não atingidos)', () => {
    const responses: Record<string, number> = {
      major_shock: 0,
      major_imv: 0,
      minor_rr: 1,
      minor_confusion: 1,
      minor_pao2_fio2: 0,
      minor_multilobar: 0,
      minor_bun: 0,
      minor_leukopenia: 0,
      minor_thrombocytopenia: 0,
      minor_hypothermia: 0,
      minor_hypotension: 0,
    };

    const res = calculateAndInterpretScore(atsScore, responses, null, false);
    expect(res.totalScore).toBe(2);
    expect(res.isComplete).toBe(true);
    expect(res.interpretation?.severity).toBe('moderate');
    expect(res.interpretation?.label).toContain('PAC Não Grave');
    expect(res.interpretation?.recommendation).not.toContain('Indicação formal de internação direta em UTI');
  });

  it('caso clínico 6: 3 critérios menores = GRAVE (indicação de UTI)', () => {
    const responses: Record<string, number> = {
      major_shock: 0,
      major_imv: 0,
      minor_rr: 1,
      minor_confusion: 1,
      minor_bun: 1,
      minor_pao2_fio2: 0,
      minor_multilobar: 0,
      minor_leukopenia: 0,
      minor_thrombocytopenia: 0,
      minor_hypothermia: 0,
      minor_hypotension: 0,
    };

    const res = calculateAndInterpretScore(atsScore, responses, null, false);
    expect(res.totalScore).toBe(3);
    expect(res.isComplete).toBe(true);
    expect(res.interpretation?.severity).toBe('critical');
    expect(res.interpretation?.label).toContain('PAC GRAVE');
  });
});
