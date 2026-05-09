import { useState, useEffect } from 'react';
import { Menu, Plus, Moon, Sun, Globe, Loader2, ShoppingCart, User } from 'lucide-react';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import ProductsView from './components/ProductsView';
import SuppliersView from './components/SuppliersView';
import OrdersView from './components/OrdersView';
import LogisticsView from './components/LogisticsView';
import SupplierDashboard from './components/SupplierDashboard';
import NotificationCenter from './components/NotificationCenter';
import NotificationsView from './components/NotificationsView';
import ReportsView from './components/ReportsView';
import SettingsView from './components/SettingsView';
import RegistrationView from './components/Auth/RegistrationView';
import ChatView from './components/ChatView';
import CartModal from './components/CartModal';
import ProfileModal from './components/ProfileModal';
import SupplyXLogo from './components/SupplyXLogo';
import { useAuth } from './contexts/AuthContext';
import { useCart } from './contexts/CartContext';
import { auth } from './lib/firebase';

export default function App() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [showQuoteFormDirectly, setShowQuoteFormDirectly] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState<'PT' | 'EN'>('PT');
  const [selectedCategory, setSelectedCategory] = useState('Tudo');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [selectedSupplierForCatalog, setSelectedSupplierForCatalog] = useState<string | null>(null);
  const [shouldEditProfile, setShouldEditProfile] = useState(false);
  const { items } = useCart();

  // If supplier, default to Seller Central
  useEffect(() => {
    if (profile?.type === 'supplier' && activeTab === 'Dashboard') {
      setActiveTab('Seller Central');
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
  };

  const translations = {
    PT: {
      newOrder: 'Novo Pedido',
      search: 'Buscar materials...',
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
        'Ajustes': 'Ajustes'
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
        'Ajustes': 'Settings'
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

  if (!user) {
    return (
      <RegistrationView 
        isDarkMode={isDarkMode} 
        language={language} 
        onSuccess={refreshProfile}
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
          {...commonProps} 
        />;
      case 'Produtos / Materiais':
        return <ProductsView 
          onNavigate={(tab) => {
            if (tab === 'Pedidos / Cotações') setShowQuoteFormDirectly(true);
            if (tab === 'Ajustes') setShouldEditProfile(true);
            setActiveTab(tab);
          }} 
          initialCategory={selectedCategory}
          supplierId={selectedSupplierForCatalog}
          onClearSupplierFilter={() => setSelectedSupplierForCatalog(null)}
          {...commonProps} 
        />;
      case 'Pedidos / Cotações':
        return <OrdersView 
          startWithForm={showQuoteFormDirectly} 
          onFormClose={() => setShowQuoteFormDirectly(false)} 
          onNavigate={(tab) => {
            if (tab === 'Ajustes') setShouldEditProfile(true);
            setActiveTab(tab);
          }}
          {...commonProps}
        />;
      case 'Fornecedores':
        return <SuppliersView 
          onViewProfile={(uid) => {
            setSelectedProfileId(uid);
            setIsProfileModalOpen(true);
          }}
          {...commonProps} 
        />;
      case 'Logística':
        return <LogisticsView {...commonProps} />;
      case 'Seller Central':
        return <SupplierDashboard onNavigate={(tab) => {
          if (tab === 'Ajustes') setShouldEditProfile(true);
          setActiveTab(tab);
        }} {...commonProps} />;
      case 'Notificações':
        return <NotificationsView {...commonProps} />;
      case 'Relatórios':
        return <ReportsView {...commonProps} />;
      case 'Mensagens':
        return <ChatView onNavigate={(tab) => {
          if (tab === 'Ajustes') setShouldEditProfile(true);
          setActiveTab(tab);
        }} {...commonProps} />;
      case 'Ajustes':
        return <SettingsView 
          initialIsEditing={shouldEditProfile}
          onBack={() => {
            setShouldEditProfile(false);
            setActiveTab(profile?.type === 'supplier' ? 'Seller Central' : 'Dashboard');
          }} 
          {...commonProps} 
        />;
      default:
        return <DashboardView onActivateIA={handleNewRequest} {...commonProps} />;
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 relative overflow-hidden ${isDarkMode ? 'dark bg-zinc-950' : 'bg-zinc-50'}`}>
      {/* App Watermark */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] dark:opacity-[0.01] select-none z-0">
        <div className="relative rotate-[-15deg]">
           <SupplyXLogo size="xl" showText={true} className="scale-[4] md:scale-[8]" isDark={isDarkMode} />
        </div>
      </div>

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
      />
      
      <main className="lg:ml-64 transition-all pb-12 pt-20">
        <header className={`fixed top-0 left-0 right-0 lg:left-64 z-40 border-b backdrop-blur-xl transition-all ${
          isDarkMode ? 'bg-zinc-950/80 border-zinc-800 shadow-2xl shadow-black/40' : 'bg-white/80 border-zinc-100 shadow-sm shadow-zinc-200/20'
        }`}>
          <div className="w-full h-16 flex items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className={`lg:hidden w-10 h-10 flex items-center justify-center rounded-xl border transition-all active:scale-95 ${
                  isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white' : 'bg-white border-zinc-200 text-zinc-500 hover:text-zinc-900'
                }`}
              >
                <Menu className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3">
                <SupplyXLogo size="sm" isDark={isDarkMode} />
                <div className="hidden sm:flex items-center">
                  <span className={`mx-2 text-zinc-300 dark:text-zinc-700 font-light`}>|</span>
                  <p className={`text-xs font-bold leading-none uppercase tracking-widest ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    {t.tabs[activeTab === 'Seller Central' && profile?.type !== 'supplier' ? 'Dashboard' : activeTab as keyof typeof t.tabs]}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3">
              {/* System Actions */}
              <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <button 
                  onClick={() => setLanguage(language === 'PT' ? 'EN' : 'PT')}
                  className={`flex items-center gap-1 px-2.5 h-7 rounded-lg text-[10px] font-black transition-all ${
                    isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                  title={language === 'PT' ? 'Mudar para Inglês' : 'Switch to Portuguese'}
                >
                  <Globe className="w-3 h-3 text-brand" />
                  <span className="hidden xs:inline">{language}</span>
                </button>

                <div className="w-px h-3 bg-zinc-200 dark:bg-zinc-800 mx-1" />

                <button 
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
                    isDarkMode ? 'text-amber-400 hover:bg-zinc-800' : 'text-zinc-400 hover:bg-zinc-200'
                  }`}
                >
                  {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Interaction Actions */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <NotificationCenter 
                  isDarkMode={isDarkMode} 
                  language={language} 
                  userType={profile?.type}
                  onViewAll={() => setActiveTab('Notificações')}
                />

                {profile?.type === 'buyer' && (
                  <button 
                    onClick={() => setIsCartOpen(true)}
                    className={`relative w-9 h-9 flex items-center justify-center rounded-xl border transition-all ${
                      isDarkMode ? 'border-zinc-800 text-zinc-400 bg-zinc-900 hover:text-white hover:border-zinc-700' : 'border-zinc-200 text-zinc-500 bg-white hover:bg-zinc-50 hover:border-zinc-300'
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4 transition-transform active:scale-95" />
                    {items.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand text-white text-[8px] font-black rounded-full flex items-center justify-center shadow-lg shadow-brand/30 border-2 border-inherit">
                        {items.length}
                      </span>
                    )}
                  </button>
                )}
              </div>

              <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 mx-1 hidden sm:block" />

              {/* Profile Action */}
              <button 
                onClick={() => {
                  setSelectedProfileId(auth.currentUser?.uid || null);
                  setIsProfileModalOpen(true);
                }}
                className={`group flex items-center gap-2 p-1 pl-1 pr-3 rounded-xl transition-all border ${
                  isDarkMode ? 'hover:bg-zinc-900 border-zinc-800 hover:border-zinc-700' : 'hover:bg-zinc-50 border-zinc-200 hover:border-zinc-300'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg overflow-hidden border shadow-sm transition-transform group-hover:scale-105 ${isDarkMode ? 'border-zinc-700 bg-zinc-800' : 'border-zinc-300 bg-white'}`}>
                  {profile?.photoURL ? (
                    <img src={profile.photoURL} alt={profile.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-brand/10 text-brand font-black italic text-xs">
                      {profile?.name?.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="hidden md:flex flex-col items-start leading-none text-left">
                  <span className={`text-[10px] font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{profile?.name?.split(' ')[0]}</span>
                  <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">{profile?.type === 'supplier' ? t.supplier : t.buyer}</span>
                </div>
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          {renderContent()}
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
      </main>
    </div>
  );
}
