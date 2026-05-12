import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip 
} from 'recharts';
import { motion } from 'motion/react';

const data = [
  { name: 'Estrutural', value: 45, color: '#3B82F6' },
  { name: 'Básicos', value: 25, color: '#10B981' },
  { name: 'Acabamento', value: 15, color: '#F59E0B' },
  { name: 'Hidráulica', value: 10, color: '#8B5CF6' },
  { name: 'Outros', value: 5, color: '#64748B' },
];

interface BudgetDonutChartProps {
  isDarkMode?: boolean;
  language?: 'PT' | 'EN';
}

export default function BudgetDonutChart({ isDarkMode, language = 'PT' }: BudgetDonutChartProps) {
  const translations = {
    PT: {
      title: 'Alocação de Fluxo',
      subtitle: 'Distribuição Inteligente',
      total: 'CapEx Total',
      value: 'MT 842.150'
    },
    EN: {
      title: 'Flow Allocation',
      subtitle: 'Smart Distribution',
      total: 'Total CapEx',
      value: 'MT 842,150'
    }
  }[language];

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`p-10 rounded-[32px] border h-full flex flex-col ${
        isDarkMode ? 'bg-zinc-900 border-white/5 shadow-2xl' : 'bg-white border-zinc-100 shadow-sm'
      }`}
    >
      <div className="flex items-center gap-4 mb-8">
        <div className="w-1 h-8 bg-emerald-500 rounded-full" />
        <div>
          <h3 className={`text-xl font-black uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
            {translations.title}
          </h3>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">
            {translations.subtitle}
          </p>
        </div>
      </div>

      <div className="relative flex-grow min-h-[300px] flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={90}
              outerRadius={115}
              paddingAngle={4}
              dataKey="value"
              stroke="none"
              animationDuration={1500}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                borderRadius: '12px', 
                border: '1px solid rgba(255,255,255,0.05)',
                backgroundColor: '#12141C',
                padding: '12px',
                fontFamily: 'JetBrains Mono'
              }}
              itemStyle={{ fontWeight: '900', fontSize: '9px', textTransform: 'uppercase', color: '#fff' }}
            />
          </PieChart>
        </ResponsiveContainer>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest mb-1 font-mono">{translations.total}</p>
          <p className={`text-2xl font-mono font-black ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{translations.value}</p>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <div className="grid grid-cols-2 gap-6">
          {data.slice(0, 4).map((item, i) => (
            <div key={i} className="flex items-center gap-4 bg-zinc-800/20 p-3 rounded-lg border border-white/5">
              <div className="w-1 h-6 rounded-full" style={{ backgroundColor: item.color }} />
              <div className="overflow-hidden">
                 <p className={`text-[9px] font-black uppercase tracking-wider truncate text-zinc-500`}>{item.name}</p>
                 <p className={`text-base font-mono font-black ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{item.value}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
