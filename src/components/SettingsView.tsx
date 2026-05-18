import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, User, Bell, Shield, CreditCard, HelpCircle, Moon, Sun, Monitor, Loader2, CheckCircle2, Eye, ArrowLeft, Upload, FileImage, Image as ImageIcon, X } from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType, uploadFile } from '../lib/firebase';
import { doc, updateDoc, serverTimestamp, collection, getDocs, deleteDoc, query, where } from 'firebase/firestore';
import { sendEmailVerification } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import ProfileModal from './ProfileModal';

interface SettingsViewProps {
  isDarkMode: boolean;
  language: 'PT' | 'EN';
  onBack?: () => void;
  onNavigate?: (tab: string, payload?: any) => void;
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
  const [isUploading, setIsUploading] = useState<{ photo: boolean; cover: boolean }>({ photo: false, cover: false });

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
    license: '',
    bio: '',
    city: '',
    photoURL: '',
    coverURL: '',
    fleetSize: '',
    specialization: '',
    bankAccounts: [] as { bankName: string; accountNumber: string; nib: string }[],
    mobileWallets: [] as { provider: string; number: string; name: string }[]
  });

  const provinces = [
    'Maputo Cidade', 'Maputo Província', 'Gaza', 'Inhambane', 'Sofala', 
    'Manica', 'Tete', 'Zambézia', 'Nampula', 'Niassa', 'Cabo Delgado'
  ];

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        userName: profile.userName || '',
        nuit: profile.nuit || '',
        phone: profile.phone || '',
        address: profile.address || '',
        license: (profile as any).license || '',
        bio: profile.bio || '',
        city: profile.city || '',
        photoURL: profile.photoURL || '',
        coverURL: profile.coverURL || '',
        fleetSize: profile.fleetSize || '',
        specialization: profile.specialization || '',
        bankAccounts: profile.bankAccounts || [],
        mobileWallets: profile.mobileWallets || [],
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'cover') => {
    console.log(`handleFileChange triggered for ${type}`);
    const file = e.target.files?.[0];
    if (!file) {
      console.log('No file selected');
      return;
    }
    console.log('File selected:', { name: file.name, size: file.size, type: file.type });

    if (!auth.currentUser) {
      console.log('User not authenticated');
      alert(language === 'PT' ? 'Você precisa estar logado para carregar imagens.' : 'You must be logged in to upload images.');
      return;
    }

    // Validate if it's an image
    if (!file.type.startsWith('image/')) {
      alert(language === 'PT' ? 'Por favor, selecione uma imagem válida.' : 'Please select a valid image.');
      return;
    }

    setIsUploading(prev => ({ ...prev, [type]: true }));
    try {
      const path = `users/${auth.currentUser.uid}/${type}_${Date.now()}_${file.name}`;
      console.log('Calling uploadFile with path:', path);
      const url = await uploadFile(path, file);
      console.log('uploadFile returned URL/Data:', url.substring(0, 50) + '...');
      
      const field = type === 'photo' ? 'photoURL' : 'coverURL';
      setFormData(prev => ({ ...prev, [field]: url }));

      // Save immediately to Firestore
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        [field]: url,
        updatedAt: serverTimestamp()
      });
      await refreshProfile();
      
    } catch (err: any) {
      console.error('Final upload error caught in SettingsView:', err);
      alert(language === 'PT' ? `Erro: ${err.message}` : `Error: ${err.message}`);
    } finally {
      setIsUploading(prev => ({ ...prev, [type]: false }));
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
      securityStatus: 'Status de Segurança',
      securityStatusDesc: 'Verifique seu cargo atual e status de verificação de identidade.',
      role: 'Cargo no Sistema',
      verified: 'Identidade Verificada',
      notVerified: 'E-mail não verificado',
      resendVerification: 'Reenviar E-mail de Verificação',
      resendSuccess: 'E-mail enviado com sucesso!',
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
        taxId: 'NUIT (Número de Identificação Tributária)',
        license: 'Número de Alvará / Licença Corporativa',
        contactPhone: 'Telefone de Contacto Principal',
        city: 'Província / Cidade Principal',
        address: 'Endereço Físico Detalhado (Sede)',
        photoUrl: (profile?.type === 'supplier' || profile?.type === 'logistics') ? 'Logo da Empresa (Logotipo)' : 'Foto de Perfil',
        coverURL: 'Imagem de Capa / Banners Corporativos',
        bio: 'Bio / Sobre a Empresa (Termos & Condições)',
        fleetSize: 'Tamanho da Frota',
        specialization: 'Especialização Logística',
        banking: 'Dados Bancários para Pagamento',
        wallets: 'Carteiras Móveis (M-Pesa/e-Mola/mKesh)',
        addAccount: 'Adicionar Conta',
        addWallet: 'Adicionar Carteira'
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
      securityStatus: 'Security Status',
      securityStatusDesc: 'Check your current role and identity verification status.',
      role: 'System Role',
      verified: 'Verified Identity',
      notVerified: 'Email Unverified',
      resendVerification: 'Resend Verification Email',
      resendSuccess: 'Email sent successfully!',
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
        userName: 'Responsible Name',
        taxId: 'NUIT / Tax ID Number',
        license: 'Business License / Permit Number',
        contactPhone: 'Primary Contact Phone',
        city: 'Province / City',
        address: 'Detailed Physical Address (HQ)',
        photoUrl: (profile?.type === 'supplier' || profile?.type === 'logistics') ? 'Company Logo' : 'Profile Photo',
        coverUrl: 'Cover Image / Banners',
        bio: 'Bio / Company Description (Terms & Conditions)',
        fleetSize: 'Fleet Size',
        specialization: 'Logistics Specialization',
        banking: 'Banking Details for Payment',
        wallets: 'Mobile Wallets',
        addAccount: 'Add Account',
        addWallet: 'Add Wallet'
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
      className="w-full max-w-7xl mx-auto space-y-8"
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
          
          {/* Admin Section (only if isAdmin) */}
          {(profile as any)?.role === 'admin' || (profile as any)?.role === 'superadmin' ? (
            <button 
              className={`p-6 rounded-3xl border text-left transition-all hover:scale-[1.02] active:scale-98 relative overflow-hidden group ${
                isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800' : 'bg-white border-zinc-100 shadow-sm hover:shadow-xl hover:shadow-zinc-200/50'
              }`}
            >
               <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                 <Shield className="w-16 h-16 text-red-500" />
               </div>
               <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-red-500/20`}>
                  <Shield className="w-7 h-7 text-red-500" />
                </div>
                <div>
                  <h3 className={`text-sm font-black uppercase italic tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                    {language === 'PT' ? 'PAINEL ADMINISTRATIVO' : 'ADMIN DASHBOARD'}
                  </h3>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
                    {language === 'PT' ? 'Gerencie usuários, cargos e logs.' : 'Manage users, roles and logs.'}
                  </p>
                </div>
              </div>
            </button>
          ) : null}
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

          {/* Security Status Card (Pillar 8 & 9) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
            <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-100'} flex items-center justify-between`}>
              <div>
                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">{t.role}</p>
                <p className={`text-xs font-black uppercase italic ${isDarkMode ? 'text-brand' : 'text-brand'}`}>{profile?.role || 'user'}</p>
              </div>
              <Shield className="w-5 h-5 text-brand opacity-40" />
            </div>
            <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-100'} flex items-center justify-between`}>
              <div>
                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">{t.verified}</p>
                <div className="flex items-center gap-2">
                  <p className={`text-xs font-black uppercase italic ${profile?.emailVerified ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {profile?.emailVerified ? t.verified : t.notVerified}
                  </p>
                  {!profile?.emailVerified && (
                    <button 
                      type="button"
                      onClick={async () => {
                        if (auth.currentUser) {
                          try {
                            await sendEmailVerification(auth.currentUser);
                            alert(t.resendSuccess);
                          } catch (err: any) {
                            alert(err.message);
                          }
                        }
                      }}
                      className="text-[8px] font-black uppercase tracking-widest text-brand hover:underline"
                    >
                      [{t.resendVerification}]
                    </button>
                  )}
                </div>
              </div>
              <CheckCircle2 className={`w-5 h-5 ${profile?.emailVerified ? 'text-emerald-500' : 'text-amber-500'} opacity-40`} />
            </div>
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
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  if (val.length <= 9) {
                    setFormData({ ...formData, nuit: val });
                  }
                }}
                className={`w-full p-4 rounded-2xl text-xs font-bold outline-none border-2 transition-all ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white focus:border-brand/50' : 'bg-zinc-50 border-zinc-100 focus:border-brand/30'}`}
                placeholder="123 456 789"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">{t.labels.license}</label>
              <input 
                type="text"
                value={formData.license}
                onChange={(e) => setFormData({ ...formData, license: e.target.value })}
                className={`w-full p-4 rounded-2xl text-xs font-bold outline-none border-2 transition-all ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white focus:border-brand/50' : 'bg-zinc-50 border-zinc-100 focus:border-brand/30'}`}
                placeholder="Ex: Alvará L-001/2026"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">{t.labels.city}</label>
              <select 
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className={`w-full p-4 rounded-2xl text-xs font-bold outline-none border-2 transition-all ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white focus:border-brand/50' : 'bg-zinc-50 border-zinc-100 focus:border-brand/30'}`}
              >
                {provinces.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">{t.labels.address}</label>
            <textarea 
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className={`w-full p-4 rounded-2xl text-xs font-bold outline-none border-2 transition-all h-24 ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white focus:border-brand/50' : 'bg-zinc-50 border-zinc-100 focus:border-brand/30'}`}
              placeholder="Ex: Av. Eduardo Mondlane, Prédio 123, R/C, Maputo"
            />
          </div>

          {profile?.type === 'logistics' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">{t.labels.fleetSize}</label>
                <select 
                  value={formData.fleetSize}
                  onChange={(e) => setFormData({ ...formData, fleetSize: e.target.value })}
                  className={`w-full p-4 rounded-2xl text-xs font-bold outline-none border-2 transition-all appearance-none ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white focus:border-brand/50' : 'bg-zinc-50 border-zinc-100 focus:border-brand/30'}`}
                >
                  <option value="1-5">1-5 Veículos</option>
                  <option value="6-20">6-20 Veículos</option>
                  <option value="21-50">21-50 Veículos</option>
                  <option value="50+">50+</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">{t.labels.specialization}</label>
                <input 
                  type="text"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  className={`w-full p-4 rounded-2xl text-xs font-bold outline-none border-2 transition-all ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white focus:border-brand/50' : 'bg-zinc-50 border-zinc-100 focus:border-brand/30'}`}
                  placeholder="Ex: Carga Geral, Materiais"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">{t.labels.photoUrl}</label>
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <input 
                      type="text"
                      value={formData.photoURL}
                      onChange={(e) => setFormData({ ...formData, photoURL: e.target.value })}
                      className={`w-full p-4 rounded-2xl text-xs font-bold outline-none border-2 transition-all ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white focus:border-brand/50' : 'bg-zinc-50 border-zinc-100 focus:border-brand/30'}`}
                      placeholder="https://images.unsplash.com/..."
                    />
                  </div>
                  <label className={`shrink-0 flex items-center justify-center w-14 h-14 rounded-2xl border-2 border-dashed cursor-pointer transition-all hover:bg-brand/5 hover:border-brand/50 ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-500' : 'bg-zinc-50 border-zinc-100 text-zinc-400'}`}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => handleFileChange(e, 'photo')} 
                    />
                    {isUploading.photo ? (
                      <Loader2 className="w-5 h-5 animate-spin text-brand" />
                    ) : (
                      <Upload className="w-5 h-5" />
                    )}
                  </label>
                </div>
              </div>
              {formData.photoURL && (
                <div className={`w-20 h-20 rounded-2xl overflow-hidden border-2 ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`}>
                  <img src={formData.photoURL} alt="Avatar Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">{t.labels.coverUrl}</label>
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <input 
                      type="text"
                      value={formData.coverURL}
                      onChange={(e) => setFormData({ ...formData, coverURL: e.target.value })}
                      className={`w-full p-4 rounded-2xl text-xs font-bold outline-none border-2 transition-all ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white focus:border-brand/50' : 'bg-zinc-50 border-zinc-100 focus:border-brand/30'}`}
                      placeholder="https://images.unsplash.com/..."
                    />
                  </div>
                  <label className={`shrink-0 flex items-center justify-center w-14 h-14 rounded-2xl border-2 border-dashed cursor-pointer transition-all hover:bg-brand/5 hover:border-brand/50 ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-500' : 'bg-zinc-50 border-zinc-100 text-zinc-400'}`}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => handleFileChange(e, 'cover')} 
                    />
                    {isUploading.cover ? (
                      <Loader2 className="w-5 h-5 animate-spin text-brand" />
                    ) : (
                      <Upload className="w-5 h-5" />
                    )}
                  </label>
                </div>
              </div>
              {formData.coverURL && (
                <div className={`w-full h-20 rounded-2xl overflow-hidden border-2 ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`}>
                  <img src={formData.coverURL} alt="Cover Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
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

          {(profile?.type === 'supplier' || profile?.type === 'logistics') && (
            <>
              <div className="space-y-4 pt-4 border-t border-zinc-500/10">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-brand uppercase tracking-widest ml-1">{t.labels.banking}</label>
                  <button 
                    type="button"
                    onClick={() => setFormData({ 
                      ...formData, 
                      bankAccounts: [...formData.bankAccounts, { bankName: '', accountNumber: '', nib: '' }] 
                    })}
                    className="text-[10px] font-black text-brand hover:brightness-110 uppercase"
                  >
                    + {t.labels.addAccount}
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.bankAccounts.map((acc, index) => (
                    <div key={index} className={`p-4 rounded-2xl border-2 flex flex-col md:flex-row gap-3 relative group ${isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
                      <input 
                        placeholder={language === 'PT' ? 'Banco' : 'Bank'}
                        value={acc.bankName}
                        onChange={(e) => {
                          const newAccs = [...formData.bankAccounts];
                          newAccs[index].bankName = e.target.value;
                          setFormData({ ...formData, bankAccounts: newAccs });
                        }}
                        className="bg-transparent text-xs font-bold outline-none flex-1"
                      />
                      <input 
                        placeholder={language === 'PT' ? 'Conta' : 'Account'}
                        value={acc.accountNumber}
                        onChange={(e) => {
                          const newAccs = [...formData.bankAccounts];
                          newAccs[index].accountNumber = e.target.value;
                          setFormData({ ...formData, bankAccounts: newAccs });
                        }}
                        className="bg-transparent text-xs font-bold outline-none flex-1"
                      />
                      <input 
                        placeholder="NIB"
                        value={acc.nib}
                        onChange={(e) => {
                          const newAccs = [...formData.bankAccounts];
                          newAccs[index].nib = e.target.value;
                          setFormData({ ...formData, bankAccounts: newAccs });
                        }}
                        className="bg-transparent text-xs font-bold outline-none flex-1"
                      />
                      <button 
                        type="button"
                        onClick={() => setFormData({ 
                          ...formData, 
                          bankAccounts: formData.bankAccounts.filter((_, i) => i !== index) 
                        })}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-zinc-500/10">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-brand uppercase tracking-widest ml-1">{t.labels.wallets}</label>
                  <button 
                    type="button"
                    onClick={() => setFormData({ 
                      ...formData, 
                      mobileWallets: [...formData.mobileWallets, { provider: '', number: '', name: '' }] 
                    })}
                    className="text-[10px] font-black text-brand hover:brightness-110 uppercase"
                  >
                    + {t.labels.addWallet}
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.mobileWallets.map((wallet, index) => (
                    <div key={index} className={`p-4 rounded-2xl border-2 flex flex-col md:flex-row gap-3 relative group ${isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
                      <select 
                        value={wallet.provider}
                        onChange={(e) => {
                          const newWallets = [...formData.mobileWallets];
                          newWallets[index].provider = e.target.value;
                          setFormData({ ...formData, mobileWallets: newWallets });
                        }}
                        className="bg-transparent text-xs font-bold outline-none flex-1 h-full"
                      >
                        <option value="">{language === 'PT' ? 'Provedor' : 'Provider'}</option>
                        <option value="M-Pesa">M-Pesa</option>
                        <option value="e-Mola">e-Mola</option>
                        <option value="mKesh">mKesh</option>
                      </select>
                      <input 
                        placeholder={language === 'PT' ? 'Número' : 'Number'}
                        value={wallet.number}
                        onChange={(e) => {
                          const newWallets = [...formData.mobileWallets];
                          newWallets[index].number = e.target.value;
                          setFormData({ ...formData, mobileWallets: newWallets });
                        }}
                        className="bg-transparent text-xs font-bold outline-none flex-1"
                      />
                      <input 
                        placeholder={language === 'PT' ? 'Titular' : 'Holder'}
                        value={wallet.name}
                        onChange={(e) => {
                          const newWallets = [...formData.mobileWallets];
                          newWallets[index].name = e.target.value;
                          setFormData({ ...formData, mobileWallets: newWallets });
                        }}
                        className="bg-transparent text-xs font-bold outline-none flex-1"
                      />
                      <button 
                        type="button"
                        onClick={() => setFormData({ 
                          ...formData, 
                          mobileWallets: formData.mobileWallets.filter((_, i) => i !== index) 
                        })}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

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
