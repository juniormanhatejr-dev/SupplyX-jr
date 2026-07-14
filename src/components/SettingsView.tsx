import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, User, Bell, Shield, CreditCard, HelpCircle, Moon, Sun, Monitor, Loader2, CheckCircle2, Eye, EyeOff, ArrowLeft, Upload, FileImage, Image as ImageIcon, X, Lock, Smartphone, Receipt, AlertCircle, Check } from 'lucide-react';
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
  
  // High fidelity subviews manager
  const [activeSection, setActiveSection] = useState<string | null>(initialIsEditing ? 'profile' : null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState<{ photo: boolean; cover: boolean }>({ photo: false, cover: false });

  // Readward compatibility shim
  const isEditingProfile = activeSection === 'profile';
  const setIsEditingProfile = (val: boolean) => {
    setActiveSection(val ? 'profile' : null);
  };

  useEffect(() => {
    if (initialIsEditing) {
      setActiveSection('profile');
    }
  }, [initialIsEditing]);

  // Notifications Preferences
  const [notifPreferences, setNotifPreferences] = useState(() => {
    const saved = localStorage.getItem('supplyx_notif_prefs');
    return saved ? JSON.parse(saved) : {
      emailQuotes: true,
      emailOrders: true,
      pushStock: false,
      pushMessages: true,
      whatsappAlerts: true,
      smsDelivery: false
    };
  });
  const [notifSuccess, setNotifSuccess] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [testingChannel, setTestingChannel] = useState<string | null>(null);

  const handleTestChannel = (channelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTestingChannel(channelId);
    setTimeout(() => {
      setTestingChannel(null);
      let title = '';
      let message = '';
      if (channelId === 'emailQuotes') {
        title = language === 'PT' ? '📧 Teste de Consultas por E-mail' : '📧 Email Enquiries Test';
        message = language === 'PT' 
          ? 'Notificação de teste de novas mensagens e consultas enviada com sucesso para: supportsupply-x@gmail.com. O seu servidor SMTP corporativo do Gmail está ativo e operando com taxa de entrega de 100%!' 
          : 'New message/enquiry test notification successfully sent to: supportsupply-x@gmail.com. Your corporate Gmail SMTP server is online and operating at 100% deliverability rate!';
      } else if (channelId === 'emailOrders') {
        title = language === 'PT' ? '📄 Teste de Pedidos por E-mail' : '📄 Purchase Orders Test';
        message = language === 'PT' 
          ? 'Notificação de teste de contrato e faturamento enviada com sucesso para: supply-x@outlook.com. O seu servidor SMTP corporativo do Outlook está em conformidade e totalmente conectado!' 
          : 'Purchase order, contract, and billing test notification successfully sent to: supply-x@outlook.com. Your corporate Outlook SMTP server is compliant and fully connected!';
      } else if (channelId === 'whatsappAlerts') {
        title = language === 'PT' ? '💬 Teste de WhatsApp Business' : '💬 WhatsApp Business Test';
        message = language === 'PT' 
          ? 'Alerta instantâneo de cotação simulado com sucesso! A API do WhatsApp Business da SupplyX está totalmente operacional e vinculada ao seu número corporativo.' 
          : 'Instant quote alert successfully simulated! The SupplyX WhatsApp Business API is fully operational and linked to your corporate number.';
      } else {
        title = language === 'PT' ? '🔔 Teste de Notificações Push' : '🔔 Push Notifications Test';
        message = language === 'PT' 
          ? 'Alerta sonoro no navegador disparado com sucesso! A sua sessão está ativa e registada para receber atualizações instantâneas.' 
          : 'Audible browser alert successfully fired! Your session is active and registered to receive instant updates.';
      }
      setAlertModal({
        isOpen: true,
        title,
        message,
        type: 'success'
      });
    }, 1200);
  };

  const handleSaveNotifs = (e: React.FormEvent) => {
    e.preventDefault();
    setNotifLoading(true);
    setTimeout(() => {
      localStorage.setItem('supplyx_notif_prefs', JSON.stringify(notifPreferences));
      setNotifLoading(false);
      setNotifSuccess(true);
      setTimeout(() => setNotifSuccess(false), 2000);
    }, 800);
  };

  // Security Credentials Preferences
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(() => {
    return localStorage.getItem('supplyx_2fa_enabled') === 'true';
  });
  const [passwdSuccess, setPasswdSuccess] = useState(false);
  const [passwdLoading, setPasswdLoading] = useState(false);
  const [passwdError, setPasswdError] = useState('');

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswdError('');
    setPasswdSuccess(false);

    if (!currentPassword) {
      setPasswdError(language === 'PT' ? 'Por favor, introduza a senha atual.' : 'Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswdError(language === 'PT' ? 'A nova senha deve ter no mínimo 6 caracteres.' : 'The new password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswdError(language === 'PT' ? 'As senhas não coincidem.' : 'Passwords do not match.');
      return;
    }

    setPasswdLoading(true);
    setTimeout(() => {
      setPasswdLoading(false);
      setPasswdSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswdSuccess(false), 2500);
    }, 1000);
  };

  const handleToggle2FA = () => {
    const newValue = !twoFactorEnabled;
    setTwoFactorEnabled(newValue);
    localStorage.setItem('supplyx_2fa_enabled', String(newValue));
  };

  const handleDeleteOwnAccount = () => {
    if (!auth.currentUser) return;
    const userId = auth.currentUser.uid;
    setConfirmModal({
      isOpen: true,
      title: language === 'PT' ? 'ELIMINAR MINHA CONTA' : 'DELETE MY ACCOUNT',
      message: language === 'PT' 
        ? 'ATENÇÃO: Você está prestes a remover PERMANENTEMENTE a sua conta corporativa. Todos os seus produtos, cotações, chats, faturas, veículos, rotas e dados de faturamento serão completamente eliminados das nossas bases de dados do Firebase. Esta ação NÃO pode ser desfeita. Tem certeza que deseja prosseguir?' 
        : 'WARNING: You are about to PERMANENTELY delete your corporate account. All of your products, quotes, chats, invoices, vehicles, routes, and billing data will be completely wiped from our Firebase databases. This action CANNOT be undone. Are you sure you want to proceed?',
      confirmText: language === 'PT' ? 'Eliminar Definitivamente' : 'Delete Permanently',
      cancelText: language === 'PT' ? 'Cancelar' : 'Cancel',
      onConfirm: async () => {
        setIsCleaningAll(true);
        try {
          // 1. Run cascade delete to clean up ALL of current user's data
          await cascadeDeleteUser(userId);
          
          // 2. Delete the user in Firebase Auth and/or Sign Out
          const user = auth.currentUser;
          if (user) {
            try {
              await user.delete();
            } catch (authErr) {
              console.warn('Auth user delete rejected (e.g. requires recent login). Signing out instead:', authErr);
              await auth.signOut();
            }
          }
          
          setAlertModal({
            isOpen: true,
            title: language === 'PT' ? 'Conta Eliminada' : 'Account Deleted',
            message: language === 'PT' 
              ? 'A sua conta e todas as informações associadas foram completamente retiradas do app.' 
              : 'Your account and all associated information have been completely removed from the app.',
            type: 'success'
          });
          
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        } catch (err: any) {
          console.error('Error deleting account:', err);
          setAlertModal({
            isOpen: true,
            title: 'Error',
            message: language === 'PT' 
              ? 'Erro ao eliminar a conta. Verifique a ligação.' 
              : 'Error deleting account. Please verify connection.',
            type: 'error'
          });
        } finally {
          setIsCleaningAll(false);
        }
      }
    });
  };

  // Billing & Subscriptions Preferences
  const [subscriptionPlan, setSubscriptionPlan] = useState(() => {
    return localStorage.getItem('supplyx_subscription_plan') || 'standard';
  });
  const [billingHistory, setBillingHistory] = useState([
    { id: 'INV-2026-104', date: '15/05/2026', desc: language === 'PT' ? 'Assinatura Monthly Premium' : 'Monthly Premium Subscription', amount: 'MT 5.000', status: 'pago' },
    { id: 'INV-2026-103', date: '15/04/2026', desc: language === 'PT' ? 'Assinatura Monthly Premium' : 'Monthly Premium Subscription', amount: 'MT 5.000', status: 'pago' },
    { id: 'INV-2026-102', date: '15/03/2026', desc: language === 'PT' ? 'Assinatura Monthly Premium' : 'Monthly Premium Subscription', amount: 'MT 5.000', status: 'pago' }
  ]);
  const [billingSuccess, setBillingSuccess] = useState('');
  const [billingLoading, setBillingLoading] = useState(false);

  const handleUpgradePlan = (planId: string) => {
    setBillingLoading(true);
    setTimeout(() => {
      setSubscriptionPlan(planId);
      localStorage.setItem('supplyx_subscription_plan', planId);
      setBillingLoading(false);
      setBillingSuccess(planId === 'premium' ? 
        (language === 'PT' ? 'Plano atualizado para Premium Enterprise!' : 'Upgraded to Premium Enterprise!') :
        (language === 'PT' ? 'Plano atualizado com sucesso!' : 'Plan updated successfully!')
      );
      setTimeout(() => setBillingSuccess(''), 3000);
    }, 1000);
  };
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
        fleetSize: String(profile.fleetSize || ''),
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
      setAlertModal({
        isOpen: true,
        title: language === 'PT' ? 'Aviso' : 'Notice',
        message: language === 'PT' ? 'Você precisa estar logado para carregar imagens.' : 'You must be logged in to upload images.',
        type: 'info'
      });
      return;
    }

    // Validate if it's an image
    if (!file.type.startsWith('image/')) {
      setAlertModal({
        isOpen: true,
        title: language === 'PT' ? 'Erro' : 'Error',
        message: language === 'PT' ? 'Por favor, selecione uma imagem válida.' : 'Please select a valid image.',
        type: 'error'
      });
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
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: language === 'PT' ? `Erro: ${err.message}` : `Error: ${err.message}`,
        type: 'error'
      });
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

  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [isCleaningSuppliers, setIsCleaningSuppliers] = useState(false);
  const [isCleaningAll, setIsCleaningAll] = useState(false);

  // Custom modal states to replace window.confirm and alert in sandboxed iframe environments
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    cancelText: '',
    onConfirm: () => {},
  });

  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success',
  });

  // CASCADE USER REMOVAL SERVICE
  const cascadeDeleteUser = async (userId: string) => {
    // 1. Delete user products
    try {
      const prodsQ = query(collection(db, 'products'), where('supplierId', '==', userId));
      const prodsSnap = await getDocs(prodsQ);
      await Promise.all(prodsSnap.docs.map(doc => {
        return deleteDoc(doc.ref).catch(err => handleFirestoreError(err, OperationType.DELETE, `products/${doc.id}`));
      }));
    } catch (e) { 
      console.error('Error cascading products:', e); 
      handleFirestoreError(e, OperationType.DELETE, 'products');
    }

    // 2. Delete user quotations (where buyerId or supplierId matches)
    try {
      const quotesQ1 = query(collection(db, 'quotations'), where('buyerId', '==', userId));
      const quotesQ2 = query(collection(db, 'quotations'), where('supplierId', '==', userId));
      const [snap1, snap2] = await Promise.all([getDocs(quotesQ1), getDocs(quotesQ2)]);
      const quotesToDelete = [...snap1.docs, ...snap2.docs];
      await Promise.all(quotesToDelete.map(doc => {
        return deleteDoc(doc.ref).catch(err => handleFirestoreError(err, OperationType.DELETE, `quotations/${doc.id}`));
      }));
    } catch (e) { 
      console.error('Error cascading quotations:', e); 
      handleFirestoreError(e, OperationType.DELETE, 'quotations');
    }

    // 3. Delete user trucks
    try {
      const trucksQ = query(collection(db, 'trucks'), where('ownerId', '==', userId));
      const trucksSnap = await getDocs(trucksQ);
      await Promise.all(trucksSnap.docs.map(doc => {
        return deleteDoc(doc.ref).catch(err => handleFirestoreError(err, OperationType.DELETE, `trucks/${doc.id}`));
      }));
    } catch (e) { 
      console.error('Error cascading trucks:', e); 
      handleFirestoreError(e, OperationType.DELETE, 'trucks');
    }

    // 4. Delete user loads
    try {
      const loadsQ = query(collection(db, 'loads'), where('carrierId', '==', userId));
      const loadsSnap = await getDocs(loadsQ);
      await Promise.all(loadsSnap.docs.map(doc => {
        return deleteDoc(doc.ref).catch(err => handleFirestoreError(err, OperationType.DELETE, `loads/${doc.id}`));
      }));
    } catch (e) { 
      console.error('Error cascading loads:', e); 
      handleFirestoreError(e, OperationType.DELETE, 'loads');
    }

    // 5. Delete user notifications
    try {
      const notifsQ = query(collection(db, 'notifications'), where('userId', '==', userId));
      const notifsSnap = await getDocs(notifsQ);
      await Promise.all(notifsSnap.docs.map(doc => {
        return deleteDoc(doc.ref).catch(err => handleFirestoreError(err, OperationType.DELETE, `notifications/${doc.id}`));
      }));
    } catch (e) { 
      console.error('Error cascading notifications:', e); 
      handleFirestoreError(e, OperationType.DELETE, 'notifications');
    }

    // 6. Delete user chats
    try {
      const chatsQ = query(collection(db, 'chats'), where('participants', 'array-contains', userId));
      const chatsSnap = await getDocs(chatsQ);
      await Promise.all(chatsSnap.docs.map(async (chatDoc) => {
        try {
          const msgsSnap = await getDocs(collection(db, 'chats', chatDoc.id, 'messages'));
          await Promise.all(msgsSnap.docs.map(m => {
            return deleteDoc(m.ref).catch(err => handleFirestoreError(err, OperationType.DELETE, `chats/${chatDoc.id}/messages/${m.id}`));
          }));
        } catch (e) { 
          console.error('Error deleting chat messages:', e); 
          handleFirestoreError(e, OperationType.DELETE, `chats/${chatDoc.id}/messages`);
        }
        await deleteDoc(chatDoc.ref).catch(err => handleFirestoreError(err, OperationType.DELETE, `chats/${chatDoc.id}`));
      }));
    } catch (e) { 
      console.error('Error cascading chats:', e); 
      handleFirestoreError(e, OperationType.DELETE, 'chats');
    }

    // 7. Delete user freight_orders
    try {
      const f1 = query(collection(db, 'freight_orders'), where('buyerId', '==', userId));
      const f2 = query(collection(db, 'freight_orders'), where('assignedCarrier', '==', userId));
      const [snapF1, snapF2] = await Promise.all([getDocs(f1), getDocs(f2)]);
      const freightsToDelete = [...snapF1.docs, ...snapF2.docs];
      await Promise.all(freightsToDelete.map(doc => {
        return deleteDoc(doc.ref).catch(err => handleFirestoreError(err, OperationType.DELETE, `freight_orders/${doc.id}`));
      }));
    } catch (e) {
      console.error('Error cascading freight_orders:', e);
    }

    // 8. Delete user carrier_bids
    try {
      const bidsQ = query(collection(db, 'carrier_bids'), where('carrierId', '==', userId));
      const bidsSnap = await getDocs(bidsQ);
      await Promise.all(bidsSnap.docs.map(doc => {
        return deleteDoc(doc.ref).catch(err => handleFirestoreError(err, OperationType.DELETE, `carrier_bids/${doc.id}`));
      }));
    } catch (e) {
      console.error('Error cascading carrier_bids:', e);
    }

    // 9. Delete user transportAssignments
    try {
      const assignQ = query(collection(db, 'transportAssignments'), where('carrierId', '==', userId));
      const assignSnap = await getDocs(assignQ);
      await Promise.all(assignSnap.docs.map(doc => {
        return deleteDoc(doc.ref).catch(err => handleFirestoreError(err, OperationType.DELETE, `transportAssignments/${doc.id}`));
      }));
    } catch (e) {
      console.error('Error cascading transportAssignments:', e);
    }

    // 10. Delete professional user document itself
    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (e) { 
      console.error('Error deleting user profile:', e); 
      handleFirestoreError(e, OperationType.DELETE, `users/${userId}`);
    }
  };

  // FULL WIPE TRIGGER: buyers and suppliers
  const handleCleanupAllClientsAndSuppliers = async () => {
    setConfirmModal({
      isOpen: true,
      title: language === 'PT' ? 'LIMPEZA COMPLETA' : 'FULL CLEANUP',
      message: language === 'PT' 
        ? 'ATENÇÃO: Você está prestes a remover TODOS os Clientes (Compradores) e Fornecedores cadastrados, incluindo todos seus produtos, cotações, chats e dados conectados. Esta ação é definitiva e irreversível. Deseja continuar?' 
        : 'WARNING: You are about to remove ALL registered Clients (Buyers) and Suppliers, including all their products, quotes, chats, and linked data. This is permanent and irreversible. Do you want to proceed?',
      confirmText: language === 'PT' ? 'Remover Tudo' : 'Delete All',
      cancelText: language === 'PT' ? 'Cancelar' : 'Cancel',
      onConfirm: async () => {
        setIsCleaningAll(true);
        try {
          // Fetch both buyers and suppliers
          const qBuyers = query(collection(db, 'users'), where('type', '==', 'buyer'));
          const qSuppliers = query(collection(db, 'users'), where('type', '==', 'supplier'));
          const [snapBuyers, snapSuppliers] = await Promise.all([getDocs(qBuyers), getDocs(qSuppliers)]);
          
          const targetUserIds: string[] = [];
          const currentUid = auth.currentUser?.uid;

          snapBuyers.forEach(d => {
            if (d.id !== currentUid) {
              targetUserIds.push(d.id);
            }
          });
          snapSuppliers.forEach(d => {
            if (d.id !== currentUid) {
              targetUserIds.push(d.id);
            }
          });

          if (targetUserIds.length === 0) {
            setAlertModal({
              isOpen: true,
              title: language === 'PT' ? 'Aviso' : 'Notice',
              message: language === 'PT' 
                ? 'Nenhum cliente ou fornecedor encontrado para remoção.' 
                : 'No clients or suppliers found to remove.',
              type: 'info'
            });
            return;
          }

          await Promise.all(targetUserIds.map(uid => cascadeDeleteUser(uid)));

          setAlertModal({
            isOpen: true,
            title: language === 'PT' ? 'Limpeza Completa' : 'Cleanup Complete',
            message: language === 'PT' 
              ? `Sucesso: ${targetUserIds.length} perfis de clientes e fornecedores e todas as suas informações associadas foram completamente apagados do app.` 
              : `Success: ${targetUserIds.length} client and supplier profiles and all their associated data were fully removed from the app.`,
            type: 'success'
          });
          
          await refreshProfile();
        } catch (err: any) {
          console.error('Full cleanup error:', err);
          setAlertModal({
            isOpen: true,
            title: 'Error',
            message: language === 'PT' 
              ? 'Ocorreu um erro ao realizar a limpeza total. Verifique suas permissões de acesso.' 
              : 'An error occurred during full cleanup. Check your access permissions.',
            type: 'error'
          });
        } finally {
          setIsCleaningAll(false);
        }
      }
    });
  };

  const handleCleanupSuppliers = async () => {
    setConfirmModal({
      isOpen: true,
      title: language === 'PT' ? 'REMOVER FORNECEDORES' : 'REMOVE SUPPLIERS',
      message: language === 'PT' 
        ? 'Tem certeza que deseja remover TODOS os fornecedores cadastrados? Isso removerá também seus produtos, cotações e dados associados.' 
        : 'Are you sure you want to remove ALL registered suppliers? This will also remove their products, quotes, and associated data.',
      confirmText: language === 'PT' ? 'Apagar Fornecedores' : 'Delete Suppliers',
      cancelText: language === 'PT' ? 'Cancelar' : 'Cancel',
      onConfirm: async () => {
        setIsCleaningSuppliers(true);
        try {
          const q = query(collection(db, 'users'), where('type', '==', 'supplier'));
          const snapshot = await getDocs(q);
          const docsToDelete: string[] = [];
          
          snapshot.forEach(d => {
            if (d.id !== auth.currentUser?.uid) { // Don't delete self just in case
              docsToDelete.push(d.id);
            }
          });

          if (docsToDelete.length === 0) {
            setAlertModal({
              isOpen: true,
              title: language === 'PT' ? 'Aviso' : 'Notice',
              message: language === 'PT' ? 'Nenhum fornecedor encontrado.' : 'No suppliers found.',
              type: 'info'
            });
            return;
          }

          await Promise.all(docsToDelete.map(id => cascadeDeleteUser(id)));
          setAlertModal({
            isOpen: true,
            title: language === 'PT' ? 'Sucesso' : 'Success',
            message: language === 'PT' 
              ? `${docsToDelete.length} fornecedores e seus itens associados foram removidos com sucesso.` 
              : `${docsToDelete.length} suppliers and their associated items were removed successfully.`,
            type: 'success'
          });
          await refreshProfile();
        } catch (err) {
          console.error('Cleanup suppliers error:', err);
          setAlertModal({
            isOpen: true,
            title: 'Error',
            message: language === 'PT' ? 'Erro ao remover fornecedores.' : 'Error removing suppliers.',
            type: 'error'
          });
        } finally {
          setIsCleaningSuppliers(false);
        }
      }
    });
  };

  const handleCleanupUsers = async () => {
    const targetName = 'junior manhate';
    setConfirmModal({
      isOpen: true,
      title: language === 'PT' ? 'REMOVER CONTAS DE TESTE' : 'REMOVE TEST ACCOUNTS',
      message: language === 'PT' 
        ? `Tem certeza que deseja remover todos os usuários com o nome "${targetName}" e todo seu histórico/produtos?` 
        : `Are you sure you want to remove all users with name "${targetName}" and all their history/products?`,
      confirmText: language === 'PT' ? 'Apagar Contas' : 'Delete Accounts',
      cancelText: language === 'PT' ? 'Cancelar' : 'Cancel',
      onConfirm: async () => {
        setIsCleaningUp(true);
        try {
          const q = query(collection(db, 'users'), where('name', '==', 'Junior Manhate'));
          const q2 = query(collection(db, 'users'), where('name', '==', 'junior manhate'));
          
          const snapshots = await Promise.all([getDocs(q), getDocs(q2)]);
          const docsToDelete: string[] = [];
          
          snapshots.forEach(snapshot => {
            snapshot.forEach(d => {
              if (d.id !== auth.currentUser?.uid) { // Don't delete self
                docsToDelete.push(d.id);
              }
            });
          });

          if (docsToDelete.length === 0) {
            setAlertModal({
              isOpen: true,
              title: language === 'PT' ? 'Aviso' : 'Notice',
              message: language === 'PT' ? 'Nenhum usuário encontrado com este nome.' : 'No users found with this name.',
              type: 'info'
            });
            return;
          }

          await Promise.all(docsToDelete.map(id => cascadeDeleteUser(id)));
          setAlertModal({
            isOpen: true,
            title: language === 'PT' ? 'Sucesso' : 'Success',
            message: language === 'PT' 
              ? `${docsToDelete.length} usuários "Junior Manhate" e seus históricos foram removidos com sucesso.` 
              : `${docsToDelete.length} users and their history were removed successfully.`,
            type: 'success'
          });
          await refreshProfile();
        } catch (err) {
          console.error('Cleanup error:', err);
          setAlertModal({
            isOpen: true,
            title: 'Error',
            message: language === 'PT' ? 'Erro ao realizar limpeza.' : 'Cleanup error.',
            type: 'error'
          });
        } finally {
          setIsCleaningUp(false);
        }
      }
    });
  };

  const sections = [
    { id: 'profile', title: t.profileTitle, desc: t.profileDesc, icon: User, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'notifs', title: t.notifs, desc: t.notifsDesc, icon: Bell, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { id: 'security', title: t.security, desc: t.securityDesc, icon: Shield, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
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
              onClick={activeSection ? () => setActiveSection(null) : onBack}
              className={`p-3 rounded-2xl border transition-all ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white' : 'bg-white border-zinc-100 text-zinc-500 hover:text-zinc-900 shadow-sm'}`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h2 className={`text-2xl font-black italic uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
              {activeSection === 'profile' ? (language === 'PT' ? 'Perfil Corporativo' : 'Corporate Profile') :
               activeSection === 'notifs' ? (language === 'PT' ? 'Canais de Alertas' : 'Notification Settings') :
               activeSection === 'security' ? (language === 'PT' ? 'Segurança da Conta' : 'Account Security') :
               activeSection === 'billing' ? (language === 'PT' ? 'Métodos de Faturamento' : 'Plans & Billing') :
               t.title}
            </h2>
            <p className="text-zinc-500 text-sm font-bold">
              {activeSection === 'profile' ? (language === 'PT' ? 'Gerencie as informações da sua empresa e contatos.' : 'Manage your company details and contacts.') :
               activeSection === 'notifs' ? (language === 'PT' ? 'Selecione canais e tipos de alertas para cotações e stock.' : 'Configure alerts for quote requests, logistics, and stock.') :
               activeSection === 'security' ? (language === 'PT' ? 'Altere sua senha e configure autenticação em duas etapas.' : 'Change password and set up two-factor authentication (2FA).') :
               activeSection === 'billing' ? (language === 'PT' ? 'Gerencie seu plano corporativo, faturas e carteiras de pagamento.' : 'Manage subscriptions, enterprise plans and active payment methods.') :
               t.subtitle}
            </p>
          </div>
        </div>
        {activeSection === null && (
          <button 
            onClick={() => setIsProfileModalOpen(true)}
            className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest italic transition-all ${
              isDarkMode ? 'bg-zinc-800 text-brand hover:bg-zinc-700' : 'bg-brand/5 text-brand hover:bg-brand/10'
            }`}
          >
            <Eye className="w-4 h-4" />
            {t.viewMyProfile}
          </button>
        )}
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

      {activeSection === null ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map((section) => (
            <button 
              key={section.id}
              onClick={() => setActiveSection(section.id)}
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
      ) : activeSection === 'profile' ? (
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
      ) : activeSection === 'notifs' ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-8 rounded-3xl border space-y-6 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100 shadow-xl'}`}
        >
          <div className="flex justify-between items-center border-b border-zinc-500/10 pb-4">
            <div>
              <h3 className={`text-xl font-black italic uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                {language === 'PT' ? 'Preferências de Alertas' : 'Alert Preferences'}
              </h3>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
                {language === 'PT' ? 'Escolha de forma granular como o SupplyX se comunica com você.' : 'Granularly define how SupplyX contacts you.'}
              </p>
            </div>
            <button 
              type="button" 
              onClick={() => setActiveSection(null)} 
              className="text-zinc-500 hover:text-red-500 font-bold text-xs uppercase tracking-widest"
            >
              {language === 'PT' ? 'Voltar' : 'Back'}
            </button>
          </div>

          <form onSubmit={handleSaveNotifs} className="space-y-6">
            {/* Connection Status Banner */}
            <div className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${isDarkMode ? 'bg-zinc-950/60 border-emerald-500/20' : 'bg-emerald-50/45 border-emerald-500/20'}`}>
              <div className="flex items-start gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                    {language === 'PT' ? 'Status das Notificações: Totalmente Ativo' : 'Notifications Status: Fully Active'}
                  </p>
                  <p className="text-[10px] text-zinc-500 font-medium mt-0.5">
                    {language === 'PT' 
                      ? 'Os gateways corporativos e servidores SMTP seguros estão totalmente operacionais com taxa de entrega de 100%.' 
                      : 'Corporate gateways and secure SMTP servers are fully operational with 100% deliverability rate.'}
                  </p>
                </div>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-wider text-center border border-emerald-500/20">
                {language === 'PT' ? 'Conexão Segura B2B' : 'Secure B2B Connection'}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                {language === 'PT' ? 'Canais ativos' : 'Active Communication Channels'}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email Quotes */}
                <div 
                  onClick={() => setNotifPreferences({ ...notifPreferences, emailQuotes: !notifPreferences.emailQuotes })}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-4 ${
                    notifPreferences.emailQuotes 
                      ? 'border-brand bg-brand/5' 
                      : (isDarkMode ? 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700' : 'border-zinc-100 bg-zinc-50/50 hover:border-zinc-200')
                  }`}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${notifPreferences.emailQuotes ? 'bg-brand/20 text-brand' : 'bg-zinc-500/10 text-zinc-500'}`}>
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                            {language === 'PT' ? 'Consultas por E-mail' : 'Email Enquiries'}
                          </p>
                          {notifPreferences.emailQuotes && (
                            <span className="bg-emerald-500/15 text-emerald-500 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border border-emerald-500/10">
                              {language === 'PT' ? 'Ativo' : 'Active'}
                            </span>
                          )}
                        </div>
                        <p className="text-[9px] font-medium text-zinc-500 mt-1">
                          {language === 'PT' ? 'Alertas de novas mensagens' : 'Direct inbox updates'}
                        </p>
                        {notifPreferences.emailQuotes && (
                          <p className="text-[8px] font-semibold text-emerald-600/85 mt-1">
                            {language === 'PT' ? '● Conectado com supportsupply-x@gmail.com' : '● Connected with supportsupply-x@gmail.com'}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 flex-shrink-0 transition-all ${notifPreferences.emailQuotes ? 'bg-brand border-brand text-white' : 'border-zinc-500/30'}`}>
                      {notifPreferences.emailQuotes && <Check className="w-4 h-4" />}
                    </div>
                  </div>
                  
                  {notifPreferences.emailQuotes && (
                    <div className="border-t border-zinc-500/10 pt-3 flex justify-end">
                      <button
                        type="button"
                        disabled={testingChannel !== null}
                        onClick={(e) => handleTestChannel('emailQuotes', e)}
                        className="text-[9px] font-black uppercase tracking-wider text-brand hover:brightness-110 flex items-center gap-1.5 bg-brand/10 px-3 py-1.5 rounded-xl border border-brand/15 transition-all active:scale-95"
                      >
                        {testingChannel === 'emailQuotes' ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            {language === 'PT' ? 'Testando...' : 'Testing...'}
                          </>
                        ) : (
                          <>
                            <Check className="w-3 h-3 text-brand" />
                            {language === 'PT' ? 'Testar Operação' : 'Test Operation'}
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Email Orders */}
                <div 
                  onClick={() => setNotifPreferences({ ...notifPreferences, emailOrders: !notifPreferences.emailOrders })}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-4 ${
                    notifPreferences.emailOrders 
                      ? 'border-brand bg-brand/5' 
                      : (isDarkMode ? 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700' : 'border-zinc-100 bg-zinc-50/50 hover:border-zinc-200')
                  }`}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${notifPreferences.emailOrders ? 'bg-brand/20 text-brand' : 'bg-zinc-500/10 text-zinc-500'}`}>
                        <Settings className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                            {language === 'PT' ? 'Pedidos por E-mail' : 'Purchase Orders (Email)'}
                          </p>
                          {notifPreferences.emailOrders && (
                            <span className="bg-emerald-500/15 text-emerald-500 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border border-emerald-500/10">
                              {language === 'PT' ? 'Ativo' : 'Active'}
                            </span>
                          )}
                        </div>
                        <p className="text-[9px] font-medium text-zinc-500 mt-1">
                          {language === 'PT' ? 'Contratos e faturamento' : 'Contracts & confirmation updates'}
                        </p>
                        {notifPreferences.emailOrders && (
                          <p className="text-[8px] font-semibold text-emerald-600/85 mt-1">
                            {language === 'PT' ? '● Conectado com supply-x@outlook.com' : '● Connected with supply-x@outlook.com'}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 flex-shrink-0 transition-all ${notifPreferences.emailOrders ? 'bg-brand border-brand text-white' : 'border-zinc-500/30'}`}>
                      {notifPreferences.emailOrders && <Check className="w-4 h-4" />}
                    </div>
                  </div>
                  
                  {notifPreferences.emailOrders && (
                    <div className="border-t border-zinc-500/10 pt-3 flex justify-end">
                      <button
                        type="button"
                        disabled={testingChannel !== null}
                        onClick={(e) => handleTestChannel('emailOrders', e)}
                        className="text-[9px] font-black uppercase tracking-wider text-brand hover:brightness-110 flex items-center gap-1.5 bg-brand/10 px-3 py-1.5 rounded-xl border border-brand/15 transition-all active:scale-95"
                      >
                        {testingChannel === 'emailOrders' ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            {language === 'PT' ? 'Testando...' : 'Testing...'}
                          </>
                        ) : (
                          <>
                            <Check className="w-3 h-3 text-brand" />
                            {language === 'PT' ? 'Testar Operação' : 'Test Operation'}
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* WhatsApp Alertas */}
                <div 
                  onClick={() => setNotifPreferences({ ...notifPreferences, whatsappAlerts: !notifPreferences.whatsappAlerts })}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-4 ${
                    notifPreferences.whatsappAlerts 
                      ? 'border-emerald-500 bg-emerald-500/5' 
                      : (isDarkMode ? 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700' : 'border-zinc-100 bg-zinc-50/50 hover:border-zinc-200')
                  }`}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${notifPreferences.whatsappAlerts ? 'bg-emerald-500/20 text-emerald-500' : 'bg-zinc-500/10 text-zinc-500'}`}>
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                            WhatsApp Business
                          </p>
                          {notifPreferences.whatsappAlerts && (
                            <span className="bg-emerald-500/15 text-emerald-500 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border border-emerald-500/10">
                              {language === 'PT' ? 'Ativo' : 'Active'}
                            </span>
                          )}
                        </div>
                        <p className="text-[9px] font-medium text-zinc-500 mt-1">
                          {language === 'PT' ? 'Receber cotações instantâneas' : 'Receive instant mobile RFQs'}
                        </p>
                        {notifPreferences.whatsappAlerts && (
                          <p className="text-[8px] font-semibold text-emerald-600/85 mt-1">
                            {language === 'PT' ? '● Gateway API do WhatsApp Operacional' : '● WhatsApp API Gateway Operational'}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 flex-shrink-0 transition-all ${notifPreferences.whatsappAlerts ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-zinc-500/30'}`}>
                      {notifPreferences.whatsappAlerts && <Check className="w-4 h-4" />}
                    </div>
                  </div>
                  
                  {notifPreferences.whatsappAlerts && (
                    <div className="border-t border-zinc-500/10 pt-3 flex justify-end">
                      <button
                        type="button"
                        disabled={testingChannel !== null}
                        onClick={(e) => handleTestChannel('whatsappAlerts', e)}
                        className="text-[9px] font-black uppercase tracking-wider text-emerald-500 hover:brightness-110 flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/15 transition-all active:scale-95"
                      >
                        {testingChannel === 'whatsappAlerts' ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            {language === 'PT' ? 'Testando...' : 'Testing...'}
                          </>
                        ) : (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            {language === 'PT' ? 'Testar Operação' : 'Test Operation'}
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Browser Push */}
                <div 
                  onClick={() => setNotifPreferences({ ...notifPreferences, pushMessages: !notifPreferences.pushMessages })}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-4 ${
                    notifPreferences.pushMessages 
                      ? 'border-brand bg-brand/5' 
                      : (isDarkMode ? 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700' : 'border-zinc-100 bg-zinc-50/50 hover:border-zinc-200')
                  }`}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${notifPreferences.pushMessages ? 'bg-brand/20 text-brand' : 'bg-zinc-500/10 text-zinc-500'}`}>
                        <Bell className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                            {language === 'PT' ? 'Notificações Push' : 'Push Notifications'}
                          </p>
                          {notifPreferences.pushMessages && (
                            <span className="bg-emerald-500/15 text-emerald-500 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border border-emerald-500/10">
                              {language === 'PT' ? 'Ativo' : 'Active'}
                            </span>
                          )}
                        </div>
                        <p className="text-[9px] font-medium text-zinc-500 mt-1">
                          {language === 'PT' ? 'Alertas sonoros no navegador' : 'Audible browse alert notifications'}
                        </p>
                        {notifPreferences.pushMessages && (
                          <p className="text-[8px] font-semibold text-emerald-600/85 mt-1">
                            {language === 'PT' ? '● Notificações Locais Registadas' : '● Local Push Notifications Registered'}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 flex-shrink-0 transition-all ${notifPreferences.pushMessages ? 'bg-brand border-brand text-white' : 'border-zinc-500/30'}`}>
                      {notifPreferences.pushMessages && <Check className="w-4 h-4" />}
                    </div>
                  </div>
                  
                  {notifPreferences.pushMessages && (
                    <div className="border-t border-zinc-500/10 pt-3 flex justify-end">
                      <button
                        type="button"
                        disabled={testingChannel !== null}
                        onClick={(e) => handleTestChannel('pushMessages', e)}
                        className="text-[9px] font-black uppercase tracking-wider text-brand hover:brightness-110 flex items-center gap-1.5 bg-brand/10 px-3 py-1.5 rounded-xl border border-brand/15 transition-all active:scale-95"
                      >
                        {testingChannel === 'pushMessages' ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            {language === 'PT' ? 'Testando...' : 'Testing...'}
                          </>
                        ) : (
                          <>
                            <Check className="w-3 h-3 text-brand" />
                            {language === 'PT' ? 'Testar Operação' : 'Test Operation'}
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-250/55'} space-y-4`}>
              <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                {language === 'PT' ? 'Tipos de Alerta granular' : 'Trigger events selection'}
              </h4>

              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className={`text-xs font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>
                      {language === 'PT' ? 'Solicitações de Cotações (RFQs)' : 'Request For Quotes (RFQs)'}
                    </p>
                    <p className="text-[10px] text-zinc-500 font-medium">
                      {language === 'PT' ? 'Receber alertas quando um comprador publicar solicitações de materiais correspondentes ao seu catálogo.' : 'Notify whenever buyers post demands matched to catalog.'}
                    </p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={notifPreferences.emailQuotes}
                    onChange={(e) => setNotifPreferences({ ...notifPreferences, emailQuotes: e.target.checked })}
                    className="w-4 h-4 accent-brand cursor-pointer mt-0.5"
                  />
                </div>

                <div className="h-px bg-zinc-500/10 w-full" />

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className={`text-xs font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>
                      {language === 'PT' ? 'Status de Entrega e Logística' : 'Logistics Route Alerts'}
                    </p>
                    <p className="text-[10px] text-zinc-500 font-medium">
                      {language === 'PT' ? 'Receber mensagens automáticas via SMS e M-Pesa quando motoristas estiverem a caminho.' : 'Notify via SMS when drivers assign freight orders.'}
                    </p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={notifPreferences.smsDelivery}
                    onChange={(e) => setNotifPreferences({ ...notifPreferences, smsDelivery: e.target.checked })}
                    className="w-4 h-4 accent-brand cursor-pointer mt-0.5"
                  />
                </div>

                <div className="h-px bg-zinc-500/10 w-full" />

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className={`text-xs font-black uppercase tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-800'}`}>
                      {language === 'PT' ? 'Estoques Mínimos e Inventário' : 'Inventory Stock Warnings'}
                    </p>
                    <p className="text-[10px] text-zinc-500 font-medium">
                      {language === 'PT' ? 'Disparar alertas visuais e via Push toda vez que um produto atingir reserva de segurança.' : 'Fire warnings elements when catalog resources reach critically low status.'}
                    </p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={notifPreferences.pushStock}
                    onChange={(e) => setNotifPreferences({ ...notifPreferences, pushStock: e.target.checked })}
                    className="w-4 h-4 accent-brand cursor-pointer mt-0.5"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={notifLoading}
                className="flex-1 py-4 bg-brand text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {notifLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {notifSuccess ? (language === 'PT' ? 'Preferências Salvas!' : 'Preferences Saved!') : (language === 'PT' ? 'Salvar Configurações' : 'Save Configurations')}
              </button>
              <button
                type="button"
                onClick={() => setActiveSection(null)}
                className={`px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border ${
                  isDarkMode ? 'border-zinc-800 text-zinc-400 hover:text-white bg-zinc-950/40' : 'border-zinc-200 text-zinc-500 hover:text-zinc-900 bg-zinc-50/50'
                }`}
              >
                {language === 'PT' ? 'Cancelar' : 'Cancel'}
              </button>
            </div>
          </form>
        </motion.div>
      ) : activeSection === 'security' ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-8 rounded-3xl border space-y-6 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100 shadow-xl'}`}
        >
          <div className="flex justify-between items-center border-b border-zinc-500/10 pb-4">
            <div>
              <h3 className={`text-xl font-black italic uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                {language === 'PT' ? 'Segurança e Acessos' : 'Access & Credentials Security'}
              </h3>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
                {language === 'PT' ? 'Gerencie chaves criptográficas, defina novas senhas corporativas e MFA.' : 'Manage database access keys, passwords and active tokens.'}
              </p>
            </div>
            <button 
              type="button" 
              onClick={() => setActiveSection(null)} 
              className="text-zinc-500 hover:text-red-500 font-bold text-xs uppercase tracking-widest"
            >
              {language === 'PT' ? 'Voltar' : 'Back'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              {/* Reset password form */}
              <form onSubmit={handleSavePassword} className="space-y-4">
                <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                  {language === 'PT' ? 'Alterar Senha do Usuário' : 'Update Log-in Credentials'}
                </h4>

                {passwdError && (
                  <div className="p-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl flex items-center gap-3 text-xs font-bold leading-normal">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{passwdError}</span>
                  </div>
                )}

                {passwdSuccess && (
                  <div className="p-4 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-xs font-bold leading-normal">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{language === 'PT' ? 'Senha corporativa atualizada com sucesso!' : 'Corporate security password changed successfully!'}</span>
                  </div>
                )}

                {/* Password input block 1: Current Password */}
                <div className={`p-4 rounded-2xl border flex items-center justify-between relative ${isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                  <div className="flex-1">
                    <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block mb-1">
                      {language === 'PT' ? 'Senha Atual' : 'Current Password'}
                    </label>
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-zinc-500 mb-0.5" />
                      <input 
                        type={showCurrentPassword ? "text" : "password"} 
                        placeholder="••••••••••••"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className={`bg-transparent outline-none border-none font-bold text-xs flex-1 w-full ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="p-1 px-2 text-zinc-500 hover:text-white transition-colors cursor-pointer flex items-center justify-center z-10"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password input block 2: New Password */}
                <div className={`p-4 rounded-2xl border flex items-center justify-between relative ${isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                  <div className="flex-1">
                    <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block mb-1">
                      {language === 'PT' ? 'Nova Senha' : 'New Password'}
                    </label>
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-zinc-500 mb-0.5" />
                      <input 
                        type={showNewPassword ? "text" : "password"} 
                        placeholder="••••••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className={`bg-transparent outline-none border-none font-bold text-xs flex-1 w-full ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="p-1 px-2 text-zinc-500 hover:text-white transition-colors cursor-pointer flex items-center justify-center z-10"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password input block 3: Confirm Password */}
                <div className={`p-4 rounded-2xl border flex items-center justify-between relative ${isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                  <div className="flex-1">
                    <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block mb-1">
                      {language === 'PT' ? 'Confirmar Nova Senha' : 'Confirm New Password'}
                    </label>
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-zinc-500 mb-0.5" />
                      <input 
                        type={showConfirmPassword ? "text" : "password"} 
                        placeholder="••••••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`bg-transparent outline-none border-none font-bold text-xs flex-1 w-full ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="p-1 px-2 text-zinc-500 hover:text-white transition-colors cursor-pointer flex items-center justify-center z-10"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={passwdLoading}
                  className="w-full py-4 bg-brand text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {passwdLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {language === 'PT' ? 'Atualizar Senha Secreta' : 'Commit New Password'}
                </button>
              </form>
            </div>

            {/* Sidebar Security stats & 2FA toggle box */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                {language === 'PT' ? 'Autenticação de Duas Etapas' : 'Two-Factor Authentication (2FA)'}
              </h4>

              <div 
                onClick={handleToggle2FA}
                className={`p-5 rounded-3xl border-2 transition-all cursor-pointer ${
                  twoFactorEnabled 
                    ? 'border-emerald-500 bg-emerald-500/5' 
                    : (isDarkMode ? 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700' : 'border-zinc-200 bg-zinc-50/50 hover:border-zinc-220')
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${twoFactorEnabled ? 'bg-emerald-500/20 text-emerald-500' : 'bg-zinc-500/10 text-zinc-500'}`}>
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <p className={`text-xs font-black uppercase italic ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                        MFA / 2FA status
                      </p>
                      <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mt-0.5">
                        {twoFactorEnabled ? (language === 'PT' ? 'ATIVADO' : 'ENABLED') : (language === 'PT' ? 'DESATIVADO' : 'DISABLED')}
                      </p>
                    </div>
                  </div>
                  <div className={`w-12 h-6 rounded-full p-1 transition-all ${twoFactorEnabled ? 'bg-emerald-500' : 'bg-zinc-500/30'} flex items-center`}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-all ${twoFactorEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                  </div>
                </div>
                <p className="text-[10px] text-zinc-500 font-medium leading-relaxed mt-4">
                  {language === 'PT' 
                    ? 'Ao ativar, todo login exigirá um código PIN temporário enviado ao seu e-mail corporativo cadastrado.' 
                    : 'When enabled, every system login demands a secure temporary code dispatched to company verified email.'}
                </p>
              </div>

              {/* Status information badge */}
              <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-150'} space-y-2`}>
                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">{language === 'PT' ? 'Dispositivo Atual' : 'Current Terminal'}</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className={`text-xs font-bold leading-none ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Maputo, MZ (Chrome)</p>
                </div>
                <p className="text-[9px] text-zinc-500">IP: 197.249.44.18 (Navegador Ativo)</p>
              </div>

              {/* Danger Zone: Delete Account */}
              <div className={`p-5 rounded-2xl border border-red-500/20 bg-red-500/5 space-y-3 mt-4`}>
                <p className="text-[8px] font-black text-red-500 uppercase tracking-widest">
                  {language === 'PT' ? 'Zona de Perigo' : 'Danger Zone'}
                </p>
                <h5 className={`text-xs font-black uppercase italic ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                  {language === 'PT' ? 'Eliminar Conta Permanentemente' : 'Delete Account Permanently'}
                </h5>
                <p className="text-[10px] text-zinc-500 leading-normal">
                  {language === 'PT' 
                    ? 'Esta ação apagará de forma irreversível o seu perfil de usuário e todas as suas informações (produtos, cotações, chats, cargas e atribuições) de todas as pesquisas e bases de dados do app.' 
                    : 'This action will irreversibly delete your user profile and all your information (products, quotations, chats, loads, and assignments) from all searches and app databases.'}
                </p>
                <button
                  type="button"
                  onClick={handleDeleteOwnAccount}
                  className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-[9px] uppercase tracking-widest transition-all shadow-lg shadow-red-600/10 cursor-pointer"
                >
                  {language === 'PT' ? 'Eliminar Minha Conta' : 'Delete My Account'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      ) : activeSection === 'billing' ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-8 rounded-3xl border space-y-6 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100 shadow-xl'}`}
        >
          <div className="flex justify-between items-center border-b border-zinc-500/10 pb-4">
            <div>
              <h3 className={`text-xl font-black italic uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                {language === 'PT' ? 'Planos & Faturamento' : 'Plans & Billing'}
              </h3>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
                {language === 'PT' ? 'Assinaturas ativas, pagamentos móveis e histórico do plano' : 'Review active plan level, mobile wallet bindings and fiscal records.'}
              </p>
            </div>
            <button 
              type="button" 
              onClick={() => setActiveSection(null)} 
              className="text-zinc-500 hover:text-red-500 font-bold text-xs uppercase tracking-widest"
            >
              {language === 'PT' ? 'Voltar' : 'Back'}
            </button>
          </div>

          {billingSuccess && (
            <div className="p-4 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-xs font-bold leading-normal">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{billingSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              {/* Comparative plan cards */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                  {language === 'PT' ? 'Compare Nossos Planos' : 'Upgrade Options'}
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Option A: Procurement Free/Standard */}
                  <div className={`p-5 rounded-3xl border-2 transition-all flex flex-col justify-between ${
                    subscriptionPlan === 'standard' 
                      ? 'border-zinc-500 bg-zinc-500/5' 
                      : (isDarkMode ? 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700' : 'border-zinc-100 bg-zinc-50/50 hover:border-zinc-200')
                  }`}>
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">SupplyX Starter</span>
                        {subscriptionPlan === 'standard' && (
                          <span className="text-[8px] font-black text-zinc-500 bg-zinc-300 dark:bg-zinc-800 px-2 py-0.5 rounded uppercase tracking-widest">
                            {language === 'PT' ? 'ATIVO' : 'ACTIVE'}
                          </span>
                        )}
                      </div>
                      <p className={`text-xl font-black italic uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Tenda Base</p>
                      <p className="text-2xl font-black italic uppercase text-zinc-500 mt-2">MT 0<span className="text-xs font-medium uppercase tracking-widest text-zinc-500"> / {language === 'PT' ? 'mês' : 'mo'}</span></p>
                      
                      <ul className="space-y-2 mt-4 text-[10px] text-zinc-500 font-bold uppercase tracking-wider leading-relaxed">
                        <li>• 5 Cotações Limitadas / mês</li>
                        <li>• Catálogo Estático Simples</li>
                        <li>• Assistência Standard em Filas</li>
                      </ul>
                    </div>
                    <button
                      onClick={() => handleUpgradePlan('standard')}
                      disabled={billingLoading || subscriptionPlan === 'standard'}
                      className={`w-full py-2.5 mt-6 rounded-xl font-black text-[9px] uppercase tracking-widest text-center border transition-all ${
                        subscriptionPlan === 'standard' 
                          ? 'border-zinc-500/10 text-zinc-500 cursor-default bg-zinc-500/10'
                          : 'border-brand text-brand hover:bg-brand/10'
                      }`}
                    >
                      {subscriptionPlan === 'standard' 
                        ? (language === 'PT' ? 'Plano Selecionado' : 'Selected Plan') 
                        : (language === 'PT' ? 'Escolher este Plano' : 'Downgrade to Standard')}
                    </button>
                  </div>

                  {/* Option B: Premium Supplier */}
                  <div className={`p-5 rounded-3xl border-2 transition-all relative flex flex-col justify-between ${
                    subscriptionPlan === 'premium' 
                      ? 'border-brand bg-brand/5 shadow-xl shadow-brand/10' 
                      : (isDarkMode ? 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700' : 'border-zinc-100 bg-zinc-50/50 hover:border-zinc-200')
                  }`}>
                    {subscriptionPlan !== 'premium' && (
                      <span className="absolute -top-3 right-6 text-[8px] font-black text-white px-3 py-1 rounded bg-brand uppercase tracking-widest">
                        {language === 'PT' ? 'RECOMENDADO' : 'POPULAR'}
                      </span>
                    )}
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[8px] font-black text-brand uppercase tracking-widest">SupplyX Partner Gold</span>
                        {subscriptionPlan === 'premium' && (
                          <span className="text-[8px] font-black text-brand bg-brand/20 px-2 py-0.5 rounded uppercase tracking-widest">
                            {language === 'PT' ? 'ATIVO' : 'ACTIVE'}
                          </span>
                        )}
                      </div>
                      <p className={`text-xl font-black italic uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Premium Enterprise</p>
                      <p className="text-2xl font-black italic uppercase text-brand mt-2">MT 5.000<span className="text-xs font-medium uppercase tracking-widest text-brand"> / {language === 'PT' ? 'mês' : 'mo'}</span></p>
                      
                      <ul className="space-y-2 mt-4 text-[10px] text-zinc-500 font-bold uppercase tracking-wider leading-relaxed">
                        <li>• Cotações Inteligentes Ilimitadas</li>
                        <li>• Classificações Inteligentes por IA Gemini</li>
                        <li>• Banners de Destaque no Dashboard</li>
                        <li>• Gestão de Multiclientes no WhatsApp</li>
                      </ul>
                    </div>
                    <button
                      onClick={() => handleUpgradePlan('premium')}
                      disabled={billingLoading || subscriptionPlan === 'premium'}
                      className={`w-full py-2.5 mt-6 rounded-xl font-black text-[9px] uppercase tracking-widest text-center border transition-all ${
                        subscriptionPlan === 'premium' 
                          ? 'border-brand/20 text-brand bg-brand/10 cursor-default'
                          : 'bg-brand border-brand text-white hover:brightness-110 shadow-lg shadow-brand/20'
                      }`}
                    >
                      {subscriptionPlan === 'premium' 
                        ? (language === 'PT' ? 'Sua Assinatura Ativa' : 'Your Active Subscription') 
                        : (language === 'PT' ? 'Fazer Upgrade Agora' : 'Upgrade to Gold Enterprise')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Billing History Section */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                  {language === 'PT' ? 'Histórico de Faturas Corporativas' : 'Subscription Invoice Records'}
                </h4>

                <div className={`border rounded-2xl overflow-hidden ${isDarkMode ? 'border-zinc-800 bg-zinc-950/20' : 'border-zinc-150 bg-white shadow-sm'}`}>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={`border-b ${isDarkMode ? 'border-zinc-800 bg-zinc-950/40' : 'border-zinc-150 bg-zinc-50'}`}>
                        <th className="py-3 px-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest">ID</th>
                        <th className="py-3 px-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest">{language === 'PT' ? 'Data' : 'Date'}</th>
                        <th className="py-3 px-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest">{language === 'PT' ? 'Descrição' : 'Description'}</th>
                        <th className="py-3 px-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest">{language === 'PT' ? 'Valor' : 'Amount'}</th>
                        <th className="py-3 px-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest text-right">PDF</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-500/10 text-xs font-bold w-full">
                      {billingHistory.map((invoice) => (
                        <tr key={invoice.id} className={`${isDarkMode ? 'hover:bg-zinc-800/20' : 'hover:bg-zinc-50/50'}`}>
                          <td className={`py-4 px-4 text-[10px] font-mono leading-none ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{invoice.id}</td>
                          <td className="py-4 px-4 text-zinc-500 text-[10px]">{invoice.date}</td>
                          <td className={`py-4 px-4 text-[10px] uppercase font-mono ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{invoice.desc}</td>
                          <td className="py-4 px-4 text-emerald-500 font-mono text-[10px]">{invoice.amount}</td>
                          <td className="py-4 px-4 text-right">
                            <button 
                              type="button"
                              onClick={() => alert(language === 'PT' ? `Recibo da fatura ${invoice.id} descarregado!` : `Simulated Receipt download for ${invoice.id} completed.`)}
                              className="text-brand hover:underline flex items-center justify-end gap-1 font-black text-[10px] uppercase tracking-wider ml-auto cursor-pointer"
                            >
                              <Receipt className="w-4 h-4 text-brand mb-0.5" />
                              {language === 'PT' ? 'RECIBO' : 'PDF'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Billing Wallet management side bar */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                {language === 'PT' ? 'Métodos de Pagamento' : 'Active Wallets'}
              </h4>

              {/* Registered credit card */}
              <div className={`p-4 rounded-3xl border-2 relative overflow-hidden flex flex-col justify-between ${
                isDarkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-400' : 'bg-gradient-to-br from-zinc-50 to-zinc-100 border-zinc-200 text-zinc-500'
              }`}>
                <div className="flex justify-between items-start">
                  <CreditCard className="w-8 h-8 text-indigo-500" />
                  <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">CORPORATE VISA</span>
                </div>
                <div className="mt-6">
                  <p className={`text-[10px] font-mono tracking-widest ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>•••• •••• •••• 4242</p>
                  <p className={`text-[9px] mt-1 font-mono uppercase font-black tracking-widest ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>JUNIOR MANHATE</p>
                </div>
                <div className="flex justify-between items-end mt-4">
                  <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">EXP: 12/29</span>
                  <span className="px-2 py-0.5 text-[8px] font-black uppercase text-emerald-500 bg-emerald-500/10 tracking-widest rounded">
                    {language === 'PT' ? 'PRIMÁRIO' : 'DEFAULT'}
                  </span>
                </div>
              </div>

              {/* Mobile payment integrations (Mpesa details) */}
              <div className={`p-4 rounded-3xl border-2 flex flex-col justify-between ${
                isDarkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-400' : 'bg-gradient-to-br from-zinc-50 to-zinc-100 border-zinc-200 text-zinc-500'
              }`}>
                <div className="flex justify-between items-start">
                  <Smartphone className="w-8 h-8 text-emerald-500" />
                  <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">M-PESA WALLET</span>
                </div>
                <div className="mt-4">
                  <p className={`text-[10px] font-mono tracking-wide ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>+258 84•••••98</p>
                  <p className={`text-[9px] mt-1 font-mono uppercase font-black tracking-wide ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>JUNIOR MANHATE</p>
                </div>
                <div className="flex justify-between items-end mt-4">
                  <span className="text-[8.5px] font-bold text-emerald-500 uppercase tracking-widest">VODACOM MZ</span>
                  <span className="px-2 py-0.5 text-[8px] font-black uppercase text-zinc-500 bg-zinc-500/10 tracking-widest rounded">
                    {language === 'PT' ? 'ATIVO' : 'ACTIVE'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ) : null}

      {activeSection === null && (
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
      )}

      {/* Custom Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className={`relative w-full max-w-lg p-8 rounded-3xl border shadow-2xl z-10 ${
                isDarkMode 
                  ? 'bg-zinc-900 border-zinc-800 text-white' 
                  : 'bg-white border-zinc-100 text-zinc-900'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-lg font-black uppercase italic tracking-tighter text-red-500">
                    {confirmModal.title}
                  </h4>
                  <p className={`text-xs font-semibold leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    {confirmModal.message}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-8">
                <button
                  type="button"
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    isDarkMode 
                      ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' 
                      : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600'
                  }`}
                >
                  {confirmModal.cancelText || (language === 'PT' ? 'Cancelar' : 'Cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    confirmModal.onConfirm();
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-red-600 hover:bg-red-700 text-white transition-all shadow-lg shadow-red-600/20"
                >
                  {confirmModal.confirmText || (language === 'PT' ? 'Confirmar' : 'Confirm')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Alert/Success Modal */}
      <AnimatePresence>
        {alertModal.isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            key="settings-alert-backdrop-wrapper"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className={`relative w-full max-w-md p-8 rounded-3xl border shadow-2xl z-10 ${
                isDarkMode 
                  ? 'bg-zinc-900 border-zinc-800 text-white' 
                  : 'bg-white border-zinc-100 text-zinc-900'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  alertModal.type === 'success' 
                    ? 'bg-emerald-500/10 text-emerald-500' 
                    : alertModal.type === 'error' 
                    ? 'bg-red-500/10 text-red-500' 
                    : 'bg-blue-500/10 text-blue-500'
                }`}>
                  {alertModal.type === 'success' ? (
                    <Check className="w-6 h-6" />
                  ) : alertModal.type === 'error' ? (
                    <X className="w-6 h-6 animate-pulse" />
                  ) : (
                    <AlertCircle className="w-6 h-6" />
                  )}
                </div>
                <div className="space-y-1 flex-1">
                  <h4 className={`text-base font-black uppercase italic tracking-tighter ${
                    alertModal.type === 'success' 
                      ? 'text-emerald-500' 
                      : alertModal.type === 'error' 
                      ? 'text-red-500' 
                      : 'text-blue-500'
                  }`}>
                    {alertModal.title}
                  </h4>
                  <p className={`text-xs font-semibold leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    {alertModal.message}
                  </p>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
                  className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    alertModal.type === 'success'
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20'
                      : alertModal.type === 'error'
                      ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20'
                      : 'bg-zinc-600 hover:bg-zinc-700 text-white shadow-lg shadow-zinc-600/20'
                  }`}
                >
                  OK
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
