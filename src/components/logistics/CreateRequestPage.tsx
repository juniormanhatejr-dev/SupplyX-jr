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
  Weight
} from 'lucide-react';
import { CargoRequest } from './types';

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

  // Pricing helper
  const estimatedValues = React.useMemo(() => {
    // Arbitrary parsing of route to estimate a distance
    const isMajorDistance = formData.destino.toLowerCase().includes('nampula') || formData.destino.toLowerCase().includes('pemba') || formData.destino.toLowerCase().includes('tete');
    const estimatedDistanceKm = isMajorDistance ? 1860 : 420;
    
    // Weight numerical parser
    const numWeight = parseInt(formData.peso.replace(/\D/g, ''), 10) || 10;
    const baseRatePerKm = numWeight > 20 ? 115 : 90;
    const priceMZN = estimatedDistanceKm * baseRatePerKm;

    return {
      distance: `${estimatedDistanceKm} km`,
      duration: isMajorDistance ? '3 - 4 Dias' : '1 Dia',
      freightCost: `MT ${priceMZN.toLocaleString('pt-BR')}`
    };
  }, [formData.destino, formData.peso]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      const generatedReq: CargoRequest = {
        id: `TR-2025-${Math.floor(1001 + Math.random() * 8999)}`,
        ...formData,
        status: 'Em Competição',
        proposalsCount: 4,
        rating: 4.8,
        targetPrice: language === 'PT' ? 'A definir por lance logístico' : 'To be bid by carrier'
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

          <div className="grid grid-cols-3 gap-3">
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

        {/* Estimated Pricing telemetry visualization before submit */}
        <div className="p-6 rounded-3xl bg-zinc-950 border border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <span className="text-[8px] font-black text-zinc-505 text-zinc-500 uppercase tracking-widest leading-none">CONSUMO DE DISTÂNCIA ESTIMADO</span>
            <p className="text-sm font-black text-white italic mt-1.5">{estimatedValues.distance}</p>
          </div>
          <div>
            <span className="text-[8px] font-black text-zinc-505 text-zinc-500 uppercase tracking-widest leading-none">TEMPO ESTIMADO CORREDOR</span>
            <p className="text-sm font-black text-supplyx-blue mt-1.5">{estimatedValues.duration}</p>
          </div>
          <div>
            <span className="text-[8px] font-black text-zinc-505 text-zinc-500 uppercase tracking-widest leading-none font-sans">
              {language === 'PT' ? 'TARIFA DE REFERÊNCIAS (MOCAMBIQUE)' : 'ESTIMATED MARKET REFERENCE'}
            </span>
            <p className="text-sm font-black text-emerald-400 italic mt-1.5">{estimatedValues.freightCost} MZN</p>
            <p className="text-[7.5px] text-zinc-400 font-bold uppercase mt-1">
              {language === 'PT' ? '✦ Preço final será definido por lance do transportador' : '✦ Final price is proposed by logistics carrier via bids'}
            </p>
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
