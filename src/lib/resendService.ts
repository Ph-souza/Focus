/**
 * Módulo de Integração com o Resend para Disparo de E-mails Transacionais
 * 
 * Templates registrados no Resend:
 * 1. Plano ELITE (Vitalício + 3 Bónus) -> ID: a9cae834-76a0-4311-948c-712bde1ec6c7 | Alias: plano-elite
 * 2. Cupão FOCUS50 (50% OFF + 3 Bónus) -> ID: 132b40b0-f443-425e-8225-1e9380ddafd4 | Alias: cupao-focus50
 * 3. Assinatura Standard (Sem bónus)    -> ID: e8de92f0-3fc4-4322-bc40-576d3d8b0cc0 | Alias: assinatura-standard
 */

export const RESEND_TEMPLATES = {
  ELITE: {
    id: 'a9cae834-76a0-4311-948c-712bde1ec6c7',
    alias: 'plano-elite',
    subject: '🎁 Bem-vindo à Elite do Nexus Focus! (Acesso Vitalício + Os teus 3 Bónus)'
  },
  FOCUS50: {
    id: '132b40b0-f443-425e-8225-1e9380ddafd4',
    alias: 'cupao-focus50',
    subject: '🚀 Bem-vindo ao Nexus Focus! (Plano 50% OFF + Os teus 3 Bónus)'
  },
  STANDARD: {
    id: 'e8de92f0-3fc4-4322-bc40-576d3d8b0cc0',
    alias: 'assinatura-standard',
    subject: 'Bem-vindo ao Nexus Focus! A tua assinatura está ativa.'
  }
} as const;

export interface OnboardingEmailPayload {
  to: string;
  name: string;
  plan?: 'mensal' | 'anual' | string;
  coupon?: string | null;
  dashboardUrl?: string;
  whatsappUrl?: string;
  ebookPoderHabitoUrl?: string;
  ebookSutilArteUrl?: string;
  ebookEspertoDiaboUrl?: string;
}

const DEFAULT_LINKS = {
  dashboard: 'https://nexusfocus.web.app/dashboard',
  whatsapp: 'https://wa.me/553190054794?text=Ol%C3%A1!%20Quero%20ativar%20o%20Mentor%20Focus',
  ebookPoderHabito: 'https://nexusfocus.web.app/bonus/o-poder-do-habito.pdf',
  ebookSutilArte: 'https://nexusfocus.web.app/bonus/a-sutil-arte-de-ligar-o-foda-se.pdf',
  ebookEspertoDiabo: 'https://nexusfocus.web.app/bonus/mais-esperto-que-o-diabo.pdf'
};

/**
 * Dispara o e-mail transacional correspondente via API REST do Resend.
 * Pode ser chamado diretamente no backend (Next.js / Express / Webhook Mercado Pago).
 */
export async function sendOnboardingEmail(payload: OnboardingEmailPayload): Promise<{ success: boolean; data?: any; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn('[Resend] AVISO: RESEND_API_KEY não configurada no ambiente.');
    return { success: false, error: 'RESEND_API_KEY não configurada' };
  }

  const normalizedCoupon = (payload.coupon || '').trim().toUpperCase();

  // Seleção automática do template
  let selectedTemplate = RESEND_TEMPLATES.STANDARD;
  if (normalizedCoupon === 'NEXUSELITE') {
    selectedTemplate = RESEND_TEMPLATES.ELITE;
  } else if (normalizedCoupon === 'FOCUS50') {
    selectedTemplate = RESEND_TEMPLATES.FOCUS50;
  }

  const variables: Record<string, string> = {
    nome: payload.name || 'Membro Focus',
    link_painel: payload.dashboardUrl || DEFAULT_LINKS.dashboard,
    link_whatsapp: payload.whatsappUrl || DEFAULT_LINKS.whatsapp,
    link_poder_habito: payload.ebookPoderHabitoUrl || DEFAULT_LINKS.ebookPoderHabito,
    link_sutil_arte: payload.ebookSutilArteUrl || DEFAULT_LINKS.ebookSutilArte,
    link_esperto_diabo: payload.ebookEspertoDiaboUrl || DEFAULT_LINKS.ebookEspertoDiabo
  };

  try {
    const fromSender = process.env.RESEND_FROM_EMAIL || 'Nexus Focus <onboarding@resend.dev>';
    
    // Disparo oficial utilizando o endpoint de templates do Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromSender,
        to: [payload.to],
        subject: selectedTemplate.subject,
        template: {
          id: selectedTemplate.id,
          variables
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Resend] Erro ao enviar e-mail transacional:', data);
      return { success: false, error: data.message || 'Falha na API do Resend' };
    }

    console.log(`[Resend] E-mail (${selectedTemplate.alias}) despachado para [${payload.to}] com ID:`, data.id);
    return { success: true, data };
  } catch (error: any) {
    console.error('[Resend] Exceção ao enviar e-mail:', error);
    return { success: false, error: error?.message || 'Erro de rede ao conectar com Resend' };
  }
}
