import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  User, 
  MessageSquare, 
  Search, 
  MoreVertical, 
  Paperclip,
  Image as ImageIcon,
  Loader2,
  Check,
  CheckCheck,
  UserPlus,
  Clock,
  Trash2,
  ArrowLeft
} from 'lucide-react';
import ProfileModal from './ProfileModal';
import { OptimizedImage } from './ui/OptimizedImage';
import UserPresenceIndicator from './UserPresenceIndicator';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc,
  serverTimestamp,
  limit,
  getDocs,
  getDoc,
  increment
} from 'firebase/firestore';

interface ChatRoom {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageSenderId?: string;
  updatedAt: any;
  participantNames: Record<string, string>;
  unreadCount?: Record<string, number>;
}

interface Message {
  id: string;
  senderId: string;
  text: string;
  fileUrl?: string;
  fileType?: string;
  fileName?: string;
  createdAt: any;
}

const formatLogisticsNameFromUid = (uid: string): string | null => {
  if (!uid.startsWith('ops_logistica_')) return null;
  const raw = uid.substring('ops_logistica_'.length);
  if (raw === 'default') return null;
  
  return raw
    .split('_')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

interface ChatViewProps {
  isDarkMode?: boolean;
  language?: 'PT' | 'EN';
  userType?: 'buyer' | 'supplier';
  onNavigate?: (tab: string) => void;
  onBack?: () => void;
  initialRecipientId?: string | null;
  initialChatId?: string | null;
}

export default function ChatView({ isDarkMode, language = 'PT', userType, onNavigate, onBack, initialRecipientId, initialChatId }: ChatViewProps) {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [roomConfirmDeleteId, setRoomConfirmDeleteId] = useState<string | null>(null);

  const [activeUserIds, setActiveUserIds] = useState<string[]>([]);
  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setActiveUserIds(snapshot.docs.map(doc => doc.id));
    }, (err) => {
      console.error('Error listening to user ids:', err);
    });
    return () => unsubscribe();
  }, []);

  const displayedRooms = useMemo(() => {
    if (activeUserIds.length === 0 && rooms.length > 0) return rooms;
    return rooms.filter(room => {
      return room.participants.every(pId => 
        pId === auth.currentUser?.uid || 
        activeUserIds.includes(pId) || 
        pId.startsWith('ops_logistica_') || 
        pId === 'buyer_demo_uid' || 
        pId === 'supplier_demo_uid'
      );
    });
  }, [rooms, activeUserIds]);

  // Automatically select room if initialRecipientId is provided, or create one if it doesn't exist yet!
  const hasAttemptedAutoStart = useRef<string | null>(null);

  useEffect(() => {
    if (!initialRecipientId) return;

    // Prevent duplicate triggers for the same user sequence
    if (hasAttemptedAutoStart.current === initialRecipientId) {
      const room = displayedRooms.find(r => r.participants.includes(initialRecipientId));
      if (room) {
        setActiveRoom(room);
      }
      return;
    }

    const room = displayedRooms.find(r => r.participants.includes(initialRecipientId));
    if (room) {
      setActiveRoom(room);
    } else {
      // It doesn't exist, so let's load and start chat
      const loadAndStartChat = async () => {
        hasAttemptedAutoStart.current = initialRecipientId;
        try {
          const userDoc = await getDoc(doc(db, 'users', initialRecipientId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const recipientUser = {
              uid: initialRecipientId,
              name: userData.name || userData.companyName || 'Usuário B2B',
              ...userData
            };
            await startNewChat(recipientUser);
          } else {
            // Even if user doc is missing, auto-create a room
            const fallbackName = initialRecipientId === 'ops_logistica_default'
              ? (language === 'PT' ? 'Suporte Logístico SupplyX' : 'SupplyX Logistics Support')
              : (initialRecipientId.startsWith('ops_logistica_')
                  ? (formatLogisticsNameFromUid(initialRecipientId) || (language === 'PT' ? 'Agente Logístico' : 'Logistics Agent'))
                  : (initialRecipientId === 'buyer_demo_uid'
                      ? (language === 'PT' ? 'Cliente B2B (Demo)' : 'B2B Client (Demo)')
                      : (initialRecipientId === 'supplier_demo_uid'
                          ? (language === 'PT' ? 'Fornecedor B2B (Demo)' : 'B2B Supplier (Demo)')
                          : 'Usuário B2B')));
            const recipientUser = {
              uid: initialRecipientId,
              name: fallbackName
            };
            await startNewChat(recipientUser);
          }
        } catch (err) {
          console.error("Error starting auto chat with initialRecipientId:", err);
        }
      };
      loadAndStartChat();
    }
  }, [initialRecipientId, displayedRooms]);
  const [resolvedNames, setResolvedNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (displayedRooms.length === 0) return;

    displayedRooms.forEach(room => {
      room.participants.forEach(uid => {
        if (uid !== auth.currentUser?.uid && !resolvedNames[uid]) {
          // Fetch real name from database users collection
          getDoc(doc(db, 'users', uid)).then(userDoc => {
            if (userDoc.exists()) {
              const name = userDoc.data().name;
              if (name) {
                setResolvedNames(prev => ({
                  ...prev,
                  [uid]: name
                }));
              }
            }
          }).catch(err => {
            console.warn('Error fetching real name in background:', err);
          });
        }
      });
    });
  }, [displayedRooms, resolvedNames]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (searchTerm.length >= 1) {
      const delayDebounceFn = setTimeout(async () => {
        setIsSearching(true);
        try {
          const usersRef = collection(db, 'users');
          // Simple search for names starting with the term
          // To be more helpful with case-sensitivity on the first letter
          const term = searchTerm;
          const capitalizedTerm = term.charAt(0).toUpperCase() + term.slice(1);
          
          const q = query(
            usersRef,
            where('name', '>=', capitalizedTerm),
            where('name', '<=', capitalizedTerm + '\uf8ff'),
            limit(15)
          );
          const snapshot = await getDocs(q);
          setSearchResults(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (err) {
          console.error('Error searching users:', err);
        } finally {
          setIsSearching(false);
        }
      }, 300);

      return () => clearTimeout(delayDebounceFn);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const startNewChat = async (user: any) => {
    if (!auth.currentUser) return;
    
    // Check if room already exists in state
    const existing = displayedRooms.find(r => r.participants.includes(user.uid));
    if (existing) {
      setActiveRoom(existing);
      setSearchTerm('');
      return;
    }

    try {
      let currentUserName = auth.currentUser.displayName || 'Me';
      try {
        const currentUserDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (currentUserDoc.exists()) {
          currentUserName = currentUserDoc.data().name || currentUserName;
        }
      } catch (err) {
        console.warn('Error fetching current user name:', err);
      }

      const chatData = {
        participants: [auth.currentUser.uid, user.uid],
        participantNames: {
          [auth.currentUser.uid]: currentUserName,
          [user.uid]: user.name
        },
        unreadCount: {
          [auth.currentUser.uid]: 0,
          [user.uid]: 1
        },
        lastMessage: 'Nova conversa iniciada',
        lastMessageSenderId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, 'chats'), chatData);
      setActiveRoom({
        id: docRef.id,
        ...chatData
      } as ChatRoom);
      setSearchTerm('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'chats');
    }
  };
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const t = {
    PT: {
      title: 'Mensagens B2B',
      search: 'Procurar conversas...',
      startChat: 'Inicie a conversa...',
      noConversations: 'Nenhuma conversa encontrada',
      typeMessage: 'Escreva sua mensagem...',
      yourConversations: 'Suas Conversas B2B',
      selectToChat: 'Selecione uma conversa para começar a negociar diretamente com fornecedores ou clientes.',
      user: 'Usuário',
      online: 'Online'
    },
    EN: {
      title: 'B2B Messages',
      search: 'Search conversations...',
      startChat: 'Start the conversation...',
      noConversations: 'No conversations found',
      typeMessage: 'Type your message...',
      yourConversations: 'Your B2B Conversations',
      selectToChat: 'Select a conversation to start negotiating directly with suppliers or customers.',
      user: 'User',
      online: 'Online'
    }
  }[language];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const roomList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fromCache: snapshot.metadata.fromCache
      })) as (ChatRoom & { fromCache: boolean })[];
      
      // Sort manually to avoid missing index / permission mask issues
      roomList.sort((a, b) => {
        const timeA = a.updatedAt?.toDate ? a.updatedAt.toDate().getTime() : 0;
        const timeB = b.updatedAt?.toDate ? b.updatedAt.toDate().getTime() : 0;
        return timeB - timeA;
      });

      setRooms(roomList);

      // Handle initialChatId from notifications
      if (initialChatId && !activeRoom) {
        const targetRoom = roomList.find(r => r.id === initialChatId);
        if (targetRoom) {
          setActiveRoom(targetRoom);
        }
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'chats');
    });

    return () => unsubscribe();
  }, [auth.currentUser, initialChatId]);

  useEffect(() => {
    if (!activeRoom) return;

    const q = query(
      collection(db, `chats/${activeRoom.id}/messages`),
      where('participants', 'array-contains', auth.currentUser.uid),
      orderBy('createdAt', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fromCache: snapshot.metadata.fromCache
      })) as (Message & { fromCache: boolean })[];
      setMessages(msgList);
      setTimeout(scrollToBottom, 100);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, `chats/${activeRoom.id}/messages`);
    });

    return () => unsubscribe();
  }, [activeRoom]);

  useEffect(() => {
    if (!activeRoom || !auth.currentUser) return;
    const currentUserId = auth.currentUser.uid;
    const currentUnread = (activeRoom as any).unreadCount?.[currentUserId] || 0;
    if (currentUnread > 0) {
      updateDoc(doc(db, 'chats', activeRoom.id), {
        [`unreadCount.${currentUserId}`]: 0
      }).catch(err => {
        console.error('Error clearing unreadCount:', err);
      });
    }
  }, [activeRoom, auth.currentUser]);

  const handleDeleteMessage = async (messageId: string) => {
    if (!activeRoom || !auth.currentUser) return;
    try {
      await deleteDoc(doc(db, `chats/${activeRoom.id}/messages`, messageId));
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  const handleDeleteChatRoom = async (roomId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (roomConfirmDeleteId !== roomId) {
      setRoomConfirmDeleteId(roomId);
      // Reset confirmation after 3.5 seconds
      setTimeout(() => {
        setRoomConfirmDeleteId(prev => prev === roomId ? null : prev);
      }, 3500);
      return;
    }

    try {
      if (activeRoom?.id === roomId) {
        setActiveRoom(null);
      }
      setRoomConfirmDeleteId(null);
      await deleteDoc(doc(db, 'chats', roomId));
    } catch (err) {
      console.error('Error deleting chat room:', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeRoom || !auth.currentUser) return;

    const text = newMessage;
    setNewMessage('');

    try {
      await addDoc(collection(db, `chats/${activeRoom.id}/messages`), {
        senderId: auth.currentUser.uid,
        participants: activeRoom.participants, // Added for Rule Pillar 8 compliance
        text,
        createdAt: serverTimestamp()
      });

      const otherId = activeRoom.participants.find(id => id !== auth.currentUser?.uid);
      await updateDoc(doc(db, 'chats', activeRoom.id), {
        lastMessage: text,
        lastMessageSenderId: auth.currentUser.uid,
        updatedAt: serverTimestamp(),
        [`unreadCount.${otherId}`]: increment(1)
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `chats/${activeRoom.id}/messages`);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeRoom || !auth.currentUser) return;

    setIsUploading(true);
    try {
      const { uploadFile } = await import('../lib/firebase');
      const path = `chats/${activeRoom.id}/${Date.now()}_${file.name}`;
      const url = await uploadFile(path, file);

      const isImage = file.type.startsWith('image/');
      
      await addDoc(collection(db, `chats/${activeRoom.id}/messages`), {
        senderId: auth.currentUser.uid,
        participants: activeRoom.participants, // Added for Rule Pillar 8 compliance
        text: isImage ? `[Imagem: ${file.name}]` : `[Arquivo: ${file.name}]`,
        fileUrl: url,
        fileType: file.type,
        fileName: file.name,
        createdAt: serverTimestamp()
      });

      const otherId = activeRoom.participants.find(id => id !== auth.currentUser?.uid);
      await updateDoc(doc(db, 'chats', activeRoom.id), {
        lastMessage: isImage ? '📷 Imagem' : '📎 Arquivo',
        lastMessageSenderId: auth.currentUser.uid,
        updatedAt: serverTimestamp(),
        [`unreadCount.${otherId}`]: increment(1)
      });
    } catch (err) {
      console.error('Error uploading file:', err);
      alert(language === 'PT' ? 'Erro ao carregar arquivo' : 'Error uploading file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getOtherParticipantName = (room: ChatRoom) => {
    const otherId = room.participants.find(id => id !== auth.currentUser?.uid);
    if (!otherId) return t.user;
    if (otherId === 'ops_logistica_default') {
      return language === 'PT' ? 'Suporte Logístico SupplyX' : 'SupplyX Logistics Support';
    }
    if (otherId.startsWith('ops_logistica_')) {
      return formatLogisticsNameFromUid(otherId) || (language === 'PT' ? 'Agente Logístico' : 'Logistics Agent');
    }
    if (otherId === 'buyer_demo_uid') {
      return language === 'PT' ? 'Cliente B2B (Demo)' : 'B2B Client (Demo)';
    }
    if (otherId === 'supplier_demo_uid') {
      return language === 'PT' ? 'Fornecedor B2B (Demo)' : 'B2B Supplier (Demo)';
    }
    return resolvedNames[otherId] || room.participantNames[otherId] || t.user;
  };

  const getOtherParticipantId = (room: ChatRoom) => {
    return room.participants.find(id => id !== auth.currentUser?.uid) || '';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex h-[calc(100vh-120px)] -m-4 md:-m-6 overflow-hidden ${isDarkMode ? 'bg-zinc-950 text-white' : 'bg-white'}`}
    >
      {/* Sidebar - Rooms List */}
      <div className={`w-full md:w-80 flex-shrink-0 flex flex-col border-r ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'} ${activeRoom ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-zinc-800/10">
          <div className="flex items-center gap-3 mb-4">
            {onBack && (
              <button 
                onClick={onBack}
                className={`p-2 -ml-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-zinc-900 text-zinc-400 hover:text-white' : 'hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900'}`}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-xl font-black italic uppercase tracking-tighter">{t.title}</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text"
              placeholder={t.search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-bold outline-none border transition-all ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white focus:border-brand/50' : 'bg-zinc-50 border-zinc-100 focus:border-brand/30'}`}
            />

            {/* Global User Search Results */}
            {searchTerm && (
              <div className={`absolute top-full left-0 right-0 z-50 mt-2 p-1 rounded-2xl border shadow-2xl overflow-hidden ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100'}`}>
                {isSearching ? (
                  <div className="p-4 flex items-center justify-center gap-2 text-zinc-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-[10px] font-black uppercase">{language === 'PT' ? 'Buscando...' : 'Searching...'}</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  <>
                    <div className={`px-3 py-2 text-[8px] font-black uppercase tracking-widest ${isDarkMode ? 'text-zinc-500 bg-zinc-950/50' : 'text-zinc-400 bg-zinc-50'}`}>
                      {language === 'PT' ? 'Novas Conversas' : 'New Conversations'}
                    </div>
                    {searchResults.map((user) => (
                      <button
                        key={user.uid}
                        onClick={() => startNewChat(user)}
                        className={`w-full p-3 flex items-center gap-3 transition-colors text-left rounded-xl ${isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-50'}`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${isDarkMode ? 'bg-zinc-800 text-brand' : 'bg-brand/10 text-brand'}`}>
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold truncate ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{user.name}</p>
                          <p className="text-[9px] text-zinc-500 uppercase font-black tracking-tight">{user.type} • {user.city}</p>
                        </div>
                        <UserPlus className="w-3.5 h-3.5 text-zinc-400" />
                      </button>
                    ))}
                  </>
                ) : (
                  <div className="p-4 text-center text-zinc-500 text-[10px] font-bold uppercase">
                    {language === 'PT' ? 'Nenhum usuário encontrado' : 'No users found'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide py-2">
          {displayedRooms.length > 0 ? displayedRooms.map((room) => (
            <div 
              key={room.id}
              onClick={() => setActiveRoom(room)}
              className={`w-full p-4 flex items-center gap-3 transition-colors cursor-pointer group relative ${activeRoom?.id === room.id ? (isDarkMode ? 'bg-zinc-900' : 'bg-zinc-50') : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/50'}`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm ${isDarkMode ? 'bg-zinc-800 text-brand' : 'bg-brand/10 text-brand'}`}>
                {getOtherParticipantName(room).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-sm font-black truncate">{getOtherParticipantName(room)}</span>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-zinc-500">
                      {room.updatedAt?.toDate ? new Date(room.updatedAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                    <UserPresenceIndicator 
                      userId={getOtherParticipantId(room)} 
                      language={language}
                      showLastSeen={false}
                      className="text-[10px] font-black uppercase tracking-tight"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <p className={`text-xs truncate text-zinc-500 shrink min-w-0 ${room.unreadCount?.[auth.currentUser?.uid || ''] ? 'text-teal-400 font-bold' : ''}`}>
                    {room.lastMessage || t.startChat}
                  </p>
                  <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                    {(room.unreadCount?.[auth.currentUser?.uid || ''] || 0) > 0 && (
                      <span className="shrink-0 px-1.5 py-0.5 bg-teal-400 text-slate-950 text-[9px] font-black rounded-full min-w-4 text-center animate-pulse">
                        {room.unreadCount?.[auth.currentUser?.uid || '']}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteChatRoom(room.id, e)}
                      className={`p-1.5 rounded-lg transition-all border flex items-center justify-center shrink-0 ${
                        roomConfirmDeleteId === room.id
                          ? 'bg-red-500 text-white border-red-600 animate-pulse text-[9px] font-black uppercase px-2'
                          : 'bg-zinc-800/10 dark:bg-zinc-800/30 text-zinc-400 hover:text-red-500 border-transparent hover:border-red-500/20 hover:bg-red-500/10'
                      }`}
                      title={language === 'PT' ? 'Eliminar conversa' : 'Delete conversation'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {roomConfirmDeleteId === room.id && (
                        <span className="ml-1 text-[8.5px] font-black tracking-wider uppercase">{language === 'PT' ? 'Confirmar' : 'Confirm'}</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-zinc-500">
              <MessageSquare className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-xs font-bold uppercase tracking-widest">{t.noConversations}</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col ${!activeRoom ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
        {activeRoom ? (
          <>
            {/* Chat Header */}
            <div className={`p-4 md:px-8 border-b flex items-center justify-between ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`}>
              <div className="flex items-center gap-3">
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if (window.innerWidth < 768) {
                      setActiveRoom(null); 
                    } else if (onBack) {
                      onBack();
                    } else {
                      setActiveRoom(null);
                    }
                  }} 
                  className="p-2 -ml-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div 
                  className="flex items-center gap-3 cursor-pointer group"
                  onClick={() => {
                    setViewingProfileId(getOtherParticipantId(activeRoom));
                    setIsProfileModalOpen(true);
                  }}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs transition-transform group-hover:scale-105 ${isDarkMode ? 'bg-zinc-800 text-brand' : 'bg-brand/10 text-brand'}`}>
                    {getOtherParticipantName(activeRoom).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-black group-hover:text-brand transition-colors">{getOtherParticipantName(activeRoom)}</h3>
                    {activeRoom && (
                      <UserPresenceIndicator 
                        userId={getOtherParticipantId(activeRoom)} 
                        language={language}
                      />
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => handleDeleteChatRoom(activeRoom.id, e)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border shrink-0 cursor-pointer ${
                    roomConfirmDeleteId === activeRoom.id
                      ? 'bg-red-500 text-white border-red-600 animate-pulse'
                      : 'bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/20'
                  }`}
                  title={language === 'PT' ? "Excluir Chat Permanentemente" : "Delete Chat Permanently"}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>
                    {roomConfirmDeleteId === activeRoom.id
                      ? (language === 'PT' ? 'Confirmar?' : 'Are you sure?')
                      : (language === 'PT' ? 'Excluir Conversa' : 'Delete Chat')}
                  </span>
                </button>

                <button className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <MoreVertical className="w-5 h-5 text-zinc-400" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scrollbar-hide">
              {messages.map((msg, i) => {
                const isMine = msg.senderId === auth.currentUser?.uid;
                return (
                  <motion.div 
                    initial={{ opacity: 0, x: isMine ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={msg.id}
                    className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] md:max-w-[60%] space-y-1 group/msg relative`}>
                      <div className={`p-4 rounded-3xl text-sm font-medium ${
                        isMine 
                          ? 'bg-brand text-white rounded-tr-none' 
                          : (isDarkMode ? 'bg-zinc-900 text-white rounded-tl-none' : 'bg-zinc-100 text-zinc-900 rounded-tl-none')
                      }`}>
                        {msg.fileUrl ? (
                          <div className="space-y-2">
                            {msg.fileType?.startsWith('image/') ? (
                              <OptimizedImage 
                                src={msg.fileUrl} 
                                alt={msg.fileName} 
                                className="max-w-full rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => window.open(msg.fileUrl, '_blank')}
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <a 
                                href={msg.fileUrl} 
                                download={msg.fileName || 'Arquivo'}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 underline cursor-pointer hover:brightness-110 transition-all font-bold"
                              >
                                <Paperclip className="w-4 h-4 shrink-0" />
                                {msg.fileName || 'Arquivo'}
                              </a>
                            )}
                            {msg.text && !msg.text.startsWith('[') && <p>{msg.text}</p>}
                          </div>
                        ) : (
                          msg.text
                        )}
                      </div>
                      <div className={`flex items-center gap-1.5 px-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                          {msg.createdAt?.toDate ? new Date(msg.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                        {isMine && (
                          msg.createdAt ? (
                            <CheckCheck className="w-3 h-3 text-brand" />
                          ) : (
                            <Clock className={`w-3 h-3 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`} />
                          )
                        )}
                        <button 
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="flex items-center gap-1 text-red-500 hover:text-red-600 bg-red-500/10 hover:bg-red-500/20 px-2 py-0.5 rounded-lg transition-all ml-2.5 cursor-pointer border border-red-500/25 font-bold shadow-xs active:scale-95"
                          title={language === 'PT' ? "Eliminar mensagem" : "Delete message"}
                        >
                          <Trash2 className="w-3 h-3 text-red-500" />
                          <span className="text-[9.5px]/none font-black uppercase tracking-wider text-red-500">{language === 'PT' ? 'Eliminar' : 'Delete'}</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className={`p-4 md:px-8 border-t ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`}>
              <form onSubmit={handleSendMessage} className="flex items-center gap-2 md:gap-4">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleFileUpload}
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.csv"
                />
                <div className="flex items-center gap-2">
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition-colors disabled:opacity-50"
                  >
                    {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                  </button>
                </div>
                <div className="flex-1 relative">
                  <input 
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={t.typeMessage}
                    className={`w-full pl-6 pr-12 py-4 rounded-3xl text-sm font-bold outline-none border-2 transition-all ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white focus:border-brand/50' : 'bg-zinc-50 border-zinc-100 focus:border-brand/30 ring-brand/5'}`}
                  />
                  <button 
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-brand text-white rounded-2xl flex items-center justify-center hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-8">
            <div className={`w-20 h-20 rounded-[30px] flex items-center justify-center mb-6 ${isDarkMode ? 'bg-zinc-900' : 'bg-zinc-50'}`}>
              <MessageSquare className="w-10 h-10 text-brand" />
            </div>
            <h3 className="text-xl font-black italic uppercase tracking-tighter mb-2">{t.yourConversations}</h3>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest max-w-xs">{t.selectToChat}</p>
          </div>
        )}
      </div>

      <ProfileModal 
        userId={viewingProfileId || ''}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onEdit={() => onNavigate?.('Ajustes')}
        isDarkMode={isDarkMode}
        language={language}
      />
    </motion.div>
  );
}
