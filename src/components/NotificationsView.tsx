import { motion, AnimatePresence } from 'motion/react';
import { Bell, Tag, MapPin, CheckCircle2, X, Clock, Calendar, Gift, Info, FileText, AlertCircle, Trash2, CheckCheck, Eye, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useNotifications, getNotificationRoute } from '../contexts/NotificationContext';

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

  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedNotifIds, setSelectedNotifIds] = useState<string[]>([]);
  const [selectedNotificationForDetail, setSelectedNotificationForDetail] = useState<any | null>(null);

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
      bulkActions: 'Ações em Massa',
      cancelSelection: 'Cancelar Seleção',
      selectAll: 'Selecionar Todas',
      deselectAll: 'Desmarcar Todas',
      deleteBtnSelected: 'Eliminar Selecionados',
      markAsReadSelected: 'Marcar Selecionados Lidas',
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
      bulkActions: 'Bulk Actions',
      cancelSelection: 'Cancel Selection',
      selectAll: 'Select All',
      deselectAll: 'Deselect All',
      deleteBtnSelected: 'Delete Selected',
      markAsReadSelected: 'Mark Selected Read',
      priorities: {
        high: 'HIGH',
        medium: 'MEDIUM',
        low: 'LOW'
      }
    }
  }[language];

  const handleBulkDeleteSelected = async () => {
    if (selectedNotifIds.length === 0) return;
    try {
      const promises = selectedNotifIds.map(id => deleteNotification(id));
      await Promise.all(promises);
      setSelectedNotifIds([]);
      setIsMultiSelectMode(false);
    } catch (err) {
      console.error('[NotificationsView] Error bulk deleting selected:', err);
    }
  };

  const handleBulkMarkReadSelected = async () => {
    if (selectedNotifIds.length === 0) return;
    try {
      const promises = selectedNotifIds.map(id => markNotificationAsRead(id));
      await Promise.all(promises);
      setSelectedNotifIds([]);
      setIsMultiSelectMode(false);
    } catch (err) {
      console.error('[NotificationsView] Error bulk marking read selected:', err);
    }
  };

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
          {/* Multi-Select Toggle Button */}
          {notifications.length > 0 && (
            <button
              onClick={() => {
                setIsMultiSelectMode(!isMultiSelectMode);
                setSelectedNotifIds([]);
              }}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-lg border ${
                isMultiSelectMode
                  ? 'bg-supplyx-blue text-white border-supplyx-blue'
                  : isDarkMode
                    ? 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/5'
                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-200'
              }`}
            >
              {isMultiSelectMode ? t.cancelSelection : t.bulkActions}
            </button>
          )}

          {isMultiSelectMode ? (
            <>
              <button
                onClick={() => setSelectedNotifIds(notifications.map(n => n.id))}
                className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all border ${
                  isDarkMode ? 'bg-zinc-900 text-zinc-300 border-white/5' : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                }`}
              >
                {t.selectAll}
              </button>
              <button
                onClick={() => setSelectedNotifIds([])}
                className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all border ${
                  isDarkMode ? 'bg-zinc-900 text-zinc-300 border-white/5' : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                }`}
              >
                {t.deselectAll}
              </button>

              {selectedNotifIds.length > 0 && (
                <>
                  <button
                    onClick={handleBulkMarkReadSelected}
                    className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/10"
                  >
                    <CheckCheck className="w-4 h-4 text-emerald-400" />
                    {t.markAsReadSelected} ({selectedNotifIds.length})
                  </button>
                  <button
                    onClick={handleBulkDeleteSelected}
                    className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t.deleteBtnSelected} ({selectedNotifIds.length})
                  </button>
                </>
              )}
            </>
          ) : (
            <>
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
            </>
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
          notifications.map((n) => {
            const isSelected = selectedNotifIds.includes(n.id);
            return (
              <motion.div 
                layout
                key={n.id}
                onClick={() => {
                  if (isMultiSelectMode) {
                    if (isSelected) {
                      setSelectedNotifIds(selectedNotifIds.filter(id => id !== n.id));
                    } else {
                      setSelectedNotifIds([...selectedNotifIds, n.id]);
                    }
                    return;
                  }
                  if (!n.read) markNotificationAsRead(n.id);
                  setSelectedNotificationForDetail(n);
                }}
                className={`p-10 rounded-[48px] border transition-all relative group overflow-hidden cursor-pointer flex gap-6 items-center ${
                  isDarkMode 
                    ? `${isSelected ? 'bg-supplyx-blue/10 border-supplyx-blue shadow-2xl' : n.read ? 'bg-supplyx-dark border-white/5 shadow-3xl' : 'bg-supplyx-dark border-supplyx-blue shadow-2xl shadow-blue-500/10'}` 
                    : `${isSelected ? 'bg-brand/10 border-brand/50 shadow-xl' : n.read ? 'bg-white border-zinc-100' : 'bg-brand/5 border-brand/20 shadow-xl shadow-zinc-200/20'}`
                }`}
              >
                {isMultiSelectMode && (
                  <div className="flex items-center justify-center pr-2 shrink-0 pointer-events-none">
                    <div className={`w-8 h-8 rounded-2xl border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-supplyx-blue border-supplyx-blue text-white'
                        : isDarkMode ? 'border-white/10 bg-black/20' : 'border-zinc-300 bg-white'
                    }`}>
                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      )}
                    </div>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  {!n.read && !isMultiSelectMode && (
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

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-4 mb-4">
                        <h3 className={`text-xl font-black uppercase italic tracking-tight truncate ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
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

                        {!isMultiSelectMode && (
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!n.read) markNotificationAsRead(n.id);
                                setSelectedNotificationForDetail(n);
                              }}
                              className="px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-supplyx-blue/10 hover:bg-supplyx-blue/20 text-supplyx-blue hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                              title={language === 'PT' ? 'Ver em Detalhes' : 'View Details'}
                            >
                              <Eye className="w-4 h-4" />
                              {language === 'PT' ? 'Ver Detalhes' : 'View Details'}
                            </button>

                            {!n.read && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markNotificationAsRead(n.id);
                                }}
                                className="px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:scale-105 active:scale-95 transition-all"
                              >
                                {t.markRead}
                              </button>
                            )}
                            <button 
                              onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(n.id);
                              }}
                              className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all hover:scale-105 active:scale-95 flex items-center gap-2 ${
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
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Notification Details Modal */}
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
              className={`w-full max-w-xl rounded-[32px] border p-8 relative overflow-hidden shadow-3xl z-10 ${
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
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
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
                  {language === 'PT' ? 'Prioridade' : 'Priority'}: {t.priorities[selectedNotificationForDetail.priority || 'medium']}
                </div>
                <div className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.1em] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-supplyx-blue" />
                  {formatTime(selectedNotificationForDetail.createdAt)}
                </div>
                <div className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.1em] flex items-center gap-1">
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
    </motion.div>
  );
}
