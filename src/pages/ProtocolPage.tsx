import React, { useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Clock,
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  User,
  Sliders,
  Activity,
  FileText,
  Stethoscope,
  ChevronRight,
  Printer,
  Copy,
} from 'lucide-react';
import type { Patologia } from '../../types/clinical';
import { CLINICAL_SCORES } from '../../data/scores';
import { ScoreCard } from '../components/scores/ScoreCard';
import { CalculatorSheet } from '../components/calculators/CalculatorSheet';
import { CondutaPanel } from '../components/conduta/CondutaPanel';
import { ResultBadge, ValidationStatusBadge } from '../components/ui/ResultBadge';
import { usePatient } from '../context/PatientContext';

interface ProtocolPageProps {
  protocolo: Patologia;
  onBack: () => void;
  onOpenPatientDrawer: () => void;
}

export const ProtocolPage: React.FC<ProtocolPageProps> = ({
  protocolo,
  onBack,
  onOpenPatientDrawer,
}) => {
  const { patient, metrics, isConfirmed } = usePatient();
  const [activeTab, setActiveTab] = useState<
    'visao-geral' | 'diagnostico' | 'scores-exames' | 'tratamento' | 'conduta'
  >('visao-geral');

  // Associated scores matching this protocol
  const associatedScoresList = CLINICAL_SCORES.filter((s) =>
    protocolo.associatedScores.includes(s.id)
  );

  return (
    <div className="space-y-8 pb-20">
      {/* 1. SEÇÃO FIXA NO TOPO (Sub-header com dados essenciais) */}
      <div className="sticky top-16 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Voltar à lista de patologias"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold font-serif text-slate-900 dark:text-white leading-tight">
                {protocolo.title}
              </h2>
              {protocolo.cid10 && (
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                  {protocolo.cid10.join(', ')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="hidden md:inline">
                {protocolo.guidelines?.[0]?.nome} ({protocolo.guidelines?.[0]?.ano})
              </span>
              <span className="hidden md:inline">•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>Rev: {protocolo.revisadoEm}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right sub-bar actions */}
        <div className="flex items-center gap-2">
          <ValidationStatusBadge status={protocolo.validacaoClinica} />

          <button
            type="button"
            onClick={onOpenPatientDrawer}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
              !isConfirmed
                ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 hover:bg-amber-100'
                : 'bg-sky-50 dark:bg-sky-950/50 border-sky-300 dark:border-sky-800 text-sky-800 dark:text-sky-200 hover:bg-sky-100'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isConfirmed ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            <User className="w-3.5 h-3.5 shrink-0" />
            <span>{isConfirmed ? `Perfil: ${patient.weightKg} kg` : 'Paciente não confirmado'}</span>
          </button>
        </div>
      </div>

      {/* Main Tabs (Visão geral | Diagnóstico | Scores e exames | Tratamento | Conduta) */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex overflow-x-auto gap-1 sm:gap-2">
        {[
          { id: 'visao-geral', label: '1. Visão Geral' },
          { id: 'diagnostico', label: '2. Diagnóstico' },
          { id: 'scores-exames', label: '3. Scores & Exames' },
          { id: 'tratamento', label: '4. Tratamento' },
          { id: 'conduta', label: '5. Conduta Estratificada' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'border-sky-600 text-sky-600 dark:text-sky-400 dark:border-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ================================================================ */}
      {/* TAB 1: VISÃO GERAL (Introdução & Descrição)                       */}
      {/* ================================================================ */}
      {activeTab === 'visao-geral' && (
        <div className="space-y-8 animate-in fade-in duration-150">
          {/* Target time alert */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300 dark:border-amber-800/80 space-y-1">
            <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300 text-sm">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Janela Terapêutica Alvo: {protocolo.targetTime}</span>
            </div>
            <p className="text-xs text-amber-900 dark:text-amber-200">
              {protocolo.targetTimeWarning}
            </p>
          </div>

          {/* 2. Introdução e Importância Clínica */}
          <section className="space-y-3">
            <h3 className="text-xl font-bold font-serif text-slate-900 dark:text-white">
              Introdução e Importância Clínica
            </h3>
            <div className="prose dark:prose-invert text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-none">
              <p>
                O reconhecimento imediato de {protocolo.title} é determinante para a sobrevida do paciente crítico. O tempo decorrido até a intervenção adequada correlaciona-se inversamente com a taxa de mortalidade e complicações multiorgânicas.
              </p>
            </div>
          </section>

          {/* 3. Descrição da Patologia */}
          <section className="space-y-3 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-xl font-bold font-serif text-slate-900 dark:text-white">
              Definição e Fisiopatologia
            </h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {protocolo.summary}
            </p>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-semibold text-slate-900 dark:text-white block mb-1">
                  Sinônimos Clínicos:
                </span>
                <span className="text-slate-500">{protocolo.synonyms.join(' • ')}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-900 dark:text-white block mb-1">
                  Especialidade e Linha de Cuidado:
                </span>
                <span className="text-slate-500">{protocolo.specialty}</span>
              </div>
            </div>
          </section>

          {/* Guidelines Oficiais */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Diretrizes Oficiais de Referência (Fonte Única de Verdade)
            </h3>
            <div className="space-y-2">
              {protocolo.guidelines?.map((g, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-sky-600" />
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {g.nome} — {g.sociedade} ({g.ano})
                    </span>
                  </div>
                  <ValidationStatusBadge statusRecomendacao={g.status} />
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB 2: DIAGNÓSTICO                                               */}
      {/* ================================================================ */}
      {activeTab === 'diagnostico' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="space-y-1">
            <h3 className="text-xl font-bold font-serif text-slate-900 dark:text-white">
              4. Critérios Diagnósticos & Sinais de Alarme
            </h3>
            <p className="text-xs text-slate-500">
              Quadro clínico, exames confirmatórios e critérios obrigatórios segundo o guideline.
            </p>
          </div>

          {/* Red Flags / Sinais de Alerta */}
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 space-y-2">
            <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-xs uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Sinais de Alarme (Red Flags)</span>
            </div>
            <ul className="text-xs text-rose-950 dark:text-rose-200 space-y-1 list-disc list-inside">
              {protocolo.diagnosticCriteria.redFlags.map((flag, idx) => (
                <li key={idx} className="font-medium">{flag}</li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sintomas Clínicos */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider">
                Quadro Clínico & Apresentação Típica
              </h4>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                {protocolo.diagnosticCriteria.symptoms.map((s, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-600 mt-1.5 shrink-0" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Achados Obrigatórios / Exames */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider">
                Exames Mandatórios & Critérios Formais
              </h4>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                {protocolo.diagnosticCriteria.mandatoryFindings.map((f, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB 3: SCORES E EXAMES                                            */}
      {/* ================================================================ */}
      {activeTab === 'scores-exames' && (
        <div className="space-y-8 animate-in fade-in duration-150">
          <div className="space-y-1">
            <h3 className="text-xl font-bold font-serif text-slate-900 dark:text-white">
              5. Estratificação de Risco & Escores Interativos
            </h3>
            <p className="text-xs text-slate-500">
              Preenchimento instantâneo à beira-leito com sincronização com o perfil do paciente.
            </p>
          </div>

          {/* Interactive Scores */}
          <div className="space-y-6">
            {associatedScoresList.map((scoreDef) => (
              <ScoreCard key={scoreDef.id} score={scoreDef} />
            ))}
          </div>

          {/* Scores planejados para as próximas fases */}
          {protocolo.scoresPlanejados && protocolo.scoresPlanejados.length > 0 && (
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-500 space-y-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                Escores Planejados para Fases Subsequentes:
              </span>
              <span>{protocolo.scoresPlanejados.join(' • ')} (em desenvolvimento no roadmap clínico)</span>
            </div>
          )}

          {/* 6. Calculadoras Laboratoriais e TFG */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-xl font-bold font-serif text-slate-900 dark:text-white">
              6. Calculadoras Laboratoriais Associadas
            </h3>
            <CalculatorSheet initialTab="tfg" />
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB 4: TRATAMENTO & CALCULADORAS DE FÁRMACOS                      */}
      {/* ================================================================ */}
      {activeTab === 'tratamento' && (
        <div className="space-y-8 animate-in fade-in duration-150">
          <div className="space-y-1">
            <h3 className="text-xl font-bold font-serif text-slate-900 dark:text-white">
              7. Tratamento por Gravidade & Recomendações
            </h3>
            <p className="text-xs text-slate-500">
              Esquemas terapêuticos e recomendações oficiais por classe e nível de evidência.
            </p>
          </div>

          {/* Phases summary */}
          <div className="space-y-4">
            {protocolo.conductPhases.map((phase, pIdx) => (
              <div
                key={pIdx}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-sky-600" />
                    <span>{phase.phaseTitle} ({phase.timeWindow})</span>
                  </h4>
                  <span className="text-xs text-slate-400 font-mono">
                    {phase.items.length} intervenções
                  </span>
                </div>

                <div className="space-y-2">
                  {phase.items.map((item, iIdx) => (
                    <div
                      key={iIdx}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex flex-wrap items-start justify-between gap-2 text-xs"
                    >
                      <div className="space-y-0.5 max-w-xl">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {item.title}
                        </span>
                        <p className="text-slate-600 dark:text-slate-300">
                          {item.detail}
                        </p>
                        {item.fonte && (
                          <span className="text-[11px] text-slate-400 font-mono block">
                            Fonte: {item.fonte}
                          </span>
                        )}
                      </div>

                      <ValidationStatusBadge statusRecomendacao={item.statusRecomendacao} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 8. Calculadoras de Medicamentos por Perfil do Paciente */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-xl font-bold font-serif text-slate-900 dark:text-white">
              8. Calculadora de Medicamentos & Doses por Perfil
            </h3>
            <CalculatorSheet
              initialTab="infusao"
              filterDrugId={protocolo.associatedDrugs[0]}
            />
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB 5: CONDUTA ESTRATIFICADA COMPLETA                             */}
      {/* ================================================================ */}
      {activeTab === 'conduta' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="space-y-1">
            <h3 className="text-xl font-bold font-serif text-slate-900 dark:text-white">
              9. Conduta Completa Gerada Automaticamente
            </h3>
            <p className="text-xs text-slate-500">
              Relatório clínico pronto para prontuário, discussão ou impressão, integrando o paciente e as guidelines.
            </p>
          </div>

          <CondutaPanel protocolo={protocolo} />
        </div>
      )}
    </div>
  );
};
