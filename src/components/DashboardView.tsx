import { 
  DollarSign, 
  CircleDollarSign, 
  ArrowUpRight, 
  CreditCard,
  Calendar,
  Zap,
  BarChart3,
  Truck,
  ArrowRight
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
      spend: 'Gastos',
      logistics: 'Logística',
      logMap: 'Mapa Logístico ao Vivo',
      activeTrucks: 'camiões ativos',
      enRoute: 'EM ROTA',
      delivered: 'ENTREGUE',
      inventory: 'Alocação de Inventário',
      logPortal: 'Portal de Logística',
      fleetTracking: 'Rastreamento de Frota e Materiais',
      startAi: 'Iniciar Procurement com IA',
      liveOps: 'Operações ao Vivo',
      nextDeliveries: 'Próximas Entregas',
      latency: 'Latência',
      reliability: 'Confiabilidade',
      coreIntel: 'Inteligência Central',
      actions: {
        dispatch: 'Despacho',
        accepted: 'Aceite',
        payment: 'Pagamento',
        optimization: 'Otimização'
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
      spend: 'Spend',
      logistics: 'Logistics',
      logMap: 'Live Logistics Map',
      activeTrucks: 'active trucks',
      enRoute: 'EN ROUTE',
      delivered: 'DELIVERED',
      inventory: 'Inventory Allocation',
      logPortal: 'Logistics Portal',
      fleetTracking: 'Fleet & Material tracking',
      startAi: 'Start AI Procurement',
      liveOps: 'Live Operations',
      nextDeliveries: 'Next Deliveries',
      latency: 'Latency',
      reliability: 'Reliability',
      coreIntel: 'Core Intelligence',
      actions: {
        dispatch: 'Dispatch',
        accepted: 'Accepted',
        payment: 'Payment',
        optimization: 'Optimization'
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {activeStats.map((stat, i) => (
          <motion.div
            key={`stat-${userType}-${i}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className={`p-8 rounded-[24px] border ${
              isDarkMode ? 'bg-zinc-900/50 border-white/5' : 'bg-white border-zinc-100 shadow-sm'
            } relative overflow-hidden group`}
          >
            <div className="flex justify-between items-start mb-6">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                isDarkMode ? 'bg-zinc-800 text-zinc-400 group-hover:text-supplyx-blue' : 'bg-zinc-50 text-zinc-400 group-hover:text-supplyx-blue'
              }`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black font-mono ${
                stat.trend === 'up' ? 'text-emerald-500 bg-emerald-500/10' : 'text-rose-500 bg-rose-500/10'
              }`}>
                {stat.trend === 'up' ? '↑' : '↓'} {stat.change}
              </div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-2">{stat.label}</p>
            <p className="text-4xl font-black italic tracking-tighter text-white font-mono">{stat.value}</p>
            
            {/* Subtle industrial corner accent */}
            <div className="absolute top-0 right-0 w-8 h-8 opacity-5 group-hover:opacity-20 transition-opacity">
              <div className="absolute top-2 right-2 w-px h-4 bg-white" />
              <div className="absolute top-2 right-2 w-4 h-px bg-white" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Main Analytics + Map Section */}
        <div className="xl:col-span-8 space-y-8">
          <div className={`p-8 rounded-[40px] border ${isDarkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-100 shadow-sm'} relative overflow-hidden`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
               <div>
                  <h3 className="text-3xl font-black uppercase tracking-tighter text-white italic">{language === 'PT' ? 'Integridade da Cadeia de Suprimentos' : 'Supply Chain Integrity'}</h3>
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">{language === 'PT' ? 'Fluxo logístico em tempo real e gastos em procurement' : 'Real-time logistic flow & procurement spend'}</p>
               </div>
               <div className="flex items-center gap-3 bg-zinc-800 p-1.5 rounded-2xl border border-white/5">
                  <button className="px-5 py-2.5 rounded-xl bg-supplyx-blue text-white text-[10px] font-black uppercase tracking-widest shadow-lg">{t.spend}</button>
                  <button className="px-5 py-2.5 rounded-xl text-zinc-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors">{t.logistics}</button>
               </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
               <div className="h-[400px]">
                  <SalesChart isDarkMode={isDarkMode} userType={userType} language={language} standalone={false} />
               </div>
               
               {/* Delivery Map Visualization (Stylized) */}
               <div className={`h-[400px] rounded-[32px] border relative overflow-hidden flex flex-col ${isDarkMode ? 'bg-zinc-950/50 border-white/5' : 'bg-zinc-50 border-zinc-100'}`}>
                  <div className="absolute inset-0 industrial-grid opacity-10" />
                  <div className="p-6 border-b border-white/5 flex justify-between items-center relative z-10">
                     <span className="text-[10px] font-black uppercase tracking-[0.4em] text-supplyx-blue">{t.logMap}</span>
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-mono font-black text-emerald-500 uppercase">12 {t.activeTrucks}</span>
                     </div>
                  </div>
                  <div className="flex-grow flex items-center justify-center p-12 relative z-10">
                     {/* Stylized Node-Link Map */}
                     <div className="relative w-full h-full opacity-40">
                        <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-supplyx-blue rounded-full shadow-[0_0_15px_#3B82F6]" />
                        <div className="absolute top-3/4 left-1/2 w-2 h-2 bg-zinc-500 rounded-full" />
                        <div className="absolute top-1/2 left-3/4 w-3 h-3 bg-supplyx-blue rounded-full shadow-[0_0_15px_#3B82F6]" />
                        <svg className="absolute inset-0 w-full h-full pointer-events-none">
                           <line x1="25%" y1="25%" x2="50%" y2="75%" stroke="white" strokeWidth="1" strokeDasharray="4 4" className="opacity-20" />
                           <line x1="25%" y1="25%" x2="75%" y2="50%" stroke="#3B82F6" strokeWidth="2" className="opacity-50" />
                        </svg>
                     </div>
                  </div>
                  <div className="p-6 bg-zinc-900 border-t border-white/5 grid grid-cols-2 gap-4 relative z-10">
                     <div>
                        <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">{language === 'PT' ? 'Porto de Nacala' : 'Port Nacala'}</p>
                        <p className="text-sm font-black text-white italic font-mono uppercase">{t.enRoute}</p>
                     </div>
                     <div className="text-right">
                        <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">{language === 'PT' ? 'Terminal Maputo' : 'Maputo Hub'}</p>
                        <p className="text-sm font-black text-emerald-500 italic font-mono uppercase">{t.delivered}</p>
                     </div>
                  </div>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <TransactionList isDarkMode={isDarkMode} userType={userType} language={language} />
            
            <div className="space-y-8">
              <div className={`p-8 rounded-[40px] border ${isDarkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-100 shadow-sm'}`}>
                <div className="flex items-center justify-between mb-8">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">{t.inventory}</h4>
                  <BarChart3 className="w-4 h-4 text-supplyx-blue" />
                </div>
                <div className="h-[400px]">
                  <BudgetDonutChart isDarkMode={isDarkMode} language={language} standalone={false} />
                </div>
              </div>

              <div className={`p-8 rounded-[40px] border flex items-center justify-between group transition-all cursor-pointer ${
                isDarkMode ? 'bg-zinc-900 border-white/5 hover:border-supplyx-blue/30' : 'bg-white border-zinc-100 shadow-sm'
              }`}>
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-supplyx-blue/10 flex items-center justify-center text-supplyx-blue group-hover:bg-supplyx-blue group-hover:text-white transition-all">
                    <Truck className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black italic uppercase tracking-tighter text-white">{t.logPortal}</h4>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t.fleetTracking}</p>
                  </div>
                </div>
                <ArrowRight className="w-6 h-6 text-zinc-700 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Intelligence & Activity */}
        <div className="xl:col-span-4 space-y-8">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`p-10 rounded-[40px] border relative overflow-hidden group ${
              isDarkMode ? 'bg-zinc-900/50 border-white/5' : 'bg-white border-zinc-100'
            }`}
          >
            <div className="absolute top-0 right-0 p-8">
              <div className="w-2 h-2 rounded-full bg-supplyx-blue animate-ping" />
            </div>
            
            <div className="flex items-center gap-4 mb-10">
              <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-white/10 flex items-center justify-center">
                <Zap className="w-7 h-7 text-supplyx-blue" />
              </div>
              <div>
                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">{t.aiTitle}</h3>
                <p className="text-[10px] font-black text-supplyx-blue uppercase tracking-widest">{t.coreIntel}</p>
              </div>
            </div>
            
            <p className="text-zinc-500 text-sm font-medium leading-relaxed mb-10">
              {t.aiDesc}
            </p>
            
            <button 
              onClick={onActivateIA}
              className="w-full py-6 rounded-2xl bg-supplyx-blue text-white font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95 shadow-2xl shadow-blue-500/20"
            >
              {t.startAi}
            </button>
            
            <div className="mt-10 pt-10 border-t border-white/5 grid grid-cols-2 gap-6">
               <div>
                  <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">{t.latency}</p>
                  <p className="text-sm font-black text-white font-mono">14ms</p>
               </div>
               <div className="text-right">
                  <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">{t.reliability}</p>
                  <p className="text-sm font-black text-emerald-500 font-mono">99.9%</p>
               </div>
            </div>
          </motion.div>

          <div className={`p-10 rounded-[40px] border ${isDarkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-100 shadow-sm'}`}>
            <div className="flex items-center justify-between mb-10">
               <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">{t.liveOps}</h4>
               <span className="text-[9px] font-black text-zinc-700 font-mono">UTC -05:00</span>
            </div>
            
            <div className="space-y-8">
              {[
                { time: '2m', user: 'Logística Maputo', action: t.actions.dispatch, desc: language === 'PT' ? 'Saída Porto de Nacala' : 'Departure Nacala Port', type: 'logistics' },
                { time: '15m', user: 'Votorantim', action: t.actions.accepted, desc: 'OC-2401 Confirmed', type: 'order' },
                { time: '1h', user: 'Fernando M.', action: t.actions.payment, desc: 'MT 12.450 (BIM)', type: 'payment' },
                { time: '3h', user: 'Procurement AI', action: t.actions.optimization, desc: language === 'PT' ? 'Economia identificada' : 'Cost save identified', type: 'ai' },
              ].map((activity, i) => (
                <div key={i} className="flex gap-6 items-start">
                  <div className={`w-1 h-8 rounded-full mt-1 ${
                    activity.type === 'logistics' ? 'bg-supplyx-blue' :
                    activity.type === 'order' ? 'bg-emerald-500' :
                    activity.type === 'ai' ? 'bg-supplyx-blue shadow-[0_0_8px_#3B82F6]' : 'bg-zinc-700'
                  }`} />
                  <div className="flex-grow">
                    <div className="flex justify-between items-center mb-1">
                       <p className="text-sm font-black text-white italic uppercase tracking-tight">{activity.action}</p>
                       <span className="text-[9px] font-bold text-zinc-600">{activity.time}</span>
                    </div>
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{activity.user}</p>
                    <p className="text-[10px] text-zinc-600 italic">{activity.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`p-10 rounded-[40px] border border-white/5 bg-zinc-900/30 overflow-hidden relative group cursor-pointer`}>
            <div className="flex items-center justify-between mb-8">
               <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">{t.nextDeliveries}</h4>
               <Calendar className="w-4 h-4 text-zinc-600" />
            </div>
            <div className="space-y-4">
              {[
                { item: 'Bulk Cement', date: language === 'PT' ? 'Amanhã' : 'Tomorrow', status: language === 'PT' ? 'Em Rota' : 'En Route', color: 'text-supplyx-blue' },
                { item: 'Steel Rebar', date: 'May 12', status: language === 'PT' ? 'Processando' : 'Processing', color: 'text-zinc-500' },
              ].map((d, i) => (
                 <div key={i} className="flex justify-between items-center group-hover:translate-x-1 transition-transform">
                    <div>
                       <p className="text-xs font-black text-white italic uppercase tracking-tight">{d.item}</p>
                       <p className="text-[9px] font-bold text-zinc-500 uppercase">{d.date}</p>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${d.color}`}>{d.status}</span>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
