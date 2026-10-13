import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Heart,
  Zap,
  AlertTriangle,
  ShieldAlert,
  Info,
  CheckCircle,
  Clock,
  Sparkles,
  HelpCircle,
  UserCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  calculatePediatricArrest,
  PEDIATRIC_SCOPE_NOTE,
  PEDIATRIC_AGE_BANDS,
  type PediatricArrestResult,
  type PedDoseItem,
  type PedDefibrillation,
  type WeightOrigin,
  ClinicalInputError,
} from '../../lib/pediatric';
import { usePediatric } from '../context/PediatricContext';
import { ComoCalculei } from '../components/ui/ComoCalculei';

interface PediatricArrestPageProps {
  onBack: () => void;
}

export const PediatricArrestPage: React.FC<PediatricArrestPageProps> = ({ onBack }) => {
  const {
    pediatricPatient,
    updatePediatricPatient,
    isPediatricConfirmed,
    confirmPediatricPatient,
    unconfirmPediatricPatient,
    pediatricInput,
  } = usePediatric();

  // Local calculation with try/catch for ClinicalInputError
  const { resultado, erros } = useMemo<{
    resultado: PediatricArrestResult | null;
    erros: string[];
  }>(() => {
    if (!pediatricInput) {
      return { resultado: null, erros: [] };
    }
    try {
      const res = calculatePediatricArrest(pediatricInput);
      return { resultado: res, erros: [] };
    } catch (err) {
      if (err instanceof ClinicalInputError) {
        return { resultado: null, erros: err.errors };
      }
      return { resultado: null, erros: ['Erro de validação clínica na entrada pediátrica.'] };
    }
  }, [pediatricInput]);

  // Checagem se todos os dados obrigatórios foram informados
  const isFormFilled =
    (pediatricPatient.ageYears !== '' || pediatricPatient.ageExtraMonths !== '') &&
    pediatricPatient.ageMonths !== null &&
    typeof pediatricPatient.weightKg === 'number' &&
    pediatricPatient.weightKg > 0 &&
    (pediatricPatient.weightOrigin === 'medido' || pediatricPatient.weightOrigin === 'estimado');

  const canConfirm = isFormFilled && erros.length === 0 && resultado !== null;

  return (
    <div className="space-y-8 pb-20">
      {/* 1. FAIXA FIXA NO TOPO: Rascunho não revisado */}
      <div className="rounded-2xl border-2 border-rose-500 bg-rose-50 dark:bg-rose-950/40 p-4 text-rose-950 dark:text-rose-100 flex items-center gap-3 shadow-sm">
        <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-black uppercase tracking-wider">
            Rascunho não revisado — não usar clinicamente
          </p>
          <p className="text-xs text-rose-800 dark:text-rose-300 mt-0.5">
            Módulo em desenvolvimento e validação contínua. Não utilize para suporte a decisões médicas reais.
          </p>
        </div>
      </div>

      {/* 2. Sub-header de Navegação e Título */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300">
                <Heart className="w-5 h-5 fill-current" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 dark:text-white">
                PCR Pediátrica
              </h1>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                PALS 2025
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Parada Cardiorrespiratória Pediátrica • Algoritmo AHA/AAP 2025
            </p>
          </div>
        </div>

        {/* Estado de confirmação do paciente pediátrico */}
        <div className="flex items-center gap-2">
          {isPediatricConfirmed ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Paciente Pediátrico Confirmado ({pediatricPatient.weightKg} kg)</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Paciente não confirmado (doses ocultas)</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. PEDIATRIC_SCOPE_NOTE */}
      <div className="rounded-2xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/70 dark:bg-sky-950/30 p-4 text-xs text-sky-900 dark:text-sky-200 flex items-start gap-3">
        <Info className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold uppercase tracking-wider text-[11px] text-sky-800 dark:text-sky-300">
            Escopo Clínico do Módulo Pediátrico
          </p>
          <p className="leading-relaxed">{PEDIATRIC_SCOPE_NOTE}</p>
        </div>
      </div>

      {/* 4. FORMULÁRIO DE ENTRADA DO PACIENTE PEDIÁTRICO */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold font-serif text-slate-900 dark:text-white">
              Perfil do Paciente Pediátrico
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Idade em anos e meses (convertida internamente para meses) e peso com origem obrigatória.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isPediatricConfirmed ? (
              <button
                type="button"
                onClick={confirmPediatricPatient}
                disabled={!canConfirm}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <UserCheck className="w-4 h-4" />
                <span>Confirmar Dados para Liberar Doses</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={unconfirmPediatricPatient}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition cursor-pointer"
              >
                Desconfirmar / Editar
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Idade: Anos */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Idade (Anos)
            </label>
            <input
              type="number"
              min="0"
              max="17"
              placeholder="Ex: 4"
              value={pediatricPatient.ageYears}
              onChange={(e) => {
                const val = e.target.value.trim();
                updatePediatricPatient({
                  ageYears: val === '' ? '' : Math.max(0, parseInt(val, 10) || 0),
                });
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Idade: Meses adicionais */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Meses adicionais (0–11)
            </label>
            <input
              type="number"
              min="0"
              max="11"
              placeholder="0"
              value={pediatricPatient.ageExtraMonths}
              onChange={(e) => {
                const val = e.target.value.trim();
                updatePediatricPatient({
                  ageExtraMonths: val === '' ? '' : Math.max(0, Math.min(11, parseInt(val, 10) || 0)),
                });
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-sky-500"
            />
            <span className="text-[10px] text-slate-400 font-mono block">
              {pediatricPatient.ageMonths !== null
                ? `Total: ${pediatricPatient.ageMonths} meses`
                : 'Informe a idade'}
            </span>
          </div>

          {/* Peso */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Peso (kg)
            </label>
            <input
              type="number"
              step="0.1"
              min="1"
              max="200"
              placeholder="Ex: 15"
              value={pediatricPatient.weightKg}
              onChange={(e) => {
                const val = e.target.value.trim();
                updatePediatricPatient({
                  weightKg: val === '' ? '' : parseFloat(val) || 0,
                });
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Origem do peso */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Origem do Peso
            </label>
            <select
              value={pediatricPatient.weightOrigin}
              onChange={(e) =>
                updatePediatricPatient({
                  weightOrigin: (e.target.value as WeightOrigin) || '',
                })
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              <option value="">Selecione a origem...</option>
              <option value="medido">Medido (Balança / Confiável)</option>
              <option value="estimado">Estimado (Fita / Idade)</option>
            </select>
            <span className="text-[10px] text-slate-400 block">
              {!pediatricPatient.weightOrigin
                ? 'Campo obrigatório'
                : pediatricPatient.weightOrigin === 'estimado'
                ? 'Gera alerta no cálculo'
                : 'Preferível'}
            </span>
          </div>
        </div>

        {/* Faixa Etária detectada */}
        {resultado && (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-400 font-medium">
              Faixa de Plausibilidade Etária:
            </span>
            <span className="font-bold text-slate-900 dark:text-white font-mono">
              {resultado.band.label} (faixa plausível: {resultado.band.weightKg[0]} a {resultado.band.weightKg[1]} kg)
            </span>
          </div>
        )}

        {/* Erros de validação (ClinicalInputError) */}
        {erros.length > 0 && (
          <div className="p-4 rounded-xl border border-rose-300 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-xs text-rose-900 dark:text-rose-200 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider text-[11px]">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Entrada Inválida pelo Motor Pediátrico:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 font-mono text-[11px]">
              {erros.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Avisos clínicos do motor pediátrico */}
        {resultado && resultado.warnings.length > 0 && (
          <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40 text-xs text-amber-900 dark:text-amber-200 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300 text-[11px] uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Avisos do Motor Pediátrico:</span>
            </div>
            {resultado.warnings.map((w, idx) => (
              <p key={idx} className="font-medium leading-relaxed">
                • {w}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* 5. ÁREA DE DOSES E CHOQUES (LIBERADA APENAS COM PACIENTE CONFIRMADO) */}
      {!isPediatricConfirmed ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-800 p-12 text-center space-y-4 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h4 className="text-base font-bold text-slate-900 dark:text-white font-serif">
              Doses e Choques Ocultos
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Para prevenção de erros de medicação por peso incorreto, confirme os dados do paciente pediátrico acima clicando em <strong>Confirmar Dados para Liberar Doses</strong>.
            </p>
          </div>
        </div>
      ) : resultado ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold font-serif text-slate-900 dark:text-white">
              Conduta Farmacológica & Desfibrilação na PCR Pediátrica
            </h3>
            <span className="text-xs font-mono text-slate-500">
              Peso base: {resultado.weightKg} kg ({resultado.weightOrigin})
            </span>
          </div>

          {/* CARTÃO DE DESFIBRILAÇÃO */}
          <DefibrillationCard defibrillation={resultado.defibrillation} weightKg={resultado.weightKg} />

          {/* CARTÕES DE FÁRMACOS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {resultado.items.map((item) => (
              <PediatricDoseCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Componente de Cartão de Desfibrilação
// -----------------------------------------------------------------------------
const DefibrillationCard: React.FC<{ defibrillation: PedDefibrillation; weightKg: number }> = ({
  defibrillation,
  weightKg,
}) => {
  return (
    <div className="rounded-2xl border-2 border-amber-300 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-900 dark:to-amber-950/20 p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 dark:border-amber-900/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500 text-white">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h4 className="text-base font-bold font-serif text-slate-900 dark:text-white">
              Energia de Desfibrilação (Ritmo Chocável: FV / TV sem pulso)
            </h4>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              PALS 2025 • Bifásico com pás pediátricas adequadas
            </span>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
          Guideline conferida (sem validação médica)
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 1º Choque */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-amber-200 dark:border-slate-700 space-y-1">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
            1º Choque (2 J/kg)
          </span>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
            {defibrillation.firstJ} J
          </p>
          <span className="text-[10px] text-slate-400 font-mono">
            2 J/kg × {weightKg} kg
          </span>
        </div>

        {/* 2º Choque */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-amber-200 dark:border-slate-700 space-y-1">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
            2º Choque (4 J/kg)
          </span>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
            {defibrillation.secondJ} J
          </p>
          <span className="text-[10px] text-slate-400 font-mono">
            4 J/kg × {weightKg} kg
          </span>
        </div>

        {/* Choques Seguintes */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-amber-200 dark:border-slate-700 space-y-1">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
            Choques Seguintes
          </span>
          <p className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
            {defibrillation.subsequentMinJ} a {defibrillation.subsequentMaxJ} J
          </p>
          <span className="text-[10px] text-slate-400 font-mono">
            ≥ 4 J/kg até 10 J/kg (máx adulto)
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-white/70 dark:bg-slate-800/50 p-3 rounded-xl border border-amber-100 dark:border-slate-800">
        <strong>Regra de segurança:</strong> {defibrillation.nota}
      </p>

      {/* Selo ao lado da fonte */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-amber-200/60 dark:border-slate-800 text-[11px]">
        <span className="text-slate-500 dark:text-slate-400 font-mono">
          Fonte: Algoritmo de PCR Pediátrica, PALS 2025 (AHA/AAP)
        </span>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
          Pendente de validação
        </span>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Componente de Cartão de Fármaco Pediátrico
// -----------------------------------------------------------------------------
const PediatricDoseCard: React.FC<{ item: PedDoseItem }> = ({ item }) => {
  const [showHow, setShowHow] = useState(false);

  const statusLabel =
    item.statusRecomendacao === 'CONFIRMADA'
      ? 'Guideline conferida (sem validação médica)'
      : 'Verificar na guideline';

  const statusColor =
    item.statusRecomendacao === 'CONFIRMADA'
      ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800'
      : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800';

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between space-y-4">
      <div className="space-y-3">
        {/* Top line with status badge */}
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-base font-bold font-serif text-slate-900 dark:text-white">
            {item.nome}
          </h4>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shrink-0 ${statusColor}`}
          >
            {statusLabel}
          </span>
        </div>

        {/* Dose calculada em destaque */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Dose Prescrita
          </span>
          <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono leading-tight">
            {item.doseTexto}
          </p>
          {item.volumeMl !== undefined && (
            <p className="text-xs text-sky-700 dark:text-sky-300 font-mono font-semibold">
              Volume: {item.volumeMl} mL ({item.concentracao})
            </p>
          )}
        </div>

        {/* Aviso de teto aplicado */}
        {item.tetoAplicado && (
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2 font-semibold">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Teto Aplicado: dose máxima atingida.</span>
          </div>
        )}

        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          {item.observacao}
        </p>

        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] pt-1">
          <span className="text-slate-400 font-mono">
            Fonte: {item.fonte}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
            Pendente de validação
          </span>
        </div>
      </div>

      {/* Botão Como Calculei */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setShowHow((prev) => !prev)}
          className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 cursor-pointer flex items-center gap-1.5"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{showHow ? 'Ocultar memória de cálculo' : 'Como calculei esta dose'}</span>
          {showHow ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {showHow && (
          <div className="mt-3">
            <ComoCalculei explanation={item.explanation} />
          </div>
        )}
      </div>
    </div>
  );
};
