import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Smartphone, MessageCircle, ArrowRight, Check, ShieldCheck, Sparkles, Loader2 } from 'lucide-react';
import { User } from '../types';
import { db } from '../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export function WhatsAppModal({ isOpen, onClose, user }: WhatsAppModalProps) {
  const [phoneNumber, setPhoneNumber] = useState<string>(() => {
    return localStorage.getItem('nexus_whatsapp_number') || '';
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Carregar número do usuário do Firestore se ainda não estiver definido
  useEffect(() => {
    if (!isOpen || !user?.id) return;

    const fetchUserPhone = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.id));
        if (userDoc.exists()) {
          const data = userDoc.data();
          const savedNum = data?.whatsappFormatted || data?.whatsappNumber;
          if (savedNum && !phoneNumber) {
            setPhoneNumber(savedNum);
            localStorage.setItem('nexus_whatsapp_number', savedNum);
          }
        }
      } catch (e) {
        console.error('Erro ao buscar telefone do usuário no Firestore:', e);
      }
    };

    fetchUserPhone();
  }, [isOpen, user?.id]);

  // Formatação automática do telefone (+55 (XX) XXXXX-XXXX)
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    
    // Se o usuário apagar tudo
    if (!val) {
      setPhoneNumber('');
      return;
    }

    // Apenas dígitos
    const digits = val.replace(/\D/g, '');

    // Aplicar máscara brasileira se tiver 10 ou 11 dígitos (com ou sem DDI 55)
    let formatted = val;
    if (digits.length <= 11) {
      if (digits.length <= 2) {
        formatted = `(${digits}`;
      } else if (digits.length <= 7) {
        formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
      } else {
        formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
      }
    } else if (digits.length === 12 || digits.length === 13) {
      // Com código de país 55
      const ddi = digits.slice(0, 2);
      const ddd = digits.slice(2, 4);
      const numPart1 = digits.slice(4, digits.length - 4);
      const numPart2 = digits.slice(digits.length - 4);
      formatted = `+${ddi} (${ddd}) ${numPart1}-${numPart2}`;
    }

    setPhoneNumber(formatted);
  };

  const handleSaveAndOpenWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim() || isLoading) return;

    setIsLoading(true);

    try {
      const cleanDigits = phoneNumber.replace(/\D/g, '');
      // Padronizar número com 55 se o usuário digitou apenas DDD + número (ex: 3197568153 -> 553197568153)
      const standardizedNumber = cleanDigits.startsWith('55') 
        ? cleanDigits 
        : `55${cleanDigits}`;

      // a) Gravar no perfil do utilizador no Firestore
      if (user?.id) {
        const userRef = doc(db, 'users', user.id);
        await setDoc(userRef, {
          whatsappNumber: standardizedNumber,
          whatsappFormatted: phoneNumber.trim(),
          whatsappConnected: true,
          whatsappUpdatedAt: new Date().toISOString()
        }, { merge: true });
      }

      // Salvar no localStorage local para rapidez
      localStorage.setItem('nexus_whatsapp_number', phoneNumber.trim());

      setIsSuccess(true);

      // b) Redirecionamento imediato para a API oficial do WhatsApp
      const botPhone = '553197568153';
      const welcomeText = encodeURIComponent('Olá! Quero ativar o Mentor Focus');
      const waUrl = `https://wa.me/${botPhone}?text=${welcomeText}`;

      // Pequeno delay visual para o usuário ver o feedback de sucesso antes de abrir
      setTimeout(() => {
        window.open(waUrl, '_blank', 'noopener,noreferrer');
        setIsLoading(false);
        setIsSuccess(false);
        onClose();
      }, 700);

    } catch (error) {
      console.error('Erro ao salvar número do WhatsApp no Firestore:', error);
      // Mesmo com erro de gravação, abrir o WhatsApp para não bloquear o utilizador
      const botPhone = '553197568153';
      const welcomeText = encodeURIComponent('Olá! Quero ativar o Mentor Focus');
      window.open(`https://wa.me/${botPhone}?text=${welcomeText}`, '_blank', 'noopener,noreferrer');
      setIsLoading(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-md glass-card p-6 sm:p-7 border border-emerald-500/30 dark:border-emerald-500/25 shadow-2xl relative overflow-hidden"
      >
        {/* Glow sutil verde de fundo */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#25D366]/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Fechar modal"
        >
          <X size={18} />
        </button>

        {/* Cabeçalho Amigável */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-[#25D366]/15 border border-[#25D366]/30 text-[#25D366] flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(37,211,102,0.25)]">
            <MessageCircle size={24} className="fill-[#25D366]/20" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              Ligue o Mentor ao seu WhatsApp
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Lance gastos, tarefas e receba insights por áudio ou texto.
            </p>
          </div>
        </div>

        {/* Formulário de Duas Etapas */}
        <form onSubmit={handleSaveAndOpenWhatsApp} className="space-y-5">
          
          {/* PASSO 1: Qual é o seu número? */}
          <div className="p-4 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800/80 shadow-sm space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 text-xs font-black flex items-center justify-center">
                1
              </span>
              <label htmlFor="userWhatsappNumber" className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Qual é o seu número?
              </label>
            </div>

            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Smartphone size={16} />
              </div>
              <input
                id="userWhatsappNumber"
                type="tel"
                required
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder="+55 (11) 99999-9999"
                className="w-full pl-10 pr-3 py-3 text-sm font-semibold rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#25D366]/50 transition-all tracking-wide"
              />
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight pt-0.5">
              Usaremos este número para reconhecer suas mensagens automaticamente.
            </p>
          </div>

          {/* PASSO 2: Diga Olá! */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2 px-1">
              <span className="w-5 h-5 rounded-full bg-emerald-500/15 text-[#25D366] text-xs font-black flex items-center justify-center">
                2
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Diga Olá e ative seu mentor!
              </span>
            </div>

            <button
              type="submit"
              disabled={!phoneNumber.trim() || isLoading}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] disabled:opacity-50 text-white font-black text-sm shadow-[0_8px_25px_rgba(37,211,102,0.35)] hover:shadow-[0_12px_30px_rgba(37,211,102,0.45)] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Conectando...</span>
                </>
              ) : isSuccess ? (
                <>
                  <Check size={18} className="stroke-[3]" />
                  <span>Conectado! Abrindo WhatsApp...</span>
                </>
              ) : (
                <>
                  <MessageCircle size={18} className="fill-white" />
                  <span>Salvar e Abrir WhatsApp</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>

          {/* Garantia de Privacidade */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 text-center pt-1">
            <ShieldCheck size={13} className="text-emerald-500" />
            <span>Conexão direta e segura com a API oficial do WhatsApp</span>
          </div>

        </form>
      </motion.div>
    </div>
  );
}
