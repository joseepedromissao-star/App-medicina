/**
 * AuraMed - Suíte de Testes da Fase 5: Metabólico (CAD/EHH e Distúrbios Ácido-Base / Eletrolíticos)
 * Referências: ADA/EASD Consensus 2024, ADA 2026, UK Kidney Association 2023, ESE/ERA
 */

import { describe, it, expect } from 'vitest';
import { CLINICAL_SCORES } from '../data/scores';
import { CLINICAL_PROTOCOLS } from '../data/mock-protocols';

describe('Fase 5 - Metabólico (CAD/EHH e Distúrbios Hidroeletrolíticos / Ácido-Base)', () => {
  // ---------------------------------------------------------------------------
  // 1. CETOACIDOSE DIABÉTICA E ESTADO HIPEROSMOLAR (CAD E EHH)
  // ---------------------------------------------------------------------------
  describe('Emergências Hiperglicêmicas (CAD e EHH)', () => {
    const cadProtocol = CLINICAL_PROTOCOLS.find((p) => p.id === 'emergencias_hiperglicemicas_cad_ehh');
    const cadScore = CLINICAL_SCORES.find((s) => s.id === 'cad_gravidade');
    const ehhScore = CLINICAL_SCORES.find((s) => s.id === 'ehh_criterios');

    it('protocolo registrado com Consenso ADA/EASD 2024 e ADA Standards of Care 2026', () => {
      expect(cadProtocol).toBeDefined();
      expect(cadProtocol?.guidelines?.[0]?.nome).toContain('Consensus Statement on Hyperglycemic Crises');
      expect(cadProtocol?.guidelines?.[0]?.ano).toBe(2024);
      expect(cadProtocol?.guidelines?.[1]?.nome).toContain('Standards of Care in Diabetes');
      expect(cadProtocol?.associatedScores).toContain('cad_gravidade');
      expect(cadProtocol?.associatedScores).toContain('ehh_criterios');
    });

    it('escore de gravidade de CAD estratifica pH, bicarbonato, estado mental e ânion gap', () => {
      expect(cadScore).toBeDefined();
      expect(cadScore?.criteria.length).toBe(4);

      const ph = cadScore?.criteria.find((c) => c.id === 'ph_level');
      expect(ph?.options?.length).toBe(3); // 7.25-7.30, 7.00-7.24, < 7.00

      const hco3 = cadScore?.criteria.find((c) => c.id === 'bicarbonate_level');
      expect(hco3?.options?.length).toBe(3); // 15-18, 10-14, < 10

      const interp = cadScore?.interpretations || [];
      expect(interp.length).toBe(3);
      expect(interp[0].label).toContain('CAD Leve');
      expect(interp[1].label).toContain('CAD Moderada');
      expect(interp[2].label).toContain('CAD Grave');
      expect(interp[2].severity).toBe('critical');
      expect(interp[2].recommendation).toContain('UTI');
    });

    it('critérios de EHH incluem glicemia > 600, osmolalidade efetiva > 320 e ausência de cetoacidose severa', () => {
      expect(ehhScore).toBeDefined();
      expect(ehhScore?.criteria.length).toBe(5);
      expect(ehhScore?.criteria.some((c) => c.id === 'glucose_600')).toBe(true);
      expect(ehhScore?.criteria.some((c) => c.id === 'effective_osm_320')).toBe(true);
      expect(ehhScore?.criteria.some((c) => c.id === 'ph_normal')).toBe(true);
      expect(ehhScore?.criteria.some((c) => c.id === 'ketones_low')).toBe(true);

      const interp = ehhScore?.interpretations || [];
      expect(interp.length).toBe(2);
      expect(interp[1].label).toContain('EHH) CONFIRMADO');
      expect(interp[1].severity).toBe('critical');
      expect(interp[1].recommendation).toContain('RESSUSCITAÇÃO VOLÊMICA');
    });

    it('conduta bloqueia insulina se K+ < 3,5, prevê infusão contínua 0,1 U/kg/h e adição de glicose ~200 mg/dL', () => {
      const phases = cadProtocol?.conductPhases || [];
      expect(phases.length).toBe(3);

      // Regra de ouro do potássio
      const potassiumRule = phases[0]?.items.find((i) => i.id === 'cad-2');
      expect(potassiumRule?.detail).toContain('K+ < 3,5 mEq/L: NÃO INICIAR INSULINA');
      expect(potassiumRule?.detail).toContain('KCl 20 a 40 mEq/h');

      // Infusão contínua de insulina
      const insulinDose = phases[1]?.items.find((i) => i.id === 'cad-3');
      expect(insulinDose?.detail).toContain('0,1 U/kg/h');
      expect(insulinDose?.detail).toContain('50 a 75 mg/dL por hora');

      // Prevenção de hipoglicemia e edema cerebral
      const glucoseAdd = phases[1]?.items.find((i) => i.id === 'cad-4');
      expect(glucoseAdd?.detail).toContain('200 mg/dL');
      expect(glucoseAdd?.detail).toContain('Glicosada');

      // Resolução e sobreposição de basal
      const resolution = phases[2]?.items.find((i) => i.id === 'cad-6');
      expect(resolution?.detail).toContain('2 a 4 horas ANTES de desligar');
    });
  });

  // ---------------------------------------------------------------------------
  // 2. DISTÚRBIOS HIDROELETROLÍTICOS E ÁCIDO-BASE
  // ---------------------------------------------------------------------------
  describe('Distúrbios Eletrolíticos e Ácido-Base (Hipercalemia, Hiponatremia e Gasometria)', () => {
    const eletroProtocol = CLINICAL_PROTOCOLS.find((p) => p.id === 'disturbios_eletroliticos_acidobase');
    const hiperScore = CLINICAL_SCORES.find((s) => s.id === 'hipercalemia_severidade');
    const hipoScore = CLINICAL_SCORES.find((s) => s.id === 'hiponatremia_sintomas');

    it('protocolo registrado com UK Kidney Association 2023 e ESE/ESICM/ERA Guidelines', () => {
      expect(eletroProtocol).toBeDefined();
      expect(
        `${eletroProtocol?.guidelines?.[0]?.nome} ${eletroProtocol?.guidelines?.[0]?.sociedade}`
      ).toContain('UK Kidney Association');
      expect(eletroProtocol?.guidelines?.[0]?.ano).toBe(2023);
      expect(eletroProtocol?.associatedScores).toContain('hipercalemia_severidade');
      expect(eletroProtocol?.associatedScores).toContain('hiponatremia_sintomas');
    });

    it('escore de hipercalemia identifica emergência por K+ >= 6,5 ou alterações eletrocardiográficas', () => {
      expect(hiperScore).toBeDefined();
      expect(hiperScore?.criteria.length).toBe(4);

      const interp = hiperScore?.interpretations || [];
      expect(interp.length).toBe(3);
      expect(interp[2].label).toContain('EMERGÊNCIA HIPERCALÊMICA');
      expect(interp[2].severity).toBe('critical');
      expect(interp[2].recommendation).toContain('Gluconato de Cálcio 10% 30 mL');
      expect(interp[2].recommendation).toContain('Insulina Regular 10 UI em Glicose');
    });

    it('escore de hiponatremia estratifica sintomas graves como indicação imediata de salina a 3% em bólus', () => {
      expect(hipoScore).toBeDefined();
      expect(hipoScore?.criteria.length).toBe(6);
      expect(hipoScore?.criteria.some((c) => c.id === 'severe_convulsion')).toBe(true);
      expect(hipoScore?.criteria.some((c) => c.id === 'severe_coma')).toBe(true);

      const interp = hipoScore?.interpretations || [];
      expect(interp.length).toBe(3);
      expect(interp[0].severity).toBe('low');
      expect(interp[0].recommendation).toContain('NÃO usar salina hipertônica');

      expect(interp[2].severity).toBe('critical');
      expect(interp[2].recommendation).toContain('150 mL de NaCl 3%');
      expect(interp[2].recommendation).toContain('Desmielinização Osmótica');
    });

    it('conduta de hipercalemia estrutura os 3 passos clássicos (cálcio, shift e eliminação)', () => {
      const phases = eletroProtocol?.conductPhases || [];
      const step1 = phases[0]?.items.find((i) => i.id === 'eletro-1');
      expect(step1?.detail).toContain('Gluconato de Cálcio a 10%');
      expect(step1?.detail).toContain('30 mL');

      const step2 = phases[0]?.items.find((i) => i.id === 'eletro-2');
      expect(step2?.detail).toContain('Insulina Regular 10 UI em 50 g de Glicose');
      expect(step2?.detail).toContain('Salbutamol');

      const step3 = phases[0]?.items.find((i) => i.id === 'eletro-3');
      expect(step3?.detail).toContain('Furosemida');
      expect(step3?.detail).toContain('HEMODIÁLISE');
    });

    it('conduta de hiponatremia impõe teto de segurança diário para prevenir mielinólise pontina', () => {
      const phases = eletroProtocol?.conductPhases || [];
      const bolus = phases[1]?.items.find((i) => i.id === 'eletro-4');
      expect(bolus?.detail).toContain('150 mL');
      expect(bolus?.detail).toContain('NaCl 3%');

      const safetyLimit = phases[1]?.items.find((i) => i.id === 'eletro-5');
      expect(safetyLimit?.detail).toContain('10 mEq/L nas primeiras 24 horas');
      expect(
        `${safetyLimit?.title} ${safetyLimit?.detail}`
      ).toContain('Desmielinização Osmótica');
    });
  });
});
