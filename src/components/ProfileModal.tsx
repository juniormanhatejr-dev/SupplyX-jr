import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  MapPin, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Building2, 
  Database,
  Calendar,
  Briefcase,
  Star,
  Award,
  ArrowLeft,
  PenLine
} from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { OptimizedImage } from './ui/OptimizedImage';

interface UserProfile {
  uid: string;
  name: string;
  userName?: string;
  nuit: string;
  address: string;
  phone: string;
  email: string;
  type: 'buyer' | 'supplier';
  sector: string;
  bio?: string;
  photoURL?: string;
  coverURL?: string;
  city?: string;
  createdAt: any;
}

interface ProfileModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onViewCatalog?: (userId: string) => void;
  isDarkMode?: boolean;
  language?: 'PT' | 'EN';
}

export default function ProfileModal({ userId, isOpen, onClose, onEdit, onViewCatalog, isDarkMode, language = 'PT' }: ProfileModalProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const t = {
    PT: {
      back: 'Voltar',
      loading: 'Carregando Perfil...',
      verifiedSupplier: 'Fornecedor Verificado',
      verifiedBuyer: 'Comprador Verificado',
      about: 'Sobre',
      contact: 'Contacto',
      company: 'Empresa',
      editData: 'Editar Dados',
      closeProfile: 'Fechar Perfil',
      viewCatalog: 'Ver Catálogo',
      rating: 'Avaliação',
      reviews: 'Avaliações',
      notFound: 'Perfil não encontrado.',
      defaultBio: (sector: string) => `Atuando no setor de ${sector} com excelência e compromisso. Especialistas em soluções para construção civil em Moçambique.`
    },
    EN: {
      back: 'Back',
      loading: 'Loading Profile...',
      verifiedSupplier: 'Verified Supplier',
      verifiedBuyer: 'Verified Buyer',
      about: 'About',
      contact: 'Contact',
      company: 'Company',
      editData: 'Edit Profile',
      closeProfile: 'Close Profile',
      viewCatalog: 'View Catalog',
      rating: 'Rating',
      reviews: 'Reviews',
      notFound: 'Profile not found.',
      defaultBio: (sector: string) => `Operating in the ${sector} sector with excellence and commitment. Specialists in construction solutions in Mozambique.`
    }
  }[language];

  useEffect(() => {
    if (isOpen && userId) {
      setLoading(true);
      const fetchProfile = async () => {
        try {
          const docRef = doc(db, 'users', userId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    }
  }, [isOpen, userId]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`w-full max-w-lg rounded-[40px] overflow-hidden border relative ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100 shadow-2xl'}`}
          >
            {/* Stay-on-top buttons */}
            <button 
              onClick={onClose}
              className="absolute top-6 left-6 flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-zinc-900 text-[11px] font-black uppercase tracking-widest transition-all z-[210] shadow-xl shadow-black/20 group active:scale-95 border border-zinc-100"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              {t.back}
            </button>

            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full bg-zinc-950/20 hover:bg-zinc-950/40 backdrop-blur-md text-white transition-colors z-[210] border border-white/20"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="max-h-[85vh] overflow-y-auto">
              {/* Header / Cover */}
              <div className="h-44 relative shrink-0">
                <OptimizedImage 
                  src={profile?.coverURL || 'https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?w=1000&q=80'} 
                  alt="Cover" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  containerClassName="w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 to-transparent" />
                
                <div className="absolute -bottom-12 left-8 flex items-end gap-6">
                  <div className={`w-32 h-32 rounded-[32px] border-4 overflow-hidden shadow-2xl flex items-center justify-center ${isDarkMode ? 'bg-zinc-900 border-zinc-900' : 'bg-white border-white'}`}>
                    {profile?.photoURL ? (
                      <OptimizedImage 
                        src={profile.photoURL} 
                        alt={profile.name} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        containerClassName="w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-brand/10 text-brand">
                        <span className="text-4xl font-black italic">{profile?.name?.charAt(0) || '?'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-16 p-8">
              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4">
                  <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t.loading}</p>
                </div>
              ) : profile ? (
                <>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`text-3xl font-black italic uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                          {profile.name}
                        </h3>
                        <ShieldCheck className="w-6 h-6 text-brand" />
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                         <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${profile.type === 'supplier' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                          {profile.type === 'supplier' ? t.verifiedSupplier : t.verifiedBuyer}
                        </span>
                        {profile.userName && (
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                            • {profile.userName}
                          </span>
                        )}
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                          • {profile.sector} • {profile.city || 'Maputo'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                       <div className={`px-4 py-2 rounded-2xl border flex flex-col items-center min-w-[70px] ${isDarkMode ? 'bg-zinc-800/50 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
                        <span className={`text-sm font-black italic ${isDarkMode ? 'text-white' : 'text-brand'}`}>4.9</span>
                        <span className="text-[8px] font-black uppercase text-zinc-500">{t.rating}</span>
                       </div>
                       <div className={`px-4 py-2 rounded-2xl border flex flex-col items-center min-w-[70px] ${isDarkMode ? 'bg-zinc-800/50 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
                        <span className={`text-sm font-black italic ${isDarkMode ? 'text-white' : 'text-brand'}`}>342</span>
                        <span className="text-[8px] font-black uppercase text-zinc-500">{t.reviews}</span>
                       </div>
                    </div>
                  </div>

                  <div className="mb-8">
                    <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 mb-2">{t.about}</h4>
                    <p className={`text-sm leading-relaxed italic ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      {profile.bio || t.defaultBio(profile.sector)}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">{t.contact}</h4>
                      
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl shrink-0 ${isDarkMode ? 'bg-zinc-800 text-zinc-500' : 'bg-zinc-100 text-zinc-400'}`}>
                          <MapPin className="w-3.5 h-3.5" />
                        </div>
                        <p className={`text-xs font-bold leading-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{profile.address || (language === 'PT' ? 'Maputo, Moçambique' : 'Maputo, Mozambique')}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl shrink-0 ${isDarkMode ? 'bg-zinc-800 text-zinc-500' : 'bg-zinc-100 text-zinc-400'}`}>
                          <Phone className="w-3.5 h-3.5" />
                        </div>
                        <p className={`text-xs font-bold leading-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{profile.phone || '+258 84 000 0000'}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">{t.company}</h4>
                      
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl shrink-0 ${isDarkMode ? 'bg-zinc-800 text-zinc-500' : 'bg-zinc-100 text-zinc-400'}`}>
                          <Mail className="w-3.5 h-3.5" />
                        </div>
                        <p className={`text-xs font-bold leading-tight truncate ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{profile.email}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl shrink-0 ${isDarkMode ? 'bg-zinc-800 text-zinc-500' : 'bg-zinc-100 text-zinc-400'}`}>
                          <Building2 className="w-3.5 h-3.5" />
                        </div>
                        <p className={`text-xs font-bold leading-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>NUIT: {profile.nuit}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    {auth.currentUser?.uid === userId ? (
                      <button 
                        onClick={() => {
                          onClose();
                          if (onEdit) onEdit();
                        }}
                        className="flex-1 py-4 bg-zinc-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest italic hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
                      >
                        <PenLine className="w-4 h-4" />
                        {t.editData}
                      </button>
                    ) : (
                      <button 
                        onClick={onClose}
                        className="flex-1 py-4 bg-zinc-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest italic hover:bg-zinc-800 transition-all active:scale-95 shadow-xl shadow-zinc-950/20"
                      >
                        {t.closeProfile}
                      </button>
                    )}
                    {profile.type === 'supplier' && (
                      <button 
                        onClick={() => {
                          onClose();
                          if (onViewCatalog) onViewCatalog(userId);
                        }}
                        className="px-6 py-4 border-2 border-brand text-brand rounded-2xl font-black text-[10px] uppercase tracking-widest italic hover:bg-brand hover:text-white transition-all"
                      >
                        {t.viewCatalog}
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="py-20 text-center">
                  <p className="text-zinc-500 text-xs font-bold italic">{t.notFound}</p>
                </div>
              )}
            </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
