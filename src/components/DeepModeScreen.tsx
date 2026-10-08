import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  X, 
  Bot, 
  Maximize2, 
  Minimize2, 
  Sparkles,
  RefreshCw,
  Volume2,
  VolumeX,
  CheckCircle2
} from 'lucide-react';
import { FOCUS_QUOTES } from '../data/focusQuotes';

export interface DeepModeScreenProps {
  isOpen: boolean;
  onClose: () => void;
  taskTitle?: string;
  initialMinutes?: number;
  onSessionComplete?: (durationMinutes: number) => void;
}

export function DeepModeScreen({
  isOpen,
  onClose,
  taskTitle = 'Sessão de Foco Profundo',
  initialMinutes = 25,
  onSessionComplete
}: DeepModeScreenProps) {
  // Configurações do Timer
  const [mode, setMode] = useState<'countdown' | 'stopwatch'>('countdown');
  const [targetMinutes, setTargetMinutes] = useState<number>(initialMinutes);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(initialMinutes * 60);
  const [stopwatchSeconds, setStopwatchSeconds] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(false);
  
  // Título da tarefa editável inline
  const [currentTask, setCurrentTask] = useState<string>(taskTitle);
  const [isEditingTask, setIsEditingTask] = useState<boolean>(false);

  // Citações motivacionais do Mentor
  const [quoteIndex, setQuoteIndex] = useState<number>(() => {
    return Math.floor(Math.random() * FOCUS_QUOTES.length);
  });
  const [isQuoteFading, setIsQuoteFading] = useState<boolean>(false);

  // Referência do Intervalo
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const totalDuration = targetMinutes * 60;

  // Atualiza título se a prop mudar
  useEffect(() => {
    if (taskTitle) {
      setCurrentTask(taskTitle);
    }
  }, [taskTitle]);

  // Função para alternar frases de forma suave
  const changeQuote = useCallback(() => {
    setIsQuoteFading(true);
    setTimeout(() => {
      setQuoteIndex(prev => {
        let next = Math.floor(Math.random() * FOCUS_QUOTES.length);
        if (next === prev) next = (next + 1) % FOCUS_QUOTES.length;
        return next;
      });
      setIsQuoteFading(false);
    }, 300);
  }, []);

  // Rotação suave automática de frases a cada 3 minutos de foco
  useEffect(() => {
    if (!isOpen || !isRunning) return;
    const quoteInterval = setInterval(() => {
      changeQuote();
    }, 3 * 60 * 1000);
    return () => clearInterval(quoteInterval);
  }, [isOpen, isRunning, changeQuote]);

  // Sons de bipe sutis via Web Audio API (sem dependência de assets externos)
  const playChime = useCallback(() => {
    if (isSoundMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const now = ctx.currentTime;
      // Tríade suave de sino zen (440Hz -> 554.37Hz -> 659.25Hz)
      [440, 554.37, 659.25].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.15);
        gain.gain.setValueAtTime(0.08, now + idx * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.15 + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.15);
        osc.stop(now + idx * 0.15 + 1.2);
      });
    } catch {
      // Navegadores podem restringir autoplay de áudio
    }
  }, [isSoundMuted]);

  // Ticking do cronômetro
  useEffect(() => {
    if (isOpen && isRunning) {
      timerRef.current = setInterval(() => {
        if (mode === 'countdown') {
          setSecondsRemaining(prev => {
            if (prev <= 1) {
              // Sessão concluída
              setIsRunning(false);
              playChime();
              onSessionComplete?.(targetMinutes);
              return 0;
            }
            return prev - 1;
          });
        } else {
          setStopwatchSeconds(prev => prev + 1);
        }
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isOpen, isRunning, mode, targetMinutes, playChime, onSessionComplete]);

  // Atalhos de teclado: ESC para fechar, Espaço para Play/Pause, F para Fullscreen
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditingTask) return; // Permite digitação no input do título da tarefa

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.code === 'Space') {
        e.preventDefault();
        setIsRunning(prev => !prev);
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isEditingTask, onClose]);

  // Controle de Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Resetar / Alterar duração
  const handleSetPreset = (minutes: number) => {
    setMode('countdown');
    setTargetMinutes(minutes);
    setSecondsRemaining(minutes * 60);
    setIsRunning(true);
  };

  const handleStartStopwatch = () => {
    setMode('stopwatch');
    setStopwatchSeconds(0);
    setIsRunning(true);
  };

  const handleRestart = () => {
    if (mode === 'countdown') {
      setSecondsRemaining(targetMinutes * 60);
    } else {
      setStopwatchSeconds(0);
    }
    setIsRunning(true);
  };

  // Formatação de Tempo (MM:SS ou HH:MM:SS)
  const formatDisplayTime = (totalSeconds: number): string => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Porcentagem de progresso da barra superior
  const progressPercent = mode === 'countdown'
    ? Math.min(100, Math.max(0, ((totalDuration - secondsRemaining) / totalDuration) * 100))
    : 100;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        className="fixed inset-0 z-[100] bg-black text-white flex flex-col justify-between select-none overflow-hidden"
        style={{ backgroundColor: '#020617' }} // bg-slate-950 puro
      >
        {/* Barra de progresso ultrafina no topo */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/5 z-20 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>

        {/* Glow de ambientação no centro (sutil e imersivo) */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[140px] pointer-events-none" 
          aria-hidden="true" 
        />

        {/* ===================================================================== */}
        {/* CABEÇALHO DISCRETO SUPERIOR (Título da tarefa + Ações de saída)     */}
        {/* ===================================================================== */}
        <header className="relative z-10 w-full px-6 sm:px-12 pt-8 pb-4 flex items-center justify-between">
          {/* Lado Esquerdo: Tag de Status do Foco */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
              <span 
                className={`w-2 h-2 rounded-full transition-colors ${
                  isRunning 
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse' 
                    : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                }`} 
              />
              <span className="text-[11px] font-bold tracking-widest uppercase text-slate-300">
                {isRunning ? 'Foco Profundo Ativo' : 'Em Pausa'}
              </span>
            </div>

            {/* Presets rápidos de tempo discretos */}
            <div className="hidden md:flex items-center gap-1.5 pl-2 border-l border-white/10">
              <button
                type="button"
                onClick={() => handleSetPreset(25)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  mode === 'countdown' && targetMinutes === 25
                    ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                }`}
              >
                25m
              </button>
              <button
                type="button"
                onClick={() => handleSetPreset(50)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  mode === 'countdown' && targetMinutes === 50
                    ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                }`}
              >
                50m
              </button>
              <button
                type="button"
                onClick={handleStartStopwatch}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  mode === 'stopwatch'
                    ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                }`}
              >
                Livre
              </button>
            </div>
          </div>

          {/* Lado Direito: Ações de Controle (Som, Fullscreen e Fechar com ESC) */}
          <div className="flex items-center gap-2">
            {/* Alternar Mudo */}
            <button
              type="button"
              onClick={() => setIsSoundMuted(!isSoundMuted)}
              className="p-2 text-slate-500 hover:text-slate-300 hover:bg-white/5 rounded-xl transition-all"
              title={isSoundMuted ? 'Ativar som de conclusão' : 'Silenciar'}
              aria-label="Controle de som"
            >
              {isSoundMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>

            {/* Tela cheia */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 text-slate-500 hover:text-slate-300 hover:bg-white/5 rounded-xl transition-all hidden sm:flex"
              title={isFullscreen ? 'Sair da tela cheia (F)' : 'Tela cheia (F)'}
              aria-label="Alternar tela cheia"
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>

            {/* Botão Sair com 'X' discreto e atalho ESC */}
            <button
              type="button"
              onClick={onClose}
              className="group flex items-center gap-2 py-1.5 px-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-400 hover:text-white transition-all ml-1"
              title="Sair do modo profundo (ESC)"
              aria-label="Fechar modo profundo"
            >
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 group-hover:text-slate-300 hidden sm:inline">
                ESC
              </span>
              <X size={16} className="text-slate-400 group-hover:text-white transition-transform group-hover:rotate-90 duration-300" />
            </button>
          </div>
        </header>

        {/* ===================================================================== */}
        {/* CORPO CENTRAL (Tarefa Atual + Cronômetro Gigante + Controles)       */}
        {/* ===================================================================== */}
        <main className="relative z-10 flex flex-col items-center justify-center my-auto px-4 max-w-4xl mx-auto w-full text-center">
          {/* Título da Tarefa Atual (Editável inline com clique) */}
          <div className="mb-4 sm:mb-6 max-w-lg w-full flex flex-col items-center">
            {isEditingTask ? (
              <input
                type="text"
                value={currentTask}
                onChange={(e) => setCurrentTask(e.target.value)}
                onBlur={() => setIsEditingTask(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setIsEditingTask(false);
                }}
                autoFocus
                className="w-full text-center text-lg sm:text-2xl font-bold bg-white/10 text-white rounded-xl px-4 py-1.5 border border-blue-500/50 outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingTask(true)}
                className="group flex items-center gap-2 px-4 py-1.5 rounded-2xl hover:bg-white/5 transition-all text-center max-w-full"
                title="Clique para editar o nome da tarefa"
              >
                <span className="text-base sm:text-2xl font-bold text-slate-300 group-hover:text-white tracking-tight truncate max-w-md transition-colors">
                  {currentTask}
                </span>
                <span className="text-[10px] text-slate-600 group-hover:text-slate-400 uppercase tracking-widest font-semibold ml-1">
                  ✎
                </span>
              </button>
            )}
            <p className="text-[11px] font-medium tracking-widest uppercase text-slate-500 mt-1">
              {mode === 'countdown' ? `Pomodoro • ${targetMinutes} Minutos` : 'Cronômetro Livre'}
            </p>
          </div>

          {/* CRONÔMETRO CENTRAL GIGANTE */}
          <div className="relative my-2 sm:my-4 flex items-center justify-center">
            <motion.div
              animate={{ 
                scale: isRunning ? 1 : 0.98,
                opacity: isRunning ? 1 : 0.85
              }}
              transition={{ duration: 0.3 }}
              className="font-mono text-7xl sm:text-8xl md:text-9xl lg:text-[11rem] font-black tracking-tighter text-white tabular-nums select-none drop-shadow-[0_0_50px_rgba(255,255,255,0.12)] leading-none"
            >
              {formatDisplayTime(mode === 'countdown' ? secondsRemaining : stopwatchSeconds)}
            </motion.div>
          </div>

          {/* Subtítulo de feedback sutil */}
          <p className="text-xs sm:text-sm font-medium tracking-wider text-slate-500 uppercase mt-2 mb-8">
            {isRunning ? 'Mantenha a atenção plena · Sem distrações' : 'Pausado · Pressione Espaço para retomar'}
          </p>

          {/* BOTÕES DE CONTROLE DISCRETOS E ELEGANTES */}
          <div className="flex items-center justify-center gap-4 sm:gap-6">
            {/* Reiniciar / Stop */}
            <button
              type="button"
              onClick={handleRestart}
              className="p-3.5 sm:p-4 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border border-white/5 hover:border-white/15 transition-all active:scale-95 shadow-lg"
              title="Reiniciar sessão"
              aria-label="Reiniciar cronômetro"
            >
              <RotateCcw size={20} />
            </button>

            {/* Play / Pause Principal */}
            <button
              type="button"
              onClick={() => setIsRunning(!isRunning)}
              className={`p-5 sm:p-6 rounded-full transition-all active:scale-95 shadow-2xl flex items-center justify-center ${
                isRunning
                  ? 'bg-white/10 hover:bg-white/15 text-white border border-white/20 hover:border-white/30'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_30px_rgba(37,99,235,0.5)] border border-blue-400/40'
              }`}
              title={isRunning ? 'Pausar (Espaço)' : 'Iniciar (Espaço)'}
              aria-label={isRunning ? 'Pausar foco' : 'Iniciar foco'}
            >
              {isRunning ? (
                <Pause size={28} className="fill-white" />
              ) : (
                <Play size={28} className="fill-white ml-1" />
              )}
            </button>

            {/* Concluir / Stop */}
            <button
              type="button"
              onClick={() => {
                setIsRunning(false);
                playChime();
                const minutesDone = mode === 'countdown'
                  ? Math.max(1, Math.round((totalDuration - secondsRemaining) / 60))
                  : Math.max(1, Math.round(stopwatchSeconds / 60));
                onSessionComplete?.(minutesDone);
                onClose();
              }}
              className="p-3.5 sm:p-4 rounded-full bg-white/5 hover:bg-emerald-950/40 text-slate-400 hover:text-emerald-300 border border-white/5 hover:border-emerald-500/30 transition-all active:scale-95 shadow-lg"
              title="Concluir sessão de foco"
              aria-label="Concluir sessão"
            >
              <CheckCircle2 size={20} />
            </button>
          </div>
        </main>

        {/* ===================================================================== */}
        {/* RODAPÉ: INSIGHT DO MENTOR (Mensagens Motivacionais Resgatadas)        */}
        {/* ===================================================================== */}
        <footer className="relative z-10 w-full px-6 sm:px-12 pb-8 pt-4 flex flex-col items-center">
          <div 
            onClick={changeQuote}
            className="group cursor-pointer max-w-xl w-full flex flex-col items-center text-center p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 transition-all duration-300"
            title="Clique para ver outro insight do Mentor"
          >
            {/* Tag do Mentor */}
            <div className="flex items-center gap-1.5 mb-2">
              <Bot size={14} className="text-blue-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400/90">
                Insight do Mentor IA
              </span>
              <RefreshCw size={10} className="text-slate-600 group-hover:text-slate-400 ml-1 transition-colors" />
            </div>

            {/* Citação Motivacional */}
            <p 
              className={`text-xs sm:text-sm text-slate-300 font-medium italic leading-relaxed max-w-lg transition-opacity duration-300 ${
                isQuoteFading ? 'opacity-0' : 'opacity-100'
              }`}
            >
              "{FOCUS_QUOTES[quoteIndex]}"
            </p>

            <span className="text-[10px] text-slate-500 font-semibold tracking-wider mt-1.5">
              — Nexus Focus
            </span>
          </div>

          <p className="text-[10px] text-slate-600 font-medium tracking-widest uppercase mt-3">
            Pressione <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400 font-mono text-[9px]">ESC</kbd> para sair · <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400 font-mono text-[9px]">Espaço</kbd> para pausar
          </p>
        </footer>
      </motion.div>
    </AnimatePresence>
  );
}
