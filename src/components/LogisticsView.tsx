import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Truck, 
  MapPin, 
  Package, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Navigation2,
  Plus,
  Weight,
  Calendar,
  Search,
  ArrowRight,
  ShieldCheck,
  Handshake,
  Star,
  Smartphone,
  Building2,
  Loader2,
  CheckCircle,
  CreditCard,
  Download,
  X,
  PlusCircle,
  Map as MapIcon,
  TrendingUp,
  MoreVertical
} from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  serverTimestamp, 
  deleteDoc, 
  doc, 
  updateDoc 
} from 'firebase/firestore';

interface LogisticsViewProps {
  isDarkMode: boolean;
  language: 'PT' | 'EN';
  userType?: string;
}

export default function LogisticsView({ isDarkMode, language, userType }: LogisticsViewProps) {
  if (userType === 'logistics') {
    return <LogisticsPartnerDashboard isDarkMode={isDarkMode} language={language} />;
  }
  return <LogisticsTrackingView isDarkMode={isDarkMode} language={language} userType={userType} />;
}

function LogisticsTrackingView({ isDarkMode, language, userType }: LogisticsViewProps) {
  const translations = useMemo(() => ({
    PT: {
      title: userType === 'logistics' ? 'Painel da Transportadora' : 'Controle Logístico',
      subtitle: userType === 'logistics' ? 'Gestão operacional de frotas' : 'Gestão de frotas e suprimentos',
      btnHire: userType === 'logistics' ? 'Nova Carga' : 'Contratar Transporte',
      activeVehicles: 'Veículos em Rota',
      completedDeliveries: 'Entregas Concluídas',
      pendingCritical: 'Incidentes Críticos',
      liveTracking: 'Rastreamento Live',
      shipmentStatus: 'Status de Envios',
      bookingTitle: 'Solicitar Cotação Inteligente',
      bookingSubtitle: 'Preencha os dados para receber propostas de transportadoras verificadas.',
      carriersTitle: 'Frotas Disponíveis',
      searchPlaceholder: 'Pesquisar transportadora...',
      step1: 'Tipo de Veículo',
      step2: 'Rotas e Carga',
      origin: 'Origem (Coleta)',
      destination: 'Destino (Entrega)',
      weight: 'Peso (Ton)',
      date: 'Data Preferencial',
      btnSubmit: 'Solicitar Orçamentos',
      hiring: 'Contratando...',
      hireNow: 'Contratar agora',
      checkoutTitle: 'Check-out Seguro',
      paymentMethod: 'Meio de Pagamento',
      summary: 'Resumo da Reserva',
      confirmPayment: 'Confirmar Pagamento',
      success: 'Reserva Confirmada!',
      transaction: 'Transação',
      backToLogistics: 'Voltar para Logística',
      searching: 'Pesquisando...',
      transactionId: 'ID Transação',
      requestQuotes: 'Solicitar Orçamentos',
      notesPlaceholder: 'Observações adicionais...',
      disclaimer: 'As transportadoras listadas são verificadas pela SupplyX Intelligence para garantir segurança e prazo.',
      verified: 'VERIFICADO',
      capacity: 'Capacidade',
      requestByCategory: 'Solicitar por Categoria',
      archived: 'Envios arquivados!',
      archiveAction: '+ Arquivar envios finalizados',
      statuses: {
        transit: 'Em Trânsito',
        loading: 'Carregando',
        finished: 'Finalizado'
      }
    },
    EN: {
      title: userType === 'logistics' ? 'Carrier Dashboard' : 'Logistics Control',
      subtitle: userType === 'logistics' ? 'Operational fleet management' : 'Fleet & supply management',
      btnHire: userType === 'logistics' ? 'New Cargo' : 'Hire Transport',
      activeVehicles: 'Vehicles in Route',
      completedDeliveries: 'Completed Deliveries',
      pendingCritical: 'Critical Incidents',
      liveTracking: 'Live Tracking',
      shipmentStatus: 'Shipment Status',
      bookingTitle: 'Request Smart Quote',
      bookingSubtitle: 'Fill in details to receive proposals from verified carriers.',
      carriersTitle: 'Available Fleets',
      searchPlaceholder: 'Search carriers...',
      step1: 'Vehicle Type',
      step2: 'Routes & Cargo',
      origin: 'Pick-up Location',
      destination: 'Drop-off Location',
      weight: 'Weight (Ton)',
      date: 'Preferred Date',
      btnSubmit: 'Request Quotes',
      hiring: 'Hiring...',
      hireNow: 'Hire now',
      checkoutTitle: 'Secure Checkout',
      paymentMethod: 'Payment Method',
      summary: 'Booking Summary',
      confirmPayment: 'Confirm Payment',
      success: 'Booking Confirmed!',
      transaction: 'Transaction',
      backToLogistics: 'Back to Logistics',
      searching: 'Searching...',
      transactionId: 'Transaction ID',
      requestQuotes: 'Request Quotes',
      notesPlaceholder: 'Additional notes...',
      disclaimer: 'Carriers listed are verified by SupplyX Intelligence to ensure safety and lead time.',
      verified: 'VERIFIED',
      capacity: 'Capacity',
      requestByCategory: 'Request by Category',
      archived: 'Shipments archived!',
      archiveAction: '+ Archive completed shipments',
      statuses: {
        transit: 'In Transit',
        loading: 'Loading',
        finished: 'Finished'
      }
    }
  }), []);

  const t = translations[language || 'PT'];

  const initialShipments = useMemo(() => [
    { id: 'LOG-001', material: language === 'PT' ? '200 Sacas de Cimento' : '200 Bags of Cement', status: t.statuses.transit, ETA: '14:30', origin: 'Porto de Maputo', destination: 'Obra Alvorada', progress: 65, carrier: 'Transportes Lalgy' },
    { id: 'LOG-002', material: language === 'PT' ? 'Vergalhão CA-50' : 'CA-50 Rebar', status: t.statuses.loading, ETA: language === 'PT' ? 'Amanhã' : 'Tomorrow', origin: 'Matola Logística', destination: 'Obra Central', progress: 15, carrier: 'Entreposto Moz' },
    { id: 'LOG-003', material: language === 'PT' ? 'Areia e Brita' : 'Sand and Gravel', status: t.statuses.finished, ETA: language === 'PT' ? 'Entregue' : 'Delivered', origin: 'Pedreira de Boane', destination: 'Moamba Park', progress: 100, carrier: 'J&J Transport' },
  ], [language, t]);

  const carriers = useMemo(() => [
    { id: '1', name: 'Transportes Lalgy', type: language === 'PT' ? 'Pesado' : 'Heavy', rating: 4.8, fleetSize: 1500, coverage: language === 'PT' ? 'Nacional' : 'National', pricePerKm: 'MT 45,00', verified: true, basePrice: 12500 },
    { id: '2', name: 'Entreposto Moz', type: language === 'PT' ? 'Logística' : 'Logistics', rating: 4.9, fleetSize: 120, coverage: language === 'PT' ? 'Sul/Centro' : 'South/Central', pricePerKm: 'MT 55,00', verified: true, basePrice: 8900 },
    { id: '3', name: 'J&J Transport', type: language === 'PT' ? 'Portuário' : 'Port', rating: 4.5, fleetSize: 500, coverage: language === 'PT' ? 'Beira/Tete' : 'Beira/Tete', pricePerKm: 'MT 42,00', verified: true, basePrice: 15750 },
    { id: '4', name: 'Zitamar Logística', type: language === 'PT' ? 'Urbano' : 'Urban', rating: 4.6, fleetSize: 45, coverage: language === 'PT' ? 'Maputo/Matola' : 'Maputo/Matola', pricePerKm: 'MT 60,00', verified: true, basePrice: 5500 },
  ], [language]);

  const truckTypes = useMemo(() => [
    { id: 'vuc', name: 'VUC', capacity: '3t', icon: Truck, description: language === 'PT' ? 'Ideal para Matola e Maputo' : 'Ideal for Matola and Maputo' },
    { id: 'toco', name: 'Toco', capacity: '6t', icon: Truck, description: language === 'PT' ? 'Cargas médias inter-provinciais' : 'Medium inter-provincial loads' },
    { id: 'truck', name: 'Truck', capacity: '12-14t', icon: Truck, description: language === 'PT' ? 'Cargas pesadas nacionais' : 'National heavy loads' },
    { id: 'carreta', name: 'Carreta', capacity: '25-30t', icon: Truck, description: language === 'PT' ? 'Corredor da Beira / Nacala' : 'Beira / Nacala Corridor' },
  ], [language]);

  const [allShipments, setAllShipments] = useState(initialShipments);
  const [showBooking, setShowBooking] = useState(false);
  const [showArchiveSuccess, setShowArchiveSuccess] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<any>(initialShipments[0]);

  const timelineSteps = [
    { label: language === 'PT' ? 'Saída do Depósito' : 'Warehouse Exit', status: 'completed', time: '08:00', location: 'Porto de Maputo' },
    { label: language === 'PT' ? 'Posto de Controle A1' : 'Checkpoint A1', status: 'completed', time: '10:30', location: 'Estrada Circular' },
    { label: language === 'PT' ? 'Em Trânsito' : 'In Transit', status: 'current', time: '12:45', location: 'Cruzando Boane' },
    { label: language === 'PT' ? 'Entrega Estimada' : 'Estimated Delivery', status: 'pending', time: '14:30', location: 'Matola Hub' },
  ];

  const archiveCompleted = () => {
    const finishedStatus = t.statuses.finished;
    const completedCount = allShipments.filter(s => s.status === finishedStatus).length;
    if (completedCount === 0) return;
    
    setAllShipments(prev => prev.filter(s => s.status !== finishedStatus));
    setShowArchiveSuccess(true);
    setTimeout(() => setShowArchiveSuccess(false), 3000);
  };

  const [selectedTruck, setSelectedTruck] = useState('');
  const [bookingStep, setBookingStep] = useState(1); // 1: Form, 2: Payment, 3: Success
  const [selectedCarrier, setSelectedCarrier] = useState<any | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  const paymentMethods = [
    { id: 'bim', name: 'Millennium BIM', type: 'Bank', color: 'bg-[#002d72]' },
    { id: 'bci', name: 'BCI', type: 'Bank', color: 'bg-[#e30613]' },
    { id: 'standard', name: 'Standard Bank', type: 'Bank', color: 'bg-[#0033a1]' },
    { id: 'mpesa', name: 'M-Pesa', type: 'Mobile', color: 'bg-[#e60000]' },
    { id: 'emola', name: 'e-Mola', type: 'Mobile', color: 'bg-[#ffca05]' },
  ];

  const handleBookingSubmit = () => {
    // In a real app we would search, here we just show the carriers
    // This is already handled by showBooking state toggle
  };

  const handleConfirmCarrier = (carrier: any) => {
    setSelectedCarrier(carrier);
    setBookingStep(2);
  };

  const exportBookingToExcel = () => {
    if (!selectedCarrier) return;
    const data = [
      [t.origin, t.origin], // Simplified for example
      [t.destination, t.destination],
      [t.weight, '10t'],
      [t.status, t.statuses.finished],
      [t.date, new Date().toLocaleDateString()],
      [t.transactionId, `#LX-${Math.random().toString(36).substring(7).toUpperCase()}`]
    ];
    const csvContent = "data:text/csv;charset=utf-8," + data.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reserva_logistica_${selectedCarrier.name.replace(/\s/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePayment = () => {
    if (!selectedPaymentMethod) return;
    setIsPaying(true);
    setTimeout(() => {
      setIsPaying(false);
      setBookingStep(3);
    }, 2000);
  };

  if (showBooking) {
    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-8"
      >
        <div className="flex items-center justify-between">
          <button 
            onClick={() => {
              if (bookingStep > 1) {
                setBookingStep(bookingStep - 1);
              } else {
                setShowBooking(false);
              }
            }}
            className={`flex items-center gap-2 text-sm font-black uppercase italic tracking-tighter ${isDarkMode ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-zinc-900'}`}
          >
            ← {language === 'PT' ? 'Voltar' : 'Back'}
          </button>
        </div>

        {bookingStep === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className={`lg:col-span-2 p-8 rounded-3xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100 shadow-sm'}`}>
              <div className="mb-8">
                <h2 className={`text-2xl font-black italic tracking-tighter uppercase mb-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{t.bookingTitle}</h2>
                <p className="text-zinc-500 text-sm font-bold">{t.bookingSubtitle}</p>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-brand uppercase tracking-widest">{t.step1}</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {truckTypes.map((type) => (
                      <button 
                        key={type.id}
                        onClick={() => setSelectedTruck(type.id)}
                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                          selectedTruck === type.id 
                            ? 'border-brand bg-brand/5 shadow-lg shadow-brand/10' 
                            : isDarkMode ? 'border-zinc-800 hover:border-zinc-700' : 'border-zinc-50 hover:border-zinc-200'
                        }`}
                      >
                        <type.icon className={`w-6 h-6 ${selectedTruck === type.id ? 'text-brand' : 'text-zinc-500'}`} />
                        <span className={`text-[10px] font-black uppercase text-center ${selectedTruck === type.id ? 'text-zinc-900 dark:text-white' : 'text-zinc-500'}`}>{type.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-brand uppercase tracking-widest">{t.step2}</label>
                    <div className="space-y-3">
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input 
                          type="text" 
                          placeholder={t.origin}
                          className={`w-full pl-10 pr-4 py-3 border rounded-xl text-xs font-bold outline-none transition-all ${
                            isDarkMode ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                          }`}
                        />
                      </div>
                      <div className="relative">
                        <Navigation2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand" />
                        <input 
                          type="text" 
                          placeholder={t.destination}
                          className={`w-full pl-10 pr-4 py-3 border rounded-xl text-xs font-bold outline-none transition-all ${
                            isDarkMode ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest opacity-0 invisible">Details</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <Weight className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input 
                          type="number" 
                          placeholder={t.weight}
                          className={`w-full pl-10 pr-4 py-3 border rounded-xl text-xs font-bold outline-none transition-all ${
                            isDarkMode ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                          }`}
                        />
                      </div>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input 
                          type="text" 
                          placeholder={t.date}
                          className={`w-full pl-10 pr-4 py-3 border rounded-xl text-xs font-bold outline-none transition-all ${
                            isDarkMode ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                          }`}
                        />
                      </div>
                    </div>
                    <textarea 
                      placeholder={language === 'PT' ? 'Observações adicionais...' : 'Additional notes...'}
                      className={`w-full p-4 border rounded-xl text-xs font-bold outline-none transition-all h-20 resize-none ${
                        isDarkMode ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                      }`}
                    />
                  </div>
                </div>

                <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-brand/5 border-brand/20' : 'bg-brand/5 border-zinc-100'}`}>
                  <p className="text-[10px] font-bold text-zinc-500 leading-relaxed">
                    * {language === 'PT' ? 'As transportadoras listadas são verificadas pela SupplyX Intelligence para garantir segurança e prazo.' : 'Carriers listed are verified by SupplyX Intelligence to ensure safety and lead time.'}
                  </p>
                </div>

                <button 
                  onClick={() => {
                    const btn = document.getElementById('searching-feedback');
                    if (btn) btn.innerHTML = language === 'PT' ? 'PESQUISANDO...' : 'SEARCHING...';
                    setTimeout(() => {
                      if (btn) btn.innerHTML = language === 'PT' ? 'SOLICITAR ORÇAMENTOS' : 'REQUEST QUOTES';
                    }, 1500);
                  }}
                  id="searching-feedback"
                  className="w-full py-5 bg-brand text-white rounded-2xl font-black text-lg italic uppercase tracking-tighter shadow-xl shadow-brand/20 hover:bg-brand-hover transition-all active:scale-95"
                >
                  {t.btnSubmit}
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className={`text-sm font-black uppercase italic tracking-tighter ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>{t.carriersTitle}</h3>
              <div className="space-y-4">
                {carriers.map((carrier) => (
                  <div 
                    key={carrier.id}
                    className={`p-5 rounded-2xl border transition-all relative group shadow-sm ${
                      isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-100'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center">
                        <Truck className="w-5 h-5 text-brand" />
                      </div>
                      <div className="flex items-center gap-1 bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-lg text-[10px] font-black">
                        <Star className="w-3 h-3 fill-amber-500" />
                        {carrier.rating}
                      </div>
                    </div>
                    <h4 className={`font-black italic uppercase tracking-tighter mb-1 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{carrier.name}</h4>
                    <div className="flex gap-2 mb-4">
                      <span className="text-[9px] font-black uppercase text-zinc-500">{carrier.type}</span>
                      <span className="text-[9px] font-black uppercase text-brand">• {carrier.coverage}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-black uppercase text-zinc-400 mb-4">
                      <span>Km/MT: {carrier.pricePerKm}</span>
                      <span className="text-emerald-500 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> {language === 'PT' ? 'VERIFICADO' : 'VERIFIED'}
                      </span>
                    </div>
                    
                    <button 
                      onClick={() => handleConfirmCarrier(carrier)}
                      className="w-full py-3 bg-zinc-950 dark:bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 group-hover:shadow-lg group-hover:shadow-brand/20"
                    >
                      {t.hireNow}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {bookingStep === 2 && selectedCarrier && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="space-y-6">
              <h4 className={`text-xs font-black uppercase tracking-widest text-zinc-500`}>{t.paymentMethod}</h4>
              <div className="grid grid-cols-1 gap-3">
                {paymentMethods.map(method => (
                  <button 
                    key={method.id}
                    onClick={() => setSelectedPaymentMethod(method.id)}
                    className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-4 relative overflow-hidden group ${
                      selectedPaymentMethod === method.id 
                        ? 'border-brand bg-brand/5 shadow-xl shadow-brand/10' 
                        : isDarkMode ? 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700' : 'border-zinc-100 bg-white hover:border-zinc-200'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${method.color} shadow-lg transition-transform group-hover:scale-105`}>
                      {method.type === 'Bank' ? <Building2 className="w-6 h-6 text-white" /> : <Smartphone className="w-6 h-6 text-white" />}
                    </div>
                    <div className="text-left">
                      <p className={`text-sm font-black uppercase italic tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{method.name}</p>
                      <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mt-0.5">{method.type === 'Bank' ? (language === 'PT' ? 'Transferência Bancária' : 'Bank Transfer') : (language === 'PT' ? 'Carteira Móvel' : 'Mobile Wallet')}</p>
                    </div>
                    {selectedPaymentMethod === method.id && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2 className="w-4 h-4 text-brand" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className={`p-8 rounded-3xl border flex flex-col h-full ${isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
              <div className="flex-grow">
                <div className="flex justify-between items-center mb-6 border-b border-zinc-500/10 pb-6">
                  <h4 className={`text-xs font-black uppercase tracking-widest text-zinc-500`}>{t.summary}</h4>
                  <span className="text-[10px] font-black uppercase text-brand">{selectedCarrier.name}</span>
                </div>
                
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-zinc-500 uppercase tracking-widest">{language === 'PT' ? 'Taxa Base' : 'Base Rate'}</span>
                    <span className={`font-black ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>MT {selectedCarrier.basePrice.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-zinc-500 uppercase tracking-widest">{language === 'PT' ? 'Seguro' : 'Insurance'}</span>
                    <span className={`font-black text-emerald-500 uppercase`}>{language === 'PT' ? 'INCLUSO' : 'INCLUDED'}</span>
                  </div>
                </div>

                <div className={`p-6 rounded-2xl mb-8 ${isDarkMode ? 'bg-zinc-900' : 'bg-white shadow-sm'}`}>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">{language === 'PT' ? 'TOTAL' : 'TOTAL'}</p>
                  <p className="text-4xl font-black italic tracking-tighter text-brand">MT {selectedCarrier.basePrice.toLocaleString('pt-BR')}</p>
                </div>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={handlePayment}
                  disabled={!selectedPaymentMethod || isPaying}
                  className="w-full py-4 bg-brand text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-brand/20 hover:brightness-110 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isPaying ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                  {t.confirmPayment}
                </button>
              </div>
            </div>
          </div>
        )}

        {bookingStep === 3 && (
          <div className="flex-grow flex flex-col items-center justify-center py-20">
            <div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/20 mb-8 relative">
              <CheckCircle className="w-12 h-12" />
              <motion.div 
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 1.8, opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 bg-emerald-500 rounded-full"
              />
            </div>
            <p className={`text-2xl font-black uppercase italic tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{t.success}</p>
            <p className="text-zinc-500 text-sm font-bold mt-2 mb-8">{t.transaction}: #LX-{Math.random().toString(36).substring(7).toUpperCase()}</p>
            
            <button 
              onClick={exportBookingToExcel}
              className="flex items-center gap-2 px-6 py-2 bg-emerald-500/10 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all mb-4"
            >
              <Download className="w-3 h-3" />
              {language === 'PT' ? 'Baixar Comprovativo (Excel)' : 'Download Receipt (Excel)'}
            </button>

            <div className="mt-4">
              <button 
                onClick={() => {
                  setShowBooking(false);
                  setBookingStep(1);
                  setSelectedCarrier(null);
                  setSelectedPaymentMethod(null);
                }}
                className="px-12 py-4 bg-zinc-900 dark:bg-brand text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95"
              >
                {t.backToLogistics}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className={`p-10 rounded-[48px] border flex flex-col lg:flex-row justify-between items-center gap-8 ${
        isDarkMode ? 'bg-zinc-900 border-white/5 shadow-3xl' : 'bg-white border-zinc-100 shadow-sm'
      }`}>
        <div className="text-center lg:text-left flex items-center gap-6">
           <div className="w-16 h-16 rounded-[24px] bg-supplyx-blue/10 flex items-center justify-center text-supplyx-blue">
             <Truck className="w-8 h-8" />
           </div>
           <div>
             <h2 className={`text-3xl font-black italic tracking-tighter uppercase mb-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{t.title}</h2>
             <p className="text-zinc-500 text-[11px] font-black uppercase tracking-[0.3em]">{t.subtitle}</p>
           </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="hidden sm:flex items-center gap-3 px-6 py-3 bg-white/5 rounded-2xl border border-white/5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Network Secure</span>
           </div>
           <button 
             onClick={() => setShowBooking(true)}
             className="bg-supplyx-blue hover:bg-blue-600 text-white px-10 py-5 rounded-[24px] text-sm font-black italic uppercase tracking-widest transition-all active:scale-95 shadow-3xl shadow-blue-500/20 flex items-center gap-4"
           >
             <Plus className="w-6 h-6 border-2 border-white/20 rounded-full" />
             {t.btnHire}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        {[
          { label: t.activeVehicles, val: '12', icon: Truck, color: 'text-brand', bg: 'bg-brand/10' },
          { label: t.completedDeliveries, val: '45', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: t.pendingCritical, val: '2', icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        ].map((stat, i) => (stat &&
          <motion.div 
            key={i}
            whileHover={{ y: -5 }}
            className={`p-6 rounded-3xl border flex items-center gap-4 ${
              isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100 shadow-sm'
            }`}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.bg}`}>
              <stat.icon className={`w-7 h-7 ${stat.color}`} />
            </div>
            <div>
              <p className={`text-2xl font-black italic tracking-tighter leading-none ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{stat.val}</p>
              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-1">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* NEW Fleet Quick Selection */}
      <div className="space-y-4">
        <h3 className={`text-sm font-black uppercase italic tracking-tighter ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
          {language === 'PT' ? 'Solicitar por Categoria' : 'Request by Category'}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {truckTypes.map((type) => (
            <motion.button 
              key={type.id}
              whileHover={{ y: -5 }}
              onClick={() => {
                setSelectedTruck(type.id);
                setShowBooking(true);
                setBookingStep(1);
              }}
              className={`p-6 rounded-3xl border transition-all flex flex-col items-center gap-4 group text-center ${
                isDarkMode ? 'bg-zinc-900 border-zinc-800 hover:border-brand/30' : 'bg-white border-zinc-100 shadow-sm hover:border-brand/30'
              }`}
            >
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 transition-all group-hover:bg-brand/10 group-hover:text-brand">
                <type.icon className="w-8 h-8 text-zinc-400 group-hover:text-brand" />
              </div>
              <div>
                <p className={`text-xl font-black italic tracking-tighter uppercase leading-none ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                  {type.name}
                </p>
                <p className="text-[10px] font-bold text-zinc-500 uppercase mt-1">
                  {language === 'PT' ? 'Capacidade' : 'Capacity'}: {type.capacity}
                </p>
                <p className="text-[8px] font-medium text-zinc-400 uppercase mt-1 line-clamp-1">{type.description}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
        <div className={`xl:col-span-2 rounded-[48px] border overflow-hidden relative group ${isDarkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-100 shadow-xl'}`}>
          <div className="p-10 border-b border-white/5 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-supplyx-blue/10 flex items-center justify-center">
                <Navigation2 className="w-6 h-6 text-supplyx-blue" />
              </div>
              <div>
                <h3 className={`text-xl font-black uppercase italic tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{t.liveTracking}</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Global Logistics Grid v2.4</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {language === 'PT' ? 'Nós ativos: 1.242' : 'Active nodes: 1,242'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="h-[500px] relative bg-supplyx-deep/20 overflow-hidden">
             <div className="absolute inset-0 opacity-20 pointer-events-none">
                <svg width="100%" height="100%" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice">
                   <path d="M100 200 Q 200 100 400 250 T 700 300" stroke="#3B82F6" strokeWidth="2" fill="none" strokeDasharray="10 10" />
                   <path d="M50 400 Q 250 350 450 450 T 750 350" stroke="#3B82F6" strokeWidth="2" fill="none" strokeDasharray="10 10" />
                   <circle cx="100" cy="200" r="4" fill="#3B82F6" />
                   <circle cx="700" cy="300" r="4" fill="#3B82F6" />
                   <circle cx="50" cy="400" r="4" fill="#3B82F6" />
                   <circle cx="750" cy="350" r="4" fill="#3B82F6" />
                </svg>
             </div>

             {allShipments.filter(s => s.status !== t.statuses.finished).map((s, idx) => (
                <motion.div 
                  key={s.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute"
                  style={{ top: `${20 + idx * 25}%`, left: `${15 + idx * 30}%` }}
                >
                   <div className="relative group/shipment cursor-pointer" onClick={() => setSelectedShipment(s)}>
                      <div className="absolute -inset-4 bg-supplyx-blue/20 blur-xl rounded-full animate-pulse" />
                      <div className={`p-4 rounded-2xl bg-supplyx-deep border-2 transition-all ${selectedShipment?.id === s.id ? 'border-supplyx-blue scale-110 shadow-2xl' : 'border-white/10 opacity-70'}`}>
                         <Truck className="w-6 h-6 text-supplyx-blue mb-2" />
                         <div className="text-[8px] font-black uppercase text-white tracking-widest">{s.id}</div>
                      </div>
                      
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-48 p-4 glass-dark rounded-2xl border border-white/10 opacity-0 group-hover/shipment:opacity-100 transition-opacity z-50 pointer-events-none text-white">
                         <p className="text-[10px] font-black text-supplyx-blue uppercase mb-1">{s.carrier}</p>
                         <p className="text-xs font-black text-white italic truncate">{s.material}</p>
                         <div className="flex justify-between items-center mt-3 text-[8px] font-black text-zinc-500 uppercase tracking-widest">
                            <span>ETA {s.ETA}</span>
                            <span>{s.progress}%</span>
                         </div>
                      </div>
                   </div>
                </motion.div>
             ))}
             
             <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between pointer-events-none">
                <div className="p-6 rounded-3xl bg-zinc-950/80 backdrop-blur-md border border-white/10 flex gap-8">
                   <div className="text-center">
                      <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Avg Lead Time</p>
                      <p className="text-xl font-black italic text-white leading-none">2.4d</p>
                   </div>
                   <div className="w-px h-10 bg-white/10" />
                   <div className="text-center">
                      <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Efficiency Ratio</p>
                      <p className="text-xl font-black italic text-emerald-500 leading-none">98.2%</p>
                   </div>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-950/80 backdrop-blur-md border border-white/10 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                   {language === 'PT' ? 'Status do Link de Telemetria' : 'Live Telemetry Link Status'}: <span className="text-emerald-500">{language === 'PT' ? 'Estável' : 'Stable'}</span>
                </div>
             </div>
          </div>
        </div>

        <div className={`rounded-[48px] border p-12 relative overflow-hidden flex flex-col ${isDarkMode ? 'bg-zinc-900 border-white/5 shadow-3xl' : 'bg-white border-zinc-100 shadow-sm'}`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-supplyx-blue/5 rounded-full blur-3xl -z-10" />
          
          <div className="flex items-center justify-between mb-12">
            <div>
              <h3 className={`text-xl font-black uppercase italic tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{language === 'PT' ? 'Rastreador Inteligente' : 'Intelligence Tracker'}</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Tracking ID: {selectedShipment?.id}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-supplyx-blue/10 flex items-center justify-center text-supplyx-blue">
               <ShieldCheck className="w-6 h-6" />
            </div>
          </div>

          <div className="flex-1 relative">
             <div className="absolute left-[15px] top-4 bottom-4 w-1 bg-white/5 rounded-full" />
             
             <div className="space-y-10 relative">
                {timelineSteps.map((step, i) => (
                   <div key={i} className={`flex gap-6 relative group ${step.status === 'pending' ? 'opacity-30' : ''}`}>
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 relative z-10 transition-all ${
                         step.status === 'completed' ? 'bg-emerald-500 border-emerald-500 text-white' : 
                         step.status === 'current' ? 'bg-supplyx-blue border-supplyx-blue text-white animate-pulse-slow' : 
                         isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-500' : 'bg-white border-zinc-200 text-zinc-400'
                      }`}>
                         {step.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-current" />}
                      </div>
                      
                      <div className="flex-1 pt-1">
                         <div className="flex justify-between items-start mb-1">
                            <h4 className={`text-sm font-black uppercase tracking-tight italic ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{step.label}</h4>
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{step.time}</span>
                         </div>
                         <p className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-2">
                           <MapPin className="w-3 h-3 text-supplyx-blue" />
                           {step.location}
                         </p>
                      </div>
                   </div>
                ))}
             </div>
          </div>

          <div className="mt-12 p-8 rounded-3xl bg-white/[0.02] border border-white/5 space-y-4">
             <div className="flex justify-between items-center text-[10px] font-black uppercase text-zinc-500 tracking-widest">
                <span>{language === 'PT' ? 'Destino Final' : 'Final Destination'}</span>
                <span className={isDarkMode ? 'text-white italic' : 'text-zinc-900 italic'}>{selectedShipment?.destination}</span>
             </div>
             <button className={`w-full py-4 border rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${isDarkMode ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-zinc-50 border-zinc-100 text-zinc-600 hover:bg-zinc-100'}`}>
                <Download className="w-4 h-4" />
                {language === 'PT' ? 'Comprovante de Entrega (WIP)' : 'Proof of Delivery (WIP)'}
             </button>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h3 className={`text-xl font-black uppercase italic tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{t.shipmentStatus}</h3>
          <div className="flex gap-4">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input 
                   type="text" 
                   placeholder={t.searchPlaceholder}
                   className={`pl-10 pr-4 py-3 rounded-xl border text-[10px] font-black uppercase outline-none transition-all w-64 ${
                      isDarkMode ? 'bg-white/5 border-white/5 text-white focus:border-supplyx-blue' : 'bg-zinc-50 border-zinc-200'
                   }`}
                />
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allShipments.map((s) => (
            <motion.div 
              key={s.id}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedShipment(s)}
              className={`p-8 rounded-[40px] border transition-all cursor-pointer group relative overflow-hidden ${
                selectedShipment?.id === s.id ? (isDarkMode ? 'bg-supplyx-dark border-supplyx-blue shadow-2xl' : 'bg-zinc-50 border-supplyx-blue') :
                isDarkMode ? 'bg-zinc-900/50 border-white/5 hover:border-white/10' : 'bg-white border-zinc-100 shadow-sm'
              }`}
            >
              <div className="flex justify-between items-start mb-8">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                  s.status === t.statuses.finished ? 'bg-emerald-500/10 text-emerald-500' : 
                  s.status === t.statuses.transit ? 'bg-supplyx-blue/10 text-supplyx-blue' : 'bg-amber-500/10 text-amber-500'
                }`}>
                  <Package className="w-7 h-7" />
                </div>
                <div className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-full ${
                  s.status === t.statuses.finished ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 
                  s.status === t.statuses.transit ? 'bg-supplyx-blue/10 text-supplyx-blue border border-supplyx-blue/20' : 
                  'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                }`}>
                  {s.status}
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-black text-supplyx-blue uppercase tracking-widest mb-1">{s.id} • {s.carrier}</p>
                  <h4 className={`text-lg font-black italic uppercase tracking-tighter leading-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{s.material}</h4>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">
                    <span>Efficiency</span>
                    <span className={isDarkMode ? 'text-white' : 'text-zinc-900'}>{s.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${s.progress}%` }}
                      className={`h-full ${s.status === t.statuses.finished ? 'bg-emerald-500' : 'bg-supplyx-blue'}`}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                  <p className="text-[9px] font-black text-zinc-500 uppercase flex items-center gap-2">
                    <MapPin className="w-3 h-3" /> {s.destination}
                  </p>
                  <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-supplyx-blue transition-colors group-hover:translate-x-1" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

interface TruckData {
  id: string;
  model: string;
  plate: string;
  type: string;
  capacity: string;
  status: 'available' | 'in_transit' | 'maintenance';
}

interface LoadData {
  id: string;
  origin: string;
  destination: string;
  material: string;
  weight: string;
  status: 'pending' | 'loading' | 'transit' | 'delivered';
  truckId?: string;
}

function LogisticsPartnerDashboard({ isDarkMode, language }: { isDarkMode: boolean, language: 'PT' | 'EN' }) {
  const [trucks, setTrucks] = useState<TruckData[]>([]);
  const [loads, setLoads] = useState<LoadData[]>([]);
  const [isAddTruckOpen, setIsAddTruckOpen] = useState(false);
  const [isAddLoadOpen, setIsAddLoadOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const t = {
    PT: {
      title: 'Painel da Transportadora',
      subtitle: 'Gestão operacional de frotas e cargas',
      stats: {
        fleet: 'Frota Ativa',
        loads: 'Cargas Ativas',
        delivered: 'Entregas Totais',
        revenue: 'Receita Mensal'
      },
      trucks: 'Minha Frota',
      loads_title: 'Gestão de Cargas',
      addTruck: 'CADASTRAR CAMIÃO',
      addLoad: 'CADASTRAR CARGA',
      noTrucks: 'Nenhum camião cadastrado.',
      noLoads: 'Nenhuma carga em andamento.',
      status: {
        available: 'Disponível',
        in_transit: 'Em Rota',
        maintenance: 'Manutenção',
        pending: 'Pendente',
        loading: 'Carregando',
        transit: 'Em Trânsito',
        delivered: 'Entregue'
      }
    },
    EN: {
      title: 'Carrier Dashboard',
      subtitle: 'Operational fleet and cargo management',
      stats: {
        fleet: 'Active Fleet',
        loads: 'Active Loads',
        delivered: 'Total Deliveries',
        revenue: 'Monthly Revenue'
      },
      trucks: 'My Fleet',
      loads_title: 'Cargo Management',
      addTruck: 'REGISTER TRUCK',
      addLoad: 'REGISTER LOAD',
      noTrucks: 'No trucks registered.',
      noLoads: 'No loads in progress.',
      status: {
        available: 'Available',
        in_transit: 'In Route',
        maintenance: 'Maintenance',
        pending: 'Pending',
        loading: 'Loading',
        transit: 'In Transit',
        delivered: 'Delivered'
      }
    }
  }[language];

  useEffect(() => {
    if (!auth.currentUser) return;

    const trucksQuery = query(collection(db, 'trucks'), where('ownerId', '==', auth.currentUser.uid));
    const unsubscribeTrucks = onSnapshot(trucksQuery, (snapshot) => {
      const truckList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TruckData));
      setTrucks(truckList);
      setIsLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'trucks');
      setIsLoading(false);
    });

    const loadsQuery = query(collection(db, 'loads'), where('carrierId', '==', auth.currentUser.uid));
    const unsubscribeLoads = onSnapshot(loadsQuery, (snapshot) => {
      const loadList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LoadData));
      setLoads(loadList);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'loads');
      setIsLoading(false);
    });

    return () => {
      unsubscribeTrucks();
      unsubscribeLoads();
    };
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className={`p-10 rounded-[48px] border flex flex-col lg:flex-row justify-between items-center gap-8 ${
        isDarkMode ? 'bg-zinc-900 border-white/5 shadow-3xl' : 'bg-white border-zinc-100 shadow-sm'
      }`}>
        <div className="text-center lg:text-left flex items-center gap-6">
           <div className="w-16 h-16 rounded-[24px] bg-supplyx-blue/10 flex items-center justify-center text-supplyx-blue">
             <MapIcon className="w-8 h-8" />
           </div>
           <div>
             <h2 className={`text-3xl font-black italic tracking-tighter uppercase mb-2 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{t.title}</h2>
             <p className="text-zinc-500 text-[11px] font-black uppercase tracking-[0.3em]">{t.subtitle}</p>
           </div>
        </div>
        <div className="flex items-center gap-4">
           <button 
             onClick={() => setIsAddTruckOpen(true)}
             className="bg-supplyx-blue hover:bg-blue-600 text-white px-8 py-5 rounded-[24px] text-xs font-black italic uppercase tracking-widest transition-all active:scale-95 shadow-3xl shadow-blue-500/20 flex items-center gap-3"
           >
             <Truck className="w-5 h-5" />
             {t.addTruck}
           </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: t.stats.fleet, val: trucks.length.toString(), icon: Truck, color: 'text-supplyx-blue', bg: 'bg-supplyx-blue/10' },
          { label: t.stats.loads, val: loads.filter(l => l.status !== 'delivered').length.toString(), icon: Package, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: t.stats.delivered, val: loads.filter(l => l.status === 'delivered').length.toString(), icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: t.stats.revenue, val: 'MT 450K', icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        ].map((stat, i) => (
          <div key={i} className={`p-6 rounded-3xl border flex items-center gap-4 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100 shadow-sm'}`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.bg}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className={`text-xl font-black italic tracking-tighter leading-none ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{stat.val}</p>
              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Trucks List */}
        <div className={`p-8 rounded-[40px] border ${isDarkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-100 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-8">
            <h3 className={`text-xl font-black italic uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{t.trucks}</h3>
            <Truck className="w-5 h-5 text-supplyx-blue" />
          </div>
          
          {trucks.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-zinc-800 rounded-3xl">
              <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">{t.noTrucks}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {trucks.map(truck => (
                <div key={truck.id} className={`p-5 rounded-2xl border flex items-center justify-between ${isDarkMode ? 'bg-zinc-800/50 border-zinc-700' : 'bg-zinc-50 border-zinc-200'}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-supplyx-blue/10 flex items-center justify-center text-supplyx-blue">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className={`text-sm font-black uppercase italic tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{truck.model}</p>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{truck.plate} • {truck.capacity}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                    truck.status === 'available' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                    truck.status === 'in_transit' ? 'bg-supplyx-blue/10 text-supplyx-blue border border-supplyx-blue/20' :
                    'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20'
                  }`}>
                    {t.status[truck.status]}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Loads Management */}
        <div className={`p-8 rounded-[40px] border ${isDarkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-100 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-8">
            <h3 className={`text-xl font-black italic uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{t.loads_title}</h3>
            <button 
              onClick={() => setIsAddLoadOpen(true)}
              className="text-supplyx-blue hover:text-white transition-colors"
            >
              <PlusCircle className="w-6 h-6" />
            </button>
          </div>

          {loads.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-zinc-800 rounded-3xl">
              <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">{t.noLoads}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {loads.map(load => (
                <div key={load.id} className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-zinc-800/50 border-zinc-700' : 'bg-zinc-50 border-zinc-200'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className={`text-sm font-black uppercase italic tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{load.material}</p>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{load.origin} → {load.destination}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                      load.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-500' :
                      load.status === 'transit' ? 'bg-supplyx-blue/10 text-supplyx-blue' : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      {t.status[load.status]}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Peso: {load.weight}</p>
                    <div className="flex gap-2">
                       <select 
                         className="bg-zinc-900 border border-white/10 rounded-lg px-3 py-1.5 text-[8px] font-black uppercase outline-none"
                         value={load.status}
                         onChange={async (e) => {
                           try {
                             await updateDoc(doc(db, 'loads', load.id), { status: e.target.value });
                           } catch (err) {
                             handleFirestoreError(err, OperationType.UPDATE, `loads/${load.id}`);
                           }
                         }}
                       >
                         <option value="pending">{t.status.pending}</option>
                         <option value="loading">{t.status.loading}</option>
                         <option value="transit">{t.status.transit}</option>
                         <option value="delivered">{t.status.delivered}</option>
                       </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {isAddTruckOpen && (
        <AddTruckModal 
          isDarkMode={isDarkMode} 
          language={language} 
          onClose={() => setIsAddTruckOpen(false)} 
        />
      )}
      {isAddLoadOpen && (
        <AddLoadModal 
          isDarkMode={isDarkMode} 
          language={language} 
          onClose={() => setIsAddLoadOpen(false)} 
        />
      )}
    </motion.div>
  );
}

function AddTruckModal({ isDarkMode, language, onClose }: { isDarkMode: boolean, language: 'PT' | 'EN', onClose: () => void }) {
  const [formData, setFormData] = useState({
    model: '',
    plate: '',
    type: 'Camião Simples',
    capacity: '10 Ton'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'trucks'), {
        ...formData,
        ownerId: auth.currentUser.uid,
        status: 'available',
        createdAt: serverTimestamp()
      });
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'trucks');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className={`w-full max-w-md p-8 rounded-[40px] border shadow-2xl relative z-10 ${isDarkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-100'}`}
      >
        <div className="flex justify-between items-center mb-8">
          <h3 className={`text-xl font-black italic uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
            {language === 'PT' ? 'Novo Veículo' : 'New Vehicle'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors"><X className="w-5 h-5 text-zinc-500" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-2">Modelo</label>
            <input 
              required
              value={formData.model}
              onChange={e => setFormData({ ...formData, model: e.target.value })}
              className={`w-full p-4 rounded-2xl border text-xs font-black outline-none transition-all ${isDarkMode ? 'bg-zinc-800 border-zinc-700 text-white focus:border-supplyx-blue' : 'bg-zinc-50 border-zinc-100'}`}
              placeholder="Ex: Volvo FH / Scania R500"
            />
          </div>
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-2">Matrícula</label>
            <input 
              required
              value={formData.plate}
              onChange={e => setFormData({ ...formData, plate: e.target.value })}
              className={`w-full p-4 rounded-2xl border text-xs font-black outline-none transition-all ${isDarkMode ? 'bg-zinc-800 border-zinc-700 text-white focus:border-supplyx-blue' : 'bg-zinc-50 border-zinc-100'}`}
              placeholder="Ex: ABC 123 MC"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-2">Tipo</label>
              <select 
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
                className={`w-full p-4 rounded-2xl border text-xs font-black outline-none transition-all ${isDarkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-100'}`}
              >
                <option>Camião Simples</option>
                <option>Carreta</option>
                <option>VUC</option>
                <option>Toco</option>
              </select>
            </div>
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-2">Capacidade</label>
              <input 
                value={formData.capacity}
                onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                className={`w-full p-4 rounded-2xl border text-xs font-black outline-none transition-all ${isDarkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-100'}`}
                placeholder="Ex: 24 Ton"
              />
            </div>
          </div>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full py-5 bg-supplyx-blue text-white rounded-2xl font-black text-sm uppercase italic tracking-tighter shadow-xl shadow-blue-500/20 active:scale-95 transition-all mt-4 flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            {language === 'PT' ? 'CADASTRAR VEÍCULO' : 'REGISTER TRUCK'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function AddLoadModal({ isDarkMode, language, onClose }: { isDarkMode: boolean, language: 'PT' | 'EN', onClose: () => void }) {
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    material: '',
    weight: '10 Ton'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'loads'), {
        ...formData,
        carrierId: auth.currentUser.uid,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'loads');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className={`w-full max-w-md p-8 rounded-[40px] border shadow-2xl relative z-10 ${isDarkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-100'}`}
      >
        <div className="flex justify-between items-center mb-8">
          <h3 className={`text-xl font-black italic uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
            {language === 'PT' ? 'Nova Carga' : 'New Load'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors"><X className="w-5 h-5 text-zinc-500" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-2">Material</label>
            <input 
              required
              value={formData.material}
              onChange={e => setFormData({ ...formData, material: e.target.value })}
              className={`w-full p-4 rounded-2xl border text-xs font-black outline-none transition-all ${isDarkMode ? 'bg-zinc-800 border-zinc-700 text-white focus:border-supplyx-blue' : 'bg-zinc-50 border-zinc-100'}`}
              placeholder="Ex: 500 Sacas de Cimento"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-2">Origem</label>
              <input 
                required
                value={formData.origin}
                onChange={e => setFormData({ ...formData, origin: e.target.value })}
                className={`w-full p-4 rounded-2xl border text-xs font-black outline-none transition-all ${isDarkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-100'}`}
                placeholder="Ex: Porto Maputo"
              />
            </div>
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-2">Destino</label>
              <input 
                required
                value={formData.destination}
                onChange={e => setFormData({ ...formData, destination: e.target.value })}
                className={`w-full p-4 rounded-2xl border text-xs font-black outline-none transition-all ${isDarkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-100'}`}
                placeholder="Ex: Obra Central"
              />
            </div>
          </div>
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-2">Peso</label>
            <input 
              value={formData.weight}
              onChange={e => setFormData({ ...formData, weight: e.target.value })}
              className={`w-full p-4 rounded-2xl border text-xs font-black outline-none transition-all ${isDarkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-100'}`}
              placeholder="Ex: 25 Ton"
            />
          </div>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full py-5 bg-supplyx-blue text-white rounded-2xl font-black text-sm uppercase italic tracking-tighter shadow-xl shadow-blue-500/20 active:scale-95 transition-all mt-4 flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Package className="w-5 h-5" />}
            {language === 'PT' ? 'CADASTRAR CARGA' : 'REGISTER LOAD'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
