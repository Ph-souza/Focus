import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User as UserIcon, Eye, EyeOff, Sparkles, AlertCircle, X, ChevronRight, ShieldCheck } from 'lucide-react';
import { User } from '../types';
import { googleSignInWithScopes, loginWithEmail, registerWithEmail, mapAuthError } from '../lib/firebase';
import { AuraLogo } from './AuraLogo';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

type AuthMode = 'google' | 'email_login' | 'email_register';

export function AuthScreen({ onLogin }: AuthScreenProps) {
  const [authMode, setAuthMode] = useState<AuthMode>('google');
  const [errorInfo, setErrorInfo] = useState<{ message: string; tip?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'email' | 'demo' | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setErrorInfo(null);
      setIsLoading(true);
      setLoadingProvider('google');
      
      const result = await googleSignInWithScopes();
      const firebaseUser = result.user;
      
      onLogin({
        id: firebaseUser.uid,
        name: firebaseUser.displayName || firebaseUser.providerData[0]?.displayName || 'Usuário',
        email: firebaseUser.email || firebaseUser.providerData[0]?.email || '',
        photoURL: firebaseUser.photoURL || firebaseUser.providerData[0]?.photoURL || undefined,
        isDemo: false
      });
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      setErrorInfo(mapAuthError(err));
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorInfo({ message: 'Por favor, preencha todos os campos obrigatórios.' });
      return;
    }

    try {
      setErrorInfo(null);
      setIsLoading(true);
      setLoadingProvider('email');

      if (authMode === 'email_register') {
        if (!name.trim()) {
          setErrorInfo({ message: 'Por favor, informe seu nome para o cadastro.' });
          setIsLoading(false);
          setLoadingProvider(null);
          return;
        }
        const result = await registerWithEmail(email, password, name);
        onLogin({
          id: result.user.uid,
          name: name.trim(),
          email: result.user.email || email.trim(),
          photoURL: undefined,
          isDemo: false
        });
      } else {
        const result = await loginWithEmail(email, password);
        onLogin({
          id: result.user.uid,
          name: result.user.displayName || 'Usuário',
          email: result.user.email || email.trim(),
          photoURL: result.user.photoURL || undefined,
          isDemo: false
        });
      }
    } catch (err: any) {
      console.error('Email Auth Error:', err);
      setErrorInfo(mapAuthError(err));
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  const handleDemoLogin = () => {
    setIsLoading(true);
    setLoadingProvider('demo');
    setTimeout(() => {
      onLogin({
        id: 'demo_user_aura',
        name: 'Usuário Demonstração',
        email: 'demo@aurasync.app',
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?fit=crop&w=150&h=150',
        isDemo: true
      });
      setIsLoading(false);
      setLoadingProvider(null);
    }, 400);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b] p-4 relative overflow-hidden font-sans select-none">
      {/* Premium Dark Vault Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
        {/* Subtle radial metallic gradient & deep vault ambient light */}
        <div className="absolute top-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1f1f22] via-[#09090b] to-[#09090b]"></div>
        
        {/* Subtle gold and emerald glow behind card */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-500/5 rounded-full blur-[120px] opacity-70"></div>
        <div className="absolute top-[25%] left-[55%] w-[450px] h-[450px] bg-[#10B981]/5 rounded-full blur-[140px] opacity-60"></div>

        {/* High-end metallic grid texture */}
        <div 
          className="absolute inset-0 opacity-[0.03] mix-blend-overlay" 
          style={{
            backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        ></div>
        
        {/* Vault decorative lines */}
        <div className="absolute inset-0 border-[1px] border-white/5 opacity-20 m-8 md:m-12 rounded-[40px] pointer-events-none"></div>
        <div className="absolute inset-0 border-[1px] border-white/5 opacity-10 m-16 md:m-24 rounded-[30px] pointer-events-none"></div>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md rounded-[32px] relative z-10 flex flex-col items-center p-6 sm:p-8 md:p-10 bg-gradient-to-b from-[#18181b]/95 to-[#09090b]/95 border border-[#27272a] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.85)] backdrop-blur-2xl before:absolute before:inset-0 before:border-t before:border-white/10 before:rounded-[32px]"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6 w-full relative z-10">
          <div className="mb-4 relative group">
            <div className="absolute inset-0 bg-yellow-500/20 blur-xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="w-18 h-18 bg-gradient-to-br from-[#27272a] to-[#09090b] border border-[#3f3f46] rounded-2xl flex items-center justify-center shadow-2xl relative overflow-hidden backdrop-blur-md">
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-yellow-500/10 mix-blend-overlay"></div>
              <AuraLogo className="w-9 h-9 relative z-10" />
            </div>
          </div>
          
          <h1 className="text-[28px] sm:text-[32px] font-black tracking-[-0.04em] text-white leading-none mb-1.5 shadow-black drop-shadow-lg">
            AURA SYNC
          </h1>
          <p className="text-[9px] font-bold tracking-[0.3em] text-[#a1a1aa] uppercase opacity-90 flex items-center gap-1.5">
            <span>POWERED BY NEXUS FLOW</span>
          </p>
        </div>

        {/* Error Alert Box */}
        <AnimatePresence>
          {errorInfo && (
            <motion.div 
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="w-full relative z-10 overflow-hidden"
            >
              <div className="p-3.5 bg-red-950/40 border border-red-500/30 text-red-300 rounded-xl text-xs backdrop-blur-md shadow-lg relative">
                <button 
                  onClick={() => setErrorInfo(null)}
                  className="absolute top-2.5 right-2.5 text-red-400/70 hover:text-red-200 transition-colors"
                >
                  <X size={14} />
                </button>
                <div className="flex items-start gap-2.5 pr-4">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold leading-tight text-red-200">{errorInfo.message}</p>
                    {errorInfo.tip && (
                      <p className="text-[11px] text-red-300/80 leading-normal mt-1 border-t border-red-500/20 pt-1">
                        💡 <span className="font-medium">{errorInfo.tip}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Auth Mode Navigation Tabs */}
        <div className="w-full grid grid-cols-2 p-1 bg-[#121214] border border-[#27272a] rounded-xl mb-5 relative z-10 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setAuthMode('google'); setErrorInfo(null); }}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              authMode === 'google' 
                ? 'bg-gradient-to-b from-[#27272a] to-[#18181b] text-white shadow-md border border-[#3f3f46]' 
                : 'text-[#a1a1aa] hover:text-white'
            }`}
          >
            <span>Google</span>
          </button>
          <button
            type="button"
            onClick={() => { 
              setAuthMode(authMode === 'email_register' ? 'email_register' : 'email_login'); 
              setErrorInfo(null); 
            }}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              authMode.startsWith('email') 
                ? 'bg-gradient-to-b from-[#27272a] to-[#18181b] text-white shadow-md border border-[#3f3f46]' 
                : 'text-[#a1a1aa] hover:text-white'
            }`}
          >
            <span>E-mail & Senha</span>
          </button>
        </div>

        {/* Mode 1: Google Fast Auth */}
        {authMode === 'google' && (
          <div className="w-full relative z-10 space-y-3">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full bg-gradient-to-b from-[#27272a] to-[#121214] hover:from-[#3f3f46] hover:to-[#18181b] text-white rounded-[16px] py-3.5 font-semibold transition-all shadow-[0_8px_16px_rgba(0,0,0,0.6)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.8)] border border-[#3f3f46] hover:border-[#52525b] flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-yellow-500/10 to-yellow-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              
              {loadingProvider === 'google' ? (
                <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5 relative z-10 drop-shadow-md shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                  <path fill="none" d="M1 1h22v22H1z" />
                </svg>
              )}
              
              <span className="relative z-10 text-[12px] sm:text-[13px] tracking-widest text-[#e4e4e7] font-bold">
                {loadingProvider === 'google' ? 'CONECTANDO AO GOOGLE...' : 'ENTRAR COM GOOGLE'}
              </span>
            </button>
          </div>
        )}

        {/* Mode 2: Email & Password Form */}
        {authMode.startsWith('email') && (
          <form onSubmit={handleEmailAuth} className="w-full relative z-10 space-y-3.5">
            <div className="flex justify-center gap-4 text-xs pb-1 font-semibold">
              <button
                type="button"
                onClick={() => setAuthMode('email_login')}
                className={`pb-1 border-b-2 transition-all cursor-pointer ${
                  authMode === 'email_login' 
                    ? 'border-emerald-500 text-emerald-400' 
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                Já tenho conta (Entrar)
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('email_register')}
                className={`pb-1 border-b-2 transition-all cursor-pointer ${
                  authMode === 'email_register' 
                    ? 'border-emerald-500 text-emerald-400' 
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                Novo cadastro
              </button>
            </div>

            {authMode === 'email_register' && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Nome Completo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <UserIcon size={16} />
                  </div>
                  <input
                    type="text"
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={authMode === 'email_register'}
                    className="w-full bg-[#121214] border border-[#27272a] focus:border-emerald-500/80 rounded-xl py-2.5 pl-9 pr-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                E-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  placeholder="seu.email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-[#121214] border border-[#27272a] focus:border-emerald-500/80 rounded-xl py-2.5 pl-9 pr-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-[#121214] border border-[#27272a] focus:border-emerald-500/80 rounded-xl py-2.5 pl-9 pr-10 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl py-3 text-xs font-bold uppercase tracking-wider transition-all shadow-[0_4px_16px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loadingProvider === 'email' ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>{authMode === 'email_register' ? 'Criar Minha Conta' : 'Entrar na Conta'}</span>
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        {/* Separator / Divider */}
        <div className="w-full flex items-center my-4 relative z-10">
          <div className="flex-grow border-t border-[#27272a]"></div>
          <span className="px-3 text-[10px] uppercase tracking-widest text-[#71717a] font-bold">ou experimente</span>
          <div className="flex-grow border-t border-[#27272a]"></div>
        </div>

        {/* Mode 3: Instant Demo / Guest Mode */}
        <div className="w-full relative z-10">
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={isLoading}
            className="w-full bg-[#121214] hover:bg-[#18181b] text-slate-300 hover:text-white border border-[#27272a] hover:border-yellow-500/40 rounded-xl py-3 px-4 text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer group shadow-sm disabled:opacity-50"
          >
            {loadingProvider === 'demo' ? (
              <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Sparkles size={14} className="text-yellow-400 group-hover:scale-110 transition-transform" />
                <span>Acessar Modo Demonstração (Sem Login)</span>
              </>
            )}
          </button>
        </div>

        {/* Footer Security Badge */}
        <div className="mt-6 flex items-center gap-1.5 text-[10px] text-slate-500 relative z-10">
          <ShieldCheck size={13} className="text-emerald-500/70" />
          <span>Ambiente Criptografado &middot; Firebase Auth & Cloud Firestore</span>
        </div>
      </motion.div>
    </div>
  );
}

