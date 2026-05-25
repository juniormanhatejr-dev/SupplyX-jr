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
}

export default function RequestsListPage({
  isDarkMode,
  language,
  requests,
  onSelectRequest,
  onDeleteRequest
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
        {requests.map((req) => (
          <div
            key={req.id}
            onClick={() => onSelectRequest(req.id)}
            className={`p-6 rounded-[32px] border transition-all cursor-pointer group hover:scale-[1.01] flex flex-col justify-between min-h-[200px] ${
              isDarkMode ? 'bg-zinc-900 border-white/5 hover:border-supplyx-blue shadow-2xl' : 'bg-white border-zinc-150'
            }`}
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="text-[9px] font-black text-supplyx-blue bg-supplyx-blue/10 px-2.5 py-1 rounded-full border border-supplyx-blue/15 font-mono">
                  #{req.id}
                </span>

                <span className={`px-2.5 py-1 rounded-full text-[8.5px] font-black uppercase tracking-wider border ${
                  req.status === 'Entregue' 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : req.status === 'Em Transporte' 
                      ? 'bg-supplyx-blue/10 text-supplyx-blue border-supplyx-blue/20 animate-pulse'
                      : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                }`}>
                  {req.status}
                </span>
              </div>

              <h3 className="text-md font-black text-white italic truncate leading-none mb-1.5">{req.tipoCarga}</h3>
              <p className="text-[10px] text-zinc-500 font-semibold">{language === 'PT' ? 'Quantidade' : 'Payload'}: {req.quantidade}</p>
              
              <div className="mt-4 pt-3 border-t border-white/[0.03] space-y-1 text-zinc-400">
                <p className="text-[9.5px] font-bold truncate">📍 {req.origem}</p>
                <p className="text-[9.5px] font-bold truncate">🏁 {req.destino}</p>
              </div>
            </div>

            <div className="flex justify-between items-center mt-6 pt-3 border-t border-white/[0.03]">
              <span className="text-[8.5px] font-black uppercase text-zinc-500">
                {language === 'PT' ? 'Fretado por:' : 'FOB:'} {req.requester === 'Client' ? (language === 'PT' ? 'Cliente' : 'Client') : (language === 'PT' ? 'Fornecedor' : 'Supplier')}
              </span>

              <div className="flex items-center gap-2">
                {req.id.startsWith('TR-2025-000') === false && (
                  <button 
                    onClick={(e) => handleDelete(req.id, e)}
                    className="p-1 px-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white text-[8px] font-bold hover:shadow-md transition-all uppercase"
                  >
                    {language === 'PT' ? 'Excluir' : 'Remove'}
                  </button>
                )}
                <span className="text-[9px] font-black text-supplyx-blue uppercase tracking-widest flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Ver <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>
        ))}

        {requests.length === 0 && (
          <div className="col-span-1 md:col-span-3 p-12 text-center border border-dashed border-zinc-800 rounded-3xl">
            <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">Nenhuma carga livre encontrada.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
