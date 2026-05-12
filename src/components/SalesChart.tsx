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
  standalone?: boolean;
}

export default function SalesChart({ isDarkMode, userType = 'buyer', language = 'PT', standalone = true }: SalesChartProps) {
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

  const content = (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 shrink-0">
        <div className="flex items-center gap-4">
           <div className="w-1 h-10 bg-supplyx-blue rounded-full" />
           <div>
              <h3 className={`text-2xl font-black uppercase tracking-tighter transition-colors ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                {translations.title}
              </h3>
              <p className={`text-[10px] font-black uppercase tracking-[0.4em] ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                {translations.subtitle}
              </p>
           </div>
        </div>
        <div className="flex items-center gap-6 w-full sm:w-auto">
          <div className="hidden lg:flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-supplyx-blue" />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{translations.actual}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-zinc-700" />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{translations.forecast}</span>
            </div>
          </div>
          <select 
            className={`bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 font-mono text-[10px] font-black uppercase tracking-widest focus:outline-none w-full sm:w-auto cursor-pointer transition-all ${
              isDarkMode ? 'bg-zinc-800 border-white/5 text-zinc-300' : 'bg-zinc-50 border-zinc-200 text-zinc-600'
            }`}
          >
            <option value="7" className="bg-supplyx-deep">{translations.last7}</option>
            <option value="30" className="bg-supplyx-deep">{translations.last30}</option>
          </select>
        </div>
      </div>

      <div className="flex-grow w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? 'rgba(255,255,255,0.02)' : '#f4f4f5'} />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 9, fill: isDarkMode ? '#52525b' : '#9CA3AF', fontWeight: 'bold', fontFamily: 'JetBrains Mono' }}
              dy={15}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 9, fill: isDarkMode ? '#52525b' : '#9CA3AF', fontWeight: 'bold', fontFamily: 'JetBrains Mono' }}
              tickFormatter={(value) => `${value >= 1000 ? (value/1000).toFixed(0) + 'k' : value}`}
              dx={-10}
            />
            <Tooltip 
              contentStyle={{ 
                borderRadius: '16px', 
                border: '1px solid rgba(255,255,255,0.05)',
                backgroundColor: '#12141C',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                color: '#fff',
                padding: '16px'
              }}
              labelStyle={{ fontWeight: '900', marginBottom: '8px', textTransform: 'uppercase', fontSize: '9px', letterSpacing: '0.2em', color: '#0052CC', fontFamily: 'JetBrains Mono' }}
              itemStyle={{ fontWeight: '700', fontSize: '11px', padding: '2px 0', fontFamily: 'JetBrains Mono' }}
              formatter={(value: any, name: string) => [`MT ${value.toLocaleString()}`, name === 'actual' ? translations.actual : translations.forecast]}
            />
            <Area 
              type="stepAfter" 
              dataKey="forecast" 
              stroke="#27272a" 
              strokeWidth={1}
              strokeDasharray="4 4"
              fillOpacity={0.05} 
              fill="#27272a" 
              animationDuration={800}
            />
            <Area 
              type="monotone" 
              dataKey="actual" 
              stroke="#0052CC" 
              strokeWidth={3}
              fillOpacity={0.1} 
              fill="#0052CC" 
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </>
  );

  if (!standalone) {
    return <div className="h-full w-full flex flex-col">{content}</div>;
  }

  return (
    <div className={`p-6 rounded-[24px] border h-full transition-all flex flex-col ${
      isDarkMode ? 'bg-zinc-900/50 border-white/5 shadow-2xl' : 'bg-white border-zinc-100 shadow-sm'
    }`} id="sales-chart-container">
      {content}
    </div>
  );
}
