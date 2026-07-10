import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Mail, 
  Phone, 
  User, 
  Building2, 
  AlertCircle, 
  Loader2, 
  ChevronRight, 
  FileText,
  MapPin,
  Calendar,
  Briefcase,
  Truck
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { notificationService } from '../services/notificationService';

interface AdminVerificationPanelProps {
  isDarkMode: boolean;
  language: 'PT' | 'EN';
}

interface UserProfileDoc {
  uid: string;
  id: string;
  name: string;
  userName?: string;
  nuit: string;
  nuitStatus: 'pending' | 'verified' | 'rejected';
  verificationStatus: 'pending' | 'verified' | 'rejected';
  email: string;
  phone: string;
  type: 'buyer' | 'supplier' | 'logistics';
  userType?: string;
  address?: string;
  city?: string;
  sector?: string;
  createdAt?: any;
}

export default function AdminVerificationPanel({ isDarkMode, language }: AdminVerificationPanelProps) {
  const [users, setUsers] = useState<UserProfileDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('pending');
  const [selectedUser, setSelectedUser] = useState<UserProfileDoc | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // holds userId during action

  // Translations
  const t = {
    PT: {
      title: 'Controle de Identidade Fiscal (NUIT)',
      subtitle: 'Gerencie e valide a documentação fiscal e identidade de todos os agentes da plataforma.',
      searchPlaceholder: 'Pesquisar por nome, e-mail ou NUIT...',
      totalRequests: 'Total de Registros',
      pendingRequests: 'Pendentes',
      approvedRequests: 'Verificados',
      rejectedRequests: 'Rejeitados',
      user: 'Utilizador',
      fiscalId: 'NUIT',
      type: 'Tipo de Conta',
      status: 'Estado',
      actions: 'Ações',
      noRequests: 'Nenhum pedido encontrado.',
      userDetails: 'Detalhes do Utilizador',
      approve: 'Aprovar NUIT',
      reject: 'Rejeitar NUIT',
      approvedSuccess: 'NUIT aprovado com sucesso! Selo de verificação concedido.',
      rejectedSuccess: 'NUIT rejeitado com sucesso. Utilizador notificado.',
      nuitFormat: 'Formato NUIT',
      accountDetails: 'Dados da Conta',
      fiscalDetails: 'Informação Fiscal',
      buyer: 'Comprador',
      supplier: 'Fornecedor',
      logistics: 'Transportador / Logística',
      pending: 'Pendente',
      verified: 'Verificado',
      rejected: 'Rejeitado',
      location: 'Localização',
      sector: 'Setor',
      registeredAt: 'Data de Cadastro',
      contact: 'Contato',
      notProvided: 'Não informado',
      close: 'Fechar',
      badgeVerified: 'Conta Verificada'
    },
    EN: {
      title: 'Tax Identity Control (NUIT)',
      subtitle: 'Manage and validate fiscal documentation and identity for all platform agents.',
      searchPlaceholder: 'Search by name, email, or NUIT...',
      totalRequests: 'Total Records',
      pendingRequests: 'Pending',
      approvedRequests: 'Verified',
      rejectedRequests: 'Rejected',
      user: 'User',
      fiscalId: 'NUIT',
      type: 'Account Type',
      status: 'Status',
      actions: 'Actions',
      noRequests: 'No verification requests found.',
      userDetails: 'User Details',
      approve: 'Approve NUIT',
      reject: 'Reject NUIT',
      approvedSuccess: 'NUIT successfully approved! Verification badge granted.',
      rejectedSuccess: 'NUIT rejected. User notified of decision.',
      nuitFormat: 'NUIT Format',
      accountDetails: 'Account Information',
      fiscalDetails: 'Fiscal Details',
      buyer: 'Buyer',
      supplier: 'Supplier',
      logistics: 'Logistics / Carrier',
      pending: 'Pending',
      verified: 'Verified',
      rejected: 'Rejected',
      location: 'Location',
      sector: 'Sector',
      registeredAt: 'Registration Date',
      contact: 'Contact',
      notProvided: 'Not provided',
      close: 'Close',
      badgeVerified: 'Verified Account'
    }
  }[language];

  // Subscribe to users collection
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const fetched = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          uid: doc.id,
          id: doc.id,
          name: data.name || '',
          userName: data.userName || '',
          nuit: data.nuit || '',
          nuitStatus: data.nuitStatus || 'pending',
          verificationStatus: data.verificationStatus || 'pending',
          email: data.email || '',
          phone: data.phone || '',
          type: data.type || 'buyer',
          userType: data.userType || data.type || 'buyer',
          address: data.address || '',
          city: data.city || '',
          sector: data.sector || '',
          createdAt: data.createdAt
        } as UserProfileDoc;
      });
      // Sort: show pending first, then newest
      fetched.sort((a, b) => {
        if (a.verificationStatus === 'pending' && b.verificationStatus !== 'pending') return -1;
        if (a.verificationStatus !== 'pending' && b.verificationStatus === 'pending') return 1;
        return 0;
      });
      setUsers(fetched);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = users.length;
    const pending = users.filter(u => u.verificationStatus === 'pending').length;
    const verified = users.filter(u => u.verificationStatus === 'verified').length;
    const rejected = users.filter(u => u.verificationStatus === 'rejected').length;
    return { total, pending, verified, rejected };
  }, [users]);

  // Filter & Search users list
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      // 1. Filter by status tab
      if (statusFilter !== 'all' && u.verificationStatus !== statusFilter) {
        return false;
      }
      // 2. Search query
      const queryStr = searchTerm.toLowerCase();
      if (!queryStr) return true;

      return (
        u.name.toLowerCase().includes(queryStr) ||
        (u.userName && u.userName.toLowerCase().includes(queryStr)) ||
        u.email.toLowerCase().includes(queryStr) ||
        u.nuit.includes(queryStr)
      );
    });
  }, [users, statusFilter, searchTerm]);

  // Action: Approve NUIT
  const handleApprove = async (userId: string) => {
    setActionLoading(userId);
    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        nuitStatus: 'verified',
        verificationStatus: 'verified',
        updatedAt: new Date()
      });

      // Send real-time notification
      await notificationService.sendNotification({
        userId,
        title: language === 'PT' ? 'Conta Verificada!' : 'Account Verified!',
        message: language === 'PT' 
          ? 'O seu NUIT foi verificado com sucesso. Parabéns! A sua conta agora possui o selo "Conta Verificada" em todos os seus produtos, propostas e perfil.'
          : 'Your NUIT has been verified successfully. Congratulations! Your account now displays the "Verified Account" badge on all products, proposals, and your profile.',
        type: 'success'
      });

      // Update selectedUser view dynamically
      if (selectedUser && selectedUser.uid === userId) {
        setSelectedUser(prev => prev ? { ...prev, nuitStatus: 'verified', verificationStatus: 'verified' } : null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Action: Reject NUIT
  const handleReject = async (userId: string) => {
    setActionLoading(userId);
    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        nuitStatus: 'rejected',
        verificationStatus: 'rejected',
        updatedAt: new Date()
      });

      // Send real-time notification
      await notificationService.sendNotification({
        userId,
        title: language === 'PT' ? 'Verificação de NUIT Rejeitada' : 'NUIT Verification Rejected',
        message: language === 'PT'
          ? 'Infelizmente os dados do seu NUIT não puderam ser verificados. Por favor, aceda aos Ajustes para corrigir ou atualizar o seu número fiscal.'
          : 'Unfortunately, your NUIT information could not be verified. Please go to Settings to correct or update your fiscal number.',
        type: 'error'
      });

      // Update selectedUser view dynamically
      if (selectedUser && selectedUser.uid === userId) {
        setSelectedUser(prev => prev ? { ...prev, nuitStatus: 'rejected', verificationStatus: 'rejected' } : null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    } finally {
      setActionLoading(null);
    }
  };

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case 'buyer': return t.buyer;
      case 'supplier': return t.supplier;
      case 'logistics': return t.logistics;
      default: return type;
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return t.notProvided;
    if (typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toLocaleDateString();
    }
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className={`p-6 lg:p-8 space-y-8 min-h-screen ${isDarkMode ? 'text-zinc-100' : 'text-zinc-800'}`}>
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-wider flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-supplyx-blue animate-pulse" />
            {t.title}
          </h1>
          <p className="text-xs text-zinc-400 mt-2 max-w-2xl font-medium">
            {t.subtitle}
          </p>
        </div>
      </div>

      {/* Metrics Summary Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total card */}
        <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-zinc-900/60 border-white/5' : 'bg-white border-zinc-100 shadow-sm'}`}>
          <div className="text-zinc-500 text-[10px] uppercase tracking-widest font-black">{t.totalRequests}</div>
          <div className="text-3xl font-black mt-2">{metrics.total}</div>
        </div>

        {/* Pending card */}
        <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-zinc-900/60 border-white/5' : 'bg-white border-zinc-100 shadow-sm'}`}>
          <div className="text-yellow-500 text-[10px] uppercase tracking-widest font-black flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 animate-spin" />
            {t.pendingRequests}
          </div>
          <div className="text-3xl font-black mt-2 text-yellow-500">{metrics.pending}</div>
        </div>

        {/* Verified card */}
        <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-zinc-900/60 border-white/5' : 'bg-white border-zinc-100 shadow-sm'}`}>
          <div className="text-emerald-500 text-[10px] uppercase tracking-widest font-black flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" />
            {t.approvedRequests}
          </div>
          <div className="text-3xl font-black mt-2 text-emerald-500">{metrics.verified}</div>
        </div>

        {/* Rejected card */}
        <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-zinc-900/60 border-white/5' : 'bg-white border-zinc-100 shadow-sm'}`}>
          <div className="text-red-500 text-[10px] uppercase tracking-widest font-black flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" />
            {t.rejectedRequests}
          </div>
          <div className="text-3xl font-black mt-2 text-red-500">{metrics.rejected}</div>
        </div>
      </div>

      {/* Table & Controls container */}
      <div className={`rounded-3xl border overflow-hidden ${isDarkMode ? 'bg-zinc-950/40 border-white/5' : 'bg-white border-zinc-100 shadow-sm'}`}>
        
        {/* Controls block */}
        <div className={`p-5 border-b flex flex-col md:flex-row md:items-center gap-4 justify-between ${isDarkMode ? 'border-white/5' : 'border-zinc-100'}`}>
          
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-11 pr-4 py-3 rounded-2xl text-xs transition-all outline-none font-medium
                ${isDarkMode 
                  ? 'bg-zinc-900 text-white placeholder-zinc-500 focus:bg-zinc-905 border border-white/5' 
                  : 'bg-zinc-50 text-zinc-800 placeholder-zinc-400 focus:bg-zinc-100 border border-zinc-200/50'}`}
            />
          </div>

          {/* Filters Tab buttons */}
          <div className={`flex rounded-xl p-1 overflow-x-auto ${isDarkMode ? 'bg-zinc-900' : 'bg-zinc-100'}`}>
            {(['pending', 'all', 'verified', 'rejected'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer whitespace-nowrap
                  ${statusFilter === filter
                    ? 'bg-supplyx-blue text-white shadow'
                    : isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-800'}`}
              >
                {filter === 'all' ? (language === 'PT' ? 'Todos' : 'All') : t[filter]}
              </button>
            ))}
          </div>
        </div>

        {/* List Content */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 text-supplyx-blue animate-spin" />
            <p className="text-xs text-zinc-500 font-medium">{language === 'PT' ? 'Carregando dados...' : 'Loading data...'}</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center gap-4 text-center">
            <AlertCircle className="w-12 h-12 text-zinc-600 animate-bounce" />
            <div className="space-y-1">
              <p className="text-sm font-bold">{t.noRequests}</p>
              <p className="text-xs text-zinc-500">{language === 'PT' ? 'Tente ajustar os seus filtros ou termo de busca.' : 'Try adjusting your filters or search terms.'}</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={`border-b text-[10px] uppercase font-black tracking-widest text-zinc-500 ${isDarkMode ? 'border-white/5 bg-zinc-900/30' : 'border-zinc-100 bg-zinc-50/50'}`}>
                  <th className="py-4 px-6">{t.user}</th>
                  <th className="py-4 px-6">{t.fiscalId}</th>
                  <th className="py-4 px-6">{t.type}</th>
                  <th className="py-4 px-6">{t.status}</th>
                  <th className="py-4 px-6 text-right">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/5 dark:divide-white/5">
                <AnimatePresence mode="popLayout">
                  {filteredUsers.map((item) => (
                    <motion.tr
                      key={item.uid}
                      layoutId={`row-${item.uid}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => setSelectedUser(item)}
                      className={`group cursor-pointer transition-colors ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-zinc-50'}`}
                    >
                      {/* Name/Email column */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs uppercase
                            ${isDarkMode ? 'bg-zinc-900 text-zinc-300 group-hover:bg-supplyx-blue/10 group-hover:text-supplyx-blue' : 'bg-zinc-100 text-zinc-600'}`}>
                            {item.name ? item.name.charAt(0) : '?'}
                          </div>
                          <div>
                            <div className="font-bold group-hover:text-supplyx-blue transition-colors flex items-center gap-1.5">
                              {item.name}
                              {item.verificationStatus === 'verified' && (
                                <ShieldCheck className="w-4 h-4 text-emerald-500 fill-emerald-500/10" />
                              )}
                            </div>
                            <div className="text-zinc-500 mt-0.5 text-[10px]">{item.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* NUIT column */}
                      <td className="py-4 px-6">
                        <div className="font-mono font-bold tracking-wider">{item.nuit || '—'}</div>
                      </td>

                      {/* Type column */}
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider
                          ${item.type === 'supplier' 
                            ? 'bg-purple-500/10 text-purple-400' 
                            : item.type === 'logistics' 
                              ? 'bg-blue-500/10 text-blue-400' 
                              : 'bg-zinc-500/10 text-zinc-400'}`}>
                          {item.type === 'supplier' && <Building2 className="w-3 h-3" />}
                          {item.type === 'logistics' && <Truck className="w-3 h-3" />}
                          {item.type === 'buyer' && <User className="w-3 h-3" />}
                          {getAccountTypeLabel(item.type)}
                        </span>
                      </td>

                      {/* Status column */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5">
                          {item.verificationStatus === 'pending' && (
                            <span className="flex items-center gap-1.5 text-yellow-500 font-bold">
                              <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                              {t.pending}
                            </span>
                          )}
                          {item.verificationStatus === 'verified' && (
                            <span className="flex items-center gap-1.5 text-emerald-500 font-bold">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              {t.verified}
                            </span>
                          )}
                          {item.verificationStatus === 'rejected' && (
                            <span className="flex items-center gap-1.5 text-red-500 font-bold">
                              <span className="w-2 h-2 rounded-full bg-red-500" />
                              {t.rejected}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Quick Action buttons */}
                      <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                        {item.verificationStatus === 'pending' ? (
                          <div className="flex items-center justify-end gap-2">
                            {/* Reject */}
                            <button
                              onClick={() => handleReject(item.uid)}
                              disabled={actionLoading !== null}
                              className={`p-2 rounded-lg border text-red-500 transition-colors cursor-pointer
                                ${isDarkMode 
                                  ? 'border-red-500/20 bg-red-500/5 hover:bg-red-500/10' 
                                  : 'border-red-200 bg-red-50 hover:bg-red-100'}`}
                            >
                              {actionLoading === item.uid ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {/* Approve */}
                            <button
                              onClick={() => handleApprove(item.uid)}
                              disabled={actionLoading !== null}
                              className="p-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors cursor-pointer"
                            >
                              {actionLoading === item.uid ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <CheckCircle className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setSelectedUser(item)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer
                              ${isDarkMode ? 'text-zinc-500 hover:text-white hover:bg-white/5' : 'text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100'}`}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slidout User Details Drawer */}
      <AnimatePresence>
        {selectedUser && (
          <>
            {/* Overlay background */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
              className="fixed inset-0 bg-black z-[100]"
            />

            {/* Sliding Drawer body */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className={`fixed right-0 top-0 h-screen w-full max-w-md z-[110] shadow-2xl flex flex-col overflow-y-auto border-l
                ${isDarkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-white border-zinc-200 text-zinc-800'}`}
            >
              {/* Header drawer */}
              <div className={`p-6 border-b flex items-center justify-between ${isDarkMode ? 'border-white/5 bg-zinc-900/30' : 'border-zinc-100 bg-zinc-50'}`}>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-widest">{t.userDetails}</h3>
                  <p className="text-[10px] text-zinc-500 mt-1">ID: {selectedUser.uid}</p>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] uppercase font-black tracking-widest cursor-pointer
                    ${isDarkMode ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600'}`}
                >
                  {t.close}
                </button>
              </div>

              {/* Body drawer */}
              <div className="flex-1 p-6 space-y-6">
                
                {/* Profile Hero card */}
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl uppercase
                    ${isDarkMode ? 'bg-zinc-900 text-zinc-200 border border-white/5' : 'bg-zinc-100 text-zinc-700'}`}>
                    {selectedUser.name ? selectedUser.name.charAt(0) : '?'}
                  </div>
                  <div>
                    <h4 className="text-base font-bold flex items-center gap-2">
                      {selectedUser.name}
                      {selectedUser.verificationStatus === 'verified' && (
                        <ShieldCheck className="w-5 h-5 text-emerald-500 fill-emerald-500/10" />
                      )}
                    </h4>
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider mt-1.5`}>
                      <span className={`w-2 h-2 rounded-full ${selectedUser.verificationStatus === 'verified' ? 'bg-emerald-500' : selectedUser.verificationStatus === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                      {t[selectedUser.verificationStatus]}
                    </span>
                  </div>
                </div>

                {/* Account Type Alert banner */}
                <div className={`p-4 rounded-2xl border text-xs flex items-center gap-3
                  ${selectedUser.type === 'supplier' 
                    ? 'border-purple-500/20 bg-purple-500/5 text-purple-400' 
                    : selectedUser.type === 'logistics' 
                      ? 'border-blue-500/20 bg-blue-500/5 text-blue-400' 
                      : 'border-zinc-500/20 bg-zinc-500/5 text-zinc-400'}`}>
                  {selectedUser.type === 'supplier' && <Building2 className="w-5 h-5 flex-shrink-0" />}
                  {selectedUser.type === 'logistics' && <Truck className="w-5 h-5 flex-shrink-0" />}
                  {selectedUser.type === 'buyer' && <User className="w-5 h-5 flex-shrink-0" />}
                  <div>
                    <span className="font-bold">{getAccountTypeLabel(selectedUser.type)}</span>
                    <p className={`text-[10px] mt-0.5 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      {selectedUser.type === 'supplier' 
                        ? 'Fornecedor autorizado de mercadorias no SupplyX.' 
                        : selectedUser.type === 'logistics' 
                          ? 'Operador credenciado para logística e frotas.' 
                          : 'Comprador ativo e solicitante de propostas.'}
                    </p>
                  </div>
                </div>

                {/* Information blocks */}
                <div className="space-y-4">
                  <h5 className="text-[10px] uppercase tracking-widest font-black text-zinc-500">{t.accountDetails}</h5>
                  
                  {/* Fields list */}
                  <div className={`rounded-2xl border p-4 space-y-3.5 text-xs ${isDarkMode ? 'bg-zinc-900/40 border-white/5' : 'bg-zinc-50/50 border-zinc-150'}`}>
                    
                    {/* Email */}
                    <div className="flex items-start gap-3">
                      <Mail className="w-4 h-4 text-zinc-500 mt-0.5" />
                      <div>
                        <div className="text-[10px] text-zinc-500 font-bold uppercase">{language === 'PT' ? 'E-mail' : 'Email'}</div>
                        <div className="font-bold mt-0.5">{selectedUser.email || '—'}</div>
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="flex items-start gap-3">
                      <Phone className="w-4 h-4 text-zinc-500 mt-0.5" />
                      <div>
                        <div className="text-[10px] text-zinc-500 font-bold uppercase">{language === 'PT' ? 'Telefone' : 'Phone'}</div>
                        <div className="font-bold mt-0.5 font-mono">{selectedUser.phone || '—'}</div>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-zinc-500 mt-0.5" />
                      <div>
                        <div className="text-[10px] text-zinc-500 font-bold uppercase">{t.location}</div>
                        <div className="font-bold mt-0.5">{selectedUser.city ? `${selectedUser.city}${selectedUser.address ? `, ${selectedUser.address}` : ''}` : t.notProvided}</div>
                      </div>
                    </div>

                    {/* Sector */}
                    <div className="flex items-start gap-3">
                      <Briefcase className="w-4 h-4 text-zinc-500 mt-0.5" />
                      <div>
                        <div className="text-[10px] text-zinc-500 font-bold uppercase">{t.sector}</div>
                        <div className="font-bold mt-0.5">{selectedUser.sector || t.notProvided}</div>
                      </div>
                    </div>

                    {/* CreatedAt */}
                    <div className="flex items-start gap-3">
                      <Calendar className="w-4 h-4 text-zinc-500 mt-0.5" />
                      <div>
                        <div className="text-[10px] text-zinc-500 font-bold uppercase">{t.registeredAt}</div>
                        <div className="font-bold mt-0.5">{formatDate(selectedUser.createdAt)}</div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Fiscal verification section */}
                <div className="space-y-4">
                  <h5 className="text-[10px] uppercase tracking-widest font-black text-zinc-500">{t.fiscalDetails}</h5>
                  
                  <div className={`rounded-2xl border p-4 space-y-3.5 text-xs ${isDarkMode ? 'bg-zinc-900/40 border-white/5' : 'bg-zinc-50/50 border-zinc-150'}`}>
                    
                    {/* NUIT Code */}
                    <div className="flex items-start gap-3">
                      <FileText className="w-4 h-4 text-supplyx-blue mt-0.5" />
                      <div>
                        <div className="text-[10px] text-zinc-500 font-bold uppercase">{t.fiscalId}</div>
                        <div className="font-black text-sm font-mono tracking-wider text-supplyx-blue mt-0.5">{selectedUser.nuit || '—'}</div>
                      </div>
                    </div>

                    {/* NUIT Status */}
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="w-4 h-4 text-zinc-500 mt-0.5" />
                      <div>
                        <div className="text-[10px] text-zinc-500 font-bold uppercase">{language === 'PT' ? 'Estado do NUIT' : 'NUIT Status'}</div>
                        <div className="font-bold mt-0.5 flex items-center gap-1.5">
                          {selectedUser.nuitStatus === 'pending' && <span className="text-yellow-500">{t.pending}</span>}
                          {selectedUser.nuitStatus === 'verified' && <span className="text-emerald-500 font-bold">{t.verified}</span>}
                          {selectedUser.nuitStatus === 'rejected' && <span className="text-red-500 font-bold">{t.rejected}</span>}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

              </div>

              {/* Actions drawer footer */}
              {selectedUser.verificationStatus === 'pending' && (
                <div className={`p-6 border-t flex gap-4 ${isDarkMode ? 'border-white/5 bg-zinc-950' : 'border-zinc-100 bg-zinc-50'}`}>
                  {/* Reject button */}
                  <button
                    disabled={actionLoading !== null}
                    onClick={() => handleReject(selectedUser.uid)}
                    className={`flex-1 py-3 px-4 rounded-xl border font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer
                      ${isDarkMode 
                        ? 'border-red-500/30 bg-red-500/5 hover:bg-red-500/10 text-red-400' 
                        : 'border-red-200 bg-red-50 hover:bg-red-100 text-red-600'}`}
                  >
                    {actionLoading === selectedUser.uid ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    {t.reject}
                  </button>

                  {/* Approve button */}
                  <button
                    disabled={actionLoading !== null}
                    onClick={() => handleApprove(selectedUser.uid)}
                    className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {actionLoading === selectedUser.uid ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    {t.approve}
                  </button>
                </div>
              )}

            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
