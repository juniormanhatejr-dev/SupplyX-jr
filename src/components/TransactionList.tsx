import { motion } from 'motion/react';
import { FileText, MoreHorizontal } from 'lucide-react';

interface TransactionListProps {
  isDarkMode?: boolean;
  userType?: 'buyer' | 'supplier';
  language?: 'PT' | 'EN';
  onNavigate?: (tab: string) => void;
}

export default function TransactionList({ isDarkMode, userType = 'buyer', language = 'PT', onNavigate }: TransactionListProps) {
  const isSupplier = userType === 'supplier';

  const t = {
    PT: {
      title: isSupplier ? 'Vendas e Pedidos Recentes' : 'Pedidos e Cotações Recentes',
      viewAll: 'Ver tudo',
      headers: {
        entity: isSupplier ? 'Cliente' : 'Fornecedor',
        item: 'Item Principal',
        value: 'Valor',
        status: 'Status'
      },
      statuses: {
        finished: 'Finalizado',
        pending: 'Pendente',
        quoting: 'Em Cotação',
        cancelled: 'Cancelado'
      },
      dates: {
        today: 'Hoje',
        yesterday: 'Ontem'
      }
    },
    EN: {
      title: isSupplier ? 'Recent Sales & Orders' : 'Recent Orders & Quotes',
      viewAll: 'View all',
      headers: {
        entity: isSupplier ? 'Client' : 'Supplier',
        item: 'Main Item',
        value: 'Value',
        status: 'Status'
      },
      statuses: {
        finished: 'Finished',
        pending: 'Pending',
        quoting: 'Quoting',
        cancelled: 'Cancelled'
      },
      dates: {
        today: 'Today',
        yesterday: 'Yesterday'
      }
    }
  }[language];

  const orders: any[] = [];

  return (
    <div className={`rounded-[32px] border transition-all overflow-hidden ${
      isDarkMode ? 'bg-zinc-900 border-white/5 shadow-2xl' : 'bg-white border-zinc-100 shadow-sm'
    }`} id="transactions-container">
      <div className={`p-10 border-b flex justify-between items-center ${isDarkMode ? 'border-white/5' : 'border-zinc-50'}`}>
        <div className="flex items-center gap-4">
          <div className="w-1 h-10 bg-supplyx-blue rounded-full" />
          <div>
            <h3 className={`text-xl font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
              {t.title}
            </h3>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 mt-1">Institutional Ledger • 0x24F</p>
          </div>
        </div>
        <button 
          onClick={() => onNavigate?.('Pedidos / Cotações')}
          className="px-6 py-3 rounded-lg bg-zinc-800 text-[10px] font-black uppercase tracking-widest text-supplyx-blue hover:bg-supplyx-blue hover:text-white transition-all shadow-xl active:scale-95"
        >
          {t.viewAll}
        </button>
      </div>
      
      <div className="overflow-x-auto custom-scrollbar">
        <div className="min-w-[800px] lg:min-w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`${isDarkMode ? 'bg-zinc-800/50' : 'bg-zinc-50'} border-y border-white/5`}>
                <th className="px-10 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">
                  {t.headers.entity}
                </th>
                <th className="px-10 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">{t.headers.item}</th>
                <th className="px-10 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">{t.headers.value}</th>
                <th className="px-10 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">{t.headers.status}</th>
                <th className="px-10 py-5"></th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-white/5' : 'divide-zinc-50'}`}>
              {orders.map((order, index) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-zinc-50/50'} transition-all cursor-pointer group`}
                >
                  <td className="px-10 py-7 whitespace-nowrap">
                    <div className="flex items-center gap-6">
                      <div className="font-mono text-[10px] font-black text-supplyx-blue bg-supplyx-blue/5 px-3 py-2 rounded-lg border border-supplyx-blue/10">
                        {order.id}
                      </div>
                      <span className={`text-base font-black uppercase tracking-tight ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>{order.supplier}</span>
                    </div>
                  </td>
                  <td className="px-10 py-7 whitespace-nowrap">
                    <div className={`text-sm font-medium ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      {order.item}
                    </div>
                  </td>
                  <td className="px-10 py-7 whitespace-nowrap">
                    <span className={`text-base font-mono font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{order.amount}</span>
                  </td>
                  <td className="px-10 py-7 whitespace-nowrap">
                    <span className={`inline-flex items-center px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] border
                      ${order.status === t.statuses.finished ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                        order.status === t.statuses.pending ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                        order.status === t.statuses.quoting ? 'bg-supplyx-blue/10 text-supplyx-blue border-supplyx-blue/20' :
                        'bg-white/5 text-zinc-500 border-white/10'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-10 py-7 text-right">
                    <button className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-supplyx-blue hover:text-white">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
