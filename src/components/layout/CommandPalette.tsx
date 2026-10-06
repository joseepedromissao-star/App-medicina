import React, { useState, useEffect } from 'react';
import {
  Search,
  Activity,
  Calculator,
  ShieldCheck,
  User,
  X,
  ArrowRight,
  FileText,
  Zap,
} from 'lucide-react';
import { CLINICAL_PROTOCOLS } from '../../../data/mock-protocols';
import { CLINICAL_SCORES } from '../../../data/scores';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProtocol: (id: string) => void;
  onNavigateHome: () => void;
  onNavigateAudit: () => void;
  onNavigateTools: () => void;
  onOpenPatientDrawer: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectProtocol,
  onNavigateHome,
  onNavigateAudit,
  onNavigateTools,
  onOpenPatientDrawer,
}) => {
  const [query, setQuery] = useState('');

  // Keyboard shortcut listener (Ctrl+K / Cmd+K / Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // let parent toggle
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const normalizedQuery = query.toLowerCase().trim();

  // Filter protocols
  const filteredProtocols = CLINICAL_PROTOCOLS.filter(
    (p) =>
      p.title.toLowerCase().includes(normalizedQuery) ||
      p.synonyms.some((s) => s.toLowerCase().includes(normalizedQuery)) ||
      (p.cid10 && p.cid10.some((c) => c.toLowerCase().includes(normalizedQuery)))
  );

  // Filter scores
  const filteredScores = CLINICAL_SCORES.filter(
    (s) =>
      s.name.toLowerCase().includes(normalizedQuery) ||
      s.acronym.toLowerCase().includes(normalizedQuery) ||
      s.category.toLowerCase().includes(normalizedQuery)
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Digite para buscar patologia, score, CID ou ferramenta..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm font-medium outline-hidden placeholder:text-slate-400"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2 space-y-3">
          {/* Quick Actions */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1 block">
              Navegação Rápida
            </span>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  onNavigateHome();
                  onClose();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <div className="flex items-center gap-2.5">
                  <Activity className="w-4 h-4 text-sky-600" />
                  <span>Grade Principal de Patologias</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onNavigateTools();
                  onClose();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <div className="flex items-center gap-2.5">
                  <Calculator className="w-4 h-4 text-purple-600" />
                  <span>Ferramentas Rápidas (TFG & Infusões)</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenPatientDrawer();
                  onClose();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <div className="flex items-center gap-2.5">
                  <User className="w-4 h-4 text-emerald-600" />
                  <span>Editar Perfil Biométrico do Paciente</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onNavigateAudit();
                  onClose();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Painel de Revisão Médica & Checklist de Segurança</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Protocols */}
          {filteredProtocols.length > 0 && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1 block">
                Patologias & Protocolos Clínicos
              </span>
              <div className="space-y-1">
                {filteredProtocols.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onSelectProtocol(p.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left hover:bg-sky-50 dark:hover:bg-sky-950/40 transition group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400">
                          {p.title}
                        </span>
                        {p.cid10 && (
                          <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                            {p.cid10.join(', ')}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        {p.summary}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Scores */}
          {filteredScores.length > 0 && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1 block">
                Escores Clínicos Estratificados
              </span>
              <div className="space-y-1">
                {filteredScores.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">{s.name}</span>
                      <span className="text-slate-400 text-[11px] block">{s.description}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-slate-600 dark:text-slate-400">
                      {s.acronym}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Pressione ESC para fechar</span>
          <span>Navegue com o mouse ou atalhos</span>
        </div>
      </div>
    </div>
  );
};
