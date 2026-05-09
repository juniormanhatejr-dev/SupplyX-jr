import { useState, useRef, ChangeEvent } from 'react';
import SupplyXLogo from './SupplyXLogo';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { GoogleGenAI, Type } from "@google/genai";
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
  Image as ImageIcon,
  Camera,
  Loader2,
  Sparkles,
  Smartphone,
  MessageSquare,
  X,
  User,
} from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import ProfileModal from './ProfileModal';

const availableSuppliers = [
  { id: 'S1', name: 'Gerdau S.A.', quality: 'A+', segment: 'Estrutural' },
  { id: 'S2', name: 'Votorantim', quality: 'A', segment: 'Básicos' },
  { id: 'S3', name: 'Saint-Gobain', quality: 'B+', segment: 'Acabamento' },
  { id: 'S4', name: 'Tigre S.A.', quality: 'A+', segment: 'Hidráulica' },
  { id: 'S5', name: 'Mineradora Vale', quality: 'A', segment: 'Básicos' },
];

const getOrders = (t: any) => [
  { id: 'OC-2401', supplier: t.supplierNames.votorantim, supplierId: 'S2', total: 'MT 12.450,00', status: t.status.delivered, date: '04/05/2024' },
  { id: 'OC-2402', supplier: t.supplierNames.gerdau, supplierId: 'S1', total: 'MT 45.890,00', status: t.status.transit, date: '05/05/2024' },
  { id: 'OC-2403', supplier: t.supplierNames.tigre, supplierId: 'S4', total: 'MT 3.210,00', status: t.status.waiting, date: '05/05/2024' },
  { id: 'RTF-992', supplier: t.multiSuppliers, supplierId: 'multi', total: 'N/A', status: t.status.quote, date: '06/05/2024' },
];

interface OrdersViewProps {
  startWithForm?: boolean;
  onFormClose?: () => void;
  onNavigate?: (tab: string) => void;
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
}

export default function OrdersView({ startWithForm = false, onFormClose, onNavigate, isDarkMode, language, userType = 'buyer' }: OrdersViewProps) {
  const [showForm, setShowForm] = useState(userType === 'supplier' ? false : startWithForm);
  const [respondingTo, setRespondingTo] = useState<any>(null);
  const [responseValue, setResponseValue] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [aiResponses, setAiResponses] = useState<SupplierResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);

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
        // Find the way to navigate to messages
        // Since onNavigate isn't passed, we might need to handle this differently or just use context if available
        // For now, let's assume this view might need an onNavigate prop too or we just show a toast
        alert(t.chatExists);
        return;
      }

      // Create new room
      await addDoc(collection(db, 'chats'), {
        participants: [auth.currentUser.uid, otherId],
        lastMessage: `${t.interestInOrder}: ${order.id}`,
        updatedAt: serverTimestamp(),
        participantNames: {
          [auth.currentUser.uid]: auth.currentUser.displayName || (userType === 'supplier' ? t.supplier : t.buyer),
          [otherId]: otherName
        }
      });

      alert(t.chatStarted);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'chats');
    } finally {
      setIsLoading(false);
    }
  };
  const [selectedResponseIndex, setSelectedResponseIndex] = useState<number>(0);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [isImagingProcessing, setIsImageProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    { id: 1, material: language === 'PT' ? 'Cimento CP-II 50kg' : 'Cement CP-II 50kg', quantity: '100', unit: language === 'PT' ? 'Sacos' : 'Bags', date: '2024-05-20' },
    { id: 2, material: language === 'PT' ? 'Vergalhão 10mm' : 'Rebar 10mm', quantity: '50', unit: language === 'PT' ? 'Unid.' : 'Units', date: '2024-05-20' }
  ]);

  const exportToExcel = () => {
    const headers = [t.materialLabel, t.quantityLabel, t.unitLabel, t.needDateLabel];
    const data = rows.map(row => [
      row.material,
      row.quantity,
      row.unit,
      row.date
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers, ...data].map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "lista_materiais_supplyx.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImageProcessing(true);
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const base64Data = await base64Promise;
      const base64Image = base64Data.split(',')[1];

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            {
              text: "Extract construction materials from this list/image. Return as a JSON array of objects with keys: material, quantity, and unit. Keep quantities as strings. Return ONLY the JSON array.",
            },
            {
              inlineData: {
                data: base64Image,
                mimeType: file.type
              }
            }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                material: { type: Type.STRING },
                quantity: { type: Type.STRING },
                unit: { type: Type.STRING }
              },
              required: ["material", "quantity", "unit"]
            }
          }
        }
      });

      const extractedData = JSON.parse(response.text || "[]");
      
      if (Array.isArray(extractedData)) {
        const newRows = extractedData.map((item: any) => ({
          id: Math.random(),
          material: item.material,
          quantity: item.quantity,
          unit: item.unit,
          date: new Date().toISOString().split('T')[0]
        }));
        
        // If the first real result is just empty placeholders, replace them
        if (rows.length === 2 && rows[0]?.material === 'Cimento CP-II 50kg' && rows[1]?.material === 'Vergalhão 10mm') {
          setRows(newRows);
        } else {
          setRows([...rows, ...newRows]);
        }
      }
    } catch (error) {
      console.error("Error processing image:", error);
    } finally {
      setIsImageProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const addRow = () => {
    setRows([...rows, { id: Date.now(), material: '', quantity: '', unit: 'Unid.', date: '' }]);
  };

  const removeRow = (id: number) => {
    if (rows.length > 1) {
      setRows(rows.filter(r => r.id !== id));
    }
  };

  const updateRow = (id: number, field: string, value: string) => {
    setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

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
      const s = availableSuppliers.find(as => as.id === sid);
      return {
        supplierId: sid,
        name: s?.name || '',
        price: Math.floor(Math.random() * (15000 - 8000) + 8000),
        timeToDeliver: Math.random() > 0.5 ? (language === 'PT' ? '2 dias' : '2 days') : (language === 'PT' ? '48 horas' : '48 hours'),
        confidence: Math.floor(Math.random() * (99 - 90) + 90)
      };
    });

    const sorted = [...responses].sort((a, b) => a.price - b.price);

    setTimeout(() => {
      setAiResponses(sorted);
      setIsAiProcessing(false);
    }, 2500);
  };

  const downloadPDF = async (response: SupplierResponse) => {
    if (!invoiceRef.current) return;
    
    // Create a temporary container for the PDF content to ensure it looks like the user's image
    const element = invoiceRef.current;
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc) => {
        // Find all elements in the cloned document and convert oklab/oklch colors to something safe
        // because html2canvas 1.4.1 doesn't support them.
        const elements = clonedDoc.getElementsByTagName('*');
        for (let i = 0; i < elements.length; i++) {
          const el = elements[i] as HTMLElement;
          const style = window.getComputedStyle(el);
          
          // Check common properties that might use these colors
          ['backgroundColor', 'color', 'borderColor'].forEach(prop => {
            const val = style[prop as any];
            if (val && (val.includes('oklab') || val.includes('oklch'))) {
              // Forced fallback to a hex or simple rgb if caught. 
              // Since we're in the clone, we can just mutate style.
              // For simplicity, we'll strip them or set to a fallback if we can't easily parse.
              // Most common issue is oklch(none none none / 0) which is transparent.
              if (val.includes('/ 0')) {
                 el.style[prop as any] = 'transparent';
              } else {
                 el.style[prop as any] = prop === 'backgroundColor' ? 'white' : 'black';
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
    
    // Set the selected response index temporarily for the PDF generation if needed
    // Actually, we pass the response, so we should ensure the template is updated
    // But React state updates are async, so we just pass the index before calling downloadPDF or 
    // we make sure the template uses the 'response' passed here.
    // Given the current architecture, I'll update the index before downloading.

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Cotacao_${response.name.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
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
      imageRequest: 'Solicitar via Imagem',
      imageSub: 'Tire uma foto da sua lista manuscrita ou impressa',
      aiTip: 'Dica IA',
      aiTipDesc: 'Nossa IA reconhece textos manuscritos e tabelas técnicas. Basta subir a imagem e nós preenchemos a cotação.',
      extracting: 'Extraindo materiais...',
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
        transit: 'Em Transito',
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
      imageRequest: 'Request via Image',
      imageSub: 'Take a photo of your handwritten or printed list',
      aiTip: 'AI Tip',
      aiTipDesc: 'Our AI recognizes handwritten text and technical tables. Just upload the image and we fill the quote.',
      extracting: 'Extracting materials...',
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

  const invoiceTemplate = (
    <div className="fixed -left-[2000px] top-0 pointer-events-none z-[-100]">
      <div ref={invoiceRef} className="w-[210mm] min-h-[297mm] bg-white p-12 text-zinc-900 border border-zinc-100 font-sans relative overflow-hidden">
        {/* Accent Bar */}
        <div className="absolute top-0 left-0 w-full h-2 bg-[#0052CC]"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#eff6ff] -mr-16 -mt-16 rounded-full"></div>
        
        {/* Watermark Logo */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none -rotate-12">
          <SupplyXLogo size="xl" className="scale-[6]" />
        </div>

        <div className="relative z-10 flex justify-between items-start mb-12">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-[#18181b] rounded-2xl flex items-center justify-center text-white text-2xl font-black italic">
                {aiResponses[selectedResponseIndex]?.name?.charAt(0) || 'S'}
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tighter text-[#18181b] uppercase leading-none">
                  {aiResponses[selectedResponseIndex]?.name || 'Supplier'}
                </h1>
                <p className="text-[#71717a] font-bold text-[10px] uppercase tracking-widest mt-2">
                  {t.verifiedSupplier} • {language === 'PT' ? 'Moçambique' : 'Mozambique'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-6 h-6 bg-[#2563eb] rounded-full flex items-center justify-center text-white text-[10px]">
                ✓
              </div>
              <span className="text-[10px] font-black text-[#2563eb] uppercase tracking-widest">{t.verifiedSupplier}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-3 justify-end mb-4">
              <SupplyXLogo size="lg" />
            </div>
            <p className="text-[9px] text-[#a1a1aa] font-bold leading-tight">
              Cotação processada e validada por<br />
              <span className="text-[#18181b]">SupplyX Intelligence Platform</span><br />
              Marketplace B2B | Gestão de Compras
            </p>
          </div>
        </div>

        <div className="flex gap-4 mb-10 relative z-10">
          <div className="bg-[#0052CC] text-white px-8 py-4 font-black text-base uppercase tracking-widest flex-1 flex justify-between items-center">
            <span>Cotação Nº:</span>
            <span className="italic">PR-QT-{new Date().getFullYear()}-{Math.floor(1000 + Math.random() * 9000)}</span>
          </div>
          <div className="bg-[#18181b] text-white px-8 py-4 font-black text-base uppercase tracking-widest">
            {new Date().toLocaleDateString()}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-10 relative z-10">
          <div className="bg-[#fafafa] p-8 rounded-[32px] border border-[#f4f4f5]">
            <h3 className="text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest mb-6 border-b border-[#e4e4e7] pb-2">{t.customerData}</h3>
            <div className="space-y-3 text-xs">
              <p className="flex justify-between font-bold"><span>NUIT:</span> <span className="text-[#18181b]">{auth.currentUser?.uid?.slice(0, 9) || '400377081'}</span></p>
              <p className="flex justify-between font-bold"><span>{language === 'PT' ? 'Nome:' : 'Name:'}</span> <span className="text-[#18181b]">{auth.currentUser?.displayName || 'User Client'}</span></p>
              <p className="flex justify-between font-bold"><span>{language === 'PT' ? 'Intermediação:' : 'Intermediation:'}</span> <span className="text-[#18181b]">SupplyX Platform</span></p>
            </div>
          </div>
          <div className="bg-[#fafafa] p-8 rounded-[32px] border border-[#f4f4f5]">
            <h3 className="text-[10px] font-black text-[#a1a1aa] uppercase tracking-widest mb-6 border-b border-[#e4e4e7] pb-2">{t.supplierContact}</h3>
            <div className="space-y-3 text-xs">
              <p className="flex justify-between font-bold"><span>{language === 'PT' ? 'Endereço:' : 'Address:'}</span> <span className="text-[#18181b]">MAPUTO - MZ</span></p>
              <p className="flex justify-between font-bold"><span>Email:</span> <span className="text-[#18181b] underline">sales@{aiResponses[selectedResponseIndex]?.name?.toLowerCase().replace(/\s/g, '') || 'supplier'}.co.mz</span></p>
              <p className="flex justify-between font-bold"><span>{language === 'PT' ? 'Telefone:' : 'Phone:'}</span> <span className="text-[#18181b]">+258 84 ...</span></p>
            </div>
          </div>
        </div>

        <div className="mb-6 relative z-10">
          <div className="inline-flex items-center gap-2 bg-[#18181b] text-white px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest italic">
            <Clock className="w-3 h-3" />
            {t.validity}
          </div>
        </div>

        <table className="w-full text-left mb-12 invoice-table relative z-10">
          <thead className="bg-[#18181b] text-white text-[10px] font-black uppercase tracking-widest text-right">
            <tr>
              <th className="px-6 py-4 text-left">{t.description}</th>
              <th className="px-6 py-4 text-center">{t.quantity}</th>
              <th className="px-6 py-4 text-center">{t.unit}</th>
              <th className="px-6 py-4">{t.unitPrice}</th>
              <th className="px-6 py-4 text-center">{t.discount}</th>
              <th className="px-6 py-4 text-center">{t.tax}</th>
              <th className="px-6 py-4">{t.total}</th>
            </tr>
          </thead>
          <tbody className="text-xs font-bold text-[#52525b] divide-y divide-[#f4f4f5]">
            {rows.map(row => (
              <tr key={row.id} className="hover:bg-[#fafafa] transition-colors">
                <td className="px-6 py-5 text-[#18181b]">{row.material}</td>
                <td className="px-6 py-5 text-center">{row.quantity}</td>
                <td className="px-6 py-5 text-center text-[10px]">{row.unit}</td>
                <td className="px-6 py-5 text-right font-mono">{( (aiResponses[selectedResponseIndex]?.price || 12450) / (rows.length || 1) / 1.16).toFixed(2)}MT</td>
                <td className="px-6 py-5 text-center text-[#a1a1aa]">0.00</td>
                <td className="px-6 py-5 text-center">16.00</td>
                <td className="px-6 py-5 text-right text-[#18181b] font-mono">{( (aiResponses[selectedResponseIndex]?.price || 12450) / (rows.length || 1)).toFixed(2)}MT</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="grid grid-cols-2 gap-12 relative z-10">
          <div className="text-[10px] text-[#dc2626] leading-relaxed bg-[#fef2f2] p-6 border border-[#fecaca] rounded-[32px] italic font-black">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4" />
              <span className="uppercase tracking-tighter">Aviso Legal / Disclaimer</span>
            </div>
            {t.intermediaryNote}
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-[#f4f4f5]">
              <span className="text-[10px] font-black uppercase text-[#a1a1aa] tracking-widest">{t.netTotal}</span>
              <span className="text-base font-black text-[#52525b] font-mono">{( (aiResponses[selectedResponseIndex]?.price || 12450) / 1.16).toFixed(2)} MT</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-[#f4f4f5]">
              <span className="text-[10px] font-black uppercase text-[#a1a1aa] tracking-widest">{t.tax}</span>
              <span className="text-base font-black text-[#52525b] font-mono">{( (aiResponses[selectedResponseIndex]?.price || 12450) * 0.16).toFixed(2)} MT</span>
            </div>
            <div className="bg-[#0052CC] text-white p-6 flex justify-between items-center rounded-2xl">
              <span className="text-sm font-black uppercase italic tracking-tighter">{t.grossTotal}</span>
              <div className="text-right">
                <span className="text-3xl font-black italic tracking-tighter leading-none">{(aiResponses[selectedResponseIndex]?.price || 12450).toLocaleString()}</span>
                <span className="text-xl font-black italic ml-1">MT</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20 pt-10 border-t border-[#f4f4f5] flex justify-between items-center relative z-10">
          <div className="text-[8px] font-bold text-[#a1a1aa] uppercase tracking-widest">
            <p>SupplyX Platform v2.0</p>
            <p>Marketplace de Construção Integrado</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[8px] font-black text-[#18181b] tracking-tight uppercase">www.supplyx.co.mz</p>
              <p className="text-[7px] font-bold text-[#a1a1aa] uppercase">Powered by MANHATE LINK AFRICA</p>
            </div>
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg overflow-hidden border border-zinc-100">
              <SupplyXLogo size="md" showText={false} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (showForm) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="max-w-5xl mx-auto"
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
                <div className="flex flex-col md:flex-row gap-6 mb-8">
                  <div className={`flex-grow overflow-x-auto border rounded-2xl ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`}>
                    <table className="w-full text-left min-w-[500px]">
                      <thead className={`${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-50 border-zinc-100'} border-b sticky top-0`}>
                        <tr>
                          <th className="px-4 py-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest w-16 text-center">{t.headers.item}</th>
                          <th className="px-4 py-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest">{t.headers.material}</th>
                          <th className="px-4 py-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest w-30">{t.headers.qty}</th>
                          <th className="px-4 py-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest w-40">{t.headers.need}</th>
                          <th className="px-4 pr-6 w-12 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDarkMode ? 'divide-zinc-800' : 'divide-zinc-100'}`}>
                        {rows.map((row, index) => (
                          <tr key={row.id} className={`${isDarkMode ? 'hover:bg-zinc-800/50' : 'hover:bg-zinc-50'} group`}>
                            <td className="px-4 py-2 font-mono text-xs text-zinc-500 text-center">{index + 1}</td>
                            <td className="px-4 py-2">
                              <input 
                                type="text" value={row.material} onChange={(e) => updateRow(row.id, 'material', e.target.value)}
                                className={`w-full bg-transparent border-none text-sm font-bold placeholder:text-zinc-300 outline-none ${isDarkMode ? 'text-zinc-100' : 'text-zinc-800'}`}
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input 
                                type="text" value={row.quantity} onChange={(e) => updateRow(row.id, 'quantity', e.target.value)}
                                className={`w-full bg-transparent border-none text-sm font-mono font-bold placeholder:text-zinc-300 outline-none ${isDarkMode ? 'text-brand' : 'text-zinc-900'}`}
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input 
                                type="date" value={row.date} onChange={(e) => updateRow(row.id, 'date', e.target.value)}
                                className={`w-full bg-transparent border-none text-xs font-bold outline-none ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}
                              />
                            </td>
                            <td className="px-4 pr-6 py-2 text-center">
                              <button onClick={() => removeRow(row.id)} className="text-zinc-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1">
                                <Plus className="w-4 h-4 rotate-45" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                      <div className="p-3 border-t border-zinc-100 flex items-center justify-between">
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

                  <div className="w-full md:w-80 shrink-0">
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isImagingProcessing}
                      className={`w-full aspect-[4/3] rounded-3xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center transition-all group relative overflow-hidden
                        ${isDarkMode 
                          ? 'border-[#27272a] hover:border-[#0052CC] bg-[#18181b]/50 hover:bg-[#0052CC]/5' 
                          : 'border-[#f4f4f5] hover:border-[#0052CC] bg-[#fafafa] hover:bg-[#0052CC]/5'}`}
                    >
                      {isImagingProcessing ? (
                        <div className="relative z-10 space-y-3">
                          <Loader2 className="w-10 h-10 text-brand animate-spin mx-auto" />
                          <p className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>SupplyX Vision</p>
                          <p className="text-[8px] font-bold text-zinc-500 uppercase">{t.extracting}</p>
                        </div>
                      ) : (
                        <div className="relative z-10 space-y-3">
                          <div className={`mx-auto w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-white text-zinc-400 shadow-zinc-200/50'}`}>
                            <ImageIcon className="w-6 h-6" />
                          </div>
                          <div>
                            <p className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{t.imageRequest}</p>
                            <p className="text-[9px] font-bold text-zinc-500 uppercase mt-1 leading-relaxed px-4">{t.imageSub}</p>
                          </div>
                        </div>
                      )}
                      
                      {/* AI Sparkles Accent */}
                      <Sparkles className="absolute -top-4 -right-4 w-12 h-12 text-brand opacity-10 group-hover:opacity-20 transition-opacity" />
                    </button>

                    <div className={`mt-4 p-4 rounded-2xl border ${isDarkMode ? 'bg-[#0052CC]/5 border-[#0052CC]/20' : 'bg-[#0052CC]/5 border-[#0052CC]/10'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-3 h-3 text-brand fill-brand" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-brand">{t.aiTip}</span>
                      </div>
                      <p className={`text-[9px] font-medium leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        {t.aiTipDesc}
                      </p>
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
                    {availableSuppliers.map(s => (
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
                                <button 
                                  onClick={async () => {
                                    setSelectedResponseIndex(i);
                                    // Wait a bit for the template to update before capturing
                                    setTimeout(() => downloadPDF(res), 100);
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-[10px] font-black uppercase rounded-lg transition-all"
                                >
                                  <Download className="w-3 h-3" /> {t.download}
                                </button>
                                <span className={`text-[10px] font-bold ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>via SupplyX Portal</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right mt-4 sm:mt-0 w-full sm:w-auto flex flex-col items-end gap-3">
                            <div>
                              <p className={`text-2xl font-black italic tracking-tighter ${i === 0 ? 'text-brand' : isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
                                MT {res.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-none">{t.totalEstimated}</p>
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
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
      {invoiceTemplate}
      <div className="flex justify-between items-center">
        <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
          {userType === 'supplier' ? t.receivedRequests : t.orderManagement}
        </h2>
        {userType === 'buyer' && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-[#0052CC] hover:bg-[#0747A6] text-white rounded-xl text-sm font-bold transition-all active:scale-95 shadow-brand">
            <Plus className="w-4 h-4" /> {t.newQuoteBtn}
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {getOrders(t).map((order) => (
            <div key={order.id} className={`p-4 rounded-2xl border flex items-center justify-between transition-colors cursor-pointer group ${isDarkMode ? 'bg-[#18181b] border-[#27272a] hover:border-[#0052CC]/40' : 'bg-white border-[#e4e4e7] hover:border-[#0052CC]/30'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-50 border-zinc-100'}`}>
                  <FileText className={`w-6 h-6 ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`} />
                </div>
                <div>
                  <h4 className={`font-bold transition-colors ${isDarkMode ? 'text-white group-hover:text-brand' : 'text-zinc-900 group-hover:text-brand'}`}>{order.id}</h4>
                  <p 
                    className="text-xs text-zinc-500 font-medium italic cursor-pointer hover:text-brand transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      const profileId = userType === 'supplier' ? 'buyer_demo_uid' : (order as any).supplierId;
                      if (profileId) {
                        setViewingProfileId(profileId);
                        setIsProfileModalOpen(true);
                      }
                    }}
                  >
                    {userType === 'supplier' ? `${t.client}: ${language === 'PT' ? 'Manhate Jr Const.' : 'Manhate Jr Const.'}` : `${t.supplier}: ${order.supplier}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-right">
                  <p className={`text-sm font-black italic tracking-tight ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>{order.total}</p>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{order.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest
                    ${order.status === t.status.delivered ? 'bg-emerald-500/10 text-emerald-500' : 
                      order.status === t.status.transit ? 'bg-blue-500/10 text-blue-500' :
                      order.status === t.status.waiting ? 'bg-amber-500/10 text-amber-500' :
                      'bg-[#0052CC]/10 text-[#0052CC]'}`}>
                    {order.status}
                  </div>
                  {order.status === t.status.quote && (
                    <button 
                      onClick={async (e) => {
                        e.stopPropagation();
                        // For existing orders, we mock a response to use the template
                        const mockRes: SupplierResponse = {
                           supplierId: (order as any).supplierId || 'S1',
                           name: order.supplier,
                           price: parseFloat(order.total.replace('MT ', '').replace('.', '').replace(',', '.')) || 12450,
                           timeToDeliver: '2 dias',
                           confidence: 95
                        };
                        setSelectedResponseIndex(0); // Ensure template has data
                        await downloadPDF(mockRes);
                      }}
                      className={`p-1.5 rounded-lg transition-all active:scale-95 ${isDarkMode ? 'bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-zinc-100 text-zinc-500 hover:text-zinc-900'}`}
                      title={t.download}
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                  {userType === 'supplier' && order.status === t.status.quote && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setRespondingTo(order);
                      }}
                      className="px-4 py-1.5 bg-[#0052CC] text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-brand"
                    >
                      {t.respond}
                    </button>
                  )}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      startChat(order);
                    }}
                    className={`p-1.5 rounded-lg transition-all active:scale-95 ${isDarkMode ? 'bg-[#27272a] text-[#71717a] hover:text-[#0052CC] hover:bg-[#0052CC]/10' : 'bg-[#f4f4f5] text-[#52525b] hover:text-[#0052CC] hover:bg-[#0052CC]/10'}`}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
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
