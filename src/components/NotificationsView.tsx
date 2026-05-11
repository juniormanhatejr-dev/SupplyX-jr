import { motion } from 'motion/react';
import { Bell, Tag, MapPin, CheckCircle2, X, Clock, Calendar, Gift, Info } from 'lucide-react';
import { useState } from 'react';

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

const mockNotifications: Notification[] = [
  // Buyer Notifications
  {
    id: '1',
    type: 'promotion',
    titlePT: 'Promoção: Cimento CP-II',
    titleEN: 'Promo: Cement CP-II',
    descPT: 'Desconto de 15% para pedidos acima de 500 sacos na Maputo Sul. Entre em contato com a Votorantim para garantir o preço.',
    descEN: '15% discount for orders over 500 bags in Maputo South. Contact Votorantim to lock in the price.',
    time: '2h ago',
    date: '2024-05-05',
    isRead: false,
    priority: 'high',
    userType: 'buyer'
  },
  {
    id: 'b2',
    type: 'order',
    titlePT: 'Pedido #OC-2401 Entregue',
    titleEN: 'Order #OC-2401 Delivered',
    descPT: 'O seu pedido de cimento foi entregue com sucesso no estaleiro de Boane.',
    descEN: 'Your cement order has been successfully delivered to the Boane site.',
    time: '4h ago',
    date: '2024-05-05',
    isRead: false,
    priority: 'medium',
    userType: 'buyer'
  },
  {
    id: '2',
    type: 'supplier',
    titlePT: 'Novo Fornecedor Próximo',
    titleEN: 'New Nearby Supplier',
    descPT: 'Ferragens Matola iniciou operações a 5km da sua localização. Especialistas em acabamentos finos e hidráulica.',
    descEN: 'Matola Hardware started operations 5km from your location. Specialists in fine finishes and hydraulics.',
    time: '5h ago',
    date: '2024-05-05',
    isRead: false,
    priority: 'medium',
    userType: 'buyer'
  },
  // Supplier Notifications
  {
    id: 's1',
    type: 'rfq',
    titlePT: 'Nova Cotação Solicitada',
    titleEN: 'New RFQ Requested',
    descPT: 'A Construtora Manhate solicitou cotação para 1000 tijolos cerâmicos. Responda agora para ganhar o contrato.',
    descEN: 'Manhate Construction requested a quote for 1000 ceramic bricks. Respond now to win the contract.',
    time: '30m ago',
    date: '2024-05-05',
    isRead: false,
    priority: 'high',
    userType: 'supplier'
  },
  {
    id: 's2',
    type: 'stock',
    titlePT: 'Alerta de Stock Baixo',
    titleEN: 'Low Stock Alert',
    descPT: 'O seu stock de Vergalhão de 12mm está abaixo do limite de segurança (50 unidades restantes).',
    descEN: 'Your 12mm Rebar stock is below the safety limit (50 units remaining).',
    time: '3h ago',
    date: '2024-05-05',
    isRead: false,
    priority: 'medium',
    userType: 'supplier'
  },
  {
    id: 's3',
    type: 'order',
    titlePT: 'Novo Pedido Recebido',
    titleEN: 'New Order Received',
    descPT: 'Você recebeu um novo pedido de "Acabamentos Elite" para o projeto Aeroporto.',
    descEN: 'You received a new order from "Elite Finishes" for the Airport project.',
    time: '6h ago',
    date: '2024-05-05',
    isRead: true,
    priority: 'high',
    userType: 'supplier'
  },
  // Both
  {
    id: '4',
    type: 'system',
    titlePT: 'Manutenção do Sistema',
    titleEN: 'System Maintenance',
    descPT: 'O SupplyX passará por uma atualização programada hoje à meia-noite por 15 minutes.',
    descEN: 'SupplyX will undergo scheduled maintenance today at midnight for 15 minutes.',
    time: '2d ago',
    date: '2024-05-03',
    isRead: true,
    priority: 'low',
    userType: 'both'
  }
];

interface NotificationsViewProps {
  isDarkMode: boolean;
  language: 'PT' | 'EN';
  userType?: 'buyer' | 'supplier';
}

export default function NotificationsView({ isDarkMode, language, userType }: NotificationsViewProps) {
  const filtered = mockNotifications.filter(n => n.userType === 'both' || n.userType === userType);
  const [notifications, setNotifications] = useState(filtered);

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const t = {
    PT: {
      title: 'Centro de Notificações',
      subtitle: 'Fique por dentro das últimas promoções e atualizações do mercado.',
      clearAll: 'Limpar Tudo',
      empty: 'Sua caixa de entrada está vazia.',
      markRead: 'Marcar como lida',
      delete: 'Excluir',
      priority: 'Prioridade',
      new: 'NOVO',
      priorities: {
        high: 'ALTA',
        medium: 'MÉDIA',
        low: 'BAIXA'
      }
    },
    EN: {
      title: 'Notification Center',
      subtitle: 'Stay updated with the latest market promotions and updates.',
      clearAll: 'Clear All',
      empty: 'Your inbox is empty.',
      markRead: 'Mark as read',
      delete: 'Delete',
      priority: 'Priority',
      new: 'NEW',
      priorities: {
        high: 'HIGH',
        medium: 'MEDIUM',
        low: 'LOW'
      }
    }
  }[language];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-12"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5 pb-12">
        <div>
          <h2 className={`text-4xl font-black italic uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
            {t.title}
          </h2>
          <p className="text-zinc-500 text-[11px] font-black uppercase tracking-[0.2em] mt-2">{t.subtitle}</p>
        </div>
        <button 
          onClick={() => setNotifications([])}
          className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${
            isDarkMode ? 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10' : 'bg-zinc-100 text-zinc-500 hover:text-zinc-900'
          }`}
        >
          {t.clearAll}
        </button>
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
                  ? `${n.isRead ? 'bg-supplyx-dark border-white/5 shadow-3xl' : 'bg-supplyx-dark border-supplyx-blue shadow-2xl shadow-blue-500/10'}` 
                  : `${n.isRead ? 'bg-white border-zinc-100' : 'bg-brand/5 border-brand/20 shadow-xl shadow-zinc-200/20'}`
              }`}
            >
              {!n.isRead && (
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
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    n.type === 'promotion' ? 'bg-amber-500/10 text-amber-500 shadow-amber-500/10' : 
                    n.type === 'supplier' ? 'bg-emerald-500/10 text-emerald-500 shadow-emerald-500/10' : 
                    n.type === 'rfq' ? 'bg-supplyx-blue/10 text-supplyx-blue shadow-blue-500/10' :
                    n.type === 'stock' ? 'bg-rose-500/10 text-rose-500 shadow-rose-500/10' :
                    n.type === 'order' ? 'bg-violet-500/10 text-violet-500 shadow-violet-500/10' : 'bg-blue-500/10 text-blue-500 shadow-blue-500/10'
                  } shadow-inner`}>
                    {n.type === 'promotion' ? <Gift className="w-6 h-6" /> : 
                     n.type === 'supplier' ? <MapPin className="w-6 h-6" /> : 
                     n.type === 'rfq' ? <Info className="w-6 h-6" /> :
                     n.type === 'stock' ? <CheckCircle2 className="w-6 h-6" /> :
                     n.type === 'order' ? <Clock className="w-6 h-6" /> : <Info className="w-6 h-6" />}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    <h3 className={`text-xl font-black uppercase italic tracking-tight ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
                      {language === 'PT' ? n.titlePT : n.titleEN}
                    </h3>
                    <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border ${
                      n.priority === 'high' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                      n.priority === 'medium' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-zinc-500/10 text-zinc-500 border-white/5'
                    }`}>
                      {t.priority}: {t.priorities[n.priority]}
                    </div>
                  </div>

                  <p className={`text-base font-medium leading-relaxed mb-10 max-w-2xl ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    {language === 'PT' ? n.descPT : n.descEN}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-6 pointer-events-auto">
                    <div className="flex items-center gap-6 text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">
                       <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-supplyx-blue" /> {n.time}</span>
                       <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {n.date}</span>
                    </div>

                    <div className="flex items-center gap-4">
                      {!n.isRead && (
                        <button 
                          onClick={() => markAsRead(n.id)}
                          className="px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-supplyx-blue text-white shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"
                        >
                          {t.markRead}
                        </button>
                      )}
                      <button 
                        onClick={() => deleteNotification(n.id)}
                        className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all ${
                          isDarkMode ? 'bg-white/5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/5' : 'text-zinc-400 hover:text-rose-500 hover:bg-rose-50'
                        }`}
                      >
                        <X className="w-5 h-5" />
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
