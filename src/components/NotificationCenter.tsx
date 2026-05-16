import { motion, AnimatePresence } from 'motion/react';
import { Bell, Tag, MapPin, CheckCircle2, X, Clock, Info, FileText } from 'lucide-react';
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
  const { unreadNotifications, notifications, markNotificationAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  
  const totalUnread = unreadNotifications;

  const t = {
    PT: {
      title: 'Notificações',
      markRead: 'Lidas',
      empty: 'Sem novas atualizações',
      viewAll: 'Ver Todas as Notificações',
      justNow: 'Agora',
      ago: 'atrás'
    },
    EN: {
      title: 'Notifications',
      markRead: 'Read',
      empty: 'No new updates',
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

  const markAllAsRead = async () => {
    for (const n of notifications) {
      if (!n.read) await markNotificationAsRead(n.id);
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
      default: return <Info className="w-5 h-5" />;
    }
  };

  const getColorClass = (type: string) => {
    switch (type) {
      case 'promotion': return 'bg-amber-500/10 text-amber-500';
      case 'quote_request': return 'bg-supplyx-blue/10 text-supplyx-blue';
      case 'order': return 'bg-violet-500/10 text-violet-500';
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
        <Bell className={`w-5 h-5 transition-colors ${totalUnread > 0 ? 'text-supplyx-blue' : ''}`} />
        {totalUnread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-supplyx-blue text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-supplyx-deep">
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
              <div className={`p-8 border-b flex justify-between items-center ${isDarkMode ? 'border-white/5 bg-white/5' : 'border-zinc-50'}`}>
                <h3 className={`font-black uppercase italic tracking-[0.2em] text-[11px] ${isDarkMode ? 'text-supplyx-blue' : 'text-zinc-900'}`}>
                  {t.title}
                </h3>
                {totalUnread > 0 && (
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
                  <div className={`divide-y ${isDarkMode ? 'divide-white/5' : 'divide-zinc-100'}`}>
                    {notifications.map((n) => (
                      <div 
                        key={n.id} 
                        onClick={() => !n.read && markNotificationAsRead(n.id)}
                        className={`p-6 flex gap-6 transition-all relative group cursor-pointer ${
                          !n.read ? (isDarkMode ? 'bg-supplyx-blue/5' : 'bg-supplyx-blue/5') : ''
                        } ${isDarkMode ? 'hover:bg-white/[0.02]' : 'hover:bg-zinc-50'}`}
                      >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${getColorClass(n.type)}`}>
                          {getIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0">
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
