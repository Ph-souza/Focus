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
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white/15 dark:bg-slate-950/25 backdrop-blur-xl border-r border-slate-200/40 dark:border-blue-500/20 shadow-[4px_0_24px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] h-screen sticky top-0 overflow-y-auto z-20 transition-all duration-300">
        
        {/* Brand Header */}
        <div className="flex items-center gap-3 p-6 mb-2 bg-transparent">
          <div className="h-10 w-10 flex items-center justify-center text-blue-500">
            <AuraLogo className="w-8 h-8 drop-shadow-[0_0_12px_rgba(59,130,246,0.5)]" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white leading-none">NEXUS</h1>
            <h1 className="text-lg font-black tracking-tight text-blue-500 leading-none">FOCUS</h1>
          </div>
        </div>
        
        {/* Navigation Links */}
        <nav className="flex-1 px-4 space-y-1.5">
          <div className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase px-4 mb-3">Menu</div>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 relative group ${
                  isActive 
                    ? 'bg-blue-500/15 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 font-bold shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/20 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5'
                }`}
              >
                {/* Active neon border glow */}
                {isActive && (
                  <div className="absolute inset-0 rounded-2xl border border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.25)] pointer-events-none"></div>
                )}
                {/* Left active indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-blue-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
                )}
                <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                  {item.icon}
                </div>
                <span className={`text-sm ${isActive ? 'tracking-wide' : 'font-medium'}`}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer Area */}
        <div className="p-4 mt-auto flex flex-col gap-3 bg-transparent">
          {/* Mentor CTA */}
          <button 
            onClick={() => onTabChange('chat')} 
            className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 transition-all text-left group relative overflow-hidden shadow-[0_0_15px_rgba(59,130,246,0.1)] hover:shadow-[0_0_20px_rgba(59,130,246,0.25)]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            <div className="w-8 h-8 rounded-full bg-blue-500/15 flex items-center justify-center text-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]">
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
            className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white/10 dark:bg-white/5 hover:bg-white/20 dark:hover:bg-white/10 border border-slate-200/40 dark:border-blue-500/20 transition-all text-left group shadow-none"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-500/10 flex items-center justify-center border border-blue-500/30 shrink-0">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="font-bold text-blue-500">{user?.name?.charAt(0) || 'U'}</span>
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-slate-800 dark:text-white truncate">Olá, {user?.name?.split(' ')[0] || 'Usuário'}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 group-hover:text-blue-500 transition-colors">Ver perfil</p>
            </div>
          </button>
        </div>

      </aside>

      {/* Mobile Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/25 dark:bg-slate-950/35 backdrop-blur-xl border-t border-slate-200/40 dark:border-blue-500/20 z-50 flex items-center justify-around px-2 py-2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative ${
                isActive 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                {item.icon}
              </div>
              <span className={`text-[10px] mt-0.5 ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.8)] mt-0.5"></div>
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
}
