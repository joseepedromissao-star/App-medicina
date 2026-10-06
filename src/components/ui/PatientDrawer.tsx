import React, { useState } from 'react';
import { User, X, AlertTriangle, ShieldCheck, RefreshCw, Activity, Heart, Droplets, Scale } from 'lucide-react';
import { usePatient } from '../../context/PatientContext';
import { LIMITS } from '../../../lib/validation';

export const PatientDrawer: React.FC<{ isOpen?: boolean; onClose?: () => void }> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
}) => {
  const {
    patient,
    updatePatient,
    resetPatient,
    loadPreset,
    metrics,
    validationErrors,
    isValid,
    isConfirmed,
    confirmPatient,
    activePresetLabel,
    isDrawerOpen,
    closePatientDrawer,
  } = usePatient();
  const [allergyInput, setAllergyInput] = useState('');

  const isOpen = propIsOpen !== undefined ? (propIsOpen || isDrawerOpen) : isDrawerOpen;
  const handleClose = () => {
    if (propOnClose) propOnClose();
    closePatientDrawer();
  };

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (validationErrors.length === 0) {
      confirmPatient();
      handleClose();
    }
  };

  const handleAddAllergy = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = allergyInput.trim();
    if (trimmed && !patient.allergies.includes(trimmed)) {
      updatePatient({ allergies: [...patient.allergies, trimmed] });
      setAllergyInput('');
    }
  };

  const handleRemoveAllergy = (allergy: string) => {
    updatePatient({ allergies: patient.allergies.filter((a) => a !== allergy) });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-lg h-full overflow-y-auto bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                  <User className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-lg font-bold font-serif text-slate-900 dark:text-white">
                    Perfil do Paciente
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Dados em memória (LGPD). Reutilizados em todos os scores e calculadoras.
                  </p>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Fechar painel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Simulações Clínicas:
              </span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                CASO DE EXEMPLO — não é paciente real
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => loadPreset('eutrofico')}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-slate-700 dark:text-slate-300 transition text-center"
              >
                Padrão (70kg)
              </button>
              <button
                type="button"
                onClick={() => loadPreset('choque')}
                className="px-2.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30 hover:bg-rose-100 font-medium text-rose-700 dark:text-rose-300 transition text-center"
                title="CASO DE EXEMPLO — Choque Séptico (não é paciente real)"
              >
                Ex: Choque Séptico
              </button>
              <button
                type="button"
                onClick={() => loadPreset('renal')}
                className="px-2.5 py-1.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/30 hover:bg-amber-100 font-medium text-amber-700 dark:text-amber-300 transition text-center"
                title="CASO DE EXEMPLO — DRC Estágio 4 (não é paciente real)"
              >
                Ex: DRC (Cr 3.2)
              </button>
              <button
                type="button"
                onClick={() => loadPreset('idoso')}
                className="px-2.5 py-1.5 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/30 hover:bg-purple-100 font-medium text-purple-700 dark:text-purple-300 transition text-center"
                title="CASO DE EXEMPLO — Idosa Frágil (não é paciente real)"
              >
                Ex: Idosa (82a)
              </button>
            </div>
            {activePresetLabel && (
              <div className="mt-2 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                {activePresetLabel}
              </div>
            )}
          </div>

          {/* Errors banner if invalid */}
          {!isValid && validationErrors.length > 0 && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200 space-y-1">
              <div className="font-semibold flex items-center gap-1.5 text-rose-700 dark:text-rose-400">
                <AlertTriangle className="w-4 h-4" />
                <span>Dados inválidos detectados:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-800 dark:text-rose-300">
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Biometrics */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-sky-600" />
              <span>Biometria & Dados Basais</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-medium mb-1">
                  Idade (anos)
                </label>
                <input
                  type="number"
                  min={LIMITS.age[0]}
                  max={LIMITS.age[1]}
                  value={patient.age}
                  onChange={(e) => updatePatient({ age: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-medium mb-1">
                  Sexo biológico
                </label>
                <select
                  value={patient.sex}
                  onChange={(e) => updatePatient({ sex: e.target.value as 'M' | 'F' })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium"
                >
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-medium mb-1">
                  Peso (kg)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min={LIMITS.weightKg[0]}
                  max={LIMITS.weightKg[1]}
                  value={patient.weightKg}
                  onChange={(e) => updatePatient({ weightKg: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-medium mb-1">
                  Altura (cm)
                </label>
                <input
                  type="number"
                  min={LIMITS.heightCm[0]}
                  max={LIMITS.heightCm[1]}
                  value={patient.heightCm}
                  onChange={(e) => updatePatient({ heightCm: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-sm"
                />
              </div>
            </div>
          </div>

          {/* Sinais Vitais */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-rose-500" />
              <span>Sinais Vitais na Admissão</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-medium mb-1">
                  PAS (mmHg)
                </label>
                <input
                  type="number"
                  value={patient.sbp}
                  onChange={(e) => updatePatient({ sbp: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-medium mb-1">
                  PAD (mmHg)
                </label>
                <input
                  type="number"
                  value={patient.dbp}
                  onChange={(e) => updatePatient({ dbp: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-medium mb-1">
                  FC (bpm)
                </label>
                <input
                  type="number"
                  value={patient.hr}
                  onChange={(e) => updatePatient({ hr: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-medium mb-1">
                  FR (irpm)
                </label>
                <input
                  type="number"
                  value={patient.rr}
                  onChange={(e) => updatePatient({ rr: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-medium mb-1">
                  SpO2 (%)
                </label>
                <input
                  type="number"
                  value={patient.spo2}
                  onChange={(e) => updatePatient({ spo2: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-medium mb-1">
                  Temp (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={patient.temperature}
                  onChange={(e) => updatePatient({ temperature: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-medium mb-1">
                  Glasgow (3-15)
                </label>
                <input
                  type="number"
                  min="3"
                  max="15"
                  value={patient.gcs}
                  onChange={(e) => updatePatient({ gcs: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-medium mb-1">
                  Creatinina (mg/dL)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min={LIMITS.creatinineMgDl[0]}
                  max={LIMITS.creatinineMgDl[1]}
                  value={patient.creatinineMgDl}
                  onChange={(e) => updatePatient({ creatinineMgDl: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-sm"
                />
              </div>
            </div>
          </div>

          {/* Condições Especiais & Alergias */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-purple-500" />
              <span>Condições Clínicas Especiais</span>
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={patient.pregnancy}
                  onChange={(e) => updatePatient({ pregnancy: e.target.checked })}
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
                <span className="font-medium text-slate-700 dark:text-slate-300">Gestante</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={patient.dialysis}
                  onChange={(e) => updatePatient({ dialysis: e.target.checked })}
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
                <span className="font-medium text-slate-700 dark:text-slate-300">Em Hemodiálise / TRS</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={patient.activeBleeding}
                  onChange={(e) => updatePatient({ activeBleeding: e.target.checked })}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <span className="font-medium text-rose-700 dark:text-rose-400">Sangramento Ativo</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={patient.liverFailure}
                  onChange={(e) => updatePatient({ liverFailure: e.target.checked })}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span className="font-medium text-amber-700 dark:text-amber-400">Insuficiência Hepática</span>
              </label>
            </div>

            {/* Alergias */}
            <div className="pt-2">
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Alergias Medicamentosas Registradas:
              </label>
              <form onSubmit={handleAddAllergy} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ex: Penicilina, Dipirona, AAS..."
                  value={allergyInput}
                  onChange={(e) => setAllergyInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition cursor-pointer"
                >
                  Adicionar
                </button>
              </form>

              {patient.allergies.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {patient.allergies.map((allergy) => (
                    <span
                      key={allergy}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200"
                    >
                      <span>{allergy}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAllergy(allergy)}
                        className="hover:text-rose-950 font-bold ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Derived Metrics Summary */}
          {metrics && (
            <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-xs space-y-2">
              <span className="font-bold text-sky-800 dark:text-sky-300 block">
                Métricas Calculadas para Este Paciente:
              </span>
              <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300 font-mono">
                <div>PAM: <span className="font-bold text-sky-900 dark:text-sky-100">{metrics.map} mmHg</span></div>
                <div>Shock Index: <span className="font-bold text-sky-900 dark:text-sky-100">{metrics.shockIndex}</span></div>
                <div>TFG CKD-EPI: <span className="font-bold text-sky-900 dark:text-sky-100">{metrics.ckdEpi2021Cr} mL/min</span></div>
                <div>ClCr Cockcroft: <span className="font-bold text-sky-900 dark:text-sky-100">{metrics.cockcroftGaultClCr} mL/min</span></div>
                <div>Peso Ideal (Devine): <span className="font-bold">{metrics.idealBodyWeightKg} kg</span></div>
                <div>Estágio KDIGO: <span className="font-bold">{metrics.ckdStage}</span></div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center gap-2">
          <button
            type="button"
            onClick={resetPatient}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restaurar Padrão</span>
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`px-5 py-2 rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer ${
              validationErrors.length === 0
                ? 'bg-sky-600 hover:bg-sky-700 text-white'
                : 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
            disabled={validationErrors.length > 0}
          >
            Confirmar Dados do Paciente
          </button>
        </div>
      </div>
    </div>
  );
};
