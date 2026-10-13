import React, { useState, useEffect } from 'react';
import { PatientProvider } from './context/PatientContext';
import { PediatricProvider } from './context/PediatricContext';
import { Navbar } from './components/layout/Navbar';
import { ReadingProgress } from './components/layout/ReadingProgress';
import { CommandPalette } from './components/layout/CommandPalette';
import { PatientDrawer } from './components/ui/PatientDrawer';
import { PwaPrompt } from './components/layout/PwaPrompt';
import { HomePage } from './pages/HomePage';
import { ProtocolPage } from './pages/ProtocolPage';
import { AuditPage } from './pages/AuditPage';
import { QuickToolsPage } from './pages/QuickToolsPage';
import { PediatricArrestPage } from './pages/PediatricArrestPage';
import { CLINICAL_PROTOCOLS } from '../data/mock-protocols';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'protocolo' | 'auditoria' | 'ferramentas' | 'pediatria'>('home');
  const [selectedProtocolId, setSelectedProtocolId] = useState<string>('choque_septico');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isPatientDrawerOpen, setIsPatientDrawerOpen] = useState(false);

  // Dark mode management
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return (
        window.matchMedia('(prefers-color-scheme: dark)').matches ||
        document.documentElement.classList.contains('dark')
      );
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Online status
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // PWA Install prompt listener
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallPwa = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
      setDeferredPrompt(null);
    }
  };

  // Keyboard shortcut for Command Palette (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentProtocol = CLINICAL_PROTOCOLS.find((p) => p.id === selectedProtocolId) || CLINICAL_PROTOCOLS[0];

  const handleSelectProtocol = (id: string) => {
    setSelectedProtocolId(id);
    setCurrentPage('protocolo');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <PatientProvider>
      <PediatricProvider>
        <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 flex flex-col selection:bg-sky-500/20 selection:text-sky-900 dark:selection:text-sky-200">
          <ReadingProgress />

          <Navbar
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            onOpenPatientDrawer={() => setIsPatientDrawerOpen(true)}
            onNavigateHome={() => {
              setCurrentPage('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigateAudit={() => {
              setCurrentPage('auditoria');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigateTools={() => {
              setCurrentPage('ferramentas');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigatePediatric={() => {
              setCurrentPage('pediatria');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            currentPage={currentPage}
            darkMode={darkMode}
            onToggleDarkMode={() => setDarkMode((prev) => !prev)}
            isInstallable={isInstallable}
            onInstallPwa={handleInstallPwa}
            isOnline={isOnline}
          />

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            {currentPage === 'home' && (
              <HomePage
                onSelectProtocol={handleSelectProtocol}
                onNavigateAudit={() => {
                  setCurrentPage('auditoria');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onNavigateTools={() => {
                  setCurrentPage('ferramentas');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onNavigatePediatric={() => {
                  setCurrentPage('pediatria');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}

            {currentPage === 'protocolo' && (
              <ProtocolPage
                protocolo={currentProtocol}
                onBack={() => {
                  setCurrentPage('home');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onOpenPatientDrawer={() => setIsPatientDrawerOpen(true)}
              />
            )}

            {currentPage === 'auditoria' && (
              <AuditPage
                onBack={() => {
                  setCurrentPage('home');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}

            {currentPage === 'ferramentas' && (
              <QuickToolsPage
                onBack={() => {
                  setCurrentPage('home');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}

            {currentPage === 'pediatria' && (
              <PediatricArrestPage
                onBack={() => {
                  setCurrentPage('home');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}
          </main>

          {/* Global Footer */}
          <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-8 text-xs text-slate-500 dark:text-slate-400 print:hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-serif font-bold text-slate-900 dark:text-white text-base">
                    AuraMed Emergência & UTI
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    Conteúdo em validação
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentPage('pediatria');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-slate-900 dark:hover:text-white cursor-pointer text-rose-600 dark:text-rose-400 font-semibold"
                  >
                    PCR Pediátrica
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage('auditoria')}
                    className="hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  >
                    Checklist de Revisão Médica
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPatientDrawerOpen(true)}
                    className="hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  >
                    Perfil do Paciente
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-600 dark:text-slate-300 font-medium">
                Conteúdo de apoio à decisão clínica. Não substitui o julgamento médico. Nenhum dado do paciente é armazenado ou transmitido (LGPD).
              </div>

              <div className="text-center text-[11px] text-slate-400 font-mono">
                Guidelines Oficiais de Referência: Surviving Sepsis Campaign 2026 • ATS 2025 • ACC/AHA • PALS 2025 • KDIGO • ISMP Brasil
              </div>
            </div>
          </footer>

          {/* Drawers and Modals */}
          <PatientDrawer
            isOpen={isPatientDrawerOpen}
            onClose={() => setIsPatientDrawerOpen(false)}
          />

          <CommandPalette
            isOpen={isCommandPaletteOpen}
            onClose={() => setIsCommandPaletteOpen(false)}
            onSelectProtocol={handleSelectProtocol}
            onNavigateHome={() => {
              setCurrentPage('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigateAudit={() => {
              setCurrentPage('auditoria');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigateTools={() => {
              setCurrentPage('ferramentas');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigatePediatric={() => {
              setCurrentPage('pediatria');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenPatientDrawer={() => setIsPatientDrawerOpen(true)}
          />

          <PwaPrompt />
        </div>
      </PediatricProvider>
    </PatientProvider>
  );
}
