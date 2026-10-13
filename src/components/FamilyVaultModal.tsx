import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Users, 
  Check, 
  Copy, 
  Share2, 
  Sparkles, 
  ShieldCheck, 
  Home, 
  ArrowRight, 
  MessageCircle, 
  KeyRound, 
  Loader2 
} from 'lucide-react';
import { useLedger } from '../contexts/LedgerContext';
import { useAuth } from '../contexts/AuthContext';

export function FamilyVaultModal() {
  const { 
    isFamilyModalOpen, 
    setIsFamilyModalOpen, 
    hasFamilyLedger, 
    familyLedger, 
    createFamilyVault, 
    acceptFamilyInvite, 
    pendingInviteCode, 
    setPendingInviteCode,
    inviteData
  } = useLedger();
  const { currentUser } = useAuth();

  const [vaultName, setVaultName] = useState('Família');
  const [isCreating, setIsCreating] = useState(false);
  const [createdData, setCreatedData] = useState<{ inviteCode: string; inviteUrl: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Modo de inserção manual de código
  const [inputCode, setInputCode] = useState(pendingInviteCode || '');
  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [acceptSuccess, setAcceptSuccess] = useState(false);
  const [tab, setTab] = useState<'create' | 'join'>(pendingInviteCode ? 'join' : 'create');

  useEffect(() => {
    if (pendingInviteCode) {
      setInputCode(pendingInviteCode);
      setTab('join');
    }
  }, [pendingInviteCode]);

  useEffect(() => {
    if (inviteData) {
      setCreatedData({
        inviteCode: inviteData.code,
        inviteUrl: inviteData.url
      });
    }
  }, [inviteData]);

  if (!isFamilyModalOpen) return null;

  const handleCreate = async () => {
    try {
      setIsCreating(true);
      const res = await createFamilyVault(vaultName.trim() || 'Família');
      setCreatedData({
        inviteCode: res.inviteCode,
        inviteUrl: res.inviteUrl
      });
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Erro ao criar cofre familiar.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleAccept = async () => {
    const code = inputCode.trim().toUpperCase();
    if (!code) {
      setAcceptError("Digite o código de convite.");
      return;
    }

    try {
      setIsAccepting(true);
      setAcceptError(null);
      const res = await acceptFamilyInvite(code);
      if (res.success) {
        setAcceptSuccess(true);
        setTimeout(() => {
          setIsFamilyModalOpen(false);
        }, 1500);
      } else {
        setAcceptError(res.error || "Código de convite inválido ou expirado.");
      }
    } catch (err: any) {
      setAcceptError(err?.message || "Erro ao conectar ao cofre familiar.");
    } finally {
      setIsAccepting(false);
    }
  };

  const handleCopyLink = () => {
    const url = createdData?.inviteUrl || `${window.location.origin}/?family_invite=${createdData?.inviteCode}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    if (!createdData?.inviteCode) return;
    navigator.clipboard.writeText(createdData.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const code = createdData?.inviteCode;
    const url = createdData?.inviteUrl || `${window.location.origin}/?family_invite=${code}`;
    const message = `Olá! Convidei você para o nosso Cofre Familiar no Nexus Focus. Vamos acompanhar nossas despesas de casa juntos de forma automática!\n\nEntre pelo link:\n${url}\n\nOu use o código de convite: *${code}*`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const isExistingOwner = hasFamilyLedger && familyLedger?.role === 'owner';
  const isExistingGuest = hasFamilyLedger && familyLedger?.role === 'guest';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          className="w-full max-w-lg rounded-[28px] bg-white dark:bg-[#121216] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden relative"
        >
          {/* Header do Modal */}
          <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]">
                <Users size={20} />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                  {hasFamilyLedger ? 'Cofre Familiar Ativo' : 'Criar Cofre Familiar'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Gestão conjunta sem misturar gastos pessoais
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsFamilyModalOpen(false)}
              className="w-8 h-8 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            {/* Se já foi aceito com sucesso */}
            {acceptSuccess ? (
              <div className="py-8 flex flex-col items-center text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                  <Check size={28} />
                </div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                  Conectado com sucesso!
                </h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-xs">
                  Você agora tem acesso em tempo real ao Cofre Familiar. Todos os lançamentos serão sincronizados entre vocês.
                </p>
              </div>
            ) : hasFamilyLedger || createdData ? (
              /* ESTADO: Cofre já existe ou acabou de ser criado */
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-purple-500/10 border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-lg">👨‍👩‍👧</span>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {familyLedger?.name || vaultName || 'Cofre Familiar'}
                    </h4>
                    <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      {isExistingGuest ? 'Membro Convidado' : 'Proprietário'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                    Despesas que você registrar com o toggle em <strong>'Família'</strong>, ou enviadas por WhatsApp/Siri contendo palavras como <em>mercado, casa, água ou luz</em>, serão salvas automaticamente neste cofre.
                  </p>
                </div>

                {/* Bloco de Convite para o parceiro */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                      Código de Convite do Parceiro(a)
                    </label>
                    <span className="text-[11px] text-blue-500 font-medium">Válido por 7 dias</span>
                  </div>

                  {createdData?.inviteCode ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 py-3 px-4 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 font-mono text-center font-bold tracking-widest text-lg text-blue-600 dark:text-blue-400">
                        {createdData.inviteCode}
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="p-3 rounded-2xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-zinc-200 transition-colors flex items-center justify-center active:scale-95"
                        title="Copiar código"
                      >
                        {copiedCode ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleCreate}
                      disabled={isCreating}
                      className="w-full py-3 rounded-2xl bg-blue-600/15 border border-blue-500/30 hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      {isCreating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                      Gerar Novo Código de Convite
                    </button>
                  )}

                  {createdData && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center justify-center gap-2 transition-all active:scale-95"
                      >
                        {copiedLink ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleShareWhatsApp}
                        className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)] active:scale-95"
                      >
                        <MessageCircle size={14} />
                        <span>Enviar no WhatsApp</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {isExistingGuest 
                      ? `Conectado ao cofre de ${familyLedger?.ownerEmail || 'Família'}`
                      : 'Você é o administrador deste cofre'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsFamilyModalOpen(false)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
                  >
                    Entendido
                  </button>
                </div>
              </div>
            ) : (
              /* ESTADO: Criação ou Entrada em um cofre */
              <div className="space-y-4">
                {/* Abas Criar / Entrar */}
                <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200/80 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setTab('create')}
                    className={`py-2 text-xs font-bold rounded-xl transition-all ${
                      tab === 'create'
                        ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Criar Novo Cofre
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab('join')}
                    className={`py-2 text-xs font-bold rounded-xl transition-all ${
                      tab === 'join'
                        ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Já Tenho Convite
                  </button>
                </div>

                {tab === 'create' ? (
                  <div className="space-y-4">
                    {/* Benefícios */}
                    <div className="space-y-2.5">
                      <div className="flex items-start gap-3 p-3 rounded-2xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/15">
                        <div className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Home size={15} />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                            Gastos de Casa em Tempo Real
                          </h5>
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                            Supermercado, luz, água e compras conjuntas sincronizadas na hora entre os dois aparelhos.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-2xl bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/15">
                        <div className="w-7 h-7 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Sparkles size={15} />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                            IA Classifica Sozinha
                          </h5>
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                            Ao falar no WhatsApp ou Siri "compras do mercado", a IA joga direto no cofre da Família.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/15">
                        <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                          <ShieldCheck size={15} />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                            Privacidade Pessoal Preservada
                          </h5>
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                            Suas compras individuais continuam 100% privadas no seu cofre 'Pessoal'.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                        Nome do Cofre
                      </label>
                      <input
                        type="text"
                        value={vaultName}
                        onChange={(e) => setVaultName(e.target.value)}
                        placeholder="Ex: Família Souza, Nosso Apê..."
                        className="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleCreate}
                      disabled={isCreating}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-[0_0_20px_rgba(59,130,246,0.4)] flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer disabled:opacity-50"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          <span>Criando Cofre Familiar...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={18} />
                          <span>Ativar Cofre & Gerar Link de Convite</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  /* ABA ENTRAR COM CÓDIGO */
                  <div className="space-y-4">
                    <p className="text-xs text-slate-600 dark:text-zinc-300">
                      Recebeu um link ou código de convite do seu parceiro(a)? Insira abaixo para conectar seus acessos:
                    </p>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                        Código do Convite
                      </label>
                      <div className="relative">
                        <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                          type="text"
                          value={inputCode}
                          onChange={(e) => {
                            setInputCode(e.target.value.toUpperCase());
                            setAcceptError(null);
                          }}
                          placeholder="FAM-XXXX"
                          className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-mono font-bold text-sm focus:outline-none focus:border-blue-500 transition-colors"
                        />
                      </div>
                      {acceptError && (
                        <p className="text-xs text-rose-500 font-medium mt-1">
                          {acceptError}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleAccept}
                      disabled={isAccepting || !inputCode.trim()}
                      className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-[0_0_20px_rgba(59,130,246,0.35)] flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer disabled:opacity-50"
                    >
                      {isAccepting ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          <span>Validando convite...</span>
                        </>
                      ) : (
                        <>
                          <Check size={18} />
                          <span>Entrar no Cofre Familiar</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
