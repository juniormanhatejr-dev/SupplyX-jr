import { motion, AnimatePresence } from 'motion/react';
import { Bell, Tag, MapPin, CheckCircle2, X, Clock, Info, FileText, AlertCircle, Trash2, CheckCheck } from 'lucide-react';
import { useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';

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
  const { 
    unreadNotifications, 
    notifications, 
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    deleteAllNotifications
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  
  const totalUnread = unreadNotifications;

  const t = {
    PT: {
      title: 'Notificações',
      markRead: 'Todas Lidas',
      clearAll: 'Limpar',
      empty: 'Nenhuma notificação',
      viewAll: 'Ver Todas as Notificações',
      justNow: 'Agora',
      ago: 'atrás'
    },
    EN: {
      title: 'Notifications',
      markRead: 'Mark all read',
      clearAll: 'Clear all',
      empty: 'No notifications',
      viewAll: 'View All Notifications',
      justNow: 'Just now',
      ago: 'ago'
    }
  }[language];

  const formatTime = (createdAt: any) => {
    if (!createdAt) return t.justNow;
    const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    const diff = (Date.now() - date.getTime()) / 1000;
    
    if (diff < 60) return t.justNow;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ${t.ago}`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ${t.ago}`;
    return date.toLocaleDateString(language === 'PT' ? 'pt-PT' : 'en-US');
  };

  const handleNotificationClick = async (n: any) => {
    if (!n.read) {
      await markNotificationAsRead(n.id);
    }
    setIsOpen(false);

    let targetTab = '';
    let payload: any = undefined;

    const id = n.id || '';
    const type = n.type || '';
    const title = (n.title || '').toLowerCase();

    if (id.startsWith('notif_msg_') || title.includes('mensagem') || title.includes('message') || title.includes('💬')) {
      targetTab = 'Mensagens';
      if (id.startsWith('notif_msg_')) {
        const parts = id.split('_');
        if (parts.length > 2) {
          payload = { chatId: parts[2] };
        }
      }
    } else if (id.startsWith('notif_occurrence_') || title.includes('ocorrência') || title.includes('incident') || title.includes('⚠️')) {
      targetTab = 'Logística';
    } else if (id.startsWith('notif_featured_carrier_') || title.includes('transportadora') || title.includes('carrier') || title.includes('🏆')) {
      targetTab = 'Logística';
    } else if (id.startsWith('notif_promo_product_') || type === 'promotion') {
      targetTab = 'Produtos / Materiais';
    } else if (id.startsWith('notif_new_supplier_') || type === 'supplier') {
      targetTab = 'Fornecedores';
    } else if (type === 'quote_request' || title.includes('cotação') || title.includes('quote') || title.includes('pedido') || title.includes('order')) {
      targetTab = 'Pedidos / Cotações';
      if (n.metadata?.requestId) {
        payload = { requestId: n.metadata.requestId };
      }
    }

    if (targetTab) {
      const event = new CustomEvent('navigate-to-tab', { detail: { tab: targetTab, payload } });
      window.dispatchEvent(event);
    }
  };

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'promotion': return <Tag className="w-5 h-5" />;
      case 'quote_request': return <FileText className="w-5 h-5" />;
      case 'order': return <Clock className="w-5 h-5" />;
      case 'supplier': return <MapPin className="w-5 h-5" />;
      case 'system': return <AlertCircle className="w-5 h-5" />;
      default: return <Info className="w-5 h-5" />;
    }
  };

  const getColorClass = (type: string) => {
    switch (type) {
      case 'promotion': return 'bg-amber-500/10 text-amber-500';
      case 'quote_request': return 'bg-supplyx-blue/10 text-supplyx-blue';
      case 'order': return 'bg-violet-500/10 text-violet-500';
      case 'supplier': return 'bg-emerald-500/10 text-emerald-500';
      case 'system': return 'bg-rose-500/10 text-rose-500';
      default: return 'bg-blue-500/10 text-blue-500';
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={toggleOpen}
        className={`w-12 h-12 flex items-center justify-center rounded-2xl border transition-all relative group shadow-xl ${
          isDarkMode ? 'bg-supplyx-dark border-white/5 text-zinc-400 hover:text-white' : 'bg-white border-zinc-200 text-zinc-500 hover:text-zinc-900'
        }`}
      >
        <Bell className={`w-5 h-5 transition-colors ${totalUnread > 0 ? 'text-red-500 animate-pulse' : ''}`} />
        {totalUnread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 animate-bounce shadow-lg shadow-red-500/30 border-supplyx-deep">
            {totalUnread}
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
              <div className={`p-6 border-b flex justify-between items-center ${isDarkMode ? 'border-white/5 bg-white/5' : 'border-zinc-100 bg-zinc-50/50'}`}>
                <h3 className={`font-black uppercase italic tracking-[0.2em] text-[11px] ${isDarkMode ? 'text-supplyx-blue' : 'text-zinc-900'}`}>
                  {t.title}
                </h3>
                <div className="flex items-center gap-4">
                  {totalUnread > 0 && (
                    <button 
                      onClick={() => markAllNotificationsAsRead()}
                      className={`text-[10px] font-black uppercase transition-colors flex items-center gap-1 ${
                        isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                      title={t.markRead}
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{t.markRead}</span>
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button 
                      onClick={() => deleteAllNotifications()}
                      className={`text-[10px] font-black uppercase transition-colors flex items-center gap-1 ${
                        isDarkMode ? 'text-rose-400 hover:text-rose-300' : 'text-rose-600 hover:text-rose-700'
                      }`}
                      title={t.clearAll}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{t.clearAll}</span>
                    </button>
                  )}
                </div>
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
                  <div className={`divide-y ${isDarkMode ? 'divide-white/5' : 'divide-zinc-200'}`}>
                    {notifications.map((n) => (
                      <div 
                        key={n.id} 
                        onClick={() => handleNotificationClick(n)}
                        className={`p-6 flex gap-6 transition-all relative group cursor-pointer ${
                          !n.read 
                            ? (isDarkMode ? 'bg-supplyx-blue/5 border-l-2 border-supplyx-blue' : 'bg-blue-50/70 border-l-2 border-supplyx-blue') 
                            : ''
                        } ${isDarkMode ? 'hover:bg-white/[0.02]' : 'hover:bg-zinc-100/60'}`}
                      >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${getColorClass(n.type)}`}>
                          {getIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0 pr-8">
                          <p className={`text-[12px] font-black uppercase italic leading-tight mb-1 ${isDarkMode ? 'text-zinc-100' : 'text-zinc-950 font-extrabold'}`}>
                            {n.title}
                          </p>
                          <p className={`text-[11px] font-semibold leading-relaxed mb-3 line-clamp-2 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-850 font-medium'}`}>
                            {n.message}
                          </p>
                          <span className={`text-[9.5px] font-black uppercase tracking-widest flex items-center gap-2 ${isDarkMode ? 'text-zinc-600' : 'text-zinc-500'}`}>
                             <Clock className="w-3 h-3 text-supplyx-blue" /> {formatTime(n.createdAt)}
                          </span>
                        </div>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-100 sm:opacity-40 sm:group-hover:opacity-100 transition-opacity flex items-center gap-2 z-10">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(n.id);
                            }}
                            className={`p-2 rounded-lg transition-colors ${
                              isDarkMode ? 'hover:bg-rose-500/10 text-zinc-500 hover:text-rose-500' : 'hover:bg-rose-50 text-zinc-500 hover:text-rose-600'
                            }`}
                            title={language === 'PT' ? 'Eliminar' : 'Delete'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
