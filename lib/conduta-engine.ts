/**
 * AuraMed - Gerador de Conduta Clínica Estratificada (determinístico, baseado em regras)
 *
 * Garantias:
 *  - Dados do paciente inválidos => NENHUMA dose é calculada (status 'DADOS_INVALIDOS'); a conduta-base é mantida,
 *    com as prescrições marcadas "NÃO CALCULADO".
 *  - Doses/taxas vêm dos presets e do registro de fármacos (nunca de texto digitado no protocolo).
 *  - Alergias, gestação, diálise, insuficiência hepática e sangramento ativo geram alertas;
 *    contraindicações absolutas do registro bloqueiam a prescrição automática.
 *  - Ajuste renal vem do registro de fármacos (limiar por fármaco), não de busca de texto.
 */

import type { ConductActionItem, ConductPhase, PatientData, PatientDerivedMetrics } from '../types/clinical';
import {
  calculateAdjustedWeight,
  calculateCkdEpi2021,
  calculateCockcroftGault,
  calculateDevineIdealWeight,
  classifyKdigoStage,
} from './tfg';
import { calculateInfusionRate, describeDilution, findDefaultPreset } from './infusion';
import { CLINICAL_DRUGS } from '../data/farmacos';
import { ClinicalInputError, LIMITS, checkRange, checkSex } from './validation';

/** Valida os dados do paciente. Devolve a lista de problemas (vazia = ok). */
export function validatePatientData(p: PatientData): string[] {
  const e: string[] = [];
  checkRange(e, 'Idade', p.age, LIMITS.age, 'anos');
  checkSex(e, p.sex);
  checkRange(e, 'Peso', p.weightKg, LIMITS.weightKg, 'kg');
  checkRange(e, 'Altura', p.heightCm, LIMITS.heightCm, 'cm');
  checkRange(e, 'Creatinina', p.creatinineMgDl, LIMITS.creatinineMgDl, 'mg/dL');
  checkRange(e, 'PAS', p.sbp, LIMITS.sbp, 'mmHg');
  checkRange(e, 'PAD', p.dbp, LIMITS.dbp, 'mmHg');
  if (Number.isFinite(p.sbp) && Number.isFinite(p.dbp) && p.dbp > p.sbp) e.push('PAD maior que a PAS.');
  checkRange(e, 'FC', p.hr, LIMITS.hr, 'bpm');
  checkRange(e, 'FR', p.rr, LIMITS.rr, 'irpm');
  checkRange(e, 'SpO2', p.spo2, LIMITS.spo2, '%');
  checkRange(e, 'Glasgow', p.gcs, LIMITS.gcs);
  checkRange(e, 'Temperatura', p.temperature, LIMITS.temperatureC, '°C');
  return e;
}

/** Métricas derivadas. Lança ClinicalInputError se os dados forem inválidos. */
export function derivePatientMetrics(p: PatientData): PatientDerivedMetrics {
  const errors = validatePatientData(p);
  if (errors.length) throw new ClinicalInputError(errors);

  const heightM = p.heightCm / 100;
  const bmi = Number((p.weightKg / (heightM * heightM)).toFixed(1));

  let bmiClass: string;
  if (bmi < 18.5) bmiClass = 'Baixo peso';
  else if (bmi < 25) bmiClass = 'Eutrófico';
  else if (bmi < 30) bmiClass = 'Sobrepeso';
  else if (bmi < 35) bmiClass = 'Obesidade Grau I';
  else if (bmi < 40) bmiClass = 'Obesidade Grau II';
  else bmiClass = 'Obesidade Grau III';

  const bsa = Number(Math.sqrt((p.heightCm * p.weightKg) / 3600).toFixed(2)); // Mosteller
  const idealWeight = calculateDevineIdealWeight(p.heightCm, p.sex);
  const adjustedWeight = calculateAdjustedWeight(p.weightKg, idealWeight);
  const map = Math.round((p.sbp + 2 * p.dbp) / 3);
  const shockIndex = Number((p.hr / p.sbp).toFixed(2));

  const ckd = calculateCkdEpi2021(p.age, p.sex, p.creatinineMgDl);
  const cg = calculateCockcroftGault(p.age, p.sex, p.weightKg, p.heightCm, p.creatinineMgDl);

  return {
    bmi,
    bmiClassification: bmiClass,
    bsa,
    idealBodyWeightKg: idealWeight,
    adjustedBodyWeightKg: adjustedWeight,
    map,
    shockIndex,
    ckdEpi2021Cr: ckd.gfr,
    cockcroftGaultClCr: cg.clcr,
    ckdStage: classifyKdigoStage(ckd.gfr).stage,
  };
}

export interface GeneratedConductReport {
  timestamp: string;
  status: 'COMPLETO' | 'DADOS_INVALIDOS';
  pendencias: string[];
  patientHeader: {
    age: number;
    sex: 'M' | 'F';
    weight: number;
    metrics: PatientDerivedMetrics | null; // null quando os dados são inválidos
  };
  criticalAlerts: string[];
  phases: ConductPhase[];
  clipboardSummary: string;
}

const NAO_CALCULADO = 'NÃO CALCULADO';

function blockItem(item: ConductActionItem, motivo: string): ConductActionItem {
  if (!item.drugPrescription) return item;
  return {
    ...item,
    detail: `${item.detail} [${NAO_CALCULADO}: ${motivo}]`,
    drugPrescription: {
      ...item.drugPrescription,
      calculatedDose: `${NAO_CALCULADO} — ${motivo}`,
      infusionRateMlHr: undefined,
    },
  };
}

function buildAlerts(p: PatientData, m: PatientDerivedMetrics): string[] {
  const alerts: string[] = [];

  if (p.gcs <= 8) {
    alerts.push(
      'ALERTA VIA AÉREA: Glasgow ≤ 8. Avaliar proteção de via aérea (considerar intubação) e investigar causas reversíveis (hipoglicemia, opioides, pós-ictal) antes de decidir.'
    );
  }
  if (m.map < 65) {
    alerts.push(
      `ALERTA HEMODINÂMICO: PAM de ${m.map} mmHg (< 65 mmHg). Identificar o tipo de choque e a causa; a conduta de volume e vasopressor depende do cenário — seguir o protocolo da patologia.`
    );
  }
  if (m.shockIndex > 0.9) {
    alerts.push(`ÍNDICE DE CHOQUE ELEVADO (${m.shockIndex}): sugere choque oculto ou perda volêmica; interpretar com cautela em idosos e em uso de betabloqueador.`);
  }
  if (p.dialysis) {
    alerts.push('PACIENTE EM DIÁLISE: TFG estimada e Cockcroft-Gault não se aplicam; ajustar fármacos pelo protocolo de TRS.');
  } else if (m.ckdEpi2021Cr < 30) {
    alerts.push(
      `ALERTA RENAL (TFG ${m.ckdEpi2021Cr} mL/min/1,73m²): ajustar fármacos de eliminação renal e ponderar risco-benefício de contraste iodado, sem adiar exame essencial. Em lesão renal aguda a creatinina pode subestimar a gravidade.`
    );
  }
  if (p.allergies?.length) {
    alerts.push(`ALERGIAS REGISTRADAS: ${p.allergies.join(', ')}. Conferir cada prescrição, incluindo reatividade cruzada entre classes.`);
  }
  if (p.pregnancy) alerts.push('GESTAÇÃO: confirmar a segurança de cada fármaco e de cada exame antes de prescrever.');
  if (p.liverFailure) alerts.push('INSUFICIÊNCIA HEPÁTICA: revisar fármacos de metabolismo hepático e risco de coagulopatia.');
  if (p.activeBleeding) alerts.push('SANGRAMENTO ATIVO: anticoagulantes e antitrombóticos com prescrição bloqueada neste relatório; revisar com o médico responsável.');

  return alerts;
}

function personalizeItem(item: ConductActionItem, p: PatientData, m: PatientDerivedMetrics, alerts: string[]): ConductActionItem {
  const rx = item.drugPrescription;
  if (!rx) return item;

  const drug = CLINICAL_DRUGS.find((d) => d.id === rx.drugId);

  // 1) Contraindicações absolutas do registro, conforme o paciente
  if (drug?.contraindicacoesAbsolutas?.includes('sangramento_ativo') && p.activeBleeding) {
    return blockItem(item, 'sangramento ativo registrado (contraindicação)');
  }
  if (drug?.contraindicacoesAbsolutas?.includes('gestacao') && p.pregnancy) {
    return blockItem(item, 'gestação registrada (contraindicação)');
  }

  const doubleCheck = rx.safetyDoubleCheck || !!drug?.highAlert.doubleCheckRequired;

  // 2) Infusão contínua: dose inicial do preset padrão do fármaco
  const preset = findDefaultPreset(rx.drugId);
  if (preset) {
    try {
      const calc = calculateInfusionRate(preset, preset.startingDose, preset.requiresWeight ? p.weightKg : undefined);
      calc.warnings.forEach((w) => alerts.push(`${rx.drugName}: ${w}`));
      const pendente = preset.validacaoClinica !== 'VALIDADO' ? ' · validação clínica: PENDENTE' : '';
      const doseTxt = `${preset.startingDose} ${preset.unit}`;
      const weightTxt = preset.requiresWeight ? ` para ${p.weightKg} kg` : '';
      return {
        ...item,
        title: `${item.title} (${calc.rateMlHr} mL/h)`,
        detail: `${item.detail} — Dose inicial de referência${weightTxt}: ${doseTxt} = ${calc.rateMlHr} mL/h na diluição ${describeDilution(preset)}.`,
        drugPrescription: {
          ...rx,
          calculatedDose: `${doseTxt} (BIC: ${calc.rateMlHr} mL/h)${pendente}`,
          infusionRateMlHr: calc.rateMlHr,
          dilution: describeDilution(preset),
          safetyDoubleCheck: true,
        },
      };
    } catch (err) {
      if (err instanceof ClinicalInputError) return blockItem(item, err.errors.join(' '));
      throw err;
    }
  }

  // 3) Dose por peso (ex.: enoxaparina) + ajuste renal vindo do registro
  if (drug && drug.dosingUnit === 'mg/kg' && drug.requiresWeight) {
    const mg = Math.round(drug.usualDoseStart * p.weightKg);
    let interval = drug.intervalHours;
    let renalTxt = '';
    if (drug.renalAdjustment) {
      if (p.dialysis) {
        renalTxt = ' [Paciente em diálise: ajuste por protocolo de TRS]';
      } else if (m.cockcroftGaultClCr < drug.renalAdjustment.thresholdClcrMlMin) {
        interval = drug.renalAdjustment.adjustedIntervalHours ?? interval;
        renalTxt = ` [AJUSTE RENAL: ClCr ${m.cockcroftGaultClCr} mL/min < ${drug.renalAdjustment.thresholdClcrMlMin}. ${drug.renalAdjustment.recommendation}]`;
        alerts.push(`${rx.drugName}: ajuste renal aplicado (ClCr ${m.cockcroftGaultClCr} mL/min).`);
      }
    }
    const pendente = drug.validacaoClinica !== 'VALIDADO' ? ' · validação clínica: PENDENTE' : '';
    const intervalTxt = interval ? ` a cada ${interval} h` : '';
    return {
      ...item,
      detail: `${item.detail}${renalTxt}`,
      drugPrescription: {
        ...rx,
        calculatedDose: `${mg} mg (${drug.usualDoseStart} mg/kg × ${p.weightKg} kg)${intervalTxt}${pendente}`,
        safetyDoubleCheck: doubleCheck,
      },
    };
  }

  // 4) Sem regime no registro: não inventar dose
  if (!rx.calculatedDose?.trim()) {
    return blockItem(item, 'fármaco sem regime validado no registro');
  }
  return { ...item, drugPrescription: { ...rx, safetyDoubleCheck: doubleCheck } };
}

export function generateStratifiedConduct(
  patient: PatientData,
  _conditionId: string,
  conditionTitle: string,
  basePhases: ConductPhase[]
): GeneratedConductReport {
  const now = new Date();
  const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const date = now.toLocaleDateString('pt-BR');

  const errors = validatePatientData(patient);

  // Dados inválidos: conduta-base sem nenhuma dose calculada
  if (errors.length) {
    const phases = basePhases.map((ph) => ({
      ...ph,
      items: ph.items.map((it) => blockItem(it, 'corrija os dados do paciente')),
    }));
    const text =
      `AURAMED - CONDUTA NÃO GERADA (DADOS INVÁLIDOS)\nData: ${date} às ${time} | Protocolo: ${conditionTitle.toUpperCase()}\n\n` +
      `CORRIJA ANTES DE PRESCREVER:\n${errors.map((e) => `[!] ${e}`).join('\n')}\n`;
    return {
      timestamp: `${date} ${time}`,
      status: 'DADOS_INVALIDOS',
      pendencias: errors,
      patientHeader: { age: patient.age, sex: patient.sex, weight: patient.weightKg, metrics: null },
      criticalAlerts: [],
      phases,
      clipboardSummary: text,
    };
  }

  const metrics = derivePatientMetrics(patient);
  const criticalAlerts = buildAlerts(patient, metrics);
  const phases: ConductPhase[] = basePhases.map((ph) => ({
    ...ph,
    items: ph.items.map((it) => personalizeItem(it, patient, metrics, criticalAlerts)),
  }));

  const L: string[] = [];
  L.push('=================================================');
  L.push('AURAMED - CONDUTA CLÍNICA ESTRATIFICADA');
  L.push(`Data: ${date} às ${time} | Protocolo: ${conditionTitle.toUpperCase()}`);
  L.push('=================================================');
  L.push('DADOS DO PACIENTE:');
  L.push(`- Idade: ${patient.age}a | Sexo: ${patient.sex} | Peso: ${patient.weightKg} kg (Devine: ${metrics.idealBodyWeightKg} kg) | Altura: ${patient.heightCm} cm`);
  L.push(`- PA: ${patient.sbp}/${patient.dbp} mmHg (PAM: ${metrics.map}) | FC: ${patient.hr} | FR: ${patient.rr} | SpO2: ${patient.spo2}%`);
  L.push(
    `- Glasgow: ${patient.gcs}/15 | TFG CKD-EPI 2021: ${metrics.ckdEpi2021Cr} mL/min/1,73m² | ClCr Cockcroft-Gault: ${metrics.cockcroftGaultClCr} mL/min` +
      (patient.dialysis ? ' (paciente em diálise: valores não se aplicam)' : '')
  );
  if (criticalAlerts.length) {
    L.push('', 'ALERTAS DE ALTA VIGILÂNCIA:');
    criticalAlerts.forEach((a) => L.push(`[!] ${a}`));
  }
  L.push('', 'PLANO TERAPÊUTICO ESTRATIFICADO:');
  phases.forEach((ph) => {
    L.push('', `[ ${ph.phaseTitle.toUpperCase()} - ${ph.timeWindow} ]`);
    ph.items.forEach((it, i) => {
      L.push(`  ${i + 1}. ${it.title}`, `     ${it.detail}`);
      if (it.drugPrescription) {
        const r = it.drugPrescription;
        L.push(
          `     >> PRESCRIÇÃO: ${r.drugName} | Dose: ${r.calculatedDose} | Via: ${r.route} | Diluição: ${r.dilution} | Dupla checagem: ${r.safetyDoubleCheck ? 'SIM' : 'NÃO'}`
        );
      }
    });
  });
  L.push('', '=================================================');
  L.push('Doses de referência marcadas como "validação clínica: PENDENTE" exigem conferência antes do uso.');
  L.push('Revisão e responsabilidade técnica médica obrigatórias.');

  return {
    timestamp: `${date} ${time}`,
    status: 'COMPLETO',
    pendencias: [],
    patientHeader: { age: patient.age, sex: patient.sex, weight: patient.weightKg, metrics },
    criticalAlerts,
    phases,
    clipboardSummary: L.join('\n'),
  };
}

