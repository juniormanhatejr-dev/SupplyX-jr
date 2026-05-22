import { motion } from 'motion/react';
import { useRef, useState } from 'react';
import { BarChart3, TrendingUp, Download, Calendar, Filter, Loader2, DollarSign } from 'lucide-react';
import SalesChart from './SalesChart';
import StatCard from './StatCard';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { sanitizeDocumentColors } from '../lib/colorSanitizer';

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
        scale: 1.2, // Slightly lower for faster processing on complex charts
        useCORS: true,
        backgroundColor: isDarkMode ? '#09090b' : '#ffffff',
        logging: false,
        imageTimeout: 15000,
        onclone: (clonedDoc) => {
          sanitizeDocumentColors(clonedDoc, isDarkMode);
        }
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.7);
      const pdf = new jsPDF('p', 'mm', 'a4', true);
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      const filename = language === 'PT' ? `Relatório_Performance_${new Date().getTime()}.pdf` : `Performance_Report_${new Date().getTime()}.pdf`;
      pdf.save(filename);
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
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          label={t.savings}
          value="MT 1.2M"
          change="+12.5%"
          trend="up"
          icon={TrendingUp}
          isDarkMode={isDarkMode}
        />
        <StatCard 
          label={t.volume}
          value="MT 4.8M"
          change="+5.2%"
          trend="up"
          icon={BarChart3}
          isDarkMode={isDarkMode}
        />
        <StatCard 
          label={language === 'PT' ? 'ROI Estimado' : 'Estimated ROI'}
          value="24.5%"
          change="+1.8%"
          trend="up"
          icon={DollarSign}
          isDarkMode={isDarkMode}
        />
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
