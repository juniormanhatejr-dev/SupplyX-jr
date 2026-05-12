import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const data = [
  { name: '01/05', actual: 4200, forecast: 4000 },
  { name: '02/05', actual: 5100, forecast: 4800 },
  { name: '03/05', actual: 4800, forecast: 5000 },
  { name: '04/05', actual: 6200, forecast: 5800 },
  { name: '05/05', actual: 8400, forecast: 7000 },
  { name: '06/05', actual: 7800, forecast: 7500 },
  { name: '07/05', actual: 9200, forecast: 8800 },
];

interface SalesChartProps {
  isDarkMode?: boolean;
  userType?: 'buyer' | 'supplier';
  language?: 'PT' | 'EN';
}

export default function SalesChart({ isDarkMode, userType = 'buyer', language = 'PT' }: SalesChartProps) {
  const isSupplier = userType === 'supplier';
  
  const translations = {
    PT: {
      title: isSupplier ? 'Performance de Vendas' : 'Performance de Compras',
      subtitle: isSupplier ? 'Faturamento vs Previsão (7d)' : 'Gastos vs Orçamento (7d)',
      last7: 'Últimos 7 dias',
      last30: 'Últimos 30 dias',
      actual: isSupplier ? 'Realizado' : 'Gasto',
      forecast: isSupplier ? 'Previsão IA' : 'Orçamento'
    },
    EN: {
      title: isSupplier ? 'Sales Performance' : 'Purchase Performance',
      subtitle: isSupplier ? 'Revenue vs Forecast (7d)' : 'Spending vs Budget (7d)',
      last7: 'Last 7 days',
      last30: 'Last 30 days',
      actual: isSupplier ? 'Actual' : 'Spent',
      forecast: isSupplier ? 'AI Forecast' : 'Budget'
    }
  }[language];

  return (
    <div className={`p-8 md:p-12 rounded-[48px] border shadow-3xl min-h-[450px] h-full transition-all flex flex-col ${
      isDarkMode ? 'bg-supplyx-dark border-white/5' : 'bg-white border-zinc-200 shadow-sm'
    }`} id="sales-chart-container">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12 shrink-0">
        <div>
          <h3 className={`text-2xl font-black italic uppercase tracking-tighter transition-colors ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
            {translations.title}
          </h3>
          <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
            {translations.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="hidden lg:flex items-center gap-6 mr-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-supplyx-blue" />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{translations.actual}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-zinc-700" />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{translations.forecast}</span>
            </div>
          </div>
          <select 
            className={`bg-zinc-50 border border-zinc-200 rounded-2xl px-6 py-3 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-supplyx-blue w-full sm:w-auto cursor-pointer transition-all ${
              isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-600'
            }`}
          >
            <option value="7" className="bg-supplyx-deep">{translations.last7}</option>
            <option value="30" className="bg-supplyx-deep">{translations.last30}</option>
          </select>
        </div>
      </div>

      <div className="flex-grow min-h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#52525b" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#52525b" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? 'rgba(255,255,255,0.05)' : '#f4f4f5'} />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: isDarkMode ? '#52525b' : '#9CA3AF', fontWeight: 'bold' }}
              dy={15}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: isDarkMode ? '#52525b' : '#9CA3AF', fontWeight: 'bold' }}
              tickFormatter={(value) => `MT ${value >= 1000 ? (value/1000).toFixed(0) + 'k' : value}`}
              dx={-10}
            />
            <Tooltip 
              contentStyle={{ 
                borderRadius: '24px', 
                border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E5E7EB',
                backgroundColor: isDarkMode ? 'rgba(6, 8, 22, 0.95)' : '#ffffff',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                color: isDarkMode ? '#fff' : '#000',
                padding: '20px'
              }}
              labelStyle={{ fontWeight: '900', marginBottom: '12px', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.2em', color: '#3B82F6' }}
              itemStyle={{ fontWeight: '700', fontSize: '12px', padding: '4px 0' }}
              formatter={(value: any, name: string) => [`MT ${value.toLocaleString()}`, translations[name as keyof typeof translations]]}
            />
            <Area 
              type="monotone" 
              dataKey="forecast" 
              stroke="#52525b" 
              strokeWidth={2}
              strokeDasharray="5 5"
              fillOpacity={1} 
              fill="url(#colorForecast)" 
            />
            <Area 
              type="monotone" 
              dataKey="actual" 
              stroke="#3B82F6" 
              strokeWidth={4}
              fillOpacity={1} 
              fill="url(#colorActual)" 
              animationDuration={2000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
