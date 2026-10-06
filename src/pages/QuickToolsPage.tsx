import React from 'react';
import { ArrowLeft, Calculator, Activity, Zap } from 'lucide-react';
import { CalculatorSheet } from '../components/calculators/CalculatorSheet';

export const QuickToolsPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-5">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 dark:text-white">
            Ferramentas Rápidas de Apoio à Decisão
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Motores matemáticos puros para cálculo de taxa de filtração glomerular e titulação de infusões contínuas em bomba (BIC).
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <CalculatorSheet initialTab="tfg" />
      </div>
    </div>
  );
};
