import { motion } from 'motion/react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: LucideIcon;
  delay?: number;
  isDarkMode?: boolean;
}

export default function StatCard({ label, value, change, trend, icon: Icon, delay = 0, isDarkMode }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`p-6 rounded-2xl border shadow-sm hover:shadow-md transition-all group ${
        isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
      }`}
      id={`stat-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2.5 rounded-xl transition-colors ${
          isDarkMode ? 'bg-zinc-800 group-hover:bg-brand/20' : 'bg-zinc-50 group-hover:bg-brand/5'
        }`}>
          <Icon className={`w-6 h-6 transition-colors ${
            isDarkMode ? 'text-zinc-500 group-hover:text-brand' : 'text-zinc-600 group-hover:text-brand'
          }`} />
        </div>
        <div className={`flex items-center gap-1 text-xs font-black uppercase tracking-widest px-2.5 py-1 rounded-full
          ${trend === 'up' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
          {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {change}
        </div>
      </div>
      <div>
        <p className={`text-[10px] font-black uppercase tracking-widest mb-1 truncate ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>{label}</p>
        <h3 className={`text-2xl font-black italic tracking-tighter truncate ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{value}</h3>
      </div>
    </motion.div>
  );
}
