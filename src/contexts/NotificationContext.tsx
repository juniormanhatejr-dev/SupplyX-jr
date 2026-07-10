import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit, doc, getDoc, setDoc, getDocs, serverTimestamp, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Bell, X } from 'lucide-react';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  permission: NotificationPermission;
  requestPermission: () => Promise<void>;
  unreadMessages: number;
  unreadNotifications: number;
  totalUnread: number;
  notifications: any[];
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const getNotificationRoute = (n: any) => {
  const type = (n.type || '').toLowerCase();
  const title = (n.title || '').toLowerCase();
  const message = (n.message || '').toLowerCase();
  
  // 1. If it's a message or chat notification
  if (n.chatId || title.includes('mensagem') || title.includes('message') || type === 'msg' || title.includes('💬')) {
    return {
      tab: 'Mensagens',
      payload: n.chatId ? { chatId: n.chatId } : undefined
    };
  }

  // 2. If it is high efficiency carrier / logistics / occurrences / incidents
  if (
    type === 'logistics' || 
    title.includes('ocorrência') || 
    title.includes('incident') || 
    title.includes('transportadora') || 
    title.includes('carrier') || 
    message.includes('cargo') || 
    message.includes('delivery') || 
    message.includes('entrega') || 
    message.includes('logística') || 
    title.includes('⚠️') || 
    title.includes('🏆')
  ) {
    return {
      tab: 'Logística',
      payload: { subTab: 'requests_list' }
    };
  }

  // 3. If it's quote / quote_request / rfq / orders
  if (
    type === 'rfq' || 
    type === 'quote_request' || 
    type === 'order' || 
    type === 'quote' || 
    title.includes('cotação') || 
    title.includes('pedido') || 
    title.includes('quote') || 
    title.includes('rfq') || 
    message.includes('cotação') || 
    message.includes('pedido')
  ) {
    return {
      tab: 'Pedidos / Cotações',
      payload: undefined
    };
  }

  // 4. If supplier
  if (type === 'supplier' || title.includes('fornecedor') || title.includes('supplier')) {
    return {
      tab: 'Fornecedores',
      payload: undefined
    };
  }

  // 5. If sale / promotion / product
  if (type === 'promotion' || title.includes('promoção') || title.includes('promo') || title.includes('sale') || title.includes('⚡')) {
    return {
      tab: 'Produtos / Materiais',
      payload: undefined
    };
  }

  // Default to Dashboard
  return {
    tab: 'Dashboard',
    payload: undefined
  };
};

export const NotificationProvider: React.FC<{ children: React.ReactNode; isDarkMode?: boolean; language?: 'PT' | 'EN' }> = ({ children, isDarkMode: initialIsDarkMode = true, language: initialLanguage = 'PT' }) => {
  const { user, profile } = useAuth();
  
  const [currentLanguage, setCurrentLanguage] = useState<'PT' | 'EN'>('PT');
  const [currentTheme, setCurrentTheme] = useState<boolean>(true);

  useEffect(() => {
    const handleStorageChange = () => {
      const savedLang = localStorage.getItem('supplyx_language');
      if (savedLang === 'PT' || savedLang === 'EN') {
        setCurrentLanguage(savedLang);
      } else {
        setCurrentLanguage(initialLanguage);
      }
      const savedTheme = localStorage.getItem('supplyx_theme');
      setCurrentTheme(savedTheme !== 'light');
    };

    handleStorageChange(); // sync on mount
    
    window.addEventListener('language-changed', handleStorageChange);
    window.addEventListener('theme-changed', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('language-changed', handleStorageChange);
      window.removeEventListener('theme-changed', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [initialLanguage, initialIsDarkMode]);

  const language = currentLanguage;
  const isDarkMode = currentTheme;

  const [permission, setPermission] = useState<NotificationPermission>(
    (typeof window !== 'undefined' && typeof Notification !== 'undefined') ? Notification.permission : 'default'
  );
  const [activeNotification, setActiveNotification] = useState<{ title: string; body: string; chatId?: string } | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Hidden audio element for notification sound
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
  }, []);

  const requestPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
    }
  };

  useEffect(() => {
    if (!user) return;

    const currentUserId = user.uid;
    const userRole = profile?.type;
    
    // Automatic system alerts constructor to populate Firestore notifications specifically for currentUserId
    const syncRealtimeAlerts = async () => {
      try {
        // 1. Check for suppliers - ONLY for buyers
        if (userRole === 'buyer') {
          const qSuppliers = query(collection(db, 'users'), where('type', '==', 'supplier'));
          const suppliersSnap = await getDocs(qSuppliers);
          for (const sDoc of suppliersSnap.docs) {
            const supplier = sDoc.data();
            const supplierId = sDoc.id;
            const notifId = `notif_new_supplier_${supplierId}_for_${currentUserId}`;
            
            const notifDocSnap = await getDoc(doc(db, 'notifications', notifId));
            if (!notifDocSnap.exists()) {
              await setDoc(doc(db, 'notifications', notifId), {
                userId: currentUserId,
                title: language === 'PT' ? `🆕 Novo Fornecedor Juntou-se` : `🆕 New Supplier Joined`,
                message: language === 'PT' 
                  ? `O fornecedor ${supplier.name || supplier.companyName || 'Novo Fornecedor'} agora está operando no setor ${supplier.sector || 'Obras'} a partir de ${supplier.city || 'Moçambique'}.`
                  : `Supplier ${supplier.name || supplier.companyName || 'New Supplier'} is now operating in the ${supplier.sector || 'Construction'} sector from ${supplier.city || 'Mozambique'}.`,
                type: 'supplier',
                priority: 'medium',
                read: false,
                createdAt: serverTimestamp()
              });
            }
          }
        }

        // 2. Check for products on sale - ONLY for buyers
        if (userRole === 'buyer') {
          const qProducts = query(collection(db, 'products'), where('onSale', '==', true));
          const productsSnap = await getDocs(qProducts);
          for (const pDoc of productsSnap.docs) {
            const product = pDoc.data();
            const pId = pDoc.id;
            const notifId = `notif_promo_product_${pId}_for_${currentUserId}`;

            const notifDocSnap = await getDoc(doc(db, 'notifications', notifId));
            if (!notifDocSnap.exists()) {
              await setDoc(doc(db, 'notifications', notifId), {
                userId: currentUserId,
                title: language === 'PT' ? `⚡ Promoção Especial: ${product.name}` : `⚡ Special Offer: ${product.name}`,
                message: language === 'PT'
                  ? `Não perca: o produto ${product.name} está em promoção imperdível por apenas MT ${product.salePrice || product.price}!`
                  : `Don't miss out: product ${product.name} is on special sale for just MT ${product.salePrice || product.price}!`,
                type: 'promotion',
                priority: 'high',
                read: false,
                createdAt: serverTimestamp()
              });
            }
          }
        }

        // 3. Check for high efficiency carriers
        const qCarriers = query(collection(db, 'users'), where('type', '==', 'logistics'));
        const carriersSnap = await getDocs(qCarriers);
        for (const cDoc of carriersSnap.docs) {
          const carrier = cDoc.data();
          const carrierId = cDoc.id;
          const rating = parseFloat(carrier.rating) || 0;
          if (rating >= 4.7) {
            const notifId = `notif_featured_carrier_${carrierId}_for_${currentUserId}`;
            const notifDocSnap = await getDoc(doc(db, 'notifications', notifId));
            if (!notifDocSnap.exists()) {
              await setDoc(doc(db, 'notifications', notifId), {
                userId: currentUserId,
                title: language === 'PT' ? `🏆 Transportadora de Alta Eficiência` : `🏆 Highlighted Carrier`,
                message: language === 'PT'
                  ? `${carrier.companyName || carrier.name} foi classificada com classificação estrelada de ★ ${rating.toFixed(1)} e alta pontualidade!`
                  : `${carrier.companyName || carrier.name} has been certified with a high rating of ★ ${rating.toFixed(1)} and exceptional on-time index!`,
                type: 'promotion',
                priority: 'medium',
                read: false,
                createdAt: serverTimestamp()
              });
            }
          }
        }

        // 4. Check for occurrences
        const qOccurrences = query(collection(db, 'occurrences'));
        const occurrencesSnap = await getDocs(qOccurrences);
        for (const oDoc of occurrencesSnap.docs) {
          const occurrence = oDoc.data();
          const occurrenceId = oDoc.id;
          const notifId = `notif_occurrence_${occurrenceId}_for_${currentUserId}`;

          let belongsToUser = false;
          if (occurrence.cargoId) {
            // Check if user owns or is assigned to this cargo
            const cargoDocRef = doc(db, 'freight_orders', occurrence.cargoId);
            const cargoDocSnap = await getDoc(cargoDocRef);
            if (cargoDocSnap.exists()) {
              const cargo = cargoDocSnap.data();
              belongsToUser = 
                cargo.buyerId === currentUserId || 
                cargo.supplierId === currentUserId || 
                cargo.userId === currentUserId ||
                cargo.assignedCarrier === currentUserId;
            } else {
              const qCargo = query(collection(db, 'freight_orders'), where('id', '==', occurrence.cargoId));
              const cargoSnap = await getDocs(qCargo);
              if (!cargoSnap.empty) {
                const cargo = cargoSnap.docs[0].data();
                belongsToUser = 
                  cargo.buyerId === currentUserId || 
                  cargo.supplierId === currentUserId || 
                  cargo.userId === currentUserId ||
                  cargo.assignedCarrier === currentUserId;
              }
            }
          }

          if (!belongsToUser) {
            // Clean up or hide this notification for the user if it was incorrectly created before
            const notifDocSnap = await getDoc(doc(db, 'notifications', notifId));
            if (notifDocSnap.exists() && !notifDocSnap.data().deleted) {
              await setDoc(doc(db, 'notifications', notifId), { deleted: true }, { merge: true });
            }
            continue;
          }

          const notifDocSnap = await getDoc(doc(db, 'notifications', notifId));
          if (!notifDocSnap.exists() || notifDocSnap.data().deleted) {
            await setDoc(doc(db, 'notifications', notifId), {
              userId: currentUserId,
              title: language === 'PT' ? `⚠️ Ocorrência Registada: Cargo ${occurrence.cargoId || occurrence.cargoIdText || 'Geral'}` : `⚠️ Incident Logged: Cargo ${occurrence.cargoId || occurrence.cargoIdText || 'General'}`,
              message: language === 'PT'
                ? `Alerta ativo registado: ${occurrence.description || occurrence.desc} com impacto anunciado [${occurrence.type || 'Atraso operacional'}].`
                : `Active alert logged: ${occurrence.description || occurrence.desc} with announced impact [${occurrence.type || 'Operational delay'}].`,
              type: 'system',
              priority: 'high',
              read: false,
              deleted: false,
              createdAt: serverTimestamp()
            });
          }
        }
      } catch (err) {
        console.warn('Error syncing standard system alerts into notifications:', err);
      }
    };

    // Listen to chats for messages
    console.log('[NotificationContext] Subscribing to chats for user ID:', currentUserId);
    const qChats = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', currentUserId)
    );

    let isInitialLoadChats = true;
    const unsubscribeChats = onSnapshot(qChats, (snapshot) => {
      let count = 0;
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.unreadCount && data.unreadCount[currentUserId] > 0) {
          count += data.unreadCount[currentUserId];
        }
      });
      console.log(`[NotificationContext] Firestore Real-time Chats Snapshot loaded. Active chats count: ${snapshot.docs.length}. Total unread messages count calculated: ${count}`);
      setUnreadMessages(count);

      if (isInitialLoadChats) {
        isInitialLoadChats = false;
      } else {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added' || change.type === 'modified') {
            const chatData = change.doc.data();
            const lastSenderId = chatData.lastMessageSenderId;
            const updatedAt = chatData.updatedAt?.toMillis?.() || Date.now();
            const now = Date.now();

            if (lastSenderId && lastSenderId !== currentUserId && (now - updatedAt < 30000 || !chatData.updatedAt)) {
              const otherParticipantId = chatData.participants.find((id: string) => id !== currentUserId);
              const senderName = chatData.participantNames?.[otherParticipantId] || (language === 'PT' ? 'Nova Mensagem' : 'New Message');
              const body = chatData.lastMessage || '';
              console.log(`[NotificationContext] New messages alerts are completely suppressed. No notification shown/triggered.`);
              
              // No triggerNotification and no Firestore notification log write for chats 
              // strictly matching: "Ao receber uma mensagem nova o app não deve dar notificação dessa mensagem."
            }
          }
        });
      }
    }, (error) => {
      console.error("[NotificationContext] Chat listener error:", error);
    });

    // Listen to general notifications without requiring a custom composite index on Firestore
    console.log('[NotificationContext] Subscribing to notifications for user ID:', currentUserId);
    const qNotifs = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUserId)
    );

    let isInitialLoadNotifs = true;
    const unsubscribeNotifs = onSnapshot(qNotifs, (snapshot) => {
      let fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      
      // Filter out deleted notifications (which we mark with deleted: true to prevent automatic re-creation by syncRealtimeAlerts)
      fetched = fetched.filter((n: any) => !n.deleted);

      // SIFT out buyer-specific alerts (promotion/supplier) if current user is supplier or logistics
      if (userRole && userRole !== 'buyer') {
        fetched = fetched.filter((n: any) => {
          const type = (n.type || '').toLowerCase();
          const title = (n.title || '').toLowerCase();
          const message = (n.message || '').toLowerCase();

          const isProductPromo = type === 'promotion' || 
                                 type === 'supplier' || 
                                 title.includes('promoção') || 
                                 title.includes('promo') || 
                                 title.includes('sale') || 
                                 title.includes('⚡') ||
                                 title.includes('fornecedor') ||
                                 title.includes('supplier') ||
                                 title.includes('produto') ||
                                 title.includes('product') ||
                                 message.includes('produto') ||
                                 message.includes('product');
          return !isProductPromo;
        });
      }
      
      // Sort in memory by createdAt descending to avoid index errors
      fetched.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return timeB - timeA;
      });

      // Limit to 50 items in memory
      if (fetched.length > 50) {
        fetched = fetched.slice(0, 50);
      }

      const unreadCount = fetched.filter((n: any) => !n.read).length;
      console.log(`[NotificationContext] Firestore Real-time Notifications Snapshot loaded. Total loaded: ${fetched.length}. Unread notifications count count: ${unreadCount}`);

      setNotifications(fetched);
      setUnreadNotifications(unreadCount);

      if (isInitialLoadNotifs) {
        isInitialLoadNotifs = false;
      } else {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const notif = change.doc.data();
            if (notif.deleted) return;
            
            // Skip alert popup if this is product promotion/addition and user is not buyer
            if (userRole && userRole !== 'buyer') {
              const type = (notif.type || '').toLowerCase();
              const title = (notif.title || '').toLowerCase();
              if (type === 'promotion' || type === 'supplier' || title.includes('⚡') || title.includes('promo') || title.includes('fornecedor')) {
                return;
              }
            }

            console.log(`[NotificationContext] Dynamic new system/alert notification received: "${notif.title}"`);
            triggerNotification(notif.title, notif.message);
          }
        });
      }
    }, (error) => {
      console.error("[NotificationContext] Notification listener error:", error);
    });

    // Real-time synchronization watchers to keep our standard category alerts hydrated
    console.log('[NotificationContext] Initializing background system alert synchronizers...');
    const unsubscribeSuppliers = onSnapshot(query(collection(db, 'users'), where('type', '==', 'supplier')), () => {
      syncRealtimeAlerts();
    });

    const unsubscribeProducts = onSnapshot(query(collection(db, 'products'), where('onSale', '==', true)), () => {
      syncRealtimeAlerts();
    });

    const unsubscribeCarriers = onSnapshot(query(collection(db, 'users'), where('type', '==', 'logistics')), () => {
      syncRealtimeAlerts();
    });

    const unsubscribeOccurrences = onSnapshot(query(collection(db, 'occurrences')), () => {
      syncRealtimeAlerts();
    });

    return () => {
      console.log('[NotificationContext] Cleaning up current users subscriptions.');
      unsubscribeChats();
      unsubscribeNotifs();
      unsubscribeSuppliers();
      unsubscribeProducts();
      unsubscribeCarriers();
      unsubscribeOccurrences();
    };
  }, [user?.uid, profile?.type, language]);

  const triggerNotification = (title: string, body: string, chatId?: string) => {
    // Suppress chat and message alert popups or sound completely
    if (chatId || title.includes('💬') || title.toLowerCase().includes('mensagem') || title.toLowerCase().includes('message')) {
      console.log('[NotificationContext] Dynamic message notification suppressed successfully.');
      return;
    }

    // Play sound
    audioRef.current?.play().catch(() => {});

    // Browser notification
    if (permission === 'granted' && document.hidden && typeof Notification !== 'undefined') {
      new Notification(title, {
        body,
        icon: '/favicon.ico' // Or a custom icon
      });
    }

    // In-app notification
    setActiveNotification({ title, body, chatId });
    setTimeout(() => setActiveNotification(null), 5000);
  };

  const markNotificationAsRead = async (notificationId: string) => {
    console.log(`[NotificationContext] Marking notification ${notificationId} as read...`);
    try {
      const notifRef = doc(db, 'notifications', notificationId);
      await updateDoc(notifRef, { read: true });
      console.log(`[NotificationContext] Notification ${notificationId} marked read dynamically.`);
    } catch (error) {
      console.error("[NotificationContext] Error marking notification as read:", error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    if (!user) return;
    console.log('[NotificationContext] Marking all notifications as read...');
    try {
      const unread = notifications.filter(n => !n.read);
      if (unread.length === 0) return;
      const batch = writeBatch(db);
      unread.forEach((n) => {
        const ref = doc(db, 'notifications', n.id);
        batch.update(ref, { read: true });
      });
      await batch.commit();
      console.log(`[NotificationContext] All ${unread.length} notifications marked as read.`);
    } catch (error) {
      console.error('[NotificationContext] Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    console.log(`[NotificationContext] Marking notification ${notificationId} as deleted...`);
    try {
      const ref = doc(db, 'notifications', notificationId);
      // We set deleted: true dynamically on the document so it is excluded from view but prevents automatic recreation
      await setDoc(ref, { deleted: true }, { merge: true });
      console.log(`[NotificationContext] Notification ${notificationId} marked as deleted: true successfully.`);
    } catch (error) {
      console.error('[NotificationContext] Error deleting notification:', error);
    }
  };

  const deleteAllNotifications = async () => {
    if (!user) return;
    console.log('[NotificationContext] Marking all active notifications as deleted...');
    try {
      if (notifications.length === 0) return;
      const batch = writeBatch(db);
      notifications.forEach((n) => {
        const ref = doc(db, 'notifications', n.id);
        batch.set(ref, { deleted: true }, { merge: true });
      });
      await batch.commit();
      console.log(`[NotificationContext] All ${notifications.length} notifications marked as deleted successfully.`);
    } catch (error) {
      console.error('[NotificationContext] Error deleting all notifications:', error);
    }
  };

  return (
    <NotificationContext.Provider value={{ 
      permission, 
      requestPermission, 
      unreadMessages, 
      unreadNotifications,
      totalUnread: unreadMessages + unreadNotifications,
      notifications,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      deleteNotification,
      deleteAllNotifications
    }}>
      {children}
      
      <AnimatePresence>
        {activeNotification && (
          <motion.div
            initial={{ opacity: 0, y: -100, x: '-50%' }}
            animate={{ opacity: 1, y: 20, x: '-50%' }}
            exit={{ opacity: 0, y: -100, x: '-50%' }}
            className={`fixed top-0 left-1/2 z-[200] w-[90%] max-w-sm p-4 rounded-2xl border shadow-2xl flex items-center gap-4 cursor-pointer ${
              isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100'
            }`}
            onClick={() => {
              const route = getNotificationRoute(activeNotification);
              window.dispatchEvent(new CustomEvent('navigate-app', { 
                detail: { tab: route.tab, payload: route.payload } 
              }));
              setActiveNotification(null);
            }}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isDarkMode ? 'bg-brand/10 text-brand' : 'bg-brand/10 text-brand'}`}>
              <MessageSquare className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-black uppercase italic tracking-wider ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>{activeNotification.title}</p>
              <p className="text-[11px] text-zinc-500 font-medium truncate">{activeNotification.body}</p>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); setActiveNotification(null); }}
              className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-50'}`}
            >
              <X className="w-4 h-4 text-zinc-500" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Permission Prompt - subtle */}
      {permission === 'default' && user && (
        <div className="fixed bottom-4 left-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-4 rounded-2xl border shadow-xl flex items-center gap-4 ${
              isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100'
            }`}
          >
            <Bell className="w-5 h-5 text-brand" />
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-tight text-zinc-400">
                {language === 'PT' ? 'Ativar notificações?' : 'Enable notifications?'}
              </p>
            </div>
            <button 
              onClick={requestPermission}
              className="px-3 py-1.5 bg-brand text-white text-[10px] font-black uppercase rounded-lg"
            >
              Sim
            </button>
            <button 
              onClick={() => setPermission('denied')}
              className="text-[10px] font-bold uppercase text-zinc-500"
            >
              Não
            </button>
          </motion.div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
