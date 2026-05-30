import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Truck, 
  Package, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  Navigation2, 
  Sparkles, 
  DollarSign, 
  Star, 
  ChevronRight,
  TrendingDown,
  Clock,
  MapPin,
  Shield,
  Layers,
  Sliders,
  Bell,
  Send,
  Building,
  Wrench,
  Fuel,
  Percent,
  RefreshCw,
  Search,
  BookOpen
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar, 
  Cell, 
  PieChart, 
  Pie 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { CargoRequest, CommercialDriver } from './types';

// Analytical Mock Data for Graphs
const trendData = [
  { month: 'Jan', cost: 420000, tonnage: 110 },
  { month: 'Fev', cost: 380000, tonnage: 95 },
  { month: 'Mar', cost: 510000, tonnage: 130 },
  { month: 'Abr', cost: 490050, tonnage: 125 },
  { month: 'Mai', cost: 620000, tonnage: 165 },
];

const categoryData = [
  { name: 'Cimento / Minerais', value: 45, color: '#3b82f6' },
  { name: 'Sacos Paletizados', value: 25, color: '#10b981' },
  { name: 'Carvão / Granéis', value: 20, color: '#f59e0b' },
  { name: 'Químicos / Fluidos', value: 10, color: '#ec4899' },
];

const carrierPerformanceData = [
  { name: 'Moz Logistics, Lda', onTime: 98, costIndex: 92, fleetSize: 42 },
  { name: 'Fast Cargo S.A.', onTime: 96, costIndex: 94, fleetSize: 30 },
  { name: 'Transportes União', onTime: 94, costIndex: 88, fleetSize: 22 },
  { name: 'Manica Logistics', onTime: 90, costIndex: 90, fleetSize: 15 },
];

interface LogisticsDashboardProps {
  isDarkMode: boolean;
  language: 'PT' | 'EN';
  requests: CargoRequest[];
  drivers: CommercialDriver[];
  occurrences?: any[];
  notifications?: any[];
  onSelectRequest: (id: string) => void;
  setActiveSubTab: (tab: any) => void;
}

export default function LogisticsDashboard({
  isDarkMode,
  language,
  requests = [],
  drivers = [],
  occurrences = [],
  notifications = [],
  onSelectRequest,
  setActiveSubTab
}: LogisticsDashboardProps) {

  // Inner navigation: 'overview' | 'control_tower' | 'carrier_matching' | 'fleet' | 'warehouses' | 'logs' | 'ai_assistant'
  const [activeInnerTab, setActiveInnerTab] = useState<'overview' | 'control_tower' | 'carrier_matching' | 'fleet' | 'warehouses' | 'logs' | 'ai_assistant'>('overview');
  const [isSimulatorExpanded, setIsSimulatorExpanded] = useState(false);

  // Multi-lingual terminology
  const t = {
    PT: {
      allOrders: 'Pedidos Totais',
      activeOrders: 'Pedidos Ativos',
      completed: 'Entregas Concluídas',
      incidents: 'Ocorrências Abertas',
      carriers: 'Transportadores Ativos',
      performance: 'Performance Geral',
      controlTowerTab: '🛰️ Torre de Controle',
      matchingTab: '🤖 Match Inteligente',
      fleetTab: '🚛 Gestão de Frotas',
      warehouseTab: '🏢 Rede de Armazéns',
      logsTab: '⚡ Fluxo de Eventos',
      aiAssistantTab: '🧠 Assistente IA',
      overviewTab: '📊 Cockpit Analítico'
    },
    EN: {
      allOrders: 'Total Orders',
      activeOrders: 'Active Orders',
      completed: 'Completed Deliveries',
      incidents: 'Open Incidents',
      carriers: 'Active Carriers',
      performance: 'General Performance',
      controlTowerTab: '🛰️ Control Tower',
      matchingTab: '🤖 Carrier Match',
      fleetTab: '🚛 Fleet Management',
      warehouseTab: '🏢 Warehouse Network',
      logsTab: '⚡ Real-time Events',
      aiAssistantTab: '🧠 Logistics Copilot',
      overviewTab: '📊 Control Dashboard'
    }
  }[language];

  // ==========================================
  // STATE DEFINITIONS FOR THE MODULES
  // ==========================================

  // 1. Control Tower Telemetry Setup
  const [telemetryTime, setTelemetryTime] = useState<number>(0);
  const [isPlayingTelemetry, setIsPlayingTelemetry] = useState<boolean>(true);
  const [selectedTruckId, setSelectedTruckId] = useState<string>('truck-01');

  // Simulated live trucks along coordinates
  const trucksList = [
    { id: 'truck-01', name: 'Volvo FH 540 (Carlos)', route: 'Maputo ➔ Nampula', currentPos: 35, speed: '83 km/h', payload: 'Cimento CP-IV', lat: -25.96, lon: 32.58, temp: '22°C', fuel: '78%', status: 'Normal' },
    { id: 'truck-02', name: 'Scania Streamline (Mateus)', route: 'Beira ➔ Moatize', currentPos: 65, speed: '72 km/h', payload: 'Combustível Especializado', lat: -19.82, lon: 34.83, temp: '27°C', fuel: '42%', status: 'Atraso Meteorológico' },
    { id: 'truck-03', name: 'Mercedes Actros (Armando)', route: 'Tete ➔ Nacala Port', currentPos: 12, speed: '88 km/h', payload: 'Carvão Bruto', lat: -16.15, lon: 33.58, temp: '31°C', fuel: '92%', status: 'Manutenção Preditiva Alerta' }
  ];

  useEffect(() => {
    let timer: any;
    if (isPlayingTelemetry) {
      timer = setInterval(() => {
        setTelemetryTime(prev => (prev + 1) % 100);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlayingTelemetry]);

  // 2. Intelligent Carrier Matching Setup
  const [targetWeight, setTargetWeight] = useState<number>(25);
  const [targetVolume, setTargetVolume] = useState<number>(38);
  const [targetCargoType, setTargetCargoType] = useState<string>('Minerals/Solid');
  const [matchResponse, setMatchResponse] = useState<any>(null);
  const [isMatchingLoading, setIsMatchingLoading] = useState<boolean>(false);

  // 3. Automated B2B Event Architecture Sequence Simulation
  const [eventProgress, setEventProgress] = useState<number>(0);
  const [eventLogs, setEventLogs] = useState<any[]>([
    { code: 'ORDER_CREATED', title: 'Ordem de Frete Autuada', info: 'ID #TR-2025-0001 criada no painel.', isDone: true, time: '13:02' },
    { code: 'FREIGHT_CREATED', title: 'Margem Contratual Garantida', info: 'Custódia do frete selada em Escrow digital.', isDone: true, time: '13:05' },
    { code: 'DRIVER_ASSIGNED', title: 'Transportador Selecionado', info: 'Moz Logistics aceitou por MT 78.000.', isDone: false, time: 'Aguardando' },
    { code: 'PICKUP_CONFIRMED', title: 'Coleta Confirmada', info: 'Carga paletizada carregada pelo veículo Volvo.', isDone: false, time: 'Aguardando' },
    { code: 'IN_TRANSIT', title: 'Em Trânsito - GPS Ativo', info: 'Veículo cruzou posto de portagem de Maputo.', isDone: false, time: 'Aguardando' },
    { code: 'ARRIVED_AT_DESTINATION', title: 'Chegada ao Destino', info: 'Ponto final de descarga em Nampula alcançado.', isDone: false, time: 'Aguardando' },
    { code: 'DELIVERED', title: 'Entrega Selada com Sucesso', info: 'Documentação digital assinada e POD enviada.', isDone: false, time: 'Aguardando' },
    { code: 'PAYMENT_RELEASED', title: 'Pagamento Liberado pela API', info: 'Valores distribuídos à transportadora via Gateway.', isDone: false, time: 'Aguardando' }
  ]);

  const runFullLifeCycleSimulation = () => {
    setEventProgress(0);
    const updated = eventLogs.map((log, index) => ({
      ...log,
      isDone: index === 0,
      time: index === 0 ? '13:02' : 'Aguardando'
    }));
    setEventLogs(updated);

    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      if (step < eventLogs.length) {
        setEventProgress(step);
        setEventLogs(prev => prev.map((item, idx) => {
          if (idx <= step) {
            const date = new Date();
            const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
            return { ...item, isDone: true, time: timeStr };
          }
          return item;
        }));
      } else {
        clearInterval(interval);
      }
    }, 1500);
  };

  // 4. Warehouse Intelligent Grid Occupancy Setup
  const [activeWarehouseId, setActiveWarehouseId] = useState<string>('wh-01');
  const [warehouseList, setWarehouseList] = useState<any[]>([
    { id: 'wh-01', name: 'Maputo Terminal Sul (Matola)', totalTons: 50000, currentTons: 38500, occupancyRate: 78, zones: ['Silo Cimento (90%)', 'Minério A (85%)', 'Filtro (30%)'] },
    { id: 'wh-02', name: 'Beira Logistics Hub (Porto)', totalTons: 30000, currentTons: 18600, occupancyRate: 62, zones: ['Insumos Agrícolas (70%)', 'Peças Pesadas (45%)', 'Químicos (20%)'] },
    { id: 'wh-03', name: 'Nacala Port Storage', totalTons: 80000, currentTons: 32000, occupancyRate: 40, zones: ['Granéis Sólidos (35%)', 'Armazenamento Seco (50%)', 'Perigosos (15%)'] }
  ]);
  const [rebalanceAlert, setRebalanceAlert] = useState<string>('');

  const executeWarehouseRebalance = () => {
    setRebalanceAlert(language === 'PT' ? 'Rebalanceamento inteligente acionado! Realocando 1.200 Toneladas do Cimento CP-IV do Armazém WH-01 para WH-03 devido à escassez detectada pelo modelo preditivo local.' : 'Intelligent rebalancing triggered! Transferring 1,200 Tons of Cement CP-IV from WH-01 to WH-03 to mitigate local stockout risk.');
    setTimeout(() => {
      setWarehouseList(prev => prev.map(wh => {
        if (wh.id === 'wh-01') return { ...wh, currentTons: wh.currentTons - 1200, occupancyRate: Math.round(((wh.currentTons - 1200)/wh.totalTons)*100) };
        if (wh.id === 'wh-03') return { ...wh, currentTons: wh.currentTons + 1200, occupancyRate: Math.round(((wh.currentTons + 1200)/wh.totalTons)*100) };
        return wh;
      }));
    }, 2000);
  };

  // 5. Intelligent Route Optimizer parameters
  const [selectedCorrider, setSelectedCorridor] = useState<'corredor-sul' | 'corredor-centro'>('corredor-sul');
  const [cargoWeightTons, setCargoWeightTons] = useState<number>(20);

  // 6. AI Interactive Assistant Chat state
  const [assistantPrompt, setAssistantPrompt] = useState<string>('');
  const [assistantChat, setAssistantChat] = useState<any[]>([
    {
      role: 'assistant',
      text: language === 'PT' 
        ? 'Saudações, sou o Co-Piloto de IA Logística do SupplyX. Posso realizar auditorias operacionais, calcular o risco de atraso (ETA Predictor), planejar redistribuição de armazéns e recomendar a melhor combinação de transportadores para o seu frete corporativo.'
        : 'Greetings, I am the SupplyX Smart Logistics Copilot. I can conduct operational path audits, evaluate transit risks (ETA Predictor), evaluate warehouses, and matching carrier configurations.'
    }
  ]);

  const handleSendMessage = (textToSend = assistantPrompt) => {
    if (!textToSend.trim()) return;
    const userMsg = { role: 'user', text: textToSend };
    setAssistantChat(prev => [...prev, userMsg]);
    setAssistantPrompt('');

    // Predefined smart logistics intelligence engine response simulation
    setTimeout(() => {
      let reply = '';
      const promptLower = textToSend.toLowerCase();

      if (promptLower.includes('risco') || promptLower.includes('atraso') || promptLower.includes('risk') || promptLower.includes('delay')) {
        reply = language === 'PT'
          ? '⚠️ **ANÁLISE DE RISCO PREDITIVA (ETA Model):**\nO corredor Moatize-Beira apresenta risco climático moderado devido a precipitações acumuladas na província de Tete. O tempo médio de atraso estimado para cargas pesadas (>20T) é de **2,4 horas**. Rota recomendada alternativa: Bypass Tete EN103 direcionado ao Corredor Sul.'
          : '⚠️ **PREDICTIVE TRANSIT RISK ANALYSIS (ETA Model):**\nThe Moatize-Beira transit corridor exhibits moderate risk due to dense rain precipitation in Tete province. The estimated average delay for heavy cargo (>20T) is **2.4 hours**. Recommended mitigation route: EN103 Bypass diverted southwards.';
      } else if (promptLower.includes('armaz') || promptLower.includes('estoq') || promptLower.includes('warehouse') || promptLower.includes('stock')) {
        reply = language === 'PT'
          ? '🏢 **DIAGNÓSTICO REDE DE ARMAZÉNS:**\nArmazém WH-01 (Maputo Terminal) está operando em alta capacidade (78% de ocupação). Há um desequilíbrio geográfico devido à safra de exportações. Sugiro rodar o comando **"Balancear Cargas"** para mover cargas paletizadas excedentes ao porto secundário de Nacala com tarifa ferroviária subsidiada.'
          : '🏢 **WAREHOUSE MATRIX LOGISTICS OVERVIEW:**\nWarehouse WH-01 (Maputo Terminal) is operating at near peak utility (78% storage occupied). I suggest calling **"Balancear Cargas"** (Smart Rebalancing Matrix) to ship the palletized materials bulk surplus to Nacala rail terminal, cutting B2B tariffs by up to 14.5%.';
      } else if (promptLower.includes('efici') || promptLower.includes('custo') || promptLower.includes('match') || promptLower.includes('optimize')) {
        reply = language === 'PT'
          ? '🤖 **RECOMENDAÇÃO INTELIGENTE DE MATCHING:**\nPara carregar 30 Toneladas de cimento paletizado, a recomendação ótima de veículo é **Scania Streamline de eixos duplos (Moz Logistics)**. Isto economizará **12.4% em consumo médio de combustível** em relação a frotas com truques comuns. O SLA de entrega é assegurado no index de 98%.'
          : '🤖 **SMART PAIRING OPTIMIZATION SUGGESTION:**\nTo haul a payload of 30 Tons of bagged cement, the optimal matched fleet configuration is a **Scania Double-axle (with driver from registered fleet)**. This setup scores **12.4% more fuel efficient** than smaller rigs, maintaining 98% SLA score indices.';
      } else {
        reply = language === 'PT'
          ? '💡 **DICA DO SUPPLYX COPILOT:**\nExperimente me perguntar sobre: \n- *"Qual o risco de atraso no Corredor de Tete?"*\n- *"Como rebalancear meus estoques do Armazém?"*\n- *"Qual a combinação de frota mais barata para 30 Toneladas?"*'
          : '💡 **CO-PILOT CONTEXT TIP:**\nTry asking me about:\n- *"Evaluate the delay risk on Tete Corridor"* \n- *"How can I optimize the fleet and distribution of stock?"* \n- *"Generate a cost-optimized match configuration for 30 Tons"*';
      }

      setAssistantChat(prev => [...prev, { role: 'assistant', text: reply }]);
    }, 1000);
  };

  const executeMatcherSimulation = () => {
    setIsMatchingLoading(true);
    setMatchResponse(null);

    setTimeout(() => {
      const isCoal = targetCargoType === 'Minerals/Solid';
      const score = 98;
      const optimizedCost = Math.round(targetWeight * 3100 + targetVolume * 400);
      const suggestedTruck = drivers && drivers.length > 0 ? drivers[0].vehicle : (isCoal ? 'Rodotrem Volvo FH 540' : 'Scania Heavy Rig');
      const allocatedDriverName = drivers && drivers.length > 0 ? drivers[0].name : (language === 'PT' ? 'Aguardando Cadastro de Motoristas' : 'Waiting for Driver Registration');
      
      setMatchResponse({
        score,
        suggestedTruck,
        driver: allocatedDriverName,
        price: `${optimizedCost.toLocaleString('pt-BR')} MZN`,
        efficiencyPercent: 12.8,
        capacityRatio: `${Math.round((targetWeight/32)*100)}% de Capacidade`
      });
      setIsMatchingLoading(false);
    }, 1200);
  };

  // Compute stats metrics dynamically
  const totalRequestsCount = (requests || []).length;
  const activeRequestsCount = (requests || []).filter(r => r && !['Entregue', 'Cancelado'].includes(r.status || '')).length;
  const completedDeliveriesCount = (requests || []).filter(r => r && r.status === 'Entregue').length;
  const openOccurrencesCount = (occurrences || []).filter((o: any) => o && o.status === 'Aberta').length;
  const activeCarriersCount = drivers ? drivers.length : 3;

  const totalSpent = (requests || [])
    .filter(r => r && (r.status === 'Entregue' || r.status === 'Em trânsito'))
    .length * 82000;

  // Route Optimizer default calculator outputs
  const calculatedRouteData = ({
    'corredor-sul': {
      distance: '2.075 km',
      duration: '48h estimado',
      fuel: '620 Litros',
      risk: 'Baixo (Tempo Firme)',
      riskLevel: 'low',
      roadQuality: '84% Asfalto Regularizado',
      suggestedCarrier: 'Moz Logistics, Lda (Classificação 4.8★)',
      basePrice: 2075 * 45 
    },
    'corredor-centro': {
      distance: '1.430 km',
      duration: '34h estimado',
      fuel: '440 Litros',
      risk: 'Médio (Instabilidade de Chuvas em Tete)',
      riskLevel: 'medium',
      roadQuality: '68% Pavimento em Obras',
      suggestedCarrier: 'Fast Cargo Transportes (Classificação 4.6★)',
      basePrice: 1430 * 48 
    }
  }[selectedCorrider]) || {
    distance: '2.075 km',
    duration: '48h estimado',
    fuel: '620 Litros',
    risk: 'Baixo (Tempo Firme)',
    riskLevel: 'low',
    roadQuality: '84% Asfalto Regularizado',
    suggestedCarrier: 'Moz Logistics, Lda (Classificação 4.8★)',
    basePrice: 2075 * 45
  };

  const estimatedFreightWithWeight = Math.round(calculatedRouteData.basePrice * (1 + (cargoWeightTons - 10) * 0.04));

  return (
    <div className="w-full max-w-full overflow-hidden space-y-8 text-left animate-in fade-in duration-300">
      
      {/* 1. TOP KPI KEYMETRICS CARD ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6 w-full max-w-full">
        {[
          {
            title: t.allOrders,
            value: totalRequestsCount.toString(),
            sub: language === 'PT' ? 'Volume acumulado B2B' : 'Accumulated B2B volume',
            icon: Package,
            color: 'bg-blue-500 text-blue-500'
          },
          {
            title: t.activeOrders,
            value: activeRequestsCount.toString(),
            sub: language === 'PT' ? 'Viagens e lances ativos' : 'Trips & active items',
            icon: Truck,
            color: 'bg-amber-500 text-amber-500'
          },
          {
            title: t.completed,
            value: completedDeliveriesCount.toString(),
            sub: language === 'PT' ? 'PoDs digitais selados' : 'Digital PoDs processed',
            icon: CheckCircle2,
            color: 'bg-emerald-500 text-emerald-500'
          },
          {
            title: t.incidents,
            value: openOccurrencesCount.toString(),
            sub: openOccurrencesCount > 0 ? `${openOccurrencesCount} alertas ativos` : 'Operação 100% normal',
            subColor: openOccurrencesCount > 0 ? 'text-red-400 font-black' : 'text-zinc-500',
            icon: AlertTriangle,
            color: 'bg-red-500 text-red-500'
          },
          {
            title: t.carriers,
            value: `${activeCarriersCount} Frotas`,
            sub: language === 'PT' ? 'Controle de motoristas' : 'Drivers database tracked',
            icon: Star,
            color: 'bg-indigo-500 text-indigo-500'
          },
          {
            title: t.performance,
            value: '97.2%',
            sub: language === 'PT' ? 'Acima do SLA acordado' : 'Exceeding target metric',
            icon: TrendingUp,
            color: 'bg-teal-500 text-teal-500'
          }
        ].map((item, idx) => {
          const Icon = item.icon;
          const handleKpiRedirect = () => {
            if (item.title === t.allOrders || item.title === t.activeOrders || item.title === t.completed) {
              setActiveSubTab?.('requests_list');
            } else if (item.title === t.incidents) {
              setActiveInnerTab('logs');
            } else if (item.title === t.carriers) {
              setActiveSubTab?.('drivers');
            } else if (item.title === t.performance) {
              setActiveSubTab?.('financial');
            }
          };

          return (
            <button 
              key={idx} 
              onClick={handleKpiRedirect}
              className={`p-5 rounded-[24px] border text-left transition-all hover:scale-[1.02] active:scale-[0.98] group cursor-pointer focus:outline-none focus:ring-1 focus:ring-supplyx-blue/35 w-full ${
                isDarkMode 
                  ? 'bg-zinc-900 border-white/5 hover:border-supplyx-blue/30 shadow-2xl hover:bg-zinc-900/80' 
                  : 'bg-white border-zinc-100 hover:border-supplyx-blue/35 shadow-sm hover:bg-zinc-50'
              }`}
            >
              <div className="flex items-center justify-between mb-3 w-full">
                <p className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">
                  {item.title}
                </p>
                <div className={`p-2 rounded-xl bg-opacity-10 ${item.color.split(' ')[0]}`}>
                  <Icon className={`w-3.5 h-3.5 ${item.color.split(' ')[1]}`} />
                </div>
              </div>

              <h3 className={`text-xl sm:text-2xl font-black italic tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                {item.value}
              </h3>
              <p className={`text-[8px] font-bold uppercase tracking-widest mt-1 ${item.subColor ? item.subColor : 'text-zinc-500'}`}>
                {item.sub}
              </p>

              <div className="mt-2.5 pt-2 border-t border-white/[0.03] flex justify-between items-center text-[7.5px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-supplyx-blue transition-colors w-full">
                <span>{language === 'PT' ? 'Abrir Área 🔗' : 'Open Link 🔗'}</span>
                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 2. ENTERPRISE SYSTEM SUB-MENU */}
      <div className={`p-1.5 rounded-[24px] border flex flex-wrap gap-1.5 ${
        isDarkMode ? 'bg-zinc-950/60 border-white/5 shadow-inner' : 'bg-zinc-100/80 border-zinc-200'
      }`}>
        {[
          { tab: 'overview', label: t.overviewTab, desc: 'Analytics & Rotas', icon: TrendingUp },
          { tab: 'control_tower', label: t.controlTowerTab, desc: 'Mapa Logístico GPS', icon: Navigation2 },
          { tab: 'carrier_matching', label: t.matchingTab, desc: 'Intelligent Match AI', icon: Sparkles },
          { tab: 'fleet', label: t.fleetTab, desc: 'Métricas de Veículos', icon: Truck },
          { tab: 'warehouses', label: t.warehouseTab, desc: 'Controle de Hubs', icon: Building },
          { tab: 'logs', label: t.logsTab, desc: 'Barramento de Eventos', icon: Layers },
          { tab: 'ai_assistant', label: t.aiAssistantTab, desc: 'Predictive Analyst', icon: Sparkles }
        ].map((item) => {
          const isSel = activeInnerTab === item.tab;
          const SubIcon = item.icon;
          return (
            <button
              key={item.tab}
              onClick={() => setActiveInnerTab(item.tab as any)}
              className={`flex-1 min-w-[130px] px-3.5 py-3 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all border ${
                isSel
                  ? 'bg-supplyx-blue text-white border-supplyx-blue/30 shadow-lg shadow-supplyx-blue/15'
                  : isDarkMode
                    ? 'bg-zinc-900/40 border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900'
                    : 'bg-white border-zinc-150 text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <SubIcon className={`w-3 h-3 ${isSel ? 'text-white' : 'text-zinc-500'}`} />
                <span className="text-[9.5px] font-black uppercase tracking-wider">{item.label}</span>
              </div>
              <span className={`text-[7.5px] font-extrabold uppercase ${isSel ? 'text-blue-200' : 'text-zinc-500'}`}>{item.desc}</span>
            </button>
          );
        })}
      </div>

      {/* 3. TRANSITION RENDERING CONTENT */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeInnerTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.2 }}
        >
          
          {/* TAB 1: COCKPIT OVERVIEW (Analytics & route estimation & request list) */}
          {activeInnerTab === 'overview' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Trend Area Chart (Cost vs Weight) */}
                <div className={`lg:col-span-2 p-6 sm:p-8 rounded-[32px] border ${
                  isDarkMode ? 'bg-zinc-900 border-white/5 shadow-2xl' : 'bg-white border-zinc-100 shadow-sm'
                }`}>
                  <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-supplyx-blue flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        {language === 'PT' ? 'Fluxo Histórico de Fretes' : 'Historical Freight Spend'}
                      </h3>
                      <p className="text-[9px] font-semibold text-zinc-500 mt-0.5 uppercase tracking-widest">
                        {language === 'PT' ? 'Evolução mensal de investimentos corporativos' : 'Monthly aggregated logistics investments'}
                      </p>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                      Média: MT 500k
                    </span>
                  </div>

                  <div className="w-full min-w-0 h-[240px] overflow-hidden">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData} margin={{ left: -10, right: 10, top: 10, bottom: 5 }}>
                        <defs>
                          <linearGradient id="gradientCost" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis 
                          dataKey="month" 
                          stroke="#52525b" 
                          fontSize={10} 
                          fontFamily="monospace"
                          tickLine={false} 
                        />
                        <YAxis 
                          stroke="#52525b" 
                          fontSize={8} 
                          fontFamily="monospace"
                          tickLine={false}
                          tickFormatter={(val) => `MT ${val/1000}k`}
                        />
                        <Tooltip 
                          contentStyle={{
                            background: '#09090b',
                            borderColor: 'rgba(255,255,255,0.08)',
                            borderRadius: '16px',
                            fontSize: '11px',
                            color: '#fff'
                          }}
                          formatter={(value: any) => [`MT ${value.toLocaleString()}`, 'Investimento']}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="cost" 
                          stroke="#3b82f6" 
                          strokeWidth={3} 
                          fillOpacity={1} 
                          fill="url(#gradientCost)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Categories Distribution Pie */}
                <div className={`p-6 sm:p-8 rounded-[32px] border flex flex-col justify-between ${
                  isDarkMode ? 'bg-zinc-900 border-white/5 shadow-2xl' : 'bg-white border-zinc-100 shadow-sm'
                }`}>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-supplyx-blue mb-4">
                      {language === 'PT' ? 'Tipos de Cargas Comuns' : 'Freight Category Share'}
                    </h3>
                    
                    <div className="w-full min-w-0 h-[140px] flex items-center justify-center relative my-4 overflow-hidden">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={65}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {categoryData.map((entry, idx) => (
                              <Cell key={`cell-${idx}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute text-center select-none">
                        <p className="text-xs font-black text-white italic">SupplyX</p>
                        <p className="text-[7px] text-zinc-500 font-bold uppercase tracking-widest leading-none">Cargas</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mt-2">
                    {categoryData.map((cat, i) => (
                      <div key={i} className="flex items-center justify-between text-[10px] pb-1 border-b border-white/[0.03]">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                          <span className="text-zinc-400 font-bold truncate max-w-[140px]">{cat.name}</span>
                        </div>
                        <span className="text-white font-black">{cat.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* INTEGRATED INNER ROUTE OPTIMIZER */}
              <div className={`p-6 sm:p-8 rounded-[40px] border relative overflow-hidden transition-all ${
                isDarkMode ? 'bg-zinc-950 border-white/5 shadow-2xl' : 'bg-white border-zinc-100 shadow-sm'
              }`}>
                <div className="absolute right-0 top-0 w-80 h-80 bg-supplyx-blue/15 rounded-full filter blur-[100px] pointer-events-none" />
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 text-white shadow-xl shadow-blue-500/20">
                      <Sparkles className="w-5 h-5 fill-white animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-white leading-none">
                        {language === 'PT' ? 'IA Logística - Otimizador de Rotas de Frete' : 'Logistics Smart Route Simulator'}
                      </h3>
                      <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest leading-none mt-2">
                        {language === 'PT' ? 'Cálculo de tarifas, delay climático e trajetos meteorológicos integrados' : 'AI-driven tariff estimation & meteo delay metrics'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsSimulatorExpanded(!isSimulatorExpanded)}
                    className="px-4 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white border border-white/5 text-[9.5px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 self-start sm:self-auto"
                  >
                    {isSimulatorExpanded 
                      ? (language === 'PT' ? 'Recolher Simulador ▲' : 'Collapse Simulator ▲') 
                      : (language === 'PT' ? 'Expandir Simulador ▼' : 'Expand Simulator ▼')}
                  </button>
                </div>

                {isSimulatorExpanded && (
                  <div className="mt-8 pt-6 border-t border-white/5 space-y-8 animate-in fade-in duration-300">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Variáveis Computacionais de Simulação:</p>
                      
                      {/* Selector Corridor Switcher Links */}
                      <div className="flex gap-1.5 p-1 bg-zinc-900 rounded-xl border border-white/5 shadow-inner">
                        <button
                          onClick={() => setSelectedCorridor('corredor-sul')}
                          className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all select-none ${
                            selectedCorrider === 'corredor-sul'
                              ? 'bg-supplyx-blue text-white shadow-md'
                              : 'text-zinc-500 hover:text-white'
                          }`}
                        >
                          Corredor Sul: Via Beira
                        </button>
                        <button
                          onClick={() => setSelectedCorridor('corredor-centro')}
                          className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all select-none ${
                            selectedCorrider === 'corredor-centro'
                              ? 'bg-supplyx-blue text-white shadow-md'
                              : 'text-zinc-500 hover:text-white'
                          }`}
                        >
                          Rota Rápida: Tete Bypass
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Simulation variables column */}
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <div>
                            <label className="flex justify-between text-[9px] font-black uppercase text-zinc-500 tracking-wider mb-2">
                              <span>Peso da Carga Alvo:</span>
                              <span className="text-white font-mono">{cargoWeightTons} Toneladas</span>
                            </label>
                            <input 
                              type="range" 
                              min={1} 
                              max={45} 
                              value={cargoWeightTons} 
                              onChange={(e) => setCargoWeightTons(parseInt(e.target.value, 10))} 
                              className="w-full h-1.5 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-supplyx-blue"
                            />
                            <div className="flex justify-between text-[7.5px] font-bold text-zinc-500 mt-1 uppercase">
                              <span>Leve (1-5 Tons)</span>
                              <span>Pesado (35+ Tons)</span>
                            </div>
                          </div>

                          <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/5 space-y-3.5">
                            <div className="flex justify-between text-[9px] font-black uppercase text-zinc-500 tracking-wider">
                              <span>Diagnóstico do Porto Matola:</span>
                              <span className="text-amber-400">Gargalo Moderado</span>
                            </div>
                            <div className="flex justify-between text-[9px] font-black uppercase text-zinc-500 tracking-wider">
                              <span>Precipitação Esperada:</span>
                              <span className="text-emerald-400">Risco Quase Nulo</span>
                            </div>
                            <div className="flex justify-between text-[9px] font-black uppercase text-zinc-500 tracking-wider">
                              <span>Taxa de Seguro Padrão:</span>
                              <span className="text-teal-400">0.05% Ad Valorem</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Simulation results column */}
                      <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-3xl bg-zinc-900/60 border border-white/5">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-1">
                            ⚙️ Otimização Dinâmica:
                          </p>
                          
                          <div className="space-y-3">
                            {[
                              { label: 'Distância Projetada', val: calculatedRouteData.distance, color: 'text-white' },
                              { label: 'Duração Logística Estimada', val: calculatedRouteData.duration, color: 'text-supplyx-blue' },
                              { label: 'Consumo Previsto Fóssil', val: calculatedRouteData.fuel, color: 'text-zinc-350' },
                              { label: 'Pontuação de Rodovia', val: calculatedRouteData.roadQuality, color: 'text-zinc-350' },
                              { 
                                label: 'Previsão de Condições & Risco', 
                                val: calculatedRouteData.risk, 
                                color: calculatedRouteData.riskLevel === 'low' ? 'text-emerald-400' : 'text-amber-400' 
                              }
                            ].map((item, i) => (
                              <div key={i} className="flex justify-between items-center text-xs pb-1 border-b border-white/[0.02]">
                                <span className="font-bold text-zinc-500 uppercase tracking-widest text-[8.5px]">{item.label}</span>
                                <span className={`font-black text-right ${item.color}`}>{item.val}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col justify-between">
                          <div className="space-y-1 mt-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                              AUTO-MATCH SUGERIDO PELO ALGORITMO:
                            </p>
                            <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 mt-2">
                              <p className="text-[11px] font-black text-white truncate italic flex items-center gap-1">
                                🎯 {calculatedRouteData.suggestedCarrier}
                              </p>
                              <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mt-1">
                                Melhor custo-tempo-reputação index
                              </p>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-white/5">
                            <span className="text-[10px] font-black uppercase text-zinc-500">Tarifa Estimada Inteligente:</span>
                            <div className="flex items-baseline gap-2 mt-1">
                              <h4 className="text-xl sm:text-2xl font-black text-emerald-400 italic">
                                MT {estimatedFreightWithWeight.toLocaleString('pt-BR')}
                              </h4>
                              <span className="text-[9px] font-bold text-zinc-500 uppercase">MZN NET</span>
                            </div>
                            <p className="text-[8px] text-zinc-500 font-bold mt-1 uppercase">Fração Baseada em Cubagem + Peso de {cargoWeightTons}T</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ACTIVE CARGO LIST TABLE */}
              <div className={`p-8 rounded-[40px] border ${
                isDarkMode ? 'bg-zinc-900 border-white/5 shadow-2xl' : 'bg-white border-zinc-100 shadow-sm'
              }`}>
                <div className="flex justify-between items-center mb-6 pb-2">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">
                      {language === 'PT' ? 'Dossiês de Monitoração Ativos' : 'Operational Cargo Fleet Tracker'}
                    </h3>
                    <p className="text-[9px] font-semibold text-zinc-500 mt-1 uppercase tracking-widest leading-none">
                      Acompanhamento de coletas, trajetos rodoviários e lances abertos
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-[8.5px] font-black uppercase text-zinc-500 tracking-widest">
                        <th className="pb-3.5 pl-2">ID</th>
                        <th className="pb-3.5">Carga</th>
                        <th className="pb-3.5">Rota (Origem ➔ Destino)</th>
                        <th className="pb-3.5">Tonnage / Cubagem</th>
                        <th className="pb-3.5">Status</th>
                        <th className="pb-3.5 pr-2 text-right">Acções</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                      {(requests || []).slice(0, 5).map((req) => (
                        <tr key={req.id} className="text-xs font-semibold hover:bg-white/[0.01] transition-colors group">
                          <td className="py-4 pl-2 font-mono text-supplyx-blue font-bold">#{req.id}</td>
                          <td className="py-4">
                            <p className="font-bold text-white italic">{req.tipoCarga}</p>
                            <p className="text-[8.5px] font-black text-zinc-400 capitalize tracking-wide mt-0.5">
                              {language === 'PT' ? 'Solicitante:' : 'Requester:'} <span className="text-white font-bold">{req.requesterName || (req.requester === 'Client' ? (language === 'PT' ? 'Cliente' : 'Client') : (language === 'PT' ? 'Fornecedor' : 'Supplier'))}</span>
                            </p>
                          </td>
                          <td className="py-4 font-bold text-zinc-300">
                            <div className="flex items-center gap-2">
                              <span className="truncate max-w-[120px]">{(req.origem || '').split(',')[0] || ''}</span>
                              <ChevronRight className="w-3 h-3 text-zinc-500" />
                              <span className="truncate max-w-[120px] font-black text-white">{(req.destino || '').split(',')[0] || ''}</span>
                            </div>
                          </td>
                          <td className="py-4">
                            <p className="text-white font-mono">{req.peso}</p>
                            <p className="text-[7.5px] text-zinc-500 uppercase font-bold">{req.volume || 'S/D'}</p>
                          </td>
                          <td className="py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                              req.status === 'Entregue'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : ['Em trânsito', 'Em Transporte', 'Em rota'].includes(req.status || '')
                                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse'
                                  : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            }`}>
                              {req.status}
                            </span>
                          </td>
                          <td className="py-4 pr-2 text-right">
                            <button 
                              onClick={() => onSelectRequest(req.id)}
                              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-wider text-zinc-400 hover:text-white hover:bg-supplyx-blue hover:border-supplyx-blue transition-all"
                            >
                              Configuração Ativa
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INTERACTIVE LOGISTICS CONTROL TOWER & GPS MAP */}
          {activeInnerTab === 'control_tower' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* 2.1 Interactive Map Simulator */}
                <div className={`xl:col-span-2 p-6 sm:p-8 rounded-[32px] border ${
                  isDarkMode ? 'bg-zinc-900 border-white/5 shadow-2xl' : 'bg-white border-zinc-100 shadow-sm'
                }`}>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-supplyx-blue flex items-center gap-2">
                        <Navigation2 className="w-4 h-4 text-supplyx-blue rotate-45" />
                        {language === 'PT' ? 'Rastreamento GPS Rodoviário Ativo' : 'Live Highway Fleet Tracking Tower'}
                      </h3>
                      <p className="text-[9px] font-semibold text-zinc-500 mt-1 uppercase tracking-widest leading-none">
                        Geolocalização on-chain em tempo real de veículos no corredor norte-sul
                      </p>
                    </div>

                    <div className="flex gap-1.5 items-center">
                      <button
                        onClick={() => setIsPlayingTelemetry(!isPlayingTelemetry)}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border ${
                          isPlayingTelemetry ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        }`}
                      >
                        {isPlayingTelemetry ? '⏸︎ Pausar GPS' : '▶ Simular GPS'}
                      </button>
                      <span className="text-[8.5px] font-mono text-zinc-500 font-black">Frame: {telemetryTime}%</span>
                    </div>
                  </div>

                  {/* HIGH FIDELITY GEOGRAPHICAL MAP VECTOR REPRESENTATION */}
                  <div className="relative w-full h-[360px] bg-zinc-950 rounded-2xl border border-white/5 overflow-hidden flex items-center justify-center">
                    {/* Atmospheric ambient lines */}
                    <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
                    
                    {/* SVG Map Path Overlay */}
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 400" preserveAspectRatio="none">
                      {/* Corredor Sul highway line */}
                      <path 
                        d="M 150 360 Q 250 240 380 200 T 650 80" 
                        fill="none" 
                        stroke="#27272a" 
                        strokeWidth="3.5" 
                        strokeDasharray="6 4"
                      />
                      <path 
                        d="M 150 360 Q 250 240 380 200 T 650 80" 
                        fill="none" 
                        stroke="#3b82f6" 
                        strokeWidth="1.5" 
                        strokeOpacity="0.8"
                        strokeDasharray="200 400"
                        strokeDashoffset={-telemetryTime * 4}
                      />

                      {/* Corredor Centro line */}
                      <path 
                        d="M 150 360 L 220 220 L 310 120"
                        fill="none"
                        stroke="#27272a"
                        strokeWidth="2"
                      />

                      {/* Map connection node cities */}
                      <circle cx="150" cy="360" r="6" fill="#10b981" /> {/* Maputo */}
                      <circle cx="280" cy="220" r="4.5" fill="#f59e0b" /> {/* Beira */}
                      <circle cx="220" cy="220" r="4.5" fill="#a855f7" /> {/* Tete */}
                      <circle cx="500" cy="130" r="4.5" fill="#3b82f6" /> {/* Nampula */}
                      <circle cx="650" cy="80" r="6" fill="#3b82f6" />  {/* Nacala */}
                    </svg>

                    {/* Interactive Animated Marker Trucks over path coordinates */}
                    {trucksList.map((trObj, idx) => {
                      // Interpolate truck position dynamically on layout based on telemetry state
                      const progressFactor = ((telemetryTime + (idx * 33)) % 100) / 100;
                      
                      // Custom mock positions on high-fidelity map
                      let leftOffset = '22%';
                      let topOffset = '65%';
                      if (idx === 0) {
                        leftOffset = `${15 + progressFactor * 60}%`;
                        topOffset = `${35 - progressFactor * 25}%`;
                      } else if (idx === 1) {
                        leftOffset = `${28 + progressFactor * 20}%`;
                        topOffset = `${55 - progressFactor * 18}%`;
                      } else {
                        leftOffset = `${18 + progressFactor * 40}%`;
                        topOffset = `${75 - progressFactor * 45}%`;
                      }

                      const isSel = selectedTruckId === trObj.id;

                      return (
                        <button
                          key={trObj.id}
                          onClick={() => setSelectedTruckId(trObj.id)}
                          style={{ left: leftOffset, top: topOffset }}
                          className={`absolute -translate-x-1/2 -translate-y-1/2 p-2 rounded-xl border flex items-center justify-center gap-1.5 shadow-2.5xl transition-all ${
                            isSel 
                              ? 'bg-supplyx-blue text-white border-white ring-4 ring-supplyx-blue/30 z-30 scale-110' 
                              : 'bg-zinc-900 text-zinc-300 border-white/10 hover:border-white/30 z-10'
                          }`}
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span className="text-[8.5px] font-black tracking-tight font-mono">{trObj.id}</span>
                        </button>
                      );
                    })}

                    {/* Georeferenced floating indicators labels */}
                    <div className="absolute left-[130px] bottom-[15px] text-[8.5px] font-black uppercase text-zinc-500 tracking-wider">Maputo (Matola WH)</div>
                    <div className="absolute left-[295px] bottom-[155px] text-[8.5px] font-black uppercase text-zinc-500 tracking-wider">Beira Port (WH-02)</div>
                    <div className="absolute left-[180px] top-[195px] text-[8.5px] font-black uppercase text-zinc-400 tracking-wider">Moatize Tete</div>
                    <div className="absolute right-[190px] top-[110px] text-[8.5px] font-black uppercase text-zinc-500 tracking-wider">Nampula Junction</div>
                    <div className="absolute right-[50px] top-[95px] text-[8.5px] font-black uppercase text-zinc-400 tracking-wider">Nacala Port (WH-03)</div>
                  </div>
                </div>

                {/* 2.2 Live Selected Vehicle Detailed Metrics Telemetry Column */}
                <div className="space-y-6">
                  {(() => {
                    const activeTruck = trucksList.find(t => t.id === selectedTruckId) || trucksList[0];
                    return (
                      <div className={`p-6 rounded-[32px] border h-full justify-between flex flex-col ${
                        isDarkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-100 shadow-sm'
                      }`}>
                        <div>
                          <div className="flex items-center justify-between pb-3.5 border-b border-white/5 mb-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Métricas Telemétricas Ativas</span>
                            <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              ONLINE
                            </span>
                          </div>

                          <div className="bg-zinc-950/60 p-4 rounded-2xl border border-white/5 space-y-3 mb-6">
                            <p className="text-[10px] font-black text-white italic">{activeTruck.name}</p>
                            <p className="text-[8.5px] text-zinc-500 font-extrabold uppercase tracking-widest">{activeTruck.route}</p>
                            
                            <div className="grid grid-cols-2 gap-3.5 pt-2">
                              <div className="p-2.5 bg-zinc-900 border border-white/5 rounded-xl">
                                <p className="text-[7.5px] text-zinc-500 uppercase font-bold tracking-widest">Velocidade</p>
                                <p className="text-sm font-black text-white italic mt-1">{activeTruck.speed}</p>
                              </div>
                              <div className="p-2.5 bg-zinc-900 border border-white/5 rounded-xl">
                                <p className="text-[7.5px] text-zinc-500 uppercase font-bold tracking-widest">Combustível</p>
                                <p className="text-sm font-black text-white italic mt-1">{activeTruck.fuel}</p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3.5">
                            <p className="text-[9.5px] font-black uppercase tracking-widest text-zinc-400">Escaneamento Adicional:</p>
                            
                            {[
                              { label: 'Temperatura do Motor', value: activeTruck.temp },
                              { label: 'Payload Atualizado', value: activeTruck.payload },
                              { label: 'Status da Operação', value: activeTruck.status, color: activeTruck.status === 'Normal' ? 'text-emerald-400' : 'text-amber-400 font-black' },
                              { label: 'Sincronização Escrow', value: 'Assegurada on-chain', color: 'text-supplyx-blue' }
                            ].map((row, idx) => (
                              <div key={idx} className="flex justify-between items-center text-xs pb-1.5 border-b border-white/[0.03]">
                                <span className="text-[8.5px] font-bold text-zinc-500 uppercase tracking-widest">{row.label}</span>
                                <span className={`font-black text-right ${row.color || 'text-white'}`}>{row.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="pt-6 border-t border-white/5 mt-6">
                          <button
                            onClick={() => {
                              alert(language === 'PT' ? 'Canal de Voz direto estabelecido com o motorista!' : 'Direct voice audio channel established with fleet driver!');
                            }}
                            className="w-full py-3 rounded-xl bg-supplyx-blue text-white text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-supplyx-blue/90"
                          >
                            <Activity className="w-3.5 h-3.5 animate-pulse" />
                            {language === 'PT' ? 'Estabelecer Conexão IP' : 'Secure IP Com Link'}
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>

              </div>

              {/* CRITICAL SECURITY CENTER AND ALERTS TIMELINE */}
              <div className={`p-6 sm:p-8 rounded-[32px] border ${
                isDarkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-100 shadow-sm'
              }`}>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h4 className="text-xs font-black uppercase text-white tracking-widest">Torre de Controle de Alertas Críticos</h4>
                    <p className="text-[8.5px] font-bold text-zinc-500 uppercase mt-1 tracking-widest">Monitoramento de anormalidades operacionais estimadas por IA</p>
                  </div>
                  <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[
                    { type: 'danger', loc: 'Moatize Vale', title: 'Meteorologia Severa', text: 'Precipitações fortes podem atrasar tempo de coleta em Tete por até 3.4h.', time: '12 min atrás' },
                    { type: 'warning', loc: 'Sul EN1 Bypass', title: 'Velocidade Reduzida', text: 'Volvo FH 540 viajou a 24km/h devido ao trânsito denso em Xai-Xai.', time: '35 min atrás' },
                    { type: 'info', loc: 'Beira Port WH-02', title: 'Capacidade Limite', text: 'Volume de estocagem de minerais excederá 85% no próximo turno.', time: '1h atrás' }
                  ].map((alert, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-zinc-950/40 border border-white/5 relative overflow-hidden flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center mb-2.5">
                          <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase ${
                            alert.type === 'danger' ? 'bg-red-500/10 text-red-400 border border-red-500/10' :
                            alert.type === 'warning' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/10' :
                            'bg-blue-500/10 text-blue-400 border border-blue-500/10'
                          }`}>
                            {alert.title}
                          </span>
                          <span className="text-[8.5px] font-mono text-zinc-500 font-extrabold">{alert.loc}</span>
                        </div>
                        <p className="text-[11px] font-bold text-zinc-300 mt-2">{alert.text}</p>
                      </div>
                      <span className="text-[8px] text-zinc-500 font-black uppercase mt-4 block text-right">{alert.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INTELLIGENT CARRIER MATCHING */}
          {activeInnerTab === 'carrier_matching' && (
            <div className={`p-8 rounded-[40px] border relative overflow-hidden ${
              isDarkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-100 shadow-sm'
            }`}>
              <div className="absolute right-0 top-0 w-80 h-80 bg-supplyx-blue/15 rounded-full filter blur-[120px] pointer-events-none" />
              
              <div className="flex items-center gap-3.5 mb-8 pb-4 border-b border-white/5">
                <Sparkles className="w-5 h-5 text-supplyx-blue fill-supplyx-blue animate-pulse" />
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white leading-none">
                    Intelligent Carrier Matching Pro-Engine
                  </h3>
                  <p className="text-[9px] font-semibold text-zinc-500 mt-1 uppercase tracking-widest leading-none">
                    Selecão automática de veículos pesados baseando-se em cubagem, peso e conformidade SLA
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Configuration form column */}
                <div className="space-y-6 bg-zinc-950/50 p-6 rounded-2xl border border-white/5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5 leading-none mb-4">
                    <Sliders className="w-3.5 h-3.5 text-zinc-500" />
                    Parâmetros da Carga B2B
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[8.5px] font-black uppercase text-zinc-550 text-zinc-500 tracking-wider mb-2">Peso Estimado da Mercadoria</label>
                      <input 
                        type="number" 
                        value={targetWeight} 
                        onChange={(e) => setTargetWeight(parseFloat(e.target.value) || 12)}
                        className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-2 text-xs font-bold text-white font-mono"
                        placeholder="Ex: 25 (Toneladas)"
                      />
                    </div>
                    <div>
                      <label className="block text-[8.5px] font-black uppercase text-zinc-550 text-zinc-500 tracking-wider mb-2">Volume Total (m³)</label>
                      <input 
                        type="number" 
                        value={targetVolume} 
                        onChange={(e) => setTargetVolume(parseFloat(e.target.value) || 20)}
                        className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-2 text-xs font-bold text-white font-mono"
                        placeholder="Ex: 38 (m³)"
                      />
                    </div>
                    <div>
                      <label className="block text-[8.5px] font-black uppercase text-zinc-550 text-zinc-500 tracking-wider mb-2">Categoria de Materiais</label>
                      <select
                        value={targetCargoType}
                        onChange={(e) => setTargetCargoType(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-2 text-xs font-bold text-white uppercase tracking-wider"
                      >
                        <option value="Minerals/Solid">Minério Sólido Ensaco / Granel</option>
                        <option value="Combustíveis">Combustíveis / Inflamáveis (Classe A)</option>
                        <option value="Construção">Materiais de Construção Civil</option>
                      </select>
                    </div>

                    <div className="pt-4">
                      <button
                        onClick={executeMatcherSimulation}
                        disabled={isMatchingLoading}
                        className="w-full py-3.5 rounded-xl bg-supplyx-blue text-white text-[10px] font-black uppercase tracking-wider hover:bg-supplyx-blue/90 font-black transition-all"
                      >
                        {isMatchingLoading ? '⏳ Computando Alocação Ótima...' : '🤖 Rodar Algoritmo Match Inteligente'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Match simulation output result column */}
                <div className="lg:col-span-2 space-y-6">
                  {matchResponse ? (
                    <div className="p-6 rounded-3xl bg-zinc-950/80 border border-white/5 space-y-6 animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex justify-between items-center pb-4 border-b border-white/5">
                        <div className="flex items-center gap-2">
                          <span className="p-2.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black">
                            {matchResponse.score}% Match Score
                          </span>
                          <span className="text-[10px] font-black text-white italic">Alocação Ótima Resolvida!</span>
                        </div>
                        <span className="text-[8.5px] font-black text-zinc-500 uppercase tracking-widest">SLA GARANTIDO</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-450 text-zinc-400">Dados do Veículo Alocado Inteligente:</p>
                          
                          <div className="space-y-2">
                            {[
                              { label: 'Veículo Sugerido', val: matchResponse.suggestedTruck, style: 'text-white' },
                              { label: 'Motorista do Quadro', val: matchResponse.driver, style: 'text-white font-black italic' },
                              { label: 'Razão de Ocupação', val: matchResponse.capacityRatio, style: 'text-supplyx-blue' },
                              { label: 'Configuração dos Eixos', val: 'Pesado Rodoviário LS 6x2', style: 'text-zinc-400' }
                            ].map((row, idx) => (
                              <div key={idx} className="flex justify-between items-center text-xs pb-1.5 border-b border-white/[0.03]">
                                <span className="text-[8.5px] font-bold text-zinc-500 uppercase tracking-widest">{row.label}</span>
                                <span className={`font-black text-right ${row.style}`}>{row.val}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col justify-between p-4 bg-zinc-900 rounded-2xl border border-white/5 relative overflow-hidden">
                          <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/10 rounded-full filter blur-[40px]" />
                          
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-450 text-zinc-450 text-zinc-500">Tarifa Dinâmica Otimizada Escrow:</p>
                            <h4 className="text-2xl font-black text-emerald-400 italic mt-1">{matchResponse.price}</h4>
                            <p className="text-[7.5px] text-zinc-500 font-extrabold uppercase mt-1">Acordo Comercial Net com Seguro</p>
                          </div>

                          <div className="pt-4 border-t border-white/5 mt-4">
                            <p className="text-[8.5px] text-emerald-400 font-black uppercase tracking-widest flex items-center gap-1">
                              💎 Economia calculada: {matchResponse.efficiencyPercent}% em relação a frotas externas
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row justify-between gap-3">
                        <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest max-w-sm">
                          Termos de Compromisso: O aceite desse Match retém os valores temporariamente sob custódia on-chain. O motorista recebe de forma instantânea na conta vinculada após aprovação digital do Recebimento.
                        </p>
                        
                        <button
                          onClick={() => {
                            alert(language === 'PT' ? 'Fretador e Motorista Contratados e Notificados em tempo-real via Mobile SupplyX!' : 'Carrier and vehicle successfully matched and notified in real-time on Mobile SupplyX app!');
                            setMatchResponse(null);
                          }}
                          className="px-6 py-2 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white text-[10px] font-black uppercase tracking-wider hover:scale-[1.01] transition-all"
                        >
                          ✓ Confirmar Match e Selar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full min-h-[220px] rounded-3xl border border-dashed border-white/10 flex flex-col items-center justify-center p-6 text-center text-zinc-500">
                      <Sparkles className="w-10 h-10 text-zinc-700 mb-3 animate-pulse" />
                      <p className="text-xs font-black uppercase tracking-widest text-zinc-450 text-zinc-400">Pronto para simulação de frete</p>
                      <p className="text-[9px] font-semibold text-zinc-600 uppercase tracking-widest mt-1 max-w-xs leading-normal">
                        Preencha as variáveis de peso e cubagem e acione o recomendador de conformidade B2B
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FLEET MANAGEMENT SYSTEM */}
          {activeInnerTab === 'fleet' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 4.1 Drivers list and driving scores status */}
                <div className={`p-6 sm:p-8 rounded-[32px] border lg:col-span-2 ${
                  isDarkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-100 shadow-sm'
                }`}>
                  <div className="flex justify-between items-center pb-4 border-b border-white/5 mb-6">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-supplyx-blue flex items-center gap-1.5">
                        <Truck className="w-4 h-4" />
                        Status Operacional de Frotas Pesadas
                      </h4>
                      <p className="text-[8.5px] font-bold text-zinc-500 uppercase mt-1 tracking-widest">
                        Consumo de combustível fóssil e pontuação de governança e segurança
                      </p>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400">
                      Metas: A+ 92%
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {drivers && drivers.length > 0 ? (
                      drivers.map((fleetItem) => (
                        <div key={fleetItem.id} className="p-4 rounded-2xl bg-zinc-950/40 border border-white/5 space-y-4">
                          <div className="flex justify-between items-center pb-2 border-b border-white/[0.03]">
                            <span className="text-[11px] font-black text-white italic">{fleetItem.vehicle}</span>
                            <span className="text-[8.5px] font-mono text-zinc-500 font-extrabold">{fleetItem.licenseId}</span>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <span className="text-[8.5px] text-zinc-500 uppercase tracking-widest">Motorista</span>
                              <span className="font-extrabold text-zinc-300">{fleetItem.name}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-[8.5px] text-zinc-500 uppercase tracking-widest">Capacidade</span>
                              <span className="font-extrabold font-mono text-white">{fleetItem.capacity}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-[8.5px] text-zinc-550 text-zinc-500 uppercase tracking-widest">Localização</span>
                              <span className="font-black text-emerald-400 font-mono text-[10px]">{fleetItem.location}</span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-white/[0.03] flex justify-between items-center">
                            <span className={`px-2 py-0.5 rounded text-[7.5px] font-black uppercase ${
                              fleetItem.status === 'Disponível' || fleetItem.status === 'Available' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              fleetItem.status === 'Em Trânsito' || fleetItem.status === 'In Transit' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/10 animate-pulse' :
                              'bg-zinc-500/10 text-zinc-400 border border-white/5'
                            }`}>
                              {fleetItem.status}
                            </span>

                            <button
                              onClick={() => {
                                alert(language === 'PT' ? 'Ficha de Manutenção Preditiva aberta!' : 'Predictive maintenance log accessed!');
                              }}
                              className="px-2.5 py-1.5 rounded bg-zinc-900 border border-white/5 text-[8px] font-black uppercase text-zinc-400 hover:text-white"
                            >
                              ⚙ Log Manutenção
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="md:col-span-2 p-10 text-center bg-zinc-950/20 border border-dashed border-white/5 rounded-2xl">
                        <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Nenhuma frota ou agente logístico cadastrado por si.</p>
                        <p className="text-[9px] text-zinc-600 uppercase mt-1">Utilize a aba de Motoristas / Frotas para se cadastrar.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 4.2 Fleet Advanced Analytical Metrics */}
                <div className={`p-6 sm:p-8 rounded-[32px] border ${
                  isDarkMode ? 'bg-zinc-900 border-white/5 shadow-2xl' : 'bg-white border-zinc-100 shadow-sm'
                }`}>
                  <h4 className="text-xs font-black uppercase tracking-widest text-zinc-450 text-zinc-400 mb-6 pb-2 border-b border-white/5">
                    Eficiência de Emissão e Consumo
                  </h4>

                  <div className="space-y-6">
                    <div className="p-4 rounded-xl bg-zinc-950/60 border border-white/5 space-y-1">
                      <p className="text-[7.5px] font-bold uppercase text-zinc-500 tracking-widest">Duração média de paragem</p>
                      <p className="text-xl font-black text-white font-mono italic">34 Minutos</p>
                      <p className="text-[7px] text-zinc-500 font-extrabold uppercase mt-1 leading-none">Em conformidade regulatória</p>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-950/60 border border-white/5 space-y-1">
                      <p className="text-[7.5px] font-bold uppercase text-zinc-500 tracking-widest">Economia consolidada Co2</p>
                      <p className="text-xl font-black text-emerald-400 font-mono italic">-14.2% Toneladas</p>
                      <p className="text-[7px] text-zinc-500 font-extrabold uppercase mt-1 leading-none">Otimizado por rotas curtas de IA</p>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-950/60 border border-white/5 space-y-1">
                      <p className="text-[7.5px] font-bold uppercase text-zinc-500 tracking-widest">Acordos SLA de Frota no SupplyX</p>
                      <p className="text-xl font-black text-supplyx-blue font-mono italic">99.1% Compliance</p>
                      <p className="text-[7px] text-zinc-500 font-extrabold uppercase mt-1 leading-none">Média contratual das transportadoras</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: WAREHOUSE DISTRIBUTION SYSTEM */}
          {activeInnerTab === 'warehouses' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* 5.1 Interactive Warehouses visual grid occupancy */}
                <div className={`xl:col-span-2 p-6 sm:p-8 rounded-[32px] border ${
                  isDarkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-100 shadow-sm'
                }`}>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5 pb-4 border-b border-white/5 mb-6">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-supplyx-blue flex items-center gap-1.5">
                        <Building className="w-4 h-4" />
                        Ocupação Física de Centros de Distribuição
                      </h4>
                      <p className="text-[8.5px] font-bold text-zinc-500 uppercase mt-1 tracking-widest">
                        Utilização cúbica e redistribuição inteligente prognóstica
                      </p>
                    </div>

                    <button
                      onClick={executeWarehouseRebalance}
                      className="px-3.5 py-1.5 rounded-lg bg-supplyx-blue text-white text-[9px] font-black uppercase tracking-wider"
                    >
                      ⚡ Rebalancear Cargas
                    </button>
                  </div>

                  {rebalanceAlert && (
                    <div className="p-3 mb-6 rounded-xl bg-amber-500/10 border border-amber-400/20 text-xs font-bold text-amber-500">
                      {rebalanceAlert}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {warehouseList.map((whItem) => {
                      const isWhSel = activeWarehouseId === whItem.id;
                      return (
                        <div 
                          key={whItem.id}
                          onClick={() => setActiveWarehouseId(whItem.id)}
                          className={`p-5 rounded-3xl border transition-all cursor-pointer ${
                            isWhSel 
                              ? 'bg-zinc-950 border-supplyx-blue shadow-lg-indigo scale-[1.02]' 
                              : 'bg-zinc-900 border-white/5 hover:border-white/20'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <span className="text-[8px] font-black tracking-widest text-zinc-550 text-zinc-500 uppercase">CD #{whItem.id.toUpperCase()}</span>
                            <span className="text-[12px] font-black text-white italic">{whItem.occupancyRate}%</span>
                          </div>

                          <h5 className="text-[11px] font-black text-zinc-200 mt-1">{whItem.name}</h5>
                          
                          <div className="w-full bg-zinc-900 border border-white/5 rounded-full h-1.5 mt-4">
                            <div 
                              className={`h-full rounded-full ${whItem.occupancyRate > 75 ? 'bg-red-500' : 'bg-supplyx-blue'}`}
                              style={{ width: `${whItem.occupancyRate}%` }}
                            />
                          </div>

                          <div className="pt-4 border-t border-white/[0.03] mt-4 space-y-1.5">
                            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Zonas Críticas de Espaço:</p>
                            {whItem.zones.map((zone: string, zIdx: number) => (
                              <p key={zIdx} className="text-[9.5px] font-extrabold text-white italic truncate">➔ {zone}</p>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* CD Selected Warehouse details */}
                {(() => {
                  const selWh = warehouseList.find(w => w.id === activeWarehouseId) || warehouseList[0];
                  return (
                    <div className={`p-6 sm:p-8 rounded-[32px] border flex flex-col justify-between ${
                      isDarkMode ? 'bg-zinc-900 border-white/5 shadow-2xl' : 'bg-white border-zinc-100 shadow-sm'
                    }`}>
                      <div>
                        <div className="pb-3 border-b border-white/5 mb-4">
                          <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">Dados Finais Consolidados CD</span>
                          <h4 className="text-[12px] font-black text-white italic mt-1">{selWh.name}</h4>
                        </div>

                        <div className="space-y-4">
                          <div className="p-3 bg-zinc-950 rounded-xl border border-white/5">
                            <p className="text-[7.5px] text-zinc-500 uppercase tracking-widest font-black">Estoque Cúbico Utilizado</p>
                            <p className="text-lg font-black font-mono text-white mt-1">{(selWh.currentTons).toLocaleString()} Tons</p>
                            <p className="text-[7px] text-zinc-500 mt-1 uppercase">De {selWh.totalTons.toLocaleString()} limitadores totais</p>
                          </div>

                          <div className="space-y-2.5">
                            <div className="flex justify-between text-xs pb-1 border-b border-white/[0.03]">
                              <span className="text-[8.5px] font-bold text-zinc-500 uppercase tracking-widest">SLA de Recepção</span>
                              <span className="font-black text-emerald-400">98.4% On-time</span>
                            </div>
                            <div className="flex justify-between text-xs pb-1 border-b border-white/[0.03]">
                              <span className="text-[8.5px] font-bold text-zinc-500 uppercase tracking-widest">Avarias internas</span>
                              <span className="font-black text-zinc-300">0.02% ad var</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-[8.5px] font-bold text-zinc-500 uppercase tracking-widest">Empilhamento Ótimo</span>
                              <span className="font-black text-supplyx-blue">Sincronizado</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-white/5 mt-6">
                        <button
                          onClick={() => {
                            alert(language === 'PT' ? 'Faturamento comercial de taxa aduaneira gerada para CD!' : 'Commercial commercial invoice generated!');
                          }}
                          className="w-full py-3.5 rounded-xl border border-white/10 text-zinc-300 text-[10px] font-black uppercase tracking-wider hover:bg-white/5 text-center"
                        >
                          📄 Exportar Dossiê de CD
                        </button>
                      </div>
                    </div>
                  );
                })()}

              </div>
            </div>
          )}

          {/* TAB 6: EVENT ARCHITECTURE SEQUENCE SIMULATOR AND REAL OCCURRENCES */}
          {activeInnerTab === 'logs' && (
            <div className={`p-8 rounded-[40px] border space-y-8 ${
              isDarkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-100 shadow-sm'
            }`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-white/5">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-supplyx-blue flex items-center gap-2">
                    <Layers className="w-4 h-4 text-supplyx-blue" />
                    B2B Real-Time Logistics Event Architecture Log
                  </h3>
                  <p className="text-[9px] font-semibold text-zinc-500 mt-1 uppercase tracking-widest leading-none">
                    Barramento de eventos com selagem em custódia inteligente e distribuição de pagamento de frete
                  </p>
                </div>

                <button
                  onClick={runFullLifeCycleSimulation}
                  className="px-4 py-2 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-500 text-white text-[9.5px] font-black uppercase tracking-wider hover:scale-[1.01] transition-all"
                >
                  ⚡ Simular Ciclo de Eventos
                </button>
              </div>

              {/* REAL-TIME OCCURRENCES / INCIDENTS FILE (CRITICAL USER GAP FIX) */}
              <div className="p-6 rounded-[32px] border border-red-500/10 bg-red-500/[0.02] space-y-4">
                <div>
                  <h4 className="text-[11px] font-black uppercase text-red-400 tracking-wider flex items-center gap-2 leading-none">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse inline-block" />
                    {language === 'PT' ? '🚨 Painel de Ocorrências Logísticas Reais' : '🚨 Real Logistics Incident Logs'}
                  </h4>
                  <p className="text-[8.5px] font-black uppercase tracking-widest text-[#888] mt-1">
                    {language === 'PT' ? 'Histórico real de desvios, sinistros e avarias reportadas nas rotas dos contratos de frete.' : 'Registered real-time incident responses from actual running shipping files.'}
                  </p>
                </div>

                {occurrences.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-zinc-800/60 rounded-2xl">
                    <span className="text-lg">💚</span>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-2">
                      {language === 'PT' ? 'Excelente! Zero ocorrências críticas abertas no ecossistema.' : 'Amazing! Operational corridors running on 100% normal flow.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {occurrences.map((occ) => {
                      const isOpened = occ.status === 'Aberta';
                      return (
                        <div 
                          key={occ.id} 
                          className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 transition-colors ${
                            isOpened 
                              ? 'bg-red-500/5 border-red-500/25 shadow-lg shadow-red-500/5' 
                              : 'bg-zinc-950/40 border-emerald-500/15'
                          }`}
                        >
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-[7.5px] font-black uppercase tracking-widest leading-none">
                              <span className="text-zinc-500">CONTRATO: <span className="text-white font-mono">#{occ.cargoId}</span></span>
                              <span className="text-zinc-500">{occ.dateTime}</span>
                            </div>

                            <div className="flex items-center gap-1.5 mt-1">
                              <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-wider leading-none ${
                                isOpened ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
                              }`}>
                                {occ.status} • {occ.category}
                              </span>
                              <span className="text-[8px] font-mono text-zinc-500 font-bold">#{occ.id}</span>
                            </div>

                            <p className="text-xs font-black text-white leading-relaxed mt-2 italic">"{occ.description}"</p>
                            <p className="text-[8px] font-bold text-zinc-500 uppercase">Responsável: {occ.responsible}</p>
                          </div>

                          <button
                            onClick={() => onSelectRequest(occ.cargoId)}
                            className="w-full py-2 bg-zinc-950 hover:bg-zinc-900 border border-white/5 hover:border-red-500/40 text-red-400 hover:text-white rounded-xl text-[8.5px] font-black uppercase tracking-widest transition-all text-center flex items-center justify-center gap-1.5 select-none"
                          >
                            <span>⚙️ Entrar no Dossiê de Carga</span>
                            <span>→</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* CHRONOLOGICAL EVENTS LIST */}
              <div className="space-y-4 pt-4 border-t border-white/5">
                <div>
                  <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                    {language === 'PT' ? '📈 Fluxo Teórico / Simulador de Barramento SAP-like' : '📈 Theoretical Event Bus Sequence & Escrow Ledger Simulation'}
                  </h4>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {eventLogs.map((log, idx) => {
                    const isActiveStep = eventProgress === idx;
                    return (
                      <div 
                        key={log.code} 
                        className={`p-4 rounded-2xl border transition-all ${
                          log.isDone 
                            ? isActiveStep 
                              ? 'bg-supplyx-blue/15 border-supplyx-blue scale-[1.02] ring-2 ring-supplyx-blue/20'
                              : 'bg-zinc-950/45 border-emerald-500/10'
                            : 'bg-zinc-900/10 border-white/[0.02] opacity-55'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1.5">
                          <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase ${
                            log.isDone ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-900 text-zinc-500'
                          }`}>
                            {log.code}
                          </span>
                          <span className="text-[8.5px] font-mono text-zinc-500 font-extrabold">{log.time}</span>
                        </div>

                        <h4 className="text-[11.5px] font-black text-zinc-200 mt-2">{log.title}</h4>
                        <p className="text-[9px] font-bold text-zinc-500 mt-1 tracking-normal uppercase">{log.info}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-950 border border-white/5 mt-8 max-w-2xl">
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1 leading-none flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-supplyx-blue" />
                  Garantia de Solvabilidade (SupplyX Escrow Gateway):
                </p>
                <p className="text-[10px] font-semibold text-zinc-400 leading-normal mt-2">
                  No ecossistema corporativo SupplyX, assim que o comprador efetiva a rota de frete, o valor total é retido sob custódia criptográfica em nosso gateway parceiro. Ao transmutar para o evento pós-entrega `DELIVERED`, as assinaturas são checadas on-chain e os fluxos split distribuem 90% ao transportador físico de forma instantânea, protegendo o caixa corporativo de inadimplências e disputas jurídicas comuns.
                </p>
              </div>
            </div>
          )}

          {/* TAB 7: COGNITIVE PREDICTIVE AI LOGISTICS ASSISTANT */}
          {activeInnerTab === 'ai_assistant' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column Quick prompts shortcuts */}
              <div className={`p-6 sm:p-8 rounded-[32px] border ${
                isDarkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-100'
              }`}>
                <h4 className="text-xs font-black uppercase text-white tracking-widest mb-6 pb-2 border-b border-white/5 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-supplyx-blue" />
                  Consultas Proativas Recomendadas
                </h4>

                <div className="space-y-4">
                  {[
                    'Quais rotas possuem maior risco de atraso hoje?',
                    'Como otimizar a distribuição do armazém WH-01?',
                    'Recomende a frota ideal para 30 Toneladas de minerais',
                    'Análise de eficiência de custos das transportadoras'
                  ].map((qStr, qIdx) => (
                    <button
                      key={qIdx}
                      onClick={() => handleSendMessage(qStr)}
                      className="w-full text-left p-3 rounded-xl bg-zinc-950/50 border border-white/5 text-[10px] font-extrabold uppercase text-zinc-300 hover:text-white hover:border-supplyx-blue transition-all"
                    >
                      ➔ {qStr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat screen module */}
              <div className={`lg:col-span-2 p-6 sm:p-8 rounded-[32px] border min-h-[420px] flex flex-col justify-between ${
                isDarkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-100 shadow-sm'
              }`}>
                
                {/* Chat items list body */}
                <div className="flex-1 space-y-4 max-h-[290px] overflow-y-auto pr-2 custom-scrollbar">
                  {assistantChat.map((msg, idx) => (
                    <div 
                      key={idx} 
                      className={`p-4 rounded-2xl text-xs max-w-[85%] ${
                        msg.role === 'user' 
                          ? 'bg-zinc-950 text-white border border-white/5 ml-auto text-right' 
                          : 'bg-supplyx-blue/10 border border-supplyx-blue/15 text-zinc-200'
                      }`}
                    >
                      <p className="text-[8.5px] font-black uppercase tracking-widest text-zinc-500 mb-1 select-none">
                        {msg.role === 'user' ? 'Você' : 'Assistente AI SupplyX'}
                      </p>
                      <p className="whitespace-pre-wrap leading-normal font-bold italic">{msg.text}</p>
                    </div>
                  ))}
                </div>

                {/* Input box */}
                <div className="pt-4 border-t border-white/5 mt-4 flex items-center gap-3">
                  <input
                    type="text"
                    value={assistantPrompt}
                    onChange={(e) => setAssistantPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold text-white placeholder-zinc-500 outline-none focus:border-supplyx-blue"
                    placeholder="Pergunte ao Co-Piloto sobre rotas, armazém, frotas e incidentes..."
                  />

                  <button
                    onClick={() => handleSendMessage()}
                    className="p-3 rounded-xl bg-supplyx-blue text-white hover:bg-supplyx-blue/90 font-bold transition-all"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>

              </div>

            </div>
          )}

        </motion.div>
      </AnimatePresence>

    </div>
  );
}
