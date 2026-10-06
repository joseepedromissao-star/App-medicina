/**
 * AuraMed - Suíte de Testes da Fase 2: TEP e Sepse/Choque Séptico
 * Referências: AHA/ACC 2026, ESC 2019, Surviving Sepsis Campaign 2026
 */

import { describe, it, expect } from 'vitest';
import { CLINICAL_SCORES } from '../data/scores';
import { CLINICAL_PROTOCOLS } from '../data/mock-protocols';

describe('Fase 2 - Tromboembolismo Pulmonar Agudo (TEP)', () => {
  const wells = CLINICAL_SCORES.find((s) => s.id === 'wells_tep');
  const spesi = CLINICAL_SCORES.find((s) => s.id === 'spesi');
  const ahaPe = CLINICAL_SCORES.find((s) => s.id === 'aha_acc_2026_tep');
  const tepProtocol = CLINICAL_PROTOCOLS.find((p) => p.id === 'tep_agudo');

  it('protocolo de TEP está devidamente registrado com a guideline AHA/ACC 2026', () => {
    expect(tepProtocol).toBeDefined();
    expect(
      `${tepProtocol?.guidelines?.[0]?.nome} ${tepProtocol?.guidelines?.[0]?.sociedade}`
    ).toContain('AHA/ACC');
    expect(tepProtocol?.guidelines?.[0]?.ano).toBe(2026);
    expect(tepProtocol?.associatedScores).toContain('aha_acc_2026_tep');
    expect(tepProtocol?.associatedScores).toContain('wells_tep');
    expect(tepProtocol?.associatedScores).toContain('spesi');
  });

  describe('Escore de Wells para TEP', () => {
    it('possui os 7 critérios clássicos com suas respectivas pontuações', () => {
      expect(wells).toBeDefined();
      expect(wells?.criteria.length).toBe(7);

      const dvt = wells?.criteria.find((c) => c.id === 'dvt_signs');
      expect(dvt?.points).toBe(3);

      const alt = wells?.criteria.find((c) => c.id === 'alt_diagnosis');
      expect(alt?.points).toBe(3);

      const tachycardia = wells?.criteria.find((c) => c.id === 'tachycardia');
      expect(tachycardia?.points).toBe(1.5);

      const hemoptysis = wells?.criteria.find((c) => c.id === 'hemoptysis');
      expect(hemoptysis?.points).toBe(1);
    });

    it('estratificação dicotômica: ≤ 4 (improvável / D-dímero) vs > 4 (provável / Angio-TC)', () => {
      const interp = wells?.interpretations || [];
      expect(interp.length).toBe(2);
      expect(interp[0].max).toBe(4);
      expect(interp[0].severity).toBe('low');
      expect(interp[0].recommendation).toContain('D-dímero');

      expect(interp[1].min).toBe(4.5);
      expect(interp[1].severity).toBe('high');
      expect(interp[1].recommendation).toContain('Angiotomografia');
    });
  });

  describe('sPESI (Simplified PESI)', () => {
    it('possui 6 critérios de 1 ponto cada', () => {
      expect(spesi).toBeDefined();
      expect(spesi?.criteria.length).toBe(6);
      spesi?.criteria.forEach((crit) => {
        expect(crit.points).toBe(1);
      });
    });

    it('0 ponto indica baixo risco (1,0% mortalidade) e ≥ 1 alto risco (10,9%)', () => {
      const interp = spesi?.interpretations || [];
      expect(interp.length).toBe(2);
      expect(interp[0].max).toBe(0);
      expect(interp[0].severity).toBe('low');
      expect(interp[0].mortalityRisk).toContain('1,0%');

      expect(interp[1].min).toBe(1);
      expect(interp[1].severity).toBe('critical');
      expect(interp[1].mortalityRisk).toContain('10,9%');
    });
  });

  describe('Categorias Clínicas AHA/ACC 2026 (A a E)', () => {
    it('possui opções cobrindo de Categoria A até Categoria E2', () => {
      expect(ahaPe).toBeDefined();
      const selection = ahaPe?.criteria.find((c) => c.id === 'category_selection');
      expect(selection?.options?.length).toBe(10); // A, B1, B2, C1, C2, C3, D1, D2, E1, E2
    });

    it('recomendações terapêuticas estratificam adequadamente manejo ambulatorial, PERT e reperfusão', () => {
      const interp = ahaPe?.interpretations || [];
      expect(interp.length).toBe(4);

      // Categorias A-B: Baixa gravidade
      expect(interp[0].label).toContain('Categorias A e B');
      expect(interp[0].severity).toBe('low');
      expect(interp[0].recommendation).toContain('ambulatorial');

      // Categoria C: Elevada gravidade / PERT Classe 1
      expect(interp[1].label).toContain('Categoria C');
      expect(interp[1].recommendation).toContain('PERT');
      expect(interp[1].recommendation).toContain('HBPM');

      // Categoria D: Falência Incipiente / UTI
      expect(interp[2].label).toContain('Categoria D');
      expect(interp[2].recommendation).toContain('UTI');
      expect(interp[2].recommendation).toContain('HNF');

      // Categoria E: Falência Cardiopulmonar / Choque / Trombólise
      expect(interp[3].label).toContain('Categoria E');
      expect(interp[3].severity).toBe('critical');
      expect(interp[3].recommendation.toLowerCase()).toContain('alteplase');
    });
  });
});

describe('Fase 2 - Sepse e Choque Séptico (SSC 2026)', () => {
  const sepsisProtocol = CLINICAL_PROTOCOLS.find((p) => p.id === 'choque_septico');

  it('protocolo de choque séptico está registrado com SSC 2026 e triagem por NEWS2', () => {
    expect(sepsisProtocol).toBeDefined();
    expect(sepsisProtocol?.guidelines?.[0]?.nome).toContain('Surviving Sepsis Campaign');
    expect(sepsisProtocol?.guidelines?.[0]?.ano).toBe(2026);
    expect(sepsisProtocol?.associatedScores).toContain('news2');
    expect(sepsisProtocol?.associatedScores).toContain('qsofa');
  });

  it('conduta de choque séptico inclui metas atualizadas de PAM e sequência de vasopressores', () => {
    const resuscitationPhase = sepsisProtocol?.conductPhases[0];
    expect(resuscitationPhase).toBeDefined();

    // Triagem preferencial por NEWS2 (item cs-0)
    const news2Item = resuscitationPhase?.items.find((i) => i.id === 'cs-0');
    expect(news2Item?.detail).toContain('NEWS');

    // Noradrenalina precoce com meta 65 mmHg (item cs-5)
    const noraItem = resuscitationPhase?.items.find((i) => i.id === 'cs-5');
    expect(noraItem?.detail).toContain('65 mmHg');

    // Vasopressina como 2º vasopressor no choque
    const vasoPhase = sepsisProtocol?.conductPhases[1];
    const vasoItem = vasoPhase?.items.find((i) => i.id === 'cs-7');
    expect(vasoItem?.detail).toContain('vasopressina');
  });
});
