import React, { useState, useEffect } from 'react';
import { Navigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Shield, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { useAuth, isWhitelistedPro } from '../contexts/AuthContext';
import { NexusFocusLogo } from './AuraLogo';
import { mapAuthError } from '../lib/firebase';
import { createStripeCheckoutSession } from '../lib/stripe';

export function LoginScreen() {
  const { currentUser, isPremium, isLoading, loginWithGoogle } = useAuth();
  const [searchParams] = useSearchParams();
  const isCheckoutIntent = searchParams.get('intent') === 'checkout';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const userEmail = (currentUser?.email || currentUser?.providerData?.[0]?.email || '').trim().toLowerCase();
  const hasAccess = isPremium || isWhitelistedPro(userEmail);

  // Redirecionamento automático ou interceptação caso já esteja autenticado
  useEffect(() => {
    if (!isLoading && currentUser) {
      if (isCheckoutIntent && !hasAccess) {
        setCheckoutLoading(true);
        createStripeCheckoutSession({
          userId: currentUser.uid,
          email: currentUser.email || undefined
        }).then((session) => {
          if (session.url) {
            window.location.href = session.url;
          } else {
            window.location.href = `/checkout?userId=${encodeURIComponent(currentUser.uid)}&intent=checkout`;
          }
        }).catch(() => {
          window.location.href = `/checkout?userId=${encodeURIComponent(currentUser.uid)}&intent=checkout`;
        });
      }
    }
  }, [isLoading, currentUser, isCheckoutIntent, hasAccess]);

  if (!isLoading && currentUser) {
    if (hasAccess) {
      return <Navigate to="/dashboard" replace />;
    }
    if (!isCheckoutIntent) {
      return <Navigate to="/checkout" replace />;
    }
  }

  const handleGoogleClick = async () => {
    try {
      setErrorMsg(null);
      setIsSubmitting(true);
      const user = await loginWithGoogle();

      // Interceptação Pós-Login (Firebase + Stripe)
      if (user) {
        const email = (user.email || user.providerData?.[0]?.email || '').trim().toLowerCase();
        const userHasAccess = isPremium || isWhitelistedPro(email);

        if (isCheckoutIntent && !userHasAccess) {
          // Impede o redirecionamento imediato para o dashboard!
          setCheckoutLoading(true);
          const session = await createStripeCheckoutSession({
            userId: user.uid,
            email: user.email || undefined
          });

          if (session.url) {
            window.location.href = session.url;
            return;
          } else {
            window.location.href = `/checkout?userId=${encodeURIComponent(user.uid)}&intent=checkout`;
            return;
          }
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const mapped = mapAuthError(err);
      setErrorMsg(mapped.message || 'Erro ao autenticar com o Google. Tente novamente.');
      setCheckoutLoading(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between items-center px-4 sm:px-6 py-6 sm:py-8 relative overflow-x-hidden bg-[url('/login-desktop-bg.jpg')] bg-cover bg-center bg-no-repeat selection:bg-zinc-900 selection:text-white">
      {/* Soft Ambient Light Glow Overlay */}
      <div className="absolute inset-0 bg-radial-[circle_at_center_top] from-white/30 via-transparent to-transparent pointer-events-none" />

      {/* Top Spacer to balance vertical centering */}
      <div className="h-2 sm:h-6 w-full shrink-0" />

      {/* Main Center Container */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-xl flex flex-col items-center text-center relative z-10 my-auto py-2 sm:py-4"
      >
        {/* Logo Card */}
        <Link to="/page" className="w-20 h-20 sm:w-24 sm:h-24 bg-white/95 rounded-2xl sm:rounded-3xl shadow-[0_12px_32px_rgba(0,0,0,0.07),0_2px_8px_rgba(0,0,0,0.04)] border border-white flex items-center justify-center mb-5 sm:mb-6 transition-transform duration-300 hover:scale-[1.03]">
          <NexusFocusLogo className="w-12 h-12 sm:w-14 sm:h-14" variant="dark" />
        </Link>

        {/* Brand Title */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-[0.25em] text-zinc-950 uppercase mb-6 sm:mb-8">
          NEXUS FOCUS
        </h1>

        {/* Impact Section / Contextual Rendering */}
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          {isCheckoutIntent ? (
            <>
              {/* Visual Step Indicator Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/90 backdrop-blur-md border border-blue-200/80 text-blue-700 text-xs font-semibold mb-3.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                <span>Passo 1 de 2: Autenticação</span>
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-[28px] font-bold tracking-tight text-zinc-900 mb-2 sm:mb-2.5 leading-snug">
                Quase lá! Crie sua conta para assinar
              </h2>
              <p className="text-zinc-600 text-sm sm:text-base max-w-md leading-relaxed">
                Autentique-se com sua conta Google para vincular com segurança sua assinatura de <strong className="text-zinc-800">R$ 19,90/mês</strong>.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-xl sm:text-2xl lg:text-[28px] font-bold tracking-tight text-zinc-800 mb-2 sm:mb-2.5 leading-snug">
                Sua rotina, mais inteligente.
              </h2>
              <p className="text-zinc-600 text-sm sm:text-base max-w-md leading-relaxed">
                Seu assistente pessoal para organização, produtividade e controle financeiro em uma única experiência.
              </p>
            </>
          )}
        </div>

        {/* Login Card */}
        <div className="w-full max-w-[430px] bg-white/80 backdrop-blur-xl border border-white/90 rounded-[28px] p-5 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)]">
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200/80 text-red-600 text-xs flex items-start gap-2.5 text-left"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {/* Clean Official Google Sign-In Button with Contextual Label */}
          <button
            onClick={handleGoogleClick}
            disabled={isSubmitting || isLoading || checkoutLoading}
            className="w-full bg-white hover:bg-zinc-50 text-zinc-900 font-bold py-3.5 px-5 rounded-2xl border border-zinc-200/80 shadow-[0_4px_16px_rgba(0,0,0,0.05)] hover:shadow-[0_6px_22px_rgba(0,0,0,0.09)] transition-all duration-200 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3 cursor-pointer"
          >
            {isSubmitting || checkoutLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-zinc-700" />
                <span className="text-sm sm:text-base font-bold text-zinc-800">
                  {checkoutLoading ? 'Preparando pagamento seguro...' : 'Conectando ao Google...'}
                </span>
              </>
            ) : (
              <>
                {/* Official Google G Logo SVG */}
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span className="text-[15px] sm:text-base font-bold text-zinc-900 tracking-normal">
                  {isCheckoutIntent ? 'Começar com Google' : 'Entrar com o Google'}
                </span>
              </>
            )}
          </button>

          {/* Contextual Footnote when intent=checkout */}
          {isCheckoutIntent && (
            <p className="text-[11px] sm:text-xs text-zinc-500 text-center mt-3.5 leading-relaxed">
              Você será redirecionado para o pagamento seguro após criar a conta
            </p>
          )}

          {/* Security Badge with Horizontal Dividers */}
          <div className="flex items-center gap-3 mt-5 w-full">
            <div className="h-px flex-1 bg-zinc-200/80" />
            <div className="flex items-center gap-1.5 text-zinc-500 text-[11px] sm:text-xs shrink-0 font-normal">
              <Shield className="w-3.5 h-3.5 text-zinc-500 stroke-[1.75]" />
              <span>Autenticação segura via Google Single Sign-On</span>
            </div>
            <div className="h-px flex-1 bg-zinc-200/80" />
          </div>
        </div>
      </motion.div>

      {/* Footer Terms: Docked cleanly to the screen bottom */}
      <footer className="w-full relative z-10 pb-2 sm:pb-3 text-center shrink-0">
        <p className="text-zinc-500 text-xs text-center max-w-md mx-auto leading-relaxed">
          Ao continuar, você concorda com nossos{' '}
          <a href="https://nexusfocus.web.app/termos" target="_blank" rel="noopener noreferrer" className="font-semibold text-zinc-800 hover:underline cursor-pointer">Termos de Uso</a>{' '}
          e{' '}
          <a href="https://nexusfocus.web.app/privacidade" target="_blank" rel="noopener noreferrer" className="font-semibold text-zinc-800 hover:underline cursor-pointer">Política de Privacidade</a>.
        </p>
      </footer>
    </div>
  );
}
