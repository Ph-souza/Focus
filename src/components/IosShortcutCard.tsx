import React, { useState, useEffect, useMemo } from 'react';
import { 
  Key, 
  Copy, 
  Check, 
  Download, 
  Smartphone, 
  Sparkles, 
  Eye, 
  EyeOff, 
  Loader2, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { User } from '../types';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface IosShortcutCardProps {
  user: User | null;
  onTokenGenerated?: (token: string) => void;
  className?: string;
}

export function IosShortcutCard({ user, onTokenGenerated, className = '' }: IosShortcutCardProps) {
  const [token, setToken] = useState<string>(user?.iosShortcutToken || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showFullToken, setShowFullToken] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Carregar token do Firestore se não estiver no user state
  useEffect(() => {
    const activeUid = auth.currentUser?.uid || user?.id;
    if (!activeUid) return;

    if (user?.iosShortcutToken) {
      setToken(user.iosShortcutToken);
      return;
    }

    const fetchToken = async () => {
      try {
        setIsLoading(true);
        const userDoc = await getDoc(doc(db, 'users', activeUid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data?.iosShortcutToken) {
            setToken(data.iosShortcutToken);
          }
        }
      } catch (err) {
        console.error('[IosShortcutCard] Erro ao carregar token:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchToken();
  }, [user?.id, user?.iosShortcutToken]);

  // Função para gerar novo token e persistir no Firestore
  const handleGenerateToken = async () => {
    const activeUid = auth.currentUser?.uid || user?.id;
    if (!activeUid) {
      setErrorMessage('Usuário não autenticado.');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      // Formato nx_ seguido de 16 caracteres hexadecimais aleatórios (ex: nx_8f2e718b3)
      const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(8)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      const newToken = `nx_${randomHex}`;

      await setDoc(
        doc(db, 'users', activeUid),
        {
          iosShortcutToken: newToken,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );

      setToken(newToken);
      if (onTokenGenerated) {
        onTokenGenerated(newToken);
      }
    } catch (error: any) {
      console.error('[IosShortcutCard] Erro ao salvar token no Firestore:', error);
      setErrorMessage('Falha ao salvar token. Verifique sua conexão e tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Copiar token completo para a área de transferência
  const handleCopy = async () => {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('[IosShortcutCard] Erro ao copiar token:', err);
    }
  };

  // Token mascarado no formato nx_********8b3
  const maskedToken = useMemo(() => {
    if (!token) return '';
    if (token.length <= 6) return token;
    const prefix = token.startsWith('nx_') ? 'nx_' : token.slice(0, 3);
    const suffix = token.slice(-3);
    return `${prefix}********${suffix}`;
  }, [token]);

  return (
    <div className={`p-4 sm:p-5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-purple-500/20 dark:border-purple-500/25 shadow-sm relative overflow-hidden backdrop-blur-md space-y-4 ${className}`}>
      
      {/* Glow de fundo Siri sutil */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />

      {/* Cabeçalho do Card */}
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-500 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-purple-500/20 shrink-0">
            <Smartphone size={20} className="stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                Siri &amp; Atalhos do iOS
              </h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                iPhone
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
              Lance despesas e tarefas por voz diretamente no seu iPhone.
            </p>
          </div>
        </div>
      </div>

      {/* Alerta de Erro */}
      {errorMessage && (
        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 1. SEÇÃO DO TOKEN */}
      <div className="space-y-1.5 relative z-10">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Token de Acesso Pessoal
          </span>
          {token && (
            <button
              type="button"
              onClick={handleGenerateToken}
              disabled={isGenerating}
              title="Gerar novo token"
              className="text-[10px] font-medium text-slate-400 hover:text-purple-500 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RefreshCw size={10} className={isGenerating ? "animate-spin" : ""} />
              <span>Regerar</span>
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="h-11 rounded-xl bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center text-xs text-slate-400">
            <Loader2 size={16} className="animate-spin mr-2" />
            <span>Carregando token...</span>
          </div>
        ) : !token ? (
          /* Estado Sem Token: Botão Gerar */
          <button
            type="button"
            onClick={handleGenerateToken}
            disabled={isGenerating}
            className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-[0.99] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Gerando Token...</span>
              </>
            ) : (
              <>
                <Key size={15} />
                <span>Gerar Token de Acesso</span>
                <Sparkles size={14} className="text-purple-200" />
              </>
            )}
          </button>
        ) : (
          /* Estado Com Token: Exibição Mascarada com Botão Copiar */
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
              <span className="font-mono text-xs tracking-wider select-all">
                {showFullToken ? token : maskedToken}
              </span>
              <button
                type="button"
                onClick={() => setShowFullToken(!showFullToken)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md transition-colors cursor-pointer ml-2"
                title={showFullToken ? "Ocultar token" : "Revelar token"}
                aria-label={showFullToken ? "Ocultar token" : "Revelar token"}
              >
                {showFullToken ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className={`px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shrink-0 ${
                isCopied 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-purple-600 hover:bg-purple-700 text-white active:scale-95'
              }`}
            >
              {isCopied ? (
                <>
                  <Check size={14} className="stroke-[3]" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* 2. BOTÃO DE DOWNLOAD DO ATALHO */}
      <div className="relative z-10 pt-0.5">
        <a
          href="https://www.icloud.com/shortcuts/7b3bafcfefac49279dde3a75c3bdd641"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-500/20 active:scale-[0.99] transition-all cursor-pointer group"
        >
          <Download size={15} className="group-hover:translate-y-0.5 transition-transform" />
          <span>Baixar Atalho para iPhone</span>
        </a>
      </div>

      {/* 3. INSTRUÇÕES NA TELA */}
      <div className="rounded-xl p-3.5 bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/70 dark:border-slate-800/80 space-y-2 relative z-10">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800 dark:text-slate-200">
          <Smartphone size={13} className="text-purple-500" />
          <span>Passos para configurar:</span>
        </div>
        <ol className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
          <li className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
              1
            </span>
            <span>Copie o seu Token pessoal acima.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
              2
            </span>
            <span>Clique em <strong>&apos;Baixar Atalho&apos;</strong> e adicione-o ao seu iPhone.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
              3
            </span>
            <span>Quando o iPhone pedir, cole o seu Token. Pronto!</span>
          </li>
        </ol>
      </div>

    </div>
  );
}
