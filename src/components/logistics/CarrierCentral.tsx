import React, { useState, useEffect, useRef } from 'react';
import { 
  Truck, 
  MapPin, 
  Package, 
  CheckCircle2, 
  DollarSign, 
  MessageSquare, 
  Activity, 
  Send, 
  AlertTriangle, 
  User, 
  ShieldAlert, 
  TrendingUp, 
  MapPinOff,
  Navigation,
  FileText
} from 'lucide-react';
import { CargoRequest } from './types';

interface CarrierCentralProps {
  isDarkMode: boolean;
  language: 'PT' | 'EN';
  requests: CargoRequest[];
  onUpdateRequests: (updated: CargoRequest[]) => void;
  occurrences: any[];
  onAddOccurrence: (occurrence: any) => void;
  profileName?: string;
}

export default function CarrierCentral({
  isDarkMode,
  language,
  requests = [],
  onUpdateRequests,
  occurrences = [],
  onAddOccurrence,
  profileName
}: CarrierCentralProps) {
  // Setup tabs inside Carrier Central: 'available' | 'active' | 'tracking' | 'chat'
  const [carrierTab, setCarrierTab] = useState<'available' | 'active' | 'tracking' | 'chat'>('available');
  const [selectedLoadId, setSelectedLoadId] = useState<string | null>(null);
  
  // Local active updates for manual tracking simulation
  const [manuallyUpdatedLocation, setManuallyUpdatedLocation] = useState<Record<string, string>>(() => {
    // default positions for loads
    return {
      'TR-2025-0001': 'Porto de Maputo - Alfândega',
      'TR-2025-0002': 'Via Beira, km 140',
      'TR-2025-0003': 'Terminal de Descarga Nacala'
    };
  });

  // Custom current location input state
  const [currentLocInput, setCurrentLocInput] = useState('');

  // Occurrences incident reporting states
  const [incidentCategory, setIncidentCategory] = useState('Atrasos');
  const [incidentDescription, setIncidentDescription] = useState('');

  // Chat/Conversas simulation states
  const [chatMessages, setChatMessages] = useState<Record<string, any[]>>(() => {
    const saved = localStorage.getItem('supplyx_carrier_chat_messages');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      'TR-2025-0001': [
        { id: 1, sender: 'buyer', text: 'Boa tarde, a carga de cimento CP-IV já está pronta para carregamento?', time: '14:20' },
        { id: 2, sender: 'carrier', text: 'Sim, a documentação fiscal está sendo homologada pelo fornecedor. Iniciamos a recolha em breve.', time: '14:25' }
      ],
      'TR-2025-0002': [
        { id: 1, sender: 'buyer', text: 'Verificamos que o camião parou na balança do Posto. Há algum atraso?', time: '09:00' },
        { id: 2, sender: 'carrier', text: 'Identificamos uma pequena fila para pesagem. Motorista já em trânsito novamente.', time: '09:12' }
      ]
    };
  });

  const [typedMessage, setTypedMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll chats
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, selectedLoadId, carrierTab]);

  // Persist carrier chats
  const handlePersistChats = (updatedChats: Record<string, any[]>) => {
    localStorage.setItem('supplyx_carrier_chat_messages', JSON.stringify(updatedChats));
    setChatMessages(updatedChats);
  };

  const carrierName = profileName || 'Fast Cargo Transportes Lda';

  // Filters computed based on carrier assignment
  const availableLoads = requests.filter(r => r.status === 'Em concurso');
  
  const activeDeliveries = requests.filter(r => 
    r.status !== 'Em concurso' && 
    r.status !== 'Pago' && 
    r.status !== 'Pendente' &&
    (r.assignedCarrier === carrierName || r.assignedCarrier === 'Fast Cargo Transportes' || r.assignedCarrier === 'Moz Logistics, Lda' || !r.assignedCarrier)
  );

  // Set first load as default selection if none
  useEffect(() => {
    if (!selectedLoadId) {
      if (activeDeliveries.length > 0) {
        setSelectedLoadId(activeDeliveries[0].id);
      } else if (availableLoads.length > 0) {
        setSelectedLoadId(availableLoads[0].id);
      }
    }
  }, [activeDeliveries, availableLoads, selectedLoadId]);

  const selectedLoad = requests.find(r => r.id === selectedLoadId) || requests[0] || null;

  // Accept available load action
  const handleAcceptLoad = (loadId: string) => {
    const updated = requests.map(r => {
      if (r.id === loadId) {
        return {
          ...r,
          status: 'Em recolha',
          assignedCarrier: carrierName,
          targetPrice: r.targetPrice || '64.500 MZN'
        };
      }
      return r;
    });
    onUpdateRequests(updated);
    setSelectedLoadId(loadId);
    setCarrierTab('active');
  };

  // Move status forward
  const handleAdvanceStatus = (loadId: string, currentStatus: string) => {
    let nextStatus = 'Em recolha';
    if (currentStatus === 'Em recolha') nextStatus = 'Em trânsito';
    else if (currentStatus === 'Em trânsito') nextStatus = 'Entregue';
    else if (currentStatus === 'Entregue') return; // terminal

    const updated = requests.map(r => {
      if (r.id === loadId) {
        return {
          ...r,
          status: nextStatus
        };
      }
      return r;
    });

    onUpdateRequests(updated);

    // If it changed to Entregue, we can notify or complete tracking
    if (nextStatus === 'Em trânsito') {
      setManuallyUpdatedLocation(prev => ({
        ...prev,
        [loadId]: 'Estrada Nacional EN1 - Trânsito a caminho do Destino'
      }));
    }
  };

  // Manual current location update helper
  const handleUpdateCurrentLocationText = () => {
    if (!selectedLoadId || !currentLocInput.trim()) return;
    setManuallyUpdatedLocation(prev => ({
      ...prev,
      [selectedLoadId]: currentLocInput.trim()
    }));
    setCurrentLocInput('');
  };

  // Add occurrence handler
  const handleReportIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoadId || !incidentDescription.trim()) return;

    const newOcc = {
      id: `OC-${Math.floor(2500 + Math.random() * 7500)}`,
      cargoId: selectedLoadId,
      cargoName: selectedLoad?.tipoCarga || 'Material Despachado',
      description: incidentDescription.trim(),
      category: incidentCategory,
      dateTime: new Date().toLocaleDateString('pt-PT', {day: 'numeric', month: 'short', year: 'numeric'}) + ' ' + new Date().toLocaleTimeString('pt-PT', {hour: '2-digit', minute: '2-digit'}),
      responsible: carrierName,
      status: 'Aberta'
    };

    onAddOccurrence(newOcc);
    setIncidentDescription('');
  };

  // Submit chat message with intelligent auto simulation responder!
  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoadId || !typedMessage.trim()) return;

    const activeMessages = chatMessages[selectedLoadId] || [];
    const newMsg = {
      id: Date.now(),
      sender: 'carrier',
      text: typedMessage.trim(),
      time: new Date().toLocaleTimeString('pt-PT', {hour: '2-digit', minute: '2-digit'})
    };

    const updated = {
      ...chatMessages,
      [selectedLoadId]: [...activeMessages, newMsg]
    };

    handlePersistChats(updated);
    const sentText = typedMessage.trim();
    setTypedMessage('');

    // Simulated responsive feedback from the Client / Buyer
    setTimeout(() => {
      let simulatedReply = '';
      const clientName = selectedLoad?.requester === 'Client' ? 'Engenharia Geral Central' : 'Consumidor B2B';

      if (sentText.toLowerCase().includes('recolha') || sentText.toLowerCase().includes('coleta')) {
        simulatedReply = `Perfeito! O fornecedor nas docas já foi avisado sobre a chegada da transportadora ${carrierName}. Por favor verifique o manifesto fiscal de saída da guia nacional antes de arrancar.`;
      } else if (sentText.toLowerCase().includes('atraso') || sentText.toLowerCase().includes('transito') || sentText.toLowerCase().includes('trânsito')) {
        simulatedReply = `Compreendemos as exigências do percurso na EN1. Agradecemos o aviso, por favor mantenha o monitoramento ativo e focado na segurança de viagem.`;
      } else if (sentText.toLowerCase().includes('chegamos') || sentText.toLowerCase().includes('entrega') || sentText.toLowerCase().includes('balanca')) {
        simulatedReply = `Confirmado, nossa equipa de faturamento físico B2B já está posicionada no armazém recetivo para conferir a cubagem física. Muito obrigado pela atualização!`;
      } else {
        simulatedReply = `Agradecemos as atualizações logísticas em tempo-real do contrato #${selectedLoadId}. Excelente cooperação!`;
      }

      const replyMsg = {
        id: Date.now() + 1,
        sender: 'buyer',
        text: simulatedReply,
        time: new Date().toLocaleTimeString('pt-PT', {hour: '2-digit', minute: '2-digit'})
      };

      const updatedWithReply = {
        ...chatMessages,
        [selectedLoadId]: [...(chatMessages[selectedLoadId] || []), newMsg, replyMsg]
      };
      handlePersistChats(updatedWithReply);
    }, 1500);
  };

  // Active chat listing selection
  const chatRooms = requests.filter(r => r.status !== 'Em concurso' && r.status !== 'Pendente');

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 text-left animate-in fade-in duration-300">
      
      {/* COLUMN 1: SIDEBAR CONTROLLER */}
      <div className="xl:col-span-1 space-y-6">
        <div className={`p-6 rounded-[32px] border ${isDarkMode ? 'bg-zinc-900 border-white/5 shadow-2xl' : 'bg-white border-zinc-150 shadow-sm'}`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-supplyx-blue text-white flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-md font-black italic uppercase leading-none ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                {carrierName}
              </h3>
              <p className="text-[8px] text-emerald-500 font-extrabold uppercase mt-1 tracking-widest">
                {language === 'PT' ? 'Transporte Homologado' : 'Licensed Transporter'}
              </p>
            </div>
          </div>

          <div className="space-y-1">
            {[
              { id: 'available', icon: Package, pt: `Disponíveis (${availableLoads.length})`, en: `Available (${availableLoads.length})` },
              { id: 'active', icon: CheckCircle2, pt: `Entregas Ativas (${activeDeliveries.length})`, en: `Active (${activeDeliveries.length})` },
              { id: 'tracking', icon: Activity, pt: 'Rastreio em Tempo-real', en: 'Real-time Tracking' },
              { id: 'chat', icon: MessageSquare, pt: 'Conversas & Alertas', en: 'Conversations / Chats' }
            ].map(tab => {
              const Icon = tab.icon;
              const isSelected = carrierTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCarrierTab(tab.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                    isSelected 
                      ? 'bg-supplyx-blue text-white border-supplyx-blue shadow-lg shadow-supplyx-blue/15' 
                      : isDarkMode 
                        ? 'bg-zinc-950/40 border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900' 
                        : 'bg-zinc-50 border-transparent text-zinc-650 hover:bg-zinc-100 hover:text-zinc-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {language === 'PT' ? tab.pt : tab.en}
                </button>
              );
            })}
          </div>
        </div>

        {/* RECENT OCCURRENCES BOARD SUMMARY */}
        <div className={`p-6 rounded-[32px] border ${isDarkMode ? 'bg-zinc-900 border-white/5 shadow-2xl' : 'bg-white border-zinc-150 shadow-sm'}`}>
          <h4 className={`text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-1.5 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            {language === 'PT' ? 'Fiscais / Ocorrências' : 'Freight Incidents'}
          </h4>

          {occurrences.length === 0 ? (
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide py-2">
              {language === 'PT' ? 'Nenhuma ocorrência reportada.' : 'No active incident logs.'}
            </p>
          ) : (
            <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1 no-scrollbar">
              {occurrences.slice(0, 4).map((occ, i) => (
                <div key={i} className="p-3 rounded-xl bg-zinc-950/30 border border-white/5 space-y-1 text-[10px]">
                  <div className="flex justify-between items-center text-[8px] font-black uppercase">
                    <span className="text-amber-500 font-mono">#{occ.cargoId}</span>
                    <span className="text-zinc-500">{occ.dateTime.split(' ')[0]}</span>
                  </div>
                  <p className="font-extrabold text-white uppercase tracking-tight truncate">{occ.category}</p>
                  <p className="text-zinc-400 font-bold truncate leading-none">{occ.description}</p>
                  <span className={`inline-block text-[7px] font-black uppercase px-2 py-0.5 rounded-full mt-1 ${
                    occ.status === 'Aberta' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
                  }`}>
                    {occ.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* COLUMN 2: TAB CONTENTS */}
      <div className="xl:col-span-3 space-y-6">
        
        {/* TAB 1: AVAILABLE LOADS (PEDIDOS DISPONÍVEIS) */}
        {carrierTab === 'available' && (
          <div className="space-y-6">
            <div>
              <h2 className={`text-xl font-black uppercase italic tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                🗺️ {language === 'PT' ? 'Pedidos Disponibilizados ao Concurso' : 'Carriers Concourse loads'}
              </h2>
              <p className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-widest mt-1">
                {language === 'PT' 
                  ? 'Licite, arremate e confirme contratos de faturamento sob a taxa estipulada' 
                  : 'Instant arrogate loads with stable price margins'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {availableLoads.map(load => (
                <div 
                  key={load.id}
                  className={`p-6 rounded-[32px] border transition-all hover:scale-[1.01] flex flex-col justify-between min-h-[260px] ${
                    isDarkMode ? 'bg-zinc-900 border-white/5 shadow-2xl' : 'bg-white border-zinc-150 shadow-sm'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[9px] font-black text-supplyx-blue bg-supplyx-blue/10 border border-supplyx-blue/15 px-2.5 py-1 rounded-full font-mono">
                        #{load.id}
                      </span>
                      <span className="text-[8px] font-black uppercase bg-amber-500/10 text-amber-500 px-2 py-1 rounded-md border border-amber-500/15">
                        {language === 'PT' ? 'Disponível' : 'Open / Concourse'}
                      </span>
                    </div>

                    <h4 className={`text-md font-black italic uppercase leading-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'} mb-2`}>
                      {load.tipoCarga}
                    </h4>

                    <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-zinc-400 py-3 border-y border-white/[0.03]">
                      <div>
                        <span className="text-[7.5px] uppercase text-zinc-500 font-black block tracking-widest">{language === 'PT' ? 'PESO' : 'WEIGHT'}</span>
                        <span className="text-white font-mono">{load.peso}</span>
                      </div>
                      <div>
                        <span className="text-[7.5px] uppercase text-zinc-500 font-black block tracking-widest">{language === 'PT' ? 'CUBAGEM' : 'VOLUME'}</span>
                        <span className="text-white font-mono">{load.volume}</span>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 text-[10px] font-bold text-zinc-300">
                      <p className="truncate"><span className="text-zinc-500">📍 ORIGEM:</span> {load.origem}</p>
                      <p className="truncate"><span className="text-zinc-500">🏁 DESTINO:</span> {load.destino}</p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/[0.03] flex items-center justify-between">
                    <div>
                      <span className="text-[8px] font-black uppercase text-zinc-500 block leading-none">{language === 'PT' ? 'Valor do Frete' : 'Freight Rate'}</span>
                      <span className="text-md font-black text-emerald-400 italic">MT {load.targetPrice || '68.000'}</span>
                    </div>
                    
                    <button
                      onClick={() => handleAcceptLoad(load.id)}
                      className="px-6 py-3 bg-[#0052CC] text-white rounded-2xl font-black text-[10px] uppercase tracking-wider shadow-lg shadow-brand/15 hover:bg-[#0747A6] transition-all flex items-center gap-1.5 active:scale-95"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      {language === 'PT' ? 'Aceitar Entrega' : 'Accept Delivery'}
                    </button>
                  </div>
                </div>
              ))}

              {availableLoads.length === 0 && (
                <div className="col-span-1 md:col-span-2 p-12 text-center border-2 border-dashed border-zinc-800 rounded-[32px]">
                  <MapPinOff className="w-10 h-10 text-zinc-500 mx-auto mb-3" />
                  <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">
                    {language === 'PT' ? 'Nenhuma carga aberta no concurso logístico.' : 'No open concourse shipments available.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ACTIVE DELIVERIES (ENTREGAS ATIVAS) */}
        {carrierTab === 'active' && (
          <div className="space-y-6">
            <div>
              <h2 className={`text-xl font-black uppercase italic tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                🚚 {language === 'PT' ? 'Entregas Sob Gestão Ativa' : 'Deliveries in Progress'}
              </h2>
              <p className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-widest mt-1">
                {language === 'PT' 
                  ? 'Acompanhe as rotas ativas da frota e gerencie o status das operações rodoviárias' 
                  : 'Status progression logs and operational controls'}
              </p>
            </div>

            <div className="space-y-4">
              {activeDeliveries.map(load => {
                const isSelected = selectedLoadId === load.id;
                return (
                  <div 
                    key={load.id}
                    onClick={() => setSelectedLoadId(load.id)}
                    className={`p-6 rounded-[32px] border transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-supplyx-blue bg-supplyx-blue/[0.02]' 
                        : isDarkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-150'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3.5 mb-2">
                          <span className="text-[9px] font-black text-supplyx-blue font-mono uppercase bg-supplyx-blue/10 px-2 py-0.5 rounded">
                            #{load.id}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                            load.status === 'Em trânsito' 
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                              : load.status === 'Em recolha' 
                                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {load.status}
                          </span>
                        </div>
                        <h4 className={`text-md font-black italic uppercase text-white leading-tight`}>{load.tipoCarga}</h4>
                        <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                          🏁 {load.origem.split(',')[0]} ➔ {load.destino.split(',')[0]}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-right justify-between md:justify-end">
                        <div className="hidden sm:block">
                          <span className="text-[7.5px] text-zinc-500 font-black block uppercase tracking-widest">{language === 'PT' ? 'Fretagem Líquida' : 'Net Freight'}</span>
                          <span className="text-sm font-black text-emerald-400 italic">MT {load.targetPrice || '78.500'}</span>
                        </div>

                        <div className="flex gap-2">
                          {load.status === 'Em recolha' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAdvanceStatus(load.id, 'Em recolha');
                              }}
                              className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider shadow-lg transition-all active:scale-95 flex items-center gap-1"
                            >
                              <Navigation className="w-3.5 h-3.5" />
                              {language === 'PT' ? 'Iniciar Transporte' : 'Start Journey'}
                            </button>
                          )}

                          {load.status === 'Em trânsito' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAdvanceStatus(load.id, 'Em trânsito');
                              }}
                              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider shadow-lg transition-all active:scale-95 flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {language === 'PT' ? 'Confirmar Entrega' : 'Confirm Delivery'}
                            </button>
                          )}

                          {load.status === 'Entregue' && (
                            <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/15 px-3 py-2 rounded-xl flex items-center gap-1">
                              ✅ {language === 'PT' ? 'ENTREGA CONCLUÍDA' : 'DELIVERED'}
                            </span>
                          )}
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLoadId(load.id);
                              setCarrierTab('tracking');
                            }}
                            className="px-4 py-3 bg-zinc-950/40 text-zinc-300 border border-white/5 rounded-xl text-[9px] font-black uppercase hover:text-white hover:bg-zinc-900 tracking-wider transition-all"
                          >
                            {language === 'PT' ? 'Painel de Rastreio' : 'Telemetry'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Exibir localização atual do banco se selecionado */}
                    {isSelected && (
                      <div className="mt-4 pt-4 border-t border-white/[0.03] text-[10px] space-y-2 font-bold text-zinc-400">
                        <p>
                          📍 <span className="text-zinc-500">LOCALIZAÇÃO ATUAL:</span>{' '}
                          <span className={`text-white uppercase ${isDarkMode ? 'bg-zinc-950' : 'bg-zinc-50'} py-1 px-2.5 rounded`}>
                            {manuallyUpdatedLocation[load.id] || 'Depósito Logístico - Preparando de Doca'}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}

              {activeDeliveries.length === 0 && (
                <div className="p-12 text-center border-2 border-dashed border-zinc-800 rounded-[32px]">
                  <Truck className="w-10 h-10 text-zinc-500 mx-auto mb-3" />
                  <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">
                    {language === 'PT' ? 'Nenhuma entrega ativa em andamento.' : 'No active deliveries currently in progress.'}
                  </p>
                  <button 
                    onClick={() => setCarrierTab('available')}
                    className="mt-4 px-6 py-2.5 bg-supplyx-blue text-white font-black text-[9px] uppercase tracking-wider rounded-xl hover:brightness-110 active:scale-95"
                  >
                    🚀 {language === 'PT' ? 'Adquirir Cargas do Concurso' : 'Acquire Loads'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: REAL-TIME TRACKING & INCIDENTS (RASTREAMENTO & OCORRÊNCIAS) */}
        {carrierTab === 'tracking' && (
          <div className="space-y-6">
            <div>
              <h2 className={`text-xl font-black uppercase italic tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                📡 {language === 'PT' ? 'Telemetria e Rastreamento de Trajeto' : 'Route Telemetry / Incidents log'}
              </h2>
              <p className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-widest mt-1">
                {language === 'PT' 
                  ? 'Controle manual de posicionamento da carga e envio de guias de ocorrências federadas.' 
                  : 'Frictionless carrier telemetry positioning and incident report mechanisms.'}
              </p>
            </div>

            {selectedLoad ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left card: load recap and locations */}
                <div className={`lg:col-span-2 p-6 rounded-[32px] border space-y-6 ${
                  isDarkMode ? 'bg-zinc-900 border-white/5 shadow-2xl' : 'bg-white border-zinc-150'
                }`}>
                  <div className="flex justify-between items-start pb-4 border-b border-white/[0.03]">
                    <div>
                      <span className="text-[8px] font-mono text-zinc-500 block uppercase">NÚMERO DO CONTRATO DE FRETE:</span>
                      <h4 className="text-sm font-black text-supplyx-blue font-mono">#{selectedLoad.id}</h4>
                    </div>
                    <span className="text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded">
                      {selectedLoad.status}
                    </span>
                  </div>

                  {/* Operational details metrics grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3.5 rounded-2xl bg-zinc-950/20 border border-white/5">
                      <span className="text-[7.5px] uppercase font-black text-zinc-500 block">{language === 'PT' ? 'MERCADORIA' : 'CARGO'}</span>
                      <p className="text-xs font-black text-white italic truncate">{selectedLoad.tipoCarga}</p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-zinc-950/20 border border-white/5">
                      <span className="text-[7.5px] uppercase font-black text-zinc-500 block">{language === 'PT' ? 'PESO LÍQUIDO' : 'WEIGHT'}</span>
                      <p className="text-xs font-black text-white font-mono">{selectedLoad.peso}</p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-zinc-950/20 border border-white/5">
                      <span className="text-[7.5px] uppercase font-black text-zinc-500 block">{language === 'PT' ? 'CUSTÓDIA' : 'REVENUE'}</span>
                      <p className="text-xs font-black text-emerald-400 font-mono">MT {selectedLoad.targetPrice || '68.000'}</p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-zinc-950/20 border border-white/5">
                      <span className="text-[7.5px] uppercase font-black text-zinc-500 block">{language === 'PT' ? 'MOTORISTA' : 'DRIVER'}</span>
                      <p className="text-xs font-black text-white truncate">José Matsinhe</p>
                    </div>
                  </div>

                  {/* Simulated Telemetry Timeline */}
                  <div className="space-y-4">
                    <p className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">🛠️ ROTEIRO OPERACIONAL REGIONAL:</p>
                    
                    <div className="relative pl-6 space-y-6 before:absolute before:left-1.5 before:top-1.5 before:bottom-1.5 before:w-0.5 before:bg-zinc-800">
                      {/* Step Origin */}
                      <div className="relative">
                        <div className="absolute -left-[22px] top-1 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-blue-500/20" />
                        <span className="text-[8px] font-black uppercase text-zinc-500 block">DADO DA COLETA / DEPARTURE:</span>
                        <p className="text-xs font-black text-white">{selectedLoad.origem}</p>
                        <p className="text-[8px] text-zinc-500 font-bold mt-0.5 uppercase">Aprovado e carregado na doca: {selectedLoad.dataColeta}</p>
                      </div>

                      {/* Step Intermediate Telemetry */}
                      <div className="relative">
                        <div className="absolute -left-[22px] top-1 w-3 h-3 rounded-full bg-amber-500 ring-4 ring-amber-500/20" />
                        <span className="text-[8px] font-black uppercase text-zinc-500 block">LOCALIZAÇÃO ATUAL REPORTADA DA FROTA:</span>
                        <p className="text-xs font-black text-white uppercase italic bg-zinc-950/40 p-2.5 rounded-xl border border-white/5 mt-1 inline-block">
                          🚚 {manuallyUpdatedLocation[selectedLoad.id] || 'Aguardando actualização rodoviária pelas guias de transporte do porto'}
                        </p>
                      </div>

                      {/* Step Destination */}
                      <div className="relative">
                        <div className="absolute -left-[22px] top-1 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
                        <span className="text-[8px] font-black uppercase text-zinc-500 block">DESEMBARQUE FINAL / ARRIVAL DESTINY:</span>
                        <p className="text-xs font-black text-white">{selectedLoad.destino}</p>
                        <p className="text-[8px] text-zinc-500 font-bold mt-0.5 uppercase">Previsão estimada de receção: {selectedLoad.prazoEntrega}</p>
                      </div>
                    </div>
                  </div>

                  {/* Manual Telemetry updates controller */}
                  <div className="pt-4 border-t border-white/[0.03]">
                    <span className="text-[9px] font-black uppercase text-zinc-400 tracking-wider block mb-2">
                      ✏️ ATUALIZAR LOCALIZAÇÃO MANUALMENTE (SIMULAÇÃO):
                    </span>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={currentLocInput}
                        onChange={(e) => setCurrentLocInput(e.target.value)}
                        placeholder="Ex: Balança Rodoviária de Tete, KM 45"
                        className={`flex-1 p-3.5 rounded-xl border text-xs font-bold leading-none ${
                          isDarkMode ? 'bg-zinc-950 border-white/10 text-white placeholder-zinc-500' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                        }`}
                      />
                      <button
                        onClick={handleUpdateCurrentLocationText}
                        disabled={!currentLocInput.trim()}
                        className="px-6 py-3 bg-supplyx-blue text-white font-black text-[9px] uppercase tracking-wider rounded-xl shadow-lg hover:brightness-110 active:scale-95 disabled:opacity-50"
                      >
                        {language === 'PT' ? 'Atualizar' : 'Update GPS'}
                      </button>
                    </div>
                  </div>

                </div>

                {/* Right cards: incident notifier form and incidents log */}
                <div className="space-y-6">
                  
                  {/* Reporting form */}
                  <div className={`p-6 rounded-[32px] border ${
                    isDarkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-150'
                  }`}>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />
                      {language === 'PT' ? 'Participar Ocorrência' : 'Report Incident / delay'}
                    </h4>

                    <form onSubmit={handleReportIncident} className="space-y-4">
                      <div>
                        <label className="text-[8px] font-black uppercase text-zinc-500 tracking-wider block mb-1.5">CATEGORIA:</label>
                        <select
                          value={incidentCategory}
                          onChange={(e) => setIncidentCategory(e.target.value)}
                          className={`w-full p-3 rounded-xl text-xs font-bold border ${
                            isDarkMode ? 'bg-zinc-950 border-white/10 text-zinc-350' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                          }`}
                        >
                          <option value="Atrasos">Atraso Operacional / Trânsito</option>
                          <option value="Avaria Mecânica">Quebra / Avaria Mecânica do Veículo</option>
                          <option value="Falha de entrega">Balança de Carga / Aduana</option>
                          <option value="Outros incidentes">Problemas de Clima / Força Maior</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[8px] font-black uppercase text-zinc-500 tracking-wider block mb-1.5">DESCRIÇÃO DA OCORRÊNCIA:</label>
                        <textarea
                          rows={3}
                          value={incidentDescription}
                          onChange={(e) => setIncidentDescription(e.target.value)}
                          placeholder="Ex: Congestionamento na balsa de travessia do Caia causou atraso de 3 horas..."
                          className={`w-full p-3.5 rounded-xl border text-xs font-bold ${
                            isDarkMode ? 'bg-zinc-950 border-white/10 text-white placeholder-zinc-500' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                          }`}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={!incidentDescription.trim()}
                        className="w-full py-3.5 bg-red-650 hover:bg-red-700 bg-red-600 text-white font-black text-[9px] uppercase tracking-wider rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
                      >
                        🚨 {language === 'PT' ? 'Transmitir Alerta' : 'Transmit S.O.S Incident'}
                      </button>
                    </form>
                  </div>

                  {/* Shipment specific occurrence count */}
                  <div className={`p-6 rounded-[32px] border ${
                    isDarkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-150 shadow-sm'
                  }`}>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3 block">
                      {language === 'PT' ? 'Log de Ocorrências deste Contrato' : 'Contract Incidents Track'}
                    </h4>
                    
                    {occurrences.filter(o => o.cargoId === selectedLoad.id).length === 0 ? (
                      <p className="text-[10.5px] font-bold text-zinc-500 uppercase py-2">
                        {language === 'PT' ? 'Excelente! Carga sem ocorrências registradas.' : 'All clear! Cargo operates smoothly.'}
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {occurrences.filter(o => o.cargoId === selectedLoad.id).map((o, i) => (
                          <div key={i} className="p-3 rounded-xl bg-zinc-950/20 border border-white/5 text-[9.5px]">
                            <div className="flex justify-between items-center text-[7.5px] font-black text-zinc-500 uppercase leading-none">
                              <span>{o.category}</span>
                              <span>{o.dateTime}</span>
                            </div>
                            <p className="text-zinc-300 font-extrabold mt-1 leading-normal uppercase">{o.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

              </div>
            ) : (
              <div className="p-12 text-center border-2 border-dashed border-zinc-800 rounded-[32px]">
                <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">
                  {language === 'PT' ? 'Selecione uma das suas entregas ativas para visualizar a telemetria.' : 'Select an active shipment to display telemetry logs.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: CARGO SPECIFIC DIAL CHAT (CONVERSAS) */}
        {carrierTab === 'chat' && (
          <div className="space-y-6">
            <div>
              <h2 className={`text-xl font-black uppercase italic tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                💬 {language === 'PT' ? 'Canal Dialógico da Carga' : 'Participated Shipments Chats'}
              </h2>
              <p className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-widest mt-1">
                {language === 'PT' 
                  ? 'Conecte-se em tempo-real com a gerência recetiva do cliente comprador' 
                  : 'Frictionless chat conduit for contracted shipment orders'}
              </p>
            </div>

            {chatRooms.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Rooms selection left column */}
                <div className="space-y-3.5">
                  <p className="text-[8.5px] font-black uppercase text-zinc-500 tracking-wider">SALAS DE CONVERSA EXCLUSIVAS:</p>
                  
                  {chatRooms.map(room => {
                    const isSelected = selectedLoadId === room.id;
                    const messagesList = chatMessages[room.id] || [];
                    const lastMsg = messagesList[messagesList.length - 1]?.text || 'Sem mensagens...';
                    
                    return (
                      <div
                        key={room.id}
                        onClick={() => setSelectedLoadId(room.id)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] ${
                          isSelected 
                            ? 'border-supplyx-blue bg-supplyx-blue/[0.03]' 
                            : isDarkMode ? 'bg-zinc-900 border-white/5 hover:border-white/10' : 'bg-white border-zinc-150'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1 text-[8px] font-mono">
                          <span className="text-supplyx-blue font-black">#{room.id}</span>
                          <span className="text-zinc-500">B2B CLIENTE</span>
                        </div>
                        <h4 className="text-[11px] font-black text-white italic truncate leading-none uppercase">{room.tipoCarga}</h4>
                        <p className="text-[9.5px] text-zinc-400 truncate mt-2 font-medium italic">"{lastMsg}"</p>
                      </div>
                    );
                  })}
                </div>

                {/* Dialog thread right column */}
                <div className={`lg:col-span-2 p-6 rounded-[32px] border flex flex-col justify-between h-[480px] ${
                  isDarkMode ? 'bg-zinc-900 border-white/5 shadow-2xl' : 'bg-white border-zinc-150 shadow-sm'
                }`}>
                  
                  {selectedLoad ? (
                    <>
                      {/* Thread Header */}
                      <div className="pb-4 border-b border-white/[0.03] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#0052CC] text-white font-black flex items-center justify-center italic text-sm">
                            SX
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-white uppercase tracking-tight">{selectedLoad.tipoCarga}</h4>
                            <p className="text-[8.5px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">
                              {language === 'PT' ? 'Canal direto com o Comprador' : 'Direct line with Buyer'}
                            </p>
                          </div>
                        </div>

                        <span className="text-[8.5px] font-black uppercase bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded">
                          Ativo
                        </span>
                      </div>

                      {/* Messages Thread Body */}
                      <div className="flex-1 overflow-y-auto my-4 pr-1 space-y-3.5 no-scrollbar max-h-[300px]">
                        {(chatMessages[selectedLoad.id] || []).map((msg, i) => {
                          const isMe = msg.sender === 'carrier';
                          return (
                            <div 
                              key={i} 
                              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                            >
                              <div className={`p-4 rounded-3xl max-w-[84%] text-xs font-bold leading-normal ${
                                isMe 
                                  ? 'bg-supplyx-blue text-white rounded-br-none' 
                                  : isDarkMode 
                                    ? 'bg-zinc-950 text-zinc-200 border border-white/5 rounded-bl-none' 
                                    : 'bg-zinc-100 text-zinc-800 rounded-bl-none'
                              }`}>
                                <p>{msg.text}</p>
                              </div>
                              <span className="text-[7.5px] text-zinc-500 font-bold mt-1 uppercase font-mono px-1">
                                {isMe ? 'TRANSPORTE' : 'B2B CLIENTE'} • {msg.time}
                              </span>
                            </div>
                          );
                        })}
                        <div ref={chatEndRef} />
                      </div>

                      {/* Text typing footer form */}
                      <form onSubmit={handleSendChatMessage} className="pt-4 border-t border-white/[0.03] flex gap-2">
                        <input 
                          type="text" 
                          value={typedMessage}
                          onChange={(e) => setTypedMessage(e.target.value)}
                          placeholder={language === 'PT' ? 'Digite sua mensagem de rastreamento...' : 'Type carrier update message...'}
                          className={`flex-1 p-3.5 rounded-xl border text-xs font-bold leading-none ${
                            isDarkMode ? 'bg-zinc-950 border-white/10 text-white placeholder-zinc-500' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                          }`}
                        />
                        <button
                          type="submit"
                          disabled={!typedMessage.trim()}
                          className="p-3.5 bg-supplyx-blue text-white rounded-xl shadow-lg hover:brightness-110 active:scale-95 disabled:opacity-50 flex items-center justify-center"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </form>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-center">
                      <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">{language === 'PT' ? 'Selecione uma sala de conversa ao lado.' : 'Select a chat room.'}</p>
                    </div>
                  )}

                </div>
              </div>
            ) : (
              <div className="p-12 text-center border-2 border-dashed border-zinc-800 rounded-[32px]">
                <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">
                  {language === 'PT' ? 'Nenhuma conversa ativa no momento.' : 'No active collaborated dialogs yet.'}
                </p>
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
}
