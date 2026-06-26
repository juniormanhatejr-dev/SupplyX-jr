import React from 'react';
import { motion } from 'motion/react';
import { X, Play, Pause, AlertCircle, WifiOff, CheckCircle } from 'lucide-react';

interface UploadProgressProps {
  progress: number;
  status: 'idle' | 'enviando' | 'concluido' | 'falha' | 'cancelado' | 'pausado' | 'offline';
  fileName: string;
  error?: string | null;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
  onReset?: () => void;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({
  progress,
  status,
  fileName,
  error,
  onPause,
  onResume,
  onCancel,
  onReset
}) => {
  if (status === 'idle') return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      className="p-4 rounded-2xl border bg-zinc-900 border-zinc-800 text-white shadow-xl max-w-sm w-full fixed bottom-24 right-6 z-40 overflow-hidden"
    >
      {/* Background neon effect based on status */}
      <div 
        className={`absolute -right-12 -top-12 w-24 h-24 rounded-full filter blur-3xl opacity-20 transition-all duration-300 ${
          status === 'concluido' ? 'bg-emerald-500' :
          status === 'falha' ? 'bg-red-500' :
          status === 'offline' ? 'bg-amber-500' : 'bg-teal-500'
        }`}
      />

      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase text-zinc-500 tracking-wider">
            {status === 'concluido' ? 'Enviado' :
             status === 'falha' ? 'Falha no Upload' :
             status === 'cancelado' ? 'Cancelado' :
             status === 'pausado' ? 'Pausado' :
             status === 'offline' ? 'Offline' : 'Enviando arquivo...'}
          </p>
          <p className="text-xs font-bold text-zinc-300 truncate max-w-[200px]" title={fileName}>
            {fileName}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          {status === 'enviando' && onPause && (
            <button
              onClick={onPause}
              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
              title="Pausar envio"
            >
              <Pause className="w-3.5 h-3.5" />
            </button>
          )}

          {status === 'pausado' && onResume && (
            <button
              onClick={onResume}
              className="p-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 rounded-lg transition-colors animate-pulse"
              title="Retomar envio"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
            </button>
          )}

          {(status === 'enviando' || status === 'pausado' || status === 'offline') && onCancel && (
            <button
              onClick={onCancel}
              className="p-1.5 bg-zinc-800 hover:bg-red-500/20 hover:text-red-400 text-zinc-400 rounded-lg transition-colors"
              title="Cancelar envio"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {(status === 'concluido' || status === 'falha' || status === 'cancelado') && onReset && (
            <button
              onClick={onReset}
              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg transition-colors text-[10px] font-black uppercase tracking-wider"
            >
              OK
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar & Status Text */}
      <div className="space-y-1.5">
        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden relative">
          <motion.div
            className={`h-full rounded-full transition-all duration-300 ${
              status === 'concluido' ? 'bg-emerald-500' :
              status === 'falha' ? 'bg-red-500' :
              status === 'offline' ? 'bg-amber-500 animate-pulse' :
              status === 'pausado' ? 'bg-zinc-500' : 'bg-teal-400'
            }`}
            animate={{ width: `${progress}%` }}
            transition={{ ease: 'easeInOut', duration: 0.2 }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px]">
          {/* Status Label & Icon */}
          <div className="flex items-center gap-1 font-bold">
            {status === 'offline' && (
              <span className="flex items-center gap-1 text-amber-400">
                <WifiOff className="w-3 h-3" /> Pausado: Sem conexão
              </span>
            )}
            {status === 'enviando' && (
              <span className="text-teal-400">Processando ({progress}%)</span>
            )}
            {status === 'concluido' && (
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle className="w-3 h-3" /> Arquivo carregado
              </span>
            )}
            {status === 'falha' && (
              <span className="flex items-center gap-1 text-red-400">
                <AlertCircle className="w-3 h-3" /> {error || 'Erro desconhecido'}
              </span>
            )}
            {status === 'pausado' && (
              <span className="text-zinc-400">Upload pausado</span>
            )}
            {status === 'cancelado' && (
              <span className="text-red-400">Operação cancelada</span>
            )}
          </div>
          <span className="text-zinc-500 font-black tracking-wider">{progress}%</span>
        </div>
      </div>
    </motion.div>
  );
};
