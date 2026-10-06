/**
 * AuraMed - Suíte de Testes dos Motores Clínicos
 * Validação com vetores clínicos oficiais (KDIGO, Devine, Cockcroft, ISMP)
 */

import { calculateCkdEpi2021, calculateCockcroftGault, calculateDevineIdealWeight, calculateAdjustedWeight } from '../tfg';
import { convertMcgKgMinToMlHr, convertMlHrToMcgKgMin, STANDARD_DRUG_PRESETS } from '../infusion';
import { derivePatientMetrics, generateStratifiedConduct } from '../conduta-engine';
import { PatientData, ConductPhase } from '../../types/clinical';

export interface TestResultItem {
  testSuite: string;
  name: string;
  expected: string;
  actual: string;
  passed: boolean;
  notes?: string;
}

export function runClinicalEngineTests(): {
  total: number;
  passedCount: number;
  failedCount: number;
  allPassed: boolean;
  results: TestResultItem[];
} {
  const results: TestResultItem[] = [];

  // Helper assertion
  function assert(suite: string, name: string, condition: boolean, expected: string, actual: string, notes?: string) {
    results.push({
      testSuite: suite,
      name,
      expected,
      actual,
      passed: condition,
      notes,
    });
  }

  // ==========================================
  // 1. TESTES DO MOTOR TFG: CKD-EPI 2021
  // ==========================================

  // Caso 1: Homem 60a, Scr 1.2 mg/dL
  // κ = 0.9, Scr/κ = 1.333, α = -0.302. Componente max = 1.333^-1.200 ≈ 0.708. 0.9938^60 ≈ 0.688. 142 * 1 * 0.708 * 0.688 ≈ 69 mL/min/1.73m²
  const tfg1 = calculateCkdEpi2021(60, 'M', 1.2);
  assert(
    'TFG CKD-EPI 2021',
    'Homem 60a, Cr 1.2 mg/dL deve resultar em TFG ~68-70 mL/min/1.73m² (Estágio G2)',
    tfg1.gfr >= 68 && tfg1.gfr <= 70,
    '68 - 70 mL/min/1.73m²',
    `${tfg1.gfr} mL/min/1.73m² (KDIGO: ${tfg1.explanation.finalResult.interpretation})`
  );

  // Caso 2: Mulher 75a, Scr 0.8 mg/dL
  // κ = 0.7, Scr/κ = 1.143. Mulher tem fator 1.012
  const tfg2 = calculateCkdEpi2021(75, 'F', 0.8);
  assert(
    'TFG CKD-EPI 2021',
    'Mulher 75a, Cr 0.8 mg/dL deve refletir senescência renal fisiológica (~74-77 mL/min)',
    tfg2.gfr >= 73 && tfg2.gfr <= 78,
    '73 - 78 mL/min/1.73m²',
    `${tfg2.gfr} mL/min/1.73m²`
  );

  // Caso 3: Paciente com insuficiência renal avançada (Mulher 45a, Cr 3.5 mg/dL)
  const tfg3 = calculateCkdEpi2021(45, 'F', 3.5);
  assert(
    'TFG CKD-EPI 2021',
    'Mulher 45a, Cr 3.5 mg/dL deve classificar como DRC Grave (Estágio G4 ou G5, < 20)',
    tfg3.gfr < 20 && tfg3.gfr > 10,
    '< 20 mL/min/1.73m²',
    `${tfg3.gfr} mL/min/1.73m² (Severidade: ${tfg3.explanation.finalResult.severity})`
  );

  // ==========================================
  // 2. TESTES DO MOTOR TFG: COCKCROFT-GAULT
  // ==========================================

  // Caso 4: Peso Ideal Devine Homem 178 cm (178/2,54 = 70,08 polegadas -> 10,08 acima de 5 pés)
  // IBW = 50 + 2.3 * 10,08 = 73,2 kg
  const ibwMale = calculateDevineIdealWeight(178, 'M');
  assert(
    'Cockcroft-Gault & Biometria',
    'Homem 178 cm peso ideal Devine deve ser ~73.2 kg',
    Math.abs(ibwMale - 73.2) < 0.1,
    '73.2 kg',
    `${ibwMale} kg`
  );

  // Caso 5: Paciente Obeso (Mulher 55a, Altura 160 cm, Peso 110 kg, Cr 1.5)
  // IBW Mulher 160cm (~63 polegadas, 3 pol acima de 5ft): 45.5 + 2.3*3 = 52.4 kg
  // Peso real (110kg) > 1.3 * 52.4 (68kg) -> DEVE usar Peso Ajustado ABW
  const cgObese = calculateCockcroftGault(55, 'F', 110, 160, 1.5);
  assert(
    'Cockcroft-Gault & Biometria',
    'Paciente obesa (>130% do IBW) deve usar peso ajustado para evitar superestimar ClCr',
    cgObese.weightType === 'ajustado',
    'ajustado',
    `${cgObese.weightType} (${cgObese.weightUsed} kg utilizados ao invés de 110 kg)`
  );

  // Caso 6: Cockcroft-Gault Homem 60a, 70kg, Cr 1.0
  // Numerador = (140 - 60) * 70 = 5600. Denominador = 72 * 1.0 = 72. ClCr = 5600 / 72 = 77.78 ≈ 78 mL/min
  const cgEutrophic = calculateCockcroftGault(60, 'M', 70, 175, 1.0);
  assert(
    'Cockcroft-Gault & Biometria',
    'Homem 60a, 70kg, Cr 1.0: ClCr = 78 mL/min',
    cgEutrophic.clcr === 78,
    '78 mL/min',
    `${cgEutrophic.clcr} mL/min`
  );

  // ==========================================
  // 3. TESTES DO MOTOR DE INFUSÃO CONTÍNUA
  // ==========================================

  // Caso 7: Noradrenalina 0.1 mcg/kg/min para 70 kg na diluição padrão (16 mcg/mL)
  // Taxa = (0.1 * 70 * 60) / 16 = 420 / 16 = 26.25 ≈ 26.3 mL/h
  const noraCalc = convertMcgKgMinToMlHr(0.1, 70, 16);
  assert(
    'Infusão e Drogas Vasoativas',
    'Noradrenalina 0.1 mcg/kg/min em 70 kg (16 mcg/mL) = 26.3 mL/h na BIC',
    noraCalc.rateMlHr === 26.3 || noraCalc.rateMlHr === 26.2,
    '26.3 mL/h',
    `${noraCalc.rateMlHr} mL/h`
  );

  // Caso 8: Cálculo Reverso: 26.25 mL/h a 16 mcg/mL em 70 kg deve retornar 0.100 mcg/kg/min
  const revCalc = convertMlHrToMcgKgMin(26.25, 70, 16);
  assert(
    'Infusão e Drogas Vasoativas',
    'Cálculo reverso: 26.25 mL/h em 70 kg (16 mcg/mL) deve retornar 0.100 mcg/kg/min',
    Math.abs(revCalc.doseMcgKgMin - 0.1) < 0.005,
    '0.100 mcg/kg/min',
    `${revCalc.doseMcgKgMin} mcg/kg/min`
  );

  // Caso 9: Dobutamina 5.0 mcg/kg/min para 80 kg na diluição de 1000 mcg/mL (250mg em 250mL)
  // Taxa = (5.0 * 80 * 60) / 1000 = 24000 / 1000 = 24.0 mL/h
  const dobutaCalc = convertMcgKgMinToMlHr(5.0, 80, 1000);
  assert(
    'Infusão e Drogas Vasoativas',
    'Dobutamina 5.0 mcg/kg/min em 80 kg (1000 mcg/mL) = 24.0 mL/h',
    dobutaCalc.rateMlHr === 24.0,
    '24.0 mL/h',
    `${dobutaCalc.rateMlHr} mL/h`
  );

  // ==========================================
  // 4. TESTES DO GERADOR DE CONDUTA E ALERTAS
  // ==========================================

  const mockCriticalPatient: PatientData = {
    id: 'test-pt-1',
    age: 68,
    sex: 'M',
    weightKg: 70,
    heightCm: 172,
    sbp: 75,
    dbp: 40, // PAM = (75 + 80) / 3 = 51.6 mmHg (Hipotensão grave)
    hr: 118, // Shock Index = 118 / 75 = 1.57 (> 0.9 choque evidente)
    rr: 28,
    spo2: 89,
    temperature: 38.6,
    gcs: 8, // Glasgow 8 -> alerta de IOT imediata
    creatinineMgDl: 2.2, // TFG reduzida
    allergies: ['Penicilina'],
    pregnancy: false,
    dialysis: false,
    liverFailure: false,
    activeBleeding: false,
  };

  const mockBasePhases: ConductPhase[] = [
    {
      phaseTitle: 'Ressuscitação Inicial',
      timeWindow: '0 - 15 min',
      items: [
        {
          id: 'act-1',
          title: 'Iniciar Vasopressor Precoce',
          detail: 'Alvo PAM ≥ 65 mmHg',
          priority: 'emergency',
          drugPrescription: {
            drugId: 'noradrenalina',
            drugName: 'Noradrenalina',
            calculatedDose: '',
            route: 'EV em BIC contínua',
            dilution: '4mg em 250mL SG5%',
            safetyDoubleCheck: true,
            targetParameter: 'PAM ≥ 65 mmHg',
          },
        },
      ],
    },
  ];

  const conductReport = generateStratifiedConduct(
    mockCriticalPatient,
    'choque_septico',
    'Choque Séptico / Sepsis-3',
    mockBasePhases
  );

  // Alerta de via aérea por Glasgow <= 8
  const hasAirwayAlert = conductReport.criticalAlerts.some((a) => a.includes('VIA AÉREA') && a.includes('Glasgow ≤ 8'));
  assert(
    'Motor de Conduta & Segurança',
    'Paciente com Glasgow 8 deve acionar alerta formal de IOT',
    hasAirwayAlert,
    'Alerta presente',
    hasAirwayAlert ? 'Alerta disparado com sucesso' : 'Alerta ausente'
  );

  // Alerta hemodinâmico por PAM < 65
  const hasHemodynamicAlert = conductReport.criticalAlerts.some((a) => a.includes('HEMODINÂMICO') && a.includes('PAM'));
  assert(
    'Motor de Conduta & Segurança',
    'Paciente hipotenso (PAM 52 mmHg) deve acionar alerta de PAM < 65',
    hasHemodynamicAlert,
    'Alerta presente',
    hasHemodynamicAlert ? 'Alerta disparado com sucesso' : 'Alerta ausente'
  );

  // Cálculo individualizado de taxa de infusão na conduta
  const customizedPrescription = conductReport.phases[0].items[0].drugPrescription;
  const rateCalculated = customizedPrescription?.infusionRateMlHr === 26.3 || customizedPrescription?.infusionRateMlHr === 26.2;
  assert(
    'Motor de Conduta & Segurança',
    'Conduta deve calcular taxa de noradrenalina em mL/h para o peso de 70 kg',
    !!rateCalculated,
    '26.3 mL/h inserido na prescrição',
    `${customizedPrescription?.infusionRateMlHr} mL/h`
  );

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.length - passedCount;

  return {
    total: results.length,
    passedCount,
    failedCount,
    allPassed: failedCount === 0,
    results,
  };
}

