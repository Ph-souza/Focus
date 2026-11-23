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
  CheckSquare,
  FileText,
  Repeat,
  Timer,
  Plus
} from 'lucide-react';
import { TabType, User } from '../types';

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
  onOpenSmartCapture
}: NavigationProps) {
  
  // Itens da barra inferior Mobile (mantido intacto)
  const mobileNavItems: { id: TabType; label: string; icon: React.ReactNode; mobileIcon: React.ReactNode }[] = [
    { id: 'home', label: 'Início', icon: <Home size={20} />, mobileIcon: <Home size={22} className={activeTab === 'home' ? 'fill-blue-500/20' : ''} /> },
    { id: 'calendar', label: 'Agenda', icon: <Calendar size={20} />, mobileIcon: <Calendar size={22} /> },
    { id: 'projects', label: 'Projetos', icon: <Folder size={20} />, mobileIcon: <Folder size={22} /> },
    { id: 'focus', label: 'Foco', icon: <Target size={20} />, mobileIcon: <Target size={22} /> },
    { id: 'finances', label: 'Finanças', icon: <BarChart3 size={20} />, mobileIcon: <BarChart3 size={22} /> },
    { id: 'more', label: 'Mais', icon: <LayoutGrid size={20} />, mobileIcon: <MoreHorizontal size={22} /> },
  ];

  // Itens do Dock Flutuante Desktop (substitui a antiga sidebar em todas as telas)
  const desktopDockItems: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Início', icon: <LayoutGrid size={15} /> },
    { id: 'projects', label: 'Projetos', icon: <CheckSquare size={15} /> },
    { id: 'calendar', label: 'Agenda', icon: <Calendar size={15} /> },
    { id: 'goals', label: 'Metas', icon: <Repeat size={15} /> },
    { id: 'focus', label: 'Foco', icon: <Timer size={15} /> },
    { id: 'finances', label: 'Finanças', icon: <BarChart3 size={15} /> },
    { id: 'chat', label: 'Mentor IA', icon: <Bot size={15} /> },
    { id: 'more', label: 'Mais', icon: <FileText size={15} /> },
  ];

  const handleQuickPlus = () => {
    if (activeTab === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const input = document.querySelector<HTMLInputElement>('#desktop-quick-capture-input');
      if (input) input.focus();
    } else if (onOpenSmartCapture) {
      onOpenSmartCapture();
    } else {
      onTabChange('home');
    }
  };

  return (
    <>
      {/* =================================================================== */}
      {/* DESKTOP FLOATING BOTTOM DOCK (Substitui a antiga Sidebar lateral)   */}
      {/* =================================================================== */}
      <nav
        aria-label="Navegação principal"
        className="hidden md:flex fixed bottom-5 left-1/2 -translate-x-1/2 z-40 items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[#18181d]/95 border border-white/15 shadow-[0_14px_45px_rgba(0,0,0,0.85)] backdrop-blur-xl select-none"
      >
        {desktopDockItems.map((item) => {
          const isActive =
            activeTab === item.id ||
            (item.id === 'finances' && (activeTab === 'transactions' || activeTab === 'reports'));

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              title={item.label}
              className={`flex items-center gap-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'px-3.5 py-1.5 bg-white/12 text-white shadow-sm border border-white/10'
                  : 'p-2 text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {item.icon}
              {isActive && <span>{item.label}</span>}
            </button>
          );
        })}

        {/* Divisor vertical sutil */}
        <div className="w-px h-4 bg-white/10 mx-0.5" />

        {/* Toggle de Tema Claro/Escuro */}
        {onToggleDarkMode && (
          <button
            type="button"
            onClick={onToggleDarkMode}
            title={isDarkMode ? 'Alternar para tema claro' : 'Alternar para tema escuro'}
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            {isDarkMode ? <Moon size={14} className="text-blue-400" /> : <Sun size={14} className="text-amber-400" />}
          </button>
        )}

        {/* Avatar / Perfil no Dock */}
        <button
          type="button"
          onClick={onOpenProfile}
          title={user?.name ? `Perfil (${user.name})` : 'Perfil'}
          className="w-7 h-7 rounded-full overflow-hidden border border-white/20 bg-zinc-800 hover:ring-2 hover:ring-white/30 flex items-center justify-center text-[11px] font-bold text-white transition-all cursor-pointer shrink-0"
        >
          {user?.photoURL ? (
            <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <span>{user?.name?.charAt(0) || 'P'}</span>
          )}
        </button>

        {/* Botão Circular Branco '+' para Captura Rápida */}
        <button
          type="button"
          onClick={handleQuickPlus}
          title="Captura rápida"
          className="ml-0.5 w-7 h-7 rounded-full bg-white text-black hover:bg-zinc-200 flex items-center justify-center shadow transition-transform active:scale-95 cursor-pointer shrink-0"
        >
          <Plus size={15} strokeWidth={2.5} />
        </button>
      </nav>

      {/* =================================================================== */}
      {/* MOBILE FLOATING BOTTOM BAR                                          */}
      {/* =================================================================== */}
      <nav className="md:hidden fixed bottom-3 left-4 right-4 max-w-lg mx-auto glass-card z-50 flex items-center justify-around px-2 py-2 shadow-[0_12px_35px_rgba(0,0,0,0.15)] border border-white/80 dark:border-blue-500/30">
        {mobileNavItems.map((item) => {
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
