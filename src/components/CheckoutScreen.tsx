import React, { useState } from 'react';
import { initMercadoPago, CardPayment } from '@mercadopago/sdk-react';
import { Sparkles, ShieldCheck, Lock, CheckCircle2, ArrowRight, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { NexusFocusLogo } from './AuraLogo';
import { getApiUrl } from '../lib/api';

// Inicializa o SDK com a chave pública do ambiente
initMercadoPago(import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY || '', {
  locale: 'pt-BR'
});

export function CheckoutScreen() {
  const { currentUser, logout } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const initialization = {
    amount: 29.90, // Valor da mensalidade Pro
    auto_recurring: {
      frequency: 1,
      frequency_type: 'months',
    },
  };

  const customization = {
    paymentMethods: {
      creditCard: 'all',
    },
    visual: {
      style: {
        theme: 'dark',
      },
    },
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
          email: currentUser?.email,
          userId: currentUser?.uid,
          paymentMethodId: formData.payment_method_id,
          issuerId: formData.issuer_id,
          installments: formData.installments,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao processar a assinatura.');
      }

      // Sucesso! Redireciona para o dashboard
      window.location.href = '/dashboard';
    } catch (err: any) {
      console.error('Erro no pagamento:', err);
      setErrorMessage(err.message || 'Falha ao autorizar o pagamento. Verifique os dados do cartão.');
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    'Mentor IA com raciocínio financeiro em tempo real',
    'Modo Foco & Timeboxing sincronizado',
    'Gestão ilimitada de Caixinhas, Metas e Orçamento',
    'Integração via WhatsApp com leitura automática de gastos',
    'Sincronização em nuvem e segurança de nível executivo'
  ];

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden selection:bg-white selection:text-black">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-white/[0.02] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[250px] bg-white/[0.01] rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-[#121216] border border-[#27272a] rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.7)] relative z-10">

        {/* Top Session Bar */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#27272a]/60 text-xs">
          <span className="text-zinc-400 truncate max-w-[240px]">
            Conectado como <strong className="text-zinc-200 font-semibold">{currentUser?.email}</strong>
          </span>
          <button 
            onClick={logout} 
            className="text-red-400 hover:text-red-300 font-medium transition-colors cursor-pointer"
          >
            Sair
          </button>
        </div>

        {/* Brand Header */}
        <div className="text-center mb-7 flex flex-col items-center">
          <div className="p-3.5 bg-gradient-to-br from-[#1c1c20] to-[#09090b] border border-white/20 rounded-2xl shadow-xl backdrop-blur-xl mb-3 flex items-center justify-center">
            <NexusFocusLogo className="w-10 h-10" variant="dark" />
          </div>

          <div className="flex flex-col items-center gap-1 mb-2">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-white text-[11px] font-bold tracking-wider uppercase shadow-sm">
              <Sparkles className="w-3 h-3 text-white" />
              Nexus Focus Pro
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-zinc-400">
              FINANÇAS • ORGANIZAÇÃO • TAREFAS
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
            Eleve seu Foco e Gestão
          </h1>
          <p className="text-sm text-zinc-400 max-w-sm leading-relaxed">
            Assinatura corporativa com acesso irrestrito ao ecossistema de alta performance.
          </p>
        </div>

        {/* Plan Value Card */}
        <div className="bg-gradient-to-br from-[#18181b] to-[#121214] border border-white/20 rounded-2xl p-4 sm:p-5 mb-5 shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
          <div>
            <span className="text-[11px] text-zinc-200 font-extrabold uppercase tracking-wider block mb-0.5">
              Plano Pro Mensal
            </span>
            <p className="text-xs text-zinc-400">Renovação corporativa flexível</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-white tracking-tight">R$ 29,90</span>
            <span className="text-xs text-zinc-400">/mês</span>
          </div>
        </div>

        {/* Benefits Checklist */}
        <div className="space-y-2.5 mb-6">
          {benefits.map((b, idx) => (
            <div key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300">
              <CheckCircle2 className="w-4 h-4 text-white shrink-0 mt-0.5" />
              <span className="leading-snug">{b}</span>
            </div>
          ))}
        </div>

        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3.5 rounded-xl mb-4 text-center animate-shake">
            {errorMessage}
          </div>
        )}

        {/* Call to Action Button - High Contrast Monochrome */}
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={loading}
          className="w-full relative group overflow-hidden rounded-xl bg-white hover:bg-zinc-200 text-black font-black py-4 px-4 transition-all shadow-[0_4px_25px_rgba(255,255,255,0.18)] hover:shadow-[0_4px_35px_rgba(255,255,255,0.25)] flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Lock className="w-4 h-4 text-black" />
          <span>Desbloquear Acesso Pro Agora</span>
        </button>

        {/* Security and Refresh status */}
        <div className="mt-4 flex flex-col items-center gap-2">
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
            <span>Pagamento 100% criptografado e seguro</span>
          </div>

          <a
            href="/dashboard"
            className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1 mt-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Já realizou o pagamento? Atualizar status</span>
          </a>
        </div>
      </div>

      {/* Modal / Popup do Checkout Bricks */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#121216] border border-[#27272a] w-full max-w-lg rounded-3xl p-6 sm:p-7 relative shadow-[0_25px_60px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in duration-200">

            <div className="flex justify-between items-center mb-5 pb-3 border-b border-[#27272a]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white">
                  <Lock size={14} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white leading-tight">Pagamento Seguro Mercado Pago</h3>
                  <p className="text-[11px] text-zinc-400">Assinatura Nexus Focus Pro (R$ 29,90/mês)</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white text-xs font-bold bg-[#18181b] hover:bg-[#27272a] px-3 py-1.5 rounded-lg border border-[#27272a] transition-colors cursor-pointer"
              >
                ✕ Fechar
              </button>
            </div>

            {/* Brick do Cartão */}
            <div className="mercado-pago-brick-container">
              <CardPayment
                initialization={initialization}
                customization={customization}
                onSubmit={onSubmit}
                onReady={() => {
                  console.log("Brick de Cartão carregado com sucesso no modal.");
                }}
                onError={(error: any) => {
                  console.error("Erro no Brick:", error);
                }}
              />
            </div>

            {loading && (
              <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center rounded-3xl gap-3 z-20">
                <div className="w-9 h-9 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-semibold text-white">Processando assinatura segura...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}