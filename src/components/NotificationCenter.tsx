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

interface NotificationCenterProps {
  isDarkMode: boolean;
  language: 'PT' | 'EN';
  onViewAll?: () => void;
  userType?: 'buyer' | 'supplier';
}

export default function NotificationCenter({ isDarkMode, language, onViewAll, userType }: NotificationCenterProps) {
  const getMockNotifications = (lang: 'PT' | 'EN'): Notification[] => [
    // Buyer
    {
      id: '1',
      type: 'promotion',
      titlePT: 'Promoção: Cimento CP-II',
      titleEN: 'Promo: Cement CP-II',
      descPT: 'Desconto de 15% para pedidos acima de 500 sacos na Maputo Sul.',
      descEN: '15% discount for orders over 500 bags in Maputo South.',
      time: lang === 'PT' ? '2h atrás' : '2h ago',
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
      time: lang === 'PT' ? '5h atrás' : '5h ago',
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
      time: lang === 'PT' ? '30m atrás' : '30m ago',
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
      time: lang === 'PT' ? '3h atrás' : '3h ago',
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
      time: lang === 'PT' ? '6h atrás' : '6h ago',
      isRead: true,
      userType: 'supplier'
    }
  ];

  const [isOpen, setIsOpen] = useState(false);
  const activeNotifications = getMockNotifications(language);
  const filtered = activeNotifications.filter(n => n.userType === 'both' || !n.userType || n.userType === userType);
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
        className={`w-12 h-12 flex items-center justify-center rounded-2xl border transition-all relative group shadow-xl ${
          isDarkMode ? 'bg-supplyx-dark border-white/5 text-zinc-400 hover:text-white' : 'bg-white border-zinc-200 text-zinc-500 hover:text-zinc-900'
        }`}
      >
        <Bell className={`w-5 h-5 transition-colors ${unreadCount > 0 ? 'text-supplyx-blue animate-pulse-slow' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-supplyx-blue text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-supplyx-deep">
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
              className={`absolute -right-24 md:right-0 mt-6 w-[320px] sm:w-[420px] rounded-[32px] border z-40 overflow-hidden shadow-3xl origin-top-right glass-dark ${
                isDarkMode ? 'border-white/5' : 'bg-white border-zinc-100'
              }`}
            >
              <div className={`p-8 border-b flex justify-between items-center ${isDarkMode ? 'border-white/5 bg-white/5' : 'border-zinc-50'}`}>
                <h3 className={`font-black uppercase italic tracking-[0.2em] text-[11px] ${isDarkMode ? 'text-supplyx-blue' : 'text-zinc-900'}`}>
                  {t.title}
                </h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-[10px] font-black uppercase text-zinc-400 hover:text-white transition-colors"
                  >
                    {t.markRead}
                  </button>
                )}
              </div>

              <div className="max-h-[500px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-8 h-8 text-zinc-600" />
                    </div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                      {t.empty}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {notifications.map((n) => (
                      <div 
                        key={n.id} 
                        className={`p-6 flex gap-6 transition-all relative group ${
                          !n.isRead ? (isDarkMode ? 'bg-supplyx-blue/5' : 'bg-supplyx-blue/5') : ''
                        } ${isDarkMode ? 'hover:bg-white/[0.02]' : 'hover:bg-zinc-50'}`}
                      >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                          n.type === 'promotion' ? 'bg-amber-500/10 text-amber-500' : 
                          n.type === 'supplier' ? 'bg-emerald-500/10 text-emerald-500' :
                          n.type === 'rfq' ? 'bg-supplyx-blue/10 text-supplyx-blue' :
                          n.type === 'stock' ? 'bg-rose-500/10 text-rose-500' :
                          n.type === 'order' ? 'bg-violet-500/10 text-violet-500' : 'bg-blue-500/10 text-blue-500'
                        }`}>
                          {n.type === 'promotion' ? <Tag className="w-5 h-5" /> : 
                           n.type === 'supplier' ? <MapPin className="w-5 h-5" /> : 
                           n.type === 'rfq' ? <Info className="w-5 h-5" /> :
                           n.type === 'stock' ? <CheckCircle2 className="w-5 h-5" /> :
                           n.type === 'order' ? <Clock className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[12px] font-black uppercase italic leading-tight mb-1 ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
                            {language === 'PT' ? n.titlePT : n.titleEN}
                          </p>
                          <p className={`text-[11px] font-medium leading-relaxed mb-3 line-clamp-2 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>
                            {language === 'PT' ? n.descPT : n.descEN}
                          </p>
                          <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                             <Clock className="w-3 h-3" /> {n.time}
                          </span>
                        </div>
                        <button 
                          onClick={() => removeNotification(n.id)}
                          className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-xl flex items-center justify-center text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 transition-all active:scale-95"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={`p-6 border-t text-center ${isDarkMode ? 'border-white/5 bg-white/5' : 'border-zinc-50 bg-zinc-50/50'}`}>
                <button 
                  onClick={() => {
                    setIsOpen(false);
                    onViewAll?.();
                  }}
                  className="w-full h-12 rounded-2xl flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-supplyx-blue hover:bg-supplyx-blue hover:text-white transition-all active:scale-95 border border-supplyx-blue/20"
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
