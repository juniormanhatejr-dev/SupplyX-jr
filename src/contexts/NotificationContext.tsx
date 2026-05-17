import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Bell, X } from 'lucide-react';

interface NotificationContextType {
  permission: NotificationPermission;
  requestPermission: () => Promise<void>;
  unreadMessages: number;
  unreadNotifications: number;
  totalUnread: number;
  notifications: any[];
  markNotificationAsRead: (notificationId: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode; isDarkMode?: boolean; language?: 'PT' | 'EN' }> = ({ children, isDarkMode = true, language = 'PT' }) => {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' ? Notification.permission : 'default'
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
    if (!auth.currentUser) return;

    const currentUserId = auth.currentUser.uid;
    
    // Listen to chats for messages
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
              const senderName = chatData.participantNames[otherParticipantId] || (language === 'PT' ? 'Nova Mensagem' : 'New Message');
              const body = chatData.lastMessage || '';
              triggerNotification(senderName, body, change.doc.id);
            }
          }
        });
      }
    }, (error) => {
      console.error("Chat listener error:", error);
    });

    // Listen to general notifications
    const qNotifs = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUserId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    let isInitialLoadNotifs = true;
    const unsubscribeNotifs = onSnapshot(qNotifs, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(fetched);
      setUnreadNotifications(fetched.filter((n: any) => !n.read).length);

      if (isInitialLoadNotifs) {
        isInitialLoadNotifs = false;
      } else {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const notif = change.doc.data();
            triggerNotification(notif.title, notif.message);
          }
        });
      }
    }, (error) => {
      console.error("Notification listener error:", error);
    });

    return () => {
      unsubscribeChats();
      unsubscribeNotifs();
    };
  }, [auth.currentUser?.uid, language]);

  const triggerNotification = (title: string, body: string, chatId?: string) => {
    // Play sound
    audioRef.current?.play().catch(() => {});

    // Browser notification
    if (permission === 'granted' && document.hidden) {
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
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'notifications', notificationId), { read: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
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
      markNotificationAsRead
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
              window.dispatchEvent(new CustomEvent('navigate-to-messages', { detail: { chatId: activeNotification.chatId } }));
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
      {permission === 'default' && auth.currentUser && (
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
