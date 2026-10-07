/**
 * AuraMed - Motor Puro de Cálculo e Interpretação de Escores Clínicos
 * Arquivo: lib/scores-engine.ts
 *
 * Funções puras, determinísticas e sem dependência de React.
 * Suporta regras especiais:
 *  - PSI/PORT: soma demográfica automática a partir do paciente confirmado (Homem: idade; Mulher: idade - 10)
 *  - NEWS2: regra de parâmetro isolado com 3 pontos acionando resposta médica urgente e estratificação por faixas
 *  - ATS/IDSA PAC Grave: 1 critério maior (>= 3 pontos cada) OU >= 3 critérios menores (>= 3 pontos no total)
 */

import type { ScoreDef, ScoreInterpretationRange, PatientData } from '../types/clinical';

export interface ScoreCalculationResult {
  rawPoints: number;
  demographicPoints: number;
  totalScore: number;
  isComplete: boolean;
  unansweredCount: number;
  answeredCount: number;
  totalCriteria: number;
  isolatedThreeParamWarning?: string;
  interpretation?: ScoreInterpretationRange;
}

/**
 * Calcula os pontos demográficos do PSI/PORT:
 * Homem = idade em anos
 * Mulher = idade - 10
 */
export function calculatePsiDemographicPoints(age: number, sex: 'M' | 'F'): number {
  if (sex === 'M') {
    return age;
  }
  return Math.max(0, age - 10);
}

/**
 * Soma pura dos pontos dos critérios respondidos
 */
export function sumScore(
  score: ScoreDef,
  responses: Record<string, number>,
  patient?: PatientData | null,
  isPatientConfirmed?: boolean
): {
  rawPoints: number;
  demographicPoints: number;
  totalScore: number;
  isComplete: boolean;
  unansweredCount: number;
  answeredCount: number;
  totalCriteria: number;
} {
  const totalCriteria = score.criteria.length;
  let answeredCount = 0;
  let rawPoints = 0;

  score.criteria.forEach((crit) => {
    const val = responses[crit.id];
    if (val !== undefined) {
      answeredCount += 1;
      rawPoints += val;
    }
  });

  const unansweredCount = totalCriteria - answeredCount;
  let demographicPoints = 0;

  if (score.id === 'psi_port') {
    if (isPatientConfirmed && patient && Number.isFinite(patient.age) && patient.sex) {
      demographicPoints = calculatePsiDemographicPoints(patient.age, patient.sex);
    }
  }

  // Para o PSI, se não há paciente confirmado, o escore é considerado incompleto
  const isComplete =
    score.id === 'psi_port'
      ? unansweredCount === 0 && Boolean(isPatientConfirmed)
      : unansweredCount === 0;

  const totalScore = rawPoints + demographicPoints;

  return {
    rawPoints,
    demographicPoints,
    totalScore,
    isComplete,
    unansweredCount,
    answeredCount,
    totalCriteria,
  };
}

/**
 * Interpretação estratificada do escore com suporte a regras clínicas específicas
 */
export function interpretScore(
  score: ScoreDef,
  totalPoints: number,
  responses: Record<string, number> = {},
  isComplete: boolean = true
): {
  interpretation?: ScoreInterpretationRange;
  isolatedThreeParamWarning?: string;
} {
  if (!isComplete) {
    return {};
  }

  // 1) NEWS2 - Regras especiais de parâmetro isolado e faixas
  if (score.id === 'news2') {
    const hasIsolatedThree = Object.values(responses).some((v) => v === 3);
    let isolatedWarning: string | undefined;

    if (hasIsolatedThree && totalPoints < 5) {
      isolatedWarning = 'Parâmetro isolado com 3 pontos: resposta urgente';
    }

    // Se tiver parâmetro isolado com 3 pontos e o total for < 5, a recomendação clínica
    // sobe para resposta médica urgente (equivalente à faixa 5-6)
    if (hasIsolatedThree && totalPoints < 5) {
      const urgentInterp = score.interpretations.find((inter) => inter.min === 5 && inter.max === 6);
      if (urgentInterp) {
        return {
          interpretation: {
            ...urgentInterp,
            label: 'Risco Clínico Médio (Parâmetro Isolado = 3)',
            recommendation:
              'Parâmetro isolado com 3 pontos: resposta médica urgente no leito. Avaliação imediata por médico ou equipe de resposta rápida e monitorização intensificada.',
          },
          isolatedThreeParamWarning: isolatedWarning,
        };
      }
    }

    const interp = score.interpretations.find(
      (inter) => totalPoints >= inter.min && totalPoints <= inter.max
    );

    return {
      interpretation: interp,
      isolatedThreeParamWarning: isolatedWarning,
    };
  }

  // 2) ATS/IDSA PAC Grave - 1 maior (3 pts) OU >= 3 menores (>= 3 pts)
  if (score.id === 'ats_idsa_pac_grave') {
    const isSevere = totalPoints >= 3;
    const interp = score.interpretations.find((inter) =>
      isSevere ? inter.min >= 3 : inter.max < 3
    );
    return { interpretation: interp };
  }

  // 3) Demais escores: busca direta por min e max
  const interp = score.interpretations.find(
    (inter) => totalPoints >= inter.min && totalPoints <= inter.max
  );

  return { interpretation: interp };
}

/**
 * Função agregada de conveniência
 */
export function calculateAndInterpretScore(
  score: ScoreDef,
  responses: Record<string, number>,
  patient?: PatientData | null,
  isPatientConfirmed?: boolean
): ScoreCalculationResult {
  const sum = sumScore(score, responses, patient, isPatientConfirmed);
  const { interpretation, isolatedThreeParamWarning } = interpretScore(
    score,
    sum.totalScore,
    responses,
    sum.isComplete
  );

  return {
    ...sum,
    interpretation,
    isolatedThreeParamWarning,
  };
}
