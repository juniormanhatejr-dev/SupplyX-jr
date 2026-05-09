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
  userType?: 'buyer' | 'supplier';
  onLogout?: () => void;
}

export default function Sidebar({ isOpen, onClose, activeItem, onNavItemClick, isDarkMode, language, userType, onLogout }: SidebarProps) {
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
    { icon: Package, label: nav.products, originalLabel: 'Produtos / Materiais' },
    { icon: FileText, label: nav.quotes, originalLabel: 'Pedidos / Cotações' },
    { icon: Handshake, label: nav.suppliers, originalLabel: 'Fornecedores', buyerOnly: true },
    { icon: BarChart3, label: nav.reports, originalLabel: 'Relatórios' },
    { icon: MessageSquare, label: nav.messages, originalLabel: 'Mensagens' },
    { icon: Truck, label: nav.logistics, originalLabel: 'Logística' },
    { icon: Bell, label: nav.notifications, originalLabel: 'Notificações' },
    { icon: Settings, label: nav.settings, originalLabel: 'Ajustes' },
  ];

  const filteredItems = allItems.filter(item => {
    // Treat everything as buyer unless explicitly supplier
    const currentType = userType === 'supplier' ? 'supplier' : 'buyer';
    if (item.supplierOnly && currentType !== 'supplier') return false;
    if (item.buyerOnly && currentType !== 'buyer') return false;
    return true;
  });

  return (
    <>
      <div 
        className={`fixed inset-0 bg-zinc-950/50 z-[60] transition-opacity lg:hidden 
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <aside className={`fixed left-0 top-0 h-screen w-64 border-r flex flex-col z-[70] transition-all duration-300 transform lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isDarkMode ? 'bg-zinc-950 border-zinc-800 shadow-2xl shadow-black' : 'bg-white border-zinc-200'}`}>
        <div className="p-8 flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <SupplyXLogo size="lg" showText={false} isDark={isDarkMode} />
              <div className="flex flex-col">
                <span className={`text-xl font-black tracking-tight leading-none ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                  SUPPLY<span className="text-[#00B8D9]">X</span>
                </span>
                <p className="text-[7px] font-black uppercase tracking-[0.1em] text-zinc-500 mt-1 leading-none whitespace-nowrap">
                  powered by <span className="text-[#00B8D9]">Manhate Link África</span>
                </p>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-2 text-zinc-400 hover:text-zinc-600">
            <LogOut className="w-5 h-5 rotate-180" />
          </button>
        </div>

      <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto">
        {filteredItems.map((item, index) => (
          <button
            key={index}
            onClick={() => {
              onNavItemClick(item.originalLabel);
              if (window.innerWidth < 1024) onClose();
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-black transition-all duration-200 group
              ${activeItem === item.originalLabel 
                ? 'bg-brand text-white shadow-xl shadow-brand/20' 
                : isDarkMode ? 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-100' : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'}`}
          >
            <item.icon className={`w-5 h-5 ${activeItem === item.originalLabel ? 'text-white' : 'text-brand'}`} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className={`p-4 border-t ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`}>
        <button 
          onClick={onLogout}
          className={`w-full flex items-center gap-3 px-3 py-3 text-sm font-black uppercase tracking-widest transition-all rounded-xl
            ${isDarkMode ? 'text-zinc-500 hover:text-white hover:bg-zinc-900' : 'text-zinc-400 hover:text-zinc-900'}`}
        >
          <LogOut className="w-5 h-5" />
          {nav.logout}
        </button>
      </div>
    </aside>
    </>
  );
}
