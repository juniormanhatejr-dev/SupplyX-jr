import { motion } from 'motion/react';
import { useRef, useState } from 'react';
import { BarChart3, TrendingUp, Download, Calendar, Filter, Loader2 } from 'lucide-react';
import SalesChart from './SalesChart';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ReportsViewProps {
  isDarkMode: boolean;
  language: 'PT' | 'EN';
}

export default function ReportsView({ isDarkMode, language }: ReportsViewProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const downloadPDF = async () => {
    if (!reportRef.current) return;
    
    setIsExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: isDarkMode ? '#09090b' : '#ffffff',
        onclone: (clonedDoc) => {
          const elements = clonedDoc.getElementsByTagName('*');
          for (let i = 0; i < elements.length; i++) {
            const el = elements[i] as HTMLElement;
            const style = window.getComputedStyle(el);
            ['backgroundColor', 'color', 'borderColor'].forEach(prop => {
              const val = style[prop as any];
              if (val && (val.includes('oklab') || val.includes('oklch'))) {
                if (val.includes('/ 0')) {
                   el.style[prop as any] = 'transparent';
                } else {
                   el.style[prop as any] = prop === 'backgroundColor' ? (isDarkMode ? '#09090b' : 'white') : (isDarkMode ? 'white' : 'black');
                }
              }
            });
          }
        }
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Relatorio_Performance_${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };
  const t = {
    PT: {
      title: 'Relatórios de Performance',
      subtitle: 'Analise o desempenho de compras e economia gerada.',
      export: 'Exportar PDF',
      summary: 'Resumo Geral',
      savings: 'Economia Total',
      volume: 'Volume de Compras',
      temporalAnalysis: 'Análise Temporal',
    },
    EN: {
      title: 'Performance Reports',
      subtitle: 'Analyze purchasing performance and savings generated.',
      export: 'Export PDF',
      summary: 'General Summary',
      savings: 'Total Savings',
      volume: 'Purchase Volume',
      temporalAnalysis: 'Temporal Analysis',
    }
  }[language];

  return (
    <motion.div 
      ref={reportRef}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`space-y-8 p-4 rounded-3xl ${isDarkMode ? 'bg-zinc-950' : 'bg-white'}`}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className={`text-2xl font-black italic uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
            {t.title}
          </h2>
          <p className="text-zinc-500 text-sm font-bold">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className={`p-2.5 rounded-xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-white border-zinc-200 text-zinc-600'}`}>
            <Calendar className="w-5 h-5" />
          </button>
          <button className={`p-2.5 rounded-xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-white border-zinc-200 text-zinc-600'}`}>
            <Filter className="w-5 h-5" />
          </button>
          <button 
            onClick={downloadPDF}
            disabled={isExporting}
            className="bg-brand text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-brand/20 disabled:opacity-50 active:scale-95 transition-all"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {t.export}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-500" />
            </div>
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">+12.5%</span>
          </div>
          <p className={`text-2xl font-black italic tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>MT 1.2M</p>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">{t.savings}</p>
        </div>

        <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-brand/10 rounded-2xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-brand" />
            </div>
            <span className="text-[10px] font-black text-brand uppercase tracking-widest">+5.2%</span>
          </div>
          <p className={`text-2xl font-black italic tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>MT 4.8M</p>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">{t.volume}</p>
        </div>
      </div>

      <div className={`p-8 rounded-3xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100 shadow-sm'}`}>
        <h3 className={`text-lg font-black uppercase italic tracking-tighter mb-8 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{t.temporalAnalysis}</h3>
        <div className="h-[400px]">
          <SalesChart isDarkMode={isDarkMode} language={language} />
        </div>
      </div>
    </motion.div>
  );
}
