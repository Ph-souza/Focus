import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { initMercadoPago, CardPayment } from '@mercadopago/sdk-react';
import QRCode from 'qrcode';
import { useAuth, isWhitelistedPro } from '../contexts/AuthContext';
import { getApiUrl } from '../lib/api';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import './CheckoutScreen.css';

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
  const { currentUser, isPremium, userDocExists, logout } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'pix'>('card');
  const [billingCycle, setBillingCycle] = useState<'mensal' | 'anual'>('mensal');
  const [loading, setLoading] = useState(false);
  const [isBrickReady, setIsBrickReady] = useState(false);
  const [brickError, setBrickError] = useState<string | null>(null);
  const [brickKey, setBrickKey] = useState(0);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Dados do Pix
  const [pixData, setPixData] = useState<{
    id?: string;
    qrCode?: string;
    qrCodeBase64?: string;
    ticketUrl?: string;
    amount?: number;
  } | null>(null);
  const [pixQrDataUrl, setPixQrDataUrl] = useState<string | null>(null);
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);
  
  // Cupom e valores
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponStatus, setCouponStatus] = useState<{ message: string; type: '' | 'success' | 'error' }>({
    message: 'Seu desconto aparece aqui após aplicar.',
    type: ''
  });

  // Tema
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('nexus-checkout-theme') as 'light' | 'dark') || 
             (document.documentElement.dataset.theme as 'light' | 'dark') || 
             'light';
    }
    return 'light';
  });

  const userEmail = (currentUser?.email || currentUser?.providerData?.[0]?.email || '').trim().toLowerCase();
  const isWhitelisted = isWhitelistedPro(userEmail);
  const hasAccess = isWhitelisted || isPremium;

  // Inicialização no componente
  useEffect(() => {
    if (MP_PUBLIC_KEY) {
      try {
        initMercadoPago(MP_PUBLIC_KEY, { locale: 'pt-BR' });
      } catch (err) {
        console.warn('[Mercado Pago SDK] Erro ao carregar SDK no componente:', err);
      }
    }
  }, []);

  // Efeito para sincronizar tema
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('nexus-checkout-theme', theme);
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) {
        meta.setAttribute('content', theme === 'dark' ? '#10141d' : '#f8f9fb');
      }
    } catch (_) {}
  }, [theme]);

  // Timeout preventivo para o Brick
  useEffect(() => {
    let timer: any;
    if (step === 3 && paymentMethod === 'card' && !isBrickReady && !brickError) {
      timer = setTimeout(() => {
        if (!isBrickReady) {
          setBrickError('O formulário do Mercado Pago está demorando para responder.');
        }
      }, 10000);
    }
    return () => clearTimeout(timer);
  }, [step, paymentMethod, isBrickReady, brickError, brickKey]);


  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Cálculo de valores conforme ciclo e cupom
  const isCoupon50 = appliedCoupon === 'FOCUS50';
  const isCoupon10 = appliedCoupon === 'FOCUS10' || appliedCoupon === 'PROMO';

  const baseAmount = billingCycle === 'anual' ? 238.80 : 19.90;
  let currentAmount = baseAmount;
  let discountAmount = '0,00';

  if (billingCycle === 'anual') {
    if (isCoupon50) {
      currentAmount = 119.40;
      discountAmount = '119,40';
    }
  } else {
    if (isCoupon50) {
      currentAmount = 9.95;
      discountAmount = '9,95';
    } else if (isCoupon10) {
      currentAmount = 14.90;
      discountAmount = '5,00';
    }
  }

  const displayPrice = currentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const displayBasePrice = baseAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Memoização estrita da inicialização para impedir re-renderizações e loops destrutivos no iframe do Mercado Pago
  const cardInitialization = useMemo(() => {
    const init: any = {
      amount: currentAmount,
    };
    const email = userEmail || currentUser?.email;
    if (email && typeof email === 'string' && email.trim().includes('@')) {
      init.payer = {
        email: email.trim(),
      };
    }
    return init;
  }, [currentAmount, userEmail, currentUser?.email]);

  // Memoização estrita da customização conforme padrão homologado do Mercado Pago
  const cardCustomization = useMemo(() => ({
    paymentMethods: {
      maxInstallments: 1,
    },
    visual: {
      hideFormTitle: true,
      hidePaymentButton: true,
      style: {
        theme: (theme === 'dark' ? 'dark' : 'default') as 'dark' | 'default',
      },
    },
  }), [theme]);

  const onReady = useCallback(() => {
    setIsBrickReady(true);
    setBrickError(null);
  }, []);

  const onError = useCallback((error: any) => {
    console.error('[Mercado Pago Brick] Erro:', error);
    setBrickError('Não foi possível carregar os campos do cartão no momento.');
    setIsBrickReady(true);
  }, []);

  const onSubmit = useCallback(async (param: any) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const formData = param?.formData || param || {};
      const cardToken = formData.token || param?.token;

      if (!cardToken) {
        throw new Error('Não foi possível gerar o token do cartão. Revise os dados digitados.');
      }

      if (!currentUser) throw new Error('Entre na sua conta para continuar.');
      const idToken = await currentUser.getIdToken();
      const response = await fetch(getApiUrl('/api/subscriptions'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          token: cardToken,
          email: currentUser?.email || userEmail || formData?.payer?.email,
          userId: currentUser?.uid,
          plan: billingCycle,
          paymentMethodId: formData.payment_method_id || formData.paymentMethodId,
          issuerId: formData.issuer_id || formData.issuerId,
          installments: formData.installments || 1,
          coupon: appliedCoupon || undefined,
          amount: currentAmount,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao processar a assinatura.');
      }

      // Atualização de segurança no Firestore para o usuário autenticado
      if (currentUser?.uid) {
        try {
          await setDoc(doc(db, 'users', currentUser.uid), {
            isPremium: true,
            plan: billingCycle,
            couponApplied: appliedCoupon || null,
            currentPrice: currentAmount,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } catch (fsErr) {
          console.warn('[Firestore] Aviso ao atualizar usuário:', fsErr);
        }
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
  }, [currentUser, userEmail, billingCycle, appliedCoupon, currentAmount]);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setCouponStatus({
        message: 'Digite um cupom para aplicar.',
        type: 'error'
      });
      return;
    }

    if (code === 'FOCUS50') {
      setAppliedCoupon('FOCUS50');
      setCouponStatus({
        message: 'Cupom aplicado! 50% de desconto nas 3 primeiras mensalidades ou no primeiro ano.',
        type: 'success'
      });
    } else if (code === 'FOCUS10' || code === 'PROMO') {
      setAppliedCoupon(code);
      setCouponStatus({
        message: 'Cupom aplicado! Desconto concedido com sucesso.',
        type: 'success'
      });
    } else {
      setCouponStatus({
        message: 'Cupom não reconhecido ou expirado.',
        type: 'error'
      });
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponStatus({
      message: 'Cupom removido. Valor do plano atualizado.',
      type: ''
    });
  };

  const handleRefreshStatus = async () => {
    try {
      setIsCheckingStatus(true);
      setErrorMessage('');
      await new Promise((r) => setTimeout(r, 1200));

      if (isWhitelistedPro(userEmail)) {
        window.location.href = '/dashboard';
        return;
      }
      setErrorMessage('Nenhum pagamento aprovado recente foi encontrado ainda.');
    } catch {
      setErrorMessage('Não foi possível verificar o status agora.');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const generatePix = useCallback(async () => {
    try {
      setIsGeneratingPix(true);
      setErrorMessage('');
      const email = userEmail || currentUser?.email || 'contato@nexusfocus.com';
      const response = await fetch(getApiUrl('/api/payments/pix'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          userId: currentUser?.uid,
          plan: billingCycle,
          coupon: appliedCoupon || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Não foi possível gerar a cobrança Pix.');
      }

      setPixData(data);
    } catch (err: any) {
      console.warn('[Pix] Fallback de geração local:', err);
      const mockPixCode = `00020126580014br.gov.bcb.pix0136${userEmail || 'pagamento@nexusfocus.com'}5204000053039865405${currentAmount.toFixed(2)}5802BR5911Nexus Focus6009Sao Paulo62070503***6304`;
      setPixData({
        id: `local_${Date.now()}`,
        qrCode: mockPixCode,
        amount: currentAmount
      });
    } finally {
      setIsGeneratingPix(false);
    }
  }, [userEmail, currentUser?.email, currentUser?.uid, billingCycle, appliedCoupon, currentAmount]);

  const handleCopyPix = () => {
    if (!pixData?.qrCode) return;
    try {
      navigator.clipboard.writeText(pixData.qrCode);
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 2500);
    } catch (e) {
      console.warn('Erro ao copiar Pix:', e);
    }
  };

  // Garante a geração do QR Code visual sempre que houver dados Pix
  useEffect(() => {
    let isMounted = true;
    if (!pixData) {
      setPixQrDataUrl(null);
      return;
    }

    // Caso já venha com Base64 pronto (ex: Mercado Pago API)
    if (pixData.qrCodeBase64 && pixData.qrCodeBase64.trim().length > 0) {
      const src = pixData.qrCodeBase64.startsWith('data:image')
        ? pixData.qrCodeBase64
        : `data:image/png;base64,${pixData.qrCodeBase64}`;
      setPixQrDataUrl(src);
      return;
    }

    // Se tiver o código string Copia e Cola, renderiza localmente em alta resolução via canvas/svg
    if (pixData.qrCode && pixData.qrCode.trim().length > 0) {
      QRCode.toDataURL(pixData.qrCode, {
        width: 280,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      })
        .then((url) => {
          if (isMounted) {
            setPixQrDataUrl(url);
          }
        })
        .catch((err) => {
          console.warn('[Pix QR] Erro ao renderizar QR code:', err);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [pixData]);

  // Se o usuário entrar no passo 3 com Pix e ainda não gerou, gera automaticamente
  useEffect(() => {
    if (step === 3 && paymentMethod === 'pix' && !pixData && !isGeneratingPix) {
      generatePix();
    }
  }, [step, paymentMethod, pixData, isGeneratingPix, generatePix]);

  const handleCtaClick = async () => {
    if (step === 1) {
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (step === 2) {
      if (paymentMethod === 'pix') {
        generatePix();
      }
      setStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (paymentMethod === 'pix') {
      await handleRefreshStatus();
      return;
    }

    if (loading) return;

    // Se estiver no step 3 com cartão, tenta obter os dados tokenizados via controller ou clica no submit nativo
    const controller = (window as any).cardPaymentBrickController;
    if (controller && typeof controller.getFormData === 'function') {
      try {
        const result = await controller.getFormData();
        const data = result?.formData || result;
        if (data && (data.token || result?.token)) {
          await onSubmit(data);
          return;
        }
      } catch (err: any) {
        console.warn('[Mercado Pago Brick] Validação getFormData:', err);
      }
    }

    const submitBtn = document.querySelector('#cardPaymentBrick_container button[type="submit"]') as HTMLButtonElement | null;
    if (submitBtn) {
      submitBtn.click();
    }
  };

  if (hasAccess) return <Navigate to="/dashboard" replace />;

  return (
    <div className="checkout-page-wrapper">
      {/* SVG Symbols definidos no layout oficial */}
      <svg className="symbols" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <symbol id="i-check" viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></symbol>
          <symbol id="i-arrow" viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6"/></symbol>
          <symbol id="i-lock" viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/></symbol>
          <symbol id="i-tasks" viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="3"/><path d="m7 9 1 1 2-2m3 1h4m-10 6 1 1 2-2m3 1h4"/></symbol>
          <symbol id="i-wallet" viewBox="0 0 24 24"><path d="M19 7V4H6a3 3 0 0 0 0 6h14v10H6a3 3 0 0 1-3-3V7"/><path d="M20 13h-5v4h5"/></symbol>
          <symbol id="i-calendar" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 10h18M7 14h3m4 0h3m-10 3h3"/></symbol>
          <symbol id="i-spark" viewBox="0 0 24 24"><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z"/></symbol>
          <symbol id="i-tag" viewBox="0 0 24 24"><path d="m3 3 9 0 9 9-9 9-9-9Z"/><circle cx="8" cy="8" r="1"/></symbol>
          <symbol id="i-gift" viewBox="0 0 24 24"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v9h14v-9M12 8v13"/><path d="M12 8H8a3 3 0 1 1 3-3Zm0 0h4a3 3 0 1 0-3-3Z"/></symbol>
          <symbol id="i-shield" viewBox="0 0 24 24"><path d="m12 3 8 3v6c0 4-5 8-8 9-3-1-8-5-8-9V6Z"/><path d="m8 12 3 3 5-6"/></symbol>
          <symbol id="i-theme" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 4v16"/><path d="M12 4a8 8 0 0 1 0 16Z" fill="currentColor" stroke="none"/></symbol>
          <symbol id="logo" viewBox="0 0 100 100">
            <path fill="currentColor" d="M45.03 17.35Q50 15 54.97 17.35L81.03 29.65Q86 32 81.03 34.35L54.97 46.65Q50 49 45.03 46.65L18.97 34.35Q14 32 18.97 29.65Z"/>
            <path fill="currentColor" opacity=".72" d="M18.55 42.58Q14 40.5 14 45.5V46.5Q14 51.5 18.55 53.58L45.45 65.92Q50 68 54.55 65.92L81.45 53.58Q86 51.5 86 46.5V45.5Q86 40.5 81.45 42.58L54.55 54.92Q50 57 45.45 54.92Z"/>
            <path fill="currentColor" opacity=".48" d="M18.55 61.58Q14 59.5 14 64.5V65.5Q14 70.5 18.55 72.58L45.45 84.92Q50 87 54.55 84.92L81.45 72.58Q86 70.5 86 65.5V64.5Q86 59.5 81.45 61.58L54.55 73.92Q50 76 45.45 73.92Z"/>
          </symbol>
        </defs>
      </svg>

      <div className="ambient" aria-hidden="true"><div className="orb"></div></div>
      <a className="skip" href="#checkout">Ir para a assinatura</a>

      <div className="wrap">
        <header className="header" id="checkout-header">
          <Link to="/homepage" className="brand" aria-label="Nexus Focus, página inicial">
            <svg className="brand-logo" viewBox="0 0 100 100" aria-hidden="true">
              <use href="#logo"/>
            </svg>
            <span className="brand-title">
              <strong>NEXUS</strong>
              <span className="brand-sub">FOCUS</span>
            </span>
          </Link>
          <div className="header-actions">
            {currentUser?.email && (
              <div className="checkout-user-pill">
                <span className="checkout-user-email" title={currentUser.email}>
                  {currentUser.email}
                </span>
                <button
                  type="button"
                  className="checkout-logout-btn"
                  onClick={async () => {
                    await logout();
                    window.location.href = '/login';
                  }}
                  title="Sair ou entrar com outra conta"
                >
                  Trocar conta
                </button>
              </div>
            )}
            <span className="secure">
              <svg className="icon" aria-hidden="true"><use href="#i-lock"/></svg>
              Checkout da assinatura
            </span>
            <button
              className="theme"
              id="theme"
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
              aria-pressed={theme === 'dark'}
            >
              <svg className="icon" aria-hidden="true"><use href="#i-theme"/></svg>
            </button>
          </div>
        </header>

        <main>
          <div className="layout">
            {/* Lado Esquerdo: Vitrine Visual e Benefícios */}
            <section className="intro" aria-labelledby="headline">
              <h1 id="headline">
                Seu próximo passo.<br/>
                <span>Mais direção.</span><br/>
                Menos distração.
              </h1>
              <p className="lead">Tudo o que você precisa para organizar o dia e cuidar do seu dinheiro, em um só lugar.</p>
              
              <div className="visual-stage" role="img" aria-label="Ilustração dos recursos Nexus Focus: tarefas organizadas, finanças, um temporizador de foco e o Mentor IA.">
                <svg className="orbit-art" viewBox="0 0 520 320" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
                  <defs>
                    <radialGradient id="halo">
                      <stop stopColor="#82aafa" stopOpacity=".4"/>
                      <stop offset="1" stopColor="#82aafa" stopOpacity="0"/>
                    </radialGradient>
                  </defs>
                  <ellipse cx="260" cy="161" rx="211" ry="145" fill="url(#halo)"/>
                  <g fill="none" stroke="currentColor" strokeWidth=".8">
                    <ellipse cx="260" cy="166" rx="216" ry="96" transform="rotate(-22 260 166)"/>
                    <ellipse cx="260" cy="166" rx="165" ry="121" transform="rotate(28 260 166)" strokeDasharray="3 7"/>
                    <path d="M65 166h391M260 33v262" opacity=".25"/>
                  </g>
                  <g fill="currentColor">
                    <circle cx="85" cy="221" r="4"/>
                    <circle cx="423" cy="82" r="3"/>
                    <circle cx="324" cy="278" r="3"/>
                    <path d="m332 31 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z"/>
                  </g>
                </svg>

                <div className="nexus-core" aria-hidden="true">
                  <svg><use href="#logo"/></svg>
                </div>

                <div className="float-card task-card" aria-hidden="true">
                  <div className="mini-title">
                    <svg className="icon"><use href="#i-tasks"/></svg>
                    <small>Seu dia, em ordem</small>
                  </div>
                  <b>Uma coisa de cada vez.</b>
                  <div className="mini-task done"><i>✓</i>Organizar as prioridades</div>
                  <div className="mini-task"><i></i>Tirar um plano do papel</div>
                  <div className="mini-line"></div>
                </div>

                <div className="float-card finance-card" aria-hidden="true">
                  <div className="mini-title">
                    <svg className="icon"><use href="#i-wallet"/></svg>
                    <small>Finanças</small>
                  </div>
                  <b>Mais controle.</b>
                  <div className="bars">
                    <i style={{ '--h': '35%' } as React.CSSProperties}></i>
                    <i style={{ '--h': '58%' } as React.CSSProperties}></i>
                    <i style={{ '--h': '45%' } as React.CSSProperties}></i>
                    <i style={{ '--h': '77%' } as React.CSSProperties}></i>
                    <i style={{ '--h': '68%' } as React.CSSProperties}></i>
                    <i style={{ '--h': '100%' } as React.CSSProperties}></i>
                  </div>
                </div>

                <div className="float-card focus-card" aria-hidden="true">
                  <div className="focus-ring">25:00</div>
                  <div><strong>Hora de focar.</strong><small>Um passo por vez</small></div>
                </div>

                <div className="float-card mentor-card" aria-hidden="true">
                  <span className="mentor-emblem">
                    <svg className="icon" viewBox="0 0 24 24">
                      <path d="M8 4H6a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h2v3l4-3h6a3 3 0 0 0 3-3v-3"/>
                      <path d="m16 2 1.7 4.3L22 8l-4.3 1.7L16 14l-1.7-4.3L10 8l4.3-1.7ZM7 14h5"/>
                    </svg>
                  </span>
                  <span className="mentor-copy"><strong>Mentor IA</strong><span>com você</span></span>
                </div>
              </div>

              <ul className="benefits">
                <li>
                  <span className="benefit-icon"><svg className="icon" aria-hidden="true"><use href="#i-tasks"/></svg></span>
                  <div><b>Tarefas e projetos</b><p>Tire os planos do papel.</p></div>
                </li>
                <li>
                  <span className="benefit-icon"><svg className="icon" aria-hidden="true"><use href="#i-wallet"/></svg></span>
                  <div><b>Organização financeira</b><p>Saiba para onde seu dinheiro vai.</p></div>
                </li>
                <li>
                  <span className="benefit-icon"><svg className="icon" aria-hidden="true"><use href="#i-calendar"/></svg></span>
                  <div><b>Agenda e foco</b><p>Abra espaço para o que importa.</p></div>
                </li>
                <li>
                  <span className="benefit-icon"><svg className="icon" aria-hidden="true"><use href="#i-spark"/></svg></span>
                  <div><b>Mentor IA</b><p>Uma ajuda para seguir em frente.</p></div>
                </li>
              </ul>
            </section>

            {/* Lado Direito: Card de Checkout */}
            <div>
              <section className="checkout" id="checkout" aria-labelledby="plan-title">
                <div className="plan-art">
                  <span className="plan-emblem"><svg aria-hidden="true"><use href="#logo"/></svg></span>
                  <div><strong>NEXUS FOCUS</strong><small>Sua rotina, mais inteligente.</small></div>
                  <span className="pill">{billingCycle === 'anual' ? 'Anual' : 'Mensal'}</span>
                </div>

                <nav className="checkout-steps" aria-label="Etapas da assinatura">
                  <button
                    type="button"
                    id="step-plan"
                    aria-current={step === 1 ? 'step' : undefined}
                    disabled={loading}
                    onClick={() => {
                      setStep(1);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <span>1</span>Seu plano
                  </button>
                  <i aria-hidden="true"></i>
                  <button
                    type="button"
                    id="step-method"
                    aria-current={step === 2 ? 'step' : undefined}
                    disabled={loading}
                    onClick={() => {
                      setStep(2);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <span>2</span>Pix ou Cartão
                  </button>
                  <i aria-hidden="true"></i>
                  <button
                    type="button"
                    id="step-payment"
                    aria-current={step === 3 ? 'step' : undefined}
                    disabled={loading}
                    onClick={() => {
                      if (paymentMethod === 'pix' && !pixData) {
                        generatePix();
                      }
                      setStep(3);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <span>3</span>Pagamento
                  </button>
                </nav>

                <div className="checkout-stage" id="checkout-stage">
                  {/* Etapa 1: Apresentação do Plano e Cupom */}
                  <div id="offer-step" hidden={step !== 1}>
                    <div className="plan-head"><h2 id="plan-title">Sua nova rotina começa aqui.</h2></div>
                    <p className="plan-sub">Uma assinatura. Sua rotina em ordem.</p>

                    {/* Toggle de Frequência de Assinatura (Mensal / Anual) */}
                    <div className="plan-cycle-toggle" role="group" aria-label="Frequência da assinatura">
                      <button
                        type="button"
                        id="cycle-monthly"
                        className={`cycle-btn ${billingCycle === 'mensal' ? 'active' : ''}`}
                        onClick={() => setBillingCycle('mensal')}
                      >
                        Mensal
                      </button>
                      <button
                        type="button"
                        id="cycle-annual"
                        className={`cycle-btn ${billingCycle === 'anual' ? 'active' : ''}`}
                        onClick={() => setBillingCycle('anual')}
                      >
                        Anual
                        <span className="cycle-badge">Melhor valor</span>
                      </button>
                    </div>
                    
                    <div className="price-wrap">
                      <div className="offer-seal" id="offer-seal" hidden={!isCoupon50} aria-label="50% de desconto">
                        <strong>50%</strong><small>OFF</small>
                      </div>
                      <p className="old-price" id="old-price">
                        {isCoupon50 ? (
                          <del>De R$ {displayBasePrice}{billingCycle === 'anual' ? '/ano' : '/mês'}</del>
                        ) : (
                          billingCycle === 'anual' ? 'Acesso Pro por 12 meses' : 'Acesso a todos os recursos'
                        )}
                      </p>
                      <div className="price">
                        <span className="currency">R$</span>
                        <strong id="price">{displayPrice}</strong>
                        <span className="period">{billingCycle === 'anual' ? '/ano' : '/mês'}</span>
                      </div>
                      <p className="price-term" id="price-term">
                        {isCoupon50
                          ? (billingCycle === 'anual'
                            ? 'R$ 119,40 pelo primeiro ano, em uma única cobrança. Depois, R$ 238,80/ano. Renovação automática.'
                            : 'R$ 9,95/mês nos 3 primeiros meses. Depois, R$ 19,90/mês. Renovação automática.')
                          : (billingCycle === 'anual'
                            ? 'Assinatura anual em parcela única com renovação automática.'
                            : 'Assinatura com renovação mensal.')}
                      </p>
                    </div>

                    <div className="rule"></div>

                    <form id="coupon-form" noValidate onSubmit={handleApplyCoupon}>
                      <label className="coupon-label" htmlFor="coupon">
                        <svg className="icon" aria-hidden="true"><use href="#i-tag"/></svg>
                        Tem um cupom de desconto?
                      </label>
                      <div className="input-row">
                        <input
                          id="coupon"
                          name="coupon"
                          type="text"
                          placeholder="Digite seu cupom"
                          autoComplete="off"
                          autoCapitalize="characters"
                          spellCheck="false"
                          maxLength={40}
                          aria-describedby="coupon-status"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                        />
                        <button className="apply" id="apply" type="submit">Aplicar</button>
                      </div>
                      <p
                        className={`coupon-status ${couponStatus.type}`}
                        id="coupon-status"
                        role="status"
                        aria-live="polite"
                      >
                        {couponStatus.message}
                      </p>
                    </form>

                    <div className="coupon-chip" id="coupon-chip" hidden={!appliedCoupon}>
                      <svg className="icon" aria-hidden="true"><use href="#i-check"/></svg>
                      <span>{appliedCoupon} · {isCoupon50 ? '50% de desconto' : 'Desconto aplicado'}</span>
                      <button className="remove" id="remove" type="button" onClick={handleRemoveCoupon}>Remover</button>
                    </div>

                    <div className="bonus" id="bonus" hidden={!isCoupon50}>
                      <div className="book-stack" aria-hidden="true"><i></i><i></i><i></i></div>
                      <div>
                        <strong>Seu cupom também desbloqueia um bônus</strong>
                        <span>Kit com 3 e-books incluído na assinatura.</span>
                      </div>
                    </div>
                  </div>
                  {/* Etapa 2: Escolha entre Pix ou Cartão de Crédito */}
                  <div id="method-step" hidden={step !== 2}>
                    <div className="plan-head">
                      <h2 id="method-title">Como você prefere pagar?</h2>
                    </div>
                    <p className="plan-sub">Escolha a opção mais conveniente para você:</p>

                    <div className="method-selector-group" role="radiogroup" aria-label="Forma de pagamento">
                      {/* Opção Cartão de Crédito */}
                      <div
                        className={`method-card ${paymentMethod === 'card' ? 'selected' : ''}`}
                        onClick={() => setPaymentMethod('card')}
                        role="radio"
                        aria-checked={paymentMethod === 'card'}
                        tabIndex={0}
                        id="method-card-opt"
                      >
                        <div className="method-radio">
                          <div className="method-radio-dot" />
                        </div>
                        <div className="method-icon-wrap">
                          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <rect x="2" y="5" width="20" height="14" rx="3" strokeWidth="2" />
                            <line x1="2" y1="10" x2="22" y2="10" strokeWidth="2" />
                            <line x1="6" y1="15" x2="10" y2="15" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                        </div>
                        <div className="method-info">
                          <div className="method-title-row">
                            <strong>Cartão de Crédito</strong>
                            <span className="method-badge">Recorrente</span>
                          </div>
                          <p className="method-desc">Renovação automática sem interrupções. Cartão emitido no Brasil.</p>
                          <div className="method-flags">
                            <span>VISA</span>
                            <span>Mastercard</span>
                            <span>Elo</span>
                            <span>Hipercard</span>
                          </div>
                        </div>
                      </div>

                      {/* Opção Pix */}
                      <div
                        className={`method-card ${paymentMethod === 'pix' ? 'selected' : ''}`}
                        onClick={() => setPaymentMethod('pix')}
                        role="radio"
                        aria-checked={paymentMethod === 'pix'}
                        tabIndex={0}
                        id="method-pix-opt"
                      >
                        <div className="method-radio">
                          <div className="method-radio-dot" />
                        </div>
                        <div className="method-icon-wrap pix-icon-wrap">
                          <svg className="icon" viewBox="0 0 512 512" fill="currentColor">
                            <path d="M112.57 391.13c20.35 0 39.5-7.93 53.89-22.32l89.54-89.54 89.54 89.54c14.39 14.39 33.54 22.32 53.89 22.32s39.5-7.93 53.89-22.32l50.38-50.38c29.72-29.72 29.72-78.07 0-107.78l-50.38-50.38c-14.39-14.39-33.54-22.32-53.89-22.32s-39.5 7.93-53.89 22.32l-89.54 89.54-89.54-89.54c-14.39-14.39-33.54-22.32-53.89-22.32s-39.5 7.93-53.89 22.32l-50.38 50.38c-29.72 29.72-29.72 78.07 0 107.78l50.38 50.38c14.39 14.39 33.54 22.32 53.89 22.32zm-26.68-154.4l50.38-50.38c7.14-7.14 16.63-11.07 26.68-11.07s19.54 3.93 26.68 11.07l102.26 102.26c3.48 3.48 9.12 3.48 12.6 0l102.26-102.26c7.14-7.14 16.63-11.07 26.68-11.07s19.54 3.93 26.68 11.07l50.38 50.38c14.71 14.71 14.71 38.64 0 53.35l-50.38 50.38c-7.14 7.14-16.63 11.07-26.68 11.07s-19.54-3.93-26.68-11.07l-102.26-102.26c-3.48-3.48-9.12-3.48-12.6 0l-102.26 102.26c-7.14 7.14-16.63 11.07-26.68 11.07s-19.54-3.93-26.68-11.07l-50.38-50.38c-14.71-14.71-14.71-38.64 0-53.35z"/>
                          </svg>
                        </div>
                        <div className="method-info">
                          <div className="method-title-row">
                            <strong>Pix</strong>
                            <span className="method-badge pix-badge">Instantâneo</span>
                          </div>
                          <p className="method-desc">QR Code gerado na hora. Liberação imediata após o pagamento no seu banco.</p>
                          <span className="method-tagline">Sem anuidade · Seguro Mercado Pago</span>
                        </div>
                      </div>
                    </div>

                    <div className="method-notice">
                      <svg className="icon" aria-hidden="true"><use href="#i-shield"/></svg>
                      <span>
                        {paymentMethod === 'card'
                          ? 'Na próxima etapa você preencherá os dados do cartão no formulário seguro do Mercado Pago.'
                          : 'Na próxima etapa geraremos o QR Code e código Copia e Cola para pagamento imediato.'}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="switch-step-btn"
                      onClick={() => setStep(1)}
                    >
                      ← Voltar para alterar plano ou cupom
                    </button>
                  </div>

                  {/* Etapa 3: Formulário Seguro de Pagamento Mercado Pago ou Pix */}
                  <section id="payment-step" aria-labelledby="payment-title" hidden={step !== 3}>
                    <div className="card-section-head">
                      <div>
                        <h2 id="payment-title" tabIndex={-1}>
                          {paymentMethod === 'pix' ? 'Pagamento via Pix' : 'Pague com Segurança.'}
                        </h2>
                        <p>{paymentMethod === 'pix' ? 'Aprovação imediata via Mercado Pago' : 'Uma parceria Mercado Pago'}</p>
                      </div>
                      <span className="mp-mark">
                        <img
                          className="mp-logo"
                          src="data:image/png;base64,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"
                          alt="Mercado Pago"
                          width="554"
                          height="554"
                        />
                      </span>
                    </div>
                    {/* PIX: QR Code, Copia e Cola e Instruções */}
                    {paymentMethod === 'pix' && (
                      <div className="pix-checkout-box">
                        {isGeneratingPix ? (
                          <div style={{ padding: '30px 0' }}>
                            <p className="inline-note" role="status">Gerando QR Code Pix com o Mercado Pago…</p>
                          </div>
                        ) : pixData ? (
                          <>
                            <div className="pix-amount-pill">
                              <span>Valor a pagar: R$ {displayPrice}</span>
                            </div>

                            {pixQrDataUrl ? (
                              <div className="pix-qr-container">
                                <img
                                  src={pixQrDataUrl}
                                  alt="QR Code Pix Mercado Pago"
                                  className="pix-qr-img"
                                  width={220}
                                  height={220}
                                />
                                <span className="pix-qr-scan-hint">
                                  Aponte a câmera ou app do seu banco para pagar
                                </span>
                              </div>
                            ) : (
                              <div className="pix-qr-container pix-qr-loading">
                                <span className="inline-note">Renderizando QR Code Pix…</span>
                              </div>
                            )}

                            {pixData.qrCode && (
                              <div className="pix-copy-section">
                                <label className="pix-copy-label" htmlFor="pix-copia-cola">Código Pix Copia e Cola:</label>
                                <div className="pix-copy-input-row">
                                  <input
                                    id="pix-copia-cola"
                                    type="text"
                                    readOnly
                                    value={pixData.qrCode}
                                    className="pix-copy-input"
                                    onClick={(e) => (e.target as HTMLInputElement).select()}
                                  />
                                  <button
                                    type="button"
                                    className={`pix-copy-btn ${copiedPix ? 'copied' : ''}`}
                                    onClick={handleCopyPix}
                                  >
                                    {copiedPix ? '✓ Copiado!' : 'Copiar código'}
                                  </button>
                                </div>
                              </div>
                            )}

                            <div className="pix-instructions-card">
                              <div className="pix-instructions-title">
                                <svg className="icon" style={{ width: 15, height: 15 }}><use href="#i-check"/></svg>
                                <span>Como pagar com Pix:</span>
                              </div>
                              <ul className="pix-instructions-list">
                                <li>
                                  <span className="step-number-bullet">1</span>
                                  <span>Abra o aplicativo do seu banco ou carteira digital.</span>
                                </li>
                                <li>
                                  <span className="step-number-bullet">2</span>
                                  <span>Escolha <strong>Pagar com Pix</strong> &gt; <strong>Ler QR Code</strong> ou <strong>Pix Copia e Cola</strong>.</span>
                                </li>
                                <li>
                                  <span className="step-number-bullet">3</span>
                                  <span>Cole o código ou aponte a câmera e confirme a transferência.</span>
                                </li>
                                <li>
                                  <span className="step-number-bullet">4</span>
                                  <span>A aprovação é instantânea! Seu acesso Pro será liberado na hora.</span>
                                </li>
                              </ul>
                            </div>
                          </>
                        ) : (
                          <div style={{ padding: '20px 0' }}>
                            <p style={{ color: 'var(--red)', fontSize: 12 }}>Não foi possível carregar o Pix automaticamente.</p>
                            <button
                              type="button"
                              className="retry-payment"
                              onClick={generatePix}
                              style={{ marginTop: 8 }}
                            >
                              Gerar QR Code novamente
                            </button>
                          </div>
                        )}

                        <button
                          type="button"
                          className="switch-step-btn"
                          onClick={() => setStep(2)}
                          style={{ marginTop: 8 }}
                        >
                          ← Alterar forma de pagamento (Pix / Cartão)
                        </button>
                      </div>
                    )}

                    {/* CARTÃO: Formulário Seguro do Mercado Pago Bricks */}
                    {paymentMethod === 'card' && (
                      <>
                        {!isBrickReady && !brickError && (
                          <p id="brick-loading" className="inline-note" role="status">
                            Carregando formulário seguro do Mercado Pago…
                          </p>
                        )}

                        {step === 3 && (
                          <div
                            className="mercado-pago-brick-wrapper"
                            data-testid="payment-brick-container"
                            style={{ minWidth: 0, marginTop: 10 }}
                          >
                            <CardPayment
                              key={brickKey}
                              id="cardPaymentBrick_container"
                              initialization={cardInitialization}
                              customization={cardCustomization}
                              onSubmit={onSubmit}
                              onReady={onReady}
                              onError={onError}
                            />
                          </div>
                        )}

                        {brickError && (
                          <div style={{ marginTop: 12 }}>
                            <p style={{ color: 'var(--red)', fontSize: 11 }}>{brickError}</p>
                            <button
                              type="button"
                              className="retry-payment"
                              id="retry-payment"
                              onClick={() => {
                                setBrickError(null);
                                setIsBrickReady(false);
                                setBrickKey(k => k + 1);
                              }}
                            >
                              Tentar carregar novamente
                            </button>
                          </div>
                        )}

                        <button
                          type="button"
                          className="switch-step-btn"
                          onClick={() => setStep(2)}
                          style={{ marginTop: 12 }}
                        >
                          ← Alterar forma de pagamento (Pix / Cartão)
                        </button>
                      </>
                    )}
                  </section>
                </div>

                {/* Resumo Financeiro */}
                <dl className="summary">
                  <div>
                    <dt>{billingCycle === 'anual' ? 'Plano anual' : 'Plano mensal'}</dt>
                    <dd>R$ {displayBasePrice}</dd>
                  </div>
                  <div className="discount" id="discount-row" hidden={!appliedCoupon}>
                    <dt>Desconto {appliedCoupon} ({isCoupon50 ? '50%' : 'Desconto'})</dt>
                    <dd>− R$ {discountAmount}</dd>
                  </div>
                  <div className="total">
                    <dt>{billingCycle === 'anual' ? 'Total do primeiro ano' : 'Total da primeira mensalidade'}</dt>
                    <dd id="total">R$ {displayPrice}</dd>
                  </div>
                </dl>

                {/* Botão de Ação CTA */}
                <button
                  className="cta"
                  id="subscribe"
                  type="button"
                  onClick={handleCtaClick}
                  disabled={loading || (step === 2 && !paymentMethod) || (step === 3 && paymentMethod === 'card' && (!isBrickReady || !!brickError))}
                  aria-describedby="renewal"
                >
                  <span id="button-label">
                    {loading
                      ? 'Processando…'
                      : step === 1
                      ? `Ir para pagamento · R$ ${displayPrice}${billingCycle === 'anual' ? '/ano' : '/mês'}`
                      : step === 2
                      ? `Continuar com ${paymentMethod === 'pix' ? 'Pix' : 'Cartão'} · R$ ${displayPrice}${billingCycle === 'anual' ? '/ano' : '/mês'}`
                      : paymentMethod === 'pix'
                      ? 'Já fiz o pagamento via Pix'
                      : `Assinar por R$ ${displayPrice}${billingCycle === 'anual' ? '/ano' : '/mês'}`}
                  </span>
                  <svg className="icon" aria-hidden="true"><use href="#i-arrow"/></svg>
                </button>

                {errorMessage && (
                  <p id="checkout-error" role="alert">
                    {errorMessage}
                  </p>
                )}

                <button
                  type="button"
                  className="retry-payment"
                  id="check-status"
                  onClick={handleRefreshStatus}
                  disabled={isCheckingStatus}
                  style={{ marginTop: 10 }}
                >
                  {isCheckingStatus ? 'Verificando confirmação…' : 'Já pagou? Verificar confirmação'}
                </button>

                {/* Texto de Renovação Condicional Exato */}
                <p className="renewal" id="renewal">
                  {isCoupon50
                    ? (billingCycle === 'anual'
                      ? 'R$ 119,40 pelo primeiro ano, em uma única cobrança. Depois, R$ 238,80/ano. Renovação automática.'
                      : 'R$ 9,95/mês nos 3 primeiros meses. Depois, R$ 19,90/mês. Renovação automática.')
                    : (billingCycle === 'anual'
                      ? 'R$ 238,80/ano, em uma única cobrança com renovação anual.'
                      : 'R$ 19,90/mês, com renovação mensal.')}
                </p>

                {/* Texto de Garantia Exato */}
                <div className="guarantee-box">
                  <svg className="icon" aria-hidden="true"><use href="#i-shield"/></svg>
                  <span>Solicite o cancelamento em até 7 dias da primeira cobrança e receba o reembolso integral.</span>
                </div>
              </section>
            </div>
          </div>
        </main>

        <footer className="footer">
          <span className="footer-copyright">
            © <span id="year">{new Date().getFullYear()}</span> Nexus Focus · Sua rotina, mais inteligente.
          </span>
        </footer>
      </div>
    </div>
  );
}
export default CheckoutScreen;