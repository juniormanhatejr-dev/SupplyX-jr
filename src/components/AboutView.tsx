import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  Award, 
  Cpu, 
  Clock, 
  TrendingUp, 
  FileText, 
  Warehouse, 
  Truck, 
  Briefcase,
  ArrowRight,
  Info
} from 'lucide-react';

interface AboutViewProps {
  isDarkMode: boolean;
  language: 'PT' | 'EN';
  userType?: 'buyer' | 'supplier' | 'logistics';
  onNavigate?: (tab: string, payload?: any) => void;
}

export default function AboutView({ isDarkMode, language, userType, onNavigate }: AboutViewProps) {
  const t = {
    PT: {
      title: 'Sobre a Plataforma',
      subtitle: 'Sinfonia Operacional de Suprimentos Industriais',
      conceptTitle: 'O Conceito SupplyX',
      conceptDesc: 'O SupplyX remodela as relações comerciais de mineração e manufatura através de um ecossistema com fluxos auditáveis, precificação automatizada livre de taxas ocultas e rastreabilidade logística direta.',
      heroDesc: 'Bem-vindo à vanguarda do procurement B2B. A plataforma resolve os maiores atritos na aquisição de matérias-primas e ativos, eliminando assimetria de informações, burocracias aduaneiras e falhas de comunicação.',
      
      capabilitiesTitle: 'Capacidades Integradas',
      capabilitiesDesc: 'Veja os pilares principais que gerenciam milhares de toneladas de insumos minerais e industriais diariamente.',
      
      cap1Title: 'Módulo de RFQ Automatizado',
      cap1Desc: 'Criação de requisições de cotação estruturadas, envio de lances competitivos, descontos e prospecção direta de materiais com cálculo automático de impostos.',
      
      cap2Title: 'Catálogo & IVA de Moçambique',
      cap2Desc: 'Configuração robusta de preços, códigos fiscais de cada província moçambicana e consolidação matemática perfeita de impostos sobre o consumo.',
      
      cap3Title: 'Mensageria e Alertas Directos',
      cap3Desc: 'Canal criptografado seguro para alinhamento instantâneo entre engenheiros, fornecedores, oficiais de recepção e fiscais de pátio.',
      
      cap4Title: 'Logística Completa Integrada',
      cap4Desc: 'Controle operacional de subcontratados de transporte, cronogramas de recolha de graneis, vistorias em balança física e descarga certificada.',
      
      cap5Title: 'Gestão Financeira & BI',
      cap5Desc: 'Relatórios de custos unitários ponderados, análises históricas de variação de preços e extratos de faturamento direto integrados na nuvem.',
      
      gTitle: 'Compromissos Fundamentais de Segurança',
      gDesc: 'Garantimos integridade em cada transação, contrato assinado e material despachado através dos nossos três pilares padrão.',
      
      g1Title: 'Transparência Fiscal Absoluta',
      g1Desc: 'Não calculamos taxas fixas ou estimadas sobre produtos. Os fornecedores definem o preço base e a exata taxa de IVA de cada material no cadastro. O sistema calcula e consolida os valores idênticos tanto para o comprador quanto para o vendedor, sem discrepâncias cambiais ou fiscais.',
      
      g2Title: 'Rastreabilidade e Conformidade',
      g2Desc: 'Registramos todos os passos operacionais no banco auditável com timestamps permanentes: desde a intenção do lance, guias fiscais até o proof of delivery assinado pelo fiel de carga.',
      
      g3Title: 'Integração de Rede B2B Mozambique',
      g3Desc: 'Totalmente sintonizado com os NUITs das empresas nacionais, com suporte nativo à legislação, guias aduaneiras e especificidades geográficas regionais de cada província.',
      
      footerBadge: 'Sobre a Plataforma'
    },
    EN: {
      title: 'About the Platform',
      subtitle: 'Operational Harmony of Industrial Supply',
      conceptTitle: 'The SupplyX Concept',
      conceptDesc: 'SupplyX reshape standard mining and manufacturing procurement through an auditable network of automated pricing, absolute fiscal purity, and end-to-end trace lines.',
      heroDesc: 'Welcome to the future of high-value industrial procurement. The platform automates complicated transactions, solving information asymmetry, regional taxation issues, and friction points.',
      
      capabilitiesTitle: 'Core Capabilities',
      capabilitiesDesc: 'Examine the fundamental pillars that manage thousands of tons of high-grade minerals and assets daily.',
      
      cap1Title: 'Automated RFQ System',
      cap1Desc: 'Create structured request briefs, gather multi-supplier quotations, coordinate custom discounts, and calculate complex VAT liabilities instantly.',
      
      cap2Title: 'Supplier Catalogs & Taxes',
      cap2Desc: 'Map complex tax laws, manage bulk physical properties of commodities, and keep track of live supplier prices across all departments.',
      
      cap3Title: 'Unified Direct Chat',
      cap3Desc: 'Encrypted operational chat rooms connecting warehouse managers, corporate finance analysts, on-site personnel, and third-party logistics.',
      
      cap4Title: 'Logistics Control Tower',
      cap4Desc: 'Consolidate multiple transport modes, manage weights, and record loading dock inspections with localized scale measurements.',
      
      cap5Title: 'Financial Intelligence & BI',
      cap5Desc: 'Keep trace logs of material unit costs, monitor seasonal fluctuations, and access clean PDF invoices with pre-compiled VAT entries.',
      
      gTitle: 'Bilateral Trust Standards',
      gDesc: 'We safeguard every contract, material container, and invoice draft through three unyielding operations guidelines.',
      
      g1Title: 'Absolute Fiscal Purity',
      g1Desc: 'We do not calculate fixed or estimated fees on products. Suppliers define the base price and the exact VAT rate of each material in the registry. The system calculates and consolidates identical values for both buyer and seller, without exchange rate or fiscal discrepancies.',
      
      g2Title: 'Auditable Timestamp Trace',
      g2Desc: 'Every transaction state transition, customs slip upload, and loading bay handoff receives a cryptographically sealed date log.',
      
      g3Title: 'Mozambican Fiscal Alignment',
      g3Desc: 'Engineered from scratch to interface cleanly with local corporate entities and regulatory structures from Cabo Delgado to Maputo.',
      
      footerBadge: 'About Platform'
    }
  };

  const nav = t[language || 'PT'];

  const guarantees = [
    { title: nav.g1Title, desc: nav.g1Desc, icon: ShieldCheck, color: 'text-supplyx-blue bg-supplyx-blue/10 border-supplyx-blue/25' },
    { title: nav.g2Title, desc: nav.g2Desc, icon: Clock, color: 'text-teal-400 bg-teal-500/10 border-teal-500/25' },
    { title: nav.g3Title, desc: nav.g3Desc, icon: Award, color: 'text-amber-500 bg-amber-500/10 border-amber-500/25' }
  ];

  return (
    <div className="w-full max-w-[1400px] mx-auto min-h-screen space-y-12 pb-20">
      
      {/* Banner / Hero Area with radial glow */}
      <div className="relative rounded-[40px] overflow-hidden border border-white/5 bg-gradient-to-br from-zinc-950 via-supplyx-surface to-supplyx-deep p-8 md:p-14 shadow-3xl">
        <div className="absolute top-0 right-0 w-[50%] h-[100%] bg-radial-gradient from-supplyx-blue/10 to-transparent opacity-60 pointer-events-none" />
        <div className="relative z-10 max-w-4xl space-y-6">
          <div className="flex items-center gap-3">
            <span 
              onClick={() => onNavigate?.('Dashboard')}
              className="px-3.5 py-1 text-[9px] font-black tracking-[0.2em] uppercase rounded-full bg-supplyx-blue/20 text-supplyx-blue border border-supplyx-blue/30 inline-block cursor-pointer hover:bg-supplyx-blue/40 transition-colors duration-200"
            >
              PLATAFORMA SUPPLYX
            </span>
            <span 
              onClick={() => onNavigate?.('Ajustes')}
              className="px-3.5 py-1 text-[9px] font-black tracking-[0.2em] uppercase rounded-full bg-zinc-800 text-zinc-400 border border-white/5 inline-block cursor-pointer hover:bg-zinc-700 hover:text-white transition-colors duration-200"
            >
              {nav.footerBadge}
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight italic text-white leading-tight">
            {nav.title}
          </h1>
          <p className="text-base sm:text-lg font-bold text-supplyx-blue uppercase tracking-wider">
            {nav.subtitle}
          </p>
          <p className={`text-sm leading-relaxed max-w-3xl ${isDarkMode ? 'text-zinc-400' : 'text-zinc-650'}`}>
            {nav.heroDesc}
          </p>
        </div>
      </div>

      {/* Concept statement box */}
      <div className="p-8 rounded-[32px] border border-supplyx-blue/10 bg-supplyx-blue/5 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none">
          <Cpu className="w-72 h-72 text-supplyx-blue" />
        </div>
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
          <div className="md:col-span-1 flex justify-center">
            <div className="w-16 h-16 rounded-full bg-supplyx-blue/10 border border-supplyx-blue/20 flex items-center justify-center text-supplyx-blue shadow-lg shadow-supplyx-blue/10">
              <Info className="w-8 h-8" />
            </div>
          </div>
          <div className="md:col-span-3 space-y-2 text-left">
            <h3 className="text-md font-black uppercase tracking-wider text-supplyx-blue flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-supplyx-blue animate-pulse" />
              {nav.conceptTitle}
            </h3>
            <p className="text-sm font-semibold text-white leading-relaxed">
              {nav.conceptDesc}
            </p>
          </div>
        </div>
      </div>

      {/* Main capabilities area with interactive cards linking directly to their views */}
      <div className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl font-black uppercase tracking-widest text-white flex items-center gap-2.5">
            <TrendingUp className="w-5 h-5 text-supplyx-blue" />
            {nav.capabilitiesTitle}
          </h2>
          <p className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
            {nav.capabilitiesDesc}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card 1 */}
          <div 
            onClick={() => onNavigate?.('Pedidos / Cotações')}
            className="enterprise-card p-6 flex flex-col justify-between group h-full cursor-pointer select-none border border-white/5 bg-zinc-900/30 hover:bg-zinc-900/40 hover:border-supplyx-blue/40 hover:scale-[1.02] hover:-translate-y-1 active:scale-95 transition-all duration-300 rounded-[24px]"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-supplyx-blue/10 border border-supplyx-blue/20 flex items-center justify-center text-supplyx-blue mb-6 group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white mb-2">{nav.cap1Title}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-semibold">{nav.cap1Desc}</p>
            </div>
            <div className="mt-8 flex items-center gap-1.5 text-[9px] font-black text-supplyx-blue uppercase tracking-widest">
              Módulo RFQ <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2 */}
          <div 
            onClick={() => onNavigate?.(userType === 'supplier' ? 'Seller Central' : 'Produtos / Materiais')}
            className="enterprise-card p-6 flex flex-col justify-between group h-full cursor-pointer select-none border border-white/5 bg-zinc-900/30 hover:bg-zinc-900/40 hover:border-amber-500/40 hover:scale-[1.02] hover:-translate-y-1 active:scale-95 transition-all duration-300 rounded-[24px]"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-6 group-hover:scale-110 transition-transform">
                <Warehouse className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white mb-2">{nav.cap2Title}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-semibold">{nav.cap2Desc}</p>
            </div>
            <div className="mt-8 flex items-center gap-1.5 text-[9px] font-black text-amber-500 uppercase tracking-widest">
              Catálogo & IVA <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3 */}
          <div 
            onClick={() => onNavigate?.('Mensagens')}
            className="enterprise-card p-6 flex flex-col justify-between group h-full cursor-pointer select-none border border-white/5 bg-zinc-900/30 hover:bg-zinc-900/40 hover:border-purple-500/40 hover:scale-[1.02] hover:-translate-y-1 active:scale-95 transition-all duration-300 rounded-[24px]"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 mb-6 group-hover:scale-110 transition-transform">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white mb-2">{nav.cap3Title}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-semibold">{nav.cap3Desc}</p>
            </div>
            <div className="mt-8 flex items-center gap-1.5 text-[9px] font-black text-purple-500 uppercase tracking-widest">
              Chat & Alertas <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 4 */}
          <div 
            onClick={() => onNavigate?.('Logística')}
            className="enterprise-card p-6 flex flex-col justify-between group h-full cursor-pointer select-none border border-white/5 bg-zinc-900/30 hover:bg-zinc-900/40 hover:border-teal-500/40 hover:scale-[1.02] hover:-translate-y-1 active:scale-95 transition-all duration-300 rounded-[24px]"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-500 mb-6 group-hover:scale-110 transition-transform">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white mb-2">{nav.cap4Title}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-semibold">{nav.cap4Desc}</p>
            </div>
            <div className="mt-8 flex items-center gap-1.5 text-[9px] font-black text-teal-500 uppercase tracking-widest">
              Rotas & Despacho <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 5 */}
          <div 
            onClick={() => onNavigate?.(userType === 'supplier' ? 'Seller Central' : 'Relatórios')}
            className="enterprise-card p-6 flex flex-col justify-between group h-full cursor-pointer select-none border border-white/5 bg-zinc-900/30 hover:bg-zinc-900/40 hover:border-emerald-500/40 hover:scale-[1.02] hover:-translate-y-1 active:scale-95 transition-all duration-300 rounded-[24px]"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mb-6 group-hover:scale-110 transition-transform">
                <Briefcase className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white mb-2">{nav.cap5Title}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-semibold">{nav.cap5Desc}</p>
            </div>
            <div className="mt-8 flex items-center gap-1.5 text-[9px] font-black text-emerald-500 uppercase tracking-widest">
              Gestão Financeira <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

        </div>
      </div>

      {/* Unyielding Guidelines & Guarantees section */}
      <div className="p-8 md:p-12 rounded-[40px] bg-zinc-950 border border-white/5 space-y-10">
        
        <div className="text-left space-y-2">
          <span className="px-3 py-1 text-[8px] font-black bg-supplyx-blue/10 text-supplyx-blue border border-supplyx-blue/20 rounded-full uppercase tracking-wider">
            SISTEMA AUDITÁVEL GARANTIDO
          </span>
          <h2 className="text-xl font-black uppercase text-white tracking-wide m-0">
            {nav.gTitle}
          </h2>
          <p className="text-xs text-zinc-500 leading-relaxed max-w-2xl font-semibold">
            {nav.gDesc}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {guarantees.map((guar, index) => {
            const Icon = guar.icon;
            return (
              <div 
                key={index} 
                className="p-6 rounded-[24px] bg-zinc-900/40 border border-white/5 flex flex-col items-start gap-4 text-left hover:border-white/10 transition-all duration-300"
              >
                <div className={`p-3 rounded-xl border ${guar.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-xs font-black uppercase text-white tracking-wider">{guar.title}</h4>
                  <p className="text-[11px] leading-relaxed text-zinc-400 font-semibold">{guar.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
}
