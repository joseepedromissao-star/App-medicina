/**
 * AuraMed - Suíte de Testes para Escores de PAC (CURB-65, PSI/PORT, ATS/IDSA 2019, NEWS2)
 * e Fármacos Antimicrobianos
 */

import { describe, it, expect } from 'vitest';
import { CLINICAL_SCORES } from '../data/scores';

describe('Escores de Pneumonia Adquirida na Comunidade (PAC) & Triagem', () => {
  const curb65 = CLINICAL_SCORES.find((s) => s.id === 'curb_65');
  const psiPort = CLINICAL_SCORES.find((s) => s.id === 'psi_port');
  const atsIdsa = CLINICAL_SCORES.find((s) => s.id === 'ats_idsa_pac_grave');
  const news2 = CLINICAL_SCORES.find((s) => s.id === 'news2');

  it('Garante que todos os 4 escores da Fase 1 estão registrados', () => {
    expect(curb65).toBeDefined();
    expect(psiPort).toBeDefined();
    expect(atsIdsa).toBeDefined();
    expect(news2).toBeDefined();
  });

  describe('CURB-65', () => {
    it('critério de ureia está com ponto de corte > 50 mg/dL conforme SBPT 2009', () => {
      const uCrit = curb65?.criteria.find((c) => c.id === 'u');
      expect(uCrit).toBeDefined();
      expect(uCrit?.label).toContain('50 mg/dL');
      expect(uCrit?.points).toBe(1);
    });

    it('possui 5 critérios e faixas de interpretação completas (0 a 5)', () => {
      expect(curb65?.criteria.length).toBe(5);
      expect(curb65?.interpretations.length).toBe(3);
      // Grupo 1: 0-1
      expect(curb65?.interpretations[0].severity).toBe('low');
      // Grupo 2: 2
      expect(curb65?.interpretations[1].severity).toBe('moderate');
      // Grupo 3: 3-5
      expect(curb65?.interpretations[2].severity).toBe('critical');
    });
  });

  describe('PSI / PORT (Pneumonia Severity Index)', () => {
    it('possui os critérios clínicos, comorbidades e laboratoriais validados', () => {
      expect(psiPort?.criteria.length).toBeGreaterThanOrEqual(18);
      const neoplasm = psiPort?.criteria.find((c) => c.id === 'neoplasm');
      expect(neoplasm?.points).toBe(30);
      const bun = psiPort?.criteria.find((c) => c.id === 'bun_psi');
      expect(bun?.points).toBe(20);
    });

    it('estratificação cobre todas as 5 classes de Fine (baixo risco a risco crítico)', () => {
      const interp = psiPort?.interpretations || [];
      expect(interp.length).toBe(4); // Classes I-II (0-70), Classe III (71-90), Classe IV (91-130), Classe V (>130)
      expect(interp[0].min).toBe(0);
      expect(interp[0].max).toBe(70);
      expect(interp[0].severity).toBe('low');

      expect(interp[1].min).toBe(71);
      expect(interp[1].max).toBe(90);
      expect(interp[1].severity).toBe('moderate');

      expect(interp[2].min).toBe(91);
      expect(interp[2].max).toBe(130);
      expect(interp[2].severity).toBe('high');

      expect(interp[3].min).toBe(131);
      expect(interp[3].severity).toBe('critical');
    });
  });

  describe('Critérios ATS/IDSA 2019 de PAC Grave', () => {
    it('critérios maiores valem 3 pontos cada e definem indicação de UTI', () => {
      const shock = atsIdsa?.criteria.find((c) => c.id === 'major_shock');
      const imv = atsIdsa?.criteria.find((c) => c.id === 'major_imv');
      expect(shock?.points).toBe(3);
      expect(imv?.points).toBe(3);
    });

    it('critérios menores valem 1 ponto cada e somam 9 critérios', () => {
      const minorCrits = atsIdsa?.criteria.filter((c) => c.id.startsWith('minor_'));
      expect(minorCrits?.length).toBe(9);
      minorCrits?.forEach((c) => {
        expect(c.points).toBe(1);
      });
    });

    it('interpretação define PAC Grave a partir de 3 pontos (1 maior ou ≥ 3 menores)', () => {
      const nonSevere = atsIdsa?.interpretations.find((i) => i.max === 2);
      const severe = atsIdsa?.interpretations.find((i) => i.min === 3);
      expect(nonSevere?.severity).toBe('moderate');
      expect(severe?.severity).toBe('critical');
      expect(severe?.recommendation).toContain('UTI');
    });
  });

  describe('NEWS2 (National Early Warning Score 2)', () => {
    it('possui as 7 variáveis fisiológicas vitais', () => {
      expect(news2?.criteria.length).toBe(7);
      const rr = news2?.criteria.find((c) => c.id === 'news_rr');
      expect(rr?.type).toBe('options');
      expect(rr?.options?.length).toBe(5);
    });

    it('estratificação correta de risco: 0 (12h), baixo 1-4 (4-6h), médio 5-6 (urgente) e alto ≥7 (emergência)', () => {
      const interp = news2?.interpretations || [];
      expect(interp.length).toBe(4);
      // 0 pontos: mínimo a cada 12h
      expect(interp[0].min).toBe(0);
      expect(interp[0].max).toBe(0);
      expect(interp[0].recommendation).toContain('12 horas');

      // 1-4 pontos: mínimo a cada 4-6h
      expect(interp[1].min).toBe(1);
      expect(interp[1].max).toBe(4);
      expect(interp[1].recommendation).toContain('4 a 6 horas');

      // 5-6 pontos: resposta urgente
      expect(interp[2].min).toBe(5);
      expect(interp[2].max).toBe(6);
      expect(interp[2].severity).toBe('moderate');
      expect(interp[2].recommendation).toContain('urgente');

      // >= 7 pontos: emergência
      expect(interp[3].min).toBe(7);
      expect(interp[3].severity).toBe('critical');
      expect(interp[3].recommendation).toContain('Emergência médica');
    });
  });
});
