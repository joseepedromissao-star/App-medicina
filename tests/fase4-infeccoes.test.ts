/**
 * AuraMed - Suíte de Testes da Fase 4: Infecções Graves (HAP/VAP e Pielonefrite Aguda)
 * Referências: ATS/IDSA (HAP/VAP), EAU 2026 (Urological Infections), Surviving Sepsis Campaign 2026
 */

import { describe, it, expect } from 'vitest';
import { CLINICAL_SCORES } from '../data/scores';
import { CLINICAL_PROTOCOLS } from '../data/mock-protocols';

describe('Fase 4 - Infecções Graves (HAP/VAP e Pielonefrite Aguda)', () => {
  // ---------------------------------------------------------------------------
  // 1. PNEUMONIA HOSPITALAR E ASSOCIADA À VENTILAÇÃO MECÂNICA (HAP/VAP)
  // ---------------------------------------------------------------------------
  describe('HAP / VAP (Pneumonia Nosocomial e Associada à Ventilação)', () => {
    const hapProtocol = CLINICAL_PROTOCOLS.find((p) => p.id === 'hap_vap');
    const mdrScore = CLINICAL_SCORES.find((s) => s.id === 'hap_vap_mdr_risk');

    it('protocolo de HAP/VAP registrado com as diretrizes ATS/IDSA e SSC 2026', () => {
      expect(hapProtocol).toBeDefined();
      expect(hapProtocol?.guidelines?.[0]?.nome).toContain('ATS/IDSA');
      expect(hapProtocol?.guidelines?.[1]?.nome).toContain('Surviving Sepsis Campaign');
      expect(hapProtocol?.guidelines?.[1]?.ano).toBe(2026);
      expect(hapProtocol?.associatedScores).toContain('hap_vap_mdr_risk');
      expect(hapProtocol?.associatedScores).toContain('news2');
    });

    it('escore de risco de patógenos multirresistentes possui os 6 critérios clássicos da ATS/IDSA', () => {
      expect(mdrScore).toBeDefined();
      expect(mdrScore?.criteria.length).toBe(6);
      expect(mdrScore?.criteria.some((c) => c.id === 'abx_last_90d')).toBe(true);
      expect(mdrScore?.criteria.some((c) => c.id === 'septic_shock_pres')).toBe(true);
      expect(mdrScore?.criteria.some((c) => c.id === 'hosp_5days')).toBe(true);
      expect(mdrScore?.criteria.some((c) => c.id === 'mrsa_prev_high')).toBe(true);
    });

    it('estratificação direciona entre monoterapia (0 pts) vs terapia combinada + anti-MRSA (≥ 1 pt)', () => {
      const interp = mdrScore?.interpretations || [];
      expect(interp.length).toBe(2);

      // 0 pontos: Baixo risco
      expect(interp[0].min).toBe(0);
      expect(interp[0].max).toBe(0);
      expect(interp[0].severity).toBe('low');
      expect(interp[0].recommendation).toContain('MONOTERAPIA');

      // ≥ 1 ponto: Alto risco de resistência
      expect(interp[1].min).toBe(1);
      expect(interp[1].max).toBe(6);
      expect(interp[1].severity).toBe('critical');
      expect(interp[1].recommendation).toContain('TERAPIA COMBINADA');
      expect(interp[1].recommendation).toContain('MRSA');
    });

    it('conduta inclui coleta de culturas antes do antibiótico, infusão estendida e duração padrão de 7 dias', () => {
      const phases = hapProtocol?.conductPhases || [];
      expect(phases.length).toBe(3);

      // Coleta prévia
      const cultures = phases[0]?.items.find((i) => i.id === 'hap-1');
      expect(cultures?.detail).toContain('aspirado traqueal quantitativo');

      // Betalactâmico antipseudomonas
      const beta = phases[1]?.items.find((i) => i.id === 'hap-3');
      expect(beta?.detail).toContain('Piperacilina-Tazobactam');
      expect(beta?.detail).toContain('infusão estendida');

      // Duração de 7 dias
      const duration = phases[2]?.items.find((i) => i.id === 'hap-6');
      expect(duration?.detail).toContain('7 dias');
    });
  });

  // ---------------------------------------------------------------------------
  // 2. PIELONEFRITE AGUDA E UROSEPSE
  // ---------------------------------------------------------------------------
  describe('Pielonefrite Aguda e Urosepse', () => {
    const pieloProtocol = CLINICAL_PROTOCOLS.find((p) => p.id === 'pielonefrite_aguda');
    const gravScore = CLINICAL_SCORES.find((s) => s.id === 'pielonefrite_gravidade');

    it('protocolo registrado com as diretrizes da EAU 2026 (Urological Infections)', () => {
      expect(pieloProtocol).toBeDefined();
      expect(pieloProtocol?.guidelines?.[0]?.nome).toContain('EAU');
      expect(pieloProtocol?.guidelines?.[0]?.ano).toBe(2026);
      expect(pieloProtocol?.associatedScores).toContain('pielonefrite_gravidade');
      expect(pieloProtocol?.associatedScores).toContain('news2');
    });

    it('escore de gravidade pondera urosepse, obstrução litiásica, rim único e fatores do hospedeiro', () => {
      expect(gravScore).toBeDefined();
      expect(gravScore?.criteria.length).toBe(7);

      const urosepsis = gravScore?.criteria.find((c) => c.id === 'urosepsis_signs');
      expect(urosepsis?.points).toBe(2);

      const obstruction = gravScore?.criteria.find((c) => c.id === 'urinary_obstruction');
      expect(obstruction?.points).toBe(2);

      const solitary = gravScore?.criteria.find((c) => c.id === 'solitary_kidney');
      expect(solitary?.points).toBe(2);
    });

    it('estratifica em baixo risco (ambulatorial), moderado (enfermaria) e complicada (emergência/UTI)', () => {
      const interp = gravScore?.interpretations || [];
      expect(interp.length).toBe(3);

      // Baixo risco
      expect(interp[0].min).toBe(0);
      expect(interp[0].max).toBe(0);
      expect(interp[0].severity).toBe('low');
      expect(interp[0].recommendation).toContain('ambulatorial');

      // Moderado
      expect(interp[1].min).toBe(1);
      expect(interp[1].max).toBe(2);
      expect(interp[1].severity).toBe('moderate');
      expect(interp[1].recommendation).toContain('Ceftriaxona');

      // Complicada / Urosepse
      expect(interp[2].min).toBe(3);
      expect(interp[2].severity).toBe('critical');
      expect(interp[2].recommendation).toContain('descompressão urológica');
    });

    it('conduta destaca descompressão urológica de emergência para pielonefrite obstrutiva', () => {
      const phases = pieloProtocol?.conductPhases || [];
      const decompress = phases[0]?.items.find((i) => i.id === 'pielo-2');
      expect(decompress?.title).toContain('Pielonefrite Obstrutiva');
      expect(decompress?.detail).toContain('duplo J');
      expect(decompress?.priority).toBe('emergency');

      const abx = phases[1]?.items.find((i) => i.id === 'pielo-4');
      expect(abx?.detail).toContain('Ceftriaxona');
      expect(abx?.detail).toContain('Ertapenem');
    });
  });
});
