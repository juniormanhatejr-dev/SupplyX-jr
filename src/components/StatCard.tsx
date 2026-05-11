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
      className={`p-10 rounded-[48px] border transition-all hover:-translate-y-2 group relative overflow-hidden ${
        isDarkMode ? 'bg-supplyx-dark border-white/5 shadow-3xl' : 'bg-white border-zinc-200'
      }`}
      id={`stat-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-supplyx-blue/5 rounded-full blur-2xl group-hover:bg-supplyx-blue/10 transition-colors" />
      
      <div className="flex justify-between items-start mb-8 relative z-10">
        <div className={`p-4 rounded-2xl transition-all shadow-xl ${
          isDarkMode ? 'bg-supplyx-deep group-hover:bg-supplyx-blue group-hover:scale-110 shadow-black' : 'bg-zinc-50 group-hover:bg-brand/5'
        }`}>
          <Icon className={`w-8 h-8 transition-colors ${
            isDarkMode ? 'text-supplyx-blue group-hover:text-white' : 'text-zinc-600 group-hover:text-brand'
          }`} />
        </div>
        <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border
          ${trend === 'up' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
          {trend === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          {change}
        </div>
      </div>
      <div className="relative z-10">
        <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 truncate ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>{label}</p>
        <h3 className={`text-3xl font-black italic tracking-tighter truncate leading-none ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{value}</h3>
      </div>
    </motion.div>
  );
}
