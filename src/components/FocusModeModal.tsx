import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Pause,
  X,
  Target,
  BookOpen,
  Briefcase,
  FolderKanban,
  Square,
  Loader2
} from 'lucide-react';
import { Task, User } from '../types';
import { FOCUS_QUOTES } from '../data/focusQuotes';
import { getApiUrl } from '../lib/api';

interface FocusModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks?: Task[];
  setTasks?: React.Dispatch<React.SetStateAction<Task[]>>;
  user?: User | null;
  onFeedbackGenerated?: (feedback: string) => void;
}

type FocusCategory = 'Estudos' | 'Trabalho' | 'Projetos' | 'Foco Total';
type FocusModeType = 'countdown' | 'stopwatch';

const COUNTDOWN_INITIAL_SECONDS = 50 * 60; // 50:00 Pomodoro (3000s)

export function FocusModeModal({ isOpen, onClose, tasks = [], setTasks, user, onFeedbackGenerated }: FocusModeModalProps) {
  // Main states
  const [isFocusActive, setIsFocusActive] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [focusType, setFocusType] = useState<FocusModeType>('countdown');
  const [category, setCategory] = useState<FocusCategory>('Foco Total');
  const [seconds, setSeconds] = useState<number>(0);
  const [currentQuote, setCurrentQuote] = useState<string>('');
  const [showCompletionNotification, setShowCompletionNotification] = useState<boolean>(false);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState<boolean>(false);

  // Timer interval reference
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to pick random quote from 100 quotes
  const getRandomQuote = () => {
    const randomIndex = Math.floor(Math.random() * FOCUS_QUOTES.length);
    return FOCUS_QUOTES[randomIndex];
  };

  // Calculate elapsed time formatted for AI prompt
  const getElapsedDuration = (): { seconds: number; formatted: string } => {
    let elapsed = 0;
    if (focusType === 'countdown') {
      elapsed = Math.max(0, COUNTDOWN_INITIAL_SECONDS - seconds);
    } else {
      elapsed = seconds;
    }

    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const remainingSeconds = elapsed % 60;

    let formatted = '';
    if (hours > 0 && minutes > 0) {
      formatted = `${hours} ${hours === 1 ? 'hora' : 'horas'} e ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
    } else if (hours > 0) {
      formatted = `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    } else if (minutes > 0) {
      formatted = `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
    } else {
      formatted = `${remainingSeconds} ${remainingSeconds === 1 ? 'segundo' : 'segundos'}`;
    }

    return { seconds: elapsed, formatted };
  };

  // Handle active ticking
  useEffect(() => {
    if (isFocusActive && !isPaused) {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (focusType === 'countdown') {
            if (prev <= 1) {
              // Reached 00:00
              setIsPaused(true);
              setShowCompletionNotification(true);
              if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                new Notification('Sessão de Foco Concluída! 🎯', {
                  body: `Parabéns! Você completou os 50 minutos de ${category}.`
                });
              }
              return 0;
            }
            return prev - 1;
          } else {
            // Stopwatch counts up
            return prev + 1;
          }
        });
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
  }, [isFocusActive, isPaused, focusType, category]);

  // Request notification permissions
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }
  }, []);

  // Reset when opening / closing
  const handleClose = () => {
    if (isGeneratingFeedback) return;
    setIsFocusActive(false);
    setIsPaused(false);
    setSeconds(0);
    setShowCompletionNotification(false);
    onClose();
  };

  // Start 50:00 Countdown shortcut
  const handleStartCountdown = (selectedCat: 'Estudos' | 'Trabalho' | 'Projetos') => {
    setCategory(selectedCat);
    setFocusType('countdown');
    setSeconds(COUNTDOWN_INITIAL_SECONDS);
    setCurrentQuote(getRandomQuote());
    setIsPaused(false);
    setIsFocusActive(true);
    setShowCompletionNotification(false);
  };

  // Start Open Stopwatch (Foco Total)
  const handleStartStopwatch = () => {
    setCategory('Foco Total');
    setFocusType('stopwatch');
    setSeconds(0);
    setCurrentQuote(getRandomQuote());
    setIsPaused(false);
    setIsFocusActive(true);
    setShowCompletionNotification(false);
  };

  // Pause / Resume toggle
  const togglePause = () => {
    if (isGeneratingFeedback) return;
    setIsPaused((prev) => !prev);
  };

  // Finalize / Exit Zen Session with AI Mentor Feedback
  const handleFinalize = async () => {
    if (isGeneratingFeedback) return;
    setIsPaused(true);

    const { seconds: elapsedSeconds, formatted: formattedDuration } = getElapsedDuration();

    // If session was very short (< 5 seconds), just close without API request
    if (elapsedSeconds < 5) {
      setIsFocusActive(false);
      setIsPaused(false);
      setSeconds(0);
      setShowCompletionNotification(false);
      onClose();
      return;
    }

    const confirmed = window.confirm(`Deseja finalizar sua sessão de foco (${formattedDuration}) e receber a avaliação do Mentor?`);
    if (!confirmed) {
      setIsPaused(false);
      return;
    }

    setIsGeneratingFeedback(true);

    try {
      const focusMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
      const prompt = `O usuário finalizou um foco ininterrupto de ${focusMinutes} minutos. Gere o feedback imediato.`;

      const response = await fetch(getApiUrl('/api/chat'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          focusTime: focusMinutes,
          text: prompt,
          currentDate: new Date().toISOString()
        })
      });

      if (response.ok) {
        const data = await response.json();
        const feedback = data.feedback || data.text;
        if (feedback) {
          onFeedbackGenerated?.(feedback.trim());
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Servidor retornou erro:", response.status, errorData);
      }
    } catch (err) {
      console.error("Erro ao gerar feedback do Mentor Focus:", err);
    } finally {
      setIsGeneratingFeedback(false);
      setIsFocusActive(false);
      setIsPaused(false);
      setSeconds(0);
      setShowCompletionNotification(false);
      onClose();
    }
  };

  // Format seconds into MM:SS or HH:MM:SS
  const formatTime = (totalSeconds: number): string => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className={`fixed inset-0 z-[100] flex flex-col items-center justify-center transition-colors duration-700 select-none overflow-hidden ${isFocusActive
          ? 'bg-black text-white'
          : 'bg-[#09090b]/95 backdrop-blur-2xl text-slate-100 p-4 sm:p-6'
          }`}
      >
        {/* ========================================================================= */}
        {/* ESTADO INICIAL (SELEÇÃO): isFocusActive === false                         */}
        {/* ========================================================================= */}
        {!isFocusActive ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full max-w-lg bg-gradient-to-b from-[#18181b] to-[#09090b] border border-[#27272a] rounded-[32px] p-6 sm:p-8 relative shadow-[0_25px_50px_-12px_rgba(0,0,0,0.9)] flex flex-col items-center"
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-5 right-5 p-2.5 text-slate-400 hover:text-white bg-[#27272a]/50 hover:bg-[#3f3f46] rounded-full transition-colors cursor-pointer"
              title="Fechar"
              aria-label="Fechar"
            >
              <X size={20} />
            </button>

            {/* Header / Title */}
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 shadow-lg shadow-indigo-500/10">
                <Target size={28} />
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white mb-1 drop-shadow-md">
                Modo Foco
              </h2>
              <p className="text-xs text-slate-400 font-medium max-w-xs">
                Escolha um atalho de 50 minutos ou inicie um cronômetro de imersão total.
              </p>
            </div>

            {/* 1. Atributos de Atalhos Menores Enfileirados (50:00 Pomodoro) */}
            <div className="w-full mb-6">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
                Atalhos Rápidos • 50:00 Regressivo
              </label>

              <div className="grid grid-cols-3 gap-2.5 w-full">
                {/* [▶️ Estudos] */}
                <button
                  type="button"
                  onClick={() => handleStartCountdown('Estudos')}
                  className="flex flex-col items-center justify-center p-3 sm:p-3.5 bg-[#121214] hover:bg-emerald-950/30 border border-[#27272a] hover:border-emerald-500/50 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer group shadow-sm"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-1.5 group-hover:bg-emerald-500/20 transition-colors">
                    <BookOpen size={16} />
                  </div>
                  <span className="text-xs font-bold text-slate-200 group-hover:text-emerald-300">
                    Estudos
                  </span>
                  <span className="text-[10px] text-slate-500 group-hover:text-emerald-400/80 font-semibold mt-0.5">
                    50 min
                  </span>
                </button>

                {/* [▶️ Trabalho] */}
                <button
                  type="button"
                  onClick={() => handleStartCountdown('Trabalho')}
                  className="flex flex-col items-center justify-center p-3 sm:p-3.5 bg-[#121214] hover:bg-blue-950/30 border border-[#27272a] hover:border-blue-500/50 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer group shadow-sm"
                >
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-1.5 group-hover:bg-blue-500/20 transition-colors">
                    <Briefcase size={16} />
                  </div>
                  <span className="text-xs font-bold text-slate-200 group-hover:text-blue-300">
                    Trabalho
                  </span>
                  <span className="text-[10px] text-slate-500 group-hover:text-blue-400/80 font-semibold mt-0.5">
                    50 min
                  </span>
                </button>

                {/* [▶️ Projetos] */}
                <button
                  type="button"
                  onClick={() => handleStartCountdown('Projetos')}
                  className="flex flex-col items-center justify-center p-3 sm:p-3.5 bg-[#121214] hover:bg-purple-950/30 border border-[#27272a] hover:border-purple-500/50 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer group shadow-sm"
                >
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-1.5 group-hover:bg-purple-500/20 transition-colors">
                    <FolderKanban size={16} />
                  </div>
                  <span className="text-xs font-bold text-slate-200 group-hover:text-purple-300">
                    Projetos
                  </span>
                  <span className="text-[10px] text-slate-500 group-hover:text-purple-400/80 font-semibold mt-0.5">
                    50 min
                  </span>
                </button>
              </div>
            </div>

            {/* Separator */}
            <div className="w-full flex items-center mb-6">
              <div className="flex-grow border-t border-[#27272a]"></div>
              <span className="px-3 text-[10px] uppercase tracking-widest text-[#71717a] font-bold">ou</span>
              <div className="flex-grow border-t border-[#27272a]"></div>
            </div>

            {/* 2. Botão Grande e Principal: [ Foco Total] (Cronômetro Livre Progressivo) */}
            <button
              type="button"
              onClick={handleStartStopwatch}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-sm sm:text-base tracking-wide flex items-center justify-center gap-3 shadow-[0_8px_25px_rgba(99,102,241,0.4)] hover:shadow-[0_12px_30px_rgba(99,102,241,0.6)] hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer border border-indigo-400/30 group"
            >
              <Target size={22} className="group-hover:rotate-45 transition-transform duration-300" />
              <span>Foco Total (Cronômetro Livre)</span>
            </button>
          </motion.div>
        ) : (
          /* ========================================================================= */
          /* MODO ZEN (EFEITO APAGÃO): isFocusActive === true                           */
          /* ========================================================================= */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
            className="w-full h-full flex flex-col items-center justify-between py-12 px-6 relative z-10 max-w-xl"
          >
            {/* Header Minimalista Zen */}
            <div className="flex flex-col items-center gap-2 pt-4">
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-semibold backdrop-blur-md">
                <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-emerald-400 animate-ping'}`} />
                <span>
                  {category} • {focusType === 'countdown' ? 'Regressivo (50m)' : 'Cronômetro Livre'}
                </span>
              </div>
              {isPaused && (
                <span className="text-[11px] font-bold text-amber-400 tracking-wider uppercase">
                  Em Pausa
                </span>
              )}
            </div>

            {/* Relógio Gigante Centralizado */}
            <div className="flex flex-col items-center justify-center my-auto relative max-w-lg w-full">
              {/* Radial glow background */}
              <div className="absolute inset-0 bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none w-72 h-72"></div>

              <motion.div
                animate={{ scale: isPaused ? 0.98 : 1 }}
                transition={{ duration: 0.4 }}
                className="font-mono text-7xl sm:text-8xl md:text-9xl font-black tracking-tighter text-white drop-shadow-[0_0_35px_rgba(255,255,255,0.15)] relative z-10 text-center"
              >
                {formatTime(seconds)}
              </motion.div>

              <p className="text-slate-500 text-xs sm:text-sm font-medium tracking-widest uppercase mt-4">
                {isPaused ? 'Foco pausado' : 'Mantenha a concentração'}
              </p>

              {/* Bloco de Citação Motivacional (Fade-in com delay de 2 segundos) */}
              {currentQuote && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2, duration: 1.2, ease: "easeOut" }}
                  className="w-full text-center px-6 mt-8 flex flex-col items-center gap-2"
                >
                  <p className="italic text-xs sm:text-sm text-zinc-400 font-normal leading-relaxed tracking-wide max-w-md">
                    "{currentQuote}"
                  </p>
                  <span className="text-[11px] sm:text-xs font-bold text-zinc-500 tracking-wider">
                    — Mentor Focus
                  </span>
                </motion.div>
              )}
            </div>

            {/* Botões Discretos e Minimalistas embaixo: 'Pausar' e 'Finalizar' */}
            <div className="flex flex-col items-center gap-3 pb-6 w-full max-w-xs">
              <div className="flex items-center justify-center gap-4 w-full">
                {/* Pausar / Retomar */}
                <button
                  type="button"
                  onClick={togglePause}
                  disabled={isGeneratingFeedback}
                  className="flex-1 py-3 px-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-200 hover:text-white text-xs sm:text-sm font-bold tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer backdrop-blur-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isPaused ? (
                    <>
                      <Play size={16} className="text-emerald-400 fill-emerald-400" />
                      <span>Retomar</span>
                    </>
                  ) : (
                    <>
                      <Pause size={16} className="text-amber-400 fill-amber-400" />
                      <span>Pausar</span>
                    </>
                  )}
                </button>

                {/* Finalizar */}
                <button
                  type="button"
                  onClick={handleFinalize}
                  disabled={isGeneratingFeedback}
                  className="flex-1 py-3 px-5 rounded-2xl bg-red-950/30 hover:bg-red-900/40 border border-red-500/20 hover:border-red-500/40 text-red-300 hover:text-red-100 text-xs sm:text-sm font-bold tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer backdrop-blur-md active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isGeneratingFeedback ? (
                    <>
                      <Loader2 size={15} className="animate-spin text-red-400" />
                      <span>Avaliando...</span>
                    </>
                  ) : (
                    <>
                      <Square size={14} className="fill-red-400 text-red-400" />
                      <span>Finalizar</span>
                    </>
                  )}
                </button>
              </div>

              {isGeneratingFeedback && (
                <p className="text-[11px] text-indigo-400 font-semibold animate-pulse text-center">
                  O Mentor Focus está analisando sua sessão...
                </p>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  );
}
