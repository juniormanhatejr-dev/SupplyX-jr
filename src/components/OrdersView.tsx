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
} from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc, serverTimestamp, getDocs, getDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import ProfileModal from './ProfileModal';
import QuotationDocument from './QuotationDocument';
import { notificationService } from '../services/notificationService';

const availableSuppliers = [
  { id: 'S1', name: 'CONSTRUCENTER BEIRA', quality: 'A+', segment: 'Geral' },
  { id: 'S2', name: 'Votorantim', quality: 'A', segment: 'Básicos' },
  { id: 'S3', name: 'Saint-Gobain', quality: 'B+', segment: 'Acabamento' },
  { id: 'S4', name: 'Tigre S.A.', quality: 'A+', segment: 'Hidráulica' },
  { id: 'S5', name: 'Mineradora Vale', quality: 'A', segment: 'Básicos' },
];

const getOrders = (t: any) => [
  { id: 'OC-2401', supplier: t.supplierNames.votorantim, supplierId: 'S2', total: 'MT 12.450,00', status: t.status.delivered, date: '04/05/2024', itemsCount: 5 },
  { id: 'OC-2402', supplier: t.supplierNames.gerdau, supplierId: 'S1', total: 'MT 45.890,00', status: t.status.transit, date: '05/05/2024', itemsCount: 12 },
  { id: 'OC-2403', supplier: t.supplierNames.tigre, supplierId: 'S4', total: 'MT 3.210,00', status: t.status.waiting, date: '05/05/2024', itemsCount: 3 },
  { id: 'RTF-992', supplier: t.multiSuppliers, supplierId: 'multi', total: 'N/A', status: t.status.quote, date: '06/05/2024', itemsCount: 8 },
];

interface OrdersViewProps {
  startWithForm?: boolean;
  onFormClose?: () => void;
  onNavigate?: (tab: string, payload?: any) => void;
  isDarkMode?: boolean;
  language?: 'PT' | 'EN';
  userType?: 'buyer' | 'supplier';
}

interface SupplierResponse {
  supplierId: string;
  name: string;
  price: number;
  timeToDeliver: string;
  confidence: number;
  itemPrices: { material: string; price: number }[];
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
      <td className="px-4 py-4">
         <input 
           type="number" 
           value={row.price} 
           onChange={(e) => onUpdate(row.id, 'price', e.target.value)}
           className={`w-full bg-transparent border-none text-right text-[13px] font-black italic outline-none ${isDarkMode ? 'text-zinc-300' : 'text-zinc-900'}`}
         />
      </td>
      <td className="px-4 py-4 text-center">
         <input 
           type="number" 
           value={row.discCmr} 
           onChange={(e) => onUpdate(row.id, 'discCmr', e.target.value)}
           className={`w-full bg-transparent border-none text-center text-[11px] font-bold outline-none text-red-500`}
         />
      </td>
      <td className="px-4 py-4 text-center">
         <input 
           type="number" 
           value={row.discFnc} 
           onChange={(e) => onUpdate(row.id, 'discFnc', e.target.value)}
           className="w-full bg-transparent border-none text-center text-[11px] font-bold outline-none text-blue-500"
         />
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

export default function OrdersView({ startWithForm = false, onFormClose, onNavigate, isDarkMode, language, userType = 'buyer' }: OrdersViewProps) {
  const [showForm, setShowForm] = useState(userType === 'supplier' ? false : startWithForm);
  const [respondingTo, setRespondingTo] = useState<any>(null);
  const [responseValue, setResponseValue] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [aiResponses, setAiResponses] = useState<SupplierResponse[]>([]);
  const [dbSuppliers, setDbSuppliers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null);
  const [downloadingOrderId, setDownloadingOrderId] = useState<string | null>(null);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
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
    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any),
        fromCache: snapshot.metadata.fromCache
      }));
      
      // Inject demo products for CONSTRUCENTER BEIRA (Supplier S1) to match the reference image exactly
      const demoProds = [
        { id: 'd1', supplierId: 'S1', name: 'Cimento CP IV', price: 818.50, category: 'Geral' },
        { id: 'd2', supplierId: 'S1', name: 'Aço CA-50 12mm', price: 807.01, category: 'Geral' },
        { id: 'd3', supplierId: 'S1', name: 'Tubo PVC 100mm', price: 411.50, category: 'Geral' },
        { id: 'd4', supplierId: 'S1', name: 'Areia Média', price: 1272.00, category: 'Geral' },
      ];
      
      const combined = [...prods];
      demoProds.forEach(dp => {
        if (!combined.some(p => p.name === dp.name && p.supplierId === dp.supplierId)) {
          combined.push(dp);
        }
      });

      setAllProducts(combined);
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
      const otherId = userType === 'supplier' ? 'buyer_demo_uid' : 'supplier_demo_uid'; // In real app, use IDs from order
      const otherName = userType === 'supplier' ? 'Junior Manhate' : order.supplier;

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

      // Create new room
      await addDoc(collection(db, 'chats'), {
        participants: [auth.currentUser.uid, otherId],
        lastMessage: `${t.interestInOrder}: ${order.id}`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        participantNames: {
          [auth.currentUser.uid]: auth.currentUser.displayName || (userType === 'supplier' ? t.supplier : t.buyer),
          [otherId]: otherName
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
    setRows([...rows, { id: Date.now(), material: '', quantity: '', unit: 'Unid.', date: '' }]);
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

  const startAiAnalysis = () => {
    setStep(3);
    setIsAiProcessing(true);
    
    const responses: SupplierResponse[] = selectedSuppliers.map(sid => {
      const s = mergedSuppliers.find(as => as.id === sid);
      
      // Calculate real total based on products if they exist
      let calculatedTotal = 0;
      let itemsFound = 0;
      const itemPrices: { material: string; price: number }[] = [];

      rows.forEach(row => {
        // Try to find matching product for this supplier
        const match = allProducts.find(p => 
          p.supplierId === sid && 
          (p.name.toLowerCase().includes(row.material.toLowerCase()) || 
           row.material.toLowerCase().includes(p.name.toLowerCase()))
        );

        if (match) {
          const price = match.price || 0;
          calculatedTotal += price * parseFloat(row.quantity || '0');
          itemPrices.push({ material: row.material, price });
          itemsFound++;
        } else {
          // DO NOT invent prices. Set to 0 and mark as pending.
          itemPrices.push({ material: row.material, price: 0 });
        }
      });

      return {
        supplierId: sid,
        name: s?.name || (language === 'PT' ? 'Fornecedor' : 'Supplier'),
        price: calculatedTotal,
        timeToDeliver: itemsFound === rows.length
          ? (language === 'PT' ? '2 dias' : '2 days') 
          : (language === 'PT' ? '4-5 dias (Sob consulta)' : '4-5 days (Pending quote)'),
        confidence: Math.round((itemsFound / rows.length) * 100),
        itemPrices
      };
    });

    const sorted = [...responses].sort((a, b) => a.price - b.price);

    // Notify selected suppliers
    responses.forEach(async (res) => {
      await notificationService.sendNotification({
        userId: res.supplierId,
        senderId: user?.uid,
        title: language === 'PT' ? 'Novo Pedido de Cotação' : 'New Quote Request',
        message: language === 'PT' 
          ? `Você recebeu uma nova solicitação de cotação de ${profile?.name || 'um cliente'}.` 
          : `You received a new quote request from ${profile?.name || 'a client'}.`,
        type: 'quote_request',
        metadata: {
          requestId: `RQ-${Math.floor(Date.now()/100000)}`,
          buyerId: user?.uid,
          itemsCount: rows.length
        }
      });
    });

    setTimeout(() => {
      setAiResponses(sorted);
      setIsAiProcessing(false);
    }, 2500);
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
    
    // Create a temporary container for the PDF content to ensure it looks like the user's image
    const element = invoiceRef.current;
    try {
      const canvas = await html2canvas(element, {
        scale: 1.2, // Slightly reduced for speed
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 10000,
        onclone: (clonedDoc) => {
          sanitizeDocumentColors(clonedDoc, false);
        }
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.7);
      const pdf = new jsPDF('p', 'mm', 'a4', true);
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      pdf.save(`Cotação_${response.name.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error("PDF generator error:", error);
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
      analysisSub: 'Resultados ordenados por menor custo',
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
      analysisSub: 'Results ordered by lowest cost',
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

  const currentResponse = aiResponses[selectedResponseIndex];
  const currentSupplier = mergedSuppliers.find(s => s.id === currentResponse?.supplierId);
  
  const quotationData = {
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
      
      return {
        description: row.material,
        quantity: parseFloat(row.quantity || '0'),
        unit: row.unit,
        unitPrice: itemPrice,
        discount: 0,
        vatPer: 16
      };
    })
  };

  const invoiceTemplate = (
    <div className="fixed -left-[2000px] top-0 pointer-events-none z-[-100]">
      <QuotationDocument data={quotationData} innerRef={invoiceRef} />
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
            >
              <Trash2 className="w-5 h-5" />
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
                    <table className="w-full text-left border-collapse min-w-[1200px] table-fixed">
                      <thead className={`${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-50 border-zinc-100'} border-b sticky top-0 z-20`}>
                        <tr>
                          <th className="px-4 py-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest w-12 text-center">#</th>
                          <th className="px-4 py-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest w-64">{t.headers.material}</th>
                          <th className="px-4 py-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest w-20 text-center">{t.headers.qty}</th>
                          <th className="px-4 py-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest w-24 text-center">{language === 'PT' ? 'Unid.' : 'Unit'}</th>
                          <th className="px-4 py-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest w-28 text-right">{language === 'PT' ? 'Preço Unit.' : 'Unit Price'}</th>
                          <th className="px-4 py-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest w-20 text-center">Desc Cmr</th>
                          <th className="px-4 py-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest w-20 text-center">Desc Fnc</th>
                          <th className="px-4 py-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest w-20 text-center">IVA %</th>
                          <th className="px-4 py-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest w-20 text-center">Inc?</th>
                          <th className="px-4 py-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest w-32 text-right">Sub Total</th>
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
                    {mergedSuppliers.map(s => (
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
                          <div className="text-right mt-4 sm:mt-0 w-full sm:w-auto flex flex-col items-end gap-3">
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
                            <button 
                              onClick={() => {
                                setSelectedResponseIndex(i);
                                setStep(4);
                              }}
                              className="w-full sm:w-auto px-6 py-3 bg-[#0052CC] text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-brand hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                              <ShieldCheck className="w-4 h-4" />
                              {t.payNow}
                            </button>
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
                  <div className="flex-grow flex flex-col items-center justify-center py-10">
                    <div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/20 mb-8 relative">
                      <CheckCircle2 className="w-12 h-12" />
                      <motion.div 
                        initial={{ scale: 1, opacity: 0.5 }}
                        animate={{ scale: 1.8, opacity: 0 }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="absolute inset-0 bg-emerald-500 rounded-full"
                      />
                    </div>
                    <p className={`text-2xl font-black uppercase italic tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{t.success}</p>
                    <p className="text-zinc-500 text-sm font-bold mt-2">{t.transaction}: #SX-{Math.random().toString(36).substring(7).toUpperCase()}</p>
                    <div className="mt-12 flex gap-4">
                      <button 
                        onClick={() => {
                          setStep(1);
                          setPaymentSuccess(false);
                          setShowForm(false);
                        }}
                        className="px-8 py-4 bg-zinc-900 dark:bg-brand text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95"
                      >
                        {t.myOrders}
                      </button>
                    </div>
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
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-zinc-950/80 backdrop-blur-sm">
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
                <div className="flex-grow overflow-auto p-4 sm:p-8 bg-zinc-200">
                  <div className="w-[210mm] min-h-[297mm] mx-auto bg-white shadow-2xl overflow-hidden">
                    <QuotationDocument data={quotationData} />
                  </div>
                </div>
              </motion.div>
            </div>
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
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
                    <User className="w-3 h-3" />
                    {userType === 'supplier' ? `${t.client}: Manhate Jr` : `${t.supplier}: ${order.supplier}`}
                  </p>
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
                    {userType === 'supplier' && order.status === t.status.quote && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setRespondingTo(order);
                        }}
                        className="px-4 sm:px-5 py-2 sm:py-2.5 bg-supplyx-blue text-white rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/20"
                      >
                        {t.respond}
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
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        <div className={`${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} p-8 rounded-3xl border h-fit shadow-sm relative overflow-hidden group`}>
          <h3 className={`font-black italic uppercase mb-8 relative z-10 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{t.marketHealth}</h3>
          <div className="space-y-8 relative z-10">
            <div className="flex items-center gap-4"><div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500"><CheckCircle2 className="w-6 h-6" /></div><div><p className={`text-2xl font-black leading-none ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>85</p><p className="text-xs text-zinc-500 font-bold uppercase mt-1">{t.finished}</p></div></div>
            <div className="flex items-center gap-4"><div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-600"><Clock className="w-6 h-6" /></div><div><p className={`text-2xl font-black leading-none ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>12</p><p className="text-xs text-zinc-500 font-bold uppercase mt-1">{t.pending}</p></div></div>
            <div className="flex items-center gap-4"><div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-600"><AlertCircle className="w-6 h-6" /></div><div><p className={`text-2xl font-black leading-none ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>3</p><p className="text-xs text-zinc-500 font-bold uppercase mt-1">{t.bottlenecks}</p></div></div>
          </div>
          <Zap className="absolute right-0 bottom-0 opacity-5 w-32 h-32 -mb-8 -mr-8 group-hover:scale-110 transition-transform" />
        </div>
      </div>

      <AnimatePresence>
        {respondingTo && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-lg p-8 rounded-[40px] relative border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100 shadow-2xl'}`}
            >
              <button 
                onClick={() => setRespondingTo(null)}
                className="absolute top-8 right-8 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>

              <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-4 h-4 text-brand" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand">{t.supplierIntelligence}</span>
                </div>
                <h3 className={`text-2xl font-black italic uppercase tracking-tighter mb-1 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{t.respondToQuote}</h3>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest italic">{respondingTo.id} • {t.priceRequest}</p>
              </div>

              <div className="space-y-6">
                <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-zinc-800/50' : 'bg-zinc-50'}`}>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">{t.orderSummarySmall}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-zinc-500">{language === 'PT' ? 'Cimento CP-II 50kg' : 'Cement CP-II 50kg'}</span>
                      <span className={isDarkMode ? 'text-white' : 'text-zinc-900'}>100 {language === 'PT' ? 'Sacos' : 'Bags'}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-zinc-500">{language === 'PT' ? 'Vergalhão 10mm' : 'Rebar 10mm'}</span>
                      <span className={isDarkMode ? 'text-white' : 'text-zinc-900'}>50 {language === 'PT' ? 'Unid.' : 'Units'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">{t.yourProposal}</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand font-black italic">MT</span>
                    <input 
                      type="number"
                      value={responseValue}
                      onChange={(e) => setResponseValue(e.target.value)}
                      className={`w-full pl-12 pr-4 py-4 rounded-2xl text-lg font-black italic outline-none border-2 transition-all ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white focus:border-brand' : 'bg-white border-zinc-100 focus:border-brand shadow-inner'}`}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">{t.clientMessage}</label>
                  <textarea 
                    className={`w-full p-4 rounded-2xl text-xs font-bold outline-none border-2 transition-all h-24 resize-none ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white focus:border-brand' : 'bg-white border-zinc-100 focus:border-brand shadow-inner'}`}
                    placeholder={t.clientMessagePlaceholder}
                  />
                </div>
              </div>

              <div className="mt-8">
                <button 
                  onClick={() => {
                    setIsResponding(true);
                    setTimeout(() => {
                      setIsResponding(false);
                      setRespondingTo(null);
                      setResponseValue('');
                      alert(t.successProposal);
                    }, 1500);
                  }}
                  disabled={!responseValue || isResponding}
                  className="w-full py-5 bg-[#0052CC] text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-brand hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isResponding ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t.sendingProposal}
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-6 h-6" />
                      {t.sendProposal}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
