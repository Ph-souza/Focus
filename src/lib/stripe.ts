import { getApiUrl } from './api';

export interface StripeCheckoutParams {
  userId: string;
  email?: string;
}

export interface StripeCheckoutResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Dispara a criação de uma sessão do Stripe Checkout com client_reference_id e metadata
 * para garantir que o webhook vincule a assinatura ao UID do Firebase sem criar assinaturas órfãs.
 */
export async function createStripeCheckoutSession({
  userId,
  email
}: StripeCheckoutParams): Promise<StripeCheckoutResult> {
  try {
    const response = await fetch(getApiUrl('/api/stripe/create-checkout-session'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        email
      })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.warn('API Stripe retornou resposta não sucedida, aplicando fallback gracioso:', data);
      return {
        success: false,
        url: `/checkout?userId=${encodeURIComponent(userId)}&intent=checkout`,
        error: data.error || 'Falha ao criar sessão Stripe'
      };
    }

    return {
      success: true,
      url: data.url
    };
  } catch (err: any) {
    console.error('Erro ao conectar com endpoint Stripe:', err);
    return {
      success: false,
      url: `/checkout?userId=${encodeURIComponent(userId)}&intent=checkout`,
      error: err?.message || 'Erro de conexão'
    };
  }
}
