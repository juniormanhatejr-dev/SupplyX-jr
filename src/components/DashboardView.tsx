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

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className={`text-lg font-black italic uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{t.categories}</h3>
          <div className="h-px bg-supplyx-blue/10 flex-1 mx-6 hidden sm:block" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {categoryCards.map((cat) => (
            <button 
              key={cat.name}
              onClick={() => onCategoryClick?.(cat.name)}
              className={`p-8 rounded-[40px] border transition-all hover:-translate-y-2 active:scale-95 flex flex-col items-center gap-4 group relative overflow-hidden ${
                isDarkMode ? 'bg-supplyx-dark border-white/5 hover:border-supplyx-blue shadow-3xl' : 'bg-white border-zinc-100 hover:border-brand shadow-sm'
              }`}
            >
              <div className="absolute -top-12 -right-12 w-24 h-24 bg-supplyx-blue/5 rounded-full blur-2xl group-hover:bg-supplyx-blue/10 transition-colors" />
              <span className="text-4xl transition-transform group-hover:scale-125 duration-500 relative z-10">{cat.icon}</span>
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] text-center relative z-10 ${isDarkMode ? 'text-zinc-500 group-hover:text-white' : 'text-zinc-500 group-hover:text-zinc-900'}`}>
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
          <div className="overflow-hidden">
            <TransactionList isDarkMode={isDarkMode} userType={userType} language={language} />
          </div>
        </div>
        
        <div className="space-y-12 h-full flex flex-col">
          {/* SupplyX Intelligence Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="group glass rounded-[48px] p-10 text-white relative overflow-hidden border-white/5 shadow-2xl flex-shrink-0"
          >
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                <div className="w-14 h-14 rounded-3xl bg-supplyx-blue flex items-center justify-center shadow-2xl shadow-blue-500/20 group-hover:scale-110 transition-transform">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <div className="px-3 py-1 bg-white/10 rounded-full text-[8px] font-black uppercase tracking-widest border border-white/10">
                   Active Intelligence
                </div>
              </div>
              <h3 className="text-2xl font-black italic uppercase tracking-tight mb-4">{t.aiTitle}</h3>
              <p className="text-zinc-400 text-sm mb-10 font-medium leading-relaxed">{t.aiDesc}</p>
              <button 
                onClick={onActivateIA}
                className="w-full bg-supplyx-blue hover:bg-blue-600 text-white px-8 py-5 rounded-[24px] text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-3xl shadow-blue-500/20 flex items-center justify-center gap-3"
              >
                <Zap className="w-4 h-4 fill-white" />
                {t.aiBtn}
              </button>
            </div>
            <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-supplyx-blue/10 blur-[100px] rounded-full group-hover:bg-supplyx-blue/20 transition-colors" />
          </motion.div>

          {/* Activity Feed */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className={`flex-grow ${isDarkMode ? 'bg-supplyx-dark border-white/5 shadow-3xl' : 'bg-white border-zinc-200 shadow-sm'} rounded-[48px] border p-10 transition-colors flex flex-col`}
          >
            <div className="flex items-center justify-between mb-10 shrink-0">
              <h4 className={`text-[10px] font-black uppercase tracking-[0.3em] transition-colors ${isDarkMode ? 'text-zinc-500' : 'text-zinc-900'}`}>Recent Events</h4>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Live Flow</span>
              </div>
            </div>
            <div className="space-y-6 flex-grow overflow-y-auto custom-scrollbar pr-2 max-h-[350px]">
              {[
                { time: '2m ago', user: 'Logística Maputo', action: 'Material em rota', desc: 'Saída Nacala Port', type: 'logistics' },
                { time: '15m ago', user: 'Votorantim', action: 'Cotação aceita', desc: 'OC-2401 Confirmada', type: 'order' },
                { time: '1h ago', user: 'Fernando M.', action: 'Pagamento enviado', desc: 'MT 12.450 (BIM)', type: 'payment' },
                { time: '3h ago', user: 'System IA', action: 'Oportunidade detectada', desc: 'Economia de 12% em Aço', type: 'ai' },
                { time: '5h ago', user: 'Beira Express', action: 'Entrega finalizada', desc: 'LOG-003 Entregue', type: 'logistics' },
              ].map((activity, i) => (
                <div key={i} className="flex gap-4 group cursor-pointer">
                  <div className={`w-1 h-10 rounded-full shrink-0 transition-colors ${
                    activity.type === 'logistics' ? 'bg-supplyx-blue' :
                    activity.type === 'order' ? 'bg-emerald-500' :
                    activity.type === 'ai' ? 'bg-amber-500' : 'bg-zinc-700'
                  }`} />
                  <div className="flex-grow">
                    <div className="flex justify-between items-start mb-0.5">
                       <p className={`text-[10px] font-black uppercase tracking-tight ${isDarkMode ? 'text-zinc-300' : 'text-zinc-900'}`}>{activity.action}</p>
                       <span className="text-[8px] font-black text-zinc-600 uppercase whitespace-nowrap">{activity.time}</span>
                    </div>
                    <p className="text-[10px] font-bold text-zinc-500 leading-none mb-1">{activity.user}</p>
                    <p className="text-[9px] font-medium text-zinc-600 italic">{activity.desc}</p>
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
