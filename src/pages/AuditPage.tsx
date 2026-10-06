import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  FileText,
  AlertOctagon,
  Filter,
  CheckSquare,
  BookOpen,
  HelpCircle,
  ArrowLeft,
} from 'lucide-react';
import {
  MEDICAL_AUDIT_CHECKLIST,
  AUDIT_STATUS_LABELS,
  summarizeAudit,
} from '../../data/medical-audit-checklist';
import type { AuditStatus, MedicalAuditItem } from '../../types/clinical';

export const AuditPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const summary = useMemo(() => summarizeAudit(), []);

  // Separate critical items so they ALWAYS appear at the top!
  const criticalItems = useMemo(() => {
    return MEDICAL_AUDIT_CHECKLIST.filter((i) => i.status === 'ATENCAO_CRITICA');
  }, []);

  const otherItems = useMemo(() => {
    return MEDICAL_AUDIT_CHECKLIST.filter((i) => {
      if (i.status === 'ATENCAO_CRITICA') return false;
      const matchesStatus = selectedStatus === 'all' || i.status === selectedStatus;
      const matchesCategory = selectedCategory === 'all' || i.category === selectedCategory;
      return matchesStatus && matchesCategory;
    });
  }, [selectedStatus, selectedCategory]);

  const categories = useMemo(() => {
    const set = new Set(MEDICAL_AUDIT_CHECKLIST.map((i) => i.category));
    return ['all', ...Array.from(set)];
  }, []);

  const statusBadge = (status: AuditStatus) => {
    switch (status) {
      case 'ATENCAO_CRITICA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 border border-rose-300 dark:border-rose-800">
            <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
            <span>{AUDIT_STATUS_LABELS[status]}</span>
          </span>
        );
      case 'PENDENTE_REVISAO_MEDICA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>{AUDIT_STATUS_LABELS[status]}</span>
          </span>
        );
      case 'CORRIGIDO_AGUARDA_REVISAO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200 border border-sky-300 dark:border-sky-800">
            <CheckCircle className="w-3.5 h-3.5 text-sky-600" />
            <span>{AUDIT_STATUS_LABELS[status]}</span>
          </span>
        );
      case 'VERIFICADO_POR_TESTE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>{AUDIT_STATUS_LABELS[status]}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
            {AUDIT_STATUS_LABELS[status] || status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 dark:text-white">
                Revisão Médica & Checklist de Segurança
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-300">
                Auditoria Ativa
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Rastreamento rigoroso de equações, limiares de scores, regimes posológicos e conformidade com guidelines.
            </p>
          </div>
        </div>
      </div>

      {/* Summary Counters Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider">Atenção Crítica</span>
            <AlertOctagon className="w-4 h-4 text-rose-600" />
          </div>
          <div className="font-mono text-3xl font-extrabold text-rose-700 dark:text-rose-300">
            {summary.ATENCAO_CRITICA}
          </div>
          <span className="text-[11px] opacity-80 block">Resolver antes de usar</span>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider">Pendente Revisão</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="font-mono text-3xl font-extrabold text-amber-700 dark:text-amber-300">
            {summary.PENDENTE_REVISAO_MEDICA}
          </div>
          <span className="text-[11px] opacity-80 block">Decisão médica/farmácia</span>
        </div>

        <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-300 dark:border-sky-800 text-sky-900 dark:text-sky-200 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider">Corrigido</span>
            <CheckCircle className="w-4 h-4 text-sky-600" />
          </div>
          <div className="font-mono text-3xl font-extrabold text-sky-700 dark:text-sky-300">
            {summary.CORRIGIDO_AGUARDA_REVISAO}
          </div>
          <span className="text-[11px] opacity-80 block">Ajustado no código</span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider">Por Teste</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-mono text-3xl font-extrabold text-emerald-700 dark:text-emerald-300">
            {summary.VERIFICADO_POR_TESTE}
          </div>
          <span className="text-[11px] opacity-80 block">Aritmética coberta</span>
        </div>
      </div>

      {/* ================================================================ */}
      {/* 1. SEÇÃO DE ATENÇÃO CRÍTICA (SEMPRE NO TOPO)                      */}
      {/* ================================================================ */}
      {criticalItems.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300">
            <AlertOctagon className="w-5 h-5 text-rose-600" />
            <h2 className="text-xl font-bold font-serif">
              Itens de Atenção Crítica (Resolver Antes de Qualquer Uso Clínico)
            </h2>
          </div>

          <div className="space-y-3">
            {criticalItems.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl border-2 border-rose-400 dark:border-rose-800 bg-rose-50/90 dark:bg-rose-950/40 space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-rose-200 dark:border-rose-800/80 pb-2.5">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300 block">
                      {item.category} • {item.arquivo}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                      {item.item}
                    </h3>
                  </div>
                  {statusBadge(item.status)}
                </div>

                <p className="text-xs text-rose-950 dark:text-rose-200 leading-relaxed font-sans">
                  {item.notes}
                </p>

                {item.acaoNecessaria && (
                  <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-rose-300 dark:border-rose-800 text-xs text-slate-800 dark:text-slate-200">
                    <span className="font-bold text-rose-700 dark:text-rose-400 block mb-0.5">
                      Ação Necessária do Revisor:
                    </span>
                    {item.acaoNecessaria}
                  </div>
                )}

                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                  <span>Referência-Alvo: {item.guidelineReference}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ================================================================ */}
      {/* 2. DEMAIS ITENS COM FILTROS                                      */}
      {/* ================================================================ */}
      <section className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-white">
            Demais Itens do Checklist de Auditoria
          </h2>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 text-xs">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
            >
              <option value="all">Todas as Categorias</option>
              {categories
                .filter((c) => c !== 'all')
                .map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
            >
              <option value="all">Todos os Status</option>
              <option value="PENDENTE_REVISAO_MEDICA">Pendente de Revisão</option>
              <option value="CORRIGIDO_AGUARDA_REVISAO">Corrigido no Código</option>
              <option value="VERIFICADO_POR_TESTE">Verificado por Teste</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {otherItems.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                      {item.category}
                    </span>
                    {item.arquivo && (
                      <span className="text-[10px] font-mono text-slate-400">
                        • {item.arquivo}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                    {item.item}
                  </h3>
                </div>
                {statusBadge(item.status)}
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                {item.notes}
              </p>

              {item.acaoNecessaria && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
                  <span className="font-semibold text-slate-900 dark:text-white block mb-0.5">
                    Ação Necessária:
                  </span>
                  {item.acaoNecessaria}
                </div>
              )}

              {item.testeAutomatizado && item.testeAutomatizado.length > 0 && (
                <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Testes que cobrem: {item.testeAutomatizado.join(', ')}</span>
                </div>
              )}

              <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 pt-1">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Guideline / Referência: {item.guidelineReference}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
