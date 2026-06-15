import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  PlusCircle, 
  Loader2, 
  Truck, 
  User, 
  ShieldCheck, 
  ArrowLeft,
  ChevronDown,
  Navigation2,
  Lock,
  Package,
  Weight,
  CheckCircle2,
  AlertCircle,
  WifiOff
} from 'lucide-react';
import { CargoRequest } from './types';
import { useAuth } from '../../contexts/AuthContext';

interface CreateRequestPageProps {
  isDarkMode: boolean;
  language: 'PT' | 'EN';
  initialPayload?: any;
  onSuccess: (newReq: any) => void;
  onBack: () => void;
}

export default function CreateRequestPage({
  isDarkMode,
  language,
  initialPayload,
  onSuccess,
  onBack
}: CreateRequestPageProps) {
  const [loading, setLoading] = useState(false);
  const { profile, user } = useAuth();

  // States
  const [formData, setFormData] = useState({
    tipoCarga: 'Cimento CP-IV',
    quantidade: '1 Lote',
    peso: '18 Toneladas',
    volume: '30 m³',
    dimensions: '12m x 2.4m x 2.2m',
    fragile: false,
    origem: 'Porto de Maputo, Moçambique',
    destino: 'Nampula, Moçambique',
    dataColeta: '28 Mai 2026',
    prazoEntrega: '31 Mai 2026',
    observacoes: '',
    requester: 'Client',
    freightResponsibility: 'Client',
    deliveryMode: 'Third-party Logistics'
  });

  // Cache Version Definition config
  const CACHE_VERSION = 1;

  // Configurable parameters for Automatic Freight Estimation (Satisfies req #4)
  const [baseFee, setBaseFee] = useState(5000); // Base fee in MZN (e.g. MT 5.000)
  const [tariffPerKm, setTariffPerKm] = useState(100); // Tariff per Km in MZN (e.g. MT 100/km)

  // Google Maps safe server-side routing & client-side caching states
  const [routeInfo, setRouteInfo] = useState<{
    originAddress?: string;
    destinationAddress?: string;
    distanceKm?: number;
    durationMinutes?: number;
    originLat?: number;
    originLng?: number;
    destinationLat?: number;
    destinationLng?: number;
    routeCalculatedAt?: string;
    cacheVersion?: number;
    estimatedFreight?: number;
    routeStatus?: 'verified_google' | 'estimated_offline' | 'pending_verification' | 'invalid_route';
    cached?: boolean;
  }>({});
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  // Pre-select requester based on logged-in user profile type
  useEffect(() => {
    if (profile?.type) {
      setFormData(prev => ({
        ...prev,
        requester: profile.type === 'buyer' ? 'Client' : 'Supplier'
      }));
    }
  }, [profile]);

  // Hydrate with initialPayload if applicable (e.g., from OrdersView "Solicitar Logística" button)
  useEffect(() => {
    if (initialPayload) {
      setFormData(prev => ({
        ...prev,
        tipoCarga: initialPayload.tipoCarga || prev.tipoCarga,
        quantidade: initialPayload.quantidade || prev.quantidade,
        peso: initialPayload.peso || prev.peso,
        volume: initialPayload.volume || prev.volume,
        origem: initialPayload.origem || prev.origem,
        destino: initialPayload.destino || prev.destino,
        observacoes: initialPayload.observacoes || prev.observacoes
      }));
    }
  }, [initialPayload]);

  // Dynamic route calculation with backend proxy & client-side cache fallback
  useEffect(() => {
    let active = true;
    const originStr = (formData.origem || '').trim();
    const destStr = (formData.destino || '').trim();

    if (!originStr || !destStr || originStr.length < 3 || destStr.length < 3) {
      return;
    }

    const cacheKey = `supplyx_route_${originStr.toLowerCase()}||${destStr.toLowerCase()}`;

    // 1. Try resolving immediately from Local Cache (Standard compliance && Cached Versioning)
    try {
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        // Automatically invalidate outdated cache entries when cacheVersion changes or invalid routing is cached (Satisfies req #3)
        if (parsed && parsed.cacheVersion === CACHE_VERSION && parsed.routeStatus !== 'invalid_route') {
          setRouteInfo({ ...parsed, cached: true });
          setRouteError(null);
          return;
        } else {
          console.log(`[Cache Invalidation] Outdated version (${parsed?.cacheVersion}) or invalid routing. Deleting cached key.`);
          localStorage.removeItem(cacheKey);
        }
      }
    } catch (err) {
      console.warn('[Cache] Unable to read localStorage route cache:', err);
    }

    // 2. Debounce Route API call (Avoid extreme keystroke floods, safe Android / PWA latency patterns)
    const timeout = setTimeout(async () => {
      // Automatic Offline Local Estimator when no network connection is available (Satisfies req #6 & #7)
      if (!navigator.onLine) {
        const isMajorDistance = destStr.toLowerCase().includes('nampula') || 
                               destStr.toLowerCase().includes('pemba') || 
                               destStr.toLowerCase().includes('tete');
        const fallbackDistance = isMajorDistance ? 1860 : 420;
        const mins = isMajorDistance ? 3 * 24 * 60 : 6 * 60;
        const fallbackFreight = baseFee + (fallbackDistance * tariffPerKm);

        setRouteInfo({
          originAddress: originStr,
          destinationAddress: destStr,
          distanceKm: fallbackDistance,
          durationMinutes: mins,
          routeCalculatedAt: new Date().toISOString(),
          cacheVersion: CACHE_VERSION,
          estimatedFreight: fallbackFreight,
          routeStatus: 'estimated_offline'
        });

        setRouteError(language === 'PT' 
          ? 'Conexão Offline: Usando estimativa padrão automática offline.' 
          : 'Connection Offline: Using localized fallback route estimate.'
        );
        return;
      }

      setIsCalculatingRoute(true);
      setRouteError(null);

      try {
        const response = await fetch('/api/logistics/route', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ origin: originStr, destination: destStr })
        });

        if (!response.ok) {
          const errPayload = await response.json().catch(() => ({}));
          throw new Error(errPayload.message || (language === 'PT' ? 'Erro no serviço de mapas.' : 'Maps service returned an error.'));
        }

        const data = await response.json();
        if (active) {
          const distanceVal = data.distanceKm;

          // Suspicious Route Checking / Coordinates resolving to same location (Satisfies req #5 & #6)
          const sameLoc = data.error === 'SAME_LOCATION' || (data.originLat === data.destinationLat && data.originLng === data.destinationLng);
          const isSuspicious = sameLoc || distanceVal <= 0 || distanceVal > 5000;

          if (isSuspicious) {
            let warn = '';
            if (sameLoc) {
              warn = language === 'PT' 
                ? 'Alerta crítico: Os endereços inseridos de origem e destino resolvem para as mesmas coordenadas físicas.' 
                : 'Critical Alert: Handled origin and destination resolve to the identical geographical spot.';
            } else if (distanceVal <= 0) {
              warn = language === 'PT' 
                ? 'Alerta crítico: Distância calculada inválida (0 km ou inferior).' 
                : 'Critical Alert: Calculated distance is zero or negative.';
            } else {
              warn = language === 'PT' 
                ? 'Alerta crítico: Distância excessiva e suspeita (> 5000 km) sugere coordenadas terrestres impossíveis.' 
                : 'Critical Alert: Distance is suspicious (> 5000 km), suggesting terrestrial boundary errors.';
            }

            setRouteInfo({
              originAddress: data.originAddress || originStr,
              destinationAddress: data.destinationAddress || destStr,
              routeStatus: 'invalid_route',
              cacheVersion: CACHE_VERSION,
              estimatedFreight: 0,
              routeCalculatedAt: new Date().toISOString()
            });

            setRouteError(warn);
            return;
          }

          // Valid route obtained successfully (Satisfies req #1, #2, #4, #6)
          const finalFreight = baseFee + (distanceVal * tariffPerKm);
          const newRoute = {
            originAddress: data.originAddress,
            destinationAddress: data.destinationAddress,
            distanceKm: distanceVal,
            durationMinutes: data.durationMinutes,
            originLat: data.originLat,
            originLng: data.originLng,
            destinationLat: data.destinationLat,
            destinationLng: data.destinationLng,
            routeCalculatedAt: new Date().toISOString(),
            cacheVersion: CACHE_VERSION,
            estimatedFreight: finalFreight,
            routeStatus: 'verified_google' as const
          };
          setRouteInfo(newRoute);
          setRouteError(null);

          // Save back into local cache with cacheVersion
          try {
            localStorage.setItem(cacheKey, JSON.stringify(newRoute));
          } catch (e) {
            console.warn('[Cache] Unable to write route to localStorage:', e);
          }
        }
      } catch (err: any) {
        if (active) {
          console.warn('[CreateRequestPage] Google Maps API fallback triggered:', err.message);
          
          // Treat connection errors / server failures as estimated_offline (Satisfies req #6)
          const isMajorDistance = destStr.toLowerCase().includes('nampula') || 
                                 destStr.toLowerCase().includes('pemba') || 
                                 destStr.toLowerCase().includes('tete');
          const fallbackDistance = isMajorDistance ? 1860 : 420;
          const mins = isMajorDistance ? 3 * 24 * 60 : 6 * 60;
          const fallbackFreight = baseFee + (fallbackDistance * tariffPerKm);

          setRouteInfo({
            originAddress: originStr,
            destinationAddress: destStr,
            distanceKm: fallbackDistance,
            durationMinutes: mins,
            estimatedFreight: fallbackFreight,
            routeStatus: 'estimated_offline',
            routeCalculatedAt: new Date().toISOString(),
            cacheVersion: CACHE_VERSION
          });

          setRouteError(language === 'PT' 
            ? 'Erro ao ligar ao servidor de mapas. Aplicando estimativa local offlineizada.' 
            : 'Error connecting to maps route server. Applying offline fallback estimate.'
          );
        }
      } finally {
        if (active) {
          setIsCalculatingRoute(false);
        }
      }
    }, 750); // 750ms debounce time

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [formData.origem, formData.destino, language, baseFee, tariffPerKm]);

  // Integrated pricing and metrics parser (Google route-focused && Automatic Freight Estimation)
  const estimatedValues = React.useMemo(() => {
    // 1. Establish robust fallback defaults
    const isMajorDistance = formData.destino.toLowerCase().includes('nampula') || 
                           formData.destino.toLowerCase().includes('pemba') || 
                           formData.destino.toLowerCase().includes('tete');
    
    const fallbackDistance = isMajorDistance ? 1860 : 420;
    const fallbackDurationStr = isMajorDistance 
      ? (language === 'PT' ? '3 - 4 Dias' : '3 - 4 Days') 
      : (language === 'PT' ? '1 Dia' : '1 Day');

    // 2. Select resolved Google Route values, otherwise use fallbacks
    const resolvedDistance = routeInfo.distanceKm !== undefined ? routeInfo.distanceKm : fallbackDistance;
    
    let resolvedDurationStr = fallbackDurationStr;
    if (routeInfo.durationMinutes !== undefined) {
      const mins = routeInfo.durationMinutes;
      if (mins < 60) {
        resolvedDurationStr = `${mins} Min`;
      } else {
        const hours = Math.round(mins / 60);
        if (hours < 24) {
          resolvedDurationStr = language === 'PT' ? `${hours} Horas` : `${hours} Hours`;
        } else {
          const days = Math.round(hours / 24);
          resolvedDurationStr = language === 'PT' 
            ? `${days} ` + (days === 1 ? 'Dia' : 'Dias') 
            : `${days} ` + (days === 1 ? 'Day' : 'Days');
        }
      }
    }

    // Dynamic Freight Estimation: estimatedFreight = baseFee + (distanceKm * tariffPerKm) (Satisfies req #4)
    const customEstimatedFreight = routeInfo.routeStatus === 'invalid_route' 
      ? 0 
      : baseFee + (resolvedDistance * tariffPerKm);

    return {
      distance: `${resolvedDistance.toLocaleString('pt-BR')} km`,
      rawDistanceKm: resolvedDistance,
      rawDurationMin: routeInfo.durationMinutes || (isMajorDistance ? 3 * 24 * 60 : 6 * 60),
      duration: resolvedDurationStr,
      estimatedFreight: customEstimatedFreight,
      freightCost: `MT ${customEstimatedFreight.toLocaleString('pt-BR')}`
    };
  }, [formData.destino, routeInfo, language, baseFee, tariffPerKm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const activeUid = user?.uid || profile?.uid || profile?.id || '';

    // Check if the current route computation is invalid (Satisfies req #5 preventing bad route store)
    const isInvalid = routeInfo.routeStatus === 'invalid_route';

    setTimeout(() => {
      const generatedReq: CargoRequest = {
        id: `TR-2025-${Math.floor(1001 + Math.random() * 8999)}`,
        ...formData,
        requesterName: profile?.name || profile?.userName || (formData.requester === 'Client' ? 'Cliente Remetente' : 'Fornecedor Remetente'),
        status: 'Em concurso',
        proposalsCount: 0,
        rating: 5.0,
        targetPrice: isInvalid 
          ? (language === 'PT' ? 'A definir por lance logístico' : 'To be bid by carrier')
          : `MT ${estimatedValues.estimatedFreight.toLocaleString('pt-BR')}`,
        buyerId: profile?.type === 'buyer' ? activeUid : undefined,
        supplierId: profile?.type === 'supplier' ? activeUid : undefined,
        
        // Google Maps Routes API calculated values stored inside the Request objects (Satisfies req #1, #2, #3, #4, #6)
        originAddress: isInvalid ? formData.origem : (routeInfo.originAddress || formData.origem),
        destinationAddress: isInvalid ? formData.destino : (routeInfo.destinationAddress || formData.destino),
        distanceKm: isInvalid ? undefined : estimatedValues.rawDistanceKm,
        durationMinutes: isInvalid ? undefined : estimatedValues.rawDurationMin,
        originLat: isInvalid ? undefined : routeInfo.originLat,
        originLng: isInvalid ? undefined : routeInfo.originLng,
        destinationLat: isInvalid ? undefined : routeInfo.destinationLat,
        destinationLng: isInvalid ? undefined : routeInfo.destinationLng,
        routeCalculatedAt: routeInfo.routeCalculatedAt || new Date().toISOString(),
        cacheVersion: CACHE_VERSION,
        estimatedFreight: isInvalid ? undefined : estimatedValues.estimatedFreight,
        routeStatus: routeInfo.routeStatus || (navigator.onLine ? 'verified_google' : 'estimated_offline')
      };

      setLoading(false);
      onSuccess(generatedReq);
    }, 1500);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.99 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`max-w-4xl mx-auto p-8 sm:p-10 rounded-[38px] border text-left ${
        isDarkMode ? 'bg-zinc-900 border-white/5 shadow-3xl' : 'bg-white border-zinc-150'
      }`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-white/5">
        <div>
          <span className="px-3.5 py-1 text-[8px] font-black uppercase bg-supplyx-blue/1% text-supplyx-blue border border-supplyx-blue/20 rounded-full tracking-wider">
            {language === 'PT' ? 'Fretagem Inteligente B2B' : 'B2B Smart Transportation Form'}
          </span>
          <h2 className={`text-xl font-black italic uppercase tracking-tight mt-3 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
            {language === 'PT' ? 'Solicitar Cubagem de Carga' : 'Request Freight Routing'}
          </h2>
          <p className="text-[10px] text-zinc-550 font-bold text-zinc-505 mt-1 uppercase tracking-wider">
            Preencha as configurações físicas para abrir lances com as transportadoras homologadas
          </p>
        </div>

        <button 
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-zinc-950/80 border border-white/5 text-zinc-400 font-bold hover:text-white text-[9.5px] uppercase flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {language === 'PT' ? 'Cancelar / Voltar' : 'Cancel'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Core Radios selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="p-5 rounded-2xl bg-zinc-950/60 border border-white/5 space-y-3.5">
            <label className="text-[9px] font-black uppercase text-zinc-400 tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-supplyx-blue" />
              {language === 'PT' ? 'Quem Solicita?' : 'Sender Target'}
            </label>
            <div className="flex flex-col gap-2">
              {[
                { key: 'Client', pt: 'Cliente (Comprador)', en: 'Buyer (Client)' },
                { key: 'Supplier', pt: 'Fornecedor', en: 'Supplier' }
              ].map(opt => (
                <label key={opt.key} className="flex items-center gap-2.5 text-xs font-black uppercase text-white cursor-pointer select-none">
                  <input 
                    type="radio" 
                    name="requester" 
                    value={opt.key}
                    checked={formData.requester === opt.key}
                    onChange={() => setFormData({ ...formData, requester: opt.key })}
                    className="w-4 h-4 accent-supplyx-blue" 
                  />
                  {language === 'PT' ? opt.pt : opt.en}
                </label>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-950/60 border border-white/5 space-y-3.5">
            <label className="text-[9px] font-black uppercase text-zinc-400 tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              {language === 'PT' ? 'Acordo de Custo' : 'Freight Carrier Agreement'}
            </label>
            <div className="flex flex-col gap-2">
              {[
                { key: 'Client', pt: 'Fretado pelo Cliente', en: 'FOB (Buyer Pays)' },
                { key: 'Supplier', pt: 'Fretado pelo Fornecedor', en: 'CIF (Supplier Pays)' },
                { key: 'Shared', pt: 'Divisão de Custo B2B', en: 'Split Cost 50/50' }
              ].map(opt => (
                <label key={opt.key} className="flex items-center gap-2.5 text-xs font-black uppercase text-white cursor-pointer select-none">
                  <input 
                    type="radio" 
                    name="freightResponsibility" 
                    value={opt.key}
                    checked={formData.freightResponsibility === opt.key}
                    onChange={() => setFormData({ ...formData, freightResponsibility: opt.key })}
                    className="w-4 h-4 accent-supplyx-blue" 
                  />
                  {language === 'PT' ? opt.pt : opt.en}
                </label>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-950/60 border border-white/5 space-y-3.5">
            <label className="text-[9px] font-black uppercase text-zinc-400 tracking-wider flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-400" />
              {language === 'PT' ? 'Fretagem Desejada' : 'Fulfillment Route'}
            </label>
            <div className="flex flex-col gap-2">
              {[
                { key: 'Supplier Delivery', pt: 'Transporte Próprio', en: 'Supplier Own Fleet' },
                { key: 'Third-party Logistics', pt: 'Lote Livre (Homologado)', en: 'Exchange Carrier (3PL)' }
              ].map(opt => (
                <label key={opt.key} className="flex items-center gap-2.5 text-xs font-black uppercase text-white cursor-pointer select-none">
                  <input 
                    type="radio" 
                    name="deliveryMode" 
                    value={opt.key}
                    checked={formData.deliveryMode === opt.key}
                    onChange={() => setFormData({ ...formData, deliveryMode: opt.key })}
                    className="w-4 h-4 accent-supplyx-blue" 
                  />
                  {language === 'PT' ? opt.pt : opt.en}
                </label>
              ))}
            </div>
          </div>

        </div>

        {/* Dimension specifications inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider pl-2">Categoria da Carga / Produto *</label>
            <input 
              required
              type="text" 
              value={formData.tipoCarga}
              onChange={(e) => setFormData({ ...formData, tipoCarga: e.target.value })}
              className="w-full p-4 rounded-xl border border-white/5 bg-zinc-950 text-xs font-black text-white outline-none focus:border-supplyx-blue transition-all"
              placeholder="Ex: Bobinas Metálicas, Madeira Bruta"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Quantidade</label>
              <input 
                type="text" 
                value={formData.quantidade}
                onChange={(e) => setFormData({ ...formData, quantidade: e.target.value })}
                className="w-full p-4 rounded-xl border border-white/5 bg-zinc-950 text-xs font-black text-white"
                placeholder="Ex: 50 sacos"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Peso Real *</label>
              <input 
                required
                type="text" 
                value={formData.peso}
                onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
                className="w-full p-4 rounded-xl border border-white/5 bg-zinc-950 text-xs font-black text-white"
                placeholder="Ex: 24 Toneladas"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Cubagem Volume</label>
              <input 
                type="text" 
                value={formData.volume}
                onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                className="w-full p-4 rounded-xl border border-white/5 bg-zinc-950 text-xs font-black text-white"
                placeholder="Ex: 45 m³"
              />
            </div>
          </div>

        </div>

        {/* Extra physical properties */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Dimensões Físicas (C x L x A)</label>
            <input 
              type="text" 
              value={formData.dimensions}
              onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
              className="w-full p-4 rounded-xl border border-white/5 bg-zinc-950 text-xs font-black text-white"
              placeholder="Ex: 13.6m x 2.45m x 2.6m"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Previsão Data de Coleta</label>
            <input 
              type="text" 
              value={formData.dataColeta}
              onChange={(e) => setFormData({ ...formData, dataColeta: e.target.value })}
              className="w-full p-4 rounded-xl border border-white/5 bg-zinc-950 text-xs font-black text-white animate-pulse"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-zinc-950/40 rounded-xl border border-white/5 mt-6">
            <div className="text-left">
              <p className="text-[10px] font-black uppercase text-white leading-none">Carga Frágil / Perigosa?</p>
              <p className="text-[8px] font-bold text-zinc-500 uppercase mt-1">Requer seguro ad-valorem extra</p>
            </div>
            <input 
              type="checkbox" 
              checked={formData.fragile}
              onChange={(e) => setFormData({ ...formData, fragile: e.target.checked })}
              className="w-5 h-5 accent-red-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Senders and Locations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider pl-2">Endereço de Origem (Recolha) *</label>
            <input 
              required
              type="text" 
              value={formData.origem}
              onChange={(e) => setFormData({ ...formData, origem: e.target.value })}
              className="w-full p-4 rounded-xl border border-white/5 bg-zinc-950 text-xs font-black text-white outline-none focus:border-supplyx-blue"
              placeholder="Terminal de carregamento"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider pl-2">Endereço de Entrega (Destino) *</label>
            <input 
              required
              type="text" 
              value={formData.destino}
              onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
              className="w-full p-4 rounded-xl border border-white/5 bg-zinc-950 text-xs font-black text-white outline-none focus:border-supplyx-blue"
              placeholder="Estaleiro de descarga"
            />
          </div>
        </div>

        {/* Tariff rate configuration controls (Requirement #4 makes baseFee & tariffPerKm configurable) */}
        <div className="p-5 rounded-2xl bg-zinc-950/60 border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-white tracking-widest leading-none">
                {language === 'PT' ? '🛠️ Configurar Parâmetros de Tarifa' : '🛠️ Configure Tariff Parameters'}
              </p>
              <p className="text-[8px] font-bold text-zinc-500 uppercase mt-1">
                {language === 'PT' ? 'Ajuste os valores dinamicamente para recalcular a estimativa' : 'Dynamically adjust variables to recalculate freight'}
              </p>
            </div>
            <span className="text-[8px] font-mono px-2 py-0.5 rounded-md bg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase font-black">
              {language === 'PT' ? 'Fórmula Ativa: Frete = Base + (Km × Tarifa)' : 'Active: Freight = Base + (Km × Tariff)'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1 text-left">
              <label className="text-[8px] font-black uppercase text-zinc-400 tracking-wider">
                {language === 'PT' ? 'Taxa Base (MZN)' : 'Base Fee (MZN)'}
              </label>
              <div className="flex items-center gap-2">
                <input 
                  type="number"
                  min="0"
                  step="500"
                  value={baseFee}
                  onChange={(e) => setBaseFee(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full p-2.5 rounded-lg border border-white/5 bg-zinc-950 text-xs font-mono font-bold text-white text-left focus:border-supplyx-blue outline-none"
                />
                <span className="text-[9px] text-zinc-500 shrink-0 font-bold uppercase">MT</span>
              </div>
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[8px] font-black uppercase text-zinc-400 tracking-wider">
                {language === 'PT' ? 'Tarifa por Km (MZN)' : 'Tariff per Km (MZN)'}
              </label>
              <div className="flex items-center gap-2">
                <input 
                  type="number"
                  min="0"
                  step="5"
                  value={tariffPerKm}
                  onChange={(e) => setTariffPerKm(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full p-2.5 rounded-lg border border-white/5 bg-zinc-950 text-xs font-mono font-bold text-white text-left focus:border-supplyx-blue outline-none"
                />
                <span className="text-[9px] text-zinc-500 shrink-0 font-bold uppercase">MT/km</span>
              </div>
            </div>
          </div>
        </div>

        {/* Estimated Pricing telemetry visualization before submit */}
        <div className="flex flex-col gap-3">
          <div className="p-6 rounded-3xl bg-zinc-950 border border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-6 relative overflow-hidden">
            
            {/* Absolute background overlay when calculating */}
            {isCalculatingRoute && (
              <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-xs flex items-center justify-center gap-3 z-10 transition-all font-sans">
                <Loader2 className="w-5 h-5 animate-spin text-supplyx-blue" />
                <span className="text-[10px] font-black uppercase text-zinc-300 tracking-wider">
                  {language === 'PT' ? 'Calculando Trajetória Real no Google Maps...' : 'Resolving real Google Maps corridor...'}
                </span>
              </div>
            )}

            <div>
              <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest leading-none">
                {language === 'PT' ? 'DISTÂNCIA TOTAL (GOOG)' : 'TOTAL DISTANCE (GOOG)'}
              </span>
              <p className="text-sm font-black text-white italic mt-1.5">{estimatedValues.distance}</p>
              {routeInfo.distanceKm !== undefined && routeInfo.routeStatus !== 'invalid_route' && (
                <span className="text-[7.5px] font-black text-emerald-400 uppercase tracking-wider block mt-1">
                  ✓ Geocodificação Ativa
                </span>
              )}
            </div>

            <div>
              <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest leading-none">
                {language === 'PT' ? 'TEMPO REAL DE TRÂNSITO' : 'ESTIMATED TRANSIT TIME'}
              </span>
              <p className="text-sm font-black text-supplyx-blue mt-1.5">{estimatedValues.duration}</p>
              {routeInfo.durationMinutes !== undefined && routeInfo.routeStatus !== 'invalid_route' && (
                <span className="text-[7.5px] font-black text-emerald-400 uppercase tracking-wider block mt-1">
                  ✓ Routes API Ativada
                </span>
              )}
            </div>

            <div>
              <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest leading-none font-sans">
                {language === 'PT' ? 'RECORRÊNCIA E TARIFA (MT)' : 'ESTIMATED TARIFF (MZN)'}
              </span>
              <p className="text-sm font-black text-emerald-400 italic mt-1.5">{estimatedValues.freightCost}</p>
              <p className="text-[7.5px] text-zinc-400 font-bold uppercase mt-1">
                {language === 'PT' ? '✦ Preço de Referência Inteligente' : '✦ Intelligent reference cap active'}
              </p>
            </div>
          </div>

          {/* Feedback details: Verified addresses, Route Errors, Cache status */}
          <div className="flex flex-col gap-3 p-4 rounded-2xl bg-zinc-950/45 border border-white/5 text-[9px] font-bold uppercase tracking-wider">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.03] pb-3">
              <div className="space-y-1 text-left">
                {routeInfo.originAddress && (
                  <p className="text-zinc-400 truncate max-w-lg">
                    <span className="text-emerald-400">📍 {language === 'PT' ? 'Origem Resolvida: ' : 'Geocoded Origin: '}</span>
                    {routeInfo.originAddress}
                    {routeInfo.originLat !== undefined && (
                      <span className="text-zinc-650 text-[7.5px] ml-1 lowercase text-zinc-500">
                        ({routeInfo.originLat.toFixed(4)}, {routeInfo.originLng?.toFixed(4)})
                      </span>
                    )}
                  </p>
                )}
                {routeInfo.destinationAddress && (
                  <p className="text-zinc-400 truncate max-w-lg">
                    <span className="text-emerald-400">🏁 {language === 'PT' ? 'Destino Resolvido: ' : 'Geocoded Dest: '}</span>
                    {routeInfo.destinationAddress}
                    {routeInfo.destinationLat !== undefined && (
                      <span className="text-zinc-650 text-[7.5px] ml-1 lowercase text-zinc-500">
                        ({routeInfo.destinationLat.toFixed(4)}, {routeInfo.destinationLng?.toFixed(4)})
                      </span>
                    )}
                  </p>
                )}
                {!routeInfo.originAddress && !routeInfo.destinationAddress && !routeError && (
                  <p className="text-zinc-500">
                    {language === 'PT' 
                      ? 'Insira pontos válidos para sincronização em tempo real via satélite.' 
                      : 'Provide addresses above to synchronize accurate satellite routing.'
                    }
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                {routeInfo.routeStatus && (
                  <>
                    {routeInfo.routeStatus === 'verified_google' && (
                      <span className="text-emerald-450 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-lg flex items-center gap-1 text-[8.5px] font-black">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        {language === 'PT' ? 'GOOGLE VERIFICADO' : 'VERIFIED GOOGLE'}
                      </span>
                    )}
                    {routeInfo.routeStatus === 'estimated_offline' && (
                      <span className="text-amber-450 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-1 rounded-lg flex items-center gap-1 text-[8.5px] font-black">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                        {language === 'PT' ? 'ESTIMATIVA OFFLINE' : 'ESTIMATED OFFLINE'}
                      </span>
                    )}
                    {routeInfo.routeStatus === 'pending_verification' && (
                      <span className="text-sky-405 bg-sky-500/10 border border-sky-500/20 text-sky-400 px-2.5 py-1 rounded-lg flex items-center gap-1 text-[8.5px] font-black">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse shrink-0" />
                        {language === 'PT' ? 'VERIFICAÇÃO PENDENTE' : 'PENDING VERIFICATION'}
                      </span>
                    )}
                    {routeInfo.routeStatus === 'invalid_route' && (
                      <span className="text-rose-405 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2.5 py-1 rounded-lg flex items-center gap-1 text-[8.5px] font-black">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        {language === 'PT' ? 'ROTA INVÁLIDA' : 'INVALID ROUTE'}
                      </span>
                    )}
                  </>
                )}
                {routeInfo.cached && routeInfo.routeStatus !== 'invalid_route' && (
                  <span className="text-[7.5px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded uppercase">
                    {language === 'PT' ? 'Cache' : 'Cached'}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[8px] text-zinc-500 lowercase">
              <div>
                {routeInfo.routeCalculatedAt && (
                  <span className="block italic">
                    {language === 'PT' ? 'Último cálculo em: ' : 'Last route check: '}
                    {new Date(routeInfo.routeCalculatedAt).toISOString()} 
                    {routeInfo.cacheVersion !== undefined && ` (v${routeInfo.cacheVersion})`}
                  </span>
                )}
              </div>
              {routeError && (
                <div className="text-rose-400 uppercase font-black tracking-wider flex items-center gap-1 bg-rose-500/5 px-2 py-1 rounded-lg border border-rose-500/15">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {routeError}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Instruções Úteis sobre a Carga</label>
          <textarea 
            value={formData.observacoes}
            onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
            className="w-full p-4 rounded-xl border border-white/5 bg-zinc-950 text-xs font-black text-white h-24 resize-none leading-relaxed"
            placeholder="Instruções operacionais adicionais se aplicável..."
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-5 bg-supplyx-blue hover:brightness-110 text-white rounded-2xl font-black text-sm uppercase italic tracking-tighter shadow-xl shadow-supplyx-blue/20 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlusCircle className="w-5 h-5" />}
          {language === 'PT' ? 'PUBLICAR NO MAPA DA LOGÍSTICA' : 'DISPATCH TO FREIGHT AUCTION'}
        </button>

      </form>
    </motion.div>
  );
}
