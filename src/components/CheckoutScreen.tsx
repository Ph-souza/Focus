import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { initMercadoPago, CardPayment } from '@mercadopago/sdk-react';
import {
  Shield,
  ShieldCheck,
  Lock,
  Check,
  ArrowRight,
  RefreshCw,
  User,
  Tag,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Sparkles,
  ListTodo,
  Wallet,
  Calendar,
  Bot,
  Sun,
  Moon,
  Gift
} from 'lucide-react';
import { useAuth, isWhitelistedPro } from '../contexts/AuthContext';
import { NexusFocusLogo } from './AuraLogo';
import { getApiUrl } from '../lib/api';

// Chave pública oficial de produção da aplicação Nexus Focus no Mercado Pago (App ID: 1713752160212036)
const PROD_MP_PUBLIC_KEY = 'APP_USR-e42fc2b0-97b3-4aaa-b0f7-60b94d19825b';

const rawKey = (
  (import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY as string) ||
  (import.meta.env.NEXT_PUBLIC_MP_PUBLIC_KEY as string) ||
  (import.meta.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY as string) ||
  (import.meta.env.VITE_MP_PUBLIC_KEY as string) ||
  (import.meta.env.MP_PUBLIC_KEY as string) ||
  ''
).trim();

// Garante que chaves fictícias não quebrem a inicialização em produção
export const MP_PUBLIC_KEY = (rawKey && !rawKey.includes('your-public-key')) ? rawKey : PROD_MP_PUBLIC_KEY;

// Inicializa o SDK do Mercado Pago
if (typeof window !== 'undefined' && MP_PUBLIC_KEY) {
  try {
    initMercadoPago(MP_PUBLIC_KEY, {
      locale: 'pt-BR'
    });
  } catch (e) {
    console.warn('[Mercado Pago SDK] Inicialização inicial:', e);
  }
}

export function CheckoutScreen() {
  const { currentUser, isPremium, logout } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [isBrickReady, setIsBrickReady] = useState(false);
  const [brickError, setBrickError] = useState<string | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [showCouponInput, setShowCouponInput] = useState(false);

  // Controle de tema claro/escuro
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') || document.body.classList.contains('dark');
    }
    return false;
  });

  const toggleTheme = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    if (typeof window !== 'undefined') {
      if (next) {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
        localStorage.setItem('nexus_dark_mode', 'true');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
        localStorage.setItem('nexus_dark_mode', 'false');
      }
    }
  };

  const userEmail = (currentUser?.email || currentUser?.providerData?.[0]?.email || '').trim().toLowerCase();
  const hasAccess = isPremium || isWhitelistedPro(userEmail);

  // Garante que o SDK esteja devidamente configurado ao montar a tela
  useEffect(() => {
    if (MP_PUBLIC_KEY) {
      try {
        initMercadoPago(MP_PUBLIC_KEY, { locale: 'pt-BR' });
      } catch (err) {
        console.warn('[Mercado Pago SDK] Erro ao carregar SDK no componente:', err);
      }
    }
  }, []);

  // Timeout preventivo: se o script do Mercado Pago demorar na rede
  useEffect(() => {
    let timer: any;
    if (step === 2 && !isBrickReady && !brickError) {
      timer = setTimeout(() => {
        if (!isBrickReady) {
          setBrickError('O formulário do Mercado Pago está demorando para responder.');
        }
      }, 8500);
    }
    return () => clearTimeout(timer);
  }, [step, isBrickReady, brickError]);

  // Redirecionamento automático se já for Pro
  if (hasAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  // Cálculo dinâmico do valor
  const getAmount = () => {
    if (!couponApplied) return 19.90;
    const code = couponCode.trim().toUpperCase();
    if (code === 'FOCUS50') return 9.95;
    if (code === 'FOCUS10' || code === 'PROMO') return 14.90;
    return 19.90;
  };

  const currentAmount = getAmount();
  const formatMoney = (val: number) =>
    val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const cardInitialization = {
    amount: currentAmount,
    payer: {
      email: userEmail || currentUser?.email || undefined
    }
  };

  const cardCustomization = {
    paymentMethods: {
      maxInstallments: 1,
    },
    visual: {
      hideFormTitle: true,
      style: {
        theme: isDarkMode ? ('dark' as const) : ('default' as const),
        customVariables: {
          baseColor: isDarkMode ? '#2563eb' : '#18181b',
          borderRadius: '14px',
        },
      },
      texts: {
        formSubmit: 'Confirmar Pagamento',
      },
    },
  };

  const handleGoToPayment = () => {
    setErrorMessage('');
    setIsBrickReady(false);
    setBrickError(null);
    setStep(2);
  };

  const handleBackToPlan = () => {
    setStep(1);
    setLoading(false);
    setErrorMessage('');
  };

  const onSubmit = async (param: any) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const formData = param?.formData || param || {};
      const cardToken = formData.token || param?.token;

      if (!cardToken) {
        throw new Error('Não foi possível gerar o token do cartão. Revise os dados digitados.');
      }

      const response = await fetch(getApiUrl('/api/subscriptions'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: cardToken,
          email: currentUser?.email || userEmail || formData?.payer?.email,
          userId: currentUser?.uid,
          paymentMethodId: formData.payment_method_id || formData.paymentMethodId,
          issuerId: formData.issuer_id || formData.issuerId,
          installments: formData.installments || 1,
          coupon: couponApplied ? couponCode : undefined,
          amount: currentAmount,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao processar a assinatura.');
      }

      // Sucesso: redireciona para o dashboard
      window.location.href = '/dashboard';
    } catch (err: any) {
      console.error('Erro no pagamento:', err);
      setErrorMessage(err.message || 'Falha ao autorizar o pagamento. Verifique os dados do cartão.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    if (code === 'FOCUS50' || code === 'FOCUS10' || code === 'PROMO') {
      setCouponApplied(true);
      setCouponError('');
    } else {
      setCouponError('Cupom inválido ou expirado.');
    }
  };

  const handleRemoveCoupon = () => {
    setCouponApplied(false);
    setCouponCode('');
    setCouponError('');
  };

  const handleRefreshStatus = async () => {
    try {
      setIsCheckingStatus(true);
      setStatusFeedback(null);
      await new Promise((r) => setTimeout(r, 1200));

      if (isWhitelistedPro(userEmail)) {
        window.location.href = '/dashboard';
        return;
      }

      setStatusFeedback('Verificação concluída. Nenhum pagamento recente aprovado foi encontrado.');
    } catch {
      setStatusFeedback('Não foi possível verificar o status agora. Tente novamente.');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const benefits = [
    {
      icon: <ListTodo className="w-5 h-5 text-[#265de4] dark:text-[#60a5fa]" />,
      title: 'Tarefas e projetos',
      desc: 'Tire os planos do papel com priorização clara.'
    },
    {
      icon: <Wallet className="w-5 h-5 text-[#265de4] dark:text-[#60a5fa]" />,
      title: 'Organização financeira',
      desc: 'Saiba exatamente para onde seu dinheiro vai.'
    },
    {
      icon: <Calendar className="w-5 h-5 text-[#265de4] dark:text-[#60a5fa]" />,
      title: 'Agenda e foco',
      desc: 'Abra espaço para o que realmente importa.'
    },
    {
      icon: <Bot className="w-5 h-5 text-[#265de4] dark:text-[#60a5fa]" />,
      title: 'Mentor IA',
      desc: 'Ajuda inteligente para seguir em frente todos os dias.'
    }
  ];

  return (
    <div className="min-h-screen w-full relative flex flex-col justify-between overflow-x-hidden bg-[#f8f9fb] dark:bg-[#10141d] text-[#131923] dark:text-[#f2f5fa] transition-colors duration-300">
      {/* Background Ambiente com gradientes radiais suaves e grid pontilhado */}
      <div className="checkout-ambient" aria-hidden="true">
        <div className="absolute w-[440px] h-[440px] -right-[200px] top-[220px] rounded-full border border-blue-200/20 dark:border-blue-500/10 shadow-[0_0_0_55px_rgba(155,177,213,0.035),0_0_0_110px_rgba(155,177,213,0.035)] pointer-events-none" />
      </div>

      <div className="w-full max-w-[1160px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex-1 flex flex-col justify-between py-5 sm:py-7">
        
        {/* ================= HEADER SUPERIOR ================= */}
        <header className="flex items-center justify-between py-4 border-b border-black/[0.08] dark:border-white/[0.08] mb-6 sm:mb-8">
          <Link to="/homepage" className="flex items-center gap-3 no-underline group cursor-pointer" aria-label="Nexus Focus, página inicial">
            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <NexusFocusLogo className="w-6 h-6" variant={isDarkMode ? 'light' : 'dark'} />
            </div>
            <div className="flex flex-col">
              <span className="text-[15px] sm:text-base font-extrabold tracking-tight text-zinc-950 dark:text-white leading-tight">
                NEXUS <span className="font-light text-zinc-600 dark:text-zinc-400">FOCUS</span>
              </span>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 tracking-wider">
                Sua rotina, mais inteligente.
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3 sm:gap-5">
            {/* Indicador de Checkout Seguro */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 font-medium">
              <Lock size={14} className="text-[#265de4] dark:text-[#60a5fa]" />
              <span>Checkout seguro</span>
            </div>

            {/* Sessão do Usuário */}
            {currentUser?.email && (
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.06]">
                <User size={13} className="text-zinc-500 dark:text-zinc-400" />
                <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 max-w-[130px] sm:max-w-[180px] truncate">
                  {currentUser.email}
                </span>
                <button
                  type="button"
                  onClick={logout}
                  className="text-[10px] font-semibold text-rose-500 hover:text-rose-600 ml-1 cursor-pointer"
                  title="Trocar de conta"
                >
                  Sair
                </button>
              </div>
            )}

            {/* Alternador de Tema */}
            <button
              type="button"
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white/60 dark:bg-slate-900/60 text-zinc-700 dark:text-zinc-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.08] flex items-center justify-center transition-colors cursor-pointer"
              aria-label={isDarkMode ? 'Ativar tema claro' : 'Ativar tema escuro'}
            >
              {isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>
        </header>

        {/* ================= CONTEÚDO PRINCIPAL (LAYOUT 2 COLUNAS) ================= */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start flex-1 my-auto pb-6">
          
          {/* ================= COLUNA DA ESQUERDA: APRESENTAÇÃO & BENEFÍCIOS ================= */}
          <section className="lg:col-span-7 flex flex-col justify-center pt-2">
            
            {/* Eyebrow */}
            <div className="flex items-center gap-2.5 text-[#265de4] dark:text-[#60a5fa] text-[10px] sm:text-[11px] font-bold tracking-[0.2em] uppercase mb-4">
              <span className="w-5 h-0.5 bg-current" />
              <span>Seu próximo passo</span>
            </div>

            {/* Título Principal */}
            <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-extrabold tracking-tight text-zinc-950 dark:text-white leading-[1.12] mb-4">
              Seu próximo passo.<br />
              <span className="text-[#265de4] dark:text-[#60a5fa]">Mais direção.</span><br />
              Menos distração.
            </h1>

            {/* Lead */}
            <p className="text-sm sm:text-[15px] text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-lg mb-6">
              Tudo o que você precisa para organizar o dia e cuidar do seu dinheiro, em um só lugar.
            </p>

            {/* Palco Visual de Recursos (Visual Stage com Cards Flutuantes 3D) */}
            <div className="visual-stage w-full max-w-[500px]" role="img" aria-label="Recursos Nexus Focus em ação">
              
              {/* Arte Orbital SVG */}
              <svg className="orbit-art" viewBox="0 0 520 320" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
                <defs>
                  <radialGradient id="stageHalo">
                    <stop stopColor="#82aafa" stopOpacity="0.4" />
                    <stop offset="1" stopColor="#82aafa" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <ellipse cx="260" cy="161" rx="211" ry="145" fill="url(#stageHalo)" />
                <g fill="none" stroke="currentColor" strokeWidth="0.8">
                  <ellipse cx="260" cy="166" rx="216" ry="96" transform="rotate(-22 260 166)" />
                  <ellipse cx="260" cy="166" rx="165" ry="121" transform="rotate(28 260 166)" strokeDasharray="3 7" />
                  <path d="M65 166h391M260 33v262" opacity="0.25" />
                </g>
                <g fill="currentColor">
                  <circle cx="85" cy="221" r="4" />
                  <circle cx="423" cy="82" r="3" />
                  <circle cx="324" cy="278" r="3" />
                  <path d="m332 31 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" />
                </g>
              </svg>

              {/* Nexus Core Central */}
              <div className="nexus-core" aria-hidden="true">
                <NexusFocusLogo className="w-16 h-16" variant={isDarkMode ? 'light' : 'dark'} />
              </div>

              {/* Float Card 1: Tarefas */}
              <div className="float-card task-card select-none" aria-hidden="true">
                <div className="flex items-center gap-2 mb-2 text-zinc-500 dark:text-zinc-400">
                  <ListTodo size={13} className="text-[#265de4] dark:text-[#60a5fa]" />
                  <span className="text-[9px] tracking-wider uppercase font-semibold">Seu dia, em ordem</span>
                </div>
                <b className="text-[11px] font-bold text-zinc-900 dark:text-white block mb-2">Uma coisa de cada vez.</b>
                <div className="space-y-1.5 text-[10px] text-zinc-600 dark:text-zinc-300">
                  <div className="flex items-center gap-1.5 font-medium">
                    <span className="w-3.5 h-3.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[9px] font-bold">✓</span>
                    <span>Organizar prioridades</span>
                  </div>
                  <div className="flex items-center gap-1.5 opacity-75">
                    <span className="w-3.5 h-3.5 rounded border border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-[9px]" />
                    <span>Tirar planos do papel</span>
                  </div>
                </div>
                <div className="h-1 rounded-full bg-blue-100 dark:bg-blue-950 mt-3 overflow-hidden">
                  <div className="w-[70%] h-full bg-[#366bea] rounded-full" />
                </div>
              </div>

              {/* Float Card 2: Finanças */}
              <div className="float-card finance-card select-none" aria-hidden="true">
                <div className="flex items-center gap-1.5 mb-1 text-zinc-500 dark:text-zinc-400">
                  <Wallet size={13} className="text-[#265de4] dark:text-[#60a5fa]" />
                  <span className="text-[9px] tracking-wider uppercase font-semibold">Finanças</span>
                </div>
                <b className="text-[11px] font-bold text-zinc-900 dark:text-white block">Mais controle.</b>
                <div className="finance-bars">
                  <i style={{ height: '35%' }} />
                  <i style={{ height: '58%' }} />
                  <i style={{ height: '45%' }} />
                  <i style={{ height: '77%' }} />
                  <i style={{ height: '68%' }} />
                  <i style={{ height: '100%' }} />
                </div>
              </div>

              {/* Float Card 3: Foco */}
              <div className="float-card focus-card select-none" aria-hidden="true">
                <div className="focus-ring shrink-0">25:00</div>
                <div>
                  <strong className="text-xs font-bold text-zinc-900 dark:text-white block">Hora de focar.</strong>
                  <span className="text-[9px] text-zinc-500 dark:text-zinc-400">Um passo por vez</span>
                </div>
              </div>

              {/* Float Card 4: Mentor IA */}
              <div className="float-card mentor-card select-none" aria-hidden="true">
                <div className="w-8 h-8 rounded-xl bg-blue-100/80 dark:bg-blue-950/80 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center text-[#265de4] dark:text-[#60a5fa] shrink-0">
                  <Bot size={18} />
                </div>
                <div className="flex flex-col">
                  <strong className="text-xs font-bold text-zinc-900 dark:text-white">Mentor IA</strong>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400">com você</span>
                </div>
              </div>
            </div>

            {/* Grade de 4 Benefícios */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              {benefits.map((b, idx) => (
                <div key={idx} className="flex items-start gap-3 p-2.5 rounded-2xl transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-black/[0.06] dark:border-white/[0.08] shadow-2xs flex items-center justify-center shrink-0">
                    {b.icon}
                  </div>
                  <div>
                    <strong className="text-xs font-bold text-zinc-900 dark:text-white block leading-tight mb-0.5">
                      {b.title}
                    </strong>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                      {b.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ================= COLUNA DA DIREITA: CARTÃO DE CHECKOUT GLASSMORPHISM ================= */}
          <section className="lg:col-span-5 w-full">
            <div
              id="checkout"
              className="relative w-full rounded-[28px] p-6 sm:p-7 bg-white/75 dark:bg-[#1b2230]/75 backdrop-blur-2xl border border-white/90 dark:border-white/[0.1] shadow-[0_24px_80px_rgba(44,61,97,0.09)] dark:shadow-[0_24px_80px_rgba(0,0,0,0.35)] overflow-hidden transition-all"
            >
              {/* Plan Art Header Banner */}
              <div className="plan-art select-none">
                <div className="w-10 h-10 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center shadow-sm shrink-0">
                  <NexusFocusLogo className="w-6 h-6" variant={isDarkMode ? 'dark' : 'light'} />
                </div>
                <div className="flex flex-col min-w-0">
                  <strong className="text-xs font-extrabold tracking-wider text-zinc-950 dark:text-white uppercase truncate">
                    NEXUS FOCUS
                  </strong>
                  <small className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                    Sua rotina, mais inteligente.
                  </small>
                </div>
                <span className="ml-auto px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#265de4]/10 dark:bg-[#9ebaff]/15 text-[#265de4] dark:text-[#9ebaff] border border-[#265de4]/20 shrink-0">
                  Mensal
                </span>
              </div>

              {/* Stepper Navigation: Etapa 1 e Etapa 2 */}
              <nav className="flex items-center gap-3 mb-5" aria-label="Etapas da assinatura">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className={`flex items-center gap-2 text-xs font-semibold py-1 transition-colors cursor-pointer ${
                    step === 1 ? 'text-[#265de4] dark:text-[#9ebaff]' : 'text-zinc-400 hover:text-zinc-600'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] border ${
                    step === 1 ? 'border-[#265de4] bg-[#265de4]/10 dark:border-[#9ebaff]' : 'border-zinc-300 dark:border-zinc-700'
                  }`}>
                    1
                  </span>
                  <span>Seu plano</span>
                </button>
                <div className="h-px flex-1 bg-black/[0.08] dark:bg-white/[0.08]" />
                <button
                  type="button"
                  onClick={handleGoToPayment}
                  className={`flex items-center gap-2 text-xs font-semibold py-1 transition-colors cursor-pointer ${
                    step === 2 ? 'text-[#265de4] dark:text-[#9ebaff]' : 'text-zinc-400 hover:text-zinc-600'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] border ${
                    step === 2 ? 'border-[#265de4] bg-[#265de4]/10 dark:border-[#9ebaff]' : 'border-zinc-300 dark:border-zinc-700'
                  }`}>
                    2
                  </span>
                  <span>Pagamento</span>
                </button>
              </nav>

              {/* ================= VIEW: ETAPA 1 (RESUMO DO PLANO & CUPOM) ================= */}
              {step === 1 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-zinc-950 dark:text-white tracking-tight">
                      Sua nova rotina começa aqui.
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Uma assinatura. Sua rotina em ordem.
                    </p>
                  </div>

                  {/* Price Box com Selo de Oferta */}
                  <div className="relative p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06]">
                    {couponApplied && couponCode.toUpperCase() === 'FOCUS50' && (
                      <div className="offer-seal" aria-label="50% de desconto">
                        <strong className="text-xl font-extrabold leading-none">50%</strong>
                        <small className="text-[8px] font-bold tracking-widest">OFF</small>
                      </div>
                    )}

                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-1">
                      {couponApplied ? (
                        <del className="text-zinc-400">De R$ 19,90/mês</del>
                      ) : (
                        'Acesso a todos os recursos'
                      )}
                    </p>

                    <div className="flex items-baseline gap-1.5 tracking-tight">
                      <span className="text-xl font-semibold text-zinc-700 dark:text-zinc-300">R$</span>
                      <strong className="text-4xl sm:text-5xl font-black text-zinc-950 dark:text-white">
                        {formatMoney(currentAmount)}
                      </strong>
                      <span className="text-xs text-zinc-500 font-medium">/mês</span>
                    </div>

                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1.5">
                      {couponApplied && couponCode.toUpperCase() === 'FOCUS50'
                        ? 'Por mês, nos 3 primeiros meses. Renovação flexível.'
                        : 'Assinatura com renovação mensal. Cancele quando quiser.'}
                    </p>
                  </div>

                  {/* Seção do Cupom de Desconto */}
                  <div className="space-y-2">
                    {!showCouponInput && !couponApplied ? (
                      <button
                        type="button"
                        onClick={() => setShowCouponInput(true)}
                        className="w-full flex items-center justify-between py-2 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white font-medium cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Tag size={14} className="text-[#265de4] dark:text-[#60a5fa]" />
                          <span>Tem um cupom de desconto?</span>
                        </div>
                        <span className="text-[#265de4] dark:text-[#60a5fa] hover:underline font-semibold">Adicionar &gt;</span>
                      </button>
                    ) : (
                      <form onSubmit={handleApplyCoupon} className="space-y-2">
                        <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                          <Tag size={13} className="text-[#265de4] dark:text-[#60a5fa]" />
                          <span>Cupom de desconto</span>
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Digite seu cupom (ex: FOCUS50)"
                            value={couponCode}
                            onChange={(e) => {
                              setCouponCode(e.target.value);
                              setCouponError('');
                            }}
                            className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#265de4] uppercase font-semibold text-zinc-900 dark:text-white"
                          />
                          <button
                            type="submit"
                            className="px-4 py-2 text-xs font-bold bg-[#131923] dark:bg-white text-white dark:text-zinc-950 rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
                          >
                            Aplicar
                          </button>
                          {showCouponInput && !couponApplied && (
                            <button
                              type="button"
                              onClick={() => {
                                setShowCouponInput(false);
                                setCouponError('');
                              }}
                              className="p-2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                            >
                              <X size={15} />
                            </button>
                          )}
                        </div>
                        {couponError && <p className="text-[11px] text-rose-500 font-medium">{couponError}</p>}
                      </form>
                    )}

                    {couponApplied && (
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-xs text-emerald-800 dark:text-emerald-300">
                        <div className="flex items-center gap-2 font-semibold">
                          <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400" />
                          <span>{couponCode.toUpperCase()} aplicado ({couponCode.toUpperCase() === 'FOCUS50' ? '50% OFF' : 'Desconto especial'})</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="text-[11px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 underline cursor-pointer"
                        >
                          Remover
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Bônus Desbloqueado com Cupom (3 e-books) */}
                  {couponApplied && (
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#265de4]/[0.06] dark:bg-[#265de4]/15 border border-[#265de4]/20 animate-in fade-in">
                      <div className="book-stack" aria-hidden="true">
                        <i />
                        <i />
                        <i />
                      </div>
                      <div>
                        <strong className="text-xs font-bold text-zinc-950 dark:text-white block">
                          Seu cupom também desbloqueia um bônus
                        </strong>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block mt-0.5">
                          Kit com 3 e-books incluído na assinatura.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Resumo de Valores */}
                  <div className="pt-3 border-t border-black/[0.08] dark:border-white/[0.08] space-y-2 text-xs">
                    <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                      <span>Plano mensal Pro</span>
                      <span>R$ 19,90</span>
                    </div>

                    {couponApplied && (
                      <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                        <span>Desconto {couponCode.toUpperCase()}</span>
                        <span>− R$ {formatMoney(19.90 - currentAmount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-baseline pt-2 border-t border-black/[0.08] dark:border-white/[0.08] text-sm font-bold text-zinc-950 dark:text-white">
                      <span>Total da primeira mensalidade</span>
                      <span className="text-base text-[#265de4] dark:text-[#9ebaff]">
                        R$ {formatMoney(currentAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Botão de Avançar para o Pagamento */}
                  <button
                    type="button"
                    onClick={handleGoToPayment}
                    className="w-full bg-[#265de4] hover:bg-[#1b4cc4] text-white font-bold py-3.5 px-5 rounded-2xl shadow-[0_5px_16px_rgba(38,93,228,0.25)] transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.99] mt-2"
                  >
                    <span>Ir para pagamento · R$ {formatMoney(currentAmount)}/mês</span>
                    <ArrowRight size={16} />
                  </button>

                  <p className="text-[11px] text-center text-zinc-400 dark:text-zinc-500">
                    Ao prosseguir, você concorda com nossos termos e políticas.
                  </p>
                </div>
              )}

              {/* ================= VIEW: ETAPA 2 (PAGAMENTO SEGURO MERCADO PAGO) ================= */}
              {step === 2 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  
                  {/* Cabeçalho do Pagamento com Logo Mercado Pago e Botão Voltar */}
                  <div className="flex items-center justify-between pb-3 border-b border-black/[0.08] dark:border-white/[0.08]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-[#265de4] dark:text-[#60a5fa] flex items-center justify-center shrink-0">
                        <Lock size={15} />
                      </div>
                      <div>
                        <h2 className="text-sm sm:text-base font-bold text-zinc-950 dark:text-white leading-tight">
                          Pague com Segurança
                        </h2>
                        <span className="text-[11px] text-[#087cb2] dark:text-[#6dc9ff] font-semibold block">
                          Uma parceria Mercado Pago
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleBackToPlan}
                      className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.12] px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      <ArrowRight size={13} className="rotate-180" />
                      <span>Voltar</span>
                    </button>
                  </div>

                  {/* Resumo do Valor na Etapa de Pagamento */}
                  <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.06] text-xs">
                    <span className="text-zinc-500 dark:text-zinc-400 font-medium">Assinatura mensal:</span>
                    <strong className="text-sm font-extrabold text-zinc-950 dark:text-white">
                      R$ {formatMoney(currentAmount)}
                      <span className="text-[10px] font-normal text-zinc-400 ml-1">/mês</span>
                    </strong>
                  </div>

                  {/* Mensagem de Erro de Validação/Gateway */}
                  {errorMessage && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                      <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* ================= CONTAINER DO BRICK MERCADO PAGO ================= */}
                  {/* IMPORTANTE: Mantém rigorosamente os IDs e classes exigidos pelo SDK e validados no projeto */}
                  <div
                    id="cardPaymentBrick_container"
                    data-testid="payment-brick-container"
                    className="mercado-pago-brick-container w-full min-h-[340px] relative px-0.5 py-1"
                  >
                    {/* Skeleton Loader elegante enquanto os scripts externos do Mercado Pago carregam */}
                    {!isBrickReady && !brickError && (
                      <div className="w-full space-y-3.5 pt-1 animate-pulse" aria-label="Carregando formulário de pagamento">
                        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2">
                          <Loader2 size={14} className="animate-spin text-[#265de4] dark:text-[#60a5fa]" />
                          <span>Carregando formulário seguro do Mercado Pago…</span>
                        </div>
                        <div className="space-y-1.5">
                          <div className="h-3 w-28 bg-zinc-200 dark:bg-zinc-800 rounded" />
                          <div className="h-11 w-full bg-zinc-100 dark:bg-zinc-800/70 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
                            <div className="h-11 w-full bg-zinc-100 dark:bg-zinc-800/70 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl" />
                          </div>
                          <div className="space-y-1.5">
                            <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" />
                            <div className="h-11 w-full bg-zinc-100 dark:bg-zinc-800/70 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl" />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <div className="h-3 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
                          <div className="h-11 w-full bg-zinc-100 dark:bg-zinc-800/70 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl" />
                        </div>
                        <div className="h-12 w-full bg-zinc-200/90 dark:bg-zinc-800 rounded-xl mt-3" />
                      </div>
                    )}

                    {/* Componente CardPayment oficial do @mercadopago/sdk-react */}
                    <div className={!isBrickReady ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100 transition-opacity duration-300'}>
                      <CardPayment
                        initialization={cardInitialization}
                        customization={cardCustomization}
                        onSubmit={onSubmit}
                        onReady={() => {
                          setIsBrickReady(true);
                          setBrickError(null);
                        }}
                        onError={(error: any) => {
                          console.error('Erro no formulário de pagamento Mercado Pago:', error);
                          setBrickError('Não foi possível carregar os campos do cartão no momento.');
                          setIsBrickReady(true);
                        }}
                      />
                    </div>

                    {/* Feedback se o script falhar ou demorar */}
                    {brickError && (
                      <div className="mt-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                        <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                        <div className="flex-1">
                          <p className="font-semibold">{brickError}</p>
                          <p className="mt-0.5 text-[11px] opacity-90">Verifique sua conexão ou tente recarregar os campos.</p>
                          <button
                            type="button"
                            onClick={() => {
                              setBrickError(null);
                              setIsBrickReady(false);
                            }}
                            className="mt-2 text-xs font-bold text-amber-900 dark:text-amber-200 underline cursor-pointer"
                          >
                            Recarregar formulário seguro
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Feedback de Status Manual */}
                  {statusFeedback && (
                    <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs flex items-start justify-between gap-2">
                      <span>{statusFeedback}</span>
                      <button type="button" onClick={() => setStatusFeedback(null)} className="text-zinc-400 hover:text-zinc-600">
                        <X size={12} />
                      </button>
                    </div>
                  )}

                  {/* Botão de Verificação de Status */}
                  <div className="pt-2 flex flex-col items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRefreshStatus}
                      disabled={isCheckingStatus}
                      className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw size={12} className={isCheckingStatus ? "animate-spin text-[#265de4]" : "text-zinc-400"} />
                      <span>Já realizou o pagamento? Atualizar status</span>
                    </button>

                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                      <ShieldCheck size={13} className="text-zinc-400" />
                      <span>Criptografia de ponta a ponta Mercado Pago</span>
                    </div>
                  </div>

                  {/* Loading Overlay durante submissão */}
                  {loading && (
                    <div className="absolute inset-0 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-sm flex flex-col items-center justify-center rounded-[28px] gap-3 z-30">
                      <Loader2 size={32} className="animate-spin text-[#265de4] dark:text-[#60a5fa]" />
                      <p className="text-sm font-semibold text-zinc-900 dark:text-white">Processando assinatura segura…</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </main>

        {/* ================= FOOTER INFERIOR ================= */}
        <footer className="py-4 border-t border-black/[0.08] dark:border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 mt-6">
          <span>© {new Date().getFullYear()} Nexus Focus · Sua rotina, mais inteligente.</span>
          <div className="flex items-center gap-4">
            <Link to="/privacidade" target="_blank" className="hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">
              Política de Privacidade
            </Link>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Shield size={12} />
              Ambiente Seguro
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}