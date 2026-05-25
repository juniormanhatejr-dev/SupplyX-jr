import React, { useState } from 'react';
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
  Clock
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
import { CargoRequest, CommercialDriver } from './types';

// Analytical Mock Data
const trendData = [
  { month: 'Jan', cost: 420000, tonnage: 110 },
  { month: 'Fev', cost: 380000, tonnage: 95 },
  { month: 'Mar', cost: 510000, tonnage: 130 },
  { month: 'Abr', cost: 490000, tonnage: 125 },
  { month: 'Mai', cost: 620000, tonnage: 165 },
];

const categoryData = [
  { name: 'Cimento / Minerais', value: 45, color: '#3b82f6' },
  { name: 'Peças Fletadas', value: 25, color: '#10b981' },
  { name: 'Carvão / Granéis', value: 20, color: '#f59e0b' },
  { name: 'Químicos / Fluidos', value: 10, color: '#ec4899' },
];

const carrierData = [
  { name: 'Moz Logistics', trips: 148, rating: 4.8 },
  { name: 'Fast Cargo', trips: 112, rating: 4.6 },
  { name: 'Nampula Carriers', trips: 74, rating: 4.2 },
  { name: 'TransMoz Lda', trips: 135, rating: 4.7 },
  { name: 'Global Trans', trips: 89, rating: 4.3 },
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
  // IA predictive routing workspace state picker
  const [selectedCorrider, setSelectedCorridor] = useState<'corredor-sul' | 'corredor-centro'>('corredor-sul');
  const [cargoWeightTons, setCargoWeightTons] = useState<number>(20);

  // Compute stats metrics dynamically securely
  const totalRequestsCount = (requests || []).length;
  const activeRequestsCount = (requests || []).filter(r => r && !['Entregue', 'Cancelado'].includes(r.status || '')).length;
  const completedDeliveriesCount = (requests || []).filter(r => r && r.status === 'Entregue').length;
  const openOccurrencesCount = (occurrences || []).filter((o: any) => o && o.status === 'Aberta').length;
  const activeCarriersCount = drivers ? drivers.length : 3;

  const totalSpent = (requests || [])
    .filter(r => r && (r.status === 'Entregue' || r.status === 'Em trânsito'))
    .length * 82000;

  // Intelligent route calculation outputs
  const calculatedRouteData = ({
    'corredor-sul': {
      distance: '2.075 km',
      duration: '48h estimado',
      fuel: '620 Litros',
      risk: 'Baixo (Tempo Firme)',
      riskLevel: 'low',
      roadQuality: '84% Asfalto Regularizado',
      suggestedCarrier: 'Moz Logistics, Lda (Classificação 4.8★)',
      basePrice: 2075 * 45 // 45 MZN/km index
    },
    'corredor-centro': {
      distance: '1.430 km',
      duration: '34h estimado',
      fuel: '440 Litros',
      risk: 'Médio (Instabilidade de Chuvas em Tete)',
      riskLevel: 'medium',
      roadQuality: '68% Pavimento em Obras',
      suggestedCarrier: 'Fast Cargo Transportes (Classificação 4.6★)',
      basePrice: 1430 * 48 // 48 MZN/km index
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
    <div className="space-y-8 text-left animate-in fade-in duration-300">
      
      {/* 1. TOP KPI KEYMETRICS CARD ROW */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6">
        {[
          {
            title: language === 'PT' ? 'Pedidos Totais' : 'Total Orders',
            value: totalRequestsCount.toString(),
            sub: language === 'PT' ? 'Volume acumulado B2B' : 'Accumulated B2B volume',
            icon: Package,
            color: 'bg-blue-500 text-blue-500'
          },
          {
            title: language === 'PT' ? 'Pedidos Ativos' : 'Active Orders',
            value: activeRequestsCount.toString(),
            sub: language === 'PT' ? 'Lances e Viagens ativas' : 'Bids & Trips in progress',
            icon: Truck,
            color: 'bg-amber-500 text-amber-500'
          },
          {
            title: language === 'PT' ? 'Entregas Concluídas' : 'Completed Deliveries',
            value: completedDeliveriesCount.toString(),
            sub: language === 'PT' ? 'PoDs digitais selados' : 'Digital PoDs processed',
            icon: CheckCircle2,
            color: 'bg-emerald-500 text-emerald-500'
          },
          {
            title: language === 'PT' ? 'Ocorrências Abertas' : 'Open Incidents',
            value: openOccurrencesCount.toString(),
            sub: openOccurrencesCount > 0 ? `${openOccurrencesCount} alertas na via` : 'Operação 100% regular',
            subColor: openOccurrencesCount > 0 ? 'text-red-550 text-red-400 font-black' : 'text-zinc-500',
            icon: AlertTriangle,
            color: 'bg-red-500 text-red-500'
          },
          {
            title: language === 'PT' ? 'Transportadores Ativos' : 'Active Carriers',
            value: `${activeCarriersCount} Frota`,
            sub: 'Motoristas e veículos',
            icon: Star,
            color: 'bg-indigo-500 text-indigo-500'
          },
          {
            title: language === 'PT' ? 'Performance Geral' : 'General Performance',
            value: '97.2%',
            sub: 'Acima da meta SLA',
            icon: TrendingUp,
            color: 'bg-teal-500 text-teal-500'
          }
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div 
              key={idx} 
              className={`p-5 rounded-[24px] border transition-all hover:scale-[1.01] ${
                isDarkMode ? 'bg-zinc-900 border-white/5 shadow-2xl' : 'bg-white border-zinc-100 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
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
            </div>
          );
        })}
      </div>

      {notifications.length > 0 && (
        <div className={`p-4 rounded-2xl border flex items-center gap-3.5 ${
          isDarkMode ? 'bg-zinc-900/40 border-white/5 text-zinc-300' : 'bg-zinc-50 border-zinc-200 text-zinc-700'
        }`}>
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <div className="flex-1 text-xs font-bold uppercase tracking-wider flex flex-col sm:flex-row justify-between">
            <span className="truncate">📢 <strong className="text-white italic">LOGS:</strong> {notifications[0].title} - {notifications[0].text}</span>
            <span className="text-[8px] text-zinc-500 whitespace-nowrap">{notifications[0].time}</span>
          </div>
        </div>
      )}

      {/* 2. FLEXPORT INSPIRED ANALYTICAL CHARTS GRAPHS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trend Area Chart (Cost vs Weight) */}
        <div className={`lg:col-span-2 p-6 sm:p-8 rounded-[32px] border ${
          isDarkMode ? 'bg-zinc-900 border-white/5 shadow-2xl shadow-black/40' : 'bg-white border-zinc-100'
        }`}>
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
            <div>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-supplyx-blue flex items-center gap-2">
                <Activity className="w-4 h-4" />
                {language === 'PT' ? 'Fluxo Histórico de Fretes' : 'Historical Freight Spend'}
              </h3>
              <p className="text-[9px] font-semibold text-zinc-500 mt-0.5 uppercase tracking-widest">
                Evolução mensal de carregamentos consolidados
              </p>
            </div>
            <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
              Média: MT 500k
            </span>
          </div>

          <div className="w-full h-[240px]">
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
          isDarkMode ? 'bg-zinc-900 border-white/5 shadow-2xl' : 'bg-white border-zinc-100'
        }`}>
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-supplyx-blue mb-4">
              {language === 'PT' ? 'Tipos de Cargas Despachadas' : 'Freight Category Share'}
            </h3>
            
            <div className="w-full h-[140px] flex items-center justify-center relative my-4">
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
                <p className="text-sm font-black text-white italic">SupplyX</p>
                <p className="text-[7px] text-zinc-500 font-bold uppercase tracking-widest leading-none">Corredores</p>
              </div>
            </div>
          </div>

          <div className="space-y-2 mt-2">
            {categoryData.map((cat, i) => (
              <div key={i} className="flex items-center justify-between text-[10px] pb-1 border-b border-white/[0.03]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-zinc-400 font-bold truncate max-w-[140px]">{cat.name}</span>
                </div>
                <span className="text-white font-black">{cat.value}%</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 3. IA LOGÍSTICA INTEGRADA PREDICTIVE OPTIMIZER CARD */}
      <div className={`p-8 rounded-[40px] border relative overflow-hidden ${
        isDarkMode ? 'bg-zinc-950 border-white/5 shadow-2xl' : 'bg-white border-zinc-100'
      }`}>
        <div className="absolute right-0 top-0 w-80 h-80 bg-supplyx-blue/10 rounded-full filter blur-[100px] pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 text-white shadow-xl shadow-blue-500/20 animate-pulse">
              <Sparkles className="w-5 h-5 fill-white" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-white leading-none">
                {language === 'PT' ? 'IA Logística - Otimizador de Rotas de Frete' : 'Logistics Smart Route Simulator'}
              </h3>
              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest leading-none mt-1.5">
                Previsão de frete, delay meteorológico, consumo e alocação de frota automática
              </p>
            </div>
          </div>

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
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Variáveis Computacionais de Simulação:</p>
            
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
                  <span>Leve (1-5 Track)</span>
                  <span>Pesado (35+ Carreta Baú)</span>
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

      {/* 4. ACTIVE FREIGHT SHIPIENTS WORKSPACE SUMMARY TABLE */}
      <div className={`p-8 rounded-[40px] border ${
        isDarkMode ? 'bg-zinc-900 border-white/5 shadow-2xl' : 'bg-white border-zinc-100'
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

          {/* Removed button "Solicitar Carga" as requested by user */}
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
                    <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mt-0.5">Fretado por {req.requester}</p>
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
                        : req.status === 'Em Transporte'
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
                      Acessar Painel
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
