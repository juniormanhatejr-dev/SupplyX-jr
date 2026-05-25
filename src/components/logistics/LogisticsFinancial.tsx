import React, { useState } from 'react';
import { motion } from 'motion/react';
import { DollarSign, FileText, CheckCircle, ShieldAlert, BadgePercent, ArrowRight, Download } from 'lucide-react';
import { FinancialLedger } from './types';

interface LogisticsFinancialProps {
  isDarkMode: boolean;
  language: 'PT' | 'EN';
  ledgers: FinancialLedger[];
  onConfirmClearance: (id: string) => void;
}

export default function LogisticsFinancial({
  isDarkMode,
  language,
  ledgers,
  onConfirmClearance
}: LogisticsFinancialProps) {
  
  const totalVolumeRevenue = ledgers
    .filter(l => l.status === 'Pago')
    .reduce((a, b) => a + b.totalFreight, 0);

  const supplyxFeesConsolidated = ledgers
    .filter(l => l.status === 'Pago')
    .reduce((a, b) => a + b.feeSupplyX, 0);

  const [clearanceToast, setClearanceToast] = useState<string | null>(null);

  const handleClear = (id: string) => {
    onConfirmClearance(id);
    setClearanceToast(id);
    setTimeout(() => {
      setClearanceToast(null);
    }, 2500);
  };

  return (
    <div className="space-y-8 text-left animate-in fade-in duration-300">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black uppercase italic text-white tracking-tight">
            💳 {language === 'PT' ? 'Faturamento Split B2B Logístico' : 'Integrated Freight Ledger'}
          </h2>
          <p className="text-[10px] text-zinc-550 font-bold text-zinc-500 uppercase tracking-widest mt-1">
            Geração de faturas automatizadas, guias de remessa digital e comissionamento split de fretes SupplyX
          </p>
        </div>
      </div>

      {/* Totals Indicators row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            title: language === 'PT' ? 'Faturamento Transacionado' : 'Consolidated Freight Throughput',
            value: `MT ${totalVolumeRevenue.toLocaleString('pt-BR')}`,
            sub: 'Transações de Carga Conciliadas',
            color: 'text-emerald-400'
          },
          {
            title: 'Split Matchmaking Fee (10%)',
            value: `MT ${supplyxFeesConsolidated.toLocaleString('pt-BR')}`,
            sub: 'Comissão Retida SupplyX Net',
            color: 'text-supplyx-blue'
          },
          {
            title: 'Faturas Pendentes',
            value: `${ledgers.filter(l => l.status === 'Pendente').length} Guias`,
            sub: 'Aguardando validação do fiel depositário',
            color: 'text-amber-500'
          }
        ].map((fin, d) => (
          <div 
            key={d} 
            className={`p-6 rounded-[28px] border ${
              isDarkMode ? 'bg-zinc-900 border-white/5 shadow-inner' : 'bg-white border-zinc-150 shadow-sm'
            }`}
          >
            <p className="text-[8.5px] font-black uppercase text-zinc-500 tracking-wider mb-2">{fin.title}</p>
            <h3 className={`text-xl sm:text-2xl font-black italic tracking-tighter ${fin.color}`}>{fin.value}</h3>
            <p className="text-[8px] font-bold text-zinc-500 uppercase mt-1">{fin.sub}</p>
          </div>
        ))}
      </div>

      {/* Major Ledger grid */}
      <div className={`p-8 rounded-[40px] border ${
        isDarkMode ? 'bg-zinc-900 border-white/5 shadow-2xl' : 'bg-white border-zinc-150'
      }`}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">
              {language === 'PT' ? 'Livro Contábil de Fretes' : 'B2B Freight Invoicing Ledger'}
            </h3>
            <p className="text-[8.5px] font-bold text-zinc-500 uppercase mt-1 tracking-wider leading-none">
              Divisão automática de faturamento: 10% Plataforma / 90% Liquidado ao Transportador
            </p>
          </div>
        </div>

        {clearanceToast && (
          <div className="p-3.5 mb-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-wider rounded-xl animate-bounce">
            ✓ Compensaçao de Pagamento #{clearanceToast} homologada com sucesso! split creditado.
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-[8.5px] font-black uppercase text-zinc-500 tracking-widest">
                <th className="pb-3.5 pl-2">NF-e ID</th>
                <th className="pb-3.5">Carga correspondente</th>
                <th className="pb-3.5">Parceiro Transportador</th>
                <th className="pb-3.5">Fretamento Total Gross</th>
                <th className="pb-3.5">SupplyX Fee Net</th>
                <th className="pb-3.5">Repasse Líquido Carrier</th>
                <th className="pb-3.5">Status</th>
                <th className="pb-3.5 pr-2 text-right">Conciliar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {ledgers.map((item) => (
                <tr key={item.id} className="text-xs font-semibold hover:bg-white/[0.01] transition-colors">
                  <td className="py-4 pl-2 font-mono text-supplyx-blue font-bold">#{item.id}</td>
                  <td className="py-4">
                    <p className="font-bold text-white italic">{item.cargoName}</p>
                    <p className="text-[7.5px] font-black text-zinc-500 uppercase tracking-widest mt-0.5">Ref Cargo: {item.cargoId}</p>
                  </td>
                  <td className="py-4 font-black text-zinc-300">{item.carrier}</td>
                  <td className="py-4 font-mono text-white">MT {item.totalFreight.toLocaleString('pt-BR')}</td>
                  <td className="py-4 font-mono text-teal-400">MT {item.feeSupplyX.toLocaleString('pt-BR')}</td>
                  <td className="py-4 font-mono text-emerald-400">MT {item.netPayout.toLocaleString('pt-BR')}</td>
                  <td className="py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                      item.status === 'Pago'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-4 pr-2 text-right">
                    {item.status === 'Pendente' ? (
                      <button 
                        onClick={() => handleClear(item.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all text-[8.5px] font-black uppercase tracking-widest"
                      >
                        Compensar
                      </button>
                    ) : (
                      <span className="text-[8.5px] font-black uppercase text-zinc-500 tracking-wider">
                        ✓ Consolidado
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
