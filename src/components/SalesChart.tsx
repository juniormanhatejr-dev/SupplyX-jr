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
    <div className={`p-4 md:p-8 rounded-3xl border shadow-sm min-h-[350px] h-full transition-all flex flex-col ${
      isDarkMode ? 'bg-zinc-900 border-zinc-800 shadow-2xl' : 'bg-white border-zinc-200 shadow-sm'
    }`} id="sales-chart-container">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-10 shrink-0">
        <div>
          <h3 className={`text-lg font-black italic uppercase tracking-tighter transition-colors ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
            {translations.title}
          </h3>
          <p className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
            {translations.subtitle}
          </p>
        </div>
        <select 
          className={`bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-brand w-full sm:w-auto cursor-pointer transition-all ${
            isDarkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-zinc-50 border-zinc-200 text-zinc-600'
          }`}
        >
          <option value="7">{translations.last7}</option>
          <option value="30">{translations.last30}</option>
        </select>
      </div>

      <div className="flex-grow min-h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0052CC" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#0052CC" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#27272a' : '#f4f4f5'} />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: isDarkMode ? '#52525b' : '#9CA3AF', fontWeight: 'bold' }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: isDarkMode ? '#52525b' : '#9CA3AF', fontWeight: 'bold' }}
              tickFormatter={(value) => `MT ${value}`}
            />
            <Tooltip 
              contentStyle={{ 
                borderRadius: '16px', 
                border: isDarkMode ? '1px solid #27272a' : '1px solid #E5E7EB',
                backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                color: isDarkMode ? '#fff' : '#000'
              }}
              labelStyle={{ fontWeight: 'black', marginBottom: '4px', textTransform: 'uppercase', fontSize: '10px' }}
              formatter={(value: any) => [`MT ${value}`, translations.value]}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#0052CC" 
              strokeWidth={4}
              fillOpacity={1} 
              fill="url(#colorValue)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
