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
    <div className={`rounded-3xl border shadow-sm transition-all overflow-hidden ${
      isDarkMode ? 'bg-zinc-900 border-zinc-800 shadow-2xl' : 'bg-white border-zinc-200'
    }`} id="transactions-container">
      <div className={`p-4 md:p-8 border-b flex justify-between items-center ${isDarkMode ? 'border-zinc-800' : 'border-zinc-50'}`}>
        <h3 className={`text-lg font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
          {t.title}
        </h3>
        <button 
          className="text-[10px] font-black uppercase tracking-widest text-brand hover:underline"
        >
          {t.viewAll}
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <div className="min-w-[800px] lg:min-w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`${isDarkMode ? 'bg-zinc-950/50 border-zinc-800' : 'bg-zinc-50 border-zinc-100'} border-y`}>
                <th className="px-6 py-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  {t.headers.entity}
                </th>
                <th className="px-6 py-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest">{t.headers.item}</th>
                <th className="px-6 py-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest">{t.headers.value}</th>
                <th className="px-6 py-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest">{t.headers.status}</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-zinc-800' : 'divide-zinc-50'}`}>
              {orders.map((order, index) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`${isDarkMode ? 'hover:bg-brand/5' : 'hover:bg-zinc-50/50'} transition-all cursor-pointer group`}
                >
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[10px] shrink-0 border transition-colors ${
                        isDarkMode ? 'bg-zinc-800 text-zinc-500 border-zinc-700 group-hover:border-brand/40' : 'bg-zinc-100 text-zinc-400 border-transparent transition-colors'
                      }`}>
                        {order.id}
                      </div>
                      <span className={`text-sm font-black italic tracking-tight ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>{order.supplier}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className={`flex items-center gap-2 text-sm font-bold ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      <FileText className="w-4 h-4 text-brand shrink-0" />
                      {order.item}
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span className={`text-sm font-black italic tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{order.amount}</span>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest
                      ${order.status === t.statuses.finished ? 'bg-emerald-500/10 text-emerald-500' : 
                        order.status === t.statuses.pending ? 'bg-amber-500/10 text-amber-500' : 
                        order.status === t.statuses.quoting ? 'bg-blue-500/10 text-blue-500' :
                        'bg-zinc-800 text-zinc-500'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 opacity-0 group-hover:opacity-100 transition-all">
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
