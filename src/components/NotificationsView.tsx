import { motion } from 'motion/react';
import { Bell, Tag, MapPin, CheckCircle2, X, Clock, Calendar, Gift, Info, FileText, AlertCircle, Trash2, CheckCheck } from 'lucide-react';
import { useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';

interface Notification {
  id: string;
  type: 'promotion' | 'supplier' | 'system' | 'order' | 'rfq' | 'stock';
  titlePT: string;
  titleEN: string;
  descPT: string;
  descEN: string;
  time: string;
  date: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  userType?: 'buyer' | 'supplier' | 'both';
}

interface NotificationsViewProps {
  isDarkMode: boolean;
  language: 'PT' | 'EN';
  userType?: 'buyer' | 'supplier' | 'logistics';
}

export default function NotificationsView({ isDarkMode, language, userType }: NotificationsViewProps) {
  const { 
    notifications, 
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    deleteAllNotifications
  } = useNotifications();

  const t = {
    PT: {
      title: 'Centro de Notificações',
      subtitle: 'Fique por dentro das últimas promoções e atualizações do mercado.',
      empty: 'Sua caixa de entrada está vazia.',
      markRead: 'Marcar como lida',
      markAllRead: 'Marcar todas como lidas',
      delete: 'Excluir',
      deleteAll: 'Limpar tudo',
      priority: 'Prioridade',
      new: 'NOVO',
      justNow: 'Agora',
      ago: 'atrás',
      priorities: {
        high: 'ALTA',
        medium: 'MÉDIA',
        low: 'BAIXA'
      }
    },
    EN: {
      title: 'Notification Center',
      subtitle: 'Stay updated with the latest market promotions and updates.',
      empty: 'Your inbox is empty.',
      markRead: 'Mark as read',
      markAllRead: 'Mark all as read',
      delete: 'Delete',
      deleteAll: 'Delete all',
      priority: 'Priority',
      new: 'NEW',
      justNow: 'Just now',
      ago: 'ago',
      priorities: {
        high: 'HIGH',
        medium: 'MEDIUM',
        low: 'LOW'
      }
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

  const getIcon = (type: string) => {
    switch (type) {
      case 'promotion': return <Gift className="w-6 h-6" />;
      case 'quote_request': return <FileText className="w-6 h-6" />;
      case 'order': return <Clock className="w-6 h-6" />;
      case 'supplier': return <MapPin className="w-6 h-6" />;
      case 'system': return <AlertCircle className="w-6 h-6" />;
      default: return <Info className="w-6 h-6" />;
    }
  };

  const getColorClass = (type: string) => {
    switch (type) {
      case 'promotion': return 'bg-amber-500/10 text-amber-500 shadow-amber-500/10';
      case 'quote_request': return 'bg-supplyx-blue/10 text-supplyx-blue shadow-blue-500/10';
      case 'order': return 'bg-violet-500/10 text-violet-500 shadow-violet-500/10';
      case 'supplier': return 'bg-emerald-500/10 text-emerald-500 shadow-emerald-500/10';
      case 'system': return 'bg-rose-500/10 text-rose-500 shadow-rose-500/10';
      default: return 'bg-blue-500/10 text-blue-500 shadow-blue-500/10';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-7xl mx-auto space-y-12"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5 pb-12">
        <div>
          <h2 className={`text-4xl font-black italic uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
            {t.title}
          </h2>
          <p className="text-zinc-500 text-[11px] font-black uppercase tracking-[0.2em] mt-2">{t.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {notifications.some(n => !n.read) && (
            <button 
              onClick={() => markAllNotificationsAsRead()}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-lg border ${
                isDarkMode 
                  ? 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/5' 
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-200'
              }`}
            >
              <CheckCheck className="w-4 h-4 text-supplyx-blue" />
              {t.markAllRead}
            </button>
          )}
          {notifications.length > 0 && (
            <button 
              onClick={() => deleteAllNotifications()}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-lg border ${
                isDarkMode 
                  ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/10' 
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-100'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              {t.deleteAll}
            </button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {notifications.length === 0 ? (
          <div className={`p-32 text-center rounded-[64px] border-2 border-dashed ${isDarkMode ? 'border-white/5 bg-white/5' : 'border-zinc-100'}`}>
            <div className="w-24 h-24 rounded-[32px] bg-supplyx-blue/10 flex items-center justify-center mx-auto mb-8">
              <CheckCircle2 className="w-12 h-12 text-supplyx-blue" />
            </div>
            <p className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.3em]">{t.empty}</p>
          </div>
        ) : (
          notifications.map((n) => (
            <motion.div 
              layout
              key={n.id}
              className={`p-10 rounded-[48px] border transition-all relative group overflow-hidden ${
                isDarkMode 
                  ? `${n.read ? 'bg-supplyx-dark border-white/5 shadow-3xl' : 'bg-supplyx-dark border-supplyx-blue shadow-2xl shadow-blue-500/10'}` 
                  : `${n.read ? 'bg-white border-zinc-100' : 'bg-brand/5 border-brand/20 shadow-xl shadow-zinc-200/20'}`
              }`}
            >
              {!n.read && (
                <div className="absolute top-0 right-0 w-32 h-32 overflow-hidden pointer-events-none">
                  <div className="absolute top-6 right-[-40px] w-48 py-2 bg-supplyx-blue text-white text-[9px] font-black uppercase tracking-[0.3em] transform rotate-45 flex items-center justify-center shadow-2xl">
                    {t.new}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-10">
                <div className={`w-20 h-20 rounded-[32px] shrink-0 flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-2xl ${
                  isDarkMode ? 'bg-supplyx-deep shadow-black' : 'bg-zinc-50 focus:bg-zinc-100'
                }`}>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${getColorClass(n.type)} shadow-inner`}>
                    {getIcon(n.type)}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    <h3 className={`text-xl font-black uppercase italic tracking-tight ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
                      {n.title}
                    </h3>
                    <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border ${
                      n.priority === 'high' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                      n.priority === 'medium' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-zinc-500/10 text-zinc-500 border-white/5'
                    }`}>
                      {t.priority}: {t.priorities[n.priority || 'medium']}
                    </div>
                  </div>

                  <p className={`text-base font-medium leading-relaxed mb-10 max-w-2xl ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    {n.message}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-6 pointer-events-auto">
                    <div className="flex items-center gap-6 text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">
                       <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-supplyx-blue" /> {formatTime(n.createdAt)}</span>
                       <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {formatDate(n.createdAt)}</span>
                    </div>

                    <div className="flex items-center gap-4">
                      {!n.read && (
                        <button 
                          onClick={() => markNotificationAsRead(n.id)}
                          className="px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-supplyx-blue text-white shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"
                        >
                          {t.markRead}
                        </button>
                      )}
                      <button 
                        onClick={() => deleteNotification(n.id)}
                        className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all hover:scale-105 active:scale-95 flex items-center gap-2 ${
                          isDarkMode 
                            ? 'bg-rose-500/5 border-rose-500/20 text-rose-400 hover:bg-rose-500/10' 
                            : 'bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-100'
                        }`}
                        title={t.delete}
                      >
                        <Trash2 className="w-4 h-4" />
                        {t.delete}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
