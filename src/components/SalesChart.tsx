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
  { name: '01/05', value: 4200 },
  { name: '02/05', value: 5100 },
  { name: '03/05', value: 4800 },
  { name: '04/05', value: 6200 },
  { name: '05/05', value: 8400 },
  { name: '06/05', value: 7800 },
  { name: '07/05', value: 9200 },
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
      title: isSupplier ? 'Volume de Vendas' : 'Volume de Compras',
      subtitle: isSupplier ? 'Histórico de faturamento nos últimos 7 dias' : 'Histórico de aquisição nos últimos 7 dias',
      last7: 'Últimos 7 dias',
      last30: 'Últimos 30 dias',
      value: 'Valor'
    },
    EN: {
      title: isSupplier ? 'Sales Volume' : 'Purchase Volume',
      subtitle: isSupplier ? 'Revenue history over the last 7 days' : 'Purchase history over the last 7 days',
      last7: 'Last 7 days',
      last30: 'Last 30 days',
      value: 'Value'
    }
  }[language];

  return (
    <div className={`p-8 md:p-12 rounded-[48px] border shadow-3xl min-h-[400px] h-full transition-all flex flex-col ${
      isDarkMode ? 'bg-supplyx-dark border-white/5' : 'bg-white border-zinc-200 shadow-sm'
    }`} id="sales-chart-container">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12 shrink-0">
        <div>
          <h3 className={`text-xl font-black italic uppercase tracking-tighter transition-colors ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
            {translations.title}
          </h3>
          <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
            {translations.subtitle}
          </p>
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

      <div className="flex-grow min-h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
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
              tickFormatter={(value) => `MT ${value >= 1000 ? (value/1000).toFixed(1) + 'k' : value}`}
              dx={-10}
            />
            <Tooltip 
              contentStyle={{ 
                borderRadius: '24px', 
                border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E5E7EB',
                backgroundColor: isDarkMode ? 'rgba(6, 8, 22, 0.9)' : '#ffffff',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                color: isDarkMode ? '#fff' : '#000',
                padding: '16px'
              }}
              labelStyle={{ fontWeight: '900', marginBottom: '8px', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.1em' }}
              itemStyle={{ fontWeight: '700', fontSize: '12px' }}
              formatter={(value: any) => [`MT ${value}`, translations.value]}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#3B82F6" 
              strokeWidth={4}
              fillOpacity={1} 
              fill="url(#colorValue)" 
              animationDuration={2000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
