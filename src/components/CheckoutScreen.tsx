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
  Users,
  Star,
  Tag,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  CreditCard,
  Sparkles,
  Brain,
  Flame,
  Target,
  TrendingUp,
  Zap,
  BadgeCheck
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
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isBrickReady, setIsBrickReady] = useState(false);
  const [brickError, setBrickError] = useState<string | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState('');

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

  // Timeout preventivo: se o script do Mercado Pago for bloqueado por adblocker ou demorar na rede
  useEffect(() => {
    let timer: any;
    if (isFlipped && !isBrickReady && !brickError) {
      timer = setTimeout(() => {
        if (!isBrickReady) {
          setBrickError('O formulário do Mercado Pago está demorando para responder.');
        }
      }, 8500);
    }
    return () => clearTimeout(timer);
  }, [isFlipped, isBrickReady, brickError]);

  // Redirecionamento automático se já for Pro
  if (hasAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  const cardInitialization = {
    amount: couponApplied ? 14.90 : 19.90, // Valor da mensalidade Pro (R$ 19,90 ou R$ 14,90 com cupom)
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
        theme: 'default' as const,
        customVariables: {
          baseColor: '#18181b',
          borderRadius: '14px',
        },
      },
      texts: {
        formSubmit: 'Confirmar Pagamento',
      },
    },
  };

  // Fluxo de Pagamento Interno (Swipe Card)
  const handleCheckout = () => {
    setErrorMessage('');
    setIsBrickReady(false);
    setBrickError(null);
    setIsFlipped(true);
  };

  const handleBack = () => {
    setIsFlipped(false);
    setLoading(false);
    setErrorMessage('');
    setIsBrickReady(false);
    setBrickError(null);
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
          amount: couponApplied ? 14.90 : 19.90,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao processar a assinatura.');
      }

      // Sucesso: fecha o swipe card e libera o acesso redirecionando para o dashboard
      setIsFlipped(false);
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
    if (!couponCode.trim()) return;

    if (couponCode.trim().toUpperCase() === 'FOCUS10' || couponCode.trim().toUpperCase() === 'PROMO') {
      setCouponApplied(true);
      setCouponError('');
    } else {
      setCouponError('Cupom inválido ou expirado.');
    }
  };

  const handleRefreshStatus = async () => {
    try {
      setIsCheckingStatus(true);
      setStatusFeedback(null);
      // Pequeno delay para checar sincronização com o Firestore / backend
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
    'Mentor IA com raciocínio financeiro em tempo real',
    'Modo Foco & Timeboxing sincronizado',
    'Gestão ilimitada de Caixinhas, Metas e Orçamento',
    'Integração via WhatsApp com leitura automática de gastos',
    'Sincronização em nuvem e segurança de nível executivo'
  ];

  const planGuarantees = [
    'Acesso completo a todos os recursos',
    'Suporte prioritário',
    'Atualizações e novos recursos incluídos',
    'Cancele quando quiser, sem complicação'
  ];

  return (
    <div className="min-h-screen w-full flex flex-col justify-between items-center px-4 sm:px-6 py-6 sm:py-8 relative overflow-x-hidden bg-[url('/login-desktop-bg.jpg')] bg-cover bg-center bg-no-repeat selection:bg-zinc-900 selection:text-white">
      {/* Soft Ambient Light Glow Overlay */}
      <div className="absolute inset-0 bg-radial-[circle_at_center_top] from-white/30 via-transparent to-transparent pointer-events-none" />

      {/* Top Header Center Branding */}
      <header className="w-full text-center relative z-10 pt-2 sm:pt-4 mb-4 sm:mb-6">
        <span className="text-[12px] sm:text-xs font-bold tracking-[0.28em] text-zinc-900 uppercase block mb-1">
          N E X U S &nbsp; F O C U S
        </span>
        <span className="text-[11px] sm:text-xs font-medium text-zinc-500 tracking-wider block">
          Sua Rotina mais inteligente
        </span>
      </header>

      {/* Dual Card Main Container */}
      <main className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 relative z-10 my-auto items-stretch">

        {/* ================= LEFT CARD: Feature & Value Showcase ================= */}
        <section className="lg:col-span-7 bg-white/85 backdrop-blur-2xl border border-white/90 rounded-[32px] p-6 sm:p-8 lg:p-9 shadow-[0_20px_50px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] flex flex-col justify-between relative overflow-hidden">
          {/* Subtle ambient light glow inside card */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-gradient-to-br from-indigo-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-gradient-to-tl from-emerald-500/10 via-blue-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            {/* Top Bar: Brand + Pill Badge */}
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-2xl border border-zinc-200/80 shadow-[0_4px_16px_rgba(0,0,0,0.06)] flex items-center justify-center shrink-0">
                  <NexusFocusLogo className="w-7 h-7" variant="dark" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black tracking-[0.25em] text-zinc-950 uppercase">
                      NEXUS FOCUS
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-[10px] font-bold tracking-wide">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      PLANO PRO
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-500 font-medium tracking-wide block">
                    Sistema Operacional de Alta Performance
                  </span>
                </div>
              </div>

              {/* Tag de Exclusividade */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 text-white text-[11px] font-semibold shadow-sm">
                <Sparkles size={12} className="text-amber-400" />
                <span>Acesso Ilimitado</span>
              </div>
            </div>

            {/* Headline Principal */}
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-extrabold text-zinc-950 tracking-tight leading-[1.18] mb-2.5">
                Domine sua rotina com o poder do{' '}
                <span className="bg-gradient-to-r from-zinc-950 via-zinc-800 to-zinc-600 bg-clip-text text-transparent underline decoration-amber-400/70 decoration-wavy decoration-1 underline-offset-4">
                  Hiperfoco & IA
                </span>
                .
              </h1>
              <p className="text-zinc-600 text-xs sm:text-[13.5px] leading-relaxed max-w-xl">
                O único ambiente integrado que une gestão de tarefas, disciplina diária, controle financeiro completo e um mentor com inteligência artificial ativo no seu WhatsApp.
              </p>
            </div>

            {/* Bento Grid: 4 Grandes Pilares do Nexus Focus */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5 mb-5">
              {/* Card 1: Foco & Deep Work */}
              <div className="p-4 rounded-2xl bg-white/70 hover:bg-white/95 border border-zinc-200/70 hover:border-amber-300/60 transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.02)] group">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Flame size={18} strokeWidth={2.2} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/50">
                    Deep Work
                  </span>
                </div>
                <h2 className="text-sm font-bold text-zinc-900 mb-1 group-hover:text-amber-700 transition-colors">
                  Modo Hiperfoco & Áudios
                </h2>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Timeboxing imersivo, bloqueio de distrações e frequências binaurais para fluir nas tarefas críticas.
                </p>
              </div>

              {/* Card 2: Mentor IA no WhatsApp */}
              <div className="p-4 rounded-2xl bg-white/70 hover:bg-white/95 border border-zinc-200/70 hover:border-indigo-300/60 transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.02)] group">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Brain size={18} strokeWidth={2.2} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/50">
                    24/7 Ativo
                  </span>
                </div>
                <h2 className="text-sm font-bold text-zinc-900 mb-1 group-hover:text-indigo-700 transition-colors">
                  Mentor IA no WhatsApp
                </h2>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Envie áudios ou textos: sua IA agenda prioridades, registra gastos e orienta suas decisões diárias.
                </p>
              </div>

              {/* Card 3: Inteligência Financeira */}
              <div className="p-4 rounded-2xl bg-white/70 hover:bg-white/95 border border-zinc-200/70 hover:border-emerald-300/60 transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.02)] group">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <TrendingUp size={18} strokeWidth={2.2} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/50">
                    Gestão 360°
                  </span>
                </div>
                <h2 className="text-sm font-bold text-zinc-900 mb-1 group-hover:text-emerald-700 transition-colors">
                  Finanças & Caixinhas
                </h2>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Controle orçamentos, metas patrimoniais e gráficos de gastos com análise automática do seu padrão.
                </p>
              </div>

              {/* Card 4: Hábitos & Consistência */}
              <div className="p-4 rounded-2xl bg-white/70 hover:bg-white/95 border border-zinc-200/70 hover:border-blue-300/60 transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.02)] group">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Target size={18} strokeWidth={2.2} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/50">
                    Evolução
                  </span>
                </div>
                <h2 className="text-sm font-bold text-zinc-900 mb-1 group-hover:text-blue-700 transition-colors">
                  Rotina & Hábitos de Sucesso
                </h2>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Score de disciplina, relatórios executivos de desempenho e rastreamento contínuo de consistência.
                </p>
              </div>
            </div>

            {/* Social Proof Strip */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-zinc-50/90 via-white to-zinc-50/90 border border-zinc-200/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {/* Overlapping User Avatars */}
                <div className="flex -space-x-2 shrink-0">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                    JP
                  </div>
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                    ML
                  </div>
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-400 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                    CS
                  </div>
                  <div className="w-7 h-7 rounded-full bg-zinc-900 border-2 border-white flex items-center justify-center text-[10px] font-extrabold text-amber-300 shadow-sm">
                    +12k
                  </div>
                </div>

                <div className="text-xs">
                  <div className="flex items-center gap-1 text-amber-500 mb-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={12} className="fill-amber-400 text-amber-400" />
                    ))}
                    <span className="font-extrabold text-zinc-900 text-xs ml-1">4.9/5</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 font-medium">
                    Aprovado por mais de 12.000 profissionais e líderes
                  </p>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-1.5 text-[11px] text-zinc-500 font-medium bg-white px-2.5 py-1 rounded-lg border border-zinc-200/60 shrink-0">
                <CheckCircle2 size={13} className="text-emerald-500" />
                <span>Atualizado semanalmente</span>
              </div>
            </div>
          </div>

          {/* Bottom Trust & Guarantee Row */}
          <div className="border-t border-zinc-200/80 pt-5 mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 relative z-10">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 shrink-0">
                <ShieldCheck size={16} strokeWidth={2.2} />
              </div>
              <div>
                <strong className="block text-xs font-bold text-zinc-900">7 Dias de Garantia</strong>
                <span className="text-[11px] text-zinc-500 leading-snug block">
                  Risco zero: devolução integral sem perguntas.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-700 border border-blue-500/20 shrink-0">
                <Lock size={16} strokeWidth={2.2} />
              </div>
              <div>
                <strong className="block text-xs font-bold text-zinc-900">Segurança Bancária</strong>
                <span className="text-[11px] text-zinc-500 leading-snug block">
                  Criptografia 256-bit processada pelo Mercado Pago.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-700 border border-amber-500/20 shrink-0">
                <Zap size={16} strokeWidth={2.2} />
              </div>
              <div>
                <strong className="block text-xs font-bold text-zinc-900">Ativação Imediata</strong>
                <span className="text-[11px] text-zinc-500 leading-snug block">
                  Acesso liberado no mesmo segundo da confirmação.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ================= RIGHT CARD: Checkout & Plan Selection (3D FLIP) ================= */}
        <div className="lg:col-span-5 perspective-[1000px] relative w-full h-full flex flex-col">
          <div className={`w-full h-full transition-transform duration-700 [transform-style:preserve-3d] relative ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
            
            {/* ================= FRONT FACE ================= */}
            <section className="[backface-visibility:hidden] bg-white/85 backdrop-blur-xl border border-white/90 rounded-[32px] p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] flex flex-col justify-between h-full relative z-10 min-h-[580px]">
              <div>
                {/* Top User Session Bar */}
                <div className="flex items-center justify-between pb-4 border-b border-zinc-200/80 mb-5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-600 shrink-0">
                      <User size={15} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] sm:text-[11px] text-zinc-400 block leading-tight">
                        Conectado como
                      </span>
                      <span className="text-xs font-semibold text-zinc-900 truncate block leading-tight">
                        {currentUser?.email || 'Usuário Nexus'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={logout}
                    className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors px-2 py-1 rounded-md cursor-pointer shrink-0"
                  >
                    Sair
                  </button>
                </div>

                {/* Plan Header */}
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="w-12 h-12 bg-white/95 rounded-2xl border border-zinc-200/80 shadow-sm flex items-center justify-center shrink-0">
                    <NexusFocusLogo className="w-7 h-7" variant="dark" />
                  </div>
                  <div>
                    <h2 className="text-xs sm:text-sm font-black tracking-wider text-zinc-950 uppercase">
                      NEXUS FOCUS
                    </h2>
                    <span className="text-[11px] text-zinc-400 font-medium block">
                      powered by Nexus Flow
                    </span>
                  </div>
                </div>

                {/* Pricing Highlight Card */}
                <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4 sm:p-4.5 flex justify-between items-center mb-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                  <div>
                    <span className="text-[11px] font-black text-zinc-900 tracking-wider uppercase block mb-0.5">
                      PLANO MENSAL
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      Renovação corporativa flexível
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl sm:text-[26px] font-black text-zinc-950 tracking-tight">
                      {couponApplied ? 'R$ 14,90' : 'R$ 19,90'}
                    </span>
                    <span className="text-xs text-zinc-500 font-medium">/mês</span>
                  </div>
                </div>

                {/* Plan Guarantees Checklist */}
                <div className="space-y-3 mb-6">
                  {planGuarantees.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 text-xs sm:text-[13px] text-zinc-700 font-medium">
                      <CheckCircle2 size={16} className="text-zinc-800 shrink-0" strokeWidth={2} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                {/* Coupon Section */}
                <div className="mb-5">
                  {!showCouponInput ? (
                    <button
                      onClick={() => setShowCouponInput(true)}
                      className="w-full flex items-center justify-between text-xs text-zinc-600 hover:text-zinc-900 font-medium py-1 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Tag size={14} className="text-zinc-400" />
                        <span>Tem um cupom de desconto?</span>
                      </div>
                      <span className="text-zinc-500 hover:underline">Adicionar &gt;</span>
                    </button>
                  ) : (
                    <form onSubmit={handleApplyCoupon} className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Código do cupom"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          className="flex-1 px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-400 uppercase font-semibold text-zinc-800"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 text-xs font-bold bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 cursor-pointer"
                        >
                          Aplicar
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowCouponInput(false); setCouponError(''); }}
                          className="p-2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      {couponError && <p className="text-[11px] text-rose-500">{couponError}</p>}
                      {couponApplied && <p className="text-[11px] text-emerald-600 font-semibold">✓ Cupom aplicado com sucesso!</p>}
                    </form>
                  )}
                </div>

                {/* Error Message */}
                {errorMessage && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-start gap-2">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Status Feedback */}
                {statusFeedback && (
                  <div className="mb-4 p-3 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs flex items-start justify-between gap-2">
                    <span>{statusFeedback}</span>
                    <button onClick={() => setStatusFeedback(null)} className="text-zinc-400 hover:text-zinc-600">
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>

              {/* Bottom Actions of Right Card */}
              <div className="mt-auto pt-4">
                {/* TODO: Certifique-se de substituir a chave/variável de ambiente do Stripe (ex: STRIPE_PRICE_ID / NEXT_PUBLIC_STRIPE_PRICE_ID / VITE_STRIPE_PRICE_ID) pelo novo ID correspondente ao plano de R$ 19,90 gerado no painel do Stripe */}
                {/* Primary Action Button - Avança para o Swipe Card nativo de pagamento */}
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full bg-[#18181b] hover:bg-[#27272a] text-white font-bold py-3.5 sm:py-4 px-5 rounded-2xl shadow-[0_6px_20px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.18)] transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed mb-3.5"
                >
                  <Lock size={15} className="text-white" />
                  <span className="text-[14px] sm:text-base font-bold">Desbloquear Acesso Agora</span>
                  <ArrowRight size={15} className="text-white" />
                </button>

                {/* Security Guarantee & Status Refresh */}
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                    <ShieldCheck size={13} className="text-zinc-400" />
                    <span>Pagamento 100% criptografado e seguro</span>
                  </div>
                  
                  <p className="text-[10px] text-zinc-400 text-center max-w-[250px] mb-1">
                    Ao prosseguir, você concorda com nossa{' '}
                    <Link to="/privacidade" target="_blank" className="underline hover:text-zinc-600 transition-colors">Política de Privacidade</Link>
                  </p>

                  <button
                    onClick={handleRefreshStatus}
                    disabled={isCheckingStatus}
                    className="text-xs text-zinc-500 hover:text-zinc-900 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw size={12} className={isCheckingStatus ? "animate-spin text-zinc-700" : "text-zinc-400"} />
                    <span>Já realizou o pagamento? Atualizar status</span>
                  </button>
                </div>
              </div>
            </section>

            {/* ================= BACK FACE: Swipe Card de Pagamento Mercado Pago ================= */}
            <section className="[backface-visibility:hidden] [transform:rotateY(180deg)] absolute inset-0 glass-card bg-white/95 dark:bg-zinc-950/90 backdrop-blur-2xl border border-white/90 dark:border-zinc-800/80 rounded-[32px] p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.04)] flex flex-col h-full z-20 overflow-hidden">
              
              {/* Header with Back Button */}
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-zinc-200/80 dark:border-zinc-800/80 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center shadow-sm shrink-0">
                    <Lock size={14} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white leading-tight">
                      Pagamento Seguro
                    </h3>
                    <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400">
                      Plano Mensal • {couponApplied ? 'R$ 14,90' : 'R$ 19,90'}/mês
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleBack}
                  className="text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white text-xs font-bold bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 border border-zinc-200/60 dark:border-zinc-700/60 active:scale-95"
                  title="Voltar ao resumo do plano"
                >
                  <ArrowRight size={14} className="rotate-180" />
                  <span>Voltar</span>
                </button>
              </div>

              {/* Resumo do Pedido / Badge do Swipe Card */}
              <div className="mb-3 px-3.5 py-2.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/80 flex items-center justify-between text-xs shrink-0">
                <span className="text-zinc-500 font-medium">Total da assinatura:</span>
                <span className="text-zinc-950 dark:text-white font-extrabold text-sm">
                  {couponApplied ? 'R$ 14,90' : 'R$ 19,90'}
                  <span className="text-[10px] font-normal text-zinc-400 ml-1">/ mês</span>
                </span>
              </div>

              {/* Mensagem de Erro de Validação/Gateway */}
              {errorMessage && (
                <div className="mb-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0 text-red-600 dark:text-red-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Brick do Mercado Pago integrado ao Glass-Card */}
              <div className="mercado-pago-brick-container flex-1 overflow-y-auto px-1 -mx-1 pb-4 relative min-h-[340px]">
                {/* Skeleton Loader elegante enquanto o Mercado Pago carrega os scripts externos */}
                {!isBrickReady && !brickError && (
                  <div className="w-full space-y-3 pt-2 animate-pulse" aria-label="Carregando formulário de pagamento">
                    <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2">
                      <Loader2 size={14} className="animate-spin text-zinc-700 dark:text-zinc-300" />
                      <span>Carregando formulário seguro do Mercado Pago...</span>
                    </div>
                    {/* Campo Número do Cartão */}
                    <div className="space-y-1.5">
                      <div className="h-3 w-28 bg-zinc-200 dark:bg-zinc-800 rounded" />
                      <div className="h-11 w-full bg-zinc-100 dark:bg-zinc-800/70 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl" />
                    </div>
                    {/* Campos Validade e CVV lado a lado */}
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
                    {/* Campo Nome do Titular */}
                    <div className="space-y-1.5">
                      <div className="h-3 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
                      <div className="h-11 w-full bg-zinc-100 dark:bg-zinc-800/70 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl" />
                    </div>
                    {/* Botão de pagamento */}
                    <div className="h-12 w-full bg-zinc-200/90 dark:bg-zinc-800 rounded-xl mt-4" />
                  </div>
                )}

                {/* Componente CardPayment do SDK React do Mercado Pago */}
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

                {brickError && (
                  <div className="mt-4 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                    <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                    <div className="flex-1">
                      <p className="font-semibold">{brickError}</p>
                      <p className="mt-0.5 text-[11px] opacity-90">Verifique os dados informados ou tente recarregar o formulário.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setBrickError(null);
                          setIsBrickReady(false);
                        }}
                        className="mt-2 text-xs font-bold text-amber-900 dark:text-amber-200 underline cursor-pointer"
                      >
                        Recarregar formulário
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {loading && (
                <div className="absolute inset-0 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-sm flex flex-col items-center justify-center rounded-[32px] gap-3 z-30">
                  <Loader2 size={32} className="animate-spin text-zinc-900 dark:text-white" />
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white">Processando assinatura segura...</p>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}