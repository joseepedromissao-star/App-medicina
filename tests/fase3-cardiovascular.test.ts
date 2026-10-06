/**
 * AuraMed - Suíte de Testes da Fase 3: Bloco Cardiovascular
 * Patologias: PCR, IAM (SCA), Taquiarritmias, Bradiarritmias, EAP e Emergência Hipertensiva
 * Referências: AHA 2025, ERC 2025, ESC 2023/2024, DBHA 2025 (SBC)
 */

import { describe, it, expect } from 'vitest';
import { CLINICAL_SCORES } from '../data/scores';
import { CLINICAL_PROTOCOLS } from '../data/mock-protocols';

describe('Fase 3 - Bloco Cardiovascular', () => {
  // ---------------------------------------------------------------------------
  // 1. PARADA CARDIORRESPIRATÓRIA (PCR)
  // ---------------------------------------------------------------------------
  describe('Parada Cardiorrespiratória (Adulto e Pediátrica)', () => {
    const pcrProtocol = CLINICAL_PROTOCOLS.find((p) => p.id === 'pcr_adulto_pediatrica');
    const pcrHt = CLINICAL_SCORES.find((s) => s.id === 'pcr_h_t');

    it('protocolo de PCR está devidamente registrado com as guidelines AHA 2025 e ERC 2025', () => {
      expect(pcrProtocol).toBeDefined();
      expect(pcrProtocol?.guidelines?.[0]?.nome).toContain('AHA');
      expect(pcrProtocol?.guidelines?.[0]?.ano).toBe(2025);
      expect(pcrProtocol?.guidelines?.[1]?.nome).toContain('ERC');
      expect(pcrProtocol?.guidelines?.[1]?.ano).toBe(2025);
      expect(pcrProtocol?.associatedScores).toContain('pcr_h_t');
    });

    it('possui o checklist de causas reversíveis (5H e 5T) com 10 critérios e pesos unitários', () => {
      expect(pcrHt).toBeDefined();
      expect(pcrHt?.criteria.length).toBe(10);
      pcrHt?.criteria.forEach((crit) => {
        expect(crit.points).toBe(1);
      });
      expect(pcrHt?.criteria.some((c) => c.id === 'h_hypoxia')).toBe(true);
      expect(pcrHt?.criteria.some((c) => c.id === 'h_hypovolemia')).toBe(true);
      expect(pcrHt?.criteria.some((c) => c.id === 't_tension_pneumo')).toBe(true);
      expect(pcrHt?.criteria.some((c) => c.id === 't_pulm_thrombosis')).toBe(true);
    });

    it('estratifica o checklist 5H e 5T orientando intervenção imediata para causas identificadas', () => {
      const interp = pcrHt?.interpretations || [];
      expect(interp.length).toBe(3);
      expect(interp[0].min).toBe(0);
      expect(interp[0].max).toBe(0);
      expect(interp[1].min).toBe(1);
      expect(interp[1].severity).toBe('high');
      expect(interp[2].min).toBe(4);
      expect(interp[2].severity).toBe('critical');
      expect(interp[2].recommendation).toContain('E-CPR');
    });

    it('fases de conduta cobrem compressões, ritmos chocáveis/não chocáveis e cuidados pós-RCE', () => {
      const phases = pcrProtocol?.conductPhases || [];
      expect(phases.length).toBe(3);

      // Suporte básico: compressões 100-120/min
      const compressions = phases[0].items.find((i) => i.id === 'pcr-1');
      expect(compressions?.detail).toContain('100 a 120');

      // Medicamentos: adrenalina e amiodarona
      const adrenaline = phases[1].items.find((i) => i.id === 'pcr-4');
      expect(adrenaline?.detail).toContain('Adrenalina 1 mg');

      const amiodarone = phases[1].items.find((i) => i.id === 'pcr-5');
      expect(amiodarone?.detail).toContain('Amiodarona 300 mg');

      // Pós-RCE: PAM >= 65 mmHg e ECG imediato
      const postRce = phases[2].items.find((i) => i.id === 'pcr-7');
      expect(postRce?.detail).toContain('PAM ≥ 65 mmHg');
    });
  });

  // ---------------------------------------------------------------------------
  // 2. IAM / SÍNDROME CORONARIANA AGUDA
  // ---------------------------------------------------------------------------
  describe('IAM / Síndrome Coronariana Aguda (SCA)', () => {
    const scaProtocol = CLINICAL_PROTOCOLS.find((p) => p.id === 'sca_iam_sst');
    const timi = CLINICAL_SCORES.find((s) => s.id === 'timi_sca');
    const grace = CLINICAL_SCORES.find((s) => s.id === 'grace_score');

    it('protocolo de SCA associa HEART, TIMI e GRACE 2.0', () => {
      expect(scaProtocol).toBeDefined();
      expect(scaProtocol?.associatedScores).toContain('heart_score');
      expect(scaProtocol?.associatedScores).toContain('timi_sca');
      expect(scaProtocol?.associatedScores).toContain('grace_score');
    });

    it('Escore TIMI para SCA sem supra possui 7 critérios binários e 3 faixas de risco', () => {
      expect(timi).toBeDefined();
      expect(timi?.criteria.length).toBe(7);
      timi?.criteria.forEach((crit) => {
        expect(crit.points).toBe(1);
      });

      const interp = timi?.interpretations || [];
      expect(interp.length).toBe(3);
      // Baixo risco: 0-2
      expect(interp[0].min).toBe(0);
      expect(interp[0].max).toBe(2);
      expect(interp[0].severity).toBe('low');
      // Intermediário: 3-4
      expect(interp[1].min).toBe(3);
      expect(interp[1].max).toBe(4);
      expect(interp[1].severity).toBe('moderate');
      // Alto risco: 5-7
      expect(interp[2].min).toBe(5);
      expect(interp[2].max).toBe(7);
      expect(interp[2].severity).toBe('critical');
      expect(interp[2].recommendation).toContain('coronariografia precoce');
    });

    it('Escore GRACE 2.0 simplificado possui as variáveis clássicas e corte de alto risco > 140', () => {
      expect(grace).toBeDefined();
      expect(grace?.criteria.length).toBe(8);

      const interp = grace?.interpretations || [];
      expect(interp.length).toBe(3);
      // Baixo risco: <= 108
      expect(interp[0].max).toBe(108);
      expect(interp[0].severity).toBe('low');
      // Intermediário: 109 - 140
      expect(interp[1].min).toBe(109);
      expect(interp[1].max).toBe(140);
      expect(interp[1].severity).toBe('moderate');
      // Alto risco: > 140 (CATE < 24h Classe I)
      expect(interp[2].min).toBe(141);
      expect(interp[2].severity).toBe('critical');
      expect(interp[2].recommendation).toContain('< 24h');
    });
  });

  // ---------------------------------------------------------------------------
  // 3. TAQUIARRITMIAS
  // ---------------------------------------------------------------------------
  describe('Taquiarritmias no Adulto', () => {
    const taquiProtocol = CLINICAL_PROTOCOLS.find((p) => p.id === 'taquiarritmias');
    const instabScore = CLINICAL_SCORES.find((s) => s.id === 'taqui_instabilidade');

    it('protocolo de taquiarritmias está registrado com diretrizes ESC 2024 e AHA 2025', () => {
      expect(taquiProtocol).toBeDefined();
      expect(taquiProtocol?.guidelines?.[0]?.nome).toContain('ESC');
      expect(taquiProtocol?.guidelines?.[0]?.ano).toBe(2024);
      expect(taquiProtocol?.associatedScores).toContain('taqui_instabilidade');
    });

    it('escore de instabilidade avalia os 5 sinais clássicos de instabilidade hemodinâmica', () => {
      expect(instabScore).toBeDefined();
      expect(instabScore?.criteria.length).toBe(5);
      expect(instabScore?.criteria.some((c) => c.id === 'instab_hypotension')).toBe(true);
      expect(instabScore?.criteria.some((c) => c.id === 'instab_sensorium')).toBe(true);
      expect(instabScore?.criteria.some((c) => c.id === 'instab_shock')).toBe(true);
      expect(instabScore?.criteria.some((c) => c.id === 'instab_chest_pain')).toBe(true);
      expect(instabScore?.criteria.some((c) => c.id === 'instab_pulm_edema')).toBe(true);
    });

    it('estratificação dicotômica: 0 = Estável vs >= 1 = Instável com indicação de Cardioversão Elétrica', () => {
      const interp = instabScore?.interpretations || [];
      expect(interp.length).toBe(2);
      expect(interp[0].min).toBe(0);
      expect(interp[0].max).toBe(0);
      expect(interp[0].severity).toBe('low');

      expect(interp[1].min).toBe(1);
      expect(interp[1].max).toBe(5);
      expect(interp[1].severity).toBe('critical');
      expect(interp[1].recommendation).toContain('Cardioversão Elétrica Sincronizada');
    });

    it('conduta contempla manobra vagal, adenosina e amiodarona conforme morfologia do QRS', () => {
      const items = taquiProtocol?.conductPhases[1]?.items || [];
      const tpsv = items.find((i) => i.id === 'taq-3');
      expect(tpsv?.detail).toContain('Adenosina 6 mg');
      expect(tpsv?.detail).toContain('Adenosina 12 mg');

      const tv = items.find((i) => i.id === 'taq-5');
      expect(tv?.detail).toContain('Amiodarona 150 mg');
    });
  });

  // ---------------------------------------------------------------------------
  // 4. BRADIARRITMIAS
  // ---------------------------------------------------------------------------
  describe('Bradiarritmias Sintomáticas no Adulto', () => {
    const bradiProtocol = CLINICAL_PROTOCOLS.find((p) => p.id === 'bradiarritmias');

    it('protocolo de bradiarritmias registrado com AHA 2025 e ERC 2025', () => {
      expect(bradiProtocol).toBeDefined();
      expect(bradiProtocol?.guidelines?.[0]?.nome).toContain('AHA/ACC');
      expect(bradiProtocol?.guidelines?.[0]?.ano).toBe(2025);
    });

    it('conduta inclui Atropina 1 mg (dose máxima de 3 mg) e marca-passo transcutâneo imediato', () => {
      const phases = bradiProtocol?.conductPhases || [];
      const atropine = phases[0]?.items.find((i) => i.id === 'bra-2');
      expect(atropine?.detail).toContain('Atropina 1 mg');
      expect(atropine?.detail).toContain('3 mg');

      const pacer = phases[1]?.items.find((i) => i.id === 'bra-3');
      expect(pacer?.detail.toLowerCase()).toContain('marca-passo transcutâneo');
    });
  });

  // ---------------------------------------------------------------------------
  // 5. EDEMA AGUDO DE PULMÃO (EAP)
  // ---------------------------------------------------------------------------
  describe('Edema Agudo de Pulmão (EAP)', () => {
    const eapProtocol = CLINICAL_PROTOCOLS.find((p) => p.id === 'edema_agudo_pulmao');

    it('protocolo de EAP registrado com diretriz ESC Heart Failure', () => {
      expect(eapProtocol).toBeDefined();
      expect(eapProtocol?.guidelines?.[0]?.nome).toContain('ESC');
    });

    it('conduta prioriza VNI precoce (CPAP/BiPAP), vasodilatadores e contraindica morfina de rotina', () => {
      const phases = eapProtocol?.conductPhases || [];
      const vni = phases[0]?.items.find((i) => i.id === 'eap-2');
      expect(vni?.detail).toContain('CPAP');
      expect(vni?.detail).toContain('BiPAP');

      const vasodilatador = phases[1]?.items.find((i) => i.id === 'eap-3');
      expect(vasodilatador?.detail).toContain('Nitroglicerina');

      const morfina = phases[1]?.items.find((i) => i.id === 'eap-5');
      expect(morfina?.detail.toLowerCase()).toContain('morfina');
      expect(morfina?.detail).toContain('CONTRA o uso rotineiro');
    });
  });

  // ---------------------------------------------------------------------------
  // 6. EMERGÊNCIA HIPERTENSIVA VS HIPERTENSÃO GRAVE
  // ---------------------------------------------------------------------------
  describe('Emergência Hipertensiva vs Hipertensão Grave (DBHA 2025 / SBC)', () => {
    const hiperProtocol = CLINICAL_PROTOCOLS.find((p) => p.id === 'emergencia_hipertensiva');
    const loaScore = CLINICAL_SCORES.find((s) => s.id === 'emergencia_hipertensiva_loa');

    it('protocolo registrado com a Diretriz Brasileira de Hipertensão Arterial 2025 da SBC', () => {
      expect(hiperProtocol).toBeDefined();
      expect(hiperProtocol?.guidelines?.[0]?.nome).toContain('Diretriz Brasileira de Hipertensão Arterial – 2025');
      expect(hiperProtocol?.guidelines?.[0]?.sociedade).toContain('SBC');
      expect(hiperProtocol?.guidelines?.[0]?.ano).toBe(2025);
      expect(hiperProtocol?.associatedScores).toContain('emergencia_hipertensiva_loa');
    });

    it('escore de LOA diferencia rigorosamente Hipertensão Grave (ambulatorial) de Emergência Hipertensiva (UTI)', () => {
      expect(loaScore).toBeDefined();
      expect(loaScore?.criteria.length).toBe(6);

      const interp = loaScore?.interpretations || [];
      expect(interp.length).toBe(2);
      // Sem LOA: 0 pontos
      expect(interp[0].min).toBe(0);
      expect(interp[0].max).toBe(0);
      expect(interp[0].label).toContain('Hipertensão Grave Sem LOA');
      expect(interp[0].recommendation).toContain('NÃO tratar como emergência');
      expect(interp[0].recommendation).toContain('ambulatorial');

      // Com LOA: >= 1 ponto
      expect(interp[1].min).toBe(1);
      expect(interp[1].max).toBe(6);
      expect(interp[1].label).toContain('EMERGÊNCIA HIPERTENSIVA CONFIRMADA');
      expect(interp[1].severity).toBe('critical');
      expect(interp[1].recommendation).toContain('UTI');
      expect(interp[1].recommendation).toContain('vasodilatador intravenoso');
    });

    it('conduta de dissecção aguda de aorta preconiza betabloqueador antes de nitroprussiato e meta PAS < 120 / FC < 60', () => {
      const items = hiperProtocol?.conductPhases[1]?.items || [];
      const dissec = items.find((i) => i.id === 'hip-2');
      expect(dissec?.detail).toContain('PAS < 120 mmHg E Frequência Cardíaca < 60 bpm');
      expect(dissec?.detail).toContain('BETABLOQUEADOR PRIMEIRO');
    });
  });
});
