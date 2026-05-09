import { useState, useMemo } from 'react';
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
  Download
} from 'lucide-react';

interface LogisticsViewProps {
  isDarkMode: boolean;
  language: 'PT' | 'EN';
}

export default function LogisticsView({ isDarkMode, language }: LogisticsViewProps) {
  const translations = useMemo(() => ({
    PT: {
      title: 'Controle Logístico',
      subtitle: 'Gestão de frotas e suprimentos',
      btnHire: 'Contratar Transporte',
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
      title: 'Logistics Control',
      subtitle: 'Fleet & supply management',
      btnHire: 'Hire Transport',
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
    { id: 'LOG-001', material: language === 'PT' ? '200 Sacas de Cimento' : '200 Bags of Cement', status: t.statuses.transit, ETA: '14:30', origin: 'Votorantim PR', destination: 'Obra Alvorada', progress: 65, carrier: 'TransNacala' },
    { id: 'LOG-002', material: language === 'PT' ? 'Vergalhão CA-50' : 'CA-50 Rebar', status: t.statuses.loading, ETA: language === 'PT' ? 'Amanhã' : 'Tomorrow', origin: 'Gerdau SP', destination: 'Obra Central', progress: 15, carrier: 'Logística Maputo' },
    { id: 'LOG-003', material: language === 'PT' ? 'Areia e Brita' : 'Sand and Gravel', status: t.statuses.finished, ETA: language === 'PT' ? 'Entregue' : 'Delivered', origin: 'Mineradora Vale', destination: 'Obra Alvorada', progress: 100, carrier: 'Correios Moz' },
  ], [language, t]);

  const carriers = useMemo(() => [
    { id: '1', name: 'TransNacala Logística', type: language === 'PT' ? 'Pesado' : 'Heavy', rating: 4.8, fleetSize: 45, coverage: language === 'PT' ? 'Nacional' : 'National', pricePerKm: 'MT 45,00', verified: true, basePrice: 12500 },
    { id: '2', name: 'Logística Maputo', type: language === 'PT' ? 'Urbano' : 'Urban', rating: 4.9, fleetSize: 12, coverage: language === 'PT' ? 'Sul' : 'South', pricePerKm: 'MT 55,00', verified: true, basePrice: 8900 },
    { id: '3', name: 'Beira Express', type: language === 'PT' ? 'Contêiner' : 'Container', rating: 4.5, fleetSize: 80, coverage: language === 'PT' ? 'Centro/Norte' : 'Central/North', pricePerKm: 'MT 42,00', verified: true, basePrice: 15750 },
  ], [language]);

  const truckTypes = useMemo(() => [
    { id: 'vuc', name: 'VUC', capacity: '3t', icon: Truck, description: language === 'PT' ? 'Ideal para centros urbanos' : 'Ideal for urban centers' },
    { id: 'toco', name: 'Toco', capacity: '6t', icon: Truck, description: language === 'PT' ? 'Cargas médias' : 'Medium loads' },
    { id: 'truck', name: 'Truck', capacity: '12-14t', icon: Truck, description: language === 'PT' ? 'Cargas pesadas' : 'Heavy loads' },
    { id: 'carreta', name: 'Carreta', capacity: '25-30t', icon: Truck, description: language === 'PT' ? 'Grandes volumes' : 'Large volumes' },
  ], [language]);

  const [allShipments, setAllShipments] = useState(initialShipments);
  const [showBooking, setShowBooking] = useState(false);
  const [showArchiveSuccess, setShowArchiveSuccess] = useState(false);

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
                        <ShieldCheck className="w-3 h-3" /> VERIFIED
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
      <div className={`p-8 rounded-3xl border flex flex-col md:flex-row justify-between items-center gap-6 ${
        isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100 shadow-sm'
      }`}>
        <div className="text-center md:text-left">
          <h2 className={`text-2xl font-black italic tracking-tighter uppercase mb-1 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{t.title}</h2>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{t.subtitle}</p>
        </div>
        <button 
          onClick={() => setShowBooking(true)}
          className="bg-brand hover:bg-brand-hover text-white px-8 py-4 rounded-2xl text-sm font-black italic uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-brand/20 flex items-center gap-3"
        >
          <Handshake className="w-5 h-5" />
          {t.btnHire}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className={`rounded-3xl border overflow-hidden ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-950 border-white/10'}`}>
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-white text-sm font-black uppercase italic tracking-tighter flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              {t.liveTracking}
            </h3>
            <span className="text-[10px] font-black text-brand">MT / GMT+2</span>
          </div>
          
          <div className="p-6 space-y-6 max-h-[400px] overflow-y-auto custom-scrollbar">
            {allShipments.filter(s => s.status !== t.statuses.finished).map(s => (
              <div key={s.id} className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-black text-brand mb-1">{s.id}</h4>
                    <p className="text-sm font-black text-white italic tracking-tight">{s.material}</p>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase">{s.carrier}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-emerald-500 block mb-1">ETA {s.ETA}</span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${s.status === t.statuses.transit ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {s.status}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${s.progress}%` }}
                      className="h-full bg-brand"
                    />
                  </div>
                  <div className="flex justify-between text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {s.origin}</span>
                    <span className="flex items-center gap-1"> {s.progress}% <Navigation2 className="w-3 h-3 text-white" /> {s.destination}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-6 bg-zinc-950/50 mt-auto flex items-center justify-center gap-4 text-[10px] font-black text-zinc-600 uppercase tracking-widest">
             <div className="flex items-center gap-2"><div className="w-2 h-2 bg-brand rounded-full" /> {language === 'PT' ? 'FROTA' : 'FLEET'}</div>
             <div className="flex items-center gap-2"><div className="w-2 h-2 bg-emerald-500 rounded-full" /> {language === 'PT' ? 'ROTA' : 'ROUTE'}</div>
             <div className="flex items-center gap-2"><div className="w-2 h-2 bg-zinc-800 rounded-full" /> {language === 'PT' ? 'BASE' : 'HUB'}</div>
          </div>
        </div>

        <div className={`p-8 rounded-3xl border flex flex-col ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-100 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-8">
            <h3 className={`text-lg font-black uppercase italic tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{t.shipmentStatus}</h3>
            <button className={`p-2 rounded-xl transition-all ${isDarkMode ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-zinc-50 hover:bg-zinc-100'}`}>
               <Search className="w-4 h-4 text-zinc-500" />
            </button>
          </div>

          <div className="space-y-4 flex-1">
            {allShipments.map((s) => (
              <div 
                key={s.id}
                className={`p-5 rounded-2xl border transition-all hover:scale-[1.01] ${
                  isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-100'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      s.status === t.statuses.finished ? 'bg-emerald-500/10 text-emerald-500' : 'bg-brand/10 text-brand'
                    }`}>
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className={`text-sm font-black italic tracking-tighter ${isDarkMode ? 'text-zinc-200' : 'text-zinc-900'}`}>{s.material}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase">{s.id}</span>
                        <span className="text-zinc-300">•</span>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase">{s.carrier}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg ${
                      s.status === t.statuses.finished ? 'bg-emerald-500/10 text-emerald-500' : 
                      s.status === t.statuses.transit ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      {s.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={archiveCompleted}
            className={`w-full mt-8 py-4 px-4 rounded-2xl border-2 border-dashed font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
            isDarkMode ? 'border-zinc-800 text-zinc-500 hover:border-brand/40 hover:text-brand' : 'border-zinc-100 text-zinc-400 hover:border-brand hover:text-brand'
          }`}>
            {showArchiveSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                {language === 'PT' ? 'Envios arquivados!' : 'Shipments archived!'}
              </>
            ) : (
              language === 'PT' ? '+ Arquivar envios finalizados' : '+ Archive completed shipments'
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
