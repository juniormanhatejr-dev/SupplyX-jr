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
  Activity,
  Eye,
  EyeOff,
  X,
  Scale
} from 'lucide-react';
import { auth, db, signInWithGoogle, signInWithMicrosoft } from '../../lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  updateProfile, 
  signInWithEmailAndPassword
} from 'firebase/auth';
import { sendVerificationEmail } from '../../services/firebase/emailVerificationService';
import { doc, setDoc, serverTimestamp, getDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../../lib/firebase';

interface RegistrationViewProps {
  isDarkMode: boolean;
  language: 'PT' | 'EN';
  onSuccess: () => void;
  onBack?: () => void;
  forceOnboarding?: boolean;
}

export default function RegistrationView({ isDarkMode, language, onSuccess, onBack, forceOnboarding }: RegistrationViewProps) {
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | null>(null);

  const t = {
    PT: {
      slogan: 'Conectando Fornecedores e Compradores',
      buyerTitle: 'COMPRADOR',
      buyerSub: 'Compre rápido e seguro',
      supplierTitle: 'FORNECEDOR',
      supplierSub: 'Ofereça seus produtos',
      logisticsTitle: 'LOGÍSTICA / MOTORISTA',
      logisticsSub: 'Gestão de frotas, cargas e motoristas',
      companyName: 'NOME DA EMPRESA / RAZÃO SOCIAL',
      companyNameLogistics: 'NOME DA EMPRESA EM QUE TRABALHA',
      driverFullName: 'NOME COMPLETO DO MOTORISTA',
      biNumber: 'Nº BI / DOCUMENTO DE IDENTIDADE',
      drivingLicense: 'Nº DA CARTA DE CONDUÇÃO',
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
      outlook: 'MICROSOFT / OUTLOOK',
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
      logisticsTitle: 'LOGISTICS / DRIVER',
      logisticsSub: 'Fleet, cargo and driver management',
      companyName: 'COMPANY NAME / REGISTERED NAME',
      companyNameLogistics: 'COMPANY NAME YOU WORK FOR',
      driverFullName: 'DRIVER FULL NAME',
      biNumber: 'BI NUMBER / IDENTITY DOC',
      drivingLicense: 'DRIVING LICENSE NUMBER',
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
      outlook: 'MICROSOFT / OUTLOOK',
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
    specialization: 'Carga Geral',
    companyName: '',
    biNumber: '',
    fullName: '',
    licenseNumber: ''
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



  const handleMicrosoftSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await signInWithMicrosoft();
      const user = result.user;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((mode === 'register' || mode === 'onboarding') && !isRobotValid) {
      setError(t.robotError);
      return;
    }

    if (mode === 'register' || mode === 'onboarding') {
      if (type === 'logistics') {
        if (!formData.fullName.trim()) {
          setError(language === 'PT' ? 'Por favor, insira o nome completo do motorista.' : 'Please enter the full name of the driver.');
          return;
        }
        if (!formData.companyName.trim()) {
          setError(language === 'PT' ? 'Por favor, insira o nome da empresa em que trabalha.' : 'Please enter the company name you work for.');
          return;
        }
        if (!formData.biNumber.trim()) {
          setError(language === 'PT' ? 'Por favor, insira o Nº BI.' : 'Please enter your BI number.');
          return;
        }
        if (!formData.licenseNumber.trim()) {
          setError(language === 'PT' ? 'Por favor, insira o Nº da carta de condução.' : 'Please enter your driving license number.');
          return;
        }
        if (!formData.address.trim()) {
          setError(language === 'PT' ? 'Por favor, insira a localização.' : 'Please enter your location.');
          return;
        }
      } else {
        if (type === 'supplier' && !formData.userName.trim()) {
          setError(language === 'PT' ? 'Por favor, insira o nome do responsável.' : 'Please enter responsible user name.');
          return;
        }
        if (!formData.name.trim()) {
          setError(language === 'PT' ? 'Por favor, insira o nome.' : 'Please enter the name.');
          return;
        }
      }

      if (formData.nuit.length !== 9) {
        setError(language === 'PT' ? 'O NUIT deve ter exatamente 9 dígitos.' : 'NUIT must be exactly 9 digits.');
        return;
      }
    }

    if (mode === 'register') {
      if (!validatePassword(formData.password)) {
        setError(language === 'PT' ? 'A senha deve ter no mínimo 6 caracteres, incluindo letras maiúsculas, minúsculas, números e símbolos.' : 'Password must be at least 6 characters, including uppercase, lowercase, numbers, and symbols.');
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      if (mode === 'register' || mode === 'onboarding') {
        // NUIT duplicate verification within SupplyX local database
        const nuitQuery = query(collection(db, 'users'), where('nuit', '==', formData.nuit));
        const nuitSnap = await getDocs(nuitQuery);
        if (!nuitSnap.empty) {
          setError(language === 'PT' ? 'Este NUIT já está associado a outro utilizador.' : 'This NUIT is already registered.');
          setIsLoading(false);
          return;
        }
      }

      if (mode === 'register') {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email.trim().toLowerCase(), formData.password);
        const user = userCredential.user;

        await updateProfile(user, { displayName: formData.name });

        if (!user.uid) throw new Error("Firebase Auth UID not found after creation.");

        await createProfileDoc(user.uid, {
          name: type === 'logistics' ? formData.companyName : formData.name,
          userName: type === 'buyer' ? formData.name : (type === 'logistics' ? formData.fullName : formData.userName),
          nuit: formData.nuit,
          address: formData.address,
          phone: formData.phone,
          email: formData.email.trim().toLowerCase(),
          type: type,
          sector: formData.sector,
          city: formData.city,
          fleetSize: type === 'logistics' ? formData.fleetSize : null,
          specialization: type === 'logistics' ? formData.specialization : null,
          companyName: type === 'logistics' ? formData.companyName : null,
          biNumber: type === 'logistics' ? formData.biNumber : null,
          licenseNumber: type === 'logistics' ? formData.licenseNumber : null,
          fullName: type === 'logistics' ? formData.fullName : null,
          bankAccounts: [],
          mobileWallets: [],
          emailVerified: false,
        });
        
        // Pillar Check: Send verification email directly to ensure identity
        try {
          const emailRes = await sendVerificationEmail(formData.email.trim().toLowerCase(), formData.name, language);
          if (!emailRes.success) {
            console.warn('[REGISTRATION] Verification email sending failed, but profile created:', emailRes.error);
          }
        } catch (emailErr) {
          console.warn('[REGISTRATION] Failed to send verification email during signup:', emailErr);
        }
        
        setVerificationSent(true);
      } else if (mode === 'onboarding' && onboardingUser) {
        await createProfileDoc(onboardingUser.uid, {
          name: type === 'logistics' ? formData.companyName : formData.name,
          userName: type === 'buyer' ? formData.name : (type === 'logistics' ? formData.fullName : formData.userName),
          nuit: formData.nuit,
          address: formData.address,
          phone: formData.phone || onboardingUser.phoneNumber || '',
          email: (onboardingUser.email || '').toLowerCase(),
          type: type,
          sector: formData.sector,
          city: formData.city,
          fleetSize: type === 'logistics' ? formData.fleetSize : null,
          specialization: type === 'logistics' ? formData.specialization : null,
          companyName: type === 'logistics' ? formData.companyName : null,
          biNumber: type === 'logistics' ? formData.biNumber : null,
          licenseNumber: type === 'logistics' ? formData.licenseNumber : null,
          fullName: type === 'logistics' ? formData.fullName : null,
          bankAccounts: [],
          mobileWallets: [],
          emailVerified: false,
        });
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, formData.email.trim().toLowerCase(), formData.password);
        const user = userCredential.user;

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
      const code = err.code || '';
      const msg = err.message || '';
      const fullErrorStr = String(err.message || err.code || err || '').toLowerCase();

      if (code === 'auth/invalid-credential' || msg.includes('auth/invalid-credential')) {
        message = language === 'PT' ? 'E-mail ou senha incorretos.' : 'Invalid email or password.';
      } else if (code === 'auth/user-not-found' || msg.includes('auth/user-not-found')) {
        message = language === 'PT' ? 'Usuário não encontrado.' : 'User not found.';
      } else if (code === 'auth/wrong-password' || msg.includes('auth/wrong-password')) {
        message = language === 'PT' ? 'Senha incorreta.' : 'Wrong password.';
      } else if (
        code === 'auth/email-already-in-use' || 
        msg.includes('auth/email-already-in-use') || 
        fullErrorStr.includes('email-already-in-use') || 
        fullErrorStr.includes('email_already_in_use')
      ) {
        message = language === 'PT' ? 'Este e-mail já está em uso.' : 'Email already in use.';
      } else if (code === 'auth/invalid-email' || msg.includes('auth/invalid-email')) {
        message = t.invalidEmail;
      } else if (code === 'auth/weak-password' || msg.includes('auth/weak-password')) {
        message = language === 'PT' ? 'Senha muito fraca.' : 'Weak password.';
      }
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
        userType: data.type || existingData.userType || existingData.type || 'buyer',
        nuitStatus: existingData.nuitStatus || 'pending',
        verificationStatus: existingData.verificationStatus || 'pending',
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
      if (data.companyName) profileData.companyName = data.companyName;
      if (data.biNumber) profileData.biNumber = data.biNumber;
      if (data.licenseNumber) profileData.licenseNumber = data.licenseNumber;
      if (data.fullName) profileData.fullName = data.fullName;
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
        const emailRes = await sendVerificationEmail(user.email || '', user.displayName || '', language);
        if (!emailRes.success) {
          throw new Error(emailRes.error || (language === 'PT' ? 'Falha ao enviar e-mail de verificação.' : 'Failed to send verification email.'));
        }
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
                    onClick={async () => {
                      if (auth.currentUser) {
                        setError(null);
                        const res = await sendVerificationEmail(auth.currentUser.email || '', auth.currentUser.displayName || '', language);
                        if (res.success) {
                          setError(language === 'PT' ? 'Link de verificação reenviado!' : 'Verification link resent!');
                        } else {
                          setError(res.error || (language === 'PT' ? 'Erro ao enviar e-mail de confirmação.' : 'Error sending confirmation email.'));
                        }
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
                      {type === 'logistics' ? (
                        <>
                          {/* Driver / Logistics specific registration fields */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField 
                              icon={User} 
                              label={t.driverFullName} 
                              placeholder="Ex: Fernando Manhate" 
                              isDarkMode={isDarkMode}
                              value={formData.fullName}
                              onChange={(v) => setFormData({...formData, fullName: v})}
                            />
                            <InputField 
                              icon={Building2} 
                              label={t.companyNameLogistics} 
                              placeholder="Ex: Manhate Transportes" 
                              isDarkMode={isDarkMode}
                              value={formData.companyName}
                              onChange={(v) => setFormData({...formData, companyName: v})}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField 
                              icon={FileText} 
                              label={t.biNumber} 
                              placeholder="123456789A" 
                              isDarkMode={isDarkMode}
                              value={formData.biNumber}
                              onChange={(v) => setFormData({...formData, biNumber: v})}
                            />
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
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField 
                              icon={ShieldCheck} 
                              label={t.drivingLicense} 
                              placeholder="MZ-12345-A" 
                              isDarkMode={isDarkMode}
                              value={formData.licenseNumber}
                              onChange={(v) => setFormData({...formData, licenseNumber: v})}
                            />
                            <InputField 
                              icon={MapPin} 
                              label={t.address} 
                              placeholder="Ex: Av. Eduardo Mondlane, Maputo" 
                              isDarkMode={isDarkMode}
                              value={formData.address}
                              onChange={(v) => setFormData({...formData, address: v})}
                            />
                          </div>

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
                        </>
                      ) : (
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
                    <div className="grid grid-cols-1 gap-4">
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

            <button 
              type="button"
              onClick={handleMicrosoftSignIn}
              disabled={isLoading}
              className={`w-full py-4 rounded-2xl border-2 flex items-center justify-center gap-3 transition-all active:scale-95 ${isDarkMode ? 'bg-zinc-800 border-zinc-700 hover:border-zinc-500' : 'bg-zinc-50 border-zinc-200'}`}
            >
              <svg viewBox="0 0 23 23" className="w-4 h-4"><path fill="#F35325" d="M0 0h11v11H0z"/><path fill="#80BB00" d="M12 0h11v11H12z"/><path fill="#00A1F1" d="M0 12h11v11H0z"/><path fill="#FFB900" d="M12 12h11v11H12z"/></svg>
              <span className="text-[11px] font-black uppercase tracking-tighter">{t.outlook}</span>
            </button>

            <div className="text-center pt-2 px-2">
              <p className="text-[9px] text-zinc-500 font-bold leading-normal uppercase tracking-wider">
                {language === 'PT' ? 'Ao prosseguir, você concorda com nossos ' : 'By continuing, you agree to our '}
                <button
                  type="button"
                  onClick={() => setActiveModal('terms')}
                  className="text-supplyx-blue hover:underline cursor-pointer font-black inline"
                >
                  {language === 'PT' ? 'Termos de Serviço' : 'Terms of Service'}
                </button>
                {language === 'PT' ? ' e ' : ' and '}
                <button
                  type="button"
                  onClick={() => setActiveModal('privacy')}
                  className="text-supplyx-blue hover:underline cursor-pointer font-black inline"
                >
                  {language === 'PT' ? 'Política de Privacidade' : 'Privacy Policy'}
                </button>
                .
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl px-4">
        <FeatureItem icon={Smartphone} label={t.features.validation} isDarkMode={isDarkMode} />
        <FeatureItem icon={ShieldCheck} label={t.features.protection} isDarkMode={isDarkMode} />
        <FeatureItem icon={FileText} label={t.features.compliance} isDarkMode={isDarkMode} />
        <FeatureItem icon={Activity} label={t.features.support} isDarkMode={isDarkMode} />
      </div>

      {/* Public Policy Modals */}
      <AnimatePresence>
        {activeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-zinc-950/95 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-4xl max-h-[85vh] bg-zinc-900 border border-white/5 rounded-[32px] overflow-hidden flex flex-col shadow-2xl shadow-black/80 text-left"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 md:p-8 border-b border-white/5 bg-zinc-900/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-supplyx-blue/10 border border-supplyx-blue/20 flex items-center justify-center text-supplyx-blue">
                    {activeModal === 'privacy' ? <ShieldCheck className="w-5 h-5" /> : <Scale className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-md sm:text-lg font-black uppercase tracking-wider text-white">
                      {activeModal === 'privacy' 
                        ? (language === 'PT' ? 'Política de Privacidade & Proteção de Dados' : 'Privacy Policy & Data Protection')
                        : (language === 'PT' ? 'Termos e Condições de Serviço' : 'Terms & Conditions of Service')
                      }
                    </h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-0.5">
                      {language === 'PT' ? 'Acesso Público • Sem Necessidade de Login' : 'Public Access • No Login Required'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 text-sm leading-relaxed text-zinc-300">
                {activeModal === 'privacy' ? (
                  <>
                    <p className="font-semibold text-white/90">
                      {language === 'PT'
                        ? 'A SupplyX Lda (doravante "SupplyX" ou "Plataforma") está empenhada em salvaguardar a confidencialidade, integridade e segurança de todas as informações comerciais, fiscais e operacionais que trafegam pelo nosso sistema.'
                        : 'SupplyX Lda (hereinafter "SupplyX" or "Platform") is committed to safeguarding the confidentiality, integrity, and security of all business, tax, and operational information flowing through our system.'}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-5 rounded-2xl bg-zinc-950/50 border border-white/5 space-y-2">
                        <div className="text-xs font-black uppercase tracking-wider text-supplyx-blue flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-supplyx-blue" />
                          {language === 'PT' ? '1. Recolha de Dados Corporativos' : '1. Corporate Data Collection'}
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          {language === 'PT'
                            ? 'Recolhemos dados essenciais para o procurement empresarial: Razão Social, NUIT, Certidões Comerciais, lances de cotação (RFQ), dados logísticos (vistorias físicas de carga, vistorias em balanças) e histórico de comunicações seguras por chat.'
                            : 'We collect essential high-scale procurement data: Corporate Name, NUIT tax ID, business registrations, RFQ bidding history, logistics details (loading docks inspection, weighbridge measures) and encrypted live chat histories.'}
                        </p>
                      </div>

                      <div className="p-5 rounded-2xl bg-zinc-950/50 border border-white/5 space-y-2">
                        <div className="text-xs font-black uppercase tracking-wider text-teal-400 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                          {language === 'PT' ? '2. Uso e Transparência Fiscal' : '2. Data Usage & Fiscal Honesty'}
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          {language === 'PT'
                            ? 'Os dados são utilizados exclusivamente para consolidar cotações bilaterais idênticas, aplicar o IVA correcto das províncias moçambicanas, enviar notificações operacionais, emitir relatórios de custos analíticos e cooperar com auditorias de integridade da empresa.'
                            : 'Data is used strictly to resolve symmetric buyer-seller prices, implement accurate regional Mozambican VAT, trigger direct delivery messages, compile financial logs, and aid commercial audits.'}
                        </p>
                      </div>

                      <div className="p-5 rounded-2xl bg-zinc-950/50 border border-white/5 space-y-2">
                        <div className="text-xs font-black uppercase tracking-wider text-amber-500 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          {language === 'PT' ? '3. Armazenamento e Cibersegurança' : '3. Technical Security & Storage'}
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          {language === 'PT'
                            ? 'Seus documentos e cotações são armazenados de forma estruturada na nuvem Firebase Firestore (protegida por regras de acesso granular) e ficheiros PDF no Azure Blob Storage com cache local blindada em IndexedDB.'
                            : 'Your corporate files and bids are stored in structured form on Google Firebase Firestore (protected by strong server rules) and PDF assets in Azure Blob Storage with shielded local browser caching in IndexedDB.'}
                        </p>
                      </div>

                      <div className="p-5 rounded-2xl bg-zinc-950/50 border border-white/5 space-y-2">
                        <div className="text-xs font-black uppercase tracking-wider text-purple-500 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                          {language === 'PT' ? '4. Seus Direitos Legais' : '4. User Legal Rights'}
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          {language === 'PT'
                            ? 'Em conformidade com a Lei de Proteção de Dados de Moçambique, os utilizadores detêm total controlo para requerer o acesso, actualização, rectificação ou eliminação permanente das credenciais da sua conta e registos históricos.'
                            : 'In alignment with the personal and corporate data protection acts of the Republic of Mozambique, you hold absolute rights to inspect, update, rectify, or purge your structural account records.'}
                        </p>
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-supplyx-blue/5 border border-supplyx-blue/10 text-xs mt-4">
                      <h4 className="font-black uppercase tracking-wider text-supplyx-blue mb-1">
                        {language === 'PT' ? 'Contacto e Encarregado de Protecção de Dados' : 'Privacy & Data Protection Officer Contact'}
                      </h4>
                      <p className="text-zinc-400">
                        {language === 'PT'
                          ? 'Para exercer quaisquer direitos de acesso ou para esclarecer dúvidas sobre os nossos protocolos de cibersegurança B2B, contacte o nosso encarregado legal através do correio eletrónico: privacy@supplyx.app ou suporte pelo e-mail support@supplyx.app.'
                          : 'To exercise your rights or clarify B2B cryptographic security guidelines, please reach our DPO team directly at privacy@supplyx.app or general support at support@supplyx.app.'}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-white/90">
                      {language === 'PT'
                        ? 'Ao aceder, registar ou transaccionar na plataforma SupplyX, o utilizador concorda expressamente em vincular-se aos presentes Termos de Uso e a agir em conformidade com as leis comerciais e fiscais da República de Moçambique.'
                        : 'By registering, accessing, or transacting on SupplyX, your corporate entity agrees unconditionally to follow these Terms of Service and act in accordance with the commercial and tax regulations of the Republic of Mozambique.'}
                    </p>

                    <div className="space-y-4">
                      <div className="p-5 rounded-2xl bg-zinc-950/40 border border-white/5 space-y-1.5">
                        <h4 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-supplyx-blue" />
                          {language === 'PT' ? '1. Elegibilidade e Verificação de Contas' : '1. Account Verification & Eligibility'}
                        </h4>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          {language === 'PT'
                            ? 'Apenas entidades corporativas activas e legalmente constituídas, detentoras de um NUIT verificado pela Autoridade Tributária moçambicana, estão elegíveis para operar como Comprador ou Fornecedor. A SupplyX reserva-se o direito de auditar os documentos antes da activação integral.'
                            : 'Only legally recognized Mozambican and international companies with a valid registered NUIT are eligible to act as Buyer or Supplier. SupplyX reserves the right to suspend accounts failing document background checks.'}
                        </p>
                      </div>

                      <div className="p-5 rounded-2xl bg-zinc-950/40 border border-white/5 space-y-1.5">
                        <h4 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-supplyx-blue" />
                          {language === 'PT' ? '2. Integridade dos Preços e Cotações' : '2. Integrity of Prices & Quotations'}
                        </h4>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          {language === 'PT'
                            ? 'Os preços, impostos de IVA indicados e as condições físicas de commodities ou materiais listadas são de inteira responsabilidade legal dos Fornecedores. Lances aceites na plataforma convertem-se em propostas comerciais vinculativas em conformidade com o Código Comercial moçambicano.'
                            : 'Sellers carry absolute legal liability for physical properties, catalog prices, and specific VAT variables declared. Bids accepted in our RFQ module represent contractually binding commercial offers under Mozambican commercial law.'}
                        </p>
                      </div>

                      <div className="p-5 rounded-2xl bg-zinc-950/40 border border-white/5 space-y-1.5">
                        <h4 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-supplyx-blue" />
                          {language === 'PT' ? '3. Ausência de Taxas Ocultas e Isenção' : '3. Zero Commission Sincerity'}
                        </h4>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          {language === 'PT'
                            ? 'Garantimos transparência absoluta. A SupplyX não cobra quaisquer percentagens ocultas adicionadas de forma arbitrária aos preços dos materiais ou sobre o valor tributável apurado. O valor exibido na cotação reflecte fielmente os valores bilaterais acordados.'
                            : 'We guarantee strict transparency. SupplyX does not inject unstated markups or dynamic middle-man margins on B2B materials. The price generated in the quotation invoice is an exact reflection of the agreed baseline prices.'}
                        </p>
                      </div>

                      <div className="p-5 rounded-2xl bg-zinc-950/40 border border-white/5 space-y-1.5">
                        <h4 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-supplyx-blue" />
                          {language === 'PT' ? '4. Resolução de Litígios e Foro Competente' : '4. Dispute Resolution & Governing Law'}
                        </h4>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          {language === 'PT'
                            ? 'Estes termos são regidos pelas leis de Moçambique. Qualquer diferendo relativo à execução de contratos de compra e venda iniciados na plataforma será submetido em primeira instância a arbitragem amigável sob a Lei de Arbitragem, Conciliação e Mediação (Lei nº 11/99).'
                            : 'These Terms are governed by Mozambican commercial laws. Any B2B procurement disputes initiated through this digital portal will be resolved primarily under Mozambican Arbitration, Conciliation and Mediation Acts (Law 11/99).'}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-white/5 bg-zinc-950/40 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-6 py-3 bg-supplyx-blue hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors shadow-lg shadow-blue-500/10 cursor-pointer"
                >
                  {language === 'PT' ? 'Entendido / Fechar' : 'Understood / Close'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InputField({ icon: Icon, label, placeholder, isDarkMode, type = 'text', badge, value, onChange }: { 
  icon: any, label: string, placeholder: string, isDarkMode: boolean, type?: string, badge?: string, value: string, onChange: (v: string) => void
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const currentType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="space-y-1.5 flex-1 w-full">
      <div className="flex justify-between items-center px-1">
        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{label}</label>
        {badge && <span className="text-[8px] font-black text-white px-2 py-0.5 rounded-md bg-orange-500 uppercase">{badge}</span>}
      </div>
      <div className={`relative flex items-center rounded-2xl border transition-all group overflow-hidden ${isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-50 border-zinc-100'}`}>
        <div className="pl-4 py-4 pr-3 text-zinc-500 group-focus-within:text-brand transition-colors">
          <Icon className="w-5 h-5" />
        </div>
        <input 
          type={currentType} 
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`flex-1 bg-transparent border-none outline-none py-4 text-xs font-bold placeholder:text-zinc-500 pr-12 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`} 
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 p-1 text-zinc-500 hover:text-white transition-colors cursor-pointer flex items-center justify-center z-10"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
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


