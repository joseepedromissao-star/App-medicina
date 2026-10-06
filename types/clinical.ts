/**
 * AuraMed Emergência & UTI - Schemas de Tipagem Clínica
 * Referências-alvo: KDIGO, Surviving Sepsis Campaign 2026, ATS 2025, AHA/ACC, SBC, ISMP Brasil.
 * Cada versão de guideline deve ser confirmada pelo revisor médico (ver campos fonte/validacaoClinica).
 */

export type SeverityLevel = 'normal' | 'low' | 'moderate' | 'high' | 'critical';

export interface PatientData {
  id: string;
  age: number;
  sex: 'M' | 'F';
  weightKg: number;
  heightCm: number;
  // Sinais Vitais
  sbp: number; // Pressão Sistólica (mmHg)
  dbp: number; // Pressão Diastólica (mmHg)
  hr: number;  // Frequência Cardíaca (bpm)
  rr: number;  // Frequência Respiratória (irpm)
  spo2: number; // Saturação O2 (%)
  temperature: number; // Temperatura axilar (°C)
  gcs: number; // Escala de Coma de Glasgow (3-15)
  // Laboratório
  creatinineMgDl: number; // Creatinina sérica (mg/dL)
  lactateMmolL?: number; // Lactato sérico (mmol/L)
  ph?: number; // Gasometria arterial pH
  pco2?: number; // Gasometria arterial pCO2 (mmHg)
  hco3?: number; // Gasometria arterial HCO3- (mEq/L)
  pao2?: number; // PaO2 (mmHg)
  fio2?: number; // FiO2 fração (0.21 - 1.0)
  platelets?: number; // Plaquetas (/mm³)
  // Histórico e Alergias
  allergies: string[];
  pregnancy: boolean;
  dialysis: boolean;
  liverFailure: boolean;
  activeBleeding: boolean;
}

export interface PatientDerivedMetrics {
  bmi: number; // IMC kg/m²
  bmiClassification: string;
  bsa: number; // Superfície Corpórea m² (Mosteller)
  idealBodyWeightKg: number; // Peso Ideal (Devine)
  adjustedBodyWeightKg: number; // Peso Ajustado para Obesos
  map: number; // Pressão Arterial Média (mmHg)
  shockIndex: number; // Índice de Choque (FC/PAS)
  ckdEpi2021Cr: number; // TFG CKD-EPI 2021 (mL/min/1.73m²)
  cockcroftGaultClCr: number; // Clearance Creatinina Cockcroft-Gault (mL/min)
  ckdStage: string;
}

export interface FormulaStep {
  label: string;
  formula: string;
  valuesSubstituted: string;
  result: string;
}

export interface CalculationExplanation {
  engineName: string;
  clinicalPurpose: string;
  reference: string;
  primaryEquation: string;
  variablesUsed: Record<string, string | number>;
  steps: FormulaStep[];
  finalResult: {
    value: number;
    unit: string;
    interpretation: string;
    severity: SeverityLevel;
  };
  clinicalNotes?: string[];
  warningAlert?: string;
}

export interface ScoreCriterionOption {
  value: number;
  label: string;
  hint?: string;
}

export interface ScoreCriterion {
  id: string;
  label: string;
  description?: string;
  points: number; // ou custom selection
  type: 'boolean' | 'options';
  options?: ScoreCriterionOption[];
}

export interface ScoreInterpretationRange {
  min: number;
  max: number;
  label: string;
  severity: SeverityLevel;
  mortalityRisk?: string;
  recommendation: string;
}

export interface ScoreDef {
  id: string;
  name: string;
  acronym: string;
  category: 'Pneumologia / Infeccioso' | 'Cardiologia' | 'Sepse / Hemodinâmica' | 'Neurologia' | 'Nefrologia';
  reference: string;
  description: string;
  targetPopulation: string;
  criteria: ScoreCriterion[];
  interpretations: ScoreInterpretationRange[];
  formulaNotes: string;
}

export type ValidacaoClinica = 'VALIDADO' | 'PENDENTE';

export interface DrugDilution {
  presetName: string;
  amount: number; // quantidade total de fármaco na bolsa
  amountUnit: 'mg' | 'UI';
  diluentVolumeMl: number; // volume final da solução
  diluentType: 'SG 5%' | 'SF 0.9%' | 'Pura';
  concentration: number; // derivada de amount ÷ volume
  concentrationUnit: 'mcg/mL' | 'UI/mL';
  isConcentratedLine?: boolean;
}

export interface Farmaco {
  id: string;
  name: string;
  brandNames: string[];
  drugClass: string;
  indication: string;
  dosingUnit: 'mcg/kg/min' | 'mcg/min' | 'mg/h' | 'mg/kg' | 'UI/min';
  requiresWeight: boolean;
  minDose: number;
  maxDose: number;
  usualDoseStart: number;
  doseTitrationStep?: string;
  standardDilutions: DrugDilution[];
  fonte: string; // guideline/bula usada para as doses
  validacaoClinica: ValidacaoClinica;
  intervalHours?: number; // intervalo habitual (fármacos de dose intermitente)
  contraindicacoesAbsolutas?: ('sangramento_ativo' | 'gestacao')[]; // bloqueiam a prescrição automática
  highAlert: {
    isHighAlert: boolean;
    ismpClass: string;
    doubleCheckRequired: boolean;
    extravasationRisk: boolean;
    antidoteOrReversal?: string;
    warningNotes: string[];
  };
  renalAdjustment?: {
    thresholdClcrMlMin: number; // Cockcroft-Gault (mL/min)
    recommendation: string;
    adjustedIntervalHours?: number;
  };
  hemodynamicGoal?: string;
}

export interface ConductActionItem {
  id: string;
  title: string;
  detail: string;
  timing?: string;
  priority: 'emergency' | 'high' | 'routine';
  evidenceLevel?: 'Classe I, NE A' | 'Classe I, NE B' | 'Classe IIa' | 'Diretriz';
  fonte?: string; // guideline (nome + ano) que sustenta a recomendação
  statusRecomendacao?: 'CONFIRMADA' | 'VERIFICAR'; // VERIFICAR = conferir no texto original antes de usar
  drugPrescription?: {
    drugId: string;
    drugName: string;
    calculatedDose: string;
    infusionRateMlHr?: number;
    route: 'EV em BIC contínua' | 'EV em bólus' | 'VO' | 'SC';
    dilution: string;
    safetyDoubleCheck: boolean;
    targetParameter: string;
  };
}

export interface ConductPhase {
  phaseTitle: string;
  timeWindow: string;
  items: ConductActionItem[];
}

export interface GuidelineRef {
  nome: string;
  sociedade: string;
  ano: number;
  status: 'CONFIRMADA' | 'VERIFICAR'; // CONFIRMADA = existência e pontos-chave conferidos; VERIFICAR = conferir antes de usar
}

export interface Patologia {
  id: string;
  title: string;
  cid10?: string[];
  guidelines?: GuidelineRef[];
  revisadoEm?: string; // AAAA-MM-DD
  validacaoClinica?: ValidacaoClinica;
  scoresPlanejados?: string[]; // scores previstos, ainda não implementados em scores.ts
  synonyms: string[];
  specialty: 'Cardiologia' | 'Emergência Clínica' | 'Pneumologia' | 'Neurologia' | 'Sepse & Choque';
  targetTime: string; // Ex: "Porta-agulha < 30min"
  targetTimeWarning: string;
  statusBadge: 'Protocolo Institucional' | 'Alta Prioridade' | 'Padrão Ouro';
  severity: SeverityLevel;
  summary: string;
  diagnosticCriteria: {
    symptoms: string[];
    mandatoryFindings: string[];
    redFlags: string[];
  };
  associatedScores: string[];
  associatedDrugs: string[];
  conductPhases: ConductPhase[];
  icuAdmissionCriteria: string[];
  references: string[];
}

/**
 * Significado dos status:
 *  - VERIFICADO_POR_TESTE: a ARITMÉTICA/regra de software é coberta por teste automatizado (não é validação clínica).
 *  - CORRIGIDO_AGUARDA_REVISAO: problema corrigido no código; o conteúdo clínico ainda precisa de revisão médica.
 *  - PENDENTE_REVISAO_MEDICA: depende de decisão/conferência de médico ou farmacêutico.
 *  - ATENCAO_CRITICA: risco conhecido ainda NÃO resolvido; resolver antes de qualquer uso.
 *  - VERIFICADO_PELO_MOTOR: obsoleto (mantido só por compatibilidade); não usar.
 */
export type AuditStatus =
  | 'VERIFICADO_POR_TESTE'
  | 'CORRIGIDO_AGUARDA_REVISAO'
  | 'PENDENTE_REVISAO_MEDICA'
  | 'ATENCAO_CRITICA'
  | 'VERIFICADO_PELO_MOTOR';

export interface MedicalAuditItem {
  id: string;
  category:
    | 'Fórmula Matemática'
    | 'Dose de Fármaco'
    | 'Tempo-Alvo'
    | 'Estratificação de Risco'
    | 'Conteúdo Clínico'
    | 'Segurança do Software';
  item: string;
  guidelineReference: string;
  status: AuditStatus;
  notes: string;
  acaoNecessaria?: string; // o que o revisor precisa decidir/conferir
  testeAutomatizado?: string[]; // nomes dos testes que cobrem o item
  arquivo?: string; // arquivo afetado
}

