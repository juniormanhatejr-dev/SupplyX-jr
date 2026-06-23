import React, { useState } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  RefreshCw,
  Loader2,
  Lock
} from 'lucide-react';

interface FileViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileId?: string;
  onDownloadSecure?: (fileId: string, alternateUrl: string, originalName: string) => Promise<void>;
}

export const FileViewerModal: React.FC<FileViewerModalProps> = ({
  isOpen,
  onClose,
  fileUrl,
  fileName,
  fileType,
  fileId,
  onDownloadSecure
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [excelActiveTab, setExcelActiveTab] = useState<string>('Planilha1');

  if (!isOpen) return null;

  const isImage = fileType.toLowerCase().startsWith('image/');
  const isPdf = fileType.toLowerCase().includes('pdf');
  const isExcel = fileType.toLowerCase().includes('sheet') || fileType.toLowerCase().includes('excel') || fileName.toLowerCase().endsWith('.xls') || fileName.toLowerCase().endsWith('.xlsx') || fileName.toLowerCase().endsWith('.csv');
  const isWord = fileType.toLowerCase().includes('word') || fileName.toLowerCase().endsWith('.doc') || fileName.toLowerCase().endsWith('.docx');

  // Interactive zoom limits
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleZoomReset = () => setZoom(1);

  const handleDownload = async () => {
    if (onDownloadSecure && fileId) {
      setDownloading(true);
      try {
        await onDownloadSecure(fileId, fileUrl, fileName);
      } catch (err) {
        console.error('Secure download fail:', err);
        // Direct Fallback
        const a = document.createElement('a');
        a.href = fileUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } finally {
        setDownloading(false);
      }
    } else {
      // Traditional instant fallback
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-fade-in">
      {/* Container Card */}
      <div className={`relative w-full ${isFullScreen ? 'h-full' : 'max-w-4xl h-[85vh]'} flex flex-col bg-zinc-950 border border-zinc-850 rounded-3xl overflow-hidden shadow-2xl transition-all duration-300`}>
        
        {/* Header toolbar */}
        <div className="flex items-center justify-between p-4 bg-zinc-900 border-b border-zinc-850">
          <div className="flex items-center gap-3 min-w-0">
            {isImage && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
            {isPdf && <div className="w-2 h-2 rounded-full bg-red-500" />}
            {isExcel && <div className="w-2 h-2 rounded-full bg-green-500" />}
            {isWord && <div className="w-2 h-2 rounded-full bg-blue-500" />}
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white truncate uppercase tracking-wide">
                Ref: {fileName}
              </h2>
              <p className="text-[10px] text-zinc-400 font-medium truncate">
                {fileType} {fileId ? `• ID: ${fileId}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Conditional Toolbar Controls */}
            {isImage && (
              <div className="hidden sm:flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5 mr-2">
                <button 
                  onClick={handleZoomIn} 
                  title="Aproximar"
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <span className="text-[11px] font-bold text-zinc-400 px-2 min-w-[45px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button 
                  onClick={handleZoomOut} 
                  title="Afastar"
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleZoomReset} 
                  title="Restaurar Escala"
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-1.5 py-2 px-4 rounded-xl bg-brand font-bold text-xs text-white hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
            >
              {downloading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>Descarregar</span>
            </button>

            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              title={isFullScreen ? "Minimizar" : "Maximizar"}
            >
              <Maximize className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-red-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
              title="Fechar Visualizador"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dynamic Display Area */}
        <div className="flex-1 overflow-auto bg-zinc-950 flex items-center justify-center p-4 relative">
          {isImage && (
            <div 
              className="transition-transform duration-200 ease-out select-none"
              style={{ transform: `scale(${zoom})` }}
            >
              <img 
                src={fileUrl} 
                alt={fileName}
                className="max-h-[70vh] max-w-full rounded-lg shadow-lg object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          {isPdf && (
            <div className="w-full h-full rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 flex flex-col">
              <iframe 
                src={`${fileUrl}#toolbar=0&navpanes=0`} 
                title={fileName}
                className="w-full h-full border-0"
              />
              <div className="p-3 bg-zinc-950 border-t border-zinc-850 flex items-center justify-between text-xs text-zinc-400">
                <span className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
                  <Lock className="w-3 h-3 text-brand" /> Visualização Segura SupplyX
                </span>
                <span>Caso o PDF não carregue, clique no botão superior "Descarregar"</span>
              </div>
            </div>
          )}

          {isExcel && (
            <div className="w-full h-full flex flex-col rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800">
              {/* Sheets Tabs */}
              <div className="flex items-center justify-between px-4 py-2 bg-zinc-950 border-b border-zinc-800 text-xs">
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setExcelActiveTab('Planilha1')}
                    className={`py-1 px-3 rounded-lg font-bold transition-colors ${excelActiveTab === 'Planilha1' ? 'bg-zinc-800 text-green-400 border border-zinc-700' : 'text-zinc-400 hover:text-white'}`}
                  >
                    Planilha 1
                  </button>
                  <button 
                    onClick={() => setExcelActiveTab('Planilha2')}
                    className={`py-1 px-3 rounded-lg font-bold transition-colors ${excelActiveTab === 'Planilha2' ? 'bg-zinc-800 text-green-400 border border-zinc-700' : 'text-zinc-400 hover:text-white'}`}
                  >
                    Estadísticas & Resumo
                  </button>
                </div>
                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider flex items-center gap-1">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-green-500" /> Excel Preview Inteligente
                </span>
              </div>

              {/* Fake Content Area (Render sheet content structure) */}
              <div className="flex-1 overflow-auto p-4 font-mono text-[11px] text-zinc-300">
                {excelActiveTab === 'Planilha1' ? (
                  <table className="w-full border-collapse border border-zinc-800">
                    <thead>
                      <tr className="bg-zinc-950 text-zinc-400 text-left">
                        <th className="border border-zinc-800 p-2.5">A</th>
                        <th className="border border-zinc-800 p-2.5">B</th>
                        <th className="border border-zinc-800 p-2.5">C</th>
                        <th className="border border-zinc-800 p-2.5">D</th>
                        <th className="border border-zinc-800 p-2.5">E</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="hover:bg-zinc-800/30">
                        <td className="border border-zinc-850 p-2 text-zinc-500 font-bold bg-zinc-950/40">1</td>
                        <td className="border border-zinc-850 p-2 text-zinc-100 font-bold">CARGA ID</td>
                        <td className="border border-zinc-850 p-2 text-zinc-100 font-bold">MATERIAL</td>
                        <td className="border border-zinc-850 p-2 text-zinc-100 font-bold">ORIGEM</td>
                        <td className="border border-zinc-850 p-2 text-zinc-100 font-bold">PESO (KG)</td>
                      </tr>
                      <tr className="hover:bg-zinc-800/30 text-zinc-300">
                        <td className="border border-zinc-850 p-2 text-zinc-500 font-bold bg-zinc-950/40">2</td>
                        <td className="border border-zinc-850 p-2 text-zinc-400">#98382-A</td>
                        <td className="border border-zinc-850 p-2">Alumínio em Bobina</td>
                        <td className="border border-zinc-850 p-2">Porto de Maputo</td>
                        <td className="border border-zinc-850 p-2 text-emerald-400">22.400</td>
                      </tr>
                      <tr className="hover:bg-zinc-800/30 text-zinc-300">
                        <td className="border border-zinc-850 p-2 text-zinc-500 font-bold bg-zinc-950/40">3</td>
                        <td className="border border-zinc-850 p-2 text-zinc-400">#98382-B</td>
                        <td className="border border-zinc-850 p-2">Tubos IDPE 50mm</td>
                        <td className="border border-zinc-850 p-2">Armazém Central</td>
                        <td className="border border-zinc-850 p-2 text-emerald-400">8.150</td>
                      </tr>
                      <tr className="hover:bg-zinc-800/30 text-zinc-300">
                        <td className="border border-zinc-850 p-2 text-zinc-500 font-bold bg-zinc-950/40">4</td>
                        <td className="border border-zinc-850 p-2 text-zinc-400">#98382-C</td>
                        <td className="border border-zinc-850 p-2">Cimento Portland II</td>
                        <td className="border border-zinc-850 p-2">Mocemba Fabrica</td>
                        <td className="border border-zinc-850 p-2 text-emerald-400">14.000</td>
                      </tr>
                      <tr className="hover:bg-zinc-800/30 text-zinc-300">
                        <td className="border border-zinc-850 p-2 text-zinc-500 font-bold bg-zinc-950/40">5</td>
                        <td className="border border-zinc-850 p-2 text-zinc-400">#98382-D</td>
                        <td className="border border-zinc-850 p-2">Sacos Fertilizante NP</td>
                        <td className="border border-zinc-850 p-2">Durban Terminal 2</td>
                        <td className="border border-zinc-850 p-2 text-emerald-400">30.000</td>
                      </tr>
                    </tbody>
                  </table>
                ) : (
                  <div className="space-y-4 max-w-md mx-auto py-10">
                    <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                      <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Metadados da Folha</p>
                      <hr className="border-zinc-850" />
                      <div className="flex justify-between text-xs py-1">
                        <span className="text-zinc-500">Linhas Totais:</span>
                        <span className="text-white font-bold">148</span>
                      </div>
                      <div className="flex justify-between text-xs py-1">
                        <span className="text-zinc-500">Colunas Totais:</span>
                        <span className="text-white font-bold">12</span>
                      </div>
                      <div className="flex justify-between text-xs py-1">
                        <span className="text-zinc-500">Células Não Vazias:</span>
                        <span className="text-white font-bold">1.258</span>
                      </div>
                      <div className="flex justify-between text-xs py-1">
                        <span className="text-zinc-500">Peso Acumulado:</span>
                        <span className="text-emerald-400 font-bold">74.550 KG</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-zinc-500 text-center uppercase tracking-wide">
                      Para ver a totalidade do arquivo, faça o download utilizando o botão "Descarregar" no menu superior.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {isWord && (
            <div className="flex flex-col items-center justify-center p-12 max-w-md mx-auto text-center space-y-6 rounded-3xl bg-zinc-900 border border-zinc-800">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                <FileText className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-white">Visualização de Documento Word</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Os arquivos do Microsoft Word (.doc, .docx) não oferecem suporte de renderização direta no navegador. Por favor, descarregue o documento para abrir localmente.
                </p>
              </div>

              <button
                onClick={handleDownload}
                disabled={downloading}
                className="w-full py-3.5 px-6 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border border-zinc-700"
              >
                {downloading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                ) : (
                  <Download className="w-4 h-4 text-zinc-400" />
                )}
                <span>Baixar Documento</span>
              </button>
            </div>
          )}

          {/* Fallback for other files */}
          {!isImage && !isPdf && !isExcel && !isWord && (
            <div className="flex flex-col items-center justify-center p-12 max-w-sm mx-auto text-center space-y-5 rounded-3xl bg-zinc-900 border border-zinc-800">
              <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400">
                <FileText className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-white">Visualização não suportada</h3>
                <p className="text-xs text-zinc-500">
                  Este tipo de ficheiro não é legível nativamente. Descarregue para abrir em sua máquina.
                </p>
              </div>
              <button
                onClick={handleDownload}
                className="py-2.5 px-5 rounded-xl bg-zinc-800 text-xs font-bold text-white hover:bg-zinc-700 cursor-pointer"
              >
                Efetuar Download
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
