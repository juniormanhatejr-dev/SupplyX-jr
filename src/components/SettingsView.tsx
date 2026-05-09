import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, User, Bell, Shield, CreditCard, HelpCircle, Moon, Sun, Monitor, Loader2, CheckCircle2, Eye, ArrowLeft } from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import ProfileModal from './ProfileModal';

interface SettingsViewProps {
  isDarkMode: boolean;
  language: 'PT' | 'EN';
  onBack?: () => void;
  initialIsEditing?: boolean;
  onLanguageChange?: (lang: 'PT' | 'EN') => void;
  onThemeToggle?: () => void;
}

export default function SettingsView({ 
  isDarkMode, 
  language, 
  onBack, 
  initialIsEditing = false,
  onLanguageChange,
  onThemeToggle
}: SettingsViewProps) {
  const { profile, refreshProfile } = useAuth();
  const [isEditingProfile, setIsEditingProfile] = useState(initialIsEditing);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    if (initialIsEditing) {
      setIsEditingProfile(true);
    }
  }, [initialIsEditing]);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    userName: '',
    nuit: '',
    phone: '',
    address: '',
    bio: '',
    city: '',
    photoURL: '',
    coverURL: '',
  });

  const cities = ['Maputo', 'Matola', 'Beira', 'Nampula', 'Tete', 'Pemba'];

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        userName: profile.userName || '',
        nuit: profile.nuit || '',
        phone: profile.phone || '',
        address: profile.address || '',
        bio: profile.bio || '',
        city: profile.city || '',
        photoURL: profile.photoURL || '',
        coverURL: profile.coverURL || '',
      });
    }
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setIsLoading(true);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        ...formData,
        updatedAt: serverTimestamp(),
      });
      await refreshProfile();
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setIsEditingProfile(false);
      }, 2000);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
    } finally {
      setIsLoading(false);
    }
  };

  const t = {
    PT: {
      title: 'Ajustes do Sistema',
      subtitle: 'Gerencie sua conta e preferências da plataforma.',
      profileTitle: 'Perfil Corporativo',
      profileDesc: 'Informações da sua empresa e contatos.',
      notifs: 'Notificações',
      notifsDesc: 'Configure como você recebe alertas.',
      security: 'Segurança',
      securityDesc: 'Senha e autenticação em duas etapas.',
      billing: 'Faturamento',
      billingDesc: 'Gerencie seus planos e métodos de pagamento.',
      save: 'Salvar Alterações',
      cancel: 'Cancelar',
      updating: 'Atualizando...',
      updated: 'Perfil Atualizado!',
      viewMyProfile: 'Ver Meu Perfil',
      visualAppearance: 'Aparência Visual',
      visualAppearanceDesc: 'Alterne entre o modo claro e o tema dark brutalista do SupplyX.',
      darkMode: 'Modo Escuro / Dark',
      systemLanguage: 'Idioma do Sistema',
      systemLanguageDesc: 'Defina o idioma principal para navegação e comunicações.',
      labels: {
        companyName: 'Nome da Empresa / Entidade',
        userName: 'Nome do Responsável / Usuário',
        taxId: 'NUIT / Identificação Fiscal',
        contactPhone: 'Telefone de Contacto',
        city: 'Cidade Principal',
        address: 'Localização / Endereço',
        photoUrl: 'URL da Foto de Perfil',
        coverUrl: 'URL da Imagem de Capa',
        bio: 'Bio / Descrição da Empresa'
      }
    },
    EN: {
      title: 'System Settings',
      subtitle: 'Manage your account and platform preferences.',
      profileTitle: 'Corporate Profile',
      profileDesc: 'Your company info and contacts.',
      notifs: 'Notifications',
      notifsDesc: 'Configure how you receive alerts.',
      security: 'Security',
      securityDesc: 'Password and two-factor authentication.',
      billing: 'Billing',
      billingDesc: 'Manage plans and payment methods.',
      save: 'Save Changes',
      cancel: 'Cancel',
      updating: 'Updating...',
      updated: 'Profile Updated!',
      viewMyProfile: 'View My Profile',
      visualAppearance: 'Visual Appearance',
      visualAppearanceDesc: 'Toggle between light mode and SupplyX\'s brutalist dark theme.',
      darkMode: 'Dark Mode',
      systemLanguage: 'System Language',
      systemLanguageDesc: 'Set the primary language for navigation and communications.',
      labels: {
        companyName: 'Company Name / Entity',
        contactPhone: 'Contact Phone',
        city: 'Main City',
        address: 'Operation Address',
        photoUrl: 'Profile Photo URL',
        coverUrl: 'Cover Image URL',
        bio: 'Bio / Company Description'
      }
    }
  }[language];

  const sections = [
    { id: 'profile', title: t.profileTitle, desc: t.profileDesc, icon: User, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'notifs', title: t.notifs, desc: t.notifsDesc, icon: Bell, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { id: 'security', title: t.security, desc: t.securityDesc, icon: Shield, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { id: 'billing', title: t.billing, desc: t.billingDesc, icon: CreditCard, color: 'text-brand', bg: 'bg-brand/10' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {onBack && (
            <button 
              onClick={onBack}
              className={`p-3 rounded-2xl border transition-all ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white' : 'bg-white border-zinc-100 text-zinc-500 hover:text-zinc-900 shadow-sm'}`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h2 className={`text-2xl font-black italic uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
              {t.title}
            </h2>
            <p className="text-zinc-500 text-sm font-bold">{t.subtitle}</p>
          </div>
        </div>
        <button 
          onClick={() => setIsProfileModalOpen(true)}
          className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest italic transition-all ${
            isDarkMode ? 'bg-zinc-800 text-brand hover:bg-zinc-700' : 'bg-brand/5 text-brand hover:bg-brand/10'
          }`}
        >
          <Eye className="w-4 h-4" />
          {t.viewMyProfile}
        </button>
      </div>

      <ProfileModal 
        userId={auth.currentUser?.uid || ''}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onEdit={() => {
          setIsProfileModalOpen(false);
          setIsEditingProfile(true);
        }}
        isDarkMode={isDarkMode}
        language={language}
      />

      {!isEditingProfile ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map((section) => (
            <button 
              key={section.id}
              onClick={() => {
                if (section.id === 'profile') setIsEditingProfile(true);
              }}
              className={`p-6 rounded-3xl border text-left transition-all hover:scale-[1.02] active:scale-98 ${
                isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800' : 'bg-white border-zinc-100 shadow-sm hover:shadow-xl hover:shadow-zinc-200/50'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${section.bg}`}>
                  <section.icon className={`w-7 h-7 ${section.color}`} />
                </div>
                <div>
                  <h3 className={`text-sm font-black uppercase italic tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                    {section.title}
                  </h3>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">{section.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <motion.form 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          onSubmit={handleUpdateProfile}
          className={`p-8 rounded-3xl border space-y-6 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100 shadow-xl'}`}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-xl font-black italic uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
              {t.profileTitle}
            </h3>
            <button type="button" onClick={() => setIsEditingProfile(false)} className="text-zinc-500 hover:text-red-500 font-bold text-xs uppercase tracking-widest">
              {t.cancel}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">{t.labels.companyName}</label>
              <input 
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full p-4 rounded-2xl text-xs font-bold outline-none border-2 transition-all ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white focus:border-brand/50' : 'bg-zinc-50 border-zinc-100 focus:border-brand/30'}`}
                placeholder="Ex: Manhate Jr Construction"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">{t.labels.userName}</label>
              <input 
                type="text"
                value={formData.userName}
                onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                className={`w-full p-4 rounded-2xl text-xs font-bold outline-none border-2 transition-all ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white focus:border-brand/50' : 'bg-zinc-50 border-zinc-100 focus:border-brand/30'}`}
                placeholder="Ex: Fernando Manhate"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">{t.labels.taxId}</label>
              <input 
                type="text"
                value={formData.nuit}
                onChange={(e) => setFormData({ ...formData, nuit: e.target.value })}
                className={`w-full p-4 rounded-2xl text-xs font-bold outline-none border-2 transition-all ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white focus:border-brand/50' : 'bg-zinc-50 border-zinc-100 focus:border-brand/30'}`}
                placeholder="123 456 789"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">{t.labels.contactPhone}</label>
              <input 
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={`w-full p-4 rounded-2xl text-xs font-bold outline-none border-2 transition-all ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white focus:border-brand/50' : 'bg-zinc-50 border-zinc-100 focus:border-brand/30'}`}
                placeholder="+258 84 000 0000"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">{t.labels.city}</label>
              <select 
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className={`w-full p-4 rounded-2xl text-xs font-bold outline-none border-2 transition-all ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white focus:border-brand/50' : 'bg-zinc-50 border-zinc-100 focus:border-brand/30'}`}
              >
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">{t.labels.address}</label>
              <input 
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className={`w-full p-4 rounded-2xl text-xs font-bold outline-none border-2 transition-all ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white focus:border-brand/50' : 'bg-zinc-50 border-zinc-100 focus:border-brand/30'}`}
                placeholder="Ex: Av. Eduardo Mondlane, Maputo"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">{t.labels.photoUrl}</label>
                <input 
                  type="text"
                  value={formData.photoURL}
                  onChange={(e) => setFormData({ ...formData, photoURL: e.target.value })}
                  className={`w-full p-4 rounded-2xl text-xs font-bold outline-none border-2 transition-all ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white focus:border-brand/50' : 'bg-zinc-50 border-zinc-100 focus:border-brand/30'}`}
                  placeholder="https://images.unsplash.com/..."
                />
              </div>
              {formData.photoURL && (
                <div className={`w-20 h-20 rounded-2xl overflow-hidden border-2 ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`}>
                  <img src={formData.photoURL} alt="Avatar Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">{t.labels.coverUrl}</label>
                <input 
                  type="text"
                  value={formData.coverURL}
                  onChange={(e) => setFormData({ ...formData, coverURL: e.target.value })}
                  className={`w-full p-4 rounded-2xl text-xs font-bold outline-none border-2 transition-all ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white focus:border-brand/50' : 'bg-zinc-50 border-zinc-100 focus:border-brand/30'}`}
                  placeholder="https://images.unsplash.com/..."
                />
              </div>
              {formData.coverURL && (
                <div className={`w-full h-20 rounded-2xl overflow-hidden border-2 ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`}>
                  <img src={formData.coverURL} alt="Cover Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">{t.labels.bio}</label>
            <textarea 
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className={`w-full p-4 rounded-2xl text-xs font-bold outline-none border-2 transition-all h-32 resize-none ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white focus:border-brand/50' : 'bg-zinc-50 border-zinc-100 focus:border-brand/30'}`}
              placeholder="Descreva brevemente suas atividades e especialidades..."
            />
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className={`w-full py-5 bg-brand text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3 ${isLoading ? 'opacity-70 pointer-events-none' : ''}`}
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 
             success ? <CheckCircle2 className="w-5 h-5" /> : null}
            {isLoading ? t.updating : success ? t.updated : t.save}
          </button>
        </motion.form>
      )}

      <div className={`p-8 rounded-3xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100 shadow-sm'}`}>
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-500/10 pb-6">
            <div>
              <h4 className={`text-sm font-black uppercase italic tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                {t.visualAppearance}
              </h4>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">{t.visualAppearanceDesc}</p>
            </div>
            <div className={`flex p-1 rounded-xl ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
              <button 
                onClick={() => isDarkMode && onThemeToggle?.()}
                className={`p-2 rounded-lg transition-all ${!isDarkMode ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-400 hover:text-white'}`}
              >
                <Sun className="w-4 h-4" />
              </button>
              <button 
                onClick={() => !isDarkMode && onThemeToggle?.()}
                className={`p-2 rounded-lg transition-all ${isDarkMode ? 'bg-zinc-900 shadow-sm text-white' : 'text-zinc-400 hover:text-zinc-900'}`}
              >
                <Moon className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between border-b border-zinc-500/10 pb-6">
             <div>
              <h4 className={`text-sm font-black uppercase italic tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                {t.systemLanguage}
              </h4>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">{t.systemLanguageDesc}</p>
            </div>
            <select 
              value={language}
              onChange={(e) => onLanguageChange?.(e.target.value as 'PT' | 'EN')}
              className={`bg-transparent text-sm font-black uppercase border-none outline-none cursor-pointer transition-all hover:text-brand ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}
            >
              <option value="PT">PT</option>
              <option value="EN">EN</option>
            </select>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
