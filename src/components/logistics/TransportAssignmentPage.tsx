import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Trash2, Copy, FileSpreadsheet, Download, Upload, AlertTriangle, 
  MapPin, Calendar, Clock, Check, RefreshCw, Send, Sparkles, Filter, 
  Search, Eye, FileText, ChevronRight, X, Layers, MessageSquare, Phone, Mail, Navigation2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { db, auth } from '../../lib/firebase';
import { collection, doc, addDoc, setDoc, getDocs, query, orderBy, serverTimestamp, where, updateDoc, increment } from 'firebase/firestore';
import { CommercialDriver } from './types';

// Mozambique realistic vehicle profiles
interface VehicleProfile {
  name: string;
  maxWeightKg: number;
  maxVolumeM3: number;
  description: string;
  isCustom?: boolean;
}

const VEHICLE_PROFILES: VehicleProfile[] = [
  { name: 'Camião 3.5 Toneladas (Canter)', maxWeightKg: 3500, maxVolumeM3: 15, description: 'Indicado para distribuição urbana em Maputo, Beira ou Nampula.' },
  { name: 'Camião 10 Toneladas', maxWeightKg: 10000, maxVolumeM3: 35, description: 'Ótimo custo-benefício para rotas regionais e inter-provinciais de média distância.' },
  { name: 'Camião 15 Toneladas (Rigid Heavy)', maxWeightKg: 15000, maxVolumeM3: 50, description: 'Frequente nas rotas EN1 Sul-Centro e EN6 corredor da Beira.' },
  { name: 'Contentor 20 Pés', maxWeightKg: 21800, maxVolumeM3: 33, description: 'Formatado padrão para cargas portuárias internacionais de import/export.' },
  { name: 'Contentor 40 Pés', maxWeightKg: 26500, maxVolumeM3: 67, description: 'Ideal para mercadorias volumosas de distribuição nacional ou hub regional Nacala/Beira.' },
  { name: 'Camião Articulado (30 Toneladas / Cavalo)', maxWeightKg: 30000, maxVolumeM3: 80, description: 'Alta capacidade de peso ideal para distribuição pesada a granel (carvão, cereais, minérios).' }
];

// Realistic Transporters operating in Mozambique
const DEFAULT_TRANSPORTERS = [
  { id: 'trans_lalgy', name: 'Transportes Lalgy Lda' },
  { id: 'trans_mft', name: 'MFT Moçambique S.A.' },
  { id: 'trans_canico', name: 'Caniço Logística & Distribuição' },
  { id: 'trans_zambeze', name: 'Zambeze Logística Multimodal' },
  { id: 'trans_moc', name: 'Trans-Moc Rodoviário' }
];

// Realistic mock drivers & fleets if none are registered in DB yet
const DEFAULT_DRIVERS: CommercialDriver[] = [
  { id: 'DR-001', name: 'Mateus Sitoe', licenseId: 'MC-84729-258', vehicle: 'Scania Heavy Rig (15 Ton)', capacity: '15 Toneladas', location: 'Maputo Port', status: 'Disponível', rating: 4.8, trips: 142 },
  { id: 'DR-002', name: 'Abel Tembe', licenseId: 'MC-19253-258', vehicle: 'Volvo FH 540 (30 Ton)', capacity: '30 Toneladas', location: 'Matola Sul', status: 'Disponível', rating: 4.9, trips: 210 },
  { id: 'DR-003', name: 'João Nhaca', licenseId: 'MC-33104-258', vehicle: 'Mitsubishi Fuso (10 Ton)', capacity: '10 Toneladas', location: 'Beira Terminal', status: 'Disponível', rating: 4.5, trips: 88 },
  { id: 'DR-004', name: 'Carlos Mondlane', licenseId: 'MC-55829-258', vehicle: 'Toyota Dyna (3.5 Ton)', capacity: '3.5 Toneladas', location: 'Nampula Centro', status: 'Disponível', rating: 4.7, trips: 52 },
  { id: 'DR-005', name: 'António Matsinhe', licenseId: 'MC-71192-258', vehicle: 'Container Chassis (26 Ton)', capacity: '26 Toneladas', location: 'Nacala Port', status: 'Disponível', rating: 4.9, trips: 165 }
];

interface SpreadsheetRow {
  id: string;
  productName: string;
  productCode: string;
  category: string;
  quantity: number;
  unit: string;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  unitWeightKg: number;
}

interface TransportAssignmentPageProps {
  isDarkMode: boolean;
  language: 'PT' | 'EN';
  drivers?: CommercialDriver[];
  onNavigate?: (tab: string, payload?: any) => void;
}

export default function TransportAssignmentPage({
  isDarkMode,
  language,
  drivers: dbDrivers = [],
  onNavigate
}: TransportAssignmentPageProps) {
  // Spreadsheet state
  const [rows, setRows] = useState<SpreadsheetRow[]>([
    {
      id: 'row-1',
      productName: 'Cimento Nacional Sacos 50kg',
      productCode: 'PROD-CIM-50',
      category: 'Construção',
      quantity: 200,
      unit: 'Saco',
      lengthCm: 60,
      widthCm: 45,
      heightCm: 15,
      unitWeightKg: 50
    },
    {
      id: 'row-2',
      productName: 'Tijolo Cerâmico Reforçado',
      productCode: 'PROD-TIJ-01',
      category: 'Construção',
      quantity: 1500,
      unit: 'Unidade',
      lengthCm: 20,
      widthCm: 10,
      heightCm: 7,
      unitWeightKg: 2.5
    }
  ]);

  // Operational form state
  const [origin, setOrigin] = useState('Maputo Port, Moçambique');
  const [destination, setDestination] = useState('Beira Terminal, Moçambique');
  const [pickupDate, setPickupDate] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() + 2);
    return today.toISOString().split('T')[0];
  });
  const [deliveryDate, setDeliveryDate] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() + 4);
    return today.toISOString().split('T')[0];
  });
  const [priority, setPriority] = useState<'Baixa' | 'Média' | 'Alta'>('Média');
  const [notes, setNotes] = useState('');

  // Distance and Duration are now simple, manual, user-editable parameters (removing automatic OSRM/API system)
  const [distanceKm, setDistanceKm] = useState<number>(450);
  const [durationMin, setDurationMin] = useState<number>(360);

  // Carriers loading and selection states
  const [dbCarriers, setDbCarriers] = useState<any[]>([]);
  const [loadingCarriers, setLoadingCarriers] = useState(true);
  const [activeSelectedCarrier, setActiveSelectedCarrier] = useState<any | null>(null);
  const [searchCarrierQuery, setSearchCarrierQuery] = useState('');

  // Quick direct messaging to carriers state
  const [messageTextByCarrier, setMessageTextByCarrier] = useState<{ [key: string]: string }>({});
  const [sendingMessageId, setSendingMessageId] = useState<string | null>(null);

  // Past assignments (loaded from Firestore)
  const [pastAssignments, setPastAssignments] = useState<any[]>([]);
  const [loadingPast, setLoadingPast] = useState(true);

  // Assignment selection state
  const [selectedTransporter, setSelectedTransporter] = useState('trans_lalgy');
  const [selectedDriverId, setSelectedDriverId] = useState('DR-002');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Search & Filter state for past assignments
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'todos' | 'pending' | 'completed'>('todos');

  // Track component lifecycle
  useEffect(() => {
    console.log("Mounted: TransportAssignmentPage");
    return () => {
      console.log("Unmounted: TransportAssignmentPage");
    };
  }, []);

  // Load registered drivers + default fallback
  const finalDrivers = useMemo(() => {
    if (dbDrivers && dbDrivers.length > 0) {
      return dbDrivers;
    }
    return DEFAULT_DRIVERS;
  }, [dbDrivers]);

  // Read saved Assignments from Firestore
  useEffect(() => {
    const fetchAssignments = async () => {
      setLoadingPast(true);
      try {
        const assignmentsCol = collection(db, 'transportAssignments');
        const q = query(assignmentsCol, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const fetched: any[] = [];
        querySnapshot.forEach((docSnap) => {
          fetched.push({ id: docSnap.id, ...docSnap.data() });
        });
        setPastAssignments(fetched);
      } catch (err) {
        console.warn('Could not fetch transportAssignments from Firestore:', err);
        // Load fallback from LocalStorage if user has no DB or access issues
        const localSaved = localStorage.getItem('supplyx_local_transport_assignments');
        if (localSaved) {
          try {
            setPastAssignments(JSON.parse(localSaved));
          } catch (_) {}
        }
      } finally {
        setLoadingPast(false);
      }
    };

    fetchAssignments();
  }, [isSubmitting]);

  // Auto-calculate individual row totals
  const mappedRowsWithCalculations = useMemo(() => {
    return rows.map(r => {
      // Volume unitário = (L * W * H) em cm transformado em m³
      // 1 cm³ = 1e-6 m³
      const unitVolM3 = (r.lengthCm * r.widthCm * r.heightCm) / 1000000;
      const totalWeightKg = r.quantity * r.unitWeightKg;
      const totalVolM3 = r.quantity * unitVolM3;

      return {
        ...r,
        unitVolM3: Number(unitVolM3.toFixed(5)),
        totalWeightKg: Number(totalWeightKg.toFixed(2)),
        totalVolM3: Number(totalVolM3.toFixed(3))
      };
    });
  }, [rows]);

  // Global calculations (Aggregate Stats)
  const totalWeight = useMemo(() => {
    return mappedRowsWithCalculations.reduce((sum, r) => sum + r.totalWeightKg, 0);
  }, [mappedRowsWithCalculations]);

  const totalVolume = useMemo(() => {
    return mappedRowsWithCalculations.reduce((sum, r) => sum + r.totalVolM3, 0);
  }, [mappedRowsWithCalculations]);

  const averageDensity = useMemo(() => {
    if (totalVolume === 0) return 0;
    return Number((totalWeight / totalVolume).toFixed(1));
  }, [totalWeight, totalVolume]);

  const estimatedPallets = useMemo(() => {
    // Estimativa de palete padrão M3: 1.2m * 0.8m * 1.6m ~ 1.5 M3
    if (totalVolume === 0) return 0;
    return Math.ceil(totalVolume / 1.5);
  }, [totalVolume]);
  useEffect(() => {
    const fetchCarriers = async () => {
      setLoadingCarriers(true);
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('type', '==', 'logistics'));
        const querySnapshot = await getDocs(q);
        const fetched: any[] = [];
        querySnapshot.forEach((docSnap) => {
          fetched.push({ id: docSnap.id, ...docSnap.data() });
        });
        setDbCarriers(fetched);
      } catch (err) {
        console.warn('Could not fetch logistics users from Firestore:', err);
      } finally {
        setLoadingCarriers(false);
      }
    };
    fetchCarriers();
  }, []);

  // Consolidate default transporters and database transporters
  const finalCarriers = useMemo(() => {
    const map = new Map();
    
    // Add realistic defaults
    DEFAULT_TRANSPORTERS.forEach(t => {
      map.set(t.id, {
        id: t.id,
        name: t.name,
        phone: t.id === 'trans_lalgy' ? '+258 84 311 9900' : t.id === 'trans_mft' ? '+258 82 455 1122' : t.id === 'trans_canico' ? '+258 86 500 2030' : t.id === 'trans_zambeze' ? '+258 84 777 8888' : '+258 85 909 0101',
        email: t.id === 'trans_lalgy' ? 'contato@lalgy.co.mz' : t.id === 'trans_mft' ? 'operacoes@mft.co.mz' : t.id === 'trans_canico' ? 'atendimento@canico.co.mz' : t.id === 'trans_zambeze' ? 'vendas@zambezelog.co.mz' : 'geral@transmoc.co.mz',
        location: t.id === 'trans_lalgy' ? 'Matola, EN4' : t.id === 'trans_mft' ? 'Porto de Maputo' : t.id === 'trans_canico' ? 'Beira, EN6' : t.id === 'trans_zambeze' ? 'Tete, Margem Zambeze' : 'Nampula Centro',
        isFromDb: false
      });
    });
    
    // Merge Firestore retrieved ones (overriding if name is match or keeping unique profile ID)
    dbCarriers.forEach(c => {
      const email = c.email || `${c.id}@supplyx.co.mz`;
      const phone = c.phone || '+258 84 000 0000';
      const location = c.province || c.city || 'Moçambique';
      map.set(c.id, {
        id: c.id,
        name: c.companyName || c.name || 'Transportadora Sem Nome',
        email,
        phone,
        location,
        isFromDb: true
      });
    });
    
    return Array.from(map.values());
  }, [dbCarriers]);

  // Handle direct messaging with carrier
  const handleSendDirectMessage = async (carrierId: string, carrierName: string, text: string) => {
    if (!text.trim()) return;
    if (!auth.currentUser) {
      triggerToast(language === 'PT' ? 'Você precisa estar autenticado.' : 'Authentication required.');
      return;
    }

    const currentUserId = auth.currentUser.uid;
    const currentUserEmail = auth.currentUser.email || '';
    const currentUserName = auth.currentUser.displayName || currentUserEmail.split('@')[0] || 'Usuário';

    setSendingMessageId(carrierId);
    try {
      const chatsRef = collection(db, 'chats');
      const q = query(chatsRef, where('participants', 'array-contains', currentUserId));
      const querySnapshot = await getDocs(q);
      
      let existingChatId = null;
      let existingChatParticipants: string[] = [];
      
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.participants && data.participants.includes(carrierId)) {
          existingChatId = docSnap.id;
          existingChatParticipants = data.participants;
        }
      });

      if (existingChatId) {
        await addDoc(collection(db, `chats/${existingChatId}/messages`), {
          senderId: currentUserId,
          participants: existingChatParticipants,
          text: text,
          createdAt: serverTimestamp()
        });

        await updateDoc(doc(db, 'chats', existingChatId), {
          lastMessage: text,
          lastMessageSenderId: currentUserId,
          updatedAt: serverTimestamp(),
          [`unreadCount.${carrierId}`]: increment(1)
        });
      } else {
        const participants = [currentUserId, carrierId];
        const newChatData = {
          participants,
          participantDetails: {
            [currentUserId]: {
              name: currentUserName,
              email: currentUserEmail,
              type: 'buyer'
            },
            [carrierId]: {
              name: carrierName,
              email: `${carrierId}@supplyx.co.mz`,
              type: 'logistics'
            }
          },
          unreadCount: {
            [currentUserId]: 0,
            [carrierId]: 1
          },
          lastMessage: text,
          lastMessageSenderId: currentUserId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        const newChatRef = await addDoc(collection(db, 'chats'), newChatData);
        await addDoc(collection(db, `chats/${newChatRef.id}/messages`), {
          senderId: currentUserId,
          participants,
          text: text,
          createdAt: serverTimestamp()
        });
      }

      triggerToast(language === 'PT' ? 'Mensagem enviada com sucesso!' : 'Message sent successfully!');
      setMessageTextByCarrier(prev => ({ ...prev, [carrierId]: '' }));
    } catch (error) {
      console.error('Error sending direct message:', error);
      triggerToast(language === 'PT' ? 'Falha ao enviar mensagem.' : 'Failed to send message.');
    } finally {
      setSendingMessageId(null);
    }
  };

  // Smart Vehicle Intelligent Recommendation
  const recommendedVehiclesResult = useMemo(() => {
    if (totalWeight === 0 && totalVolume === 0) {
      return { primary: null, alternatives: [], notes: 'Insira mercadoria para efetuar a análise de cubagem inteligente.' };
    }

    // Evaluate each profile to see which ones are suitable based on weight & volume thresholds
    const suitable = VEHICLE_PROFILES.map(profile => {
      const occWeight = (totalWeight / profile.maxWeightKg) * 100;
      const occVolume = (totalVolume / profile.maxVolumeM3) * 100;
      const maxOcc = Math.max(occWeight, occVolume);
      
      return {
        profile,
        occWeight,
        occVolume,
        maxOcc,
        isOverweight: totalWeight > profile.maxWeightKg,
        isOvervolume: totalVolume > profile.maxVolumeM3
      };
    }).filter(opt => !opt.isOverweight && !opt.isOvervolume);

    // If there is a vehicle that fits the loading without exceeding limits
    if (suitable.length > 0) {
      // Sort by best fit: smallest vehicle that fits without being over-filled
      suitable.sort((a, b) => {
        // We prefer the one with highest occupancy percentage since it's most cost-focused/efficient, but not exceeding 100%
        return b.maxOcc - a.maxOcc;
      });

      const primary = suitable[0];
      const alternatives = suitable.slice(1).map(s => ({
        name: s.profile.name,
        occWeight: s.occWeight,
        occVolume: s.occVolume,
        maxOcc: s.maxOcc
      }));

      return {
        primary: {
          name: primary.profile.name,
          description: primary.profile.description,
          occWeight: Number(primary.occWeight.toFixed(1)),
          occVolume: Number(primary.occVolume.toFixed(1)),
          capacityWeight: primary.profile.maxWeightKg,
          capacityVolume: primary.profile.maxVolumeM3,
          utilizationPercent: Number(primary.maxOcc.toFixed(1))
        },
        alternatives,
        notes: 'Carga integrada. Um único veículo satisfaz todas as restrições logísticas de peso e espaço cúbico.'
      };
    } else {
      // If the cargo is heavier/bulkier than the single largest vehicle listed, suggest split / multiple heavy rigs
      const largest = VEHICLE_PROFILES[VEHICLE_PROFILES.length - 1];
      const countByWeight = Math.ceil(totalWeight / largest.maxWeightKg);
      const countByVolume = Math.ceil(totalVolume / largest.maxVolumeM3);
      const totalRigsRequired = Math.max(countByWeight, countByVolume);

      return {
        primary: {
          name: `${totalRigsRequired}x ${largest.name}`,
          description: `Multiplexação de Frotas: A carga combinada de ${totalWeight.toLocaleString('pt')} kg excede a capacidade de uma única carreta pesada de Moçambique.`,
          occWeight: Number(((totalWeight / (largest.maxWeightKg * totalRigsRequired)) * 100).toFixed(1)),
          occVolume: Number(((totalVolume / (largest.maxVolumeM3 * totalRigsRequired)) * 100).toFixed(1)),
          capacityWeight: largest.maxWeightKg * totalRigsRequired,
          capacityVolume: largest.maxVolumeM3 * totalRigsRequired,
          utilizationPercent: Number((Math.max(totalWeight / (largest.maxWeightKg * totalRigsRequired), totalVolume / (largest.maxVolumeM3 * totalRigsRequired)) * 100).toFixed(1))
        },
        alternatives: [
          {
            name: `${Math.max(Math.ceil(totalWeight / 15000), Math.ceil(totalVolume / 50))}x Camião 15 Toneladas`,
            occWeight: (totalWeight / (15000 * Math.max(Math.ceil(totalWeight / 15000), Math.ceil(totalVolume / 50)))) * 100,
            occVolume: (totalVolume / (50 * Math.max(Math.ceil(totalWeight / 15000), Math.ceil(totalVolume / 50)))) * 100,
            maxOcc: 80
          }
        ],
        notes: `Carga fracionada recomendada em ${totalRigsRequired} comboios para optimização cambial.`
      };
    }
  }, [totalWeight, totalVolume]);

  // Spreadsheet Row Actions Shortcuts
  const handleAddRow = () => {
    const newId = `row-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    setRows(prev => [
      ...prev,
      {
        id: newId,
        productName: 'Novo Produto',
        productCode: `PROD-${Math.floor(1000 + Math.random() * 9000)}`,
        category: 'Geral',
        quantity: 1,
        unit: 'Unidade',
        lengthCm: 20,
        widthCm: 20,
        heightCm: 20,
        unitWeightKg: 1
      }
    ]);
  };

  const handleDeleteRow = (id: string) => {
    if (rows.length <= 1) return; // Keep at least one row
    console.log("Row removed:", id);
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const handleDuplicateRow = (row: SpreadsheetRow) => {
    const newId = `row-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    setRows(prev => {
      const idx = prev.findIndex(r => r.id === row.id);
      const updated = [...prev];
      updated.splice(idx + 1, 0, {
        ...row,
        id: newId,
        productCode: `${row.productCode}-C`
      });
      return updated;
    });
  };

  const handleRowChange = (id: string, field: keyof SpreadsheetRow, value: any) => {
    setRows(prev => prev.map(r => {
      if (r.id === id) {
        return { ...r, [field]: value };
      }
      return r;
    }));
  };

  // Import from Excel/XLSX
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        if (jsonData.length > 0) {
          const parsed: SpreadsheetRow[] = jsonData.map((item, idx) => ({
            id: `excel-${Date.now()}-${idx}`,
            productName: item['Produto'] || item['name'] || item['productName'] || 'Produto Excel',
            productCode: item['Código do Produto'] || item['code'] || item['productCode'] || `EX-${idx}`,
            category: item['Categoria'] || item['category'] || 'Excel Import',
            quantity: Number(item['Quantidade'] || item['quantity'] || 1),
            unit: item['Unidade'] || item['unit'] || 'Un.',
            lengthCm: Number(item['Comprimento (cm)'] || item['length'] || item['lengthCm'] || 10),
            widthCm: Number(item['Largura (cm)'] || item['width'] || item['widthCm'] || 10),
            heightCm: Number(item['Altura (cm)'] || item['height'] || item['heightCm'] || 10),
            unitWeightKg: Number(item['Peso Unitário (kg)'] || item['weight'] || item['unitWeightKg'] || 1)
          }));
          setRows(parsed);
          triggerToast('Planilha importada com sucesso!');
        }
      } catch (err) {
        console.error(err);
        alert('Erro ao processar ficheiro Excel. Verifique o formato das colunas.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Export to Excel/XLSX
  const handleExportExcel = () => {
    try {
      const dataToExport = mappedRowsWithCalculations.map(r => ({
        'Produto': r.productName,
        'Código do Produto': r.productCode,
        'Categoria': r.category,
        'Quantidade': r.quantity,
        'Unidade': r.unit,
        'Comprimento (cm)': r.lengthCm,
        'Largura (cm)': r.widthCm,
        'Altura (cm)': r.heightCm,
        'Peso Unitário (kg)': r.unitWeightKg,
        'Volume Unitário (m³)': r.unitVolM3,
        'Peso Total (kg)': r.totalWeightKg,
        'Volume Total (m³)': r.totalVolM3
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Produtos Atribuídos');
      
      // Save
      XLSX.writeFile(workbook, `Mapeamento_Cubagem_Assinatura_${Date.now()}.xlsx`);
      triggerToast('Ficheiro Excel exportado com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Não foi possível gerar a planilha de exportação.');
    }
  };

  // Quick Copy-Paste Excel Intercept Modal Parser
  const handlePasteExcelSubmit = () => {
    if (!pasteText.trim()) return;
    try {
      const lines = pasteText.trim().split('\n');
      const parsed: SpreadsheetRow[] = [];
      
      lines.forEach((line, idx) => {
        const cells = line.split('\t'); // Excel cells are tab separated
        if (cells.length > 0 && cells[0].trim()) {
          parsed.push({
            id: `paste-${Date.now()}-${idx}`,
            productName: cells[0] || 'Novo Item Colado',
            productCode: cells[1] || `PST-${idx}`,
            category: cells[2] || 'Geral',
            quantity: Number(cells[3]?.replace(',', '.') || 1),
            unit: cells[4] || 'Un',
            lengthCm: Number(cells[5]?.replace(',', '.') || 20),
            widthCm: Number(cells[6]?.replace(',', '.') || 20),
            heightCm: Number(cells[7]?.replace(',', '.') || 20),
            unitWeightKg: Number(cells[8]?.replace(',', '.') || 1)
          });
        }
      });

      if (parsed.length > 0) {
        setRows(parsed);
        setShowPasteModal(false);
        setPasteText('');
        triggerToast(`Importados ${parsed.length} produtos da área de transferência!`);
      }
    } catch (e) {
      alert('Formato inválido. Certifique-se de copiar colunas tabulares do Excel.');
    }
  };

  // Trigger temporary success notification
  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast(null);
    }, 4000);
  };

  // CREATE AND PERSIST TO FIRESTORE "transportAssignments"
  const handleConfirmAssignment = async () => {
    if (rows.length === 0) return;
    setIsSubmitting(true);
    
    // Lookup driver objects
    const driverObj = finalDrivers.find(d => d.id === selectedDriverId) || finalDrivers[0];
    const carrierObj = finalCarriers.find(t => t.id === selectedTransporter) || finalCarriers[0];

    const cargoAssignedData = {
      assignmentId: `TA-${Math.floor(100000 + Math.random() * 900000)}`,
      origin,
      destination,
      pickupDate,
      deliveryDate,
      priority,
      notes,
      products: mappedRowsWithCalculations.map(r => ({
        productName: r.productName,
        productCode: r.productCode,
        category: r.category,
        quantity: r.quantity,
        unit: r.unit,
        lengthCm: r.lengthCm,
        widthCm: r.widthCm,
        heightCm: r.heightCm,
        unitWeightKg: r.unitWeightKg,
        unitVolumeM3: r.unitVolM3,
        totalWeightKg: r.totalWeightKg,
        totalVolumeM3: r.totalVolM3
      })),
      totalWeight,
      totalVolume,
      density: averageDensity,
      recommendedVehicle: recommendedVehiclesResult.primary?.name || 'Não calculada',
      selectedVehicle: driverObj ? driverObj.vehicle : 'Não selecionado',
      transporterId: carrierObj?.id || 'trans_personalizada',
      transporterName: carrierObj?.name || 'Transportador customizado',
      driverId: selectedDriverId,
      driverName: driverObj ? driverObj.name : 'Motorista Indefinido',
      status: 'pending',
      distanceKm: distanceKm || 0,
      durationMinutes: durationMin || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      // 1. Save to Firestore
      const docRef = doc(collection(db, 'transportAssignments'));
      await setDoc(docRef, cargoAssignedData);
      
      triggerToast('Carga atribuída e registada com sucesso no Firestore!');
      
      // Reset rows to placeholder after successful saving
      setRows([
        {
          id: 'row-1',
          productName: 'Novo Produto',
          productCode: 'PROD-A',
          category: 'Geral',
          quantity: 1,
          unit: 'Unidade',
          lengthCm: 20,
          widthCm: 20,
          heightCm: 20,
          unitWeightKg: 1
        }
      ]);
      setNotes('');
      setActiveSelectedCarrier(null);
    } catch (err) {
      console.error('[DATABASE] Firestore transportAssignments write rejected:', err);
      // Save to LocalStorage as fallback so user can still see assignments locally
      const updatedLocal = [cargoAssignedData, ...pastAssignments];
      setPastAssignments(updatedLocal);
      localStorage.setItem('supplyx_local_transport_assignments', JSON.stringify(updatedLocal));
      triggerToast('Atribuição efetuada localmente (Sem conexão cloud temporária)');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered past assignments list for visual audit
  const filteredPastAssignments = useMemo(() => {
    return pastAssignments.filter(assignment => {
      const matchSearch = 
        assignment.assignmentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assignment.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assignment.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (assignment.driverName && assignment.driverName.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchStatus = 
        filterStatus === 'todos' || 
        assignment.status === filterStatus;

      return matchSearch && matchStatus;
    });
  }, [pastAssignments, searchQuery, filterStatus]);

  const filteredCarriersList = useMemo(() => {
    return finalCarriers.filter(c => 
      c.name.toLowerCase().includes(searchCarrierQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchCarrierQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchCarrierQuery.toLowerCase())
    );
  }, [finalCarriers, searchCarrierQuery]);

  return (
    <div className="w-full space-y-8 animate-fade-in text-[12px]">
      
      {/* SUCCESS POPUP TRANSITION */}
      {successToast && (
        <div 
          className="fixed top-6 right-6 z-50 p-4 bg-emerald-500 text-white rounded-2xl shadow-xl flex items-center gap-3 font-bold border border-emerald-400 transition-all duration-300 transform animate-in fade-in slide-in-from-top-4"
        >
          <div className="p-1 bg-white/20 rounded-full">
            <Check className="w-4 h-4 text-white" />
          </div>
          <span>{successToast}</span>
        </div>
      )}

      {/* HEADER META INFO HERO */}
      <div className={`p-6 sm:p-8 rounded-[32px] border flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${isDarkMode ? 'bg-zinc-900/50 border-white/5' : 'bg-white border-zinc-150 shadow-sm'}`}>
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-supplyx-blue/10 text-supplyx-blue tracking-wider">
              Módulo de Cubagem & Alocação
            </span>
            <span className="flex items-center gap-1.5 text-zinc-500 font-bold text-[9px]">
              <Clock className="w-3.5 h-3.5" /> UTC
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black italic tracking-tight uppercase">
            {language === 'PT' ? 'Atribuir Carga de Transporte' : 'Assign Cargo Transport'}
          </h1>
          <p className="text-zinc-500 text-[10px] sm:text-[11px] font-medium max-w-2xl mt-1 leading-relaxed">
            Planeamento de cubagem automatizado. Insira produtos em lote, calcule os requisitos físicos no território de Moçambique e selecione transportadoras, cavalos e condutores certificados nos corredores EN1, EN6 ou EN7.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button 
            onClick={() => setShowPasteModal(true)}
            className={`px-4 py-2.5 rounded-2xl flex items-center gap-2 font-bold uppercase tracking-wider border transition-all ${isDarkMode ? 'bg-zinc-950 border-white/5 text-zinc-300 hover:bg-zinc-900' : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'}`}
          >
            <Copy className="w-4 h-4 text-supplyx-blue" />
            {language === 'PT' ? 'Colar do Excel' : 'Paste from Excel'}
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className={`px-4 py-2.5 rounded-2xl flex items-center gap-2 font-bold uppercase tracking-wider border transition-all ${isDarkMode ? 'bg-zinc-950 border-white/5 text-zinc-300 hover:bg-zinc-900' : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'}`}
          >
            <Upload className="w-4 h-4 text-amber-500" />
            {language === 'PT' ? 'Importar' : 'Import'}
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImportExcel} 
            accept=".xlsx, .xls" 
            className="hidden" 
          />
          <button 
            onClick={handleExportExcel}
            className="px-4 py-2.5 rounded-2xl bg-supplyx-blue hover:bg-supplyx-blue-hover text-white flex items-center gap-2 font-bold uppercase tracking-wider shadow-lg shadow-supplyx-blue/15 transition-all"
          >
            <Download className="w-4 h-4" />
            {language === 'PT' ? 'Exportar' : 'Export'}
          </button>
        </div>
      </div>

      {activeSelectedCarrier === null ? (
        /* CARRIER SELECTION DASHBOARD */
        <div className={`p-8 rounded-[32px] border ${isDarkMode ? 'bg-zinc-900/40 border-white/5' : 'bg-white border-zinc-150 shadow-sm'} space-y-6`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                {language === 'PT' ? 'Selecione uma Transportadora Cadastrada' : 'Select a Registered Carrier'}
              </h3>
              <p className="text-[10px] text-zinc-500 font-medium">
                {language === 'PT' 
                  ? 'Filtre e selecione uma transportadora listada no Firestore para iniciar o planeamento de cubagem e atribuição.' 
                  : 'Filter and select a registered logistics company to start loading planning.'}
              </p>
            </div>
            
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
              <input 
                type="text"
                placeholder={language === 'PT' ? 'Procurar transportadora...' : 'Search carrier...'}
                value={searchCarrierQuery}
                onChange={(e) => setSearchCarrierQuery(e.target.value)}
                className={`w-full py-2.5 pl-9 pr-3 rounded-xl border font-bold text-[11px] outline-none focus:border-supplyx-blue transition-all ${isDarkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-white border-zinc-200 text-zinc-800'}`}
              />
            </div>
          </div>

          {loadingCarriers ? (
            <div className="py-12 text-center text-zinc-500 space-y-3 font-semibold">
              <RefreshCw className="w-8 h-8 text-supplyx-blue animate-spin mx-auto" />
              <p className="text-[11px] font-black uppercase tracking-widest">A carregar transportadoras do Firebase...</p>
            </div>
          ) : filteredCarriersList.length === 0 ? (
            <div className="py-12 text-center text-zinc-400 font-bold border border-dashed rounded-2xl dark:border-white/5">
              Nenhuma transportadora encontrada com esses critérios.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCarriersList.map((carrier) => (
                <div 
                  key={carrier.id} 
                  className={`p-6 rounded-[24px] border-2 flex flex-col justify-between transition-all ${
                    isDarkMode 
                      ? 'bg-zinc-950/40 border-white/5 hover:border-supplyx-blue/50' 
                      : 'bg-zinc-50/50 border-zinc-150 hover:bg-white hover:border-supplyx-blue shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <span className={`px-2.5 py-1 rounded-full text-[8.5px] font-black uppercase tracking-wider ${
                        carrier.isFromDb 
                          ? 'bg-supplyx-blue/10 text-supplyx-blue' 
                          : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {carrier.isFromDb ? 'Firestore' : 'Parceiro'}
                      </span>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Disponível" />
                    </div>

                    <div>
                      <h4 className="text-sm font-black uppercase italic text-zinc-900 dark:text-white leading-tight">
                        {carrier.name}
                      </h4>
                      <p className="text-[9.5px] text-zinc-500 font-semibold flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                        {carrier.location}
                      </p>
                    </div>

                    <div className="space-y-1.5 text-[10px] text-zinc-500 font-medium">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-zinc-400 animate-pulse" />
                        <span className="truncate">{carrier.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{carrier.phone}</span>
                      </div>
                    </div>

                    {/* COMMUNICATION MODULE */}
                    <div className="border-t border-dashed border-zinc-200 dark:border-white/5 pt-4 mt-4 space-y-3">
                      <label className="block text-[9px] font-black uppercase text-zinc-500 tracking-wider">
                        {language === 'PT' ? 'Fale Direto com a Transportadora' : 'Direct Communication'}
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder={language === 'PT' ? 'Diga algo ou tire dúvidas...' : 'Type a query...'}
                          value={messageTextByCarrier[carrier.id] || ''}
                          onChange={(e) => setMessageTextByCarrier(prev => ({ ...prev, [carrier.id]: e.target.value }))}
                          className={`flex-1 px-3 py-2 rounded-xl border text-[11px] outline-none ${
                            isDarkMode ? 'bg-zinc-900 border-white/5 text-white' : 'bg-white border-zinc-200 text-zinc-805'
                          }`}
                        />
                        <button
                          type="button"
                          disabled={sendingMessageId === carrier.id || !(messageTextByCarrier[carrier.id] || '').trim()}
                          onClick={() => handleSendDirectMessage(carrier.id, carrier.name, messageTextByCarrier[carrier.id] || '')}
                          className="px-3 rounded-xl bg-supplyx-blue hover:bg-supplyx-blue-hover text-white flex items-center justify-center transition-all disabled:opacity-50"
                        >
                          {sendingMessageId === carrier.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => onNavigate?.('Mensagens', { userId: carrier.id })}
                        className="text-[10px] text-supplyx-blue hover:underline font-bold flex items-center gap-1 transition-all"
                      >
                        <MessageSquare className="w-3 h-3" />
                        {language === 'PT' ? 'Abrir chat completo' : 'Open private chat'}
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveSelectedCarrier(carrier);
                      setSelectedTransporter(carrier.id);
                    }}
                    className="w-full mt-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/10 active:scale-[0.985] font-black uppercase tracking-wider text-[10px] rounded-2xl text-white transition-all shadow-md"
                  >
                    {language === 'PT' ? 'Selecionar para Atribuição de Carga' : 'Select for Assignment'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ORIGINAL GRID COLUMNS STAGE */
        <div className="space-y-6">
          <div className={`p-4 rounded-3xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
            isDarkMode ? 'bg-zinc-950/40 border-emerald-500/10 text-emerald-400' : 'bg-emerald-50/55 border-emerald-150 text-emerald-900 shadow-sm'
          }`}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 rounded-2xl text-emerald-500">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[9px] uppercase font-black tracking-widest leading-none text-zinc-400 mb-1">
                  {language === 'PT' ? 'Transportadora Selecionada' : 'Selected Carrier'}
                </p>
                <h4 className="text-sm font-black uppercase italic leading-none">
                  {activeSelectedCarrier.name}
                </h4>
                <p className="text-[10px] text-zinc-500 font-bold mt-1.5 flex items-center gap-1 leading-none">
                  <MapPin className="w-3.5 h-3.5 text-zinc-444" /> {activeSelectedCarrier.location} • {activeSelectedCarrier.phone}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveSelectedCarrier(null)}
              className={`px-4 py-2.5 rounded-xl border font-black uppercase tracking-wider text-[10px] transition-all hover:scale-[1.01] ${
                isDarkMode 
                  ? 'bg-zinc-900 border-white/5 hover:bg-zinc-800 text-white' 
                  : 'bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-700 shadow-sm'
              }`}
            >
              {language === 'PT' ? 'Voltar / Alterar' : 'Back / Change'}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN AND SPREADSHEET */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* SPREADSHEET COMPONENT */}
          <div className={`rounded-[32px] border overflow-hidden ${isDarkMode ? 'bg-zinc-900/30 border-white/5' : 'bg-white border-zinc-200 shadow-sm'}`}>
            <div className={`p-4 border-b flex items-center justify-between ${isDarkMode ? 'border-white/5 bg-zinc-950/20' : 'border-zinc-200 bg-zinc-50'}`}>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-500 animate-pulse" />
                <span className="font-extrabold text-[12px] uppercase tracking-wider text-zinc-500">
                  {language === 'PT' ? 'Grelha de Produtos & Cubagem Primária (Excel-like)' : 'Products Grid & Primary Cubage'}
                </span>
              </div>
              <button 
                onClick={handleAddRow}
                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold uppercase tracking-widest text-[10px] transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> {language === 'PT' ? 'Adicionar Linha' : 'Add Row'}
              </button>
            </div>

            <div className="overflow-x-auto select-text">
              <table className="w-full border-collapse text-left min-w-[1000px]">
                <thead>
                  <tr className={`border-b text-[10px] font-black uppercase tracking-wider ${isDarkMode ? 'border-white/5 bg-zinc-950/40 text-zinc-400' : 'border-zinc-200 bg-zinc-100 text-zinc-500'}`}>
                    <th className="p-3 text-center w-[50px]">#</th>
                    <th className="p-3 w-[22%]">{language === 'PT' ? 'Produto' : 'Product'}</th>
                    <th className="p-3 w-[12%]">{language === 'PT' ? 'Código' : 'Code'}</th>
                    <th className="p-3 w-[12%]">{language === 'PT' ? 'Categoria' : 'Category'}</th>
                    <th className="p-3 text-right w-[8%]">{language === 'PT' ? 'Qtd' : 'Qty'}</th>
                    <th className="p-3 text-center w-[8%]">{language === 'PT' ? 'Unid.' : 'Unit'}</th>
                    <th className="p-3 text-center w-[18%]">{language === 'PT' ? 'Dimensões (CxLxA) cm' : 'Dims. (LxWxH) cm'}</th>
                    <th className="p-3 text-right w-[10%]">{language === 'PT' ? 'Peso Unit (kg)' : 'Unit Wt (kg)'}</th>
                    <th className="p-3 text-right w-[10%]">{language === 'PT' ? 'Vol Unit (m³)' : 'Unit Vol (m³)'}</th>
                    <th className="p-3 text-right w-[12%]">{language === 'PT' ? 'Peso Total' : 'Total Weight'}</th>
                    <th className="p-3 text-right w-[12%]">{language === 'PT' ? 'Vol Total' : 'Total Volume'}</th>
                    <th className="p-3 text-center w-[100px]">{language === 'PT' ? 'Ações' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-white/5">
                  {mappedRowsWithCalculations.map((row, index) => (
                    <tr 
                      key={row.id}
                      className={`transition-colors text-[11px] group ${
                        isDarkMode 
                          ? 'hover:bg-white/[0.02] bg-zinc-900/10' 
                          : 'hover:bg-zinc-50 bg-white'
                      }`}
                    >
                      {/* INDEX */}
                      <td className="p-3 text-center font-bold text-zinc-500">
                        {index + 1}
                      </td>

                      {/* PRODUCT NAME */}
                      <td className="p-2">
                        <input 
                          type="text"
                          value={row.productName}
                          onChange={(e) => handleRowChange(row.id, 'productName', e.target.value)}
                          className={`w-full p-2.5 rounded-xl border font-semibold outline-none focus:border-supplyx-blue transition-all ${
                            isDarkMode 
                              ? 'bg-zinc-950 border-white/5 text-white' 
                              : 'bg-zinc-50 border-zinc-200 text-zinc-800'
                          }`}
                        />
                      </td>

                      {/* PRODUCT CODE */}
                      <td className="p-2">
                        <input 
                          type="text"
                          value={row.productCode}
                          onChange={(e) => handleRowChange(row.id, 'productCode', e.target.value)}
                          className={`w-full p-2.5 rounded-xl border font-mono uppercase font-bold outline-none focus:border-supplyx-blue transition-all ${
                            isDarkMode 
                              ? 'bg-zinc-950 border-white/10 text-zinc-300' 
                              : 'bg-zinc-50 border-zinc-200 text-zinc-700'
                          }`}
                        />
                      </td>

                      {/* CATEGORY */}
                      <td className="p-2">
                        <input 
                          type="text"
                          value={row.category}
                          onChange={(e) => handleRowChange(row.id, 'category', e.target.value)}
                          className={`w-full p-2.5 rounded-xl border font-medium outline-none focus:border-supplyx-blue transition-all ${
                            isDarkMode 
                              ? 'bg-zinc-950 border-white/5 text-zinc-300' 
                              : 'bg-zinc-50 border-zinc-200 text-zinc-700'
                          }`}
                        />
                      </td>

                      {/* QUANTITY */}
                      <td className="p-2">
                        <input 
                          type="number"
                          value={row.quantity}
                          min={1}
                          onChange={(e) => handleRowChange(row.id, 'quantity', parseInt(e.target.value) || 0)}
                          className={`w-full p-2.5 rounded-xl border text-right font-black outline-none focus:border-supplyx-blue transition-all ${
                            isDarkMode 
                              ? 'bg-zinc-950 border-white/5 text-white' 
                              : 'bg-zinc-50 border-zinc-200 text-zinc-850'
                          }`}
                        />
                      </td>

                      {/* UNIT */}
                      <td className="p-2">
                        <input 
                          type="text"
                          value={row.unit}
                          onChange={(e) => handleRowChange(row.id, 'unit', e.target.value)}
                          className={`w-full p-2.5 rounded-xl border text-center font-bold outline-none focus:border-supplyx-blue transition-all ${
                            isDarkMode 
                              ? 'bg-zinc-950 border-white/5 text-zinc-300' 
                              : 'bg-zinc-50 border-zinc-200 text-zinc-700'
                          }`}
                        />
                      </td>

                      {/* DIMENSIONS (LxWxH) */}
                      <td className="p-2">
                        <div className="flex items-center gap-1">
                          <input 
                            type="number" 
                            title="Comprimento em cm"
                            value={row.lengthCm}
                            onChange={(e) => handleRowChange(row.id, 'lengthCm', parseFloat(e.target.value) || 0)}
                            className={`w-[31%] p-2 rounded-lg border text-center font-semibold outline-none focus:border-supplyx-blue transition-all ${isDarkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-800'}`}
                          />
                          <span className="text-zinc-550 font-bold">x</span>
                          <input 
                            type="number" 
                            title="Largura em cm"
                            value={row.widthCm}
                            onChange={(e) => handleRowChange(row.id, 'widthCm', parseFloat(e.target.value) || 0)}
                            className={`w-[31%] p-2 rounded-lg border text-center font-semibold outline-none focus:border-supplyx-blue transition-all ${isDarkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-800'}`}
                          />
                          <span className="text-zinc-550 font-bold">x</span>
                          <input 
                            type="number" 
                            title="Altura em cm"
                            value={row.heightCm}
                            onChange={(e) => handleRowChange(row.id, 'heightCm', parseFloat(e.target.value) || 0)}
                            className={`w-[31%] p-2 rounded-lg border text-center font-semibold outline-none focus:border-supplyx-blue transition-all ${isDarkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-800'}`}
                          />
                        </div>
                      </td>

                      {/* UNIT WEIGHT */}
                      <td className="p-2">
                        <input 
                          type="number"
                          value={row.unitWeightKg}
                          step={0.1}
                          onChange={(e) => handleRowChange(row.id, 'unitWeightKg', parseFloat(e.target.value) || 0)}
                          className={`w-full p-2.5 rounded-xl border text-right font-bold outline-none focus:border-supplyx-blue transition-all ${
                            isDarkMode 
                              ? 'bg-zinc-950 border-white/5 text-white' 
                              : 'bg-zinc-50 border-zinc-200 text-zinc-800'
                          }`}
                        />
                      </td>

                      {/* CALCULATED UNIT VOLUME */}
                      <td className="p-3 text-right font-mono text-zinc-500 font-bold">
                        {row.unitVolM3} m³
                      </td>

                      {/* CALCULATED TOTAL WEIGHT */}
                      <td className="p-3 text-right font-semibold font-mono text-[11px]">
                        {(row.totalWeightKg).toLocaleString('pt')} kg
                      </td>

                      {/* CALCULATED TOTAL VOLUME */}
                      <td className="p-3 text-right font-semibold font-mono text-[11px] text-supplyx-blue">
                        {row.totalVolM3} m³
                      </td>

                      {/* ACTIONS ROW */}
                      <td className="p-2 text-center">
                        <div className="flex items-center justify-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button 
                            type="button"
                            title="Duplicar Linha"
                            onClick={() => handleDuplicateRow(row)}
                            className={`p-2 rounded-xl border transition-all ${
                              isDarkMode ? 'bg-zinc-950 border-white/5 hover:bg-zinc-900 text-zinc-400 hover:text-white' : 'bg-zinc-105 border-zinc-200 hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900'
                            }`}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            type="button"
                            title="Remover Linha"
                            onClick={() => handleDeleteRow(row.id)}
                            className={`p-2 rounded-xl border transition-all ${
                              rows.length <= 1 
                                ? 'opacity-30 cursor-not-allowed' 
                                : 'bg-zinc-950 border-white/5 hover:bg-red-950/20 text-red-500'
                            }`}
                            disabled={rows.length <= 1}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SPREADSHEET CALCULATION METRICS CARDS (Bento Style) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className={`p-5 rounded-[22px] border ${isDarkMode ? 'bg-zinc-900/40 border-white/5' : 'bg-white border-zinc-150 shadow-sm'}`}>
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-wider mb-1">
                {language === 'PT' ? 'PESO TOTAL' : 'TOTAL WEIGHT'}
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black italic select-all">
                  {(totalWeight / 1000).toFixed(2)}
                </span>
                <span className="text-[10px] text-zinc-500 font-bold uppercase">Toneladas</span>
              </div>
              <p className="text-[9px] text-zinc-400 mt-1 font-semibold">
                {totalWeight.toLocaleString('pt-BR')} kg acumulados
              </p>
            </div>

            <div className={`p-5 rounded-[22px] border ${isDarkMode ? 'bg-zinc-900/40 border-white/5' : 'bg-white border-zinc-150 shadow-sm'}`}>
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-wider mb-1">
                {language === 'PT' ? 'VOLUME DE CARGA' : 'TOTAL VOLUME'}
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black italic text-supplyx-blue select-all">
                  {totalVolume.toFixed(2)}
                </span>
                <span className="text-[10px] text-zinc-500 font-bold uppercase">Metros Cúbicos</span>
              </div>
              <p className="text-[9px] text-zinc-400 mt-1 font-semibold">
                Cubagem total calculada
              </p>
            </div>

            <div className={`p-5 rounded-[22px] border ${isDarkMode ? 'bg-zinc-900/40 border-white/5' : 'bg-white border-zinc-150 shadow-sm'}`}>
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-wider mb-1">
                {language === 'PT' ? 'DENSIDADE MÉDIA' : 'AVERAGE DENSITY'}
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black italic text-amber-500 select-all">
                  {averageDensity}
                </span>
                <span className="text-[10px] text-zinc-500 font-bold uppercase">kg/m³</span>
              </div>
              <p className="text-[9px] text-zinc-400 mt-1 font-semibold">
                {averageDensity > 400 ? 'Carga de Alta Densidade' : 'Carga de Baixa Densidade'}
              </p>
            </div>

            <div className={`p-5 rounded-[22px] border ${isDarkMode ? 'bg-zinc-900/40 border-white/5' : 'bg-white border-zinc-150 shadow-sm'}`}>
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-wider mb-1">
                {language === 'PT' ? 'PALETES ESTIMADOS' : 'ESTIMATED PALLETS'}
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black italic text-emerald-500 select-all">
                  {estimatedPallets}
                </span>
                <span className="text-[10px] text-zinc-500 font-bold uppercase">Slots Padrão</span>
              </div>
              <p className="text-[9px] text-zinc-400 mt-1 font-semibold">
                Base 1.2m x 0.8m x 1.6m
              </p>
            </div>

          </div>

          {/* OPERATIONAL PARAMETERS (MANUAL SPECIFICATION - FIXED OFFLINE SCHEMES) */}
          <div className={`p-6 rounded-[28px] border ${isDarkMode ? 'bg-zinc-900/40 border-white/5' : 'bg-white border-zinc-150 shadow-sm'}`}>
            <h3 className="font-extrabold text-[12px] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Navigation2 className="w-5 h-5 text-supplyx-blue" />
              {language === 'PT' ? 'Especificação de Origem, Destino e Rota' : 'Origin, Destination & Route Details'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-zinc-500 mb-1.5">{language === 'PT' ? 'Ponto de Partida / Origem (Município ou Porto)' : 'Origin Address'}</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-455" />
                    <input 
                      type="text"
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      placeholder="Ex: Porto de Maputo, Terminal Frigorífico"
                      className={`w-full py-3 pl-10 pr-4 rounded-xl border font-bold text-[11px] outline-none focus:border-supplyx-blue transition-all ${isDarkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-800'}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-zinc-500 mb-1.5">{language === 'PT' ? 'Destino Final da Entrega' : 'Destination Address'}</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-red-500" />
                    <input 
                      type="text"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="Ex: Porto da Beira, Cais 5"
                      className={`w-full py-3 pl-10 pr-4 rounded-xl border font-bold text-[11px] outline-none focus:border-supplyx-blue transition-all ${isDarkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-800'}`}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-zinc-500 mb-1.5">
                    {language === 'PT' ? 'Distância Real (Km)' : 'Manual Distance (Km)'}
                  </label>
                  <div className="relative">
                    <Navigation2 className="absolute left-3.5 top-3.5 w-4 h-4 text-supplyx-blue" />
                    <input 
                      type="number"
                      value={distanceKm || ''}
                      onChange={(e) => setDistanceKm(Math.max(0, Number(e.target.value)))}
                      placeholder="Ex: 480"
                      className={`w-full py-3 pl-10 pr-4 rounded-xl border font-mono font-bold text-[11.5px] outline-none focus:border-supplyx-blue transition-all ${isDarkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-800'}`}
                    />
                  </div>
                  <span className="text-[9px] text-zinc-400 block mt-1">Insira a quilometragem real da rota</span>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-zinc-500 mb-1.5">
                    {language === 'PT' ? 'Tempo de Viagem (Horas)' : 'Transit Duration (Hrs)'}
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3.5 top-3.5 w-4 h-4 text-amber-500" />
                    <input 
                      type="number"
                      step="0.5"
                      value={distanceKm ? Number((durationMin / 60).toFixed(1)) : ''}
                      onChange={(e) => setDurationMin(Math.max(0, Number(e.target.value) * 60))}
                      placeholder="Ex: 6.5"
                      className={`w-full py-3 pl-10 pr-4 rounded-xl border font-mono font-bold text-[11.5px] outline-none focus:border-supplyx-blue transition-all ${isDarkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-800'}`}
                    />
                  </div>
                  <span className="text-[9px] text-zinc-400 block mt-1">Duração média estimada do percurso</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-500 mb-1.5">{language === 'PT' ? 'Coleta Prevista' : 'Pickup Date'}</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                  <input 
                    type="date"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className={`w-full py-2.5 pl-9 pr-3 rounded-lg border font-bold text-[11px] outline-none focus:border-supplyx-blue transition-all ${isDarkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-white border-zinc-200 text-zinc-850'}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-500 mb-1.5">{language === 'PT' ? 'Entrega Prevista' : 'Delivery Date'}</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                  <input 
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className={`w-full py-2.5 pl-9 pr-3 rounded-lg border font-bold text-[11px] outline-none focus:border-supplyx-blue transition-all ${isDarkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-white border-zinc-200 text-zinc-850'}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-500 mb-1.5">{language === 'PT' ? 'Prioridade Crítica' : 'Priority'}</label>
                <div className="flex gap-1.5">
                  {(['Baixa', 'Média', 'Alta'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                        priority === p 
                          ? p === 'Alta' 
                            ? 'bg-red-500/10 border-red-500 text-red-500' 
                            : p === 'Média'
                              ? 'bg-amber-500/10 border-amber-500 text-amber-500'
                              : 'bg-emerald-500/10 border-emerald-500 text-emerald-500'
                          : isDarkMode
                            ? 'bg-zinc-950 border-white/5 text-zinc-450 hover:bg-zinc-900'
                            : 'bg-white border-zinc-200 text-zinc-600'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-[10px] font-black uppercase text-zinc-500 mb-1.5">{language === 'PT' ? 'Observações e Instruções de Carga Especiais' : 'Special Instructions'}</label>
              <textarea 
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Exemplo: Material refrigerado, necessita amarras, carga frágil, etc."
                className={`w-full p-3 rounded-xl border font-semibold text-[11px] outline-none focus:border-supplyx-blue transition-all ${isDarkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-white border-zinc-200 text-zinc-800'}`}
              />
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: AI RECOMMENDATIONS AND CONFIRMATION OF ASSIGNMENT */}
        <div className="space-y-8 col-span-1">
          
          {/* SMART RECOMMENDATION WIDGET */}
          <div className={`p-6 rounded-[28px] border-2 relative overflow-hidden transition-all ${
            isDarkMode 
              ? 'bg-gradient-to-br from-zinc-950 to-zinc-900 border-supplyx-blue/30' 
              : 'bg-gradient-to-br from-white to-zinc-50 border-supplyx-blue shadow-lg shadow-supplyx-blue/5'
          }`}>
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Sparkles className="w-24 h-24 text-supplyx-blue animate-bounce" />
            </div>

            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-supplyx-blue/10 rounded-lg text-supplyx-blue">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-[12px] uppercase tracking-wider text-supplyx-blue">
                {language === 'PT' ? 'Recomendação Logística de IA' : 'AI Freight Engine recommendation'}
              </span>
            </div>

            {recommendedVehiclesResult.primary ? (
              <div key="rec-primary" className="space-y-6">
                <div>
                  <h4 className="text-sm font-black italic text-zinc-900 dark:text-white uppercase leading-tight mb-1">
                    {recommendedVehiclesResult.primary.name}
                  </h4>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                    {recommendedVehiclesResult.primary.description}
                  </p>
                </div>

                {/* CAPACITY VISUAL BAR OUTLINES */}
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9.5px] text-zinc-500 font-extrabold uppercase">{language === 'PT' ? 'Ocupação por Peso' : 'Weight Capacity Utilization'}</span>
                      <span className="text-[10px] font-black">{recommendedVehiclesResult.primary.occWeight}%</span>
                    </div>
                    <div className="h-2 w-full bg-zinc-200 dark:bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${recommendedVehiclesResult.primary.occWeight > 90 ? 'bg-red-500' : recommendedVehiclesResult.primary.occWeight > 70 ? 'bg-amber-500' : 'bg-supplyx-blue'}`}
                        style={{ width: `${Math.min(recommendedVehiclesResult.primary.occWeight, 100)}%` }}
                      />
                    </div>
                    <p className="text-[9px] text-zinc-400 mt-0.5 font-semibold text-right">
                      {totalWeight.toLocaleString('pt-BR')} kg / {recommendedVehiclesResult.primary.capacityWeight.toLocaleString('pt-BR')} kg
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9.5px] text-zinc-500 font-extrabold uppercase">{language === 'PT' ? 'Ocupação por Volume (M³)' : 'Volume Utilization'}</span>
                      <span className="text-[10px] font-black text-supplyx-blue">{recommendedVehiclesResult.primary.occVolume}%</span>
                    </div>
                    <div className="h-2 w-full bg-zinc-200 dark:bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${recommendedVehiclesResult.primary.occVolume > 90 ? 'bg-red-500' : recommendedVehiclesResult.primary.occVolume > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(recommendedVehiclesResult.primary.occVolume, 100)}%` }}
                      />
                    </div>
                    <p className="text-[9px] text-zinc-400 mt-0.5 font-semibold text-right">
                      {totalVolume.toFixed(2)} m³ / {recommendedVehiclesResult.primary.capacityVolume} m³
                    </p>
                  </div>
                </div>

                {/* CUBAGING ALERTS & REVENUE PROFILES */}
                <div className="p-3.5 rounded-xl border border-supplyx-blue/15 bg-supplyx-blue/5 text-[10px] text-zinc-650 dark:text-zinc-300 font-medium leading-relaxed">
                  <strong>ℹ️ {language === 'PT' ? 'Análise do Coeficiente:' : 'Freight Density Analysis:'}</strong> {recommendedVehiclesResult.notes}
                </div>

                {/* ALTERNATIVES */}
                {recommendedVehiclesResult.alternatives.length > 0 && (
                  <div>
                    <span className="block text-[9px] text-zinc-500 font-black uppercase tracking-wider mb-2.5">
                      {language === 'PT' ? 'Combos de Frota Alternativos:' : 'Alternative Fleet Options:'}
                    </span>
                    <div className="space-y-2">
                      {recommendedVehiclesResult.alternatives.map((alt) => (
                        <div key={alt.name} className={`p-3 rounded-xl flex justify-between items-center border ${isDarkMode ? 'bg-zinc-950/40 border-white/5' : 'bg-white border-zinc-200 shadow-sm'}`}>
                          <span className="font-extrabold text-[10px] uppercase text-zinc-700 dark:text-zinc-300">{alt.name}</span>
                          <span className="text-[10px] font-black text-emerald-500">Max {Number(alt.maxOcc).toFixed(0)}% Ocup.</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div key="rec-empty" className="py-8 text-center text-zinc-400 font-bold space-y-1">
                <p>{language === 'PT' ? 'Aguardando Lançamento de Itens' : 'Awaiting item entries'}</p>
                <p className="text-[10px] font-medium text-zinc-500">Insira valores na planilha de produtos para calcular.</p>
              </div>
            )}
          </div>

          {/* FINAL ASSIGNMENT ACTIONS CONTAINER */}
          <div className={`p-6 rounded-[28px] border ${isDarkMode ? 'bg-zinc-900/40 border-white/5' : 'bg-white border-zinc-150 shadow-sm'}`}>
            <h3 className="font-extrabold text-[12px] uppercase tracking-wider mb-4 flex items-center gap-1.5 text-zinc-500">
              <Layers className="w-5 h-5 text-emerald-500" />
              {language === 'PT' ? 'Alocação de Recurso & Assinatura' : 'Resource Allocation & Contract'}
            </h3>

            <div className="space-y-4">
              
              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-500 mb-1.5">{language === 'PT' ? 'Transportador Geral Moçambique' : 'Select Mozambique Carrier'}</label>
                <select
                  value={selectedTransporter}
                  onChange={(e) => setSelectedTransporter(e.target.value)}
                  className={`w-full p-3 rounded-xl border font-bold text-[11px] outline-none focus:border-supplyx-blue transition-all ${isDarkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-855'}`}
                >
                  {DEFAULT_TRANSPORTERS.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-500 mb-1.5">{language === 'PT' ? 'Frotas & Motorista Credenciado (EN1)' : 'Fleets & Certified Driver'}</label>
                <select
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  className={`w-full p-3 rounded-xl border font-mono font-bold text-[11.5px] outline-none focus:border-supplyx-blue transition-all ${isDarkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-855'}`}
                >
                  {finalDrivers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.vehicle} - {d.capacity})
                    </option>
                  ))}
                </select>
              </div>

              {/* ESTIMATE FEE MEMOS */}
              <div className={`p-4 rounded-2xl space-y-2 border ${isDarkMode ? 'bg-zinc-950 border-white/5' : 'bg-zinc-100 border-zinc-200'}`}>
                <div className="flex justify-between">
                  <span className="text-zinc-500 font-bold">{language === 'PT' ? 'Estimativa de Custos' : 'Fuel/Freight Index'}</span>
                  <span className="font-mono font-black italic">
                    {distanceKm ? (distanceKm * 280).toLocaleString('pt-BR') : '---'} MZN
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 font-bold">{language === 'PT' ? 'Portagens Rodoviárias (Aprox)' : 'Average Toll gate fees'}</span>
                  <span className="font-mono font-black">
                    {distanceKm ? distanceKm > 600 ? '4.800 MZN' : '1.200 MZN' : '---'} MZN
                  </span>
                </div>
                <div className="border-t border-dashed border-zinc-300 dark:border-white/10 pt-2 flex justify-between font-extrabold text-[12px]">
                  <span>{language === 'PT' ? 'Total Indicativo' : 'Projected Cost Outlay'}</span>
                  <span className="text-supplyx-blue font-mono font-black select-all">
                    {distanceKm ? (distanceKm * 285 + (distanceKm > 600 ? 4800 : 1200)).toLocaleString('pt-BR') : '---'} MZN
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleConfirmAssignment}
                disabled={isSubmitting || rows.length === 0}
                className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[11px] border border-transparent shadow-xl transition-all ${
                  isSubmitting || rows.length === 0
                    ? 'bg-zinc-300 dark:bg-zinc-850 text-zinc-500 cursor-not-allowed shadow-none'
                    : 'bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] hover:shadow-emerald-500/10 text-white'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>{language === 'PT' ? 'Registando no Firestore...' : 'Registering Assignment...'}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{language === 'PT' ? 'Atribuir Transporte' : 'Assign Cargo Transport'}</span>
                  </>
                )}
              </button>

            </div>
          </div>

        </div>

      </div>
      </div>
      )}

      {/* RECENT HISTORIC DATABASE AUDIT (Firestore logs viewer) */}
      <div className={`p-6 rounded-[32px] border ${isDarkMode ? 'bg-zinc-900/30 border-white/5' : 'bg-white border-zinc-200 shadow-sm'}`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
              {language === 'PT' ? 'Registo de Atribuições Efetuadas (Firestore)' : 'Recent Transport Assignments Logs (Firestore)'}
            </h3>
            <p className="text-[10px] text-zinc-550">Audit de cargas consolidadas e registadas na coleção <code>transportAssignments</code> do banco de dados.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
              <input 
                type="text"
                placeholder={language === 'PT' ? 'Pesquisar ID, origem...' : 'Search ID, origin...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full md:w-64 py-2 pl-9 pr-3 rounded-xl border font-bold text-[11px] outline-none focus:border-supplyx-blue transition-all ${isDarkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-white border-zinc-200 text-zinc-800'}`}
              />
            </div>

            <div className="flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-zinc-550" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className={`p-2 rounded-xl border font-bold text-[10.5px] outline-none focus:border-supplyx-blue transition-all ${isDarkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-white border-zinc-200 text-zinc-800'}`}
              >
                <option value="todos">{language === 'PT' ? 'Todos Status' : 'All Status'}</option>
                <option value="pending">{language === 'PT' ? 'Pendentes' : 'Pending'}</option>
                <option value="completed">{language === 'PT' ? 'Concluídos' : 'Completed'}</option>
              </select>
            </div>
          </div>
        </div>

        {loadingPast ? (
          <div className="py-12 text-center text-zinc-500 space-y-3 font-semibold">
            <RefreshCw className="w-8 h-8 text-supplyx-blue animate-spin mx-auto" />
            <p className="text-[11px] font-black uppercase tracking-widest">Sincronizando com Firestore...</p>
          </div>
        ) : filteredPastAssignments.length === 0 ? (
          <div className="py-12 text-center text-zinc-400 font-bold border border-dashed rounded-2xl dark:border-white/5">
            {language === 'PT' ? 'Nenhum registo de atribuição encontrado.' : 'No recent transport assignments registered.'}
          </div>
        ) : (
          <div className="overflow-x-auto select-none">
            <table className="w-full border-collapse text-left text-[11.5px]">
              <thead>
                <tr className={`border-b text-[10px] font-black uppercase tracking-wider ${isDarkMode ? 'border-white/5 bg-zinc-950/40 text-zinc-400' : 'border-zinc-150 bg-zinc-100 text-zinc-500'}`}>
                  <th className="p-3">ID Atribuição</th>
                  <th className="p-3">Rota (Origem → Destino)</th>
                  <th className="p-3">Produtos Alocados</th>
                  <th className="p-3 text-right">Métricas Física</th>
                  <th className="p-3">Veículo Escolhido</th>
                  <th className="p-3">Motorista</th>
                  <th className="p-3 text-center">Data Criação</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-white/5">
                {filteredPastAssignments.map((assignment, idx) => (
                  <tr key={assignment.id || assignment.assignmentId || `assignment-${idx}`} className={`hover:bg-zinc-100/30 dark:hover:bg-white/[0.015] ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                    <td className="p-3 font-mono font-black uppercase text-supplyx-blue">{assignment.assignmentId || 'TA-UNKNOWN'}</td>
                    <td className="p-3 font-bold max-w-sm">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate">{assignment.origin}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="truncate">{assignment.destination}</span>
                      </div>
                      {assignment.distanceKm && (
                        <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{assignment.distanceKm} Km • ~( {Number(assignment.durationMinutes / 60).toFixed(1)} hrs )</p>
                      )}
                    </td>
                    <td className="p-3 max-w-[200px]">
                      <div className="truncate font-semibold text-zinc-400">
                        {assignment.products?.map((p: any) => `${p.quantity} x ${p.productName}`).join(', ') || 'Nenhum item inserido'}
                      </div>
                    </td>
                    <td className="p-3 text-right font-bold space-y-0.5">
                      <p className="font-mono">{(assignment.totalWeight / 1000).toFixed(2)} Tons</p>
                      <p className="text-[9.5px] text-zinc-500 font-mono font-semibold">{Number(assignment.totalVolume).toFixed(2)} m³ • {assignment.density} kg/m³</p>
                    </td>
                    <td className="p-3 font-mono font-bold text-[10px] uppercase">{assignment.selectedVehicle || 'N/A'}</td>
                    <td className="p-3 font-semibold">{assignment.driverName || 'N/D'}</td>
                    <td className="p-3 text-center text-[10px] font-semibold text-zinc-500">
                      {assignment.createdAt ? new Date(assignment.createdAt).toLocaleString('pt').slice(0, 16) : 'Agora mesmo'}
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wide bg-amber-500/10 text-amber-500">
                        {assignment.status === 'pending' ? 'Pendente' : assignment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PASTE EXCEL CELL DIALOG */}
      {showPasteModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
        >
          <div 
            className="absolute inset-0 cursor-pointer"
            onClick={() => setShowPasteModal(false)}
          />
          <div 
            className={`relative w-full max-w-lg rounded-3xl p-6 border shadow-2xl overflow-hidden z-10 transition-all duration-300 transform animate-in zoom-in-95 ${isDarkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-200'}`}
          >
            <div className="flex justify-between items-center mb-4">
              <span className="font-extrabold text-[12px] uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <Copy className="w-5 h-5 text-supplyx-blue" />
                {language === 'PT' ? 'Copiar e Colar do Excel' : 'Paste Direct from Excel'}
              </span>
              <button 
                onClick={() => setShowPasteModal(false)}
                className={`p-1.5 rounded-xl border ${isDarkMode ? 'bg-zinc-950 border-white/5 text-zinc-400 hover:text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-650'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-[11px]">
              <p className="text-zinc-500 leading-relaxed">
                {language === 'PT' ? 'Abra sua tabela no Excel ou no Google Sheets, copie (Ctrl+C) as colunas desejadas e cole (Ctrl+V) no espaço abaixo.' : 'Open your Excel/Google sheet table, copy rows (Ctrl+C) and paste (Ctrl+V) into the text region below.'}
              </p>

              <div className={`p-3 rounded-2xl border mb-3 space-y-1 ${isDarkMode ? 'bg-zinc-950/60 border-white/5' : 'bg-zinc-50 border-zinc-200'}`}>
                <span className="block text-[9px] text-zinc-500 font-extrabold uppercase tracking-wider">{language === 'PT' ? 'Ordem esperada das colunas:' : 'Expected template columns order:'}</span>
                <p className="font-mono font-bold text-[9px] text-zinc-600 dark:text-zinc-400">
                  Produto [tab] Código [tab] Categoria [tab] Qtd [tab] Unidade [tab] Comp(cm) [tab] Larg(cm) [tab] Alt(cm) [tab] Peso(kg)
                </p>
              </div>

              <textarea
                rows={6}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Cole as colunas tabulares aqui..."
                className={`w-full p-3 font-mono text-[10px] rounded-2xl border outline-none focus:border-supplyx-blue transition-all ${isDarkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-white border-zinc-200 text-zinc-800'}`}
              />

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasteModal(false)}
                  className={`flex-1 py-3 rounded-2xl font-black uppercase tracking-wider transition-all border ${isDarkMode ? 'bg-zinc-950 border-white/5 text-zinc-400 hover:bg-zinc-900' : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'}`}
                >
                  {language === 'PT' ? 'Cancelar' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handlePasteExcelSubmit}
                  disabled={!pasteText.trim()}
                  className={`flex-1 py-3 rounded-2xl font-black uppercase tracking-wider transition-all text-white ${
                    !pasteText.trim() ? 'bg-zinc-300 dark:bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-supplyx-blue hover:bg-supplyx-blue-hover hover:shadow-lg hover:shadow-supplyx-blue/15'
                  }`}
                >
                  {language === 'PT' ? 'Processar & Preencher' : 'Process & Load'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
