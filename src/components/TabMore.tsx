import { motion } from 'motion/react';
import { User } from '../types';
import { FolderKanban, Target, StickyNote, LineChart, Bot, MessageCircle, LogOut, Moon, Sun, Lock, HelpCircle, ChevronRight, User as UserIcon } from 'lucide-react';

interface TabMoreProps {
  user: User | null;
  onTabChange: (tab: any) => void;
  onOpenProfile: () => void;
  onOpenWhatsApp: () => void;
  onToggleDarkMode: () => void;
  onLogout: () => void;
  isDarkMode: boolean;
}

export function TabMore({ user, onTabChange, onOpenProfile, onOpenWhatsApp, onToggleDarkMode, onLogout, isDarkMode }: TabMoreProps) {
  
  const ferramentas = [
    { id: 'projetos', name: 'Projetos', desc: 'Seus projetos em andamento', icon: <FolderKanban size={24} />, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { id: 'metas', name: 'Metas', desc: 'Transforme planos em realidade', icon: <Target size={24} />, color: 'text-indigo-500', bg: 'bg-indigo-100 dark:bg-indigo-900/30', action: () => onTabChange('goals') },
    { id: 'notas', name: 'Notas', desc: 'Suas ideias sempre por perto', icon: <StickyNote size={24} />, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30' },
    { id: 'relatorios', name: 'Relatórios', desc: 'Acompanhe sua evolução', icon: <LineChart size={24} />, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30', action: () => onTabChange('reports') },
    { id: 'mentor', name: 'Mentor IA', desc: 'Tire dúvidas e receba orientações', icon: <Bot size={24} />, color: 'text-[#6366f1]', bg: 'bg-[#6366f1]/20 dark:bg-[#6366f1]/30', action: () => onTabChange('chat') },
    { id: 'whatsapp', name: 'Mentor no WhatsApp', desc: 'Converse pelo WhatsApp', icon: <MessageCircle size={24} />, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30', action: onOpenWhatsApp },
  ];

  const conta = [
    { id: 'profile', name: 'Perfil', desc: 'Gerencie seus dados', icon: <UserIcon size={20} />, action: onOpenProfile },
    { id: 'theme', name: 'Aparência', desc: 'Tema, cores e personalização', icon: isDarkMode ? <Sun size={20} /> : <Moon size={20} />, action: onToggleDarkMode },
    { id: 'privacy', name: 'Privacidade', desc: 'Seus dados em segurança', icon: <Lock size={20} />, action: () => {} },
    { id: 'help', name: 'Ajuda', desc: 'Central de suporte', icon: <HelpCircle size={20} />, action: () => {} },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-full p-8"
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Mais</h1>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
          Tudo o que você precisa, em um só lugar.
        </p>
      </div>

      <div className="flex flex-col gap-10">
        
        {/* Ferramentas (Grid 3 cols) */}
        <div>
          <h2 className="font-bold text-sm text-slate-800 dark:text-white mb-6 uppercase tracking-widest px-2">Ferramentas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {ferramentas.map(item => (
              <button
                key={item.id}
                onClick={item.action}
                className="flex items-start gap-4 p-5 bg-white/70 dark:bg-slate-950/40 backdrop-blur-xl border border-slate-200/60 dark:border-blue-500/20 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all text-left group"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${item.bg} ${item.color} group-hover:scale-110 transition-transform shadow-sm`}>
                  {item.icon}
                </div>
                <div className="flex flex-col justify-center h-full">
                  <h3 className="font-bold text-[15px] text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors">{item.name}</h3>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Conta (Grid 2 cols for desktop) */}
        <div>
          <h2 className="font-bold text-sm text-slate-800 dark:text-white mb-6 uppercase tracking-widest px-2">Conta</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {conta.map(item => (
              <button
                key={item.id}
                onClick={item.action}
                className="flex items-center gap-4 p-5 bg-white/70 dark:bg-slate-950/40 backdrop-blur-xl border border-slate-200/60 dark:border-blue-500/20 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] hover:bg-white/90 dark:hover:bg-slate-900/60 hover:border-blue-500/30 transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/40 dark:border-blue-500/20 text-slate-600 dark:text-slate-300 flex items-center justify-center group-hover:text-blue-500 transition-colors shadow-sm">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-bold text-[15px] text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors">{item.name}</h3>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                </div>
                <ChevronRight className="ml-auto text-slate-400 dark:text-slate-500 group-hover:text-blue-500" size={20} />
              </button>
            ))}
          </div>
          
          <button
            onClick={onLogout}
            className="flex items-center gap-4 p-5 bg-white/70 dark:bg-slate-950/40 backdrop-blur-xl border border-rose-200/60 dark:border-rose-500/20 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] hover:bg-rose-500/10 dark:hover:bg-rose-950/30 hover:border-rose-500/40 transition-all text-left w-full group md:w-[calc(50%-8px)]"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-sm">
              <LogOut size={20} />
            </div>
            <div>
              <h3 className="font-bold text-[15px] text-rose-600 dark:text-rose-400">Sair</h3>
              <p className="text-xs font-medium text-rose-500/80 dark:text-rose-400/60 mt-0.5">Encerrar sua sessão</p>
            </div>
            <ChevronRight className="ml-auto text-rose-400 dark:text-rose-500/50" size={20} />
          </button>
        </div>

      </div>
    </motion.div>
  );
}


