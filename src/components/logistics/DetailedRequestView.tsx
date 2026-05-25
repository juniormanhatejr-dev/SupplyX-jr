import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  XCircle
} from 'lucide-react';
import { CargoRequest, CommercialDriver, CarrierProposal, Occurrence } from './types';

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
}

export default function DetailedRequestView({
  isDarkMode,
  language,
  selectedRequestId,
  onBack,
  requests,
  occurrences,
  drivers,
  onChangeRequestStatus,
  onPublishToConcourse,
  onAssignCarrier,
  onAddOccurrence,
  onToggleOccurrence,
  onUpdateFeedback,
  onUpdateCargoPod,
  onNavigateToTab
}: DetailedRequestViewProps) {
  const [selectedProposalIndex, setSelectedProposalIndex] = useState<number>(0);
  const [mapZoom, setMapZoom] = useState<number>(1);
  const [successModal, setSuccessModal] = useState<string | null>(null);

  // States for new interactive features
  const [activeTab, setActiveTab] = useState<'info' | 'bids' | 'occurrences' | 'documents' | 'review'>('info');

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
  const [isDrawing, setIsDrawing] = useState(false);
  const [savedSignature, setSavedSignature] = useState<string>('');

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
      targetPrice: '78.000 MZN'
    } as CargoRequest;
  }, [selectedRequestId, requests]);

  // Stepper timeline - aligned strictly with the requested 7 states
  // We exclude 'Cancelado' because it is a terminal abort state.
  const stepperStates = [
    { title: 'Pendente', date: language === 'PT' ? 'Fila Inicial' : 'Fila Inicial', key: 'Pendente' },
    { title: 'Em concurso', date: language === 'PT' ? 'Propostas do Mercado' : 'Bidding phase', key: 'Em concurso' },
    { title: 'Atribuído', date: language === 'PT' ? 'Livre Seletivo' : 'Carrier assigned', key: 'Atribuído' },
    { title: 'Em recolha', date: language === 'PT' ? 'Coleta e Verficação' : 'Pickup depot', key: 'Em recolha' },
    { title: 'Em trânsito', date: language === 'PT' ? 'Em viagem ativa' : 'On corridor', key: 'Em trânsito' },
    { title: 'Entregue', date: language === 'PT' ? 'POD Consolidado' : 'Consolidated PoD', key: 'Entregue' }
  ];

  // Map active step index logic
  const activeStepIndex = useMemo(() => {
    const status = requestObj.status;
    if (status === 'Pendente') return 0;
    if (status === 'Em concurso' || status === 'Em Competição') return 1;
    if (status === 'Atribuído' || status === 'Negociação') return 2;
    if (status === 'Em recolha' || status === 'Aguardando Coleta') return 3;
    if (status === 'Em trânsito' || status === 'Em Transporte') return 4;
    if (status === 'Entregue') return 5;
    return -1; // e.g. Cancelado
  }, [requestObj.status]);

  // Persisted proposals inside localStorage for interactive Bidding
  const [bids, setBids] = useState<CarrierProposal[]>(() => {
    const stored = localStorage.getItem(`supplyx_bids_${selectedRequestId}`);
    if (stored) return JSON.parse(stored);

    // Initial default bids
    const initialBids: CarrierProposal[] = [
      {
        id: 'BP-01',
        cargoId: selectedRequestId,
        name: 'Moz Logistics, Lda',
        rating: 4.8,
        deliverTime: '3 dias',
        price: 78000,
        trips: 184,
        insurance: 'Incluso (Fidelidade)',
        conditions: 'Faturado 15d'
      },
      {
        id: 'BP-02',
        cargoId: selectedRequestId,
        name: 'Fast Cargo Transportes',
        rating: 4.6,
        deliverTime: '2 dias',
        price: 85000,
        trips: 112,
        insurance: 'Incluso (Standard)',
        conditions: 'Faturado 30d'
      },
      {
        id: 'BP-03',
        cargoId: selectedRequestId,
        name: 'Nampula Carriers',
        rating: 4.2,
        deliverTime: '4 dias',
        price: 72000,
        trips: 64,
        insurance: 'Sob Consulta',
        conditions: '50% Entrada'
      }
    ];

    localStorage.setItem(`supplyx_bids_${selectedRequestId}`, JSON.stringify(initialBids));
    return initialBids;
  });

  const syncBids = (newBids: CarrierProposal[]) => {
    localStorage.setItem(`supplyx_bids_${selectedRequestId}`, JSON.stringify(newBids));
    setBids(newBids);
  };

  // Add carrier bid proposal manually
  const submitCarrierBid = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPrice = parseInt(newCarrierBid.price) || 80000;
    const bidObj: CarrierProposal = {
      id: `BP-0${bids.length + 1}`,
      cargoId: selectedRequestId,
      name: newCarrierBid.name,
      rating: 4.9,
      deliverTime: newCarrierBid.deliverTime,
      price: parsedPrice,
      trips: 1,
      insurance: newCarrierBid.insurance,
      conditions: newCarrierBid.conditions
    };

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

  const handleDrawSignature = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    const rect = canvas.getBoundingClientRect();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#3b82f6';
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
    const dataUrl = canvas.toDataURL();
    setSavedSignature(dataUrl);
    onUpdateCargoPod(selectedRequestId, dataUrl, requestObj.podPhoto || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200');
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
                className="px-5 py-2.5 rounded-xl bg-supplyx-blue hover:brightness-110 text-white text-[9.5px] font-black uppercase tracking-wider"
              >
                📢 {language === 'PT' ? 'Publicar no Canal de Concursos' : 'Publish to Carriers Concourse'}
              </button>
            )}

            {requestObj.status === 'Atribuído' && (
              <button 
                onClick={() => onChangeRequestStatus(requestObj.id, 'Em recolha')}
                className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-[9.5px] font-black uppercase tracking-wider"
              >
                🚚 {language === 'PT' ? 'Colocar em Recolha' : 'Advance to Recollec'}
              </button>
            )}

            {requestObj.status === 'Em recolha' && (
              <button 
                onClick={() => onChangeRequestStatus(requestObj.id, 'Em trânsito')}
                className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-[9.5px] font-black uppercase tracking-wider"
              >
                🛣️ {language === 'PT' ? 'Iniciar Viagem (Em trânsito)' : 'Disptach to Corridor'}
              </button>
            )}

            {requestObj.status === 'Em trânsito' && (
              <button 
                onClick={() => onChangeRequestStatus(requestObj.id, 'Entregue')}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[9.5px] font-black uppercase tracking-wider"
              >
                📦 {language === 'PT' ? 'Finalizar Entrega (Entregue)' : 'Confirm Perfect Delivery'}
              </button>
            )}

            <button 
              onClick={() => onChangeRequestStatus(requestObj.id, 'Cancelado')}
              className="px-4 py-2.5 rounded-xl bg-red-500/15 border border-red-500/25 text-red-400 hover:bg-red-500 hover:text-white text-[9px] font-black uppercase tracking-wider transition-all"
            >
              ❌ {language === 'PT' ? 'Cancelar Pedido' : 'Abort Order'}
            </button>
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
      <div className="flex flex-wrap gap-2 pb-1 border-b border-white/5">
        {[
          { id: 'info', label: language === 'PT' ? '📋 Detalhes Operacionais' : '📋 Spec & Telemetry' },
          { id: 'bids', label: language === 'PT' ? `💰 Concurso de Lances [${bids.length}]` : `💰 Bids Portal [${bids.length}]` },
          { id: 'occurrences', label: language === 'PT' ? `⚠️ Ocorrências Registadas [${filteredOccurrences.length}]` : `⚠️ Incidents [${filteredOccurrences.length}]` },
          { id: 'documents', label: language === 'PT' ? '📄 Documentos Digitais / PoD' : '📄 Digital Vault / PoD' },
          { id: 'review', label: language === 'PT' ? '⭐ Feedback & Avaliação' : '⭐ Post-Delivery Feedback' }
        ].map(tb => (
          <button
            key={tb.id}
            onClick={() => setActiveTab(tb.id as any)}
            className={`px-4 py-2.5 rounded-xl text-[9.5px] font-black uppercase tracking-wider transition-all border ${
              activeTab === tb.id
                ? 'bg-supplyx-blue border-supplyx-blue text-white shadow-md'
                : 'bg-zinc-950 border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {/* TAB 1: OPERATIONAL INFO & SATELLITE MAP */}
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Spec table */}
            <div className={`p-8 rounded-[36px] border flex flex-col justify-between ${
              isDarkMode ? 'bg-zinc-900/50 border-white/5 shadow-2xl' : 'bg-white border-zinc-100'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-supplyx-blue flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    {language === 'PT' ? 'Ficha de Cubagem/Peso' : 'Operational Cargo Spec'}
                  </h3>
                </div>

                <div className="space-y-4">
                  {[
                    { label: 'Categoria', val: requestObj.tipoCarga },
                    { label: 'Cubagem Estimada', val: requestObj.volume || '35 m³' },
                    { label: 'Peso bruto real', val: requestObj.peso },
                    { label: 'Endereço Recolha', val: requestObj.origem },
                    { label: 'Endereço Destino', val: requestObj.destino },
                    { label: 'Data de Coleta', val: requestObj.dataColeta || 'A Combinar' },
                    { label: 'Responsável Custo', val: requestObj.freightResponsibility || 'Client' },
                    { label: 'Modo Trânsito', val: requestObj.deliveryMode || 'Fretado Livre' },
                    { label: 'Transportadora Atribuída', val: requestObj.assignedCarrier || (language === 'PT' ? 'Aguardando seleção de lances' : 'Unassigned (Bidding open)') },
                    { label: 'Observações Fiel', val: requestObj.observacoes || 'Sem notas extras' }
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-xs pb-1 border-b border-white/[0.02]">
                      <span className="font-bold text-zinc-500 uppercase tracking-widest text-[8.5px]">{item.label}</span>
                      <span className="font-black text-white text-right leading-relaxed max-w-[180px] truncate">{item.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {requestObj.assignedCarrier && (
                <div className="mt-6 flex flex-col gap-2">
                  <div className="p-4 bg-supplyx-blue/10 rounded-2xl border border-supplyx-blue/20 flex items-center justify-between">
                    <div>
                      <p className="text-[8px] font-black uppercase text-zinc-400">Transportador Consolidado:</p>
                      <p className="text-[10px] font-black text-white italic">{requestObj.assignedCarrier}</p>
                    </div>
                    
                    <button 
                      onClick={() => onNavigateToTab('Mensagens')}
                      className="p-2 bg-supplyx-blue text-white rounded-lg hover:brightness-110 flex items-center gap-1 text-[8px] font-black uppercase tracking-wider"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Chat B2B
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Dynamic Abstract Map */}
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
                {bids.map((prop, idx) => {
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
                })}
              </div>
            </div>

            {/* Selected Active Bid Terms & Assignment */}
            <div className={`p-6 sm:p-8 rounded-[32px] border ${
              isDarkMode ? 'bg-zinc-900/50 border-white/5 shadow-2xl' : 'bg-white border-zinc-100'
            }`}>
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-6">
                {language === 'PT' ? 'Dossiê da Proposta Ativa' : 'Proposal Term Parameters'}
              </h3>

              {bids[selectedProposalIndex] ? (
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
                    <div>
                      <h4 className="text-sm font-black text-white italic">{bids[selectedProposalIndex].name}</h4>
                      <p className="text-[8px] text-zinc-500 font-bold uppercase mt-1">Prazo operacional: {bids[selectedProposalIndex].deliverTime}</p>
                    </div>
                    <h4 className="text-lg font-black text-emerald-400 italic">MT {bids[selectedProposalIndex].price.toLocaleString('pt-BR')} MZN</h4>
                  </div>

                  <div className="space-y-3 mb-8 text-xs text-zinc-400 font-semibold uppercase tracking-wider text-left">
                    <div className="flex justify-between border-b border-white/[0.02] pb-1">
                      <span>✓ Cobertura Seguro:</span>
                      <span className="text-white font-black">{bids[selectedProposalIndex].insurance}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/[0.02] pb-1">
                      <span>✓ Condição Faturamento:</span>
                      <span className="text-white font-black">{bids[selectedProposalIndex].conditions}</span>
                    </div>
                    <div className="flex justify-between pb-1">
                      <span>✓ Reputação Motoristas:</span>
                      <span className="text-amber-500 font-black flex items-center gap-1">★ {bids[selectedProposalIndex].rating} Excelência</span>
                    </div>
                  </div>

                  {requestObj.status === 'Em concurso' ? (
                    <button 
                      onClick={() => {
                        onAssignCarrier(requestObj.id, bids[selectedProposalIndex].name, bids[selectedProposalIndex].price);
                        setSuccessModal(bids[selectedProposalIndex].name);
                      }}
                      className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      {language === 'PT' ? 'Fechar Contrato / Atribuir Transportadora' : 'Accept Terms & Sign Agreement'}
                    </button>
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
              ) : (
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
                  <div key={idx} className="p-4 bg-zinc-950 border border-white/5 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-white italic leading-none mb-1">{doc.title}</p>
                      <p className="text-[8px] text-zinc-500 font-bold uppercase">Código Oficial: {doc.code}</p>
                    </div>

                    <button 
                      onClick={() => alert(`Simulando download do documento ${doc.code} compilado em PDF com dados on-chain.`)}
                      className="p-2.5 bg-zinc-900 border border-white/5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg flex items-center gap-1 text-[8.5px] font-black uppercase"
                    >
                      <Download className="w-3.5 h-3.5" />
                      PDF
                    </button>
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
                    width={350}
                    height={120}
                    onMouseMove={handleDrawSignature}
                    onMouseDown={startDrawing}
                    onMouseUp={() => setIsDrawing(false)}
                    onMouseLeave={() => setIsDrawing(false)}
                    className="w-full bg-zinc-950 rounded-lg cursor-crosshair h-[120px]"
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

    </div>
  );
}
