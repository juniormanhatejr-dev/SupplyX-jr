import { motion, AnimatePresence } from 'motion/react';
import { Bell, Tag, MapPin, CheckCircle2, X, Clock, Info, FileText, AlertCircle, Trash2, CheckCheck, Eye, ChevronRight, Calendar } from 'lucide-react';
import { useState } from 'react';
import { useNotifications, getNotificationRoute } from '../contexts/NotificationContext';

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
  userType?: 'buyer' | 'supplier' | 'logistics';
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
  const [selectedNotificationForDetail, setSelectedNotificationForDetail] = useState<any | null>(null);
  
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

  const formatDate = (createdAt: any) => {
    if (!createdAt) return '';
    const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    return date.toLocaleDateString(language === 'PT' ? 'pt-PT' : 'en-US');
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            key="notif-container"
          >
            <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className={`absolute -right-24 md:right-0 mt-6 w-[320px] sm:w-[420px] rounded-[32px] border z-40 overflow-hidden shadow-3xl origin-top-right glass-dark ${
                isDarkMode ? 'border-white/5' : 'bg-white border-zinc-100'
              }`}
            >
              <div className={`p-6 border-b flex justify-between items-center ${isDarkMode ? 'border-white/5 bg-white/5' : 'border-zinc-50'}`}>
                <h3 className={`font-black uppercase italic tracking-[0.2em] text-[11px] ${isDarkMode ? 'text-supplyx-blue' : 'text-zinc-900'}`}>
                  {t.title}
                </h3>
                <div className="flex items-center gap-4">
                  {totalUnread > 0 && (
                    <button 
                      onClick={() => markAllNotificationsAsRead()}
                      className="text-[10px] font-black uppercase text-zinc-400 hover:text-white transition-colors flex items-center gap-1"
                      title={t.markRead}
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{t.markRead}</span>
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button 
                      onClick={() => deleteAllNotifications()}
                      className="text-[10px] font-black uppercase text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1"
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
                  <div className={`divide-y ${isDarkMode ? 'divide-white/5' : 'divide-zinc-100'}`}>
                    {notifications.map((n) => (
                      <div 
                        key={n.id} 
                        onClick={() => {
                          if (!n.read) markNotificationAsRead(n.id);
                          setSelectedNotificationForDetail(n);
                        }}
                        className={`p-6 flex gap-6 transition-all relative group cursor-pointer ${
                          !n.read ? (isDarkMode ? 'bg-supplyx-blue/5' : 'bg-supplyx-blue/5') : ''
                        } ${isDarkMode ? 'hover:bg-white/[0.02]' : 'hover:bg-zinc-50'}`}
                      >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${getColorClass(n.type)}`}>
                          {getIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0 pr-12">
                          <p className={`text-[12px] font-black uppercase italic leading-tight mb-1 ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
                            {n.title}
                          </p>
                          <p className={`text-[11px] font-medium leading-relaxed mb-3 line-clamp-2 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>
                            {n.message}
                          </p>
                          <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                             <Clock className="w-3 h-3" /> {formatTime(n.createdAt)}
                          </span>
                        </div>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-100 sm:opacity-40 sm:group-hover:opacity-100 transition-opacity flex items-center gap-1.5 z-10">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!n.read) markNotificationAsRead(n.id);
                              setSelectedNotificationForDetail(n);
                            }}
                            className={`p-2 rounded-lg transition-colors ${
                              isDarkMode ? 'hover:bg-supplyx-blue/15 text-zinc-400 hover:text-supplyx-blue' : 'hover:bg-brand/5 text-zinc-500 hover:text-brand'
                            }`}
                            title={language === 'PT' ? 'Ver Detalhes' : 'View Details'}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(n.id);
                            }}
                            className={`p-2 rounded-lg transition-colors ${
                              isDarkMode ? 'hover:bg-rose-500/10 text-zinc-500 hover:text-rose-500' : 'hover:bg-rose-50 text-zinc-400 hover:text-rose-500'
                            }`}
                            title={language === 'PT' ? 'Eliminar' : 'Delete'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Detailed Notification Modal */}
      <AnimatePresence>
        {selectedNotificationForDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedNotificationForDetail(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`w-full max-w-xl rounded-[32px] border p-8 relative overflow-hidden shadow-3xl z-[60] text-left ${
                isDarkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-white border-zinc-200 text-zinc-900'
              }`}
            >
              {/* Top Row with Type Icon */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${getColorClass(selectedNotificationForDetail.type)}`}>
                    {getIcon(selectedNotificationForDetail.type)}
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 font-mono">
                      {selectedNotificationForDetail.type === 'promotion' ? (language === 'PT' ? 'PROMOÇÃO' : 'PROMOTION') :
                       selectedNotificationForDetail.type === 'quote_request' ? (language === 'PT' ? 'COTAÇÃO' : 'QUOTE REQUEST') :
                       selectedNotificationForDetail.type === 'order' ? (language === 'PT' ? 'PEDIDO' : 'ORDER') :
                       selectedNotificationForDetail.type === 'supplier' ? (language === 'PT' ? 'FORNECEDOR' : 'SUPPLIER') :
                       selectedNotificationForDetail.type === 'system' ? (language === 'PT' ? 'SISTEMA' : 'SYSTEM') :
                       (language === 'PT' ? 'STOCK / ALERTA' : 'STOCK / ALERT')}
                    </span>
                    <h3 className="text-xl font-black uppercase italic tracking-tighter mt-1">
                      {selectedNotificationForDetail.title}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNotificationForDetail(null)}
                  className={`p-2 rounded-xl transition-all ${
                    isDarkMode ? 'hover:bg-white/10 text-zinc-400 hover:text-white' : 'hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Priority & Timing */}
              <div className="flex flex-wrap gap-3 items-center mb-6 py-3 border-y border-zinc-800/10">
                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                  selectedNotificationForDetail.priority === 'high' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                  selectedNotificationForDetail.priority === 'medium' ? 'bg-amber-500/10 text-amber-500 border-amber-500/10' :
                  'bg-zinc-500/10 text-zinc-400 border-zinc-500/10'
                }`}>
                  {language === 'PT' ? 'Prioridade' : 'Priority'}: {selectedNotificationForDetail.priority || 'medium'}
                </div>
                <div className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.1em] flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5 text-supplyx-blue" />
                  {formatTime(selectedNotificationForDetail.createdAt)}
                </div>
                <div className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.1em] flex items-center gap-1 font-mono">
                  <Calendar className="w-3.5 h-3.5 text-supplyx-blue" />
                  {formatDate(selectedNotificationForDetail.createdAt)}
                </div>
              </div>

              {/* Message Body */}
              <div className="mb-8">
                <p className={`text-base font-medium leading-relaxed font-sans ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>
                  {selectedNotificationForDetail.message}
                </p>
              </div>

              {/* Call to Actions */}
              <div className="flex flex-wrap gap-4 justify-end pt-4 border-t border-zinc-800/10">
                <button
                  onClick={() => setSelectedNotificationForDetail(null)}
                  className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                    isDarkMode ? 'bg-zinc-900 border-white/5 text-zinc-400 hover:text-white' : 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200'
                  }`}
                >
                  {language === 'PT' ? 'Fechar' : 'Close'}
                </button>

                {(() => {
                  const route = getNotificationRoute(selectedNotificationForDetail);
                  return (
                    <button
                      onClick={() => {
                        setSelectedNotificationForDetail(null);
                        setIsOpen(false);
                        window.dispatchEvent(new CustomEvent('navigate-app', { 
                          detail: { tab: route.tab, payload: route.payload } 
                        }));
                      }}
                      className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-supplyx-blue text-white shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                    >
                      <span>{language === 'PT' ? 'Ir para página correspondente' : 'Navigate corresponding page'}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  );
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
