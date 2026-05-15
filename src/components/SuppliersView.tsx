import { motion, AnimatePresence } from 'motion/react';
import { Handshake, Search, Star, MapPin, ExternalLink, MoreVertical, ArrowLeft, Phone, Mail, Globe, ShieldCheck, Clock, Award, Loader2, CheckCircle2, ChevronRight, Zap } from 'lucide-react';
import { OptimizedImage } from './ui/OptimizedImage';
import UserPresenceIndicator from './UserPresenceIndicator';
import { useState, useEffect, useMemo } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, getDocs, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { rankSuppliers, PROVINCE_COORDINATES } from '../services/supplierRankingService';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

interface Supplier {
  id: string;
  uid: string;
  name: string;
  sector: string;
  address: string;
  phone: string;
  email: string;
  bio?: string;
  rating?: number;
  city?: string;
  photoURL?: string;
  catalogItems?: string[]; // Added this to the interface
}

interface SuppliersViewProps {
  isDarkMode: boolean;
  language: 'PT' | 'EN';
  onViewProfile?: (uid: string) => void;
  onNavigate?: (tab: string, payload?: any) => void;
  userType?: 'buyer' | 'supplier';
}

export default function SuppliersView({ isDarkMode, language, onViewProfile, onNavigate, userType = 'buyer' }: SuppliersViewProps) {
  const { profile } = useAuth();
  const { items: cartItems } = useCart();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('type', '==', 'supplier'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        uid: doc.id,
        ...doc.data()
      })) as Supplier[];
      setSuppliers(fetched);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'users');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const rankedSuppliers = useMemo(() => {
    if (!profile) return suppliers;

    const buyerLoc = PROVINCE_COORDINATES[profile.city || 'Maputo Cidade'] || PROVINCE_COORDINATES['Maputo Cidade'];
    const requestedItems = cartItems.map(i => i.name);

    if (requestedItems.length === 0) {
      // If cart empty, just rank by distance
      return suppliers.sort((a, b) => {
        const distA = PROVINCE_COORDINATES[a.city || 'Maputo Cidade'] ? 1 : 0;
        const distB = PROVINCE_COORDINATES[b.city || 'Maputo Cidade'] ? 1 : 0;
        return distB - distA; // Just a dummy sort if no ranking
      });
    }

    const suppliersForRanking = suppliers.map(s => ({
      id: s.uid,
      location: PROVINCE_COORDINATES[s.city || 'Maputo Cidade'] || PROVINCE_COORDINATES['Maputo Cidade'],
      catalogItems: s.catalogItems || [s.sector] // Fallback to sector if no catalog items
    }));

    const rankings = rankSuppliers(buyerLoc, requestedItems, suppliersForRanking);
    
    return suppliers.map(s => {
      const r = rankings.find(rank => rank.supplierId === s.uid);
      return {
        ...s,
        ranking: r
      };
    }).sort((a: any, b: any) => (b.ranking?.score || 0) - (a.ranking?.score || 0));
  }, [suppliers, profile, cartItems]);

  const filteredSuppliers = rankedSuppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.sector?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const t = {
    PT: {
      strategicPartners: 'Parceiros Estratégicos',
      searchSuppliers: 'Pesquisar fornecedores...',
      fullProfile: 'Perfil Completo',
      loyal: 'Fidelizado',
      location: 'Localização',
      backToList: 'Voltar para lista',
      fallbackBio: `Atuando no setor de ${selectedSupplier?.sector} com excelência e compromisso. Especialistas em soluções para construção civil em Moçambique.`,
      certifications: 'Certificações',
      certificationsDesc: 'ISO 9001, ISO 14001 e selo de sustentabilidade ODS.',
      leadTime: 'Prazo Médio',
      leadTimeDesc: '3-5 dias úteis para entrega na região metropolitana.',
      creditScore: 'Score de Crédito',
      creditScoreDesc: 'AAA+ - Excelente histórico de pagamentos e solidez.',
      noSuppliers: 'Nenhum fornecedor encontrado.',
      bestMatch: 'Melhor Match',
      bestMatchDesc: 'Fornecedor com alta eficiência, proximidade e diversidade de stock.'
    },
    EN: {
      strategicPartners: 'Strategic Partners',
      searchSuppliers: 'Search suppliers...',
      fullProfile: 'Full Profile',
      loyal: 'Loyal',
      location: 'Location',
      backToList: 'Back to list',
      fallbackBio: `Operating in the ${selectedSupplier?.sector} sector with excellence and commitment. Specialists in construction solutions in Mozambique.`,
      certifications: 'Certifications',
      certificationsDesc: 'ISO 9001, ISO 14001 and ODS sustainability seal.',
      leadTime: 'Average Lead Time',
      leadTimeDesc: '3-5 business days for metro region delivery.',
      creditScore: 'Credit Score',
      creditScoreDesc: 'AAA+ - Excellent payment history and solidity.',
      noSuppliers: 'No suppliers found.',
      bestMatch: 'Best Match',
      bestMatchDesc: 'Supplier with high efficiency, proximity, and stock diversity.'
    }
  }[language];

  // Remove the restriction block here
  /*
  if (userType === 'supplier') {
    ...
  }
  */

  if (selectedSupplier) {
    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-8"
      >
        <button 
          onClick={() => setSelectedSupplier(null)}
          className={`px-5 py-2.5 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all italic border shadow-xl shadow-black/5 ${
            isDarkMode ? 'bg-zinc-800 border-zinc-700 text-brand hover:brightness-110' : 'bg-white border-zinc-100 text-brand hover:bg-brand/5'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          {t.backToList}
        </button>

        <div className={`p-8 rounded-3xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100 shadow-sm'}`}>
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className={`w-24 h-24 shrink-0 rounded-3xl flex items-center justify-center overflow-hidden ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-50'}`}>
              {selectedSupplier.photoURL ? (
                <OptimizedImage 
                  src={selectedSupplier.photoURL} 
                  alt={selectedSupplier.name} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                  containerClassName="w-full h-full"
                />
              ) : (
                <Handshake className="w-12 h-12 text-brand" />
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <h2 className={`text-3xl font-black italic tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{selectedSupplier.name}</h2>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'bg-brand/10 text-brand' : 'bg-brand/5 text-brand'}`}>
                  {selectedSupplier.sector}
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-black">
                  <Star className="w-3 h-3 fill-amber-500" />
                  {selectedSupplier.rating || 4.5}
                </div>
                <UserPresenceIndicator 
                  userId={selectedSupplier.uid} 
                  language={language}
                />
              </div>

              <p className={`text-sm leading-relaxed max-w-2xl mb-8 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                {selectedSupplier.bio || t.fallbackBio}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest flex items-center gap-2">
                    <MapPin className="w-3 h-3" /> {t.location}
                  </p>
                  <p className={`text-sm font-black italic uppercase tracking-tight ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}>{selectedSupplier.city || 'Maputo'}, {selectedSupplier.address || (language === 'PT' ? 'Moçambique' : 'Mozambique')}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest flex items-center gap-2">
                    <Mail className="w-3 h-3" /> {language === 'PT' ? 'E-mail:' : 'Email:'}
                  </p>
                  <p className={`text-sm font-black italic uppercase tracking-tight ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}>{selectedSupplier.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest flex items-center gap-2">
                    <Phone className="w-3 h-3" /> {language === 'PT' ? 'Telefone:' : 'Phone:'}
                  </p>
                  <p className={`text-sm font-black italic uppercase tracking-tight ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}>{selectedSupplier.phone}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest flex items-center gap-2">
                    <Globe className="w-3 h-3" /> Website
                  </p>
                  <p className={`text-sm font-black italic uppercase tracking-tight ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}>www.{selectedSupplier.name.toLowerCase().replace(/\s/g, '')}.co.mz</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-100'}`}>
            <ShieldCheck className="w-8 h-8 text-emerald-500 mb-4" />
            <h4 className={`font-black uppercase italic tracking-tighter mb-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
              {t.certifications}
            </h4>
            <p className="text-xs text-zinc-500 font-bold leading-relaxed">
              {t.certificationsDesc}
            </p>
          </div>
          <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-100'}`}>
            <Clock className="w-8 h-8 text-brand mb-4" />
            <h4 className={`font-black uppercase italic tracking-tighter mb-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
              {t.leadTime} & Stock
            </h4>
            <p className="text-xs text-zinc-500 font-bold leading-relaxed mb-2">
              {t.leadTimeDesc}
            </p>
            <p className="text-[10px] text-brand font-black uppercase tracking-widest bg-brand/10 p-2 rounded-lg">
              92% Cobertura de Stock Essencial
            </p>
          </div>
          <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-100'}`}>
            <Award className="w-8 h-8 text-amber-500 mb-4" />
            <h4 className={`font-black uppercase italic tracking-tighter mb-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
              {t.creditScore}
            </h4>
            <p className="text-xs text-zinc-500 font-bold leading-relaxed">
              {t.creditScoreDesc}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className={`text-xl font-black uppercase italic tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
          {t.strategicPartners}
        </h2>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.searchSuppliers}
            className={`w-full pl-10 pr-4 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand/20 transition-all ${
              isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500' : 'bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400'
            }`}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-brand animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSuppliers.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className={`p-6 rounded-[32px] border transition-all group relative overflow-hidden ${
                isDarkMode ? 'bg-zinc-900/50 border-white/5 hover:border-brand/30' : 'bg-white border-zinc-100 shadow-sm hover:shadow-xl hover:shadow-zinc-200/50'
              } backdrop-blur-md`}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="relative group/avatar">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover/avatar:scale-110 overflow-hidden ${
                    isDarkMode ? 'bg-zinc-800 border border-white/5' : 'bg-zinc-50 border border-zinc-100'
                  }`}>
                    {s.photoURL ? (
                      <OptimizedImage 
                        src={s.photoURL} 
                        alt={s.name} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer" 
                        containerClassName="w-full h-full"
                      />
                    ) : (
                      <Handshake className="w-7 h-7 text-brand" />
                    )}
                  </div>
                  {/* Floating Status Badge on Card Avatar */}
                  <div className="absolute -bottom-1 -right-1 ring-4 ring-zinc-900 rounded-full bg-zinc-900 overflow-hidden">
                    <UserPresenceIndicator 
                      userId={s.uid} 
                      showLastSeen={false} 
                      className="hidden" 
                      onlineClassName="block"
                    />
                  </div>
                </div>
                <button className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'text-zinc-500 hover:text-white' : 'text-zinc-300 hover:text-zinc-600'}`}>
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
              
              <h3 className={`text-lg font-black uppercase italic tracking-tighter mb-1 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{s.name}</h3>
              <div className="flex items-center gap-2 mb-4">
                <p className="text-[10px] font-black text-brand uppercase tracking-widest leading-none">{s.sector}</p>
                {((s as any).ranking?.productMatch >= 0.9 || (s as any).ranking?.score >= 0.8) && (
                  <div className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-md text-[8px] font-black uppercase tracking-widest flex items-center gap-1 border border-emerald-500/20">
                    <Zap className="w-2.5 h-2.5 fill-emerald-500" />
                    {t.bestMatch}
                  </div>
                )}
              </div>
              
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-2 text-sm text-[11px] font-bold">
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded-lg text-[10px] font-black">
                    <Star className="w-3 h-3 fill-amber-500" />
                    {s.rating || 4.5}
                  </div>
                  {(s as any).ranking && (
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-brand/10 text-brand rounded-lg text-[10px] font-black">
                      <Zap className="w-3 h-3" />
                      {Math.round((s as any).ranking.productMatch * 100)}% Match
                    </div>
                  )}
                </div>
                <div className={`flex items-center gap-2 text-[11px] font-bold ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  <MapPin className="w-4 h-4 text-brand/60" />
                  {s.city || 'Maputo'} {(s as any).ranking && `• ${Math.round((s as any).ranking.distanceKm)}km`}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-zinc-500/10 mb-[-4px] mx-[-4px]">
                <button 
                  onClick={() => {
                    if (onViewProfile) {
                      onViewProfile(s.uid);
                    } else {
                      setSelectedSupplier(s);
                    }
                  }}
                  className={`flex-1 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    isDarkMode ? 'bg-zinc-900 text-zinc-300 hover:bg-brand hover:text-white' : 'bg-zinc-50 text-zinc-600 hover:bg-brand hover:text-white shadow-sm'
                  }`}
                >
                  {t.fullProfile}
                </button>
                <button 
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (!auth.currentUser) return;
                    
                    try {
                      // Logic to start chat similar to ProductsView
                      const roomsRef = collection(db, 'chats');
                      const q = query(
                        roomsRef,
                        where('participants', 'array-contains', auth.currentUser.uid)
                      );
                
                      const snapshot = await getDocs(q);
                      const existingRoom = snapshot.docs.find(doc => {
                        const participants = doc.data().participants as string[];
                        return participants.includes(s.uid);
                      });
                
                      if (existingRoom) {
                        onNavigate?.('Mensagens', { userId: s.uid });
                        return;
                      }
                
                      // Create new room
                      await addDoc(collection(db, 'chats'), {
                        participants: [auth.currentUser.uid, s.uid],
                        lastMessage: 'Início da conversa',
                        updatedAt: serverTimestamp(),
                        participantNames: {
                          [auth.currentUser.uid]: auth.currentUser.displayName || 'User',
                          [s.uid]: s.name
                        }
                      });
                      onNavigate?.('Mensagens', { userId: s.uid });
                    } catch (err) {
                      handleFirestoreError(err, OperationType.WRITE, 'chats');
                    }
                  }}
                  className={`p-3 rounded-2xl transition-all border ${
                  isDarkMode ? 'border-zinc-800 bg-brand/5 text-brand hover:bg-brand hover:text-white' : 'border-zinc-100 bg-brand/5 text-brand hover:bg-brand hover:text-white'
                }`}>
                  <Mail className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
          {filteredSuppliers.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <p className="text-zinc-500 font-bold italic">{t.noSuppliers}</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

