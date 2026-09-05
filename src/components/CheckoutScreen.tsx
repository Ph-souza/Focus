import React, { useState } from 'react';
import { initMercadoPago, CardPayment } from '@mercadopago/sdk-react';
import { useAuth } from '../contexts/AuthContext';

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
    amount: 29.90, // Valor da sua mensalidade
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
      const response = await fetch('https://nexus-focus.onrender.com/api/subscriptions', {
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
      setErrorMessage(err.message || 'Falha ao autorizar o pagamento. Verifique os dados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#121216] border border-[#27272a] rounded-2xl p-6 shadow-2xl relative">

        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-6">
          <span className="text-sm text-zinc-400">Conectado como <strong className="text-white">{currentUser?.email}</strong></span>
          <button onClick={logout} className="text-xs text-red-400 hover:underline">Sair</button>
        </div>

        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center mx-auto mb-3 border border-amber-500/20 text-xl font-bold">👑</div>
          <h1 className="text-2xl font-bold mb-2">Desbloqueie o Nexus Focus Pro</h1>
          <p className="text-sm text-zinc-400">Assinatura recorrente mensal com acesso ilimitado a todas as ferramentas e IA.</p>
        </div>

        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 mb-6 flex justify-between items-center">
          <div>
            <span className="text-xs text-amber-400 font-semibold uppercase tracking-wider">Plano Pro Mensal</span>
            <p className="text-sm text-zinc-300">Renovação automática</p>
          </div>
          <div className="text-right">
            <span className="text-xl font-extrabold text-white">R$ 29,90</span>
            <span className="text-xs text-zinc-400">/mês</span>
          </div>
        </div>

        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg mb-4 text-center">
            {errorMessage}
          </div>
        )}

        {/* Botão Principal que dispara o Popup/Modal */}
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={loading}
          className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 mb-4"
        >
          <span>🔒 Assinar com Cartão de Crédito</span>
        </button>

        <div className="text-center">
          <a
            href="/dashboard"
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Já fez o pagamento? Atualizar status
          </a>
        </div>
      </div>

      {/* Modal / Popup do Checkout Bricks */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#121216] border border-[#27272a] w-full max-w-lg rounded-2xl p-6 relative shadow-2xl animate-in fade-in zoom-in duration-200">

            <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#27272a]">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <span>💳 Pagamento Seguro Mercado Pago</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white text-sm font-bold bg-[#18181b] px-3 py-1 rounded-lg border border-[#27272a]"
              >
                ✕ Fechar
              </button>
            </div>

            {/* O Brick do Cartão renderizado dentro da Janela Flutuante */}
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
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center rounded-2xl gap-3">
                <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-medium text-amber-400">Processando assinatura segura...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}