import React, { useState } from 'react';
import { Calculator, X, BookOpen, AlertTriangle, ChevronRight, Check } from 'lucide-react';
import type { CalculationExplanation } from '../../../types/clinical';
import { ResultBadge } from './ResultBadge';

interface ComoCalculeiProps {
  explanation: CalculationExplanation;
  buttonLabel?: string;
  variant?: 'outline' | 'ghost' | 'subtle';
  className?: string;
}

export const ComoCalculei: React.FC<ComoCalculeiProps> = ({
  explanation,
  buttonLabel = 'Como calculei',
  variant = 'outline',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const buttonStyles = {
    outline:
      'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700',
    ghost:
      'text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 border border-transparent',
    subtle:
      'bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700',
  }[variant];

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-xl transition-all duration-150 cursor-pointer ${buttonStyles} ${className}`}
        aria-label={`Ver memória de cálculo para ${explanation.engineName}`}
      >
        <Calculator className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
        <span>{buttonLabel}</span>
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-slate-800 dark:text-slate-100 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider font-semibold text-sky-600 dark:text-sky-400">
                    Memória de Cálculo e Rastreabilidade
                  </span>
                  <ResultBadge severity={explanation.finalResult.severity} size="sm" />
                </div>
                <h3 className="text-xl font-bold font-serif text-slate-900 dark:text-white mt-1">
                  {explanation.engineName}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {explanation.clinicalPurpose}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                aria-label="Fechar janela"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formula Principal */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-1.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block uppercase tracking-wide">
                Equação Fundamental:
              </span>
              <div className="font-mono text-sm font-semibold text-sky-700 dark:text-sky-300 break-words">
                {explanation.primaryEquation}
              </div>
            </div>

            {/* Variáveis Inseridas */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Variáveis Clínicas Utilizadas (Entradas):
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {Object.entries(explanation.variablesUsed).map(([key, val]) => (
                  <div
                    key={key}
                    className="p-2.5 rounded-lg bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between"
                  >
                    <span className="text-slate-600 dark:text-slate-400 font-medium">{key}</span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">{String(val)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Passo a Passo */}
            {explanation.steps.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Passo a Passo da Resolução:
                </h4>
                <div className="space-y-2">
                  {explanation.steps.map((st, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-700/40 text-xs space-y-1"
                    >
                      <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <ChevronRight className="w-3.5 h-3.5 text-sky-600" />
                        <span>{st.label}</span>
                      </div>
                      <div className="pl-5 grid grid-cols-1 sm:grid-cols-2 gap-1 text-slate-600 dark:text-slate-400 font-mono">
                        <div>
                          <span className="text-[11px] text-slate-400 block font-sans">Substituição:</span>
                          <span>{st.valuesSubstituted}</span>
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-400 block font-sans">Subtotal:</span>
                          <span className="text-slate-900 dark:text-slate-100 font-bold">{st.result}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resultado Final Destacado */}
            <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs text-sky-700 dark:text-sky-300 font-medium block">
                  Resultado Final Calculado:
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-300">
                  {explanation.finalResult.interpretation}
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold font-mono text-sky-800 dark:text-sky-200">
                  {explanation.finalResult.value}
                </span>
                <span className="text-xs text-sky-700 dark:text-sky-300 font-medium ml-1">
                  {explanation.finalResult.unit}
                </span>
              </div>
            </div>

            {/* Alerta / Notas */}
            {explanation.warningAlert && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{explanation.warningAlert}</span>
              </div>
            )}

            {/* Fonte Oficial */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
              <BookOpen className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-300">Fonte Clínica Oficial: </span>
                <span>{explanation.reference}</span>
              </div>
            </div>

            {/* Botão Fechar */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
