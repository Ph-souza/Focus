import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Folder, Target, StickyNote, BarChart2, Bot, 
  MessageCircle, User as UserIcon, Moon, Lock, HelpCircle, LogOut, ChevronRight
} from 'lucide-react';
import { User, TabType } from '../types';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface TabMoreProps {
  user: User | null;
  onTabChange: (tab: TabType) => void;
  onOpenProfile: () => void;
  onOpenWhatsApp: () => void;
  onToggleDarkMode: () => void;
  onLogout: () => void;
  isDarkMode: boolean;
}

export function TabMore({ 
  user, 
  onTabChange, 
  onOpenProfile, 
  onOpenWhatsApp, 
  onToggleDarkMode, 
  onLogout,
  isDarkMode
}: TabMoreProps) {
  const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    const unsub = onSnapshot(doc(db, 'users', user.id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setWhatsappNumber(data.whatsappNumber || null);
      }
    });
    return () => unsub();
  }, [user?.id]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto flex flex-col gap-8 px-4 md:px-8 py-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-1 mb-2">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">Mais</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Tudo o que você precisa, em um só lugar.</p>
      </div>

      {/* Ferramentas */}
      <div>
        <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4 px-1">Ferramentas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          <button className="flex items-center gap-4 p-5 bg-white dark:bg-white/5 backdrop-blur-md rounded-[20px] border border-slate-200 dark:border-white/10 shadow-sm hover:border-[#6366f1] dark:hover:border-white/20 transition-all text-left group">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-[#121216] flex items-center justify-center border border-blue-100 dark:border-white/5 shrink-0 group-hover:scale-105 transition-transform">
              <Folder size={24} className="text-[#6366f1]" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-0.5">Projetos</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">Seus projetos em andamento</p>
            </div>
          </button>

          <button onClick={() => onTabChange('goals')} className="flex items-center gap-4 p-5 bg-white dark:bg-white/5 backdrop-blur-md rounded-[20px] border border-slate-200 dark:border-white/10 shadow-sm hover:border-[#6366f1] dark:hover:border-white/20 transition-all text-left group">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-[#121216] flex items-center justify-center border border-blue-100 dark:border-white/5 shrink-0 group-hover:scale-105 transition-transform">
              <Target size={24} className="text-[#6366f1]" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-0.5">Metas</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">Transforme planos em realidade</p>
            </div>
          </button>

          <button className="flex items-center gap-4 p-5 bg-white dark:bg-white/5 backdrop-blur-md rounded-[20px] border border-slate-200 dark:border-white/10 shadow-sm hover:border-[#6366f1] dark:hover:border-white/20 transition-all text-left group">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-[#121216] flex items-center justify-center border border-amber-100 dark:border-white/5 shrink-0 group-hover:scale-105 transition-transform">
              <StickyNote size={24} className="text-amber-500" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-0.5">Notas</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">Suas ideias sempre por perto</p>
            </div>
          </button>

          <button onClick={() => onTabChange('reports')} className="flex items-center gap-4 p-5 bg-white dark:bg-white/5 backdrop-blur-md rounded-[20px] border border-slate-200 dark:border-white/10 shadow-sm hover:border-[#6366f1] dark:hover:border-white/20 transition-all text-left group">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-[#121216] flex items-center justify-center border border-indigo-100 dark:border-white/5 shrink-0 group-hover:scale-105 transition-transform">
              <BarChart2 size={24} className="text-indigo-500" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-0.5">Relatórios</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">Acompanhe sua evolução</p>
            </div>
          </button>

          <button onClick={() => onTabChange('chat')} className="flex items-center gap-4 p-5 bg-white dark:bg-white/5 backdrop-blur-md rounded-[20px] border border-slate-200 dark:border-white/10 shadow-sm hover:border-[#6366f1] dark:hover:border-white/20 transition-all text-left group">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-[#121216] flex items-center justify-center border border-blue-100 dark:border-white/5 shrink-0 group-hover:scale-105 transition-transform">
              <Bot size={24} className="text-[#6366f1]" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-0.5">Mentor IA</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">Tire dúvidas e receba orientações</p>
            </div>
          </button>

          <button onClick={onOpenWhatsApp} className="flex items-center gap-4 p-5 bg-white dark:bg-white/5 backdrop-blur-md rounded-[20px] border border-slate-200 dark:border-white/10 shadow-sm hover:border-emerald-500 dark:hover:border-emerald-500/50 transition-all text-left group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-[#121216] flex items-center justify-center border border-emerald-100 dark:border-white/5 shrink-0 group-hover:scale-105 transition-transform">
              <MessageCircle size={24} className="text-emerald-500" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-0.5">Mentor no WhatsApp</h3>
              {whatsappNumber ? (
                <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Conectado • {whatsappNumber.slice(-4)}
                </p>
              ) : (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">Converse pelo WhatsApp</p>
              )}
            </div>
          </button>

          <button onClick={onOpenProfile} className="flex items-center gap-4 p-5 bg-white dark:bg-white/5 backdrop-blur-md rounded-[20px] border border-slate-200 dark:border-white/10 shadow-sm hover:border-[#6366f1] dark:hover:border-white/20 transition-all text-left group">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-[#121216] flex items-center justify-center border border-blue-100 dark:border-white/5 shrink-0 group-hover:scale-105 transition-transform">
              <UserIcon size={24} className="text-[#6366f1]" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-0.5">Perfil</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">Seu espaço, sua jornada</p>
            </div>
          </button>
        </div>
      </div>

      {/* Conta */}
      <div>
        <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4 px-1">Conta</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <button onClick={onToggleDarkMode} className="flex items-center justify-between p-5 bg-white dark:bg-white/5 backdrop-blur-md rounded-[20px] border border-slate-200 dark:border-white/10 shadow-sm hover:bg-slate-50 dark:hover:bg-white/10 transition-colors text-left">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#121216] flex items-center justify-center text-slate-600 dark:text-slate-300">
                <Moon size={18} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-0.5">Aparência</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">Tema, cores e personalização</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-400" />
          </button>

          <button className="flex items-center justify-between p-5 bg-white dark:bg-white/5 backdrop-blur-md rounded-[20px] border border-slate-200 dark:border-white/10 shadow-sm hover:bg-slate-50 dark:hover:bg-white/10 transition-colors text-left">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#121216] flex items-center justify-center text-slate-600 dark:text-slate-300">
                <HelpCircle size={18} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-0.5">Ajuda</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">Central de ajuda e suporte</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-400" />
          </button>

          <button className="flex items-center justify-between p-5 bg-white dark:bg-white/5 backdrop-blur-md rounded-[20px] border border-slate-200 dark:border-white/10 shadow-sm hover:bg-slate-50 dark:hover:bg-white/10 transition-colors text-left">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#121216] flex items-center justify-center text-slate-600 dark:text-slate-300">
                <Lock size={18} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-0.5">Privacidade</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">Seus dados e segurança</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-400" />
          </button>

          <button onClick={onLogout} className="flex items-center justify-between p-5 bg-white dark:bg-white/5 backdrop-blur-md rounded-[20px] border border-slate-200 dark:border-white/10 shadow-sm hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-[#121216] flex items-center justify-center text-red-500">
                <LogOut size={18} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-red-600 dark:text-red-400 mb-0.5">Sair</h3>
                <p className="text-[11px] text-red-400 dark:text-red-500/70 leading-snug">Encerrar sua sessão</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-400" />
          </button>

        </div>
      </div>

    </motion.div>
  );
}
