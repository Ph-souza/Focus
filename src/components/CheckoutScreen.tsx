import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
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
  BrainCircuit
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AuraLogo } from './AuraLogo';

export function CheckoutScreen() {
  const { currentUser, isPremium, isLoading, logout } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 1. Se não houver currentUser: redireciona para /login
  if (!isLoading && !currentUser) {
    return <Navigate to="/login" replace />;
  }

  // 2. Se já for premium: redireciona para /dashboard
  if (!isLoading && isPremium) {
    return <Navigate to="/dashboard" replace />;
  }

  const checkoutUrl = import.meta.env.VITE_CHECKOUT_URL || 'https://buy.stripe.com/exemplo_nexus_focus';

  const handleOpenCheckout = () => {
    window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
  };

  const handleRefreshStatus = () => {
    setIsRefreshing(true);
    // Recarrega a página ou dispara verificação
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

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

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 tracking-tight">
            Desbloqueie o Poder Total do Nexus Focus
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base max-w-md mx-auto mb-8">
            O aplicativo opera com acesso 100% exclusivo. Torne-se membro Pro para liberar o painel completo.
          </p>

          {/* Feature List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-8 text-left">
            {benefits.map((b, i) => (
              <div
                key={i}
                className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-start gap-3 hover:bg-white/[0.04] transition-colors"
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

          {/* Primary CTA Checkout Button */}
          <button
            onClick={handleOpenCheckout}
            className="w-full relative group overflow-hidden rounded-2xl p-[1px] focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-900 transition-all duration-300 hover:scale-[1.02] active:scale-[0.99] shadow-xl shadow-amber-500/20"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-2xl" />
            <div className="relative flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 font-bold text-black text-base tracking-wide">
              <span>Desbloquear Acesso Agora</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Verification / Refresh */}
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3 text-xs text-zinc-400">
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
            <span>Garantia de 7 dias ou seu dinheiro de volta. Pagamento 100% criptografado.</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
