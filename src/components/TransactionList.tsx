import { motion } from 'motion/react';
import { FileText, MoreHorizontal } from 'lucide-react';

interface TransactionListProps {
  isDarkMode?: boolean;
  userType?: 'buyer' | 'supplier';
  language?: 'PT' | 'EN';
}

export default function TransactionList({ isDarkMode, userType = 'buyer', language = 'PT' }: TransactionListProps) {
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

  const orders = [
    { id: 'OC-2401', supplier: 'Votorantim Cimentos', item: language === 'PT' ? 'Cimento CP-II' : 'Cement CP-II', amount: 'MT 12.450', status: t.statuses.finished, date: `14:20` },
    { id: 'OC-2402', supplier: 'Gerdau S.A.', item: language === 'PT' ? 'Vergalhão CA-50' : 'CA-50 Rebar', amount: 'MT 45.890', status: t.statuses.pending, date: `13:45` },
    { id: 'OC-2403', supplier: 'Tigre Tubos', item: language === 'PT' ? 'Tubulação PVC 100mm' : 'PVC Tubing 100mm', amount: 'MT 3.210', status: t.statuses.quoting, date: `12:10` },
    { id: 'OC-2404', supplier: 'Amanco Wavin', item: language === 'PT' ? 'Conexões Hidráulicas' : 'Hydraulic Fittings', amount: 'MT 1.150', status: t.statuses.finished, date: `11:30` },
    { id: 'OC-2405', supplier: 'Saint-Gobain', item: language === 'PT' ? 'Argamassa AC-III' : 'Mortar AC-III', amount: 'MT 8.900', status: t.statuses.cancelled, date: `18:20` },
  ];

  return (
    <div className={`rounded-[48px] border shadow-3xl transition-all overflow-hidden ${
      isDarkMode ? 'bg-supplyx-dark border-white/5' : 'bg-white border-zinc-200'
    }`} id="transactions-container">
      <div className={`p-8 md:p-10 border-b flex justify-between items-center ${isDarkMode ? 'border-white/5' : 'border-zinc-50'}`}>
        <div>
          <h3 className={`text-xl font-black italic uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
            {t.title}
          </h3>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mt-1">Live updates from supply chain</p>
        </div>
        <button 
          className="px-6 py-3 rounded-2xl bg-white/5 text-[10px] font-black uppercase tracking-widest text-supplyx-blue hover:bg-supplyx-blue hover:text-white transition-all shadow-xl shadow-blue-500/10 active:scale-95"
        >
          {t.viewAll}
        </button>
      </div>
      
      <div className="overflow-x-auto custom-scrollbar">
        <div className="min-w-[800px] lg:min-w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`${isDarkMode ? 'bg-supplyx-deep border-white/5' : 'bg-zinc-50 border-zinc-100'} border-y`}>
                <th className="px-10 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">
                  {t.headers.entity}
                </th>
                <th className="px-10 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">{t.headers.item}</th>
                <th className="px-10 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">{t.headers.value}</th>
                <th className="px-10 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">{t.headers.status}</th>
                <th className="px-10 py-5"></th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-white/5' : 'divide-zinc-50'}`}>
              {orders.map((order, index) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-zinc-50/50'} transition-all cursor-pointer group`}
                >
                  <td className="px-10 py-7 whitespace-nowrap">
                    <div className="flex items-center gap-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-[10px] shrink-0 border-2 transition-all group-hover:scale-110 shadow-xl ${
                        isDarkMode ? 'bg-supplyx-deep text-zinc-400 border-white/5 group-hover:border-supplyx-blue/50 group-hover:text-supplyx-blue shadow-black' : 'bg-zinc-100 text-zinc-400 border-transparent transition-colors shadow-black/5'
                      }`}>
                        {order.id}
                      </div>
                      <span className={`text-sm font-black italic tracking-tight ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>{order.supplier}</span>
                    </div>
                  </td>
                  <td className="px-10 py-7 whitespace-nowrap">
                    <div className={`flex items-center gap-3 text-sm font-bold ${isDarkMode ? 'text-zinc-400 text-glow' : 'text-zinc-600'}`}>
                      <div className="w-8 h-8 rounded-xl bg-supplyx-blue/10 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-supplyx-blue shrink-0" />
                      </div>
                      {order.item}
                    </div>
                  </td>
                  <td className="px-10 py-7 whitespace-nowrap">
                    <span className={`text-base font-black italic tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{order.amount}</span>
                  </td>
                  <td className="px-10 py-7 whitespace-nowrap">
                    <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm
                      ${order.status === t.statuses.finished ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-emerald-500/10' : 
                        order.status === t.statuses.pending ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-amber-500/10' : 
                        order.status === t.statuses.quoting ? 'bg-blue-500/10 text-supplyx-blue border-supplyx-blue/20 shadow-supplyx-blue/10' :
                        'bg-white/5 text-zinc-500 border-white/10 shadow-black'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-10 py-7 text-right">
                    <button className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-zinc-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-supplyx-blue hover:text-white shadow-xl shadow-black">
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
