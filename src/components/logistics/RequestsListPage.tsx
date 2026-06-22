import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Trash, Package, MapPin } from 'lucide-react';
import { CargoRequest } from './types';

interface RequestsListPageProps {
  isDarkMode: boolean;
  language: 'PT' | 'EN';
  requests: CargoRequest[];
  onSelectRequest: (id: string) => void;
  onDeleteRequest: (id: string) => void;
  userType?: string;
}

export default function RequestsListPage({
  isDarkMode,
  language,
  requests = [],
  onSelectRequest,
  onDeleteRequest,
  userType
}: RequestsListPageProps) {
  
  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteRequest(id);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="space-y-6 text-left"
    >
      <div>
        <h2 className="text-xl font-black uppercase italic text-white tracking-tight">
          📋 {language === 'PT' ? 'Dossiês de Solicitações Ativas' : 'Active Shipping Files'}
        </h2>
        <p className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-widest mt-1">
          Histórico e progresso de carregamentos licenciados no mercado regional
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {requests.map((req) => {
          const isConcurso = (req.status || '').toLowerCase().includes('concurso') || (req.status || '').toLowerCase().includes('competition');
          const isEntregue = (req.status || '').toLowerCase().includes('entregue') || (req.status || '').toLowerCase().includes('delivered');
          
          // Enhanced styling if under bidding (concurso) to highlight / destacar it
          const cardClass = isConcurso
            ? `p-6 rounded-[32px] border-2 transition-all cursor-pointer group hover:scale-[1.02] flex flex-col justify-between min-h-[220px] relative overflow-hidden ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-amber-500/[0.04] to-zinc-900 border-amber-500/50 hover:border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.12)]' 
                  : 'bg-gradient-to-br from-amber-50/50 to-white border-amber-400 hover:border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.08)]'
              }`
            : `p-6 rounded-[32px] border transition-all cursor-pointer group hover:scale-[1.01] flex flex-col justify-between min-h-[200px] ${
                isDarkMode ? 'bg-zinc-900 border-white/5 hover:border-supplyx-blue shadow-2xl' : 'bg-white border-zinc-150 shadow-sm hover:border-zinc-300'
              }`;

          return (
            <div
              key={req.id}
              onClick={() => onSelectRequest(req.id)}
              className={cardClass}
              id={`dossier-card-${req.id}`}
            >
              {isConcurso && (
                <div className="absolute top-0 right-0 h-16 w-16 pointer-events-none">
                  {/* Glowing decorative corner */}
                  <div className="absolute top-[-15px] right-[-15px] w-8 h-8 bg-amber-500 blur-lg rounded-full opacity-60 animate-pulse"></div>
                  <div className="absolute top-3 right-3 bg-amber-500 text-white font-black text-[7px] tracking-widest uppercase px-2 py-0.5 rounded-full rotate-12 shadow-sm">
                    {language === 'PT' ? 'Destaque' : 'Featured'}
                  </div>
                </div>
              )}

              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border font-mono ${
                      isConcurso 
                        ? 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/30' 
                        : 'bg-supplyx-blue/10 text-supplyx-blue border-supplyx-blue/15'
                    }`}>
                      #{req.id}
                    </span>
                    {isConcurso && (
                      <span className="animate-ping h-2.5 w-2.5 rounded-full bg-amber-500 inline-block"></span>
                    )}
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[8.5px] font-black uppercase tracking-wider border ${
                    isConcurso
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30'
                      : isEntregue
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : 'bg-supplyx-blue/10 text-supplyx-blue border-supplyx-blue/20'
                  }`}>
                    {req.status}
                  </span>
                </div>

                <h3 className={`text-md font-black italic truncate leading-none mb-1.5 ${
                  isConcurso 
                    ? 'text-amber-600 dark:text-amber-400 text-base' 
                    : (isDarkMode ? 'text-white' : 'text-zinc-950')
                }`}>{req.tipoCarga}</h3>
                
                <p className={`text-[10px] font-semibold ${isDarkMode ? 'text-zinc-500' : 'text-zinc-650'}`}>
                  {language === 'PT' ? 'Quantidade' : 'Payload'}: {req.quantidade}
                </p>
                
                <div className={`mt-4 pt-3 border-t space-y-1 ${
                  isConcurso
                    ? (isDarkMode ? 'border-amber-500/10 text-zinc-300' : 'border-amber-500/15 text-zinc-700')
                    : (isDarkMode ? 'border-white/[0.03] text-zinc-400' : 'border-zinc-100 text-zinc-650')
                }`}>
                  <p className="text-[9.5px] font-bold truncate">📍 {req.origem}</p>
                  <p className="text-[9.5px] font-bold truncate">🏁 {req.destino}</p>
                </div>
              </div>

              <div className={`flex justify-between items-center mt-6 pt-3 border-t ${
                isConcurso 
                  ? (isDarkMode ? 'border-amber-500/10' : 'border-amber-500/15') 
                  : (isDarkMode ? 'border-white/[0.03]' : 'border-zinc-100')
              }`}>
                <span className="text-[8.5px] font-black uppercase text-zinc-500">
                  {language === 'PT' ? 'Solicitado por:' : 'FOB:'}{' '}
                  <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-zinc-850'}`}>
                    {req.requesterName || (req.requester === 'Client' ? (language === 'PT' ? 'Cliente' : 'Client') : (language === 'PT' ? 'Fornecedor' : 'Supplier'))}
                  </span>
                </span>

                <div className="flex items-center gap-2">
                  {req.id.startsWith('TR-2025-000') === false && userType !== 'logistics' && (
                    <button 
                      onClick={(e) => handleDelete(req.id, e)}
                      className="p-1 px-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white text-[8px] font-bold hover:shadow-md transition-all uppercase"
                    >
                      {language === 'PT' ? 'Excluir' : 'Remove'}
                    </button>
                  )}
                  <span className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1 group-hover:translate-x-1 transition-transform ${
                    isConcurso ? 'text-amber-500' : 'text-supplyx-blue'
                  }`}>
                    {language === 'PT' ? 'Ver' : 'View'} <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {requests.length === 0 && (
          <div className="col-span-1 md:col-span-3 p-12 text-center border border-dashed border-zinc-800 rounded-3xl">
            <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">Nenhuma carga livre encontrada.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
