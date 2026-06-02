import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Star, 
  MapPin, 
  Phone, 
  Mail, 
  Truck, 
  Check, 
  AlertCircle, 
  X, 
  Navigation, 
  Award, 
  ShieldCheck, 
  CheckCircle2,
  ListFilter,
  ArrowUpRight
} from 'lucide-react';
import { collection, onSnapshot, query, where, doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { CargoRequest } from './types';

interface CarriersDirectoryProps {
  isDarkMode: boolean;
  language: 'PT' | 'EN';
  requests: CargoRequest[];
  onUpdateRequests: (list: CargoRequest[]) => void;
  setActiveSubTab: (tab: string) => void;
  userType?: string;
}

export default function CarriersDirectory({
  isDarkMode,
  language,
  requests = [],
  onUpdateRequests,
  setActiveSubTab,
  userType
}: CarriersDirectoryProps) {
  const [carriers, setCarriers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCarrier, setSelectedCarrier] = useState<any | null>(null);
  const [assignmentSuccess, setAssignmentSuccess] = useState<string | null>(null);

  // Load and sync logistics users with Firestore in real-time
  useEffect(() => {
    const q = query(collection(db, 'users'), where('type', '==', 'logistics'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        // Automatically pre-populate default premium logistics companies in Firestore
        const defaultCarriers = [
          {
            name: 'Moz Logistics & Transportes Lda',
            companyName: 'Moz Logistics & Transportes Lda',
            type: 'logistics',
            rating: 4.9,
            city: 'Maputo Cidade',
            sector: 'Transporte Internacional & Doméstico',
            phone: '+258 84 923 1234',
            email: 'contacto@mozlogistics.co.mz',
            bio: 'Líder nacional em soluções logísticas de ponta a ponta, frotas inteligentes e fretes multimodais monitorados continuamente por satélite.',
            performance: '99.2%',
            completedDeliveries: 2430,
            routes: 'Maputo ⇄ Beira ⇄ Nacala ⇄ Tete'
          },
          {
            name: 'Fast Cargo Mozambique, S.A.',
            companyName: 'Fast Cargo Mozambique, S.A.',
            type: 'logistics',
            rating: 4.8,
            city: 'Beira',
            sector: 'Distribuição Expresso & Pesada',
            phone: '+258 82 115 8899',
            email: 'ops@fastcargo.co.mz',
            bio: 'Segurança absoluta e agilidade inigualável no transporte de mercadorias críticas, granel e materiais industriais com seguro internacional.',
            performance: '97.8%',
            completedDeliveries: 1850,
            routes: 'Beira ⇄ Chimoio ⇄ Quelimane ⇄ Tete'
          },
          {
            name: 'Manica Freights Limitada',
            companyName: 'Manica Freights Limitada',
            type: 'logistics',
            rating: 4.6,
            city: 'Maputo Cidade',
            sector: 'Desembaraço Aduaneiro & Trânsito',
            phone: '+258 87 634 5050',
            email: 'info@manicafreights.co.mz',
            bio: 'Operações alfandegárias unificadas com transporte ágil transfronteiriço para todo o corredor de desenvolvimento da SADC.',
            performance: '95.0%',
            completedDeliveries: 3120,
            routes: 'Maputo ⇄ Ressano Garcia ⇄ Goba ⇄ Namaacha'
          },
          {
            name: 'Nampula Linhas Terrestres',
            companyName: 'Nampula Linhas Terrestres',
            type: 'logistics',
            rating: 4.5,
            city: 'Nampula',
            sector: 'Logística de Abastecimento Seco',
            phone: '+258 84 555 1212',
            email: 'comercial@nampulalinhas.co.mz',
            bio: 'Conexões terrestres de carga e mercadorias secas integrando o porto de Nacala e Pemba com os distritos do norte.',
            performance: '92.4%',
            completedDeliveries: 980,
            routes: 'Nacala ⇄ Nampula ⇄ Pemba ⇄ Lichinga'
          }
        ];

        for (const carrier of defaultCarriers) {
          try {
            const docId = `carrier_demo_${carrier.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
            await setDoc(doc(db, 'users', docId), carrier);
          } catch (e) {
            console.warn('Error saving pre-populated carrier:', e);
          }
        }
      } else {
        const fetched = snapshot.docs.map(doc => ({
          id: doc.id,
          uid: doc.id,
          ...doc.data()
        }));
        setCarriers(fetched);
      }
      setLoading(false);
    }, (error) => {
      console.error('Error fetching carriers list from Firestore:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sort carriers strictly by efficiency/rating descending (best in first places)
  const sortedAndFilteredCarriers = useMemo(() => {
    const list = [...carriers].sort((a, b) => {
      const ratingA = parseFloat(a.rating) || 0;
      const ratingB = parseFloat(b.rating) || 0;
      return ratingB - ratingA;
    });

    if (!searchTerm.trim()) return list;
    return list.filter(c => {
      const nameMatch = (c.companyName || c.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const routesMatch = (c.routes || '').toLowerCase().includes(searchTerm.toLowerCase());
      const sectorMatch = (c.sector || '').toLowerCase().includes(searchTerm.toLowerCase());
      return nameMatch || routesMatch || sectorMatch;
    });
  }, [carriers, searchTerm]);

  // Filter pending cargo requests that belong to this client or supplier and are not yet successfully assigned
  const assignableRequests = useMemo(() => {
    return requests.filter(req => {
      const isPending = req.status === 'Pendente' || req.status === 'Em concurso' || !req.assignedCarrier;
      return isPending;
    });
  }, [requests]);

  const handleAssignCargo = (req: CargoRequest, carrier: any) => {
    const updated = requests.map(r => {
      if (r.id === req.id) {
        return {
          ...r,
          assignedCarrier: carrier.companyName || carrier.name,
          status: 'Atribuído',
          trackStatusText: language === 'PT' 
            ? `Carga atribuída diretamente à transportadora ${carrier.companyName || carrier.name}` 
            : `Cargo assigned directly to carrier ${carrier.companyName || carrier.name}`
        };
      }
      return r;
    });

    onUpdateRequests(updated);

    // Save success message state & trigger visual success feedback
    setAssignmentSuccess(req.id);
    setTimeout(() => {
      setAssignmentSuccess(null);
      setSelectedCarrier(null);
    }, 2500);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="space-y-8 text-left"
    >
      {/* Visual Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black uppercase italic tracking-tight flex items-center gap-2">
            🚚 {language === 'PT' ? 'Diretório de Empresas de Logística' : 'Logistics Companies Directory'}
          </h2>
          <p className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-widest mt-1">
            {language === 'PT' 
              ? 'Contrate parceiros de transporte integrados ordenados por avaliação e indicadores de eficiência'
              : 'Hire integrated shipping partners ranked by rating and performance indices'}
          </p>
        </div>

        {/* Global search component */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder={language === 'PT' ? 'Buscar parceiro ou rota...' : 'Search agent or route...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs font-bold outline-none border transition-all ${
              isDarkMode 
                ? 'bg-zinc-950/60 border-white/5 text-zinc-200 focus:border-supplyx-blue' 
                : 'bg-white border-zinc-200 text-zinc-800 focus:border-supplyx-blue shadow-sm'
            }`}
          />
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block w-8 h-8 rounded-full border-4 border-t-supplyx-blue border-transparent animate-spin mb-3" />
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
            {language === 'PT' ? 'Carregando transportadoras...' : 'Loading logistics firms...'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {sortedAndFilteredCarriers.map((carrier, index) => {
            const rank = index + 1;
            const carrierRating = parseFloat(carrier.rating) || 4.5;
            return (
              <div
                key={carrier.id || index}
                className={`p-6 rounded-[32px] border transition-all relative flex flex-col justify-between min-h-[300px] overflow-hidden ${
                  isDarkMode 
                    ? 'bg-zinc-900 border-white/5 shadow-2 shadow-zinc-950/20 hover:border-white/10' 
                    : 'bg-white border-zinc-150 hover:bg-zinc-50/50 shadow-sm shadow-zinc-200/50'
                }`}
              >
                {/* Ranking Emblem */}
                <div className="absolute top-0 right-0">
                  <div className={`px-4 py-1.5 rounded-bl-[20px] text-[9px] font-black uppercase tracking-wider flex items-center gap-1 ${
                    rank === 1
                      ? 'bg-amber-500/10 text-amber-400 border-l border-b border-amber-500/10'
                      : rank === 2
                        ? 'bg-zinc-300/10 text-zinc-300 border-l border-b border-zinc-500/10'
                        : 'bg-zinc-500/5 text-zinc-500'
                  }`}>
                    <Award className="w-3.5 h-3.5" />
                    {language === 'PT' ? `#${rank} Eficiência` : `#${rank} Ranked`}
                  </div>
                </div>

                {/* Main Content */}
                <div>
                  <div className="flex items-start gap-4 mb-4">
                    {/* Logotipo Generator */}
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm uppercase shrink-0 ${
                      rank === 1 ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/15' :
                      rank === 2 ? 'bg-gradient-to-br from-zinc-400 to-zinc-600 text-white' : 'bg-gradient-to-br from-supplyx-blue/30 to-supplyx-blue text-white'
                    }`}>
                      {carrier.companyName?.substring(0, 2) || carrier.name?.substring(0, 2) || 'LG'}
                    </div>

                    <div>
                      <h3 className={`text-md font-black italic flex items-center gap-2 ${
                        isDarkMode ? 'text-white' : 'text-zinc-900'
                      }`}>
                        {carrier.companyName || carrier.name}
                        {carrierRating >= 4.7 && <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />}
                      </h3>
                      <p className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider mt-0.5">
                        {carrier.sector || (language === 'PT' ? 'Transporte & Logística Integrada' : 'Integrated Freight Operations')}
                      </p>
                    </div>
                  </div>

                  {/* Rating / KPIs */}
                  <div className="grid grid-cols-3 gap-3 mb-5 py-3 border-y border-white/[0.03] text-center">
                    <div>
                      <p className="text-[8px] text-zinc-500 font-extrabold uppercase tracking-widest mb-0.5">
                        {language === 'PT' ? 'Avaliação' : 'Rating'}
                      </p>
                      <div className="flex items-center justify-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span className={`text-xs font-black italic ${isDarkMode ? 'text-zinc-150' : 'text-zinc-800'}`}>
                          {carrierRating.toFixed(1)}
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="text-[8px] text-zinc-500 font-extrabold uppercase tracking-widest mb-0.5">
                        {language === 'PT' ? 'Pontualidade' : 'On-Time Rate'}
                      </p>
                      <p className="text-xs font-black text-emerald-500 italic">
                        {carrier.performance || '96.2%'}
                      </p>
                    </div>

                    <div>
                      <p className="text-[8px] text-zinc-500 font-extrabold uppercase tracking-widest mb-0.5">
                        {language === 'PT' ? 'Envios Concluídos' : 'Shipped Loads'}
                      </p>
                      <p className={`text-xs font-black italic ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                        {carrier.completedDeliveries || 85}
                      </p>
                    </div>
                  </div>

                  {/* Description Bio */}
                  <p className="text-[11px] text-zinc-500 font-medium leading-relaxed mb-4 line-clamp-2">
                    {carrier.bio || (language === 'PT' ? 'Operador credenciado no sistema de rastreabilidade de mercadorias SupplyX.' : 'Registered carrier operating across key regional commerce routes.')}
                  </p>

                  {/* Operational Details Grid */}
                  <div className="space-y-2 mt-4 text-[10.5px]">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Navigation className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span className="font-bold text-zinc-500">{language === 'PT' ? 'Corredores:' : 'Routes:'}</span>
                      <span className={`truncate font-extrabold ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                        {carrier.routes || 'Maputo - Beira - Nacala'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-zinc-400">
                      <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span className="font-bold text-zinc-500">{language === 'PT' ? 'Hub Principal:' : 'Primary Hub:'}</span>
                      <span className={`font-extrabold ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                        {carrier.city || 'Moçambique'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-between gap-4 mt-6 pt-4 border-t border-white/[0.03]">
                  {/* Small contact chips */}
                  <div className="flex gap-2.5">
                    {carrier.phone && (
                      <a href={`tel:${carrier.phone}`} title={carrier.phone} className="p-1 px-2 rounded-lg bg-zinc-500/10 text-zinc-400 hover:text-white hover:bg-zinc-500/20 transition-all text-[8px] font-black tracking-wider uppercase">
                        {language === 'PT' ? 'Ligar' : 'Call'}
                      </a>
                    )}
                    {carrier.email && (
                      <a href={`mailto:${carrier.email}`} title={carrier.email} className="p-1 px-2 rounded-lg bg-zinc-500/10 text-zinc-400 hover:text-white hover:bg-zinc-500/20 transition-all text-[8px] font-black tracking-wider uppercase">
                        Email
                      </a>
                    )}
                  </div>

                  {/* Hire trigger CTA */}
                  <button
                    onClick={() => setSelectedCarrier(carrier)}
                    className="p-2 px-4 rounded-xl bg-supplyx-blue hover:bg-supplyx-blue/90 text-[9.5px] font-black uppercase tracking-wider text-white shadow-lg shadow-supplyx-blue/15 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center gap-1.5"
                  >
                    {language === 'PT' ? 'Selecionar para Transporte' : 'Select for Transport'}
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cargo Assignment Overlay Modal */}
      <AnimatePresence>
        {selectedCarrier && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-lg rounded-[36px] border p-6 overflow-hidden ${
                isDarkMode ? 'bg-zinc-950 border-white/5 shadow-2xl shadow-black/80' : 'bg-white border-zinc-200'
              }`}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className={`text-lg font-black italic ${isDarkMode ? 'text-white' : 'text-zinc-950'}`}>
                    {language === 'PT' ? 'Atribuir Carga de Transporte' : 'Assign Cargo Transport'}
                  </h3>
                  <p className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wide mt-1">
                    {language === 'PT' ? 'Operador Selecionado:' : 'Selected Operator:'} <span className="text-supplyx-blue font-black">{selectedCarrier.companyName || selectedCarrier.name}</span>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedCarrier(null)}
                  className={`p-2 rounded-full transition-all ${
                    isDarkMode ? 'bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white' : 'bg-zinc-50 text-zinc-500 hover:text-zinc-950'
                  }`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Assignment Success Banner */}
              {assignmentSuccess ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8 animate-bounce" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white italic uppercase">
                      {language === 'PT' ? 'Cargo Atribuído com Sucesso!' : 'Transport successfully assigned!'}
                    </h4>
                    <p className="text-[10px] text-zinc-500 font-extrabold mt-1">
                      {language === 'PT' ? 'O status da mercadoria foi alterado para Atribuído no Firestore' : 'Cargo status has been securely modified to Assigned in Firestore'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-zinc-400 font-medium">
                    {language === 'PT' 
                      ? 'Selecione abaixo qual de suas cargas ativas e não despachadas deseja delegar a este parceiro comercial:'
                      : 'Select below which of your active untransported cargoes you wish to delegate to this business partner:'}
                  </p>

                  {/* Cargo Listings */}
                  <div className="max-h-[250px] overflow-y-auto pr-1 space-y-3 scrollbar-thin">
                    {assignableRequests.map((req) => (
                      <div
                        key={req.id}
                        className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                          isDarkMode 
                            ? 'bg-zinc-900/40 border-white/5 hover:bg-zinc-900/70' 
                            : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100/60'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="text-[8.5px] font-black text-supplyx-blue font-mono uppercase bg-supplyx-blue/10 px-2 py-0.5 rounded border border-supplyx-blue/15">
                              #{req.id}
                            </span>
                            <span className="text-[9px] font-black uppercase text-zinc-500 italic truncate">
                              {req.tipoCarga}
                            </span>
                          </div>
                          
                          {/* Route line */}
                          <p className="text-[10px] font-bold text-zinc-400 truncate">
                            📍 {req.origem} ➔ 🏁 {req.destino}
                          </p>
                          <p className="text-[9px] text-zinc-500 font-semibold mt-0.5">
                            {language === 'PT' ? 'Qtd / Peso:' : 'Qty / Cargo:'} {req.quantidade} ({req.peso})
                          </p>
                        </div>

                        {/* CTA micro button */}
                        <button
                          onClick={() => handleAssignCargo(req, selectedCarrier)}
                          className="shrink-0 p-2 px-3 rounded-lg bg-supplyx-blue text-white text-[9px] font-bold uppercase hover:bg-supplyx-blue/90"
                        >
                          {language === 'PT' ? 'Confimar' : 'Confirm'}
                        </button>
                      </div>
                    ))}

                    {assignableRequests.length === 0 && (
                      <div className="p-8 text-center border border-dashed border-zinc-800 rounded-3xl space-y-4">
                        <AlertCircle className="w-8 h-8 text-zinc-500 mx-auto" />
                        <div>
                          <p className="text-zinc-500 text-xs font-black uppercase tracking-widest leading-none">
                            {language === 'PT' ? 'Nenhuma carga disponível.' : 'No active client loads.'}
                          </p>
                          <p className="text-[9.5px] text-zinc-650 text-zinc-500 font-extrabold uppercase mt-1">
                            {language === 'PT' 
                              ? 'Você precisa primeiro registrar um dossiê/pedido de logística!' 
                              : 'You must first create a registered shipping requisition!'}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedCarrier(null);
                            setActiveSubTab('create_request');
                          }}
                          className="p-2 w-full rounded-xl bg-zinc-500/10 hover:bg-zinc-500/20 text-zinc-300 text-[10px] font-black uppercase tracking-wider transition-all"
                        >
                          {language === 'PT' ? '➕ Criar Nova Solicitação' : '➕ Create New Cargo Request'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
