import React, { useState } from 'react';
import {
  Activity,
  ArrowRight,
  ShieldAlert,
  Clock,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Zap,
  Sliders,
  Sparkles,
  Heart,
  Droplets,
  Stethoscope,
  Filter,
} from 'lucide-react';
import { CLINICAL_PROTOCOLS } from '../../data/mock-protocols';
import { CLINICAL_SCORES } from '../../data/scores';
import { ResultBadge, ValidationStatusBadge } from '../components/ui/ResultBadge';
import { CalculatorSheet } from '../components/calculators/CalculatorSheet';
import { usePatient } from '../context/PatientContext';

interface HomePageProps {
  onSelectProtocol: (id: string) => void;
  onNavigateAudit: () => void;
  onNavigateTools: () => void;
  onNavigatePediatric: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onSelectProtocol,
  onNavigateAudit,
  onNavigateTools,
  onNavigatePediatric,
}) => {
  const { patient, metrics, isConfirmed } = usePatient();
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState('');

  const specialties = [
    { id: 'all', label: 'Todas as Áreas' },
    { id: 'Pediatria', label: 'Pediatria' },
    { id: 'Sepse & Choque', label: 'Sepse & Choque' },
    { id: 'Cardiologia', label: 'Cardiologia' },
    { id: 'Pneumologia', label: 'Pneumologia' },
    { id: 'Emergência Clínica', label: 'Emergência Clínica' },
  ];

  const filteredProtocols = CLINICAL_PROTOCOLS.filter((p) => {
    const matchesSpec = selectedSpecialty === 'all' || p.specialty === selectedSpecialty;
    const matchesQuery =
      searchFilter === '' ||
      p.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.synonyms.some((s) => s.toLowerCase().includes(searchFilter.toLowerCase())) ||
      (p.cid10 && p.cid10.some((c) => c.toLowerCase().includes(searchFilter.toLowerCase())));
    return matchesSpec && matchesQuery;
  });

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white p-8 sm:p-12 shadow-xl border border-slate-800">
        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-300 text-xs font-semibold border border-sky-400/20 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Medicina de Emergência & UTI Baseada em Evidências</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-serif font-black tracking-tight leading-tight">
            Decisão clínica rápida, precisa e rastreável à beira-leito.
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-sans">
            Estratificação de risco em tempo real, escores interativos, motores de dose ajustados por função renal e biometria, e conduta determinística completa em conformidade com as guidelines oficiais.
          </p>

          {/* Quick patient reminder bar */}
          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
              <span
                className={`w-2 h-2 rounded-full ${
                  isConfirmed ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              {isConfirmed ? (
                <>
                  <span>Paciente Ativo: {patient.weightKg} kg</span>
                  <span>• PAM {metrics ? metrics.map : '--'} mmHg</span>
                  <span>• TFG {metrics ? `${metrics.ckdEpi2021Cr} mL/min` : '--'}</span>
                </>
              ) : (
                <span className="text-amber-300">Paciente não confirmado</span>
              )}
            </div>
            <span className="text-slate-500">
              Todos os cálculos rodam exclusivamente em memória local (LGPD).
            </span>
          </div>
        </div>

        {/* Decorative subtle background grid */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-5 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
      </section>

      {/* Specialty Filter & Search Bar */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold font-serif text-slate-900 dark:text-white">
              Protocolos de Emergência & Terapia Intensiva
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Selecione a patologia para abrir a página completa de 9 seções com conduta individualizada.
            </p>
          </div>

          {/* Search box */}
          <div className="w-full sm:w-72">
            <input
              type="text"
              placeholder="Filtrar por nome, CID-10..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Specialty buttons */}
        <div className="flex flex-wrap gap-2">
          {specialties.map((spec) => (
            <button
              key={spec.id}
              type="button"
              onClick={() => setSelectedSpecialty(spec.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                selectedSpecialty === spec.id
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {spec.label}
            </button>
          ))}
        </div>

        {/* Protocols Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
          {/* Cartão Dedicado: PCR Pediátrica */}
          {(selectedSpecialty === 'all' || selectedSpecialty === 'Pediatria') &&
            (searchFilter === '' ||
              'pcr pediátrica'.includes(searchFilter.toLowerCase()) ||
              'pals'.includes(searchFilter.toLowerCase()) ||
              'parada cardíaca pediátrica'.includes(searchFilter.toLowerCase())) && (
              <div className="group rounded-2xl border-2 border-rose-300 dark:border-rose-900/60 bg-gradient-to-br from-rose-50/50 to-white dark:from-slate-900 dark:to-rose-950/20 p-6 shadow-sm hover:shadow-md hover:border-rose-500 transition-all duration-200 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 fill-current" />
                        <span>Pediatria • PALS 2025</span>
                      </span>
                      <h3 className="text-xl font-bold font-serif text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                        PCR Pediátrica
                      </h3>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 shrink-0">
                      Rascunho
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                    Algoritmo de parada cardiorrespiratória pediátrica (AHA/AAP 2025). Cálculo individualizado por peso e faixa etária: epinefrina, amiodarona, lidocaína e energia de desfibrilação com teto estrito.
                  </p>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3 text-xs text-slate-500 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-rose-600" />
                      <span>Desfibrilação imediata</span>
                    </span>
                  </div>
                </div>

                <div className="pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400">
                    Módulo Pediátrico
                  </span>
                  <button
                    type="button"
                    onClick={onNavigatePediatric}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                  >
                    <span>Abrir Módulo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

          {filteredProtocols.map((protocol) => (
            <div
              key={protocol.id}
              className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md hover:border-sky-500/50 transition-all duration-200 flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                      {protocol.specialty}
                    </span>
                    <h3 className="text-xl font-bold font-serif text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                      {protocol.title}
                    </h3>
                  </div>

                  <ResultBadge severity={protocol.severity} size="sm" />
                </div>

                {/* CID and Status Badges */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {protocol.cid10 && protocol.cid10.map((c) => (
                    <span
                      key={c}
                      className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-[10px] font-semibold text-slate-600 dark:text-slate-300"
                    >
                      CID {c}
                    </span>
                  ))}
                  <ValidationStatusBadge status={protocol.validacaoClinica} />
                </div>

                {/* Summary */}
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                  {protocol.summary}
                </p>

                {/* Target Time Callout */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <Clock className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    <span>Tempo-Alvo: {protocol.targetTime}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    {protocol.targetTimeWarning}
                  </p>
                </div>
              </div>

              {/* Action button */}
              <div className="pt-5 mt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">
                  {protocol.conductPhases.length} fases terapêuticas
                </span>

                <button
                  type="button"
                  onClick={() => onSelectProtocol(protocol.id)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  <span>Abrir Conduta</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Ferramentas Rápidas Section (Interactive TFG & Infusion) */}
      <section className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold font-serif text-slate-900 dark:text-white">
              Ferramentas Rápidas de Cálculo
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Taxa de filtração glomerular integrada e conversor dimensional de infusão contínua em bomba (BIC).
            </p>
          </div>

          <button
            type="button"
            onClick={onNavigateTools}
            className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
          >
            <span>Ver Painel Completo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <CalculatorSheet initialTab="tfg" />
      </section>

      {/* Medical Governance & Safety Audit Banner */}
      <section className="rounded-3xl p-6 sm:p-8 bg-amber-500/10 border border-amber-300 dark:border-amber-800/60 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-bold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Segurança Clínica & Fonte Única de Verdade</span>
          </div>
          <h3 className="text-xl font-bold font-serif">
            Acompanhe a Auditoria e os Itens Pendentes de Validação
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Nenhuma dose é inventada ou aproximada. O checklist médico rastreia cada fórmula, regime posológico e versão de guideline. Itens em validação são explicitamente identificados com a etiqueta "Pendente de validação".
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateAudit}
          className="shrink-0 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs transition cursor-pointer flex items-center gap-2"
        >
          <span>Abrir Checklist de Revisão Médica</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>
    </div>
  );
};
