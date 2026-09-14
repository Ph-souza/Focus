import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Sparkles, Shield, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth, isWhitelistedPro } from '../contexts/AuthContext';
import { NexusFocusLogo } from './AuraLogo';
import { mapAuthError } from '../lib/firebase';

export function LoginScreen() {
  const { currentUser, isPremium, isLoading, loginWithGoogle } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const userEmail = (currentUser?.email || currentUser?.providerData?.[0]?.email || '').trim().toLowerCase();
  const hasAccess = isPremium || isWhitelistedPro(userEmail);

  // Redirecionamento automático se já autenticado
  if (!isLoading && currentUser) {
    return <Navigate to={hasAccess ? "/dashboard" : "/checkout"} replace />;
  }

  const handleGoogleClick = async () => {
    try {
      setErrorMsg(null);
      setIsSubmitting(true);
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Login error:', err);
      const mapped = mapAuthError(err);
      setErrorMsg(mapped.message || 'Erro ao autenticar com o Google. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col justify-center items-center px-4 sm:px-6 relative overflow-hidden selection:bg-white selection:text-black">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-white/[0.02] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-white/[0.01] rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md flex flex-col items-center text-center relative z-10"
      >
        {/* Logo and Brand */}
        <div className="mb-6 flex flex-col items-center">
          <div className="p-3.5 bg-gradient-to-br from-[#1c1c20] to-[#09090b] border border-white/20 rounded-2xl shadow-2xl backdrop-blur-xl mb-4">
            <NexusFocusLogo className="w-12 h-12" />
          </div>
          <div className="flex flex-col items-center gap-1.5 mb-3">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold tracking-wider uppercase shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-white" />
              Nexus Focus
            </div>
            <span className="text-[11px] font-medium text-zinc-400 tracking-wide mt-0.5">
              powered by Nexus Flow
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
            Foco Absoluto e Gestão Inteligente
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base max-w-sm leading-relaxed">
            Seu assistente pessoal corporativo para organização, produtividade e controle financeiro de alta precisão.
          </p>
        </div>

        {/* Login Card */}
        <div className="w-full bg-[#121216] border border-[#27272a] rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.7)]">
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2.5 text-left"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {/* High-Contrast Corporate Google Sign-In Button */}
          <button
            onClick={handleGoogleClick}
            disabled={isSubmitting || isLoading}
            className="w-full relative group overflow-hidden rounded-2xl bg-white hover:bg-zinc-200 text-black font-extrabold p-4 transition-all duration-300 shadow-[0_4px_25px_rgba(255,255,255,0.12)] hover:shadow-[0_4px_30px_rgba(255,255,255,0.2)] disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3.5 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-black" />
                <span className="text-black font-bold">Conectando ao Google...</span>
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
                <span className="text-base font-extrabold text-black">
                  Entrar com o Google
                </span>
              </>
            )}
          </button>

          {/* Security Badge */}
          <div className="mt-6 pt-5 border-t border-white/[0.06] flex items-center justify-center gap-2 text-zinc-500 text-xs">
            <Shield className="w-3.5 h-3.5 text-zinc-400" />
            <span>Autenticação segura via Google Single Sign-On</span>
          </div>
        </div>

        {/* Footer info */}
        <p className="mt-8 text-zinc-600 text-xs">
          Ao continuar, você concorda com nossos Termos de Uso e Política de Privacidade.
        </p>
      </motion.div>
    </div>
  );
}
