import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  HelpCircle, 
  Award, 
  Cpu, 
  Clock, 
  TrendingUp, 
  FileText, 
  CheckCircle2, 
  Percent, 
  Warehouse, 
  Truck, 
  Briefcase,
  Layers,
  ArrowRight
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
      title: 'Sobre o SupplyX',
      subtitle: 'Ecosistema Inteligente de Procurement e Gestão de Cadeia de Suprimentos Corporativos.',
      back: 'Voltar',
      heroDesc: 'O SupplyX foi desenvolvido para automatizar, unificar e blindar os processos de aquisição de materiais e de logística para o mercado empresarial. Através de tecnologia de ponta, nós minimizamos gargalos fiscais, aproximamos compradores e fornecedores certificados e simplificamos as operações com absoluta transparência.',
      
      sectionCapabilities: 'Funcionalidades Integradas',
      sectionCapabilitiesDesc: 'Uma suíte industrial completa projetada para transformar o desordenado fluxo de cotações em uma rotina ágil de alta performance.',
      
      cap1Title: 'Cotações Corporativas Diretas',
      cap1Desc: 'Criação rápida de listas de requisição de materiais, enviadas instantaneamente para fornecedores qualificados e consolidadas de forma digital.',
      cap2Title: 'Catálogo de Produtos e Serviços',
      cap2Desc: 'Navegação por portfólios autorizados, filtros de categorias estruturadas e ajuste preciso de taxas de IVA individualizadas por item.',
      cap3Title: 'Comunicação Multilateral em Tempo Real',
      cap3Desc: 'Chat integrado e alertas instantâneos de alteração de cotação ou aceitação de propostas para evitar ruídos comerciais.',
      cap4Title: 'Módulo de Logística e Despacho',
      cap4Desc: 'Atribuição automática de transportadores, controle de rotas ativas e acompanhamento de frotas credenciadas para cumprimento sistemático de prazos.',
      cap5Title: 'Auditoria e Relatórios Financeiros',
      cap5Desc: 'Indicadores automáticos de distribuição de gastos, balanço de vendas e download de documentos de cotação com valor fiscal certificado.',
      
      sectionGuarantees: 'As Nossas Garantias',
      sectionGuaranteesDesc: 'A nossa infraestrutura técnica garante conformidade total, consistência de dados e segurança mercadológica em tempo integral.',
      
      g1Title: 'Soberania Tributária Integral',
      g1Desc: 'Não calculamos taxas fixas ou estimadas sobre produtos. Os fornecedores definem o preço base e a exata taxa de IVA de cada material no cadastro. O sistema calcula e consolida os valores idênticos tanto para o comprador quanto para o vendedor, sem discrepâncias cambiais ou fiscais.',
      g2Title: 'Conformidade de Fornecedores',
      g2Desc: 'Todos os parceiros passam por validação cadastral (Alvará, NUIT e Certidões vigentes) para garantir a integridade da entrega.',
      g3Title: 'Consistência de PDFs e Descontos',
      g3Desc: 'Quando um desconto é aplicado em uma proposta pelo fornecedor, o desconto é instantaneamente gravado na base e transmitido ao PDF final de forma idêntica e imediata.',
      g4Title: 'Segurança e Resiliência Técnica',
      g4Desc: 'Chaves criptografadas de banco de dados, senhas corporativas fortes, autenticação de dois fatores e resiliência offline integrada para visualização segura de caches locais.',

      sectionBenefits: 'Benefícios Estratégicos',
      sectionBenefitsDesc: 'Eleve o patamar competitivo e financeiro da sua corporação com resultados estatísticos mensuráveis.',
      
      b1Title: '-60% Tempo de Ciclo',
      b1Desc: 'Redução drástica no ciclo de aprovação e negociação de cotações com o mercado fornecedor.',
      b2Title: '15% a 22% Economia Direta',
      b2Desc: 'Otimização de custos em compras de larga escala obtido por meio de comparação transparente assistida.',
      b3Title: '100% Transparência de Auditoria',
      b3Desc: 'Rastreabilidade ponta a ponta desde a requisição de compras ao manifesto de transporte e notas oficiais.',
      
      bannerFooter: 'Evolua a sua cadeia de compras hoje.',
      bannerFooterDesc: 'Livre-se das dezenas de e-mails, planilhas desorganizadas e discrepâncias fiscais. O SupplyX unifica o seu procurement.',
      footerBadge: 'Enterprise Ready'
    },
    EN: {
      title: 'About SupplyX',
      subtitle: 'Smart Ecosystem for Corporate Procurement & Supply Chain Management.',
      back: 'Back',
      heroDesc: 'SupplyX was built to automate, unify, and shield material acquisition and logistics workflows for the corporate market. Utilizing cutting-edge technology, we minimize tax bottlenecks, connect certified buyers and suppliers, and simplify operations with absolute transparency.',
      
      sectionCapabilities: 'Integrated Capabilities',
      sectionCapabilitiesDesc: 'A complete industrial suite designed to turn complex quote loops into highly automated, high-performance routines.',
      
      cap1Title: 'Direct Corporate Inquiries',
      cap1Desc: 'Quick creation of material requisition lists, instantly dispatched to qualified suppliers, and consolidated digitally.',
      cap2Title: 'Unified Product Catalogue',
      cap2Desc: 'Explore authorized portfolios, structured categories, and precise individual item VAT tax rates during registration.',
      cap3Title: 'Real-Time Multilateral Comms',
      cap3Desc: 'In-app secure chat and instant alerts for proposal alterations or acceptances to eliminate communication noise.',
      cap4Title: 'Logistics & Dispatch Module',
      cap4Desc: 'Automatic freight assignment, active route checking, and accredited fleet monitoring for systematic delivery fulfillment.',
      cap5Title: 'Audits & Financial Reports',
      cap5Desc: 'Automatic metrics for spend distribution, sales dashboards, and high-fidelity PDF quote downloads with certified tax parity.',
      
      sectionGuarantees: 'Our Guarantees',
      sectionGuaranteesDesc: 'Our technical infrastructure guarantees absolute compliance, data consistency, and market safety at all times.',
      
      g1Title: 'Absolute Tax Sovereignty',
      g1Desc: 'We do not compute fixed or arbitrary tax rates. Suppliers enter the baseline price and exact VAT rate of each product during registration. The system calculates and consolidates identical figures for both buyers and suppliers on their PDF exports, avoiding fiscal drift.',
      g2Title: 'Supplier Verification Audits',
      g2Desc: 'Every partner undergoes registry verification (Corporate license, NUIT, and active certifications) to guarantee secure delivery.',
      g3Title: 'Symmetric PDF Pricing & Discounts',
      g3Desc: 'Any discounts applied to a proposal by a supplier are immediately stored and carried over to the buyer\'s PDF export symmetrically.',
      g4Title: 'Security & System Resilience',
      g4Desc: 'Encrypted database protocols, corporate-level secure password changes, MFA, and offline local state caching capabilities.',

      sectionBenefits: 'Strategic Benefits',
      sectionBenefitsDesc: 'Elevate your corporate efficiency and financial health with proven statistical outcomes.',
      
      b1Title: '-60% Cycle Time reduction',
      b1Desc: 'Drastic reduction in quote approval and supplier negotiation cycles with zero email back-and-forth.',
      b2Title: '15% to 22% Savings',
      b2Desc: 'Optimized bulk purchasing cost through side-by-side transparent intelligence comparison tools.',
      b3Title: '100% Audit Precision',
      b3Desc: 'End-to-end trace logs starting from purchase requisitions to dispatch manifests and formal quotes.',
      
      bannerFooter: 'Evolve your supply chain today.',
      bannerFooterDesc: 'Get rid of dozens of fragmented emails, unorganized spreadsheets, and tax discrepancies. SupplyX unifies your procurement.',
      footerBadge: 'Enterprise Ready'
    }
  };

  const nav = t[language];

  return (
    <div className="w-full max-w-[1400px] mx-auto min-h-screen">
      {/* Hero Header */}
      <div className="relative mb-12 rounded-[40px] overflow-hidden border border-white/5 bg-gradient-to-br from-supplyx-surface to-supplyx-deep p-8 md:p-14 shadow-3xl">
        <div className="absolute top-0 right-0 w-[50%] h-[100%] bg-radial-gradient from-supplyx-blue/10 to-transparent opacity-60 pointer-events-none" />
        <div className="relative z-10 max-w-4xl space-y-6">
          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1 text-[9px] font-black tracking-[0.2em] uppercase rounded-full bg-supplyx-blue/20 text-supplyx-blue border border-supplyx-blue/30 inline-block">
              PLATAFORMA SUPPLYX
            </span>
            <span className="px-3.5 py-1 text-[9px] font-black tracking-[0.2em] uppercase rounded-full bg-zinc-800 text-zinc-400 border border-white/5 inline-block">
              {nav.footerBadge}
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight italic text-white leading-tight">
            {nav.title}
          </h1>
          <p className="text-base sm:text-lg font-bold text-supplyx-blue uppercase tracking-wider">
            {nav.subtitle}
          </p>
          <p className={`text-sm leading-relaxed max-w-3xl ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
            {nav.heroDesc}
          </p>
        </div>
      </div>

      {/* Main Grid: Capabilities */}
      <div className="mb-20 space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl font-black uppercase tracking-widest text-white flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-supplyx-blue" />
            {nav.sectionCapabilities}
          </h2>
          <p className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
            {nav.sectionCapabilitiesDesc}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="enterprise-card p-6 flex flex-col justify-between group h-full border border-white/5">
            <div>
              <div className="w-12 h-12 rounded-xl bg-supplyx-blue/10 border border-supplyx-blue/20 flex items-center justify-center text-supplyx-blue mb-6">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white mb-2">{nav.cap1Title}</h3>
              <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>{nav.cap1Desc}</p>
            </div>
            <div className="mt-8 flex items-center gap-1.5 text-[9px] font-black text-supplyx-blue uppercase tracking-widest">
              Módulo RFQ
            </div>
          </div>

          {/* Card 2 */}
          <div className="enterprise-card p-6 flex flex-col justify-between group h-full border border-white/5">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-6">
                <Warehouse className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white mb-2">{nav.cap2Title}</h3>
              <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>{nav.cap2Desc}</p>
            </div>
            <div className="mt-8 flex items-center gap-1.5 text-[9px] font-black text-amber-500 uppercase tracking-widest">
              Catálogo & IVA
            </div>
          </div>

          {/* Card 3 */}
          <div className="enterprise-card p-6 flex flex-col justify-between group h-full border border-white/5">
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 mb-6">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white mb-2">{nav.cap3Title}</h3>
              <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>{nav.cap3Desc}</p>
            </div>
            <div className="mt-8 flex items-center gap-1.5 text-[9px] font-black text-purple-500 uppercase tracking-widest">
              Chat & Alertas
            </div>
          </div>

          {/* Card 4 */}
          <div className="enterprise-card p-6 flex flex-col justify-between group h-full border border-white/5">
            <div>
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-500 mb-6">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white mb-2">{nav.cap4Title}</h3>
              <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>{nav.cap4Desc}</p>
            </div>
            <div className="mt-8 flex items-center gap-1.5 text-[9px] font-black text-teal-500 uppercase tracking-widest">
              Rotas & Despacho
            </div>
          </div>

          {/* Card 5 */}
          <div className="enterprise-card p-6 flex flex-col justify-between group h-full border border-white/5">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mb-6">
                <Briefcase className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white mb-2">{nav.cap5Title}</h3>
              <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>{nav.cap5Desc}</p>
            </div>
            <div className="mt-8 flex items-center gap-1.5 text-[9px] font-black text-emerald-500 uppercase tracking-widest">
              Gestão Financeira
            </div>
          </div>
        </div>
      </div>

      {/* Guarantees Blueprint & Security Section */}
      <div className="mb-20 grid grid-cols-1 lg:grid-cols-3 gap-10 items-stretch">
        <div className="lg:col-span-1 space-y-4 flex flex-col justify-center">
          <span className="px-3 py-1 text-[9px] font-black tracking-[0.25em] uppercase rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 max-w-max">
            GARANTIA COMPLETA
          </span>
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight italic text-white">
            {nav.sectionGuarantees}
          </h2>
          <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
            {nav.sectionGuaranteesDesc}
          </p>
          <div className="p-4 bg-supplyx-surface border border-white/5 rounded-2xl flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20">
              <ShieldCheck className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Protocolo de Confiança</p>
              <p className="text-xs font-bold text-white">100% Auditável e Criptografado</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {/* G1 */}
          <div className="p-6 rounded-2xl bg-supplyx-surface border border-white/5 space-y-2">
            <h3 className="text-sm font-black uppercase tracking-wider text-supplyx-blue flex items-center gap-2">
              <Percent className="w-4 h-4" />
              {nav.g1Title}
            </h3>
            <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{nav.g1Desc}</p>
          </div>

          {/* G2 */}
          <div className="p-6 rounded-2xl bg-supplyx-surface border border-white/5 space-y-2">
            <h3 className="text-sm font-black uppercase tracking-wider text-amber-500 flex items-center gap-2">
              <Award className="w-4 h-4" />
              {nav.g2Title}
            </h3>
            <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{nav.g2Desc}</p>
          </div>

          {/* G3 */}
          <div className="p-6 rounded-2xl bg-supplyx-surface border border-white/5 space-y-2">
            <h3 className="text-sm font-black uppercase tracking-wider text-purple-500 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {nav.g3Title}
            </h3>
            <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{nav.g3Desc}</p>
          </div>

          {/* G4 */}
          <div className="p-6 rounded-2xl bg-supplyx-surface border border-white/5 space-y-2">
            <h3 className="text-sm font-black uppercase tracking-wider text-teal-500 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              {nav.g4Title}
            </h3>
            <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{nav.g4Desc}</p>
          </div>
        </div>
      </div>

      {/* Strategic Metrics Section */}
      <div className="mb-20 rounded-[40px] px-8 py-12 md:p-14 border border-white/5 bg-gradient-to-tr from-zinc-950 to-supplyx-surface space-y-12">
        <div className="space-y-1 text-center">
          <span className="px-3 py-1 text-[9px] font-black tracking-[0.25em] uppercase rounded-full bg-supplyx-blue/10 text-supplyx-blue border border-supplyx-blue/20">
            MÉTRICAS CORPORATIVAS
          </span>
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight italic text-white mt-4">
            {nav.sectionBenefits}
          </h2>
          <p className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
            {nav.sectionBenefitsDesc}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* metric 1 */}
          <div className="p-6 rounded-3xl border border-white/5 bg-white/5 space-y-3 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 text-supplyx-blue">
              <Clock className="w-24 h-24" />
            </div>
            <h3 className="text-3xl font-black text-supplyx-blue italic tracking-tighter">{nav.b1Title}</h3>
            <p className="text-xs font-black text-white uppercase tracking-wider">Agilidade Operacional</p>
            <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>{nav.b1Desc}</p>
          </div>

          {/* metric 2 */}
          <div className="p-6 rounded-3xl border border-white/5 bg-white/5 space-y-3 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 text-amber-500">
              <TrendingUp className="w-24 h-24" />
            </div>
            <h3 className="text-3xl font-black text-amber-500 italic tracking-tighter">{nav.b2Title}</h3>
            <p className="text-xs font-black text-white uppercase tracking-wider">Mapeamento de Preço Inteligente</p>
            <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>{nav.b2Desc}</p>
          </div>

          {/* metric 3 */}
          <div className="p-6 rounded-3xl border border-white/5 bg-white/5 space-y-3 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 text-teal-500">
              <ShieldCheck className="w-24 h-24" />
            </div>
            <h3 className="text-3xl font-black text-teal-500 italic tracking-tighter">{nav.b3Title}</h3>
            <p className="text-xs font-black text-white uppercase tracking-wider">Compliance Completo</p>
            <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>{nav.b3Desc}</p>
          </div>
        </div>
      </div>

      {/* Footer Banner */}
      <div className="rounded-[40px] border border-white/5 bg-gradient-to-r from-supplyx-blue/10 via-transparent to-supplyx-blue/10 p-8 sm:p-12 text-center space-y-6">
        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-white">
          {nav.bannerFooter}
        </h2>
        <p className={`text-xs leading-relaxed max-w-xl mx-auto ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
          {nav.bannerFooterDesc}
        </p>
        <div className="flex items-center justify-center gap-2 text-[10px] font-black text-supplyx-blue uppercase tracking-widest leading-none">
          <ShieldCheck className="w-4 h-4" /> SupplyX Secure Platform
        </div>
      </div>
    </div>
  );
}
