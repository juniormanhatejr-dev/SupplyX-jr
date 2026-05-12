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
      <section className="relative pt-60 pb-40 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1400px] h-[800px] bg-supplyx-blue/5 blur-[160px] rounded-full -z-10 animate-pulse-slow" />
        <div className="absolute top-1/2 right-[-10%] w-[600px] h-[600px] bg-supplyx-blue/5 blur-[120px] rounded-full -z-10" />

        <div className="max-w-[1600px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="text-left"
            >
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-10">
                <span className="w-2 h-2 rounded-full bg-supplyx-blue animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-supplyx-blue">Mainstage AFRICA 2026</span>
              </div>
              
              <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter mb-10 leading-[0.95]">
                <span className="block text-white mb-2">{t.hero.title.split('Logistics')[0]}</span>
                <span className="text-supplyx-blue text-glow italic">Logistics</span>
                <span className="block text-white mt-2">Structure</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-zinc-500 max-w-xl mb-14 font-medium leading-relaxed">
                {t.hero.subtitle}
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <button 
                  onClick={onGetStarted}
                  className="group relative w-full sm:w-auto px-12 py-7 rounded-[24px] bg-supplyx-blue text-white font-black italic text-xl shadow-3xl shadow-blue-500/20 active:scale-95 transition-all text-center"
                >
                  <span className="relative z-10 flex items-center justify-center gap-4">
                    {t.hero.cta1}
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                  </span>
                </button>
                <button 
                  className="w-full sm:w-auto px-12 py-7 rounded-[24px] border-2 border-white/5 hover:bg-white/5 font-black italic text-xl transition-all flex items-center justify-center gap-4 text-white"
                >
                  <Play className="w-5 h-5 fill-white" />
                  {t.hero.cta2}
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 100 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative"
            >
              {/* Image Placeholder with high-end feel */}
              <div className="relative z-10 glass-dark rounded-[64px] p-6 border border-white/5 shadow-3xl overflow-hidden aspect-square flex items-center justify-center group">
                 <div className="absolute inset-0 bg-gradient-to-br from-supplyx-blue/10 to-transparent pointer-events-none" />
                 <div className="relative z-20 text-center space-y-10 group-hover:scale-105 transition-transform duration-1000">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="w-32 h-32 rounded-3xl bg-supplyx-blue/20 flex items-center justify-center shadow-2xl">
                          <Truck className="w-12 h-12 text-supplyx-blue" />
                        </div>
                        <div className="w-32 h-32 rounded-3xl bg-supplyx-deep border border-white/10 flex items-center justify-center mt-12 shadow-2xl">
                          <ShieldCheck className="w-12 h-12 text-green-500" />
                        </div>
                    </div>
                    <div className="p-8 rounded-[32px] bg-supplyx-deep border border-white/10 shadow-2xl">
                        <div className="flex gap-2 mb-4">
                          {[1,2,3,4,5].map(i => <div key={i} className="w-1 h-1 rounded-full bg-supplyx-blue" />)}
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Blockchain Integrity Ledger</p>
                        <p className="text-2xl font-black italic text-white mt-2">#8A2F9...41C</p>
                    </div>
                 </div>
              </div>
              {/* Orbits */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border border-white/5 rounded-full -z-10 animate-spin-slow opacity-30" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] border border-white/5 rounded-full -z-10 animate-spin-slow-reverse opacity-10" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Problem Section (The Trust Gap) */}
      <section id="problem" className="py-40 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="max-w-3xl mb-32">
            <h2 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter mb-8 leading-none">
              {t.problem.title}
            </h2>
            <p className="text-2xl text-zinc-500 font-medium leading-relaxed italic">
              {t.problem.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {t.problem.items.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2 }}
                className="p-12 rounded-[48px] bg-supplyx-dark/50 border border-white/5 group hover:border-supplyx-blue/30 transition-all shadow-3xl"
              >
                <div className="text-4xl font-black italic text-zinc-700 mb-10 group-hover:text-supplyx-blue transition-colors">0{i + 1}</div>
                <h3 className="text-2xl font-black italic uppercase mb-6 text-white">{item.title}</h3>
                <p className="text-lg text-zinc-500 leading-relaxed font-medium">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* The SupplyX Engine (The Solution) */}
      <section id="solution" className="py-40">
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="text-center mb-40">
            <h2 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter mb-8">{t.solution.title}</h2>
            <p className="text-xl text-zinc-500 font-black uppercase tracking-[0.4em]">{t.solution.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {t.solution.engines.map((engine, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -20 }}
                className="group relative p-14 rounded-[64px] glass-dark border border-white/5 hover:border-supplyx-blue transition-all duration-500"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-supplyx-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[64px]" />
                <div className="relative z-10">
                  <div className="w-24 h-24 rounded-[32px] bg-supplyx-deep flex items-center justify-center text-supplyx-blue mb-12 border border-white/10 group-hover:bg-supplyx-blue group-hover:text-white transition-all shadow-3xl group-hover:scale-110">
                    <engine.icon className="w-12 h-12" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-supplyx-blue mb-4">{engine.subtitle}</p>
                  <h3 className="text-3xl font-black italic uppercase mb-8 text-white tracking-tight">{engine.title}</h3>
                  <p className="text-lg text-zinc-500 font-medium leading-relaxed group-hover:text-zinc-300 transition-colors">{engine.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats - Full Width High Impact */}
      <section className="py-32 bg-supplyx-blue relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
           <div className="absolute top-0 left-0 w-full h-full animate-marquee whitespace-nowrap text-[150px] font-black italic tracking-tighter text-white uppercase select-none">
             TRIPLE ENGINE LOGISTICS • ON-CHAIN TRUST • AI DEMAND FORECASTING • 
           </div>
        </div>
        <div className="max-w-[1600px] mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-20">
             {t.stats.map((stat, i) => (
                <div key={i} className="text-center group">
                   <p className="text-6xl md:text-8xl font-black italic text-white tracking-tighter mb-4 group-hover:scale-110 transition-transform duration-500">{stat.value}</p>
                   <p className="text-[12px] font-black uppercase tracking-[0.4em] text-supplyx-deep/60">{stat.label}</p>
                </div>
             ))}
          </div>
        </div>
      </section>

      {/* Complete Ecosystem (Features) */}
      <section className="py-40">
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-end justify-between mb-32 gap-12">
            <div className="max-w-2xl">
              <h2 className="text-5xl md:text-6xl font-black italic uppercase tracking-tighter mb-8 text-white">{t.features.title}</h2>
              <div className="w-32 h-2 bg-supplyx-blue rounded-full" />
            </div>
            <p className="text-xl text-zinc-500 font-medium italic lg:text-right max-w-sm">Every tool you need to scale production and distribution across borders.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {t.features.items.map((feature, i) => (
              <div key={i} className="p-12 rounded-[48px] border border-white/5 hover:bg-white/5 transition-all group cursor-default">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-zinc-500 group-hover:bg-supplyx-blue/10 group-hover:text-supplyx-blue transition-all mb-10">
                  <feature.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black italic uppercase mb-4 text-white">{feature.title}</h3>
                <p className="text-zinc-500 font-medium leading-relaxed group-hover:text-zinc-400 transition-colors">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works - Modern Horizontal Loop */}
      <section id="how" className="py-40 bg-supplyx-dark/50 border-y border-white/5 overflow-hidden">
        <div className="max-w-[1600px] mx-auto px-6 mb-32">
          <h2 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-center mb-8">{t.howItWorks.title}</h2>
          <div className="w-40 h-2 bg-supplyx-blue mx-auto rounded-full" />
        </div>

        <div className="max-w-[1600px] mx-auto px-6">
           <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
             {t.howItWorks.steps.map((step, i) => (
               <div key={i} className="relative p-10 pt-20 rounded-[48px] bg-supplyx-deep border border-white/5 group hover:border-supplyx-blue/50 transition-all">
                  <div className="absolute top-10 left-10 text-8xl font-black italic text-white/5 group-hover:text-supplyx-blue/10 transition-colors">
                    {i + 1}
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-2xl font-black uppercase italic tracking-tight text-white mb-6 leading-tight">{step.title}</h3>
                    <p className="text-lg text-zinc-500 font-medium leading-relaxed group-hover:text-zinc-400 transition-colors">{step.desc}</p>
                  </div>
               </div>
             ))}
           </div>
        </div>
      </section>

      {/* FAQ Center */}
      <section className="py-40">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-32">
            <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter mb-8">{t.faq.title}</h2>
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Need more info?</span>
              <a href="mailto:support@supplyx.africa" className="text-[10px] font-black uppercase tracking-[0.3em] text-supplyx-blue hover:underline">Contact Intelligence Team</a>
            </div>
          </div>

          <div className="space-y-4">
            {t.faq.questions.map((item, i) => (
              <details key={i} className="group glass-dark rounded-[32px] border border-white/5 overflow-hidden open:ring-2 open:ring-supplyx-blue/30 transition-all">
                <summary className="flex items-center justify-between p-10 cursor-pointer list-none">
                  <span className="text-xl font-black italic uppercase tracking-tight text-white">{item.q}</span>
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-supplyx-blue group-open:rotate-180 transition-transform">
                     <ChevronDown className="w-6 h-6" />
                  </div>
                </summary>
                <div className="px-10 pb-10 text-lg text-zinc-500 font-medium leading-relaxed border-t border-white/5 pt-10">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - The Closing */}
      <section className="py-40 relative">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="relative rounded-[80px] p-20 md:p-40 text-center overflow-hidden bg-supplyx-blue border border-white/20 shadow-3xl group">
             <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/20 blur-[160px] rounded-full -translate-y-1/2 translate-x-1/2 animate-pulse-slow" />
             <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-supplyx-deep/20 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />
             
             <div className="relative z-10">
               <h2 className="text-5xl md:text-8xl font-black italic tracking-tighter mb-16 uppercase leading-none text-white">
                 Start Building <br /> <span className="text-supplyx-deep italic">On Trust.</span>
               </h2>
               <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                  <button 
                    onClick={onGetStarted}
                    className="group w-full sm:w-auto px-16 py-8 rounded-[32px] bg-white text-supplyx-blue font-black italic text-2xl shadow-3xl hover:scale-110 active:scale-95 transition-all"
                  >
                    {language === 'PT' ? 'Unir-se à Rede' : 'Join the Network'}
                  </button>
                  <button 
                    className="w-full sm:w-auto px-12 py-8 rounded-[32px] border-2 border-white/30 text-white font-black italic text-2xl hover:bg-white/10 transition-all"
                  >
                    Contact Sales
                  </button>
               </div>
             </div>
          </div>
        </div>
      </section>

      {/* Ultra Modern Footer */}
      <footer className="pt-40 pb-20 border-t border-white/5">
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-20 mb-40">
            <div className="md:col-span-4 space-y-12">
              <SupplyXLogo size="lg" isDark={true} />
              <p className="text-2xl text-zinc-500 font-medium italic leading-relaxed max-w-sm">
                {t.footer.desc}
              </p>
              <div className="flex gap-4">
                {[Twitter, Linkedin, Instagram, Mail].map((Icon, i) => (
                  <a key={i} href="#" className="w-16 h-16 rounded-[24px] bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-supplyx-blue transition-all border border-white/5 shadow-xl">
                    <Icon className="w-6 h-6" />
                  </a>
                ))}
              </div>
            </div>
            
            <div className="md:col-span-8 grid grid-cols-2 lg:grid-cols-4 gap-12">
               <div className="space-y-8">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-supplyx-blue">Infrastructure</h4>
                  <ul className="space-y-6 text-base font-black uppercase tracking-widest text-zinc-600">
                    <li><a href="#" className="hover:text-white transition-colors">On-chain Ledger</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Predictive Engine</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Node Network</a></li>
                  </ul>
               </div>
               <div className="space-y-8">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-supplyx-blue">Ecosystem</h4>
                  <ul className="space-y-6 text-base font-black uppercase tracking-widest text-zinc-600">
                    <li><a href="#" className="hover:text-white transition-colors">Manufacturers</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Logistics Hub</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Mobile Fleet</a></li>
                  </ul>
               </div>
               <div className="space-y-8">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-supplyx-blue">Resources</h4>
                  <ul className="space-y-6 text-base font-black uppercase tracking-widest text-zinc-600">
                    <li><a href="#" className="hover:text-white transition-colors">API Docs</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Whitepaper</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Case Studies</a></li>
                  </ul>
               </div>
               <div className="space-y-8">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-supplyx-blue">Legal</h4>
                  <ul className="space-y-6 text-base font-black uppercase tracking-widest text-zinc-600">
                    <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Protocol Audit</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Compliance</a></li>
                  </ul>
               </div>
            </div>
          </div>
          
          <div className="flex flex-col lg:flex-row items-center justify-between gap-10 pt-16 border-t border-white/5">
             <div className="flex items-center gap-12">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-700">© 2026 SUPPLYX CORE PLATFORM</p>
                <div className="hidden sm:flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-supplyx-blue">
                   <div className="w-2 h-2 rounded-full bg-supplyx-blue" />
                   SYSTEM STATUS: OPERATIONAL
                </div>
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-700">{t.footer.rights} POWERED BY MANHATE LINK ÁFRICA</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
