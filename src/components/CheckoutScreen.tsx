import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { initMercadoPago, CardPayment } from '@mercadopago/sdk-react';
import { 
  Crown, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  LogOut, 
  RefreshCw, 
  Zap, 
  Lock,
  MessageCircle,
  TrendingUp,
  BrainCircuit,
  CreditCard,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function CheckoutScreen() {
  const { currentUser, isPremium, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);

  // Inicializar SDK do Mercado Pago com a Public Key do ambiente
  const mpPublicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY || import.meta.env.VITE_MP_PUBLIC_KEY || '';

  useEffect(() => {
    if (mpPublicKey) {
      initMercadoPago(mpPublicKey, { locale: 'pt-BR' });
    }
  }, [mpPublicKey]);

  // 1. Se não houver currentUser: redireciona para /login
  if (!isLoading && !currentUser) {
    return <Navigate to="/login" replace />;
  }

  // 2. Se já for premium: redireciona para /dashboard
  if (!isLoading && isPremium) {
    return <Navigate to="/dashboard" replace />;
  }

  const getApiUrl = () => {
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      return 'http://localhost:3000';
    }
    return '';
  };

  const handleCardSubmit = async (formData: any) => {
    setIsProcessing(true);
    setPaymentError(null);
    setPaymentSuccess(null);

    try {
      const cardToken = formData.token;
      if (!cardToken) {
        throw new Error('Não foi possível gerar o token de segurança do cartão.');
      }

      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: cardToken,
          email: currentUser?.email,
          userId: currentUser?.uid,
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Não foi possível autorizar a assinatura com este cartão.');
      }

      setPaymentSuccess('Assinatura recorrente aprovada com sucesso! Liberando seu acesso Pro...');

      // O AuthContext com listener em tempo real atualizará isPremium automaticamente
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err: any) {
      console.error('Erro na submissão da assinatura:', err);
      setPaymentError(err?.message || 'Erro ao processar assinatura recorrente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRefreshStatus = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  const fallbackCheckoutUrl = import.meta.env.VITE_CHECKOUT_URL || '';

  const benefits = [
    {
      icon: <BrainCircuit className="w-5 h-5 text-amber-400" />,
      title: 'Mentor IA Exclusivo',
      description: 'Inteligência artificial personalizada para orientar sua rotina e tomada de decisões.'
    },
    {
      icon: <TrendingUp className="w-5 h-5 text-emerald-400" />,
      title: 'Gestão Financeira com IA',
      description: 'Categorização inteligente de gastos, metas e projeção automática de fluxo.'
    },
    {
      icon: <Zap className="w-5 h-5 text-orange-400" />,
      title: 'Modo Foco Profundo',
      description: 'Ambiente imersivo para bloquear distrações e maximizar seu rendimento diário.'
    },
    {
      icon: <MessageCircle className="w-5 h-5 text-green-400" />,
      title: 'Integração com WhatsApp',
      description: 'Lance tarefas e despesas em segundos diretamente por mensagens de áudio ou texto.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col justify-center items-center px-4 py-10 relative overflow-hidden selection:bg-amber-500 selection:text-black">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-amber-500/10 via-orange-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-xl relative z-10"
      >
        {/* User Account Bar */}
        <div className="mb-6 flex items-center justify-between px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3">
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.displayName || 'Avatar'}
                className="w-9 h-9 rounded-full border border-amber-500/30 object-cover"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-sm">
                {(currentUser?.displayName || currentUser?.email || 'U')[0].toUpperCase()}
              </div>
            )}
            <div className="text-left">
              <p className="text-xs text-zinc-400">Conectado como</p>
              <p className="text-sm font-semibold text-white truncate max-w-[200px] sm:max-w-[280px]">
                {currentUser?.displayName || currentUser?.email}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-red-500/10 hover:text-red-400 text-zinc-400 text-xs font-medium transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        </div>

        {/* Paywall Container */}
        <div className="bg-zinc-900/80 border border-amber-500/30 rounded-3xl p-6 sm:p-10 backdrop-blur-2xl shadow-[0_25px_60px_rgba(0,0,0,0.6)] text-center relative overflow-hidden">
          {/* Subtle Top Accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500" />

          {/* Premium Lock Icon */}
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/40 flex items-center justify-center mb-6 shadow-inner shadow-amber-500/10">
            <Crown className="w-8 h-8 text-amber-400" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-3">
            <Lock className="w-3 h-3" />
            Acesso Restrito para Assinantes
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 tracking-tight">
            Desbloqueie o Nexus Focus Pro
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base max-w-md mx-auto mb-6">
            Assinatura recorrente mensal com acesso ilimitado a todas as ferramentas e mentorias com IA.
          </p>

          {/* Pricing Highlight */}
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/[0.07] border border-amber-500/25 flex items-center justify-between">
            <div className="text-left">
              <span className="text-xs text-amber-300 font-semibold uppercase tracking-wider">Plano Pro Mensal</span>
              <p className="text-xs text-zinc-400 mt-0.5">Renovação automática • Cancele quando quiser</p>
            </div>
            <div className="text-right">
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-semibold text-zinc-400">R$</span>
                <span className="text-2xl sm:text-3xl font-black text-white">29,90</span>
                <span className="text-xs text-zinc-400">/mês</span>
              </div>
            </div>
          </div>

          {/* Feature List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 text-left">
            {benefits.map((b, i) => (
              <div
                key={i}
                className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-start gap-3 hover:bg-white/[0.04] transition-colors"
              >
                <div className="p-2 rounded-xl bg-white/[0.04] shrink-0">
                  {b.icon}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">{b.title}</h3>
                  <p className="text-[11px] text-zinc-400 leading-snug mt-0.5">{b.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Checkout Bricks Form */}
          {mpPublicKey ? (
            <div className="text-left bg-black/40 border border-white/[0.08] rounded-2xl p-4 sm:p-6 mb-6">
              <div className="flex items-center justify-between mb-4 border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-400" />
                  <span className="text-xs sm:text-sm font-semibold text-white">Assinar com Cartão de Crédito</span>
                </div>
                <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-medium">
                  Mercado Pago Seguro
                </span>
              </div>

              {/* Feedback messages */}
              {paymentError && (
                <div className="mb-4 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{paymentError}</span>
                </div>
              )}

              {paymentSuccess && (
                <div className="mb-4 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{paymentSuccess}</span>
                </div>
              )}

              {isProcessing && (
                <div className="mb-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center gap-3 text-amber-300 text-sm font-medium">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processando tokenização e assinatura recorrente no Mercado Pago...</span>
                </div>
              )}

              {/* Mercado Pago CardPayment Brick */}
              <div id="cardPaymentBrick_container" className="mercado-pago-brick-dark">
                <CardPayment
                  initialization={{
                    amount: 29.90,
                    payer: {
                      email: currentUser?.email || '',
                    }
                  }}
                  customization={{
                    paymentMethods: {
                      minInstallments: 1,
                      maxInstallments: 1,
                    },
                    visual: {
                      style: {
                        theme: 'dark',
                        customVariables: {
                          baseColor: '#f59e0b',
                          baseColorSecondary: '#d97706',
                        }
                      }
                    }
                  }}
                  onSubmit={handleCardSubmit}
                  onError={(error) => {
                    console.error('[CardPayment Brick Error]:', error);
                    setPaymentError('Ocorreu um erro ao carregar o formulário de pagamento. Verifique os dados ou tente novamente.');
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="mb-6 p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-left">
              <div className="flex items-center gap-2 text-amber-300 font-semibold text-sm mb-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>Configuração de Chave do Mercado Pago</span>
              </div>
              <p className="text-xs text-zinc-300 mb-4">
                Adicione a variável <code className="bg-black/40 px-1.5 py-0.5 rounded text-amber-300 font-mono">VITE_MERCADOPAGO_PUBLIC_KEY</code> no arquivo <code className="bg-black/40 px-1.5 py-0.5 rounded text-zinc-300 font-mono">.env</code> para exibir o formulário de cartão Checkout Bricks.
              </p>

              {fallbackCheckoutUrl && (
                <button
                  onClick={() => window.open(fallbackCheckoutUrl, '_blank', 'noopener,noreferrer')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold text-sm hover:scale-[1.01] transition-transform"
                >
                  <span>Abrir Link de Checkout Alternativo</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Verification / Refresh */}
          <div className="mt-2 flex flex-col sm:flex-row items-center justify-center gap-3 text-xs text-zinc-400">
            <button
              onClick={handleRefreshStatus}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-amber-400 transition-colors py-1 px-2.5 rounded-lg hover:bg-white/[0.03]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
              <span>{isRefreshing ? 'Verificando...' : 'Já fez o pagamento? Atualizar status'}</span>
            </button>
          </div>

          {/* Security guarantee */}
          <div className="mt-6 pt-5 border-t border-white/[0.06] flex items-center justify-center gap-2 text-zinc-500 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Garantia de 7 dias ou seu dinheiro de volta. Pagamento 100% criptografado pelo Mercado Pago.</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
