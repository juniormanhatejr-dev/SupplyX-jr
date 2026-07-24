import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, Plus, Moon, Sun, Globe, Loader2, ShoppingCart, User, MessageSquare, CheckCircle2, AlertCircle } from 'lucide-react';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import ProductsView from './components/ProductsView';
import SuppliersView from './components/SuppliersView';
import OrdersView from './components/OrdersView';
import SupplierDashboard from './components/SupplierDashboard';
import LogisticsView from './components/LogisticsView';
import NotificationCenter from './components/NotificationCenter';
import NotificationsView from './components/NotificationsView';
import ReportsView from './components/ReportsView';
import SettingsView from './components/SettingsView';
import RegistrationView from './components/Auth/RegistrationView';
import AdminVerificationPanel from './components/AdminVerificationPanel';
import LandingPageView from './components/LandingPageView';
import EmailVerificationScreen from './components/Auth/EmailVerificationScreen';
import ChatView from './components/ChatView';
import CartModal from './components/CartModal';
import ProfileModal from './components/ProfileModal';
import SupplyXLogo from './components/SupplyXLogo';
import DiagnosticOverlay from './components/DiagnosticOverlay';
import AboutView from './components/AboutView';
import OfflineView from './components/OfflineView';
import MarketHealthView from './components/MarketHealthView';
import { OptimizedImage } from './components/ui/OptimizedImage';
import { useAuth, isProfileComplete } from './contexts/AuthContext';
import { useCart } from './contexts/CartContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { auth, db } from './lib/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { presenceService } from './services/presenceService';

import { useNotifications } from './contexts/NotificationContext';

export default function App() {
  const isOnline = useOnlineStatus();
  const [dismissedOfflineScreen, setDismissedOfflineScreen] = useState(false);

  useEffect(() => {
    if (isOnline) {
      setDismissedOfflineScreen(false);
    }
  }, [isOnline]);

  const { user, profile, loading, refreshProfile } = useAuth();
  const hasIncompleteProfile = Boolean(user && (!profile || !isProfileComplete(profile)));
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('supplyx_theme');
    return saved !== null ? saved === 'dark' : true; // Default to Dark Mode for premium feel
  });
  const [language, setLanguage] = useState<'PT' | 'EN'>(() => {
    const saved = localStorage.getItem('supplyx_language');
    return (saved === 'PT' || saved === 'EN') ? saved : 'PT';
  });

  const [verificationState, setVerificationState] = useState<{
    status: 'idle' | 'verifying' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });

  // Custom Email Verification Token handler
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('verifyToken');
    
    if (token) {
      const verifyEmailToken = async () => {
        setVerificationState({
          status: 'verifying',
          message: language === 'PT' ? 'A verificar o seu e-mail...' : 'Verifying your email...'
        });
        
        try {
          const response = await fetch('/api/auth/verify-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token })
          });
          
          const data = await response.json();
          if (response.ok && data.success) {
            setVerificationState({
              status: 'success',
              message: language === 'PT' 
                ? 'E-mail verificado com sucesso! Carregando a sua conta...' 
                : 'Email verified successfully! Loading your account...'
            });
            // Refresh user and profile to reflect changes
            await refreshProfile();
          } else {
            setVerificationState({
              status: 'error',
              message: data.error || (language === 'PT' 
                ? 'O link de verificação é inválido ou expirou.' 
                : 'The verification link is invalid or has expired.')
            });
          }
        } catch (err: any) {
          console.error('Error verifying token:', err);
          setVerificationState({
            status: 'error',
            message: language === 'PT' 
              ? 'Erro de rede ao verificar o e-mail.' 
              : 'Network error while verifying email.'
          });
        } finally {
          // Remove verifyToken parameter from address bar
          const newUrl = window.location.pathname + window.location.hash;
          window.history.replaceState({}, document.title, newUrl);
        }
      };
      
      verifyEmailToken();
    }
  }, [language, refreshProfile]);


  
  const { unreadMessages, unreadNotifications } = useNotifications();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [showQuoteFormDirectly, setShowQuoteFormDirectly] = useState(false);

  useEffect(() => {
    localStorage.setItem('supplyx_theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    window.dispatchEvent(new Event('theme-changed'));
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('supplyx_language', language);
    window.dispatchEvent(new Event('language-changed'));
  }, [language]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'supplyx_language' && (e.newValue === 'PT' || e.newValue === 'EN')) {
        setLanguage(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  const [selectedCategory, setSelectedCategory] = useState('Tudo');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [selectedSupplierForCatalog, setSelectedSupplierForCatalog] = useState<string | null>(null);
  const [shouldEditProfile, setShouldEditProfile] = useState(false);
  const [view, setView] = useState<'landing' | 'auth'>('landing');
  const { items } = useCart();

  const [initialRecipientId, setInitialRecipientId] = useState<string | null>(null);
  const [initialChatId, setInitialChatId] = useState<string | null>(null);
  const [prevTab, setPrevTab] = useState<string | null>(null);
  const [persistentSearchQuery, setPersistentSearchQuery] = useState('');
  const [logisticsPayload, setLogisticsPayload] = useState<any>(null);
  const [logisticsSubTab, setLogisticsSubTab] = useState<string>('dashboard');

  const handleNavigateWithPayload = (tab: string, payload?: any) => {
    if (tab === 'Mensagens') {
      if (payload?.userId) {
        setInitialRecipientId(payload.userId);
        setInitialChatId(null);
      } else if (payload?.chatId) {
        setInitialChatId(payload.chatId);
        setInitialRecipientId(null);
      }
    }
    if (tab === 'Pedidos / Cotações' && payload?.showForm) {
      setShowQuoteFormDirectly(true);
    }
    if (tab === 'Ajustes' && payload?.edit) {
      setShouldEditProfile(true);
    }
    if (tab === 'Produtos / Materiais' && payload?.searchQuery) {
      setPersistentSearchQuery(payload.searchQuery);
    }
    if (tab === 'Logística') {
      setLogisticsPayload(payload);
      if (payload?.subTab) {
        setLogisticsSubTab(payload.subTab);
      }
    }
    
    if (tab !== activeTab) {
      setPrevTab(activeTab);
    }
    setActiveTab(tab);
  };

  useEffect(() => {
    const handleNavigate = (e: any) => {
      if (e.detail?.userId) {
        setInitialRecipientId(e.detail.userId);
        setInitialChatId(null);
      } else if (e.detail?.chatId) {
        setInitialChatId(e.detail.chatId);
        setInitialRecipientId(null);
      }
      setActiveTab('Mensagens');
    };
    
    const handleNavigateApp = (e: any) => {
      const { tab, payload } = e.detail || {};
      if (tab) {
        handleNavigateWithPayload(tab, payload);
      }
    };

    window.addEventListener('navigate-to-messages', handleNavigate);
    window.addEventListener('navigate-app', handleNavigateApp);
    return () => {
      window.removeEventListener('navigate-to-messages', handleNavigate);
      window.removeEventListener('navigate-app', handleNavigateApp);
    };
  }, []);

  // If supplier or logistics, default to their specific dashboards
  useEffect(() => {
    if (profile?.type === 'supplier' && activeTab === 'Dashboard') {
      setActiveTab('Seller Central');
    } else if (profile?.type === 'logistics' && activeTab === 'Dashboard') {
      setActiveTab('Logística');
    }

    if (activeTab !== 'Mensagens') {
      setInitialRecipientId(null);
    }
  }, [profile, activeTab]);

  useEffect(() => {
    if (activeTab !== 'Ajustes') {
      setShouldEditProfile(false);
    }
  }, [activeTab]);

  const handleNewRequest = () => {
    setShowQuoteFormDirectly(true);
    setActiveTab('Pedidos / Cotações');
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    setActiveTab('Produtos / Materiais');
  };

  const handleLogout = () => {
    auth.signOut();
    setView('landing');
  };

  const translations = {
    PT: {
      newOrder: 'Novo Pedido',
      search: 'Buscar materiais...',
      supplier: 'Fornecedor',
      buyer: 'Comprador',
      tabs: {
        'Dashboard': 'Painel',
        'Saúde do Mercado': 'Saúde do Mercado',
        'Produtos / Materiais': 'Produtos / Materiais',
        'Pedidos / Cotações': 'Pedidos / Cotações',
        'Fornecedores': 'Fornecedores',
        'Logística': 'Logística',
        'Seller Central': 'Central do Vendedor',
        'Notificações': 'Notificações',
        'Relatórios': 'Relatórios',
        'Mensagens': 'Mensagens',
        'Ajustes': 'Ajustes',
        'About': 'Sobre o SupplyX',
        'Meu Perfil': 'Meu Perfil',
        'Cockpit Analítico': 'Cockpit Analítico',
        'Monitor de Cargas': 'Monitor de Cargas',
        'Frotas & Motoristas': 'Frotas & Motoristas',
        'AdminVerifications': 'Painel Fiscal Admin'
      }
    },
    EN: {
      newOrder: 'New Order',
      search: 'Search materials...',
      supplier: 'Supplier',
      buyer: 'Buyer',
      tabs: {
        'Dashboard': 'Dashboard',
        'Saúde do Mercado': 'Market Health',
        'Produtos / Materiais': 'Products / Materials',
        'Pedidos / Cotações': 'Orders / Quotes',
        'Fornecedores': 'Suppliers',
        'Logística': 'Logistics',
        'Seller Central': 'Seller Central',
        'Notificações': 'Notifications',
        'Relatórios': 'Reports',
        'Mensagens': 'Messages',
        'Ajustes': 'Settings',
        'About': 'About SupplyX',
        'Meu Perfil': 'My Profile',
        'Cockpit Analítico': 'Control Dashboard',
        'Monitor de Cargas': 'Cargo Monitor',
        'Frotas & Motoristas': 'Fleets & Drivers',
        'AdminVerifications': 'Admin Tax Panel'
      }
    }
  };

  const t = translations[language];

  // Render custom verification state overlays if a token verification is in progress or completed
  if (verificationState.status === 'verifying') {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${isDarkMode ? 'bg-zinc-950 text-white' : 'bg-zinc-50 text-zinc-900'}`}>
        <Loader2 className="w-12 h-12 text-brand animate-spin mb-4" />
        <p className="text-sm font-semibold">{verificationState.message}</p>
      </div>
    );
  }

  if (verificationState.status === 'success') {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${isDarkMode ? 'bg-zinc-950 text-white' : 'bg-zinc-50 text-zinc-900'} p-6`}>
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`max-w-md w-full p-8 rounded-2xl ${isDarkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-zinc-200'} shadow-xl text-center`}
        >
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold mb-3">
            {language === 'PT' ? 'E-mail Confirmado!' : 'Email Confirmed!'}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
            {verificationState.message}
          </p>
          <button
            onClick={() => setVerificationState({ status: 'idle', message: '' })}
            className="w-full py-3 px-4 bg-brand text-white rounded-xl font-semibold hover:bg-brand/95 transition-colors cursor-pointer"
          >
            {language === 'PT' ? 'Continuar' : 'Continue'}
          </button>
        </motion.div>
      </div>
    );
  }

  if (verificationState.status === 'error') {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${isDarkMode ? 'bg-zinc-950 text-white' : 'bg-zinc-50 text-zinc-900'} p-6`}>
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`max-w-md w-full p-8 rounded-2xl ${isDarkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-zinc-200'} shadow-xl text-center`}
        >
          <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold mb-3">
            {language === 'PT' ? 'Falha na Verificação' : 'Verification Failed'}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
            {verificationState.message}
          </p>
          <button
            onClick={() => setVerificationState({ status: 'idle', message: '' })}
            className="w-full py-3 px-4 bg-zinc-500 text-white rounded-xl font-semibold hover:bg-zinc-600 transition-colors cursor-pointer"
          >
            {language === 'PT' ? 'Fechar' : 'Close'}
          </button>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-zinc-950' : 'bg-zinc-50'}`}>
        <Loader2 className="w-10 h-10 text-brand animate-spin" />
      </div>
    );
  }

  const isGoogleUser = user?.providerData?.some(p => p.providerId === 'google.com');
  const isEmailVerified = user ? (user.emailVerified || profile?.emailVerified || isGoogleUser) : false;

  if (user && !isEmailVerified) {
    return (
      <EmailVerificationScreen 
        isDarkMode={isDarkMode}
        language={language}
        onVerified={refreshProfile}
      />
    );
  }

  if (!user || (hasIncompleteProfile && !loading)) {
    if (view === 'landing') {
      return (
        <LandingPageView 
          isDarkMode={isDarkMode} 
          language={language}
          onLanguageChange={setLanguage}
          onGetStarted={() => setView('auth')}
          onLogin={() => setView('auth')}
        />
      );
    }
    return (
      <RegistrationView 
        isDarkMode={isDarkMode} 
        language={language} 
        onLanguageChange={setLanguage}
        onSuccess={refreshProfile}
        onBack={() => setView('landing')}
        forceOnboarding={hasIncompleteProfile}
      />
    );
  }

  const renderContent = () => {
    const commonProps = { isDarkMode, language, userType: profile?.type };
    const tabName = (activeTab === 'Seller Central' && profile?.type !== 'supplier') ? 'Dashboard' : activeTab;
    
    switch(tabName) {
      case 'Dashboard':
        return <DashboardView 
          onActivateIA={handleNewRequest} 
          onCategoryClick={handleCategoryClick}
          onNavigate={handleNavigateWithPayload}
          {...commonProps} 
        />;
      case 'Saúde do Mercado':
        return <MarketHealthView isDarkMode={isDarkMode} language={language} />;
      case 'Produtos / Materiais':
        return <ProductsView 
          onNavigate={handleNavigateWithPayload} 
          initialCategory={selectedCategory}
          initialSearchQuery={persistentSearchQuery}
          onClearSearch={() => setPersistentSearchQuery('')}
          supplierId={selectedSupplierForCatalog}
          onClearSupplierFilter={() => setSelectedSupplierForCatalog(null)}
          {...commonProps} 
        />;
      case 'Pedidos / Cotações':
        return <OrdersView 
          startWithForm={showQuoteFormDirectly} 
          onFormClose={() => setShowQuoteFormDirectly(false)} 
          onNavigate={handleNavigateWithPayload}
          {...commonProps}
        />;
      case 'Fornecedores':
        return <SuppliersView 
          onViewProfile={(uid) => {
            setSelectedProfileId(uid);
            setIsProfileModalOpen(true);
          }}
          onNavigate={handleNavigateWithPayload}
          {...commonProps} 
        />;
      case 'Logística':
        return (
          <LogisticsView 
            initialPayload={logisticsPayload} 
            activeSubTab={logisticsSubTab}
            setActiveSubTab={setLogisticsSubTab}
            onNavigate={handleNavigateWithPayload} 
            {...commonProps} 
          />
        );
      case 'Seller Central':
        return <SupplierDashboard onNavigate={handleNavigateWithPayload} {...commonProps} />;
      case 'Notificações':
        return <NotificationsView {...commonProps} />;
      case 'Relatórios':
        return <ReportsView {...commonProps} />;
      case 'Mensagens':
        return <ChatView 
          initialRecipientId={initialRecipientId}
          initialChatId={initialChatId}
          onNavigate={handleNavigateWithPayload}
          onBack={prevTab ? () => {
            setActiveTab(prevTab);
            setPrevTab(null);
          } : undefined}
          {...commonProps} 
        />;
      case 'Ajustes':
        return <SettingsView 
          initialIsEditing={shouldEditProfile}
          onBack={() => {
            setShouldEditProfile(false);
            setActiveTab(profile?.type === 'supplier' ? 'Seller Central' : 'Dashboard');
          }} 
          onNavigate={handleNavigateWithPayload}
          onThemeToggle={() => setIsDarkMode(!isDarkMode)}
          onLanguageChange={setLanguage}
          {...commonProps} 
        />;
      case 'About':
        return <AboutView onNavigate={handleNavigateWithPayload} {...commonProps} />;
      case 'AdminVerifications':
        return <AdminVerificationPanel {...commonProps} />;
      default:
        return <DashboardView onActivateIA={handleNewRequest} {...commonProps} />;
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 relative overflow-hidden ${isDarkMode ? 'dark bg-supplyx-deep' : 'bg-zinc-50'}`}>
        {/* Background Ambience */}
        <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-supplyx-blue/5 blur-[120px] rounded-full animate-pulse-slow" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-supplyx-blue/5 blur-[120px] rounded-full animate-pulse-slow transition-opacity" />
        </div>

        {/* Connection Mode Indicator */}
        {!isOnline && (
          <div className="fixed top-0 left-0 right-0 z-[100] h-10 bg-amber-500 flex items-center justify-center gap-2 text-white text-[10px] font-black uppercase tracking-[0.2em] animate-in slide-in-from-top duration-500">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            {language === 'PT' ? 'MODO OFFLINE • Dados Limitados' : 'OFFLINE MODE • Limited Data'}
          </div>
        )}

        {/* Offline Overlay Screen */}
        {!isOnline && !dismissedOfflineScreen && (
          <OfflineView language={language} onDismiss={() => setDismissedOfflineScreen(true)} />
        )}

        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
          activeItem={activeTab}
          onNavItemClick={(label) => {
            if (label === 'Meu Perfil') {
              setSelectedProfileId(auth.currentUser?.uid || null);
              setIsProfileModalOpen(true);
              return;
            }
            if (label === 'Cockpit Analítico') {
              setLogisticsSubTab('dashboard');
              setActiveTab('Logística');
              return;
            }
            if (label === 'Monitor de Cargas') {
              setLogisticsSubTab('requests_list');
              setActiveTab('Logística');
              return;
            }
            if (label === 'Frotas & Motoristas') {
              setLogisticsSubTab('drivers');
              setActiveTab('Logística');
              return;
            }
            if (label === 'Fulfillment Stock') {
              setLogisticsSubTab('inventory');
              setActiveTab('Logística');
              return;
            }
            if (label === 'Ajustes') {
              setShouldEditProfile(false);
            }
            if (label === 'Produtos / Materiais') {
              setSelectedCategory('Tudo');
              setSelectedSupplierForCatalog(null);
            }
            setActiveTab(label);
          }}
          isDarkMode={isDarkMode}
          language={language}
          onLanguageChange={setLanguage}
          onThemeToggle={() => setIsDarkMode(!isDarkMode)}
          userType={profile?.type}
          onLogout={handleLogout}
          logisticsSubTab={logisticsSubTab}
        />
        
        <main className="lg:ml-64 transition-all pb-12 pt-20 sm:pt-28 px-2 sm:px-6 relative z-10">
          <header className={`fixed top-2 left-2 right-2 sm:top-4 sm:left-4 sm:right-4 lg:left-[calc(16rem+1rem)] lg:right-4 z-40 rounded-[20px] sm:rounded-[32px] border transition-all duration-500 glass-dark ${
            isDarkMode ? ' border-white/5 shadow-3xl' : 'bg-white/80 border-zinc-100 shadow-sm shadow-zinc-200/20'
          }`}>
            <div className="w-full h-14 sm:h-20 flex items-center justify-between px-3 sm:px-6 md:px-10">
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className={`lg:hidden w-12 h-12 flex items-center justify-center rounded-2xl border transition-all active:scale-95 shadow-xl ${
                    isDarkMode ? 'bg-supplyx-dark border-white/5 text-zinc-400 hover:text-white' : 'bg-white border-zinc-200 text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  <Menu className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center">
                    <p className={`text-[11px] font-black italic uppercase tracking-[0.3em] ${isDarkMode ? 'text-supplyx-blue' : 'text-zinc-400'}`}>
                      {t.tabs[activeTab === 'Seller Central' && profile?.type !== 'supplier' ? 'Dashboard' : activeTab as keyof typeof t.tabs] || activeTab}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:gap-6">
                <div className="flex items-center gap-1.5 sm:gap-2 bg-white/5 p-1 rounded-[18px] border border-white/5">
                  <button 
                    onClick={() => setLanguage(language === 'PT' ? 'EN' : 'PT')}
                    className={`flex items-center gap-1.5 px-3 sm:px-4 h-8 rounded-[14px] text-[10px] font-black transition-all ${
                      isDarkMode ? 'text-zinc-300 hover:text-white hover:bg-white/5' : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                    title="Alternar idioma / Switch language"
                  >
                    <Globe className="w-3.5 h-3.5 text-supplyx-blue shrink-0" />
                    <span className="tracking-widest font-black">{language}</span>
                  </button>
                  <button 
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className={`w-8 h-8 flex items-center justify-center rounded-[14px] transition-all ${
                      isDarkMode ? 'text-amber-400 hover:bg-white/5' : 'text-zinc-400 hover:bg-zinc-200'
                    }`}
                  >
                    {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center gap-2 sm:gap-4">
                  <button 
                    onClick={() => setActiveTab('Mensagens')}
                    className={`w-12 h-12 flex items-center justify-center rounded-2xl border transition-all relative group shadow-xl ${
                      isDarkMode ? 'bg-supplyx-dark border-white/5 text-zinc-400 hover:text-white' : 'bg-white border-zinc-200 text-zinc-500 hover:text-zinc-900'
                    }`}
                  >
                    <MessageSquare className={`w-5 h-5 group-hover:scale-110 transition-transform ${unreadMessages > 0 ? 'text-red-500 animate-pulse' : ''}`} />
                    {unreadMessages > 0 && (
                      <span className={`absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 animate-bounce shadow-lg shadow-red-500/30 ${
                        isDarkMode ? 'border-supplyx-deep' : 'border-white'
                      }`}>
                        {unreadMessages}
                      </span>
                    )}
                  </button>

                  <NotificationCenter 
                    isDarkMode={isDarkMode} 
                    language={language} 
                    userType={profile?.type}
                    onViewAll={() => setActiveTab('Notificações')}
                  />
                  
                  <button 
                    onClick={() => {
                      setSelectedProfileId(auth.currentUser?.uid || null);
                      setIsProfileModalOpen(true);
                    }}
                    className={`w-11 h-11 flex items-center justify-center rounded-2xl border-2 transition-all overflow-hidden relative group shadow-2xl ${
                      isDarkMode 
                        ? 'bg-supplyx-dark border-white/10 hover:border-supplyx-blue/50 shadow-supplyx-blue/5' 
                        : 'bg-white border-zinc-200 hover:border-supplyx-blue/30 shadow-zinc-200/50'
                    }`}
                  >
                    {profile?.photoURL ? (
                      <OptimizedImage 
                        src={profile.photoURL} 
                        alt={profile.name} 
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                        referrerPolicy="no-referrer"
                        containerClassName="w-full h-full"
                        isPriority={true}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-supplyx-blue/10 text-supplyx-blue font-black italic text-base">
                        {profile?.name?.charAt(0) || <User className="w-5 h-5" />}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-supplyx-blue/0 group-hover:bg-supplyx-blue/5 transition-colors" />
                  </button>
                </div>
              </div>
            </div>
          </header>

          <div className="w-full px-4 md:px-8 py-8">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>

          <CartModal 
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            isDarkMode={isDarkMode}
            language={language}
          />

          <ProfileModal 
            userId={selectedProfileId || ''}
            isOpen={isProfileModalOpen}
            onClose={() => setIsProfileModalOpen(false)}
            onEdit={() => {
              setShouldEditProfile(true);
              setActiveTab('Ajustes');
            }}
            onViewCatalog={(uid) => {
              setSelectedSupplierForCatalog(uid);
              setActiveTab('Produtos / Materiais');
            }}
            isDarkMode={isDarkMode}
            language={language}
          />
          <DiagnosticOverlay />
        </main>
      </div>
    );
}
