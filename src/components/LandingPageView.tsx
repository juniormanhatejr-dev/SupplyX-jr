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
        title: "Plataforma de Supply Chain Impulsionada por IA para África",
        subtitle: "Rastreie stock, gira logística, conecte fabricantes e preveja a procura em tempo real.",
        cta1: "Começar Agora",
        cta2: "Demonstração Live"
      },
      features: {
        title: "Recursos Inteligentes",
        items: [
          { icon: Truck, title: "Rastreamento Real-Time", desc: "Localização precisa de toda a sua frota e mercadorias." },
          { icon: TrendingUp, title: "Previsão com IA", desc: "Antecipe a procura do mercado com algoritmos avançados." },
          { icon: Box, title: "Stock Inteligente", desc: "Gestão automatizada de inventário para evitar rupturas." },
          { icon: Users, title: "Hub de Fabricantes", desc: "Conexão direta com os maiores produtores do continente." },
          { icon: ShieldCheck, title: "Verificação Blockchain", desc: "Transparência e segurança total em cada transação." },
          { icon: BarChart3, title: "Analytics Logístico", desc: "Dados valiosos para otimizar a sua cadeia de distribuição." }
        ]
      },
      howItWorks: {
        title: "Como Funciona",
        steps: [
          { title: "Fabricantes carregam produtos", desc: "Catálogo digital completo e verificado." },
          { title: "Retalhistas fazem pedidos", desc: "Sistema de compra simplificado e eficiente." },
          { title: "IA prevê a procura", desc: "Otimização de stock baseada em dados reais." },
          { title: "Logística rastreada live", desc: "Entrega segura e monitorizada 24/7." }
        ]
      },
      stats: [
        { label: "Entregas", value: "25K+" },
        { label: "Precisão de Rastreio", value: "98%" },
        { label: "Fornecedores", value: "120+" }
      ],
      faq: {
        title: "Perguntas Frequentes",
        questions: [
          { q: "Como a SupplyX funciona?", a: "A SupplyX conecta toda a cadeia de suprimentos em uma única plataforma, usando IA para otimizar processos desde o fabricante até o retalhista." },
          { q: "É necessário blockchain?", a: "Usamos blockchain de fundo para garantir a imutabilidade dos registos e segurança das transações, sem complicações para o utilizador." },
          { q: "Os fabricantes podem rastrear entregas?", a: "Sim, todos os intervenientes têm visibilidade total do percurso da mercadoria em tempo real." },
          { q: "A IA ajuda na previsão de stock?", a: "Absolutamente. O nosso motor de IA analisa tendências históricas e de mercado para sugerir níveis ideais de stock." }
        ]
      },
      footer: {
        desc: "O Futuro das Cadeias de Suprimentos Africanas",
        rights: "Todos os direitos reservados."
      }
    },
    EN: {
      hero: {
        title: "AI-Powered Supply Chain Platform for Africa",
        subtitle: "Track inventory, manage logistics, connect manufacturers and predict demand in real time.",
        cta1: "Get Started",
        cta2: "Live Demo"
      },
      features: {
        title: "Smart Features",
        items: [
          { icon: Truck, title: "Real-Time Tracking", desc: "Precise location of your entire fleet and goods." },
          { icon: TrendingUp, title: "AI Demand Forecasting", desc: "Anticipate market demand with advanced algorithms." },
          { icon: Box, title: "Smart Inventory", desc: "Automated inventory management to avoid stockouts." },
          { icon: Users, title: "Manufacturer Hub", desc: "Direct connection with the continent's largest producers." },
          { icon: ShieldCheck, title: "Blockchain Verification", desc: "Total transparency and security in every transaction." },
          { icon: BarChart3, title: "Logistics Analytics", desc: "Valuable data to optimize your distribution chain." }
        ]
      },
      howItWorks: {
        title: "How It Works",
        steps: [
          { title: "Manufacturers upload products", desc: "Complete and verified digital catalog." },
          { title: "Retailers place orders", desc: "Simplified and efficient purchasing system." },
          { title: "AI predicts demand", desc: "Data-driven stock optimization." },
          { title: "Logistics are tracked live", desc: "Safe and monitored 24/7 delivery." }
        ]
      },
      stats: [
        { label: "Deliveries", value: "25K+" },
        { label: "Tracking Accuracy", value: "98%" },
        { label: "Suppliers", value: "120+" }
      ],
      faq: {
        title: "Frequently Asked Questions",
        questions: [
          { q: "How does SupplyX work?", a: "SupplyX connects the entire supply chain in a single platform, using AI to optimize processes from manufacturer to retailer." },
          { q: "Is blockchain required?", a: "We use blockchain in the background to ensure record immutability and transaction security, without complications for the user." },
          { q: "Can manufacturers track deliveries?", a: "Yes, all stakeholders have full visibility of the goods' journey in real time." },
          { q: "Does AI predict inventory demand?", a: "Absolutely. Our AI engine analyzes historical and market trends to suggest ideal stock levels." }
        ]
      },
      footer: {
        desc: "The Future of African Supply Chains",
        rights: "All rights reserved."
      }
    }
  }[language];

  return (
    <div className="min-h-screen bg-supplyx-deep text-supplyx-white selection:bg-supplyx-blue selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-dark border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <SupplyXLogo size="md" isDark={true} />
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-supplyx-gray hover:text-white transition-colors">{t.features.title}</a>
            <a href="#how" className="text-sm font-medium text-supplyx-gray hover:text-white transition-colors">{t.howItWorks.title}</a>
            <a href="#stats" className="text-sm font-medium text-supplyx-gray hover:text-white transition-colors">Stats</a>
            <button onClick={onLogin} className="text-sm font-bold text-white px-6 py-2.5 rounded-full border border-white/10 hover:bg-white/5 transition-all">Login</button>
            <button onClick={onGetStarted} className="text-sm font-bold bg-supplyx-blue text-white px-6 py-2.5 rounded-full hover:bg-blue-600 shadow-lg shadow-blue-500/20 transition-all">{t.hero.cta1}</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-supplyx-blue/10 blur-[120px] rounded-full -z-10 animate-pulse-slow" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-supplyx-dark/50 blur-[100px] rounded-full -z-10" />

        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-supplyx-blue/10 border border-supplyx-blue/20 mb-8">
              <span className="w-2 h-2 rounded-full bg-supplyx-blue animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-supplyx-blue">SupplyX AI v3.0 Live</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter mb-8 leading-[1.1]">
              <span className="text-white">{t.hero.title.split('for Africa')[0]}</span>
              <span className="text-supplyx-blue">Africa</span>
            </h1>
            <p className="text-lg md:text-xl text-supplyx-gray max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
              {t.hero.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button 
                onClick={onGetStarted}
                className="group relative w-full sm:w-auto overflow-hidden px-10 py-5 rounded-2xl bg-supplyx-blue text-white font-black italic text-lg shadow-2xl shadow-blue-500/20 active:scale-95 transition-all"
              >
                <div className="relative z-10 flex items-center gap-3">
                  {t.hero.cta1}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
              <button 
                className="w-full sm:w-auto px-10 py-5 rounded-2xl border border-white/10 hover:bg-white/5 font-black italic text-lg transition-all flex items-center justify-center gap-3"
              >
                <Play className="w-5 h-5 fill-white" />
                {t.hero.cta2}
              </button>
            </div>
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="mt-24 relative"
          >
            <div className="relative z-10 glass-dark rounded-[40px] p-4 border border-white/10 shadow-2xl overflow-hidden scale-100 md:scale-105">
              <div className="bg-supplyx-deep rounded-[32px] overflow-hidden border border-white/5 aspect-[16/9] md:aspect-video relative">
                {/* Fake Dashboard Content */}
                <div className="absolute inset-0 p-8 flex flex-col gap-8">
                  <div className="flex justify-between items-center">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-xl bg-supplyx-blue/20" />
                      <div className="space-y-2">
                        <div className="w-32 h-4 bg-white/10 rounded-full" />
                        <div className="w-20 h-2 bg-white/5 rounded-full" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-lg bg-white/5" />
                      <div className="w-8 h-8 rounded-lg bg-white/5" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-32 rounded-[24px] bg-white/[0.02] border border-white/5 p-6 space-y-4">
                        <div className="w-10 h-10 rounded-lg bg-supplyx-blue/10" />
                        <div className="w-2/3 h-4 bg-white/10 rounded-full" />
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 rounded-[24px] bg-white/[0.02] border border-white/5 p-8 flex items-end gap-2">
                    {[40, 70, 45, 90, 65, 80, 55, 95, 60].map((h, i) => (
                      <div key={i} className="flex-1 bg-supplyx-blue/20 rounded-t-xl hover:bg-supplyx-blue transition-colors group relative" style={{ height: `${h}%` }}>
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-supplyx-blue px-2 py-1 rounded text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                          ${h}k
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.05] to-transparent pointer-events-none" />
              </div>
            </div>
            {/* Background Glow */}
            <div className="absolute -inset-10 bg-supplyx-blue/10 blur-[100px] -z-10 rounded-full" />
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-24 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            {t.stats.map((stat, i) => (
              <div key={i} className="space-y-4">
                <p className="text-5xl md:text-6xl font-black italic text-white tracking-widest leading-none bg-gradient-to-r from-white to-supplyx-blue bg-clip-text text-transparent">
                  {stat.value}
                </p>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-supplyx-gray">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter mb-6">{t.features.title}</h2>
            <div className="w-24 h-1.5 bg-supplyx-blue mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {t.features.items.map((feature, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -10 }}
                className="group p-10 rounded-[40px] glass-dark border border-white/5 hover:border-supplyx-blue/30 transition-all cursor-default relative overflow-hidden"
              >
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-supplyx-blue/5 rounded-full blur-3xl group-hover:bg-supplyx-blue/10 transition-colors" />
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-supplyx-dark flex items-center justify-center text-supplyx-blue mb-8 border border-white/5 group-hover:bg-supplyx-blue group-hover:text-white transition-all shadow-xl">
                    <feature.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black italic uppercase mb-4 text-white tracking-tight">{feature.title}</h3>
                  <p className="text-supplyx-gray font-medium leading-relaxed">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works - Modern Timeline */}
      <section id="how" className="py-32 bg-supplyx-dark/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter mb-6">{t.howItWorks.title}</h2>
            <div className="w-24 h-1.5 bg-supplyx-blue mx-auto rounded-full" />
          </div>

          <div className="relative">
            {/* Timeline Line */}
            <div className="hidden md:block absolute top-[5.5rem] left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-supplyx-blue/20 to-transparent" />
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
              {t.howItWorks.steps.map((step, i) => (
                <div key={i} className="relative z-10 text-center space-y-6">
                  <div className="w-16 h-16 mx-auto rounded-full bg-supplyx-deep border-4 border-supplyx-blue flex items-center justify-center text-white font-black italic text-xl shadow-2xl shadow-blue-500/20">
                    {i + 1}
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-black uppercase tracking-tight text-white leading-tight">{step.title}</h3>
                    <p className="text-sm text-supplyx-gray font-medium">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-32">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter mb-6">{t.faq.title}</h2>
          </div>

          <div className="space-y-6">
            {t.faq.questions.map((item, i) => (
              <details key={i} className="group glass-dark rounded-[24px] border border-white/5 overflow-hidden open:ring-1 open:ring-supplyx-blue/50 transition-all">
                <summary className="flex items-center justify-between p-8 cursor-pointer list-none">
                  <span className="text-lg font-black italic uppercase tracking-tight text-white">{item.q}</span>
                  <ChevronDown className="w-5 h-5 text-supplyx-blue group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-8 pb-8 text-supplyx-gray font-medium leading-relaxed border-t border-white/5 pt-6">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <div className="glass rounded-[60px] p-12 md:p-24 text-center border-white/10 shadow-3xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-supplyx-blue/20 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter mb-12 uppercase leading-none">
                Ready to <span className="text-supplyx-blue text-glow">Future-Proof</span> Your Supply Chain?
              </h2>
              <button 
                onClick={onGetStarted}
                className="group px-12 py-6 rounded-2xl bg-white text-supplyx-deep font-black italic text-xl shadow-2xl active:scale-95 transition-all flex items-center gap-4 mx-auto"
              >
                {language === 'PT' ? 'Começar Gratuitamente' : 'Start Free Trial'}
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-24">
            <div className="col-span-1 md:col-span-2 space-y-8">
              <SupplyXLogo size="lg" isDark={true} />
              <p className="text-xl text-supplyx-gray max-w-sm font-medium italic">
                {t.footer.desc}
              </p>
              <div className="flex gap-6">
                {[Twitter, Linkedin, Instagram, Mail].map((Icon, i) => (
                  <a key={i} href="#" className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-supplyx-gray hover:text-white hover:bg-supplyx-blue transition-all border border-white/5">
                    <Icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-white mb-8">Platform</h4>
              <ul className="space-y-4 text-sm font-medium text-supplyx-gray">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Logistics</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Forecasting</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-white mb-8">Company</h4>
              <ul className="space-y-4 text-sm font-medium text-supplyx-gray">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:row items-center justify-between gap-8 pt-12 border-t border-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-600">
            <p>© 2024 SupplyX. {t.footer.rights}</p>
            <div className="flex gap-8">
              <a href="#" className="hover:text-supplyx-gray transition-colors">Status</a>
              <a href="#" className="hover:text-supplyx-gray transition-colors">System API</a>
              <a href="#" className="hover:text-supplyx-gray transition-colors">Changelog</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
