import React from 'react';
import { 
  Home, 
  Calendar,
  Target,
  BarChart3,
  LayoutGrid,
  Bot
} from 'lucide-react';
import { TabType, User } from '../types';
import { AuraLogo } from './AuraLogo';

interface NavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  user: User | null;
  isDarkMode: boolean;
  onOpenProfile: () => void;
}

export function Navigation({ 
  activeTab, 
  onTabChange, 
  user, 
  onOpenProfile,
}: NavigationProps) {
  
  const navItems: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Início', icon: <Home size={20} /> },
    { id: 'calendar', label: 'Agenda', icon: <Calendar size={20} /> },
    { id: 'focus', label: 'Foco', icon: <Target size={20} /> },
    { id: 'finances', label: 'Finanças', icon: <BarChart3 size={20} /> },
    { id: 'more', label: 'Mais', icon: <LayoutGrid size={20} /> },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-50 dark:bg-[#070b14] border-r border-slate-200 dark:border-white/5 h-screen sticky top-0 overflow-y-auto">
      
      {/* Brand Header */}
      <div className="flex items-center gap-3 p-6 mb-4">
        <div className="h-10 w-10 flex items-center justify-center text-[#6366f1]">
          <AuraLogo className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white leading-none">NEXUS</h1>
          <h1 className="text-lg font-black tracking-tight text-[#6366f1] leading-none">FOCUS</h1>
        </div>
      </div>
      
      {/* Navigation Links */}
      <nav className="flex-1 px-4 space-y-2">
        <div className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase px-4 mb-4">Menu</div>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative group ${
                isActive 
                  ? 'bg-blue-50 text-[#6366f1] dark:bg-[#6366f1]/10 dark:text-[#6366f1] shadow-[0_4px_20px_rgba(99,102,241,0.05)]' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5'
              }`}
            >
              {/* Active neon border glow for dark mode */}
              {isActive && (
                <div className="hidden dark:block absolute inset-0 rounded-xl border border-[#6366f1]/30 shadow-[0_0_15px_rgba(99,102,241,0.2)] pointer-events-none"></div>
              )}
              {/* Left active indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#6366f1] rounded-r-full"></div>
              )}
              <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                {item.icon}
              </div>
              <span className={`font-semibold text-sm ${isActive ? 'tracking-wide' : ''}`}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Area */}
      <div className="p-4 mt-auto flex flex-col gap-3">
        {/* Mentor CTA */}
        <button onClick={() => onTabChange('chat')} className="w-full flex items-center gap-3 p-3 rounded-xl border border-[#6366f1]/20 bg-[#6366f1]/5 hover:bg-[#6366f1]/10 transition-colors text-left group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#6366f1]/0 via-[#6366f1]/10 to-[#6366f1]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
          <div className="w-8 h-8 rounded-full bg-[#6366f1]/10 flex items-center justify-center text-[#6366f1]">
            <Bot size={18} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-tight">Seu mentor sempre</p>
            <p className="text-xs font-bold text-slate-800 dark:text-white leading-tight mt-0.5">com você.</p>
          </div>
        </button>

        {/* User Profile Card */}
        <button 
          onClick={onOpenProfile}
          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors border border-transparent dark:hover:border-white/5 text-left"
        >
          <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 dark:bg-zinc-800 flex items-center justify-center border border-slate-300 dark:border-zinc-700">
            {user?.photoURL ? (
              <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span className="font-bold text-slate-500">{user?.name?.charAt(0) || 'U'}</span>
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-bold text-slate-800 dark:text-white truncate">Olá, {user?.name?.split(' ')[0] || 'Usuário'}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-[#6366f1] transition-colors">Ver perfil</p>
          </div>
        </button>
      </div>

    </aside>
  );
}
