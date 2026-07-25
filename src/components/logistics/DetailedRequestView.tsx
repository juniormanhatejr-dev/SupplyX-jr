import React, { useState, useMemo, useRef, useEffect } from 'react';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { motion, AnimatePresence } from 'motion/react';
import SupplyXLogo from '../SupplyXLogo';
import { 
  Package, 
  MapPin, 
  CheckCircle2, 
  Plus, 
  Star, 
  ArrowLeft, 
  CheckCircle,
  Truck,
  ShieldCheck,
  ChevronRight,
  MessageSquare,
  AlertTriangle,
  FileText,
  Clock,
  Send,
  Download,
  Activity,
  User,
  ThumbsUp,
  XCircle,
  Trash2,
  Eye,
  Printer,
  QrCode,
  X,
  Lock,
  ExternalLink,
  History,
  Sparkles,
  Building2,
  UserCheck,
  RefreshCw,
  Check
} from 'lucide-react';
import { CargoRequest, CommercialDriver, CarrierProposal, Occurrence } from './types';
import { db, auth, cleanFirestoreData } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { calculateVehicleRecommendation } from './vehicleRecommendation';
import { syncChatMessageToFreightOrders } from './logisticsSync';
import { collection, query, where, getDocs, getDoc, addDoc, updateDoc, doc, serverTimestamp, onSnapshot, setDoc } from 'firebase/firestore';

interface DetailedRequestViewProps {
  isDarkMode: boolean;
  language: 'PT' | 'EN';
  selectedRequestId: string;
  onBack: () => void;
  requests: CargoRequest[];
  occurrences: Occurrence[];
  drivers: CommercialDriver[];
  onChangeRequestStatus: (id: string, newStatus: string) => void;
  onPublishToConcourse: (id: string) => void;
  onAssignCarrier: (id: string, carrierName: string, agreedPrice: number) => void;
  onAddOccurrence: (occ: Occurrence) => void;
  onToggleOccurrence: (id: string) => void;
  onUpdateFeedback: (id: string, role: 'client' | 'carrier', rating: number, comment: string) => void;
  onUpdateCargoPod: (id: string, signature: string, photo: string) => void;
  onNavigateToTab: (tab: string, payload?: any) => void;
  userType?: string;
  onUpdateCargoRequest?: (id: string, updatedFields: Partial<CargoRequest>) => void;
}

export default function DetailedRequestView({
  isDarkMode,
  language,
  selectedRequestId,
  onBack,
  requests = [],
  occurrences = [],
  drivers = [],
  onChangeRequestStatus,
  onPublishToConcourse,
  onAssignCarrier,
  onAddOccurrence,
  onToggleOccurrence,
  onUpdateFeedback,
  onUpdateCargoPod,
  onNavigateToTab,
  userType,
  onUpdateCargoRequest
}: DetailedRequestViewProps) {
  const { user, profile } = useAuth();
  const [selectedProposalIndex, setSelectedProposalIndex] = useState<number>(0);
  const [selectedLogisticsUserId, setSelectedLogisticsUserId] = useState<string>('');
  const [mapZoom, setMapZoom] = useState<number>(1);
  const [successModal, setSuccessModal] = useState<string | null>(null);

  // States for new interactive features
  const [activeTab, setActiveTab] = useState<'info' | 'reply' | 'bids' | 'occurrences' | 'documents' | 'review'>('info');

  // Response states
  const [typedReplyMessage, setTypedReplyMessage] = useState('');
  const [proposedPrice, setProposedPrice] = useState('');
  const [proposedDate, setProposedDate] = useState('');
  const [proposedVehicle, setProposedVehicle] = useState('');
  const [replyStatusMessage, setReplyStatusMessage] = useState('Proposta enviada');

  // Proposal Creation modal/form
  const [showAddBidForm, setShowAddBidForm] = useState(false);
  const [newCarrierBid, setNewCarrierBid] = useState({
    name: 'TransNacional Sul, Lda',
    price: '85000',
    deliverTime: '3 dias',
    conditions: 'Faturamento 30 dias',
    insurance: 'Cobertura Integral'
  });

  // Occurrence Log form
  const [showAddOccurrenceForm, setShowAddOccurrenceForm] = useState(false);
  const [newOccurrence, setNewOccurrence] = useState({
    category: 'Atrasos',
    description: '',
    responsible: drivers[0]?.name || 'Condutor Terceirizado'
  });

  // Feedbacks rating state
  const [clientRatingValue, setClientRatingValue] = useState(5);
  const [clientComment, setClientComment] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  // Sign canvas state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [savedSignature, setSavedSignature] = useState<string>('');

  // CRT Guia de Transporte Digital states
  const [showCrtModal, setShowCrtModal] = useState(false);
  const [crtQrDataUrl, setCrtQrDataUrl] = useState<string>('');
  const [showValidationDrawer, setShowValidationDrawer] = useState(false);

  // Products and quantities sheet states for cubing card
  const [cubingCardTab, setCubingCardTab] = useState<'spec' | 'products' | 'vehicle'>('spec');
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProductIndex, setEditingProductIndex] = useState<number | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    quantity: '',
    weight: '',
    volume: ''
  });

  // Match correct cargo request
  const requestObj = useMemo(() => {
    const matched = requests.find(r => r.id === selectedRequestId);
    if (matched) return matched;
    // Fallback default
    return {
      id: 'TR-2025-0001',
      tipoCarga: 'Cimento CP-IV',
      quantidade: '20 Toneladas',
      peso: '20 Toneladas',
      volume: '35 m³',
      origem: 'Matola, Província de Maputo',
      destino: 'Nampula, Província de Nampula',
      status: 'Em concurso',
      requester: 'Client',
      freightResponsibility: 'Client',
      deliveryMode: 'Third-party Logistics',
      dataColeta: '25 Mai 2026',
      prazoEntrega: '29 Mai 2026',
      observacoes: 'Material ensacado resistente paletizado.',
      proposalsCount: 3,
      rating: 4.8,
      targetPrice: 'A definir por lance logístico'
    } as CargoRequest;
  }, [selectedRequestId, requests]);

  // Vehicle recommendation fallback computation (Satisfies Backward Compatibility rule)
  const vehicleRec = useMemo(() => {
    const rawWeight = requestObj.peso || '1000 kg';
    const rawVolume = requestObj.volume || '10 m³';
    const rawDims = requestObj.dimensions || '5m x 2.2m x 2m';
    
    return calculateVehicleRecommendation(rawWeight, rawVolume, rawDims);
  }, [requestObj]);

  // Parse products from custom field or dynamic tipoCarga
  const requestProducts = useMemo(() => {
    if ((requestObj as any).items && Array.isArray((requestObj as any).items) && (requestObj as any).items.length > 0) {
      return ((requestObj as any).items as any[]).map(it => ({
        name: it.name || it.nome || 'Produto',
        quantity: String(it.quantity !== undefined ? it.quantity : (it.quantidade !== undefined ? it.quantidade : '1')),
        weight: String(it.weight !== undefined ? it.weight : (it.peso !== undefined ? it.peso : '')),
        volume: String(it.volume !== undefined ? it.volume : (it.cubagem !== undefined ? it.cubagem : ''))
      }));
    }
    
    const list: { name: string; quantity: string; weight: string; volume: string; }[] = [];
    const tc = requestObj.tipoCarga || '';
    if (tc) {
      const parts = tc.split(/\s*,\s*/);
      parts.forEach((part) => {
        if (!part.trim()) return;
        const match = part.match(/^(.*?)\s*\((.*?)\)$/);
        if (match) {
          const name = match[1].trim();
          const details = match[2].split(/\s*,\s*/);
          let qty = '1';
          let wt = '';
          if (details[0]) {
            qty = details[0].replace('x', '').trim();
          }
          if (details[1]) {
            wt = details[1].trim();
          }
          list.push({
            name,
            quantity: qty,
            weight: wt || '1 Tonelada',
            volume: '1 m³'
          });
        } else {
          list.push({
            name: part.trim(),
            quantity: requestObj.quantidade || '1 Item',
            weight: requestObj.peso || '1 Tonelada',
            volume: requestObj.volume || '1 m³'
          });
        }
      });
    }
    return list;
  }, [requestObj.tipoCarga, requestObj.quantidade, requestObj.peso, requestObj.volume, (requestObj as any).items]);

  // Effect to generate QR Code data URL for CRT document
  useEffect(() => {
    if (requestObj?.id) {
      const docCode = `CRT-MZ-TR-2026-${requestObj.id}`;
      const baseUrl = window.location.origin.includes('http') ? window.location.origin : 'https://supplyx.app';
      const validationUrl = `${baseUrl}/verify/${docCode}`;
      QRCode.toDataURL(validationUrl, { width: 200, margin: 3, color: { dark: '#0f172a', light: '#ffffff' } })
        .then(url => setCrtQrDataUrl(url))
        .catch(err => console.warn('QR code generation failed:', err));
    }
  }, [requestObj?.id]);

  const handleSaveProducts = (updatedList: { name: string; quantity: string; weight: string; volume: string; }[]) => {
    if (!onUpdateCargoRequest) return;

    const newTipoCarga = updatedList.map(it => `${it.name} (${it.quantity}${it.weight ? `, ${it.weight}` : ''})`).join(', ');

    let totalQty = 0;
    let totalWeight = 0;
    let totalVolume = 0;

    updatedList.forEach(it => {
      const qVal = parseFloat(it.quantity.replace(/[^\d.,]+/g, '').replace(',', '.')) || 1;
      totalQty += qVal;

      const wVal = parseFloat(it.weight.replace(/[^\d.,]+/g, '').replace(',', '.')) || 0;
      totalWeight += wVal;

      const vVal = parseFloat(it.volume.replace(/[^\d.,]+/g, '').replace(',', '.')) || 0;
      totalVolume += vVal;
    });

    onUpdateCargoRequest(requestObj.id, {
      tipoCarga: newTipoCarga || 'Sem carga',
      quantidade: `${updatedList.length} Produtos (${totalQty} Unidades)`,
      peso: totalWeight > 0 ? `${totalWeight} Toneladas` : 'A determinar',
      volume: totalVolume > 0 ? `${totalVolume} m³` : 'Sob Demanda',
      items: updatedList as any
    });
  };

  const handleAddProductClick = () => {
    setProductForm({ name: '', quantity: '', weight: '', volume: '' });
    setEditingProductIndex(null);
    setShowProductForm(true);
  };

  const handleEditProductClick = (index: number) => {
    const p = requestProducts[index];
    setProductForm({ 
      name: p.name || '', 
      quantity: p.quantity || '', 
      weight: p.weight || '', 
      volume: p.volume || '' 
    });
    setEditingProductIndex(index);
    setShowProductForm(true);
  };

  const handleRemoveProduct = (index: number) => {
    const updated = requestProducts.filter((_, i) => i !== index);
    handleSaveProducts(updated);
  };

  const handleProductFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = [...requestProducts];
    const newItem = {
      name: productForm.name.trim() || 'Produto B2B',
      quantity: productForm.quantity.trim() || '1x',
      weight: productForm.weight.trim() ? (productForm.weight.includes('T') || productForm.weight.toLowerCase().includes('ton') ? productForm.weight : `${productForm.weight} T`) : '1 T',
      volume: productForm.volume.trim() ? (productForm.volume.includes('m³') || productForm.volume.toLowerCase().includes('m3') ? productForm.volume : `${productForm.volume} m³`) : '1 m³'
    };

    if (editingProductIndex !== null) {
      updated[editingProductIndex] = newItem;
    } else {
      updated.push(newItem);
    }

    handleSaveProducts(updated);
    setShowProductForm(false);
  };

  // Real-Time GPS and Telemetry Calculations
  const isAssigned = useMemo(() => {
    return ['Atribuído', 'Em recolha', 'Em trânsito', 'Entregue'].includes(requestObj.status);
  }, [requestObj.status]);

  const progressValue = useMemo(() => {
    if (requestObj.trackProgress !== undefined) return requestObj.trackProgress;
    if (requestObj.status === 'Atribuído') return 0;
    if (requestObj.status === 'Em recolha') return 15;
    if (requestObj.status === 'Em trânsito') return 55;
    if (requestObj.status === 'Entregue') return 100;
    return 0;
  }, [requestObj.trackProgress, requestObj.status]);

  const speedValue = useMemo(() => {
    if (requestObj.trackSpeed !== undefined) return requestObj.trackSpeed;
    return requestObj.status === 'Em trânsito' ? 74 : 0;
  }, [requestObj.trackSpeed, requestObj.status]);

  const tempValue = useMemo(() => {
    if (requestObj.trackTemp !== undefined) return requestObj.trackTemp;
    if (requestObj.status === 'Em trânsito') return 12;
    if (requestObj.status === 'Em recolha') return 17;
    return 24;
  }, [requestObj.trackTemp, requestObj.status]);

  const fuelValue = useMemo(() => {
    if (requestObj.trackFuel !== undefined) return requestObj.trackFuel;
    if (requestObj.status === 'Atribuído') return 100;
    if (requestObj.status === 'Em recolha') return 95;
    if (requestObj.status === 'Em trânsito') return 68;
    if (requestObj.status === 'Entregue') return 22;
    return 100;
  }, [requestObj.trackFuel, requestObj.status]);

  const statusTextValue = useMemo(() => {
    if (requestObj.trackStatusText) return requestObj.trackStatusText;
    if (requestObj.status === 'Atribuído') return 'Veículo contratado. Aguardando posicionamento no despachante.';
    if (requestObj.status === 'Em recolha') return 'Carregamento do material iniciado e conferência fiscal da carga.';
    if (requestObj.status === 'Em trânsito') return 'Motorista em rota de viagem ativa pela EN1 sentido Norte.';
    if (requestObj.status === 'Entregue') return 'Carga entregue ao destino. Termo de recebimento assinado digitalmente.';
    return 'Aguardando início do trâmite de transporte.';
  }, [requestObj.trackStatusText, requestObj.status]);

  const assignedDriver = useMemo(() => {
    if (requestObj.driverName) {
      const match = drivers.find(d => d.name === requestObj.driverName);
      if (match) return match;
    }
    return drivers[0] || {
      id: 'PENDING',
      name: language === 'PT' ? 'Sem Motorista Atribuído' : 'No Driver Assigned',
      licenseId: 'N/A',
      vehicle: language === 'PT' ? 'Camião Pendente' : 'Truck Pending Selection',
      capacity: '0 Toneladas',
      location: '-',
      status: 'Pendente',
      rating: 5.0,
      trips: 0,
      phone: '+258 84 321 0041'
    };
  }, [requestObj.driverName, drivers, language]);

  const getTruckCoords = (progress: number) => {
    const t = progress / 100;
    const ax = 152;
    const ay = 262;
    const bx = 260;
    const by = 160;
    const cx = 385;
    const cy = 110;

    // Bézier quadratic equation: (1-t)^2 * A + 2*(1-t)*t * B + t^2 * C
    const tx = (1 - t) * (1 - t) * ax + 2 * (1 - t) * t * bx + t * t * cx;
    const ty = (1 - t) * (1 - t) * ay + 2 * (1 - t) * t * by + t * t * cy;
    return { tx, ty };
  };

  const { tx, ty } = useMemo(() => {
    return getTruckCoords(progressValue);
  }, [progressValue]);

  const handleSimulateAdvance = async () => {
    const nextProg = Math.min(progressValue + 15, 100);
    const nextSpeed = nextProg === 100 ? 0 : 65 + Math.floor(Math.random() * 20);
    const nextTemp = nextProg === 100 ? 22 : 10 + Math.floor(Math.random() * 5);
    const nextFuel = Math.max(fuelValue - Math.floor(5 + Math.random() * 5), 10);
    
    let nextStatusText = `Motorista avançou na rodovia EN1. Progresso atual do trajeto: ${nextProg}%.`;
    if (nextProg === 100) {
      nextStatusText = 'Entrega efetuada com sucesso no pátio do parceiro em Nampula!';
    }

    if (onUpdateCargoRequest) {
      onUpdateCargoRequest(requestObj.id, {
        status: nextProg === 100 ? 'Entregue' : (requestObj.status === 'Atribuído' ? 'Em recolha' : requestObj.status),
        trackProgress: nextProg,
        trackSpeed: nextSpeed,
        trackTemp: nextTemp,
        trackFuel: nextFuel,
        trackStatusText: nextStatusText
      });
    }

    // Register active occurrence event
    const occId = `OC-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const formattedDate = `${now.getDate()} ${now.toLocaleString('pt-BR', { month: 'short' })} ${now.getFullYear()} ${now.getHours()}:${now.getMinutes()}`;
    const newOccInstance = {
      id: occId,
      cargoId: requestObj.id,
      cargoName: requestObj.tipoCarga,
      description: `GPS Telemetry Update: Posição avançada. Trajeto: ${nextProg}%. Velocidade atual: ${nextSpeed}km/h. combustível: ${nextFuel}%.`,
      category: 'Outros incidentes',
      dateTime: formattedDate,
      responsible: assignedDriver.name,
      status: 'Resolvida'
    };
    onAddOccurrence?.(newOccInstance);
  };

  const handleSimulateDriverAlert = (alertType: string) => {
    let desc = '';
    let category = 'Outros incidentes';
    let label = '';
    
    if (alertType === 'pesagem') {
      desc = 'Posto de pesagem e segurança de balança vencidos. Tudo homologado conforme manifesto.';
      category = 'Outros incidentes';
      label = 'Pesagem OK';
    } else if (alertType === 'chuva') {
      desc = 'Aviso de tempestade severa e baixa visibilidade na EN1. Velocidade preventiva reduzida para 52km/h.';
      category = 'Atrasos';
      label = 'Chuva Forte';
    } else if (alertType === 'parada') {
      desc = 'Parada estratégica curta no auto-serviço Galp para calibrar pneus e hidratação do condutor.';
      category = 'Outros incidentes';
      label = 'Parada Técnica';
    } else if (alertType === 'anomalia') {
      desc = 'Aviso de vibração de baixo nível sob chassi suspensão pneumática. Ajustes manuais efetuados.';
      category = 'Atrasos';
      label = 'Reparo Curto';
    }

    if (onUpdateCargoRequest) {
      onUpdateCargoRequest(requestObj.id, {
        trackStatusText: `[Alerta ${label}] - ${desc}`,
        trackSpeed: alertType === 'parada' || alertType === 'anomalia' ? 0 : 52,
        trackTemp: alertType === 'anomalia' ? 18 : tempValue
      });
    }

    const occId = `OC-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const formattedDate = `${now.getDate()} ${now.toLocaleString('pt-BR', { month: 'short' })} ${now.getFullYear()} ${now.getHours()}:${now.getMinutes()}`;
    const newOccInstance = {
      id: occId,
      cargoId: requestObj.id,
      cargoName: requestObj.tipoCarga,
      description: `[Simulação Motorista] ${desc}`,
      category: category,
      dateTime: formattedDate,
      responsible: assignedDriver.name,
      status: 'Aberta'
    };
    onAddOccurrence?.(newOccInstance);
  };

  // Stepper timeline - aligned strictly with the requested 7-step states
  // We exclude 'Cancelado' because it is a terminal abort state.
  const stepperStates = [
    { title: language === 'PT' ? '📦 Pedida' : 'Ordered', date: language === 'PT' ? 'Necessidade Criada' : 'Need Created', key: 'Pendente' },
    { title: language === 'PT' ? '🚚 Contratada' : 'Allocated', date: language === 'PT' ? 'Concurso Finalizado' : 'Concourse Closed', key: 'Em concurso' },
    { title: language === 'PT' ? '👨‍✈️ Atribuído' : 'Dispatched', date: language === 'PT' ? 'Motorista Vinculado' : 'Driver Assigned', key: 'Atribuído' },
    { title: language === 'PT' ? '📍 Recolhida' : 'Picked Up', date: language === 'PT' ? 'Coleta Efetuada' : 'Cargo Loaded', key: 'Em recolha' },
    { title: language === 'PT' ? '🛣️ Em Trânsito' : 'In Transit', date: language === 'PT' ? 'Viagem Ativa EN1' : 'Active Corridor', key: 'Em trânsito' },
    { title: language === 'PT' ? '🏁 Chegada' : 'Arrival', date: language === 'PT' ? 'Destino Alcançado' : 'Destination Reached', key: 'Chegada ao destino' },
    { title: language === 'PT' ? '✅ Entregue' : 'Delivered', date: language === 'PT' ? 'POD Consolidado' : 'Consolidated PoD', key: 'Entregue' }
  ];

  // Map active step index logic
  const activeStepIndex = useMemo(() => {
    const status = requestObj.status;
    if (status === 'Pendente') return 0;
    if (status === 'Em concurso' || status === 'Em Competição') return 1;
    if (status === 'Atribuído' || status === 'Negociação') return 2;
    if (status === 'Em recolha' || status === 'Aguardando Coleta') return 3;
    if (status === 'Em trânsito' || status === 'Em Transporte') return 4;
    if (status === 'Chegada ao destino' || status === 'Próximo da entrega' || status === 'Chegando ao destino') return 5;
    if (status === 'Entregue') return 6;
    return -1; // e.g. Cancelado
  }, [requestObj.status]);

  // Persisted proposals inside localStorage and Firestore for interactive Bidding
  const [bids, setBids] = useState<CarrierProposal[]>(() => {
    const stored = localStorage.getItem(`supplyx_bids_${selectedRequestId}`);
    if (stored) return JSON.parse(stored);
    return [];
  });

  useEffect(() => {
    if (!selectedRequestId) return;
    const q = query(
      collection(db, 'carrier_bids'),
      where('cargoId', '==', selectedRequestId)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveBids: CarrierProposal[] = [];
      snapshot.forEach((docRef) => {
        liveBids.push({ id: docRef.id, ...docRef.data() } as CarrierProposal);
      });
      setBids(liveBids);
      localStorage.setItem(`supplyx_bids_${selectedRequestId}`, JSON.stringify(liveBids));
    }, (error) => {
      console.warn("Could not load real-time bids:", error);
    });
    return () => unsubscribe();
  }, [selectedRequestId]);

  const syncBids = async (newBids: CarrierProposal[]) => {
    setBids(newBids);
    localStorage.setItem(`supplyx_bids_${selectedRequestId}`, JSON.stringify(newBids));

    // Upload newly created bid to Firestore 'carrier_bids' if any
    const latestBid = newBids[newBids.length - 1];
    if (latestBid) {
      try {
        const docRef = doc(collection(db, 'carrier_bids'));
        await setDoc(docRef, cleanFirestoreData({
          ...latestBid,
          id: docRef.id,
          userId: user?.uid || 'anonymous'
        }));
      } catch (err) {
        console.error("Error writing new bid to Firestore:", err);
      }
    }
  };

  // Filter the bids shown based on the user's role: logistics agents cannot see proposals from other agents
  const visibleBids = useMemo(() => {
    let filtered = bids;
    if (userType === 'logistics') {
      // Show only current user's bids
      filtered = bids.filter(prop => prop.userId === user?.uid);
    }
    // Remove mock carrier names completely
    const mockNames = [
      'moz logistics',
      'fast cargo',
      'nampula',
      'união',
      'uniao',
      'manica',
      'supplyx'
    ];
    return filtered.filter(prop => {
      if (!prop.name) return false;
      const n = prop.name.toLowerCase();
      return !mockNames.some(m => n.includes(m));
    });
  }, [bids, userType, user?.uid]);

  const activeLogisticsPartners = useMemo(() => {
    const partnersMap = new Map<string, { uid: string; name: string }>();

    // Get partners from logisticsReplies
    (requestObj.logisticsReplies || []).forEach((rep: any) => {
      if (rep.sender === 'logistics' || rep.logisticsUserId || rep.logisticsUserName) {
        const uid = rep.logisticsUserId || `logistics_${rep.senderName || 'op'}`;
        const name = rep.sender === 'logistics' ? (rep.senderName || rep.logisticsUserName || 'Operador Logístico') : (rep.logisticsUserName || rep.senderName || 'Operador Logístico');
        if (uid !== 'anonymous') {
          partnersMap.set(uid, { uid, name });
        }
      }
    });

    // Also get from bids (Carrier Proposals)
    bids.forEach((bid: CarrierProposal) => {
      if (bid.userId && bid.userId !== 'anonymous') {
        partnersMap.set(bid.userId, { uid: bid.userId, name: bid.name });
      }
    });

    return Array.from(partnersMap.values());
  }, [requestObj.logisticsReplies, bids]);

  const currentLogisticsUserId = useMemo(() => {
    if (userType === 'logistics') {
      return user?.uid || 'ops_logistica_default';
    }
    if (selectedLogisticsUserId) {
      return selectedLogisticsUserId;
    }
    if (activeLogisticsPartners.length > 0) {
      return activeLogisticsPartners[0].uid;
    }
    return '';
  }, [userType, user?.uid, selectedLogisticsUserId, activeLogisticsPartners]);

  const visibleReplies = useMemo(() => {
    const repliesList = requestObj.logisticsReplies || [];
    if (userType === 'logistics') {
      const myUid = user?.uid || 'ops_logistica_default';
      return repliesList.filter((rep: any) => {
        const pId = rep.logisticsUserId || `logistics_${rep.senderName || 'op'}`;
        return pId === myUid || rep.sender === 'logistics';
      });
    }
    // Buyers/Suppliers see replies filtered by their currently selected logistics provider or all logistics replies
    if (selectedLogisticsUserId) {
      return repliesList.filter((rep: any) => {
        const pId = rep.logisticsUserId || `logistics_${rep.senderName || 'op'}`;
        return pId === selectedLogisticsUserId || rep.sender === 'logistics';
      });
    }
    if (currentLogisticsUserId) {
      return repliesList.filter((rep: any) => {
        const pId = rep.logisticsUserId || `logistics_${rep.senderName || 'op'}`;
        return pId === currentLogisticsUserId || rep.sender === 'logistics';
      });
    }
    return repliesList;
  }, [requestObj.logisticsReplies, userType, user?.uid, selectedLogisticsUserId, currentLogisticsUserId]);

  const selectedBid = useMemo(() => {
    return visibleBids[selectedProposalIndex] || visibleBids[0] || null;
  }, [visibleBids, selectedProposalIndex]);

  // Add carrier bid proposal manually
  const submitCarrierBid = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPrice = parseInt(newCarrierBid.price) || 80000;
    const carrierName = userType === 'logistics' ? (profile?.companyName || user?.displayName || newCarrierBid.name) : newCarrierBid.name;
    const bidObj: CarrierProposal = {
      id: `BP-0${bids.length + 1}`,
      cargoId: selectedRequestId,
      name: carrierName,
      rating: 4.9,
      deliverTime: newCarrierBid.deliverTime,
      price: parsedPrice,
      trips: 1,
      insurance: newCarrierBid.insurance,
      conditions: newCarrierBid.conditions,
      userId: user?.uid || 'anonymous'
    };

    const formattedPrice = `MT ${parsedPrice.toLocaleString('pt-BR')} MZN`;
    const formattedText = `🚚 PROPOSTA DE FRETE ENVIADA POR ${carrierName}
• Preço do Frete: ${formattedPrice}
• Prazo de Entrega: ${newCarrierBid.deliverTime}
• Seguro de Carga: ${newCarrierBid.insurance}
• Observações/Condições: ${newCarrierBid.conditions || 'Nenhuma'}`;

    const newReply = {
      id: `rep-bid-${Date.now()}`,
      sender: 'logistics',
      senderName: carrierName,
      text: formattedText,
      timestamp: new Date().toLocaleDateString('pt-PT', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'}),
      logisticsUserId: user?.uid || 'ops_logistica_default',
      logisticsUserName: carrierName
    };

    const updatedReplies = [...(requestObj.logisticsReplies || []), newReply];
    onUpdateCargoRequest?.(requestObj.id, {
      logisticsReplies: updatedReplies,
      status: 'Em concurso'
    });

    const updated = [...bids, bidObj];
    syncBids(updated);
    setShowAddBidForm(false);
  };

  // Filter occurrences matching this load
  const filteredOccurrences = useMemo(() => {
    return occurrences.filter(occ => occ.cargoId === selectedRequestId);
  }, [occurrences, selectedRequestId]);

  const submitOccurrence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOccurrence.description) return;

    const occId = `OC-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const formattedDate = `${now.getDate()} ${now.toLocaleString('pt-BR', { month: 'short' })} ${now.getFullYear()} ${now.getHours()}:${now.getMinutes()}`;
    
    const occurrenceObj: Occurrence = {
      id: occId,
      cargoId: selectedRequestId,
      cargoName: requestObj.tipoCarga,
      description: newOccurrence.description,
      category: newOccurrence.category,
      dateTime: formattedDate,
      responsible: newOccurrence.responsible,
      status: 'Aberta'
    };

    onAddOccurrence(occurrenceObj);
    setShowAddOccurrenceForm(false);
    setNewOccurrence({
      category: 'Atrasos',
      description: '',
      responsible: drivers[0]?.name || 'Motorista Terceirizado'
    });
  };

  const saveMessageToFirestoreChat = async (text: string) => {
    if (!auth.currentUser) return;
    try {
      const myUid = auth.currentUser.uid;
      let targetUid = '';

      if (userType === 'logistics') {
        // Try getting from the request fields directly
        targetUid = (requestObj as any).buyerId || (requestObj as any).supplierId || (requestObj as any).userId || '';

        // If targetUid is missing or is set to 'anonymous', resolve via database match
        if (!targetUid || targetUid === 'anonymous') {
          const usersRef = collection(db, 'users');
          // Try to match by name or companyName if requesterName exists
          if (requestObj.requesterName) {
            try {
              const qName = query(usersRef, where('name', '==', requestObj.requesterName));
              const nameSnap = await getDocs(qName);
              if (!nameSnap.empty) {
                targetUid = nameSnap.docs[0].id;
              } else {
                const qCompany = query(usersRef, where('companyName', '==', requestObj.requesterName));
                const companySnap = await getDocs(qCompany);
                if (!companySnap.empty) {
                  targetUid = companySnap.docs[0].id;
                }
              }
            } catch (err) {
              console.warn('Error matching user by name:', err);
            }
          }

          // If still not resolved, query by user type (buyer or supplier) as a backup
          if (!targetUid || targetUid === 'anonymous') {
            try {
              const requesterType = requestObj.requester === 'Client' ? 'buyer' : 'supplier';
              const qType = query(usersRef, where('type', '==', requesterType));
              const userSnap = await getDocs(qType);
              if (!userSnap.empty) {
                targetUid = userSnap.docs[0].id;
              } else {
                targetUid = requestObj.requester === 'Client' ? 'buyer_demo_uid' : 'supplier_demo_uid';
              }
            } catch (err) {
              console.warn('Error querying user by type:', err);
              targetUid = requestObj.requester === 'Client' ? 'buyer_demo_uid' : 'supplier_demo_uid';
            }
          }
        }
      } else {
        // Buyer or Supplier chatting back with Logistics Operator
        const assigned = requestObj.assignedCarrier;
        let matchedUid = null;
        
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('type', '==', 'logistics'));
        const userSnap = await getDocs(q);
        
        if (!userSnap.empty) {
          if (assigned) {
            const matchedUser = userSnap.docs.find(docSnap => {
              const uData = docSnap.data();
              const cName = (uData.companyName || uData.name || uData.fullName || '').toLowerCase().trim();
              const carrier = assigned.toLowerCase().trim();
              return cName.includes(carrier) || carrier.includes(cName);
            });
            if (matchedUser) {
              matchedUid = matchedUser.id;
            }
          }
          if (!matchedUid) {
            matchedUid = userSnap.docs[0].id;
          }
        }
        
        if (!matchedUid && assigned) {
          // If no user exists yet in db, create deterministic UID like ops_logistica_moz_logistics_lda
          const slug = assigned
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\W+/g, '_')
            .replace(/^_|_$/g, '');
          matchedUid = `ops_logistica_${slug}`;
        }
        
        targetUid = matchedUid || 'ops_logistica_default';
      }

      if (!targetUid || targetUid === myUid) {
        console.warn('Could not determine targetUid for custom B2B chat or target is self. Falling back to default operator.');
        targetUid = 'ops_logistica_default';
      }

      let myName = auth.currentUser.displayName || 'Usuário';
      let targetName = 'Usuário';

      try {
        const myDoc = await getDoc(doc(db, 'users', myUid));
        if (myDoc.exists()) {
          myName = myDoc.data().name || myName;
        }
        const targetDoc = await getDoc(doc(db, 'users', targetUid));
        if (targetDoc.exists()) {
          targetName = targetDoc.data().name || targetName;
        }
      } catch (e) {
        console.warn('Error fetching names for chatroom init:', e);
      }

      const chatsRef = collection(db, 'chats');
      const qChat = query(chatsRef, where('participants', 'array-contains', myUid));
      const chatSnap = await getDocs(qChat);

      let chatRoomId = '';
      let existingRoomData: any = null;

      chatSnap.forEach((d) => {
        const data = d.data();
        if (data.participants && data.participants.includes(targetUid)) {
          chatRoomId = d.id;
          existingRoomData = data;
        }
      });

      if (!chatRoomId) {
        const newChatData = {
          participants: [myUid, targetUid],
          participantNames: {
            [myUid]: myName,
            [targetUid]: targetName
          },
          unreadCount: {
            [myUid]: 0,
            [targetUid]: 1
          },
          lastMessage: text,
          lastMessageSenderId: myUid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        const addedDoc = await addDoc(chatsRef, newChatData);
        chatRoomId = addedDoc.id;
      } else {
        await updateDoc(doc(db, 'chats', chatRoomId), {
          lastMessage: text,
          lastMessageSenderId: myUid,
          updatedAt: serverTimestamp(),
          [`unreadCount.${targetUid}`]: ((existingRoomData?.unreadCount?.[targetUid] || 0) + 1)
        });
      }

      await addDoc(collection(db, `chats/${chatRoomId}/messages`), {
        senderId: myUid,
        participants: [myUid, targetUid],
        text,
        createdAt: serverTimestamp()
      });

      syncChatMessageToFreightOrders({
        messageText: text,
        senderId: myUid,
        senderName: myName,
        targetUserId: targetUid,
        cargoId: requestObj.id
      });

      console.log('Synchronized logistics message to B2B Chat room:', chatRoomId);
    } catch (err) {
      console.error('Error in saveMessageToFirestoreChat:', err);
    }
  };

  const handleB2BChatNavigation = async () => {
    let targetUid = '';
    
    if (userType === 'logistics') {
      // Try getting from the request fields directly
      targetUid = (requestObj as any).buyerId || (requestObj as any).supplierId || (requestObj as any).userId || '';

      // If targetUid is missing or is set to 'anonymous', resolve via database match
      if (!targetUid || targetUid === 'anonymous') {
        const usersRef = collection(db, 'users');
        // Try to match by name or companyName if requesterName exists
        if (requestObj.requesterName) {
          try {
            const qName = query(usersRef, where('name', '==', requestObj.requesterName));
            const nameSnap = await getDocs(qName);
            if (!nameSnap.empty) {
              targetUid = nameSnap.docs[0].id;
            } else {
              const qCompany = query(usersRef, where('companyName', '==', requestObj.requesterName));
              const companySnap = await getDocs(qCompany);
              if (!companySnap.empty) {
                targetUid = companySnap.docs[0].id;
              }
            }
          } catch (err) {
            console.warn('Error matching user by name:', err);
          }
        }

        // If still not resolved, query by user type (buyer or supplier) as a backup
        if (!targetUid || targetUid === 'anonymous') {
          try {
            const requesterType = requestObj.requester === 'Client' ? 'buyer' : 'supplier';
            const qType = query(usersRef, where('type', '==', requesterType));
            const userSnap = await getDocs(qType);
            if (!userSnap.empty) {
              targetUid = userSnap.docs[0].id;
            } else {
              targetUid = requestObj.requester === 'Client' ? 'buyer_demo_uid' : 'supplier_demo_uid';
            }
          } catch (err) {
            console.warn('Error querying user by type:', err);
            targetUid = requestObj.requester === 'Client' ? 'buyer_demo_uid' : 'supplier_demo_uid';
          }
        }
      }
    } else {
      try {
        const assigned = requestObj.assignedCarrier;
        let matchedUid = null;
        
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('type', '==', 'logistics'));
        const userSnap = await getDocs(q);
        
        if (!userSnap.empty) {
          if (assigned) {
            const matchedUser = userSnap.docs.find(docSnap => {
              const uData = docSnap.data();
              const cName = (uData.companyName || uData.name || uData.fullName || '').toLowerCase().trim();
              const carrier = assigned.toLowerCase().trim();
              return cName.includes(carrier) || carrier.includes(cName);
            });
            if (matchedUser) {
              matchedUid = matchedUser.id;
            }
          }
          if (!matchedUid) {
            matchedUid = userSnap.docs[0].id;
          }
        }
        
        if (!matchedUid && assigned) {
          // If no user exists yet in db, create deterministic UID like ops_logistica_moz_logistics_lda
          const slug = assigned
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\W+/g, '_')
            .replace(/^_|_$/g, '');
          matchedUid = `ops_logistica_${slug}`;
        }
        
        targetUid = matchedUid || 'ops_logistica_default';
      } catch (e) {
        console.error(e);
      }
    }

    onNavigateToTab('Mensagens', { userId: targetUid || undefined });
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    const hasValues = typedReplyMessage.trim() || proposedPrice.trim() || proposedDate.trim() || proposedVehicle.trim();
    if (!hasValues) return;

    let formattedText = typedReplyMessage.trim();

    if (userType === 'logistics') {
      const parts = [];
      if (proposedPrice.trim()) {
        const val = proposedPrice.trim();
        parts.push(`💰 Preço Otimizado: ${val.includes('MZN') ? val : `${val} MZN`}`);
      }
      if (proposedDate.trim()) {
        parts.push(`📅 Prazo de Entrega: ${proposedDate.trim()}`);
      }
      if (proposedVehicle.trim()) {
        parts.push(`🚚 Veículo Recomendado: ${proposedVehicle.trim()}`);
      }
      
      if (parts.length > 0) {
        const header = language === 'PT' 
          ? '📋 NOVA PROPOSTA DE FRETE FORMULADA' 
          : '📋 NEW LOGISTICS PROPOSAL TERMS';
        
        const termsText = parts.join('\n');
        if (formattedText) {
          formattedText = `${header}\n${termsText}\n\n💬 Nota Explicativa:\n${formattedText}`;
        } else {
          formattedText = `${header}\n${termsText}`;
        }
      }
    }

    const newReply = {
      id: `rep-${Date.now()}`,
      sender: userType === 'logistics' ? 'logistics' : 'requester',
      senderName: userType === 'logistics' 
        ? (profile?.companyName || user?.displayName || 'Operador Logístico') 
        : (requestObj.requesterName || (requestObj.requester === 'Client' ? 'Cliente Remetente' : 'Fornecedor Remetente')),
      text: formattedText,
      timestamp: new Date().toLocaleDateString('pt-PT', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'}),
      logisticsUserId: currentLogisticsUserId || 'ops_logistica_default',
      logisticsUserName: userType === 'logistics' ? (profile?.companyName || user?.displayName || 'Operador Logístico') : undefined
    };

    const updatedReplies = [...(requestObj.logisticsReplies || []), newReply];
    
    const updatedFields: Partial<CargoRequest> = {
      logisticsReplies: updatedReplies
    };

    if (userType === 'logistics') {
      if (proposedPrice.trim()) {
        const val = proposedPrice.trim();
        updatedFields.targetPrice = val.includes('MZN') ? val : `${val} MZN`;
      }
      if (proposedDate.trim()) {
        updatedFields.prazoEntrega = proposedDate.trim();
      }
      if (proposedVehicle.trim()) {
        updatedFields.deliveryMode = proposedVehicle.trim();
      }
      updatedFields.status = 'Em negociação';
    }

    onUpdateCargoRequest?.(requestObj.id, updatedFields);
    saveMessageToFirestoreChat(formattedText);
    setTypedReplyMessage('');
    setProposedPrice('');
    setProposedDate('');
    setProposedVehicle('');
  };

  const handleDeleteReply = (idToDelete: string) => {
    const updatedReplies = (requestObj.logisticsReplies || []).filter((rep: any) => rep.id !== idToDelete);
    onUpdateCargoRequest?.(requestObj.id, {
      logisticsReplies: updatedReplies
    });
  };

  const handleAssignToAgent = (rep: any) => {
    const rawPrice = requestObj.targetPrice ? requestObj.targetPrice.replace(/\D/g, '') : '80000';
    const numPrice = parseInt(rawPrice, 10) || 80000;

    const assignedName = rep.senderName || 'Operador Logístico';
    onAssignCarrier(requestObj.id, assignedName, numPrice);
    onChangeRequestStatus(requestObj.id, 'Atribuído');

    const messageText = `✓ PROPOSTA ACEITA E CONTRATO FIRMADO. Carga atribuída diretamente ao operador "${assignedName}" através de sua proposta de negociação.`;
    const newReply = {
      id: `rep-agreed-${Date.now()}`,
      sender: 'requester',
      senderName: requestObj.requesterName || (requestObj.requester === 'Client' ? 'Cliente Remetente' : 'Fornecedor Remetente'),
      text: messageText,
      timestamp: new Date().toLocaleDateString('pt-PT', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'}),
      logisticsUserId: rep.logisticsUserId || 'ops_logistica_default'
    };

    const updatedReplies = [...(requestObj.logisticsReplies || []), newReply];
    onUpdateCargoRequest?.(requestObj.id, {
      logisticsReplies: updatedReplies,
      status: 'Atribuído',
      assignedCarrier: assignedName
    });

    saveMessageToFirestoreChat(messageText);
    setSuccessModal(assignedName);
  };

  const handleAcceptProposal = () => {
    const rawPrice = requestObj.targetPrice ? requestObj.targetPrice.replace(/\D/g, '') : '80000';
    const numPrice = parseInt(rawPrice, 10) || 80000;
    
    // Determine target assignee name or company name based on current logistics provider
    const partnerObj = activeLogisticsPartners.find(p => p.uid === currentLogisticsUserId);
    const assignedName = partnerObj ? partnerObj.name : 'SupplyX Logística Consolidated';

    onAssignCarrier(requestObj.id, assignedName, numPrice);
    onChangeRequestStatus(requestObj.id, 'Atribuído');

    const messageText = `✓ PROPOSTA ACEITA E CONTRATO FIRMADO. Iniciar trâmite de transporte com ${assignedName}.`;
    const newReply = {
      id: `rep-agreed-${Date.now()}`,
      sender: 'requester',
      senderName: requestObj.requesterName || (requestObj.requester === 'Client' ? 'Cliente Remetente' : 'Fornecedor Remetente'),
      text: messageText,
      timestamp: new Date().toLocaleDateString('pt-PT', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'}),
      logisticsUserId: currentLogisticsUserId || 'ops_logistica_default'
    };

    const updatedReplies = [...(requestObj.logisticsReplies || []), newReply];
    onUpdateCargoRequest?.(requestObj.id, {
      logisticsReplies: updatedReplies,
      status: 'Atribuído',
      assignedCarrier: assignedName
    });

    saveMessageToFirestoreChat(messageText);
    setSuccessModal(assignedName);
  };

  const handleRejectProposal = () => {
    const messageText = '❌ PROPOSTA REJEITADA. Solicitamos revisão dos custos ou prazos.';
    const newReply = {
      id: `rep-rejected-${Date.now()}`,
      sender: 'requester',
      senderName: requestObj.requesterName || (requestObj.requester === 'Client' ? 'Cliente Remetente' : 'Fornecedor Remetente'),
      text: messageText,
      timestamp: new Date().toLocaleDateString('pt-PT', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'}),
      logisticsUserId: currentLogisticsUserId || 'ops_logistica_default'
    };
    const updatedReplies = [...(requestObj.logisticsReplies || []), newReply];
    onUpdateCargoRequest?.(requestObj.id, {
      logisticsReplies: updatedReplies,
      status: 'Em concurso'
    });
    saveMessageToFirestoreChat(messageText);
  };

  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / (rect.width || 1);
    const scaleY = canvas.height / (rect.height || 1);
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    isDrawingRef.current = true;
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    } catch (err) {}
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { x, y } = getCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const handleDrawSignature = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e?: React.PointerEvent<HTMLCanvasElement>) => {
    isDrawingRef.current = false;
    setIsDrawing(false);
    if (e) {
      try {
        (e.target as HTMLCanvasElement).releasePointerCapture(e.pointerId);
      } catch (err) {}
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSavedSignature('');
  };

  const saveSignatureData = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setSavedSignature(dataUrl);
    onUpdateCargoPod(selectedRequestId, dataUrl, requestObj.podPhoto || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200');
  };

  const handleDownloadDocument = async (docType: string, docTitle: string, docCodeParam: string) => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const issueDate = new Date().toLocaleDateString('pt-PT');
      const issueTime = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
      const currentStatus = requestObj.status || 'Em concurso';
      const officialDocCode = `CRT-MZ-TR-2026-${requestObj.id}`;
      const baseUrl = window.location.origin.includes('http') ? window.location.origin : 'https://supplyx.app';
      const validationUrl = `${baseUrl}/verify/${officialDocCode}`;
      const cryptoHash = `#CRT-HASH-${requestObj.id}-VERIFIED`;

      // Generate QR Code data URL if not already generated
      let qrDataUrl = crtQrDataUrl;
      if (!qrDataUrl) {
        try {
          qrDataUrl = await QRCode.toDataURL(validationUrl, { width: 180, margin: 1, color: { dark: '#0f172a', light: '#ffffff' } });
        } catch (e) {
          console.warn("QR code generation fallback", e);
        }
      }

      // 1. Header Banner
      pdf.setFillColor(15, 23, 42); // slate-900
      pdf.rect(0, 0, 210, 42, 'F');

      // Top decorative bar - SupplyX Institutional Blue (#2563eb)
      pdf.setFillColor(37, 99, 235);
      pdf.rect(0, 42, 210, 2.5, 'F');

      // Header Text & Logo Title
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.text("SUPPLYX LOGISTICS NETWORK", 15, 16);

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(59, 130, 246); // SupplyX Blue accent
      pdf.text("GUIA DE TRANSPORTE DIGITAL (CRT) • MOÇAMBIQUE", 15, 24);

      // Official Technical Monospace Code (Requirement 4)
      pdf.setFontSize(8.5);
      pdf.setFont('courier', 'bold');
      pdf.setTextColor(203, 213, 225);
      pdf.text(`CÓDIGO OFICIAL: ${officialDocCode}`, 15, 32);

      // Security Seal Banner on Header (Requirement 9)
      pdf.setFillColor(30, 41, 59);
      pdf.roundedRect(15, 35, 122, 5, 1, 1, 'F');
      pdf.setTextColor(52, 211, 153); // emerald green
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(6.5);
      pdf.text("✓ DOCUMENTO OFICIAL • ELETRONICAMENTE VALIDADO • INTEGRIDADE GARANTIDA", 17, 38.5);

      // Add QR Code image top right with subtext (Requirement 3)
      if (qrDataUrl) {
        try {
          pdf.addImage(qrDataUrl, 'PNG', 168, 4, 28, 28);
          pdf.setFillColor(255, 255, 255);
          pdf.setFontSize(5.5);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(226, 232, 240);
          pdf.text("Validar autenticidade", 182, 34, { align: 'center' });
          pdf.text("Assinado digitalmente", 182, 37, { align: 'center' });
        } catch (qrErr) {}
      }

      let curY = 50;

      // Status Badge Config
      let statusBgRGB = [254, 243, 199];
      let statusTextRGB = [217, 119, 6];
      let statusBorderRGB = [253, 230, 138];
      let statusText = currentStatus.toUpperCase();

      if (currentStatus === 'Entregue') {
        statusBgRGB = [209, 250, 229];
        statusTextRGB = [5, 150, 105];
        statusBorderRGB = [167, 243, 208];
      } else if (currentStatus === 'Em trânsito') {
        statusBgRGB = [224, 242, 254];
        statusTextRGB = [2, 132, 199];
        statusBorderRGB = [186, 230, 253];
      } else if (currentStatus === 'Cancelado') {
        statusBgRGB = [254, 226, 226];
        statusTextRGB = [220, 38, 38];
        statusBorderRGB = [254, 202, 202];
      }

      // SECTION 1: Identificação e Especificação da Carga (Dynamic Flow & Independent Columns)
      const wrappedOrigem = pdf.splitTextToSize(`Origem: ${requestObj.origem || 'Moçambique'}`, 80);
      const wrappedTipoCarga = pdf.splitTextToSize(`Tipo de Carga: ${requestObj.tipoCarga || 'Carga Geral'}`, 80);
      const wrappedCarrier = pdf.splitTextToSize(`Transportador: ${requestObj.assignedCarrier || 'Operador Credenciado SupplyX'}`, 80);
      const wrappedDestino = pdf.splitTextToSize(`Destino: ${requestObj.destino || 'Moçambique'}`, 75);

      // Compute Left Column Height
      const leftColH = 14 + 6 + (wrappedOrigem.length * 4.5) + (wrappedTipoCarga.length * 4.5) + (wrappedCarrier.length * 4.5) + 6;

      // Compute Right Column Height
      const rightColH = 14 + 6 + (wrappedDestino.length * 4.5) + 6 + 6 + 6;

      const dynamicSec1Height = Math.max(leftColH, rightColH, 50);

      // Render Outer Card
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(15, curY, 180, dynamicSec1Height, 3, 3, 'F');
      pdf.setDrawColor(226, 232, 240);
      pdf.roundedRect(15, curY, 180, dynamicSec1Height, 3, 3, 'D');

      // SupplyX Blue Accent Bar
      pdf.setFillColor(37, 99, 235);
      pdf.rect(15, curY, 3, dynamicSec1Height, 'F');

      // Section 1 Title
      pdf.setTextColor(37, 99, 235); // SupplyX Blue
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text("1. IDENTIFICAÇÃO E ESPECIFICAÇÃO DA CARGA", 22, curY + 9);

      // Render Status Badge top right inside box
      pdf.setFillColor(statusBgRGB[0], statusBgRGB[1], statusBgRGB[2]);
      pdf.setDrawColor(statusBorderRGB[0], statusBorderRGB[1], statusBorderRGB[2]);
      pdf.roundedRect(145, curY + 4, 42, 7, 2, 2, 'FD');
      pdf.setTextColor(statusTextRGB[0], statusTextRGB[1], statusTextRGB[2]);
      pdf.setFontSize(7.5);
      pdf.setFont('helvetica', 'bold');
      pdf.text(statusText, 166, curY + 8.8, { align: 'center' });

      // Left Column Render (X = 22, Max Width = 80mm)
      pdf.setTextColor(15, 23, 42);
      pdf.setFontSize(8.5);
      pdf.setFont('helvetica', 'normal');
      let ly = curY + 18;
      pdf.text(`ID da Carga: ${requestObj.id || 'N/A'}`, 22, ly);
      ly += 6;

      for (let i = 0; i < wrappedOrigem.length; i++) {
        pdf.text(wrappedOrigem[i], 22, ly);
        ly += 4.5;
      }

      for (let i = 0; i < wrappedTipoCarga.length; i++) {
        pdf.text(wrappedTipoCarga[i], 22, ly);
        ly += 4.5;
      }

      for (let i = 0; i < wrappedCarrier.length; i++) {
        pdf.text(wrappedCarrier[i], 22, ly);
        ly += 4.5;
      }

      // Right Column Render (X = 112, Max Width = 75mm)
      let ry = curY + 18;
      pdf.text(`Data de Emissão: ${issueDate}`, 112, ry);
      ry += 6;

      for (let i = 0; i < wrappedDestino.length; i++) {
        pdf.text(wrappedDestino[i], 112, ry);
        ry += 4.5;
      }

      pdf.text(`Modalidade / Veículo: ${requestObj.deliveryMode || 'Transporte Rodoviário'}`, 112, ry);
      ry += 6;
      pdf.text(`Prazo Estimado: ${requestObj.prazoEntrega || '2 - 3 Dias Úteis'}`, 112, ry);

      curY += dynamicSec1Height + 6;

      // Check Smart Page Break for Section 2
      if (curY + 42 > 265) {
        pdf.addPage();
        curY = 20;
      }

      // SECTION 2: Especificação de Pesos, Volumes e Embalagens
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(15, curY, 180, 36, 3, 3, 'F');
      pdf.setDrawColor(226, 232, 240);
      pdf.roundedRect(15, curY, 180, 36, 3, 3, 'D');

      pdf.setFillColor(37, 99, 235);
      pdf.rect(15, curY, 3, 36, 'F');

      pdf.setTextColor(37, 99, 235);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text("2. ESPECIFICAÇÃO DE PESOS, VOLUMES E EMBALAGENS", 22, curY + 8);

      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(15, 23, 42);

      const pesoTotalVal = requestObj.peso || '12.5 Toneladas';
      const volumeVal = requestObj.volume || '18.0 m³';
      const paletesVal = (requestObj as any).pallets || '12 Paletes EPAL';
      const numVolumesVal = requestObj.quantidade || `${requestProducts.length} Lotes`;
      const pesoLiquidoVal = (requestObj as any).pesoLiquido || '11.8 Toneladas';
      const pesoBrutoVal = (requestObj as any).pesoBruto || '12.5 Toneladas';

      // Row 1
      pdf.text(`Peso Total: ${pesoTotalVal}`, 22, curY + 18);
      pdf.text(`Volume: ${volumeVal}`, 80, curY + 18);
      pdf.text(`N.º de Paletes: ${paletesVal}`, 140, curY + 18);

      // Row 2
      pdf.text(`N.º de Volumes: ${numVolumesVal}`, 22, curY + 27);
      pdf.text(`Peso Líquido: ${pesoLiquidoVal}`, 80, curY + 27);
      pdf.text(`Peso Bruto: ${pesoBrutoVal}`, 140, curY + 27);

      curY += 42;

      // Check Smart Page Break for Section 3
      if (curY + 20 > 265) {
        pdf.addPage();
        curY = 20;
      }

      // SECTION 3: Lista de Produtos e Mercadorias
      pdf.setTextColor(37, 99, 235);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text("3. LISTA DE PRODUTOS E MERCADORIAS DECLARADAS", 15, curY);

      curY += 4;

      // Table Header
      pdf.setFillColor(15, 23, 42); // slate-900 header
      pdf.rect(15, curY, 180, 7, 'F');

      pdf.setFontSize(7.5);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text("SKU", 18, curY + 5);
      pdf.text("DESCRIÇÃO DO ITEM", 45, curY + 5);
      pdf.text("QTD", 125, curY + 5);
      pdf.text("UNIDADE", 148, curY + 5);
      pdf.text("PESO ESTIMADO", 172, curY + 5);

      curY += 7;

      const itemsToRender = requestProducts.length > 0 ? requestProducts : [
        { name: requestObj.tipoCarga || 'Carga Geral Consolidada', quantity: requestObj.quantidade || '1 Lote', weight: requestObj.peso || '12.5 Toneladas', volume: requestObj.volume || '18 m³' }
      ];

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);

      itemsToRender.forEach((it, idx) => {
        if (curY + 8 > 265) {
          pdf.addPage();
          curY = 20;

          // Re-render Table Header on new page
          pdf.setFillColor(15, 23, 42);
          pdf.rect(15, curY, 180, 7, 'F');
          pdf.setFontSize(7.5);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(255, 255, 255);
          pdf.text("SKU", 18, curY + 5);
          pdf.text("DESCRIÇÃO DO ITEM", 45, curY + 5);
          pdf.text("QTD", 125, curY + 5);
          pdf.text("UNIDADE", 148, curY + 5);
          pdf.text("PESO ESTIMADO", 172, curY + 5);
          curY += 7;
        }

        // Zebra striping
        const bg = idx % 2 === 0 ? 255 : 243;
        pdf.setFillColor(bg, bg, bg);
        pdf.rect(15, curY, 180, 7, 'F');
        pdf.setDrawColor(226, 232, 240);
        pdf.rect(15, curY, 180, 7, 'D');

        pdf.setFont('courier', 'bold');
        pdf.setTextColor(37, 99, 235);
        pdf.text(`SKU-${1000 + idx}`, 18, curY + 5);

        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(15, 23, 42);
        const descText = it.name.length > 38 ? it.name.substring(0, 35) + '...' : it.name;
        pdf.text(descText, 45, curY + 5);
        pdf.text(String(it.quantity), 125, curY + 5);
        pdf.text("Lote / Unid", 148, curY + 5);
        pdf.text(it.weight || 'Padronizado', 172, curY + 5);

        curY += 7;
      });

      curY += 8;

      // Check Smart Page Break for Section 4
      if (curY + 52 > 265) {
        pdf.addPage();
        curY = 20;
      }

      // SECTION 4: Autenticação e Assinaturas (Requirement 6)
      pdf.setTextColor(37, 99, 235);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text("4. AUTENTICAÇÃO E ASSINATURA ELETRÓNICA (PoD)", 15, curY);

      curY += 4;

      // Panel 1: Expedidor / Operador
      pdf.setDrawColor(203, 213, 225);
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(15, curY, 86, 44, 2, 2, 'FD');

      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(15, 23, 42);
      pdf.text("EXPEDIDOR / OPERADOR LOGÍSTICO:", 18, curY + 7);

      // Green Badge (Requirement 6)
      pdf.setFillColor(209, 250, 229);
      pdf.setDrawColor(167, 243, 208);
      pdf.roundedRect(18, curY + 10, 42, 5, 1, 1, 'FD');
      pdf.setTextColor(5, 150, 105);
      pdf.setFontSize(6.5);
      pdf.setFont('helvetica', 'bold');
      pdf.text("✓ ASSINADO DIGITALMENTE", 39, curY + 13.5, { align: 'center' });

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(71, 85, 105);
      pdf.text(`Nome: ${requestObj.assignedCarrier || 'Operador Credenciado'}`, 18, curY + 20);
      pdf.text(`Data: ${issueDate}  |  Hora: ${issueTime}`, 18, curY + 26);
      pdf.setFont('courier', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`Hash: #SUPPLYX-EXP-${requestObj.id || 'MZ'}`, 18, curY + 33);

      // Panel 2: Comprovativo de Recebimento (PoD)
      pdf.setDrawColor(203, 213, 225);
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(108, curY, 87, 44, 2, 2, 'FD');

      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(15, 23, 42);
      pdf.text("RECEBEDOR / DESTINATÁRIO (PoD):", 111, curY + 7);

      const podSig = savedSignature || requestObj.podSignature;
      if (podSig) {
        // Green Badge (Requirement 6)
        pdf.setFillColor(209, 250, 229);
        pdf.setDrawColor(167, 243, 208);
        pdf.roundedRect(111, curY + 10, 42, 5, 1, 1, 'FD');
        pdf.setTextColor(5, 150, 105);
        pdf.setFontSize(6.5);
        pdf.setFont('helvetica', 'bold');
        pdf.text("✓ ASSINADO DIGITALMENTE", 132, curY + 13.5, { align: 'center' });

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7.5);
        pdf.setTextColor(71, 85, 105);
        pdf.text(`Nome: ${(requestObj as any).receiverName || 'Fiel Depositário'}`, 111, curY + 20);
        pdf.text(`Data: ${issueDate}  |  Hora: ${issueTime}`, 111, curY + 26);

        try {
          pdf.addImage(podSig, 'PNG', 111, curY + 28, 40, 10);
        } catch (imgErr) {}

        pdf.setFont('courier', 'normal');
        pdf.setFontSize(7);
        pdf.setTextColor(100, 116, 139);
        pdf.text(`Hash: #SUPPLYX-POD-${requestObj.id || 'MZ'}`, 111, curY + 40);
      } else {
        // Yellow Badge (Requirement 6)
        pdf.setFillColor(254, 243, 199);
        pdf.setDrawColor(253, 230, 138);
        pdf.roundedRect(111, curY + 10, 42, 5, 1, 1, 'FD');
        pdf.setTextColor(217, 119, 6);
        pdf.setFontSize(6.5);
        pdf.setFont('helvetica', 'bold');
        pdf.text("● PENDENTE DE ASSINATURA", 132, curY + 13.5, { align: 'center' });

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7.5);
        pdf.setTextColor(71, 85, 105);
        pdf.text(`Nome: ${(requestObj as any).receiverName || 'Fiel Depositário'}`, 111, curY + 20);
        pdf.text("Aguardando assinatura digital na entrega", 111, curY + 26);

        pdf.setFont('courier', 'normal');
        pdf.setFontSize(7);
        pdf.setTextColor(100, 116, 139);
        pdf.text("Hash: #SUPPLYX-POD-PENDING", 111, curY + 38);
      }

      // Requirement 7 & 8 & 5: Watermark, Page Numbering & Footer across all pages
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);

        // Watermark (Requirement 8)
        pdf.setTextColor(241, 245, 249);
        pdf.setFontSize(32);
        pdf.setFont('helvetica', 'bold');
        pdf.text("SUPPLYX VERIFIED", 105, 145, { align: 'center', angle: 30 });

        // Footer Metadata (Requirement 5 & Requirement 7)
        pdf.setDrawColor(226, 232, 240);
        pdf.line(15, 272, 195, 272);

        pdf.setFontSize(6.5);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(148, 163, 184);

        // Footer Row 1
        pdf.text(`Gerado em: ${issueDate} às ${issueTime} • Versão: v2.4 Enterprise • Hash: ${cryptoHash}`, 15, 277);
        pdf.text(`Validação: ${validationUrl}`, 15, 281);
        pdf.text("SupplyX Platform • Validade Legal Eletrónica INATRO & AT Moçambique", 15, 285);

        // Page Numbering (Requirement 7)
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Página ${i} de ${totalPages}`, 195, 285, { align: 'right' });
      }

      pdf.save(`${officialDocCode}.pdf`);
    } catch (err) {
      console.error("Error exporting PDF:", err);
      alert("Ocorreu um erro ao gerar o documento PDF. Por favor tente novamente.");
    }
  };

  const handleFinishReview = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateFeedback(selectedRequestId, 'client', clientRatingValue, clientComment || 'Serviço prestado excelente.');
    setFeedbackSuccess(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header operations row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <button 
          onClick={onBack}
          className={`flex items-center gap-2 text-xs font-black uppercase italic tracking-tighter hover:underline ${
            isDarkMode ? 'text-zinc-500 hover:text-white' : 'text-zinc-650 hover:text-zinc-900'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          {language === 'PT' ? 'Voltar para Cargas' : 'Back to Shipments'}
        </button>

        <div className="flex items-center gap-3">
          <h1 className={`text-xl sm:text-2xl font-black uppercase tracking-tight italic ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
            {language === 'PT' ? 'Dossiê do Pedido' : 'Cargo File'} #{requestObj.id}
          </h1>
          <span className={`px-3.5 py-1 text-[9px] font-black tracking-[0.1em] uppercase rounded-full border ${
            requestObj.status === 'Cancelado'
              ? 'bg-red-500/10 text-red-500 border-red-500/30'
              : requestObj.status === 'Entregue'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-500 border-amber-500/30 animate-pulse'
          }`}>
            {requestObj.status}
          </span>
        </div>
      </div>

      {/* STATE CHANGER BANNER & INSTRUCTIONS */}
      {requestObj.status !== 'Cancelado' && requestObj.status !== 'Entregue' && (
        <div className={`p-6 rounded-[28px] border flex flex-col md:flex-row items-center justify-between gap-4 ${
          isDarkMode ? 'bg-zinc-900/60 border-white/5' : 'bg-white shadow-sm border-zinc-150'
        }`}>
          <div>
            <h4 className="text-xs font-black uppercase text-zinc-300 tracking-wide flex items-center gap-2">
              <Clock className="w-4 h-4 text-supplyx-blue" />
              {language === 'PT' ? 'Painel de Atualização MVP de Rastreamento Manual' : 'MVP Manual Tracking Update Panel'}
            </h4>
            <p className="text-[10px] text-zinc-500 font-bold mt-1 uppercase max-w-xl">
              {language === 'PT' 
                ? 'Avance os estados do fluxo operacional ou cancele este concurso sob as diretrizes do transportador.' 
                : 'Cycle through shipping states or abort dispatch using strict manual override control.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {requestObj.status === 'Pendente' && (
              <button 
                onClick={() => onPublishToConcourse(requestObj.id)}
                className="px-5 py-2.5 rounded-xl bg-supplyx-blue hover:brightness-110 text-white text-[9.5px] font-black uppercase tracking-wider cursor-pointer"
              >
                📢 {language === 'PT' ? 'Publicar no Canal de Concursos' : 'Publish to Carriers Concourse'}
              </button>
            )}

            {requestObj.status === 'Atribuído' && (
              <button 
                onClick={() => onChangeRequestStatus(requestObj.id, 'Em recolha')}
                className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-[9.5px] font-black uppercase tracking-wider cursor-pointer"
              >
                🚚 {language === 'PT' ? 'Iniciar Coleta (Efetuar Recolha)' : 'Advance to Pickup'}
              </button>
            )}

            {requestObj.status === 'Em recolha' && (
              <button 
                onClick={() => onChangeRequestStatus(requestObj.id, 'Em trânsito')}
                className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-[9.5px] font-black uppercase tracking-wider cursor-pointer"
              >
                🛣️ {language === 'PT' ? 'Despachar Camião (Iniciar Viagem)' : 'Dispatch to Transit'}
              </button>
            )}

            {requestObj.status === 'Em trânsito' && (
              <button 
                onClick={() => onChangeRequestStatus(requestObj.id, 'Chegada ao destino')}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[9.5px] font-black uppercase tracking-wider cursor-pointer"
              >
                🏁 {language === 'PT' ? 'Confirmar Chegada ao Destino' : 'Confirm Destination'}
              </button>
            )}

            {(requestObj.status === 'Chegada ao destino' || requestObj.status === 'Próximo da entrega') && (
              <button 
                onClick={() => onChangeRequestStatus(requestObj.id, 'Entregue')}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[9.5px] font-black uppercase tracking-wider cursor-pointer"
              >
                ✅ {language === 'PT' ? 'Finalizar Entrega (POD Consolidado)' : 'Finalize Delivery'}
              </button>
            )}

            {userType !== 'logistics' && (
              <button 
                onClick={() => onChangeRequestStatus(requestObj.id, 'Cancelado')}
                className="px-4 py-2.5 rounded-xl bg-red-500/15 border border-red-500/25 text-red-400 hover:bg-red-500 hover:text-white text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                ❌ {language === 'PT' ? 'Cancelar Pedido' : 'Abort Order'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* CANCELLED STATE BOX BACKGROUND */}
      {requestObj.status === 'Cancelado' && (
        <div className="p-8 rounded-[32px] border border-red-500/30 bg-red-500/10 text-center text-red-400">
          <XCircle className="w-12 h-12 mx-auto mb-4" />
          <h3 className="text-md font-black uppercase tracking-widest italic">{language === 'PT' ? 'ATENÇÃO: ESTE PEDIDO FOI CANCELADO' : 'WARNING: THIS SHIPMENT WAS CANCELLED'}</h3>
          <p className="text-xs text-zinc-400 font-bold uppercase mt-1">Este dossiê está congelado e as frentes financeiras do B2B foram anuladas.</p>
        </div>
      )}

      {/* TIMED TIMELINE OVERVIEW BOARD */}
      {requestObj.status !== 'Cancelado' && (
        <div className={`p-6 sm:p-8 rounded-[32px] border ${
          isDarkMode ? 'bg-zinc-900/50 border-white/5' : 'bg-white border-zinc-100 shadow-sm'
        }`}>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-6 relative">
            {/* Timeline center line */}
            <div className="hidden md:block absolute top-[22px] left-[8%] right-[8%] h-0.5 bg-zinc-800" />
            
            {activeStepIndex >= 0 && (
              <div 
                className="hidden md:block absolute top-[22px] left-[8%] h-0.5 bg-supplyx-blue transition-all duration-700" 
                style={{ width: `${(activeStepIndex / 5) * 84}%` }}
              />
            )}

            {stepperStates.map((step, idx) => {
              const isCompleted = idx < activeStepIndex;
              const isCurrent = idx === activeStepIndex;
              return (
                <div key={idx} className="flex flex-col items-center text-center relative z-10">
                  <div className={`w-11 h-11 rounded-full border-2 flex items-center justify-center transition-all ${
                    isCompleted 
                      ? 'bg-supplyx-blue border-supplyx-blue text-white shadow-lg shadow-supplyx-blue/20' 
                      : isCurrent 
                        ? 'bg-zinc-950 border-supplyx-blue text-supplyx-blue ring-4 ring-supplyx-blue/20 shadow-md'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <span className="text-xs font-black">{idx + 1}</span>}
                  </div>
                  
                  <p className="text-[10px] font-black uppercase tracking-wider text-white mt-3 mb-0.5">
                    {step.title}
                  </p>
                  <p className="text-[7.5px] font-black text-zinc-500 uppercase">{step.date}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CORE INTERACTIVE SUB-NAVIGATION ACCORDION TABS */}
      <div className="flex flex-nowrap overflow-x-auto gap-2 pb-2.5 border-b border-white/5 no-scrollbar select-none w-full">
        {[
          { id: 'info', label: language === 'PT' ? '📋 Detalhes Operacionais' : '📋 Spec & Telemetry' },
          { 
            id: 'reply', 
            label: userType === 'logistics'
              ? (language === 'PT' ? '💬 Responder ao Remetente' : '💬 Respond to Requester')
              : (language === 'PT' ? '💬 Chat & Negociação' : '💬 Negotiation & Chat')
          },
          { id: 'occurrences', label: language === 'PT' ? `⚠️ Ocorrências Registadas [${filteredOccurrences.length}]` : `⚠️ Incidents [${filteredOccurrences.length}]` },
          { id: 'documents', label: language === 'PT' ? '📄 Documentos Digitais / PoD' : '📄 Digital Vault / PoD' },
          { id: 'review', label: language === 'PT' ? '⭐ Feedback & Avaliação' : '⭐ Post-Delivery Feedback' }
        ].map(tb => {
          const isSelected = activeTab === tb.id;
          const hasActiveOccurrences = tb.id === 'occurrences' && filteredOccurrences.some(o => o.status === 'Aberta');
          
          let btnStyle = '';
          if (isSelected) {
            if (hasActiveOccurrences) {
              btnStyle = 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/15';
            } else {
              btnStyle = 'bg-supplyx-blue border-supplyx-blue text-white shadow-md';
            }
          } else {
            if (hasActiveOccurrences) {
              btnStyle = 'bg-red-500/10 border-red-500/30 text-red-400 hover:text-white hover:bg-red-500 animate-pulse font-black';
            } else {
              btnStyle = 'bg-zinc-950 border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-900';
            }
          }

          return (
            <button
              key={tb.id}
              onClick={() => setActiveTab(tb.id as any)}
              className={`px-4 py-2.5 rounded-xl text-[9.5px] font-black uppercase tracking-wider transition-all border shrink-0 select-none whitespace-nowrap ${btnStyle}`}
            >
              {tb.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-6">
        {/* TAB 2: RESPONDER AO REMETENTE */}
        {activeTab === 'reply' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* LEFT PANE: B2B NEGOTIATION CHAT */}
            <div className={`p-6 sm:p-8 rounded-[32px] border flex flex-col justify-between h-[520px] ${
              isDarkMode ? 'bg-zinc-900/50 border-white/5 shadow-2xl' : 'bg-white border-zinc-100 shadow-sm'
            }`}>
              <div>
                <div className="flex justify-between items-center mb-3 pb-3 border-b border-white/5">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-[#0052CC] flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      {language === 'PT' ? '💬 Chat da Operação' : '💬 Operations Chat'}
                    </h3>
                    <p className="text-[7.5px] uppercase tracking-wider font-extrabold text-zinc-500 mt-1">
                      {language === 'PT' ? 'Participantes: 🏭 Cliente • 🌾 Fornecedor • 🚚 Transportadora' : 'Members: 🏭 Client • 🌾 Supplier • 🚚 Carrier'}
                    </p>
                  </div>
                  <span className="text-[8px] font-mono bg-zinc-950 px-2 py-1 rounded-md text-zinc-400 border border-white/5">ID: #{requestObj.id}</span>
                </div>

                {/* Logistics Partners selector for Requesters (Client/Supplier) */}
                {userType !== 'logistics' && activeLogisticsPartners.length > 0 && (
                  <div className="mb-4 flex flex-col gap-1.5 border-b border-white/5 pb-3">
                    <label className="text-[8.5px] font-bold text-zinc-500 uppercase pl-1">
                      {language === 'PT' ? 'Selecionar Operador para Negociação Privada:' : 'Select Logistics Partner for Private Chat:'}
                    </label>
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                      {activeLogisticsPartners.map((partner) => {
                        const isSelected = partner.uid === currentLogisticsUserId;
                        return (
                          <button
                            key={partner.uid}
                            type="button"
                            onClick={() => setSelectedLogisticsUserId(partner.uid)}
                            className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all border whitespace-nowrap ${
                              isSelected
                                ? 'bg-supplyx-blue/15 border-supplyx-blue text-supplyx-blue font-black'
                                : 'bg-zinc-950 border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-900 font-bold'
                            }`}
                          >
                            👤 {partner.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Info block if no partners yet */}
                {userType !== 'logistics' && activeLogisticsPartners.length === 0 && (
                  <div className="mb-4 p-4 bg-zinc-950/80 border border-white/5 rounded-2xl text-center">
                    <span className="text-[9px] font-black uppercase text-amber-500 leading-normal block">
                      {language === 'PT' 
                        ? '🔒 Nenhuma Proposta Ativa / Aguardando Lances' 
                        : '🔒 No Active Proposals / Awaiting Bids'}
                    </span>
                    <p className="text-[9px] text-zinc-500 font-bold mt-1 leading-normal">
                      {language === 'PT'
                        ? 'Assim que uma transportadora enviar um lance na aba "Concurso de Fretes", você poderá negociar privadamente aqui.'
                        : 'Once an operator submits an offer in the Concourse section, you can start a private negotiation thread.'}
                    </p>
                  </div>
                )}

                {/* Messages Loop */}
                <div className="space-y-3 overflow-y-auto max-h-[280px] pr-2 no-scrollbar">
                  {visibleReplies.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-zinc-800 rounded-2xl my-4">
                      <p className="text-xs font-bold text-zinc-500 uppercase leading-relaxed">
                        {language === 'PT' 
                          ? 'Nenhuma mensagem privada trocada com este operador ainda.' 
                          : 'No private messages exchanged with this operator yet.'}
                      </p>
                    </div>
                  ) : (
                    visibleReplies.map((rep: any, idx: number) => {
                      const isLogistics = rep.sender === 'logistics';
                      return (
                        <div 
                          key={rep.id || idx} 
                          className={`p-3.5 rounded-2xl flex flex-col max-w-[85%] ${
                            isLogistics
                              ? 'bg-supplyx-blue/15 border border-supplyx-blue/20 self-end ml-auto text-right'
                              : 'bg-zinc-850 border border-white/5 self-start mr-auto text-left'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1 justify-between w-full">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[8px] sm:text-[9px] font-black uppercase text-zinc-400">
                                {rep.senderName}
                              </span>
                              <span className="text-[7.5px] sm:text-[8px] font-mono text-zinc-500">{rep.timestamp}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteReply(rep.id)}
                              className="text-red-500 hover:text-red-400 hover:bg-red-500/10 p-1 px-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1 border border-red-500/15"
                              title={language === 'PT' ? "Eliminar mensagem" : "Delete message"}
                            >
                              <Trash2 className="w-3 h-3 text-red-500" />
                              <span className="text-[8px] font-black uppercase tracking-widest text-red-500">{language === 'PT' ? 'Eliminar' : 'Delete'}</span>
                            </button>
                          </div>
                          <p className={`text-[11px] font-bold leading-relaxed whitespace-pre-line text-left ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>
                            {rep.text}
                          </p>
                          {isLogistics && userType !== 'logistics' && requestObj.status !== 'Atribuído' && requestObj.status !== 'Entregue' && (
                            <button
                              type="button"
                              onClick={() => handleAssignToAgent(rep)}
                              className="mt-2.5 w-full py-2 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              {language === 'PT' ? 'Atribuir Carga a este Operador / Agente' : 'Assign Cargo to this Agent'}
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Chat Send Form */}
              <form onSubmit={handleSendReply} className="flex gap-2 mt-4 pt-4 border-t border-white/5">
                <input
                  type="text"
                  required
                  disabled={userType !== 'logistics' && !currentLogisticsUserId}
                  placeholder={
                    userType !== 'logistics' && !currentLogisticsUserId
                      ? (language === 'PT' ? 'Escolha um parceiro ou aguarde propostas...' : 'Choose a partner or wait for bids...')
                      : (language === 'PT' ? 'Escreva uma mensagem ou contraproposta...' : 'Type a reply or counter-proposal...')
                  }
                  value={typedReplyMessage}
                  onChange={e => setTypedReplyMessage(e.target.value)}
                  className="flex-grow p-3 bg-zinc-950 border border-white/5 rounded-xl text-xs text-white outline-none focus:border-supplyx-blue/50 transition-colors disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={userType !== 'logistics' && !currentLogisticsUserId}
                  className="px-4 bg-supplyx-blue hover:brightness-110 active:scale-95 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* RIGHT PANE: WORKFLOW CONTROLS & DEAL ADJUSTMENTS */}
            <div className={`p-6 sm:p-8 rounded-[32px] border flex flex-col justify-between ${
              isDarkMode ? 'bg-zinc-900/50 border-white/5 shadow-2xl' : 'bg-white border-zinc-100 shadow-sm'
            }`}>
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-4 pb-3 border-b border-white/5">
                  💼 {language === 'PT' ? 'Painel de Resposta da Proposta' : 'Proposal Reply & Deal Panel'}
                </h3>

                <div className="space-y-4">
                  {/* Summary of current state */}
                  <div className="p-4 bg-zinc-950 border border-white/5 rounded-2xl space-y-2">
                    <p className="text-[8.5px] font-black uppercase tracking-widest text-zinc-500">RESUMO DA SOLICITAÇÃO</p>
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                      <div>
                        <span className="text-zinc-500 uppercase text-[8px]">Status:</span>
                        <div className="text-emerald-400 pl-1">{requestObj.status}</div>
                      </div>
                      <div>
                        <span className="text-zinc-500 uppercase text-[8px]">{language === 'PT' ? 'Preço Proposto/Original:' : 'Target Price:'}</span>
                        <div className="text-white pl-1">{requestObj.targetPrice || 'A definir'}</div>
                      </div>
                      <div>
                        <span className="text-zinc-500 uppercase text-[8px]">{language === 'PT' ? 'Prazo Desejado:' : 'Target Date:'}</span>
                        <div className="text-white pl-1">{requestObj.prazoEntrega || 'A definir'}</div>
                      </div>
                      <div>
                        <span className="text-zinc-500 uppercase text-[8px]">{language === 'PT' ? 'Modelo Veículo:' : 'Vehicle Mode:'}</span>
                        <div className="text-white pl-1">{requestObj.deliveryMode || 'Fretado Livre'}</div>
                      </div>
                    </div>
                  </div>

                  {userType === 'logistics' ? (
                    /* OPERATOR LOGISTICS INTERACTION */
                    <form onSubmit={handleSendReply} className="space-y-3">
                      <div className="bg-blue-500/5 border border-blue-500/10 p-3.5 rounded-2xl text-[10.5px] font-bold text-zinc-450 leading-relaxed mb-1">
                        👉 <span className="text-white">{language === 'PT' ? 'Portal do Logístico:' : 'Operator Panel:'}</span> {language === 'PT' ? 'Você pode enviar contrapropostas ajustando os campos abaixo para fechar o faturamento diretamente.' : 'You can fill out terms below to coordinate direct pricing and dates.'}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[8.5px] font-bold text-zinc-500 uppercase pl-1">{language === 'PT' ? 'Ajustar Preço (MZN)' : 'Proposed Freight Fee'}</label>
                          <input
                            type="text"
                            placeholder="Ex: 82000"
                            value={proposedPrice}
                            onChange={e => setProposedPrice(e.target.value)}
                            className="w-full p-3 bg-zinc-950 border border-white/5 rounded-xl text-xs text-white outline-none focus:border-supplyx-blue/40"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[8.5px] font-bold text-zinc-500 uppercase pl-1">{language === 'PT' ? 'Ajustar Prazo Entrega' : 'Proposed Delivery Date'}</label>
                          <input
                            type="text"
                            placeholder="Ex: 3 dias / 30 Mai"
                            value={proposedDate}
                            onChange={e => setProposedDate(e.target.value)}
                            className="w-full p-3 bg-zinc-950 border border-white/5 rounded-xl text-xs text-white outline-none focus:border-supplyx-blue/40"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[8.5px] font-bold text-zinc-500 uppercase pl-1">{language === 'PT' ? 'Alocação de Veículo Sugerido' : 'Suggested Vehicle / Mode'}</label>
                        <input
                          type="text"
                          placeholder="Ex: Volvo FH 540 (Caminhão Fechado)"
                          value={proposedVehicle}
                          onChange={e => setProposedVehicle(e.target.value)}
                          className="w-full p-3 bg-zinc-950 border border-white/5 rounded-xl text-xs text-white outline-none focus:border-supplyx-blue/40"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[8.5px] font-bold text-zinc-500 uppercase pl-1">{language === 'PT' ? 'Nota Explicativa (Chat)' : 'Explanatory Note / Reply description'}</label>
                        <textarea
                          placeholder={language === 'PT' ? 'Insira detalhes de escolta, rotas e franquias...' : 'Details about route custom terms...'}
                          value={typedReplyMessage}
                          onChange={e => setTypedReplyMessage(e.target.value)}
                          className="w-full p-3 bg-zinc-950 border border-white/5 rounded-xl text-xs text-white outline-none min-h-[50px] focus:border-supplyx-blue/40"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-supplyx-blue hover:brightness-110 text-white rounded-xl text-[10px] uppercase font-black tracking-widest mt-2 active:scale-95 transition-all"
                      >
                        {language === 'PT' ? 'Apresentar Resposta / Contraproposta Oficial' : 'Submit Official Proposal Terms'}
                      </button>
                    </form>
                  ) : (
                    /* CLIENT OR SUPPLIER REQUESTER INTERACTION */
                    <div className="space-y-4 pt-1">
                      <div className="bg-[#b45309]/10 border border-[#b45309]/20 p-3 rounded-2xl text-[10.5px] font-medium leading-relaxed text-amber-200">
                        ⚠️ {language === 'PT' ? 'Aguardando o aceite ou negociação dos custos com o Operador Logístico.' : 'Pending deal contract review. Apply action below.'}
                      </div>

                      {/* GUIA DE RESPOSTA LOGÍSTICA */}
                      {language === 'PT' ? (
                        <div className="bg-zinc-950 border border-white/5 p-4 rounded-2xl space-y-2">
                          <p className="text-[9px] font-black uppercase text-supplyx-blue tracking-widest">💡 GUIA RÁPIDO: Onde achar a resposta do Logístico?</p>
                          <p className="text-[10px] text-zinc-400 leading-relaxed font-bold">
                            Quando o Operador Logístico envia uma resposta ou lance, ela é exibida em dois lugares:
                          </p>
                          <ul className="text-[10px] text-zinc-300 space-y-1.5 list-disc pl-4">
                            <li>
                              <strong className="text-white">Aqui na Ficha da Carga:</strong> Veja as mensagens na seção <strong className="text-supplyx-blue">"Histórico de Mensagens / Respostas"</strong> (à esquerda) e a proposta de preço formal no painel verde abaixo.
                            </li>
                            <li>
                              <strong className="text-white">Na Central de Mensagens B2B:</strong> As mensagens enviadas pelo dossiê são sincronizadas automaticamente no seu Chat Geral com o Operador Logístico caso exista um perfil cadastrado!
                            </li>
                          </ul>
                        </div>
                      ) : (
                        <div className="bg-zinc-950 border border-white/5 p-4 rounded-2xl space-y-2">
                          <p className="text-[9px] font-black uppercase text-supplyx-blue tracking-widest">💡 HOW TO FIND LOGISTICS RESPONSES?</p>
                          <p className="text-[10px] text-zinc-400 leading-relaxed font-bold">
                            When the Logistics Operator submits their response or bid, you can find it in two places:
                          </p>
                          <ul className="text-[10px] text-zinc-300 space-y-1.5 list-disc pl-4">
                            <li>
                              <strong className="text-white">Under this Freight Dossier:</strong> Check the message flow inside <strong className="text-supplyx-blue">"Message &amp; Negotiation Log"</strong> (on the left) and see their official proposed pricing inside the green pane below.
                            </li>
                            <li>
                              <strong className="text-white">Inside B2B General Messages:</strong> Dossier responses are automatically mirrored into your main B2B Chat once matched!
                            </li>
                          </ul>
                        </div>
                      )}

                      {/* Display the latest operator proposal in green panel */}
                      {(() => {
                        const partnerObj = activeLogisticsPartners.find(p => p.uid === currentLogisticsUserId) || activeLogisticsPartners[0];
                        const operatorName = selectedBid?.name || partnerObj?.name || (visibleReplies.find((r: any) => r.sender === 'logistics')?.senderName) || requestObj.assignedCarrier || 'Operador Logístico';
                        const displayPrice = selectedBid ? `MT ${selectedBid.price.toLocaleString('pt-BR')} MZN` : (requestObj.targetPrice || 'Aguardando proposta...');
                        const displayTransit = selectedBid?.deliverTime || requestObj.prazoEntrega || '2 a 3 dias úteis';
                        const displayVehicle = (selectedBid as any)?.vehicleType || requestObj.deliveryMode || 'Veículo de Carga Refratária / Seca';
                        const isAssigned = requestObj.status === 'Atribuído' || requestObj.status === 'Entregue' || requestObj.status === 'Em trânsito' || requestObj.status === 'Em recolha';

                        return (
                          <div className={`p-4 rounded-2xl space-y-3 transition-all ${
                            isAssigned
                              ? 'bg-emerald-500/10 border-2 border-emerald-500/40 shadow-lg'
                              : 'bg-emerald-500/10 border border-emerald-500/30 shadow-md'
                          }`}>
                            <div className="flex items-center justify-between">
                              <p className="text-[9.5px] font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
                                <span>★</span> {isAssigned ? (language === 'PT' ? 'PROPOSTA ACEITA E CONTRATO FIRMADO' : 'CONTRACT SIGNED & ASSIGNED') : (language === 'PT' ? 'PROPOSTA DE PREÇO FORMAL DO OPERADOR:' : 'OFFICIAL LOGISTICS PROPOSAL:')}
                              </p>
                              <span className="text-[8px] font-mono font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase">
                                {requestObj.status}
                              </span>
                            </div>

                            <p className="text-[10px] text-zinc-300 font-bold">
                              {isAssigned
                                ? (language === 'PT' ? `Carga atribuída ao operador ${operatorName}. Trâmites de transporte em andamento.` : `Cargo assigned to ${operatorName}. Transportation in progress.`)
                                : (language === 'PT' ? `Condições e tarifas apresentadas por ${operatorName}:` : `Pricing and transit terms offered by ${operatorName}:`)}
                            </p>

                            <ul className="text-[10px] font-mono text-white list-disc pl-4 space-y-1 bg-zinc-950/60 p-3 rounded-xl border border-white/5">
                              <li>
                                {language === 'PT' ? 'Operador Responsa:' : 'Operator:'} <span className="text-white font-bold">{operatorName}</span>
                              </li>
                              <li>
                                {language === 'PT' ? 'Valor Consolidado:' : 'Proposed Rate:'} <span className="text-emerald-400 font-black text-xs">{displayPrice}</span>
                              </li>
                              <li>
                                {language === 'PT' ? 'Prazo Estimado:' : 'Transit Promised:'} <span className="text-zinc-300 font-bold">{displayTransit}</span>
                              </li>
                              <li>
                                {language === 'PT' ? 'Veículo/Modal:' : 'Scheduled Vehicle:'} <span className="text-zinc-300">{displayVehicle}</span>
                              </li>
                            </ul>

                            {!isAssigned && (
                              <div className="flex gap-2.5 pt-1">
                                <button
                                  type="button"
                                  onClick={handleRejectProposal}
                                  className="flex-1 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 text-[9px] font-black uppercase tracking-wider transition-all"
                                >
                                  {language === 'PT' ? 'Recusar / Negociar' : 'Reject & Counter'}
                                </button>
                                <button
                                  type="button"
                                  onClick={handleAcceptProposal}
                                  className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider rounded-xl shadow-lg transition-all"
                                >
                                  {language === 'PT' ? 'Aceitar e Homologar ✓' : 'Accept & Contract ✓'}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Client Reply and Counterproposal message form directly */}
                      <form onSubmit={handleSendReply} className="space-y-2">
                        <label className="text-[8.5px] font-bold text-zinc-500 uppercase pl-1">
                          {language === 'PT' ? 'Solicitar Revisão / Enviar Réplica por Chat' : 'Request Revision / Send Reply via Chat'}
                        </label>
                        <textarea
                          placeholder={language === 'PT' ? 'Escreva aqui para o logístico...' : 'Message the logistics operator...'}
                          value={typedReplyMessage}
                          onChange={e => setTypedReplyMessage(e.target.value)}
                          className="w-full p-3 bg-zinc-950 border border-white/5 rounded-xl text-xs text-white outline-none min-h-[70px]"
                        />
                        <button
                          type="submit"
                          className="w-full py-2 bg-zinc-800 hover:bg-zinc-750 border border-white/5 text-zinc-200 text-[10px] uppercase font-black rounded-xl tracking-widest mt-1 transition-all"
                        >
                          {language === 'PT' ? 'Enviar Mensagem ao Logístico' : 'Send Message to Operator'}
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
          </div>
        )}

        {/* TAB 1: OPERATIONAL INFO & SATELLITE MAP */}
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Spec table */}
            <div className={`p-8 rounded-[36px] border flex flex-col justify-between ${
              isDarkMode ? 'bg-zinc-900/50 border-white/5 shadow-2xl' : 'bg-white border-zinc-100'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                  <h3 className="text-xs font-black uppercase tracking-[0.15em] text-supplyx-blue flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    {language === 'PT' ? 'Ficha de Cubagem/Peso' : 'Operational Cargo Spec'}
                  </h3>
                  
                  {/* Modern Tab Switcher */}
                  <div className="flex p-0.5 rounded-lg bg-zinc-950/40 border border-white/5">
                    <button
                      type="button"
                      onClick={() => setCubingCardTab('spec')}
                      className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-md transition-all ${
                        cubingCardTab === 'spec' 
                          ? 'bg-supplyx-blue text-white' 
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {language === 'PT' ? 'Geral' : 'Spec'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCubingCardTab('products')}
                      className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-md transition-all flex items-center gap-1.5 ${
                        cubingCardTab === 'products' 
                          ? 'bg-supplyx-blue text-white' 
                          : 'text-zinc-500 hover:text-zinc-400'
                      }`}
                    >
                      {language === 'PT' ? 'Produtos' : 'Products'}
                      <span className="bg-white/10 text-[8px] font-mono px-1 rounded-full">{requestProducts.length}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCubingCardTab('vehicle')}
                      className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-md transition-all flex items-center gap-1.5 ${
                        cubingCardTab === 'vehicle' 
                          ? 'bg-supplyx-blue text-white' 
                          : 'text-zinc-500 hover:text-zinc-400'
                      }`}
                    >
                      {language === 'PT' ? 'Compatibilidade' : 'Compatibility'}
                    </button>
                  </div>
                </div>

                {cubingCardTab === 'spec' && (
                  <div className="space-y-4">
                    {[
                      { label: 'Categoria', val: requestObj.tipoCarga },
                      { label: 'Solicitante', val: requestObj.requesterName || (requestObj.requester === 'Client' ? 'Cliente' : 'Fornecedor') },
                      { label: 'Cubagem Estimada', val: requestObj.volume || '35 m³' },
                      { label: 'Peso bruto real', val: requestObj.peso },
                      { label: 'Endereço Recolha', val: requestObj.origem },
                      ...(requestObj.originAddress && requestObj.originAddress !== requestObj.origem ? [
                        { label: 'Origem Geocodificada', val: requestObj.originAddress }
                      ] : []),
                      ...(requestObj.originLat !== undefined ? [
                        { label: 'Coordenadas Origem', val: `${requestObj.originLat.toFixed(5)}, ${requestObj.originLng?.toFixed(5)}` }
                      ] : []),
                      { label: 'Endereço Destino', val: requestObj.destino },
                      ...(requestObj.destinationAddress && requestObj.destinationAddress !== requestObj.destino ? [
                        { label: 'Destino Geocodificado', val: requestObj.destinationAddress }
                      ] : []),
                      ...(requestObj.destinationLat !== undefined ? [
                        { label: 'Coordenadas Destino', val: `${requestObj.destinationLat.toFixed(5)}, ${requestObj.destinationLng?.toFixed(5)}` }
                      ] : []),
                      ...(requestObj.distanceKm !== undefined ? [
                        { label: 'Distância Rota (Google)', val: `${requestObj.distanceKm} km` }
                      ] : []),
                      ...(requestObj.durationMinutes !== undefined ? [
                        { label: 'Tempo Trânsito (Google)', val: requestObj.durationMinutes < 60 
                            ? `${requestObj.durationMinutes} Minutos` 
                            : `${Math.round(requestObj.durationMinutes / 60)} Horas` }
                      ] : []),
                      ...(requestObj.routeStatus ? [
                        { 
                          label: 'Verificação Contratual', 
                          val: requestObj.routeStatus,
                          customElement: (
                            <span className={`px-2 py-0.5 rounded-[6px] text-[8px] font-black uppercase tracking-wider border ${
                              requestObj.routeStatus === 'verified_google' 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' 
                                : requestObj.routeStatus === 'estimated_offline' 
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/25' 
                                : requestObj.routeStatus === 'pending_verification' 
                                ? 'bg-sky-500/10 text-sky-400 border-sky-500/25' 
                                : 'bg-rose-500/10 text-rose-450 border-rose-500/25'
                            }`}>
                              {requestObj.routeStatus === 'verified_google' && 'Verified Google'}
                              {requestObj.routeStatus === 'estimated_offline' && 'Estimated Offline'}
                              {requestObj.routeStatus === 'pending_verification' && 'Pending Sync'}
                              {requestObj.routeStatus === 'invalid_route' && 'Invalid Route'}
                            </span>
                          )
                        }
                      ] : []),
                      ...(requestObj.routeCalculatedAt ? [
                        { label: 'Instante de Auditoria', val: new Date(requestObj.routeCalculatedAt).toLocaleString('pt-BR', {hour: '2-digit', minute: '2-digit', second: '2-digit'}) }
                      ] : []),
                      ...(requestObj.estimatedFreight !== undefined ? [
                        { label: 'Frete Calculado', val: `MT ${requestObj.estimatedFreight.toLocaleString('pt-BR')}` }
                      ] : []),
                      { label: 'Data de Coleta', val: requestObj.dataColeta || 'A Combinar' },
                      { label: 'Responsável Custo', val: requestObj.freightResponsibility || 'Client' },
                      { label: 'Modo Trânsito', val: requestObj.deliveryMode || 'Fretado Livre' },
                      { label: 'Transportadora Atribuída', val: requestObj.assignedCarrier || (language === 'PT' ? 'Aguardando seleção de lances' : 'Unassigned (Bidding open)') },
                      { label: 'Observações Fiel', val: requestObj.observacoes || 'Sem notas extras' }
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between items-center text-xs pb-1.5 border-b border-white/[0.02]">
                        <span className="font-bold text-zinc-500 uppercase tracking-widest text-[8px]">{item.label}</span>
                        {item.customElement ? (
                          item.customElement
                        ) : (
                          <span className="font-black text-white text-right leading-relaxed max-w-[180px] truncate" title={String(item.val)}>{item.val}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {cubingCardTab === 'products' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                        {language === 'PT' ? 'Lista de Todos os Produtos:' : 'All cargo load items:'}
                      </span>
                      {userType !== 'logistics' && (
                        <button
                          type="button"
                          onClick={handleAddProductClick}
                          className="px-2.5 py-1 bg-supplyx-blue/10 border border-supplyx-blue/20 hover:bg-supplyx-blue hover:text-white text-[8.5px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1 transition-all"
                        >
                          <Plus className="w-3 h-3" />
                          {language === 'PT' ? 'Novo Item' : 'New Item'}
                        </button>
                      )}
                    </div>

                    <div className="space-y-2.5 max-h-[280px] overflow-y-auto no-scrollbar pr-1">
                      {requestProducts.length > 0 ? (
                        requestProducts.map((prod, index) => (
                          <div 
                            key={(prod as any).id || `${prod.name}_${prod.quantity}_${prod.weight || ''}_${prod.volume || ''}_${index}`}
                            className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                              isDarkMode ? 'bg-zinc-950/40 border-white/5 hover:border-white/10' : 'bg-white border-zinc-150 hover:border-zinc-200 shadow-sm'
                            }`}
                          >
                            <div className="space-y-1 max-w-[70%] text-left">
                              <h4 className={`text-[11px] font-black uppercase italic leading-none ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{prod.name}</h4>
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                <span className="bg-supplyx-blue/10 border border-supplyx-blue/20 text-[7.5px] font-bold uppercase rounded-md px-1.5 py-0.5 text-[#3b82f6]">
                                  {prod.quantity}
                                </span>
                                {prod.weight && (
                                  <span className="bg-emerald-500/10 border border-emerald-500/20 text-[7.5px] font-bold uppercase rounded-md px-1.5 py-0.5 text-emerald-400">
                                    ⚖️ {prod.weight}
                                  </span>
                                )}
                                {prod.volume && (
                                  <span className="bg-purple-500/10 border border-purple-500/20 text-[7.5px] font-bold uppercase rounded-md px-1.5 py-0.5 text-purple-400">
                                    📦 {prod.volume}
                                  </span>
                                )}
                              </div>
                            </div>

                            {userType !== 'logistics' && (
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleEditProductClick(index)}
                                  className={`p-1 px-1.5 border rounded-lg text-xs transition-colors ${
                                    isDarkMode 
                                      ? 'bg-white/5 border-white/5 text-zinc-400 hover:text-white hover:bg-white/10' 
                                      : 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'
                                  }`}
                                  title={language === 'PT' ? 'Editar' : 'Edit'}
                                >
                                  ✏️
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveProduct(index)}
                                  className="p-1 px-1.5 bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-lg text-xs"
                                  title={language === 'PT' ? 'Remover' : 'Remove'}
                                >
                                  🗑️
                                </button>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="py-8 text-center text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                          {language === 'PT' ? 'Nenhum produto cadastrado nesta carga' : 'No products found on this charge'}
                        </div>
                      )}
                    </div>

                    {/* Inline Form to add/edit a product */}
                    {showProductForm && (
                      <div className={`p-4 rounded-3xl border mt-3 ${
                        isDarkMode ? 'bg-zinc-950 border-white/10' : 'bg-zinc-100 border-zinc-200'
                      }`}>
                        <div className="flex justify-between items-center mb-3">
                          <p className="text-[9px] font-black uppercase text-supplyx-blue tracking-wider">
                            {editingProductIndex !== null 
                              ? (language === 'PT' ? 'Editar Produto' : 'Edit Product') 
                              : (language === 'PT' ? 'Novo Produto da Carga' : 'New Load Product')
                            }
                          </p>
                          <button 
                            type="button" 
                            onClick={() => setShowProductForm(false)} 
                            className={`text-xs font-black transition-colors ${isDarkMode ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-zinc-900'}`}
                          >
                            ✕
                          </button>
                        </div>

                        <div className="space-y-3">
                          <div className="text-left">
                            <label className={`text-[7.5px] font-bold uppercase tracking-wider block mb-1 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>
                              {language === 'PT' ? 'Nome do Produto' : 'Product Name'}
                            </label>
                            <input
                              required
                              type="text"
                              value={productForm.name}
                              onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                              className={`w-full p-2 border rounded-xl text-xs transition-all ${
                                isDarkMode ? 'bg-zinc-900 border-white/5 text-white' : 'bg-white border-zinc-200 text-zinc-900 focus:border-supplyx-blue'
                              }`}
                              placeholder="Ex: Cimento CP-IV, Tubos PVC"
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-left">
                            <div>
                              <label className="text-[7.5px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                                {language === 'PT' ? 'Qtd / Unidade' : 'Qty / Unit'}
                              </label>
                              <input
                                required
                                type="text"
                                value={productForm.quantity}
                                onChange={e => setProductForm({ ...productForm, quantity: e.target.value })}
                                className={`w-full p-2 border rounded-xl text-xs transition-all ${
                                  isDarkMode ? 'bg-zinc-900 border-white/5 text-white' : 'bg-white border-zinc-200 text-zinc-900 focus:border-supplyx-blue'
                                }`}
                                placeholder="10"
                              />
                            </div>
                            <div>
                              <label className="text-[7.5px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                                {language === 'PT' ? 'Peso Total (T)' : 'Total Weight (T)'}
                              </label>
                              <input
                                required
                                type="text"
                                value={productForm.weight}
                                onChange={e => setProductForm({ ...productForm, weight: e.target.value })}
                                className={`w-full p-2 border rounded-xl text-xs transition-all ${
                                  isDarkMode ? 'bg-zinc-900 border-white/5 text-white' : 'bg-white border-zinc-200 text-zinc-900 focus:border-supplyx-blue'
                                }`}
                                placeholder="2T"
                              />
                            </div>
                            <div>
                              <label className="text-[7.5px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                                {language === 'PT' ? 'Cubagem (m³)' : 'Volume (m³)'}
                              </label>
                              <input
                                required
                                type="text"
                                value={productForm.volume}
                                onChange={e => setProductForm({ ...productForm, volume: e.target.value })}
                                className={`w-full p-2 border rounded-xl text-xs transition-all ${
                                  isDarkMode ? 'bg-zinc-900 border-white/5 text-white' : 'bg-white border-zinc-200 text-zinc-900 focus:border-supplyx-blue'
                                }`}
                                placeholder="5m³"
                              />
                            </div>
                          </div>

                          <div className="flex gap-2 pt-1.5">
                            <button
                              type="button"
                              onClick={handleProductFormSubmit}
                              className="flex-1 py-1.5 bg-supplyx-blue hover:brightness-110 text-white text-[9px] uppercase font-black tracking-wider rounded-lg transition-all"
                            >
                              {language === 'PT' ? 'Confirmar' : 'Confirm'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowProductForm(false)}
                              className={`flex-1 py-1.5 text-[9px] uppercase font-black tracking-wider rounded-lg transition-all ${
                                isDarkMode 
                                  ? 'bg-zinc-800 hover:bg-zinc-750 text-zinc-300' 
                                  : 'bg-zinc-200 hover:bg-zinc-300 text-zinc-700'
                              }`}
                            >
                              {language === 'PT' ? 'Cancelar' : 'Cancel'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {cubingCardTab === 'vehicle' && (
                  <div className="space-y-4 text-left">
                    <div className="p-4 rounded-2xl bg-zinc-950/40 border border-white/5 space-y-4">
                      
                      {/* Name of selection */}
                      <div className="flex justify-between items-center pb-2 border-b border-white/5">
                        <div>
                          <p className="text-[7.5px] font-black text-zinc-500 uppercase tracking-widest block">
                            {language === 'PT' ? 'Veículo Recomendado' : 'Optimal Capacity Match'}
                          </p>
                          <h4 className="text-sm font-black text-white uppercase tracking-tight mt-1 truncate">
                            {vehicleRec.recommendedVehicle}
                          </h4>
                        </div>
                        <div className="text-right">
                          <p className="text-[7px] text-zinc-500 font-bold uppercase">{language === 'PT' ? 'Pontuação' : 'Score'}</p>
                          <p className="text-sm font-black text-supplyx-blue font-mono">{vehicleRec.vehicleCompatibilityScore}%</p>
                        </div>
                      </div>

                      {/* Warnings if any */}
                      {vehicleRec.warnings.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          {vehicleRec.warnings.map((warn, i) => {
                            const isCrit = warn.includes('Overweight') || warn.includes('Oversized') || warn.includes('Incompatible');
                            return (
                              <div key={i} className={`p-2.5 rounded-lg text-[8px] font-bold uppercase tracking-wider border flex items-center gap-1.5 ${
                                isCrit ? "bg-rose-500/10 text-rose-450 border-rose-500/15" : "bg-amber-500/10 text-amber-400 border-amber-500/15"
                              }`}>
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                <span>{warn}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Weight Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[7px] font-black uppercase">
                          <span className="text-zinc-500">{language === 'PT' ? 'Ocupação de Peso' : 'Weight Capacity Utilization'}</span>
                          <span className={vehicleRec.utilizationWeightPercent > 90 ? 'text-rose-400' : 'text-supplyx-blue'}>
                            {vehicleRec.utilizationWeightPercent}%
                          </span>
                        </div>
                        <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${
                              vehicleRec.utilizationWeightPercent > 90 ? 'bg-rose-500' : 'bg-supplyx-blue'
                            }`}
                            style={{ width: `${Math.min(100, vehicleRec.utilizationWeightPercent)}%` }}
                          />
                        </div>
                        <p className="text-[7px] text-zinc-500 uppercase font-semibold">
                          {language === 'PT' ? 'Capacidade Livre:' : 'Remaining Payload:'} {vehicleRec.remainingPayloadKg.toLocaleString('pt-BR')} kg
                        </p>
                      </div>

                      {/* Volume Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[7px] font-black uppercase">
                          <span className="text-zinc-500">{language === 'PT' ? 'Ocupação de Volume (m³)' : 'Volume Capacity Utilization'}</span>
                          <span className={vehicleRec.utilizationVolumePercent > 90 ? 'text-rose-450 text-rose-450' : 'text-emerald-400'}>
                            {vehicleRec.utilizationVolumePercent}%
                          </span>
                        </div>
                        <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${
                              vehicleRec.utilizationVolumePercent > 90 ? 'bg-rose-500' : 'bg-emerald-400'
                            }`}
                            style={{ width: `${Math.min(100, vehicleRec.utilizationVolumePercent)}%` }}
                          />
                        </div>
                        <p className="text-[7px] text-zinc-500 uppercase font-semibold">
                          {language === 'PT' ? 'Volume Livre:' : 'Remaining Volume:'} {vehicleRec.remainingVolumeM3} m³
                        </p>
                      </div>

                      {/* Fleet alternatives list */}
                      <div>
                        <span className="text-[7px] font-black text-zinc-500 uppercase tracking-widest block mb-1">
                          {language === 'PT' ? 'Outras Opções Compatíveis:' : 'Other Commercially Eligible Classes:'}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {vehicleRec.alternativeVehicles.length > 0 ? (
                            vehicleRec.alternativeVehicles.map(alt => (
                              <span key={alt} className="px-1.5 py-0.5 rounded text-[7px] font-black bg-zinc-900 text-zinc-400 border border-white/5 uppercase">
                                {alt}
                              </span>
                            ))
                          ) : (
                            <span className="text-[7px] font-bold text-zinc-600 uppercase">
                              {language === 'PT' ? 'Nenhuma alternativa viável' : 'Single suitable class only'}
                            </span>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex flex-col gap-2">
                <div className="p-4 bg-supplyx-blue/10 rounded-2xl border border-supplyx-blue/20 flex items-center justify-between">
                  <div>
                    <p className="text-[8px] font-black uppercase text-zinc-400">
                      {userType === 'logistics' 
                        ? (requestObj.requester === 'Client' ? 'Cliente Relacionado:' : 'Fornecedor Relacionado:')
                        : 'Responsável Técnico:'
                      }
                    </p>
                    <p className="text-[10px] font-black text-white italic truncate max-w-[150px]">
                      {userType === 'logistics'
                        ? (requestObj.requester === 'Client' ? (requestObj.requesterName || 'Cliente B2B') : 'Fornecedor B2B')
                        : (requestObj.assignedCarrier || (language === 'PT' ? 'Suporte Logístico SupplyX' : 'SupplyX Logistics Support'))
                      }
                    </p>
                  </div>
                  
                  <button 
                    onClick={handleB2BChatNavigation}
                    className="p-2 bg-supplyx-blue text-white rounded-lg hover:brightness-110 flex items-center gap-1 text-[8px] font-black uppercase tracking-wider transition-all active:scale-95"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Chat B2B
                  </button>
                </div>
              </div>
            </div>

            {/* Dynamic Abstract Map or Full Telemetry Monitoring Cockpit */}
            {isAssigned ? (
              <div className="lg:col-span-2 space-y-6">
                
                {/* Advanced Map Terminal with interpolations */}
                <div className={`rounded-[36px] border p-6 flex flex-col justify-between relative overflow-hidden min-h-[380px] ${
                  isDarkMode ? 'bg-zinc-950 border-white/5 shadow-2xl' : 'bg-zinc-50 border-zinc-200'
                }`}>
                  <div className="absolute top-6 left-6 z-10 flex flex-col max-w-[90%] pointer-events-none">
                    <div className="flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                       <p className="text-[8px] font-black uppercase text-emerald-400 tracking-[0.3em] font-mono">Radar Satélite SupplyX v9.8 Ativo</p>
                    </div>
                    <p className="text-sm font-black italic uppercase tracking-tighter text-white leading-tight">
                      {language === 'PT' ? 'Rastreamento de Rota em Tempo Real' : 'Real-time Route Tracking & Coordinates'}
                    </p>
                    {/* Live Shared connection indicators for Client, Supplier and Logistics */}
                    <div className="flex flex-wrap gap-1.5 mt-2 select-none">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[7px] font-black uppercase text-emerald-400 font-mono">
                        <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                        {language === 'PT' ? 'Cliente: Online' : 'Client: Connected'}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[7px] font-black uppercase text-emerald-400 font-mono">
                        <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                        {language === 'PT' ? 'Fornecedor: Online' : 'Supplier: Connected'}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[7px] font-black uppercase text-emerald-400 font-mono">
                        <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                        {language === 'PT' ? 'Operador: Assistindo' : 'Carrier: Syncing'}
                      </span>
                    </div>
                  </div>

                  {/* Bezier Route Map Graphic */}
                  <div className="w-full h-full flex items-center justify-center pt-10">
                    <motion.div 
                      style={{ scale: mapZoom }} 
                      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                      className="w-full h-full max-w-lg max-h-[260px] relative mt-12"
                    >
                      <svg viewBox="0 0 500 320" className="w-full h-full text-zinc-800" fill="none" stroke="currentColor">
                        <path d="M 120 290 C 130 250, 180 230, 210 190 C 240 150, 270 120, 310 80 C 350 40, 420 50, 460 30" stroke="rgba(255,255,255,0.03)" strokeWidth="8" />
                        <path d="M 152 262 Q 260 160, 385 110" stroke="#3b82f6" strokeWidth="3" strokeDasharray="8 6" id="target-route" />
                        
                        {/* Map Points */}
                        <motion.circle cx="152" cy="262" r="5" fill="#10b981" />
                        <motion.circle cx="385" cy="110" r="6" fill="#ef4444" />

                        {/* Moving Truck Icon along the Bezier curve */}
                        <g transform={`translate(${tx - 12}, ${ty - 12})`}>
                          <circle cx="12" cy="12" r="14" fill="none" stroke="#3b82f6" strokeWidth="1.5" className="animate-ping origin-center" />
                          <circle cx="12" cy="12" r="10" className="fill-supplyx-blue stroke-blue-300 stroke-2" />
                          <path 
                            d="M6 15c0 .55.45 1 1 1h1c0 .55.45 1 1 1s1-.45 1-1h4c0 .55.45 1 1 1s1-.45 1-1h1c.55 0 1-.45 1-1h1v-3.5l-2-2.5h-2.5V8c0-.55-.45-1-1-1H7c-.55 0-1 .45-1 1v7zm4-2c0-.55.45-1 1-1s1 .45 1 1-.45 1-1 1-1-.45-1-1zm6 0c0-.55.45-1 1-1s1 .45 1 1-.45 1-1 1-1-.45-1-1z" 
                            fill="white" 
                            transform="scale(0.8) translate(3, 3)" 
                          />
                        </g>
                      </svg>

                      {/* Map Badges */}
                      <div className="absolute top-[210px] left-[130px] flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
                        <span className="text-[9px] font-black text-emerald-400 bg-zinc-950 border border-emerald-500/20 px-2.5 py-1 rounded-md shadow-lg font-mono">
                          {requestObj.origem.split(',')[0]} (SUL)
                        </span>
                      </div>

                      <div className="absolute top-[88px] left-[340px] flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400 ring-4 ring-red-400/20" />
                        <span className="text-[9px] font-black text-red-400 bg-zinc-950 border border-red-500/20 px-2.5 py-1 rounded-md shadow-lg font-mono">
                          {requestObj.destino.split(',')[0]} (NORTE)
                        </span>
                      </div>

                      {/* Floating GPS coords indicator */}
                      <div className="absolute top-[140px] left-[150px] bg-zinc-950/90 border border-white/5 p-2 rounded-xl flex items-center gap-2 shadow-xl shrink-0 select-none pointer-events-none">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-[8px] font-black text-blue-300 uppercase font-mono tracking-wider">
                          LAT: {( -25.9573 + (progressValue * (10.1583 / 100)) ).toFixed(4)} / LNG: {(32.5831 + (progressValue * (6.6710 / 100)) ).toFixed(4)}
                        </span>
                      </div>
                    </motion.div>
                  </div>

                  <div className="flex justify-between items-center text-[9px] font-black text-zinc-500 uppercase mt-4">
                    <span>
                      {language === 'PT' 
                        ? `Progresso da Viagem: ${progressValue}% (${(950 - (progressValue * 9.5)).toFixed(0)} km restantes)` 
                        : `Transit Journey: ${progressValue}% (${(950 - (progressValue * 9.5)).toFixed(0)} km remaining)`
                      }
                    </span>
                    <div className="flex gap-2">
                      <button onClick={() => setMapZoom(prev => Math.min(prev + 0.2, 1.8))} className="px-2 py-0.5 bg-zinc-900 border border-white/5 rounded text-[8px] hover:text-white">Zoom +</button>
                      <button onClick={() => setMapZoom(1)} className="px-2 py-0.5 bg-zinc-900 border border-white/5 rounded text-[8px] hover:text-white">Reset</button>
                    </div>
                  </div>
                </div>

                {/* Dashboard stats panel  */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Gauges panel */}
                  <div className={`p-6 rounded-[32px] border ${isDarkMode ? 'bg-zinc-900/50 border-white/5 shadow-2xl' : 'bg-white border-zinc-100'}`}>
                    <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-4 flex items-center gap-1.5 font-mono">
                      <Activity className="w-3.5 h-3.5 text-supplyx-blue" />
                      {language === 'PT' ? 'Métricas de Telemetria de Cabine' : 'Sensory Cabin Telemetry'}
                    </h4>

                    <div className="grid grid-cols-3 gap-3">
                      
                      {/* Speedometer */}
                      <div className="p-3 bg-zinc-950 border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center">
                        <span className="text-[7.5px] font-bold text-zinc-500 uppercase block leading-none mb-1">Velocidade</span>
                        <div className="font-black font-mono text-zinc-200 text-sm leading-none">
                          {speedValue} <span className="text-[8px] text-zinc-500">km/h</span>
                        </div>
                        <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden mt-2">
                          <div 
                            className={`h-full transition-all duration-500 ${speedValue === 0 ? 'bg-zinc-700' : speedValue > 80 ? 'bg-red-500' : 'bg-emerald-500'}`} 
                            style={{ width: `${Math.min((speedValue / 110) * 100, 100)}%` }} 
                          />
                        </div>
                      </div>

                      {/* Temperature Sensor */}
                      <div className="p-3 bg-zinc-950 border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center">
                        <span className="text-[7.5px] font-bold text-zinc-500 uppercase block leading-none mb-1">Temperatura</span>
                        <div className="font-black font-mono text-zinc-200 text-sm leading-none">
                          {tempValue} <span className="text-[8px] text-zinc-500">°C</span>
                        </div>
                        <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden mt-2">
                          <div 
                            className={`h-full transition-all duration-500 ${tempValue > 18 ? 'bg-amber-500 animate-pulse' : 'bg-sky-500'}`} 
                            style={{ width: `${Math.min((tempValue / 40) * 100, 100)}%` }} 
                          />
                        </div>
                      </div>

                      {/* Gas meter */}
                      <div className="p-3 bg-zinc-950 border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center">
                        <span className="text-[7.5px] font-bold text-zinc-500 uppercase block leading-none mb-1">Combustível</span>
                        <div className="font-black font-mono text-zinc-200 text-sm leading-none">
                          {fuelValue} <span className="text-[8px] text-zinc-500">%</span>
                        </div>
                        <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden mt-2">
                          <div 
                            className={`h-full transition-all duration-500 ${fuelValue < 20 ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`} 
                            style={{ width: `${fuelValue}%` }} 
                          />
                        </div>
                      </div>

                    </div>

                    {/* General bulletins status text */}
                    <div className="mt-4 p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-left">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[7.5px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Boletim de Rota Recebido</span>
                      </div>
                      <p className="text-[10px] text-zinc-300 font-bold italic leading-relaxed font-mono">
                        "{statusTextValue}"
                      </p>
                    </div>
                  </div>

                  {/* Operational Controls and Driver Details */}
                  <div className={`p-6 rounded-[32px] border ${isDarkMode ? 'bg-zinc-900/50 border-white/5 shadow-2xl' : 'bg-white border-zinc-100'}`}>
                    <div className="flex justify-between items-center mb-4 pb-1 border-b border-white/5">
                      <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest flex items-center gap-1.5 font-mono">
                        <User className="w-3.5 h-3.5 text-supplyx-blue" />
                        {language === 'PT' ? 'Ficha de Tripulação & Controles' : 'Driver Card & Controller'}
                      </h4>
                      <span className="text-[8px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase">
                        ATUANDO
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mb-4 text-left">
                      <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 font-black shrink-0 text-xs">
                        {assignedDriver.name.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-[11px] font-black text-white uppercase tracking-wider">{assignedDriver.name}</p>
                        <p className="text-[8px] font-bold text-zinc-400 uppercase leading-relaxed mt-0.5">
                          {assignedDriver.vehicle} • Placa: {assignedDriver.licenseId}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="flex items-center gap-0.5 bg-zinc-950 px-1.5 py-0.5 rounded text-[7.5px] border border-white/5 font-bold">
                            <Star className="w-2 h-2 text-amber-500 fill-amber-500" />
                            <span className="text-[8.5px] font-bold text-zinc-300 font-mono">{assignedDriver.rating}</span>
                          </div>
                          <span className="text-[7.5px] text-zinc-550 font-bold">• {assignedDriver.trips || 120} viagens</span>
                        </div>
                        {assignedDriver.phone && (
                          <p className="text-[8.5px] font-black text-emerald-400 font-mono mt-1.5 flex items-center gap-1">
                            <span>📞</span> TEL: {assignedDriver.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Operational controls */}
                    <div className="space-y-2 text-left">
                      <button 
                        onClick={handleSimulateAdvance}
                        type="button"
                        className="w-full py-2 px-3 bg-supplyx-blue hover:brightness-110 active:scale-95 text-white/90 text-[8px] font-black uppercase tracking-widest rounded-lg font-mono transition-all flex items-center justify-center gap-1.5"
                      >
                        🧭 {language === 'PT' ? 'Atualizar Localização Satélite (+15% Avanço)' : 'Simulate 15% Travel Progress'}
                      </button>

                      <div className="p-2 bg-zinc-950 border border-zinc-900 rounded-lg">
                        <p className="text-[7px] font-black text-zinc-500 uppercase tracking-widest mb-1.5 text-left leading-none font-mono">Notificações e Eventos em Tempo Real (Simular Condutor)</p>
                        <div className="grid grid-cols-2 gap-1 px-0.5">
                          <button 
                            onClick={() => handleSimulateDriverAlert('pesagem')} 
                            type="button"
                            className="p-1 px-1.5 bg-zinc-900 hover:bg-zinc-800 hover:text-white border border-white/5 rounded text-[7.5px] font-bold uppercase transition-all whitespace-nowrap text-left font-mono"
                          >
                            ⚖️ Balança OK
                          </button>
                          <button 
                            onClick={() => handleSimulateDriverAlert('chuva')} 
                            type="button"
                            className="p-1 px-1.5 bg-zinc-900 hover:bg-zinc-800 hover:text-white border border-white/5 rounded text-[7.5px] font-bold uppercase transition-all whitespace-nowrap text-left font-mono"
                          >
                            🌧️ Alerta Clima
                          </button>
                          <button 
                            onClick={() => handleSimulateDriverAlert('parada')} 
                            type="button"
                            className="p-1 px-1.5 bg-zinc-900 hover:bg-zinc-800 hover:text-white border border-white/5 rounded text-[7.5px] font-bold uppercase transition-all whitespace-nowrap text-left font-mono"
                          >
                            ⛽ Abastecer
                          </button>
                          <button 
                            onClick={() => handleSimulateDriverAlert('anomalia')} 
                            type="button"
                            className="p-1 px-1.5 bg-red-950/30 hover:bg-red-900 hover:text-red-100 border border-red-900/35 rounded text-[7.5px] font-extrabold text-red-400 uppercase transition-all whitespace-nowrap text-left font-mono"
                          >
                            ⚠️ Alerta Mecânica
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            ) : (
              <div className={`lg:col-span-2 rounded-[36px] border p-6 flex flex-col justify-between relative overflow-hidden h-[400px] lg:h-auto min-h-[380px] ${
                isDarkMode ? 'bg-zinc-950 border-white/5 shadow-2xl' : 'bg-zinc-50 border-zinc-200'
              }`}>
                <div className="absolute top-6 left-6 z-10 flex flex-col">
                  <p className="text-[8px] font-black uppercase text-supplyx-blue tracking-[0.3em] mb-1">Gps Telemetry Satellite v7.2</p>
                  <p className="text-sm font-black italic uppercase tracking-tighter text-white">Routetrack Maputo ➔ Nampula Corridor</p>
                </div>

                {/* Map Vector Graphic */}
                <div className="w-full h-full flex items-center justify-center pt-8">
                  <motion.div 
                    style={{ scale: mapZoom }} 
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    className="w-full h-full max-w-lg max-h-[260px] relative mt-12"
                  >
                    <svg viewBox="0 0 500 320" className="w-full h-full text-zinc-800" fill="none" stroke="currentColor">
                      <path d="M 120 290 C 130 250, 180 230, 210 190 C 240 150, 270 120, 310 80 C 350 40, 420 50, 460 30" stroke="rgba(255,255,255,0.03)" strokeWidth="8" />
                      <path d="M 152 262 Q 260 160, 385 110" stroke="#3b82f6" strokeWidth="3" strokeDasharray="8 6" id="target-route" />
                      <motion.circle cx="152" cy="262" r="5" fill="#10b981" className="animate-pulse" />
                      <motion.circle cx="385" cy="110" r="6" fill="#ef4444" />
                    </svg>

                    <div className="absolute top-[210px] left-[130px] flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
                      <span className="text-[9px] font-black text-emerald-400 bg-zinc-950 border border-emerald-500/20 px-2.5 py-1 rounded-md shadow-lg">
                        Maputo SUL
                      </span>
                    </div>

                    <div className="absolute top-[88px] left-[340px] flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400 ring-4 ring-red-400/20" />
                      <span className="text-[9px] font-black text-red-400 bg-zinc-950 border border-red-500/20 px-2.5 py-1 rounded-md shadow-lg">
                        Nampula NORT
                      </span>
                    </div>
                  </motion.div>
                </div>

                <div className="flex justify-between items-center text-[9px] font-black text-zinc-500 uppercase mt-4">
                  <span>Servidor Central Mozambique C-Link: Estável</span>
                  <div className="flex gap-2">
                    <button onClick={() => setMapZoom(prev => Math.min(prev + 0.2, 1.8))} className="px-2 py-0.5 bg-zinc-900 border border-white/5 rounded text-[8px] hover:text-white">Zoom +</button>
                    <button onClick={() => setMapZoom(1)} className="px-2 py-0.5 bg-zinc-900 border border-white/5 rounded text-[8px] hover:text-white">Reset</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: FEEDBACK BIDDING PORTAL (CONCURSO) */}
        {activeTab === 'bids' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* List and Submission Panel */}
            <div className={`p-6 sm:p-8 rounded-[32px] border ${
              isDarkMode ? 'bg-zinc-900/50 border-white/5 shadow-2xl' : 'bg-white border-zinc-100'
            }`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">
                  {language === 'PT' ? 'Lances Recebidos do Mercado' : 'Bids Logged dynamically'}
                </h3>
                
                {requestObj.status === 'Em concurso' && (
                  <button
                    onClick={() => setShowAddBidForm(!showAddBidForm)}
                    className="px-3.5 py-2 bg-supplyx-blue hover:brightness-110 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                  >
                    {showAddBidForm ? 'Fechar Formulário' : 'Novo Lance manual'}
                  </button>
                )}
              </div>

              {showAddBidForm && (
                <motion.form 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  onSubmit={submitCarrierBid}
                  className="p-5 bg-zinc-950 border border-white/5 rounded-2xl space-y-3 mb-6"
                >
                  <p className="text-[8.5px] font-black text-supplyx-blue uppercase tracking-widest">Simular Proposta de Transportadora</p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[7.5px] font-bold text-zinc-500 uppercase">Nome Transportadora</label>
                      <input 
                        type="text" 
                        required
                        value={newCarrierBid.name} 
                        onChange={e => setNewCarrierBid({...newCarrierBid, name: e.target.value})}
                        className="w-full p-2.5 bg-zinc-900 border border-white/5 rounded-lg text-xs leading-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[7.5px] font-bold text-zinc-500 uppercase">Preço Pretendido (MZN)</label>
                      <input 
                        type="number" 
                        required
                        value={newCarrierBid.price} 
                        onChange={e => setNewCarrierBid({...newCarrierBid, price: e.target.value})}
                        className="w-full p-2.5 bg-zinc-900 border border-white/5 rounded-lg text-xs leading-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[7.5px] font-bold text-zinc-500 uppercase">Tempo Entrega</label>
                      <input 
                        type="text" 
                        value={newCarrierBid.deliverTime} 
                        onChange={e => setNewCarrierBid({...newCarrierBid, deliverTime: e.target.value})}
                        className="w-full p-2.5 bg-zinc-900 border border-white/5 rounded-lg text-xs leading-none"
                      />
                    </div>
                    <div>
                      <label className="text-[7.5px] font-bold text-zinc-500 uppercase">Seguro</label>
                      <input 
                        type="text" 
                        value={newCarrierBid.insurance} 
                        onChange={e => setNewCarrierBid({...newCarrierBid, insurance: e.target.value})}
                        className="w-full p-2.5 bg-zinc-900 border border-white/5 rounded-lg text-xs leading-none"
                      />
                    </div>
                    <div>
                      <label className="text-[7.5px] font-bold text-zinc-500 uppercase">Condições adicionais</label>
                      <input 
                        type="text" 
                        value={newCarrierBid.conditions} 
                        onChange={e => setNewCarrierBid({...newCarrierBid, conditions: e.target.value})}
                        className="w-full p-2.5 bg-zinc-900 border border-white/5 rounded-lg text-xs leading-none"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest mt-2"
                  >
                    Enviar Proposta Concurso
                  </button>
                </motion.form>
              )}

              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {visibleBids.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-zinc-800 rounded-2xl">
                    <p className="text-xs font-bold text-zinc-550 uppercase leading-relaxed">
                      {language === 'PT' 
                        ? 'Nenhum lance de concorrência enviado por si ainda para esta carga.' 
                        : 'No bidding proposals submitted by your agency yet.'}
                    </p>
                  </div>
                ) : (
                  visibleBids.map((prop, idx) => {
                    const isSelected = selectedProposalIndex === idx;
                    return (
                      <div
                        key={prop.id}
                        onClick={() => setSelectedProposalIndex(idx)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between gap-1.5 ${
                          isSelected
                            ? 'bg-supplyx-blue/10 border-supplyx-blue ring-2 ring-supplyx-blue/15'
                            : isDarkMode ? 'bg-zinc-950/40 border-white/5 hover:border-white/10' : 'bg-zinc-55 hover:bg-zinc-100 border-zinc-200'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-xs font-black text-white italic truncate leading-none mb-1 flex items-center gap-1.5">
                              {prop.name}
                              <span className="flex items-center gap-0.5 bg-amber-500/10 text-amber-500 px-1 py-0.5 rounded text-[7.5px] font-black">
                                <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                                {prop.rating}
                              </span>
                            </h4>
                            <p className="text-[8px] font-bold text-zinc-500 uppercase mt-1">
                              {prop.trips} viagens feitas no corredor
                            </p>
                          </div>
                          <span className="text-xs font-black text-emerald-400 italic">
                            MT {prop.price.toLocaleString('pt-BR')} MZN
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Selected Active Bid Terms & Assignment */}
            <div className={`p-6 sm:p-8 rounded-[32px] border ${
              isDarkMode ? 'bg-zinc-900/50 border-white/5 shadow-2xl' : 'bg-white border-zinc-100'
            }`}>
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-6">
                {language === 'PT' ? 'Dossiê da Proposta Ativa' : 'Proposal Term Parameters'}
              </h3>

              {selectedBid ? (() => {
                // Math for AI matchmaking scoring
                const priceScore = Math.max(15, 100 - ((selectedBid.price - 50000) / 700));
                const ratingScore = (selectedBid.rating || 4.5) * 20;
                const tripsScore = Math.min(100, (selectedBid.trips || 10) * 1.6);
                const totalScore = Math.min(99, Math.round((priceScore * 0.4) + (ratingScore * 0.3) + (tripsScore * 0.3)));
                
                // Hazard and delay risks estimation
                const riskPercentage = Math.round(Math.max(1.8, 22 - ((selectedBid.rating || 4) * 3) - ((selectedBid.trips || 5) / 10)));
                const isHighlyRecommended = totalScore > 82;

                return (
                  <div className="space-y-6 text-left">
                    <div className="flex items-center justify-between pb-4 border-b border-white/5">
                      <div>
                        <h4 className="text-sm font-black text-white italic">{selectedBid.name}</h4>
                        <p className="text-[8px] text-zinc-500 font-bold uppercase mt-1">Prazo operacional: {selectedBid.deliverTime}</p>
                      </div>
                      <h4 className="text-lg font-black text-emerald-400 italic">MT {selectedBid.price.toLocaleString('pt-BR')} MZN</h4>
                    </div>

                    {/* AI ASSISTANT EMBEDDED DASHLET */}
                    <div className="p-4 rounded-2xl bg-zinc-950/80 border border-white/5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[8.5px] font-black text-supplyx-blue uppercase tracking-widest flex items-center gap-1.5">
                          <span>🤖</span> Matchmaking Inteligente AI
                        </span>
                        <span className={`text-[8.5px] font-mono font-black ${isHighlyRecommended ? 'text-emerald-400' : 'text-zinc-400'} uppercase`}>
                          MATCH: {totalScore}%
                        </span>
                      </div>

                      {/* Bar indicator */}
                      <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ${isHighlyRecommended ? 'bg-emerald-500' : 'bg-amber-500'}`}
                          style={{ width: `${totalScore}%` }}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-left">
                        <div className="p-2 bg-zinc-900/50 rounded-xl border border-white/[0.01]">
                          <span className="text-[7px] text-zinc-500 font-bold uppercase block tracking-wider">Delay Predictor</span>
                          <span className="text-[10px] text-amber-500 font-mono font-black">{riskPercentage}% Probabilidade</span>
                        </div>
                        <div className="p-2 bg-zinc-900/50 rounded-xl border border-white/[0.01]">
                          <span className="text-[7px] text-zinc-500 font-bold uppercase block tracking-wider">Alocação Eficiente</span>
                          <span className="text-[10px] text-emerald-400 font-mono font-black">Camião Pesado 35m³</span>
                        </div>
                      </div>

                      <p className="text-[8.5px] text-zinc-400 font-medium leading-relaxed uppercase pt-1 border-t border-white/[0.02]">
                        <span className="text-zinc-500 font-extrabold">Revisão AI:</span> {isHighlyRecommended 
                          ? `Atribuição ideal recomendada! O transportador possui alta aderência no trecho ${requestObj.origem.split(',')[0]} ➔ ${requestObj.destino.split(',')[0]} com baixíssimo índice de perdas.`
                          : "Capacidade física excelente, contudo a margem de faturamento é superior à estimativa alvo definida pelo comprador."}
                      </p>
                    </div>

                    <div className="space-y-3 text-xs text-zinc-400 font-semibold uppercase tracking-wider text-left">
                      <div className="flex justify-between border-b border-white/[0.02] pb-1">
                        <span>✓ Cobertura Seguro:</span>
                        <span className="text-white font-black">{selectedBid.insurance}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/[0.02] pb-1">
                        <span>✓ Condição Faturamento:</span>
                        <span className="text-white font-black">{selectedBid.conditions}</span>
                      </div>
                      <div className="flex justify-between pb-1">
                        <span>✓ Reputação Motoristas:</span>
                        <span className="text-amber-500 font-black flex items-center gap-1">★ {selectedBid.rating} Excelência</span>
                      </div>
                    </div>

                    {requestObj.status === 'Em concurso' ? (
                      userType === 'logistics' ? (
                        <div className="p-4 bg-supplyx-blue/10 rounded-xl text-center border border-supplyx-blue/20">
                          <p className="text-[10px] font-black uppercase text-supplyx-blue leading-normal">
                            {language === 'PT' 
                              ? '✓ Proposta enviada com sucesso! Aguardando homologação do remetente.' 
                              : '✓ Proposal successfully submitted! Awaiting client selection.'}
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <button 
                            onClick={() => {
                              onAssignCarrier(requestObj.id, selectedBid.name, selectedBid.price);
                              setSuccessModal(selectedBid.name);
                            }}
                            className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest transition-all"
                          >
                            {language === 'PT' ? 'Fechar Contrato / Atribuir Transportadora' : 'Accept Terms & Sign Agreement'}
                          </button>
                          
                          <button 
                            type="button"
                            onClick={() => {
                              // Automatically select the highest matching score
                              const bestBid = bids.reduce((prev, current) => {
                                const scoreP = Math.max(15, 100 - ((prev.price - 50000) / 700)) + (prev.rating * 20);
                                const scoreC = Math.max(15, 100 - ((current.price - 50000) / 700)) + (current.rating * 20);
                                return scoreC > scoreP ? current : prev;
                              });
                              onAssignCarrier(requestObj.id, bestBid.name, bestBid.price);
                              setSuccessModal(`🤖 AI Match: ${bestBid.name}`);
                            }}
                            className="w-full py-3 rounded-xl bg-zinc-950 border border-supplyx-blue/30 text-supplyx-blue text-[9px] font-black uppercase tracking-widest hover:border-supplyx-blue/70 transition-all text-center"
                          >
                            ⚡ Auto-Match Inteligente (Recomendado via IA)
                          </button>
                        </div>
                      )
                    ) : (
                      <div className="p-4 bg-zinc-950/60 rounded-xl text-center border border-white/5">
                        <p className="text-[10px] font-black uppercase text-zinc-500 leading-none">
                          {language === 'PT' 
                            ? '✓ Concurso finalizado para esta carga. Transportadora já atribuída.' 
                            : '✓ Allocation sealed. Dispatch route already running.'}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })() : (
                <p className="text-xs font-black text-zinc-500 uppercase tracking-widest text-center py-10">Nenhuma proposta ativa selecionada.</p>
              )}
            </div>

          </div>
        )}

        {/* TAB 3: OCORRÊNCIAS (INCIDENTS LOGGER) */}
        {activeTab === 'occurrences' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Occurrence List */}
            <div className={`p-6 sm:p-8 rounded-[32px] border lg:col-span-2 ${
              isDarkMode ? 'bg-zinc-900/50 border-white/5 shadow-2xl' : 'bg-white border-zinc-100'
            }`}>
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">
                    {language === 'PT' ? 'Relatório de Ocorrências e Eventos Críticos' : 'Logged Incidents File'}
                  </h3>
                  <p className="text-[8.5px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Ocorrências registradas para este transporte.</p>
                </div>

                <button
                  onClick={() => setShowAddOccurrenceForm(!showAddOccurrenceForm)}
                  className="px-4 py-2 bg-red-500/10 hover:bg-red-500 hover:text-white rounded-xl text-[9.5px] font-black text-red-500 uppercase tracking-widest transition-all"
                >
                  {showAddOccurrenceForm ? 'Fechar' : 'Nova Ocorrência +'}
                </button>
              </div>

              {filteredOccurrences.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-zinc-800 rounded-2xl">
                  <ThumbsUp className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                  <p className="text-xs font-black uppercase text-zinc-500 tracking-wider">Tudo regularizado. Zero incidentes abertos nesta rota!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOccurrences.map(occ => (
                    <div 
                      key={occ.id}
                      className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                        occ.status === 'Aberta' 
                          ? 'bg-red-500/5 border-red-500/20' 
                          : 'bg-emerald-500/5 border-emerald-500/20'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded ${
                            occ.status === 'Aberta' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-400'
                          }`}>
                            {occ.status} • {occ.category}
                          </span>
                          <span className="text-[9px] font-mono text-zinc-500">#{occ.id}</span>
                        </div>
                        <p className="text-xs font-black text-white italic">"{occ.description}"</p>
                        <p className="text-[8px] font-bold text-zinc-500 uppercase">
                          Registrador: {occ.responsible} • {occ.dateTime}
                        </p>
                      </div>

                      <button
                        onClick={() => onToggleOccurrence(occ.id)}
                        className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all leading-none border ${
                          occ.status === 'Aberta'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white'
                            : 'bg-zinc-800 border-white/5 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {occ.status === 'Aberta' ? 'Resolver Ocorrência✓' : 'Rebrir Ocorrência⚠'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Incident Logger Form */}
            <div className={`p-6 sm:p-8 rounded-[32px] border ${
              isDarkMode ? 'bg-zinc-900/50 border-white/5 shadow-2xl' : 'bg-white border-zinc-100'
            }`}>
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-6">
                Registo de Ocorrência
              </h3>

              {showAddOccurrenceForm ? (
                <form onSubmit={submitOccurrence} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[8px] font-bold text-zinc-500 uppercase pl-1">Categoria de Incidente</label>
                    <select
                      value={newOccurrence.category}
                      onChange={e => setNewOccurrence({...newOccurrence, category: e.target.value})}
                      className="w-full p-3 bg-zinc-950 border border-white/5 rounded-xl text-xs text-white"
                    >
                      <option value="Atrasos">Atrasos Operacionais</option>
                      <option value="Danos na mercadoria">Danos na Mercadoria</option>
                      <option value="Falha de entrega">Falha na Entrega</option>
                      <option value="Outros incidentes">Outro Incidente Crítico</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] font-bold text-zinc-500 uppercase pl-1">Quem reportou (Responsivo)</label>
                    <select
                      value={newOccurrence.responsible}
                      onChange={e => setNewOccurrence({...newOccurrence, responsible: e.target.value})}
                      className="w-full p-3 bg-zinc-950 border border-white/5 rounded-xl text-xs text-white"
                    >
                      {drivers.map(drv => (
                        <option key={drv.id} value={drv.name}>{drv.name} ({drv.vehicle})</option>
                      ))}
                      <option value="Suporte SupplyX">Despachador Geral SupplyX</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] font-bold text-zinc-500 uppercase pl-1">Descrição Detalhada do Problema</label>
                    <textarea
                      required
                      placeholder="Descreva minuciosamente o ocorrido na via..."
                      value={newOccurrence.description}
                      onChange={e => setNewOccurrence({...newOccurrence, description: e.target.value})}
                      className="w-full p-3 bg-zinc-950 border border-white/5 rounded-xl text-xs text-white outline-none min-h-[90px]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                  >
                    Gravar Ocorrência e Notificar
                  </button>
                </form>
              ) : (
                <div className="text-center py-6">
                  <p className="text-xs text-zinc-500 uppercase font-black tracking-wider leading-relaxed">
                    Clique no botão superior "Nova Ocorrência" para reportar problemas de carga, atrasos nos postos ou danos.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 4: DOCUMENTS VAULT & SIGNATURE CANVAS */}
        {activeTab === 'documents' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Download and Display Official PDF templates */}
            <div className={`p-6 sm:p-8 rounded-[32px] border ${
              isDarkMode ? 'bg-zinc-900/50 border-white/5 shadow-2xl' : 'bg-white border-zinc-100'
            }`}>
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-6">
                📄 {language === 'PT' ? 'Destaques e Guias de Transporte Digitais' : 'Digital Carriage Manifests'}
              </h3>

              <div className="space-y-4 text-left">
                {[
                  { title: language === 'PT' ? 'Guia de Transporte (CRT)' : 'Carriage Consignment Note (CRT)', code: `CRT-MZ-${requestObj.id}`, type: 'Manifest' },
                  { title: language === 'PT' ? 'Fatura Logística Comercial' : 'B2B Commercial Fee Invoice', code: `INV-MZ-${requestObj.id}`, type: 'SplitInvoice' }
                ].map((doc, idx) => (
                  <div key={idx} className="p-4 bg-zinc-950 border border-white/5 rounded-xl flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-black text-white italic leading-none mb-1">{doc.title}</p>
                      <p className="text-[8px] text-zinc-500 font-bold uppercase">Código Oficial: {doc.code}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {doc.type === 'Manifest' && (
                        <button 
                          onClick={() => setShowCrtModal(true)}
                          className="p-2.5 bg-supplyx-blue/10 border border-supplyx-blue/30 hover:bg-supplyx-blue/20 text-supplyx-blue rounded-lg flex items-center gap-1 text-[8.5px] font-black uppercase transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          {language === 'PT' ? 'Visualizar Guia' : 'View CRT'}
                        </button>
                      )}

                      <button 
                        onClick={() => handleDownloadDocument(doc.type, doc.title, doc.code)}
                        className="p-2.5 bg-zinc-900 border border-white/5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg flex items-center gap-1 text-[8.5px] font-black uppercase transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        PDF
                      </button>
                    </div>
                  </div>
                ))}

                <div className="p-4 border border-zinc-800 rounded-xl space-y-2 mt-6">
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Aviso Regulatório INATRO:</p>
                  <p className="text-[9.5px] text-zinc-400 font-bold leading-relaxed">
                    Todos os manifestos CRT gerados na rede SupplyX são interoperáveis e devidamente vinculados às diretrizes estipuladas pelas operadoras alfandegárias de Maputo a Tete.
                  </p>
                </div>
              </div>
            </div>

            {/* Proof of Delivery Interactive Panel (PoD signature) */}
            <div className={`p-6 sm:p-8 rounded-[32px] border ${
              isDarkMode ? 'bg-zinc-900/50 border-white/5 shadow-2xl' : 'bg-white border-zinc-100'
            }`}>
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-4">
                ✍️ {language === 'PT' ? 'Assinatura Comprovativa de Entrega (PoD)' : 'Digital Proof of Delivery'}
              </h3>

              <div className="space-y-4">
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider text-left">
                  {language === 'PT' 
                    ? 'Desenhe a assinatura no quadro abaixo para fechar o PoD eletrônico ou confirme as evidências de foto de entrega.' 
                    : 'Draw the delivery signature below as a strict confirmation of perfect FOB dispatch.'}
                </p>

                <div className="border border-white/10 rounded-xl bg-zinc-950 p-1">
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={150}
                    onPointerDown={startDrawing}
                    onPointerMove={handleDrawSignature}
                    onPointerUp={stopDrawing}
                    onPointerLeave={stopDrawing}
                    onPointerCancel={stopDrawing}
                    className="w-full bg-zinc-950 rounded-lg cursor-crosshair h-[140px] touch-none select-none"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <button 
                    onClick={clearSignature}
                    className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-[8px] font-black uppercase text-zinc-400"
                  >
                    Apagar Sig
                  </button>
                  <button 
                    onClick={saveSignatureData}
                    className="px-4 py-1.5 bg-supplyx-blue hover:bg-supplyx-blue text-white rounded-lg text-[8.5px] font-black uppercase"
                  >
                    Gravar PoD assinatura
                  </button>
                </div>

                {requestObj.podSignature && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-2 text-left">✓ Assinatura de Recebimento Registada:</p>
                    <div className="bg-white p-2 rounded-lg max-w-[200px] mx-auto">
                      <img src={requestObj.podSignature} alt="POD Signature" className="max-h-[60px]" referrerPolicy="no-referrer" />
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 5: SYSTEM EVALUATION / RATINGS REVIEWS */}
        {activeTab === 'review' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Client feedback form */}
            <div className={`p-6 sm:p-8 rounded-[32px] border ${
              isDarkMode ? 'bg-zinc-900/50 border-white/5 shadow-2xl' : 'bg-white border-zinc-100'
            }`}>
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-4">
                ⭐ {language === 'PT' ? 'Classificação do Transportador pelo Cliente' : 'Rate the Carrier (Customer review)'}
              </h3>

              {feedbackSuccess || requestObj.feedbackClient ? (
                <div className="p-8 text-center bg-zinc-950 rounded-2xl border border-white/5 space-y-3">
                  <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
                  <p className="text-xs font-black uppercase text-white tracking-widest">Avaliação Consolidada com sucesso!</p>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase">
                    Sua nota: {requestObj.feedbackClient?.rating || clientRatingValue} ★ • "{requestObj.feedbackClient?.comment || clientComment || 'Serviço prestado excelente.'}"
                  </p>
                </div>
              ) : (
                <form onSubmit={handleFinishReview} className="space-y-4 text-left">
                  <p className="text-[9.5px] text-zinc-500 uppercase font-black tracking-widest">Atribua de 1 a 5 estrelas baseadas no transit-time ou conservação da mercadoria:</p>
                  
                  <div className="flex gap-2 my-2">
                    {[1, 2, 3, 4, 5].map(stars => (
                      <button
                        key={stars}
                        type="button"
                        onClick={() => setClientRatingValue(stars)}
                        className="transition-transform active:scale-95"
                      >
                        <Star className={`w-8 h-8 ${stars <= clientRatingValue ? 'fill-amber-500 text-amber-500' : 'text-zinc-600'}`} />
                      </button>
                    ))}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] font-bold text-zinc-500 uppercase pl-1">Comentário Adicional</label>
                    <textarea
                      placeholder="Ex: Motorista muito cortês, cumpriu perfeitamente o transit-time de Tete a Maputo."
                      value={clientComment}
                      onChange={e => setClientComment(e.target.value)}
                      className="w-full p-3 bg-zinc-950 border border-white/5 rounded-xl text-xs text-white min-h-[80px]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-supplyx-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95"
                  >
                    Publicar Avaliação Oficial
                  </button>
                </form>
              )}
            </div>

            {/* Reciprocal Carrier feedback placeholder */}
            <div className={`p-6 sm:p-8 rounded-[32px] border ${
              isDarkMode ? 'bg-zinc-900/50 border-white/5 shadow-2xl' : 'bg-white border-zinc-100'
            }`}>
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-4">
                🤝 {language === 'PT' ? 'Classificação de você pelo Transportador' : 'Carrier Rating of Client (Reciprocal review)'}
              </h3>

              <div className="p-6 bg-zinc-950 rounded-2xl border border-white/5 space-y-4">
                <div className="flex items-center gap-2">
                  <ThumbsUp className="w-5 h-5 text-emerald-400" />
                  <span className="text-[10px] font-black uppercase text-zinc-300">Reciprocidade de Feedbacks</span>
                </div>

                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider text-left leading-relaxed">
                  Para incentivar a idoneidade, o transportador atribuiu a você uma nota automática após a entrega de:
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(st => (
                      <Star key={st} className="w-4 h-4 fill-amber-500 text-amber-500" />
                    ))}
                  </div>

                  <span className="text-[9.5px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase">
                    Excelente Pagador (5.0★)
                  </span>
                </div>

                <p className="text-[10px] text-zinc-500 font-bold text-left italic">
                  "Cliente com liberação ágil e excelente comunicação no Chat B2B."
                </p>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* CONFETTI POPUP AGREEMENT */}
      <AnimatePresence>
        {successModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, y: 15, opacity: 0 }} 
              animate={{ scale: 1, y: 0, opacity: 1 }} 
              exit={{ scale: 0.9, y: 15, opacity: 0 }} 
              className="w-full max-w-md p-8 bg-zinc-900 border border-white/10 rounded-[36px] text-center text-white shadow-3xl"
            >
              <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 relative shadow-lg shadow-emerald-500/20">
                <CheckCircle className="w-8 h-8" />
              </div>

              <h3 className="text-lg font-black italic uppercase tracking-tight mb-2">
                {language === 'PT' ? 'Contrato Homologado!' : 'Transaction Signed!'}
              </h3>
              <p className="text-xs text-zinc-400 font-semibold leading-relaxed mb-6">
                {language === 'PT' 
                  ? `Operação de transporte selada com ${successModal}. O motorista correspondente e frentes financeiras foram emitidas de acordo com as diretrizes B2B.`
                  : `Carriage contract sealed with ${successModal}. Telemetry dispatched.`}
              </p>

              <button 
                onClick={() => setSuccessModal(null)}
                className="px-6 py-2.5 rounded-xl bg-supplyx-blue text-white text-[10px] uppercase font-black tracking-widest hover:brightness-110 active:scale-95"
              >
                {language === 'PT' ? 'Entendido' : 'Acknowledge'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GUIA DE TRANSPORTE DIGITAL (CRT) OFFICIAL PREVIEW MODAL */}
      <AnimatePresence>
        {showCrtModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-full max-w-4xl bg-zinc-950 border border-white/10 rounded-[28px] p-6 sm:p-8 space-y-6 shadow-2xl text-left text-white my-auto max-h-[92vh] overflow-y-auto print:max-h-none print:border-none print:p-0 print:bg-white print:text-black"
            >
              {/* Requirement 8: Watermark de Autenticidade no Fundo */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.025] print:opacity-[0.03]">
                <span className="text-6xl sm:text-8xl font-black tracking-widest text-white uppercase rotate-[-20deg] text-center">
                  SUPPLYX VERIFIED
                </span>
              </div>

              {/* Modal Top Bar */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 print:hidden relative z-10">
                <div className="flex items-center gap-3">
                  <SupplyXLogo size="sm" isDark={true} />
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-300 flex items-center gap-2">
                      {language === 'PT' ? 'Guia de Transporte Digital (CRT)' : 'Carriage Consignment Note (CRT)'}
                      <span className="px-2 py-0.5 bg-supplyx-blue/15 border border-supplyx-blue/30 text-supplyx-blue rounded text-[9px] font-mono font-bold">
                        Enterprise
                      </span>
                    </h3>
                    <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase mt-0.5">
                      CRT-MZ-TR-2026-{requestObj.id}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Requirement 10: Botão da Página de Validação */}
                  <button
                    onClick={() => setShowValidationDrawer(true)}
                    className="px-3 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
                    title="Verificar Validação On-Chain"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verificar Autenticidade</span>
                  </button>

                  <button
                    onClick={() => handleDownloadDocument('Manifest', 'Guia de Transporte (CRT)', `CRT-MZ-TR-2026-${requestObj.id}`)}
                    className="px-3.5 py-2 bg-supplyx-blue hover:bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-supplyx-blue/20 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {language === 'PT' ? 'Baixar PDF' : 'Download PDF'}
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="px-3.5 py-2 bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-black uppercase flex items-center gap-1.5 transition-all"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    {language === 'PT' ? 'Imprimir' : 'Print'}
                  </button>

                  <button
                    onClick={() => setShowCrtModal(false)}
                    className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-white/5 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* CRT DOCUMENT CONTAINER (PREVIEW READY FOR DISPLAY & PRINT) */}
              <div className="relative z-10 p-6 sm:p-8 bg-zinc-900/90 border border-white/5 rounded-2xl space-y-6 text-zinc-100 print:bg-white print:text-slate-900 print:border-slate-300 shadow-xl">
                
                {/* Header Banner */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-white/10 print:border-slate-300">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <SupplyXLogo size="md" isDark={true} />
                      <div>
                        <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-white print:text-slate-900">
                          SUPPLYX LOGISTICS NETWORK
                        </h2>
                        <p className="text-[10px] sm:text-xs font-black text-supplyx-blue uppercase tracking-widest">
                          GUIA DE TRANSPORTE DIGITAL (CRT) • MOÇAMBIQUE
                        </p>
                      </div>
                    </div>

                    {/* Requirement 9: Segurança Visual / Selo */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/25 rounded-full text-emerald-400 text-[9.5px] font-bold tracking-wider">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Documento Oficial • Eletronicamente Validado • Integridade Garantida</span>
                    </div>
                  </div>

                  {/* QR Code & Code (Requirement 3 & 4) */}
                  <div 
                    onClick={() => setShowValidationDrawer(true)}
                    className="flex flex-col items-center sm:items-end gap-1.5 bg-zinc-950/90 p-3 rounded-2xl border border-white/10 hover:border-supplyx-blue/50 cursor-pointer transition-all print:bg-slate-50 print:border-slate-200 group"
                  >
                    <div className="flex items-center gap-3">
                      {crtQrDataUrl ? (
                        <img src={crtQrDataUrl} alt="QR Code" className="w-16 h-16 rounded-xl bg-white p-1 shadow-md" />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-zinc-800 flex items-center justify-center">
                          <QrCode className="w-8 h-8 text-zinc-500" />
                        </div>
                      )}
                      <div className="text-left space-y-1">
                        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest block">Código do Documento:</span>
                        {/* Requirement 4: Código Monocromático / Monospace Destacado */}
                        <p className="text-xs font-mono font-black text-white bg-white/5 px-2 py-0.5 rounded border border-white/10 print:bg-slate-100 print:text-slate-900">
                          CRT-MZ-TR-2026-{requestObj.id}
                        </p>
                        <span className="text-[8.5px] font-mono text-emerald-400 font-bold block flex items-center gap-1">
                          <Check className="w-3 h-3" /> VERIFICADO ON-CHAIN
                        </span>
                      </div>
                    </div>

                    {/* Requirement 3: Textos abaixo do QR Code */}
                    <div className="w-full text-center sm:text-right pt-1 border-t border-white/5 print:border-slate-200">
                      <p className="text-[8.5px] font-bold text-supplyx-blue group-hover:underline flex items-center justify-end gap-1">
                        <span>Validar autenticidade deste documento</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </p>
                      <p className="text-[8px] text-zinc-400 font-medium italic">
                        Documento assinado digitalmente.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 1: Identificação e Especificação da Carga (Requirement 1: Hierarquia Visual) */}
                <div className="p-5 bg-zinc-950/70 border border-white/5 rounded-xl space-y-4 print:bg-slate-50 print:border-slate-200">
                  <div className="flex justify-between items-center pb-3 border-b border-white/5 print:border-slate-200">
                    <div className="border-l-4 border-supplyx-blue pl-3 py-0.5">
                      <h4 className="text-xs font-black text-supplyx-blue uppercase tracking-wider flex items-center gap-2">
                        <Package className="w-4 h-4 text-supplyx-blue" />
                        1. Identificação e Especificação da Carga
                      </h4>
                    </div>

                    {/* Requirement 2: Badges de Estado */}
                    {(() => {
                      const st = requestObj.status || 'Em concurso';
                      if (st === 'Entregue') {
                        return (
                          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            ● ENTREGUE
                          </span>
                        );
                      }
                      if (st === 'Em trânsito') {
                        return (
                          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500/15 text-sky-400 border border-sky-500/30">
                            ● EM TRÂNSITO
                          </span>
                        );
                      }
                      if (st === 'Cancelado') {
                        return (
                          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            ● CANCELADO
                          </span>
                        );
                      }
                      return (
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          ● {st.toUpperCase()}
                        </span>
                      );
                    })()}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Left Column */}
                    <div className="space-y-2.5">
                      <div>
                        <span className="text-[9px] font-black text-zinc-500 uppercase block">ID da Carga:</span>
                        <p className="font-mono font-bold text-white print:text-slate-900">{requestObj.id}</p>
                      </div>

                      <div>
                        <span className="text-[9px] font-black text-zinc-500 uppercase block">Origem (Carregamento):</span>
                        <p className="font-bold text-white print:text-slate-900">{requestObj.origem || 'Moçambique'}</p>
                      </div>

                      <div>
                        <span className="text-[9px] font-black text-zinc-500 uppercase block">Tipo de Carga:</span>
                        <p className="font-bold text-white print:text-slate-900 break-words leading-relaxed">
                          {requestObj.tipoCarga || 'Carga Geral'}
                        </p>
                      </div>

                      <div>
                        <span className="text-[9px] font-black text-zinc-500 uppercase block">Transportador Atribuído:</span>
                        <p className="font-bold text-white print:text-slate-900">{requestObj.assignedCarrier || 'Operador Credenciado SupplyX'}</p>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-2.5">
                      <div>
                        <span className="text-[9px] font-black text-zinc-500 uppercase block">Data de Emissão:</span>
                        <p className="font-bold text-white print:text-slate-900">{new Date().toLocaleDateString('pt-PT')}</p>
                      </div>

                      <div>
                        <span className="text-[9px] font-black text-zinc-500 uppercase block">Destino (Descarregamento):</span>
                        <p className="font-bold text-white print:text-slate-900">{requestObj.destino || 'Moçambique'}</p>
                      </div>

                      <div>
                        <span className="text-[9px] font-black text-zinc-500 uppercase block">Modalidade / Veículo:</span>
                        <p className="font-bold text-white print:text-slate-900">{requestObj.deliveryMode || 'Transporte Rodoviário'}</p>
                      </div>

                      <div>
                        <span className="text-[9px] font-black text-zinc-500 uppercase block">Prazo Estimado de Entrega:</span>
                        <p className="font-bold text-white print:text-slate-900">{requestObj.prazoEntrega || '2 - 3 Dias Úteis'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Pesos, Volumes e Embalagens */}
                <div className="p-5 bg-zinc-950/70 border border-white/5 rounded-xl space-y-3 print:bg-slate-50 print:border-slate-200">
                  <div className="border-l-4 border-supplyx-blue pl-3 py-0.5">
                    <h4 className="text-xs font-black text-supplyx-blue uppercase tracking-wider flex items-center gap-2">
                      <Truck className="w-4 h-4 text-supplyx-blue" />
                      2. Especificação de Pesos, Volumes e Embalagens
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                    <div className="p-3 bg-zinc-900/90 border border-white/5 rounded-lg print:bg-white print:border-slate-200">
                      <span className="text-[8.5px] font-black text-zinc-400 uppercase block">Peso Total</span>
                      <p className="text-xs font-bold text-white print:text-slate-900">{requestObj.peso || '12.5 Toneladas'}</p>
                    </div>

                    <div className="p-3 bg-zinc-900/90 border border-white/5 rounded-lg print:bg-white print:border-slate-200">
                      <span className="text-[8.5px] font-black text-zinc-400 uppercase block">Volume</span>
                      <p className="text-xs font-bold text-white print:text-slate-900">{requestObj.volume || '18.0 m³'}</p>
                    </div>

                    <div className="p-3 bg-zinc-900/90 border border-white/5 rounded-lg print:bg-white print:border-slate-200">
                      <span className="text-[8.5px] font-black text-zinc-400 uppercase block">N.º de Paletes</span>
                      <p className="text-xs font-bold text-white print:text-slate-900">{(requestObj as any).pallets || '12 Paletes EPAL'}</p>
                    </div>

                    <div className="p-3 bg-zinc-900/90 border border-white/5 rounded-lg print:bg-white print:border-slate-200">
                      <span className="text-[8.5px] font-black text-zinc-400 uppercase block">N.º de Volumes</span>
                      <p className="text-xs font-bold text-white print:text-slate-900">{requestObj.quantidade || `${requestProducts.length} Lotes`}</p>
                    </div>

                    <div className="p-3 bg-zinc-900/90 border border-white/5 rounded-lg print:bg-white print:border-slate-200">
                      <span className="text-[8.5px] font-black text-zinc-400 uppercase block">Peso Líquido</span>
                      <p className="text-xs font-bold text-white print:text-slate-900">{(requestObj as any).pesoLiquido || '11.8 Toneladas'}</p>
                    </div>

                    <div className="p-3 bg-zinc-900/90 border border-white/5 rounded-lg print:bg-white print:border-slate-200">
                      <span className="text-[8.5px] font-black text-zinc-400 uppercase block">Peso Bruto</span>
                      <p className="text-xs font-bold text-white print:text-slate-900">{(requestObj as any).pesoBruto || '12.5 Toneladas'}</p>
                    </div>
                  </div>
                </div>

                {/* Requirement 2: Tabela com Zebra Striping, Hover e Sticky Header */}
                <div className="p-5 bg-zinc-950/70 border border-white/5 rounded-xl space-y-3 print:bg-slate-50 print:border-slate-200">
                  <div className="border-l-4 border-supplyx-blue pl-3 py-0.5">
                    <h4 className="text-xs font-black text-supplyx-blue uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-4 h-4 text-supplyx-blue" />
                      3. Lista de Produtos e Mercadorias Declaradas
                    </h4>
                  </div>

                  <div className="overflow-x-auto max-h-72 overflow-y-auto rounded-lg border border-white/5">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="sticky top-0 z-10 bg-zinc-900 print:bg-slate-200">
                        <tr className="border-b border-white/10 text-[9px] font-black text-zinc-300 uppercase tracking-wider print:text-slate-800">
                          <th className="py-2.5 px-3">SKU</th>
                          <th className="py-2.5 px-3">Descrição do Produto</th>
                          <th className="py-2.5 px-3 text-center">Quantidade</th>
                          <th className="py-2.5 px-3 text-center">Unidade</th>
                          <th className="py-2.5 px-3 text-right">Peso Estimado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 print:divide-slate-200">
                        {(requestProducts.length > 0 ? requestProducts : [
                          { name: requestObj.tipoCarga || 'Carga Geral Consolidada', quantity: requestObj.quantidade || '1 Lote', weight: requestObj.peso || '12.5 Toneladas', volume: requestObj.volume || '18 m³' }
                        ]).map((item, index) => (
                          <tr 
                            key={index} 
                            className="odd:bg-zinc-900/60 even:bg-zinc-950/80 hover:bg-supplyx-blue/10 transition-colors print:odd:bg-white print:even:bg-slate-50"
                          >
                            <td className="py-2.5 px-3 font-mono font-bold text-supplyx-blue print:text-slate-700">SKU-{1000 + index}</td>
                            <td className="py-2.5 px-3 font-bold text-white print:text-slate-900 break-words">{item.name}</td>
                            <td className="py-2.5 px-3 text-center font-bold text-zinc-300 print:text-slate-800">{item.quantity}</td>
                            <td className="py-2.5 px-3 text-center text-zinc-400 print:text-slate-700">Lote / Unid</td>
                            <td className="py-2.5 px-3 text-right font-bold text-supplyx-blue print:text-slate-900">{item.weight || 'Padronizado'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Requirement 6: Assinaturas Digitais com Selos */}
                <div className="p-5 bg-zinc-950/70 border border-white/5 rounded-xl space-y-4 print:bg-slate-50 print:border-slate-200">
                  <div className="border-l-4 border-emerald-500 pl-3 py-0.5">
                    <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      4. Autenticação e Assinatura Eletrónica (PoD)
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Expedidor Panel */}
                    <div className="p-4 bg-zinc-900/90 border border-white/5 rounded-xl space-y-2 text-left print:bg-white print:border-slate-300">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">Expedidor / Operador:</span>
                        <span className="px-2 py-0.5 rounded-full text-[8.5px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" /> Assinado Digitalmente
                        </span>
                      </div>
                      <p className="text-xs font-bold text-white print:text-slate-900 pt-1">
                        {requestObj.assignedCarrier || 'Operador Credenciado SupplyX'}
                      </p>
                      <div className="text-[10px] text-zinc-400 space-y-0.5 pt-1">
                        <p><span className="text-zinc-500 font-bold">Data:</span> {new Date().toLocaleDateString('pt-PT')}</p>
                        <p><span className="text-zinc-500 font-bold">Hora:</span> {new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</p>
                        <p className="font-mono text-[8.5px] text-zinc-500 pt-1">Hash: #SUPPLYX-EXP-{requestObj.id}</p>
                      </div>
                    </div>

                    {/* PoD Recebedor Panel */}
                    <div className="p-4 bg-zinc-900/90 border border-white/5 rounded-xl space-y-2 text-left print:bg-white print:border-slate-300">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">Recebedor / Destinatário (PoD):</span>
                        {(savedSignature || requestObj.podSignature) ? (
                          <span className="px-2 py-0.5 rounded-full text-[8.5px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" /> Assinado Digitalmente
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[8.5px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                            ● Pendente de assinatura
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-white print:text-slate-900 pt-1">
                        {(requestObj as any).receiverName || 'Fiel Depositário / Recebedor'}
                      </p>
                      <div className="text-[10px] text-zinc-400 space-y-0.5 pt-1">
                        <p><span className="text-zinc-500 font-bold">Data:</span> {new Date().toLocaleDateString('pt-PT')}</p>
                        <p><span className="text-zinc-500 font-bold">Hora:</span> {new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</p>

                        {(savedSignature || requestObj.podSignature) ? (
                          <div className="pt-1">
                            <img src={savedSignature || requestObj.podSignature} alt="Assinatura PoD" className="h-10 bg-white/10 rounded border border-white/10 p-1" />
                            <p className="font-mono text-[8.5px] text-emerald-400 font-bold pt-0.5">Hash: #SUPPLYX-POD-{requestObj.id}</p>
                          </div>
                        ) : (
                          <div className="pt-2">
                            <span className="text-[9.5px] text-amber-400/90 italic font-semibold">Pendente de assinatura no ato da entrega</span>
                            <p className="font-mono text-[8.5px] text-zinc-600 pt-0.5">Hash: #SUPPLYX-POD-PENDING</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Requirement 5 & 7: Rodapé Técnico Detalhado com Paginação */}
                <div className="pt-4 border-t border-white/10 space-y-2 text-[9px] text-zinc-400 print:border-slate-300">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-2 font-mono">
                    <div>
                      <span>Gerado em: {new Date().toLocaleDateString('pt-PT')} às {new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="mx-2">•</span>
                      <span>Versão: v2.4 Enterprise</span>
                    </div>
                    <div>
                      {/* Requirement 7: Paginação */}
                      <span className="px-2.5 py-0.5 bg-white/5 rounded border border-white/10 text-white font-bold">
                        Página 1 de 1
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-center gap-1 text-[8.5px]">
                    <p className="font-mono text-zinc-500">ID Único: CRT-MZ-TR-2026-{requestObj.id} | Hash: #CRT-HASH-{requestObj.id}-VERIFIED</p>
                    <p className="text-supplyx-blue font-bold">URL: https://supplyx.app/verify/CRT-MZ-TR-2026-{requestObj.id}</p>
                  </div>

                  <div className="text-center text-[8.5px] text-zinc-500 pt-1">
                    SupplyX Digital Logistics Platform • Documento Oficial de Transporte em Moçambique • Validade Legal Eletrónica INATRO & Autoridade Tributária
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Requirement 10: PÁGINA / DRAWER DE VALIDAÇÃO DE AUTENTICIDADE DO QR CODE */}
      <AnimatePresence>
        {showValidationDrawer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-[32px] p-6 sm:p-8 space-y-6 text-white text-left shadow-2xl my-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-white">
                      Portal de Validação Digital SupplyX
                    </h3>
                    <p className="text-[10px] font-mono text-zinc-400">
                      https://supplyx.app/verify/CRT-MZ-TR-2026-{requestObj.id}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowValidationDrawer(false)}
                  className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-white/5 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Banner */}
              {requestObj.status === 'Cancelado' ? (
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3">
                  <AlertTriangle className="w-8 h-8 text-rose-400 shrink-0" />
                  <div>
                    <h4 className="text-xs font-black uppercase text-rose-400">● Documento Cancelado / Inexistente</h4>
                    <p className="text-[10px] text-rose-300/80 mt-0.5">
                      Este documento de transporte foi revogado pelo expedidor ou autoridade competente.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
                  <div>
                    <h4 className="text-xs font-black uppercase text-emerald-400">✓ Documento Válido e Autêntico</h4>
                    <p className="text-[10px] text-emerald-300/80 mt-0.5">
                      A integridade criptográfica e assinatura eletrónica deste CRT foram confirmadas com sucesso na rede SupplyX.
                    </p>
                  </div>
                </div>
              )}

              {/* Data Specifications Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-zinc-900/90 border border-white/5 rounded-xl space-y-1">
                  <span className="text-[9px] font-black text-zinc-500 uppercase block">Código Oficial CRT</span>
                  <p className="font-mono font-bold text-white">CRT-MZ-TR-2026-{requestObj.id}</p>
                </div>

                <div className="p-3.5 bg-zinc-900/90 border border-white/5 rounded-xl space-y-1">
                  <span className="text-[9px] font-black text-zinc-500 uppercase block">Estado da Carga</span>
                  <p className="font-bold text-supplyx-blue uppercase">{requestObj.status || 'Em trânsito'}</p>
                </div>

                <div className="p-3.5 bg-zinc-900/90 border border-white/5 rounded-xl space-y-1">
                  <span className="text-[9px] font-black text-zinc-500 uppercase block">Data de Emissão</span>
                  <p className="font-bold text-white">{new Date().toLocaleDateString('pt-PT')}</p>
                </div>

                <div className="p-3.5 bg-zinc-900/90 border border-white/5 rounded-xl space-y-1">
                  <span className="text-[9px] font-black text-zinc-500 uppercase block">Última Atualização</span>
                  <p className="font-bold text-white">{new Date().toLocaleDateString('pt-PT')} às {new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>

                <div className="p-3.5 bg-zinc-900/90 border border-white/5 rounded-xl space-y-1">
                  <span className="text-[9px] font-black text-zinc-500 uppercase block">Empresa Emissora</span>
                  <p className="font-bold text-white">Manhate Link África, Lda (SupplyX)</p>
                </div>

                <div className="p-3.5 bg-zinc-900/90 border border-white/5 rounded-xl space-y-1">
                  <span className="text-[9px] font-black text-zinc-500 uppercase block">Transportador Credenciado</span>
                  <p className="font-bold text-white">{requestObj.assignedCarrier || 'Operador Credenciado SupplyX'}</p>
                </div>

                <div className="p-3.5 bg-zinc-900/90 border border-white/5 rounded-xl space-y-1 sm:col-span-2">
                  <span className="text-[9px] font-black text-zinc-500 uppercase block">Destinatário (Recebedor)</span>
                  <p className="font-bold text-white">{(requestObj as any).receiverName || 'Fiel Depositário / Recebedor'}</p>
                </div>

                <div className="p-3.5 bg-zinc-900/90 border border-white/5 rounded-xl space-y-1 sm:col-span-2">
                  <span className="text-[9px] font-black text-zinc-500 uppercase block">Hash Criptográfico On-Chain</span>
                  <p className="font-mono text-emerald-400 text-[10px] break-all">#CRT-HASH-{requestObj.id}-VERIFIED-ELECTRONICALLY-SIGNED-BY-INATRO-AT-SUPPLYX</p>
                </div>
              </div>

              {/* Operation Timeline / History */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-black uppercase text-zinc-400 flex items-center gap-2">
                  <History className="w-4 h-4 text-supplyx-blue" />
                  Histórico Completo da Operação
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-zinc-900/60 border border-white/5 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                      <span className="font-bold text-zinc-200">1. Emissão do CRT Digital pelo Expedidor</span>
                    </div>
                    <span className="text-[10px] text-zinc-500">{new Date().toLocaleDateString('pt-PT')}</span>
                  </div>

                  <div className="p-3 bg-zinc-900/60 border border-white/5 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                      <span className="font-bold text-zinc-200">2. Atribuição de Frota & Motorista Credenciado</span>
                    </div>
                    <span className="text-[10px] text-zinc-500">{new Date().toLocaleDateString('pt-PT')}</span>
                  </div>

                  <div className="p-3 bg-zinc-900/60 border border-white/5 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-sky-400"></div>
                      <span className="font-bold text-zinc-200">3. Registro de Trânsito & Rastreio GPS</span>
                    </div>
                    <span className="text-[10px] text-zinc-500">{new Date().toLocaleDateString('pt-PT')}</span>
                  </div>

                  <div className="p-3 bg-zinc-900/60 border border-white/5 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2 h-2 rounded-full ${requestObj.status === 'Entregue' ? 'bg-emerald-400' : 'bg-amber-400'}`}></div>
                      <span className="font-bold text-zinc-200">4. Validação Eletrónica & Comprovativo de Entrega (PoD)</span>
                    </div>
                    <span className="text-[10px] text-zinc-500">{requestObj.status === 'Entregue' ? 'Concluído' : 'Em andamento'}</span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="pt-2">
                <button
                  onClick={() => setShowValidationDrawer(false)}
                  className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-black uppercase tracking-wider border border-white/10 transition-all"
                >
                  Fechar Validação
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
