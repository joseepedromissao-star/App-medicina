import React from 'react';
import { ShieldAlert, Users, AlertOctagon, CheckSquare, Sparkles } from 'lucide-react';
import type { Farmaco } from '../../../types/clinical';

interface AlertaAltaVigilanciaProps {
  farmaco?: Farmaco;
  customTitle?: string;
  maxDoseText?: string;
  warningNotes?: string[];
  antidote?: string;
  doubleCheckRequired?: boolean;
}

export const AlertaAltaVigilancia: React.FC<AlertaAltaVigilanciaProps> = ({
  farmaco,
  customTitle,
  maxDoseText,
  warningNotes,
  antidote,
  doubleCheckRequired = true,
}) => {
  const title = customTitle || farmaco?.name || 'Medicamento de Alta Vigilância';
  const notes = warningNotes || farmaco?.highAlert.warningNotes || [];
  const reversal = antidote || farmaco?.highAlert.antidoteOrReversal;
  const ismpClass = farmaco?.highAlert.ismpClass || 'Potencialmente Perigoso (ISMP Brasil)';

  return (
    <div className="rounded-2xl border-2 border-rose-500/80 bg-rose-50/90 dark:bg-rose-950/40 dark:border-rose-700/80 p-4 shadow-sm text-slate-800 dark:text-slate-100 space-y-3">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-200 dark:border-rose-800/60 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-rose-600 text-white shadow-xs">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-rose-800 dark:text-rose-300 text-sm tracking-wide uppercase">
                Alta Vigilância (ISMP Brasil)
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-200/80 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 font-medium">
                {ismpClass}
              </span>
            </div>
            <h4 className="font-semibold text-slate-900 dark:text-white text-base">
              {title}
            </h4>
          </div>
        </div>

        {doubleCheckRequired && (
          <div className="inline-flex items-center gap-1.5 bg-rose-600 text-white px-3 py-1 rounded-xl text-xs font-semibold shadow-xs">
            <Users className="w-4 h-4" />
            <span>Conferir dose com 2 profissionais</span>
          </div>
        )}
      </div>

      {/* Max Dose Warning if available */}
      {maxDoseText && (
        <div className="flex items-center gap-2 text-xs font-semibold bg-rose-100 dark:bg-rose-900/40 text-rose-900 dark:text-rose-200 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800">
          <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
          <span>Dose Máxima Recomendada: <span className="font-mono">{maxDoseText}</span></span>
        </div>
      )}

      {/* Warning bullets */}
      {notes.length > 0 && (
        <ul className="text-xs space-y-1.5 text-rose-950 dark:text-rose-200/90 pl-1">
          {notes.map((note, idx) => (
            <li key={idx} className="flex items-start gap-1.5">
              <span className="text-rose-600 dark:text-rose-400 font-bold shrink-0">•</span>
              <span>{note}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Reversal / Antidote */}
      {reversal && (
        <div className="text-xs bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-xl border border-rose-200/60 dark:border-rose-800/40 text-slate-700 dark:text-slate-300">
          <span className="font-semibold text-rose-700 dark:text-rose-400">Conduta em extravasamento / toxicidade: </span>
          {reversal}
        </div>
      )}
    </div>
  );
};
