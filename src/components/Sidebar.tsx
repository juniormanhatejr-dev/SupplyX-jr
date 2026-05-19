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
  User
} from 'lucide-react';
import { motion } from 'motion/react';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';

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
}

export default function Sidebar({ isOpen, onClose, activeItem, onNavItemClick, isDarkMode, language, userType, onLogout }: SidebarProps) {
  const { unreadMessages, unreadNotifications } = useNotifications();
  const { profile } = useAuth();
  const translations = {
    PT: {
      dashboard: 'Dashboard',
      products: 'Produtos / Materiais',
      quotes: 'Pedidos / Cotações',
      suppliers: 'Fornecedores',
      reports: 'Relatórios',
      messages: 'Mensagens',
      logistics: 'Logística',
      seller: 'Central do Vendedor',
      notifications: 'Notificações',
      settings: 'Ajustes',
      profile: 'Meu Perfil',
      logout: 'Sair da conta'
    },
    EN: {
      dashboard: 'Dashboard',
      products: 'Products / Materials',
      quotes: 'Orders / Quotes',
      suppliers: 'Suppliers',
      reports: 'Reports',
      messages: 'Messages',
      logistics: 'Logistics',
      seller: 'Seller Central',
      notifications: 'Notifications',
      settings: 'Settings',
      profile: 'My Profile',
      logout: 'Logout'
    }
  };

  const nav = translations[language || 'PT'];

  const allItems = [
    { icon: LayoutDashboard, label: nav.dashboard, originalLabel: 'Dashboard' },
    { icon: User, label: nav.profile, originalLabel: 'Meu Perfil' },
    { icon: BarChart3, label: nav.seller, originalLabel: 'Seller Central', supplierOnly: true },
    { icon: Package, label: nav.products, originalLabel: 'Produtos / Materiais', hideForLogistics: true },
    { icon: FileText, label: nav.quotes, originalLabel: 'Pedidos / Cotações', hideForLogistics: true },
    { icon: Handshake, label: nav.suppliers, originalLabel: 'Fornecedores', buyerOnly: true },
    { icon: BarChart3, label: nav.reports, originalLabel: 'Relatórios' },
    { icon: MessageSquare, label: nav.messages, originalLabel: 'Mensagens' },
    { icon: Truck, label: nav.logistics, originalLabel: 'Logística' },
    { icon: Bell, label: nav.notifications, originalLabel: 'Notificações' },
    { icon: Settings, label: nav.settings, originalLabel: 'Ajustes' },
  ];

  const filteredItems = allItems.filter(item => {
    if (item.supplierOnly && userType !== 'supplier') return false;
    if (item.buyerOnly && userType !== 'buyer' && userType !== 'logistics') return false;
    if (item.hideForLogistics && userType === 'logistics') return false;
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
          const isActive = activeItem === item.originalLabel;
          return (
            <button
              key={index}
              onClick={() => {
                onNavItemClick(item.originalLabel);
                if (window.innerWidth < 1024) onClose();
              }}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 group relative
                ${isActive 
                  ? 'bg-supplyx-blue text-white shadow-2xl shadow-blue-500/20' 
                  : isDarkMode ? 'text-zinc-500 hover:bg-white/5 hover:text-white' : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'}`}
            >
              {item.originalLabel === 'Meu Perfil' && profile?.photoURL ? (
                <div className={`w-5 h-5 rounded-lg overflow-hidden border transition-transform group-hover:scale-110 ${isActive ? 'border-white/50' : 'border-supplyx-blue/30'}`}>
                  <img 
                    src={profile.photoURL} 
                    alt="Profile" 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
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
