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
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
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
import CarriersDirectory from './logistics/CarriersDirectory';

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
  const [customRequests, setCustomRequests] = useState<CargoRequest[]>(() => {
    const saved = localStorage.getItem('supplyx_freight_requests');
    const demoIds = ['TR-2025-0001', 'TR-2025-0002', 'TR-2025-0003'];
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const cleaned = parsed.filter((r: any) => r && !demoIds.includes(r.id));
        if (cleaned.length !== parsed.length) {
          localStorage.setItem('supplyx_freight_requests', JSON.stringify(cleaned));
        }
        return cleaned;
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [selectedRequestId, setSelectedRequestId] = useState<string>(() => {
    return customRequests[0]?.id || '';
  });

  // Track hidden dossiers specifically for logistics users
  const [hiddenDossiers, setHiddenDossiers] = useState<string[]>(() => {
    const saved = localStorage.getItem('supplyx_hidden_dossiers_logistics');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    if (userType === 'logistics' && hiddenDossiers.includes(selectedRequestId)) {
      const remaining = customRequests.filter(r => !hiddenDossiers.includes(r.id));
      if (remaining.length > 0) {
        setSelectedRequestId(remaining[0].id);
      } else {
        setSelectedRequestId('');
      }
    }
  }, [hiddenDossiers, selectedRequestId, customRequests, userType]);

  // 2. Active Fleets / Drivers list
  const [drivers, setDrivers] = useState<CommercialDriver[]>([]);

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
    const demoCargoIds = ['TR-2025-0001', 'TR-2025-0002', 'TR-2025-0003'];
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const cleaned = parsed.filter((f: any) => f && f.cargoId && !demoCargoIds.includes(f.cargoId));
        if (cleaned.length !== parsed.length) {
          localStorage.setItem('supplyx_financials', JSON.stringify(cleaned));
        }
        return cleaned;
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // 5. Ocorrências (incidents registry)
  const [occurrences, setOccurrences] = useState<any[]>(() => {
    const saved = localStorage.getItem('supplyx_occurrences');
    const demoCargoIds = ['TR-2025-0001', 'TR-2025-0002', 'TR-2025-0003'];
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const cleaned = parsed.filter((o: any) => o && o.cargoId && !demoCargoIds.includes(o.cargoId));
        if (cleaned.length !== parsed.length) {
          localStorage.setItem('supplyx_occurrences', JSON.stringify(cleaned));
        }
        return cleaned;
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // 6. Alertas / Notificações
  const [logisticsNotifications, setLogisticsNotifications] = useState<any[]>(() => {
    const saved = localStorage.getItem('supplyx_logistics_notifications');
    const demoCargoIds = ['TR-2025-0001', 'TR-2025-0002', 'TR-2025-0003'];
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const cleaned = parsed.filter((n: any) => {
          if (!n || !n.text) return false;
          return !demoCargoIds.some(demoId => n.text.includes(demoId));
        });
        if (cleaned.length !== parsed.length) {
          localStorage.setItem('supplyx_logistics_notifications', JSON.stringify(cleaned));
        }
        return cleaned;
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const syncOccurrencesToLocalStorage = async (list: any[]) => {
    localStorage.setItem('supplyx_occurrences', JSON.stringify(list));
    setOccurrences(list);
    for (const occ of list) {
      try {
        await setDoc(doc(db, 'occurrences', occ.id), occ);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `occurrences/${occ.id}`);
      }
    }
  };

  const syncNotificationsToLocalStorage = (list: any[]) => {
    localStorage.setItem('supplyx_logistics_notifications', JSON.stringify(list));
    setLogisticsNotifications(list);
  };

  // Synchronize triggers to local storage and Firestore
  const syncRequestsToLocalStorage = (list: CargoRequest[]) => {
    // Merge the changes in the incoming 'list' into the existing 'customRequests'
    setCustomRequests((prevRequests) => {
      const merged = prevRequests.map(item => {
        const updatedItem = list.find(l => l.id === item.id);
        return updatedItem ? updatedItem : item;
      });

      // Include any brand new items in 'list' that are not in prevRequests
      list.forEach(req => {
        if (!merged.some(m => m.id === req.id)) {
          merged.unshift(req);
        }
      });

      localStorage.setItem('supplyx_freight_requests', JSON.stringify(merged));
      return merged;
    });

    // Sync each of the modified/passed items to Firestore
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
        const updatePromises: Promise<void>[] = [];
        querySnapshot.forEach((docSnap) => {
          updatePromises.push(updateDoc(docSnap.ref, { ...req }).catch(e => {
            handleFirestoreError(e, OperationType.UPDATE, `freight_orders/${docSnap.id}`);
          }));
        });
        await Promise.all(updatePromises);
      } else {
        await setDoc(doc(db, 'freight_orders', req.id), req);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `freight_orders/${req.id}`);
    }
  };

  // Real-time listener for freight_orders collection
  useEffect(() => {
    try {
      const q = query(collection(db, 'freight_orders'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const firestoreList: CargoRequest[] = [];
        const demoIds = ['TR-2025-0001', 'TR-2025-0002', 'TR-2025-0003'];
        snapshot.forEach((docSnap) => {
          const item = docSnap.data();
          const reqId = item.id || docSnap.id;
          if (!demoIds.includes(reqId)) {
            let assignedCarrier = item.assignedCarrier;

            firestoreList.push({
              id: reqId,
              ...item,
              assignedCarrier
            } as CargoRequest);
          }
        });

        setCustomRequests((prevRequests) => {
          let hasDiff = prevRequests.length !== firestoreList.length;
          if (!hasDiff) {
            for (const item of firestoreList) {
              const prev = prevRequests.find((r) => r.id === item.id);
              if (!prev || JSON.stringify(prev) !== JSON.stringify(item)) {
                hasDiff = true;
                break;
              }
            }
          }
          if (!hasDiff) return prevRequests;

          localStorage.setItem('supplyx_freight_requests', JSON.stringify(firestoreList));
          return firestoreList;
        });
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'freight_orders');
      });

      return () => unsubscribe();
    } catch (err) {
      console.warn('Failed to initialize Firestore listener for freight_orders:', err);
    }
  }, []);

  // Real-time listener for occurrences collection
  useEffect(() => {
    try {
      const q = query(collection(db, 'occurrences'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const firestoreList: any[] = [];
        snapshot.forEach((docSnap) => {
          firestoreList.push({
            id: docSnap.id,
            ...docSnap.data()
          });
        });
        setOccurrences(firestoreList);
        localStorage.setItem('supplyx_occurrences', JSON.stringify(firestoreList));
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'occurrences');
      });
      return () => unsubscribe();
    } catch (err) {
      console.warn('Failed to initialize Firestore listener for occurrences:', err);
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
      return customRequests.filter(req => !hiddenDossiers.includes(req.id));
    }
    // Buyers see ONLY their own created requests
    if (userType === 'buyer') {
      return customRequests.filter(req => 
        req.buyerId === auth.currentUser?.uid
      );
    }
    // Suppliers see ONLY their own created/assigned requests
    if (userType === 'supplier') {
      return customRequests.filter(req => 
        req.supplierId === auth.currentUser?.uid
      );
    }
    return [];
  }, [customRequests, userType, hiddenDossiers]);

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
      // Some orders are stored with auto-generated document IDs (using addDoc) while having item.id = id
      const q = query(collection(db, 'freight_orders'), where('id', '==', id));
      const querySnapshot = await getDocs(q);
      const deletePromises: Promise<void>[] = [];
      querySnapshot.forEach((docSnap) => {
        deletePromises.push(deleteDoc(docSnap.ref).catch(e => {
          handleFirestoreError(e, OperationType.DELETE, `freight_orders/${docSnap.id}`);
        }));
      });
      // In case setDoc was used with doc ID = id directly
      deletePromises.push(deleteDoc(doc(db, 'freight_orders', id)).catch(e => {
        handleFirestoreError(e, OperationType.DELETE, `freight_orders/${id}`);
      }));
      
      await Promise.all(deletePromises);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `freight_orders/${id}`);
    }
  };

  const handleDeleteRequest = async (id: string) => {
    if (userType === 'logistics') {
      // Soft-delete for logistics user specifically (it only disappears for them)
      setHiddenDossiers((prev) => {
        const updated = [...prev, id];
        localStorage.setItem('supplyx_hidden_dossiers_logistics', JSON.stringify(updated));
        return updated;
      });
    } else {
      // Direct global deletion for client/supplier
      setCustomRequests((prev) => {
        const updated = prev.filter(r => r.id !== id);
        localStorage.setItem('supplyx_freight_requests', JSON.stringify(updated));
        return updated;
      });
      // Fire and await the direct atomic Firestore deletion
      await deleteRequestFromFirestore(id);
    }
  };

  const handleClearFinancial = (id: string) => {
    const updated = financialLedgers.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: 'Pago',
          carrier: item.carrier === 'Bidding em Andamento' ? (language === 'PT' ? 'Transportadora Selecionada' : 'Selected Carrier') : item.carrier
        };
      }
      return item;
    });
    syncFinancialsToLocalStorage(updated);
  };

  const handleChangeRequestStatus = (id: string, newStatus: string) => {
    const matchedCargo = customRequests.find(r => r.id === id);
    const cargoName = matchedCargo ? matchedCargo.tipoCarga : 'Carga';
    
    const updated = customRequests.map(r => {
      if (r.id === id) {
        let progression = r.trackProgress || 0;
        let trackText = r.trackStatusText || '';
        
        if (newStatus === 'Atribuído') {
          progression = 0;
          trackText = 'Motorista atribuído e aguardando liberação documental.';
        } else if (newStatus === 'Em recolha') {
          progression = 25;
          trackText = 'Carga em recolha / Motorista posicionado para carregamento.';
        } else if (newStatus === 'Em trânsito') {
          progression = 55;
          trackText = 'Carga em trânsito ativa na rodovia EN1.';
        } else if (newStatus === 'Chegada ao destino' || newStatus === 'Próximo da entrega') {
          progression = 90;
          trackText = 'Motorista próximo da entrega / Finalizando documentação.';
        } else if (newStatus === 'Entregue') {
          progression = 100;
          trackText = 'Entrega efetuada com sucesso!';
        }
        
        return { 
          ...r, 
          status: newStatus, 
          trackProgress: progression, 
          trackStatusText: trackText 
        };
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
        <div className="flex flex-nowrap xl:flex-wrap items-center gap-1.5 w-full xl:w-auto overflow-x-auto select-none no-scrollbar pb-1 xl:pb-0">
          {(userType === 'logistics'
            ? [
                { id: 'carrier_central', pt: '🚚 Painel da Transportadora', en: '🚚 Carrier Central' },
                { id: 'dashboard', pt: '📊 Cockpit Analítico', en: '📊 Control Dashboard' },
                { id: 'requests_list', pt: '📋 Monitor de Cargas', en: '📋 Cargo Monitor' },
                { id: 'drivers', pt: '👤 Frotas & Motoristas', en: '👤 Fleets & Drivers' },
                { id: 'financial', pt: '💳 B2B Financeiro Split', en: '💳 B2B Split Fees' }
              ]
            : [
                { id: 'requests_list', pt: '📋 Minhas Cargas (Rastreio)', en: '📋 My Cargoes (Tracking)' },
                { id: 'carriers_directory', pt: '🚚 Empresas de Logística', en: '🚚 Carriers Directory' },
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
                onNavigateToTab={(tab, payload) => {
                  if (tab === 'Mensagens') {
                    onNavigate?.('Mensagens', payload);
                  } else {
                    setActiveSubTab(tab);
                  }
                }}
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

            {activeSubTab === 'carriers_directory' && (
              <CarriersDirectory
                isDarkMode={isDarkMode}
                language={language}
                requests={displayedRequests}
                onUpdateRequests={syncRequestsToLocalStorage}
                setActiveSubTab={setActiveSubTab}
                userType={userType}
              />
            )}

            {activeSubTab === 'requests_list' && (
              <RequestsListPage 
                isDarkMode={isDarkMode}
                language={language}
                requests={displayedRequests}
                userType={userType}
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
