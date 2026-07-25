import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  FileX2, 
  Search, 
  Truck, 
  MapPin, 
  Package, 
  Calendar, 
  User, 
  FileText, 
  ArrowLeft, 
  Download, 
  Printer, 
  ExternalLink, 
  Clock, 
  History, 
  Globe, 
  Sun, 
  Moon, 
  Building2, 
  Check, 
  X, 
  ChevronRight,
  QrCode,
  ShieldAlert
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import SupplyXLogo from '../SupplyXLogo';

interface DocumentVerificationViewProps {
  documentId?: string;
  isDarkMode?: boolean;
  language?: 'PT' | 'EN';
  onBackToApp?: () => void;
}

export default function DocumentVerificationView({
  documentId: propDocumentId,
  isDarkMode: initialDarkMode = true,
  language: initialLanguage = 'PT',
  onBackToApp
}: DocumentVerificationViewProps) {
  const [isDarkMode, setIsDarkMode] = useState(initialDarkMode);
  const [language, setLanguage] = useState<'PT' | 'EN'>(initialLanguage);
  
  // Extract document ID from props or URL
  const [currentDocId, setCurrentDocId] = useState<string>(() => {
    if (propDocumentId) return propDocumentId;
    const pathname = window.location.pathname;
    const match = pathname.match(/\/verify\/(.+)/);
    if (match && match[1]) {
      return decodeURIComponent(match[1].trim());
    }
    const params = new URLSearchParams(window.location.search);
    return params.get('doc') || params.get('documentId') || '';
  });

  const [searchInput, setSearchInput] = useState(currentDocId);
  const [loading, setLoading] = useState(true);
  const [documentData, setDocumentData] = useState<any | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'valid' | 'revoked' | 'not_found' | 'loading'>('loading');

  // Normalize and fetch document from Firestore or localStorage
  useEffect(() => {
    let isMounted = true;

    async function fetchDocument() {
      if (!currentDocId) {
        setLoading(false);
        setVerificationStatus('not_found');
        setDocumentData(null);
        return;
      }

      setLoading(true);
      setVerificationStatus('loading');

      // Extract raw ID cleanups
      // Formats could be:
      // CRT-MZ-TR-2026-TR-2025-0001
      // CRT-MZ-TR-2026-1001
      // TR-2025-0001
      // 1001
      let rawId = currentDocId.trim();
      let cleanId = rawId;

      if (rawId.startsWith('CRT-MZ-TR-2026-')) {
        cleanId = rawId.replace('CRT-MZ-TR-2026-', '');
      } else if (rawId.startsWith('CRT-MZ-')) {
        cleanId = rawId.replace('CRT-MZ-', '');
      }

      let foundDoc: any = null;

      try {
        // 1. Try Firestore: freight_orders by document id or cleanId
        const freightRef1 = doc(db, 'freight_orders', rawId);
        const snap1 = await getDoc(freightRef1);
        if (snap1.exists()) {
          foundDoc = { id: snap1.id, ...snap1.data() };
        }

        if (!foundDoc && cleanId !== rawId) {
          const freightRef2 = doc(db, 'freight_orders', cleanId);
          const snap2 = await getDoc(freightRef2);
          if (snap2.exists()) {
            foundDoc = { id: snap2.id, ...snap2.data() };
          }
        }

        if (!foundDoc) {
          const q1 = query(collection(db, 'freight_orders'), where('id', '==', rawId));
          const querySnap1 = await getDocs(q1);
          if (!querySnap1.empty) {
            foundDoc = { id: querySnap1.docs[0].id, ...querySnap1.docs[0].data() };
          }
        }

        if (!foundDoc && cleanId !== rawId) {
          const q2 = query(collection(db, 'freight_orders'), where('id', '==', cleanId));
          const querySnap2 = await getDocs(q2);
          if (!querySnap2.empty) {
            foundDoc = { id: querySnap2.docs[0].id, ...querySnap2.docs[0].data() };
          }
        }

        // 2. Try Firestore: transportAssignments
        if (!foundDoc) {
          const assignRef1 = doc(db, 'transportAssignments', rawId);
          const assignSnap1 = await getDoc(assignRef1);
          if (assignSnap1.exists()) {
            foundDoc = { id: assignSnap1.id, ...assignSnap1.data(), isDirectAssignment: true };
          }
        }

        if (!foundDoc && cleanId !== rawId) {
          const assignRef2 = doc(db, 'transportAssignments', cleanId);
          const assignSnap2 = await getDoc(assignRef2);
          if (assignSnap2.exists()) {
            foundDoc = { id: assignSnap2.id, ...assignSnap2.data(), isDirectAssignment: true };
          }
        }

        // 3. Fallback to LocalStorage
        if (!foundDoc) {
          const savedLocal = localStorage.getItem('supplyx_freight_requests');
          if (savedLocal) {
            try {
              const list = JSON.parse(savedLocal);
              const matched = list.find((item: any) => 
                item.id === rawId || 
                item.id === cleanId || 
                `CRT-MZ-TR-2026-${item.id}` === rawId
              );
              if (matched) {
                foundDoc = matched;
              }
            } catch (err) {
              console.warn('Error reading local CRT document cache:', err);
            }
          }
        }
      } catch (error) {
        console.error('Error verifying CRT document in Firestore:', error);
      }

      if (!isMounted) return;

      if (foundDoc) {
        setDocumentData(foundDoc);
        const st = (foundDoc.status || '').toLowerCase();
        if (st === 'cancelado' || st === 'revogado' || st === 'cancelled' || st === 'revoked') {
          setVerificationStatus('revoked');
        } else {
          setVerificationStatus('valid');
        }
      } else {
        setDocumentData(null);
        setVerificationStatus('not_found');
      }

      setLoading(false);
    }

    fetchDocument();

    return () => {
      isMounted = false;
    };
  }, [currentDocId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    const cleanSearch = searchInput.trim();
    setCurrentDocId(cleanSearch);
    window.history.pushState({}, '', `/verify/${encodeURIComponent(cleanSearch)}`);
  };

  const formattedOfficialCode = documentData?.id 
    ? (documentData.id.startsWith('CRT-') ? documentData.id : `CRT-MZ-TR-2026-${documentData.id}`)
    : `CRT-MZ-TR-2026-${currentDocId}`;

  return (
    <div className={`min-h-screen transition-colors duration-300 font-sans ${isDarkMode ? 'bg-zinc-950 text-white' : 'bg-slate-50 text-slate-900'} print:bg-white print:text-black`}>
      
      {/* Top Navigation Bar */}
      <header className={`sticky top-0 z-40 border-b backdrop-blur-md ${isDarkMode ? 'bg-zinc-950/80 border-white/10' : 'bg-white/80 border-slate-200'} print:hidden`}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <SupplyXLogo size="sm" isDark={isDarkMode} />
            <div className="hidden sm:block border-l border-white/10 pl-3">
              <h1 className="text-xs font-black uppercase tracking-wider text-supplyx-blue">
                {language === 'PT' ? 'Portal de Autenticidade Digital' : 'Digital Verification Portal'}
              </h1>
              <p className="text-[10px] text-zinc-400 font-mono">
                INATRO & Autoridade Tributária Compliance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switch */}
            <button
              onClick={() => setLanguage(language === 'PT' ? 'EN' : 'PT')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 text-xs font-bold hover:bg-white/5 transition-all"
            >
              <Globe className="w-3.5 h-3.5 text-supplyx-blue" />
              <span>{language}</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-xl border border-white/10 text-xs hover:bg-white/5 transition-all"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Go to Main App */}
            {onBackToApp ? (
              <button
                onClick={onBackToApp}
                className="px-3.5 py-1.5 bg-supplyx-blue hover:bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-supplyx-blue/20 transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{language === 'PT' ? 'Voltar à App' : 'Back to App'}</span>
              </button>
            ) : (
              <a
                href="/"
                className="px-3.5 py-1.5 bg-supplyx-blue hover:bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-supplyx-blue/20 transition-all"
              >
                <span>SupplyX App</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        
        {/* Search Bar for Quick Verification */}
        <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-zinc-900/90 border-white/10' : 'bg-white border-slate-200 shadow-sm'} print:hidden`}>
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={language === 'PT' ? 'Digitar Código CRT (ex: CRT-MZ-TR-2026-1001)...' : 'Enter CRT Code...'}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-mono font-bold transition-all focus:outline-none focus:ring-2 focus:ring-supplyx-blue ${
                  isDarkMode ? 'bg-zinc-950 border-white/10 text-white placeholder:text-zinc-600' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                }`}
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
            >
              {language === 'PT' ? 'Verificar Guia' : 'Verify Document'}
            </button>
          </form>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="py-20 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-supplyx-blue/20 border-t-supplyx-blue rounded-full animate-spin mx-auto" />
            <p className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest animate-pulse">
              {language === 'PT' 
                ? 'Consultando registo on-chain e base de dados do Firestore...' 
                : 'Querying Firestore and on-chain registry...'}
            </p>
          </div>
        )}

        {/* VERIFICATION RESULTS */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* STATUS BANNER */}
            {verificationStatus === 'valid' && (
              <div className="p-6 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-widest">
                        {language === 'PT' ? 'DOCUMENTO AUTÊNTICO' : 'AUTHENTIC DOCUMENT'}
                      </span>
                      <span className="text-emerald-400 text-xs font-mono font-bold">✓ VERIFICADO ON-CHAIN</span>
                    </div>
                    <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-emerald-400 mt-1">
                      {language === 'PT' ? 'Guia de Transporte Digital Válida' : 'Valid Consignment Note'}
                    </h2>
                    <p className="text-xs text-emerald-300/80 mt-0.5 font-medium">
                      {language === 'PT'
                        ? 'Assinatura digital e integridade verificadas com sucesso na rede de logística SupplyX.'
                        : 'Digital signature and document integrity verified on the SupplyX network.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => window.print()}
                  className="w-full sm:w-auto px-4 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all print:hidden"
                >
                  <Printer className="w-4 h-4" />
                  <span>{language === 'PT' ? 'Imprimir / PDF' : 'Print / PDF'}</span>
                </button>
              </div>
            )}

            {verificationStatus === 'revoked' && (
              <div className="p-6 bg-rose-500/10 border-2 border-rose-500/30 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                    <ShieldAlert className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest">
                        {language === 'PT' ? 'DOCUMENTO REVOGADO' : 'REVOKED DOCUMENT'}
                      </span>
                      <span className="text-rose-400 text-xs font-mono font-bold">✕ INVALIDATED</span>
                    </div>
                    <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-rose-400 mt-1">
                      {language === 'PT' ? 'Guia de Transporte Cancelada / Inexistente' : 'Cancelled Consignment Note'}
                    </h2>
                    <p className="text-xs text-rose-300/80 mt-0.5 font-medium">
                      {language === 'PT'
                        ? 'Este documento foi cancelado pelo expedidor ou autoridade competente. Não autoriza trânsito.'
                        : 'This document was revoked or cancelled. Not valid for cargo transit.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {verificationStatus === 'not_found' && (
              <div className="p-8 bg-amber-500/10 border-2 border-amber-500/30 rounded-3xl text-center space-y-4 shadow-xl">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto">
                  <FileX2 className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-lg font-black uppercase tracking-wider text-amber-400">
                    {language === 'PT' ? 'Documento Não Encontrado' : 'Document Not Found'}
                  </h2>
                  <p className="text-xs text-amber-300/80 max-w-md mx-auto mt-1 font-medium leading-relaxed">
                    {language === 'PT'
                      ? `Não existe nenhuma Guia de Transporte cadastrada no sistema SupplyX para o código "${currentDocId}". Por favor verifique o código ou consulte a autoridade emissora.`
                      : `No registered carriage document matches "${currentDocId}". Please verify the code.`}
                  </p>
                </div>
                <div className="pt-2">
                  <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-full font-mono text-[10px] font-bold">
                    Código Pesquisado: {currentDocId || 'NENHUM'}
                  </span>
                </div>
              </div>
            )}

            {/* DOCUMENT DETAILS CARD (Renders when document exists) */}
            {documentData && (
              <div className={`p-6 sm:p-8 rounded-3xl border space-y-6 ${isDarkMode ? 'bg-zinc-900/90 border-white/10' : 'bg-white border-slate-200 shadow-lg'}`}>
                
                {/* Header Banner */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-white/10">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <SupplyXLogo size="md" isDark={isDarkMode} />
                      <div>
                        <h3 className="text-base sm:text-lg font-black uppercase tracking-wider">
                          SUPPLYX LOGISTICS NETWORK
                        </h3>
                        <p className="text-[10px] sm:text-xs font-black text-supplyx-blue uppercase tracking-widest">
                          GUIA DE TRANSPORTE DIGITAL (CRT) • MOÇAMBIQUE
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-zinc-950/80 border border-white/10 rounded-2xl space-y-1 text-left sm:text-right">
                    <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest block">Código do Documento:</span>
                    <p className="text-xs font-mono font-black text-supplyx-blue bg-supplyx-blue/10 px-2 py-0.5 rounded border border-supplyx-blue/30 inline-block">
                      {formattedOfficialCode}
                    </p>
                  </div>
                </div>

                {/* Section 1: Especificações da Carga */}
                <div className="p-5 bg-zinc-950/60 border border-white/5 rounded-2xl space-y-4">
                  <div className="border-l-4 border-supplyx-blue pl-3 py-0.5">
                    <h4 className="text-xs font-black text-supplyx-blue uppercase tracking-wider flex items-center gap-2">
                      <Package className="w-4 h-4 text-supplyx-blue" />
                      1. Identificação e Especificação da Carga
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-2.5">
                      <div>
                        <span className="text-[9px] font-black text-zinc-400 uppercase block">ID da Carga:</span>
                        <p className="font-mono font-bold">{documentData.id}</p>
                      </div>

                      <div>
                        <span className="text-[9px] font-black text-zinc-400 uppercase block">Origem (Carregamento):</span>
                        <p className="font-bold">{documentData.origem || 'Moçambique'}</p>
                      </div>

                      <div>
                        <span className="text-[9px] font-black text-zinc-400 uppercase block">Tipo de Carga:</span>
                        <p className="font-bold break-words leading-relaxed">{documentData.tipoCarga || 'Carga Geral Consolidada'}</p>
                      </div>

                      <div>
                        <span className="text-[9px] font-black text-zinc-400 uppercase block">Transportador Credenciado:</span>
                        <p className="font-bold text-supplyx-blue">{documentData.assignedCarrier || 'Operador Credenciado SupplyX'}</p>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <div>
                        <span className="text-[9px] font-black text-zinc-400 uppercase block">Data de Emissão:</span>
                        <p className="font-bold">{documentData.createdAt || new Date().toLocaleDateString('pt-PT')}</p>
                      </div>

                      <div>
                        <span className="text-[9px] font-black text-zinc-400 uppercase block">Destino (Descarregamento):</span>
                        <p className="font-bold">{documentData.destino || 'Moçambique'}</p>
                      </div>

                      <div>
                        <span className="text-[9px] font-black text-zinc-400 uppercase block">Modalidade / Veículo:</span>
                        <p className="font-bold">{documentData.deliveryMode || 'Transporte Rodoviário de Cargas'}</p>
                      </div>

                      <div>
                        <span className="text-[9px] font-black text-zinc-400 uppercase block">Estado do Trânsito:</span>
                        <p className="font-bold uppercase text-emerald-400">{documentData.status || 'Em trânsito'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Pesos e Volumes */}
                <div className="p-5 bg-zinc-950/60 border border-white/5 rounded-2xl space-y-3">
                  <div className="border-l-4 border-supplyx-blue pl-3 py-0.5">
                    <h4 className="text-xs font-black text-supplyx-blue uppercase tracking-wider flex items-center gap-2">
                      <Truck className="w-4 h-4 text-supplyx-blue" />
                      2. Especificação de Pesos e Volumes
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    <div className="p-3 bg-zinc-900/80 border border-white/5 rounded-xl">
                      <span className="text-[8.5px] font-black text-zinc-400 uppercase block">Peso Total</span>
                      <p className="text-xs font-bold">{documentData.peso || '12.5 Toneladas'}</p>
                    </div>

                    <div className="p-3 bg-zinc-900/80 border border-white/5 rounded-xl">
                      <span className="text-[8.5px] font-black text-zinc-400 uppercase block">Volume Total</span>
                      <p className="text-xs font-bold">{documentData.volume || '18.0 m³'}</p>
                    </div>

                    <div className="p-3 bg-zinc-900/80 border border-white/5 rounded-xl">
                      <span className="text-[8.5px] font-black text-zinc-400 uppercase block">N.º de Paletes</span>
                      <p className="text-xs font-bold">{documentData.pallets || '12 Paletes EPAL'}</p>
                    </div>

                    <div className="p-3 bg-zinc-900/80 border border-white/5 rounded-xl">
                      <span className="text-[8.5px] font-black text-zinc-400 uppercase block">N.º de Volumes</span>
                      <p className="text-xs font-bold">{documentData.quantidade || '1 Lote'}</p>
                    </div>
                  </div>
                </div>

                {/* Section 3: Assinatura Eletrónica e Comprovativo */}
                <div className="p-5 bg-zinc-950/60 border border-white/5 rounded-2xl space-y-4">
                  <div className="border-l-4 border-emerald-500 pl-3 py-0.5">
                    <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      3. Autenticação e Assinatura Eletrónica (PoD)
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-zinc-900/80 border border-white/5 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-zinc-400 uppercase block">Expedidor:</span>
                        <span className="px-2 py-0.5 rounded-full text-[8.5px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" /> Assinado
                        </span>
                      </div>
                      <p className="text-xs font-bold text-white pt-1">
                        {documentData.assignedCarrier || 'Operador Credenciado SupplyX'}
                      </p>
                      <p className="font-mono text-[8.5px] text-zinc-500 pt-1">
                        Hash: #SUPPLYX-EXP-{documentData.id}
                      </p>
                    </div>

                    <div className="p-4 bg-zinc-900/80 border border-white/5 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-zinc-400 uppercase block">Recebedor (PoD):</span>
                        {documentData.podSignature ? (
                          <span className="px-2 py-0.5 rounded-full text-[8.5px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" /> Entregue & Assinado
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[8.5px] font-bold uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                            ● Pendente no ato da entrega
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-white pt-1">
                        {documentData.receiverName || 'Fiel Depositário / Recebedor'}
                      </p>

                      {documentData.podSignature ? (
                        <div className="pt-1">
                          <img src={documentData.podSignature} alt="Assinatura PoD" className="h-10 bg-white/10 rounded border border-white/10 p-1" />
                        </div>
                      ) : (
                        <p className="font-mono text-[8.5px] text-zinc-500 pt-1">
                          Hash: #SUPPLYX-POD-PENDING
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 4: Histórico da Operação */}
                <div className="p-5 bg-zinc-950/60 border border-white/5 rounded-2xl space-y-3">
                  <div className="border-l-4 border-sky-500 pl-3 py-0.5">
                    <h4 className="text-xs font-black text-sky-400 uppercase tracking-wider flex items-center gap-2">
                      <History className="w-4 h-4 text-sky-400" />
                      4. Histórico Completo da Operação
                    </h4>
                  </div>

                  <div className="space-y-2 text-xs pt-1">
                    <div className="p-3 bg-zinc-900/60 border border-white/5 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                        <span className="font-bold text-zinc-200">1. Emissão do CRT Digital no SupplyX</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">{documentData.createdAt || 'Registrado'}</span>
                    </div>

                    <div className="p-3 bg-zinc-900/60 border border-white/5 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                        <span className="font-bold text-zinc-200">2. Validação Criptográfica & Alocação de Frota</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">Concluído</span>
                    </div>

                    <div className="p-3 bg-zinc-900/60 border border-white/5 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-sky-400"></div>
                        <span className="font-bold text-zinc-200">3. Rastreamento Telemetria GPS & Trânsito</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">Em andamento</span>
                    </div>

                    <div className="p-3 bg-zinc-900/60 border border-white/5 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-2 h-2 rounded-full ${documentData.status === 'Entregue' ? 'bg-emerald-400' : 'bg-amber-400'}`}></div>
                        <span className="font-bold text-zinc-200">4. Confirmação de Recepção (PoD)</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">{documentData.status === 'Entregue' ? 'Concluído' : 'Aguardando Chegada'}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Legal & Hash */}
                <div className="pt-4 border-t border-white/10 text-center space-y-1 text-[9px] text-zinc-400 font-mono">
                  <p>Hash On-Chain: #CRT-HASH-{documentData.id}-VERIFIED-ELECTRONICALLY</p>
                  <p className="text-zinc-500">SupplyX Digital Logistics Platform • Validade Legal INATRO & Autoridade Tributária Moçambique</p>
                </div>

              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}
