import React from 'react';
import { RefreshCw, CheckCircle2, X } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export const PwaPrompt: React.FC = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered() {
      // SW registrado
    },
    onRegisterError() {
      // SW erro de registro
    },
  });

  const closeOffline = () => {
    setOfflineReady(false);
  };

  const closeRefresh = () => {
    setNeedRefresh(false);
  };

  return (
    <>
      {/* Banner de pronto para uso offline */}
      {offlineReady && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm p-4 rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-700 space-y-2 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-600 text-white">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold">Modo Offline Pronto</h4>
                <p className="text-[11px] text-slate-300">
                  Protocolos, doses e calculadoras armazenados para acesso sem internet.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={closeOffline}
              className="text-slate-400 hover:text-white p-1 cursor-pointer"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Banner de atualização de conteúdo clínico */}
      {needRefresh && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm p-4 rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-700 space-y-3 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-sky-600 text-white">
                <RefreshCw className="w-4 h-4 animate-spin" />
              </div>
              <div>
                <h4 className="text-sm font-bold">Atualização de Conteúdo Clínico</h4>
                <span className="text-[11px] text-slate-300">
                  Nova versão de diretrizes disponível.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={closeRefresh}
              className="text-slate-400 hover:text-white p-1 cursor-pointer"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-300">
            Atualize agora para sincronizar a base oficial de doses e recomendações.
          </p>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={closeRefresh}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 cursor-pointer"
            >
              Depois
            </button>
            <button
              type="button"
              onClick={() => updateServiceWorker(true)}
              className="px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              Atualizar Agora
            </button>
          </div>
        </div>
      )}
    </>
  );
};
