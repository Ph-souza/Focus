import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Play, 
  Pause,
  Square,
  SkipForward, 
  Target, 
  Clock, 
  TrendingUp, 
  Moon, 
  Bot,
  Calendar,
  Layers,
  Trophy,
  BarChart2,
  Sliders,
  CheckCircle2,
  ChevronRight,
  CheckSquare,
  Timer
} from 'lucide-react';

interface TabFocusProps {
  onTabChange?: (tab: any) => void;
}

export function TabFocus({ onTabChange }: TabFocusProps) {
  // Mode selection state: Pomodoro (25m), Timer (60m), Ritmo, Personalizado
  const [activeMode, setActiveMode] = useState<'pomodoro' | 'timer' | 'ritmo' | 'personalizado'>('pomodoro');
  
  // Timer duration in seconds (25 mins for Pomodoro)
  const [totalTime, setTotalTime] = useState(25 * 60);
  const [timeRemaining, setTimeRemaining] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [session, setSession] = useState(1);
  const [focusTask] = useState('Revisar finanças');

  // Change mode settings
  const handleModeChange = (mode: 'pomodoro' | 'timer' | 'ritmo' | 'personalizado') => {
    setActiveMode(mode);
    setIsRunning(false);
    if (mode === 'pomodoro') {
      setTotalTime(25 * 60);
      setTimeRemaining(25 * 60);
    } else if (mode === 'timer') {
      setTotalTime(50 * 60);
      setTimeRemaining(50 * 60);
    } else if (mode === 'ritmo') {
      setTotalTime(90 * 60);
      setTimeRemaining(90 * 60);
    } else {
      setTotalTime(30 * 60);
      setTimeRemaining(30 * 60);
    }
  };

  // Timer interval countdown
  useEffect(() => {
    let interval: any = null;
    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0) {
      setIsRunning(false);
      // Advance session
      setSession(prev => (prev < 4 ? prev + 1 : 1));
      setTimeRemaining(totalTime);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeRemaining, totalTime]);

  // Format time MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // SVG circular progress calculation
  const radius = 80;
  const circumference = 2 * Math.PI * radius; // ~502.65
  const progressPercent = ((totalTime - timeRemaining) / totalTime) * 100;
  // If at starting time (0 progress), show a clean visual arc of ~60% like mockup, or active countdown
  const visualProgressPercent = !isRunning && timeRemaining === totalTime ? 65 : progressPercent;
  const strokeDashoffset = circumference - (circumference * visualProgressPercent) / 100;

  // Timer controls
  const handleTogglePlay = () => {
    setIsRunning(!isRunning);
  };

  const handleStop = () => {
    setIsRunning(false);
    setTimeRemaining(totalTime);
  };

  const handleSkip = () => {
    setIsRunning(false);
    setSession(prev => (prev < 4 ? prev + 1 : 1));
    setTimeRemaining(totalTime);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4 md:gap-6 p-0 md:p-8"
    >
      {/* ========================================================= */}
      {/* MOBILE VIEW (Strictly matching Sprint 3 Mobile Mockup)    */}
      {/* ========================================================= */}
      <div className="block md:hidden space-y-4">
        
        {/* Mobile Header */}
        <div className="flex items-center justify-between pt-1 pb-1">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              Foco
            </h1>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
              Concentre-se no que importa
            </p>
          </div>

          <button 
            onClick={() => onTabChange?.('calendar')}
            className="w-11 h-11 rounded-2xl glass-card flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
            aria-label="Abrir agenda"
          >
            <Calendar size={20} />
          </button>
        </div>

        {/* 1. Mode Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5 no-scrollbar">
          <button
            onClick={() => handleModeChange('pomodoro')}
            className={`px-3.5 py-1.5 rounded-full text-xs flex items-center gap-1.5 transition-all shrink-0 ${
              activeMode === 'pomodoro'
                ? 'bg-blue-600 text-white font-bold shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                : 'glass-pill text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
            }`}
          >
            <Timer size={14} />
            Pomodoro
          </button>

          <button
            onClick={() => handleModeChange('timer')}
            className={`px-3.5 py-1.5 rounded-full text-xs flex items-center gap-1.5 transition-all shrink-0 ${
              activeMode === 'timer'
                ? 'bg-blue-600 text-white font-bold shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                : 'glass-pill text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
            }`}
          >
            <Clock size={14} />
            Timer
          </button>

          <button
            onClick={() => handleModeChange('ritmo')}
            className={`px-3.5 py-1.5 rounded-full text-xs flex items-center gap-1.5 transition-all shrink-0 ${
              activeMode === 'ritmo'
                ? 'bg-blue-600 text-white font-bold shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                : 'glass-pill text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
            }`}
          >
            <BarChart2 size={14} />
            Ritmo
          </button>

          <button
            onClick={() => handleModeChange('personalizado')}
            className={`px-3.5 py-1.5 rounded-full text-xs flex items-center gap-1.5 transition-all shrink-0 ${
              activeMode === 'personalizado'
                ? 'bg-blue-600 text-white font-bold shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                : 'glass-pill text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
            }`}
          >
            <Sliders size={14} />
            Personalizado
          </button>
        </div>

        {/* 2. Central Circular Timer (Pomodoro) */}
        <div className="glass-card p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-sm">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative w-56 h-56 flex flex-col items-center justify-center shrink-0">
            {/* SVG Ring with Neon Blue Progress */}
            <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 200 200">
              {/* Background Track */}
              <circle 
                cx="100" 
                cy="100" 
                r={radius} 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="7" 
                className="text-slate-200/80 dark:text-slate-800/80" 
              />
              {/* Animated Progress Stroke */}
              <circle 
                cx="100" 
                cy="100" 
                r={radius} 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="8" 
                strokeDasharray={circumference} 
                strokeDashoffset={strokeDashoffset} 
                strokeLinecap="round" 
                className="text-blue-600 dark:text-blue-400 drop-shadow-[0_0_14px_rgba(59,130,246,0.85)] transition-all duration-500" 
              />
            </svg>

            {/* Inner Content: Target Icon, Big Time, Focus Task */}
            <div className="flex flex-col items-center justify-center relative z-10 text-center px-4">
              <div className="w-8 h-8 rounded-full bg-blue-500/15 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-1 shadow-sm">
                <Target size={18} />
              </div>
              <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums leading-none mt-1">
                {formatTime(timeRemaining)}
              </span>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-2 truncate max-w-[160px]">
                {focusTask}
              </span>
            </div>
          </div>

          {/* Controls: Parar, Pausar / Iniciar, Pular */}
          <div className="flex items-center justify-center gap-7 mt-4 relative z-10">
            {/* Parar */}
            <div className="flex flex-col items-center">
              <button 
                onClick={handleStop}
                className="w-12 h-12 rounded-2xl glass-card flex items-center justify-center text-rose-500 hover:text-rose-600 shadow-sm active:scale-95 transition-all"
                aria-label="Parar foco"
              >
                <Square size={16} className="fill-rose-500 text-rose-500" />
              </button>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1.5">
                Parar
              </span>
            </div>

            {/* Pausar / Iniciar (Highlight Central Button) */}
            <div className="flex flex-col items-center">
              <button 
                onClick={handleTogglePlay}
                className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-[0_0_22px_rgba(59,130,246,0.65)] hover:shadow-[0_0_28px_rgba(59,130,246,0.8)] active:scale-95 transition-all"
                aria-label={isRunning ? 'Pausar foco' : 'Iniciar foco'}
              >
                {isRunning ? (
                  <Pause size={22} className="fill-current" />
                ) : (
                  <Play size={22} className="fill-current ml-0.5" />
                )}
              </button>
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 mt-1.5">
                {isRunning ? 'Pausar' : 'Iniciar'}
              </span>
            </div>

            {/* Pular */}
            <div className="flex flex-col items-center">
              <button 
                onClick={handleSkip}
                className="w-12 h-12 rounded-2xl glass-card flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm active:scale-95 transition-all"
                aria-label="Pular sessão"
              >
                <SkipForward size={18} />
              </button>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1.5">
                Pular
              </span>
            </div>
          </div>
        </div>

        {/* 3. Quick Metric Cards (Sessão, Foco hoje, Meta diária) */}
        <div className="grid grid-cols-3 gap-2.5">
          {/* Card 1: Sessão */}
          <div className="glass-card p-3 flex flex-col items-start shadow-sm">
            <Layers size={18} className="text-blue-500 mb-1" />
            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 leading-none">
              Sessão
            </span>
            <span className="text-xs font-black text-slate-900 dark:text-white mt-1.5 leading-none">
              {session} de 4
            </span>
          </div>

          {/* Card 2: Foco hoje */}
          <div className="glass-card p-3 flex flex-col items-start shadow-sm">
            <Clock size={18} className="text-blue-500 mb-1" />
            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 leading-none">
              Foco hoje
            </span>
            <span className="text-xs font-black text-slate-900 dark:text-white mt-1.5 leading-none">
              1h 25min
            </span>
          </div>

          {/* Card 3: Meta diária */}
          <div className="glass-card p-3 flex flex-col items-start shadow-sm">
            <Trophy size={18} className="text-blue-500 mb-1" />
            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 leading-none">
              Meta diária
            </span>
            <span className="text-xs font-black text-slate-900 dark:text-white mt-1.5 leading-none">
              3h 00min
            </span>
          </div>
        </div>

        {/* 4. Blocos de Foco de Hoje */}
        <div className="glass-card p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white">
              Blocos de foco de hoje
            </h2>
            <button 
              onClick={() => onTabChange?.('calendar')}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Ver agenda
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-bold text-slate-700 dark:text-slate-300">
            {/* Block 1: 08:30 (Done) */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.8)]"></span>
              <span>08:30</span>
              <span className="text-emerald-500 text-xs">✓</span>
            </div>

            {/* Block 2: 10:00 (Done) */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.8)]"></span>
              <span>10:00</span>
              <span className="text-emerald-500 text-xs">✓</span>
            </div>

            {/* Block 3: 14:00 (Active/Current) */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-500/30"></span>
              <span className="text-blue-600 dark:text-blue-400">14:00</span>
            </div>

            {/* Block 4: 16:00 (Pending) */}
            <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full border-2 border-slate-300 dark:border-slate-600"></span>
              <span>16:00</span>
            </div>
          </div>
        </div>

        {/* Produtividade Hoje & Resumo da Sessão */}
        <div className="grid grid-cols-2 gap-3">
          {/* Left: Produtividade Hoje */}
          <div className="glass-card p-3.5 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-900 dark:text-white leading-tight">
                Produtividade hoje
              </span>
              <span className="text-[11px] font-black text-blue-600 dark:text-blue-400 leading-tight">
                78%
              </span>
            </div>

            {/* Mini Bar Chart */}
            <div className="flex items-end justify-between gap-1.5 h-16 pt-2">
              {[
                { h: 35, label: '6h' },
                { h: 55, label: '9h' },
                { h: 90, label: '12h', highlight: true },
                { h: 60, label: '15h' },
                { h: 75, label: '18h' }
              ].map((bar, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <div 
                    className={`w-full rounded-t-sm transition-all ${
                      bar.highlight 
                        ? 'bg-blue-600 shadow-[0_0_8px_rgba(59,130,246,0.6)]' 
                        : 'bg-blue-500/30 dark:bg-blue-500/40'
                    }`} 
                    style={{ height: `${bar.h}%` }}
                  />
                  <span className="text-[9px] font-semibold text-slate-400">{bar.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Resumo da Sessão */}
          <div className="glass-card p-3.5 flex flex-col justify-between shadow-sm">
            <span className="text-[11px] font-bold text-slate-900 dark:text-white mb-2 leading-tight">
              Resumo da sessão
            </span>

            <div className="flex flex-col gap-2">
              {/* Foco mantido */}
              <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                  <CheckCircle2 size={11} className="text-slate-400" />
                  <span>Foco mantido</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white">25:00</span>
              </div>

              {/* Tarefas avançadas */}
              <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                  <Target size={11} className="text-slate-400" />
                  <span>Tarefas avançadas</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white">1</span>
              </div>

              {/* Distrações evitadas */}
              <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                  <BarChart2 size={11} className="text-slate-400" />
                  <span>Distrações evitadas</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white">3</span>
              </div>
            </div>
          </div>
        </div>

        {/* Insight do Mentor */}
        <div 
          onClick={() => onTabChange?.('chat')}
          className="glass-card p-3.5 flex items-center gap-3 relative cursor-pointer group shadow-sm hover:scale-[1.01] transition-all"
        >
          <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-sm">
            <Bot size={18} />
          </div>
          <div className="flex-1 min-w-0 pr-1">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
              Insight do Mentor
            </h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-tight mt-0.5 line-clamp-2">
              Ótimo foco! Você manteve a disciplina e avançou em uma tarefa importante.
            </p>
          </div>
          <ChevronRight size={16} className="text-slate-400 ml-auto shrink-0 group-hover:translate-x-0.5 transition-transform" />
        </div>

      </div>


      {/* ========================================================= */}
      {/* DESKTOP VIEW (Preserved from high-fidelity Desktop Overhaul) */}
      {/* ========================================================= */}
      <div className="hidden md:flex flex-col h-full">
        {/* Desktop Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Foco</h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
              Menos distração. Mais progresso.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' })}
            </span>
            <button className="flex items-center gap-2 px-4 py-2 glass-card text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-white dark:hover:bg-slate-900 transition-colors shadow-sm">
              <Moon size={14} /> Modo profundo
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Left Column (Timer & Stats) */}
          <div className="flex flex-col gap-8">
            {/* Timer Section */}
            <div className="glass-card p-8 flex flex-col items-center relative overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-32 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
              
              {/* Type Tabs */}
              <div className="flex items-center gap-2 glass-pill p-1.5 rounded-2xl mb-12 relative z-10 w-max mx-auto shadow-sm">
                <button 
                  onClick={() => handleModeChange('pomodoro')} 
                  className={`px-6 py-2 rounded-xl font-bold text-xs transition-all ${
                    activeMode === 'pomodoro' 
                      ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Pomodoro
                </button>
                <button 
                  onClick={() => handleModeChange('timer')} 
                  className={`px-6 py-2 rounded-xl font-bold text-xs transition-all ${
                    activeMode === 'timer' 
                      ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Tarefa
                </button>
                <button 
                  onClick={() => handleModeChange('ritmo')} 
                  className={`px-6 py-2 rounded-xl font-bold text-xs transition-all ${
                    activeMode === 'ritmo' 
                      ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Estatísticas
                </button>
              </div>

              {/* Giant Timer */}
              <div className="relative w-72 h-72 flex flex-col items-center justify-center mb-12 shrink-0">
                {/* Outer Glow */}
                <div className="absolute inset-0 rounded-full bg-blue-500/10 dark:bg-blue-500/15 scale-110 blur-xl"></div>
                {/* SVG Ring */}
                <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-200/60 dark:text-slate-800" />
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="46" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="8" 
                    strokeDasharray="289" 
                    strokeDashoffset={289 - (289 * visualProgressPercent) / 100} 
                    strokeLinecap="round" 
                    className="text-blue-600 dark:text-blue-400 drop-shadow-[0_0_12px_rgba(59,130,246,0.8)] transition-all duration-500" 
                  />
                </svg>
                
                <div className="flex flex-col items-center justify-center relative z-10">
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2">Foco</span>
                  <span className="text-7xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums leading-none mb-6">
                    {formatTime(timeRemaining)}
                  </span>
                  
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={handleTogglePlay}
                      className="w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.5)] hover:shadow-[0_0_30px_rgba(59,130,246,0.8)] hover:scale-105 active:scale-95 transition-all"
                    >
                      {isRunning ? (
                        <Pause size={24} className="fill-current" />
                      ) : (
                        <Play size={24} className="ml-1 fill-current" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <button 
                  onClick={handleStop}
                  className="text-sm font-bold text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-2"
                >
                  <Square size={14} className="fill-current" /> Parar
                </button>
                <button 
                  onClick={handleSkip}
                  className="text-sm font-bold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors flex items-center gap-2"
                >
                  <SkipForward size={16} /> Pular
                </button>
              </div>
              
              {/* Sessions today indicator */}
              <div className="w-full flex items-center justify-between mt-8 pt-6 border-t border-slate-200/60 dark:border-blue-500/20">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Sessões hoje</span>
                  <span className="text-lg font-black text-slate-900 dark:text-white">{session}/4</span>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`w-12 h-2 rounded-full ${i <= session ? 'bg-blue-600 dark:bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-slate-200/80 dark:bg-white/10'}`}></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-sm">
                  <Clock size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Tempo focado</span>
                  <span className="text-xl font-bold text-slate-900 dark:text-white">1h 25min</span>
                </div>
              </div>
              
              <div className="glass-card p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-sm">
                  <TrendingUp size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Produtividade</span>
                  <span className="text-xl font-bold text-slate-900 dark:text-white">87%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (Task context) */}
          <div className="flex flex-col gap-6">
            {/* Tarefa em Foco */}
            <div className="glass-card p-8 h-full relative overflow-hidden">
              <h2 className="font-bold text-sm text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Target size={16} className="text-blue-600 dark:text-blue-400" /> Tarefa em foco
              </h2>
              
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">Revisar finanças</h3>
                  <span className="px-3 py-1 bg-blue-500/15 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-lg border border-blue-500/30">Trabalho</span>
                </div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">1 de 4 subtarefas concluídas (25%)</p>
                
                <div className="w-full h-2 bg-slate-200/60 dark:bg-slate-800 rounded-full mt-4 overflow-hidden">
                  <div className="h-full bg-blue-600 dark:bg-blue-500 w-1/4 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {[
                  { label: 'Verificar extratos do mês', done: true },
                  { label: 'Categorizar transações pendentes', done: false },
                  { label: 'Revisar metas e caixinhas', done: false },
                  { label: 'Planejar orçamentos da próxima semana', done: false },
                ].map((item, i) => (
                  <label key={i} className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-colors ${
                    item.done 
                      ? 'bg-slate-100/40 dark:bg-slate-900/30 opacity-70' 
                      : 'bg-white/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-blue-500/20 hover:border-blue-500/50 dark:hover:border-blue-400/40 hover:bg-white/80'
                  }`}>
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border-2 transition-colors ${
                      item.done 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-[0_0_8px_rgba(59,130,246,0.5)]' 
                        : 'border-slate-300 dark:border-slate-600 bg-transparent'
                    }`}>
                      {item.done && <CheckSquare size={14} strokeWidth={3} />}
                    </div>
                    <span className={`text-sm font-semibold ${item.done ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-800 dark:text-slate-100'}`}>
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Insight Foco */}
            <div className="glass-card p-6 relative overflow-hidden group">
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-2xl group-hover:bg-blue-500/30 transition-all duration-500"></div>
              <h3 className="font-bold text-xs text-slate-900 dark:text-slate-200 mb-2 uppercase tracking-widest flex items-center gap-2">
                <Bot size={14} className="text-blue-500" /> Insight do Mentor
              </h3>
              <p className="text-sm text-slate-700 dark:text-slate-300 font-medium italic">
                "Ótimo foco! Você manteve a disciplina e avançou em uma tarefa importante."
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
