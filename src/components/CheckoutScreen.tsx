import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getApiUrl } from '../lib/api';
import './CheckoutScreen.css';

export function CheckoutScreen() {
  const { currentUser, isPremium, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Cupom e valores
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponStatus, setCouponStatus] = useState<{ message: string; type: '' | 'success' | 'error' }>({
    message: '',
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
  const hasAccess = Boolean(isPremium);

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

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Cálculo de valores da assinatura mensal
  const baseAmount = 19.90;
  let currentAmount = baseAmount;
  let discountAmount = '0,00';

  const effectiveDiscountPercentage = discountPercentage > 0
    ? discountPercentage
    : (appliedCoupon === 'NEXUSELITE' ? 99 : (appliedCoupon === 'FOCUS50' ? 50 : 0));
  const hasDiscount = Boolean(appliedCoupon && effectiveDiscountPercentage > 0);

  if (hasDiscount) {
    if (appliedCoupon === 'NEXUSELITE') {
      currentAmount = 1.00;
    } else {
      const rawDiscounted = Number((baseAmount * (1 - effectiveDiscountPercentage / 100)).toFixed(2));
      currentAmount = Math.max(1.00, rawDiscounted);
    }
    discountAmount = (baseAmount - currentAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  const displayPrice = currentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const displayBasePrice = baseAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Aplicação do Cupom com validação
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setCouponStatus({
        message: 'Por favor, digite um cupom para aplicar.',
        type: 'error'
      });
      return;
    }

    setIsApplyingCoupon(true);
    setCouponStatus({ message: 'Validando cupom...', type: '' });

    try {
      // Atalho para o cupom oficial NEXUSELITE
      if (code === 'NEXUSELITE') {
        setAppliedCoupon('NEXUSELITE');
        setDiscountPercentage(99);
        setCouponStatus({
          message: 'Cupom NEXUSELITE aplicado com sucesso! (99% de desconto: R$ 1,00/mês)',
          type: 'success'
        });
        setIsApplyingCoupon(false);
        return;
      }

      const response = await fetch(getApiUrl('/api/coupons/validate'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coupon: code,
          couponCode: code,
          plan: 'mensal'
        })
      });

      const data = await response.json();

      if (response.ok && data.success && data.valid) {
        setAppliedCoupon(data.coupon);
        setDiscountPercentage(data.discountPercentage || 0);
        setCouponStatus({
          message: `Cupom ${data.coupon} aplicado! ${data.discountPercentage}% de desconto.`,
          type: 'success'
        });
      } else {
        setCouponStatus({
          message: data.error || 'Cupom inválido ou expirado.',
          type: 'error'
        });
      }
    } catch (err: any) {
      console.warn('[Checkout] Erro ao validar cupom:', err);
      // Fallback gracioso para NEXUSELITE
      if (code === 'NEXUSELITE') {
        setAppliedCoupon('NEXUSELITE');
        setDiscountPercentage(99);
        setCouponStatus({
          message: 'Cupom NEXUSELITE ativado com sucesso! (R$ 1,00/mês)',
          type: 'success'
        });
      } else {
        setCouponStatus({
          message: 'Não foi possível validar o cupom. Tente novamente.',
          type: 'error'
        });
      }
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountPercentage(0);
    setCouponCode('');
    setCouponStatus({ message: '', type: '' });
  };

  // Ação do Botão 'Assinar': POST para /api/checkout e redirecionamento nativo para init_point
  const handleSubscribe = async () => {
    if (loading) return;
    setLoading(true);
    setErrorMessage('');

    try {
      if (!currentUser) {
        throw new Error('Entre na sua conta para continuar.');
      }

      const idToken = await currentUser.getIdToken();
      const activeCoupon = appliedCoupon || (couponCode.trim().toUpperCase() === 'NEXUSELITE' ? 'NEXUSELITE' : undefined);

      const response = await fetch(getApiUrl('/api/checkout'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          couponCode: activeCoupon,
          coupon: activeCoupon,
          email: userEmail || currentUser.email,
          userId: currentUser.uid,
          plan: 'mensal'
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || (!data.init_point && !data.initPoint)) {
        throw new Error(data.error || 'Não foi possível gerar a assinatura no Mercado Pago. Tente novamente.');
      }

      const initPoint = data.init_point || data.initPoint;

      // Redirecionamento nativo do navegador para o link seguro do Mercado Pago Checkout Pro
      window.location.href = initPoint;
    } catch (err: any) {
      console.error('[Checkout] Erro ao assinar:', err);
      setErrorMessage(err.message || 'Falha ao iniciar o checkout no Mercado Pago.');
      setLoading(false);
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
              Mercado Pago Checkout Pro
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

            {/* Lado Direito: Card de Checkout Pro (Hospedado) */}
            <div>
              <section className="checkout" id="checkout" aria-labelledby="plan-title">
                <div className="plan-art">
                  <span className="plan-emblem"><svg aria-hidden="true"><use href="#logo"/></svg></span>
                  <div><strong>NEXUS FOCUS</strong><small>Sua rotina, mais inteligente.</small></div>
                  <span className="pill">Elite / Mensal</span>
                </div>

                <div className="checkout-stage" id="checkout-stage">
                  <div className="plan-head">
                    <h2 id="plan-title">Sua nova rotina começa aqui.</h2>
                  </div>
                  <p className="plan-sub">Uma assinatura. Acesso completo a todas as ferramentas do Nexus Focus.</p>

                  {/* Resumo visual de Preço com suporte a cupom (strikethrough) */}
                  <div className="price-wrap">
                    {hasDiscount && (
                      <div className="offer-seal" id="offer-seal" aria-label={`${effectiveDiscountPercentage}% de desconto`}>
                        <strong>{effectiveDiscountPercentage}%</strong><small>OFF</small>
                      </div>
                    )}
                    
                    <p className="old-price" id="old-price">
                      {hasDiscount ? (
                        <del>De R$ {displayBasePrice}/mês</del>
                      ) : (
                        'Acesso ilimitado a todos os recursos'
                      )}
                    </p>

                    <div className="price">
                      <span className="currency">R$</span>
                      <strong id="price">{displayPrice}</strong>
                      <span className="period">/mês</span>
                    </div>

                    <p className="price-term" id="price-term">
                      {hasDiscount
                        ? `R$ ${displayPrice}/mês no primeiro período com cupom ${appliedCoupon} (${effectiveDiscountPercentage}% OFF). Renovação automática.`
                        : 'Assinatura com renovação mensal no Mercado Pago. Cancele a qualquer momento.'}
                    </p>
                  </div>

                  <div className="rule"></div>

                  {/* Campo de inserção do Cupom */}
                  <form id="coupon-form" noValidate onSubmit={handleApplyCoupon}>
                    <label className="coupon-label" htmlFor="coupon">
                      <svg className="icon" aria-hidden="true"><use href="#i-tag"/></svg>
                      Possui um cupom?
                    </label>
                    <div className="input-row">
                      <input
                        id="coupon"
                        name="coupon"
                        type="text"
                        placeholder="Ex: NEXUSELITE"
                        autoComplete="off"
                        autoCapitalize="characters"
                        spellCheck="false"
                        maxLength={40}
                        aria-describedby="coupon-status"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                      />
                      <button className="apply" id="apply" type="submit" disabled={isApplyingCoupon}>
                        {isApplyingCoupon ? 'Aplicando…' : 'Aplicar'}
                      </button>
                    </div>
                    {couponStatus.message && (
                      <p
                        className={`coupon-status ${couponStatus.type}`}
                        id="coupon-status"
                        role="status"
                        aria-live="polite"
                      >
                        {couponStatus.message}
                      </p>
                    )}
                  </form>

                  {/* Chip do cupom aplicado */}
                  {appliedCoupon && (
                    <div className="coupon-chip" id="coupon-chip">
                      <svg className="icon" aria-hidden="true"><use href="#i-check"/></svg>
                      <span>{appliedCoupon} · {effectiveDiscountPercentage}% de desconto</span>
                      <button className="remove" id="remove" type="button" onClick={handleRemoveCoupon}>Remover</button>
                    </div>
                  )}

                  {hasDiscount && (
                    <div className="bonus" id="bonus">
                      <div className="book-stack" aria-hidden="true"><i></i><i></i><i></i></div>
                      <div>
                        <strong>Seu cupom também desbloqueia um bônus</strong>
                        <span>Kit com 3 e-books incluído na assinatura.</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="rule"></div>

                {/* Resumo Financeiro */}
                <dl className="summary">
                  <div>
                    <dt>Plano mensal</dt>
                    <dd>R$ {displayBasePrice}</dd>
                  </div>
                  {hasDiscount && (
                    <div className="discount" id="discount-row">
                      <dt>Desconto {appliedCoupon} ({effectiveDiscountPercentage}%)</dt>
                      <dd>− R$ {discountAmount}</dd>
                    </div>
                  )}
                  <div className="total">
                    <dt>Total da primeira mensalidade</dt>
                    <dd id="total">R$ {displayPrice}</dd>
                  </div>
                </dl>

                {/* Botão de Ação CTA: Assinar */}
                <button
                  className="cta"
                  id="subscribe"
                  type="button"
                  onClick={handleSubscribe}
                  disabled={loading}
                  aria-describedby="renewal"
                >
                  <span id="button-label">
                    {loading ? 'Redirecionando para o Mercado Pago…' : 'Assinar'}
                  </span>
                  <svg className="icon" aria-hidden="true"><use href="#i-arrow"/></svg>
                </button>

                {errorMessage && (
                  <p id="checkout-error" role="alert">
                    {errorMessage}
                  </p>
                )}

                {/* Texto de Renovação */}
                <p className="renewal" id="renewal">
                  {hasDiscount
                    ? `R$ ${displayPrice}/mês com cupom ${appliedCoupon} (${effectiveDiscountPercentage}% OFF). Renovação automática pelo Mercado Pago.`
                    : 'R$ 19,90/mês, com renovação mensal automática. Cancele a qualquer momento no seu painel ou Mercado Pago.'}
                </p>

                {/* Garantia e Segurança */}
                <div className="guarantee-box">
                  <svg className="icon" aria-hidden="true"><use href="#i-shield"/></svg>
                  <span>Checkout Pro Oficial: Seus dados e pagamentos estão protegidos no ambiente seguro do Mercado Pago com garantia de 7 dias.</span>
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