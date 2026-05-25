import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, Plus, Moon, Sun, Globe, Loader2, ShoppingCart, User, MessageSquare } from 'lucide-react';
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
import LandingPageView from './components/LandingPageView';
import ChatView from './components/ChatView';
import CartModal from './components/CartModal';
import ProfileModal from './components/ProfileModal';
import SupplyXLogo from './components/SupplyXLogo';
import DiagnosticOverlay from './components/DiagnosticOverlay';
import AboutView from './components/AboutView';
import { OptimizedImage } from './components/ui/OptimizedImage';
import { useAuth } from './contexts/AuthContext';
import { useCart } from './contexts/CartContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { auth } from './lib/firebase';
import { presenceService } from './services/presenceService';

import { useNotifications } from './contexts/NotificationContext';

export default function App() {
  const isOnline = useOnlineStatus();
  const { user, profile, loading, refreshProfile } = useAuth();
  const hasIncompleteProfile = !!user && (!profile || !profile.type);
  
  const { unreadMessages, unreadNotifications } = useNotifications();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [showQuoteFormDirectly, setShowQuoteFormDirectly] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('supplyx_theme');
    return saved !== null ? saved === 'dark' : true; // Default to Dark Mode for premium feel
  });
  const [language, setLanguage] = useState<'PT' | 'EN'>(() => {
    const saved = localStorage.getItem('supplyx_language');
    return (saved === 'PT' || saved === 'EN') ? saved : 'PT';
  });

  useEffect(() => {
    localStorage.setItem('supplyx_theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('supplyx_language', language);
  }, [language]);
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
    window.addEventListener('navigate-to-messages', handleNavigate);
    return () => window.removeEventListener('navigate-to-messages', handleNavigate);
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
        'Produtos / Materiais': 'Produtos / Materiais',
        'Pedidos / Cotações': 'Pedidos / Cotações',
        'Fornecedores': 'Fornecedores',
        'Logística': 'Logística',
        'Seller Central': 'Central do Vendedor',
        'Notificações': 'Notificações',
        'Relatórios': 'Relatórios',
        'Mensagens': 'Mensagens',
        'Ajustes': 'Ajustes',
        'About': 'Sobre o SupplyX'
      }
    },
    EN: {
      newOrder: 'New Order',
      search: 'Search materials...',
      supplier: 'Supplier',
      buyer: 'Buyer',
      tabs: {
        'Dashboard': 'Dashboard',
        'Produtos / Materiais': 'Products / Materials',
        'Pedidos / Cotações': 'Orders / Quotes',
        'Fornecedores': 'Suppliers',
        'Logística': 'Logistics',
        'Seller Central': 'Seller Central',
        'Notificações': 'Notifications',
        'Relatórios': 'Reports',
        'Mensagens': 'Messages',
        'Ajustes': 'Settings',
        'About': 'About SupplyX'
      }
    }
  };

  const t = translations[language];

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-zinc-950' : 'bg-zinc-50'}`}>
        <Loader2 className="w-10 h-10 text-brand animate-spin" />
      </div>
    );
  }

  if (!user || (hasIncompleteProfile && !loading)) {
    if (view === 'landing') {
      return (
        <LandingPageView 
          isDarkMode={isDarkMode} 
          language={language}
          onGetStarted={() => setView('auth')}
          onLogin={() => setView('auth')}
        />
      );
    }
    return (
      <RegistrationView 
        isDarkMode={isDarkMode} 
        language={language} 
        onSuccess={refreshProfile}
        onBack={() => setView('landing')}
        forceOnboarding={hasIncompleteProfile}
      />
    );
  }

  const handleNavigateWithPayload = (tab: string, payload?: any) => {
    if (tab === 'Mensagens' && payload?.userId) {
      setInitialRecipientId(payload.userId);
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
    }
    
    if (tab !== activeTab) {
      setPrevTab(activeTab);
    }
    setActiveTab(tab);
  };

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
          userType={profile?.type}
          onLogout={handleLogout}
          logisticsSubTab={logisticsSubTab}
        />
        
        <main className="lg:ml-64 transition-all pb-12 pt-28 relative z-10">
          <header className={`fixed top-4 left-4 right-4 lg:left-[calc(16rem+1rem)] lg:right-4 z-40 rounded-[32px] border transition-all duration-500 glass-dark ${
            isDarkMode ? ' border-white/5 shadow-3xl' : 'bg-white/80 border-zinc-100 shadow-sm shadow-zinc-200/20'
          }`}>
            <div className="w-full h-20 flex items-center justify-between px-6 sm:px-10">
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
                      {t.tabs[activeTab === 'Seller Central' && profile?.type !== 'supplier' ? 'Dashboard' : activeTab as keyof typeof t.tabs]}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:gap-6">
                <div className="flex items-center gap-1.5 sm:gap-2 bg-white/5 p-1 rounded-[18px] border border-white/5">
                  <button 
                    onClick={() => setLanguage(language === 'PT' ? 'EN' : 'PT')}
                    className={`flex items-center gap-2 px-4 h-8 rounded-[14px] text-[10px] font-black transition-all ${
                      isDarkMode ? 'text-zinc-400 hover:text-white hover:bg-white/5' : 'text-zinc-500 hover:text-zinc-900'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5 text-supplyx-blue" />
                    <span className="hidden xs:inline tracking-widest">{language}</span>
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
                    <MessageSquare className={`w-5 h-5 group-hover:scale-110 transition-transform ${unreadMessages > 0 ? 'text-red-500' : ''}`} />
                    {unreadMessages > 0 && (
                      <span className={`absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 animate-bounce shadow-lg shadow-red-500/20 ${
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
