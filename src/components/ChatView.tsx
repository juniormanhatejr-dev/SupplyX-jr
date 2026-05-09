import React, { useState, useEffect, useRef } from 'react';
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
  CheckCheck
} from 'lucide-react';
import ProfileModal from './ProfileModal';
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
  serverTimestamp,
  limit
} from 'firebase/firestore';

interface ChatRoom {
  id: string;
  participants: string[];
  lastMessage: string;
  updatedAt: any;
  participantNames: Record<string, string>;
}

interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: any;
}

interface ChatViewProps {
  isDarkMode?: boolean;
  language?: 'PT' | 'EN';
  userType?: 'buyer' | 'supplier';
  onNavigate?: (tab: string) => void;
}

export default function ChatView({ isDarkMode, language = 'PT', userType, onNavigate }: ChatViewProps) {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
        ...doc.data()
      })) as ChatRoom[];
      
      // Sort manually to avoid missing index / permission mask issues
      roomList.sort((a, b) => {
        const timeA = a.updatedAt?.toDate ? a.updatedAt.toDate().getTime() : 0;
        const timeB = b.updatedAt?.toDate ? b.updatedAt.toDate().getTime() : 0;
        return timeB - timeA;
      });

      setRooms(roomList);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'chats');
    });

    return () => unsubscribe();
  }, [auth.currentUser]);

  useEffect(() => {
    if (!activeRoom) return;

    const q = query(
      collection(db, `chats/${activeRoom.id}/messages`),
      orderBy('createdAt', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgList);
      setTimeout(scrollToBottom, 100);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, `chats/${activeRoom.id}/messages`);
    });

    return () => unsubscribe();
  }, [activeRoom]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeRoom || !auth.currentUser) return;

    const text = newMessage;
    setNewMessage('');

    try {
      await addDoc(collection(db, `chats/${activeRoom.id}/messages`), {
        senderId: auth.currentUser.uid,
        text,
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, 'chats', activeRoom.id), {
        lastMessage: text,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `chats/${activeRoom.id}/messages`);
    }
  };

  const getOtherParticipantName = (room: ChatRoom) => {
    const otherId = room.participants.find(id => id !== auth.currentUser?.uid);
    return room.participantNames[otherId || ''] || t.user;
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
          <h2 className="text-xl font-black italic uppercase tracking-tighter mb-4">{t.title}</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text"
              placeholder={t.search}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-bold outline-none border transition-all ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white focus:border-brand/50' : 'bg-zinc-50 border-zinc-100 focus:border-brand/30'}`}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide py-2">
          {rooms.length > 0 ? rooms.map((room) => (
            <button 
              key={room.id}
              onClick={() => setActiveRoom(room)}
              className={`w-full p-4 flex items-center gap-3 transition-colors ${activeRoom?.id === room.id ? (isDarkMode ? 'bg-zinc-900' : 'bg-zinc-50') : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/50'}`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm ${isDarkMode ? 'bg-zinc-800 text-brand' : 'bg-brand/10 text-brand'}`}>
                {getOtherParticipantName(room).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-sm font-black truncate">{getOtherParticipantName(room)}</span>
                  <span className="text-[10px] text-zinc-500">
                    {room.updatedAt?.toDate ? new Date(room.updatedAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 truncate">{room.lastMessage || t.startChat}</p>
              </div>
            </button>
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
              <div 
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => {
                  setViewingProfileId(getOtherParticipantId(activeRoom));
                  setIsProfileModalOpen(true);
                }}
              >
                <button onClick={(e) => { e.stopPropagation(); setActiveRoom(null); }} className="md:hidden p-2 -ml-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <User className="w-5 h-5" />
                </button>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs transition-transform group-hover:scale-105 ${isDarkMode ? 'bg-zinc-800 text-brand' : 'bg-brand/10 text-brand'}`}>
                  {getOtherParticipantName(activeRoom).charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-black group-hover:text-brand transition-colors">{getOtherParticipantName(activeRoom)}</h3>
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{t.online}</p>
                </div>
              </div>
              <button className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <MoreVertical className="w-5 h-5 text-zinc-400" />
              </button>
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
                    <div className={`max-w-[80%] md:max-w-[60%] space-y-1`}>
                      <div className={`p-4 rounded-3xl text-sm font-medium ${
                        isMine 
                          ? 'bg-brand text-white rounded-tr-none' 
                          : (isDarkMode ? 'bg-zinc-900 text-white rounded-tl-none' : 'bg-zinc-100 text-zinc-900 rounded-tl-none')
                      }`}>
                        {msg.text}
                      </div>
                      <div className={`flex items-center gap-1.5 px-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                          {msg.createdAt?.toDate ? new Date(msg.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                        {isMine && <CheckCheck className="w-3 h-3 text-brand" />}
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
                <div className="flex items-center gap-2">
                  <button type="button" className="p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition-colors">
                    <Paperclip className="w-5 h-5" />
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
