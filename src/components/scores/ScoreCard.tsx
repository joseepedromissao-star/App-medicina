import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  BookOpen,
  RotateCcw,
  CheckCircle,
  HelpCircle,
  Info,
  Check,
  X,
} from 'lucide-react';
import type { ScoreDef, ScoreInterpretationRange } from '../../../types/clinical';
import { ResultBadge } from '../ui/ResultBadge';
import { usePatient } from '../../context/PatientContext';
import { sumScore, interpretScore } from '../../../lib/scores-engine';

interface ScoreCardProps {
  score: ScoreDef;
  onScoreChange?: (totalPoints: number, interpretation: ScoreInterpretationRange | undefined) => void;
  className?: string;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({ score, onScoreChange, className = '' }) => {
  const { patient, isConfirmed } = usePatient();

  // Manual responses: record criterionId -> value (0 or points)
  const [manualResponses, setManualResponses] = useState<Record<string, number>>({});

  // Compute profile suggestions dynamically whenever patient data changes
  const profileSuggestions = useMemo<Record<string, { value: number; reason: string }>>(() => {
    const suggestions: Record<string, { value: number; reason: string }> = {};

    score.criteria.forEach((crit) => {
      // CURB-65
      if (score.id === 'curb_65') {
        // Glasgow < 15 NÃO é confusão mental aguda: NÃO pré-preencher critério 'c'
        if (crit.id === 'r') {
          const val = patient.rr >= 30 ? crit.points : 0;
          suggestions[crit.id] = {
            value: val,
            reason: `FR = ${patient.rr} irpm (${val ? '≥ 30' : '< 30'})`,
          };
        }
        if (crit.id === 'b') {
          const isLow = patient.sbp < 90 || patient.dbp <= 60;
          const val = isLow ? crit.points : 0;
          suggestions[crit.id] = {
            value: val,
            reason: `PA = ${patient.sbp}/${patient.dbp} mmHg (${val ? 'PAS < 90 ou PAD ≤ 60' : 'normal'})`,
          };
        }
        if (crit.id === '65') {
          const isElderly = patient.age >= 65;
          const val = isElderly ? crit.points : 0;
          suggestions[crit.id] = {
            value: val,
            reason: `Idade = ${patient.age} anos (${val ? '≥ 65' : '< 65'})`,
          };
        }
      }

      // qSOFA
      if (score.id === 'qsofa') {
        if (crit.id === 'rr') {
          const val = patient.rr >= 22 ? crit.points : 0;
          suggestions[crit.id] = {
            value: val,
            reason: `FR = ${patient.rr} irpm (${val ? '≥ 22' : '< 22'})`,
          };
        }
        if (crit.id === 'gcs') {
          const val = patient.gcs < 15 ? crit.points : 0;
          suggestions[crit.id] = {
            value: val,
            reason: `Glasgow = ${patient.gcs}/15 (${val ? '< 15' : '15'})`,
          };
        }
        if (crit.id === 'sbp') {
          const val = patient.sbp <= 100 ? crit.points : 0;
          suggestions[crit.id] = {
            value: val,
            reason: `PAS = ${patient.sbp} mmHg (${val ? '≤ 100' : '> 100'})`,
          };
        }
      }

      // HEART score
      if (score.id === 'heart_score' && crit.id === 'age') {
        let val = 0;
        let desc = '< 45 anos';
        if (patient.age >= 65) {
          val = 2;
          desc = '≥ 65 anos';
        } else if (patient.age >= 45) {
          val = 1;
          desc = '45 a 64 anos';
        }
        suggestions[crit.id] = {
          value: val,
          reason: `Idade = ${patient.age} anos (${desc})`,
        };
      }
    });

    return suggestions;
  }, [score.id, score.criteria, patient.age, patient.rr, patient.sbp, patient.dbp, patient.gcs]);

  // Set manual response
  const handleSetResponse = (critId: string, val: number) => {
    setManualResponses((prev) => ({ ...prev, [critId]: val }));
  };

  // Confirm suggested value
  const handleConfirmSuggestion = (critId: string) => {
    const sugg = profileSuggestions[critId];
    if (sugg !== undefined) {
      setManualResponses((prev) => ({ ...prev, [critId]: sugg.value }));
    }
  };

  const handleReset = () => {
    setManualResponses({});
  };

  // Use pure scoring engine
  const calculation = useMemo(() => {
    return sumScore(score, manualResponses, patient, isConfirmed);
  }, [score, manualResponses, patient, isConfirmed]);

  const {
    rawPoints,
    demographicPoints,
    totalScore,
    isComplete,
    unansweredCount,
    answeredCount,
    totalCriteria,
  } = calculation;

  // Stratification interpretation using pure engine
  const { currentInterpretation, isolatedThreeWarning } = useMemo(() => {
    const res = interpretScore(score, totalScore, manualResponses, isComplete);
    return {
      currentInterpretation: res.interpretation,
      isolatedThreeWarning: res.isolatedThreeParamWarning,
    };
  }, [score, totalScore, manualResponses, isComplete]);

  useEffect(() => {
    if (onScoreChange) {
      onScoreChange(totalScore, currentInterpretation);
    }
  }, [totalScore, currentInterpretation, onScoreChange]);

  return (
    <div
      className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5 space-y-5 transition-all duration-150 ${className}`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider text-sky-600 dark:text-sky-400">
              {score.category}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
              {score.acronym}
            </span>
          </div>
          <h3 className="text-xl font-bold font-serif text-slate-900 dark:text-white mt-1">
            {score.name}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xl">
            {score.description}
          </p>
        </div>

        {/* Live Score Counter */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Limpar respostas manuais"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <div className="bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 px-4 py-2 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-sky-600 dark:text-sky-400 block">
              Pontuação
            </span>
            <div className="flex items-baseline justify-center gap-1">
              <span className="font-mono text-2xl font-bold text-sky-900 dark:text-sky-100">
                {totalScore}
              </span>
              {!isComplete && (
                <span className="text-[10px] font-sans text-amber-600 dark:text-amber-400 font-semibold">
                  (incompleto)
                </span>
              )}
            </div>
            {score.id === 'psi_port' && isConfirmed && (
              <span className="text-[10px] text-sky-700 dark:text-sky-300 font-medium block mt-0.5">
                Idade/sexo: +{demographicPoints}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Incomplete Banner */}
      {!isComplete && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Pontuação INCOMPLETA:</strong>{' '}
              {score.id === 'psi_port' && !isConfirmed ? (
                <span>
                  O PSI requer confirmação do perfil do paciente (idade e sexo) para somar os pontos demográficos basilares.
                </span>
              ) : (
                <span>faltam {unansweredCount} critério(s) para estratificação.</span>
              )}
            </span>
          </div>
          <span className="text-[11px] font-mono text-amber-700 dark:text-amber-300 hidden sm:inline">
            {answeredCount}/{totalCriteria} respondidos
          </span>
        </div>
      )}

      {/* Demographic points banner for PSI */}
      {score.id === 'psi_port' && (
        <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 text-xs text-sky-900 dark:text-sky-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-sky-600 shrink-0" />
            <span>
              <strong>Pontos Demográficos (Idade/Sexo):</strong>{' '}
              {isConfirmed ? (
                <span>
                  Paciente {patient.sex === 'M' ? 'homem' : 'mulher'}, {patient.age} anos:{' '}
                  <strong>+{demographicPoints} pontos</strong>{' '}
                  {patient.sex === 'M' ? '(idade em anos)' : '(idade − 10)'}.
                </span>
              ) : (
                <span className="text-amber-700 dark:text-amber-400 font-medium">
                  Perfil não confirmado. Confirme o paciente para computar os pontos demográficos (+idade/sexo).
                </span>
              )}
            </span>
          </div>
          {isConfirmed && (
            <span className="px-2 py-0.5 rounded-md bg-sky-600 text-white font-mono font-bold text-[11px]">
              +{demographicPoints} pts
            </span>
          )}
        </div>
      )}

      {/* Isolated Three Warning Banner for NEWS2 */}
      {isolatedThreeWarning && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>
            <strong>ALERTA DE SEGURANÇA (NEWS2):</strong> {isolatedThreeWarning}. Paciente exige avaliação médica urgente mesmo com pontuação total baixa.
          </span>
        </div>
      )}

      {/* Criteria Selection List */}
      <div className="space-y-3">
        {score.criteria.map((crit) => {
          const manualValue = manualResponses[crit.id];
          const hasManual = manualValue !== undefined;
          const suggestion = profileSuggestions[crit.id];
          const isSuggested = !hasManual && suggestion !== undefined;

          if (crit.type === 'boolean') {
            return (
              <div
                key={crit.id}
                className={`p-3.5 rounded-xl border transition-all duration-150 space-y-2 ${
                  hasManual
                    ? manualValue > 0
                      ? 'border-sky-400 dark:border-sky-700 bg-sky-50/50 dark:bg-sky-950/20'
                      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'
                    : 'border-dashed border-amber-300 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/10'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5 max-w-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {crit.label}
                      </span>
                      <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                        +{crit.points} {crit.points === 1 ? 'pt' : 'pts'}
                      </span>
                    </div>
                    {crit.description && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {crit.description}
                      </p>
                    )}
                  </div>

                  {/* 3-State Radio Group: Não Avaliado | Não (0) | Sim (+pts) */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const next = { ...manualResponses };
                        delete next[crit.id];
                        setManualResponses(next);
                      }}
                      className={`px-2 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                        !hasManual
                          ? 'bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-100 font-bold shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      Não avaliado
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetResponse(crit.id, 0)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                        hasManual && manualValue === 0
                          ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      <X className="w-3 h-3 text-slate-400" />
                      Não (0)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetResponse(crit.id, crit.points)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                        hasManual && manualValue > 0
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      <Check className="w-3 h-3" />
                      Sim (+{crit.points})
                    </button>
                  </div>
                </div>

                {/* Profile Suggestion Banner */}
                {isSuggested && (
                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-300 dark:border-amber-800/80 flex items-center justify-between gap-2 text-xs text-amber-900 dark:text-amber-200">
                    <div className="flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>
                        Sugerido pelo perfil — confirmar: <strong>{suggestion.reason}</strong> (+{suggestion.value} pts)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleConfirmSuggestion(crit.id)}
                      className="px-2 py-0.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold transition cursor-pointer shrink-0"
                    >
                      Confirmar
                    </button>
                  </div>
                )}
              </div>
            );
          }

          // Options / Select Criterion (ex: NEWS2)
          return (
            <div
              key={crit.id}
              className={`p-3.5 rounded-xl border transition-all duration-150 space-y-2 ${
                hasManual
                  ? 'border-sky-400 dark:border-sky-700 bg-sky-50/30 dark:bg-sky-950/20'
                  : 'border-dashed border-amber-300 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/10'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {crit.label}
                  </span>
                  {crit.description && (
                    <p className="text-[11px] text-slate-500">{crit.description}</p>
                  )}
                </div>
                {!hasManual && (
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    Não avaliado
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-1.5">
                {crit.options?.map((opt) => {
                  const isOptSelected = hasManual && manualValue === opt.value;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => handleSetResponse(crit.id, opt.value)}
                      className={`p-2 rounded-xl text-left border text-xs transition cursor-pointer ${
                        isOptSelected
                          ? 'border-sky-600 bg-sky-600 text-white shadow-xs font-semibold'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span>{opt.label}</span>
                        <span
                          className={`font-mono text-[11px] px-1.5 py-0.2 rounded font-bold ${
                            isOptSelected
                              ? 'bg-sky-700 text-white'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          +{opt.value}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Profile Suggestion Banner */}
              {isSuggested && (
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-300 dark:border-amber-800/80 flex items-center justify-between gap-2 text-xs text-amber-900 dark:text-amber-200">
                  <div className="flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>
                      Sugerido pelo perfil — confirmar: <strong>{suggestion.reason}</strong> (+{suggestion.value} pts)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleConfirmSuggestion(crit.id)}
                    className="px-2 py-0.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold transition cursor-pointer shrink-0"
                  >
                    Confirmar
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Real-time Interpretation Banner - ONLY SHOWN WHEN ALL CRITERIA ARE ANSWERED */}
      {isComplete && currentInterpretation ? (
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 space-y-2 animate-in fade-in">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Estratificação & Conduta Recomendada
            </span>
            <ResultBadge severity={currentInterpretation.severity} label={currentInterpretation.label} />
          </div>

          {currentInterpretation.mortalityRisk && (
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Estimativa de Risco / Mortalidade: <span className="text-rose-600 dark:text-rose-400">{currentInterpretation.mortalityRisk}</span>
            </div>
          )}

          <div className="text-xs text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
            <span className="font-semibold text-sky-700 dark:text-sky-300 block mb-0.5">
              Impacto Clínico na Conduta:
            </span>
            {currentInterpretation.recommendation}
          </div>
        </div>
      ) : null}

      {/* Score Reference & Formula Notes */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400 dark:text-slate-500">
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{score.reference}</span>
        </div>
        <div className="text-slate-400">
          População-alvo: {score.targetPopulation}
        </div>
      </div>
      {score.formulaNotes && (
        <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
          <span className="font-semibold text-slate-600 dark:text-slate-300">Regra de cálculo: </span>
          {score.formulaNotes}
        </div>
      )}
    </div>
  );
};
