import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  Package, 
  DollarSign, 
  ShoppingCart, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Star,
  ChevronRight,
  ChevronDown,
  Search,
  Filter,
  Download,
  MoreVertical,
  Activity,
  Award,
  Zap,
  Globe,
  Truck,
  Box,
  FileText,
  Target
} from 'lucide-react';

const salesData = [
  { name: '01 May', sales: 4200, orders: 12 },
  { name: '02 May', sales: 3800, orders: 8 },
  { name: '03 May', sales: 5100, orders: 15 },
  { name: '04 May', sales: 4600, orders: 11 },
  { name: '05 May', sales: 6200, orders: 19 },
  { name: '06 May', sales: 5800, orders: 16 },
  { name: '07 May', sales: 7100, orders: 22 },
];

const inventoryData = [
  { name: 'Cimento CP-II', stock: 450, status: 'Healthy' },
  { name: 'Vergalhão 10mm', stock: 120, status: 'Low Stock' },
  { name: 'Areia Lavada', stock: 800, status: 'Healthy' },
  { name: 'Brita 1', stock: 50, status: 'Critical' },
  { name: 'Tinta Acrílica', stock: 210, status: 'Healthy' },
];

interface SupplierDashboardProps {
  isDarkMode: boolean;
  language: 'PT' | 'EN';
  onNavigate?: (tab: string) => void;
}

export default function SupplierDashboard({ isDarkMode, language, onNavigate }: SupplierDashboardProps) {
  const [activeRange, setActiveRange] = useState('7D');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationDone, setOptimizationDone] = useState(false);
  const [pendingQuotesCount, setPendingQuotesCount] = useState(0);
  const [totalSalesVal, setTotalSalesVal] = useState('MT 45.8K');

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Listen to pending quotes - Filter in memory to avoid index requirement
    const q = query(
      collection(db, 'quotations'),
      where('supplierId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pendingDocs = snapshot.docs.filter(doc => doc.data().status === 'pending');
      setPendingQuotesCount(pendingDocs.length);
    }, (error) => {
      console.error('Error listening to dashboard quotes:', error);
    });

    return () => unsubscribe();
  }, []);

  const handleOptimize = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      setIsOptimizing(false);
      setOptimizationDone(true);
      setTimeout(() => setOptimizationDone(false), 3000);
    }, 2000);
  };

  const t = {
    PT: {
      title: 'Central do Vendedor',
      subtitle: 'Visão geral do seu desempenho comercial',
      salesSummary: 'Resumo de Vendas',
      ordersToShip: 'Pedidos para Enviar',
      pendingQuotes: 'Cotações Pendentes',
      accountHealth: 'Saúde da Conta',
      inventory: 'Gestão de Inventário',
      growth: 'Oportunidades de Crescimento',
      today: 'Hoje',
      units: 'Unidades',
      buyBox: 'Frequência Buy Box',
      pageViews: 'Visualizações',
      kpis: {
        totalSales: 'Vendas Totais',
        unitsSold: 'Unidades Vendidas',
        pageViews: 'Acessos',
        buyBox: 'Buy Box %'
      },
      manageAll: 'Gerenciar Todos',
      liveOptimizer: 'Live Optimizer',
      optimizing: 'Otimizando...',
      optimizeStock: 'Aplicar Ajustes Automáticos',
      optimized: 'Ajustes Aplicados!',
      stats: {
        healthy: 'Saudável',
        low: 'Stock Baixo',
        critical: 'Crítico',
        units: 'unid.'
      },
      actionRequired: 'Ação Necessária',
      complianceScore: 'Score de Conformidade',
      marketMoz: 'Mercado Moçambique',
      marketSA: 'Mercado África do Sul',
      temporalAnalysis: 'Análise Temporal',
      viewFullInsight: 'Ver Insight Completo',
      competitiveSuggestions: 'Sugestões competitivas para 3 SKUs',
      suggestion: 'Sugestão',
      opps: [
        { title: 'Expanda para o mercado de Acabamentos', desc: 'A demanda por cerâmicas aumentou 45% na sua região.', icon: TrendingUp },
        { title: 'Otimize seus preços de Cimento', desc: 'Seus concorrentes estão 5% acima da média. Espaço para margem.', icon: Target }
      ]
    },
    EN: {
      title: 'Seller Central',
      subtitle: 'Overview of your commercial performance',
      salesSummary: 'Sales Summary',
      ordersToShip: 'Orders to Ship',
      pendingQuotes: 'Pending Quotes',
      accountHealth: 'Account Health',
      inventory: 'Inventory Management',
      growth: 'Growth Opportunities',
      today: 'Today',
      units: 'Units',
      buyBox: 'Buy Box Win Rate',
      pageViews: 'Page Views',
      kpis: {
        totalSales: 'Total Sales',
        unitsSold: 'Units Sold',
        pageViews: 'Page Views',
        buyBox: 'Buy Box %'
      },
      manageAll: 'Manage All',
      liveOptimizer: 'Live Optimizer',
      optimizing: 'Optimizing...',
      optimizeStock: 'Apply Auto Adjustments',
      optimized: 'Adjustments Applied!',
      stats: {
        healthy: 'Healthy',
        low: 'Low Stock',
        critical: 'Critical',
        units: 'units'
      },
      actionRequired: 'Action Required',
      complianceScore: 'Compliance Score',
      marketMoz: 'Mozambique Market',
      marketSA: 'South Africa Market',
      temporalAnalysis: 'Temporal Analysis',
      viewFullInsight: 'View Full Insight',
      competitiveSuggestions: 'Competitive pricing for 3 SKUs',
      suggestion: 'Suggestion',
      opps: [
        { title: 'Expand to Finishing Materials market', desc: 'Ceramic demand increased 45% in your region.', icon: TrendingUp },
        { title: 'Optimize your Cement prices', desc: 'Your competitors are 5% above average. Room for margin.', icon: Target }
      ]
    }
  }[language];

  // Dynamic Data with translations
  const currentSalesData = salesData.map(d => ({
    ...d,
    name: language === 'PT' ? d.name.replace('May', 'Mai') : d.name
  }));

  const currentInventoryData = inventoryData.map(d => ({
    ...d,
    name: language === 'PT' ? d.name : (d.name === 'Cimento CP-II' ? 'Cement CP-II' : d.name === 'Vergalhão 10mm' ? 'Rebar 10mm' : d.name === 'Areia Lavada' ? 'Washed Sand' : d.name === 'Brita 1' ? 'Gravel 1' : d.name === 'Tinta Acrílica' ? 'Acrylic Paint' : d.name)
  }));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-20"
    >
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className={`text-3xl font-black italic tracking-tighter uppercase ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
            {t.title}
          </h1>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">
            {t.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 rounded-xl border flex items-center gap-3 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
            <Globe className="w-4 h-4 text-brand" />
            <select className="bg-transparent text-xs font-black uppercase outline-none border-none cursor-pointer">
              <option>{t.marketMoz}</option>
              <option>{t.marketSA}</option>
            </select>
          </div>
          <button className="p-2.5 rounded-xl bg-brand text-white shadow-xl shadow-brand/20 hover:scale-105 transition-transform active:scale-95">
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t.kpis.totalSales, value: totalSalesVal, trend: '+12.5%', icon: DollarSign, color: 'text-emerald-500' },
          { label: t.kpis.unitsSold, value: '1,240', trend: '+8.2%', icon: Package, color: 'text-brand' },
          { label: t.kpis.pageViews, value: '8.4K', trend: '+24.1%', icon: Eye, color: 'text-blue-500' },
          { label: t.kpis.buyBox, value: '92%', trend: '-2.1%', icon: Award, color: 'text-amber-500' },
        ].map((kpi, i) => (
          <div 
            key={i}
            className={`p-5 rounded-3xl border group hover:shadow-xl transition-all ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 shadow-black' : 'bg-white border-zinc-100 shadow-sm'}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2.5 rounded-2xl ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-50'} group-hover:bg-brand/10 group-hover:text-brand transition-colors`}>
                <kpi.icon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-tighter px-2 py-1 rounded-lg ${kpi.trend.startsWith('+') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                {kpi.trend}
              </span>
            </div>
            <p className={`text-2xl font-black italic tracking-tighter leading-none ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{kpi.value}</p>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-2">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Charts Section */}
        <div className={`lg:col-span-2 p-6 rounded-3xl border flex flex-col ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100 shadow-sm'}`}>
          <div className="flex justify-between items-center mb-8">
            <h3 className={`font-black uppercase italic tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{t.salesSummary}</h3>
            <div className={`flex rounded-xl p-1 ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
              {['7D', '30D', '1Y'].map(range => (
                <button 
                  key={range}
                  onClick={() => setActiveRange(range)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${activeRange === range ? 'bg-brand text-white shadow-lg' : 'text-zinc-500'}`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={currentSalesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6600" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FF6600" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#27272a' : '#f4f4f5'} vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#71717a' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#71717a' }} 
                />
                <RechartsTooltip 
                  contentStyle={{ 
                    backgroundColor: isDarkMode ? '#18181b' : '#fff', 
                    border: 'none', 
                    borderRadius: '16px',
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
                  }}
                  itemStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}
                  labelStyle={{ fontSize: '10px', fontWeight: 900, marginBottom: '4px', opacity: 0.5 }}
                />
                <Area type="monotone" dataKey="sales" stroke="#FF6600" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sidebar Status Widgets */}
        <div className="space-y-6">
          {/* Account Health */}
          <div className={`p-6 rounded-3xl border overflow-hidden relative group ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100 shadow-sm'}`}>
            <h3 className={`font-black uppercase italic tracking-tighter mb-6 relative z-10 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{t.accountHealth}</h3>
            <div className="flex items-end justify-between relative z-10">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{t.stats.healthy}</p>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase">{t.complianceScore}: 98%</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase text-zinc-500">
                    <span>ODR (Order Defect Rate)</span>
                    <span className="text-emerald-500">0.05%</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '95%' }}
                      className="h-full bg-emerald-500"
                    />
                  </div>
                </div>
              </div>
              <Activity className="w-20 h-20 text-brand opacity-5 absolute -right-4 -bottom-4 group-hover:scale-110 transition-transform" />
            </div>
          </div>

          {/* Action Required */}
          <div className={`p-6 rounded-3xl border flex flex-col ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100 shadow-sm'}`}>
            <h3 className={`font-black uppercase italic tracking-tighter mb-4 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{t.actionRequired}</h3>
            <div className="space-y-3">
              {[
                { label: t.ordersToShip, count: 0, icon: Truck, color: 'text-brand', bg: 'bg-brand/10', tab: 'Pedidos / Cotações' },
                { label: t.pendingQuotes, count: pendingQuotesCount, icon: FileText, color: 'text-amber-500', bg: 'bg-amber-500/10', tab: 'Pedidos / Cotações' },
                { label: language === 'PT' ? 'Mensagens' : 'Messages', count: 0, icon: MoreVertical, color: 'text-blue-500', bg: 'bg-blue-500/10', tab: 'Mensagens' },
              ].map((action, i) => (
                <button 
                  key={i}
                  onClick={() => onNavigate?.(action.tab)}
                  className={`w-full p-4 rounded-2xl border flex items-center justify-between group transition-all ${isDarkMode ? 'bg-zinc-950/50 border-zinc-800 hover:bg-zinc-900' : 'bg-zinc-50/50 border-zinc-100 hover:bg-zinc-100'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${action.bg}`}>
                      <action.icon className={`w-4 h-4 ${action.color}`} />
                    </div>
                    <span className={`text-xs font-bold ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>{action.label}</span>
                  </div>
                  <span className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black ${isDarkMode ? 'bg-zinc-800 text-white' : 'bg-white text-zinc-900 shadow-sm'}`}>
                    {action.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Inventory & Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Management Table */}
        <div className={`p-6 rounded-3xl border flex flex-col ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100 shadow-sm'}`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className={`font-black uppercase italic tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{t.inventory}</h3>
            <button 
              onClick={() => onNavigate?.('Produtos / Materiais')}
              className="text-[10px] font-black uppercase text-brand hover:underline"
            >
              {t.manageAll}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800/10 text-left">
                  <th className="pb-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest">SKU</th>
                  <th className="pb-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">{language === 'PT' ? 'Stock' : 'In Stock'}</th>
                  <th className="pb-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Status</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-zinc-800' : 'divide-zinc-50'}`}>
                {currentInventoryData.map((item, i) => (
                  <tr key={i} className="group cursor-pointer">
                    <td className="py-4">
                      <p className={`text-xs font-bold ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>{item.name}</p>
                      <p className="text-[10px] text-zinc-500 font-mono">SUP-MOZ-{i+1000}</p>
                    </td>
                    <td className="py-4 text-center">
                      <span className={`text-[10px] font-black ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>
                        {item.stock} <span className="text-[8px] opacity-50 uppercase">{t.stats.units}</span>
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md
                        ${item.status === 'Healthy' ? 'bg-emerald-500/10 text-emerald-500' : 
                          item.status === 'Low Stock' ? 'bg-amber-500/10 text-amber-500' : 
                          'bg-red-500/10 text-red-500 animate-pulse'}`}>
                        {item.status === 'Healthy' ? t.stats.healthy : 
                         item.status === 'Low Stock' ? t.stats.low : 
                         t.stats.critical}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Growth Opportunities */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className={`p-6 rounded-3xl border group relative overflow-hidden flex flex-col justify-between ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100 shadow-sm'}`}>
            <h3 className={`font-black uppercase italic tracking-tighter relative z-10 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{t.growth}</h3>
            <div className="mt-8 space-y-4 relative z-10">
              <div className="w-12 h-12 bg-brand/10 text-brand rounded-2xl flex items-center justify-center">
                <Zap className="w-6 h-6 fill-brand" />
              </div>
              <p className={`text-sm font-bold leading-tight ${isDarkMode ? 'text-zinc-300' : 'text-zinc-900'}`}>
                {t.opps[0].title.split('Acabamentos')[0]} <span className="text-brand font-black">{language === 'PT' ? 'Acabamentos' : 'Finishing Materials'}</span>
              </p>
              <p className="text-[10px] text-zinc-500 font-medium">{t.opps[0].desc}</p>
              <button 
                onClick={() => onNavigate?.('Relatórios')}
                className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isDarkMode ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-lg shadow-zinc-900/10'}`}>
                {t.viewFullInsight}
              </button>
            </div>
            <Award className="absolute -right-4 -top-4 w-24 h-24 text-brand opacity-5 scale-110 pointer-events-none group-hover:rotate-12 transition-transform" />
          </div>

          <div className={`p-6 rounded-3xl border flex flex-col justify-between ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100 shadow-sm'}`}>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-emerald-500 uppercase">{t.liveOptimizer}</span>
            </div>
            <div className="space-y-4">
              <p className={`text-sm font-bold leading-tight ${isDarkMode ? 'text-zinc-300' : 'text-zinc-900'}`}>
                {t.competitiveSuggestions}
              </p>
              <div className="space-y-2">
                {[1, 2].map(i => (
                  <div key={i} className={`p-3 rounded-xl border flex items-center justify-between ${isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
                    <div className="flex items-center gap-2">
                      <Box className="w-3 h-3 text-zinc-400" />
                      <span className="text-[10px] font-bold text-zinc-500">Item #{i}04</span>
                    </div>
                    <span className="text-[9px] font-black text-brand uppercase">
                      {t.suggestion}: -{i*2+1}%
                    </span>
                  </div>
                ))}
              </div>
              <button 
                onClick={handleOptimize}
                disabled={isOptimizing || optimizationDone}
                className={`w-full py-3 rounded-xl border border-brand text-brand hover:bg-brand hover:text-white transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 ${
                  (isOptimizing || optimizationDone) ? 'bg-brand/10 pointer-events-none' : ''
                }`}
              >
                {isOptimizing ? (
                  <>
                    <div className="w-3 h-3 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                    {t.optimizing}
                  </>
                ) : optimizationDone ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    {t.optimized}
                  </>
                ) : (
                  t.optimizeStock
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
