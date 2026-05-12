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
        title: "A Nova Infraestrutura Logística de África",
        subtitle: "Elimine a incerteza. Use IA para prever a procura e Blockchain para garantir confiança total em cada entrega.",
        cta1: "Começar Agora",
        cta2: "Ver Demonstração"
      },
      problem: {
        title: "O Gap da Confiança",
        subtitle: "Por que as cadeias de suprimentos tradicionais falham em África?",
        items: [
          { title: "Invisibilidade", desc: "Não saber onde as suas mercadorias estão ou quando chegarão." },
          { title: "Incerteza de Stock", desc: "Perder vendas por falta de material ou desperdiçar capital em stock excessivo." },
          { title: "Falta de Provas", desc: "Transações baseadas em papel que são fáceis de falsificar e difíceis de rastrear." }
        ]
      },
      solution: {
        title: "O Motor SupplyX",
        subtitle: "Três tecnologias, uma única fonte de verdade.",
        engines: [
          { 
            title: "Previsão com IA", 
            subtitle: "Inteligência de Mercado",
            desc: "Os nossos algoritmos analisam o consumo real para prever exatamente o que precisa de encomendar e quando.",
            icon: TrendingUp 
          },
          { 
            title: "Integridade Blockchain", 
            subtitle: "Confiança Imutável",
            desc: "Cada transação e etapa logística é gravada on-chain. Registos que não podem ser apagados ou alterados.",
            icon: ShieldCheck 
          },
          { 
            title: "Logística em Tempo Real", 
            subtitle: "Visibilidade Total",
            desc: "Rastreio GPS e IoT integrado. Saiba o estado exacto de cada contentor em tempo real.",
            icon: Truck 
          }
        ]
      },
      features: {
        title: "Ecossistema Completo",
        items: [
          { icon: Box, title: "Stock Inteligente", desc: "Gestão automatizada de inventário para evitar rupturas de stock." },
          { icon: Users, title: "Hub de Fabricantes", desc: "Conexão directa com os maiores produtores do continente Africano." },
          { icon: BarChart3, title: "Analytics Avançado", desc: "Dados valiosos para otimizar a sua cadeia de distribuição global." },
          { icon: Globe, title: "Expansão Regional", desc: "Simplificamos o comércio cross-border entre nações Africanas." },
          { icon: Zap, title: "Execução Ultra-Rápida", desc: "Reduza o lead time de semanas para dias com processos digitais." },
          { icon: Smartphone, title: "App Mobile Pro", desc: "Controle toda a operação na palma da sua mão." }
        ]
      },
      howItWorks: {
        title: "O Caminho Digital",
        steps: [
          { title: "Abastecimento com Confiança", desc: "Escolha produtos de fabricantes verificados e certificados." },
          { title: "IA Otimiza a sua Compra", desc: "O motor sugere as quantidades ideais baseadas em dados." },
          { title: "Rastreio On-chain", desc: "Acompanhe a viagem da mercadoria com provas digitais invioláveis." },
          { title: "Relatório de Impacto", desc: "Analise a eficiência e reduza custos em tempo real." }
        ]
      },
      stats: [
        { label: "Volume Transacionado", value: "MT 450M+" },
        { label: "Precisão de Entrega", value: "99.4%" },
        { label: "Nós de Blockchain", value: "1.2K+" }
      ],
      faq: {
        title: "Clareza e Transparência",
        questions: [
          { q: "O que é 'On-chain Logistics'?", a: "Significa que cada movimentação da sua mercadoria gera um registo numa blockchain descentralizada. Isto garante que ninguém pode alterar datas de entrega, provas de recepção ou preços após o facto." },
          { q: "Como a IA ajuda no meu negócio?", a: "A IA da SupplyX não apenas rastreia; ela prevê. Se as vendas de cimento estão a subir na sua região, o sistema sugere que compre agora para evitar a subida de preços ou ruptura de stock." },
          { q: "A plataforma é para fabricantes ou compradores?", a: "Para ambos. Fabricantes ganham um canal de venda directo e transparente; compradores ganham acesso a preços de fábrica e logística fiável." }
        ]
      },
      footer: {
        desc: "Resolvendo a logística de África com tecnologia de próxima geração.",
        rights: "Todos os direitos reservados."
      }
    },
    EN: {
      hero: {
        title: "Africa's New Logistics Infrastructure",
        subtitle: "Eliminate uncertainty. Use AI to predict demand and Blockchain to guarantee total trust in every delivery.",
        cta1: "Get Started",
        cta2: "View Demo"
      },
      problem: {
        title: "The Trust Gap",
        subtitle: "Why do traditional supply chains fail in Africa?",
        items: [
          { title: "Invisibility", desc: "Not knowing where your goods are or when they'll arrive." },
          { title: "Stock Uncertainty", desc: "Losing sales due to shortages or wasting capital on excess stock." },
          { title: "Lack of Proof", desc: "Paper-based transactions that are easy to fake and hard to trace." }
        ]
      },
      solution: {
        title: "The SupplyX Engine",
        subtitle: "Three technologies, one single source of truth.",
        engines: [
          { 
            title: "AI Forecasting", 
            subtitle: "Market Intelligence",
            desc: "Our algorithms analyze real consumption to predict exactly what you need to order and when.",
            icon: TrendingUp 
          },
          { 
            title: "Blockchain Integrity", 
            subtitle: "Immutable Trust",
            desc: "Every transaction and logistics step is recorded on-chain. Records that cannot be erased or altered.",
            icon: ShieldCheck 
          },
          { 
            title: "Real-Time Logistics", 
            subtitle: "Total Visibility",
            desc: "Integrated GPS and IoT tracking. Know the exact status of every container in real time.",
            icon: Truck 
          }
        ]
      },
      features: {
        title: "Complete Ecosystem",
        items: [
          { icon: Box, title: "Smart Inventory", desc: "Automated inventory management to avoid stockouts." },
          { icon: Users, title: "Manufacturer Hub", desc: "Direct connection with the continent's largest producers." },
          { icon: BarChart3, title: "Advanced Analytics", desc: "Valuable data to optimize your global distribution chain." },
          { icon: Globe, title: "Regional Expansion", desc: "Simplify cross-border trade between African nations." },
          { icon: Zap, title: "Ultra-Fast Execution", desc: "Reduce lead time from weeks to days with digital processes." },
          { icon: Smartphone, title: "Pro Mobile App", desc: "Control the entire operation from the palm of your hand." }
        ]
      },
      howItWorks: {
        title: "The Digital Path",
        steps: [
          { title: "Source with Confidence", desc: "Choose products from verified and certified manufacturers." },
          { title: "AI Optimizes Your Purchase", desc: "The engine suggests ideal quantities based on data." },
          { title: "On-chain Tracking", desc: "Follow the goods' journey with inviolable digital proofs." },
          { title: "Impact Reporting", desc: "Analyze efficiency and reduce costs in real time." }
        ]
      },
      stats: [
        { label: "Transaction Volume", value: "MT 450M+" },
        { label: "Delivery Accuracy", value: "99.4%" },
        { label: "Blockchain Nodes", value: "1.2K+" }
      ],
      faq: {
        title: "Clarity & Transparency",
        questions: [
          { q: "What is 'On-chain Logistics'?", a: "It means every movement of your goods generates a record on a decentralized blockchain. This ensures that no one can alter delivery dates, proof of receipts, or prices after the fact." },
          { q: "How does AI help my business?", a: "SupplyX AI doesn't just track; it predicts. If cement sales are rising in your region, the system suggests you buy now to avoid price hikes or stockouts." },
          { q: "Is the platform for manufacturers or buyers?", a: "Both. Manufacturers gain a direct and transparent sales channel; buyers gain access to factory prices and reliable logistics." }
        ]
      },
      footer: {
        desc: "Solving Africa's logistics with next-generation technology.",
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
                Login
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
      <section className="relative pt-64 pb-48 overflow-hidden industrial-grid">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-supplyx-blue/20 to-transparent" />
        
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-left"
            >
              <div className="inline-flex items-center gap-4 px-5 py-2 rounded-lg bg-zinc-900 border border-white/5 mb-12">
                <span className="w-1.5 h-1.5 rounded-full bg-supplyx-blue shadow-[0_0_8px_#0052CC]" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">Logistics Infrastructure v4.0</span>
              </div>
              
              <h1 className="text-7xl md:text-9xl font-black tracking-tighter mb-12 leading-[0.85] uppercase text-white">
                Supply <span className="text-supplyx-blue">Chain</span> <br />
                Performance.
              </h1>
              
              <p className="text-xl md:text-2xl text-zinc-500 max-w-xl mb-16 font-medium leading-relaxed">
                {t.hero.subtitle}
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <button 
                  onClick={onGetStarted}
                  className="group w-full sm:w-auto px-14 py-8 rounded-xl bg-supplyx-blue text-white font-black uppercase text-sm tracking-widest hover:bg-blue-600 transition-all text-center flex items-center justify-center gap-4"
                >
                  {t.hero.cta1}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button 
                  className="w-full sm:w-auto px-12 py-8 rounded-xl border border-white/10 bg-white/5 font-black uppercase text-sm tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-4 text-white"
                >
                  <Play className="w-4 h-4 fill-white" />
                  {t.hero.cta2}
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative z-10 glass-dark rounded-[40px] p-12 border border-white/5 shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-8">
                    <Zap className="w-8 h-8 text-supplyx-blue" />
                 </div>
                 
                 <div className="space-y-12">
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-[0.4em] text-supplyx-blue mb-4">Network Status</p>
                       <div className="flex items-end gap-2">
                          <div className="text-5xl font-mono font-black text-white italic">12,450</div>
                          <p className="text-[10px] font-black uppercase text-zinc-500 mb-2">Active Nodes</p>
                       </div>
                    </div>

                    <div className="space-y-6">
                       {[
                         { label: 'Blockchain Sync', value: 'Live', col: 'text-emerald-500' },
                         { label: 'AI Prediction Latency', value: '4ms', col: 'text-supplyx-blue' },
                         { label: 'Region Expansion', value: 'Active', col: 'text-white' }
                       ].map((stat, i) => (
                         <div key={i} className="flex justify-between items-center py-4 border-b border-white/5">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{stat.label}</span>
                            <span className={`text-xs font-mono font-black uppercase ${stat.col}`}>{stat.value}</span>
                         </div>
                       ))}
                    </div>

                    <div className="p-8 rounded-2xl bg-supplyx-deep border border-white/10">
                       <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-6">Latest Transaction Hash</p>
                       <div className="font-mono text-sm text-supplyx-blue truncate">0x8F2A...9C1B47D2E5F3A0B1C4</div>
                    </div>
                 </div>
              </div>

              {/* Minimal Industrial Accents */}
              <div className="absolute -top-12 -right-12 w-48 h-48 border border-white/5 rounded-full" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 border border-supplyx-blue/10 rounded-full" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Problem Section (The Trust Gap) */}
      <section id="problem" className="py-48 border-y border-white/5 industrial-grid">
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-end mb-32">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-supplyx-blue mb-8">Case for Change</p>
              <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter mb-0 leading-none text-white">
                {t.problem.title}
              </h2>
            </div>
            <p className="text-xl text-zinc-500 font-medium leading-relaxed italic max-w-xl">
              {t.problem.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-1px bg-white/5 border border-white/5 overflow-hidden rounded-[24px]">
            {t.problem.items.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="p-16 bg-supplyx-deep group hover:bg-zinc-900/50 transition-all"
              >
                <div className="font-mono text-sm text-supplyx-blue mb-12">SECTION_0{i + 1}</div>
                <h3 className="text-2xl font-black uppercase mb-8 text-white tracking-tight">{item.title}</h3>
                <p className="text-lg text-zinc-500 leading-relaxed font-medium">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* The SupplyX Engine (The Solution) */}
      <section id="solution" className="py-48">
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="text-center mb-40">
            <p className="text-[10px] font-black uppercase tracking-[0.6em] text-supplyx-blue mb-8">Proprietary Technology Stack</p>
            <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter mb-0 text-white italic">{t.solution.title}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {t.solution.engines.map((engine, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -10 }}
                className="group relative p-16 rounded-[32px] bg-zinc-900/30 border border-white/5 hover:border-supplyx-blue transition-all duration-300 h-full flex flex-col"
              >
                <div className="relative z-10 flex-grow">
                  <div className="w-20 h-20 rounded-[20px] bg-zinc-800 border border-white/5 flex items-center justify-center text-supplyx-blue mb-12 group-hover:bg-supplyx-blue group-hover:text-white transition-all shadow-xl group-hover:scale-105">
                    <engine.icon className="w-10 h-10" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-supplyx-blue mb-6">{engine.subtitle}</p>
                  <h3 className="text-3xl font-black uppercase mb-8 text-white tracking-tight leading-tight">{engine.title}</h3>
                  <p className="text-xl text-zinc-400 font-medium leading-relaxed group-hover:text-zinc-300 transition-colors">{engine.desc}</p>
                </div>
                
                <div className="mt-12 pt-12 border-t border-white/5 flex justify-between items-center">
                   <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Protocol Engine v2.4</span>
                   <ArrowRight className="w-5 h-5 text-zinc-700 group-hover:text-supplyx-blue transition-colors" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats - Full Width High Impact */}
      <section className="py-24 bg-supplyx-blue relative overflow-hidden border-y border-white/10">
        <div className="max-w-[1600px] mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-24 divide-x divide-white/10">
             {t.stats.map((stat, i) => (
                <div key={i} className="px-12 first:pl-0 group">
                   <p className="text-sm font-black uppercase tracking-[0.4em] text-supplyx-deep/60 mb-6">{stat.label}</p>
                   <p className="text-7xl lg:text-9xl font-black italic text-white tracking-tighter group-hover:scale-105 transition-transform duration-500">{stat.value}</p>
                </div>
             ))}
          </div>
        </div>
      </section>

      {/* Complete Ecosystem (Features) */}
      <section className="py-48 industrial-grid">
        <div className="max-w-[1600px] mx-auto px-6 text-center">
           <div className="max-w-3xl mx-auto mb-40">
              <p className="text-[10px] font-black uppercase tracking-[0.6em] text-supplyx-blue mb-8">Integrated Ecosystem</p>
              <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter mb-12 text-white italic">{t.features.title}</h2>
              <p className="text-2xl text-zinc-500 font-medium leading-relaxed italic mx-auto">Scalable infrastructure for sovereign trade.</p>
           </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {t.features.items.map((feature, i) => (
              <div key={i} className="p-14 rounded-[40px] border border-white/5 bg-zinc-900/20 hover:bg-zinc-900/40 transition-all group cursor-default">
                <div className="w-14 h-14 rounded-xl bg-zinc-800 border border-white/5 flex items-center justify-center text-zinc-500 group-hover:bg-supplyx-blue/10 group-hover:text-supplyx-blue transition-all mb-12">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black uppercase mb-6 text-white tracking-tight italic">{feature.title}</h3>
                <p className="text-lg text-zinc-500 font-medium leading-relaxed group-hover:text-zinc-400 transition-colors">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works - Industrial Vertical Steps */}
      <section id="how" className="py-48 bg-supplyx-dark border-y border-white/5">
        <div className="max-w-[1600px] mx-auto px-6">
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-24">
              <div className="lg:sticky lg:top-40 h-fit">
                 <p className="text-[10px] font-black uppercase tracking-[0.5em] text-supplyx-blue mb-8">Implementation Flow</p>
                 <h2 className="text-6xl font-black uppercase tracking-tighter text-white mb-12 leading-none italic">{t.howItWorks.title}</h2>
                 <p className="text-xl text-zinc-500 font-medium leading-relaxed italic max-w-sm mb-12">Deployment across your supply chain nodes in 4 phases.</p>
                 <button onClick={onGetStarted} className="px-10 py-5 rounded-xl bg-supplyx-blue text-white text-[10px] font-black uppercase tracking-[0.4em] hover:bg-blue-600 transition-all">Start Onboarding</button>
              </div>

              <div className="lg:col-span-2 space-y-12">
                 {t.howItWorks.steps.map((step, i) => (
                   <div key={i} className="group relative p-16 rounded-[48px] bg-zinc-900/30 border border-white/5 hover:border-supplyx-blue/30 transition-all">
                      <div className="flex gap-12 items-start">
                         <div className="text-7xl font-mono font-black text-zinc-800 group-hover:text-supplyx-blue transition-colors">0{i + 1}</div>
                         <div>
                            <h3 className="text-3xl font-black uppercase mb-8 text-white tracking-tight">{step.title}</h3>
                            <p className="text-xl text-zinc-500 font-medium leading-relaxed group-hover:text-zinc-300 transition-colors max-w-xl">{step.desc}</p>
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </section>

      {/* FAQ Center */}
      <section className="py-48 industrial-grid">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-32">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-supplyx-blue mb-8">Intelligence Center</p>
            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-8 text-white italic">{t.faq.title}</h2>
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
      <section className="py-48 relative overflow-hidden bg-supplyx-deep">
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="relative rounded-[40px] p-24 md:p-48 text-center overflow-hidden bg-zinc-900 border border-white/5 group industrial-grid">
             <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.8em] text-supplyx-blue mb-12">Institutional Onboarding</p>
                <h2 className="text-6xl md:text-9xl font-black tracking-tighter mb-20 uppercase leading-[0.85] text-white">
                   Standardize <br /> <span className="text-supplyx-blue italic">Global Trade.</span>
                </h2>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                   <button 
                     onClick={onGetStarted}
                     className="group w-full sm:w-auto px-16 py-8 rounded-xl bg-supplyx-blue text-white font-black uppercase text-sm tracking-[0.2em] hover:bg-blue-600 transition-all"
                   >
                     {language === 'PT' ? 'Solicitar Acesso' : 'Request Access'}
                   </button>
                   <button 
                     className="w-full sm:w-auto px-14 py-8 rounded-xl border border-white/10 text-white font-black uppercase text-sm tracking-[0.2em] hover:bg-white/5 transition-all"
                   >
                     Documentation
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
            
            <div className="md:col-span-8 grid grid-cols-2 lg:grid-cols-4 gap-12">
               <div className="space-y-8">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-supplyx-blue">Infrastructure</h4>
                  <ul className="space-y-4 text-xs font-black uppercase tracking-widest text-zinc-600">
                    <li><a href="#" className="hover:text-white transition-colors">On-chain Ledger</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Predictive Engine</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Node Network</a></li>
                  </ul>
               </div>
               <div className="space-y-8">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-supplyx-blue">Ecosystem</h4>
                  <ul className="space-y-4 text-xs font-black uppercase tracking-widest text-zinc-600">
                    <li><a href="#" className="hover:text-white transition-colors">Manufacturers</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Logistics Hub</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Mobile Fleet</a></li>
                  </ul>
               </div>
               <div className="space-y-8">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-supplyx-blue">Resources</h4>
                  <ul className="space-y-4 text-xs font-black uppercase tracking-widest text-zinc-600">
                    <li><a href="#" className="hover:text-white transition-colors">API Docs</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Whitepaper</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Case Studies</a></li>
                  </ul>
               </div>
               <div className="space-y-8">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-supplyx-blue">Legal</h4>
                  <ul className="space-y-4 text-xs font-black uppercase tracking-widest text-zinc-600">
                    <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Security Audit</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Compliance</a></li>
                  </ul>
               </div>
            </div>
          </div>
          
          <div className="flex flex-col lg:flex-row items-center justify-between gap-10 pt-16 border-t border-white/5">
             <div className="flex items-center gap-12">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-800">© 2026 SUPPLYX CORE INFRASTRUCTURE</p>
                <div className="hidden sm:flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.5em] text-supplyx-blue">
                   <div className="w-1.5 h-1.5 rounded-full bg-supplyx-blue" />
                   NODES: 12,450 ONLINE
                </div>
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-800">MANHATE LINK ÁFRICA • GLOBAL OPERATIONS</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
