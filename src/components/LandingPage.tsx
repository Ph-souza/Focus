import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Sparkles,
  ArrowRight,
  Shield,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Target,
  Clock,
  MessageSquare,
  TrendingUp,
  Brain,
  Smartphone,
  ChevronDown,
  Star,
  Users,
  Lock,
  Calendar,
  Check,
  CreditCard,
  Sun,
  Moon
} from 'lucide-react';
import { NexusFocusLogo } from './AuraLogo';

export function LandingPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nexus_dark_mode');
      if (saved !== null) return saved === 'true';
    }
    return true;
  });

  const toggleDarkMode = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexus_dark_mode', next ? 'true' : 'false');
      if (next) {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
      }
    }
  };

  // Regra de CTA mandatória: redirecionar para login com intent=checkout
  const handleCtaCheckout = () => {
    navigate('/login?intent=checkout');
  };

  const handleCtaLogin = () => {
    navigate('/login');
  };

  const benefits = [
    {
      icon: <Brain className="w-6 h-6 text-blue-500" />,
      title: 'Mentor IA em Tempo Real',
      desc: 'Um mentor direto, assertivo e maduro que audita suas metas, hábitos e finanças com inteligência de ponta.'
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-emerald-500" />,
      title: 'Finanças & Caixinhas Integradas',
      desc: 'Orçamento mensal, categorização automática e aportes reais em metas que descontam do seu saldo disponível.'
    },
    {
      icon: <Clock className="w-6 h-6 text-amber-500" />,
      title: 'Modo Foco & Timeboxing',
      desc: 'Sessões imersivas sem distrações com cronômetro inteligente e feedback motivacional logo após o término.'
    },
    {
      icon: <MessageSquare className="w-6 h-6 text-teal-500" />,
      title: 'Integração Nativa WhatsApp',
      desc: 'Capture despesas, tarefas e compromissos enviando áudios ou mensagens de texto pelo mensageiro.'
    },
    {
      icon: <Calendar className="w-6 h-6 text-indigo-500" />,
      title: 'Agenda & Rotinas Inteligentes',
      desc: 'Navegação de semanas e meses sincronizada bidirecionalmente para você nunca mais perder um compromisso.'
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-purple-500" />,
      title: 'Segurança & Nuvem Executiva',
      desc: 'Criptografia completa e sincronização instantânea em tempo real entre todos os seus dispositivos.'
    }
  ];

  const faqs = [
    {
      q: 'Por que preciso criar uma conta antes de assinar?',
      a: 'Nossa arquitetura de Autenticação Contextual vincula sua assinatura diretamente ao seu usuário oficial do Google (Firebase UID). Isso evita assinaturas órfãs e garante liberação instantânea de todos os recursos após o pagamento seguro.'
    },
    {
      q: 'Como funciona o valor de R$ 19,90/mês?',
      a: 'É uma assinatura mensal contínua, sem taxa de adesão ou fidelidade. Você desfruta de acesso ilimitado ao Mentor IA, gestão financeira, modo foco e integração WhatsApp com preço protegido para membros fundadores.'
    },
    {
      q: 'Posso cancelar a qualquer momento?',
      a: 'Sim, com total liberdade e sem complicações. O cancelamento pode ser feito com apenas um clique e seu acesso permanece ativo até o fim do período mensal já contratado.'
    },
    {
      q: 'O Nexus Focus funciona no celular?',
      a: 'Sim! A plataforma é uma Progressive Web App (PWA) de alto padrão. Você pode instalá-la no seu iPhone, Android ou computador como um app nativo rápido e responsivo.'
    }
  ];

  return (
    <div
      className={`min-h-screen font-sans antialiased text-slate-900 dark:text-slate-100 transition-colors duration-300 relative overflow-x-hidden selection:bg-blue-500/30 selection:text-blue-500 ${
        isDarkMode ? 'dark bg-[#030712]' : 'bg-[#f4f4f1]'
      }`}
      style={{
        backgroundImage: isDarkMode
          ? "radial-gradient(ellipse 80% 80% at 50% -20%, rgba(59,130,246,0.15), rgba(255,255,255,0)), url('/assets/bg-dark.jpg')"
          : "radial-gradient(ellipse 80% 80% at 50% -20%, rgba(59,130,246,0.08), rgba(0,0,0,0)), url('/assets/bg-light.jpg')",
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Glow Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-blue-500/10 dark:bg-blue-500/20 blur-[130px] rounded-full pointer-events-none" />

      {/* ================= HEADER / NAVBAR ================= */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/70 dark:bg-slate-950/70 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          
          {/* Logo & Brand */}
          <Link to="/page" className="flex items-center gap-3 group cursor-pointer">
            <div className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <NexusFocusLogo className="w-7 h-7" variant={isDarkMode ? 'light' : 'dark'} />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-[0.22em] uppercase text-slate-900 dark:text-white">
                NEXUS FOCUS
              </span>
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 tracking-wider">
                Menos ruído. Mais direção.
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a href="#beneficios" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Benefícios
            </a>
            <a href="#como-funciona" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Como Funciona
            </a>
            <a href="#planos" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Planos
            </a>
            <a href="#faq" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Dúvidas
            </a>
          </nav>

          {/* Actions & Theme Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleDarkMode}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              title="Alternar Tema"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button
              onClick={handleCtaLogin}
              className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Entrar
            </button>

            <button
              onClick={handleCtaCheckout}
              className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-xl shadow-[0_4px_14px_rgba(37,99,235,0.3)] transition-all duration-200 active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <span>Começar Agora</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* ================= HERO SECTION ================= */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center relative z-10">
          
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs sm:text-sm font-semibold mb-6 backdrop-blur-md"
          >
            <Sparkles size={15} className="animate-pulse" />
            <span>Nexus Focus — Menos ruído. Mais direção.</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl leading-[1.15] mb-6"
          >
            Organize tarefas, dinheiro, produtividade e foco{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              em um só lugar.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed mb-10"
          >
            Elimine a dispersão diária com o apoio de um Mentor com inteligência artificial,
            gestão financeira inteligente e blocos de tempo por apenas{' '}
            <strong className="text-slate-900 dark:text-white font-bold">R$ 19,90/mês</strong>.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-14"
          >
            <button
              onClick={handleCtaCheckout}
              className="w-full sm:w-auto px-8 py-4 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-2xl shadow-[0_10px_30px_rgba(37,99,235,0.4)] transition-all duration-200 active:scale-98 flex items-center justify-center gap-3 cursor-pointer"
            >
              <span>Começar Agora — R$ 19,90/mês</span>
              <ArrowRight size={18} />
            </button>

            <button
              onClick={handleCtaLogin}
              className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-slate-700 dark:text-slate-200 bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-white dark:hover:bg-slate-800 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <span>Acessar Minha Conta</span>
            </button>
          </motion.div>

          {/* Social Proof Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-10 border-t border-slate-200/80 dark:border-slate-800/80 pt-10 w-full max-w-3xl">
            <div className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">+10.000</span>
              <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Usuários Ativos</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">4.9 / 5.0</span>
              <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Avaliação Média</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">100%</span>
              <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Criptografado</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">R$ 19,90</span>
              <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Preço Fixo Mensal</span>
            </div>
          </div>
        </div>

        {/* ================= INTERACTIVE MOCKUP SHOWCASE ================= */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-14 sm:mt-20">
          <div className="glass-card p-4 sm:p-6 rounded-[32px] border border-white/60 dark:border-slate-800/80 shadow-[0_24px_70px_rgba(0,0,0,0.12)]">
            
            {/* Mockup Header Bar */}
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200/80 dark:border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 ml-2">
                  Painel Nexus Focus • Ao Vivo
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Mentor IA Conectado</span>
              </div>
            </div>

            {/* Inner Dashboard Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* Card 1: Resumo de Hoje */}
              <div className="glass-card p-5 rounded-2xl flex flex-col justify-between min-h-[190px]">
                <div>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-3">
                    Resumo de Hoje
                  </span>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full border-4 border-blue-500 flex items-center justify-center font-bold text-base text-slate-800 dark:text-slate-100 shadow-inner shrink-0">
                      67%
                    </div>
                    <div className="flex flex-col gap-1 text-xs text-slate-600 dark:text-slate-300">
                      <span className="flex items-center gap-1.5 font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" /> 4 concluídas
                      </span>
                      <span className="flex items-center gap-1.5 font-medium">
                        <span className="w-2 h-2 rounded-full bg-amber-500" /> 2 pendentes
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-[11px] text-blue-500 font-semibold mt-3">
                  Sessão da tarde em andamento →
                </div>
              </div>

              {/* Card 2: Finanças & Saldo */}
              <div className="glass-card p-5 rounded-2xl flex flex-col justify-between min-h-[190px]">
                <div>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
                    Saldo Financeiro
                  </span>
                  <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
                    R$ 4.850,00
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Receitas:</span>
                      <strong className="text-emerald-500">+ R$ 6.200,00</strong>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Despesas:</span>
                      <strong className="text-rose-500">- R$ 1.350,00</strong>
                    </div>
                  </div>
                </div>
                <div className="text-[11px] text-emerald-500 font-semibold mt-3">
                  Meta Viagem: 72% concluída
                </div>
              </div>

              {/* Card 3: Mentor Focus */}
              <div className="glass-card p-5 rounded-2xl flex flex-col justify-between min-h-[190px] border-l-4 border-l-blue-500">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Brain size={16} className="text-blue-500" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Feedback do Mentor Focus
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                    "Disciplina exemplar na sessão de foco. Não desacelere agora; cumpra as tarefas pendentes antes das 18h."
                  </p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-200/50 dark:border-slate-800/50 text-[11px] text-slate-400">
                  <span>Modo Foco: 25:00</span>
                  <span className="text-emerald-500 font-bold">Ativo</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ================= BENEFÍCIOS SECTION ================= */}
      <section id="beneficios" className="py-20 sm:py-28 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold tracking-[0.25em] text-blue-600 dark:text-blue-400 uppercase block mb-3">
              RECURSOS COMPLETOS
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
              Tudo o que você precisa para dominar sua rotina.
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300">
              Menos ruído, menos aplicativos fragmentados e mais direção clara no seu dia a dia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b, idx) => (
              <div
                key={idx}
                className="glass-card p-7 rounded-3xl border border-white/80 dark:border-slate-800/80 hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center shadow-sm mb-5 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/40 transition-colors">
                    {b.icon}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                    {b.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {b.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= COMO FUNCIONA ================= */}
      <section id="como-funciona" className="py-20 sm:py-24 bg-white/40 dark:bg-slate-900/40 border-y border-slate-200/80 dark:border-slate-800/80 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold tracking-[0.25em] text-blue-600 dark:text-blue-400 uppercase block mb-3">
              SIMPLICIDADE
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
              Como funciona o fluxo de vendas
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-300">
              Garantia de segurança: sua conta é autenticada antes do pagamento para vincular seu acesso sem erros.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="glass-card p-8 rounded-3xl flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold text-lg flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
                1
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                1. Crie sua conta
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Acesse através do Google SSO para gerar seu identificador seguro de usuário (UID).
              </p>
            </div>

            <div className="glass-card p-8 rounded-3xl flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-bold text-lg flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/30">
                2
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                2. Pagamento Seguro
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Você é redirecionado ao Stripe Checkout por apenas R$ 19,90/mês com dados criptografados.
              </p>
            </div>

            <div className="glass-card p-8 rounded-3xl flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-600 text-white font-bold text-lg flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/30">
                3
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                3. Acesso Imediato
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                O webhook confirma a transação e libera instantaneamente todos os recursos Pro.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= PRICING (PLANOS) ================= */}
      <section id="planos" className="py-20 sm:py-28 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold tracking-[0.25em] text-blue-600 dark:text-blue-400 uppercase block mb-3">
              TRANSPARÊNCIA TOTAL
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
              Um plano único. Sem limites.
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-300">
              Tenha tudo o que o Nexus Focus oferece pelo menor preço de assinatura de IA do mercado.
            </p>
          </div>

          {/* Pricing Highlight Card */}
          <div className="glass-card p-8 sm:p-12 rounded-[36px] border-2 border-blue-500/50 shadow-[0_24px_70px_rgba(37,99,235,0.15)] relative overflow-hidden">
            
            {/* Ribbon Badge */}
            <div className="absolute top-6 right-6 bg-blue-600 text-white text-[11px] font-extrabold px-3.5 py-1.5 rounded-full tracking-wider uppercase shadow-sm">
              Mais Popular • Acesso Total
            </div>

            <div className="max-w-xl">
              <span className="text-xs font-black tracking-widest text-blue-600 dark:text-blue-400 uppercase block mb-2">
                PLANO PRO NEXUS FOCUS
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-3">
                Direção, Clareza e Produtividade
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-8">
                Ideal para profissionais, estudantes e empreendedores que buscam alta performance sem complicação.
              </p>

              {/* Price Tag */}
              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                  R$ 19,90
                </span>
                <span className="text-base text-slate-500 font-medium">/mês</span>
              </div>

              {/* Feature Checklist */}
              <div className="space-y-3.5 mb-10">
                {[
                  'Mentor IA com raciocínio financeiro e disciplina diária',
                  'Gestão financeira com Caixinhas, Metas e Orçamento Mensal',
                  'Modo Foco & Pomodoro sincronizado com métricas reais',
                  'Integração oficial via WhatsApp (áudio e texto)',
                  'Sincronização em nuvem e Progressive Web App (PWA)',
                  'Cancele a qualquer momento com apenas 1 clique'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
                    <div className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Check size={13} strokeWidth={3} />
                    </div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button with Required navigate('/login?intent=checkout') */}
              <button
                onClick={handleCtaCheckout}
                className="w-full py-4 px-6 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-2xl shadow-[0_10px_30px_rgba(37,99,235,0.4)] transition-all duration-200 active:scale-98 flex items-center justify-center gap-3 cursor-pointer"
              >
                <span>Assinar Agora por R$ 19,90/mês</span>
                <ArrowRight size={18} />
              </button>

              <div className="flex items-center justify-center gap-2 mt-4 text-xs text-slate-500">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span>Garantia de 7 dias ou seu dinheiro de volta. Pagamento seguro via Stripe.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <section id="faq" className="py-16 sm:py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-xs font-bold tracking-[0.25em] text-blue-600 dark:text-blue-400 uppercase block mb-3">
            TIRE SUAS DÚVIDAS
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Perguntas Frequentes
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="glass-card rounded-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden"
            >
              <button
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="w-full px-6 py-5 text-left font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center justify-between gap-4 cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  size={18}
                  className={`text-slate-400 transition-transform duration-200 shrink-0 ${
                    openFaq === index ? 'rotate-180 text-blue-500' : ''
                  }`}
                />
              </button>

              {openFaq === index && (
                <div className="px-6 pb-5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 pt-4">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="w-full border-t border-slate-200/80 dark:border-slate-800/80 py-10 text-center relative z-10 bg-white/40 dark:bg-slate-950/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
          
          <div className="flex items-center gap-2.5 mb-4">
            <NexusFocusLogo className="w-6 h-6" variant={isDarkMode ? 'light' : 'dark'} />
            <span className="text-sm font-extrabold tracking-widest uppercase text-slate-900 dark:text-white">
              NEXUS FOCUS
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 max-w-md">
            Disciplina hoje. Liberdade sempre. O sistema operacional moderno para sua rotina e finanças.
          </p>

          <div className="flex items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-400 mb-6">
            <Link to="/termos" className="hover:underline hover:text-slate-900 dark:hover:text-white">
              Termos de Uso
            </Link>
            <Link to="/privacidade" className="hover:underline hover:text-slate-900 dark:hover:text-white">
              Política de Privacidade
            </Link>
            <button onClick={handleCtaCheckout} className="hover:underline text-blue-600 dark:text-blue-400 cursor-pointer">
              Assinar Pro
            </button>
          </div>

          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            © {new Date().getFullYear()} Nexus Focus. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
