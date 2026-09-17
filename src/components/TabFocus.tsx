import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Task, User } from '../types';
import { Play, Pause, Square, SkipForward, Check, ChevronRight, Moon, Bot } from 'lucide-react';

interface TabFocusProps {
  tasks: Task[];
  setTasks?: React.Dispatch<React.SetStateAction<Task[]>>;
  user: User | null;
  onTabChange?: (tab: any) => void;
}

export function TabFocus({ tasks, onTabChange }: TabFocusProps) {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);

  // Focus Timer Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);
  
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = ((25 * 60 - timeLeft) / (25 * 60)) * 100;
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto flex flex-col gap-6 px-4 md:px-8 py-6"
    >
      {/* Header */}
      <div className="flex justify-between items-end mb-2">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">Foco</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Menos distração. Mais resultados.</p>
        </div>
        <button className="px-4 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-[12px] flex items-center gap-2 transition-colors">
          <Moon size={14} />
          Modo Profundo
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left: Timer & Metrics */}
        <div className="flex flex-col gap-6">
          
          <div className="bg-white dark:bg-[#0a0a0f] backdrop-blur-md rounded-[32px] p-8 shadow-sm border border-slate-200 dark:border-white/5 flex flex-col items-center justify-center relative overflow-hidden h-[420px]">
            {/* Top Tabs */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-slate-100 dark:bg-white/5 p-1 rounded-full flex">
              <button className="px-5 py-1.5 rounded-full bg-white dark:bg-white/10 text-slate-800 dark:text-white text-[11px] font-bold shadow-sm">Pomodoro</button>
              <button className="px-5 py-1.5 rounded-full text-slate-500 text-[11px] font-bold hover:text-slate-700 dark:hover:text-slate-300">Tarefa</button>
              <button className="px-5 py-1.5 rounded-full text-slate-500 text-[11px] font-bold hover:text-slate-700 dark:hover:text-slate-300">Estatísticas</button>
            </div>

            {/* Circular Timer */}
            <div className="relative mt-8 flex items-center justify-center group">
              {/* SVG Ring */}
              <svg className="w-72 h-72 transform -rotate-90">
                <circle
                  cx="144"
                  cy="144"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-slate-100 dark:text-white/5"
                />
                <circle
                  cx="144"
                  cy="144"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="text-blue-500 dark:text-blue-500 transition-all duration-1000 ease-linear drop-shadow-[0_0_12px_rgba(59,130,246,0.6)]"
                  strokeLinecap="round"
                />
              </svg>
              
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-bold text-blue-500 uppercase tracking-widest mb-1">Foco</span>
                <span className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">{formatTime(timeLeft)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4 mt-8">
              <button className="w-12 h-12 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                <Square size={18} fill="currentColor" />
              </button>
              <button 
                onClick={toggleTimer}
                className="w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-[0_4px_20px_rgba(37,99,235,0.4)] transition-transform active:scale-95"
              >
                {isActive ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
              </button>
              <button className="w-12 h-12 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                <SkipForward size={20} fill="currentColor" />
              </button>
            </div>
            
            <p className="mt-6 text-[11px] font-bold text-slate-400 tracking-widest uppercase">3/4 Sessões</p>
          </div>

          {/* Métricas de Produtividade */}
          <div className="bg-white dark:bg-white/5 backdrop-blur-md rounded-[24px] p-6 shadow-sm border border-slate-200 dark:border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Métricas de produtividade</h3>
              <ChevronRight size={16} className="text-slate-400" />
            </div>
            
            <div className="flex justify-between">
              <div className="flex flex-col items-center flex-1">
                <span className="text-2xl font-black text-slate-900 dark:text-white">1h 15m</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Tempo focado</span>
              </div>
              <div className="w-[1px] bg-slate-200 dark:bg-white/10"></div>
              <div className="flex flex-col items-center flex-1">
                <span className="text-2xl font-black text-emerald-500">87%</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Produtividade</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Task Details & History */}
        <div className="flex flex-col gap-6">
          
          {/* Tarefa em foco */}
          <div className="bg-white dark:bg-white/5 backdrop-blur-md rounded-[24px] p-6 shadow-sm border border-slate-200 dark:border-white/10 flex-1 flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Tarefa em foco</h3>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">Trabalho</span>
            </div>
            
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Revisão do projeto</h2>
            <div className="flex justify-between items-center text-xs text-slate-500 mb-6">
              <span>1 de 4 subtarefas</span>
              <span className="font-bold text-blue-500">25%</span>
            </div>
            
            {/* Progress bar */}
            <div className="w-full h-2 bg-slate-100 dark:bg-white/10 rounded-full mb-6 overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: '25%' }}></div>
            </div>

            <div className="flex flex-col gap-3">
              {[
                { title: 'Ler brief novamente', checked: true },
                { title: 'Revisar pontos principais', checked: false },
                { title: 'Atualizar documento', checked: false },
                { title: 'Preparar apresentação', checked: false },
              ].map((sub, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <button className={`w-5 h-5 rounded-md flex items-center justify-center border ${sub.checked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 dark:border-slate-600 text-transparent hover:border-blue-500'}`}>
                    <Check size={12} strokeWidth={3} />
                  </button>
                  <span className={`text-sm font-medium ${sub.checked ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-700 dark:text-slate-300'}`}>{sub.title}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-6">
            {/* Blocos de Foco de Hoje */}
            <div className="bg-white dark:bg-white/5 backdrop-blur-md rounded-[24px] p-6 shadow-sm border border-slate-200 dark:border-white/10 flex-[2]">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-6">Blocos de foco hoje</h3>
              <div className="flex items-end gap-1 h-16">
                {[10, 20, 15, 30, 40, 20, 10, 5, 25, 30, 10, 5, 0, 0].map((h, i) => (
                  <div key={i} className="flex-1 bg-blue-500/20 dark:bg-blue-500/30 rounded-t-sm hover:bg-blue-500 dark:hover:bg-blue-500 transition-colors" style={{ height: `${Math.max(10, h)}%` }}></div>
                ))}
              </div>
              <div className="flex justify-between text-[9px] text-slate-400 mt-2 font-medium">
                <span>08h</span>
                <span>12h</span>
                <span>16h</span>
                <span>20h</span>
              </div>
            </div>

            {/* Insight do Mentor */}
            <div className="bg-[#f0f9ff] dark:bg-[#1a233a]/80 border border-blue-100 dark:border-blue-900/50 rounded-[24px] p-6 shadow-sm flex-1 relative overflow-hidden flex flex-col justify-center">
              <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-blue-400/20 dark:bg-[#6366f1]/20 rounded-full blur-2xl"></div>
              <div className="flex items-center gap-2 mb-3 relative z-10">
                <Bot size={16} className="text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-[11px] text-slate-900 dark:text-white uppercase tracking-wider">Insight do Mentor</h3>
              </div>
              <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium relative z-10 italic leading-relaxed">
                "Foco não é fazer mais, é fazer o que realmente importa."
              </p>
            </div>
          </div>

        </div>

      </div>
    </motion.div>
  );
}
