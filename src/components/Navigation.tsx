import { Link } from 'react-router-dom';
import { 
  Home, 
  Calendar,
  Folder,
  Target,
  BarChart3,
  LayoutGrid,
  MoreHorizontal,
  Bot,
  Sun,
  Moon,
  Shield
} from 'lucide-react';
import { TabType, User } from '../types';
import { AuraLogo } from './AuraLogo';
import { isAdmin } from '../contexts/AuthContext';

interface NavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  user: User | null;
  isDarkMode: boolean;
  onOpenProfile: () => void;
  onToggleDarkMode?: () => void;
  appointments?: any[];
  tasks?: any[];
  onOpenFocusMode?: () => void;
  onOpenSmartCapture?: () => void;
}

export function Navigation({ 
  activeTab, 
  onTabChange, 
  user, 
  isDarkMode,
  onToggleDarkMode,
  onOpenProfile,
}: NavigationProps) {
  
  const navItems: { id: TabType; label: string; icon: React.ReactNode; mobileIcon: React.ReactNode }[] = [
    { id: 'home', label: 'Início', icon: <Home size={20} />, mobileIcon: <Home size={22} className={activeTab === 'home' ? 'fill-blue-500/20' : ''} /> },
    { id: 'calendar', label: 'Agenda', icon: <Calendar size={20} />, mobileIcon: <Calendar size={22} /> },
    { id: 'projects', label: 'Projetos', icon: <Folder size={20} />, mobileIcon: <Folder size={22} /> },
    { id: 'focus', label: 'Foco', icon: <Target size={20} />, mobileIcon: <Target size={22} /> },
    { id: 'finances', label: 'Finanças', icon: <BarChart3 size={20} />, mobileIcon: <BarChart3 size={22} /> },
    { id: 'more', label: 'Mais', icon: <LayoutGrid size={20} />, mobileIcon: <MoreHorizontal size={22} /> },
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

          {isAdmin(user?.email) && (
            <div className="pt-2">
              <Link
                to="/painel"
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 group"
              >
                <div className="text-blue-500 transition-transform group-hover:scale-110">
                  <Shield size={17} />
                </div>
                <span className="text-sm font-bold tracking-wide">Painel Admin</span>
                <span className="ml-auto bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">
                  Admin
                </span>
              </Link>
            </div>
          )}
        </nav>

        {/* Footer Area */}
        <div className="p-4 mt-auto flex flex-col gap-3 bg-transparent border-t border-slate-200/40 dark:border-blue-500/15 pt-4">
          
          {/* Elemento 1: Mentor CTA (Compacto) */}
          <button 
            onClick={() => onTabChange('chat')} 
            className="w-full flex items-center gap-2.5 p-2.5 rounded-2xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 transition-all text-left group relative overflow-hidden shadow-[0_0_15px_rgba(59,130,246,0.08)] hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none"></div>
            <div className="w-7 h-7 rounded-full bg-blue-500/15 flex items-center justify-center text-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.25)] shrink-0">
              <Bot size={15} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-tight truncate">Seu mentor sempre</p>
              <p className="text-[11px] font-bold text-slate-800 dark:text-white leading-tight mt-0.5 truncate">com você.</p>
            </div>
          </button>

          {/* Elemento 2: Novo Toggle de Tema (Fiel à referência) */}
          <div className="flex items-center justify-between px-2 py-0.5">
            <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
              {isDarkMode ? (
                <Sun size={18} className="text-slate-400" />
              ) : (
                <Sun size={18} className="text-amber-500" />
              )}
              <span className="text-sm font-medium">Tema</span>
            </div>

            {/* Toggle Switch em formato de pílula */}
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="w-14 h-7 rounded-full p-0.5 relative cursor-pointer border border-slate-300/60 dark:border-blue-500/40 shadow-inner overflow-hidden flex items-center transition-all bg-slate-200 dark:bg-[#0d1824] active:scale-95"
              aria-label="Alternar tema claro/escuro"
              title={isDarkMode ? "Alternar para tema claro" : "Alternar para tema escuro"}
            >
              {/* Metade Esquerda (Claro / Thumb branco) */}
              <div className={`w-1/2 h-full rounded-l-full flex items-center justify-center transition-all ${
                !isDarkMode 
                  ? 'bg-amber-400/20 text-amber-500' 
                  : 'bg-white/90 dark:bg-slate-200/90 text-slate-400'
              }`}>
                <div className="w-4 h-4 rounded-full bg-white shadow-sm flex items-center justify-center">
                  {!isDarkMode ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400/70"></span>
                  )}
                </div>
              </div>

              {/* Metade Direita (Escuro / Lua Azul) */}
              <div className={`w-1/2 h-full rounded-r-full flex items-center justify-center transition-all ${
                isDarkMode 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'bg-transparent text-slate-400'
              }`}>
                <Moon size={11} className={isDarkMode ? "fill-white text-white" : "text-slate-400"} />
              </div>
            </button>
          </div>

          {/* Elemento 3: Cartão de Perfil */}
          <button 
            onClick={onOpenProfile}
            className="w-full flex items-center gap-3 p-2.5 rounded-2xl bg-white/10 dark:bg-white/5 hover:bg-white/20 dark:hover:bg-white/10 border border-slate-200/40 dark:border-blue-500/20 transition-all text-left group shadow-none cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full overflow-hidden bg-blue-600 flex items-center justify-center border border-blue-500/30 text-white font-bold text-sm shrink-0 shadow-sm">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span>{user?.name?.charAt(0) || 'P'}</span>
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                {user?.name?.split(' ')[0] || 'Phillipe'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 group-hover:text-blue-500 transition-colors">
                Nexus Focus
              </p>
            </div>
          </button>

        </div>

      </aside>

      {/* Mobile Floating Bottom Bar */}
      <nav className="md:hidden fixed bottom-3 left-4 right-4 max-w-lg mx-auto glass-card z-50 flex items-center justify-around px-2 py-2 shadow-[0_12px_35px_rgba(0,0,0,0.15)] border border-white/80 dark:border-blue-500/30">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 relative ${
                isActive 
                  ? 'text-blue-600 dark:text-blue-400 font-bold' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white font-medium'
              }`}
            >
              <div className={`transition-all duration-200 ${isActive ? 'scale-110 drop-shadow-[0_0_10px_rgba(59,130,246,0.6)]' : 'opacity-80'}`}>
                {item.mobileIcon || item.icon}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.9)] mt-0.5"></div>
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
}
