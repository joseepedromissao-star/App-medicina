import React, { useState, useMemo, useEffect } from 'react';
import {
  Activity,
  Calculator,
  AlertTriangle,
  ArrowRightLeft,
  Sliders,
  CheckCircle,
  HelpCircle,
  Scale,
  Zap,
  UserCheck,
} from 'lucide-react';
import {
  calculateFullTfg,
  type WeightPolicy,
  type TfgResult,
} from '../../../lib/tfg';
import {
  STANDARD_DRUG_PRESETS,
  calculateInfusionRate,
  calculateDoseFromRate,
  concentrationOf,
  describeDilution,
  type StandardInfusionPreset,
  type InfusionResult,
  type DoseFromRateResult,
} from '../../../lib/infusion';
import { ClinicalInputError } from '../../../lib/validation';
import { usePatient } from '../../context/PatientContext';
import { usePediatric } from '../../context/PediatricContext';
import { ComoCalculei } from '../ui/ComoCalculei';
import { ResultBadge, ValidationStatusBadge } from '../ui/ResultBadge';
import { AlertaAltaVigilancia } from '../ui/AlertaAltaVigilancia';

export const CalculatorSheet: React.FC<{
  initialTab?: 'tfg' | 'infusao';
  filterDrugId?: string;
  onOpenPatientDrawer?: () => void;
  className?: string;
}> = ({ initialTab = 'tfg', filterDrugId, onOpenPatientDrawer, className = '' }) => {
  const { patient, updatePatient, isConfirmed, activePresetLabel, openPatientDrawer } = usePatient();
  const { isPediatricConfirmed } = usePediatric();
  const [activeTab, setActiveTab] = useState<'tfg' | 'infusao'>(initialTab);

  // --- TFG STATE ---
  const [weightPolicy, setWeightPolicy] = useState<WeightPolicy>('auto');

  // TFG Calculation returning { resultado, erros } without setState inside useMemo
  const { resultado: tfgResult, erros: tfgError } = useMemo<{
    resultado: TfgResult | null;
    erros: string[];
  }>(() => {
    try {
      const res = calculateFullTfg(
        patient.age,
        patient.sex,
        patient.weightKg,
        patient.heightCm,
        patient.creatinineMgDl,
        weightPolicy
      );
      return { resultado: res, erros: [] };
    } catch (err) {
      if (err instanceof ClinicalInputError) {
        return { resultado: null, erros: err.errors };
      }
      return { resultado: null, erros: ['Erro ao calcular a taxa de filtração glomerular.'] };
    }
  }, [patient.age, patient.sex, patient.weightKg, patient.heightCm, patient.creatinineMgDl, weightPolicy]);

  // --- INFUSION STATE ---
  const presetsAvailable = useMemo(() => {
    if (filterDrugId) {
      return STANDARD_DRUG_PRESETS.filter((p) => p.drugId === filterDrugId);
    }
    return STANDARD_DRUG_PRESETS;
  }, [filterDrugId]);

  const hasPresetForFilter = !filterDrugId || presetsAvailable.length > 0;

  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(
    presetsAvailable[0]?.id || null
  );

  // Sync selectedPresetId whenever presetsAvailable changes
  useEffect(() => {
    if (presetsAvailable.length > 0) {
      if (!selectedPresetId || !presetsAvailable.some((p) => p.id === selectedPresetId)) {
        setSelectedPresetId(presetsAvailable[0].id);
      }
    } else {
      setSelectedPresetId(null);
    }
  }, [presetsAvailable, selectedPresetId]);

  const currentPreset = useMemo<StandardInfusionPreset | null>(() => {
    if (!selectedPresetId) {
      return presetsAvailable[0] || null;
    }
    return presetsAvailable.find((p) => p.id === selectedPresetId) || null;
  }, [selectedPresetId, presetsAvailable]);

  const [targetDose, setTargetDose] = useState<number>(currentPreset?.startingDose || 0);

  // Update target dose default when preset changes
  useEffect(() => {
    if (currentPreset) {
      setTargetDose(currentPreset.startingDose);
    }
  }, [currentPreset]);

  // Reverse pump calculation state
  const [pumpRateInput, setPumpRateInput] = useState<number>(26.3);

  // Update target dose default when preset changes
  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const p = presetsAvailable.find((pr) => pr.id === presetId);
    if (p) setTargetDose(p.startingDose);
  };

  // Forward calculation: dose -> mL/h returning { resultado, erros } without setState inside useMemo
  const { resultado: infusionResult, erros: infusionError } = useMemo<{
    resultado: InfusionResult | null;
    erros: string[];
  }>(() => {
    if (!currentPreset) {
      return { resultado: null, erros: [] };
    }
    try {
      const res = calculateInfusionRate(
        currentPreset,
        targetDose,
        currentPreset.requiresWeight ? patient.weightKg : undefined
      );
      return { resultado: res, erros: [] };
    } catch (err) {
      if (err instanceof ClinicalInputError) {
        return { resultado: null, erros: err.errors };
      }
      return { resultado: null, erros: ['Erro no cálculo de infusão contínua.'] };
    }
  }, [currentPreset, targetDose, patient.weightKg]);

  // Reverse calculation: mL/h -> dose using calculateDoseFromRate(preset, taxa, peso)
  const { resultado: reverseResult, erros: reverseError } = useMemo<{
    resultado: DoseFromRateResult | null;
    erros: string[];
  }>(() => {
    if (!currentPreset) {
      return { resultado: null, erros: [] };
    }
    try {
      const res = calculateDoseFromRate(
        currentPreset,
        pumpRateInput,
        currentPreset.requiresWeight ? patient.weightKg : undefined
      );
      return { resultado: res, erros: [] };
    } catch (err) {
      if (err instanceof ClinicalInputError) {
        return { resultado: null, erros: err.errors };
      }
      return { resultado: null, erros: ['Erro na conversão reversa.'] };
    }
  }, [pumpRateInput, patient.weightKg, currentPreset]);

  return (
    <div
      className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5 space-y-6 ${className}`}
    >
      {/* Aviso de Paciente Pediátrico Ativo: bloquear calculadoras de adulto */}
      {isPediatricConfirmed ? (
        <div className="p-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-800 text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h4 className="text-base font-bold text-amber-950 dark:text-amber-100 font-serif">
              Paciente pediátrico: use o módulo pediátrico
            </h4>
            <p className="text-xs text-amber-800 dark:text-amber-300">
              As calculadoras de TFG (CKD-EPI / Cockcroft-Gault) e infusão contínua desta seção são validadas exclusivamente para adultos (&ge; 18 anos e &ge; 30 kg). Para crianças e adolescentes, utilize o módulo dedicado de PCR Pediátrica.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Example Case Banner if active */}
          {activePresetLabel && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{activePresetLabel}</span>
            </div>
          )}

      {/* Patient confirmation banner if patient not confirmed */}
      {!isConfirmed && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold block">Preencha e confirme o paciente</span>
              <span>Os cálculos abaixo utilizam dados padrão em memória. Confirme os parâmetros para liberar a validação clínica.</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (onOpenPatientDrawer) onOpenPatientDrawer();
              openPatientDrawer();
            }}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shrink-0 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Revisar e Confirmar no Perfil</span>
          </button>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('tfg')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'tfg'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>TFG & Função Renal</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('infusao')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'infusao'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Infusões Contínuas (BIC)</span>
          </button>
        </div>

        <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
          Entradas validadas pelo motor clínico
        </span>
      </div>

      {/* ======================================================== */}
      {/* ABA 1: TFG COMPLETA                                      */}
      {/* ======================================================== */}
      {activeTab === 'tfg' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <div>
            <h3 className="text-lg font-bold font-serif text-slate-900 dark:text-white">
              Taxa de Filtração Glomerular Estimada (TFG)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              CKD-EPI 2021 (sem termo racial, para estadiamento) e Cockcroft-Gault (para ajuste posológico de fármacos).
            </p>
          </div>

          {/* Clinical inputs row */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block font-medium">Idade:</span>
              <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                {patient.age} anos ({patient.sex === 'M' ? 'Masc' : 'Fem'})
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block font-medium">Peso Real:</span>
              <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                {patient.weightKg} kg
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block font-medium">Altura:</span>
              <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                {patient.heightCm} cm
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block font-medium">Creatinina Sérica:</span>
              <span className="font-mono text-sm font-bold text-sky-600 dark:text-sky-400">
                {patient.creatinineMgDl} mg/dL
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-slate-500 dark:text-slate-400 block font-medium">Convenção de Peso (CG):</span>
              <select
                value={weightPolicy}
                onChange={(e) => setWeightPolicy(e.target.value as WeightPolicy)}
                className="w-full mt-0.5 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-semibold"
              >
                <option value="auto">Automática (Devine / ABW)</option>
                <option value="real">Forçar Peso Real</option>
                <option value="ideal">Forçar Peso Ideal (Devine)</option>
                <option value="ajustado">Forçar Peso Ajustado (ABW)</option>
              </select>
            </div>
          </div>

          {/* Validation errors */}
          {tfgError.length > 0 && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200">
              <div className="font-semibold flex items-center gap-1 mb-1">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Entrada Inválida - Cálculo Recusado:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5">
                {tfgError.map((e, idx) => (
                  <li key={idx}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Results grid */}
          {tfgResult && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card CKD-EPI 2021 */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-sky-600 dark:text-sky-400">
                      Estadiamento Renal (KDIGO)
                    </span>
                    <h4 className="font-bold text-slate-900 dark:text-white text-base">
                      CKD-EPI 2021
                    </h4>
                  </div>
                  <ResultBadge severity={tfgResult.severity} size="sm" />
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-3xl font-extrabold text-slate-900 dark:text-white">
                    {isConfirmed && tfgResult ? tfgResult.ckdEpi2021 : '---'}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    mL/min/1,73m²
                  </span>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-semibold text-slate-900 dark:text-white">Classificação: </span>
                  {isConfirmed && tfgResult ? tfgResult.clinicalInterpretation : 'Aguardando confirmação do perfil'}
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <span className="text-[11px] text-slate-400">Indexado a 1,73 m²</span>
                  {isConfirmed && tfgResult && <ComoCalculei explanation={tfgResult.explanationCkdEpi} />}
                </div>
              </div>

              {/* Card Cockcroft-Gault */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-purple-600 dark:text-purple-400">
                      Ajuste de Doses de Fármacos
                    </span>
                    <h4 className="font-bold text-slate-900 dark:text-white text-base">
                      Cockcroft-Gault
                    </h4>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-semibold font-mono">
                    Peso {tfgResult.weightTypeUsed}: {tfgResult.weightUsedForCg} kg
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-3xl font-extrabold text-slate-900 dark:text-white">
                    {isConfirmed && tfgResult ? tfgResult.cockcroftGault : '---'}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    mL/min (não indexado)
                  </span>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-semibold text-slate-900 dark:text-white">Biometria: </span>
                  Ideal {tfgResult.idealWeightKg} kg • Ajustado {tfgResult.adjustedWeightKg} kg
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <span className="text-[11px] text-slate-400">Base de bulas brasileiras</span>
                  {isConfirmed && tfgResult && <ComoCalculei explanation={tfgResult.explanationCockcroftGault} />}
                </div>
              </div>
            </div>
          )}

          {/* Warning banner */}
          {tfgResult?.explanationCkdEpi.warningAlert && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{tfgResult.explanationCkdEpi.warningAlert}</span>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* ABA 2: INFUSÃO CONTÍNUA (BIC)                             */}
      {/* ======================================================== */}
      {activeTab === 'infusao' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div>
            <h3 className="text-lg font-bold font-serif text-slate-900 dark:text-white">
              Cálculo de Infusão Contínua em BIC
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Conversões precisas: mcg/kg/min, mcg/min, UI/min ↔ mL/h com diluição derivada e conferência de segurança.
            </p>
          </div>

          {!hasPresetForFilter || !currentPreset ? (
            <div className="p-6 rounded-2xl border border-dashed border-amber-300 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20 text-center space-y-2">
              <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto" />
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                Sem calculadora de dose validada para este fármaco
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                O fármaco do protocolo ainda não possui preset de infusão contínua cadastrado ou validado no registro de fármacos.
              </p>
            </div>
          ) : (
            <>
              {/* Preset Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Selecione o Medicamento & Diluição Padronizada:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {presetsAvailable.map((preset) => {
                    const isSelected = preset.id === selectedPresetId;
                    const conc = concentrationOf(preset);
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset.id)}
                        className={`p-3 rounded-xl text-left border transition cursor-pointer ${
                          isSelected
                            ? 'border-sky-600 bg-sky-50 dark:bg-sky-950/40 dark:border-sky-500 ring-2 ring-sky-500/20'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            {preset.name}
                          </span>
                          <ValidationStatusBadge status={preset.validacaoClinica} showIcon={false} />
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-1">
                          {preset.amount} {preset.amountUnit} em {preset.diluentVolumeMl} mL ({conc.value} {conc.unit})
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* High Alert Banner if applicable */}
              {currentPreset.isHighAlert && (
                <AlertaAltaVigilancia
                  customTitle={currentPreset.name}
                  maxDoseText={`${currentPreset.usualMaxDose} ${currentPreset.unit}`}
                  warningNotes={[currentPreset.highAlertNotes]}
                  antidote={currentPreset.extravasationAntidote || currentPreset.toxicityAntidote}
                />
              )}

              {/* Direct Calculation: Dose -> Rate */}
              <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-sky-600" />
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Dose Alvo Desejada:
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">
                    Faixa usual: <span className="font-mono font-semibold">{currentPreset.usualMinDose}–{currentPreset.usualMaxDose} {currentPreset.unit}</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Dose Alvo ({currentPreset.unit}):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={targetDose}
                        onChange={(e) => setTargetDose(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-base font-bold text-sky-700 dark:text-sky-300"
                      />
                    </div>
                  </div>

                  {currentPreset.requiresWeight && (
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Peso do Paciente (kg):
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={patient.weightKg}
                        onChange={(e) => updatePatient({ weightKg: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-base font-bold text-slate-800 dark:text-slate-200"
                      />
                    </div>
                  )}

                  {/* Result display */}
                  <div className="p-3 rounded-xl bg-sky-100/70 dark:bg-sky-950/50 border border-sky-300 dark:border-sky-800 flex flex-col justify-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">
                      Programar BIC (Bomba):
                    </span>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="font-mono text-3xl font-extrabold text-sky-950 dark:text-sky-100">
                        {isConfirmed && infusionResult ? infusionResult.rateMlHr : '---'}
                      </span>
                      <span className="text-xs font-bold text-sky-800 dark:text-sky-300">
                        mL/h
                      </span>
                    </div>
                  </div>
                </div>

                {/* Infusion Errors or Warnings */}
                {infusionError.length > 0 && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200">
                    <div className="font-semibold flex items-center gap-1 mb-1">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>Cálculo Recusado:</span>
                    </div>
                    <ul className="list-disc list-inside">
                      {infusionError.map((e, idx) => (
                        <li key={idx}>{e}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {infusionResult && infusionResult.warnings.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                    {infusionResult.warnings.map((w, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{w}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Como calculei button */}
                {isConfirmed && infusionResult && (
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs text-slate-500 font-mono">
                      {describeDilution(currentPreset)}
                    </span>
                    <ComoCalculei explanation={infusionResult.explanation} />
                  </div>
                )}
              </div>

              {/* Reverse Calculation: Rate in pump -> Dose using calculateDoseFromRate */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-purple-600" />
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Cálculo Reverso (Verificação à Beira-Leito a Partir do Visor da Bomba)
                  </h4>
                </div>
                <p className="text-xs text-slate-500">
                  Informe a taxa atual no visor da bomba (mL/h) para conferir qual dose o paciente está recebendo em <span className="font-mono font-semibold">{currentPreset.unit}</span>.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Taxa Atual na BIC (mL/h):
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={pumpRateInput}
                      onChange={(e) => setPumpRateInput(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-base font-bold text-purple-700 dark:text-purple-300"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 block">
                        Dose Efetiva Recebida:
                      </span>
                      <span className="font-mono text-2xl font-extrabold text-purple-900 dark:text-purple-100">
                        {isConfirmed && reverseResult ? reverseResult.dose : '---'}
                      </span>
                      <span className="text-xs font-medium text-purple-700 dark:text-purple-300 ml-1">
                        {reverseResult ? reverseResult.unit : currentPreset.unit}
                      </span>
                    </div>

                    {isConfirmed && reverseResult && (
                      <ComoCalculei explanation={reverseResult.explanation} variant="subtle" />
                    )}
                  </div>
                </div>

                {reverseError.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-rose-50 text-rose-800 text-xs border border-rose-200">
                    {reverseError.join(' | ')}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
        </>
      )}
    </div>
  );
};
