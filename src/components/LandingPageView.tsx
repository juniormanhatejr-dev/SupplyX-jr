import React from 'react';
import { motion } from 'motion/react';
import { 
  ArrowRight, 
  Play, 
  ShieldCheck, 
  Zap, 
  Globe, 
  BarChart3, 
  Box, 
  Truck, 
  Layers, 
  TrendingUp,
  ChevronDown,
  CheckCircle2,
  Users,
  Linkedin,
  Twitter,
  Instagram,
  Mail,
  Smartphone
} from 'lucide-react';
import SupplyXLogo from './SupplyXLogo';

interface LandingPageViewProps {
  onGetStarted: () => void;
  onLogin: () => void;
  isDarkMode: boolean;
  language: 'PT' | 'EN';
}

export default function LandingPageView({ onGetStarted, onLogin, isDarkMode, language }: LandingPageViewProps) {
  const t = {
    PT: {
      hero: {
        title: "Procurement para Construção, Reinventado.",
        subtitle: "Gerencie fornecedores, materiais, RFQs, entregas e fluxos de aprovação em uma única plataforma inteligente.",
        cta1: "Iniciar Procurement",
        cta2: "Ver Dashboard"
      },
      problem: {
        title: "O Problema"
      },
      solution: {
        title: "A Solução"
      },
      howItWorks: {
        title: "Como Funciona"
      },
      trust: {
        metrics: [
          { value: "$12M+", label: "Procurement Gerenciado" },
          { value: "4,500+", label: "Entregas Rastreadas" },
          { value: "650+", label: "Fornecedores" },
          { value: "98%", label: "Entregas no Prazo" }
        ]
      },
      workflow: {
        title: "Fluxo de Trabalho de Procurement",
        steps: [
          { title: "Solicitar Materiais", desc: "Crie requisições detalhadas em segundos." },
          { title: "Receber Cotações", desc: "RFQs automáticas enviadas à sua rede de fornecedores." },
          { title: "Comparar Fornecedores", desc: "Análise inteligente de preços, prazos e qualidade." },
          { title: "Aprovar Compra", desc: "Fluxos de aprovação multinível com total visibilidade." },
          { title: "Rastrear Entregas", desc: "Monitoramento logístico em tempo real até o canteiro." },
          { title: "Gerir Inventário", desc: "Controle de stock automatizado em todos os armazéns." }
        ]
      },
      suppliers: {
        title: "Gestão Avançada de Fornecedores",
        subtitle: "Rede verificada de produtores e distribuidores de materiais."
      },
      logistics: {
        title: "Logística Industrial ao Vivo",
        subtitle: "Visibilidade total da sua frota e material em trânsito."
      },
      analytics: {
        title: "Analytics Enterprise",
        subtitle: "Insights operacionais para decisões baseadas em dados."
      },
      mobile: {
        tag: "Procurement em Movimento",
        title: "Controlo Nativo.",
        desc: "Uma experiência móvel de primeira classe para gestores de obra, motoristas e oficiais de procurement.",
        feats: {
           push: "Aprovação Push",
           sync: "Sincronização Offline",
           security: "Segurança Biométrica",
           tracking: "Rastreio de Ativos"
        }
      },
      faq: {
        title: "Dúvidas Frequentes",
        questions: [
          { q: "Como o SupplyX ajuda na redução de custos?", a: "Pela centralização de RFQs e analytics preditivo, identificamos as melhores janelas de compra e fornecedores mais eficientes, reduzindo o spend em até 15%." },
          { q: "A plataforma integra com meu ERP atual?", a: "Sim, possuímos APIs robustas para integração com os principais ERPs do mercado (SAP, Oracle, TOTVS) e ferramentas específicas de construção." },
          { q: "Posso gerir múltiplos canteiros ao mesmo tempo?", a: "Sim, o SupplyX foi desenhado para operações globais, permitindo a gestão de múltiplos projetos, armazéns e frotas de forma independente ou consolidada." }
        ]
      },
      footer: {
        desc: "Infraestrutura operacional para a indústria da construção moderna.",
        rights: "Todos os direitos reservados."
      }
    },
    EN: {
      hero: {
        title: "Construction Procurement, Reinvented.",
        subtitle: "Manage suppliers, materials, RFQs, deliveries and procurement workflows in one intelligent platform.",
        cta1: "Start Procurement",
        cta2: "View Dashboard"
      },
      problem: {
        title: "The Problem"
      },
      solution: {
        title: "The Solution"
      },
      howItWorks: {
        title: "How it Works"
      },
      trust: {
        metrics: [
          { value: "$12M+", label: "Procurement Managed" },
          { value: "4,500+", label: "Deliveries Tracked" },
          { value: "650+", label: "Suppliers" },
          { value: "98%", label: "On-Time Deliveries" }
        ]
      },
      workflow: {
        title: "Procurement Workflow",
        steps: [
          { title: "Request Materials", desc: "Create detailed requisitions in seconds." },
          { title: "Receive Quotes", desc: "Automated RFQs sent to your supplier network." },
          { title: "Compare Suppliers", desc: "Smart analysis of price, lead time, and quality." },
          { title: "Approve Procurement", desc: "Multi-level approval flows with full visibility." },
          { title: "Track Deliveries", desc: "Real-time logistics monitoring to the job site." },
          { title: "Manage Inventory", desc: "Automated stock control across all warehouses." }
        ]
      },
      suppliers: {
        title: "Advanced Supplier Management",
        subtitle: "Verified network of material producers and distributors."
      },
      logistics: {
        title: "Live Industrial Logistics",
        subtitle: "Total visibility of your fleet and materials in transit."
      },
      analytics: {
        title: "Enterprise Analytics",
        subtitle: "Operational insights for data-driven decisions."
      },
      mobile: {
        tag: "Procurement on the Go",
        title: "Native Control.",
        desc: "A first-class mobile experience for site managers, drivers, and procurement officers.",
        feats: {
           push: "Push Approval",
           sync: "Offline Sync",
           security: "Biometric Security",
           tracking: "Asset Tracking"
        }
      },
      faq: {
        title: "Frequently Asked Questions",
        questions: [
          { q: "How does SupplyX help reduce costs?", a: "By centralizing RFQs and using predictive analytics, we identify the best buying windows and most efficient suppliers, reducing spend by up to 15%." },
          { q: "Does the platform integrate with my current ERP?", a: "Yes, we have robust APIs for integration with major market ERPs (SAP, Oracle, Microsoft Dynamics) and specific construction tools." },
          { q: "Can I manage multiple job sites at once?", a: "Yes, SupplyX is built for global operations, allowing you to manage multiple projects, warehouses, and fleets independently or consolidated." }
        ]
      },
      footer: {
        desc: "Operational infrastructure for the modern construction industry.",
        rights: "All rights reserved."
      }
    }
  }[language];

  return (
    <div className="min-h-screen bg-supplyx-deep text-supplyx-white selection:bg-supplyx-blue selection:text-white font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] backdrop-blur-2xl border-b border-white/5 bg-supplyx-deep/70">
        <div className="max-w-[1600px] mx-auto px-6 h-24 flex items-center justify-between">
          <SupplyXLogo size="md" isDark={true} />
          <div className="hidden lg:flex items-center gap-12">
            <div className="flex items-center gap-8">
              <a href="#problem" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-all uppercase tracking-[0.2em]">{t.problem.title}</a>
              <a href="#solution" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-all uppercase tracking-[0.2em]">{t.solution.title}</a>
              <a href="#how" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-all uppercase tracking-[0.2em]">{t.howItWorks.title}</a>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-4">
              <button 
                onClick={onLogin} 
                className="text-xs font-black uppercase tracking-widest text-white px-8 py-4 rounded-2xl border border-white/5 hover:bg-white/5 transition-all active:scale-95"
              >
                {language === 'PT' ? 'Fazer Login' : 'Login'}
              </button>
              <button 
                onClick={onGetStarted} 
                className="text-xs font-black uppercase tracking-widest bg-supplyx-blue text-white px-10 py-4 rounded-2xl hover:bg-blue-600 shadow-2xl shadow-blue-500/20 transition-all active:scale-95"
              >
                {t.hero.cta1}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-64 pb-32 overflow-hidden industrial-grid bg-supplyx-deep">
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-left"
            >
              <div className="inline-flex items-center gap-4 px-5 py-2 rounded-lg bg-zinc-900 border border-white/5 mb-12">
                <span className="w-1.5 h-1.5 rounded-full bg-supplyx-blue shadow-[0_0_8px_#3B82F6]" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">Construction Procurement OS v4.0</span>
              </div>
              
              <h1 className="text-7xl md:text-9xl font-black tracking-tighter mb-12 leading-[0.85] uppercase text-white">
                {language === 'PT' ? (
                  <>
                    Procurement <br />
                    Industrial, <br />
                    <span className="text-supplyx-blue italic">Reinventado.</span>
                  </>
                ) : (
                  <>
                    Construction <br />
                    Procurement, <br />
                    <span className="text-supplyx-blue italic">Reinvented.</span>
                  </>
                )}
              </h1>
              
              <p className="text-xl md:text-2xl text-zinc-500 max-w-xl mb-16 font-medium leading-relaxed">
                {t.hero.subtitle}
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <button 
                  onClick={onGetStarted}
                  className="group w-full sm:w-auto px-14 py-8 rounded-xl bg-supplyx-blue text-white font-black uppercase text-sm tracking-widest hover:bg-blue-600 transition-all text-center flex items-center justify-center gap-4 shadow-3xl shadow-blue-500/20"
                >
                  {t.hero.cta1}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button 
                  onClick={onLogin}
                  className="w-full sm:w-auto px-12 py-8 rounded-xl border border-white/10 bg-white/5 font-black uppercase text-sm tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-4 text-white"
                >
                  <Play className="w-4 h-4 fill-white" />
                  {t.hero.cta2}
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              {/* Ultra Realistic Dashboard Mockup */}
              <div className="relative z-10 bg-zinc-900 rounded-[40px] p-2 border border-white/5 shadow-3xl overflow-hidden shadow-black/80">
                <div className="bg-zinc-800 border-b border-white/5 px-6 py-4 flex items-center justify-between">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{language === 'PT' ? 'Centro Global de Procurement' : 'Global Procurement Hub'}</div>
                </div>
                
                <div className="p-8 grid grid-cols-12 gap-8 bg-supplyx-deep min-h-[450px]">
                  <div className="col-span-4 space-y-6">
                    <div className="p-6 rounded-2xl bg-zinc-900 border border-white/5">
                      <p className="text-[8px] font-black text-zinc-500 uppercase mb-4 tracking-widest">{language === 'PT' ? 'Capital Gerido' : 'Capital Managed'}</p>
                      <p className="text-3xl font-black text-white italic">$12.4M</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-zinc-900 border border-white/5">
                      <p className="text-[8px] font-black text-zinc-500 uppercase mb-4 tracking-widest">{language === 'PT' ? 'Ordens Ativas' : 'Active Orders'}</p>
                      <p className="text-3xl font-black text-supplyx-blue italic">148</p>
                    </div>
                  </div>
                  
                  <div className="col-span-8 space-y-6">
                    <div className="bg-zinc-900 rounded-2xl border border-white/10 p-6">
                      <div className="flex justify-between items-center mb-6">
                         <h4 className="text-[9px] font-black uppercase tracking-widest text-white">{language === 'PT' ? 'RFQs Recentes' : 'Recent RFQs'}</h4>
                         <span className="text-[8px] font-black text-emerald-500 uppercase">Live</span>
                      </div>
                      <div className="space-y-4">
                         {[
                           { name: language === 'PT' ? 'Cimento CP-II' : 'Bulk Cement T1', val: '$4.5k', status: language === 'PT' ? 'Pendente' : 'Pending' },
                           { name: language === 'PT' ? 'Aço Vergalhão' : 'Reinforcement Steel', val: '$12.8k', status: language === 'PT' ? 'Aprovado' : 'Approved' },
                           { name: language === 'PT' ? 'Tubos PVC' : 'PVC Piping 50mm', val: '$1.2k', status: language === 'PT' ? 'Cotando' : 'Quoting' },
                         ].map((item, i) => (
                           <div key={i} className="flex items-center justify-between py-3 border-b border-white/5">
                              <span className="text-xs font-bold text-zinc-400">{item.name}</span>
                              <div className="flex items-center gap-6">
                                 <span className="font-mono text-xs text-white">{item.val}</span>
                                 <span className={`text-[8px] font-black uppercase px-2 py-1 rounded ${
                                   item.status === 'Approved' || item.status === 'Aprovado' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/5 text-zinc-500'
                                 }`}>{item.status}</span>
                              </div>
                           </div>
                         ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Accents */}
              <div className="absolute -top-10 -right-10 w-40 h-40 border border-white/5 rounded-full" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-supplyx-blue/10 blur-[80px] rounded-full" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust & Metrics Section */}
      <section className="py-24 bg-supplyx-dark border-y border-white/5">
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-24">
            {t.trust.metrics.map((metric, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center lg:text-left"
              >
                <div className="text-5xl lg:text-7xl font-black text-white tracking-tighter mb-4 italic">
                  {metric.value}
                </div>
                <div className="text-[10px] font-black uppercase tracking-[0.4em] text-supplyx-blue">
                  {metric.label}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-24 pt-24 border-t border-white/5 flex flex-wrap justify-center lg:justify-between items-center gap-12 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
            {['ConstructCorp', 'BuildGlobal', 'IndustrialInfrast', 'MetroDevelop', 'CivilPro'].map((logo, i) => (
              <span key={i} className="text-2xl font-black uppercase tracking-tighter text-zinc-500 lowercase italic select-none">{logo}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Procurement Workflow Section */}
      <section id="workflow" className="py-48 industrial-grid relative overflow-hidden">
        <div className="max-w-[1600px] mx-auto px-6 relative z-10">
          <div className="max-w-3xl mb-32">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-supplyx-blue mb-8">{language === 'PT' ? 'Controlo Ponta-a-Ponta' : 'End-to-End Control'}</p>
            <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-white mb-12 leading-none italic">
              {t.workflow.title}
            </h2>
            <p className="text-2xl text-zinc-500 font-medium leading-relaxed italic">
              {language === 'PT' ? 'Desde a requisição inicial até à chegada ao armazém. Totalmente automatizado.' : 'From initial requisition to warehouse arrival. Fully automated.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {t.workflow.steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="group p-10 rounded-3xl bg-zinc-900 border border-white/5 hover:border-supplyx-blue/30 transition-all cursor-default"
              >
                <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-white/5 flex items-center justify-center text-zinc-600 group-hover:text-supplyx-blue group-hover:bg-supplyx-blue/5 transition-all mb-10 font-mono text-xs font-black">
                  0{i + 1}
                </div>
                <h3 className="text-2xl font-black uppercase mb-6 text-white tracking-tight italic group-hover:text-supplyx-blue transition-colors">{step.title}</h3>
                <p className="text-lg text-zinc-500 font-medium leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Supplier Management Section */}
      <section id="suppliers" className="py-48 bg-supplyx-deep border-y border-white/5">
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="flex flex-col lg:flex-row justify-between items-end mb-32 gap-12">
            <div className="max-w-2xl">
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-supplyx-blue mb-8">{language === 'PT' ? 'Rede Verificada' : 'Verified Network'}</p>
              <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-white mb-0 italic">
                {t.suppliers.title}
              </h2>
            </div>
            <p className="text-xl text-zinc-500 font-medium leading-relaxed italic max-w-sm">
              {t.suppliers.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { name: 'Gerdau S.A.', rating: 4.9, category: 'Steel/Infrast', status: 'Verified' },
              { name: 'Votorantim', rating: 4.8, category: 'Cement/Bulk', status: 'Preferred' },
              { name: 'Tigre Tubos', rating: 4.7, category: 'Hydraulics', status: 'Verified' },
              { name: 'Saint-Gobain', rating: 4.9, category: 'Finishing', status: 'Enterprise' },
            ].map((supplier, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -10 }}
                className="p-10 rounded-3xl bg-zinc-900 border border-white/5 hover:border-supplyx-blue/30 transition-all group"
              >
                <div className="flex justify-between items-start mb-10">
                   <div className="w-12 h-12 rounded-xl bg-supplyx-blue/10 flex items-center justify-center text-supplyx-blue">
                      <ShieldCheck className="w-6 h-6" />
                   </div>
                   <span className="text-[8px] font-black uppercase px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded tracking-widest">{supplier.status}</span>
                </div>
                <h3 className="text-2xl font-black uppercase text-white mb-2 italic tracking-tight">{supplier.name}</h3>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-6">{supplier.category}</p>
                <div className="flex items-center gap-2 mb-8">
                   <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => <div key={s} className={`w-1 h-3 rounded-full ${s <= 4 ? 'bg-supplyx-blue' : 'bg-white/10'}`} />)}
                   </div>
                   <span className="text-[10px] font-black text-white">{supplier.rating}</span>
                </div>
                <button className="w-full py-4 rounded-xl border border-white/5 text-[10px] font-black uppercase tracking-widest group-hover:bg-supplyx-blue group-hover:border-supplyx-blue transition-all">{language === 'PT' ? 'Solicitar Cotação' : 'Request Quote'}</button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Logistics Section */}
      <section id="logistics" className="py-48 industrial-grid overflow-hidden">
        <div className="max-w-[1600px] mx-auto px-6">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
              <div>
                 <p className="text-[10px] font-black uppercase tracking-[0.5em] text-supplyx-blue mb-8">{language === 'PT' ? 'Visibilidade em Tempo Real' : 'Real-time Visibility'}</p>
                 <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-white mb-12 italic leading-none">
                    {t.logistics.title}
                 </h2>
                 <p className="text-2xl text-zinc-500 font-medium leading-relaxed italic mb-16">
                    {language === 'PT' ? 'Otimização de rotas, performance de motoristas e precisão ao milissegundo na entrega de materiais.' : 'Route optimization, driver performance, and millisecond-level precision on material delivery.'}
                 </p>
                 
                 <div className="space-y-6">
                    {[
                      { label: language === 'PT' ? 'Rotas Ativas' : 'Active Routes', val: '1,240' },
                      { label: language === 'PT' ? 'Tempo Médio Entrega' : 'Avg Delivery Time', val: language === 'PT' ? '2.4 dias' : '2.4 days' },
                      { label: language === 'PT' ? 'Eficiência Combustível' : 'Fuel Efficiency', val: '+18%' },
                    ].map((stat, i) => (
                      <div key={i} className="flex items-center justify-between p-6 bg-zinc-900 border border-white/5 rounded-2xl">
                         <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{stat.label}</span>
                         <span className="text-xl font-black text-white italic">{stat.val}</span>
                      </div>
                    ))}
                 </div>
              </div>
              
              <div className="relative">
                 <div className="aspect-square rounded-[48px] bg-zinc-900 border border-white/10 overflow-hidden relative shadow-3xl">
                    {/* Simulated Map / Logistics UI */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none">
                       <div className="absolute top-1/4 left-1/4 w-px h-1/2 bg-supplyx-blue/50 rotate-45" />
                       <div className="absolute top-1/2 left-1/2 w-px h-1/2 bg-emerald-500/50 -rotate-12" />
                    </div>
                    
                    <div className="absolute inset-0 p-8 flex flex-col justify-between">
                       <div className="flex justify-between items-start">
                          <div className="px-4 py-2 rounded-lg bg-zinc-800 border border-white/10 text-[8px] font-black uppercase tracking-widest text-white">LIVE_FLEET_VIEW</div>
                          <div className="w-12 h-12 rounded-full border border-supplyx-blue/30 flex items-center justify-center">
                             <div className="w-2 h-2 rounded-full bg-supplyx-blue animate-ping" />
                          </div>
                       </div>
                       
                       <div className="space-y-4">
                          {[1, 2].map(i => (
                            <div key={i} className="p-4 bg-zinc-800/80 backdrop-blur rounded-2xl border border-white/10 flex items-center gap-4">
                               <div className="w-10 h-10 rounded-xl bg-supplyx-blue/20 flex items-center justify-center text-supplyx-blue">
                                  <Truck className="w-5 h-5" />
                               </div>
                               <div>
                                  <p className="text-[10px] font-black text-white">TRUCK_OS_#459{i}</p>
                                  <p className="text-[8px] text-zinc-500 uppercase tracking-widest">EN ROUTE • ETA 2H 14M</p>
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>
                 </div>
                 
                 {/* Decorative float elements */}
                 <div className="absolute -top-12 -right-12 w-32 h-32 bg-supplyx-blue/10 blur-[60px] animate-pulse" />
              </div>
           </div>
        </div>
      </section>

      {/* Enterprise Analytics Section */}
      <section id="analytics" className="py-48 bg-supplyx-dark border-y border-white/5">
        <div className="max-w-[1600px] mx-auto px-6">
           <div className="text-center mb-40">
              <p className="text-[10px] font-black uppercase tracking-[0.6em] text-supplyx-blue mb-8">{language === 'PT' ? 'Inteligência de Performance' : 'Performance Intelligence'}</p>
              <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-white mb-0 italic leading-none">{t.analytics.title}</h2>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 p-12 lg:p-20 rounded-[48px] bg-zinc-900 border border-white/5 shadow-3xl">
                 <div className="flex justify-between items-center mb-12">
                    <div>
                       <h4 className="text-2xl font-black uppercase text-white tracking-tight italic">{language === 'PT' ? 'Gastos em Procurement' : 'Procurement Spend'}</h4>
                       <p className="text-sm text-zinc-500 font-medium">{language === 'PT' ? 'Alocação mensal entre os 10 principais projetos' : 'Monthly allocation across top 10 projects'}</p>
                    </div>
                    <button className="px-6 py-3 rounded-lg bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">{language === 'PT' ? 'Exportar Relatório' : 'Export Report'}</button>
                 </div>
                 
                 <div className="h-[300px] lg:h-[400px] w-full flex items-end justify-between gap-2 lg:gap-4">
                    {[65, 45, 85, 30, 55, 90, 75, 60, 40, 95].map((h, i) => (
                      <div key={i} className="flex-grow group relative h-full flex items-end">
                         <div 
                           style={{ height: `${h}%` }} 
                           className="w-full bg-supplyx-blue/20 group-hover:bg-supplyx-blue transition-all duration-500 rounded-t-xl border-t border-supplyx-blue/20"
                         />
                         <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] font-mono text-white">$M {h}.2</span>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="space-y-12">
                 {[
                   { label: language === 'PT' ? 'Eficiência Fornecedores' : 'Supplier Efficiency', val: '94%', color: 'text-emerald-500' },
                   { label: language === 'PT' ? 'Economia de Custos (YoY)' : 'Cost Savings (YoY)', val: '22.4%', color: 'text-supplyx-blue' },
                   { label: language === 'PT' ? 'Giro de Inventário' : 'Inventory Turnover', val: '6.8x', color: 'text-white' },
                 ].map((kpi, i) => (
                   <div key={i} className="p-12 rounded-[40px] bg-zinc-900 border border-white/5">
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-8">{kpi.label}</p>
                      <div className="flex items-end justify-between">
                         <span className={`text-6xl font-black italic tracking-tighter ${kpi.color}`}>{kpi.val}</span>
                         <TrendingUp className={`w-10 h-10 ${kpi.color} opacity-20`} />
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </section>

      {/* Mobile Experience Section */}
      <section className="py-48 industrial-grid bg-supplyx-deep">
        <div className="max-w-[1600px] mx-auto px-6">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
              <div className="order-2 lg:order-1 relative flex justify-center">
                 {/* Mobile Mockups */}
                 <div className="relative w-[320px] h-[650px] bg-zinc-900 rounded-[50px] border-8 border-zinc-800 shadow-3xl overflow-hidden shadow-black/80">
                    <div className="absolute top-0 inset-x-0 h-8 flex justify-center">
                       <div className="w-20 h-4 bg-zinc-800 rounded-b-2xl" />
                    </div>
                    <div className="p-8 pt-16 h-full flex flex-col">
                       <div className="flex justify-between items-center mb-10">
                          <SupplyXLogo size="xs" isDark={true} />
                          <div className="w-8 h-8 rounded-full bg-slate-800 animate-pulse" />
                       </div>
                       <div className="space-y-6">
                          <div className="p-6 rounded-3xl bg-supplyx-blue shadow-2xl shadow-blue-500/20">
                             <p className="text-[8px] font-black text-white/60 uppercase mb-2">Total Managed</p>
                             <p className="text-2xl font-black text-white italic">$4.2M</p>
                          </div>
                          <div className="space-y-4">
                             <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Approvals</p>
                             {[1, 2, 3].map(i => (
                               <div key={i} className="p-4 bg-zinc-800 rounded-2xl border border-white/5 flex justify-between items-center">
                                  <div className="flex items-center gap-3">
                                     <div className="w-2 h-2 rounded-full bg-supplyx-blue" />
                                     <span className="text-[10px] font-bold text-white uppercase">REQ_#0{i}42</span>
                                  </div>
                                  <ArrowRight className="w-3 h-3 text-zinc-600" />
                               </div>
                             ))}
                          </div>
                       </div>
                    </div>
                 </div>
                 
                 {/* Floating notifications mockup */}
                 <motion.div 
                   animate={{ y: [0, -10, 0] }}
                   transition={{ duration: 4, repeat: Infinity }}
                   className="absolute top-20 -right-20 p-6 rounded-2xl bg-zinc-800 border border-white/5 shadow-2xl backdrop-blur-xl z-20 hidden md:block"
                 >
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                          <ShieldCheck className="w-5 h-5" />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-white">Delivery Approved</p>
                          <p className="text-[8px] text-zinc-500">PO #2401 verified by site manager</p>
                       </div>
                    </div>
                  </motion.div>
               </div>

               <div className="order-1 lg:order-2">
                 <p className="text-[10px] font-black uppercase tracking-[0.5em] text-supplyx-blue mb-8">{t.mobile.tag}</p>
                 <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-white mb-12 italic leading-none">
                    {t.mobile.title}
                 </h2>
                 <p className="text-2xl text-zinc-500 font-medium leading-relaxed italic mb-16">
                    {t.mobile.desc}
                 </p>
                 <div className="grid grid-cols-2 gap-8">
                    {[
                      { icon: Smartphone, label: t.mobile.feats.push },
                      { icon: Zap, label: t.mobile.feats.sync },
                      { icon: ShieldCheck, label: t.mobile.feats.security },
                      { icon: Box, label: t.mobile.feats.tracking },
                    ].map((feat, i) => (
                      <div key={i} className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center text-supplyx-blue">
                            <feat.icon className="w-5 h-5" />
                         </div>
                         <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{feat.label}</span>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* FAQ Center */}
      <section id="faq" className="py-48 industrial-grid bg-supplyx-deep border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-32">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-supplyx-blue mb-8">{language === 'PT' ? 'Centro de Inteligência' : 'Intelligence Center'}</p>
            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-8 text-white italic leading-none">{t.faq.title}</h2>
          </div>

          <div className="space-y-4">
            {t.faq.questions.map((item, i) => (
              <details key={i} className="group glass-dark rounded-[24px] border border-white/5 overflow-hidden open:ring-1 open:ring-supplyx-blue transition-all">
                <summary className="flex items-center justify-between p-10 cursor-pointer list-none">
                  <span className="text-2xl font-black uppercase tracking-tight text-white italic">{item.q}</span>
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-zinc-600 group-open:rotate-180 transition-transform">
                     <ChevronDown className="w-6 h-6" />
                  </div>
                </summary>
                <div className="px-10 pb-10 text-xl text-zinc-500 font-medium leading-relaxed border-t border-white/5 pt-10">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - The Closing */}
      <section className="py-48 relative overflow-hidden bg-supplyx-deep border-t border-white/5">
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="relative rounded-[48px] p-24 md:p-48 text-center overflow-hidden bg-zinc-900 border border-white/5 shadow-3xl">
              <div className="absolute inset-0 industrial-grid opacity-10" />
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.8em] text-supplyx-blue mb-12">{language === 'PT' ? 'Onboarding Institucional' : 'Institutional Onboarding'}</p>
                <h2 className="text-6xl md:text-9xl font-black tracking-tighter mb-20 uppercase leading-[0.85] text-white">
                   {language === 'PT' ? (
                     <>Padronize o <br /> <span className="text-supplyx-blue italic">Comércio Global.</span></>
                   ) : (
                     <>Standardize <br /> <span className="text-supplyx-blue italic">Global Trade.</span></>
                   )}
                </h2>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                   <button 
                     onClick={onGetStarted}
                     className="group w-full sm:w-auto px-16 py-8 rounded-xl bg-supplyx-blue text-white font-black uppercase text-sm tracking-[0.2em] hover:bg-blue-600 transition-all flex items-center justify-center gap-4 shadow-3xl shadow-blue-500/20"
                   >
                     {language === 'PT' ? 'Solicitar Acesso' : 'Request Access'}
                     <ArrowRight className="w-5 h-5" />
                   </button>
                   <button 
                     className="w-full sm:w-auto px-14 py-8 rounded-xl border border-white/10 text-white font-black uppercase text-sm tracking-[0.2em] hover:bg-white/5 transition-all"
                   >
                     {language === 'PT' ? 'Documentação' : 'Documentation'}
                   </button>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Industrial Footer */}
      <footer className="pt-48 pb-20 border-t border-white/5 bg-supplyx-deep">
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-24 mb-48">
            <div className="md:col-span-4 space-y-16">
              <SupplyXLogo size="lg" isDark={true} />
              <p className="text-xl text-zinc-600 font-medium leading-relaxed max-w-sm italic">
                {t.footer.desc}
              </p>
              <div className="flex gap-4">
                {[Twitter, Linkedin, Instagram, Mail].map((Icon, i) => (
                  <a key={i} href="#" className="w-14 h-14 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-600 hover:text-supplyx-blue hover:bg-zinc-800 transition-all border border-white/5">
                    <Icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>
            
            <div className="md:col-span-8 grid grid-cols-2 lg:grid-cols-4 gap-12 text-left">
               <div className="space-y-8">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-supplyx-blue">{language === 'PT' ? 'Infraestrutura' : 'Infrastructure'}</h4>
                  <ul className="space-y-4 text-xs font-black uppercase tracking-widest text-zinc-600">
                    <li><a href="#" className="hover:text-white transition-colors">{language === 'PT' ? 'Ledger On-chain' : 'On-chain Ledger'}</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">{language === 'PT' ? 'Motor Preditivo' : 'Predictive Engine'}</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Node Network</a></li>
                  </ul>
               </div>
               <div className="space-y-8">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-supplyx-blue">{language === 'PT' ? 'Ecossistema' : 'Ecosystem'}</h4>
                  <ul className="space-y-4 text-xs font-black uppercase tracking-widest text-zinc-600">
                    <li><a href="#" className="hover:text-white transition-colors">{language === 'PT' ? 'Fabricantes' : 'Manufacturers'}</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Logistics Hub</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">{language === 'PT' ? 'Frota Móvel' : 'Mobile Fleet'}</a></li>
                  </ul>
               </div>
               <div className="space-y-8">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-supplyx-blue">{language === 'PT' ? 'Recursos' : 'Resources'}</h4>
                  <ul className="space-y-4 text-xs font-black uppercase tracking-widest text-zinc-600">
                    <li><a href="#" className="hover:text-white transition-colors">API Docs</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Whitepaper</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">{language === 'PT' ? 'Casos de Estudo' : 'Case Studies'}</a></li>
                  </ul>
               </div>
               <div className="space-y-8">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-supplyx-blue">{language === 'PT' ? 'Legal' : 'Legal'}</h4>
                  <ul className="space-y-4 text-xs font-black uppercase tracking-widest text-zinc-600">
                    <li><a href="#" className="hover:text-white transition-colors">{language === 'PT' ? 'Privacidade' : 'Privacy'}</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Security Audit</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">{language === 'PT' ? 'Conformidade' : 'Compliance'}</a></li>
                  </ul>
               </div>
            </div>
          </div>
          
          <div className="flex flex-col lg:flex-row items-center justify-between gap-10 pt-16 border-t border-white/5">
             <div className="flex items-center gap-12">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-800">© 2026 SUPPLYX CORE INFRASTRUCTURE</p>
                <div className="hidden sm:flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.5em] text-supplyx-blue">
                   <div className="w-1.5 h-1.5 rounded-full bg-supplyx-blue" />
                   {language === 'PT' ? 'NODES: 12.450 ONLINE' : 'NODES: 12,450 ONLINE'}
                </div>
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-800">
               {language === 'PT' ? 'OPERAÇÕES GLOBAIS • OS DE CONSTRUÇÃO' : 'GLOBAL OPERATIONS • CONSTRUCTION OS'}
             </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
