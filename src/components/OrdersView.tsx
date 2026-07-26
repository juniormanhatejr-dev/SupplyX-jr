import { useState, useRef, useEffect, ChangeEvent, memo, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';
import SupplyXLogo from './SupplyXLogo';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { sanitizeDocumentColors } from '../lib/colorSanitizer';
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Brain, 
  Cpu, 
  Zap, 
  ShieldCheck,
  Building2,
  Trash2,
  Download,
  Printer,
  Eye,
  Camera,
  Loader2,
  Smartphone,
  MessageSquare,
  X,
  User,
  Truck,
  Folder,
  FolderOpen,
  TrendingUp,
  TrendingDown,
  Coins
} from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, setDoc, updateDoc, doc, deleteDoc, serverTimestamp, getDocs, getDoc, orderBy } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType, cleanFirestoreData } from '../lib/firebase';
import ProfileModal from './ProfileModal';
import QuotationDocument from './QuotationDocument';
import MarketHealthView from './MarketHealthView';
import { notificationService } from '../services/notificationService';

const availableSuppliers: any[] = [];

const getOrders = (t: any) => [];

interface OrdersViewProps {
  startWithForm?: boolean;
  onFormClose?: () => void;
  onNavigate?: (tab: string, payload?: any) => void;
  isDarkMode?: boolean;
  language?: 'PT' | 'EN';
  userType?: 'buyer' | 'supplier' | 'logistics';
}

interface SupplierResponse {
  supplierId: string;
  name: string;
  price: number;
  timeToDeliver: string;
  confidence: number;
  itemPrices: { material: string; price: number }[];
  phone?: string;
  email?: string;
  address?: string;
  distanceKm?: number;
  rankingScore?: number;
}

interface MaterialComboBoxProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  isDarkMode?: boolean;
  language?: 'PT' | 'EN';
}

function MaterialComboBox({ value, onChange, options, isDarkMode, language }: MaterialComboBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(value.toLowerCase())
  ).slice(0, 10);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
        <input 
          type="text" 
          value={value} 
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setHighlightedIndex(prev => Math.min(prev + 1, filteredOptions.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setHighlightedIndex(prev => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter' && highlightedIndex >= 0) {
              e.preventDefault();
              onChange(filteredOptions[highlightedIndex]);
              setIsOpen(false);
            } else if (e.key === 'Escape') {
              setIsOpen(false);
            }
          }}
          className={`w-full bg-transparent border-none text-[13px] font-bold placeholder:text-zinc-500 outline-none ${isDarkMode ? 'text-zinc-100' : 'text-zinc-800'}`}
          placeholder={language === 'PT' ? 'Digite o material...' : 'Type material...'}
        />
      
      <AnimatePresence>
        {isOpen && filteredOptions.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`absolute z-[150] w-full mt-2 rounded-xl border shadow-2xl overflow-hidden ${
              isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100'
            }`}
          >
            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.map((opt, i) => (
                <button
                  key={opt}
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                  }}
                  onMouseEnter={() => setHighlightedIndex(i)}
                  className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors ${
                    i === highlightedIndex
                      ? (isDarkMode ? 'bg-brand/20 text-brand' : 'bg-brand/10 text-brand')
                      : (isDarkMode ? 'text-zinc-400 hover:bg-zinc-800' : 'text-zinc-500 hover:bg-zinc-50')
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface TableRowProps {
  row: any;
  index: number;
  isDarkMode: boolean;
  language: string;
  t: any;
  allProducts: any[];
  onUpdate: (id: number, field: string, value: any) => void;
  onRemove: (id: number) => void;
}

const OrderRow = memo(({ row, index, isDarkMode, language, t, allProducts, onUpdate, onRemove }: TableRowProps) => {
  const subtotal = useMemo(() => {
    const qty = parseFloat(row.quantity) || 0;
    const price = parseFloat(row.price) || 0;
    const dCmr = parseFloat(row.discCmr) || 0;
    const dFnc = parseFloat(row.discFnc) || 0;
    const vat = parseFloat(row.vat) || 16;
    
    const base = qty * price;
    const discounted = base * (1 - dCmr/100) * (1 - dFnc/100);
    const final = row.vatIncluded ? discounted : discounted * (1 + vat/100);
    return final.toFixed(2);
  }, [row]);

  return (
    <tr className={`${isDarkMode ? 'hover:bg-supplyx-blue/5' : 'hover:bg-zinc-50/50'} group transition-colors duration-200 border-b ${isDarkMode ? 'border-white/5' : 'border-zinc-50'}`}>
      <td className="px-4 py-4 font-mono text-[10px] font-bold text-zinc-500 text-center">{index + 1}</td>
      <td className="px-4 py-4">
        <MaterialComboBox 
          value={row.material} 
          onChange={(val) => onUpdate(row.id, 'material', val)}
          options={Array.from(new Set(allProducts.map(p => p.name)))}
          isDarkMode={isDarkMode}
          language={language as 'PT' | 'EN'}
        />
      </td>
      <td className="px-4 py-4">
         <input 
           type="text" 
           value={row.quantity} 
           onChange={(e) => onUpdate(row.id, 'quantity', e.target.value)}
           className={`w-full bg-transparent border-none text-center text-[13px] font-black italic outline-none transition-all ${isDarkMode ? 'text-supplyx-blue' : 'text-zinc-900'}`}
         />
      </td>
      <td className="px-4 py-4">
         <select 
           value={row.unit}
           onChange={(e) => onUpdate(row.id, 'unit', e.target.value)}
           className={`w-full bg-transparent border-none text-center text-[10px] font-black uppercase italic outline-none rounded-lg focus:ring-1 focus:ring-supplyx-blue/30 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}
         >
           <option value="Unid.">UN</option>
           <option value="Kg">KG</option>
           <option value="Barra">BR</option>
           <option value="M2">M2</option>
           <option value="M3">M3</option>
           <option value="Saco">SAC</option>
         </select>
      </td>

      <td className="px-4 py-4 text-center text-[11px] font-bold text-zinc-500">
         {row.vat}%
      </td>
      <td className="px-4 py-4 text-center">
         <input 
           type="checkbox" 
           checked={row.vatIncluded} 
           onChange={(e) => onUpdate(row.id, 'vatIncluded', e.target.checked)}
           className="w-4 h-4 rounded border-zinc-300 accent-supplyx-blue"
         />
      </td>
      <td className="px-4 py-4 text-right text-[13px] font-black text-brand italic">
         MT {subtotal}
      </td>
      <td className="px-4 pr-6 py-4 text-center">
        <button onClick={() => onRemove(row.id)} className="text-zinc-600 hover:text-red-500 opacity-30 group-hover:opacity-100 transition-all p-1">
          <X className="w-3 h-3" />
        </button>
      </td>
    </tr>
  );
});

OrderRow.displayName = 'OrderRow';

const calculateMozambiqueDistance = (origin: string, destination: string): number => {
  if (!origin || !destination) return 0;
  const o = origin.toLowerCase().trim();
  const d = destination.toLowerCase().trim();
  
  const MOZ_CITIES: Record<string, { lat: number; lng: number }> = {
    'maputo': { lat: -25.9692, lng: 32.5732 },
    'matola': { lat: -25.9622, lng: 32.4589 },
    'xai-xai': { lat: -25.0454, lng: 33.6442 },
    'gaza': { lat: -25.0454, lng: 33.6442 },
    'inhambane': { lat: -23.8650, lng: 35.3833 },
    'maxixe': { lat: -23.8597, lng: 35.3472 },
    'beira': { lat: -19.8436, lng: 34.8794 },
    'sofala': { lat: -19.8436, lng: 34.8794 },
    'chimoio': { lat: -19.1164, lng: 33.4833 },
    'manica': { lat: -19.1164, lng: 33.4833 },
    'tete': { lat: -16.1564, lng: 33.5867 },
    'quelimane': { lat: -17.8786, lng: 36.8883 },
    'zambezia': { lat: -17.8786, lng: 36.8883 },
    'nampula': { lat: -15.1167, lng: 39.2667 },
    'nacala': { lat: -14.5428, lng: 40.6853 },
    'pemba': { lat: -12.9775, lng: 40.5178 },
    'cabo delgado': { lat: -12.9775, lng: 40.5178 },
    'lichinga': { lat: -13.3128, lng: 35.2406 },
    'niassa': { lat: -13.3128, lng: 35.2406 },
    'angoche': { lat: -16.2306, lng: 39.9072 },
    'mocuba': { lat: -16.8375, lng: 36.9856 },
    'gurue': { lat: -15.4674, lng: 36.9791 },
    'cuamba': { lat: -14.8031, lng: 36.5372 },
    'montepuez': { lat: -13.1256, lng: 38.9997 }
  };

  const getCoordinates = (val: string) => {
    for (const city of Object.keys(MOZ_CITIES)) {
      if (val.includes(city)) {
        return MOZ_CITIES[city];
      }
    }
    return null;
  };

  const coord1 = getCoordinates(o);
  const coord2 = getCoordinates(d);

  if (!coord1 || !coord2) {
    // Elegant fallback pseudo-distance calculation based on string hashing if city coordinates are unknown
    let hash = 0;
    for (let i = 0; i < o.length; i++) hash += o.charCodeAt(i);
    for (let i = 0; i < d.length; i++) hash += d.charCodeAt(i);
    return (hash % 850) + 40;
  }

  // Haversine formula calculation:
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const dLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;
  
  const lat1Rad = (coord1.lat * Math.PI) / 180;
  const lat2Rad = (coord2.lat * Math.PI) / 180;

  const aFactor = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const cFactor = 2 * Math.atan2(Math.sqrt(aFactor), Math.sqrt(1 - aFactor));
  const straightLineDistance = R * cFactor;

  // Curving/Winding factor coefficient of 1.30 used representatively for land freight route tracking (e.g. N1 roads)
  const estimatedRoadDistance = straightLineDistance * 1.30;
  
  return Math.round(estimatedRoadDistance);
};

export default function OrdersView({ startWithForm = false, onFormClose, onNavigate, isDarkMode, language, userType = 'buyer' }: OrdersViewProps) {
  const [showForm, setShowForm] = useState(userType === 'supplier' ? false : startWithForm);
  const [respondingTo, setRespondingTo] = useState<any>(null);
  const [activePdfQuote, setActivePdfQuote] = useState<any>(null);
  const [responseValue, setResponseValue] = useState('');
  const [responseDiscount, setResponseDiscount] = useState('0');
  const [isResponding, setIsResponding] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [aiResponses, setAiResponses] = useState<SupplierResponse[]>([]);
  const [dbSuppliers, setDbSuppliers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null);
  const [downloadingOrderId, setDownloadingOrderId] = useState<string | null>(null);
  const [rawAllProducts, setAllProducts] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [realQuotations, setRealQuotations] = useState<any[]>([]);
  const [selectedRealQuoteForPreview, setSelectedRealQuoteForPreview] = useState<any>(null);
  const [viewedMockIds, setViewedMockIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('supplyx_viewed_mock_orders');
    return saved ? JSON.parse(saved) : [];
  });
  const [deletedMockIds, setDeletedMockIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('supplyx_deleted_mock_orders');
    return saved ? JSON.parse(saved) : [];
  });
  const [deletedRealIds, setDeletedRealIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('supplyx_deleted_real_orders');
    return saved ? JSON.parse(saved) : [];
  });
  const [recentFolderOpen, setRecentFolderOpen] = useState(true);
  const [oldFolderOpen, setOldFolderOpen] = useState(false);

  const [marketHealthData, setMarketHealthData] = useState<any>(null);
  const [isMarketModalOpen, setIsMarketModalOpen] = useState(false);
  const [loadingMarketHealth, setLoadingMarketHealth] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchMarket = async () => {
      try {
        setLoadingMarketHealth(true);
        const res = await fetch('/api/market-health');
        if (res.ok) {
          const json = await res.json();
          if (active) setMarketHealthData(json);
        }
      } catch (err) {
        console.error('Error fetching market health in OrdersView:', err);
      } finally {
        if (active) setLoadingMarketHealth(false);
      }
    };
    fetchMarket();
    return () => {
      active = false;
    };
  }, []);

  const deleteQuotation = async (quoteId: string, isMock: boolean, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    
    const confirmMessage = language === 'PT' 
      ? 'Tem a certeza de que deseja eliminar esta cotação? Esta ação não pode ser desfeita.' 
      : 'Are you sure you want to delete this quotation? This action cannot be undone.';
      
    if (!window.confirm(confirmMessage)) return;

    if (isMock) {
      const newDeletedList = [...deletedMockIds, quoteId];
      setDeletedMockIds(newDeletedList);
      localStorage.setItem('supplyx_deleted_mock_orders', JSON.stringify(newDeletedList));
    } else {
      const newDeletedRealList = Array.from(new Set([...deletedRealIds, quoteId]));
      setDeletedRealIds(newDeletedRealList);
      localStorage.setItem('supplyx_deleted_real_orders', JSON.stringify(newDeletedRealList));
      try {
        await deleteDoc(doc(db, 'quotations', quoteId));
      } catch (err) {
        console.error('Error deleting quotation:', err);
        handleFirestoreError(err, OperationType.DELETE, `quotations/${quoteId}`);
      }
    }
  };

  const clearOldFolder = async () => {
    const confirmMessage = language === 'PT'
      ? 'Tem a certeza de que deseja esvaziar a pasta de pedidos antigos? Esta ação removerá todos os itens históricos.'
      : 'Are you sure you want to clear the old requests folder? This action will remove all historical items.';
    if (!window.confirm(confirmMessage)) return;

    const oldMockIds = partitionedQuotations.oldMock.map((m: any) => m.id);
    if (oldMockIds.length > 0) {
      const newDeletedMock = Array.from(new Set([...deletedMockIds, ...oldMockIds]));
      setDeletedMockIds(newDeletedMock);
      localStorage.setItem('supplyx_deleted_mock_orders', JSON.stringify(newDeletedMock));
    }

    const oldRealItems = partitionedQuotations.oldReal;
    if (oldRealItems.length > 0) {
      const oldRealIds = oldRealItems.map((r: any) => r.id);
      const newDeletedReal = Array.from(new Set([...deletedRealIds, ...oldRealIds]));
      setDeletedRealIds(newDeletedReal);
      localStorage.setItem('supplyx_deleted_real_orders', JSON.stringify(newDeletedReal));

      for (const item of oldRealItems) {
        try {
          await deleteDoc(doc(db, 'quotations', item.id));
        } catch (err) {
          console.error(`Error deleting old quotation ${item.id}:`, err);
        }
      }
    }
  };

  const markQuotationAsViewed = async (quoteId: string, currentViewedBy: any = []) => {
    const matchedUserId = auth.currentUser?.uid;
    if (!matchedUserId) return;
    const viewedList = Array.isArray(currentViewedBy) ? currentViewedBy : [];
    if (viewedList.includes(matchedUserId)) return;
    try {
      const quoteRef = doc(db, 'quotations', quoteId);
      await updateDoc(quoteRef, {
        viewedBy: [...viewedList, matchedUserId]
      });
      console.log(`Quotation ${quoteId} marked as viewed by user ${matchedUserId}`);
    } catch (err) {
      console.error('Error marking quotation as viewed:', err);
    }
  };

  const markMockOrderAsViewed = (orderId: string) => {
    if (viewedMockIds.includes(orderId)) return;
    const newList = [...viewedMockIds, orderId];
    setViewedMockIds(newList);
    localStorage.setItem('supplyx_viewed_mock_orders', JSON.stringify(newList));
  };

  const getPreviewData = (targetQuote: any) => {
    const isSupplierUser = userType === 'supplier';
    const quoteSupplierId = targetQuote.supplierId;
    const dbSupplier = mergedSuppliers.find(s => s.id === quoteSupplierId);

    const sInfo = {
      name: targetQuote.supplierName || (isSupplierUser ? (profile?.name || 'FORNECEDOR') : (dbSupplier?.name || 'FORNECEDOR')),
      isVerified: true,
      address: targetQuote.supplierAddress || (isSupplierUser ? (profile?.address || 'Maputo, Moçambique') : (dbSupplier?.address || 'Maputo, Moçambique')),
      email: targetQuote.supplierEmail || (isSupplierUser ? (profile?.email || user?.email || '') : (dbSupplier?.email || 'sales@supplier.com')),
      phone: targetQuote.supplierPhone || (isSupplierUser ? (profile?.phone || '') : (dbSupplier?.phone || '')),
      nuit: targetQuote.supplierNuit || (isSupplierUser ? (profile?.nuit || '400377081') : (dbSupplier?.nuit || '400377081')),
      logoURL: targetQuote.supplierLogoURL || (isSupplierUser ? (profile?.photoURL || '') : (dbSupplier?.photoURL || '')),
      bankAccounts: targetQuote.supplierBankAccounts || (isSupplierUser ? (profile?.bankAccounts || []) : (dbSupplier?.bankAccounts || [])),
      mobileWallets: targetQuote.supplierMobileWallets || (isSupplierUser ? (profile?.mobileWallets || []) : (dbSupplier?.mobileWallets || [])),
      signatureURL: targetQuote.supplierSignatureURL || (isSupplierUser ? (profile?.signatureURL || '') : (dbSupplier?.signatureURL || '')),
      stampURL: targetQuote.supplierStampURL || (isSupplierUser ? (profile?.stampURL || '') : (dbSupplier?.stampURL || ''))
    };

    const cInfo = {
      name: targetQuote.buyerName || (isSupplierUser ? 'Cliente SupplyX' : (profile?.name || 'Cliente SupplyX')),
      nuit: targetQuote.buyerNuit || (isSupplierUser ? '400377081' : (profile?.nuit || '400377081')),
      address: targetQuote.buyerAddress || (isSupplierUser ? 'NACALA - PORTO' : (profile?.address || 'NACALA - PORTO')),
      email: targetQuote.buyerEmail || (isSupplierUser ? 'cliente@supplyx.com' : (profile?.email || user?.email || 'cliente@supplyx.com')),
      phone: targetQuote.buyerPhone || (isSupplierUser ? '+258 84 ...' : (profile?.phone || '+258 84 ...'))
    };

    return {
      quoteNumber: targetQuote.requestId || targetQuote.id || 'PR-QT-2035/2026',
      date: targetQuote.createdAt?.toDate ? targetQuote.createdAt.toDate().toLocaleDateString('pt-PT') : new Date().toLocaleDateString('pt-PT'),
      validityDays: 15,
      supplier: sInfo,
      client: cInfo,
      items: (targetQuote.items || []).map((row: any) => {
        let finalUnitPrice = row.unitPrice;
        if (row.unitPrice === 0) {
          finalUnitPrice = 0;
        } else if (row.unitPrice === undefined || row.unitPrice === null) {
          const count = targetQuote.items.length || 1;
          const vat = row.vatUnitRate !== undefined ? row.vatUnitRate : 16;
          const currentTotal = targetQuote.responseValue || targetQuote.totalAmount || 0;
          finalUnitPrice = (currentTotal / (1 + vat / 100)) / count;
        }

        const vatPerItem = row.vatUnitRate !== undefined 
          ? row.vatUnitRate 
          : (row.vatRate !== undefined ? row.vatRate : 16);

        return {
          description: row.material || row.description || '',
          quantity: parseFloat(row.quantity || '1') || 1,
          unit: row.unit || 'un',
          unitPrice: finalUnitPrice,
          discount: parseFloat(row.discount || targetQuote.discountPercent || '0') || 0,
          vatPer: vatPerItem
        };
      })
    };
  };

  const renderQuotationCardStale = (order: any, isMock: boolean) => {
    const t: any = translations.PT;
    const user: any = { uid: 'stale' };
    const quoteTitle = isMock ? order.id : (order.requestId || order.id);
    const quoteAmount = isMock ? order.total : `MT ${(order.totalAmount || 0).toLocaleString('pt-BR')}`;
    const quoteDate = isMock ? order.date : (order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : new Date().toLocaleDateString());
    const displayStatus = isMock 
      ? order.status 
      : (order.status === 'pending' ? t.status.quote : (order.status === 'responded' ? t.status.waiting : order.status));
      
    const statusColorClass = isMock 
      ? (order.status === t.status.delivered ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
         order.status === t.status.transit ? 'bg-supplyx-blue/10 text-supplyx-blue border-supplyx-blue/20' :
         order.status === t.status.waiting ? 'bg-amber-500/10 text-amber-500 border-amber-500/10' :
         'bg-indigo-500/10 text-indigo-500 border-indigo-500/10')
      : (order.status === t.status.delivered ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
         order.status === t.status.transit ? 'bg-supplyx-blue/10 text-supplyx-blue border-supplyx-blue/20' :
         (order.status === t.status.waiting || order.status === 'responded') ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
         'bg-indigo-500/10 text-indigo-500 border-indigo-500/10');

    const handleProfileClick = (e: any) => {
      e.stopPropagation();
      const profileId = isMock 
        ? (userType === 'supplier' ? 'buyer_demo_uid' : order.supplierId)
        : (userType === 'supplier' ? order.buyerId : order.supplierId);
      if (profileId) {
        setViewingProfileId(profileId);
        setIsProfileModalOpen(true);
      }
    };

    const displayPartner = isMock
      ? (userType === 'supplier' ? `${t.client}: Manhate Jr` : `${t.supplier}: ${order.supplier}`)
      : (userType === 'supplier' ? `${t.client}: ${order.buyerName || 'Client'}` : `${t.supplier}: ${order.supplierName}`);

    const handleCardClick = () => {
      if (isMock) {
        markMockOrderAsViewed(order.id);
        const mockRealObj = {
          id: order.id,
          requestId: order.id,
          supplierId: order.supplierId || 'S1',
          supplierName: order.supplier,
          buyerName: 'Manhate Jr',
          buyerEmail: 'manhate@supplyx.co.mz',
          totalAmount: parseFloat(order.total.replace('MT ', '').replace('.', '').replace(',', '.')) || 12450,
          createdAt: { toDate: () => new Date() },
          items: order.items || [
            { description: 'Materiais de Construção', quantity: '1', unitPrice: 12450 }
          ]
        };
        setSelectedRealQuoteForPreview(mockRealObj);
      } else {
        markQuotationAsViewed(order.id, order.viewedBy);
        setSelectedRealQuoteForPreview(order);
      }
    };

    return (
      <motion.div 
        key={order.id} 
        whileHover={{ y: -4 }}
        onClick={handleCardClick}
        className={`p-5 sm:p-6 rounded-[28px] sm:rounded-[32px] border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 transition-all cursor-pointer group relative overflow-hidden ${
          isDarkMode 
            ? 'bg-supplyx-dark border-white/5 hover:border-supplyx-blue/50 shadow-2xl shadow-black/20' 
            : 'bg-white border-zinc-100 hover:border-supplyx-blue/30 shadow-sm hover:shadow-xl hover:shadow-zinc-200/50'
        }`}
      >
        <div className="flex items-center gap-4 sm:gap-5 w-full sm:w-auto relative z-10">
          <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-[18px] sm:rounded-[20px] flex items-center justify-center border transition-all shrink-0 ${
            isDarkMode 
              ? 'bg-zinc-800/50 border-white/5 group-hover:bg-supplyx-blue/10 group-hover:border-supplyx-blue/20' 
              : 'bg-zinc-50 border-zinc-100 group-hover:bg-supplyx-blue/5 group-hover:border-supplyx-blue/10'
          }`}>
            <FileText className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors ${isDarkMode ? 'text-zinc-500 group-hover:text-supplyx-blue' : 'text-zinc-400 group-hover:text-supplyx-blue'}`} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <h4 className={`text-base sm:text-lg font-black italic tracking-tight transition-colors truncate ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{quoteTitle}</h4>
              {((!isMock && (order.status === t.status.quote || order.status === 'pending')) || (isMock && order.status === t.status.quote)) && (
                 <span className="w-1.5 h-1.5 rounded-full bg-supplyx-blue animate-pulse" />
              )}
            </div>
            <p 
              className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#0f9fa8] cursor-pointer hover:text-supplyx-blue transition-colors flex items-center gap-2 truncate"
              onClick={handleProfileClick}
            >
              <User className="w-3 h-3" />
              {displayPartner}
            </p>
          </div>
          
          {/* Mobile Status Badge */}
          <div className="sm:hidden shrink-0">
            <div className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${statusColorClass}`}>
              {displayStatus}
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-10 w-full sm:w-auto p-4 sm:p-0 rounded-2xl bg-zinc-900/5 sm:bg-transparent relative z-10">
          <div className="text-left sm:text-right">
            <p className={`text-lg sm:text-xl font-black italic tracking-tighter leading-none mb-1 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
              {quoteAmount}
            </p>
            <p className="text-[8px] sm:text-[9px] text-zinc-500 font-bold uppercase tracking-[0.2em]">
              {quoteDate}
            </p>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Desktop Only Status */}
            <div className={`hidden sm:block px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusColorClass}`}>
              {displayStatus}
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              {(!isMock || (isMock && order.status === t.status.quote)) && (
                <button 
                  onClick={async (e) => {
                    e.stopPropagation();
                    setDownloadingOrderId(order.id);
                    try {
                      if (isMock) {
                        const mockRes: SupplierResponse = {
                          supplierId: order.supplierId || 'S1',
                          name: order.supplier,
                          price: parseFloat(order.total.replace('MT ', '').replace('.', '').replace(',', '.')) || 12450,
                          timeToDeliver: '2 dias',
                          confidence: 95,
                          itemPrices: (order.items || []).map((it: any) => ({ material: it.description, price: it.unitPrice || 0 }))
                        };
                        setSelectedResponseIndex(0);
                        await downloadPDF(mockRes);
                      } else {
                        setActivePdfQuote(order);
                        await new Promise(resolve => setTimeout(resolve, 500));
                        const mockRes: SupplierResponse = {
                           supplierId: order.supplierId,
                           name: order.supplierName,
                           price: order.totalAmount || 0,
                           timeToDeliver: '2 dias',
                           confidence: order.confidence || 0,
                           itemPrices: []
                        };
                        await downloadPDF(mockRes);
                        setActivePdfQuote(null);
                      }
                    } finally {
                      setDownloadingOrderId(null);
                    }
                  }}
                  disabled={downloadingOrderId === order.id}
                  className={`p-2 sm:p-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-50 ${isDarkMode ? 'bg-white/5 text-zinc-400 hover:text-white' : 'bg-zinc-50 text-zinc-500 hover:text-zinc-900'}`}
                >
                  {downloadingOrderId === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                </button>
              )}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  startChat(order);
                }}
                className={`p-2 sm:p-2.5 rounded-xl transition-all active:scale-95 ${isDarkMode ? 'bg-white/5 text-zinc-400 hover:text-supplyx-blue' : 'bg-zinc-50 text-zinc-500 hover:text-supplyx-blue'}`}
              >
                <MessageSquare className="w-4 h-4" />
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const currentSupplierName = order.supplierName || order.supplier || 'Fornecedor Parceiro';
                  let materialsList = order.materials?.map((m: any) => typeof m === 'object' ? m.name : m).filter(Boolean).join(', ');
                  if (!materialsList && order.items) {
                    materialsList = order.items.map((it: any) => it.material || it.description).filter(Boolean).join(', ');
                  }
                  if (!materialsList) materialsList = 'Materiais de Construção B2B';

                  const calculatedOrigem = order.supplierAddress || currentSupplierName + ', Moçambique';
                  const calculatedDestino = profile?.address || order.buyerName || 'Província de Nampula, Moçambique';

                  setLogisticsFormFields({
                    origem: calculatedOrigem,
                    destino: calculatedDestino,
                    tipoCarga: materialsList,
                    peso: '12',
                    volume: '24',
                    prioridade: 'normal',
                    dataDesejada: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    tipoVeiculo: 'caminhão pesado',
                    observacoes: `Ordem Logística vinculada à Cotação #${order.id || 'QT-01'}. Faturamento sob custódia SupplyX. Urgência: ALTA`,
                    seguroCarga: 'Incluso (Fidelidade)',
                    cargaFragil: false,
                    temperaturaControlada: false
                  });

                  setSpreadsheetOrigem(calculatedOrigem);
                  setSpreadsheetDestino(calculatedDestino);
                  setSpreadsheetRows([
                    { id: '1', name: '', quantity: '1', weight: '' }
                  ]);

                  setRespondingTo(order);
                  setIsDirectLogisticsRequest(true);
                  setShowForm(true);
                  setStep(4);
                  setPaymentSuccess(true);
                  setSelectedScenario(3);
                  setShowLogisticsQuestion(true);
                }}
                className="px-3.5 py-2.5 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Truck className="w-3.5 h-3.5" />
                {language === 'PT' ? 'Atribuir Carga ao Logístico' : 'Assign Cargo to Logistics'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };
  
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  
  const verifiedUsersMap = useMemo(() => {
    const map = new Set<string>();
    dbUsers.forEach(u => {
      if (u.verificationStatus === 'verified') {
        map.add(u.id);
      }
    });
    return map;
  }, [dbUsers]);
  
  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        uid: doc.id,
        ...doc.data()
      }));
      setDbUsers(fetched);
    }, (error) => {
      console.error('Error listening to all users:', error);
    });
    return () => unsubscribe();
  }, []);

  const allProducts = useMemo(() => {
    if (dbUsers.length === 0 && rawAllProducts.length > 0) return rawAllProducts;
    const userIds = new Set(dbUsers.map(u => u.id));
    return rawAllProducts.filter(p => !p.supplierId || userIds.has(p.supplierId));
  }, [rawAllProducts, dbUsers]);

  const displayedQuotations = useMemo(() => {
    let list = realQuotations;
    if (dbUsers.length > 0) {
      const userIds = new Set(dbUsers.map(u => u.id));
      list = realQuotations.filter(qObj => {
        const hasBuyer = qObj.buyerId ? userIds.has(qObj.buyerId) : true;
        const hasSupplier = qObj.supplierId ? userIds.has(qObj.supplierId) : true;
        return hasBuyer && hasSupplier;
      });
    }
    return list.filter(qObj => !deletedRealIds.includes(qObj.id));
  }, [realQuotations, dbUsers, deletedRealIds]);

  // Auto-clean orphaned quotations (whose buyer or supplier is no longer registered in the users collection)
  useEffect(() => {
    if (dbUsers.length > 0 && realQuotations.length > 0) {
      const activeUserIds = new Set(dbUsers.map(u => u.id));
      const currentUid = auth.currentUser?.uid;
      const orphaned = realQuotations.filter(qObj => {
        const buyerMissing = qObj.buyerId && !activeUserIds.has(qObj.buyerId) && qObj.buyerId !== currentUid;
        const supplierMissing = qObj.supplierId && !activeUserIds.has(qObj.supplierId) && qObj.supplierId !== currentUid;
        return buyerMissing || supplierMissing;
      });

      if (orphaned.length > 0) {
        console.log(`Cleaning up ${orphaned.length} orphaned quotations...`);
        orphaned.forEach(async (qObj) => {
          try {
            await deleteDoc(doc(db, 'quotations', qObj.id));
            console.log(`Successfully deleted orphaned quotation: ${qObj.id}`);
          } catch (e) {
            console.error(`Failed to delete orphaned quotation ${qObj.id}:`, e);
          }
        });
      }
    }
  }, [dbUsers, realQuotations]);

  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      const docRef = doc(db, 'users', user.uid);
      getDoc(docRef).then(docSnap => {
        if (docSnap.exists()) {
          setProfile(docSnap.data());
        }
      }).catch(error => {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      });
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Build query based on user type
    let q;
    if (userType === 'supplier') {
      q = query(
        collection(db, 'quotations'),
        where('supplierId', '==', user.uid)
      );
    } else {
      q = query(
        collection(db, 'quotations'),
        where('buyerId', '==', user.uid)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort in memory to avoid composite index requirement
      const sortedDocs = [...docs].sort((a: any, b: any) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      setRealQuotations(sortedDocs);
    }, (error) => {
      console.error('Error listening to quotations:', error);
      // Fallback to empty if permissions fail
      setRealQuotations([]);
    });

    return () => unsubscribe();
  }, [user, userType]);

  useEffect(() => {
    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any),
        fromCache: snapshot.metadata.fromCache
      }));
      
      setAllProducts(prods);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('type', '==', 'supplier'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        uid: doc.id,
        ...doc.data(),
        fromCache: snapshot.metadata.fromCache
      }));
      setDbSuppliers(fetched);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });
    return () => unsubscribe();
  }, []);

  const mergedSuppliers = [
    ...availableSuppliers,
    ...dbSuppliers.filter(dbs => !availableSuppliers.some(as => as.id === dbs.id))
  ].map(s => ({
    ...s,
    id: s.id,
    name: s.name || s.companyName || 'Supplier',
    quality: s.quality || 'N/A',
    segment: s.segment || s.category || 'Geral'
  }));

  const startChat = async (order: any) => {
    if (!auth.currentUser) return;

    try {
      setIsLoading(true);
      
      let otherId = '';
      let otherName = '';
      
      if (userType === 'supplier') {
        otherId = order.buyerId || 'buyer_demo_uid';
        otherName = order.buyerName || 'Cliente';
      } else {
        otherId = order.supplierId || 'supplier_demo_uid';
        otherName = order.supplierName || order.supplier || 'Fornecedor';
      }

      // Check if room exists
      const roomsRef = collection(db, 'chats');
      const q = query(
        roomsRef,
        where('participants', 'array-contains', auth.currentUser.uid)
      );

      const snapshot = await getDocs(q);
      const existingRoom = snapshot.docs.find(doc => {
        const participants = doc.data().participants as string[];
        return participants.includes(otherId);
      });

      if (existingRoom) {
        onNavigate?.('Mensagens', { userId: otherId });
        return;
      }

      // Get real names if possible from users collection
      let senderName = auth.currentUser.displayName || (userType === 'supplier' ? t.supplier : t.buyer);
      let recipientName = otherName;

      try {
        const otherDoc = await getDoc(doc(db, 'users', otherId));
        if (otherDoc.exists()) {
          recipientName = otherDoc.data().name || recipientName;
        }
      } catch (err) {
        console.warn('Error fetching other user name:', err);
      }

      try {
        const currentUserDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (currentUserDoc.exists()) {
          senderName = currentUserDoc.data().name || senderName;
        }
      } catch (err) {
        console.warn('Error fetching current user name:', err);
      }

      // Create new room
      await addDoc(collection(db, 'chats'), {
        participants: [auth.currentUser.uid, otherId],
        lastMessage: `${t.interestInOrder}: ${order.requestId || order.id}`,
        lastMessageSenderId: auth.currentUser.uid,
        unreadCount: {
          [auth.currentUser.uid]: 0,
          [otherId]: 1
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        participantNames: {
          [auth.currentUser.uid]: senderName,
          [otherId]: recipientName
        }
      });

      onNavigate?.('Mensagens', { userId: otherId });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'chats');
    } finally {
      setIsLoading(false);
    }
  };
  const [selectedResponseIndex, setSelectedResponseIndex] = useState<number>(0);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<number | null>(null);
  const [scenarioCommitted, setScenarioCommitted] = useState(false);
  const [newLogisticsId, setNewLogisticsId] = useState<string | null>(null);

  // LOGISTICS DISPATCH FORM STATE
  const [showLogisticsReqForm, setShowLogisticsReqForm] = useState(false);
  const [logisticsFormFields, setLogisticsFormFields] = useState({
    origem: '',
    destino: '',
    tipoCarga: '',
    peso: '12',
    volume: '24',
    prioridade: 'normal',
    dataDesejada: '',
    tipoVeiculo: 'caminhão pesado',
    observacoes: '',
    seguroCarga: 'Incluso (Fidelidade)',
    cargaFragil: false,
    temperaturaControlada: false
  });

  // NEW STATES FOR CUSTOM CUSTOMER LOGISTICS DECISION
  const [showLogisticsQuestion, setShowLogisticsQuestion] = useState(false);
  const [showLogisticsSpreadsheet, setShowLogisticsSpreadsheet] = useState(false);
  const [isDirectLogisticsRequest, setIsDirectLogisticsRequest] = useState(false);
  const [spreadsheetOrigem, setSpreadsheetOrigem] = useState('');
  const [spreadsheetDestino, setSpreadsheetDestino] = useState('');
  const [spreadsheetRows, setSpreadsheetRows] = useState([
    { id: '1', name: '', quantity: '1', weight: '' }
  ]);
  const [logisticsItemsTable, setLogisticsItemsTable] = useState<any[]>([
    { id: '1', name: '', quantity: '1', weight: '0.1' }
  ]);

  const handleInitializeLogisticsItems = () => {
    const targetResponse = aiResponses[selectedResponseIndex] || respondingTo;
    let initial: any[] = [];
    if (targetResponse?.items?.length > 0) {
      initial = targetResponse.items.map((it: any, idx: number) => ({
        id: String(idx + 1),
        name: it.material || it.description || 'Produto',
        quantity: String(it.quantity || '1'),
        weight: String(it.weight || '0.1')
      }));
    } else if (rows.filter(r => r.material).length > 0) {
      initial = rows.filter(r => r.material).map((it: any, idx: number) => ({
        id: String(idx + 1),
        name: it.material,
        quantity: String(it.quantity || '1'),
        weight: String(it.weight || '0.1')
      }));
    } else {
      initial = [
        { id: '1', name: 'Materiais de Construção B2B', quantity: '1', weight: '0.5' }
      ];
    }
    setLogisticsItemsTable(initial);
  };

  const [isEstimatingWeight, setIsEstimatingWeight] = useState(false);
  const [aiWeightResult, setAiWeightResult] = useState<any>(null);

  const handleEstimateWeight = async () => {
    setIsEstimatingWeight(true);
    setAiWeightResult(null);

    let itemsToEstimate: any[] = [];

    if (showLogisticsSpreadsheet) {
      itemsToEstimate = spreadsheetRows
        .filter(r => r.name.trim() !== '')
        .map(r => ({
          name: r.name,
          quantity: r.quantity
        }));
    } else {
      const targetResponse = aiResponses[selectedResponseIndex] || respondingTo;
      if (rows && rows.length > 0 && rows.some(r => r.material)) {
        itemsToEstimate = rows
          .filter(r => r.material && r.material.trim() !== '')
          .map(r => ({
            name: r.material,
            quantity: `${r.quantity || '1'} ${r.unit || 'Unid.'}`
          }));
      } else if (targetResponse?.items && targetResponse.items.length > 0) {
        itemsToEstimate = targetResponse.items.map((it: any) => ({
          name: it.material || it.description,
          quantity: `${it.quantity || '1'} ${it.unit || 'Unid.'}`
        }));
      }
    }

    if (itemsToEstimate.length === 0) {
      itemsToEstimate = [{ name: 'Materiais Mistos', quantity: '10 lotes' }];
    }

    try {
      const res = await fetch('/api/logistics/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsToEstimate })
      });
      if (!res.ok) throw new Error('API request failed');
      const data = await res.json();
      setAiWeightResult(data);

      // Auto fill form weight/volume
      if (data.estimatedWeightTons) {
        if (showLogisticsSpreadsheet) {
          // Fill weights inside spreadsheet rows if they match names
          const updatedRows = spreadsheetRows.map(r => {
            const match = data.items?.find((item: any) => item.name === r.name);
            return match ? { ...r, weight: String(match.estimatedWeightTons) } : r;
          });
          setSpreadsheetRows(updatedRows);
        } else {
          setLogisticsFormFields(prev => ({
            ...prev,
            peso: String(data.estimatedWeightTons),
            volume: String(data.estimatedVolumeM3 || prev.volume)
          }));
        }
      }
    } catch (err) {
      console.error('AI Estimation Error:', err);
    } finally {
      setIsEstimatingWeight(false);
    }
  };

  const handleAddSpreadsheetRow = () => {
    setSpreadsheetRows([
      ...spreadsheetRows,
      { id: Date.now().toString(), name: '', quantity: '1', weight: '' }
    ]);
  };

  const handleRemoveSpreadsheetRow = (id: string) => {
    if (spreadsheetRows.length > 1) {
      setSpreadsheetRows(spreadsheetRows.filter((r) => r.id !== id));
    } else {
      setSpreadsheetRows([{ id: '1', name: '', quantity: '1', weight: '' }]);
    }
  };

  const handleSpreadsheetRowChange = (id: string, field: 'name' | 'quantity' | 'weight', value: string) => {
    setSpreadsheetRows(spreadsheetRows.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleCommitSpreadsheetScenario = () => {
    const targetResponse = aiResponses[selectedResponseIndex] || respondingTo;
    const logisticsId = `TR-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    setNewLogisticsId(logisticsId);

    let existing: any[] = [];
    try {
      const saved = localStorage.getItem('supplyx_freight_requests');
      if (saved) existing = JSON.parse(saved);
    } catch (err) {
      console.error(err);
    }

    const validRows = spreadsheetRows.filter(r => r.name.trim() !== '');
    const materialsList = validRows.map(r => `${r.name} (${r.quantity}x${r.weight ? `, ${r.weight}T` : ''})`).join(', ') || 'Lista de Materiais de Construção';
    const totalQty = validRows.reduce((acc, r) => acc + (parseFloat(r.quantity) || 1), 0);
    const estimatedWeight = validRows.reduce((acc, r) => acc + (parseFloat(r.weight) || 0), 0);

    const clientPhone = profile?.phone || '+258 84 123 4567';

    const orderMessageText = `📦 NOVO PEDIDO DE DESPACHO LOGÍSTICO PUBLICADO (VIA PLANILHA)
• Origem: ${spreadsheetOrigem || 'Moçambique'}
• Destino: ${spreadsheetDestino || 'Moçambique'}
• Carga: ${materialsList}
• Peso Total: ${estimatedWeight > 0 ? `${estimatedWeight} Toneladas` : 'Estimado pelo transportador'}
• Observações do Cliente: Despacho logístico solicitado utilizando planilha de produtos customizados pelo cliente.`;

    const initialReply = {
      id: `rep-initial-${Date.now()}`,
      sender: 'requester',
      senderName: profile?.companyName || auth.currentUser?.displayName || 'Cliente Remetente',
      text: orderMessageText,
      timestamp: new Date().toLocaleDateString('pt-PT', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'}),
      logisticsUserId: 'ops_logistica_default',
      logisticsUserName: 'Sistema SupplyX'
    };

    const newLogisticsOrder = {
      id: logisticsId,
      tipoCarga: materialsList,
      quantidade: `${totalQty} Itens`,
      peso: estimatedWeight > 0 ? `${estimatedWeight} Toneladas` : 'Estimado pelo transportador',
      volume: 'Anexo personalizado',
      origem: spreadsheetOrigem || 'Moçambique',
      destino: spreadsheetDestino || 'Moçambique',
      status: 'Em concurso',
      requester: 'Client',
      freightResponsibility: 'Client',
      deliveryMode: 'Third-party Logistics',
      dataColeta: new Date().toLocaleDateString('pt-PT', {day: 'numeric', month: 'short', year: 'numeric'}),
      prazoEntrega: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-PT', {day: 'numeric', month: 'short', year: 'numeric'}),
      observacoes: 'Despacho logístico solicitado utilizando planilha de produtos customizados pelo cliente.',
      targetPrice: language === 'PT' ? 'A definir por lance logístico' : 'To be bid by carrier',
      contacto: clientPhone,
      proposalsCount: 0,
      rating: 5.0,
      fragile: false,
      temperatureControlled: false,
      insurance: 'Incluso (Fidelidade)',
      vehicleType: 'caminhão pesado',
      priority: 'normal',
      orderId: targetResponse?.requestId || 'QT-01',
      quotationId: targetResponse?.id || 'QT-01',
      buyerId: auth.currentUser?.uid || 'anonymous',
      supplierId: targetResponse?.supplierId || 'supplier_default',
      pickupAddress: spreadsheetOrigem,
      deliveryAddress: spreadsheetDestino,
      distance: `${calculateMozambiqueDistance(spreadsheetOrigem, spreadsheetDestino)} KM`,
      createdAt: new Date().toISOString(),
      logisticsReplies: [initialReply]
    };

    existing = [newLogisticsOrder, ...existing];
    localStorage.setItem('supplyx_freight_requests', JSON.stringify(existing));

    setDoc(doc(db, 'freight_orders', logisticsId), cleanFirestoreData(newLogisticsOrder)).catch(err => {
      console.warn('Firestore write warning:', err);
    });

    let liveNotifications: any[] = [];
    try {
      const savedNotifications = localStorage.getItem('supplyx_logistics_notifications');
      if (savedNotifications) liveNotifications = JSON.parse(savedNotifications);
    } catch (e) {}

    const notificationObj = {
      id: `N-${Math.floor(100 + Math.random() * 900)}`,
      title: `NOVO CONCURSO LOGÍSTICO #${logisticsId}`,
      text: `Carga de ${materialsList} com origem em ${spreadsheetOrigem} e destino a ${spreadsheetDestino}.`,
      time: 'Agora mesmo',
      read: false
    };
    liveNotifications = [notificationObj, ...liveNotifications];
    localStorage.setItem('supplyx_logistics_notifications', JSON.stringify(liveNotifications));

    setScenarioCommitted(true);
    setPaymentSuccess(true);
    setStep(3);
  };

  const handleCommitScenario = () => {
    if (selectedScenario === null) return;
    
    const targetResponse = aiResponses[selectedResponseIndex] || respondingTo;
    const currentSupplierName = targetResponse?.name || targetResponse?.supplierName || 'Fornecedor Parceiro';
    let materialsList = rows.map(r => r.material).filter(Boolean).join(', ');
    if (!materialsList && targetResponse?.items) {
      materialsList = targetResponse.items.map((it: any) => it.material || it.description).join(', ');
    }
    if (!materialsList) materialsList = 'Materiais de Construção B2B';

    const clientName = profile?.name || 'Cliente SupplyX';
    const clientPhone = profile?.phone || '+258 84 123 4567';

    if (selectedScenario === 3) {
      // Create logistics cargo request order automatically with customized form fields!
      const logisticsId = `TR-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      setNewLogisticsId(logisticsId);

      let existing: any[] = [];
      try {
        const saved = localStorage.getItem('supplyx_freight_requests');
        if (saved) existing = JSON.parse(saved);
      } catch (err) {
        console.error(err);
      }

      const validTableItems = logisticsItemsTable.filter(item => item.name && item.name.trim() !== '');
      const compiledItemsList = validTableItems.map(it => `${it.name} (${it.quantity}x${it.weight ? `, ${it.weight}T` : ''})`).join(', ') || materialsList;
      const totalQty = validTableItems.reduce((acc, r) => acc + (parseFloat(r.quantity) || 1), 0);
      const computedWeight = validTableItems.reduce((acc, r) => acc + (parseFloat(r.weight) || 0), 0) || parseFloat(logisticsFormFields.peso) || 1;

      const targetWeight = `${computedWeight} Toneladas`;
      const targetVolume = `${logisticsFormFields.volume} m³`;

      const orderMessageText = `📦 NOVO PEDIDO DE DESPACHO LOGÍSTICO PUBLICADO
• Origem: ${logisticsFormFields.origem}
• Destino: ${logisticsFormFields.destino}
• Carga: ${compiledItemsList}
• Peso Total: ${targetWeight}
• Prazo Desejado: ${logisticsFormFields.dataDesejada ? new Date(logisticsFormFields.dataDesejada).toLocaleDateString('pt-PT', {day: 'numeric', month: 'short', year: 'numeric'}) : 'Conforme cronograma'}
• Observações do Cliente: ${logisticsFormFields.observacoes || 'Nenhuma'}`;

      const initialReply = {
        id: `rep-initial-${Date.now()}`,
        sender: 'requester',
        senderName: profile?.companyName || auth.currentUser?.displayName || 'Cliente Remetente',
        text: orderMessageText,
        timestamp: new Date().toLocaleDateString('pt-PT', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'}),
        logisticsUserId: 'ops_logistica_default',
        logisticsUserName: 'Sistema SupplyX'
      };

      const newLogisticsOrder = {
        id: logisticsId,
        tipoCarga: compiledItemsList,
        quantidade: `${totalQty} Lotes`,
        peso: targetWeight,
        volume: targetVolume,
        origem: logisticsFormFields.origem,
        destino: logisticsFormFields.destino,
        distance: `${calculateMozambiqueDistance(logisticsFormFields.origem, logisticsFormFields.destino)} KM`,
        status: 'Em concurso',
        requester: 'Client',
        freightResponsibility: 'Client',
        deliveryMode: 'Third-party Logistics',
        dataColeta: new Date().toLocaleDateString('pt-PT', {day: 'numeric', month: 'short', year: 'numeric'}),
        prazoEntrega: logisticsFormFields.dataDesejada ? new Date(logisticsFormFields.dataDesejada).toLocaleDateString('pt-PT', {day: 'numeric', month: 'short', year: 'numeric'}) : new Date().toLocaleDateString('pt-PT', {day: 'numeric', month: 'short', year: 'numeric'}),
        observacoes: logisticsFormFields.observacoes,
        targetPrice: language === 'PT' ? 'A definir por lance logístico' : 'To be bid by carrier',
        contacto: clientPhone,
        proposalsCount: 0,
        rating: 5.0,
        fragile: logisticsFormFields.cargaFragil,
        temperatureControlled: logisticsFormFields.temperaturaControlada,
        insurance: logisticsFormFields.seguroCarga,
        vehicleType: logisticsFormFields.tipoVeiculo,
        priority: logisticsFormFields.prioridade,
        orderId: targetResponse?.requestId || 'QT-01',
        quotationId: targetResponse?.id || 'QT-01',
        buyerId: auth.currentUser?.uid || 'anonymous',
        supplierId: targetResponse?.supplierId || 'supplier_default',
        pickupAddress: logisticsFormFields.origem,
        deliveryAddress: logisticsFormFields.destino,
        createdAt: new Date().toISOString(),
        items: validTableItems.map(it => ({
          name: it.name,
          quantity: it.quantity,
          weight: it.weight
        })),
        logisticsReplies: [initialReply]
      };

      existing = [newLogisticsOrder, ...existing];
      localStorage.setItem('supplyx_freight_requests', JSON.stringify(existing));

      // Push to Firestore freight_orders collection using doc reference
      setDoc(doc(db, 'freight_orders', logisticsId), cleanFirestoreData(newLogisticsOrder)).catch(err => {
        console.warn('Firestore write warning:', err);
      });

      // Also register a system notification
      let liveNotifications: any[] = [];
      try {
        const savedNotifications = localStorage.getItem('supplyx_logistics_notifications');
        if (savedNotifications) liveNotifications = JSON.parse(savedNotifications);
      } catch (e) {}

      const notificationObj = {
        id: `N-${Math.floor(100 + Math.random() * 900)}`,
        title: `NOVO CONCURSO LOGÍSTICO #${logisticsId}`,
        text: `Carga de ${logisticsFormFields.tipoCarga || materialsList} com destino a ${logisticsFormFields.destino} no concurso público.`,
        time: 'Agora mesmo',
        read: false
      };
      liveNotifications = [notificationObj, ...liveNotifications];
      localStorage.setItem('supplyx_logistics_notifications', JSON.stringify(liveNotifications));
    } else if (selectedScenario === 2) {
      // Create supplier fleet shipment
      const logisticsId = `TR-SUPP-${Math.floor(1000 + Math.random() * 9000)}`;
      setNewLogisticsId(logisticsId);

      let existing: any[] = [];
      try {
        const saved = localStorage.getItem('supplyx_freight_requests');
        if (saved) existing = JSON.parse(saved);
      } catch (err) {}

      const totalQty = rows.reduce((acc, r) => acc + (parseFloat(r.quantity) || 0), 0) || 5;
      const newLogisticsOrder = {
        id: logisticsId,
        tipoCarga: materialsList,
        quantidade: `${totalQty} Lotes`,
        peso: `${Math.min(30, Math.ceil(totalQty * 0.4))} Toneladas`,
        volume: `${Math.min(60, Math.ceil(totalQty * 0.7))} m³`,
        origem: targetResponse?.supplierAddress || currentSupplierName + ', Moçambique',
        destino: profile?.address || 'Província de Nampula, Moçambique',
        status: 'Aguardando Coleta',
        assignedCarrier: currentSupplierName,
        requester: 'Client',
        freightResponsibility: 'Supplier',
        deliveryMode: 'Supplier Owned Fleet',
        dataColeta: new Date().toLocaleDateString('pt-PT', {day: 'numeric', month: 'short', year: 'numeric'}),
        prazoEntrega: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-PT', {day: 'numeric', month: 'short', year: 'numeric'}),
        observacoes: `Entrega gerenciada pela frota própria do fornecedor. Rastreamento e Escrow ativo.`,
        targetPrice: 'MT 0 MZN ( CIF )',
        contacto: clientPhone,
        proposalsCount: 1,
        rating: 4.8,
        createdAt: new Date().toISOString()
      };

      existing = [newLogisticsOrder, ...existing];
      localStorage.setItem('supplyx_freight_requests', JSON.stringify(existing));

      addDoc(collection(db, 'freight_orders'), newLogisticsOrder).catch(() => {});
    }

    setScenarioCommitted(true);
  };

  const [isPaying, setIsPaying] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const paymentMethods = [
    { id: 'bim', name: 'Millennium BIM', type: 'Bank', color: 'bg-[#002d72]', logo: 'https://www.millenniumbim.co.mz/Resources/Themes/BIM/Images/logo-millenniumbim.png' },
    { id: 'bci', name: 'BCI', type: 'Bank', color: 'bg-[#e30613]', logo: '' },
    { id: 'standard', name: 'Standard Bank', type: 'Bank', color: 'bg-[#0033a1]', logo: '' },
    { id: 'mpesa', name: 'M-Pesa', type: 'Mobile', color: 'bg-[#e60000]', logo: '' },
    { id: 'emola', name: 'e-Mola', type: 'Mobile', color: 'bg-[#ffca05]', logo: '' },
  ];

  const handlePayment = () => {
    if (!selectedPaymentMethod) return;
    setIsPaying(true);
    setTimeout(() => {
      setIsPaying(false);
      setPaymentSuccess(true);
    }, 2000);
  };

  const [rows, setRows] = useState([
    { id: Date.now(), code: 'MAT-101', material: '', quantity: '1', unit: 'Unid.', price: '0', discCmr: '0', discFnc: '0', vat: '16', vatIncluded: true, subtotal: '0', date: new Date().toISOString().split('T')[0] }
  ]);

  // Automatic Weight and Volume Estimation Effect
  useEffect(() => {
    // Only estimate if either modal is visible
    if (!showLogisticsReqForm && !showLogisticsSpreadsheet) {
      return;
    }

    // Determine the items to estimate for this modal state
    let itemsToEstimate: any[] = [];
    if (showLogisticsSpreadsheet) {
      itemsToEstimate = spreadsheetRows
        .filter(r => r.name.trim() !== '')
        .map(r => ({
          name: r.name,
          quantity: r.quantity
        }));
    } else {
      const targetResponse = aiResponses[selectedResponseIndex] || respondingTo;
      if (rows && rows.length > 0 && rows.some(r => r.material)) {
        itemsToEstimate = rows
          .filter(r => r.material && r.material.trim() !== '')
          .map(r => ({
            name: r.material,
            quantity: `${r.quantity || '1'} ${r.unit || 'Unid.'}`
          }));
      } else if (targetResponse?.items && targetResponse.items.length > 0) {
        itemsToEstimate = targetResponse.items.map((it: any) => ({
          name: it.material || it.description,
          quantity: `${it.quantity || '1'} ${it.unit || 'Unid.'}`
        }));
      }
    }

    if (itemsToEstimate.length === 0) {
      return;
    }

    // Set up a debounce timer to avoid flooding requests during typing
    const timer = setTimeout(() => {
      // Create a local function that calls the API without using or infinite-looping on the states
      const runAutoEstimation = async () => {
        setIsEstimatingWeight(true);
        try {
          const res = await fetch('/api/logistics/estimate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: itemsToEstimate })
          });
          if (!res.ok) throw new Error('API request failed');
          const data = await res.json();
          setAiWeightResult(data);

          // Auto fill form weight/volume
          if (data.estimatedWeightTons) {
            if (showLogisticsSpreadsheet) {
              setSpreadsheetRows(prevRows => {
                // Ensure we only update weights that have changed or are empty to prevent recursive triggers
                let hasChanged = false;
                const updated = prevRows.map(r => {
                  const match = data.items?.find((item: any) => item.name === r.name);
                  if (match && String(match.estimatedWeightTons) !== r.weight) {
                    hasChanged = true;
                    return { ...r, weight: String(match.estimatedWeightTons) };
                  }
                  return r;
                });
                return hasChanged ? updated : prevRows;
              });
            } else {
              setLogisticsFormFields(prev => {
                if (prev.peso !== String(data.estimatedWeightTons) || prev.volume !== String(data.estimatedVolumeM3 || prev.volume)) {
                  return {
                    ...prev,
                    peso: String(data.estimatedWeightTons),
                    volume: String(data.estimatedVolumeM3 || prev.volume)
                  };
                }
                return prev;
              });
            }
          }
        } catch (err) {
          console.error('Auto AI Estimation Error:', err);
        } finally {
          setIsEstimatingWeight(false);
        }
      };

      runAutoEstimation();
    }, 1000); // 1 second debounce delay

    return () => clearTimeout(timer);
  }, [
    showLogisticsReqForm,
    showLogisticsSpreadsheet,
    // Serialize spreadsheet row names & quantities to run when items actually change (and avoid weight changes looping back)
    JSON.stringify(spreadsheetRows.map(r => ({ name: r.name, q: r.quantity }))),
    // Serialize quote items to run when the active quote changes
    JSON.stringify(((aiResponses[selectedResponseIndex] || respondingTo)?.items || []).map((it: any) => ({ m: it.material || it.description, q: it.quantity }))),
    // Serialize input table row materials & quantities
    JSON.stringify(rows.map(r => ({ m: r.material, q: r.quantity })))
  ]);

  const filteredSuppliers = useMemo(() => {
    return mergedSuppliers.filter(s => {
      // Check if supplier has at least one product matching any requested material in rows
      if (rows.length === 0 || (rows.length === 1 && !rows[0].material)) return true; // Show all if empty
      
      return rows.some(row => {
        if (!row.material) return false;
        return allProducts.some(p => 
          p.supplierId === s.id && 
          (p.name.toLowerCase().includes(row.material.toLowerCase()) || 
           row.material.toLowerCase().includes(p.name.toLowerCase()))
        );
      });
    });
  }, [mergedSuppliers, rows, allProducts]);

  const updateSubtotal = (row: any) => {
    const qty = parseFloat(row.quantity) || 0;
    const price = parseFloat(row.price) || 0;
    const dCmr = parseFloat(row.discCmr) || 0;
    const dFnc = parseFloat(row.discFnc) || 0;
    const vat = parseFloat(row.vat) || 16;
    
    const base = qty * price;
    const discounted = base * (1 - dCmr/100) * (1 - dFnc/100);
    const final = row.vatIncluded ? discounted : discounted * (1 + vat/100);
    return final.toFixed(2);
  };

  const exportToExcel = () => {
    // Ensure we have data
    if (!rows || rows.length === 0) return;

    const headers = ['Item', t.materialLabel, t.quantityLabel, t.unitLabel, t.needDateLabel];
    const data = rows.map((row, index) => [
      index + 1,
      row.material || '',
      row.quantity || '',
      row.unit || '',
      row.date || ''
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Materiais");

    // Fix column widths
    const wscols = [
      { wch: 6 },  // Item
      { wch: 40 }, // Material
      { wch: 15 }, // Quantidade
      { wch: 15 }, // Unidade
      { wch: 20 }  // Data
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `lista_materiais_supplyx_${new Date().getTime()}.xlsx`);
  };

  const addRow = () => {
    setRows([...rows, { id: Date.now(), code: `MAT-${Math.floor(Math.random() * 899) + 100}`, material: '', quantity: '1', unit: 'Unid.', price: '0', discCmr: '0', discFnc: '0', vat: '16', vatIncluded: true, subtotal: '0', date: new Date().toISOString().split('T')[0] }]);
  };

  const removeRow = useCallback((id: number) => {
    if (rows.length > 1) {
      setRows(prev => prev.filter(r => r.id !== id));
    }
  }, [rows.length]);

  const updateRow = useCallback((id: number, field: string, value: any) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  }, []);

  const handleClose = () => {
    setShowForm(false);
    setStep(1);
    setSelectedSuppliers([]);
    setAiResponses([]);
    if (onFormClose) onFormClose();
  };

  const toggleSupplier = (id: string) => {
    setSelectedSuppliers(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const getAddressCoords = (addr?: string) => {
    if (!addr) return { lat: -25.9692, lng: 32.5732 };
    const str = addr.toLowerCase();
    if (str.includes('nampula') || str.includes('nacala')) return { lat: -15.1167, lng: 39.2667 };
    if (str.includes('maputo') || str.includes('matola')) return { lat: -25.9692, lng: 32.5732 };
    if (str.includes('sofala') || str.includes('beira')) return { lat: -19.8333, lng: 34.8500 };
    if (str.includes('cabo delgado') || str.includes('pemba')) return { lat: -12.9667, lng: 40.5500 };
    if (str.includes('tete')) return { lat: -16.1564, lng: 33.5867 };
    if (str.includes('gaza') || str.includes('xai-xai')) return { lat: -25.0447, lng: 33.6406 };
    if (str.includes('inhambane')) return { lat: -23.8650, lng: 35.3833 };
    if (str.includes('manica') || str.includes('chimoio')) return { lat: -18.9167, lng: 33.4500 };
    if (str.includes('zambézia') || str.includes('zambezia') || str.includes('quelimane')) return { lat: -17.8786, lng: 36.8883 };
    if (str.includes('niassa') || str.includes('lichinga')) return { lat: -13.3125, lng: 35.2422 };
    return { lat: -25.9692, lng: 32.5732 };
  };

  const calcDistKm = (loc1: { lat: number; lng: number }, loc2: { lat: number; lng: number }) => {
    const R = 6371;
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
    const dLng = (loc2.lng - loc1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) * 
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c);
  };

  const startAiAnalysis = async () => {
    setStep(3);
    setIsAiProcessing(true);
    
    try {
      const requestId = `RQ-${Math.floor(Date.now()/100000)}`;
      const buyerCoords = getAddressCoords(profile?.address || 'NACALA - PORTO');
      
      const responses: SupplierResponse[] = await Promise.all(selectedSuppliers.map(async (sid) => {
        const s = mergedSuppliers.find(as => as.id === sid);
        const supplierAddr = s?.address || 'Maputo, Moçambique';
        const supplierCoords = getAddressCoords(supplierAddr);
        const distanceKm = calcDistKm(buyerCoords, supplierCoords);
        
        // Calculate real total based on products if they exist
        let calculatedTotal = 0;
        let itemsFound = 0;
        const itemPrices: { material: string; price: number }[] = [];

        rows.forEach(row => {
          let match = allProducts.find(p => 
            p.supplierId === sid && 
            p.name.trim().toLowerCase() === row.material.trim().toLowerCase()
          );

          if (!match) {
            match = allProducts.find(p => 
              p.supplierId === sid && 
              (p.name.toLowerCase().includes(row.material.toLowerCase()) || 
               row.material.toLowerCase().includes(p.name.toLowerCase()))
            );
          }

          if (match) {
            const price = match.onSale ? (match.salePrice || 0) : (match.price || 0);
            const quantity = parseFloat(row.quantity || '0');
            calculatedTotal += price * quantity;
            itemPrices.push({ material: row.material, price });
            itemsFound++;
          } else {
            // Default fallback
            const price = 0;
            const quantity = parseFloat(row.quantity || '0');
            calculatedTotal += price * quantity;
            itemPrices.push({ material: row.material, price });
          }
        });

        // 1. Create a real Quotation document in Firestore for each supplier
        try {
          await addDoc(collection(db, 'quotations'), {
            requestId,
            buyerId: user?.uid,
            buyerName: profile?.name || 'Cliente SupplyX',
            buyerNuit: profile?.nuit || '400377081',
            buyerAddress: profile?.address || 'NACALA - PORTO',
            buyerEmail: profile?.email || user?.email || 'cliente@supplyx.com',
            buyerPhone: profile?.phone || '+258 84 ...',
            supplierId: sid,
            supplierName: s?.name || 'Fornecedor',
            supplierAddress: supplierAddr,
            supplierEmail: s?.email || 'sales@supplier.com',
            supplierPhone: s?.phone || '',
            supplierNuit: s?.nuit || '400' + Math.floor(Math.random() * 1000000),
            supplierLogoURL: s?.photoURL || '',
            supplierBankAccounts: s?.bankAccounts || [],
            supplierMobileWallets: s?.mobileWallets || [],
            supplierSignatureURL: s?.signatureURL || '',
            supplierStampURL: s?.stampURL || '',
            items: rows.map(r => {
              let match = allProducts.find(p => 
                p.supplierId === sid && 
                p.name.trim().toLowerCase() === r.material.trim().toLowerCase()
              );

              if (!match) {
                match = allProducts.find(p => 
                  p.supplierId === sid && 
                  (p.name.toLowerCase().includes(r.material.toLowerCase()) || 
                   r.material.toLowerCase().includes(p.name.toLowerCase()))
                );
              }

              const price = match ? (match.onSale ? (match.salePrice || 0) : (match.price || 0)) : 0;
              const vatRate = match ? (match.vatRate !== undefined ? match.vatRate : 16) : 16;
              const preTaxPrice = price / (1 + vatRate / 100);
              return {
                material: r.material,
                quantity: parseFloat(r.quantity || '0'),
                unit: r.unit,
                unitPrice: preTaxPrice,
                vatUnitRate: vatRate,
                requestedDate: r.date
              };
            }),
            status: 'pending',
            totalAmount: calculatedTotal,
            confidence: Math.round((itemsFound / (rows.length || 1)) * 100),
            createdAt: serverTimestamp(),
            language
          });

          // 2. Also send a notification via service
          await notificationService.sendNotification({
            userId: sid,
            senderId: user?.uid,
            title: language === 'PT' ? 'Novo Pedido de Cotação' : 'New Quote Request',
            message: language === 'PT' 
              ? `Você recebeu uma nova solicitação de cotação de ${profile?.name || 'um cliente'}.` 
              : `You received a new quote request from ${profile?.name || 'a client'}.`,
            type: 'quote_request',
            metadata: {
              requestId,
              buyerId: user?.uid,
              itemsCount: rows.length
            }
          });
        } catch (e) {
          console.error(`Error saving quotation for ${sid}:`, e);
        }

        const confidence = Math.round((itemsFound / (rows.length || 1)) * 100);

        return {
          supplierId: sid,
          name: s?.name || (language === 'PT' ? 'Fornecedor' : 'Supplier'),
          price: calculatedTotal,
          timeToDeliver: itemsFound === rows.length
            ? (language === 'PT' ? '2 dias' : '2 days') 
            : (language === 'PT' ? '4-5 dias (Sob consulta)' : '4-5 days (Pending quote)'),
          confidence,
          itemPrices,
          phone: s?.phone,
          email: s?.email,
          address: supplierAddr,
          distanceKm
        };
      }));

      // Multi-criteria ranking:
      // 1. Availability target >= 95% of requested products
      // 2. Lowest total price comparison
      // 3. Proximity / Location distance to buyer
      const minP = Math.min(...responses.map(r => r.price)) || 1;
      const maxP = Math.max(...responses.map(r => r.price)) || 1;

      const scoredResponses = responses.map(r => {
        const coverageRatio = r.confidence / 100;
        // Requirement 1: Gate for hitting 95% availability target
        const coverageScore = coverageRatio >= 0.95 ? 1.0 : (coverageRatio * 0.4);
        
        // Requirement 2: Lower price score
        const priceScore = maxP === minP ? 1.0 : 1 - ((r.price - minP) / (maxP - minP || 1));
        
        // Requirement 3: Proximity score
        const distanceScore = Math.max(0, 1 - ((r.distanceKm || 0) / 2000));

        // Combined score
        const rankingScore = (coverageScore * 0.50) + (priceScore * 0.30) + (distanceScore * 0.20);

        return { ...r, rankingScore };
      });

      const sorted = scoredResponses.sort((a, b) => (b.rankingScore || 0) - (a.rankingScore || 0));
      setAiResponses(sorted);
    } catch (err) {
      console.error('Error in AI analysis:', err);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const exportAllPDFs = () => {
    downloadAllPDFs();
  };

  const exportComparisonToExcel = () => {
    if (!aiResponses || aiResponses.length === 0) return;

    const headers = [
      'Ranking',
      language === 'PT' ? 'Fornecedor' : 'Supplier',
      language === 'PT' ? 'Preço Total (MT)' : 'Total Price (MT)',
      language === 'PT' ? 'Prazo de Entrega' : 'Delivery Time',
      language === 'PT' ? 'Confiança' : 'Confidence'
    ];

    const data = aiResponses.map((res, i) => [
      i + 1,
      res.name,
      res.price,
      res.timeToDeliver,
      `${res.confidence}%`
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Comparativo");
    
    const wscols = [
      { wch: 10 }, // Ranking
      { wch: 35 }, // Fornecedor
      { wch: 20 }, // Preço
      { wch: 20 }, // Prazo
      { wch: 15 }  // Confiança
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `comparativo_cotação_supplyx_${new Date().getTime()}.xlsx`);
  };

  const exportOrdersToExcel = () => {
    const orders = getOrders(t);
    const headers = [
      'ID',
      userType === 'supplier' ? t.client : t.supplier,
      t.total,
      language === 'PT' ? 'Data' : 'Date',
      'Status'
    ];

    const data = orders.map(order => [
      order.id,
      order.supplier,
      order.total,
      order.date,
      order.status
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pedidos");

    const wscols = [
      { wch: 12 }, // ID
      { wch: 35 }, // Fornecedor/Cliente
      { wch: 20 }, // Total
      { wch: 15 }, // Data
      { wch: 15 }  // Status
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `pedidos_supplyx_${new Date().getTime()}.xlsx`);
  };

  const exportOrdersToPDF = async () => {
    // Generate a simple PDF table of orders since html2canvas on the whole view might be messy
    const pdf = new jsPDF('p', 'mm', 'a4');
    const orders = getOrders(t);
    
    pdf.setFontSize(20);
    pdf.text('SupplyX - Relatório de Pedidos', 15, 20);
    
    pdf.setFontSize(10);
    pdf.setTextColor(100);
    pdf.text(`Gerado em: ${new Date().toLocaleString()}`, 15, 28);
    
    // Headers
    pdf.setFont('helvetica', 'bold');
    pdf.setFillColor(240, 240, 240);
    pdf.rect(15, 35, 180, 8, 'F');
    const headers = ['ID', userType === 'supplier' ? t.client : t.supplier, t.total, 'Data', 'Status'];
    pdf.text(headers[0], 20, 40);
    pdf.text(headers[1], 45, 40);
    pdf.text(headers[2], 115, 40);
    pdf.text(headers[3], 145, 40);
    pdf.text(headers[4], 175, 40);
    
    // Rows
    pdf.setFont('helvetica', 'normal');
    orders.forEach((order, i) => {
      const y = 48 + (i * 8);
      pdf.text(order.id, 20, y);
      pdf.text(order.supplier.substring(0, 30), 45, y);
      pdf.text(order.total, 115, y);
      pdf.text(order.date, 145, y);
      pdf.text(order.status, 175, y);
      
      // Bottom border for row
      pdf.setDrawColor(240, 240, 240);
      pdf.line(15, y + 2, 195, y + 2);
    });
    
    pdf.save(`pedidos_supplyx_${new Date().getTime()}.pdf`);
  };

  const downloadPDF = async (response: SupplierResponse) => {
    if (!invoiceRef.current) return;
    
    setIsLoading(true);
    try {
      const element = invoiceRef.current;
      
      // Query all page elements
      const pageElements = Array.from(element.querySelectorAll('.quotation-page'));
      
      // If none found for some reason, fallback to rendering the whole parent
      const targets = pageElements.length > 0 ? pageElements : [element];
      
      const pdf = new jsPDF('p', 'mm', 'a4', true);
      
      for (let i = 0; i < targets.length; i++) {
        const targetEl = targets[i] as HTMLElement;
        
        const canvas = await html2canvas(targetEl, {
          scale: 2, // High resolution yet optimal performance
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#ffffff',
          logging: false,
          imageTimeout: 30000,
          onclone: (clonedDoc) => {
            // Prevent dark mode background from inheriting to the html2canvas export
            clonedDoc.documentElement.style.backgroundColor = '#ffffff';
            clonedDoc.documentElement.style.color = '#111827';
            clonedDoc.body.style.backgroundColor = '#ffffff';
            clonedDoc.body.style.color = '#111827';

            const container = clonedDoc.getElementById('pdf-template-container');
            if (container) {
              container.style.position = 'relative';
              container.style.left = '0';
              container.style.top = '0';
              container.style.width = '210mm';
              container.style.height = 'auto';
              container.style.zIndex = '9999';
              container.style.pointerEvents = 'auto';
            }
            const clonedElement = clonedDoc.getElementById('quotation-document');
            if (clonedElement) {
              clonedElement.style.position = 'relative';
              clonedElement.style.left = '0';
              clonedElement.style.top = '0';
              clonedElement.style.margin = '0';
              clonedElement.style.display = 'block';
              clonedElement.style.visibility = 'visible';
            }
            sanitizeDocumentColors(clonedDoc, false);
          }
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        
        if (i > 0) {
          pdf.addPage();
        }
        
        // Fit perfectly on standard A4 dimensions (210mm x 297mm)
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      }
      
      const timestamp = new Date().getTime();
      pdf.save(`Cotacao_SupplyX_${response.name.replace(/\s+/g, '_')}_${timestamp}.pdf`);
    } catch (error) {
      console.error("PDF generator error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadAllPDFs = async () => {
    setDownloadingAll(true);
    try {
      for (let i = 0; i < aiResponses.length; i++) {
        const res = aiResponses[i];
        setSelectedResponseIndex(i);
        // Wait for state to reflect in template
        await new Promise(resolve => setTimeout(resolve, 300));
        await downloadPDF(res);
      }
    } finally {
      setDownloadingAll(false);
    }
  };

  const translations = {
    PT: {
      newQuote: 'Nova Solicitação de Cotação',
      cancel: 'Cancelar',
      step1: 'Preencha a lista de materiais',
      step2: 'Selecione Fornecedores',
      step3: 'Resultado da IA',
      download: 'Baixar PDF',
      aiBtn: 'Ativar IA Procurement',
      addItem: 'Adicionar Material',
      back: 'Voltar',
      payNow: 'Pagar Agora',
      excel: 'Baixar Planilha (Excel)',
      simultaneousAi: 'AI simultânea em processamento',
      analysisComplete: 'Análise Concluída',
      analysisSub: 'Resultados ordenados por Disponibilidade (≥95%), Menor Preço e Proximidade',
      bestChoice: 'Melhor Escolha',
      confirmPayment: 'Pagamento Confirmado',
      secureCheckout: 'Check-out Seguro',
      success: 'Sucesso!',
      transaction: 'Transação',
      myOrders: 'Ir para Meus Pedidos',
      bankTransfer: 'Transferência Bancária',
      mobileWallet: 'Carteira Móvel',
      paymentMethods: 'Meios de Pagamento',
      summary: 'Resumo da Reserva',
      total: 'Total',
      totalEstimated: 'Total estimativo',
      validity: 'Cotação válida por 15 dias',
      verifiedSupplier: 'Fornecedor Verificado',
      customerData: 'Dados do Cliente',
      supplierContact: 'Contacto do Fornecedor',
      description: 'Descrição',
      quantity: 'Quant.',
      unit: 'Un.',
      unitPrice: 'Preço Unit.',
      discount: 'Desc (%)',
      tax: 'IVA (16%)',
      netTotal: 'Total Líquido',
      grossTotal: 'Total Bruto',
      intermediaryNote: 'Nota: A SupplyX Platform atua apenas como intermediadora comercial e documental entre cliente e fornecedor. Não é fornecedora direta dos produtos ou serviços.',
      chatExists: 'Sala de chat já existe. Por favor, acesse a aba Mensagens.',
      chatStarted: 'Chat iniciado! Por favor, acesse a aba Mensagens.',
      headers: {
        item: 'Item',
        material: 'Material',
        qty: 'Qtd',
        need: 'Necessidade'
      },
      receivedRequests: 'Solicitações Recebidas',
      orderManagement: 'Gestão de Pedidos',
      newQuoteBtn: 'Nova Cotação',
      client: 'Cliente',
      buyer: 'Comprador',
      supplier: 'Fornecedor',
      status: {
        delivered: 'Entregue',
        transit: 'Em Trânsito',
        waiting: 'Aguardando',
        quote: 'Cotação'
      },
      respond: 'Responder',
      orderSummary: 'Resumo da Ordem',
      payTo: 'Pagar para',
      subtotal: 'Subtotal',
      opFees: 'Taxas de Operação',
      finalTotal: 'Total Final',
      confirmPaymentBtn: 'Confirmar Pagamento',
      backToQuotes: 'Voltar para Cotações',
      finished: 'Finalizados',
      pending: 'Pendentes',
      bottlenecks: 'Gargalos',
      respondToQuote: 'Responder Cotação',
      priceRequest: 'Solicitação de Preço',
      orderSummarySmall: 'Resumo do Pedido',
      yourProposal: 'Sua Proposta (Valor Total em MT)',
      clientMessage: 'Mensagem ao Cliente (Opcional)',
      clientMessagePlaceholder: 'Ex: Entrega imediata para esta quantidade...',
      successProposal: 'Proposta enviada com sucesso!',
      sendingProposal: 'Enviando Proposta...',
      sendProposal: 'Enviar Proposta',
      marketHealth: 'Saúde do Mercado',
      materialLabel: 'Material',
      quantityLabel: 'Quantidade',
      unitLabel: 'Unidade',
      needDateLabel: 'Data de Necessidade',
      interestInOrder: 'Interesse no pedido',
      downloadAll: 'Baixar Todas (PDF)',
      supplierNames: {
        votorantim: 'Votorantim Cimentos',
        gerdau: 'Gerdau S.A.',
        tigre: 'Tigre Tubos'
      },
      multiSuppliers: 'Multi-fornecedores',
      supplierIntelligence: 'Inteligência de Fornecedores'
    },
    EN: {
      newQuote: 'New Quote Request',
      cancel: 'Cancel',
      step1: 'Fill material list',
      step2: 'Select Suppliers',
      step3: 'AI Results',
      download: 'Download PDF',
      aiBtn: 'Activate AI Procurement',
      addItem: 'Add Material',
      back: 'Back',
      payNow: 'Pay Now',
      excel: 'Download Spreadsheet (Excel)',
      simultaneousAi: 'Simultaneous AI processing',
      analysisComplete: 'Analysis Complete',
      analysisSub: 'Results ranked by Availability (≥95%), Best Price & Proximity',
      bestChoice: 'Best Choice',
      confirmPayment: 'Payment Confirmed',
      secureCheckout: 'Secure Checkout',
      success: 'Success!',
      transaction: 'Transaction',
      myOrders: 'Go to My Orders',
      bankTransfer: 'Bank Transfer',
      mobileWallet: 'Mobile Wallet',
      paymentMethods: 'Payment Methods',
      summary: 'Booking Summary',
      total: 'Total',
      totalEstimated: 'Total estimated',
      validity: 'Quote valid for 15 days',
      verifiedSupplier: 'Verified Supplier',
      customerData: 'Customer Data',
      supplierContact: 'Supplier Contact',
      description: 'Description',
      quantity: 'Qty.',
      unit: 'Un.',
      unitPrice: 'Unit Price',
      discount: 'Disc (%)',
      tax: 'Tax (16%)',
      netTotal: 'Net Total',
      grossTotal: 'Gross Total',
      intermediaryNote: 'Note: SupplyX Platform acts only as a commercial and documentary intermediary between client and supplier. It is not a direct supplier of products or services.',
      chatExists: 'Chat room already exists. Please access the Messages tab.',
      chatStarted: 'Chat started! Please access the Messages tab.',
      headers: {
        item: 'Item',
        material: 'Material',
        qty: 'Qty',
        need: 'Requirement'
      },
      receivedRequests: 'Received Requests',
      orderManagement: 'Order Management',
      newQuoteBtn: 'New Quote',
      client: 'Client',
      buyer: 'Buyer',
      supplier: 'Supplier',
      status: {
        delivered: 'Delivered',
        transit: 'In Transit',
        waiting: 'Waiting',
        quote: 'Quote'
      },
      respond: 'Respond',
      orderSummary: 'Order Summary',
      payTo: 'Pay to',
      subtotal: 'Subtotal',
      opFees: 'Operation Fees',
      finalTotal: 'Final Total',
      confirmPaymentBtn: 'Confirm Payment',
      backToQuotes: 'Back to Quotes',
      finished: 'Finished',
      pending: 'Pending',
      bottlenecks: 'Bottlenecks',
      respondToQuote: 'Respond to Quote',
      priceRequest: 'Price Request',
      orderSummarySmall: 'Order Summary',
      yourProposal: 'Your Proposal (Total Value in MT)',
      clientMessage: 'Message to Client (Optional)',
      clientMessagePlaceholder: 'Ex: Immediate delivery for this quantity...',
      successProposal: 'Proposal sent successfully!',
      sendingProposal: 'Sending Proposal...',
      sendProposal: 'Send Proposal',
      marketHealth: 'Market Health',
      materialLabel: 'Material',
      quantityLabel: 'Quantity',
      unitLabel: 'Unit',
      needDateLabel: 'Need Date',
      interestInOrder: 'Interest in order',
      downloadAll: 'Download All (PDF)',
      supplierNames: {
        votorantim: 'Votorantim Cement',
        gerdau: 'Gerdau S.A.',
        tigre: 'Tigre Pipes'
      },
      multiSuppliers: 'Multi-suppliers',
      supplierIntelligence: 'Supplier Intelligence'
    }
  };

  const t = language === 'PT' ? translations.PT : translations.EN;

  const partitionedQuotations = useMemo(() => {
    const matchedUserId = user?.uid;
    
    const activeRecent = displayedQuotations.filter((order) => {
      const viewedList = Array.isArray(order.viewedBy) ? order.viewedBy : [];
      return matchedUserId ? !viewedList.includes(matchedUserId) : true;
    });
    
    const activeOld = displayedQuotations.filter((order) => {
      const viewedList = Array.isArray(order.viewedBy) ? order.viewedBy : [];
      return matchedUserId ? viewedList.includes(matchedUserId) : false;
    });

    const mockList = getOrders(t).filter((order) => !deletedMockIds.includes(order.id));
    const mockRecent = mockList.filter((order) => !viewedMockIds.includes(order.id));
    const mockOld = mockList.filter((order) => viewedMockIds.includes(order.id));

    return {
      recentReal: activeRecent,
      oldReal: activeOld,
      recentMock: mockRecent,
      oldMock: mockOld,
      hasRecent: activeRecent.length > 0 || mockRecent.length > 0,
      hasOld: activeOld.length > 0 || mockOld.length > 0
    };
  }, [displayedQuotations, viewedMockIds, deletedMockIds, user?.uid, t]);

  const renderQuotationCard = (order: any, isMock: boolean) => {
    const quoteTitle = isMock ? order.id : (order.requestId || order.id);
    const quoteAmount = isMock ? order.total : `MT ${(order.totalAmount || 0).toLocaleString('pt-BR')}`;
    const quoteDate = isMock ? order.date : (order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : new Date().toLocaleDateString());
    const displayStatus = isMock 
      ? order.status 
      : (((order.status === 'pending' || !order.status) ? t.status.quote : (order.status === 'responded' ? t.status.waiting : order.status)));

    const isRecent = isMock 
      ? !viewedMockIds.includes(order.id) 
      : (!order.viewedBy || (user?.uid && !order.viewedBy.includes(user.uid)));

    const currentSupplierName = isMock ? order.supplier : (order.supplierName || 'Fornecedor Parceiro');

    return (
      <motion.div 
        key={order.id} 
        whileHover={{ y: -4 }}
        onClick={() => {
          if (isMock) {
            markMockOrderAsViewed(order.id);
            startChat(order);
          } else {
            markQuotationAsViewed(order.id);
            setSelectedRealQuoteForPreview(order);
          }
        }}
        className={`p-5 sm:p-6 rounded-[28px] sm:rounded-[32px] border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 transition-all cursor-pointer group relative overflow-hidden ${
          isDarkMode 
            ? 'bg-supplyx-dark border-white/5 hover:border-supplyx-blue/50 shadow-2xl shadow-black/20' 
            : 'bg-white border-zinc-100 hover:border-supplyx-blue/30 shadow-sm hover:shadow-xl hover:shadow-zinc-200/50'
        }`}
      >
        <div className="flex items-center gap-4 sm:gap-5 w-full sm:w-auto relative z-10 font-sans">
          <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-[18px] sm:rounded-[20px] flex items-center justify-center border transition-all shrink-0 ${
            isDarkMode 
              ? 'bg-zinc-850 border-white/5 group-hover:bg-supplyx-blue/10 group-hover:border-supplyx-blue/20' 
              : 'bg-zinc-50 border-zinc-100 group-hover:bg-supplyx-blue/5 group-hover:bg-supplyx-blue/10'
          }`}>
            <FileText className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors ${isDarkMode ? 'text-zinc-500 group-hover:text-supplyx-blue' : 'text-zinc-400 group-hover:text-supplyx-blue'}`} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <h4 className={`text-base sm:text-lg font-black italic tracking-tight transition-colors truncate ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{quoteTitle}</h4>
              {isRecent && (
                 <span className="w-1.5 h-1.5 rounded-full bg-supplyx-blue animate-pulse shrink-0" />
              )}
              {isRecent && (
                <span className="px-1.5 py-0.5 rounded bg-supplyx-blue/10 text-supplyx-blue text-[8px] font-black uppercase tracking-widest shrink-0 animate-pulse">
                  {language === 'PT' ? 'Novo' : 'New'}
                </span>
              )}
            </div>
            <p 
              className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-zinc-500 cursor-pointer hover:text-supplyx-blue transition-colors flex items-center gap-2 truncate"
              onClick={(e) => {
                e.stopPropagation();
                const profileId = isMock 
                  ? (userType === 'supplier' ? 'buyer_demo_uid' : order.supplierId)
                  : (userType === 'supplier' ? order.buyerId : order.supplierId);
                if (profileId) {
                  setViewingProfileId(profileId);
                  setIsProfileModalOpen(true);
                }
              }}
            >
              <User className="w-3 h-3 text-supplyx-blue" />
              {userType === 'supplier' 
                ? `${t.client}: ${isMock ? 'Manhate Jr' : (order.buyerName || 'Client')}` 
                : `${t.supplier}: ${currentSupplierName}`}
            </p>
          </div>
          
          {/* Mobile Status Badge */}
          <div className="sm:hidden shrink-0">
            <div className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border
              ${displayStatus === t.status.delivered ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                displayStatus === t.status.transit ? 'bg-supplyx-blue/10 text-supplyx-blue border-supplyx-blue/20' :
                (displayStatus === t.status.waiting || displayStatus === 'responded') ? 'bg-amber-500/10 text-amber-500 border-amber-550/10' :
                'bg-indigo-500/10 text-indigo-500 border-indigo-554/10'}`}>
              {displayStatus}
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-10 w-full sm:w-auto p-4 sm:p-0 rounded-2xl bg-zinc-900/5 sm:bg-transparent relative z-10 font-sans">
          <div className="text-left sm:text-right">
            <p className={`text-lg sm:text-xl font-black italic tracking-tighter leading-none mb-1 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
              {quoteAmount}
            </p>
            <p className="text-[8px] sm:text-[9px] text-zinc-500 font-bold uppercase tracking-[0.2em]">
              {quoteDate}
            </p>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Desktop Only Status */}
            <div className={`hidden sm:block px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border
              ${displayStatus === t.status.delivered ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                displayStatus === t.status.transit ? 'bg-supplyx-blue/10 text-supplyx-blue border-supplyx-blue/20' :
                (displayStatus === t.status.waiting || displayStatus === 'responded') ? 'bg-amber-500/10 text-amber-500 border-amber-550/20 font-black' :
                'bg-indigo-500/10 text-indigo-500 border-indigo-554/10 font-black'}`}>
              {displayStatus}
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button 
                onClick={async (e) => {
                  e.stopPropagation();
                  setDownloadingOrderId(order.id);
                  try {
                    if (isMock) {
                      const mockRes: SupplierResponse = {
                        supplierId: order.supplierId || 'S1',
                        name: order.supplier,
                        price: parseFloat(order.total.replace('MT ', '').replace('.', '').replace(',', '.')) || 12450,
                        timeToDeliver: '2 dias',
                        confidence: 95,
                        itemPrices: (order.items || []).map((it: any) => ({ material: it.description, price: it.unitPrice || 0 }))
                      };
                      setSelectedResponseIndex(0);
                      await downloadPDF(mockRes);
                    } else {
                      setActivePdfQuote(order);
                      await new Promise(resolve => setTimeout(resolve, 500));
                      const mockRes: SupplierResponse = {
                        supplierId: order.supplierId,
                        name: order.supplierName,
                        price: order.totalAmount || 0,
                        timeToDeliver: '2 dias',
                        confidence: order.confidence || 0,
                        itemPrices: []
                      };
                      await downloadPDF(mockRes);
                      setActivePdfQuote(null);
                    }
                  } finally {
                    setDownloadingOrderId(null);
                  }
                }}
                disabled={downloadingOrderId === order.id}
                className={`p-2 sm:p-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-50 ${isDarkMode ? 'bg-white/5 text-zinc-400 hover:text-white' : 'bg-zinc-50 text-zinc-500 hover:text-zinc-900'}`}
              >
                {downloadingOrderId === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  startChat(order);
                }}
                className={`p-2 sm:p-2.5 rounded-xl transition-all active:scale-95 ${isDarkMode ? 'bg-white/5 text-zinc-400 hover:text-supplyx-blue' : 'bg-zinc-50 text-zinc-500 hover:text-supplyx-blue'}`}
              >
                <MessageSquare className="w-4 h-4" />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  deleteQuotation(order.id, isMock, e);
                }}
                className={`p-2 sm:p-2.5 rounded-xl transition-all active:scale-95 ${
                  isDarkMode 
                    ? 'bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white' 
                    : 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white'
                }`}
                title={language === 'PT' ? 'Eliminar Cotação' : 'Delete Quotation'}
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Populate logistics form parameters for this specific quote/order
                  const currentSupplierName = order.supplierName || order.supplier || 'Fornecedor Parceiro';
                  let materialsList = order.materials?.map((m: any) => typeof m === 'object' ? m.name : m).filter(Boolean).join(', ');
                  if (!materialsList && order.items) {
                    materialsList = order.items.map((it: any) => it.material || it.description).filter(Boolean).join(', ');
                  }
                  if (!materialsList) materialsList = 'Materiais de Construção B2B';

                  const calculatedOrigem = order.supplierAddress || currentSupplierName + ', Moçambique';
                  const calculatedDestino = profile?.address || order.buyerName || 'Província de Nampula, Moçambique';

                  setLogisticsFormFields({
                    origem: calculatedOrigem,
                    destino: calculatedDestino,
                    tipoCarga: materialsList,
                    peso: '12',
                    volume: '24',
                    prioridade: 'normal',
                    dataDesejada: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    tipoVeiculo: 'caminhão pesado',
                    observacoes: `Ordem Logística vinculada à Cotação #${order.id || 'QT-01'}. Faturamento sob custódia SupplyX. Urgência: ALTA`,
                    seguroCarga: 'Incluso (Fidelidade)',
                    cargaFragil: false,
                    temperaturaControlada: false
                  });

                  setSpreadsheetOrigem(calculatedOrigem);
                  setSpreadsheetDestino(calculatedDestino);
                  setSpreadsheetRows([
                    { id: '1', name: '', quantity: '1', weight: '' }
                  ]);

                  setRespondingTo(order);
                  setIsDirectLogisticsRequest(true);
                  setShowForm(true);
                  setStep(4);
                  setPaymentSuccess(true);
                  setSelectedScenario(3);
                  setShowLogisticsQuestion(true);
                }}
                className="px-3.5 py-2.5 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Truck className="w-3.5 h-3.5" />
                {language === 'PT' ? 'Atribuir Carga ao Logístico' : 'Assign Cargo to Logistics'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const quotationData = useMemo(() => {
    // If responding to or viewing a specific real quotation
    const targetQuote = activePdfQuote || respondingTo;
    if (targetQuote) {
      const quoteSupplierId = targetQuote.supplierId;
      const dbSupplier = mergedSuppliers.find(s => s.id === quoteSupplierId);
      const isSupplierUser = userType === 'supplier';

      const sInfo = {
        name: targetQuote.supplierName || (isSupplierUser ? (profile?.name || 'FORNECEDOR') : (dbSupplier?.name || 'FORNECEDOR')),
        isVerified: true,
        address: targetQuote.supplierAddress || (isSupplierUser ? (profile?.address || 'Maputo, Moçambique') : (dbSupplier?.address || 'Maputo, Moçambique')),
        email: targetQuote.supplierEmail || (isSupplierUser ? (profile?.email || user?.email || '') : (dbSupplier?.email || 'sales@supplier.com')),
        phone: targetQuote.supplierPhone || (isSupplierUser ? (profile?.phone || '') : (dbSupplier?.phone || '')),
        nuit: targetQuote.supplierNuit || (isSupplierUser ? (profile?.nuit || '400377081') : (dbSupplier?.nuit || '400377081')),
        logoURL: targetQuote.supplierLogoURL || (isSupplierUser ? (profile?.photoURL || '') : (dbSupplier?.photoURL || '')),
        bankAccounts: targetQuote.supplierBankAccounts || (isSupplierUser ? (profile?.bankAccounts || []) : (dbSupplier?.bankAccounts || [])),
        mobileWallets: targetQuote.supplierMobileWallets || (isSupplierUser ? (profile?.mobileWallets || []) : (dbSupplier?.mobileWallets || [])),
        signatureURL: targetQuote.supplierSignatureURL || (isSupplierUser ? (profile?.signatureURL || '') : (dbSupplier?.signatureURL || '')),
        stampURL: targetQuote.supplierStampURL || (isSupplierUser ? (profile?.stampURL || '') : (dbSupplier?.stampURL || ''))
      };

      const cInfo = {
        name: targetQuote.buyerName || (isSupplierUser ? 'Cliente SupplyX' : (profile?.name || 'Cliente SupplyX')),
        nuit: targetQuote.buyerNuit || (isSupplierUser ? '400377081' : (profile?.nuit || '400377081')),
        address: targetQuote.buyerAddress || (isSupplierUser ? 'NACALA - PORTO' : (profile?.address || 'NACALA - PORTO')),
        email: targetQuote.buyerEmail || (isSupplierUser ? 'cliente@supplyx.com' : (profile?.email || user?.email || 'cliente@supplyx.com')),
        phone: targetQuote.buyerPhone || (isSupplierUser ? '+258 84 ...' : (profile?.phone || '+258 84 ...'))
      };

      return {
        quoteNumber: targetQuote.requestId || 'PR-QT-2035/2026',
        date: targetQuote.createdAt?.toDate ? targetQuote.createdAt.toDate().toLocaleDateString('pt-PT') : new Date().toLocaleDateString('pt-PT'),
        validityDays: 15,
        supplier: sInfo,
        client: cInfo,
        items: (targetQuote.items || []).map((row: any) => {
          const isViewOnly = activePdfQuote && !respondingTo;
          
          const currentTotal = isViewOnly 
            ? (targetQuote.responseValue || targetQuote.totalAmount || 0) 
            : (parseFloat(responseValue) || targetQuote.totalAmount || 0);

          const currentDiscount = isViewOnly 
            ? (targetQuote.discountPercent || 0) 
            : (parseFloat(responseDiscount) || 0);

          let finalUnitPrice = row.unitPrice;
          if (row.unitPrice === 0) {
            finalUnitPrice = 0;
          } else if (row.unitPrice === undefined || row.unitPrice === null) {
            // Read-only or live but no unitPrice saved/present (older records)
            const count = targetQuote.items.length || 1;
            const vat = row.vatUnitRate !== undefined ? row.vatUnitRate : 16;
            finalUnitPrice = (currentTotal / (1 + vat / 100)) / count;
          } else {
            // It is a valid non-zero price
            if (!isViewOnly) {
              // Live-scaling in the modal
              const originalTotalWithVat = (targetQuote.items || []).reduce((acc: number, it: any) => {
                const qty = parseFloat(it.quantity || '0') || 0;
                const unitPriceVal = parseFloat(it.unitPrice || '0') || 0;
                const vat = it.vatUnitRate !== undefined ? it.vatUnitRate : 16;
                return acc + (qty * unitPriceVal * (1 + vat / 100));
              }, 0);
              
              if (originalTotalWithVat > 0) {
                finalUnitPrice = (row.unitPrice || 0) * (currentTotal / originalTotalWithVat);
              } else {
                const count = targetQuote.items.length || 1;
                const vat = row.vatUnitRate !== undefined ? row.vatUnitRate : 16;
                finalUnitPrice = (currentTotal / (1 + vat / 100)) / count;
              }
            } else {
              finalUnitPrice = row.unitPrice;
            }
          }

          const vatPerItem = row.vatUnitRate !== undefined 
            ? row.vatUnitRate 
            : (row.vatRate !== undefined ? row.vatRate : 16);
          
          return {
            description: row.material,
            quantity: parseFloat(row.quantity || '0'),
            unit: row.unit || 'un',
            unitPrice: finalUnitPrice,
            discount: parseFloat(currentDiscount as any) || 0,
            vatPer: vatPerItem
          };
        })
      };
    }

    // Default for Comparison View (Step 3)
    const currentResponse = aiResponses[selectedResponseIndex];
    const currentSupplier = mergedSuppliers.find(s => s.id === currentResponse?.supplierId);
    
    return {
      quoteNumber: 'PR-QT-2035/2026',
      date: new Date().toLocaleDateString('pt-PT'),
      validityDays: 15,
      supplier: {
        name: currentSupplier?.name || 'FORNECEDOR',
        isVerified: true,
        address: currentSupplier?.address || 'Maputo, Moçambique',
        email: currentSupplier?.email || 'sales@' + (currentSupplier?.name?.toLowerCase().replace(/\s+/g, '') || 'supplier') + '.com',
        phone: currentSupplier?.phone || '+258 84 000 0000',
        nuit: currentSupplier?.nuit || '400' + Math.floor(Math.random() * 1000000),
        license: (currentSupplier as any)?.license || '',
        logoURL: currentSupplier?.photoURL || '',
        bankAccounts: currentSupplier?.bankAccounts || [],
        mobileWallets: currentSupplier?.mobileWallets || [],
        signatureURL: currentSupplier?.signatureURL,
        stampURL: currentSupplier?.stampURL
      },
      client: {
        name: profile?.name || 'Cliente SupplyX',
        nuit: profile?.nuit || '400377081',
        address: profile?.address || 'NACALA - PORTO',
        email: user?.email || 'cliente@supplyx.com',
        phone: profile?.phone || '+258 84 ...'
      },
      items: rows.map((row, i) => {
        const itemPrice = currentResponse?.itemPrices.find(ip => ip.material === row.material)?.price || 0;
        
        // Find matching product from the selected supplier
        let match = null;
        if (currentResponse) {
          match = allProducts.find(p => 
            p.supplierId === currentResponse.supplierId && 
            p.name.trim().toLowerCase() === row.material.trim().toLowerCase()
          );

          if (!match) {
            match = allProducts.find(p => 
              p.supplierId === currentResponse.supplierId && 
              (p.name.toLowerCase().includes(row.material.toLowerCase()) || 
               row.material.toLowerCase().includes(p.name.toLowerCase()))
            );
          }
        }
        
        const itemVatRate = match ? (match.vatRate !== undefined ? match.vatRate : 16) : 16;
        
        return {
          description: row.material,
          quantity: parseFloat(row.quantity || '0'),
          unit: row.unit,
          unitPrice: itemPrice / (1 + itemVatRate / 100),
          discount: 0,
          vatPer: itemVatRate
        };
      })
    };
  }, [respondingTo, responseValue, responseDiscount, aiResponses, selectedResponseIndex, mergedSuppliers, profile, user, rows]);

  const invoiceTemplate = (
    <div id="pdf-template-container" style={{ position: 'fixed', left: '-5000px', top: 0, width: '210mm', pointerEvents: 'none', zIndex: -100 }}>
      <QuotationDocument data={quotationData} innerRef={invoiceRef} language={language} />
    </div>
  );


  if (showForm) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="w-full max-w-[1920px] mx-auto"
      >
        {invoiceTemplate}

        <div className={`${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} p-6 md:p-8 rounded-3xl border shadow-2xl flex flex-col min-h-[600px]`}>
          {/* Header */}
          <div className="flex justify-between items-center mb-8 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#0052CC] rounded-xl flex items-center justify-center text-white shadow-brand">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h2 className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{t.newQuote}</h2>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">AI Procurement Engine v2.0</p>
              </div>
            </div>
            <button 
              onClick={handleClose}
              className={`p-2 transition-colors ${isDarkMode ? 'text-zinc-600 hover:text-white' : 'text-zinc-300 hover:text-zinc-900'}`}
              title={language === 'PT' ? 'Fechar' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-grow flex flex-col">
                {/* Quotation Header Info */}
                <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-6 rounded-2xl border-2 border-dashed ${isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-gray-50 border-gray-100'}`}>
                   <div>
                      <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1">{language === 'PT' ? 'Requisição #' : 'Requisition #'}</p>
                      <p className={`text-sm font-black italic ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>RQ-{Math.floor(Date.now()/100000)}</p>
                   </div>
                   <div>
                      <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1">{language === 'PT' ? 'Data de Emissão' : 'Issue Date'}</p>
                      <p className={`text-sm font-black italic ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{new Date().toLocaleDateString()}</p>
                   </div>
                   <div>
                      <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1">{language === 'PT' ? 'Cliente / NUIT' : 'Client / NUIT'}</p>
                      <p className={`text-sm font-black italic ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{profile?.name?.substring(0, 15)}... / {profile?.nuit || '---'}</p>
                   </div>
                   <div>
                      <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1">{language === 'PT' ? 'Status Planilha' : 'Sheet Status'}</p>
                      <span className="px-2 py-0.5 bg-brand/10 text-brand text-[10px] font-black uppercase rounded-lg italic">Draft / Edição</span>
                   </div>
                </div>

                <div className="flex flex-col gap-8 mb-8">
                  <div className={`flex-grow overflow-x-auto border rounded-[32px] ${isDarkMode ? 'border-zinc-800 bg-zinc-950 shadow-3xl' : 'border-zinc-100 bg-white shadow-xl shadow-zinc-200/50'} relative`}>
                    <table className="w-full text-left border-collapse min-w-[750px] table-fixed">
                      <thead className={`${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-50 border-zinc-100'} border-b sticky top-0 z-20`}>
                        <tr>
                          <th className="px-4 py-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest w-12 text-center">#</th>
                          <th className="px-4 py-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest w-64">{t.headers.material}</th>
                          <th className="px-4 py-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest w-20 text-center">{t.headers.qty}</th>
                          <th className="px-4 py-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest w-24 text-center">{language === 'PT' ? 'Unid.' : 'Unit'}</th>
                          <th className="px-4 py-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest w-20 text-center">IVA %</th>
                          <th className="px-4 py-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest w-20 text-center">Inc?</th>
                          <th className="px-4 py-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest w-30 text-right">Sub Total</th>
                          <th className="px-4 pr-6 w-12"></th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDarkMode ? 'divide-white/5' : 'divide-zinc-50'}`}>
                        {rows.map((row, index) => (
                          <OrderRow 
                            key={row.id}
                            row={row}
                            index={index}
                            isDarkMode={isDarkMode || false}
                            language={language || 'PT'}
                            t={t}
                            allProducts={allProducts}
                            onUpdate={updateRow}
                            onRemove={removeRow}
                          />
                        ))}
                      </tbody>
                    </table>
                      <div className="p-4 border-t border-zinc-100 flex items-center justify-between">
                        <button 
                          onClick={addRow}
                          className="flex items-center gap-2 px-4 py-2 text-zinc-500 hover:text-zinc-900 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          <span className="text-[10px] font-black uppercase tracking-widest">{t.addItem}</span>
                        </button>
                        <button 
                          onClick={exportToExcel}
                          className="flex items-center gap-2 px-4 py-2 text-emerald-600 hover:text-emerald-700 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          <span className="text-[10px] font-black uppercase tracking-widest">{t.excel}</span>
                        </button>
                      </div>
                  </div>
                </div>
                <div className={`flex flex-col sm:flex-row justify-between items-center p-6 rounded-3xl gap-4 ${isDarkMode ? 'bg-zinc-800/50' : 'bg-zinc-50'}`}>
                  <button onClick={addRow} className={`flex items-center gap-2 font-bold text-sm transition-colors ${isDarkMode ? 'text-zinc-500 hover:text-brand' : 'text-zinc-400 hover:text-brand'}`}>
                    <Plus className="w-4 h-4" /> {language === 'PT' ? 'Adicionar Material' : 'Add Material'}
                  </button>
                  <button onClick={() => setStep(2)} disabled={rows.length === 0 || rows[0]?.material === ''} className="w-full sm:w-auto px-12 py-4 bg-zinc-900 text-white rounded-2xl font-black text-lg hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-50">
                    {t.step2}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 flex-grow flex flex-col justify-between">
                <div>
                  <h3 className={`text-xl font-bold mb-6 italic uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{t.step2}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredSuppliers.map(s => (
                      <div 
                        key={s.id} onClick={() => toggleSupplier(s.id)}
                        className={`p-5 rounded-3xl border-2 transition-all cursor-pointer relative group
                          ${selectedSuppliers.includes(s.id) 
                            ? 'border-brand bg-brand/5 shadow-xl shadow-brand/10' 
                            : isDarkMode ? 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/50' : 'border-zinc-100 hover:border-zinc-300'}`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className={`p-3 rounded-2xl ${selectedSuppliers.includes(s.id) ? 'bg-[#0052CC] text-white' : isDarkMode ? 'bg-[#27272a] text-[#71717a]' : 'bg-[#f4f4f5] text-[#a1a1aa]'}`}>
                            <Building2 className="w-6 h-6" />
                          </div>
                          <span className="text-[10px] font-black text-[#0052CC] bg-[#E5EEFF] px-2 py-1 rounded-lg uppercase">{s.quality}</span>
                        </div>
                        <h4 className={`font-bold text-lg leading-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{s.name}</h4>
                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">{s.segment}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className={`flex flex-col sm:flex-row justify-between items-center p-6 rounded-3xl mt-8 gap-4 ${isDarkMode ? 'bg-zinc-800/50' : 'bg-zinc-50'}`}>
                  <button onClick={() => setStep(1)} className="text-zinc-500 font-bold hover:text-white py-4 px-6">{t.back}</button>
                  <button onClick={startAiAnalysis} disabled={selectedSuppliers.length === 0} className="w-full sm:w-auto flex items-center justify-center gap-3 px-12 py-5 bg-[#0052CC] text-white rounded-2xl font-black text-lg shadow-brand-hover hover:bg-[#0747A6] transition-all disabled:opacity-50 active:scale-95">
                    <Zap className="w-6 h-6 fill-white" /> {t.aiBtn}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 py-8 flex-grow">
                {isAiProcessing ? (
                  <div className="flex flex-col items-center justify-center py-20 flex-grow">
                    <Cpu className={`w-20 h-20 text-brand animate-spin duration-[4000ms]`} />
                    <h3 className={`text-2xl font-black mt-10 italic uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{t.simultaneousAi}</h3>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className={`flex-1 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-emerald-50/50 border-emerald-100'} p-4 rounded-2xl border flex items-center justify-between`}>
                        <div className="flex items-center gap-3">
                          <ShieldCheck className="w-6 h-6 text-emerald-500" />
                          <div>
                            <h3 className={`font-black uppercase tracking-tight italic ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{t.analysisComplete}</h3>
                            <p className="text-[10px] text-emerald-600 font-black uppercase">{t.analysisSub}</p>
                          </div>
                        </div>
                      </div>
                      {aiResponses.length > 1 && (
                        <div className="flex gap-2">
                          <button 
                            onClick={exportComparisonToExcel}
                            className={`flex items-center gap-2 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all h-full ${
                              isDarkMode ? 'bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-white border border-zinc-100 text-zinc-500 hover:text-zinc-900 shadow-sm'
                            }`}
                          >
                            <Download className="w-4 h-4" />
                            {t.excel}
                          </button>
                          <button 
                            onClick={downloadAllPDFs}
                            disabled={downloadingAll}
                            className={`flex items-center gap-2 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all h-full ${
                              isDarkMode ? 'bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-white border border-zinc-100 text-zinc-500 hover:text-zinc-900 shadow-sm'
                            }`}
                          >
                            {downloadingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            {t.downloadAll}
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="space-y-4">
                      {aiResponses.map((res, i) => (
                        <motion.div 
                          key={res.supplierId} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.2 }}
                          className={`p-6 rounded-3xl border flex flex-col sm:flex-row items-center justify-between group transition-all
                             ${i === 0 ? (isDarkMode ? 'border-[#0052CC] bg-[#0052CC]/5 shadow-2xl' : 'border-[#0052CC] bg-white shadow-2xl ring-1 ring-[#0052CC]/20') 
                                      : (isDarkMode ? 'border-[#27272a] bg-[#18181b]/50 hover:bg-[#27272a]' : 'border-[#f4f4f5] hover:border-[#e4e4e7] bg-[#fafafa]/30')}`}
                        >
                          <div className="flex items-center gap-5 w-full sm:w-auto">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border font-black text-xl
                              ${i === 0 ? 'bg-brand text-white border-brand' : isDarkMode ? 'bg-zinc-800 text-zinc-500 border-zinc-700' : 'bg-white text-zinc-400 border-zinc-100'}`}>
                              {i + 1}º
                            </div>
                            <div className="flex-1">
                              <h4 className={`font-black text-lg flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                                {res.name}
                                {i === 0 && <span className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-lg italic font-black uppercase">{t.bestChoice}</span>}
                              </h4>
                              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${res.confidence >= 95 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'}`}>
                                  {res.confidence}% {language === 'PT' ? 'Disponibilidade de Itens' : 'Item Availability'}
                                </span>
                                {res.distanceKm !== undefined && (
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isDarkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-700'}`}>
                                    {res.distanceKm} km {language === 'PT' ? 'de distância' : 'away'}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                <div className="flex gap-1.5 overflow-hidden">
                                  <button 
                                    onClick={() => {
                                      setSelectedResponseIndex(i);
                                      setIsPreviewOpen(true);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand/10 hover:bg-brand/20 text-brand text-[10px] font-black uppercase rounded-lg transition-all"
                                  >
                                    <Eye className="w-3 h-3" /> {language === 'PT' ? 'Ver Documento' : 'View Document'}
                                  </button>
                                  <button 
                                    onClick={async () => {
                                      setDownloadingIndex(i);
                                      setSelectedResponseIndex(i);
                                      setTimeout(async () => {
                                        try {
                                          await downloadPDF(res);
                                        } finally {
                                          setDownloadingIndex(null);
                                        }
                                      }, 100);
                                    }}
                                    disabled={downloadingIndex === i}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-[10px] font-black uppercase rounded-lg transition-all disabled:opacity-50"
                                  >
                                    {downloadingIndex === i ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />} {t.download}
                                  </button>
                                </div>
                                <span className={`text-[10px] font-bold ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>via SupplyX Portal</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right mt-4 sm:mt-0 w-full sm:w-auto flex flex-col items-end gap-1">
                            <div>
                              <p className={`text-2xl font-black italic tracking-tighter ${i === 0 ? 'text-brand' : isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
                                MT {res.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                {res.confidence < 100 && (
                                  <span className="text-[10px] text-yellow-600 dark:text-yellow-500 font-black block leading-none mt-1">
                                    + ITENS SOB CONSULTA
                                  </span>
                                )}
                              </p>
                              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-none mt-1">{t.totalEstimated}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-grow flex flex-col">
                <div className="text-center mb-10">
                  <h3 className={`text-3xl font-black italic uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                    {paymentSuccess ? t.confirmPayment : t.secureCheckout}
                  </h3>
                  <div className="flex justify-center mt-2">
                    <div className="w-12 h-1 bg-brand rounded-full" />
                  </div>
                </div>

                {paymentSuccess ? (
                  <div className="flex-grow flex flex-col">
                    {!scenarioCommitted ? (
                      <div className="flex-grow flex flex-col py-2">
                        <div className="text-center mb-6">
                          <h4 className={`text-base sm:text-lg font-black italic uppercase tracking-tight ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
                            {language === 'PT' ? 'Como será feita a entrega?' : 'How will delivery be handled?'}
                          </h4>
                          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mt-1">
                            {language === 'PT' ? 'Selecione uma modalidade operacional para prosseguir' : 'Select an operational method to proceed'}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                          {/* Option 1: Levantamento próprio */}
                          <div 
                            onClick={() => setSelectedScenario(1)}
                            className={`p-5 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between hover:scale-[1.01] ${
                              selectedScenario === 1 
                                ? 'border-[#0052CC] bg-[#0052CC]/5 shadow-brand' 
                                : isDarkMode ? 'border-zinc-800 bg-zinc-900 hover:border-zinc-700' : 'border-zinc-100 bg-white hover:border-zinc-300 shadow-sm'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedScenario === 1 ? 'bg-[#0052CC] text-white' : 'bg-amber-500/10 text-amber-500'}`}>
                                  <User className="w-5 h-5" />
                                </div>
                                <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-zinc-500/10 text-zinc-500">
                                  {language === 'PT' ? 'Cenário 1' : 'Scenario 1'}
                                </span>
                              </div>
                              <h5 className={`text-xs font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                                {language === 'PT' ? 'Levantamento Próprio' : 'Self-Pickup'}
                              </h5>
                              <p className="text-[10px] font-bold text-zinc-500 leading-normal">
                                {language === 'PT' 
                                  ? 'O cliente levanta a mercadoria diretamente nas instalações do fornecedor. A logística externa da SupplyX não é acionada.' 
                                  : 'The customer retrieves materials direct from the supplier database. Outer logistics not required.'}
                              </p>
                            </div>
                            <div className="mt-4 pt-3 border-t border-zinc-500/10 flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-[#0052CC]">
                              <span>{language === 'PT' ? 'Sem taxa de frete' : 'No freight fee'}</span>
                              <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-md">FOB</span>
                            </div>
                          </div>

                          {/* Option 2: Entrega pelo fornecedor */}
                          <div 
                            onClick={() => setSelectedScenario(2)}
                            className={`p-5 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between hover:scale-[1.01] ${
                              selectedScenario === 2 
                                ? 'border-[#0052CC] bg-[#0052CC]/5 shadow-brand' 
                                : isDarkMode ? 'border-zinc-800 bg-zinc-900 hover:border-zinc-700' : 'border-zinc-100 bg-white hover:border-zinc-300 shadow-sm'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedScenario === 2 ? 'bg-[#0052CC] text-white' : 'bg-[#0052CC]/10 text-[#0052CC]'}`}>
                                  <Building2 className="w-5 h-5" />
                                </div>
                                <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-zinc-500/10 text-zinc-500">
                                  {language === 'PT' ? 'Cenário 2' : 'Scenario 2'}
                                </span>
                              </div>
                              <h5 className={`text-xs font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                                {language === 'PT' ? 'Entrega pelo Fornecedor' : 'Supplier own fleet'}
                              </h5>
                              <p className="text-[10px] font-bold text-zinc-500 leading-normal">
                                {language === 'PT' 
                                  ? 'O fornecedor assume o transporte utilizando motorista e frota próprios. O fornecedor controla toda a entrega no sistema.' 
                                  : 'Supplier controls delivery using cooperative or proprietary vehicle. Outer carriers optional.'}
                              </p>
                            </div>
                            <div className="mt-4 pt-3 border-t border-zinc-500/10 flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-[#0052CC]">
                              <span>{language === 'PT' ? 'Controlo do Fornecedor' : 'Supplier Controlled'}</span>
                              <span className="bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded-md">CIF</span>
                            </div>
                          </div>

                          {/* Option 3: Solicitar Logística */}
                          <div 
                            onClick={() => setSelectedScenario(3)}
                            className={`p-5 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between hover:scale-[1.01] ${
                              selectedScenario === 3 
                                ? 'border-brand bg-brand/5 shadow-brand' 
                                : isDarkMode ? 'border-zinc-800 bg-zinc-900 hover:border-zinc-700' : 'border-zinc-100 bg-white hover:border-zinc-300 shadow-sm'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedScenario === 3 ? 'bg-brand text-white' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                  <Truck className="w-5 h-5" />
                                </div>
                                <span className="text-[8px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-500 text-white animate-pulse">
                                  {language === 'PT' ? 'Sugerido' : 'Suggested'}
                                </span>
                              </div>
                              <h5 className={`text-xs font-black uppercase tracking-widest mb-2 text-brand`}>
                                {language === 'PT' ? 'Solicitar Logística no SupplyX' : 'Third-Party Carrier (SupplyX)'}
                              </h5>
                              <p className="text-[10px] font-bold text-zinc-500 leading-normal">
                                {language === 'PT' 
                                  ? 'Cria uma ordem logística automatizada no concórcio público para transportadoras externas avaliarem e licitarem em tempo-real.' 
                                  : 'Full comprehensive logistics module. Auto-generates cargo dispatch for outer network carriers.'}
                              </p>
                            </div>
                            <div className="mt-4 pt-3 border-t border-zinc-500/10 flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-emerald-500">
                              <span>{language === 'PT' ? 'Bidding Ativo & Rastreio' : 'Active Bidding & Tracking'}</span>
                              <span className="bg-emerald-500 text-white px-2 py-0.5 rounded-md text-[7px]">COMPLETO</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-zinc-500/10">
                          <button 
                            type="button"
                            onClick={() => {
                              // Skip selection and just close
                              setStep(1);
                              setPaymentSuccess(false);
                              setShowForm(false);
                            }}
                            className={`px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isDarkMode ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-zinc-900'}`}
                          >
                            {language === 'PT' ? 'Decidir mais tarde' : 'Decide later'}
                          </button>
                          <button 
                            type="button"
                            onClick={() => {
                              if (selectedScenario === 3) {
                                // Prepopulate and open form question
                                const targetResponse = aiResponses[selectedResponseIndex] || respondingTo;
                                const currentSupplierName = targetResponse?.name || targetResponse?.supplierName || 'Fornecedor Parceiro';
                                let materialsList = rows.map(r => r.material).filter(Boolean).join(', ');
                                if (!materialsList && targetResponse?.items) {
                                  materialsList = targetResponse.items.map((it: any) => it.material || it.description).join(', ');
                                }
                                if (!materialsList) materialsList = 'Materiais de Construção B2B';

                                const calculatedOrigem = targetResponse?.supplierAddress || currentSupplierName + ', Moçambique';
                                const calculatedDestino = profile?.address || 'Província de Nampula, Moçambique';

                                setLogisticsFormFields({
                                  origem: calculatedOrigem,
                                  destino: calculatedDestino,
                                  tipoCarga: materialsList,
                                  peso: '12',
                                  volume: '24',
                                  prioridade: 'normal',
                                  dataDesejada: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                                  tipoVeiculo: 'caminhão pesado',
                                  observacoes: `Ordem Logística vinculada à Cotação #${targetResponse?.requestId || 'QT-01'}. Faturamento sob custódia SupplyX. Urgência: ALTA`,
                                  seguroCarga: 'Incluso (Fidelidade)',
                                  cargaFragil: false,
                                  temperaturaControlada: false
                                });

                                // Prep spreadsheet default fields as well
                                setSpreadsheetOrigem(calculatedOrigem);
                                setSpreadsheetDestino(calculatedDestino);
                                setSpreadsheetRows([
                                  { id: '1', name: '', quantity: '1', weight: '' }
                                ]);

                                setShowLogisticsQuestion(true);
                              } else {
                                handleCommitScenario();
                              }
                            }}
                            disabled={selectedScenario === null}
                            className="px-10 py-3.5 bg-[#0052CC] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand/20 hover:bg-[#0747A6] transition-all disabled:opacity-50 active:scale-95 flex items-center gap-2"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            {language === 'PT' ? 'Confirmar Agendamento' : 'Confirm Scheduling'}
                          </button>
                        </div>

                        {/* DECISION QUESTION MODAL */}
                        {showLogisticsQuestion && (
                          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.95, y: 15 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              className={`w-full max-w-[480px] border rounded-[32px] p-6 shadow-2xl relative flex flex-col ${
                                isDarkMode ? 'bg-zinc-900 border-white/5 text-white' : 'bg-white border-zinc-150 text-zinc-900'
                              }`}
                            >
                              {/* Top-right prominent close button */}
                              <button
                                type="button"
                                onClick={() => {
                                  setShowLogisticsQuestion(false);
                                  if (isDirectLogisticsRequest) {
                                    setShowForm(false);
                                    setIsDirectLogisticsRequest(false);
                                    setSelectedScenario(null);
                                    setPaymentSuccess(false);
                                    setStep(1);
                                  }
                                }}
                                className={`absolute top-5 right-5 p-2 rounded-full border transition-all pointer-events-auto z-10 ${
                                  isDarkMode 
                                    ? 'border-white/10 hover:border-white/20 text-zinc-400 hover:text-white hover:bg-white/5' 
                                    : 'border-zinc-200 hover:border-zinc-300 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                                }`}
                                aria-label="Close"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>

                              <div className="text-center py-4">
                                <div className="w-16 h-16 bg-[#0052CC]/10 text-[#0052CC] rounded-full flex items-center justify-center mx-auto mb-4">
                                  <Truck className="w-8 h-8" />
                                </div>
                                <h3 className="text-sm font-black uppercase tracking-wider mb-2">
                                  {language === 'PT' ? 'Configuração da Carga' : 'Cargo Setup'}
                                </h3>
                                <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-6">
                                  {language === 'PT' 
                                    ? 'Os produtos que deseja carregar/transportar são os que constam nesta cotação atual?' 
                                    : 'Are the products you want to transport the ones in this quote?'}
                                </p>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setShowLogisticsQuestion(false);
                                      setShowLogisticsReqForm(true);
                                    }}
                                    className="w-full py-4 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-md active:scale-95 flex flex-col items-center justify-center gap-1"
                                  >
                                    <span className="text-xs">✅ SIM</span>
                                    <span>{language === 'PT' ? 'Produtos da Cotação' : 'Products from Quote'}</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setShowLogisticsQuestion(false);
                                      setShowLogisticsSpreadsheet(true);
                                    }}
                                    className="w-full py-4 px-4 bg-amber-600 hover:bg-amber-700 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-md active:scale-95 flex flex-col items-center justify-center gap-1"
                                  >
                                    <span className="text-xs">❌ NÃO</span>
                                    <span>{language === 'PT' ? 'Outros (Preencher Planilha)' : 'Others (Fill Spreadsheet)'}</span>
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowLogisticsQuestion(false);
                                    if (isDirectLogisticsRequest) {
                                      setShowForm(false);
                                      setIsDirectLogisticsRequest(false);
                                      setSelectedScenario(null);
                                      setPaymentSuccess(false);
                                      setStep(1);
                                    }
                                  }}
                                  className={`mt-6 text-[9px] font-black uppercase tracking-widest transition-colors ${
                                    isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'
                                  }`}
                                >
                                  {language === 'PT' ? 'Cancelar e Voltar' : 'Cancel and Back'}
                                </button>
                              </div>
                            </motion.div>
                          </div>
                        )}

                        {/* SPREADSHEET MODAL */}
                        {showLogisticsSpreadsheet && (
                          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm overflow-y-auto w-full">
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.95, y: 15 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              className={`w-full max-w-[700px] border rounded-[32px] p-6 shadow-2xl relative flex flex-col max-h-[90vh] overflow-y-auto ${
                                isDarkMode ? 'bg-zinc-900 border-white/5 text-white' : 'bg-white border-zinc-150 text-zinc-900'
                              }`}
                            >
                              {/* Top-right prominent close button */}
                              <button
                                type="button"
                                onClick={() => {
                                  setShowLogisticsSpreadsheet(false);
                                  if (isDirectLogisticsRequest) {
                                    setShowForm(false);
                                    setIsDirectLogisticsRequest(false);
                                    setSelectedScenario(null);
                                    setPaymentSuccess(false);
                                    setStep(1);
                                  }
                                }}
                                className={`absolute top-5 right-5 p-2 rounded-full border transition-all ${
                                  isDarkMode 
                                    ? 'border-white/10 hover:border-white/20 text-zinc-400 hover:text-white hover:bg-white/5' 
                                    : 'border-zinc-200 hover:border-zinc-300 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                                }`}
                                aria-label="Close"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>

                              <div className="flex justify-between items-center mb-5 pb-3 border-b border-zinc-500/10">
                                <div className="flex items-center gap-3">
                                  <span className="p-2 bg-amber-500 text-white rounded-xl flex items-center justify-center">
                                    <FileText className="w-4 h-4" />
                                  </span>
                                  <div>
                                    <h3 className="text-xs font-black uppercase tracking-widest">
                                      {language === 'PT' ? 'Planilha de Carga Personalizada' : 'Custom Cargo Spreadsheet'}
                                    </h3>
                                    <p className="text-[9px] font-bold text-zinc-500 uppercase mt-1 tracking-wider">
                                       Preencha a relação de materiais, origem e destino
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-4 text-left">
                                {/* Origem (Localização de Carga) e Destino (Onde deixar a carga) */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-[8px] font-black uppercase text-zinc-500 tracking-wider block mb-1">Localização de Carga (Origem)</label>
                                    <input 
                                      type="text" 
                                      value={spreadsheetOrigem}
                                      onChange={e => setSpreadsheetOrigem(e.target.value)}
                                      placeholder={language === 'PT' ? 'Ex: Doca 4, Armazém Central, Maputo' : 'e.g. Warehouse A, Maputo'}
                                      className={`w-full p-2.5 rounded-xl border text-xs font-bold ${
                                        isDarkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                                      }`}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[8px] font-black uppercase text-zinc-500 tracking-wider block mb-1">Local onde a carga será deixada (Destino)</label>
                                    <input 
                                      type="text" 
                                      value={spreadsheetDestino}
                                      onChange={e => setSpreadsheetDestino(e.target.value)}
                                      placeholder={language === 'PT' ? 'Ex: Obra do Estádio, Nampula' : 'e.g. Stadium construction, Nampula'}
                                      className={`w-full p-2.5 rounded-xl border text-xs font-bold ${
                                        isDarkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                                      }`}
                                    />
                                  </div>
                                </div>

                                {/* Spreadsheet Table Container */}
                                <div className="border border-zinc-500/10 rounded-2xl overflow-hidden bg-zinc-950/20">
                                  <div className="grid grid-cols-12 gap-2 bg-zinc-950/40 p-2.5 border-b border-zinc-500/10 text-[8px] font-black uppercase tracking-widest text-zinc-500">
                                    <div className="col-span-6">{language === 'PT' ? 'Descrição do Produto/Material' : 'Material/Product Name'}</div>
                                    <div className="col-span-3 text-center">{language === 'PT' ? 'Quantidade' : 'Quantity'}</div>
                                    <div className="col-span-2 text-center">{language === 'PT' ? 'Peso (T)' : 'Weight (T)'}</div>
                                    <div className="col-span-1 text-right"></div>
                                  </div>

                                  <div className="divide-y divide-zinc-500/5 max-h-[220px] overflow-y-auto">
                                    {spreadsheetRows.map((row) => (
                                      <div key={row.id} className="grid grid-cols-12 gap-2 p-2 items-center">
                                        <div className="col-span-6">
                                          <input 
                                            type="text"
                                            value={row.name}
                                            onChange={(e) => handleSpreadsheetRowChange(row.id, 'name', e.target.value)}
                                            placeholder={language === 'PT' ? 'Ex: Tubos Galvanizados, Cimento' : 'e.g. Cement bag'}
                                            className={`w-full p-2 rounded-lg text-xs font-bold border-transparent focus:border-brand/45 focus:bg-transparent ${
                                              isDarkMode ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'
                                            }`}
                                          />
                                        </div>
                                        <div className="col-span-3">
                                          <input 
                                            type="number"
                                            value={row.quantity}
                                            onChange={(e) => handleSpreadsheetRowChange(row.id, 'quantity', e.target.value)}
                                            placeholder="1"
                                            className={`w-full p-2 text-center text-xs font-bold border-transparent focus:border-brand/45 focus:bg-transparent font-mono ${
                                              isDarkMode ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'
                                            }`}
                                          />
                                        </div>
                                        <div className="col-span-2">
                                          <input 
                                            type="number"
                                            value={row.weight}
                                            onChange={(e) => handleSpreadsheetRowChange(row.id, 'weight', e.target.value)}
                                            placeholder="0.5"
                                            step="0.1"
                                            className={`w-full p-2 text-center text-xs font-bold border-transparent focus:border-brand/45 focus:bg-transparent font-mono ${
                                              isDarkMode ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'
                                            }`}
                                          />
                                        </div>
                                        <div className="col-span-1 text-right">
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveSpreadsheetRow(row.id)}
                                            disabled={spreadsheetRows.length <= 1 && row.name === ''}
                                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  <div className="p-2 bg-zinc-950/20 border-t border-zinc-500/10 text-left">
                                    <button
                                      type="button"
                                      onClick={handleAddSpreadsheetRow}
                                      className="py-1.5 px-3 bg-[#0052CC]/10 hover:bg-[#0052CC]/25 text-[#0052CC] rounded-lg text-[8px] font-black uppercase tracking-widest transition-all"
                                    >
                                      + {language === 'PT' ? 'Adicionar Material' : 'Add Material'}
                                    </button>
                                  </div>

                                  {/* AI helper for Spreadsheet weights */}
                                  <div className="flex justify-between items-center p-3 rounded-2xl bg-[#0052CC]/5 border border-[#0052CC]/10 mt-3 text-left">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[14px]">🤖</span>
                                      <div>
                                        <p className="text-[9px] font-black uppercase text-[#0052CC]">Estimativa Inteligente de Peso</p>
                                        <p className="text-[8px] text-zinc-500 font-bold uppercase leading-none">Calculado automaticamente via IA enquanto você digita</p>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      disabled={isEstimatingWeight || spreadsheetRows.filter(r => r.name.trim() !== '').length === 0}
                                      onClick={handleEstimateWeight}
                                      className="px-4 py-2 bg-[#0052CC] text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:brightness-110 disabled:opacity-50 transition-all font-sans"
                                    >
                                      {isEstimatingWeight ? 'Estimando...' : '✦ Calcular Agora'}
                                    </button>
                                  </div>
                                </div>
                              </div>

                              <div className="flex justify-between items-center pt-5 border-t border-zinc-500/10 mt-6">
                                <button 
                                  type="button"
                                  onClick={() => {
                                    setShowLogisticsSpreadsheet(false);
                                    setShowLogisticsQuestion(true); // Return back to first question screen
                                  }}
                                  className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                    isDarkMode 
                                      ? 'text-zinc-300 bg-white/5 hover:bg-white/10 hover:text-white' 
                                      : 'text-zinc-700 bg-zinc-100 hover:bg-zinc-200 hover:text-zinc-950'
                                  }`}
                                >
                                  {language === 'PT' ? '← Voltar' : '← Back'}
                                </button>
                                <button 
                                  type="button"
                                  onClick={handleCommitSpreadsheetScenario}
                                  disabled={spreadsheetRows.filter((r) => r.name.trim() !== '').length === 0}
                                  className="px-8 py-2.5 bg-[#0052CC] text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg hover:bg-[#0747A6] disabled:opacity-50 transition-all flex items-center gap-2"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  {language === 'PT' ? 'Criar Despacho por Planilha' : 'Create Dispatch via Sheet'}
                                </button>
                              </div>
                            </motion.div>
                          </div>
                        )}

                        {/* HIGHLY INTERACTIVE POPUP MODAL FOR TRANSPORTATION REQUEST FORM */}
                        {showLogisticsReqForm && (
                          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm overflow-y-auto">
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.95, y: 15 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              className={`w-full max-w-[650px] border rounded-[32px] p-6 shadow-2xl relative flex flex-col max-h-[90vh] overflow-y-auto ${
                                isDarkMode ? 'bg-zinc-900 border-white/5 text-white' : 'bg-white border-zinc-150 text-zinc-900'
                              }`}
                            >
                              {/* Top-right prominent close button */}
                              <button
                                type="button"
                                onClick={() => {
                                  setShowLogisticsReqForm(false);
                                  if (isDirectLogisticsRequest) {
                                    setShowForm(false);
                                    setIsDirectLogisticsRequest(false);
                                    setSelectedScenario(null);
                                    setPaymentSuccess(false);
                                    setStep(1);
                                  }
                                }}
                                className={`absolute top-5 right-5 p-2 rounded-full border transition-all pointer-events-auto z-10 ${
                                  isDarkMode 
                                    ? 'border-white/10 hover:border-white/20 text-zinc-400 hover:text-white hover:bg-white/5' 
                                    : 'border-zinc-200 hover:border-zinc-300 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                                }`}
                                aria-label="Close"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                              <div className="flex justify-between items-center mb-5 pb-3 border-b border-zinc-500/10">
                                <div className="flex items-center gap-3">
                                  <span className="p-2 bg-[#0052CC] text-white rounded-xl flex items-center justify-center">
                                    <Truck className="w-4 h-4" />
                                  </span>
                                  <div>
                                    <h3 className="text-xs font-black uppercase tracking-widest">
                                      {language === 'PT' ? 'Fretamento Logístico Inteligente SupplyX' : 'Smart Logistics Dispatch'}
                                    </h3>
                                    <p className="text-[9px] font-bold text-zinc-500 uppercase mt-1 tracking-wider">
                                      Insira os parâmetros de cubagem e roteamento corporativo
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-4 text-left">
                                {/* Row 1: Local de Partida / Local de Chegada */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-[8px] font-black uppercase text-[#0052CC] tracking-wider block mb-1">Local de Partida (Origem)</label>
                                    <input 
                                      type="text" 
                                      placeholder="Ex. Maputo"
                                      value={logisticsFormFields.origem}
                                      onChange={e => setLogisticsFormFields({...logisticsFormFields, origem: e.target.value})}
                                      className={`w-full p-2.5 rounded-xl border text-xs font-bold ${
                                        isDarkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                                      }`}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[8px] font-black uppercase text-[#0052CC] tracking-wider block mb-1 font-sans">Local de Chegada (Destino)</label>
                                    <input 
                                      type="text" 
                                      placeholder="Ex. Beira"
                                      value={logisticsFormFields.destino}
                                      onChange={e => setLogisticsFormFields({...logisticsFormFields, destino: e.target.value})}
                                      className={`w-full p-2.5 rounded-xl border text-xs font-bold ${
                                        isDarkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                                      }`}
                                    />
                                  </div>
                                </div>

                                {/* Quilometragem Calculada HUD */}
                                {logisticsFormFields.origem && logisticsFormFields.destino && (
                                  <div className="p-3 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-between text-teal-400">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm">🛣️</span>
                                      <div className="text-left">
                                        <span className="text-[8px] font-black uppercase tracking-wider block text-teal-300 leading-none mb-0.5">Cálculo de Roteamento Inteligente</span>
                                        <span className="text-[10px] font-bold">Origem: {logisticsFormFields.origem} ➔ Destino: {logisticsFormFields.destino}</span>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-[8px] font-black uppercase tracking-wider block text-teal-300 leading-none mb-0.5">Distância Roteada</span>
                                      <span className="text-xs font-black tracking-tight">{calculateMozambiqueDistance(logisticsFormFields.origem, logisticsFormFields.destino)} KM</span>
                                    </div>
                                  </div>
                                )}

                                {/* Tabela de Alistamento de Mercadorias e Quantidades */}
                                <div className="p-4 rounded-2xl bg-zinc-950/40 border border-white/5 space-y-3 text-left">
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <label className="text-[8px] font-black uppercase text-zinc-400 tracking-wider block">Tabela de Mercadorias e Quantidades</label>
                                      <p className="text-[7.5px] font-bold text-zinc-500 uppercase mt-0.5 leading-none">Aliste os materiais e suas respectivas quantidades para o despacho</p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setLogisticsItemsTable([...logisticsItemsTable, { id: String(Date.now()), name: '', quantity: '1', weight: '0.1' }]);
                                      }}
                                      className="px-2.5 py-1 bg-[#0052CC]/10 border border-[#0052CC]/25 text-[#0052CC] hover:bg-[#0052CC]/20 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all"
                                    >
                                      + Adicionar Item
                                    </button>
                                  </div>
                                  
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                      <thead>
                                        <tr className="border-b border-white/5 text-[8px] font-black text-zinc-500 uppercase tracking-widest">
                                          <th className="pb-1.5">Material / Mercadoria</th>
                                          <th className="pb-1.5 w-24">Quantidade</th>
                                          <th className="pb-1.5 w-24">Peso (T)</th>
                                          <th className="pb-1.5 w-12 text-center">Remover</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-white/5">
                                        {logisticsItemsTable.map((item, index) => (
                                          <tr key={item.id} className="group/item">
                                            <td className="py-2 pr-2">
                                              <input
                                                type="text"
                                                placeholder="Ex. Cimento CP-II 50kg"
                                                value={item.name}
                                                onChange={(e) => {
                                                  const updated = [...logisticsItemsTable];
                                                  updated[index].name = e.target.value;
                                                  setLogisticsItemsTable(updated);
                                                }}
                                                className={`w-full p-1.5 rounded-lg text-[10px] font-bold ${
                                                  isDarkMode ? 'bg-zinc-900 border-white/5 text-white' : 'bg-white border-zinc-200 text-zinc-900'
                                                } border`}
                                              />
                                            </td>
                                            <td className="py-2 pr-2">
                                              <input
                                                type="number"
                                                min="1"
                                                placeholder="1"
                                                value={item.quantity}
                                                onChange={(e) => {
                                                  const updated = [...logisticsItemsTable];
                                                  updated[index].quantity = e.target.value;
                                                  setLogisticsItemsTable(updated);
                                                }}
                                                className={`w-full p-1.5 rounded-lg text-[10px] font-bold ${
                                                  isDarkMode ? 'bg-zinc-900 border-white/5 text-white' : 'bg-white border-zinc-200 text-zinc-900'
                                                } border`}
                                              />
                                            </td>
                                            <td className="py-2 pr-2">
                                              <input
                                                type="number"
                                                step="0.01"
                                                placeholder="0.1"
                                                value={item.weight}
                                                onChange={(e) => {
                                                  const updated = [...logisticsItemsTable];
                                                  updated[index].weight = e.target.value;
                                                  setLogisticsItemsTable(updated);
                                                }}
                                                className={`w-full p-1.5 rounded-lg text-[10px] font-bold ${
                                                  isDarkMode ? 'bg-zinc-900 border-white/5 text-white' : 'bg-white border-zinc-200 text-zinc-900'
                                                } border`}
                                              />
                                            </td>
                                            <td className="py-2 text-center">
                                              <button
                                                type="button"
                                                disabled={logisticsItemsTable.length <= 1}
                                                onClick={() => {
                                                  setLogisticsItemsTable(logisticsItemsTable.filter((_, idx) => idx !== index));
                                                }}
                                                className="text-zinc-500 hover:text-red-500 disabled:opacity-30 p-1"
                                              >
                                                <X className="w-3.5 h-3.5" />
                                              </button>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>

                                {/* Row 2: Tipo de Carga, Peso, Volume */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                    <label className="text-[8px] font-black uppercase text-zinc-500 tracking-wider block mb-1">Tipo de Carga</label>
                                    <input 
                                      type="text" 
                                      value={logisticsFormFields.tipoCarga}
                                      onChange={e => setLogisticsFormFields({...logisticsFormFields, tipoCarga: e.target.value})}
                                      className={`w-full p-2.5 rounded-xl border text-xs font-bold ${
                                        isDarkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                                      }`}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[8px] font-black uppercase text-zinc-500 tracking-wider block mb-1">Peso (Toneladas)</label>
                                    <input 
                                      type="number" 
                                      value={logisticsFormFields.peso}
                                      onChange={e => setLogisticsFormFields({...logisticsFormFields, peso: e.target.value})}
                                      className={`w-full p-2.5 rounded-xl border text-xs font-bold ${
                                        isDarkMode ? 'bg-zinc-950 border-white/5 text-white font-mono' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                                      }`}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[8px] font-black uppercase text-zinc-500 tracking-wider block mb-1">Volume Cubagem (m³)</label>
                                    <input 
                                      type="number" 
                                      value={logisticsFormFields.volume}
                                      onChange={e => setLogisticsFormFields({...logisticsFormFields, volume: e.target.value})}
                                      className={`w-full p-2.5 rounded-xl border text-xs font-bold ${
                                        isDarkMode ? 'bg-zinc-950 border-white/5 text-white font-mono' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                                      }`}
                                    />
                                  </div>

                                  {/* AI Weight & Volume Calculator trigger */}
                                  <div className="md:col-span-3 flex justify-between items-center p-3 rounded-2xl bg-[#0052CC]/5 border border-[#0052CC]/10 mt-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[14px]">🤖</span>
                                      <div className="text-left">
                                        <p className="text-[9px] font-black uppercase text-[#0052CC]">Estimador de Cubagem & Peso por IA</p>
                                        <p className="text-[8px] text-zinc-500 font-bold uppercase leading-none">Calcular com base na inteligência artificial do SupplyX</p>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      disabled={isEstimatingWeight}
                                      onClick={handleEstimateWeight}
                                      className="px-4 py-2 bg-[#0052CC] text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-1.5"
                                    >
                                      {isEstimatingWeight ? (
                                        <>Calculando...</>
                                      ) : (
                                        <>✦ Calcular com IA</>
                                      )}
                                    </button>
                                  </div>

                                  {/* AI Breakdown */}
                                  {aiWeightResult && (
                                    <div className="md:col-span-3 p-4 bg-zinc-950/40 rounded-xl border border-white/5 space-y-2 text-left">
                                      <p className="text-[8px] font-black uppercase tracking-wider text-emerald-400">Detalhamento Técnico Estimado</p>
                                      <div className="flex flex-col gap-1">
                                        {aiWeightResult.items?.map((item: any, idx: number) => (
                                          <div key={idx} className="flex justify-between items-center text-[10px] py-1 border-b border-white/[0.02]">
                                            <span className="font-bold text-zinc-300">{item.name} ({item.quantity})</span>
                                            <span className="font-mono font-black text-white">{item.estimatedWeightTons} T / {item.estimatedVolumeM3} m³</span>
                                          </div>
                                        ))}
                                      </div>
                                      <p className="text-[9px] text-zinc-400 italic mt-1 leading-relaxed">{aiWeightResult.totalExplanation}</p>
                                    </div>
                                  )}
                                </div>

                                {/* Row 3: Prioridade, Data Desejada, Veículo */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                    <label className="text-[8px] font-black uppercase text-zinc-500 tracking-wider block mb-1">Prioridade</label>
                                    <select
                                      value={logisticsFormFields.prioridade}
                                      onChange={e => setLogisticsFormFields({...logisticsFormFields, prioridade: e.target.value})}
                                      className={`w-full p-2.5 rounded-xl border text-xs font-bold uppercase ${
                                        isDarkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                                      }`}
                                    >
                                      <option value="normal">Urgência Normal</option>
                                      <option value="urgente">Urgência Crítica</option>
                                      <option value="expressa">Entrega Expressa</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-[8px] font-black uppercase text-zinc-500 tracking-wider block mb-1">Data de Entrega</label>
                                    <input 
                                      type="date" 
                                      value={logisticsFormFields.dataDesejada}
                                      onChange={e => setLogisticsFormFields({...logisticsFormFields, dataDesejada: e.target.value})}
                                      className={`w-full p-2.5 rounded-xl border text-xs font-bold ${
                                        isDarkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                                      }`}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[8px] font-black uppercase text-zinc-500 tracking-wider block mb-1">Veículo Recomendado</label>
                                    <select
                                      value={logisticsFormFields.tipoVeiculo}
                                      onChange={e => setLogisticsFormFields({...logisticsFormFields, tipoVeiculo: e.target.value})}
                                      className={`w-full p-2.5 rounded-xl border text-xs font-bold uppercase ${
                                        isDarkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                                      }`}
                                    >
                                      <option value="moto">Moto Express</option>
                                      <option value="pickup">Pickup / L300</option>
                                      <option value="caminhão pequeno">Camião Ligeiro Baú</option>
                                      <option value="caminhão pesado">Camião Pesado Graneleiro</option>
                                      <option value="contentor">Porta Contentor 40ft</option>
                                      <option value="refrigerado">Camião Refrigerado</option>
                                      <option value="tanque">Carga Líquida Tanque</option>
                                      <option value="plataforma">Prancha Plataforma Baixa</option>
                                    </select>
                                  </div>
                                </div>

                                {/* Row 4: Observações / Seguros */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-[8px] font-black uppercase text-zinc-500 tracking-wider block mb-1">Observações Despacho</label>
                                    <input 
                                      type="text"
                                      value={logisticsFormFields.observacoes}
                                      onChange={e => setLogisticsFormFields({...logisticsFormFields, observacoes: e.target.value})}
                                      className={`w-full p-2.5 rounded-xl border text-xs font-semibold ${
                                        isDarkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                                      }`}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[8px] font-black uppercase text-zinc-500 tracking-wider block mb-1 font-sans">Seguro da Carga</label>
                                    <input 
                                      type="text" 
                                      value={logisticsFormFields.seguroCarga}
                                      onChange={e => setLogisticsFormFields({...logisticsFormFields, seguroCarga: e.target.value})}
                                      className={`w-full p-2.5 rounded-xl border text-xs font-bold ${
                                        isDarkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                                      }`}
                                    />
                                  </div>
                                </div>

                                {/* Row 5: Flags (carga frágil, temperatura controlada) */}
                                <div className="flex items-center gap-6 p-3 rounded-xl bg-zinc-950/30 border border-white/[0.03]">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                      type="checkbox"
                                      checked={logisticsFormFields.cargaFragil}
                                      onChange={e => setLogisticsFormFields({...logisticsFormFields, cargaFragil: e.target.checked})}
                                      className="rounded-md border-transparent text-[#0052CC] w-3.5 h-3.5 bg-zinc-900"
                                    />
                                    <span className="text-[9px] uppercase font-black tracking-wider text-zinc-400">⚠ Carga Frágil</span>
                                  </label>

                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                      type="checkbox"
                                      checked={logisticsFormFields.temperaturaControlada}
                                      onChange={e => setLogisticsFormFields({...logisticsFormFields, temperaturaControlada: e.target.checked})}
                                      className="rounded-md border-transparent text-[#0052CC] w-3.5 h-3.5 bg-zinc-900"
                                    />
                                    <span className="text-[9px] uppercase font-black tracking-wider text-zinc-400">❄ Temp. Controlada (Refrigeração)</span>
                                  </label>
                                </div>
                              </div>

                              <div className="flex justify-between items-center pt-5 border-t border-zinc-500/10 mt-5">
                                <button 
                                  type="button"
                                  onClick={() => {
                                    setShowLogisticsReqForm(false);
                                    setShowLogisticsQuestion(true); // Return back to first question screen
                                  }}
                                  className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                    isDarkMode 
                                      ? 'text-zinc-300 bg-white/5 hover:bg-white/10 hover:text-white' 
                                      : 'text-zinc-700 bg-zinc-100 hover:bg-zinc-200 hover:text-zinc-950'
                                  }`}
                                >
                                  {language === 'PT' ? '← Voltar' : '← Back'}
                                </button>
                                <div className="flex gap-2">
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      setShowLogisticsReqForm(false);
                                      if (isDirectLogisticsRequest) {
                                        setShowForm(false);
                                        setIsDirectLogisticsRequest(false);
                                        setSelectedScenario(null);
                                        setPaymentSuccess(false);
                                        setStep(1);
                                      }
                                    }}
                                    className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors ${
                                      isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'
                                    }`}
                                  >
                                    {language === 'PT' ? 'Fechar' : 'Close'}
                                  </button>
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      setShowLogisticsReqForm(false);
                                      handleCommitScenario();
                                    }}
                                    className="px-7 py-2.5 bg-[#0052CC] text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg hover:bg-[#0747A6]"
                                  >
                                    {language === 'PT' ? 'Publicar Despacho no Marketplace' : 'Publish Dispatch in Marketplace'}
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex-grow flex flex-col items-center justify-center py-6 text-center">
                        <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/10 mb-6 relative">
                          {selectedScenario === 3 ? <Truck className="w-10 h-10 animate-bounce" /> : <CheckCircle2 className="w-10 h-10" />}
                          <motion.div 
                            initial={{ scale: 1, opacity: 0.5 }}
                            animate={{ scale: 1.6, opacity: 0 }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="absolute inset-0 bg-emerald-500 rounded-full"
                          />
                        </div>

                        <h4 className={`text-xl font-black italic uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                          {selectedScenario === 1 && (language === 'PT' ? 'Levantamento Próprio Agendado!' : 'Self-Pickup Scheduled!')}
                          {selectedScenario === 2 && (language === 'PT' ? 'Entrega pelo Fornecedor Ativada!' : 'Supplier Delivery Activated!')}
                          {selectedScenario === 3 && (language === 'PT' ? 'Ordem Logística Criada em Tempo-real!' : 'Logistics Request Active!')}
                        </h4>

                        <p className="text-zinc-500 text-xs font-bold mt-2 max-w-md">
                          {selectedScenario === 1 && (
                            language === 'PT' 
                              ? 'O faturamento foi concluído e os manifestos fiscais da guia de expedição foram liberados para levantamento pelo cliente.' 
                              : 'Requisition saved as Self-Pickup. Clearance paperwork has been delivered directly to the buyer.'
                          )}
                          {selectedScenario === 2 && (
                            language === 'PT' 
                              ? 'O fornecedor parceiro foi notificado em tempo-real para despachar a carga utilizando sua rota cooperativa própria.' 
                              : 'cooperative dispatch request sent. Supplier has been notified to execute transport from their corporate depot.'
                          )}
                          {selectedScenario === 3 && (
                            language === 'PT' 
                              ? 'A requisição de transporte público foi iniciada no ecossistema inteligente de lances e fretes da SupplyX. Transportadores cadastrados foram alertados.' 
                              : 'The automated public freight corridor proposal has been sent to the SupplyX Carriers Concourse with status: Em concurso.'
                          )}
                        </p>

                        {selectedScenario === 3 && newLogisticsId && (
                          <div className={`mt-6 p-4 rounded-2xl w-full max-w-sm text-left text-[11px] font-bold space-y-2 border ${isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-100 shadow-inner'}`}>
                            <div className="flex justify-between border-b border-zinc-500/10 pb-2">
                              <span className="text-zinc-500 uppercase text-[9px] tracking-wider">{language === 'PT' ? 'Identificador' : 'Load ID'}</span>
                              <span className="text-brand font-black tracking-tight">{newLogisticsId}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-zinc-500 uppercase text-[9px] tracking-wider">{language === 'PT' ? 'Status Concurso' : 'Status'}</span>
                              <span className="text-emerald-500 uppercase text-[9px] font-black tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded-md">Em concurso</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-zinc-500 uppercase text-[9px] tracking-wider">{language === 'PT' ? 'Fretagem' : 'Payer Responsibility'}</span>
                              <span className={isDarkMode ? 'text-white' : 'text-zinc-900'}>{language === 'PT' ? 'FOB (Pago pelo Cliente)' : 'FOB (Buyer Pays)'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-zinc-500 uppercase text-[9px] tracking-wider">{language === 'PT' ? 'Urgência' : 'Urgency'}</span>
                              <span className="text-rose-500 uppercase text-[9px] tracking-wider font-extrabold">ALTA</span>
                            </div>
                          </div>
                        )}

                        <div className="mt-8 flex flex-col sm:flex-row gap-3">
                          <button 
                            type="button"
                            onClick={() => {
                              setStep(1);
                              setPaymentSuccess(false);
                              setShowForm(false);
                              setScenarioCommitted(false);
                              setSelectedScenario(null);
                            }}
                            className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest border transition-all active:scale-95 ${
                              isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white' : 'bg-white border-zinc-100 text-zinc-600 hover:text-zinc-900 shadow-sm'
                            }`}
                          >
                            {language === 'PT' ? 'Voltar para Cotações' : 'Back to Quotes'}
                          </button>
                          
                          {selectedScenario === 3 && onNavigate && (
                            <button 
                              type="button"
                              onClick={() => {
                                setStep(1);
                                setPaymentSuccess(false);
                                setShowForm(false);
                                setScenarioCommitted(false);
                                setSelectedScenario(null);
                                onNavigate('Logística');
                              }}
                              className="px-8 py-4 bg-brand text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:brightness-110 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                              <Truck className="w-4 h-4" />
                              {language === 'PT' ? 'Ver no Painel Logístico' : 'Monitor Logistics'}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    <div className="space-y-6">
                      <h4 className={`text-xs font-black uppercase tracking-widest text-zinc-500`}>{t.paymentMethods}</h4>
                      <div className="grid grid-cols-1 gap-3">
                        {paymentMethods.map(method => (
                          <button 
                            key={method.id}
                            onClick={() => setSelectedPaymentMethod(method.id)}
                            className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-4 relative overflow-hidden group ${
                              selectedPaymentMethod === method.id 
                                ? 'border-[#0052CC] bg-[#0052CC]/5 shadow-brand' 
                                : isDarkMode ? 'border-[#27272a] bg-[#18181b]/50 hover:border-[#3f3f46]' : 'border-[#f4f4f5] bg-white hover:border-[#e4e4e7]'
                            }`}
                          >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${method.color} shadow-lg transition-transform group-hover:scale-105`}>
                              {method.type === 'Bank' ? <Building2 className="w-6 h-6 text-white" /> : <Smartphone className="w-6 h-6 text-white" />}
                            </div>
                            <div className="text-left">
                              <p className={`text-sm font-black uppercase italic tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{method.name}</p>
                              <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mt-0.5">{method.type === 'Bank' ? t.bankTransfer : t.mobileWallet}</p>
                            </div>
                            {selectedPaymentMethod === method.id && (
                              <div className="absolute top-2 right-2">
                                <CheckCircle2 className="w-4 h-4 text-brand" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className={`p-8 rounded-3xl border flex flex-col h-full ${isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
                      <div className="flex-grow">
                        <div className="flex justify-between items-center mb-6 border-b border-zinc-500/10 pb-6">
                          <h4 className={`text-xs font-black uppercase tracking-widest text-zinc-500`}>{t.orderSummary}</h4>
                          <span className="text-[10px] font-black uppercase text-brand">{t.payTo}: {aiResponses[selectedResponseIndex]?.name}</span>
                        </div>
                        
                        <div className="space-y-4 mb-8">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t.subtotal}</span>
                            <span className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>MT {aiResponses[selectedResponseIndex]?.price.toLocaleString('pt-BR')}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t.opFees}</span>
                            <span className={`text-sm font-black text-emerald-500`}>MT 0.00</span>
                          </div>
                        </div>

                        <div className={`p-6 rounded-2xl mb-8 ${isDarkMode ? 'bg-zinc-900' : 'bg-white shadow-sm'}`}>
                          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">{t.finalTotal}</p>
                          <p className="text-4xl font-black italic tracking-tighter text-brand">MT {aiResponses[selectedResponseIndex]?.price.toLocaleString('pt-BR')}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <button 
                          onClick={handlePayment}
                          disabled={!selectedPaymentMethod || isPaying}
                          className="w-full py-4 bg-[#0052CC] text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-brand hover:bg-[#0747A6] transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                          {isPaying ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                          {t.confirmPaymentBtn}
                        </button>
                        <button 
                          onClick={() => setStep(2)}
                          className={`w-full py-4 text-[10px] font-black uppercase tracking-widest transition-all ${isDarkMode ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-zinc-900'}`}
                        >
                          {t.backToQuotes}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {isPreviewOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              key="orders-preview-backdrop"
              className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-zinc-950/80 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-[900px] max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
              >
                <div className="p-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#0f9fa8] rounded-lg flex items-center justify-center text-white">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h3 className="font-black uppercase tracking-tight italic text-zinc-900">
                      {language === 'PT' ? 'Pré-visualização da Cotação' : 'Quotation Preview'}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={async () => {
                        const res = aiResponses[selectedResponseIndex];
                        if (res) {
                          setDownloadingIndex(selectedResponseIndex);
                          try {
                            await downloadPDF(res);
                          } finally {
                            setDownloadingIndex(null);
                          }
                        }
                      }}
                      disabled={downloadingIndex === selectedResponseIndex}
                      className="p-2 text-zinc-400 hover:text-[#0f9fa8] transition-colors disabled:opacity-50"
                      title={t.download}
                    >
                      {downloadingIndex === selectedResponseIndex ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                    </button>
                    <button 
                      onClick={() => setIsPreviewOpen(false)}
                      className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="flex-grow overflow-auto p-4 sm:p-8 bg-zinc-100 shadow-inner flex flex-col items-center">
                  <div className="max-w-[210mm] w-full">
                    <QuotationDocument data={quotationData} language={language} />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
      {invoiceTemplate}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
        <div>
          <h2 className={`text-2xl font-black uppercase italic tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
            {userType === 'supplier' ? t.receivedRequests : t.orderManagement}
          </h2>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-1">
            {language === 'PT' ? 'Intermediação e Controle Documental' : 'Intermediation and Document Control'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button 
            onClick={exportOrdersToPDF}
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 border ${
              isDarkMode 
                ? 'bg-zinc-900/50 border-white/5 text-zinc-300 hover:text-white backdrop-blur-md' 
                : 'bg-white border-zinc-100 text-zinc-500 hover:text-zinc-900 shadow-sm'
            }`}
          >
            <FileText className="w-4 h-4" /> {language === 'PT' ? 'Exportar PDF' : 'Export PDF'}
          </button>
          <button 
            onClick={exportOrdersToExcel}
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 border ${
              isDarkMode 
                ? 'bg-zinc-900/50 border-white/5 text-zinc-300 hover:text-white backdrop-blur-md' 
                : 'bg-white border-zinc-100 text-zinc-500 hover:text-zinc-900 shadow-sm'
            }`}
          >
            <Download className="w-4 h-4" /> {t.excel}
          </button>
          {userType === 'buyer' && (
            <button 
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 bg-brand text-white shadow-xl shadow-brand/20 hover:brightness-110 ml-2"
            >
              <Plus className="w-4 h-4" /> {t.newQuoteBtn}
            </button>
          )}
        </div>
      </div>
      <div className="w-full">
        <div className="space-y-8">
          {/* Folders Layout for Quotation Requests */}
          <div className="space-y-6">
            {/* Recent/New Folder */}
            <div className={`overflow-hidden rounded-[32px] border transition-all duration-300 ${
              isDarkMode ? 'border-white/5 bg-zinc-950/20' : 'border-zinc-150 bg-white/60 shadow-sm'
            }`}>
              <div 
                onClick={() => setRecentFolderOpen(!recentFolderOpen)}
                className={`cursor-pointer transition-all duration-300 p-5 sm:p-6 flex items-center justify-between gap-4 border-b ${
                  recentFolderOpen 
                    ? (isDarkMode ? 'bg-zinc-900 border-white/5' : 'bg-zinc-50 border-zinc-100')
                    : 'border-transparent hover:bg-zinc-500/5'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl transition-all duration-300 ${
                    recentFolderOpen
                      ? (isDarkMode ? 'bg-brand/20 text-brand' : 'bg-brand/10 text-brand-dark')
                      : (isDarkMode ? 'bg-zinc-900 text-zinc-505' : 'bg-zinc-100 text-zinc-400')
                  }`}>
                    {recentFolderOpen ? <FolderOpen className="w-6 h-6" /> : <Folder className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className={`text-sm sm:text-base font-black uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                      {language === 'PT' ? 'Pasta: Pedidos Recentes' : 'Folder: Recent Requests'}
                    </h3>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-brand animate-pulse shrink-0" />
                      {partitionedQuotations.recentReal.length + partitionedQuotations.recentMock.length} {language === 'PT' ? 'itens ativos' : 'active items'}
                    </p>
                  </div>
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300 ${
                  isDarkMode ? 'border-white/5 bg-zinc-900' : 'border-zinc-200 bg-zinc-50'
                }`}>
                  <svg 
                    className={`w-3.5 h-3.5 transition-transform duration-300 ${recentFolderOpen ? 'transform rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              
              <AnimatePresence initial={false}>
                {recentFolderOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="p-5 sm:p-6 space-y-4">
                      {partitionedQuotations.recentReal.length + partitionedQuotations.recentMock.length === 0 ? (
                        <div className="py-8 text-center text-zinc-400 text-xs font-black uppercase tracking-widest">
                          {language === 'PT' ? 'Esta pasta está vazia' : 'This folder is empty'}
                        </div>
                      ) : (
                        <>
                          {partitionedQuotations.recentReal.map((order) => renderQuotationCard(order, false))}
                          {partitionedQuotations.recentMock.map((order) => renderQuotationCard(order, true))}
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Old/Past Folder */}
            <div className={`overflow-hidden rounded-[32px] border transition-all duration-300 ${
              isDarkMode ? 'border-white/5 bg-zinc-950/20' : 'border-zinc-150 bg-white/60 shadow-sm'
            }`}>
              <div 
                onClick={() => setOldFolderOpen(!oldFolderOpen)}
                className={`cursor-pointer transition-all duration-300 p-5 sm:p-6 flex items-center justify-between gap-4 border-b ${
                  oldFolderOpen 
                    ? (isDarkMode ? 'bg-zinc-900 border-white/5' : 'bg-zinc-50 border-zinc-100')
                    : 'border-transparent hover:bg-zinc-500/5'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl transition-all duration-300 ${
                    oldFolderOpen
                      ? (isDarkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-200 text-zinc-600')
                      : (isDarkMode ? 'bg-zinc-900 text-zinc-505' : 'bg-zinc-100 text-zinc-400')
                  }`}>
                    {oldFolderOpen ? <FolderOpen className="w-6 h-6" /> : <Folder className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className={`text-sm sm:text-base font-black uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                      {language === 'PT' ? 'Pasta: Pedidos Antigos' : 'Folder: Old Requests'}
                    </h3>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-zinc-400 shrink-0" />
                      {partitionedQuotations.oldReal.length + partitionedQuotations.oldMock.length} {language === 'PT' ? 'itens históricos' : 'historical items'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(partitionedQuotations.oldReal.length + partitionedQuotations.oldMock.length > 0) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        clearOldFolder();
                      }}
                      className={`p-2 rounded-xl transition-all ${
                        isDarkMode 
                          ? 'bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white' 
                          : 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white'
                      }`}
                      title={language === 'PT' ? 'Esvaziar pasta de pedidos antigos' : 'Clear old requests folder'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300 ${
                    isDarkMode ? 'border-white/5 bg-zinc-900' : 'border-zinc-200 bg-zinc-50'
                  }`}>
                    <svg 
                      className={`w-3.5 h-3.5 transition-transform duration-300 ${oldFolderOpen ? 'transform rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <AnimatePresence initial={false}>
                {oldFolderOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="p-5 sm:p-6 space-y-4">
                      {partitionedQuotations.oldReal.length + partitionedQuotations.oldMock.length === 0 ? (
                        <div className="py-8 text-center text-zinc-400 text-xs font-black uppercase tracking-widest">
                          {language === 'PT' ? 'Esta pasta está vazia' : 'This folder is empty'}
                        </div>
                      ) : (
                        <>
                          {partitionedQuotations.oldReal.map((order) => renderQuotationCard(order, false))}
                          {partitionedQuotations.oldMock.map((order) => renderQuotationCard(order, true))}
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Empty state if any */}
          {!partitionedQuotations.hasRecent && !partitionedQuotations.hasOld && (
            <div className={`p-12 text-center rounded-[32px] border ${isDarkMode ? 'bg-supplyx-dark border-white/5' : 'bg-white border-zinc-100 shadow-sm'}`}>
              <FileText className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
              <p className={`text-sm font-black uppercase tracking-widest ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                {language === 'PT' ? 'Nenhum pedido de cotação encontrado' : 'No quotation requests found'}
              </p>
            </div>
          )}
        </div>

        <div className="hidden">
          {displayedQuotations.map((order) => (
            <motion.div 
              key={order.id} 
              whileHover={{ y: -4 }}
              className={`p-5 sm:p-6 rounded-[28px] sm:rounded-[32px] border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 transition-all cursor-pointer group relative overflow-hidden ${
                isDarkMode 
                  ? 'bg-supplyx-dark border-white/5 hover:border-supplyx-blue/50 shadow-2xl shadow-black/20' 
                  : 'bg-white border-zinc-100 hover:border-supplyx-blue/30 shadow-sm hover:shadow-xl hover:shadow-zinc-200/50'
              }`}
            >
              <div className="flex items-center gap-4 sm:gap-5 w-full sm:w-auto relative z-10">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-[18px] sm:rounded-[20px] flex items-center justify-center border transition-all shrink-0 ${
                  isDarkMode 
                    ? 'bg-zinc-800/50 border-white/5 group-hover:bg-supplyx-blue/10 group-hover:border-supplyx-blue/20' 
                    : 'bg-zinc-50 border-zinc-100 group-hover:bg-supplyx-blue/5 group-hover:border-supplyx-blue/10'
                }`}>
                  <FileText className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors ${isDarkMode ? 'text-zinc-500 group-hover:text-supplyx-blue' : 'text-zinc-400 group-hover:text-supplyx-blue'}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className={`text-base sm:text-lg font-black italic tracking-tight transition-colors truncate ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{order.requestId || order.id}</h4>
                    {(order.status === t.status.quote || order.status === 'pending') && (
                       <span className="w-1.5 h-1.5 rounded-full bg-supplyx-blue animate-pulse" />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <p 
                      className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-zinc-500 cursor-pointer hover:text-supplyx-blue transition-colors flex items-center gap-2 truncate"
                      onClick={(e) => {
                        e.stopPropagation();
                        const profileId = userType === 'supplier' ? order.buyerId : order.supplierId;
                        if (profileId) {
                          setViewingProfileId(profileId);
                          setIsProfileModalOpen(true);
                        }
                      }}
                    >
                      <User className="w-3 h-3 shrink-0" />
                      <span className="truncate">
                        {userType === 'supplier' ? `${t.client}: ${order.buyerName || 'Client'}` : `${t.supplier}: ${order.supplierName}`}
                      </span>
                    </p>
                    {((userType === 'supplier' && order.buyerId && verifiedUsersMap.has(order.buyerId)) || 
                      (userType !== 'supplier' && order.supplierId && verifiedUsersMap.has(order.supplierId))) && (
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500/10 shrink-0" />
                    )}
                  </div>
                </div>
                
                {/* Mobile Status Badge */}
                <div className="sm:hidden shrink-0">
                  <div className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border
                    ${order.status === t.status.delivered ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                      order.status === t.status.transit ? 'bg-supplyx-blue/10 text-supplyx-blue border-supplyx-blue/20' :
                      (order.status === t.status.waiting || order.status === 'responded') ? 'bg-amber-500/10 text-amber-500 border-amber-500/10' :
                      'bg-indigo-500/10 text-indigo-500 border-indigo-500/10'}`}>
                    {order.status === 'pending' ? t.status.quote : (order.status === 'responded' ? t.status.waiting : order.status)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-10 w-full sm:w-auto p-4 sm:p-0 rounded-2xl bg-zinc-900/5 sm:bg-transparent relative z-10">
                <div className="text-left sm:text-right">
                  <p className={`text-lg sm:text-xl font-black italic tracking-tighter leading-none mb-1 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                    MT {order.totalAmount?.toLocaleString('pt-BR') || '0.00'}
                  </p>
                  <p className="text-[8px] sm:text-[9px] text-zinc-500 font-bold uppercase tracking-[0.2em]">
                    {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : new Date().toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex items-center gap-2 sm:gap-4">
                  {/* Desktop Only Status */}
                  <div className={`hidden sm:block px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border
                    ${order.status === t.status.delivered ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                      order.status === t.status.transit ? 'bg-supplyx-blue/10 text-supplyx-blue border-supplyx-blue/20' :
                      (order.status === t.status.waiting || order.status === 'responded') ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                      'bg-indigo-500/10 text-indigo-500 border-indigo-500/10'}`}>
                    {order.status === 'pending' ? t.status.quote : (order.status === 'responded' ? t.status.waiting : order.status)}
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <button 
                      onClick={async (e) => {
                        e.stopPropagation();
                        // Download PDF logic for real quotations
                        setDownloadingOrderId(order.id);
                        try {
                           setActivePdfQuote(order);
                           // Wait for useMemo/DOM to update
                           await new Promise(resolve => setTimeout(resolve, 500));
                           
                           const mockRes: SupplierResponse = {
                              supplierId: order.supplierId,
                              name: order.supplierName,
                              price: order.totalAmount || 0,
                              timeToDeliver: '2 dias',
                              confidence: order.confidence || 0,
                              itemPrices: []
                           };
                           await downloadPDF(mockRes);
                           setActivePdfQuote(null);
                        } finally {
                          setDownloadingOrderId(null);
                        }
                      }}
                      disabled={downloadingOrderId === order.id}
                      className={`p-2 sm:p-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-50 ${isDarkMode ? 'bg-white/5 text-zinc-400 hover:text-white' : 'bg-zinc-50 text-zinc-500 hover:text-zinc-900'}`}
                    >
                      {downloadingOrderId === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        startChat(order);
                      }}
                      className={`p-2 sm:p-2.5 rounded-xl transition-all active:scale-95 ${isDarkMode ? 'bg-white/5 text-zinc-400 hover:text-supplyx-blue' : 'bg-zinc-50 text-zinc-500 hover:text-supplyx-blue'}`}
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Populate logistics form parameters for this specific quote/order
                        const currentSupplierName = order.supplierName || 'Fornecedor Parceiro';
                        let materialsList = order.materials?.map((m: any) => typeof m === 'object' ? m.name : m).filter(Boolean).join(', ');
                        if (!materialsList && order.items) {
                          materialsList = order.items.map((it: any) => it.material || it.description).filter(Boolean).join(', ');
                        }
                        if (!materialsList) materialsList = 'Materiais de Construção B2B';

                        const calculatedOrigem = order.supplierAddress || currentSupplierName + ', Moçambique';
                        const calculatedDestino = profile?.address || order.buyerName || 'Província de Nampula, Moçambique';

                        setLogisticsFormFields({
                          origem: calculatedOrigem,
                          destino: calculatedDestino,
                          tipoCarga: materialsList,
                          peso: '12',
                          volume: '24',
                          prioridade: 'normal',
                          dataDesejada: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                          tipoVeiculo: 'caminhão pesado',
                          observacoes: `Ordem Logística vinculada à Cotação #${order.id || 'QT-01'}. Faturamento sob custódia SupplyX. Urgência: ALTA`,
                          seguroCarga: 'Incluso (Fidelidade)',
                          cargaFragil: false,
                          temperaturaControlada: false
                        });

                        // Prep spreadsheet default fields as well
                        setSpreadsheetOrigem(calculatedOrigem);
                        setSpreadsheetDestino(calculatedDestino);
                        setSpreadsheetRows([
                          { id: '1', name: '', quantity: '1', weight: '' }
                        ]);

                        // Remember the order we are responding to
                        setRespondingTo(order);
                        
                        // Switch view settings to render correctly
                        setIsDirectLogisticsRequest(true);
                        setShowForm(true);
                        setStep(4);
                        setPaymentSuccess(true);
                        setSelectedScenario(3);
                        
                        // Show the logistics question popup on screen
                        setShowLogisticsQuestion(true);
                      }}
                      className="px-3.5 py-2.5 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      {language === 'PT' ? 'Atribuir Carga ao Logístico' : 'Assign Cargo to Logistics'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {/* Keep hardcoded orders for now to avoid empty list feeling if no real data */}
          {getOrders(t).map((order) => (
            <motion.div 
              key={order.id} 
              whileHover={{ y: -4 }}
              className={`p-5 sm:p-6 rounded-[28px] sm:rounded-[32px] border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 transition-all cursor-pointer group relative overflow-hidden ${
                isDarkMode 
                  ? 'bg-supplyx-dark border-white/5 hover:border-supplyx-blue/50 shadow-2xl shadow-black/20' 
                  : 'bg-white border-zinc-100 hover:border-supplyx-blue/30 shadow-sm hover:shadow-xl hover:shadow-zinc-200/50'
              }`}
            >
              <div className="flex items-center gap-4 sm:gap-5 w-full sm:w-auto relative z-10">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-[18px] sm:rounded-[20px] flex items-center justify-center border transition-all shrink-0 ${
                  isDarkMode 
                    ? 'bg-zinc-800/50 border-white/5 group-hover:bg-supplyx-blue/10 group-hover:border-supplyx-blue/20' 
                    : 'bg-zinc-50 border-zinc-100 group-hover:bg-supplyx-blue/5 group-hover:border-supplyx-blue/10'
                }`}>
                  <FileText className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors ${isDarkMode ? 'text-zinc-500 group-hover:text-supplyx-blue' : 'text-zinc-400 group-hover:text-supplyx-blue'}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className={`text-base sm:text-lg font-black italic tracking-tight transition-colors truncate ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{order.id}</h4>
                    {order.status === t.status.quote && (
                       <span className="w-1.5 h-1.5 rounded-full bg-supplyx-blue animate-pulse" />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <p 
                      className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-zinc-500 cursor-pointer hover:text-supplyx-blue transition-colors flex items-center gap-2 truncate"
                      onClick={(e) => {
                        e.stopPropagation();
                        const profileId = userType === 'supplier' ? 'buyer_demo_uid' : (order as any).supplierId;
                        if (profileId) {
                          setViewingProfileId(profileId);
                          setIsProfileModalOpen(true);
                        }
                      }}
                    >
                      <User className="w-3 h-3 shrink-0" />
                      <span className="truncate">
                        {userType === 'supplier' ? `${t.client}: Manhate Jr` : `${t.supplier}: ${order.supplier}`}
                      </span>
                    </p>
                    {((userType === 'supplier' && verifiedUsersMap.has('buyer_demo_uid')) || 
                      (userType !== 'supplier' && (order as any).supplierId && verifiedUsersMap.has((order as any).supplierId))) && (
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500/10 shrink-0" />
                    )}
                  </div>
                </div>
                
                {/* Mobile Status Badge */}
                <div className="sm:hidden shrink-0">
                  <div className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border
                    ${order.status === t.status.delivered ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                      order.status === t.status.transit ? 'bg-supplyx-blue/10 text-supplyx-blue border-supplyx-blue/20' :
                      order.status === t.status.waiting ? 'bg-amber-500/10 text-amber-500 border-amber-500/10' :
                      'bg-indigo-500/10 text-indigo-500 border-indigo-500/10'}`}>
                    {order.status}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-10 w-full sm:w-auto p-4 sm:p-0 rounded-2xl bg-zinc-900/5 sm:bg-transparent relative z-10">
                <div className="text-left sm:text-right">
                  <p className={`text-lg sm:text-xl font-black italic tracking-tighter leading-none mb-1 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{order.total}</p>
                  <p className="text-[8px] sm:text-[9px] text-zinc-500 font-bold uppercase tracking-[0.2em]">{order.date}</p>
                </div>
                
                <div className="flex items-center gap-2 sm:gap-4">
                  {/* Desktop Only Status */}
                  <div className={`hidden sm:block px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border
                    ${order.status === t.status.delivered ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                      order.status === t.status.transit ? 'bg-supplyx-blue/10 text-supplyx-blue border-supplyx-blue/20' :
                      order.status === t.status.waiting ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                      'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'}`}>
                    {order.status}
                  </div>
                  
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {order.status === t.status.quote && (
                      <button 
                        onClick={async (e) => {
                          e.stopPropagation();
                          setDownloadingOrderId(order.id);
                          try {
                            const mockRes: SupplierResponse = {
                               supplierId: (order as any).supplierId || 'S1',
                               name: order.supplier,
                               price: parseFloat(order.total.replace('MT ', '').replace('.', '').replace(',', '.')) || 12450,
                               timeToDeliver: '2 dias',
                               confidence: 95,
                               itemPrices: ((order as any).items || []).map((it: any) => ({ material: it.description, price: it.unitPrice || 0 }))
                            };
                            setSelectedResponseIndex(0);
                            await downloadPDF(mockRes);
                          } finally {
                            setDownloadingOrderId(null);
                          }
                        }}
                        disabled={downloadingOrderId === order.id}
                        className={`p-2 sm:p-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-50 ${isDarkMode ? 'bg-white/5 text-zinc-400 hover:text-white' : 'bg-zinc-50 text-zinc-500 hover:text-zinc-900'}`}
                      >
                        {downloadingOrderId === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      </button>
                    )}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        startChat(order);
                      }}
                      className={`p-2 sm:p-2.5 rounded-xl transition-all active:scale-95 ${isDarkMode ? 'bg-white/5 text-zinc-400 hover:text-supplyx-blue' : 'bg-zinc-50 text-zinc-500 hover:text-supplyx-blue'}`}
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const currentSupplierName = order.supplier || 'Fornecedor Parceiro';
                        const calculatedOrigem = currentSupplierName + ', Moçambique';
                        const calculatedDestino = profile?.address || 'Província de Nampula, Moçambique';

                        setLogisticsFormFields({
                          origem: calculatedOrigem,
                          destino: calculatedDestino,
                          tipoCarga: 'Materiais de Construção B2B',
                          peso: '12',
                          volume: '24',
                          prioridade: 'normal',
                          dataDesejada: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                          tipoVeiculo: 'caminhão pesado',
                          observacoes: `Ordem Logística vinculada à Cotação #${order.id || 'QT-01'}. Faturamento sob custódia SupplyX. Urgência: ALTA`,
                          seguroCarga: 'Incluso (Fidelidade)',
                          cargaFragil: false,
                          temperaturaControlada: false
                        });

                        setSpreadsheetOrigem(calculatedOrigem);
                        setSpreadsheetDestino(calculatedDestino);
                        setSpreadsheetRows([
                          { id: '1', name: '', quantity: '1', weight: '' }
                        ]);

                        setRespondingTo(order);
                        setIsDirectLogisticsRequest(true);
                        setShowForm(true);
                        setStep(4);
                        setPaymentSuccess(true);
                        setSelectedScenario(3);
                        setShowLogisticsQuestion(true);
                      }}
                      className="px-3.5 py-2.5 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      {language === 'PT' ? 'Atribuir Carga ao Logístico' : 'Assign Cargo to Logistics'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {selectedRealQuoteForPreview && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-sm">
          <div 
            className={`w-full max-w-[950px] max-h-[92vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col ${
              isDarkMode ? 'bg-zinc-900 border border-white/5 text-white' : 'bg-white text-zinc-950'
            }`}
          >
            {/* Header */}
            <div className="p-6 border-b border-zinc-200 dark:border-white/5 flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/50">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-supplyx-blue" />
                <h3 className={`font-black uppercase tracking-tight italic ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                  {language === 'PT' ? 'Visualizar Cotação/Pedido' : 'View Quotation/Order'}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedRealQuoteForPreview(null)}
                className={`p-2 rounded-xl transition-all active:scale-95 ${
                  isDarkMode ? 'hover:bg-white/5 text-zinc-400 hover:text-white' : 'hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Document Content */}
            <div className="flex-grow overflow-auto p-4 sm:p-8 bg-zinc-100 dark:bg-zinc-950 flex flex-col items-center">
              <div className="max-w-[210mm] w-full bg-white rounded-2xl shadow-xl p-4 sm:p-8 text-zinc-900">
                <QuotationDocument data={getPreviewData(selectedRealQuoteForPreview)} language={language} />
              </div>
            </div>
          </div>
        </div>
      )}

      {isMarketModalOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-sm animate-fadeIn">
          <div 
            className={`w-full max-w-[1200px] max-h-[92vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col ${
              isDarkMode ? 'bg-zinc-900 border border-white/5 text-white' : 'bg-white text-zinc-950'
            }`}
          >
            {/* Header */}
            <div className="p-6 border-b border-zinc-200 dark:border-white/5 flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/50">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-supplyx-blue" />
                <h3 className={`font-black uppercase tracking-tight italic ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                  {language === 'PT' ? 'Saúde do Mercado em Tempo Real' : 'Real-Time Market Health'}
                </h3>
              </div>
              <button 
                onClick={() => setIsMarketModalOpen(false)}
                className={`p-2 rounded-xl transition-all active:scale-95 ${
                  isDarkMode ? 'hover:bg-white/5 text-zinc-400 hover:text-white' : 'hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Content */}
            <div className="flex-grow overflow-y-auto p-4 sm:p-6 bg-zinc-50 dark:bg-zinc-950">
              <MarketHealthView isDarkMode={isDarkMode} language={language as 'PT' | 'EN'} />
            </div>
          </div>
        </div>
      )}

      <ProfileModal 
        userId={viewingProfileId || ''}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onEdit={() => onNavigate?.('Ajustes')}
        isDarkMode={isDarkMode}
      />
    </motion.div>
  );
}
