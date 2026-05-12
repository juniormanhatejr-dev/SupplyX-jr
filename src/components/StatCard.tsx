import { motion } from 'motion/react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface StatCardProps {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: LucideIcon;
  delay?: number;
  isDarkMode?: boolean;
}

// Mock data for sparkline
const sparkData = [
  { v: 40 }, { v: 45 }, { v: 42 }, { v: 50 }, { v: 48 }, { v: 55 }, { v: 60 }
];

export default function StatCard({ label, value, change, trend, icon: Icon, delay = 0, isDarkMode }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`p-8 rounded-[32px] border transition-all hover:border-supplyx-blue/50 group relative overflow-hidden flex flex-col justify-between h-full ${
        isDarkMode ? 'bg-supplyx-dark border-white/5 shadow-2xl' : 'bg-white border-zinc-100 shadow-sm'
      }`}
      id={`stat-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-8">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
            isDarkMode ? 'bg-zinc-800' : 'bg-zinc-50'
          }`}>
            <Icon className={`w-6 h-6 transition-colors ${
              isDarkMode ? 'text-zinc-500 group-hover:text-supplyx-blue' : 'text-zinc-400 group-hover:text-supplyx-blue'
            }`} />
          </div>
          <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border
            ${trend === 'up' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/10' : 'bg-rose-500/10 text-rose-500 border-rose-500/10'}`}>
            {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {change}
          </div>
        </div>
        
        <p className={`text-[10px] font-black uppercase tracking-[0.4em] mb-4 truncate ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>{label}</p>
        <h3 className={`text-4xl font-mono font-black tracking-tighter truncate leading-none mb-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{value}</h3>
      </div>

      {/* Sparkline */}
      <div className="h-12 w-full mt-6 relative z-10 opacity-30 group-hover:opacity-100 transition-opacity">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparkData}>
            <Area 
              type="step" 
              dataKey="v" 
              stroke={trend === 'up' ? '#10b981' : '#ef4444'} 
              fill={trend === 'up' ? '#10b98110' : '#ef444410'}
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
