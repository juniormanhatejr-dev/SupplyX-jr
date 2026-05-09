import { 
  DollarSign, 
  CircleDollarSign, 
  ArrowUpRight, 
  CreditCard,
  Calendar
} from 'lucide-react';
import { motion } from 'motion/react';
import StatCard from './StatCard';
import SalesChart from './SalesChart';
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
      className="space-y-8"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
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

      <div className="space-y-4">
        <h3 className={`text-lg font-black italic uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{t.categories}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categoryCards.map((cat) => (
            <button 
              key={cat.name}
              onClick={() => onCategoryClick?.(cat.name)}
              className={`p-6 rounded-3xl border transition-all hover:scale-105 active:scale-95 flex flex-col items-center gap-3 group ${
                isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:border-brand shadow-2xl' : 'bg-white border-zinc-100 hover:border-brand shadow-sm'
              }`}
            >
              <span className="text-3xl transition-transform group-hover:scale-110">{cat.icon}</span>
              <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-zinc-400 group-hover:text-white' : 'text-zinc-500 group-hover:text-zinc-900'}`}>
                {(t.catNames as any)[cat.name] || cat.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          <SalesChart isDarkMode={isDarkMode} userType={userType} language={language} />
          <TransactionList isDarkMode={isDarkMode} userType={userType} language={language} />
        </div>
        
        <div className="space-y-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-zinc-900 rounded-3xl p-8 text-white relative overflow-hidden"
          >
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-2">{t.aiTitle}</h3>
              <p className="text-zinc-400 text-sm mb-6">{t.aiDesc}</p>
              <button 
                onClick={onActivateIA}
                className="bg-brand hover:bg-brand-hover text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors"
              >
                {t.aiBtn}
              </button>
            </div>
            <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-brand/20 blur-3xl rounded-full" />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className={`${isDarkMode ? 'bg-zinc-900 border-zinc-800 shadow-2xl' : 'bg-white border-zinc-200'} rounded-3xl border p-6 transition-colors shadow-sm`}
          >
            <div className="flex items-center justify-between mb-6">
              <h4 className={`font-bold transition-colors ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{t.deliveries}</h4>
              <Calendar className={`w-4 h-4 ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`} />
            </div>
            <div className="space-y-4">
              {[
                { desc: t.cementDesc, status: t.tomorrow },
                { desc: t.rebarDesc, status: language === 'PT' ? '09 Mai' : 'May 09' },
                { desc: t.sandDesc, status: language === 'PT' ? '12 Mai' : 'May 12' },
              ].map((item, i) => (
                <div key={i} className={`flex justify-between items-center py-2 border-b last:border-0 ${isDarkMode ? 'border-zinc-800' : 'border-zinc-50'}`}>
                  <span className={`text-sm font-medium truncate max-w-[150px] ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{item.desc}</span>
                  <span className="text-sm font-bold text-brand">{item.status}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
