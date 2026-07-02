import React, { useState } from 'react';
import { motion } from 'motion/react';
import { WifiOff, Database, FileText, Send, RefreshCw, ChevronRight } from 'lucide-react';

interface OfflineViewProps {
  language: 'PT' | 'EN';
  onDismiss: () => void;
}

export default function OfflineView({ language, onDismiss }: OfflineViewProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      setIsRetrying(false);
      if (navigator.onLine) {
        window.location.reload();
      }
    }, 1500);
  };

  const t = {
    PT: {
      title: 'Conexão Restrita',
      subtitle: 'SISTEMA DE OPERAÇÃO SUPPLYX • OFFLINE',
      desc: 'Detetámos que o seu dispositivo não tem uma ligação ativa à Internet neste momento. O sistema mudou automaticamente para o modo de contingência local.',
      localDb: 'Base de Dados Local (IndexedDB)',
      localDbDesc: 'Ativa • Lances, produtos e cotações guardados no cache local continuam acessíveis para leitura.',
      bidding: 'Lances e Negociações em Direto',
      biddingDesc: 'Sincronização Pausada • Seus novos lances serão guardados localmente e submetidos quando voltar a ter rede.',
      downloads: 'Downloads e Documentos Azure',
      downloadsDesc: 'Suspenso • O descarregamento de ficheiros PDF requer uma ligação ativa com os servidores de armazenamento Azure.',
      retry: 'Tentar Reconectar',
      proceed: 'Prosseguir no Modo Offline',
      diagnostics: 'DIAGNÓSTICO DO NÓ LOCAL'
    },
    EN: {
      title: 'Connection Restricted',
      subtitle: 'SUPPLYX OPERATIONS OS • OFFLINE',
      desc: 'We detected that your device currently has no active Internet connection. The system has automatically shifted into local contingency mode.',
      localDb: 'Local Database (IndexedDB)',
      localDbDesc: 'Active • Saved bids, materials, and quotations in local browser storage remain accessible.',
      bidding: 'Bidding & Live Negotiations',
      biddingDesc: 'Sync Paused • Your new lances will be queued locally and processed immediately upon reconnection.',
      downloads: 'Azure File Downloads',
      downloadsDesc: 'Suspended • Downloading quotation PDF files requires an active cloud storage connection.',
      retry: 'Retry Reconnection',
      proceed: 'Proceed in Offline Mode',
      diagnostics: 'LOCAL NODE DIAGNOSTICS'
    }
  }[language];

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-zinc-950 p-4 sm:p-6 overflow-y-auto">
      {/* Background patterns */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-supplyx-blue/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-amber-500/5 blur-[150px] rounded-full" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", duration: 0.6 }}
        className="relative w-full max-w-2xl bg-zinc-900 border border-white/5 rounded-[32px] p-6 sm:p-10 shadow-2xl shadow-black/90 text-left z-10 space-y-8"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-6 border-b border-white/5">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
            <WifiOff className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-supplyx-blue">
              {t.subtitle}
            </p>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white">
              {t.title}
            </h2>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm leading-relaxed text-zinc-400">
          {t.desc}
        </p>

        {/* Status Dashboard */}
        <div className="space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
            {t.diagnostics}
          </p>

          <div className="space-y-3">
            {/* Local Storage */}
            <div className="p-4 rounded-2xl bg-zinc-950/40 border border-white/5 flex gap-4 items-start">
              <div className="w-8 h-8 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500 shrink-0 mt-0.5">
                <Database className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                  {t.localDb}
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                </h4>
                <p className="text-[11px] leading-relaxed text-zinc-500">{t.localDbDesc}</p>
              </div>
            </div>

            {/* Bids Queue */}
            <div className="p-4 rounded-2xl bg-zinc-950/40 border border-white/5 flex gap-4 items-start">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0 mt-0.5">
                <Send className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                  {t.bidding}
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                </h4>
                <p className="text-[11px] leading-relaxed text-zinc-500">{t.biddingDesc}</p>
              </div>
            </div>

            {/* Downloads Blocked */}
            <div className="p-4 rounded-2xl bg-zinc-950/40 border border-white/5 flex gap-4 items-start">
              <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0 mt-0.5">
                <FileText className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                  {t.downloads}
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                </h4>
                <p className="text-[11px] leading-relaxed text-zinc-500">{t.downloadsDesc}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="flex-1 py-4 bg-white text-zinc-950 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-200 disabled:opacity-75 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-white/5"
          >
            <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? (language === 'PT' ? 'VERIFICANDO...' : 'CHECKING...') : t.retry}
          </button>
          <button
            onClick={onDismiss}
            className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/5"
          >
            {t.proceed}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
