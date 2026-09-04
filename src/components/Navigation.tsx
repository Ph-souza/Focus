import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  PiggyBank, 
  CheckSquare, 
  Moon, 
  Sun, 
  ChevronLeft, 
  ChevronRight, 
  PieChart, 
  Home, 
  BarChart3, 
  Package, 
  Sparkles, 
  Target 
} from 'lucide-react';
import { TabType, User, Appointment, Task } from '../types';
import { AuraLogo } from './AuraLogo';
import { CalendarModal } from './CalendarModal';

interface NavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  user: User | null;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenProfile: () => void;
  appointments?: Appointment[];
  tasks?: Task[];
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
  appointments = [], 
  tasks = [],
  onOpenFocusMode,
  onOpenSmartCapture 
}: NavigationProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);

  const today = new Date();
  const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  
  const navItems: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'transactions', label: 'Transações', icon: <ArrowLeftRight size={20} /> },
    { id: 'reports', label: 'Relatórios', icon: <PieChart size={20} /> },
    { id: 'goals', label: 'Caixinhas', icon: <PiggyBank size={20} /> },
    { id: 'tasks', label: 'Tarefas', icon: <CheckSquare size={20} /> },
    { id: 'chat', label: 'Mentor (IA)', icon: <Sparkles size={20} /> },
  ];

  const meetings = appointments.reduce((acc, apt) => {
    if (!acc[apt.day]) {
      acc[apt.day] = [];
    }
    acc[apt.day].push({ title: apt.title, time: apt.time, type: apt.type });
    return acc;
  }, {} as Record<number, { title: string; time: string; type: string }[]>);

  // Dias com tarefas no mês atual para o mini-calendário
  const taskDaysThisMonth = tasks.reduce((acc, t) => {
    const d = (t.deadline || t.date || '').split('T')[0];
    if (d) {
      const parts = d.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        if (y === today.getFullYear() && m === today.getMonth()) {
          acc[day] = true;
        }
      }
    }
    return acc;
  }, {} as Record<number, boolean>);

  // Simple hardcoded calendar for desktop sidebar
  const renderCalendar = () => {
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    return (
      <div className="mt-6 px-4 hidden lg:block relative">
        <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Agenda Mensal</h3>
        <div 
          onClick={() => setIsCalendarModalOpen(true)}
          className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-700 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors"
        >
          <div className="flex items-center justify-between mb-3 text-slate-800 dark:text-slate-200">
            <button className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors invisible"><ChevronLeft size={16} /></button>
            <span className="text-xs font-bold">{monthNames[today.getMonth()]} {today.getFullYear()}</span>
            <button className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors invisible"><ChevronRight size={16} /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['D','S','T','Q','Q','S','S'].map((d, i) => (
              <span key={i} className="text-[10px] font-medium text-slate-400">{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 text-center font-medium text-xs pointer-events-none">
            {Array.from({ length: Math.min(31, daysInMonth) }).map((_, i) => {
              const day = i + 1;
              const isToday = day === today.getDate();
              const hasMeeting = !!meetings[day] || !!taskDaysThisMonth[day];
              const isSelected = selectedDay === day;
              
              return (
                <div 
                  key={i} 
                  className={`w-6 h-6 flex items-center justify-center rounded-full transition-colors relative ${
                    isSelected ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400' :
                    isToday ? 'bg-indigo-600 text-white shadow-sm font-bold' : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {day}
                  {hasMeeting && !isToday && !isSelected && (
                    <span className="absolute bottom-0 w-1 h-1 bg-indigo-500 rounded-full"></span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-3 text-center text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            Ver Calendário Completo
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <CalendarModal 
        isOpen={isCalendarModalOpen} 
        onClose={() => setIsCalendarModalOpen(false)} 
        appointments={appointments}
        tasks={tasks}
        user={user || undefined}
      />

      {/* ========================================================================= */}
      {/* Mobile Bottom Navigation (Responsive PWA Bottom Bar)                      */}
      {/* ========================================================================= */}
      <nav 
        aria-label="Navegação Inferior"
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-[#09090b]/95 backdrop-blur-xl text-slate-800 dark:text-white border-t border-slate-200/80 dark:border-[#27272a]/80 px-2 py-1.5 flex justify-between items-center z-50 shadow-[0_-4px_25px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_30px_rgba(0,0,0,0.7)] pb-[max(0.375rem,env(safe-area-inset-bottom))]"
      >
        <div className="flex w-full justify-around items-center relative">
          {/* 1. Home Button */}
          <button 
            type="button"
            onClick={() => onTabChange('home')} 
            className={`flex flex-col items-center p-1.5 text-[10px] transition-all rounded-xl relative z-10 w-16 cursor-pointer ${
              activeTab === 'home' 
                ? 'text-indigo-600 dark:text-indigo-400 font-bold scale-105' 
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-medium'
            }`}
          >
            <div className="mb-0.5 relative">
              <Home size={21} className={activeTab === 'home' ? 'text-indigo-600 dark:text-indigo-400' : ''} />
              {activeTab === 'home' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-full"></span>
              )}
            </div>
            <span>Home</span>
          </button>
          
          {/* 2. Finanças Button */}
          <button 
            type="button"
            onClick={() => onTabChange('transactions')} 
            className={`flex flex-col items-center p-1.5 text-[10px] transition-all rounded-xl relative z-10 w-16 cursor-pointer ${
              activeTab === 'transactions' || activeTab === 'reports' 
                ? 'text-indigo-600 dark:text-indigo-400 font-bold scale-105' 
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-medium'
            }`}
          >
            <div className="mb-0.5 relative">
              <BarChart3 size={21} className={activeTab === 'transactions' || activeTab === 'reports' ? 'text-indigo-600 dark:text-indigo-400' : ''} />
              {(activeTab === 'transactions' || activeTab === 'reports') && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-full"></span>
              )}
            </div>
            <span>Finanças</span>
          </button>

          {/* Spacer reserved for center floating action button */}
          <div className="w-14 shrink-0 pointer-events-none" aria-hidden="true"></div>

          {/* 3. Central Floating Action Button (FAB) -> Target / Modo Foco */}
          <div className="absolute left-1/2 -top-5 -translate-x-1/2 flex flex-col justify-center items-center z-20">
            <button 
              type="button"
              onClick={() => {
                if (onOpenFocusMode) {
                  onOpenFocusMode();
                } else {
                  onTabChange('tasks');
                }
              }}
              title="Abrir Modo Foco"
              aria-label="Abrir Modo Foco"
              className="w-13 h-13 sm:w-14 sm:h-14 bg-gradient-to-tr from-indigo-600 via-indigo-500 to-indigo-400 text-white rounded-full flex items-center justify-center shadow-[0_8px_20px_rgba(99,102,241,0.45)] hover:shadow-[0_10px_25px_rgba(99,102,241,0.6)] hover:scale-105 active:scale-95 transition-all cursor-pointer border-[3.5px] border-white dark:border-[#09090b] relative group"
            >
              <Target size={26} className="text-white group-hover:rotate-12 transition-transform duration-300" />
            </button>
            <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-tight mt-0.5 pointer-events-none">
              Foco
            </span>
          </div>

          {/* 4. Caixinhas Button */}
          <button 
            type="button"
            onClick={() => onTabChange('goals')} 
            className={`flex flex-col items-center p-1.5 text-[10px] transition-all rounded-xl relative z-10 w-16 cursor-pointer ${
              activeTab === 'goals' 
                ? 'text-indigo-600 dark:text-indigo-400 font-bold scale-105' 
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-medium'
            }`}
          >
            <div className="mb-0.5 relative">
              <Package size={21} className={activeTab === 'goals' ? 'text-indigo-600 dark:text-indigo-400' : ''} />
              {activeTab === 'goals' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-full"></span>
              )}
            </div>
            <span>Caixinhas</span>
          </button>

          {/* 5. Tarefas Button (Substituindo o antigo botão Aurora) */}
          <button 
            type="button"
            onClick={() => onTabChange('tasks')} 
            className={`flex flex-col items-center p-1.5 text-[10px] transition-all rounded-xl relative z-10 w-16 cursor-pointer ${
              activeTab === 'tasks' 
                ? 'text-indigo-600 dark:text-indigo-400 font-bold scale-105' 
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-medium'
            }`}
          >
            <div className="mb-0.5 relative">
              <CheckSquare size={21} className={activeTab === 'tasks' ? 'text-indigo-600 dark:text-indigo-400' : ''} />
              {activeTab === 'tasks' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-full"></span>
              )}
            </div>
            <span>Tarefas</span>
          </button>
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* Desktop Sidebar Navigation                                                */}
      {/* ========================================================================= */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white dark:bg-gradient-to-br dark:from-[#09090b] dark:to-[#18181b]/50 border-r border-slate-200 dark:border-[#27272a]/80 h-screen sticky top-0 custom-scrollbar overflow-y-auto relative z-20">
        <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none"></div>
        
        {/* Brand Header */}
        <div className="flex items-center justify-between p-6 mb-2 relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-br from-[#27272a] to-[#09090b] border border-[#3f3f46] rounded-xl flex items-center justify-center shadow-lg relative overflow-hidden backdrop-blur-md flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-yellow-500/10 mix-blend-overlay"></div>
              <AuraLogo className="w-6 h-6 relative z-10" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-slate-800 dark:text-white leading-tight drop-shadow-sm">AURA SYNC</h1>
              <p className="text-[9px] uppercase tracking-widest text-slate-500 dark:text-[#afafaf] font-bold leading-none mt-1">POWERED BY NEXUS FLOW</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onToggleDarkMode} 
            className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-white bg-slate-50 dark:bg-[#121214] rounded-lg transition-colors border border-slate-100 dark:border-[#27272a] cursor-pointer"
            title={isDarkMode ? "Modo Claro" : "Modo Escuro"}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {/* Quick Action: Modo Foco (Pomodoro) */}
        <div className="px-4 mb-3 relative z-10">
          <button
            type="button"
            onClick={() => {
              if (onOpenFocusMode) {
                onOpenFocusMode();
              } else {
                onTabChange('tasks');
              }
            }}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 font-semibold text-xs hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all cursor-pointer shadow-sm group"
          >
            <div className="flex items-center gap-2.5">
              <Target size={18} className="text-indigo-600 dark:text-indigo-400 group-hover:rotate-45 transition-transform duration-300" />
              <span>Modo Foco</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-600 text-white font-bold tracking-wider uppercase">
              Iniciar
            </span>
          </button>
        </div>
        
        {/* Navigation Items */}
        <nav className="px-4 space-y-1 relative z-10">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer ${
                activeTab === item.id 
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium border border-transparent dark:border-indigo-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]' 
                  : 'text-slate-500 dark:text-[#afafaf] hover:bg-slate-50 dark:hover:bg-[#121214] font-medium dark:hover:text-white'
              }`}
            >
              <div className="flex items-center justify-center">
                {item.icon}
              </div>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {renderCalendar()}

        {/* User Profile Card */}
        <div className="mt-auto p-6 cursor-pointer relative z-10" onClick={onOpenProfile}>
          {user?.isDemo && (
            <div className="mb-3 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center shadow-sm">
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 tracking-wider uppercase block">
                ⚡ Modo Demo Ativo
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5 hover:underline">
                Alternar para Conta Real →
              </span>
            </div>
          )}
          <div className="p-4 bg-slate-50 dark:bg-gradient-to-br dark:from-[#18181b] dark:to-[#121214] rounded-[16px] border border-slate-100 dark:border-[#27272a]/80 shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all hover:-translate-y-1 group overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
            <div className="flex items-center gap-3 mb-3 relative z-10">
              <div className="w-8 h-8 rounded-[10px] bg-indigo-500/10 flex items-center justify-center text-indigo-500 font-bold text-xs uppercase border border-indigo-500/20 overflow-hidden">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  user?.name?.charAt(0) || 'U'
                )}
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{user?.name || 'User'}</p>
            </div>
            <div className="h-1 bg-slate-200 dark:bg-[#27272a] rounded-full w-full relative z-10 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#F59E0B]/50 to-[#F59E0B] w-full rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
            </div>
            <p className="text-[9px] tracking-widest uppercase font-bold text-[#F59E0B] mt-2 relative z-10 text-right">Acesso Elite</p>
          </div>
        </div>
      </aside>
    </>
  );
}

