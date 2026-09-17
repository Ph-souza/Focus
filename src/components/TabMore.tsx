import { motion } from 'motion/react';
import { User } from '../types';
import { FolderKanban, Target, StickyNote, LineChart, Bot, MessageCircle, LogOut, Moon, Sun, Lock, HelpCircle } from 'lucide-react';

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
    { id: 'profile', name: 'Perfil', desc: 'Gerencie seus dados', icon: <User size={20} />, action: onOpenProfile },
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
                className="flex items-start gap-4 p-5 bg-white dark:bg-[#0b101e] border border-slate-200 dark:border-white/5 rounded-[24px] shadow-sm hover:shadow-md hover:border-[#3b82f6] dark:hover:border-[#6366f1]/50 transition-all text-left group"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${item.bg} ${item.color} group-hover:scale-110 transition-transform`}>
                  {item.icon}
                </div>
                <div className="flex flex-col justify-center h-full">
                  <h3 className="font-bold text-[15px] text-slate-800 dark:text-slate-200 group-hover:text-[#3b82f6] dark:group-hover:text-[#6366f1] transition-colors">{item.name}</h3>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Conta (Grid 2 cols for desktop looks great) */}
        <div>
          <h2 className="font-bold text-sm text-slate-800 dark:text-white mb-6 uppercase tracking-widest px-2">Conta</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {conta.map(item => (
              <button
                key={item.id}
                onClick={item.action}
                className="flex items-center gap-4 p-5 bg-white dark:bg-[#0b101e] border border-slate-200 dark:border-white/5 rounded-[24px] shadow-sm hover:bg-slate-50 dark:hover:bg-white/5 transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-[#111827] text-slate-500 dark:text-slate-400 flex items-center justify-center group-hover:text-[#3b82f6] dark:group-hover:text-[#6366f1] transition-colors">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-bold text-[15px] text-slate-800 dark:text-slate-200">{item.name}</h3>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                </div>
                <ChevronRight className="ml-auto text-slate-300 dark:text-slate-600 group-hover:text-[#3b82f6] dark:group-hover:text-[#6366f1]" size={20} />
              </button>
            ))}
          </div>
          
          <button
            onClick={onLogout}
            className="flex items-center gap-4 p-5 bg-white dark:bg-[#0b101e] border border-rose-100 dark:border-rose-900/30 rounded-[24px] shadow-sm hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all text-left w-full group md:w-[calc(50%-8px)]"
          >
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-500 flex items-center justify-center">
              <LogOut size={20} />
            </div>
            <div>
              <h3 className="font-bold text-[15px] text-rose-600 dark:text-rose-400">Sair</h3>
              <p className="text-xs font-medium text-rose-400/80 dark:text-rose-400/60 mt-0.5">Encerrar sua sessão</p>
            </div>
            <ChevronRight className="ml-auto text-rose-300 dark:text-rose-600/50" size={20} />
          </button>
        </div>

      </div>
    </motion.div>
  );
}

// Inline dummy component to fix import locally if needed, but normally use lucide-react
import { ChevronRight } from 'lucide-react';
