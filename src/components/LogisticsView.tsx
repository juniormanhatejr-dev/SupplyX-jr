import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Truck, 
  MapPin, 
  Package, 
  CheckCircle2, 
  Activity, 
  Navigation2, 
  PlusCircle, 
  FileText, 
  User, 
  ChevronRight, 
  ArrowLeft,
  Building2,
  DollarSign,
  TrendingUp,
  Award,
  ListFilter
} from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { collection, onSnapshot, query, where, getDocs, setDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';

// Decoupled sub-system views
import { CargoRequest, CommercialDriver, StorageWarehouse, FinancialLedger } from './logistics/types';
import LogisticsDashboard from './logistics/LogisticsDashboard';
import DetailedRequestView from './logistics/DetailedRequestView';
import CreateRequestPage from './logistics/CreateRequestPage';
import RequestsListPage from './logistics/RequestsListPage';
import DriversSystem from './logistics/DriversSystem';
import InventoryFulfillment from './logistics/InventoryFulfillment';
import LogisticsFinancial from './logistics/LogisticsFinancial';
import CarrierCentral from './logistics/CarrierCentral';

interface LogisticsViewProps {
  isDarkMode: boolean;
  language: 'PT' | 'EN';
  userType?: string;
  onNavigate?: (tab: string, payload?: any) => void;
  initialPayload?: any;
  activeSubTab?: string;
  setActiveSubTab?: (tab: string) => void;
}

export default function LogisticsView({
  isDarkMode,
  language,
  userType,
  onNavigate,
  initialPayload,
  activeSubTab: propActiveSubTab,
  setActiveSubTab: propSetActiveSubTab
}: LogisticsViewProps) {
  
  // Tab Routing ('dashboard' | 'detailed_request' | 'create_request' | 'requests_list' | 'available_loads' | 'drivers' | 'inventory' | 'financial')
  const [localActiveSubTab, setLocalActiveSubTab] = useState<string>('dashboard');
  const activeSubTab = propActiveSubTab !== undefined ? propActiveSubTab : localActiveSubTab;
  const setActiveSubTab = propSetActiveSubTab !== undefined ? propSetActiveSubTab : setLocalActiveSubTab;
  const [selectedRequestId, setSelectedRequestId] = useState<string>('TR-2025-0001');

  // ==========================================
  // STATE MANAGEMENT / LOCAL STORAGE STORAGE PERSISTENCE
  // ==========================================

  // 1. Cargo Requests lists
  const [customRequests, setCustomRequests] = useState<CargoRequest[]>(() => {
    const saved = localStorage.getItem('supplyx_freight_requests');
    if (saved) return JSON.parse(saved);

    // Default pre-populated initial requests to make the cockpit feel professional
    const initialRequests: CargoRequest[] = [
      {
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
      },
      {
        id: 'TR-2025-0002',
        tipoCarga: 'Combustível Especializado',
        quantidade: '12.000 Litros',
        peso: '12 Toneladas',
        volume: '15 m³',
        origem: 'Instalações Portuárias Maputo',
        destino: 'Sítio de Exploração Tete',
        status: 'Em trânsito',
        requester: 'Supplier',
        freightResponsibility: 'Supplier',
        deliveryMode: 'Third-party Logistics',
        dataColeta: '23 Mai 2026',
        prazoEntrega: '26 Mai 2026',
        observacoes: 'Substâncias inflamáveis com condutor classe B habilitado.',
        proposalsCount: 2,
        rating: 4.6,
        targetPrice: '145.000 MZN',
        assignedCarrier: 'Fast Cargo Transportes'
      },
      {
        id: 'TR-2025-0003',
        tipoCarga: 'Carvão Mineral Bruto',
        quantidade: '30 Toneladas',
        peso: '30 Toneladas',
        volume: '40 m³',
        origem: 'Moatize Vale, Província de Tete',
        destino: 'Beira Terminal Export',
        status: 'Entregue',
        requester: 'Client',
        freightResponsibility: 'Client',
        deliveryMode: 'Supplier Delivery',
        dataColeta: '18 Mai 2026',
        prazoEntrega: '20 Mai 2026',
        observacoes: 'Descarga livre basculante.',
        proposalsCount: 5,
        rating: 4.9,
        targetPrice: '92.000 MZN',
        assignedCarrier: 'Moz Logistics, Lda'
      }
    ];

    localStorage.setItem('supplyx_freight_requests', JSON.stringify(initialRequests));
    return initialRequests;
  });

  // 2. Active Fleets / Drivers list
  const [drivers, setDrivers] = useState<CommercialDriver[]>(() => {
    const saved = localStorage.getItem('supplyx_drivers');
    if (saved) return JSON.parse(saved);

    const initialDrivers: CommercialDriver[] = [
      { id: 'DR-01', name: 'Armando Nhalungo', licenseId: 'MC-87983-C', vehicle: 'Volvo FH 540', capacity: '32 Toneladas', location: 'Porto de Maputo', status: 'Disponível', rating: 4.9, trips: 142 },
      { id: 'DR-02', name: 'Carlos Langa', licenseId: 'MZ-44122-A', vehicle: 'Scania Streamline', capacity: '24 Toneladas', location: 'Beira Terminal', status: 'Em Trânsito', rating: 4.7, trips: 96 },
      { id: 'DR-03', name: 'Mateus Macamo', licenseId: 'NH-63211-B', vehicle: 'Mercedes Actros', capacity: '30 Toneladas', location: 'Matola Refinery', status: 'Em Descanso', rating: 4.5, trips: 62 }
    ];

    localStorage.setItem('supplyx_drivers', JSON.stringify(initialDrivers));
    return initialDrivers;
  });

  // 3. Storage Warehouses list
  const [warehouses] = useState<StorageWarehouse[]>(() => {
    const saved = localStorage.getItem('supplyx_warehouses');
    if (saved) return JSON.parse(saved);

    const initialWarehouses: StorageWarehouse[] = [
      { id: 'WH-01', name: 'Maputo Terminal Sul', location: 'Matola, Provincia de Maputo', capacityTotal: '50.000 Tons', capacityUsed: '38.500 Tons', percentage: 78, manager: 'Alberto Ubisse', contact: '+258 84 111 2233', itemsCount: 140 },
      { id: 'WH-02', name: 'Beira Logistics Hub', location: 'Porto Comercial da Beira', capacityTotal: '30.000 Tons', capacityUsed: '18.600 Tons', percentage: 62, manager: 'Sérgio Tembe', contact: '+258 82 444 5555', itemsCount: 78 },
      { id: 'WH-03', name: 'Nacala Port Storage', location: 'Nacala, Nampula', capacityTotal: '80.000 Tons', capacityUsed: '32.000 Tons', percentage: 40, manager: 'Filipe Matsinhe', contact: '+258 87 777 8888', itemsCount: 34 }
    ];

    localStorage.setItem('supplyx_warehouses', JSON.stringify(initialWarehouses));
    return initialWarehouses;
  });

  // 4. Financial ledgers billing list
  const [financialLedgers, setFinancialLedgers] = useState<FinancialLedger[]>(() => {
    const saved = localStorage.getItem('supplyx_financials');
    if (saved) return JSON.parse(saved);

    const initialFinancials: FinancialLedger[] = [
      { id: 'FT-101', cargoId: 'TR-2025-0001', cargoName: 'Cimento CP-IV', client: 'Construtora Sul', carrier: 'Moz Logistics, Lda', totalFreight: 78000, feeSupplyX: 7800, netPayout: 70200, status: 'Pago', dueDate: '02 Jun 2026' },
      { id: 'FT-102', cargoId: 'TR-2025-0002', cargoName: 'Combustível Especializado', client: 'Tete Explorations', carrier: 'Fast Cargo Transportes', totalFreight: 145000, feeSupplyX: 14500, netPayout: 130500, status: 'Pendente', dueDate: '15 Jun 2026' }
    ];

    localStorage.setItem('supplyx_financials', JSON.stringify(initialFinancials));
    return initialFinancials;
  });

  // 5. Ocorrências (incidents registry)
  const [occurrences, setOccurrences] = useState<any[]>(() => {
    const saved = localStorage.getItem('supplyx_occurrences');
    if (saved) return JSON.parse(saved);

    const initialOccurrences = [
      {
        id: 'OC-2201',
        cargoId: 'TR-2025-0002',
        cargoName: 'Combustível Especializado',
        description: 'Verificação aduaneira atrasou liberação na ponte de Tete',
        category: 'Atrasos',
        dateTime: '22 Mai 2026 14:30',
        responsible: 'Armando Nhalungo',
        status: 'Aberta'
      }
    ];

    localStorage.setItem('supplyx_occurrences', JSON.stringify(initialOccurrences));
    return initialOccurrences;
  });

  // 6. Alertas / Notificações
  const [logisticsNotifications, setLogisticsNotifications] = useState<any[]>(() => {
    const saved = localStorage.getItem('supplyx_logistics_notifications');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'nt-1', title: 'Novo Concurso Publicado', text: 'Carga TR-2025-0001 está aberta para lances de transportadoras.', time: 'Poucos minutos atrás', type: 'info' }
    ];
  });

  const syncOccurrencesToLocalStorage = (list: any[]) => {
    localStorage.setItem('supplyx_occurrences', JSON.stringify(list));
    setOccurrences(list);
  };

  const syncNotificationsToLocalStorage = (list: any[]) => {
    localStorage.setItem('supplyx_logistics_notifications', JSON.stringify(list));
    setLogisticsNotifications(list);
  };

  // Synchronize triggers to local storage and Firestore
  const syncRequestsToLocalStorage = (list: CargoRequest[]) => {
    localStorage.setItem('supplyx_freight_requests', JSON.stringify(list));
    setCustomRequests(list);
    list.forEach((req) => {
      syncRequestToFirestore(req);
    });
  };

  const syncDriversToLocalStorage = (list: CommercialDriver[]) => {
    localStorage.setItem('supplyx_drivers', JSON.stringify(list));
    setDrivers(list);
  };

  const syncFinancialsToLocalStorage = (list: FinancialLedger[]) => {
    localStorage.setItem('supplyx_financials', JSON.stringify(list));
    setFinancialLedgers(list);
  };

  // Helper to update structural fields in Firestore freight_orders
  const syncRequestToFirestore = async (req: CargoRequest) => {
    try {
      const q = query(collection(db, 'freight_orders'), where('id', '==', req.id));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        querySnapshot.forEach(async (docSnap) => {
          await updateDoc(docSnap.ref, { ...req });
        });
      } else {
        await setDoc(doc(db, 'freight_orders', req.id), req);
      }
    } catch (err) {
      console.warn('Failed to sync cargo request to Firestore:', err);
    }
  };

  // Real-time listener for freight_orders collection
  useEffect(() => {
    try {
      const q = query(collection(db, 'freight_orders'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const firestoreList: CargoRequest[] = [];
        snapshot.forEach((docSnap) => {
          const item = docSnap.data();
          firestoreList.push({
            id: item.id || docSnap.id,
            ...item,
          } as CargoRequest);
        });

        if (firestoreList.length === 0) return;

        setCustomRequests((prevRequests) => {
          const combinedMap = new Map<string, CargoRequest>();
          
          prevRequests.forEach((req) => {
            combinedMap.set(req.id, req);
          });
          
          let hasDiff = false;
          firestoreList.forEach((req) => {
            const existing = combinedMap.get(req.id);
            if (!existing || JSON.stringify(existing) !== JSON.stringify(req)) {
              combinedMap.set(req.id, req);
              hasDiff = true;
            }
          });
          
          if (!hasDiff) return prevRequests;

          const result = Array.from(combinedMap.values());
          localStorage.setItem('supplyx_freight_requests', JSON.stringify(result));
          return result;
        });
      }, (error) => {
        console.error('Firestore real-time sync failed:', error);
      });

      return () => unsubscribe();
    } catch (err) {
      console.warn('Failed to initialize Firestore listener for freight_orders:', err);
    }
  }, []);

  // Intercept incoming order payloads (e.g. from Purchase views)
  useEffect(() => {
    if (initialPayload?.tipoCarga) {
      setActiveSubTab('create_request');
    }
  }, [initialPayload]);

  // Dynamically filter requests based on the user's logged-in role
  const displayedRequests = useMemo(() => {
    if (userType === 'logistics') {
      return customRequests;
    }
    // Buyers see their created requests (or requests marked as Client)
    if (userType === 'buyer') {
      return customRequests.filter(req => 
        req.buyerId === auth.currentUser?.uid || 
        req.requester === 'Client' ||
        !req.buyerId
      );
    }
    // Suppliers see requests related to them (or requests marked as Supplier)
    if (userType === 'supplier') {
      return customRequests.filter(req => 
        req.supplierId === auth.currentUser?.uid || 
        req.requester === 'Supplier' ||
        !req.supplierId
      );
    }
    return customRequests;
  }, [customRequests, userType]);

  // If user is registered as logistics, default to carrier_central dashboard, otherwise 'requests_list'
  useEffect(() => {
    if (userType === 'logistics') {
      setActiveSubTab('carrier_central');
    } else {
      setActiveSubTab('requests_list');
    }
  }, [userType]);

  // Handle addition of custom elements
  const handleCreateRequest = (newReq: CargoRequest) => {
    const updated = [newReq, ...customRequests];
    syncRequestsToLocalStorage(updated);

    // Auto-generate corresponding Invoice item on B2B Split Finances
    const estimatedPriceVal = parseInt(newReq.peso.replace(/\D/g, ''), 10) * 4500 || 82000;
    const newInvoice: FinancialLedger = {
      id: `FT-${Math.floor(103 + Math.random() * 890)}`,
      cargoId: newReq.id,
      cargoName: newReq.tipoCarga,
      client: newReq.requester === 'Client' ? 'SupplyX Cliente Ltd' : 'Parceiro Fornecedor',
      carrier: 'Bidding em Andamento',
      totalFreight: estimatedPriceVal,
      feeSupplyX: Math.round(estimatedPriceVal * 0.1),
      netPayout: Math.round(estimatedPriceVal * 0.9),
      status: 'Pendente',
      dueDate: newReq.prazoEntrega || 'A Combinar'
    };
    syncFinancialsToLocalStorage([newInvoice, ...financialLedgers]);
    
    setSelectedRequestId(newReq.id);
    setActiveSubTab('detailed_request');
  };

  const handleAddDriver = (newDrv: CommercialDriver) => {
    const updated = [newDrv, ...drivers];
    syncDriversToLocalStorage(updated);
  };

  const deleteRequestFromFirestore = async (id: string) => {
    try {
      const q = query(collection(db, 'freight_orders'), where('id', '==', id));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach(async (docSnap) => {
        await deleteDoc(docSnap.ref);
      });
    } catch (err) {
      console.warn('Failed to delete cargo request from Firestore:', err);
    }
  };

  const handleDeleteRequest = async (id: string) => {
    const updated = customRequests.filter(r => r.id !== id);
    syncRequestsToLocalStorage(updated);
    await deleteRequestFromFirestore(id);
  };

  const handleClearFinancial = (id: string) => {
    const updated = financialLedgers.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: 'Pago',
          carrier: item.carrier === 'Bidding em Andamento' ? 'Moz Logistics, Lda' : item.carrier
        };
      }
      return item;
    });
    syncFinancialsToLocalStorage(updated);
  };

  const handleChangeRequestStatus = (id: string, newStatus: string) => {
    const matchedCargo = customRequests.find(r => r.id === id);
    const cargoName = matchedCargo ? matchedCargo.tipoCarga : 'Carga';
    
    // Auto-update matched financial ledger carrier name if assigned in cargo
    const updated = customRequests.map(r => {
      if (r.id === id) {
        return { ...r, status: newStatus };
      }
      return r;
    });
    syncRequestsToLocalStorage(updated);

    // Create a notification for status change
    const newNotif = {
      id: `nt-${Date.now()}`,
      title: 'Status de Entrega Atualizado',
      text: `A carga [${cargoName}] mudou para o status [${newStatus}].`,
      time: 'Agora mesmo',
      type: 'success'
    };
    syncNotificationsToLocalStorage([newNotif, ...logisticsNotifications]);
  };

  const handlePublishToConcourse = (id: string) => {
    const updated = customRequests.map(r => {
      if (r.id === id) {
        return { ...r, status: 'Em concurso' };
      }
      return r;
    });
    syncRequestsToLocalStorage(updated);

    const newNotif = {
      id: `nt-${Date.now()}`,
      title: 'Concurso Publicado',
      text: 'O pedido de frete foi publicado no painel de concursos das transportadoras.',
      time: 'Agora mesmo',
      type: 'info'
    };
    syncNotificationsToLocalStorage([newNotif, ...logisticsNotifications]);
  };

  const handleAssignCarrier = (id: string, carrierName: string, agreedPrice: number) => {
    const updated = customRequests.map(r => {
      if (r.id === id) {
        return { ...r, status: 'Atribuído', assignedCarrier: carrierName, targetPrice: `${agreedPrice.toLocaleString('pt-BR')} MZN` };
      }
      return r;
    });
    syncRequestsToLocalStorage(updated);

    // Update corresponding financial ledger with carrier
    const updatedLedgers = financialLedgers.map(l => {
      if (l.cargoId === id) {
        return { ...l, carrier: carrierName, totalFreight: agreedPrice, feeSupplyX: Math.round(agreedPrice * 0.1), netPayout: Math.round(agreedPrice * 0.9) };
      }
      return l;
    });
    syncFinancialsToLocalStorage(updatedLedgers);

    const newNotif = {
      id: `nt-${Date.now()}`,
      title: 'Contrato Homologado',
      text: `A transportadora [${carrierName}] foi selecionada para realizar o frete.`,
      time: 'Agora mesmo',
      type: 'success'
    };
    syncNotificationsToLocalStorage([newNotif, ...logisticsNotifications]);
  };

  const handleAddOccurrence = (newOcc: any) => {
    const list = [newOcc, ...occurrences];
    syncOccurrencesToLocalStorage(list);

    const newNotif = {
      id: `nt-${Date.now()}`,
      title: 'Alerta de Ocorrência Registada',
      text: `Ocorrência de [${newOcc.category}] foi reportada pelo responsável [${newOcc.responsible}].`,
      time: 'Agora mesmo',
      type: 'warning'
    };
    syncNotificationsToLocalStorage([newNotif, ...logisticsNotifications]);
  };

  const handleToggleOccurrence = (occId: string) => {
    const list = occurrences.map(o => {
      if (o.id === occId) {
        const nextStatus = o.status === 'Aberta' ? 'Resolvida' : 'Aberta';
        return { ...o, status: nextStatus };
      }
      return o;
    });
    syncOccurrencesToLocalStorage(list);

    const targetOcc = occurrences.find(o => o.id === occId);
    if (targetOcc) {
      const nextStat = targetOcc.status === 'Aberta' ? 'Resolvida' : 'Aberta';
      const newNotif = {
        id: `nt-${Date.now()}`,
        title: 'Ocorrência Resolvida',
        text: `A ocorrência sobre [${targetOcc.category}] foi marcada como '${nextStat}'.`,
        time: 'Agora mesmo',
        type: 'info'
      };
      syncNotificationsToLocalStorage([newNotif, ...logisticsNotifications]);
    }
  };

  const handleUpdateFeedback = (id: string, role: 'client' | 'carrier', rating: number, comment: string) => {
    const updated = customRequests.map(r => {
      if (r.id === id) {
        if (role === 'client') {
          return { ...r, feedbackClient: { rating, comment } };
        } else {
          return { ...r, feedbackCarrier: { rating, comment } };
        }
      }
      return r;
    });
    syncRequestsToLocalStorage(updated);
  };

  const handleUpdateCargoPod = (id: string, signature: string, photo: string) => {
    const updated = customRequests.map(r => {
      if (r.id === id) {
        return { ...r, podSignature: signature, podPhoto: photo };
      }
      return r;
    });
    syncRequestsToLocalStorage(updated);
  };

  const handleUpdateCargoRequest = (id: string, updatedFields: Partial<CargoRequest>) => {
    const updated = customRequests.map(r => {
      if (r.id === id) {
        return { ...r, ...updatedFields };
      }
      return r;
    });
    syncRequestsToLocalStorage(updated);
  };

  return (
    <div className={`w-full max-w-[1440px] mx-auto min-h-screen pb-16 ${isDarkMode ? 'text-zinc-100' : 'text-zinc-800'}`}>
      
      {/* 1. FUTURISTIC SAP/FLEXPORT INSPIRED INTEGRATED LOGISTICS SUB-NAVIGATION */}
      <div className={`mb-8 p-4 rounded-[32px] border flex flex-col xl:flex-row items-center justify-between gap-4 ${
        isDarkMode ? 'bg-zinc-900/40 border-white/5 backdrop-blur-md' : 'bg-white border-zinc-150 shadow-sm'
      }`}>
        <div className="flex flex-wrap items-center gap-1.5 w-full xl:w-auto overflow-x-auto select-none no-scrollbar">
          {(userType === 'logistics'
            ? [
                { id: 'carrier_central', pt: '🚚 Painel da Transportadora', en: '🚚 Carrier Central' },
                { id: 'dashboard', pt: '📊 Cockpit Analítico', en: '📊 Control Dashboard' },
                { id: 'requests_list', pt: '📋 Monitor de Cargas', en: '📋 Cargo Monitor' },
                { id: 'drivers', pt: '👤 Frotas & Motoristas', en: '👤 Fleets & Drivers' },
                { id: 'inventory', pt: '📦 Fulfillment Stock', en: '📦 Fulfillment Stock' },
                { id: 'financial', pt: '💳 B2B Financeiro Split', en: '💳 B2B Split Fees' }
              ]
            : [
                { id: 'requests_list', pt: '📋 Minhas Cargas (Rastreio)', en: '📋 My Cargoes (Tracking)' },
                { id: 'dashboard', pt: '📊 Painel de Rastreio', en: '📊 Tracking Dashboard' }
              ]
          ).map((tab) => {
            const isSelected = activeSubTab === tab.id || (tab.id === 'requests_list' && activeSubTab === 'detailed_request');
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`px-4 py-2.5 rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all select-none whitespace-nowrap border ${
                  isSelected
                    ? 'bg-supplyx-blue text-white shadow-xl shadow-supplyx-blue/15 border-supplyx-blue scale-[1.01]'
                    : isDarkMode
                      ? 'bg-zinc-950/40 border-white/5 text-zinc-450 hover:text-white hover:bg-zinc-900'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-650 hover:bg-zinc-100 hover:text-zinc-900'
                }`}
              >
                {language === 'PT' ? tab.pt : tab.en}
              </button>
            );
          })}
        </div>

        {/* Global indicators branding right aligned */}
        <div className="hidden xl:flex items-center gap-4 text-right">
          <div>
            <p className="text-[10px] font-black uppercase text-white leading-none flex items-center justify-end gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              SupplyX-Cargo Suite
            </p>
            <p className="text-[8px] text-zinc-550 text-zinc-500 font-extrabold uppercase mt-1">
              {language === 'PT' ? 'Módulo Logístico On-Chain' : 'On-Chain Carrier Exchange'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. TAB TRANSITION RENDER ENGINE */}
      <div className="w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSubTab + selectedRequestId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {activeSubTab === 'carrier_central' && (
              <CarrierCentral 
                isDarkMode={isDarkMode}
                language={language}
                requests={displayedRequests}
                onUpdateRequests={syncRequestsToLocalStorage}
                occurrences={occurrences}
                onAddOccurrence={handleAddOccurrence}
                profileName={auth.currentUser?.displayName || undefined}
              />
            )}

            {activeSubTab === 'dashboard' && (
              <LogisticsDashboard 
                isDarkMode={isDarkMode}
                language={language}
                requests={displayedRequests}
                drivers={drivers}
                occurrences={occurrences}
                notifications={logisticsNotifications}
                setActiveSubTab={setActiveSubTab}
                onSelectRequest={(id) => {
                  setSelectedRequestId(id);
                  setActiveSubTab('detailed_request');
                }}
              />
            )}

            {activeSubTab === 'detailed_request' && (
              <DetailedRequestView 
                isDarkMode={isDarkMode}
                language={language}
                selectedRequestId={selectedRequestId}
                onBack={() => setActiveSubTab('requests_list')}
                requests={displayedRequests}
                occurrences={occurrences}
                drivers={drivers}
                onChangeRequestStatus={handleChangeRequestStatus}
                onPublishToConcourse={handlePublishToConcourse}
                onAssignCarrier={handleAssignCarrier}
                onAddOccurrence={handleAddOccurrence}
                onToggleOccurrence={handleToggleOccurrence}
                onUpdateFeedback={handleUpdateFeedback}
                onUpdateCargoPod={handleUpdateCargoPod}
                onNavigateToTab={setActiveSubTab}
                userType={userType}
                onUpdateCargoRequest={handleUpdateCargoRequest}
              />
            )}

            {activeSubTab === 'create_request' && (
              <CreateRequestPage 
                isDarkMode={isDarkMode}
                language={language}
                initialPayload={initialPayload}
                onBack={() => setActiveSubTab('dashboard')}
                onSuccess={handleCreateRequest}
              />
            )}

            {activeSubTab === 'requests_list' && (
              <RequestsListPage 
                isDarkMode={isDarkMode}
                language={language}
                requests={displayedRequests}
                onSelectRequest={(id) => {
                  setSelectedRequestId(id);
                  setActiveSubTab('detailed_request');
                }}
                onDeleteRequest={handleDeleteRequest}
              />
            )}

            {activeSubTab === 'drivers' && (
              <DriversSystem 
                isDarkMode={isDarkMode}
                language={language}
                drivers={drivers}
                onAddDriver={handleAddDriver}
              />
            )}

            {activeSubTab === 'inventory' && (
              <InventoryFulfillment 
                isDarkMode={isDarkMode}
                language={language}
                warehouses={warehouses}
              />
            )}

            {activeSubTab === 'financial' && (
              <LogisticsFinancial 
                isDarkMode={isDarkMode}
                language={language}
                ledgers={financialLedgers}
                onConfirmClearance={handleClearFinancial}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}
