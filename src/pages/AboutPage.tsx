import React from 'react';
import {
  ShieldCheck,
  BookOpen,
  Lock,
  Cpu,
  FileText,
  AlertTriangle,
  Award,
  CheckCircle,
  HelpCircle,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';

interface AboutPageProps {
  onBack: () => void;
  onNavigateAudit: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onBack, onNavigateAudit }) => {
  return (
    <div className="space-y-10 pb-16 max-w-5xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Início</span>
        </button>

        <button
          type="button"
          onClick={onNavigateAudit}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800 hover:bg-amber-500/20 transition cursor-pointer"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Ver Painel de Auditoria Clínica</span>
        </button>
      </div>

      {/* Hero Header */}
      <section className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950 text-white p-8 sm:p-12 border border-slate-800 shadow-xl space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-400/30">
          <Award className="w-3.5 h-3.5" />
          <span>Metodologia & Governança Clínica</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-extrabold tracking-tight">
          Sobre o AuraMed e Metodologia Clínica
        </h1>
        <p className="text-slate-300 text-sm sm:text-base max-w-3xl leading-relaxed">
          O AuraMed é um portal de apoio à decisão médica em urgências e emergências clínicas e terapia intensiva. Desenvolvido para médicos, residentes e estudantes de medicina, foi projetado para oferecer rapidez e precisão nos momentos mais críticos do plantão.
        </p>
      </section>

      {/* Core Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <h2 className="font-bold text-slate-900 dark:text-white text-base">
            Diretrizes Oficiais Vigentes
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Fonte única de verdade clínica ancorada exclusivamente nas recomendações oficiais das principais sociedades médicas (AHA 2025, ERC 2025, ESC 2023/2024, SSC 2026, EAU 2026, ADA/EASD 2024, SBC 2025). Livros e opiniões individuais não substituem evidências indexadas.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <h2 className="font-bold text-slate-900 dark:text-white text-base">
            Motores 100% Determinísticos
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Todos os cálculos de doses, taxas de infusão, TFG e condutas são executados por motores lógicos puramente matemáticos e baseados em regras rígidas. Nenhuma conduta ou dose é gerada por modelos probabilísticos ou LLMs em tempo de execução.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="font-bold text-slate-900 dark:text-white text-base">
            Privacidade e LGPD
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Privacidade por design. Todos os dados antropométricos e clínicos do paciente permanecem em memória volátil no próprio navegador. Zero telemetria médica, zero armazenamento em disco e zero envio a servidores externos.
          </p>
        </div>
      </div>

      {/* Camada de Segurança Clínica */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-sky-600" />
            <span>Camada de Segurança e Alta Vigilância (ISMP Brasil)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Mecanismos arquiteturais que protegem o profissional contra erros de dosagem e vias no momento da prescrição.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>Confirmação Prévia Obrigatória</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300">
              Nenhuma calculadora de bomba ou prescrição estratificada é liberada antes do profissional revisar e clicar em &quot;Confirmar Dados do Paciente&quot; no drawer clínico, garantindo que o peso, idade e função renal sejam checados.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span>Faixas Vermelhas de Dupla Checagem</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300">
              Medicamentos como Noradrenalina, Insulina, Nitroprussiato, Heparina e Eletrólitos Concentrados (KCl 19,1%) exibem alertas explícitos de dupla checagem por dois profissionais antes da infusão e teto de dose máxima.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>Ajuste Renal Automático por TFG</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300">
              Cálculo simultâneo por CKD-EPI 2021 (sem raça) e Cockcroft-Gault (com peso real, ideal e ajustado para obesos), alertando quando antimicrobianos (ex.: Cefepime, Piperacilina, Enoxaparina) exigem espaçamento de doses.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <HelpCircle className="w-4 h-4 text-sky-500" />
              <span>Transparência &quot;Como Calculei&quot;</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300">
              Cada resultado numérico traz um modal que expõe a fórmula matemática utilizada, os valores substituídos do paciente e a citação exata da diretriz, permitindo auditoria visual instantânea à beira-leito.
            </p>
          </div>
        </div>
      </section>

      {/* Diretrizes Adotadas */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6 shadow-xs">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <span>Matriz de Diretrizes Oficiais Vigentes</span>
        </h2>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                <th className="py-2.5 px-3">Patologia</th>
                <th className="py-2.5 px-3">Guideline Principal</th>
                <th className="py-2.5 px-3">Sociedade</th>
                <th className="py-2.5 px-3">Ano</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">Sepse e Choque Séptico</td>
                <td className="py-2.5 px-3">Surviving Sepsis Campaign Adult Guidelines</td>
                <td className="py-2.5 px-3">SCCM / ESICM</td>
                <td className="py-2.5 px-3 font-mono">2026</td>
                <td className="py-2.5 px-3"><span className="text-emerald-600 font-semibold">Confirmada</span></td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">Tromboembolismo Pulmonar (TEP)</td>
                <td className="py-2.5 px-3">Guideline for Evaluation and Management of PE</td>
                <td className="py-2.5 px-3">AHA/ACC/CHEST/SCAI</td>
                <td className="py-2.5 px-3 font-mono">2026</td>
                <td className="py-2.5 px-3"><span className="text-emerald-600 font-semibold">Confirmada</span></td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">Parada Cardiorrespiratória (PCR)</td>
                <td className="py-2.5 px-3">Guidelines for CPR and Emergency Cardiovascular Care</td>
                <td className="py-2.5 px-3">AHA / ERC</td>
                <td className="py-2.5 px-3 font-mono">2025</td>
                <td className="py-2.5 px-3"><span className="text-emerald-600 font-semibold">Confirmada</span></td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">Emergência Hipertensiva</td>
                <td className="py-2.5 px-3">Diretriz Brasileira de Hipertensão Arterial</td>
                <td className="py-2.5 px-3">SBC / SBN / SBH</td>
                <td className="py-2.5 px-3 font-mono">2025</td>
                <td className="py-2.5 px-3"><span className="text-emerald-600 font-semibold">Confirmada</span></td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">Emergências Hiperglicêmicas (CAD/EHH)</td>
                <td className="py-2.5 px-3">Consensus on Hyperglycemic Crises in Adults</td>
                <td className="py-2.5 px-3">ADA / EASD</td>
                <td className="py-2.5 px-3 font-mono">2024</td>
                <td className="py-2.5 px-3"><span className="text-emerald-600 font-semibold">Confirmada</span></td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">Pielonefrite e Urosepse</td>
                <td className="py-2.5 px-3">Guidelines on Urological Infections</td>
                <td className="py-2.5 px-3">EAU</td>
                <td className="py-2.5 px-3 font-mono">2026</td>
                <td className="py-2.5 px-3"><span className="text-emerald-600 font-semibold">Confirmada</span></td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">Pneumonia Adquirida na Comunidade</td>
                <td className="py-2.5 px-3">Community-Acquired Pneumonia Clinical Guidelines</td>
                <td className="py-2.5 px-3">ATS / IDSA</td>
                <td className="py-2.5 px-3 font-mono">2025</td>
                <td className="py-2.5 px-3"><span className="text-emerald-600 font-semibold">Confirmada</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Disclaimer Institucional Mandatório */}
      <section className="rounded-2xl p-6 bg-amber-500/10 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs space-y-2 leading-relaxed">
        <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Aviso Legal e Responsabilidade Clínica</span>
        </div>
        <p>
          O AuraMed é uma ferramenta de apoio à decisão clínica e educação médica continuada. <strong>Não substitui o julgamento clínico individualizado, a avaliação presencial do paciente nem o protocolo institucional do serviço onde o médico atua.</strong> A decisão final sobre diagnósticos, indicações de exames, doses e regimes terapêuticos é de inteira e exclusiva responsabilidade do médico assistente.
        </p>
      </section>
    </div>
  );
};
