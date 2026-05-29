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
  XCircle,
  Trash2
} from 'lucide-react';
import { CargoRequest, CommercialDriver, CarrierProposal, Occurrence } from './types';
import { db, auth } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs, getDoc, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';

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
      targetPrice: 'A definir por lance logístico'
    } as CargoRequest;
  }, [selectedRequestId, requests]);

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
      trips: 0
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

  // Filter the bids shown based on the user's role: logistics agents cannot see proposals from other agents
  const visibleBids = useMemo(() => {
    if (userType === 'logistics') {
      // Show only current user's bids
      return bids.filter(prop => prop.userId === user?.uid);
    }
    // Buyers/Suppliers see all bids (default simulated ones + actual user submitted ones)
    return bids;
  }, [bids, userType, user?.uid]);

  const activeLogisticsPartners = useMemo(() => {
    const partnersMap = new Map<string, { uid: string; name: string }>();

    // Put some default partners first if needed, or get from replies
    (requestObj.logisticsReplies || []).forEach((rep: any) => {
      if (rep.logisticsUserId && rep.logisticsUserId !== 'anonymous') {
        const name = rep.sender === 'logistics' ? rep.senderName : (rep.logisticsUserName || 'Operador Logístico');
        partnersMap.set(rep.logisticsUserId, { uid: rep.logisticsUserId, name });
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
        const pId = rep.logisticsUserId || 'ops_logistica_default';
        return pId === myUid;
      });
    }
    // Buyers/Suppliers see replies filtered by their currently selected logistics provider
    // If no logistics provider exists or they haven't selected one, we default to the first active partner
    const activeUid = currentLogisticsUserId || 'ops_logistica_default';
    return repliesList.filter((rep: any) => {
      const pId = rep.logisticsUserId || 'ops_logistica_default';
      return pId === activeUid;
    });
  }, [requestObj.logisticsReplies, userType, user?.uid, currentLogisticsUserId]);

  const selectedBid = useMemo(() => {
    return visibleBids[selectedProposalIndex] || visibleBids[0] || null;
  }, [visibleBids, selectedProposalIndex]);

  // Add carrier bid proposal manually
  const submitCarrierBid = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPrice = parseInt(newCarrierBid.price) || 80000;
    const bidObj: CarrierProposal = {
      id: `BP-0${bids.length + 1}`,
      cargoId: selectedRequestId,
      name: userType === 'logistics' ? (profile?.companyName || user?.displayName || newCarrierBid.name) : newCarrierBid.name,
      rating: 4.9,
      deliverTime: newCarrierBid.deliverTime,
      price: parsedPrice,
      trips: 1,
      insurance: newCarrierBid.insurance,
      conditions: newCarrierBid.conditions,
      userId: user?.uid || 'anonymous'
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
      <div className="flex flex-nowrap overflow-x-auto gap-2 pb-2.5 border-b border-white/5 no-scrollbar select-none w-full">
        {[
          { id: 'info', label: language === 'PT' ? '📋 Detalhes Operacionais' : '📋 Spec & Telemetry' },
          { 
            id: 'reply', 
            label: userType === 'logistics'
              ? (language === 'PT' ? '💬 Responder ao Remetente' : '💬 Respond to Requester')
              : (language === 'PT' ? '💬 Chat & Negociação' : '💬 Negotiation & Chat')
          },
          ...((requestObj.status === 'Em concurso' || visibleBids.length > 0) ? [{
            id: 'bids',
            label: language === 'PT' ? `🏆 Concurso de Fretes [${visibleBids.length}]` : `🏆 Freight Concourse [${visibleBids.length}]`
          }] : []),
          { id: 'occurrences', label: language === 'PT' ? `⚠️ Ocorrências Registadas [${filteredOccurrences.length}]` : `⚠️ Incidents [${filteredOccurrences.length}]` },
          { id: 'documents', label: language === 'PT' ? '📄 Documentos Digitais / PoD' : '📄 Digital Vault / PoD' },
          { id: 'review', label: language === 'PT' ? '⭐ Feedback & Avaliação' : '⭐ Post-Delivery Feedback' }
        ].map(tb => (
          <button
            key={tb.id}
            onClick={() => setActiveTab(tb.id as any)}
            className={`px-4 py-2.5 rounded-xl text-[9.5px] font-black uppercase tracking-wider transition-all border shrink-0 select-none whitespace-nowrap ${
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
        {/* TAB 2: RESPONDER AO REMETENTE */}
        {activeTab === 'reply' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* LEFT PANE: B2B NEGOTIATION CHAT */}
            <div className={`p-6 sm:p-8 rounded-[32px] border flex flex-col justify-between h-[520px] ${
              isDarkMode ? 'bg-zinc-900/50 border-white/5 shadow-2xl' : 'bg-white border-zinc-100 shadow-sm'
            }`}>
              <div>
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/5">
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-supplyx-blue" />
                    {language === 'PT' ? 'Histórico de Mensagens / Respostas' : 'Message & Negotiation Log'}
                  </h3>
                  <span className="text-[8px] font-mono text-zinc-450 uppercase">ID: #{requestObj.id}</span>
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

                      {/* Display the latest operator proposal if available */}
                      {requestObj.status === 'Em negociação' && (
                        <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl space-y-3">
                          <p className="text-[9.5px] font-black uppercase text-emerald-400 tracking-wider">★ PROPOSTA LOGÍSTICA RECEBIDA:</p>
                          <p className="text-[10px] text-zinc-400 font-bold">
                            {language === 'PT' ? 'O operador logístico respondeu apresentando as seguintes condições definitivas para este transporte:' : 'The carrier/logistics operator responded with proposed options:'}
                          </p>
                          <ul className="text-[10px] font-mono text-white list-disc pl-4 space-y-1">
                            <li>{language === 'PT' ? 'Valor Consolidado:' : 'Rate Proposed:'} <span className="text-emerald-400 font-bold">{requestObj.targetPrice}</span></li>
                            <li>{language === 'PT' ? 'Prazo Recomendado:' : 'Transit Promised:'} <span className="text-zinc-300 font-bold">{requestObj.prazoEntrega}</span></li>
                            <li>{language === 'PT' ? 'Veículo Alocado:' : 'Vehicle Scheduled:'} <span className="text-zinc-300">{requestObj.deliveryMode}</span></li>
                          </ul>

                          <div className="flex gap-2.5 pt-2">
                            <button
                              onClick={handleRejectProposal}
                              className="flex-1 py-2 rounded-xl bg-red-500/10 hover:bg-red-550 text-red-500 hover:text-white border border-red-500/20 text-[9px] font-black uppercase tracking-wider transition-all"
                            >
                              {language === 'PT' ? 'Recusar / Negociar' : 'Reject & Counter'}
                            </button>
                            <button
                              onClick={handleAcceptProposal}
                              className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider rounded-xl shadow-lg transition-all"
                            >
                              {language === 'PT' ? 'Aceitar e Homologar ✓' : 'Accept & Contract ✓'}
                            </button>
                          </div>
                        </div>
                      )}

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
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-supplyx-blue flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    {language === 'PT' ? 'Ficha de Cubagem/Peso' : 'Operational Cargo Spec'}
                  </h3>
                </div>

                <div className="space-y-4">
                  {[
                    { label: 'Categoria', val: requestObj.tipoCarga },
                    { label: 'Solicitante', val: requestObj.requesterName || (requestObj.requester === 'Client' ? 'Cliente' : 'Fornecedor') },
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
                        <p className="text-[8px] font-bold text-zinc-500 uppercase">
                          {assignedDriver.vehicle} • Placa: {assignedDriver.licenseId}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                            <span className="text-[9px] font-black text-zinc-300 font-mono">{assignedDriver.rating}</span>
                          </div>
                          <span className="text-[8px] text-zinc-500 font-bold">• {assignedDriver.trips || 120} viagens</span>
                        </div>
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
