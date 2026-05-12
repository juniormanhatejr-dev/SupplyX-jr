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
      title: 'Distribuição de Gastos',
      subtitle: 'Por categoria de material',
      total: 'Total Estimado',
      value: 'MT 842.150'
    },
    EN: {
      title: 'Spending Distribution',
      subtitle: 'By material category',
      total: 'Estimated Total',
      value: 'MT 842,150'
    }
  }[language];

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`p-10 rounded-[48px] border shadow-3xl h-full flex flex-col ${
        isDarkMode ? 'bg-supplyx-dark border-white/5' : 'bg-white border-zinc-200'
      }`}
    >
      <div className="mb-8">
        <h3 className={`text-xl font-black italic uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
          {translations.title}
        </h3>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
          {translations.subtitle}
        </p>
      </div>

      <div className="relative flex-grow min-h-[250px] flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={110}
              paddingAngle={8}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                borderRadius: '24px', 
                border: '1px solid rgba(255,255,255,0.1)',
                backgroundColor: isDarkMode ? 'rgba(6, 8, 22, 0.95)' : '#ffffff',
                backdropFilter: 'blur(20px)',
                padding: '16px'
              }}
              itemStyle={{ fontWeight: '900', fontSize: '10px', textTransform: 'uppercase' }}
            />
          </PieChart>
        </ResponsiveContainer>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-[8px] font-black uppercase text-zinc-500 tracking-widest mb-1">{translations.total}</p>
          <p className={`text-xl font-black italic ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{translations.value}</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4">
        {data.slice(0, 4).map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
            <div className="overflow-hidden">
               <p className={`text-[9px] font-black uppercase truncate ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>{item.name}</p>
               <p className={`text-[10px] font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{item.value}%</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
