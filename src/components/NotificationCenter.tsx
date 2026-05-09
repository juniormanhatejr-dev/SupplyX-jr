import { motion, AnimatePresence } from 'motion/react';
import { Bell, Tag, MapPin, CheckCircle2, X, Clock, Info } from 'lucide-react';
import { useState } from 'react';

interface Notification {
  id: string;
  type: 'promotion' | 'supplier' | 'rfq' | 'stock' | 'order';
  titlePT: string;
  titleEN: string;
  descPT: string;
  descEN: string;
  time: string;
  isRead: boolean;
  userType?: 'buyer' | 'supplier' | 'both';
}

const mockNotifications: Notification[] = [
  // Buyer
  {
    id: '1',
    type: 'promotion',
    titlePT: 'Promoção: Cimento CP-II',
    titleEN: 'Promo: Cement CP-II',
    descPT: 'Desconto de 15% para pedidos acima de 500 sacos na Maputo Sul.',
    descEN: '15% discount for orders over 500 bags in Maputo South.',
    time: '2h ago',
    isRead: false,
    userType: 'buyer'
  },
  {
    id: '2',
    type: 'supplier',
    titlePT: 'Novo Fornecedor Próximo',
    titleEN: 'New Nearby Supplier',
    descPT: 'Ferragens Matola iniciou operações a 5km da sua localização.',
    descEN: 'Matola Hardware started operations 5km from your location.',
    time: '5h ago',
    isRead: false,
    userType: 'buyer'
  },
  // Supplier
  {
    id: 's1',
    type: 'rfq',
    titlePT: 'Nova Cotação Solicitada',
    titleEN: 'New RFQ Requested',
    descPT: 'Cotação solicitada para 1000 tijolos cerâmicos.',
    descEN: 'Quote requested for 1000 ceramic bricks.',
    time: '30m ago',
    isRead: false,
    userType: 'supplier'
  },
  {
    id: 's2',
    type: 'stock',
    titlePT: 'Alerta de Stock Baixo',
    titleEN: 'Low Stock Alert',
    descPT: 'Stock de Vergalhão de 12mm abaixo do limite.',
    descEN: '12mm Rebar stock below the limit.',
    time: '3h ago',
    isRead: false,
    userType: 'supplier'
  },
  {
    id: 's3',
    type: 'order',
    titlePT: 'Novo Pedido Recebido',
    titleEN: 'New Order Received',
    descPT: 'Você recebeu um novo pedido de "Acabamentos Elite".',
    descEN: 'You received a new order from "Elite Finishes".',
    time: '6h ago',
    isRead: true,
    userType: 'supplier'
  }
];

interface NotificationCenterProps {
  isDarkMode: boolean;
  language: 'PT' | 'EN';
  onViewAll?: () => void;
  userType?: 'buyer' | 'supplier';
}

export default function NotificationCenter({ isDarkMode, language, onViewAll, userType }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const filtered = mockNotifications.filter(n => n.userType === 'both' || !n.userType || n.userType === userType);
  const [notifications, setNotifications] = useState(filtered);

  const t = {
    PT: {
      title: 'Notificações',
      markRead: 'Lidas',
      empty: 'Sem novas atualizações',
      viewAll: 'Ver Todas as Notificações'
    },
    EN: {
      title: 'Notifications',
      markRead: 'Read',
      empty: 'No new updates',
      viewAll: 'View All Notifications'
    }
  }[language];

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const toggleOpen = () => {
    if (!isOpen) {
      markAllAsRead();
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      <button 
        onClick={toggleOpen}
        className={`p-2.5 rounded-xl border transition-all relative ${
          isDarkMode ? 'border-zinc-800 text-zinc-400 bg-zinc-900 group' : 'border-zinc-200 text-zinc-400 bg-white group'
        }`}
      >
        <Bell className={`w-5 h-5 transition-colors ${unreadCount > 0 ? 'text-brand animate-pulse' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-background animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className={`absolute -right-12 md:right-0 mt-3 w-80 md:w-96 rounded-3xl border z-40 overflow-hidden shadow-2xl origin-top-right ${
                isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-100'
              }`}
            >
              <div className={`p-5 border-b flex justify-between items-center ${isDarkMode ? 'border-zinc-800' : 'border-zinc-50'}`}>
                <h3 className={`font-black uppercase italic tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                  {t.title}
                </h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-[10px] font-black uppercase text-brand hover:underline"
                  >
                    {t.markRead}
                  </button>
                )}
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-10 text-center">
                    <CheckCircle2 className="w-10 h-10 text-zinc-200 mx-auto mb-3" />
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                      {t.empty}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-800/10">
                    {notifications.map((n) => (
                      <div 
                        key={n.id} 
                        className={`p-4 flex gap-4 transition-colors relative group ${
                          !n.isRead ? (isDarkMode ? 'bg-brand/5' : 'bg-brand/5') : ''
                        } ${isDarkMode ? 'hover:bg-zinc-900' : 'hover:bg-zinc-50'}`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          n.type === 'promotion' ? 'bg-amber-500/10 text-amber-500' : 
                          n.type === 'supplier' ? 'bg-emerald-500/10 text-emerald-500' :
                          n.type === 'rfq' ? 'bg-brand/10 text-brand' :
                          n.type === 'stock' ? 'bg-red-500/10 text-red-500' :
                          n.type === 'order' ? 'bg-purple-500/10 text-purple-500' : 'bg-blue-500/10 text-blue-500'
                        }`}>
                          {n.type === 'promotion' ? <Tag className="w-5 h-5" /> : 
                           n.type === 'supplier' ? <MapPin className="w-5 h-5" /> : 
                           n.type === 'rfq' ? <Info className="w-5 h-5" /> :
                           n.type === 'stock' ? <CheckCircle2 className="w-5 h-5" /> :
                           n.type === 'order' ? <Clock className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-black uppercase leading-tight ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
                            {language === 'PT' ? n.titlePT : n.titleEN}
                          </p>
                          <p className={`text-[11px] mt-1 line-clamp-2 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                            {language === 'PT' ? n.descPT : n.descEN}
                          </p>
                          <span className="text-[9px] font-bold text-zinc-500 mt-2 block uppercase tracking-widest">
                            {n.time}
                          </span>
                        </div>
                        <button 
                          onClick={() => removeNotification(n.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-red-500 transition-all"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={`p-4 border-t text-center ${isDarkMode ? 'border-zinc-800 bg-zinc-950' : 'border-zinc-50 bg-zinc-50/50'}`}>
                <button 
                  onClick={() => {
                    setIsOpen(false);
                    onViewAll?.();
                  }}
                  className="text-[10px] font-black uppercase tracking-widest text-brand hover:underline"
                >
                  {t.viewAll}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
