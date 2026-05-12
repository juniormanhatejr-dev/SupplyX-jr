import { 
  DollarSign, 
  CircleDollarSign, 
  ArrowUpRight, 
  CreditCard,
  Calendar,
  Zap
} from 'lucide-react';
import { motion } from 'motion/react';
import StatCard from './StatCard';
import SalesChart from './SalesChart';
import BudgetDonutChart from './BudgetDonutChart';
import TransactionList from './TransactionList';

interface DashboardViewProps {
  onActivateIA: () => void;
  onCategoryClick?: (category: string) => void;
  isDarkMode?: boolean;
  language?: 'PT' | 'EN';
  userType?: 'buyer' | 'supplier';
}

export default function DashboardView({ onActivateIA, onCategoryClick, isDarkMode, language, userType = 'buyer' }: DashboardViewProps) {
  const translations = {
    PT: {
      stats: {
        total: userType === 'supplier' ? 'Faturamento Total (YTD)' : 'Total Comprado (Até agora)',
        open: userType === 'supplier' ? 'Novas Cotações (Lead)' : 'Solicitações em Aberto',
        saving: userType === 'supplier' ? 'Valor Médio Pedido/Item' : 'Economia Gerada',
        suppliers: userType === 'supplier' ? 'Alcance / Visualizações' : 'Fornecedores Ativos',
        newToday: 'Nova hoje',
        newTodayMany: 'novos hoje',
        newAdded: 'novos'
      },
      categories: 'Categorias em Destaque',
      aiTitle: 'SupplyX Intelligence',
      aiDesc: 'Receba sugestões automáticas de materiais com melhor preço e prazo.',
      aiBtn: 'Ativar IA',
      deliveries: 'Entregas Programadas',
      tomorrow: 'Amanhã',
      unitsLabel: 'unidades',
      cementDesc: 'Cimento CP-II (200 sacas)',
      rebarDesc: 'Vergalhão CA-50',
      sandDesc: 'Areia Lavada (8m³)',
      catNames: {
        'Estrutural': 'Estrutural',
        'Básicos': 'Básicos',
        'Acabamento': 'Acabamento',
        'Hidráulica': 'Hidráulica',
        'Elétrica': 'Elétrica',
        'Ferramentas': 'Ferramentas'
      }
    },
    EN: {
      stats: {
        total: userType === 'supplier' ? 'Total Revenue (YTD)' : 'Total Purchased (YTD)',
        open: userType === 'supplier' ? 'New Quotes (Lead)' : 'Open Requests',
        saving: userType === 'supplier' ? 'Avg Order/Item Value' : 'Generated Savings',
        suppliers: userType === 'supplier' ? 'Reach / Views' : 'Active Suppliers',
        newToday: 'New today',
        newTodayMany: 'new today',
        newAdded: 'new'
      },
      categories: 'Featured Categories',
      aiTitle: 'SupplyX Intelligence',
      aiDesc: 'Get automatic suggestions for materials with best price and lead time.',
      aiBtn: 'Activate AI',
      deliveries: 'Scheduled Deliveries',
      tomorrow: 'Tomorrow',
      unitsLabel: 'units',
      cementDesc: 'Cement CP-II (200 bags)',
      rebarDesc: 'Rebar CA-50',
      sandDesc: 'Washed Sand (8m³)',
      catNames: {
        'Estrutural': 'Structural',
        'Básicos': 'Building Materials',
        'Acabamento': 'Finishing',
        'Hidráulica': 'Plumbing',
        'Elétrica': 'Electrical',
        'Ferramentas': 'Tools'
      }
    }
  };

  const t = translations[language || 'PT'];

  const buyerStats: { label: string; value: string; change: string; trend: 'up' | 'down'; icon: any }[] = [
    { label: t.stats.total, value: "MT 842.150", change: "+18.4%", trend: "up", icon: DollarSign },
    { label: t.stats.open, value: "14", change: t.stats.newToday, trend: "up", icon: CircleDollarSign },
    { label: t.stats.saving, value: "MT 52.400", change: "+2.4%", trend: "up", icon: ArrowUpRight },
    { label: t.stats.suppliers, value: "156", change: `+4 ${t.stats.newAdded}`, trend: "up", icon: CreditCard },
  ];

  const supplierStats: { label: string; value: string; change: string; trend: 'up' | 'down'; icon: any }[] = [
    { label: t.stats.total, value: "MT 1.2M", change: "+42.5%", trend: "up", icon: ArrowUpRight },
    { label: t.stats.open, value: "28", change: `8 ${t.stats.newAdded}`, trend: "up", icon: CircleDollarSign },
    { label: t.stats.saving, value: "MT 4.200", change: "-1.2%", trend: "down", icon: DollarSign },
    { label: t.stats.suppliers, value: "8.4K", change: "+210", trend: "up", icon: CreditCard },
  ];

  const activeStats = userType === 'supplier' ? supplierStats : buyerStats;

  const categoryCards = [
    { name: 'Estrutural', icon: '🏗️' },
    { name: 'Básicos', icon: '🧱' },
    { name: 'Acabamento', icon: '✨' },
    { name: 'Hidráulica', icon: '💧' },
    { name: 'Elétrica', icon: '⚡' },
    { name: 'Ferramentas', icon: '🛠️' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-12"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {activeStats.map((stat, i) => (
          <div key={`stat-${userType}-${i}`}>
            <StatCard 
              label={stat.label}
              value={stat.value} 
              change={stat.change} 
              trend={stat.trend} 
              icon={stat.icon}
              delay={0.1 * (i + 1)}
              isDarkMode={isDarkMode}
            />
          </div>
        ))}
      </div>

      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="w-1.5 h-6 bg-supplyx-blue rounded-full" />
             <h3 className={`text-xl font-black uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{t.categories}</h3>
          </div>
          <button className="text-[10px] font-black uppercase tracking-widest text-supplyx-blue hover:underline">View Logistics Catalog</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {categoryCards.map((cat) => (
            <button 
              key={cat.name}
              onClick={() => onCategoryClick?.(cat.name)}
              className={`p-10 rounded-[24px] border transition-all hover:border-supplyx-blue active:scale-95 flex flex-col items-center gap-6 group relative overflow-hidden ${
                isDarkMode ? 'bg-zinc-900 border-white/5 shadow-2xl' : 'bg-white border-zinc-100 shadow-sm'
              }`}
            >
              <span className="text-4xl transition-transform group-hover:scale-110 duration-500 relative z-10">{cat.icon}</span>
              <span className={`text-[10px] font-black uppercase tracking-[0.3em] text-center relative z-10 ${isDarkMode ? 'text-zinc-500 group-hover:text-white' : 'text-zinc-400 group-hover:text-zinc-900'}`}>
                {(t.catNames as any)[cat.name] || cat.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        <div className="lg:col-span-3 grid grid-cols-1 xl:grid-cols-3 gap-12">
          <div className="xl:col-span-2">
            <SalesChart isDarkMode={isDarkMode} userType={userType} language={language} />
          </div>
          <div className="xl:col-span-1">
            <BudgetDonutChart isDarkMode={isDarkMode} language={language} />
          </div>
        </div>

        <div className="lg:col-span-2 space-y-12">
          <TransactionList isDarkMode={isDarkMode} userType={userType} language={language} />
        </div>
        
        <div className="space-y-8 h-full flex flex-col">
          {/* SupplyX Intelligence Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="group bg-zinc-900 rounded-[32px] p-12 text-white relative overflow-hidden border border-white/5 shadow-2xl flex-shrink-0"
          >
            <div className="absolute inset-0 industrial-grid opacity-10" />
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-12">
                <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-white/10 flex items-center justify-center group-hover:border-supplyx-blue transition-colors">
                  <Zap className="w-8 h-8 text-supplyx-blue" />
                </div>
                <div className="px-4 py-2 bg-supplyx-blue/10 rounded-lg text-[9px] font-black uppercase tracking-widest border border-supplyx-blue/20 text-supplyx-blue">
                   AI_CORE_ACTIVE
                </div>
              </div>
              <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-6">{t.aiTitle}</h3>
              <p className="text-zinc-500 text-lg mb-12 font-medium leading-relaxed">{t.aiDesc}</p>
              <button 
                onClick={onActivateIA}
                className="w-full bg-supplyx-blue hover:bg-blue-600 text-white px-8 py-6 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-blue-500/20"
              >
                Execute Analysis
              </button>
            </div>
          </motion.div>

          {/* Activity Feed */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className={`${isDarkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-100'} rounded-[32px] border p-12 transition-colors flex flex-col shadow-2xl shadow-black/20`}
          >
            <div className="flex items-center justify-between mb-12 shrink-0">
              <h4 className={`text-[10px] font-black uppercase tracking-[0.4em] transition-colors ${isDarkMode ? 'text-zinc-500' : 'text-zinc-900'}`}>System Events</h4>
              <div className="flex items-center gap-3">
                 <div className="w-1.5 h-1.5 rounded-full bg-supplyx-blue" />
                 <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Real-time</span>
              </div>
            </div>
            <div className="space-y-8 flex-grow overflow-y-auto custom-scrollbar pr-4 max-h-[400px]">
              {[
                { time: '2m', user: 'Logística Maputo', action: 'Material Dispatch', desc: 'Saída Nacala Port', type: 'logistics' },
                { time: '15m', user: 'Votorantim', action: 'Quote Accepted', desc: 'OC-2401 Confirmed', type: 'order' },
                { time: '1h', user: 'Fernando M.', action: 'Payment Executed', desc: 'MT 12.450 (BIM)', type: 'payment' },
                { time: '3h', user: 'Predictive Core', action: 'Arbitrage Opportunity', desc: 'Economia de 12% em Aço', type: 'ai' },
              ].map((activity, i) => (
                <div key={i} className="flex gap-6 group cursor-pointer">
                  <div className={`w-px h-12 shrink-0 transition-colors ${
                    activity.type === 'logistics' ? 'bg-supplyx-blue' :
                    activity.type === 'order' ? 'bg-emerald-500' :
                    activity.type === 'ai' ? 'bg-amber-500' : 'bg-zinc-700'
                  }`} />
                  <div className="flex-grow">
                    <div className="flex justify-between items-start mb-2">
                       <p className={`text-base font-black uppercase tracking-tight ${isDarkMode ? 'text-zinc-300' : 'text-zinc-900'}`}>{activity.action}</p>
                       <span className="font-mono text-[9px] font-black text-zinc-600 uppercase bg-zinc-800/50 px-2 py-1 rounded">{activity.time}</span>
                    </div>
                    <p className="text-[10px] font-bold text-zinc-500 leading-none mb-1 uppercase tracking-widest">{activity.user}</p>
                    <p className="text-[10px] font-medium text-zinc-600 italic">{activity.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
            className={`${isDarkMode ? 'bg-supplyx-dark border-white/5 shadow-3xl' : 'bg-white border-zinc-200'} rounded-[48px] border p-8 transition-colors shadow-sm shrink-0`}
          >
            <div className="flex items-center justify-between mb-10">
              <h4 className={`text-[10px] font-black uppercase tracking-[0.3em] transition-colors ${isDarkMode ? 'text-zinc-500' : 'text-zinc-900'}`}>{t.deliveries}</h4>
              <Calendar className={`w-4 h-4 ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`} />
            </div>
            <div className="space-y-2">
              {[
                { desc: t.cementDesc, status: t.tomorrow, color: 'text-supplyx-blue' },
                { desc: t.rebarDesc, status: language === 'PT' ? '09 Mai' : 'May 09', color: 'text-emerald-500' },
                { desc: t.sandDesc, status: language === 'PT' ? '12 Mai' : 'May 12', color: 'text-amber-500' },
              ].map((item, i) => (
                <div key={i} className={`flex justify-between items-center p-5 rounded-3xl transition-all hover:scale-[1.02] ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-zinc-50'}`}>
                  <span className={`text-[10px] font-black uppercase tracking-tight truncate max-w-[150px] ${isDarkMode ? 'text-zinc-200' : 'text-zinc-600'}`}>{item.desc}</span>
                  <span className={`text-[10px] font-black italic px-4 py-1.5 rounded-full border bg-current/5 border-current/20 uppercase whitespace-nowrap ${item.color}`}>{item.status}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
