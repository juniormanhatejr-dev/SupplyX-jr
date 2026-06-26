import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  UploadCloud, 
  Trash2, 
  Eye, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  CheckCircle, 
  Clock, 
  FolderLock, 
  AlertCircle,
  X,
  SlidersHorizontal,
  Loader2,
  Lock,
  User,
  ExternalLink
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { FileViewerModal } from './FileViewerModal';

interface CargoDocumentsPageProps {
  isDarkMode: boolean;
  language: 'PT' | 'EN';
}

interface CorporateFile {
  id: string;
  file_name: string;
  original_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  blob_url: string;
  uploaded_by: string;
  company_id: string;
  created_at: string;
  updated_at: string;
  category: string;
  message_id?: string;
  shipment_id?: string;
  order_id?: string;
}

export const CargoDocumentsPage: React.FC<CargoDocumentsPageProps> = ({
  isDarkMode,
  language
}) => {
  // Collection files listing
  const [files, setFiles] = useState<CorporateFile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>(''); // 'document' or 'image'
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadCategory, setUploadCategory] = useState<string>('contract');
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Preview Modal States
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [previewName, setPreviewName] = useState<string>('');
  const [previewType, setPreviewType] = useState<string>('');
  const [previewId, setPreviewId] = useState<string | undefined>(undefined);

  // Fetch file list
  const fetchFilesList = useCallback(async () => {
    setLoading(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      let queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (categoryFilter) queryParams.append('category', categoryFilter);
      if (typeFilter) queryParams.append('type', typeFilter);

      const res = await fetch(`/api/files?${queryParams.toString()}`, {
        headers: {
          'Authorization': idToken ? `Bearer ${idToken}` : '',
          'x-user-id': auth.currentUser?.uid || ''
        }
      });
      if (res.ok) {
        const data = await res.json();
        setFiles(data);
      } else {
        console.error('List files API failed');
      }
    } catch (err: any) {
      console.error('Fetch files list failure:', err);
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, typeFilter]);

  useEffect(() => {
    fetchFilesList();
  }, [fetchFilesList]);

  // Handle Drag Events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Process and upload file
  const processFileUpload = async (file: File) => {
    const allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'png', 'jpg', 'jpeg', 'webp'];
    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';

    if (!allowedExtensions.includes(fileExt)) {
      showErrorToast(
        language === 'PT' 
          ? 'Formato de arquivo incompatível. formatos legíveis: PDF, Word (DOC/DOCX), Excel (XLS/XLSX), CSV, ou Imagens.' 
          : 'Unsupported file format. Readable templates are PDF, Word (DOC/DOCX), Excel (XLS/XLSX), CSV, or raw Images.'
      );
      return;
    }

    // 100MB max limit
    if (file.size > 100 * 1024 * 1024) {
      showErrorToast(
        language === 'PT'
          ? 'O arquivo excede o limite estrito de 100MB.'
          : 'File size exceeds the physical container limit of 100MB.'
      );
      return;
    }

    setIsUploading(true);
    setUploadProgress(15);
    
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', uploadCategory);

      // Simulated gradual upload progress
      const progressTimer = setInterval(() => {
        setUploadProgress(prev => (prev < 85 ? prev + 12 : prev));
      }, 250);

      const res = await fetch('/api/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': idToken ? `Bearer ${idToken}` : '',
          'x-user-id': auth.currentUser?.uid || ''
        },
        body: formData
      });

      clearInterval(progressTimer);
      setUploadProgress(100);

      if (res.ok) {
        showSuccessToast(
          language === 'PT'
            ? `Ficheiro "${file.name}" carregado com sucesso!`
            : `File "${file.name}" successfully committed to cloud storage!`
        );
        fetchFilesList();
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Upload failed' }));
        showErrorToast(errorData.error || 'Upload error');
      }
    } catch (err: any) {
      console.error('File upload fatal error:', err);
      showErrorToast(String(err));
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 800);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFileUpload(e.target.files[0]);
    }
  };

  // Secure temporary download flow using GET /api/files/:id/download
  const handleSecureDownload = async (fileId: string, alternateUrl: string, originalName: string) => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/files/${fileId}/download`, {
        headers: {
          'Authorization': idToken ? `Bearer ${idToken}` : '',
          'x-user-id': auth.currentUser?.uid || ''
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.downloadUrl) {
          const a = document.createElement('a');
          a.href = data.downloadUrl;
          a.download = originalName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          return;
        }
      }
    } catch (err) {
      console.error('Secure download fail:', err);
    }

    // Direct fallback
    const a = document.createElement('a');
    a.href = alternateUrl;
    a.download = originalName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Execute safe delete
  const handleDeleteFile = async (id: string, originalName: string) => {
    const confirmPrompt = language === 'PT'
      ? `Tem certeza que deseja remover permanentemente o arquivo "${originalName}" do servidor?`
      : `Are you sure you want to permanently delete the document "${originalName}"?`;
    
    if (!window.confirm(confirmPrompt)) {
      return;
    }

    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/files/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': idToken ? `Bearer ${idToken}` : '',
          'x-user-id': auth.currentUser?.uid || ''
        }
      });
      if (res.ok) {
        showSuccessToast(
          language === 'PT'
            ? 'Arquivo apagado com êxito'
            : 'File successfully destroyed'
        );
        fetchFilesList();
      } else {
        const errData = await res.json();
        showErrorToast(errData.error || 'Delete failure');
      }
    } catch (err: any) {
      showErrorToast(String(err));
    }
  };

  // Toast Helpers
  const showSuccessToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const showErrorToast = (msg: string) => {
    setErrorToast(msg);
    setTimeout(() => setErrorToast(null), 5000);
  };

  // Convert bytes helper
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = 1;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Alert Rails */}
      {successToast && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2.5 p-4 rounded-2xl bg-emerald-950 border border-emerald-500/50 text-emerald-300 shadow-2xl">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 animate-bounce" />
          <span className="text-xs font-bold leading-none">{successToast}</span>
        </div>
      )}

      {errorToast && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2.5 p-4 rounded-2xl bg-red-950 border border-red-500/50 text-red-300 shadow-2xl">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span className="text-xs font-bold leading-none">{errorToast}</span>
        </div>
      )}

      {/* Header Info */}
      <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-150 shadow-xs'}`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
              <FolderLock className="w-5 h-5 text-brand" />
              {language === 'PT' ? 'Centro de Documentos de Carga' : 'Corporate Logistical Documents Cabinet'}
            </h2>
            <p className="text-xs text-zinc-550 text-zinc-400 font-bold uppercase mt-1">
              {language === 'PT' 
                ? 'Armazenamento de Notas Fiscais (Invoices), contratos e guias com download seguro temporário e auditoria ativa.' 
                : 'Secure repository for freight manifests, billing invoices, binding contracts & compliance certifications.'}
            </p>
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-500 uppercase font-black tracking-widest bg-zinc-950/20 px-3 py-1.5 rounded-xl">
            <Lock className="w-3.5 h-3.5 text-brand" /> {language === 'PT' ? 'Módulo Criptografado Ativo' : 'Secure Channel Encrypted'}
          </div>
        </div>
      </div>

      {/* Main Grid: Upload Sidebar + Filterable File Cabinet */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sidebar Dropzone (3 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className={`p-5 rounded-3xl border flex flex-col h-full ${
            isDarkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-150 shadow-xs'
          }`}>
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-500 mb-4">
              {language === 'PT' ? 'Enviar Novo Documento' : 'Upload Secure Document'}
            </h4>

            {/* Select Category */}
            <div className="space-y-2 mb-4">
              <label className="text-[10px] font-black uppercase text-zinc-400">
                {language === 'PT' ? 'Categoria Fiscal / Operação' : 'Fiduciary / Tariff Category'}
              </label>
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold outline-none border transition-all ${
                  isDarkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-800'
                }`}
              >
                <option value="contract">{language === 'PT' ? '✍️ Contratos de Transporte' : '✍️ Freight Contracts'}</option>
                <option value="guide">{language === 'PT' ? '🚚 Manifesto / Guia de Carga' : '🚚 Shipping Manifest / Ways'}</option>
                <option value="invoice">{language === 'PT' ? '🧾 Nota Fiscal (Invoice)' : '🧾 Commercial Tax Invoice'}</option>
                <option value="receipt">{language === 'PT' ? '💵 Recibos / Comprovativos' : '💵 Financial Receipts'}</option>
                <option value="insurance">{language === 'PT' ? '🛡️ Apólice de Seguro' : '🛡️ Accident Insurance Policy'}</option>
                <option value="photo">{language === 'PT' ? '🖼️ Registros Fotográficos' : '🖼️ Visual Proof Photographs'}</option>
                <option value="others">{language === 'PT' ? '📂 Outras Certidões' : '📂 Other Certificates'}</option>
              </select>
            </div>

            {/* Drag & Drop Area */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`flex-1 min-h-[220px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center transition-all relative ${
                dragActive 
                  ? 'border-brand bg-brand/5' 
                  : isDarkMode ? 'border-zinc-850 hover:border-zinc-750 bg-zinc-950/20' : 'border-zinc-250 hover:border-zinc-350 bg-zinc-50/40'
              }`}
            >
              <input
                type="file"
                id="cabinet-file-uploader"
                className="hidden"
                onChange={handleFileSelect}
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv"
                disabled={isUploading}
              />
              
              {isUploading ? (
                <div className="space-y-4 w-full px-2">
                  <div className="w-12 h-12 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center mx-auto text-brand">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white uppercase tracking-wider">{language === 'PT' ? 'A Processar...' : 'Processing...'}</p>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{uploadProgress}%</p>
                  </div>
                  {/* Progress Indicator */}
                  <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                    <div 
                      className="bg-brand h-full rounded-full transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <label htmlFor="cabinet-file-uploader" className="cursor-pointer space-y-4 block w-full">
                  <div className="w-12 h-12 rounded-full bg-zinc-800/50 border border-white/5 flex items-center justify-center mx-auto text-zinc-400">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white uppercase tracking-wider">
                      {language === 'PT' ? 'Arraste ou Clique' : 'Drag & Drop or Click'}
                    </p>
                    <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest">
                      {language === 'PT' ? 'Ficheiros até 100MB' : 'Max File size 100MB'}
                    </p>
                  </div>
                  <span className="inline-block py-1 px-3 rounded-lg bg-zinc-850 hover:bg-zinc-800 text-[9px]/none font-black text-brand uppercase tracking-wider transition-colors">
                    {language === 'PT' ? 'Procurar Ficheiro' : 'Browse System'}
                  </span>
                </label>
              )}
            </div>
          </div>
        </div>

        {/* File List Cabinet (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col space-y-6">
          <div className={`p-5 rounded-3xl border flex-1 flex flex-col ${
            isDarkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-150 shadow-xs'
          }`}>
            
            {/* Search & Custom Filter Dashboard Toolbar */}
            <div className="flex flex-col md:flex-row items-center gap-3.5 mb-6">
              {/* Search */}
              <div className="w-full md:flex-1 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-550 text-zinc-400" />
                <input
                  type="text"
                  placeholder={language === 'PT' ? 'Nome ou categoria do documento...' : 'Search document registers...'}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs font-bold outline-none border transition-all ${
                    isDarkMode ? 'bg-zinc-950 border-white/5 text-white focus:border-brand/40' : 'bg-zinc-50 border-zinc-150 focus:border-brand/20'
                  }`}
                />
              </div>

              {/* Sliders Category Filter */}
              <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className={`py-2.5 px-3.5 rounded-xl border outline-none text-xs font-bold ${
                    isDarkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-zinc-50 border-zinc-150 text-zinc-700'
                  }`}
                >
                  <option value="">{language === 'PT' ? 'Todas as Categorias' : 'All Categories'}</option>
                  <option value="contract">{language === 'PT' ? '✍️ Contratos' : '✍️ Contracts'}</option>
                  <option value="guide">{language === 'PT' ? '🚚 Guias / Manifestos' : '🚚 Waybills'}</option>
                  <option value="invoice">{language === 'PT' ? '🧾 Notas Fiscais' : '🧾 Invoices'}</option>
                  <option value="receipt">{language === 'PT' ? '💵 Recibos' : '💵 Receipts'}</option>
                  <option value="insurance">{language === 'PT' ? 'Apólice de Seguro' : 'Insurance Policy'}</option>
                  <option value="photo">{language === 'PT' ? 'Visual Proof' : 'Visual Proof'}</option>
                  <option value="others">{language === 'PT' ? 'Outros' : 'Others'}</option>
                </select>

                {/* Subtype Filter */}
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className={`py-2.5 px-3.5 rounded-xl border outline-none text-xs font-bold ${
                    isDarkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-zinc-50 border-zinc-150 text-zinc-700'
                  }`}
                >
                  <option value="">{language === 'PT' ? 'Qualquer Formato' : 'Any Format'}</option>
                  <option value="document">{language === 'PT' ? '📄 Apenas Documentos' : '📄 Documents Only'}</option>
                  <option value="image">{language === 'PT' ? '🖼️ Apenas Imagens' : '🖼️ Images Only'}</option>
                </select>
              </div>
            </div>

            {/* Realtime Documents Table Grid */}
            <div className="flex-1 overflow-auto max-h-[500px] scrollbar-hide">
              {loading ? (
                <div className="flex flex-col items-center justify-center p-12 text-center text-zinc-500">
                  <Loader2 className="w-8 h-8 animate-spin text-brand mb-4" />
                  <p className="text-xs font-bold uppercase tracking-widest">{language === 'PT' ? 'Sincronizando Gabinete...' : 'Syncing Corporate Cabinet...'}</p>
                </div>
              ) : files.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-zinc-800/40 border-dashed bg-zinc-950/20">
                  <X className="w-10 h-10 text-zinc-650 text-zinc-550 mb-3.5" />
                  <p className="text-sm font-bold text-zinc-300 uppercase tracking-wide">
                    {language === 'PT' ? 'Nenhum documento encontrado' : 'No corporate documents recorded'}
                  </p>
                  <p className="text-xs text-zinc-500 max-w-sm mt-1 leading-relaxed">
                    {language === 'PT' 
                      ? 'Nenhum certificado, contrato ou comprovativo foi guardado com este filtro de pesquisa.' 
                      : 'No contracts, invoices, or delivery logs currently exist match this search index.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {files.map((file) => {
                    const isDocImage = file.file_type.toLowerCase().startsWith('image/');
                    return (
                      <div
                        key={file.id}
                        className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                          isDarkMode ? 'bg-zinc-950/40 hover:bg-zinc-900/60 border-white/5' : 'bg-zinc-50 hover:bg-zinc-100/60 border-zinc-150'
                        }`}
                      >
                        {/* File Meta Info */}
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isDocImage 
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/10' 
                              : 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/10'
                          }`}>
                            {isDocImage ? (
                              <FileText className="w-5 h-5 shrink-0" />
                            ) : (
                              <FileSpreadsheet className="w-5 h-5 shrink-0" />
                            )}
                          </div>
                          
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-white truncate max-w-[210px] sm:max-w-[280px]">
                              {file.original_name}
                            </h5>
                            
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              <span className="text-[8px] uppercase font-black tracking-widest px-1.5 py-0.5 rounded-md bg-zinc-800 text-zinc-400 shrink-0">
                                {file.category || 'others'}
                              </span>
                              <span className="text-[10px] text-zinc-400 font-bold shrink-0">
                                {formatBytes(file.file_size)}
                              </span>
                              <span className="text-[9px] text-zinc-550 text-zinc-500 font-medium font-mono shrink-0">
                                • {new Date(file.created_at).toLocaleDateString([], { day: '2-digit', month: 'short' })}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Interactive Toolbar Actions */}
                        <div className="flex items-center gap-1.5 justify-end shrink-0">
                          {/* Viewer */}
                          <button
                            onClick={async () => {
                              try {
                                const idToken = await auth.currentUser?.getIdToken();
                                const res = await fetch(`/api/files/${file.id}/download`, {
                                  headers: {
                                    'Authorization': idToken ? `Bearer ${idToken}` : '',
                                    'x-user-id': auth.currentUser?.uid || ''
                                  }
                                });
                                if (res.ok) {
                                  const data = await res.json();
                                  if (data.downloadUrl) {
                                    setPreviewUrl(`${data.downloadUrl}&inline=true`);
                                  } else {
                                    setPreviewUrl(file.blob_url);
                                  }
                                } else {
                                  setPreviewUrl(file.blob_url);
                                }
                              } catch (err) {
                                console.error('Failed secure preview generation:', err);
                                setPreviewUrl(file.blob_url);
                              }
                              setPreviewName(file.original_name);
                              setPreviewType(file.file_type);
                              setPreviewId(file.id);
                              setIsPreviewOpen(true);
                            }}
                            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                            title={language === 'PT' ? 'Visualizar Arquivo' : 'Preview Live'}
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Quick secure download */}
                          <button
                            onClick={() => handleSecureDownload(file.id, file.blob_url, file.original_name)}
                            className="p-2 rounded-xl text-zinc-400 hover:text-brand hover:bg-brand/10 transition-colors cursor-pointer"
                            title={language === 'PT' ? 'Download Seguro' : 'Secure Download'}
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {/* Destroy file */}
                          <button
                            onClick={() => handleDeleteFile(file.id, file.original_name)}
                            className="p-2 rounded-xl text-red-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title={language === 'PT' ? 'Excluir Arquivo' : 'Erase File'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Auditing status footer log */}
            <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-850 mt-4 flex items-center justify-between text-[10px] text-zinc-550 text-zinc-400 font-mono">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-brand" /> SSL / ISO-Compliant File Encryption Gate
              </span>
              <span>Auditoria logs ativada</span>
            </div>
          </div>
        </div>
      </div>

      {/* Corporate File Preview Drawer Modal */}
      <FileViewerModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        fileUrl={previewUrl}
        fileName={previewName}
        fileType={previewType}
        fileId={previewId}
        onDownloadSecure={handleSecureDownload}
      />
    </div>
  );
};
