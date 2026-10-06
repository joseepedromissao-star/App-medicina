import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info, ShieldAlert } from 'lucide-react';
import type { SeverityLevel, ValidacaoClinica } from '../../../types/clinical';

interface ResultBadgeProps {
  severity?: SeverityLevel;
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ResultBadge: React.FC<ResultBadgeProps> = ({
  severity = 'normal',
  label,
  className = '',
  size = 'md',
}) => {
  const configs: Record<SeverityLevel, { bg: string; text: string; border: string; icon: React.ReactNode; defaultText: string }> = {
    normal: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800',
      icon: <CheckCircle className="w-3.5 h-3.5 shrink-0" />,
      defaultText: 'Normal / Baixo Risco',
    },
    low: {
      bg: 'bg-sky-50 dark:bg-sky-950/40',
      text: 'text-sky-700 dark:text-sky-300',
      border: 'border-sky-200 dark:border-sky-800',
      icon: <Info className="w-3.5 h-3.5 shrink-0" />,
      defaultText: 'Risco Leve',
    },
    moderate: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800',
      icon: <AlertTriangle className="w-3.5 h-3.5 shrink-0" />,
      defaultText: 'Risco Moderado',
    },
    high: {
      bg: 'bg-orange-50 dark:bg-orange-950/40',
      text: 'text-orange-700 dark:text-orange-300',
      border: 'border-orange-200 dark:border-orange-800',
      icon: <AlertTriangle className="w-3.5 h-3.5 shrink-0" />,
      defaultText: 'Alto Risco',
    },
    critical: {
      bg: 'bg-rose-50 dark:bg-rose-950/50',
      text: 'text-rose-700 dark:text-rose-300 font-semibold',
      border: 'border-rose-300 dark:border-rose-800',
      icon: <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-rose-600 dark:text-rose-400" />,
      defaultText: 'Crítico / Imediato',
    },
  };

  const current = configs[severity] || configs.normal;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : size === 'lg' ? 'px-3 py-1.5 text-sm font-medium' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border shadow-2xs ${current.bg} ${current.text} ${current.border} ${sizeClasses} ${className}`}
    >
      {current.icon}
      <span>{label || current.defaultText}</span>
    </span>
  );
};

export const ValidationStatusBadge: React.FC<{
  status?: ValidacaoClinica;
  statusRecomendacao?: 'CONFIRMADA' | 'VERIFICAR';
  showIcon?: boolean;
  className?: string;
}> = ({ status, statusRecomendacao, showIcon = true, className = '' }) => {
  // 1. Validado (exclusivo para quando um médico/revisor validou o conteúdo)
  if (status === 'VALIDADO') {
    return (
      <span
        title="Conteúdo revisado e validado por profissional médico"
        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium bg-emerald-500/10 text-emerald-700 border border-emerald-300/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700/60 ${className}`}
      >
        {showIcon && <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />}
        <span>Validado</span>
      </span>
    );
  }

  // 2. Guideline conferida (sem validação médica) - NUNCA mostrar "Validado" para CONFIRMADA
  if (statusRecomendacao === 'CONFIRMADA') {
    return (
      <span
        title="Existência e pontos-chave confirmados na guideline oficial (aguarda validação médica assinada)"
        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium bg-sky-500/10 text-sky-700 border border-sky-300/80 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-700/60 ${className}`}
      >
        {showIcon && <Info className="w-3 h-3 text-sky-600 dark:text-sky-400 shrink-0" />}
        <span>Guideline conferida (sem validação médica)</span>
      </span>
    );
  }

  // 3. Verificar na guideline
  if (statusRecomendacao === 'VERIFICAR') {
    return (
      <span
        title="Item pendente de conferência no texto original da diretriz"
        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium bg-amber-500/10 text-amber-700 border border-amber-300/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700/60 ${className}`}
      >
        {showIcon && <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />}
        <span>Verificar na guideline</span>
      </span>
    );
  }

  // 4. Default / PENDENTE: Pendente de validação
  return (
    <span
      title="Este protocolo/fármaco aguarda revisão por médico/farmacêutico"
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium bg-amber-500/10 text-amber-700 border border-amber-300/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700/60 ${className}`}
    >
      {showIcon && <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />}
      <span>Pendente de validação</span>
    </span>
  );
};
