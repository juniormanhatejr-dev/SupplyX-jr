import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import SupplyXLogo from '../SupplyXLogo';
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  MapPin, 
  FileText, 
  ChevronDown, 
  Plus, 
  ShieldCheck, 
  CheckCircle2, 
  ExternalLink,
  Smartphone,
  Check,
  Package,
  Globe,
  Loader2,
  AlertCircle,
  ShoppingCart,
  Activity
} from 'lucide-react';
import { auth, db, signInWithGoogle } from '../../lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  updateProfile, 
  signInWithEmailAndPassword 
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../../lib/firebase';

interface RegistrationViewProps {
  isDarkMode: boolean;
  language: 'PT' | 'EN';
  onSuccess: () => void;
  onBack?: () => void;
}

export default function RegistrationView({ isDarkMode, language, onSuccess, onBack }: RegistrationViewProps) {
  const t = {
    PT: {
      slogan: 'Conectando Fornecedores e Compradores',
      buyerTitle: 'COMPRADOR',
      buyerSub: 'Compre rápido e seguro',
      supplierTitle: 'FORNECEDOR',
      supplierSub: 'Ofereça seus produtos',
      logisticsTitle: 'LOGÍSTICA',
      logisticsSub: 'Gestão de frotas e carga',
      companyName: 'NOME DA EMPRESA / RAZÃO SOCIAL',
      companyLogo: 'LOGO DA EMPRESA',
      userName: 'NOME DO RESPONSÁVEL / USUÁRIO',
      taxId: 'NUIT / IDENTIFICAÇÃO FISCAL',
      taxIdBadge: 'OBRIGATÓRIO',
      address: 'LOCALIZAÇÃO / ENDEREÇO COMPLETO',
      phone: 'TELEFONE / WHATSAPP',
      email: 'E-MAIL',
      city: 'PROVÍNCIA / CIDADE',
      sector: 'SETOR DE ATUAÇÃO',
      fleetSize: 'TAMANHO DA FROTA',
      specialization: 'ESPECIALIZAÇÃO LOGÍSTICA',
      password: 'SENHA DE ACESSO',
      passwordPlaceholder: 'Mínimo 6 caracteres',
      robot: 'Eu não sou um robô',
      createBuyer: 'CRIAR CONTA COMPRADOR',
      createSupplier: 'CRIAR CONTA FORNECEDOR',
      createLogistics: 'CRIAR CONTA LOGÍSTICA',
      login: 'ENTRAR NA MINHA CONTA',
      orEnter: 'OU ENTRE COM',
      google: 'GOOGLE',
      noAccount: 'NÃO TEM UMA CONTA? CADASTRE-SE',
      hasAccount: 'JÁ TEM UMA CONTA? ENTRE AQUI',
      features: {
        validation: 'Validação em tempo real',
        protection: 'Proteção de dados avançada',
        compliance: 'Conformidade legal garantida',
        support: 'Suporte 24/7'
      },
      join: 'Junte-se ao',
      tagline: 'A PLATAFORMA QUE IMPULSIONA O SEU NEGÓCIO',
      sectors: ['Construção Civil', 'Hidráulica', 'Elétrica', 'Acabamentos', 'Serviços Gerais'],
      robotError: 'Por favor, valide que você não é um robô.',
      invalidEmail: 'Por favor, insira um e-mail válido.',
      welcome: 'Bem-vindo à SupplyX!',
      defaultBio: (sector: string, city: string) => `Atuando no setor de ${sector} em ${city}.`,
      provinces: [
        'Maputo Cidade', 'Maputo Província', 'Gaza', 'Inhambane', 'Sofala', 
        'Manica', 'Tete', 'Zambézia', 'Nampula', 'Niassa', 'Cabo Delgado'
      ]
    },
    EN: {
      slogan: 'Connecting Suppliers and Buyers',
      buyerTitle: 'BUYER',
      buyerSub: 'Buy fast and safe',
      supplierTitle: 'SUPPLIER',
      supplierSub: 'Offer your products',
      logisticsTitle: 'LOGISTICS',
      logisticsSub: 'Fleet and cargo management',
      companyName: 'COMPANY NAME / REGISTERED NAME',
      companyLogo: 'COMPANY LOGO',
      userName: 'USER NAME / RESPONSIBLE NAME',
      taxId: 'TAX ID / VAT NUMBER',
      taxIdBadge: 'REQUIRED',
      address: 'LOCATION / FULL ADDRESS',
      phone: 'PHONE / WHATSAPP',
      email: 'EMAIL',
      city: 'PROVINCE / CITY',
      sector: 'INDUSTRY SECTOR',
      fleetSize: 'FLEET SIZE',
      specialization: 'LOGISTICS SPECIALIZATION',
      password: 'ACCESS PASSWORD',
      passwordPlaceholder: 'Minimum 6 characters',
      robot: "I'm not a robot",
      createBuyer: 'CREATE BUYER ACCOUNT',
      createSupplier: 'CREATE SUPPLIER ACCOUNT',
      createLogistics: 'CREATE LOGISTICS ACCOUNT',
      login: 'LOGIN TO MY ACCOUNT',
      orEnter: 'OR ENTER WITH',
      google: 'GOOGLE',
      noAccount: "DON'T HAVE AN ACCOUNT? REGISTER",
      hasAccount: 'ALREADY HAVE AN ACCOUNT? LOGIN',
      features: {
        validation: 'Real-time validation',
        protection: 'Advanced data protection',
        compliance: 'Guaranteed legal compliance',
        support: '24/7 Support'
      },
      join: 'Join',
      tagline: 'THE PLATFORM THAT BOOSTS YOUR BUSINESS',
      sectors: ['Construction', 'Plumbing', 'Electrical', 'Finishing', 'General Services'],
      robotError: 'Please validate that you are not a robot.',
      invalidEmail: 'Please enter a valid email address.',
      welcome: 'Welcome to SupplyX!',
      defaultBio: (sector: string, city: string) => `Operating in the ${sector} sector in ${city}.`,
      provinces: [
        'Maputo City', 'Maputo Province', 'Gaza', 'Inhambane', 'Sofala', 
        'Manica', 'Tete', 'Zambézia', 'Nampula', 'Niassa', 'Cabo Delgado'
      ]
    }
  }[language];

  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [type, setType] = useState<'buyer' | 'supplier' | 'logistics'>('buyer');
  const [formData, setFormData] = useState({
    name: '',
    userName: '',
    nuit: '',
    address: '',
    phone: '',
    email: '',
    password: '',
    sector: t.sectors[0],
    city: 'Maputo Cidade',
    fleetSize: '1-5',
    specialization: 'Carga Geral'
  });
  const [isRobotValid, setIsRobotValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (email: string) => {
    return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'register' && !isRobotValid) {
      setError(t.robotError);
      return;
    }

    if (!validateEmail(formData.email)) {
      setError(t.invalidEmail);
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      if (mode === 'register') {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email.trim(), formData.password);
        const user = userCredential.user;

        await updateProfile(user, { displayName: formData.name });

        // Garantir que temos o UID antes de prosseguir
        if (!user.uid) throw new Error("Firebase Auth UID not found after creation.");

        // Escrita no Firestore
        await createProfileDoc(user.uid, {
          name: formData.name,
          userName: type === 'buyer' ? formData.name : formData.userName,
          nuit: formData.nuit,
          address: formData.address,
          phone: formData.phone,
          email: formData.email.trim(),
          type: type,
          sector: formData.sector,
          city: formData.city,
          fleetSize: type === 'logistics' ? formData.fleetSize : null,
          specialization: type === 'logistics' ? formData.specialization : null,
        });
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, formData.email.trim(), formData.password);
        const user = userCredential.user;

        // Recuperação de perfil se não existir
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          console.log("Profile not found on login, creating minimal recovery profile...");
          await createProfileDoc(user.uid, {
            name: user.displayName || 'User',
            userName: user.displayName || 'User',
            email: user.email || '',
            type: 'buyer',
          }, true); // Fix: Must be isNew=true to include createdAt for the rule
        }
      }

      onSuccess();
    } catch (err: any) {
      console.error(err);
      let message = err.message;
      if (err.code === 'auth/invalid-credential') message = language === 'PT' ? 'E-mail ou senha incorretos.' : 'Invalid email or password.';
      if (err.code === 'auth/user-not-found') message = language === 'PT' ? 'Usuário não encontrado.' : 'User not found.';
      if (err.code === 'auth/wrong-password') message = language === 'PT' ? 'Senha incorreta.' : 'Wrong password.';
      if (err.code === 'auth/email-already-in-use') message = language === 'PT' ? 'Este e-mail já está em uso.' : 'Email already in use.';
      if (err.code === 'auth/invalid-email') message = t.invalidEmail;
      if (err.code === 'auth/weak-password') message = language === 'PT' ? 'Senha muito fraca.' : 'Weak password.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const createProfileDoc = async (uid: string, data: any, isNew: boolean = true) => {
    try {
      const profileData: any = {
        uid,
        name: data.name || '',
        userName: data.userName || '',
        nuit: data.nuit || '',
        address: data.address || '',
        phone: data.phone || '',
        email: data.email || '',
        type: data.type || 'buyer',
        sector: data.sector || t.sectors[0],
        city: data.city || 'Maputo',
        bio: data.bio || (data.sector ? t.defaultBio(data.sector, data.city || 'Maputo') : t.welcome),
        photoURL: data.photoURL || (data.type === 'supplier' ? 'https://images.unsplash.com/photo-1599305096906-71e576f33e08?w=400&q=80' : 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80'),
        coverURL: data.coverURL || 'https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?w=1000&q=80',
      };

      if (isNew) {
        profileData.createdAt = serverTimestamp();
      } else {
        profileData.updatedAt = serverTimestamp();
      }

      if (data.fleetSize) profileData.fleetSize = data.fleetSize;
      if (data.specialization) profileData.specialization = data.specialization;

      await setDoc(doc(db, 'users', uid), profileData, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      const result = await signInWithGoogle();
      const user = result.user;

      // Check if profile exists
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        await createProfileDoc(user.uid, {
          name: user.displayName || '',
          userName: user.displayName || '',
          email: user.email || '',
          type: type,
        });
      }

      onSuccess();
    } catch (err: any) {
      if (err.message?.includes('auth/popup-closed-by-user')) {
        console.log('User closed the login popup');
        return;
      }
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden ${isDarkMode ? 'bg-supplyx-deep text-white' : 'bg-zinc-50 text-zinc-900'}`}>
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-supplyx-blue/5 blur-[120px] rounded-full -z-10" />
      
      {onBack && (
        <button 
          onClick={onBack}
          className="absolute top-8 left-8 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
        >
          <ChevronDown className="w-4 h-4 rotate-90" />
          Voltar
        </button>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg mb-12 text-center"
      >
        <div className="flex items-center justify-center gap-4 mb-4">
          <SupplyXLogo size="lg" isDark={true} />
        </div>
        <p className="text-supplyx-blue text-[10px] font-black uppercase tracking-widest leading-none bg-supplyx-blue/10 px-4 py-1.5 rounded-full inline-block border border-supplyx-blue/20">{t.slogan}</p>
      </motion.div>

      <div className={`w-full max-w-md rounded-[48px] overflow-hidden border shadow-3xl relative glass-dark ${isDarkMode ? 'border-white/5' : 'bg-white border-zinc-100 shadow-zinc-200'}`}>
        {/* Header Tab */}
        <div className="flex p-1 gap-1">
          <button 
            onClick={() => setType('buyer')}
            className={`flex-1 py-3 flex flex-col items-center gap-1.5 rounded-[24px] transition-all relative ${type === 'buyer' ? 'bg-supplyx-blue/20 border border-supplyx-blue/30' : 'bg-white/5 opacity-40 grayscale'}`}
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${type === 'buyer' ? 'bg-supplyx-blue text-white' : 'bg-zinc-700/50'}`}>
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="text-center">
              <p className="text-[9px] font-black uppercase tracking-tight text-white">{t.buyerTitle}</p>
            </div>
          </button>
          <button 
            onClick={() => setType('supplier')}
            className={`flex-1 py-3 flex flex-col items-center gap-1.5 rounded-[24px] transition-all relative ${type === 'supplier' ? 'bg-supplyx-blue/20 border border-supplyx-blue/30' : 'bg-white/5 opacity-40 grayscale'}`}
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${type === 'supplier' ? 'bg-supplyx-blue text-white' : 'bg-zinc-700/50'}`}>
              <Package className="w-3.5 h-3.5" />
            </div>
            <div className="text-center">
              <p className="text-[9px] font-black uppercase tracking-tight text-white">{t.supplierTitle}</p>
            </div>
          </button>
          <button 
            onClick={() => setType('logistics')}
            className={`flex-1 py-3 flex flex-col items-center gap-1.5 rounded-[24px] transition-all relative ${type === 'logistics' ? 'bg-supplyx-blue/20 border border-supplyx-blue/30' : 'bg-white/5 opacity-40 grayscale'}`}
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${type === 'logistics' ? 'bg-supplyx-blue text-white' : 'bg-zinc-700/50'}`}>
              <Activity className="w-3.5 h-3.5" />
            </div>
            <div className="text-center">
              <p className="text-[9px] font-black uppercase tracking-tight text-white">{t.logisticsTitle}</p>
            </div>
          </button>
        </div>

        <div className="p-8 space-y-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {mode === 'register' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField 
                      icon={Building2} 
                      label={type === 'buyer' ? t.userName : t.companyName} 
                      placeholder={type === 'buyer' ? "Ex: Fernando Manhate" : "Ex: Manhate Jr Construction"} 
                      isDarkMode={isDarkMode}
                      value={formData.name}
                      onChange={(v) => setFormData({...formData, name: v})}
                    />
                    {type === 'buyer' ? (
                      <InputField 
                        icon={Mail} 
                        label={t.email} 
                        placeholder="email@exemplo.com" 
                        isDarkMode={isDarkMode}
                        type="email"
                        value={formData.email}
                        onChange={(v) => setFormData({...formData, email: v})}
                      />
                    ) : (
                      <InputField 
                        icon={User} 
                        label={t.userName} 
                        placeholder="Ex: Fernando Manhate" 
                        isDarkMode={isDarkMode}
                        value={formData.userName}
                        onChange={(v) => setFormData({...formData, userName: v})}
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField 
                      icon={FileText} 
                      label={t.taxId} 
                      placeholder="123 456 789" 
                      isDarkMode={isDarkMode}
                      badge={t.taxIdBadge}
                      value={formData.nuit}
                      onChange={(v) => {
                        const numericValue = v.replace(/[^0-9]/g, '');
                        if (numericValue.length <= 9) {
                          setFormData({...formData, nuit: numericValue});
                        }
                      }}
                    />
                    {type === 'buyer' ? (
                      <InputField 
                        icon={Phone} 
                        label={t.phone} 
                        placeholder="+258 84 123 4567" 
                        isDarkMode={isDarkMode}
                        value={formData.phone}
                        onChange={(v) => setFormData({...formData, phone: v})}
                      />
                    ) : (
                      <InputField 
                        icon={MapPin} 
                        label={t.address} 
                        placeholder="Ex: Av. Eduardo Mondlane, Maputo" 
                        isDarkMode={isDarkMode}
                        value={formData.address}
                        onChange={(v) => setFormData({...formData, address: v})}
                      />
                    )}
                  </div>

                  {type !== 'buyer' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InputField 
                        icon={Phone} 
                        label={t.phone} 
                        placeholder="+258 84 123 4567" 
                        isDarkMode={isDarkMode}
                        value={formData.phone}
                        onChange={(v) => setFormData({...formData, phone: v})}
                      />
                      <InputField 
                        icon={Mail} 
                        label={t.email} 
                        placeholder="email@exemplo.com" 
                        isDarkMode={isDarkMode}
                        type="email"
                        value={formData.email}
                        onChange={(v) => setFormData({...formData, email: v})}
                      />
                    </div>
                  )}
                  
                  {type === 'logistics' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5 flex-1">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t.fleetSize}</label>
                        <div className={`relative flex items-center rounded-2xl border transition-all group overflow-hidden ${isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-50 border-zinc-100'}`}>
                          <div className="pl-4 py-4 pr-3 text-zinc-500 group-focus-within:text-brand transition-colors">
                            <Activity className="w-5 h-5" />
                          </div>
                          <select 
                            className="flex-1 bg-transparent border-none outline-none py-4 text-xs font-bold appearance-none"
                            value={formData.fleetSize}
                            onChange={(e) => setFormData({...formData, fleetSize: e.target.value})}
                          >
                            <option value="1-5">1-5 Veículos</option>
                            <option value="6-20">6-20 Veículos</option>
                            <option value="21-50">21-50 Veículos</option>
                            <option value="50+">Mais de 50</option>
                          </select>
                          <ChevronDown className="w-4 h-4 text-zinc-500 mr-4" />
                        </div>
                      </div>
                      <div className="space-y-1.5 flex-1">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t.specialization}</label>
                        <div className={`relative flex items-center rounded-2xl border transition-all group overflow-hidden ${isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-50 border-zinc-100'}`}>
                          <div className="pl-4 py-4 pr-3 text-zinc-500 group-focus-within:text-brand transition-colors">
                            <Package className="w-5 h-5" />
                          </div>
                          <select 
                            className="flex-1 bg-transparent border-none outline-none py-4 text-xs font-bold appearance-none"
                            value={formData.specialization}
                            onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                          >
                            <option value="Carga Geral">Carga Geral</option>
                            <option value="Refrigerados">Refrigerados</option>
                            <option value="Produtos Perigosos">Produtos Perigosos</option>
                            <option value="Materiais de Construção">Materiais de Construção</option>
                          </select>
                          <ChevronDown className="w-4 h-4 text-zinc-500 mr-4" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5 flex-1">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t.city}</label>
                      <div className={`relative flex items-center rounded-2xl border transition-all group overflow-hidden ${isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-50 border-zinc-100'}`}>
                        <div className="pl-4 py-4 pr-3 text-zinc-500 group-focus-within:text-brand transition-colors">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <select 
                          className="flex-1 bg-transparent border-none outline-none py-4 text-xs font-bold appearance-none"
                          value={formData.city}
                          onChange={(e) => setFormData({...formData, city: e.target.value})}
                        >
                          {t.provinces.map(p => <option key={p}>{p}</option>)}
                        </select>
                        <ChevronDown className="w-4 h-4 text-zinc-500 mr-4" />
                      </div>
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t.sector}</label>
                      <div className={`relative flex items-center rounded-2xl border transition-all group overflow-hidden ${isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-50 border-zinc-100'}`}>
                        <div className="pl-4 py-4 pr-3 text-zinc-500 group-focus-within:text-brand transition-colors">
                          <Globe className="w-5 h-5" />
                        </div>
                        <select 
                          className="flex-1 bg-transparent border-none outline-none py-4 text-xs font-bold appearance-none"
                          value={formData.sector}
                          onChange={(e) => setFormData({...formData, sector: e.target.value})}
                        >
                          {t.sectors.map(s => <option key={s}>{s}</option>)}
                        </select>
                        <ChevronDown className="w-4 h-4 text-zinc-500 mr-4" />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {mode === 'login' && (
                <InputField 
                  icon={Mail} 
                  label={t.email} 
                  placeholder="email@exemplo.com" 
                  isDarkMode={isDarkMode}
                  type="email"
                  value={formData.email}
                  onChange={(v) => setFormData({...formData, email: v})}
                />
              )}

              <InputField 
                icon={Lock} 
                label={t.password} 
                placeholder={t.passwordPlaceholder} 
                isDarkMode={isDarkMode}
                type="password"
                badge={mode === 'register' ? t.taxIdBadge : undefined}
                value={formData.password}
                onChange={(v) => setFormData({...formData, password: v})}
              />
            </div>

            {/* Not a robot validation */}
            {mode === 'register' && (
              <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 select-none ${isRobotValid ? (isDarkMode ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-100') : (isDarkMode ? 'bg-zinc-800/50 border-zinc-700' : 'bg-zinc-50 border-zinc-100')}`}>
                <div className="flex items-center gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsRobotValid(!isRobotValid)}
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isRobotValid ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-zinc-500 bg-transparent'}`}
                  >
                    {isRobotValid && <Check className="w-4 h-4" />}
                  </button>
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t.robot}</span>
                </div>
                <div className="flex flex-col items-end">
                  <ShieldCheck className={`w-6 h-6 ${isRobotValid ? 'text-emerald-500' : 'text-zinc-500 opacity-20'}`} />
                  <p className="text-[6px] text-zinc-500 mt-0.5">SX Protection</p>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-bold uppercase">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className={`w-full py-5 rounded-2xl text-white font-black text-sm uppercase tracking-tighter italic transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xl
                ${type === 'buyer' ? 'bg-emerald-600 shadow-emerald-600/20' : type === 'supplier' ? 'bg-blue-600 shadow-blue-600/20' : 'bg-orange-600 shadow-orange-600/20'}
              `}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                mode === 'register' ? <Plus className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />
              )}
              {mode === 'login' ? t.login : (type === 'buyer' ? t.createBuyer : type === 'supplier' ? t.createSupplier : t.createLogistics)}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError(null);
              }}
              className="w-full text-center py-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-brand transition-colors"
            >
              {mode === 'login' ? t.noAccount : t.hasAccount}
            </button>
          </form>

          <div className="relative py-4 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800" /></div>
            <span className={`relative px-4 text-[10px] font-black tracking-widest text-zinc-500 uppercase ${isDarkMode ? 'bg-zinc-900' : 'bg-white'}`}>{t.orEnter}</span>
          </div>

          <button 
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className={`w-full py-4 rounded-2xl border-2 flex items-center justify-center gap-3 transition-all active:scale-95 ${isDarkMode ? 'bg-zinc-800 border-zinc-700 hover:border-zinc-500' : 'bg-zinc-50 border-zinc-200'}`}
          >
            <div className="w-6 h-6 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="#EA4335" d="M12 5.04c2.14 0 3.86.73 5.37 2.16L21.01 3.5C18.66 1.34 15.63 0 12 0 7.31 0 3.32 2.69 1.38 6.64l4.08 3.16C6.44 7.08 8.99 5.04 12 5.04z"/><path fill="#4285F4" d="M23.49 12.27c0-.82-.07-1.61-.21-2.38H12v4.51h6.44c-.28 1.48-1.12 2.73-2.38 3.58l3.71 2.87c2.16-1.99 3.42-4.92 3.42-8.58z"/><path fill="#FBBC05" d="M5.46 14.71c-.24-.73-.38-1.5-.38-2.31s.14-1.58.38-2.31l-4.08-3.16C.5 8.78 0 10.33 0 12c0 1.67.5 3.22 1.38 4.61l4.08-3.16z"/><path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.71-2.87c-1.1.74-2.51 1.18-4.23 1.18-3.25 0-6.01-2.2-7-5.17l-4.08 3.16C3.32 21.31 7.31 24 12 24z"/></svg>
            </div>
            <span className="text-[11px] font-black uppercase tracking-tighter">{t.google} {type === 'buyer' ? (language === 'PT' ? 'COMPRADOR' : 'BUYER') : type === 'supplier' ? (language === 'PT' ? 'FORNECEDOR' : 'SUPPLIER') : (language === 'PT' ? 'LOGÍSTICA' : 'LOGISTICS')}</span>
          </button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl px-4">
        <FeatureItem icon={Smartphone} label={t.features.validation} isDarkMode={isDarkMode} />
        <FeatureItem icon={ShieldCheck} label={t.features.protection} isDarkMode={isDarkMode} />
        <FeatureItem icon={FileText} label={t.features.compliance} isDarkMode={isDarkMode} />
        <FeatureItem icon={Activity} label={t.features.support} isDarkMode={isDarkMode} />
      </div>

      <div className="mt-12 text-center pb-20">
        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2">{t.join}</p>
        <h2 className="text-2xl font-black italic tracking-tighter uppercase text-zinc-500">SupplyX</h2>
        <p className="text-[10px] font-bold text-zinc-600 mt-2">{t.tagline}</p>
      </div>
    </div>
  );
}

function InputField({ icon: Icon, label, placeholder, isDarkMode, type = 'text', badge, value, onChange }: { 
  icon: any, label: string, placeholder: string, isDarkMode: boolean, type?: string, badge?: string, value: string, onChange: (v: string) => void
}) {
  return (
    <div className="space-y-1.5 flex-1">
      <div className="flex justify-between items-center px-1">
        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{label}</label>
        {badge && <span className="text-[8px] font-black text-white px-2 py-0.5 rounded-md bg-orange-500 uppercase">{badge}</span>}
      </div>
      <div className={`relative flex items-center rounded-2xl border transition-all group overflow-hidden ${isDarkMode ? 'bg-zinc-800 border-zinc-700 focus-within:border-brand' : 'bg-zinc-50 border-zinc-100 focus-within:border-brand'}`}>
        <div className="pl-4 py-4 pr-3 text-zinc-500 group-focus-within:text-brand transition-colors">
          <Icon className="w-5 h-5" />
        </div>
        <input 
          type={type} 
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none py-4 text-xs font-bold placeholder:text-zinc-500" 
        />
      </div>
    </div>
  );
}

function FeatureItem({ icon: Icon, label, isDarkMode }: { icon: any, label: string, isDarkMode: boolean }) {
  return (
    <div className={`p-4 rounded-3xl border flex items-center gap-3 transition-all hover:scale-105 ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-100'}`}>
      <div className="w-8 h-8 rounded-xl bg-brand/10 flex items-center justify-center text-brand shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-[8px] font-black uppercase tracking-widest leading-tight text-zinc-500">{label}</span>
    </div>
  );
}
