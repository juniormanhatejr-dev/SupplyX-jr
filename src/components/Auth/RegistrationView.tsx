import React, { useState, useEffect } from 'react';
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
  AlertCircle,
  Smartphone,
  Check,
  Package,
  Globe,
  Loader2,
  Activity
} from 'lucide-react';
import { auth, db, signInWithGoogle } from '../../lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  updateProfile, 
  signInWithEmailAndPassword,
  sendEmailVerification
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../../lib/firebase';

interface RegistrationViewProps {
  isDarkMode: boolean;
  language: 'PT' | 'EN';
  onSuccess: () => void;
  onBack?: () => void;
  forceOnboarding?: boolean;
}

export default function RegistrationView({ isDarkMode, language, onSuccess, onBack, forceOnboarding }: RegistrationViewProps) {
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

  const [mode, setMode] = useState<'login' | 'register' | 'onboarding'>(forceOnboarding ? 'onboarding' : 'register');
  const [step, setStep] = useState(0); // 0: Role Selection, 1: Details (for onboarding)
  const [type, setType] = useState<'buyer' | 'supplier' | 'logistics'>('buyer');
  const [onboardingUser, setOnboardingUser] = useState<any>(auth.currentUser);

  // Sync onboardingUser with auth state
  useEffect(() => {
    if (auth.currentUser && !onboardingUser) {
      setOnboardingUser(auth.currentUser);
    }
  }, [auth.currentUser, onboardingUser]);

  const [formData, setFormData] = useState({
    name: (forceOnboarding && auth.currentUser?.displayName) || '',
    userName: (forceOnboarding && auth.currentUser?.displayName) || '',
    nuit: '',
    address: '',
    phone: (forceOnboarding && auth.currentUser?.phoneNumber) || '',
    email: (forceOnboarding && auth.currentUser?.email) || '',
    password: '',
    sector: t.sectors[0],
    city: 'Maputo Cidade',
    fleetSize: '1-5',
    specialization: 'Carga Geral'
  });
  const [isRobotValid, setIsRobotValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);
  const [isPendingVerification, setIsPendingVerification] = useState(false);

  // Sync mode if forceOnboarding changes
  useEffect(() => {
    if (forceOnboarding && mode !== 'onboarding') {
      setMode('onboarding');
      setStep(0); // Start at role selection
      if (auth.currentUser) {
        setOnboardingUser(auth.currentUser);
        setFormData(prev => ({
          ...prev,
          name: prev.name || auth.currentUser?.displayName || '',
          userName: prev.userName || auth.currentUser?.displayName || '',
          email: prev.email || auth.currentUser?.email || '',
          phone: prev.phone || auth.currentUser?.phoneNumber || '',
        }));
      }
    }
  }, [forceOnboarding, mode]);

  const validateEmail = (email: string) => {
    return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email);
  };

  const validatePassword = (pass: string) => {
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasDigit = /[0-9]/.test(pass);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
    // User requested flexibility: Any password is valid as long as it meets character requirements
    // We use 6 as minimum to match the UI labels and Firebase common defaults
    return pass.length >= 6 && hasUpper && hasLower && hasDigit && hasSpecial;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((mode === 'register' || mode === 'onboarding') && !isRobotValid) {
      setError(t.robotError);
      return;
    }

    if (mode === 'register') {
      if (formData.nuit.length !== 9) {
        setError(language === 'PT' ? 'O NUIT deve ter exatamente 9 dígitos.' : 'NUIT must be exactly 9 digits.');
        return;
      }
      if (!validatePassword(formData.password)) {
        setError(language === 'PT' ? 'A senha deve ter no mínimo 6 caracteres, incluindo letras maiúsculas, minúsculas, números e símbolos.' : 'Password must be at least 6 characters, including uppercase, lowercase, numbers, and symbols.');
        return;
      }
    }

    if (mode === 'onboarding') {
      if (formData.nuit.length !== 9) {
        setError(language === 'PT' ? 'O NUIT deve ter exatamente 9 dígitos.' : 'NUIT must be exactly 9 digits.');
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      if (mode === 'register') {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email.trim(), formData.password);
        const user = userCredential.user;

        await updateProfile(user, { displayName: formData.name });
        
        // Pillar Check: Send verification email directly to ensure identity
        await sendEmailVerification(user);
        setVerificationSent(true);

        if (!user.uid) throw new Error("Firebase Auth UID not found after creation.");

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
          bankAccounts: [],
          mobileWallets: [],
        });
      } else if (mode === 'onboarding' && onboardingUser) {
        await createProfileDoc(onboardingUser.uid, {
          name: formData.name,
          userName: type === 'buyer' ? formData.name : formData.userName,
          nuit: formData.nuit,
          address: formData.address,
          phone: formData.phone || onboardingUser.phoneNumber || '',
          email: onboardingUser.email || '',
          type: type,
          sector: formData.sector,
          city: formData.city,
          fleetSize: type === 'logistics' ? formData.fleetSize : null,
          specialization: type === 'logistics' ? formData.specialization : null,
          bankAccounts: [],
          mobileWallets: [],
        });
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, formData.email.trim(), formData.password);
        const user = userCredential.user;

        if (!user.emailVerified) {
          await sendEmailVerification(user);
          setVerificationSent(true);
          setIsPendingVerification(true);
          setIsLoading(false);
          return;
        }

        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        const profileData = docSnap.exists() ? docSnap.data() : null;

        if (!profileData || !profileData.type) {
          setMode('onboarding');
          setStep(0);
          setOnboardingUser(user);
          setIsLoading(false);
          return;
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

  const createProfileDoc = async (uid: string, data: any) => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      const exists = docSnap.exists();
      const existingData = exists ? docSnap.data() : {};

      const profileData: any = {
        uid,
        name: data.name || existingData.name || '',
        userName: data.userName || existingData.userName || '',
        nuit: data.nuit || existingData.nuit || '',
        address: data.address || existingData.address || '',
        phone: data.phone || existingData.phone || '',
        email: data.email || existingData.email || '',
        type: data.type || existingData.type || 'buyer',
        sector: data.sector || existingData.sector || t.sectors[0],
        city: data.city || existingData.city || 'Maputo Cidade',
        updatedAt: serverTimestamp(),
      };

      // Only set bio/photos if they don't exist OR if explicitly provided
      if (data.bio) profileData.bio = data.bio;
      else if (!existingData.bio) {
        profileData.bio = data.sector ? t.defaultBio(data.sector, data.city || 'Maputo Cidade') : t.welcome;
      }

      if (data.photoURL) profileData.photoURL = data.photoURL;
      else if (!existingData.photoURL) {
        profileData.photoURL = data.type === 'supplier' ? 'https://images.unsplash.com/photo-1599305096906-71e576f33e08?w=400&q=80' : 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80';
      }

      if (data.coverURL) profileData.coverURL = data.coverURL;
      else if (!existingData.coverURL) {
        profileData.coverURL = 'https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?w=1000&q=80';
      }

      if (!existingData.createdAt) {
        profileData.createdAt = serverTimestamp();
      }

      if (data.fleetSize) profileData.fleetSize = data.fleetSize;
      if (data.specialization) profileData.specialization = data.specialization;
      if (!existingData.bankAccounts) profileData.bankAccounts = [];
      if (!existingData.mobileWallets) profileData.mobileWallets = [];
      
      // Maintain status if it exists
      if (existingData.status) profileData.status = existingData.status;
      else profileData.status = 'online';

      await setDoc(docRef, profileData, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      const result = await signInWithGoogle();
      const user = result.user;

      // Force identity confirmation behavior if not verified (rare for Google, but possible)
      if (!user.emailVerified) {
        await sendEmailVerification(user);
        setVerificationSent(true);
        setIsPendingVerification(true);
        return;
      }

      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      const profileData = docSnap.exists() ? docSnap.data() : null;

      if (!profileData || !profileData.type) {
        setOnboardingUser(user);
        setFormData({
          ...formData,
          name: user.displayName || '',
          userName: user.displayName || '',
          email: user.email || '',
        });
        setMode('onboarding');
        setStep(1); // Go straight to form if name/email is known, but maybe step 0 is better for role?
        // Let's go to step 0 so they can pick Buyer/Supplier/Logistics
        setStep(0);
        setIsRobotValid(false);
        return;
      }

      onSuccess();
    } catch (err: any) {
      if (err.message?.includes('auth/popup-closed-by-user')) {
        return;
      }
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center py-12 px-4 relative overflow-y-auto ${isDarkMode ? 'bg-supplyx-deep text-white' : 'bg-zinc-50 text-zinc-900'}`}>
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-supplyx-blue/5 blur-[120px] rounded-full -z-10" />
      
      {(onBack || (mode === 'onboarding' && step === 1)) && (
        <button 
          onClick={() => {
            if (mode === 'onboarding' && step === 1) {
              setStep(0);
            } else if (onBack) {
              onBack();
            }
          }}
          className="fixed top-8 left-8 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors z-50"
        >
          <ChevronDown className="w-4 h-4 rotate-90" />
          Voltar
        </button>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg mb-8 text-center shrink-0"
      >
        <div className="flex items-center justify-center gap-4 mb-4">
          <SupplyXLogo size="lg" isDark={true} />
        </div>
        <p className="text-supplyx-blue text-[10px] font-black uppercase tracking-widest leading-none bg-supplyx-blue/10 px-4 py-1.5 rounded-full inline-block border border-supplyx-blue/20">{t.slogan}</p>
        
        {verificationSent && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md"
          >
            <p className="text-xs font-black uppercase tracking-widest text-emerald-500 italic">
              {language === 'PT' 
                ? 'Verificação enviada! Verifique seu e-mail para confirmar sua identidade.' 
                : 'Verification sent! Check your email to confirm your identity.'}
            </p>
          </motion.div>
        )}

        {mode === 'onboarding' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 p-4 rounded-3xl bg-brand/10 border border-brand/20 backdrop-blur-md"
          >
            <p className="text-xs font-black uppercase tracking-widest text-brand italic">
              {language === 'PT' ? 'Complete seu perfil para continuar' : 'Complete your profile to continue'}
            </p>
          </motion.div>
        )}
      </motion.div>

      <div className={`w-full max-w-2xl rounded-[48px] border shadow-3xl relative mb-12 ${isDarkMode ? 'bg-zinc-900/80 border-white/5 backdrop-blur-xl' : 'bg-white border-zinc-100 shadow-zinc-200'}`}>
        {!(mode === 'onboarding' && step === 0) && (
          <div className="flex p-1 gap-1 border-b border-white/5">
            <button 
              type="button"
              onClick={() => setType('buyer')}
              className={`flex-1 py-4 flex flex-col items-center gap-1.5 rounded-[24px] transition-all relative ${type === 'buyer' ? (isDarkMode ? 'bg-supplyx-blue/20 border border-supplyx-blue/30' : 'bg-supplyx-blue/10 border border-supplyx-blue/20') : 'opacity-40 grayscale'}`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${type === 'buyer' ? 'bg-supplyx-blue text-white shadow-lg shadow-supplyx-blue/20' : 'bg-zinc-700/50'}`}>
                <User className="w-4 h-4" />
              </div>
              <p className={`text-[10px] font-black uppercase tracking-tight ${type === 'buyer' ? (isDarkMode ? 'text-white' : 'text-supplyx-blue') : 'text-zinc-500'}`}>{t.buyerTitle}</p>
            </button>
            <button 
              type="button"
              onClick={() => setType('supplier')}
              className={`flex-1 py-4 flex flex-col items-center gap-1.5 rounded-[24px] transition-all relative ${type === 'supplier' ? (isDarkMode ? 'bg-supplyx-blue/20 border border-supplyx-blue/30' : 'bg-supplyx-blue/10 border border-supplyx-blue/20') : 'opacity-40 grayscale'}`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${type === 'supplier' ? 'bg-supplyx-blue text-white shadow-lg shadow-supplyx-blue/20' : 'bg-zinc-700/50'}`}>
                <Package className="w-4 h-4" />
              </div>
              <p className={`text-[10px] font-black uppercase tracking-tight ${type === 'supplier' ? (isDarkMode ? 'text-white' : 'text-supplyx-blue') : 'text-zinc-500'}`}>{t.supplierTitle}</p>
            </button>
            <button 
              type="button"
              onClick={() => setType('logistics')}
              className={`flex-1 py-4 flex flex-col items-center gap-1.5 rounded-[24px] transition-all relative ${type === 'logistics' ? (isDarkMode ? 'bg-supplyx-blue/20 border border-supplyx-blue/30' : 'bg-supplyx-blue/10 border border-supplyx-blue/20') : 'opacity-40 grayscale'}`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${type === 'logistics' ? 'bg-supplyx-blue text-white shadow-lg shadow-supplyx-blue/20' : 'bg-zinc-700/50'}`}>
                <Activity className="w-4 h-4" />
              </div>
              <p className={`text-[10px] font-black uppercase tracking-tight ${type === 'logistics' ? (isDarkMode ? 'text-white' : 'text-supplyx-blue') : 'text-zinc-500'}`}>{t.logisticsTitle}</p>
            </button>
          </div>
        )}

        <div className="p-8">
          <AnimatePresence mode="wait">
            {isPendingVerification ? (
              <motion.div 
                key="pending-verification"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center space-y-8 py-12"
              >
                <div className="w-20 h-20 bg-brand/10 rounded-[32px] flex items-center justify-center mx-auto border border-brand/20 relative">
                  <Mail className="w-10 h-10 text-brand" />
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-zinc-900" 
                  />
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter italic mb-4">
                    {language === 'PT' ? 'VERIFICAÇÃO NECESSÁRIA' : 'VERIFICATION REQUIRED'}
                  </h3>
                  <p className="text-xs text-zinc-500 font-medium leading-relaxed max-w-xs mx-auto">
                    {language === 'PT' 
                      ? 'Por segurança, enviamos um e-mail de confirmação. Por favor, clique no link enviado para confirmar sua identidade diretamente com o Google/SupplyX.' 
                      : 'For security, we sent a confirmation email. Please click the link sent to confirm your identity directly with Google/SupplyX.'}
                  </p>
                </div>

                <div className="space-y-4">
                  <button 
                    onClick={() => {
                      setIsLoading(true);
                      auth.currentUser?.reload().then(() => {
                        if (auth.currentUser?.emailVerified) {
                          onSuccess();
                        } else {
                          setError(language === 'PT' ? 'E-mail ainda não verificado.' : 'Email not verified yet.');
                        }
                        setIsLoading(false);
                      });
                    }}
                    className="w-full py-5 rounded-2xl bg-brand text-white font-black text-sm uppercase tracking-widest italic transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xl shadow-brand/20"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                    {language === 'PT' ? 'JÁ VERIFIQUEI MEU E-MAIL' : 'I ALREADY VERIFIED MY EMAIL'}
                  </button>
                  <button 
                    onClick={() => {
                      if (auth.currentUser) {
                        sendEmailVerification(auth.currentUser);
                        setError(language === 'PT' ? 'Link de verificação reenviado!' : 'Verification link resent!');
                      }
                    }}
                    className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
                  >
                    {language === 'PT' ? 'REENVIAR E-MAIL DE CONFIRMAÇÃO' : 'RESEND CONFIRMATION EMAIL'}
                  </button>
                </div>
              </motion.div>
            ) : mode === 'onboarding' && step === 0 ? (
              <motion.div 
                key="role-selection"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-brand/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-brand/20">
                    <Check className="w-8 h-8 text-brand" />
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-widest italic mb-2">
                    {language === 'PT' ? 'QUASE LÁ!' : 'ALMOST THERE!'}
                  </h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                    {language === 'PT' ? 'Escolha sua identidade operacional' : 'Choose your operational identity'}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {[
                    { id: 'buyer', title: t.buyerTitle, icon: User, color: 'bg-emerald-500' },
                    { id: 'supplier', title: t.supplierTitle, icon: Package, color: 'bg-blue-500' },
                    { id: 'logistics', title: t.logisticsTitle, icon: Activity, color: 'bg-orange-500' }
                  ].map((role) => (
                    <button
                      key={role.id}
                      onClick={() => {
                        setType(role.id as any);
                        setStep(1);
                      }}
                      className={`group p-6 rounded-3xl border-2 text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:border-brand/50' : 'bg-zinc-50 border-zinc-100 hover:border-brand/30'}`}
                    >
                      <div className="flex items-center gap-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl ${role.color}`}>
                          <role.icon className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black uppercase tracking-widest">{role.title}</h4>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight mt-1">
                            {role.id === 'buyer' ? t.buyerSub : role.id === 'supplier' ? t.supplierSub : t.logisticsSub}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="form-details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <form className="space-y-4" onSubmit={handleSubmit}>
                  {(mode === 'register' || mode === 'onboarding') && (
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
                          mode === 'register' ? (
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
                              icon={MapPin} 
                              label={t.address} 
                              placeholder="Ex: Av. Eduardo Mondlane, Maputo" 
                              isDarkMode={isDarkMode}
                              value={formData.address}
                              onChange={(v) => setFormData({...formData, address: v})}
                            />
                          )
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
                          mode === 'register' && (
                            <InputField 
                              icon={Phone} 
                              label={t.phone} 
                              placeholder="+258 84 123 4567" 
                              isDarkMode={isDarkMode}
                              value={formData.phone}
                              onChange={(v) => setFormData({...formData, phone: v})}
                            />
                          )
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
                          {mode === 'register' && (
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
                        </div>
                      )}
                      
                      {type === 'logistics' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t.fleetSize}</label>
                            <select 
                              className={`w-full bg-transparent border rounded-2xl py-4 px-4 text-xs font-bold appearance-none outline-none transition-all ${isDarkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-100 text-zinc-900'}`}
                              value={formData.fleetSize}
                              onChange={(e) => setFormData({...formData, fleetSize: e.target.value})}
                            >
                              <option value="1-5" className={isDarkMode ? 'bg-zinc-900' : ''}>1-5 Veículos</option>
                              <option value="6-20" className={isDarkMode ? 'bg-zinc-900' : ''}>6-20 Veículos</option>
                              <option value="21-50" className={isDarkMode ? 'bg-zinc-900' : ''}>21-50 Veículos</option>
                              <option value="50+" className={isDarkMode ? 'bg-zinc-900' : ''}>Mais de 50</option>
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t.specialization}</label>
                            <select 
                              className={`w-full bg-transparent border rounded-2xl py-4 px-4 text-xs font-bold appearance-none outline-none transition-all ${isDarkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-100 text-zinc-900'}`}
                              value={formData.specialization}
                              onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                            >
                              <option value="Carga Geral" className={isDarkMode ? 'bg-zinc-900' : ''}>Carga Geral</option>
                              <option value="Refrigerados" className={isDarkMode ? 'bg-zinc-900' : ''}>Refrigerados</option>
                              <option value="Produtos Perigosos" className={isDarkMode ? 'bg-zinc-900' : ''}>Produtos Perigosos</option>
                              <option value="Materiais de Construção" className={isDarkMode ? 'bg-zinc-900' : ''}>Materiais de Construção</option>
                            </select>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t.city}</label>
                          <select 
                            className={`w-full bg-transparent border rounded-2xl py-4 px-4 text-xs font-bold appearance-none outline-none transition-all ${isDarkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-100 text-zinc-900'}`}
                            value={formData.city}
                            onChange={(e) => setFormData({...formData, city: e.target.value})}
                          >
                            {t.provinces.map(p => <option key={p} value={p} className={isDarkMode ? 'bg-zinc-900' : ''}>{p}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t.sector}</label>
                          <select 
                            className={`w-full bg-transparent border rounded-2xl py-4 px-4 text-xs font-bold appearance-none outline-none transition-all ${isDarkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-100 text-zinc-900'}`}
                            value={formData.sector}
                            onChange={(e) => setFormData({...formData, sector: e.target.value})}
                          >
                            {t.sectors.map(s => <option key={s} value={s} className={isDarkMode ? 'bg-zinc-900' : ''}>{s}</option>)}
                          </select>
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

                  {mode !== 'onboarding' && (
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
                  )}

                  {(mode === 'register' || mode === 'onboarding') && (
                    <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 select-none transition-all ${isRobotValid ? (isDarkMode ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-emerald-50 border-emerald-200') : (isDarkMode ? 'bg-white/5 border-white/5' : 'bg-zinc-50 border-zinc-100')}`}>
                      <div className="flex items-center gap-3">
                        <button 
                          type="button"
                          onClick={() => setIsRobotValid(!isRobotValid)}
                          className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all ${isRobotValid ? 'bg-emerald-500 border-emerald-500 text-white' : (isDarkMode ? 'border-white/10 bg-black/20' : 'border-zinc-300 bg-white')}`}
                        >
                          {isRobotValid && <Check className="w-4 h-4" />}
                        </button>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${isRobotValid ? 'text-emerald-500' : 'text-zinc-500'}`}>{t.robot}</span>
                      </div>
                      <ShieldCheck className={`w-6 h-6 ${isRobotValid ? 'text-emerald-500' : 'text-zinc-500 opacity-20'}`} />
                    </div>
                  )}

                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-bold uppercase">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </div>
                  )}

                  <div className="pt-4 space-y-4">
                    <button 
                      type="submit"
                      disabled={isLoading}
                      className={`w-full py-5 rounded-2xl text-white font-black text-sm uppercase tracking-tighter italic transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xl
                        ${type === 'buyer' ? 'bg-emerald-600 shadow-emerald-600/20' : type === 'supplier' ? 'bg-blue-600 shadow-blue-600/20' : 'bg-orange-600 shadow-orange-600/20'}
                      `}
                    >
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                      {mode === 'onboarding' ? (language === 'PT' ? 'FINALIZAR' : 'FINISH') : (mode === 'login' ? t.login : (type === 'buyer' ? t.createBuyer : type === 'supplier' ? t.createSupplier : t.createLogistics))}
                    </button>

                    {mode !== 'onboarding' && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode(mode === 'login' ? 'register' : 'login');
                          setError(null);
                        }}
                        className="w-full text-center py-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-brand transition-colors"
                      >
                        {mode === 'login' ? t.noAccount : t.hasAccount}
                      </button>
                    )}
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {mode === 'onboarding' ? (
          <div className="p-8 pt-0 space-y-4">
            <div className="text-center px-4 py-3 rounded-2xl bg-zinc-500/5 border border-white/5">
              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">
                {language === 'PT' ? 'Logado como' : 'Logged in as'}
              </p>
              <p className="text-[11px] font-bold text-supplyx-blue truncate">
                {auth.currentUser?.email}
              </p>
            </div>
            <button 
              type="button"
              onClick={() => auth.signOut()}
              className="w-full text-center py-5 rounded-2xl border-2 border-red-500/10 text-red-500/50 hover:text-red-500 hover:bg-red-500/5 transition-all text-[10px] font-black uppercase tracking-widest"
            >
              {language === 'PT' ? 'SAIR DA CONTA / TROCAR CONTA' : 'SIGN OUT / SWITCH ACCOUNT'}
            </button>
          </div>
        ) : (
          <div className="p-8 pt-0 space-y-4">
            <div className="relative py-4 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5" /></div>
              <span className={`relative px-4 text-[10px] font-black tracking-widest text-zinc-500 uppercase ${isDarkMode ? 'bg-zinc-900 border border-white/5 rounded-full px-4 py-1' : 'bg-white'}`}>{t.orEnter}</span>
            </div>

            <button 
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className={`w-full py-4 rounded-2xl border-2 flex items-center justify-center gap-3 transition-all active:scale-95 ${isDarkMode ? 'bg-zinc-800 border-zinc-700 hover:border-zinc-500' : 'bg-zinc-50 border-zinc-200'}`}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="#EA4335" d="M12 5.04c2.14 0 3.86.73 5.37 2.16L21.01 3.5C18.66 1.34 15.63 0 12 0 7.31 0 3.32 2.69 1.38 6.64l4.08 3.16C6.44 7.08 8.99 5.04 12 5.04z"/><path fill="#4285F4" d="M23.49 12.27c0-.82-.07-1.61-.21-2.38H12v4.51h6.44c-.28 1.48-1.12 2.73-2.38 3.58l3.71 2.87c2.16-1.99 3.42-4.92 3.42-8.58z"/><path fill="#FBBC05" d="M5.46 14.71c-.24-.73-.38-1.5-.38-2.31s.14-1.58.38-2.31l-4.08-3.16C.5 8.78 0 10.33 0 12c0 1.67.5 3.22 1.38 4.61l4.08-3.16z"/><path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.71-2.87c-1.1.74-2.51 1.18-4.23 1.18-3.25 0-6.01-2.2-7-5.17l-4.08 3.16C3.32 21.31 7.31 24 12 24z"/></svg>
              <span className="text-[11px] font-black uppercase tracking-tighter">{t.google}</span>
            </button>
          </div>
        )}
      </div>

      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl px-4">
        <FeatureItem icon={Smartphone} label={t.features.validation} isDarkMode={isDarkMode} />
        <FeatureItem icon={ShieldCheck} label={t.features.protection} isDarkMode={isDarkMode} />
        <FeatureItem icon={FileText} label={t.features.compliance} isDarkMode={isDarkMode} />
        <FeatureItem icon={Activity} label={t.features.support} isDarkMode={isDarkMode} />
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
      <div className={`relative flex items-center rounded-2xl border transition-all group overflow-hidden ${isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-50 border-zinc-100'}`}>
        <div className="pl-4 py-4 pr-3 text-zinc-500 group-focus-within:text-brand transition-colors">
          <Icon className="w-5 h-5" />
        </div>
        <input 
          type={type} 
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`flex-1 bg-transparent border-none outline-none py-4 text-xs font-bold placeholder:text-zinc-500 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`} 
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
