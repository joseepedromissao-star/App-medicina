import React from 'react';
import {
  Activity,
  Search,
  User,
  Moon,
  Sun,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Menu,
  Download,
  WifiOff,
} from 'lucide-react';
import { usePatient } from '../../context/PatientContext';

interface NavbarProps {
  onOpenCommandPalette: () => void;
  onOpenPatientDrawer: () => void;
  onNavigateHome: () => void;
  onNavigateAudit: () => void;
  onNavigateTools: () => void;
  currentPage: 'home' | 'protocolo' | 'auditoria' | 'ferramentas';
  darkMode: boolean;
  onToggleDarkMode: () => void;
  isInstallable: boolean;
  onInstallPwa: () => void;
  isOnline: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCommandPalette,
  onOpenPatientDrawer,
  onNavigateHome,
  onNavigateAudit,
  onNavigateTools,
  currentPage,
  darkMode,
  onToggleDarkMode,
  isInstallable,
  onInstallPwa,
  isOnline,
}) => {
  const { patient, metrics, isValid, isConfirmed, activePresetLabel } = usePatient();

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b">
      {/* Example Case Banner in Navbar */}
      {activePresetLabel && (
        <div className="w-full bg-amber-500 text-amber-950 font-bold text-xs py-1.5 px-4 text-center tracking-wider uppercase border-b border-amber-600 flex items-center justify-center gap-2 shadow-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-950" />
          <span>{activePresetLabel}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onNavigateHome}
            className="flex items-center gap-2.5 text-left cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-600 to-blue-700 text-white flex items-center justify-center shadow-md shadow-sky-600/20 group-hover:scale-105 transition-transform duration-150">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-black text-xl tracking-tight text-slate-900 dark:text-white">
                  AuraMed
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
                  UTI & PS
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 block -mt-0.5">
                Rev. Clínica: 2026-10-06
              </span>
            </div>
          </button>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-slate-200 dark:border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={onNavigateHome}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                currentPage === 'home'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Patologias
            </button>
            <button
              type="button"
              onClick={onNavigateTools}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                currentPage === 'ferramentas'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Ferramentas Rápidas
            </button>
            <button
              type="button"
              onClick={onNavigateAudit}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                currentPage === 'auditoria'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              <span>Revisão Médica</span>
            </button>
          </nav>
        </div>

        {/* Center/Search Quick Trigger */}
        <div className="flex-1 max-w-xs hidden sm:block">
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-800/40 text-slate-400 text-xs hover:border-slate-300 dark:hover:border-slate-700 transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5" />
              <span>Buscar patologia, score ou dose...</span>
            </div>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md text-slate-500 dark:text-slate-300 shadow-2xs">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Mobile search trigger */}
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="sm:hidden p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Buscar"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Offline indicator if not online */}
          {!isOnline && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold border border-amber-300 dark:border-amber-800">
              <WifiOff className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Offline</span>
            </div>
          )}

          {/* Install PWA Button if available */}
          {isInstallable && (
            <button
              type="button"
              onClick={onInstallPwa}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Instalar App</span>
            </button>
          )}

          {/* Patient Profile Trigger */}
          <button
            type="button"
            onClick={onOpenPatientDrawer}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
              !isValid
                ? 'border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200'
                : !isConfirmed
                ? 'border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 hover:bg-amber-100'
                : 'border-sky-300 dark:border-sky-800 bg-sky-50/80 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 hover:bg-sky-100'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isConfirmed ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            <User className={`w-3.5 h-3.5 shrink-0 ${!isConfirmed ? 'text-amber-600' : 'text-sky-600 dark:text-sky-400'}`} />
            <div className="text-left font-mono">
              {isConfirmed ? (
                <>
                  <span className="font-bold">{patient.weightKg}kg</span>
                  <span className="hidden md:inline text-slate-500 dark:text-slate-400 ml-1">
                    • {metrics ? `PAM ${metrics.map}` : 'Confirmado'}
                  </span>
                </>
              ) : (
                <span className="font-semibold text-amber-900 dark:text-amber-200">
                  <span className="hidden sm:inline">Paciente </span>não confirmado
                </span>
              )}
            </div>
            {!isValid && (
              <AlertTriangle className="w-3 h-3 text-rose-600 ml-0.5 shrink-0" />
            )}
          </button>

          {/* Dark Mode Toggle */}
          <button
            type="button"
            onClick={onToggleDarkMode}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Alternar modo escuro"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
