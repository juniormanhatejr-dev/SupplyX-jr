import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Truck, 
  MapPin, 
  Package, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Navigation2,
  Plus,
  Weight,
  Calendar,
  Search,
  ArrowRight,
  ShieldCheck,
  Handshake,
  Star,
  Smartphone,
  Building2,
  Loader2,
  CheckCircle,
  Download,
  X,
  PlusCircle,
  Map as MapIcon,
  TrendingUp,
  MoreVertical,
  Paperclip,
  Send,
  FileText,
  User,
  ChevronRight,
  Upload,
  ArrowLeft,
  ChevronDown
} from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  onSnapshot, 
  serverTimestamp, 
  doc, 
  updateDoc 
} from 'firebase/firestore';

interface LogisticsViewProps {
  isDarkMode: boolean;
  language: 'PT' | 'EN';
  userType?: string;
  onNavigate?: (tab: string, payload?: any) => void;
  initialPayload?: any;
}

export default function LogisticsView({ isDarkMode, language, userType, onNavigate, initialPayload }: LogisticsViewProps) {
  // Navigation inside the logistics module: 'detailed_request' | 'create_request' | 'requests_list' | 'available_loads'
  const [activeSubTab, setActiveSubTab] = useState<'detailed_request' | 'create_request' | 'requests_list' | 'available_loads'>('detailed_request');
  const [selectedRequestId, setSelectedRequestId] = useState<string>('TR-2025-0001');

  // Load state and custom created requests list (stored locally & firestore)
  const [customRequests, setCustomRequests] = useState<any[]>(() => {
    const saved = localStorage.getItem('supplyx_freight_requests');
    return saved ? JSON.parse(saved) : [];
  });

  // B2B Communication messages dictionary per request
  const [chatMessages, setChatMessages] = useState<Record<string, Record<string, any[]>>>(() => {
    const saved = localStorage.getItem('supplyx_freight_chats');
    return saved ? JSON.parse(saved) : {};
  });

  // Store active chat partner per request (defaulting to Moz Logistics)
  const [activeChatRoom, setActiveChatRoom] = useState<string>('Moz Logistics, Lda');

  // active proposals state per request
  const [selectedProposalIndex, setSelectedProposalIndex] = useState<number>(0);

  // Map settings
  const [mapZoom, setMapZoom] = useState<number>(1);
  const [mapPosition, setMapPosition] = useState({ x: 0, y: 0 });

  // Handle incoming payloads from elsewhere (like quotation details page 'Request Logistics' click)
  useEffect(() => {
    if (initialPayload?.tipoCarga) {
      setActiveSubTab('create_request');
    }
  }, [initialPayload]);

  return (
    <div className={`w-full max-w-[1440px] mx-auto min-h-screen pb-16 ${isDarkMode ? 'text-zinc-100' : 'text-zinc-800'}`}>
      
      {/* Dynamic Sub-header Navigation aligned directly with the visual constraints */}
      <div className={`mb-8 p-4 rounded-3xl border flex flex-col md:flex-row items-center justify-between gap-4 ${
        isDarkMode ? 'bg-zinc-900/40 border-white/5 backdrop-blur-md' : 'bg-white border-zinc-100 shadow-sm'
      }`}>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveSubTab('detailed_request')}
            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeSubTab === 'detailed_request'
                ? 'bg-supplyx-blue text-white shadow-lg shadow-supplyx-blue/20'
                : isDarkMode ? 'text-zinc-400 hover:bg-white/5' : 'text-zinc-600 hover:bg-zinc-50'
            }`}
          >
            📋 {language === 'PT' ? 'Detalhes do Frete' : 'Freight Details'}
          </button>
          <button
            onClick={() => setActiveSubTab('create_request')}
            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeSubTab === 'create_request'
                ? 'bg-supplyx-blue text-white shadow-lg shadow-supplyx-blue/20'
                : isDarkMode ? 'text-zinc-400 hover:bg-white/5' : 'text-zinc-600 hover:bg-zinc-50'
            }`}
          >
            🚚 {language === 'PT' ? 'Solicitar Transporte' : 'Request Logistics'}
          </button>
          <button
            onClick={() => setActiveSubTab('requests_list')}
            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeSubTab === 'requests_list'
                ? 'bg-supplyx-blue text-white shadow-lg shadow-supplyx-blue/20'
                : isDarkMode ? 'text-zinc-400 hover:bg-white/5' : 'text-zinc-600 hover:bg-zinc-50'
            }`}
          >
            📦 {language === 'PT' ? 'Minhas Solicitações' : 'My Requests'}
          </button>
          <button
            onClick={() => setActiveSubTab('available_loads')}
            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeSubTab === 'available_loads'
                ? 'bg-supplyx-blue text-white shadow-lg shadow-supplyx-blue/20'
                : isDarkMode ? 'text-zinc-400 hover:bg-white/5' : 'text-zinc-600 hover:bg-zinc-50'
            }`}
          >
            🛣️ {language === 'PT' ? 'Quadro de Cargas Libres' : 'Available Loads'}
          </button>
        </div>

        {/* Info panel / Mode selection simulation to test customer, supplier, carriers views */}
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">
            {language === 'PT' ? 'Mapeamento Geral' : 'Logistics Role'}:
          </span>
          <span className="px-3.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 text-[9px] font-black uppercase tracking-[0.1em]">
            {userType === 'logistics' ? (language === 'PT' ? 'Transportadora' : 'Carrier') : 
             userType === 'supplier' ? (language === 'PT' ? 'Fornecedor' : 'Supplier') : (language === 'PT' ? 'Cliente' : 'Client')}
          </span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        
        {/* 1. DETAILED REQUEST VIEW MATCHING THE IMAGE FAITHFULLY */}
        {activeSubTab === 'detailed_request' && (
          <DetailedRequestView
            isDarkMode={isDarkMode}
            language={language}
            selectedRequestId={selectedRequestId}
            onBack={() => setActiveSubTab('requests_list')}
            customRequests={customRequests}
            chatMessages={chatMessages}
            setChatMessages={setChatMessages}
            activeChatRoom={activeChatRoom}
            setActiveChatRoom={setActiveChatRoom}
            selectedProposalIndex={selectedProposalIndex}
            setSelectedProposalIndex={setSelectedProposalIndex}
            mapZoom={mapZoom}
            setMapZoom={setMapZoom}
            mapPosition={mapPosition}
            setMapPosition={setMapPosition}
          />
        )}

        {/* 2. CREATE TRANSPORT REQUEST PAGE */}
        {activeSubTab === 'create_request' && (
          <CreateRequestPage
            isDarkMode={isDarkMode}
            language={language}
            initialPayload={initialPayload}
            onSuccess={(newReq) => {
              setCustomRequests(prev => [newReq, ...prev]);
              localStorage.setItem('supplyx_freight_requests', JSON.stringify([newReq, ...customRequests]));
              setSelectedRequestId(newReq.id);
              setActiveSubTab('detailed_request');
            }}
          />
        )}

        {/* 3. REQUESTS LIST PAGE */}
        {activeSubTab === 'requests_list' && (
          <RequestsListPage
            isDarkMode={isDarkMode}
            language={language}
            customRequests={customRequests}
            setSelectedRequestId={(id) => {
              setSelectedRequestId(id);
              setActiveSubTab('detailed_request');
            }}
            setCustomRequests={(val) => {
              setCustomRequests(val);
              localStorage.setItem('supplyx_freight_requests', JSON.stringify(val));
            }}
          />
        )}

        {/* 4. AVAILABLE LOADS / COMPETITION PORTAL */}
        {activeSubTab === 'available_loads' && (
          <AvailableLoadsPage
            isDarkMode={isDarkMode}
            language={language}
            customRequests={customRequests}
            onSelectRequest={(id) => {
              setSelectedRequestId(id);
              setActiveSubTab('detailed_request');
            }}
          />
        )}

      </AnimatePresence>
    </div>
  );
}

// ==========================================
// DETAILED REQUEST VIEW SUB-COMPONENT
// ==========================================
interface DetailedRequestViewProps {
  isDarkMode: boolean;
  language: 'PT' | 'EN';
  selectedRequestId: string;
  onBack: () => void;
  customRequests: any[];
  chatMessages: Record<string, Record<string, any[]>>;
  setChatMessages: React.Dispatch<React.SetStateAction<Record<string, Record<string, any[]>>>>;
  activeChatRoom: string;
  setActiveChatRoom: (room: string) => void;
  selectedProposalIndex: number;
  setSelectedProposalIndex: (idx: number) => void;
  mapZoom: number;
  setMapZoom: React.Dispatch<React.SetStateAction<number>>;
  mapPosition: { x: number; y: number };
  setMapPosition: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
}

function DetailedRequestView({
  isDarkMode,
  language,
  selectedRequestId,
  onBack,
  customRequests,
  chatMessages,
  setChatMessages,
  activeChatRoom,
  setActiveChatRoom,
  selectedProposalIndex,
  setSelectedProposalIndex,
  mapZoom,
  setMapZoom,
  mapPosition,
  setMapPosition
}: DetailedRequestViewProps) {

  // Fetch actual data either default TR-2025-0001 or custom built ones
  const requestObj = useMemo(() => {
    if (selectedRequestId === 'TR-2025-0001') {
      return {
        id: 'TR-2025-0001',
        tipoCarga: 'Cimento',
        quantidade: '20 Toneladas',
        volume: '35 m³',
        origem: 'Maputo, Moçambique',
        destino: 'Nampula, Moçambique',
        dataColeta: '15 Mai 2025',
        prazoEntrega: '18 Mai 2025',
        observacoes: 'Carga paletizada',
        requester: 'Client',
        freightResponsibility: 'Client',
        deliveryMode: 'Third-party Logistics',
        status: 'Em Competição',
        proposalsCount: 5,
        rating: 4.8
      };
    }

    const matched = customRequests.find(r => r.id === selectedRequestId);
    if (matched) return matched;

    // Fallback default
    return {
      id: 'TR-2025-0001',
      tipoCarga: 'Cimento',
      quantidade: '20 Toneladas',
      volume: '35 m³',
      origem: 'Maputo, Moçambique',
      destino: 'Nampula, Moçambique',
      dataColeta: '15 Mai 2025',
      prazoEntrega: '18 Mai 2025',
      observacoes: 'Carga paletizada',
      requester: 'Client',
      freightResponsibility: 'Client',
      deliveryMode: 'Third-party Logistics',
      status: 'Em Competição',
      proposalsCount: 5,
      rating: 4.8
    };
  }, [selectedRequestId, customRequests]);

  // Stepper state timeline steps
  const stepperStates = [
    { title: 'Solicitação', date: '12 Mai 2025', key: 'Solicitação' },
    { title: 'Em Competição', date: '12 Mai 2025', key: 'Em Competição' },
    { title: 'Negociação', date: '', key: 'Negociação' },
    { title: 'Aguardando Coleta', date: '', key: 'Aguardando Coleta' },
    { title: 'Em Transporte', date: '', key: 'Em Transporte' },
    { title: 'Entregue', date: '', key: 'Entregue' }
  ];

  // Active step index logic
  const activeStepIndex = useMemo(() => {
    const status = requestObj.status;
    if (status === 'Pending' || status === 'Pendente') return 0;
    if (status === 'Em Competição' || status === 'In Competition') return 1;
    if (status === 'Negociação' || status === 'Negotiation') return 2;
    if (status === 'Aguardando Coleta' || status === 'Awaiting Pickup') return 3;
    if (status === 'Loading' || status === 'Carregando') return 3;
    if (status === 'Em Transporte' || status === 'In Transit') return 4;
    if (status === 'Entregue' || status === 'Delivered') return 5;
    return 1; // Default to Em Competição as in the image
  }, [requestObj.status]);

  // Proposals listing (specifically customized based on the cargo type or default from the client)
  const baseProposals = useMemo(() => {
    const isCement = requestObj.tipoCarga.toLowerCase().includes('cimento');
    return [
      {
        name: 'Moz Logistics, Lda',
        rating: 4.8,
        deliverTime: '3 dias',
        capacity: '30 Ton',
        price: isCement ? 78000 : 92000,
        trips: 128,
        features: {
          deliverTime: '3 dias',
          truckType: '30 Ton',
          insurance: 'Incluso',
          tracking: 'Disponível',
          conditions: 'À vista'
        }
      },
      {
        name: 'Fast Cargo Transportes',
        rating: 4.6,
        deliverTime: '2 dias',
        capacity: '25 Ton',
        price: isCement ? 85000 : 110000,
        trips: 94,
        features: {
          deliverTime: '2 dias',
          truckType: '25 Ton',
          insurance: 'Incluso',
          tracking: 'Disponível',
          conditions: 'Faturado 15d'
        }
      },
      {
        name: 'Nampula Carriers',
        rating: 4.2,
        deliverTime: '4 dias',
        capacity: '30 Ton',
        price: isCement ? 72500 : 85000,
        trips: 56,
        features: {
          deliverTime: '4 dias',
          truckType: '30 Ton',
          insurance: 'Sob consulta',
          tracking: 'Manual por SMS',
          conditions: '50% Entrada'
        }
      },
      {
        name: 'TransMoz Lda',
        rating: 4.7,
        deliverTime: '3 dias',
        capacity: '30 Ton',
        price: isCement ? 80000 : 99500,
        trips: 142,
        features: {
          deliverTime: '3 dias',
          truckType: '30 Ton',
          insurance: 'Incluso',
          tracking: 'Disponível',
          conditions: 'Faturado 30d'
        }
      },
      {
        name: 'Global Transportes',
        rating: 4.3,
        deliverTime: '3 dias',
        capacity: '25 Ton',
        price: isCement ? 75000 : 89000,
        trips: 82,
        features: {
          deliverTime: '3 dias',
          truckType: '25 Ton',
          insurance: 'Incluso',
          tracking: 'Indisponível',
          conditions: 'À vista'
        }
      }
    ];
  }, [requestObj.tipoCarga]);

  const selectedProposal = baseProposals[selectedProposalIndex] || baseProposals[0];

  // B2B Communication state management
  const [activeChatTab, setActiveChatTab] = useState<'Todos' | 'Cliente' | 'Fornecedor' | 'Transportadora'>('Todos');
  const chatRooms = [
    { name: 'Moz Logistics, Lda', lastMsg: 'Claro! Segue em anexo os...', time: '10:30', unread: 2, role: 'Transportadora' },
    { name: 'Fornecedor Exemplo, Lda', lastMsg: 'A carga estará pronta...', time: '09:15', unread: 1, role: 'Fornecedor' },
    { name: 'Fast Cargo Transportes', lastMsg: 'Obrigado pelo contacto...', time: 'Ontem', unread: 1, role: 'Transportadora' },
    { name: 'Nampula Carriers', lastMsg: 'Qual é o tipo de embalagem...', time: 'Ontem', unread: 0, role: 'Transportadora' }
  ];

  // Filtering chat partner rooms based on role switcher tab selection
  const filteredRooms = chatRooms.filter(room => {
    if (activeChatTab === 'Todos') return true;
    if (activeChatTab === 'Cliente') return room.role === 'Cliente';
    if (activeChatTab === 'Fornecedor') return room.role === 'Fornecedor';
    if (activeChatTab === 'Transportadora') return room.role === 'Transportadora';
    return true;
  });

  // Unique key for chat messages
  const chatKey = `${selectedRequestId}_${activeChatRoom}`;

  // Preload messages standard discussion mock if not exists
  const currentMessages = useMemo(() => {
    const thread = chatMessages[selectedRequestId]?.[activeChatRoom];
    if (thread) return thread;

    // Default messages standard
    if (activeChatRoom === 'Moz Logistics, Lda') {
      return [
        { id: 1, sender: activeChatRoom, text: 'Bom dia! Temos disponibilidade para este transporte.', time: '10:30', self: false },
        { id: 2, sender: 'You', text: 'Bom dia! Pode enviar mais detalhes sobre o veículo e seguro?', time: '10:32', self: true },
        { id: 3, sender: activeChatRoom, text: 'Claro! Segue em anexo os documentos.', time: '10:33', self: false }
      ];
    } else if (activeChatRoom === 'Fornecedor Exemplo, Lda') {
      return [
        { id: 1, sender: activeChatRoom, text: 'Olá! A carga de cimento já foi paletizada e está no box B4 do pátio norte.', time: '09:10', self: false },
        { id: 2, sender: 'You', text: 'Excelente! A transportadora de recolha deve encostar em vossa balança por volta das 11h.', time: '09:15', self: true }
      ];
    } else {
      return [
        { id: 1, sender: activeChatRoom, text: `Bom dia! Gostaríamos de propor veículo modelo ${activeChatRoom.includes('Fast') ? 'Carreta Baú 24T' : 'Graneleiro 30T'} para esta carga.`, time: 'Ontem', self: false }
      ];
    }
  }, [selectedRequestId, activeChatRoom, chatMessages]);

  const [messageText, setMessageText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll chat to bottom
  const scrollChat = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  useEffect(() => {
    scrollChat();
  }, [activeChatRoom, chatMessages]);

  const handleSendMessage = () => {
    if (!messageText.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: 'You',
      text: messageText,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      self: true
    };

    // Save state
    const updatedMessages = {
      ...chatMessages,
      [selectedRequestId]: {
        ...(chatMessages[selectedRequestId] || {}),
        [activeChatRoom]: [...currentMessages, newMsg]
      }
    };
    setChatMessages(updatedMessages);
    localStorage.setItem('supplyx_freight_chats', JSON.stringify(updatedMessages));
    setMessageText('');

    // Simulated reply trigger
    setTimeout(() => {
      const answersDict: Record<string, string[]> = {
        'Moz Logistics, Lda': [
          'Entendido. Acabamos de confirmar a alocação do cavalo mecânico Volvo Plate MC-98-34.',
          'Pode verificar na guia de trânsito se o NUIT da construtora está atualizado?',
          'Confirmado. Carga mapeada, o motorista Sérgio já iniciou os testes de freio.'
        ],
        'Fornecedor Exemplo, Lda': [
          'Tudo em ordem. O fiel do armazém fará a liberação mediante apresentação desta guia no app.',
          'Recebido. Já anexamos os laudos de ensaio químico do cimento para conferência aduaneira.'
        ],
        'Fast Cargo Transportes': [
          'Excelente, agradecemos pelo feed. Nossa equipe de operações logísticas está alinhando os custos de pedágios.',
          'Nossa filial em Nampula dará o suporte físico para descarga célere.'
        ]
      };

      const replies = answersDict[activeChatRoom] || [
        'Mensagem operacional recebida e registrada na torre de controle SupplyX.',
        'Ok, daremos retorno em breve.'
      ];

      const replyText = replies[Math.floor(Math.random() * replies.length)];
      const replyMsg = {
        id: Date.now() + 1,
        sender: activeChatRoom,
        text: replyText,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        self: false
      };

      const finalMessages = {
        ...updatedMessages,
        [selectedRequestId]: {
          ...(updatedMessages[selectedRequestId] || {}),
          [activeChatRoom]: [...currentMessages, newMsg, replyMsg]
        }
      };
      setChatMessages(finalMessages);
      localStorage.setItem('supplyx_freight_chats', JSON.stringify(finalMessages));
    }, 1800);
  };

  // State adjustment callbacks
  const [timelineEvents, setTimelineEvents] = useState([
    { hour: '08:30', desc: 'Cotação aprovada na central' },
    { hour: '09:15', desc: 'Transporte e frete solicitados' },
    { hour: '10:00', desc: 'Moçambique Freight Market aberto' }
  ]);

  // Modal alert for proposal acceptance
  const [successModal, setSuccessModal] = useState<string | null>(null);

  const handleAcceptProposal = () => {
    setSuccessModal(selectedProposal.name);
    // Add real event to timeline
    const nowHour = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    setTimelineEvents(prev => [
      ...prev,
      { hour: nowHour, desc: `Transportadora ${selectedProposal.name} selecionada por MT ${selectedProposal.price.toLocaleString('pt-BR')}` }
    ]);

    // Update Request status to Aguardando Coleta in custom requests if applicable
    const updatedCustom = customRequests.map(r => {
      if (r.id === selectedRequestId) {
        return { ...r, status: 'Aguardando Coleta' };
      }
      return r;
    });
    // Write back
    localStorage.setItem('supplyx_freight_requests', JSON.stringify(updatedCustom));
  };

  // Execute automatic negotiation message routing
  const handleNegotiateProposal = () => {
    setActiveChatRoom(selectedProposal.name);
    setMessageText(`Olá ${selectedProposal.name}, estamos a analisar vossa proposta no valor de MT ${selectedProposal.price.toLocaleString('pt-BR')}. Seria viável conceder uma flexibilização comercial de 5% sobre esta tarifa?`);
    scrollChat();
  };

  // Map Controls Zoom helper
  const handleZoomIn = () => setMapZoom(prev => Math.min(prev + 0.3, 2.5));
  const handleZoomOut = () => setMapZoom(prev => Math.max(prev - 0.3, 0.6));
  const handleResetZoom = () => {
    setMapZoom(1);
    setMapPosition({ x: 0, y: 0 });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
      
      {/* Header and top buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <button 
          onClick={onBack}
          className={`flex items-center gap-2 text-xs font-black uppercase italic tracking-tighter ${
            isDarkMode ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-zinc-900'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          {language === 'PT' ? 'Voltar para Solicitações' : 'Back to Requests'}
        </button>

        <div className="flex items-center gap-3">
          <h1 className={`text-xl sm:text-2xl font-black uppercase tracking-tight italic ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
            {language === 'PT' ? 'Solicitação de Transporte' : 'Freight Shipment'} #{requestObj.id}
          </h1>
          <span className="px-3.5 py-1 text-[9px] font-black tracking-[0.1em] uppercase rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30 animate-pulse">
            {requestObj.status}
          </span>
        </div>
      </div>

      {/* Horizontal Timed Stepper exactly matching the image */}
      <div className={`p-8 rounded-[32px] border ${
        isDarkMode ? 'bg-zinc-950/80 border-white/5' : 'bg-white border-zinc-100 shadow-sm'
      }`}>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-6 relative">
          
          {/* Timeline connecting lines in background */}
          <div className="hidden md:block absolute top-7 left-[8%] right-[8%] h-0.5 bg-zinc-800" />
          <div 
            className="hidden md:block absolute top-7 left-[8%] h-0.5 bg-supplyx-blue transition-all duration-700" 
            style={{ width: `${(activeStepIndex / 5) * 84}%` }}
          />

          {stepperStates.map((step, idx) => {
            const isCompleted = idx < activeStepIndex;
            const isCurrent = idx === activeStepIndex;
            return (
              <div key={idx} className="flex flex-col items-center text-center relative z-10 group">
                {/* Stepper Node Circle */}
                <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${
                  isCompleted 
                    ? 'bg-supplyx-blue border-supplyx-blue text-white shadow-lg shadow-supplyx-blue/30' 
                    : isCurrent 
                      ? 'bg-zinc-950 border-supplyx-blue text-supplyx-blue shadow-lg shadow-supplyx-blue/20 ring-4 ring-supplyx-blue/25'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                }`}>
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <span className="text-xs font-black">{idx + 1}</span>}
                </div>
                
                <p className="text-[10px] font-black uppercase tracking-wider text-white mt-3 mb-0.5 group-hover:text-supplyx-blue transition-colors">
                  {step.title}
                </p>
                {step.date ? (
                  <p className="text-[8px] font-bold text-zinc-500 uppercase">{step.date}</p>
                ) : (
                  <p className="text-[8px] font-bold text-zinc-650 uppercase">—</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Load Details + Radar Tracking visual map row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Card: Detalhes da Carga */}
        <div className={`lg:col-span-1 p-8 rounded-[36px] border flex flex-col justify-between ${
          isDarkMode ? 'bg-zinc-900/50 border-white/5 shadow-2xl shadow-black/40' : 'bg-white border-zinc-100 shadow-sm'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-supplyx-blue flex items-center gap-2">
                <Package className="w-4 h-4" />
                {language === 'PT' ? 'Detalhes da Carga' : 'Cargo Attributes'}
              </h3>
              <span className="text-[9px] font-bold text-zinc-500 uppercase italic">
                {requestObj.requester === 'Client' ? (language === 'PT' ? 'Fretado pelo Cliente' : 'Client Requested') : (language === 'PT' ? 'Fretado pelo Fornecedor' : 'Supplier Requested')}
              </span>
            </div>

            <div className="space-y-4">
              {[
                { label: language === 'PT' ? 'Tipo de Carga' : 'Cargo Type', val: requestObj.tipoCarga },
                { label: language === 'PT' ? 'Quantidade' : 'Quantity', val: requestObj.quantidade },
                { label: language === 'PT' ? 'Volume' : 'Volume', val: requestObj.volume },
                { label: language === 'PT' ? 'Origem' : 'Origin', val: requestObj.origem },
                { label: language === 'PT' ? 'Destino' : 'Destination', val: requestObj.destino },
                { label: language === 'PT' ? 'Data de Coleta' : 'Collection Date', val: requestObj.dataColeta },
                { label: language === 'PT' ? 'Prazo de Entrega' : 'Delivery Lead', val: requestObj.prazoEntrega },
                { label: language === 'PT' ? 'Observações' : 'Operational Notes', val: requestObj.observacoes }
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center text-xs pb-1 border-b border-white/[0.02]">
                  <span className="font-bold text-zinc-500 uppercase tracking-widest text-[9px]">{item.label}</span>
                  <span className="font-black text-white text-right leading-relaxed max-w-[200px] truncate">{item.val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-white/5 space-y-2">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
              <span>{language === 'PT' ? 'Responsabilidade Operacional' : 'Freight Liability'}</span>
              <span className="text-supplyx-blue">{requestObj.freightResponsibility || 'Client'}</span>
            </div>
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
              <span>{language === 'PT' ? 'Modalidade de Entrega' : 'Delivery Mode'}</span>
              <span className="text-teal-400">{requestObj.deliveryMode || 'Third-party Logistics'}</span>
            </div>
          </div>
        </div>

        {/* Right Card: Interactive stylized Flight/Freight Map Maputo-Nampula */}
        <div className={`lg:col-span-2 rounded-[36px] border p-6 flex flex-col justify-between relative overflow-hidden h-[450px] lg:h-auto min-h-[400px] ${
          isDarkMode ? 'bg-zinc-950 border-white/5 shadow-2xl' : 'bg-zinc-100 border-zinc-200'
        }`}>
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />

          {/* Map header info */}
          <div className="absolute top-6 left-6 z-10 flex flex-col pointer-events-none">
            <p className="text-[8px] font-black uppercase text-zinc-500 tracking-[0.3em] mb-1">Mozambique Grid Locator v2.0</p>
            <p className="text-sm font-black italic uppercase tracking-tighter text-white">Roteamento Atlântico de Carga</p>
          </div>

          {/* Interactive Zoom buttons */}
          <div className="absolute right-6 top-6 z-10 flex flex-col gap-2">
            <button 
              onClick={handleZoomIn}
              className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all active:scale-90"
              title="Aproximar"
            >
              <Plus className="w-5 h-5 font-bold" />
            </button>
            <button 
              onClick={handleZoomOut}
              className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all active:scale-90"
              title="Afastar"
            >
              <span className="text-lg font-black leading-none mb-1">-</span>
            </button>
            <button 
              onClick={handleResetZoom}
              className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all active:scale-90"
              title="Resetar"
            >
              <MapIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Visual abstract map using clean procedural vector lines */}
          <div className="w-full h-full flex items-center justify-center pt-8">
            <motion.div 
              style={{ scale: mapZoom }} 
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="w-full h-full max-w-lg max-h-[300px] relative mt-12 select-none"
            >
              {/* Map drawing container */}
              <svg 
                viewBox="0 0 500 320" 
                className="w-full h-full text-zinc-800"
                fill="none" 
                stroke="currentColor"
              >
                {/* Coastal guidelines and state labels */}
                <path 
                  d="M 120 290 C 130 250, 180 230, 210 190 C 240 150, 270 120, 310 80 C 350 40, 420 50, 460 30" 
                  stroke="rgba(255,255,255,0.03)" 
                  strokeWidth="8" 
                />
                
                {/* Dotted target path line map */}
                <path 
                  d="M 152 262 Q 260 160, 385 110" 
                  stroke="#3b82f6" 
                  strokeWidth="3" 
                  strokeDasharray="8 6" 
                  className="animate-dash"
                  id="target-route" 
                />

                {/* Simulated transit point beacon */}
                <motion.circle 
                  cx="152" 
                  cy="262" 
                  r="5" 
                  fill="#10b981" 
                  className="animate-pulse"
                />
                <circle cx="152" cy="262" r="1.5" fill="#fff" />

                {/* End Point Beacon */}
                <motion.circle 
                  cx="385" 
                  cy="110" 
                  r="6" 
                  fill="#ef4444" 
                />
                <circle cx="385" cy="110" r="2.5" fill="#fff" />

                {/* Territory descriptive curves */}
                <text x="310" y="160" fill="rgba(255,255,255,0.15)" fontSize="8" fontWeight="bold" letterSpacing="3" fontFamily="monospace">MOÇAMBIQUE</text>
                <text x="280" y="195" fill="rgba(255,255,255,0.06)" fontSize="9" fontWeight="black" letterSpacing="4" fontFamily="monospace">ZAMBÉZIA</text>
              </svg>

              {/* Map Overlay Labels absolutely positioned for beautiful crisp render */}
              <div className="absolute top-[210px] left-[130px] flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 animate-ping absolute" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
                <span className="text-[10px] font-black uppercase text-emerald-400 bg-zinc-950/80 px-2.5 py-1 rounded-md border border-emerald-500/10 shadow-lg select-none">
                  • Maputo
                </span>
              </div>

              <div className="absolute top-[88px] left-[340px] flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 ring-4 ring-red-500/30 animate-pulse absolute" />
                <div className="w-3 h-3 rounded-full bg-red-500 ring-4 ring-red-500/30" />
                <span className="text-[10px] font-black uppercase text-red-400 bg-zinc-950/80 px-2.5 py-1 rounded-md border border-red-500/10 shadow-lg select-none">
                  📍 Nampula
                </span>
              </div>
            </motion.div>
          </div>

          {/* Bottom telemetry indicators */}
          <div className="flex justify-between items-center text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-4">
            <span>{language === 'PT' ? 'Frequência de Atualização' : 'GPS Refresh rate'}: 2s</span>
            <span>Estabilidade de Satélite: 99.8%</span>
          </div>

        </div>

      </div>

      {/* Transport Proposals & Selections Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Card 1: Propostas de Transporte */}
        <div className={`p-6 rounded-[32px] border ${
          isDarkMode ? 'bg-zinc-900/50 border-white/5 shadow-2xl pb-8' : 'bg-white border-zinc-100 shadow-sm'
        }`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">
                {language === 'PT' ? 'Propostas de Transporte' : 'Freight Bids'}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-supplyx-blue/20 text-supplyx-blue text-[9px] font-black">
                {baseProposals.length}
              </span>
            </div>

            <div className="space-y-3.5 max-h-[280px] overflow-y-auto pr-1">
              {baseProposals.map((prop, idx) => {
                const isSelected = selectedProposalIndex === idx;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedProposalIndex(idx)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-1.5 ${
                      isSelected
                        ? 'bg-supplyx-blue/10 border-supplyx-blue ring-2 ring-supplyx-blue/20'
                        : isDarkMode ? 'bg-zinc-950/40 border-white/5 hover:border-white/10' : 'bg-zinc-50 border-zinc-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-black truncate text-white leading-none mb-1 flex items-center gap-1.5">
                          {prop.name}
                          <span className="flex items-center gap-0.5 bg-amber-500/10 text-amber-500 px-1 py-0.5 rounded text-[8px] font-black leading-none">
                            <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                            {prop.rating}
                          </span>
                        </h4>
                        <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest leading-none mt-1">
                          {language === 'PT' ? 'Prazo' : 'Time'}: {prop.deliverTime} • {prop.capacity}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs font-black text-emerald-400 italic">
                          {prop.price.toLocaleString('pt-BR')} MZN
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/[0.03]">
                      <span className="text-[8px] font-bold text-zinc-500 uppercase">{prop.trips} entregas realizadas</span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProposalIndex(idx);
                        }}
                        className="px-2.5 py-1 rounded bg-supplyx-blue/10 text-supplyx-blue text-[8px] font-black uppercase hover:bg-supplyx-blue hover:text-white transition-all shadow-sm"
                      >
                        Ver Proposta
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-center text-[10px] text-zinc-500 font-extrabold uppercase tracking-widest mt-4 cursor-pointer hover:text-supplyx-blue transition-all">
              Ver todas as propostas
            </p>
          </div>

          {/* Card 2: Proposta Selecionada */}
          <div className={`p-6 rounded-[32px] border ${
            isDarkMode ? 'bg-zinc-900/50 border-white/5 shadow-2xl' : 'bg-white border-zinc-100 shadow-sm'
          }`}>
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-6">
              {language === 'PT' ? 'Proposta Selecionada' : 'Selected Freight Proposal'}
            </h3>

            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
              <div>
                <h4 className="text-sm font-black text-white italic truncate">{selectedProposal.name}</h4>
                <div className="flex items-center gap-1 bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded text-[8px] font-black w-fit mt-1">
                  <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500 animate-pulse" />
                  {selectedProposal.rating} Rating
                </div>
              </div>
              <p className="text-lg font-black text-emerald-400 italic">
                {selectedProposal.price.toLocaleString('pt-BR')} MZN
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Detalhes da Proposta:</p>
              {[
                { label: language === 'PT' ? '✓ Prazo de Entrega' : '✓ Lead Time', val: selectedProposal.features.deliverTime },
                { label: language === 'PT' ? '✓ Tipo de Caminhão' : '✓ Truck Payload', val: selectedProposal.features.truckType },
                { label: language === 'PT' ? '✓ Seguro de Carga' : '✓ Transit Insurance', val: selectedProposal.features.insurance },
                { label: language === 'PT' ? '✓ Rastreamento' : '✓ Live Tracking', val: selectedProposal.features.tracking },
                { label: language === 'PT' ? '✓ Condições de Pgto' : '✓ Deal Terms', val: selectedProposal.features.conditions }
              ].map((f, i) => (
                <div key={i} className="flex justify-between items-center text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">
                  <span className="text-[9.5px]">{f.label}</span>
                  <span className="text-white font-black">{f.val}</span>
                </div>
              ))}
            </div>

            {/* Action buttons matching the image green button and dark negociar link */}
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button 
                onClick={handleNegotiateProposal}
                className="w-full py-4 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
              >
                {language === 'PT' ? 'Negociar' : 'Negotiate'}
              </button>
              <button 
                onClick={handleAcceptProposal}
                className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 hover:shadow-lg hover:shadow-emerald-500/25 border-t border-emerald-400/20"
              >
                {language === 'PT' ? 'Aceitar Proposta' : 'Accept Bid'}
              </button>
            </div>
          </div>

      </div>

      {/* Confetti success state confirmation modal */}
      <AnimatePresence>
        {successModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/85 backdrop-blur-md" 
              onClick={() => setSuccessModal(null)} 
            />
            <motion.div 
              initial={{ scale: 0.9, y: 20, opacity: 0 }} 
              animate={{ scale: 1, y: 0, opacity: 1 }} 
              exit={{ scale: 0.9, y: 20, opacity: 0 }} 
              className={`w-full max-w-md p-8 rounded-[40px] border shadow-3xl relative z-10 text-center ${
                isDarkMode ? 'bg-zinc-900 border-white/10 text-white' : 'bg-white border-zinc-100 text-zinc-900'
              }`}
            >
              <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/30 mx-auto mb-6 relative">
                <CheckCircle className="w-10 h-10" />
                <motion.div 
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: 1.8, opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute inset-0 bg-emerald-500 rounded-full"
                />
              </div>

              <h3 className="text-xl font-black italic uppercase tracking-tighter mb-2">
                {language === 'PT' ? 'Contrato Consolidado!' : 'Deal Consolidated!'}
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-semibold mb-6">
                {language === 'PT' 
                  ? `Iniciaremos a operação logística conjunta com ${successModal}. Toda a comunicação operacional, TIMELINE e guias serão vinculadas ao canal direto.`
                  : `Initiating operational deployment with ${successModal}. Telemetry tracking, timeline events, and customs forms are integrated securely into the channel.`}
              </p>

              <button 
                onClick={() => setSuccessModal(null)}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95"
              >
                {language === 'PT' ? 'Aceder Painel de Operações' : 'Open Fleet Console'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// ==========================================
// CREATE REQUEST FORM SUB-COMPONENT
// ==========================================
interface CreateRequestPageProps {
  isDarkMode: boolean;
  language: 'PT' | 'EN';
  initialPayload?: any;
  onSuccess: (newReq: any) => void;
}

function CreateRequestPage({ isDarkMode, language, initialPayload, onSuccess }: CreateRequestPageProps) {
  const [formData, setFormData] = useState({
    tipoCarga: initialPayload?.tipoCarga || '',
    quantidade: initialPayload?.quantidade || '20 Toneladas',
    peso: initialPayload?.peso || '20t',
    volume: initialPayload?.volume || '35 m³',
    origem: initialPayload?.origem || '',
    destino: initialPayload?.destino || '',
    dataColeta: '15 Mai 2025',
    prazoEntrega: '18 Mai 2025',
    observacoes: initialPayload?.observacoes || '',
    requester: 'Client',
    freightResponsibility: 'Client',
    deliveryMode: 'Third-party Logistics'
  });

  const [loading, setLoading] = useState(false);

  const keyLabels = {
    PT: {
      req: 'Quem está solicitando o transporte?',
      resp: 'Responsibilidade do Frete',
      mode: 'Tipo de Entrega',
      tipo: 'Tipo de Carga',
      qtd: 'Quantidade',
      pso: 'Peso / Tonelagem',
      vol: 'Volume',
      origen: 'Origem (Coleta)',
      dest: 'Destino (Entrega)',
      data: 'Data de Coleta',
      prazo: 'Prazo Limite de Entrega',
      obs: 'Observações Operacionais',
      sub: 'PUBLICAR REQUISIÇÃO DO FRETE'
    },
    EN: {
      req: 'Who is requesting transport?',
      resp: 'Freight Responsibility',
      mode: 'Delivery Mode',
      tipo: 'Cargo Type',
      qtd: 'Quantity',
      pso: 'Weight / Tonnage',
      vol: 'Volume',
      origen: 'Origem Location',
      dest: 'Destination Location',
      data: 'Collection Date',
      prazo: 'Delivery Deadline',
      obs: 'Operational Notes',
      sub: 'PUBLISH FREIGHT REQUEST'
    }
  }[language];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const generatedReq = {
        id: `TR-2025-${Math.floor(1000 + Math.random() * 9000)}`,
        ...formData,
        status: 'Em Competição',
        proposalsCount: 5,
        rating: 4.5
      };
      setLoading(false);
      onSuccess(generatedReq);
    }, 1200);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className={`max-w-4xl mx-auto p-10 rounded-[48px] border ${
        isDarkMode ? 'bg-zinc-900 border-white/5 shadow-3xl' : 'bg-white border-zinc-100 shadow-sm'
      }`}
    >
      <div className="mb-10 text-left">
        <span className="px-3.5 py-1 text-[8.5px] font-black uppercase bg-supplyx-blue/10 text-supplyx-blue border border-supplyx-blue/20 rounded-full tracking-wider">
          {language === 'PT' ? 'Novo Pedido de Carga' : 'New Freight Request'}
        </span>
        <h2 className={`text-2xl font-black italic uppercase tracking-tighter mt-3 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
          {language === 'PT' ? 'Solicitar Cotação Inteligente de Frete' : 'Direct Transport Request'}
        </h2>
        <p className="text-zinc-500 font-semibold text-xs mt-1">Preencha os campos para abrir a licitação regional com transportadoras credenciadas à rede Mozambique.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Step Row Radio selections exactly as prompt specified */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Who is requesting */}
          <div className="p-5 rounded-2xl bg-zinc-950/60 border border-white/5 text-left space-y-3">
            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-supplyx-blue" />
              {keyLabels.req}
            </label>
            <div className="flex flex-col gap-2">
              {['Client', 'Supplier'].map(role => (
                <label key={role} className="flex items-center gap-3 text-xs font-black uppercase text-white cursor-pointer select-none">
                  <input 
                    type="radio" 
                    name="requester" 
                    value={role} 
                    checked={formData.requester === role}
                    onChange={() => setFormData({ ...formData, requester: role })}
                    className="w-4 h-4 accent-supplyx-blue" 
                  />
                  {role === 'Client' ? (language === 'PT' ? 'Cliente' : 'Client') : (language === 'PT' ? 'Fornecedor' : 'Supplier')}
                </label>
              ))}
            </div>
          </div>

          {/* Freight Responsibility */}
          <div className="p-5 rounded-2xl bg-zinc-950/60 border border-white/5 text-left space-y-3">
            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              {keyLabels.resp}
            </label>
            <div className="flex flex-col gap-2">
              {['Client', 'Supplier', 'Shared'].map(resp => (
                <label key={resp} className="flex items-center gap-3 text-xs font-black uppercase text-white cursor-pointer select-none">
                  <input 
                    type="radio" 
                    name="freightResponsibility" 
                    value={resp} 
                    checked={formData.freightResponsibility === resp}
                    onChange={() => setFormData({ ...formData, freightResponsibility: resp })}
                    className="w-4 h-4 accent-supplyx-blue" 
                  />
                  {resp === 'Client' ? (language === 'PT' ? 'Cliente' : 'Client') : 
                   resp === 'Supplier' ? (language === 'PT' ? 'Fornecedor' : 'Supplier') : (language === 'PT' ? 'Compartilhado' : 'Shared')}
                </label>
              ))}
            </div>
          </div>

          {/* Delivery Mode */}
          <div className="p-5 rounded-2xl bg-zinc-950/60 border border-white/5 text-left space-y-3">
            <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-400" />
              {keyLabels.mode}
            </label>
            <div className="flex flex-col gap-2">
              {['Supplier Delivery', 'Client Pickup', 'Third-party Logistics'].map(mode => (
                <label key={mode} className="flex items-center gap-3 text-xs font-black uppercase text-white cursor-pointer select-none">
                  <input 
                    type="radio" 
                    name="deliveryMode" 
                    value={mode} 
                    checked={formData.deliveryMode === mode}
                    onChange={() => setFormData({ ...formData, deliveryMode: mode })}
                    className="w-4 h-4 accent-supplyx-blue" 
                  />
                  {mode === 'Supplier Delivery' ? (language === 'PT' ? 'Entrega Fornecedor' : 'Supplier Delivery') : 
                   mode === 'Client Pickup' ? (language === 'PT' ? 'Retira Cliente' : 'Client Pickup') : (language === 'PT' ? 'Transportadoras 3PL' : 'Third-party Logistics')}
                </label>
              ))}
            </div>
          </div>

        </div>

        {/* Regular inputs info fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="space-y-1.5 text-left">
            <label className="text-[9px] font-black uppercase text-zinc-500 tracking-widest px-2">{keyLabels.tipo} *</label>
            <input 
              required
              type="text" 
              value={formData.tipoCarga}
              onChange={(e) => setFormData({ ...formData, tipoCarga: e.target.value })}
              className={`w-full p-4 rounded-xl border text-xs font-bold outline-none transition-all ${
                isDarkMode ? 'bg-zinc-950 border-white/5 text-white focus:border-supplyx-blue' : 'bg-zinc-50 border-zinc-200 text-zinc-800'
              }`}
              placeholder="Ex: Cimento / Areia / Peças de Britadeira"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5 text-left">
              <label className="text-[9px] font-black uppercase text-zinc-500 tracking-widest px-2">{keyLabels.qtd}</label>
              <input 
                type="text" 
                value={formData.quantidade}
                onChange={(e) => setFormData({ ...formData, quantidade: e.target.value })}
                className={`w-full p-4 rounded-xl border text-xs font-bold outline-none transition-all ${isDarkMode ? 'bg-zinc-950 border-white/5' : ''}`}
                placeholder="Ex: 20 un"
              />
            </div>
            <div className="space-y-1.5 text-left">
              <label className="text-[9px] font-black uppercase text-zinc-500 tracking-widest px-2">{keyLabels.pso} *</label>
              <input 
                required
                type="text" 
                value={formData.peso}
                onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
                className={`w-full p-4 rounded-xl border text-xs font-bold outline-none transition-all ${isDarkMode ? 'bg-zinc-950 border-white/5' : ''}`}
                placeholder="Ex: 20 Ton"
              />
            </div>
            <div className="space-y-1.5 text-left">
              <label className="text-[9px] font-black uppercase text-zinc-500 tracking-widest px-2">{keyLabels.vol}</label>
              <input 
                type="text" 
                value={formData.volume}
                onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                className={`w-full p-4 rounded-xl border text-xs font-bold outline-none transition-all ${isDarkMode ? 'bg-zinc-950 border-white/5' : ''}`}
                placeholder="Ex: 35 m³"
              />
            </div>
          </div>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5 text-left">
            <label className="text-[9px] font-black uppercase text-zinc-500 tracking-widest px-2">{keyLabels.origen} *</label>
            <input 
              required
              type="text" 
              value={formData.origem}
              onChange={(e) => setFormData({ ...formData, origem: e.target.value })}
              className={`w-full p-4 rounded-xl border text-xs font-bold outline-none transition-all ${
                isDarkMode ? 'bg-zinc-950 border-white/5 text-white focus:border-supplyx-blue' : 'bg-zinc-50 border-zinc-200'
              }`}
              placeholder="Localização exata de recolha"
            />
          </div>
          <div className="space-y-1.5 text-left">
            <label className="text-[9px] font-black uppercase text-zinc-500 tracking-widest px-2">{keyLabels.dest} *</label>
            <input 
              required
              type="text" 
              value={formData.destino}
              onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
              className={`w-full p-4 rounded-xl border text-xs font-bold outline-none transition-all ${
                isDarkMode ? 'bg-zinc-950 border-white/5 text-white focus:border-supplyx-blue' : 'bg-zinc-50 border-zinc-200'
              }`}
              placeholder="Localização exata de entrega"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5 text-left">
            <label className="text-[9px] font-black uppercase text-zinc-500 tracking-widest px-2">{keyLabels.data}</label>
            <input 
              type="text" 
              value={formData.dataColeta}
              onChange={(e) => setFormData({ ...formData, dataColeta: e.target.value })}
              className={`w-full p-4 rounded-xl border text-xs font-bold outline-none ${isDarkMode ? 'bg-zinc-950 border-white/5' : ''}`}
            />
          </div>
          <div className="space-y-1.5 text-left">
            <label className="text-[9px] font-black uppercase text-zinc-500 tracking-widest px-2">{keyLabels.prazo}</label>
            <input 
              type="text" 
              value={formData.prazoEntrega}
              onChange={(e) => setFormData({ ...formData, prazoEntrega: e.target.value })}
              className={`w-full p-4 rounded-xl border text-xs font-bold outline-none ${isDarkMode ? 'bg-zinc-950 border-white/5' : ''}`}
            />
          </div>
        </div>

        <div className="space-y-1.5 text-left">
          <label className="text-[9px] font-black uppercase text-zinc-500 tracking-widest px-2">{keyLabels.obs}</label>
          <textarea 
            value={formData.observacoes}
            onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
            className={`w-full p-4 border rounded-xl text-xs font-bold outline-none transition-all h-24 resize-none ${
              isDarkMode ? 'bg-zinc-950 border-white/5 text-white focus:border-supplyx-blue' : 'bg-zinc-50 border-zinc-200'
            }`}
            placeholder="Especificações sobre empacotamento, cubagem, risco químico ou cuidados extras..."
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-5 bg-supplyx-blue hover:brightness-110 text-white rounded-2xl font-black text-sm uppercase italic tracking-tighter shadow-xl shadow-supplyx-blue/20 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlusCircle className="w-5 h-5" />}
          {keyLabels.sub}
        </button>

      </form>
    </motion.div>
  );
}

// ==========================================
// MY REQUESTS LIST PAGE SUB-COMPONENT
// ==========================================
interface RequestsListPageProps {
  isDarkMode: boolean;
  language: 'PT' | 'EN';
  customRequests: any[];
  setSelectedRequestId: (id: string) => void;
  setCustomRequests: (val: any[]) => void;
}

function RequestsListPage({ isDarkMode, language, customRequests, setSelectedRequestId, setCustomRequests }: RequestsListPageProps) {
  
  // Default base request + user generated solicitations merged
  const allRequests = useMemo(() => {
    const base = [
      {
        id: 'TR-2025-0001',
        tipoCarga: 'Cimento',
        quantidade: '20 Toneladas',
        origem: 'Maputo Port',
        destino: 'Nampula Central Obra',
        status: 'Em Competição',
        requester: 'Client'
      },
      {
        id: 'TR-2025-0002',
        tipoCarga: 'Combustível Diesel',
        quantidade: '12.000 Litros',
        origem: 'Matola Refinery',
        destino: 'Tete Moatize Mine',
        status: 'Em Transporte',
        requester: 'Supplier'
      }
    ];
    return [...customRequests, ...base];
  }, [customRequests]);

  const handleDeleteCustom = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customRequests.filter(r => r.id !== id);
    setCustomRequests(updated);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="space-y-6 text-left"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black uppercase italic text-white tracking-tight">
            {language === 'PT' ? 'Painel de Controle de Solicitações' : 'My Freight Board'}
          </h2>
          <p className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-widest mt-1">
            Status operacional de todas as cargas solicitadas na nuvem
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allRequests.map((req) => (
          <div
            key={req.id}
            onClick={() => setSelectedRequestId(req.id)}
            className={`p-6 rounded-[32px] border transition-all cursor-pointer group hover:scale-[1.02] hover:-translate-y-1 flex flex-col justify-between min-h-[220px] ${
              isDarkMode ? 'bg-zinc-900/50 border-white/5 hover:border-supplyx-blue/50 shadow-2xl' : 'bg-white border-zinc-100 shadow-sm'
            }`}
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-black text-supplyx-blue uppercase tracking-widest bg-supplyx-blue/10 px-3 py-1 rounded-full border border-supplyx-blue/15">
                  #{req.id}
                </span>

                <span className={`px-3 py-1 rounded-full text-[8.5px] font-black uppercase tracking-wider border ${
                  req.status === 'Entregue' || req.status === 'Delivered' 
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25'
                    : req.status === 'Em Transporte' || req.status === 'In Transit' 
                      ? 'bg-supplyx-blue/10 text-supplyx-blue border-supplyx-blue/25 animate-pulse'
                      : 'bg-amber-500/10 text-amber-500 border-amber-500/25'
                }`}>
                  {req.status}
                </span>
              </div>

              <h3 className="text-md font-black text-white italic truncate leading-none mb-1.5">{req.tipoCarga}</h3>
              <p className="text-[10px] text-zinc-500 font-semibold">{language === 'PT' ? 'Quantidade' : 'Payload'}: {req.quantidade}</p>
              
              <div className="mt-4 pt-3 border-t border-white/[0.03] space-y-1">
                <p className="text-[9px] font-bold text-zinc-400 uppercase truncate">📍 {req.origem}</p>
                <p className="text-[9px] font-bold text-zinc-400 uppercase truncate">🏁 {req.destino}</p>
              </div>
            </div>

            <div className="flex justify-between items-center mt-6 pt-3 border-t border-white/[0.03]">
              <span className="text-[9px] font-black uppercase text-zinc-500">
                {language === 'PT' ? 'Autor' : 'By'}: {req.requester === 'Client' ? 'Cliente' : 'Fornecedor'}
              </span>

              <div className="flex items-center gap-1.5">
                {req.id.startsWith('TR-2025-0') === false && (
                  <button 
                    onClick={(e) => handleDeleteCustom(req.id, e)}
                    className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all text-[8px] font-bold"
                  >
                    Excluir
                  </button>
                )}
                <span className="text-[9px] font-black text-supplyx-blue uppercase tracking-widest flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Detalhes <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ==========================================
// AVAILABLE LOADS / CARRIERS COMPETITION PORTAL
// ==========================================
interface AvailableLoadsPageProps {
  isDarkMode: boolean;
  language: 'PT' | 'EN';
  customRequests: any[];
  onSelectRequest: (id: string) => void;
}

function AvailableLoadsPage({ isDarkMode, language, customRequests, onSelectRequest }: AvailableLoadsPageProps) {
  
  const allRequests = useMemo(() => {
    const base = [
      {
        id: 'TR-2025-0001',
        tipoCarga: 'Cimento CP-IV',
        quantidade: '20 Toneladas',
        origem: 'Matola, Província de Maputo',
        destino: 'Nampula, Província de Nampula',
        status: 'Em Competição',
        requester: 'Client',
        targetPrice: '78.000 MZN'
      },
      {
        id: 'TR-2025-0002',
        tipoCarga: 'Combustível Especializado',
        quantidade: '12.000 Litros',
        origem: 'Instalações Portuárias Maputo',
        destino: 'Sítio de Exploração Tete',
        status: 'Em Competição',
        requester: 'Supplier',
        targetPrice: '145.000 MZN'
      }
    ];
    return [...customRequests.filter(r => r.status === 'Em Competição' || r.status === 'In Competition'), ...base];
  }, [customRequests]);

  const [appliedBids, setAppliedBids] = useState<Record<string, boolean>>({});
  const [biddingValues, setBiddingValues] = useState<Record<string, string>>({});

  const handlePlaceBid = (id: string, e: React.FormEvent) => {
    e.preventDefault();
    const val = biddingValues[id];
    if (!val) return;
    setAppliedBids(prev => ({ ...prev, [id]: true }));
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="space-y-6 text-left"
    >
      <div>
        <h2 className="text-xl font-black uppercase italic text-white tracking-tight">
          📦 {language === 'PT' ? 'Lotes e Cargas de Fretes Livres' : 'Available Freight Marketplace'}
        </h2>
        <p className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-widest mt-1">
          Espaço regulador de lances onde Transportadoras homologadas competem por rotas de mineração e frotas industriais
        </p>
      </div>

      <div className="space-y-4">
        {allRequests.map((req) => (
          <div
            key={req.id}
            className={`p-6 sm:p-8 rounded-[36px] border transition-all ${
              isDarkMode ? 'bg-zinc-900/50 border-white/5 shadow-2xl' : 'bg-white border-zinc-100 shadow-sm'
            }`}
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
              
              {/* Col 1: Attributes */}
              <div className="md:col-span-1 space-y-2">
                <span className="px-3 py-1 bg-supplyx-blue/15 text-supplyx-blue border border-supplyx-blue/20 rounded-full text-[8px] font-black uppercase tracking-wider">
                  #{req.id} - Aberto
                </span>
                <h3 className="text-md font-black text-white italic truncate leading-none mt-2">{req.tipoCarga}</h3>
                <p className="text-[10px] text-zinc-400 font-bold">{language === 'PT' ? 'Qtd Solicitada' : 'Total volume'}: {req.quantidade}</p>
              </div>

              {/* Col 2: Locations route */}
              <div className="md:col-span-1 text-xs space-y-1.5 text-zinc-400 font-bold">
                <p className="flex items-center gap-1.5 truncate"><span className="text-supplyx-blue">📍 De:</span> {req.origem}</p>
                <p className="flex items-center gap-1.5 truncate"><span className="text-emerald-400">🏁 Para:</span> {req.destino}</p>
              </div>

              {/* Col 3: Target constraints */}
              <div className="md:col-span-1 font-semibold text-xs text-zinc-500">
                <p className="text-[9px] uppercase tracking-widest font-black text-zinc-650">Tarifa Compartilhada Ideal:</p>
                <p className="text-md font-black text-white italic mt-1">{req.targetPrice || 'Mapeando Lances'}</p>
              </div>

              {/* Col 4: Operations bid form */}
              <div className="md:col-span-1">
                {appliedBids[req.id] ? (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Lance Enviado!
                    </p>
                  </div>
                ) : (
                  <form onSubmit={(e) => handlePlaceBid(req.id, e)} className="flex items-center gap-2">
                    <input 
                      required
                      type="text" 
                      placeholder="MT Tarifa (Ex: 75.000)"
                      value={biddingValues[req.id] || ''}
                      onChange={(e) => setBiddingValues({ ...biddingValues, [req.id]: e.target.value })}
                      className="flex-1 bg-zinc-950 border border-white/5 rounded-xl px-3 py-2.5 text-xs font-bold text-white outline-none"
                    />
                    <button 
                      type="submit"
                      className="px-4 py-2.5 bg-supplyx-blue hover:bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase select-none transition-all"
                    >
                      Competir
                    </button>
                  </form>
                )}
                
                <p 
                  onClick={() => onSelectRequest(req.id)}
                  className="text-center text-[9px] font-extrabold uppercase text-supplyx-blue hover:underline cursor-pointer mt-3 tracking-widest"
                >
                  Visualizar Painel e Competidores
                </p>
              </div>

            </div>
          </div>
        ))}

        {allRequests.length === 0 && (
          <div className="p-12 text-center border-2 border-dashed border-zinc-800 rounded-3xl">
            <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">Nenhuma carga livre disponível para disputa no momento.</p>
          </div>
        )}
      </div>

    </motion.div>
  );
}
