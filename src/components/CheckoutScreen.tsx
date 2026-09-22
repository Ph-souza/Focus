import React, { useState } from 'react';
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
  Loader2
} from 'lucide-react';
import { useAuth, isWhitelistedPro } from '../contexts/AuthContext';
import { NexusFocusLogo } from './AuraLogo';
import { getApiUrl } from '../lib/api';

// Varredura e reaproveitamento de chaves públicas configuradas do Mercado Pago
const MP_PUBLIC_KEY =
  (import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY as string) ||
  (import.meta.env.NEXT_PUBLIC_MP_PUBLIC_KEY as string) ||
  (import.meta.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY as string) ||
  (import.meta.env.VITE_MP_PUBLIC_KEY as string) ||
  (import.meta.env.MP_PUBLIC_KEY as string) ||
  '';

// Inicializa o SDK do Mercado Pago com a chave pública existente
if (MP_PUBLIC_KEY) {
  initMercadoPago(MP_PUBLIC_KEY, {
    locale: 'pt-BR'
  });
}

export function CheckoutScreen() {
  const { currentUser, isPremium, logout } = useAuth();
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState('');

  const userEmail = (currentUser?.email || currentUser?.providerData?.[0]?.email || '').trim().toLowerCase();
  const hasAccess = isPremium || isWhitelistedPro(userEmail);

  // Redirecionamento automático se já for Pro
  if (hasAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  const initialization = {
    amount: couponApplied ? 14.90 : 19.90, // Valor da mensalidade Pro atualizado para R$ 19,90
    auto_recurring: {
      frequency: 1,
      frequency_type: 'months',
    },
  };

  const customization = {
    paymentMethods: {
      creditCard: 'all',
      maxInstallments: 1,
    },
    visual: {
      style: {
        theme: 'default' as const,
        customVariables: {
          baseColor: '#18181b',
          formBackgroundColor: 'transparent',
          inputBackgroundColor: '#ffffff',
          inputBorderColor: '#e4e4e7',
          inputFocusedBorderColor: '#18181b',
          borderRadius: '14px',
        },
      },
    },
  };

  // Fluxo de Pagamento Interno (Swipe Card):
  // Dispara o avanço nativo da interface para o card deslizante de preenchimento dos dados do cartão,
  // sem qualquer redirecionamento externo ou window.location.href.
  const handleCheckout = () => {
    setErrorMessage('');
    setIsFlipped(true);
  };

  const onSubmit = async (formData: any) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const response = await fetch(getApiUrl('/api/subscriptions'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: formData.token,
          email: currentUser?.email || userEmail,
          userId: currentUser?.uid,
          paymentMethodId: formData.payment_method_id,
          issuerId: formData.issuer_id,
          installments: formData.installments,
          coupon: couponApplied ? couponCode : undefined,
          amount: couponApplied ? 14.90 : 19.90, // R$ 19,90 mensal
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
        <section className="lg:col-span-7 bg-white/80 backdrop-blur-xl border border-white/90 rounded-[32px] p-6 sm:p-8 lg:p-9 shadow-[0_20px_50px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            {/* Left Card Header with Logo */}
            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-13 h-13 sm:w-14 sm:h-14 bg-white/95 rounded-2xl border border-white shadow-[0_4px_16px_rgba(0,0,0,0.05)] flex items-center justify-center shrink-0">
                <NexusFocusLogo className="w-8 h-8 sm:w-9 sm:h-9" variant="dark" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm font-extrabold tracking-[0.25em] text-zinc-950 uppercase">
                  NEXUS FOCUS
                </span>
                <span className="text-[11px] sm:text-xs text-zinc-500 font-medium tracking-wide">
                  Sua Rotina mais inteligente
                </span>
              </div>
            </div>

            {/* Split Content: Text & Checklist on Left | Pedestal on Right */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">

              {/* Text & Checklist */}
              <div className="md:col-span-7 flex flex-col justify-center">
                <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-extrabold text-zinc-950 tracking-tight leading-[1.15] mb-3">
                  Eleve seu Foco<br />e Gestão
                </h1>
                <p className="text-zinc-600 text-xs sm:text-[13px] leading-relaxed mb-6">
                  Organize sua vida, cumpra seus objetivos e conquiste mais com a ajuda da inteligência artificial.
                </p>

                {/* 5 Bullet Features */}
                <div className="space-y-3">
                  {benefits.map((b, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-zinc-300/80 flex items-center justify-center text-zinc-800 shrink-0 mt-0.5">
                        <Check size={11} strokeWidth={3} />
                      </div>
                      <span className="text-zinc-700 text-xs sm:text-[13px] font-medium leading-tight">
                        {b}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pedestal Graphic & Motto */}
              <div className="md:col-span-5 flex flex-col items-center justify-center text-center mt-4 md:mt-0">
                <div className="relative w-full max-w-[240px] sm:max-w-[260px] flex items-center justify-center">
                  <img
                    src="/checkout-pedestal.png"
                    alt="Nexus Focus - Mais foco, controle e resultados"
                    className="w-full object-contain drop-shadow-sm select-none pointer-events-none"
                  />
                </div>
                <div className="mt-3">
                  <p className="text-zinc-500 text-[10px] sm:text-[11px] font-bold tracking-[0.25em] uppercase leading-relaxed">
                    DISCIPLINA HOJE.<br />LIBERDADE SEMPRE.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Trust Metrics Row */}
          <div className="border-t border-zinc-200/80 pt-6 mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-zinc-100/80 text-zinc-800 shrink-0">
                <Shield size={18} strokeWidth={1.75} />
              </div>
              <div>
                <strong className="block text-xs font-bold text-zinc-900">100% seguro</strong>
                <span className="text-[11px] text-zinc-500 leading-tight block">
                  Seus dados protegidos com criptografia de ponta.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-zinc-100/80 text-zinc-800 shrink-0">
                <Users size={18} strokeWidth={1.75} />
              </div>
              <div>
                <strong className="block text-xs font-bold text-zinc-900">+10 mil usuários</strong>
                <span className="text-[11px] text-zinc-500 leading-tight block">
                  Mais foco, organização e resultados todos os dias.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-zinc-100/80 text-zinc-800 shrink-0">
                <Star size={18} strokeWidth={1.75} />
              </div>
              <div>
                <strong className="block text-xs font-bold text-zinc-900">4,9 de 5</strong>
                <span className="text-[11px] text-zinc-500 leading-tight block">
                  Usuários recomendam o Nexus Focus.
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
                  onClick={() => setIsFlipped(false)}
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

              {/* Brick do Cartão Mercado Pago integrado ao Glass-Card */}
              <div className="mercado-pago-brick-container flex-1 overflow-y-auto px-1 -mx-1 pb-4">
                <CardPayment
                  initialization={initialization}
                  customization={customization}
                  onSubmit={onSubmit}
                  onReady={() => {
                    console.log("Mercado Pago CardPayment carregado no Swipe Card.");
                  }}
                  onError={(error: any) => {
                    console.error("Erro no formulário de pagamento:", error);
                  }}
                />
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