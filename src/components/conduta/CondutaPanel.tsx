import React, { useState } from 'react';
import {
  FileText,
  Copy,
  Printer,
  Check,
  AlertTriangle,
  Clock,
  ShieldAlert,
  BookOpen,
  Send,
  UserCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { Patologia } from '../../../types/clinical';
import { generateStratifiedConduct } from '../../../lib/conduta-engine';
import { usePatient } from '../../context/PatientContext';
import { usePediatric } from '../../context/PediatricContext';
import { ValidationStatusBadge } from '../ui/ResultBadge';

export const CondutaPanel: React.FC<{ protocolo: Patologia }> = ({ protocolo }) => {
  const { patient, isConfirmed, activePresetLabel, openPatientDrawer } = usePatient();
  const { isPediatricConfirmed } = usePediatric();
  const [copied, setCopied] = useState(false);
  const [collapsedPhases, setCollapsedPhases] = useState<Record<number, boolean>>({});

  // Generate deterministic conduct from the clinical engine ONLY when patient is confirmed
  const report = isConfirmed
    ? generateStratifiedConduct(
        patient,
        protocolo.id,
        protocolo.title,
        protocolo.conductPhases
      )
    : null;

  const handleCopy = async () => {
    if (!isConfirmed || !report) return;
    try {
      const prefix = activePresetLabel ? `${activePresetLabel}\n\n` : '';
      await navigator.clipboard.writeText(prefix + report.clipboardSummary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const handlePrint = () => {
    if (!isConfirmed || !report) return;
    window.print();
  };

  const togglePhase = (index: number) => {
    setCollapsedPhases((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden text-slate-800 dark:text-slate-100 print:shadow-none print:border-none">
      {/* Top Header */}
      <div className="bg-slate-900 text-white p-5 print:bg-white print:text-black">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-xs font-semibold tracking-wide uppercase border border-sky-400/30">
                Conduta Clínica Estratificada (Motor Determinístico)
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {report ? report.timestamp : 'Perfil não confirmado'}
              </span>
            </div>
            <h3 className="text-xl font-bold font-serif mt-1">
              {protocolo.title}
            </h3>
            <p className="text-xs text-slate-300 max-w-xl mt-0.5">
              Individualizada para o perfil biométrico, hemodinâmico e renal do paciente.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 print:hidden">
            <button
              type="button"
              onClick={handleCopy}
              disabled={!isConfirmed || !report}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                !isConfirmed || !report
                  ? 'bg-slate-800/40 text-slate-500 border-slate-800 cursor-not-allowed opacity-50'
                  : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700 cursor-pointer'
              }`}
              title={!isConfirmed ? 'Preencha e confirme o paciente para liberar o resumo' : 'Copiar Resumo'}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar Resumo</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={!isConfirmed || !report}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                !isConfirmed || !report
                  ? 'bg-slate-800/40 text-slate-500 border-slate-800 cursor-not-allowed opacity-50'
                  : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700 cursor-pointer'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / PDF</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Aviso de Paciente Pediátrico Ativo: bloquear conduta adulta */}
        {isPediatricConfirmed ? (
          <div className="p-8 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-800 text-center space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h4 className="text-base font-bold text-amber-950 dark:text-amber-100 font-serif">
                Paciente pediátrico: use o módulo pediátrico
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-300">
                A conduta e as prescrições farmacológicas geradas neste protocolo são exclusivas para adultos (&ge; 18 anos e &ge; 30 kg). Para crianças e adolescentes, utilize o módulo dedicado de PCR Pediátrica.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Print-only prefix for example case */}
            {activePresetLabel && (
              <div className="hidden print:block text-center font-bold text-sm text-black border-b border-black pb-2 mb-4">
                {activePresetLabel}
              </div>
            )}

        {/* Example Case Banner if active */}
        {activePresetLabel && (
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{activePresetLabel}</span>
          </div>
        )}

        {/* Unconfirmed patient warning */}
        {!isConfirmed && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold text-sm block">Preencha e confirme o paciente</span>
                <span>Os parâmetros clínicos e doses calculadas requerem confirmação explícita do perfil do paciente.</span>
              </div>
            </div>
            <button
              type="button"
              onClick={openPatientDrawer}
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shrink-0 cursor-pointer flex items-center gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Revisar e Confirmar no Perfil</span>
            </button>
          </div>
        )}

        {/* If patient is confirmed, render conduct report */}
        {isConfirmed && report && (
          <>
            {/* If status is DADOS_INVALIDOS */}
            {report.status === 'DADOS_INVALIDOS' ? (
              <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-400 dark:border-rose-800 space-y-3">
                <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                  <span>Conduta Bloqueada: Dados do Paciente Incompletos ou Fora dos Limites Plausíveis</span>
                </div>
                <p className="text-xs text-rose-900 dark:text-rose-200">
                  Por protocolo de segurança do software médico, nenhuma dose ou taxa de infusão pode ser gerada com dados biológicos fora da faixa de plausibilidade. Corrija no Perfil do Paciente:
                </p>
                <ul className="list-disc list-inside text-xs font-mono text-rose-800 dark:text-rose-300 space-y-1">
                  {report.pendencias.map((pend, idx) => (
                    <li key={idx}>{pend}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <>
                {/* Patient metrics summary bar */}
                {report.patientHeader.metrics && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
                      1. Resumo do Caso & Parâmetros Considerados
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-slate-600 dark:text-slate-300 font-mono">
                      <div>
                        <span className="text-[11px] text-slate-400 block font-sans">Idade/Sexo:</span>
                        <span className="font-bold">{patient.age}a ({patient.sex})</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block font-sans">Peso / Devine:</span>
                        <span className="font-bold">{patient.weightKg} kg ({report.patientHeader.metrics.idealBodyWeightKg} kg)</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block font-sans">PA / PAM:</span>
                        <span className="font-bold">{patient.sbp}/{patient.dbp} ({report.patientHeader.metrics.map} mmHg)</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block font-sans">FC / Shock Index:</span>
                        <span className="font-bold">{patient.hr} bpm ({report.patientHeader.metrics.shockIndex})</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block font-sans">TFG CKD-EPI:</span>
                        <span className="font-bold text-sky-600 dark:text-sky-400">{report.patientHeader.metrics.ckdEpi2021Cr} mL/min</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block font-sans">ClCr Cockcroft:</span>
                        <span className="font-bold text-purple-600 dark:text-purple-400">{report.patientHeader.metrics.cockcroftGaultClCr} mL/min</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Critical Alerts Banner */}
                {report.criticalAlerts.length > 0 && (
                  <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 space-y-2">
                    <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-xs uppercase tracking-wider">
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                      <span>Alertas de Alta Vigilância & Atenção Clínica</span>
                    </div>
                    <div className="space-y-1.5 text-xs text-rose-950 dark:text-rose-200">
                      {report.criticalAlerts.map((alert, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-rose-600 font-bold">!</span>
                          <span>{alert}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Phases of conduct */}
                <div className="space-y-5">
                  <span className="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    2. Plano Terapêutico Estratificado por Fases
                  </span>

                  {report.phases.map((phase, phaseIdx) => {
                    const isCollapsed = !!collapsedPhases[phaseIdx];
                    return (
                      <div
                        key={phaseIdx}
                        className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => togglePhase(phaseIdx)}
                          className="w-full flex items-center justify-between p-3.5 bg-slate-100/80 dark:bg-slate-800/60 hover:bg-slate-200/60 dark:hover:bg-slate-800 text-left transition cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <Clock className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                            <div>
                              <span className="font-bold text-sm text-slate-900 dark:text-white">
                                {phase.phaseTitle}
                              </span>
                              <span className="text-xs text-slate-500 dark:text-slate-400 ml-2 font-mono">
                                Janela: {phase.timeWindow}
                              </span>
                            </div>
                          </div>
                          {isCollapsed ? (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          )}
                        </button>

                        {!isCollapsed && (
                          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 p-1">
                            {phase.items.map((item, itemIdx) => (
                              <div
                                key={item.id || itemIdx}
                                className="p-3.5 space-y-2 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition rounded-lg"
                              >
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                  <div className="flex items-start gap-2">
                                    <span className="font-mono text-xs font-bold text-slate-400 mt-0.5">
                                      {itemIdx + 1}.
                                    </span>
                                    <div>
                                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                                        {item.title}
                                      </h4>
                                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                                        {item.detail}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {item.timing && (
                                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-mono font-medium">
                                        {item.timing}
                                      </span>
                                    )}
                                    {item.statusRecomendacao && (
                                      <ValidationStatusBadge statusRecomendacao={item.statusRecomendacao} />
                                    )}
                                  </div>
                                </div>

                                {/* Detailed Drug Prescription Card */}
                                {item.drugPrescription && (
                                  <div className="mt-2 p-3 rounded-xl bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-xs space-y-1.5">
                                    <div className="flex items-center justify-between border-b border-sky-200/80 dark:border-sky-800 pb-1.5">
                                      <span className="font-bold text-sky-900 dark:text-sky-200">
                                        Prescrição Individualizada: {item.drugPrescription.drugName}
                                      </span>
                                      {item.drugPrescription.safetyDoubleCheck && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white">
                                          Dupla Checagem Obrigatória
                                        </span>
                                      )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                                      <div>
                                        <span className="text-slate-500 font-sans block">Dose Calculada:</span>
                                        <span className="font-bold text-sky-800 dark:text-sky-300">{item.drugPrescription.calculatedDose}</span>
                                      </div>
                                      <div>
                                        <span className="text-slate-500 font-sans block">Via de Administração:</span>
                                        <span className="font-bold">{item.drugPrescription.route}</span>
                                      </div>
                                      <div>
                                        <span className="text-slate-500 font-sans block">Solução / Diluição:</span>
                                        <span>{item.drugPrescription.dilution}</span>
                                      </div>
                                      <div>
                                        <span className="text-slate-500 font-sans block">Parâmetro Alvo:</span>
                                        <span>{item.drugPrescription.targetParameter}</span>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Evidence / Reference */}
                                {item.fonte && (
                                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 pt-1">
                                    <BookOpen className="w-3 h-3" />
                                    <span>{item.fonte}</span>
                                    {item.evidenceLevel && <span>• {item.evidenceLevel}</span>}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* ICU Admission criteria */}
            {protocolo.icuAdmissionCriteria?.length > 0 && (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs space-y-2">
                <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  3. Critérios de Encaminhamento / Admissão em UTI
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                  {protocolo.icuAdmissionCriteria.map((crit, idx) => (
                    <li key={idx}>{crit}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {/* Clinical Disclaimer Mandatory by Section 7 & 10 */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-2 text-xs text-slate-500 dark:text-slate-400">
          <p className="font-medium italic">
            "Reavalie clinicamente; este resultado depende dos dados informados."
          </p>
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-center font-semibold">
            Conteúdo de apoio à decisão clínica. Não substitui o julgamento médico.
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  );
};
