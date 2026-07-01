import SupplyXLogo from './SupplyXLogo';
import { 
  LayoutDashboard, 
  Package, 
  FileText, 
  Handshake, 
  BarChart3, 
  Settings, 
  LogOut,
  Bell,
  Truck,
  MessageSquare,
  User,
  Info,
  Tags
} from 'lucide-react';
import { motion } from 'motion/react';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { OptimizedImage } from './ui/OptimizedImage';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard' },
  { icon: Package, label: 'Produtos / Materiais' },
  { icon: FileText, label: 'Pedidos / Cotações' },
  { icon: Handshake, label: 'Fornecedores' },
  { icon: BarChart3, label: 'Relatórios' },
  { icon: Truck, label: 'Logística' },
  { icon: Bell, label: 'Notificações' },
  { icon: Settings, label: 'Ajustes' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeItem: string;
  onNavItemClick: (label: string) => void;
  isDarkMode?: boolean;
  language?: 'PT' | 'EN';
  userType?: 'buyer' | 'supplier' | 'logistics';
  onLogout?: () => void;
  logisticsSubTab?: string;
}

export default function Sidebar({ isOpen, onClose, activeItem, onNavItemClick, isDarkMode, language, userType, onLogout, logisticsSubTab }: SidebarProps) {
  const { unreadMessages, unreadNotifications } = useNotifications();
  const { profile } = useAuth();

  const isLogistics = userType === 'logistics';

  const translations = {
    PT: {
      profile: 'Meu perfil',
      dashboard: 'Cockpit analítico',
      monitor: 'Monitor de cargas',
      drivers: 'Frotas e motoristas',
      fulfillment: 'Fulfillment stock',
      chat: 'Chat B2B',
      settings: 'Ajustes do sistema',
      about: 'About',
      logout: 'Sair da conta'
    },
    EN: {
      profile: 'My Profile',
      dashboard: 'Control Dashboard',
      monitor: 'Cargo Monitor',
      drivers: 'Fleets & Drivers',
      fulfillment: 'Fulfillment Stock',
      chat: 'B2B Chat',
      settings: 'System Settings',
      about: 'About',
      logout: 'Logout'
    }
  };

  const nav = translations[language || 'PT'];

  const filteredItems = isLogistics 
    ? [
        { icon: User, label: nav.profile, originalLabel: 'Meu Perfil' },
        { icon: LayoutDashboard, label: nav.dashboard, originalLabel: 'Cockpit Analítico' },
        { icon: Package, label: nav.monitor, originalLabel: 'Monitor de Cargas' },
        { icon: Truck, label: nav.drivers, originalLabel: 'Frotas & Motoristas' },
        { icon: MessageSquare, label: nav.chat, originalLabel: 'Mensagens' },
        { icon: Settings, label: nav.settings, originalLabel: 'Ajustes' },
        { icon: Info, label: nav.about, originalLabel: 'About' }
      ]
    : [
        { icon: LayoutDashboard, label: language === 'PT' ? 'Dashboard' : 'Dashboard', originalLabel: 'Dashboard' },
        { icon: User, label: language === 'PT' ? 'Meu Perfil' : 'My Profile', originalLabel: 'Meu Perfil' },
        { icon: BarChart3, label: language === 'PT' ? 'Central do Vendedor' : 'Seller Central', originalLabel: 'Seller Central', supplierOnly: true },
        { icon: Truck, label: language === 'PT' ? 'Logística' : 'Logistics', originalLabel: 'Logística' },
        { icon: Package, label: language === 'PT' ? 'Produtos / Materiais' : 'Products / Materials', originalLabel: 'Produtos / Materiais', hideForLogistics: true },
        { icon: FileText, label: language === 'PT' ? 'Pedidos / Cotações' : 'Orders / Quotes', originalLabel: 'Pedidos / Cotações', hideForLogistics: true },
        { icon: Handshake, label: language === 'PT' ? 'Fornecedores' : 'Suppliers', originalLabel: 'Fornecedores', buyerOnly: true },
        { icon: BarChart3, label: language === 'PT' ? 'Relatórios' : 'Reports', originalLabel: 'Relatórios' },
        { icon: MessageSquare, label: language === 'PT' ? 'Mensagens' : 'Messages', originalLabel: 'Mensagens' },
        { icon: Bell, label: language === 'PT' ? 'Notificações' : 'Notifications', originalLabel: 'Notificações' },
        { icon: Settings, label: language === 'PT' ? 'Ajustes' : 'Settings', originalLabel: 'Ajustes' },
        { icon: Info, label: language === 'PT' ? 'Sobre o SupplyX' : 'About SupplyX', originalLabel: 'About' },
      ].filter((item: any) => {
        const uType = userType as string;
        if (item.supplierOnly && uType !== 'supplier') return false;
        if (item.buyerOnly && uType !== 'buyer' && uType !== 'logistics') return false;
        if (item.logisticsOnly && uType !== 'logistics') return false;
        if (item.hideForLogistics && uType === 'logistics') return false;
        return true;
      });

  return (
    <>
      <div 
        className={`fixed inset-0 bg-zinc-950/50 z-[60] transition-opacity lg:hidden 
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <aside className={`fixed left-0 top-0 h-screen w-64 flex flex-col z-[70] transition-transform duration-500 transform 
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isDarkMode ? 'bg-supplyx-deep border-r border-white/5 shadow-3xl' : 'bg-white border-r border-zinc-200'}`}>
        
        <div className="p-8 flex items-center justify-between">
          <div className={`p-4 rounded-[32px] border ${isDarkMode ? 'bg-zinc-900 shadow-2xl border-white/5' : 'bg-white border-zinc-100 shadow-sm'}`}>
            <SupplyXLogo size="md" isDark={isDarkMode} />
          </div>
          <button onClick={onClose} className="lg:hidden p-2 text-zinc-400 hover:text-white">
            <LogOut className="w-5 h-5 rotate-180" />
          </button>
        </div>

      <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
        {filteredItems.map((item, index) => {
          let isActive = false;
          if (isLogistics) {
            if (item.originalLabel === 'Cockpit Analítico') {
              isActive = activeItem === 'Logística' && logisticsSubTab === 'dashboard';
            } else if (item.originalLabel === 'Monitor de Cargas') {
              isActive = activeItem === 'Logística' && ['requests_list', 'detailed_request', 'create_request'].includes(logisticsSubTab || '');
            } else if (item.originalLabel === 'Frotas & Motoristas') {
              isActive = activeItem === 'Logística' && logisticsSubTab === 'drivers';
            } else if (item.originalLabel === 'Fulfillment Stock') {
              isActive = activeItem === 'Logística' && logisticsSubTab === 'inventory';
            } else {
              isActive = activeItem === item.originalLabel;
            }
          } else {
            isActive = activeItem === item.originalLabel;
          }
          return (
            <button
              key={item.originalLabel}
              onClick={() => {
                onNavItemClick(item.originalLabel);
                if (window.innerWidth < 1024) onClose();
              }}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 group relative
                ${isActive 
                  ? 'bg-supplyx-blue text-white shadow-2xl shadow-blue-500/20' 
                  : isDarkMode ? 'text-zinc-500 hover:bg-white/5 hover:text-white' : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'}`}
            >
              {item.originalLabel === 'Meu Perfil' ? (
                <div className={`w-5 h-5 rounded-lg overflow-hidden border transition-transform group-hover:scale-110 ${isActive ? 'border-white/50' : 'border-supplyx-blue/30'}`}>
                  {profile?.photoURL ? (
                    <OptimizedImage 
                      src={profile.photoURL} 
                      alt="Profile" 
                      className="w-full h-full object-cover" 
                      containerClassName="w-full h-full"
                      isPriority={true}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-supplyx-blue/10 text-supplyx-blue text-[9px] font-black italic">
                      {profile?.name?.charAt(0) || '?'}
                    </div>
                  )}
                </div>
              ) : (
                <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-supplyx-blue'}`} />
              )}
              {item.label}
              {isActive && (
                <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              )}
              {item.originalLabel === 'Mensagens' && unreadMessages > 0 && (
                <div className="absolute right-4 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[8px] font-black animate-bounce shadow-lg shadow-red-500/20">
                  {unreadMessages}
                </div>
              )}
              {item.originalLabel === 'Notificações' && unreadNotifications > 0 && (
                <div className="absolute right-4 w-2 h-2 rounded-full bg-red-500 animate-pulse border border-white" />
              )}
            </button>
          );
        })}
      </nav>

      <div className={`p-6 border-t ${isDarkMode ? 'border-white/5' : 'border-zinc-100'}`}>
        <button 
          onClick={onLogout}
          className={`w-full flex items-center gap-3 px-4 py-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all rounded-2xl group
            ${isDarkMode ? 'text-zinc-500 hover:text-red-400 hover:bg-red-500/5' : 'text-zinc-400 hover:text-zinc-900'}`}
        >
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          {nav.logout}
        </button>
      </div>
    </aside>
    </>
  );
}
