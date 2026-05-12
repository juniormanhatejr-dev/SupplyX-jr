import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip 
} from 'recharts';
import { motion } from 'motion/react';

interface BudgetDonutChartProps {
  isDarkMode?: boolean;
  language?: 'PT' | 'EN';
  standalone?: boolean;
}

export default function BudgetDonutChart({ isDarkMode, language = 'PT', standalone = true }: BudgetDonutChartProps) {
  const data = [
    { name: language === 'PT' ? 'Estrutural' : 'Structural', value: 45, color: '#3B82F6' },
    { name: language === 'PT' ? 'Básicos' : 'Basics', value: 25, color: '#10B981' },
    { name: language === 'PT' ? 'Acabamento' : 'Finishing', value: 15, color: '#F59E0B' },
    { name: language === 'PT' ? 'Hidráulica' : 'Hydraulic', value: 10, color: '#8B5CF6' },
    { name: language === 'PT' ? 'Outros' : 'Others', value: 5, color: '#64748B' },
  ];

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

  const content = (
    <>
      <div className="flex items-center gap-4 mb-4">
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

      <div className="relative flex-grow h-[250px] aspect-square mx-auto flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="85%"
              paddingAngle={5}
              dataKey="value"
              stroke="none"
              animationDuration={800}
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

      <div className="mt-4 space-y-2">
        <div className="grid grid-cols-2 gap-3">
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
    </>
  );

  if (!standalone) {
    return <div className="h-full w-full flex flex-col">{content}</div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`p-6 rounded-[24px] border h-full flex flex-col ${
        isDarkMode ? 'bg-zinc-900/50 border-white/5 shadow-2xl' : 'bg-white border-zinc-100 shadow-sm'
      }`}
    >
      {content}
    </motion.div>
  );
}
