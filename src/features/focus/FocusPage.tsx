import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  CheckCircle2,
  Coffee,
  ListTodo,
  SkipForward,
  Tag,
  SlidersHorizontal,
  Clock,
  Target,
  Zap,
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useFocusTimer } from '../../hooks/useFocusTimer';
import { FOCUS_PROTOCOLS, FocusProtocolId } from '../../types/focus';
import { BrownNoisePlayer } from '../../utils/ambientNoise';
import { TimerRing } from './components/TimerRing';
import { DistractionScratchpad } from './components/DistractionScratchpad';

const ACTIVE_BREAK_TIPS = [
  'Afaste-se da tela por 5 minutos e olhe para um ponto distante por 20 segundos.',
  'Beba um copo de água para manter a hidratação cognitiva.',
  'Levante-se e alongue os ombros, pescoço e punhos.',
  'Evite redes sociais agora — deixe o cérebro consolidar o que você produziu.',
  'Faça 5 respirações profundas lentas para desacelerar o sistema nervoso.',
];

export interface FocusAvailableTask {
  id: string;
  title: string;
  category?: string;
  source?: 'tasks' | 'rotinas';
}

interface FocusPageProps {
  userId?: string;
  availableTasks?: FocusAvailableTask[];
}

export const FocusPage: React.FC<FocusPageProps> = ({
  userId,
  availableTasks,
}) => {
  const { currentUser } = useAuth();
  const effectiveUid = userId || currentUser?.uid || undefined;

  const {
    state,
    displayMs,
    todaySummary,
    start,
    pause,
    abandon,
    finishFlowtime,
    skipBreak,
    captureDistraction,
    selectProtocol,
    linkTask,
    setCategory,
  } = useFocusTimer(effectiveUid);

  // Fallback query to Firestore pending tasks if parent did not pass availableTasks
  const [firestoreTasks, setFirestoreTasks] = useState<FocusAvailableTask[]>([]);

  useEffect(() => {
    if (availableTasks !== undefined || !effectiveUid) return;

    const tasksQuery = query(
      collection(db, 'users', effectiveUid, 'tasks'),
      orderBy('createdAt', 'desc'),
      limit(40)
    );

    const unsubscribe = onSnapshot(
      tasksQuery,
      (snap) => {
        const pending = snap.docs
          .map((d) => {
            const raw = d.data() as {
              completed?: boolean;
              title?: string;
              category?: string;
              description?: string;
            };
            return { id: d.id, ...raw };
          })
          .filter((d) => !d.completed)
          .map((d) => ({
            id: String(d.id),
            title: String(d.title || 'Tarefa sem título'),
            category: String(d.category || d.description || 'Geral'),
            source: 'tasks' as const,
          }));
        setFirestoreTasks(pending);
      },
      () => {}
    );

    return () => unsubscribe();
  }, [availableTasks, effectiveUid]);

  const resolvedTasks = useMemo(
    () => availableTasks ?? firestoreTasks,
    [availableTasks, firestoreTasks]
  );

  const [soundEnabled, setSoundEnabled] = useState(false);
  const [confirmAbandon, setConfirmAbandon] = useState(false);
  const [breakTip, setBreakTip] = useState(
    () => ACTIVE_BREAK_TIPS[Math.floor(Math.random() * ACTIVE_BREAK_TIPS.length)]
  );
  const [customMinutesInput, setCustomMinutesInput] = useState<number>(
    state.customFocusMinutes || 30
  );
  const [customBreakInput, setCustomBreakInput] = useState<number>(
    state.customBreakMinutes || 5
  );
  const [showCustomEditor, setShowCustomEditor] = useState(false);

  const noiseRef = useRef<BrownNoisePlayer | null>(null);
  const confirmTimerRef = useRef<number | null>(null);

  const isZenMode = state.status === 'running';
  const isBreak = state.phase !== 'focus';

  // Refresh active break suggestion whenever entering a break phase
  useEffect(() => {
    if (isBreak) {
      setBreakTip(
        ACTIVE_BREAK_TIPS[Math.floor(Math.random() * ACTIVE_BREAK_TIPS.length)]
      );
    }
  }, [isBreak, state.completedCycles]);

  // Atualiza título da aba do navegador dinamicamente (MM:SS • Nexus Focus)
  useEffect(() => {
    if (state.status === 'running') {
      const isFlowFocus = state.protocolId === 'flowtime' && state.phase === 'focus';
      const totalSeconds = isFlowFocus
        ? Math.floor(displayMs / 1000)
        : Math.ceil(displayMs / 1000);
      const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
      const ss = String(totalSeconds % 60).padStart(2, '0');
      document.title = `${mm}:${ss} • Nexus Focus`;
    } else {
      document.title = 'Nexus Focus';
    }
    return () => {
      document.title = 'Nexus Focus';
    };
  }, [state.status, state.protocolId, state.phase, displayMs]);

  // Controle de ruído marrom (desbloqueado exclusivamente no clique do usuário - iOS policy)
  const toggleSound = () => {
    if (!noiseRef.current) {
      noiseRef.current = new BrownNoisePlayer();
    }
    if (soundEnabled) {
      noiseRef.current.stop();
      setSoundEnabled(false);
    } else {
      noiseRef.current.start(0.08);
      setSoundEnabled(true);
    }
  };

  useEffect(() => {
    return () => {
      noiseRef.current?.stop();
      if (confirmTimerRef.current) {
        window.clearTimeout(confirmTimerRef.current);
      }
    };
  }, []);

  // Proteção contra abandono acidental (2 cliques com reset automático após 3s)
  const handleAbandonClick = () => {
    if (!confirmAbandon) {
      setConfirmAbandon(true);
      if (confirmTimerRef.current) {
        window.clearTimeout(confirmTimerRef.current);
      }
      confirmTimerRef.current = window.setTimeout(() => {
        setConfirmAbandon(false);
      }, 3000);
      return;
    }
    if (confirmTimerRef.current) {
      window.clearTimeout(confirmTimerRef.current);
    }
    setConfirmAbandon(false);
    abandon();
  };

  const applyCustomProtocol = (e: React.FormEvent) => {
    e.preventDefault();
    const safeFocus = Math.max(1, Math.min(180, Number(customMinutesInput) || 25));
    const safeBreak = Math.max(1, Math.min(60, Number(customBreakInput) || 5));
    setCustomMinutesInput(safeFocus);
    setCustomBreakInput(safeBreak);
    selectProtocol('custom', safeFocus, safeBreak);
    setShowCustomEditor(false);
  };

  // ===========================================================================
  // MODO ZEN ESCURO (Ativado APENAS quando o temporizador está rodando)
  // ===========================================================================
  if (isZenMode) {
    return (
      <div className="fixed inset-0 z-30 bg-[#111111] text-white flex flex-col items-center justify-center px-4 pb-20 overflow-y-auto transition-colors duration-500">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-xl flex flex-col items-center"
        >
          {/* Tarefa Vinculada em Destaque Minimalista */}
          <div className="w-full max-w-md mb-6 text-center">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#afafaf] mb-1">
              {state.category || 'Geral'}
            </p>
            <h2 className="text-lg font-medium text-white truncate px-4">
              {state.taskTitle || 'Sessão de Foco Livre'}
            </h2>
          </div>

          {/* Anel do Cronômetro Minimalista Dark */}
          <TimerRing
            displayMs={displayMs}
            targetDurationMs={state.targetDurationMs}
            phase={state.phase}
            isFlowtime={state.protocolId === 'flowtime'}
            isRunning={true}
          />

          {/* Card de Pausa Ativa + Botão Pular Pausa */}
          {isBreak && (
            <div className="mt-6 w-full max-w-md p-4 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <Coffee className="w-5 h-5 text-[#afafaf] shrink-0 mt-0.5" />
                <p className="text-sm text-[#d4d4d4] leading-relaxed">{breakTip}</p>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={skipBreak}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2a2a2a] hover:border-[#4a4a4a] text-xs font-medium text-[#afafaf] hover:text-white transition-colors cursor-pointer"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  <span>Pular Pausa</span>
                </button>
              </div>
            </div>
          )}

          {/* Controles Essenciais */}
          <div className="flex items-center gap-4 mt-7">
            <button
              type="button"
              onClick={toggleSound}
              title={
                soundEnabled
                  ? 'Desativar ruído marrom ambiente'
                  : 'Ativar ruído marrom ambiente'
              }
              className={`p-3.5 rounded-full border transition-colors cursor-pointer ${
                soundEnabled
                  ? 'bg-[#262626] border-white text-white'
                  : 'bg-[#1a1a1a] border-[#2a2a2a] text-[#afafaf] hover:text-white hover:border-[#4a4a4a]'
              }`}
            >
              {soundEnabled ? (
                <Volume2 className="w-5 h-5" />
              ) : (
                <VolumeX className="w-5 h-5" />
              )}
            </button>

            <button
              type="button"
              onClick={pause}
              className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-white text-[#111111] font-medium hover:bg-[#e5e5e5] transition-colors cursor-pointer"
            >
              <Pause className="w-5 h-5 fill-current" />
              <span>Pausar</span>
            </button>

            <button
              type="button"
              onClick={handleAbandonClick}
              className={`flex items-center gap-1.5 px-4 py-3.5 rounded-full border text-sm transition-colors cursor-pointer ${
                confirmAbandon
                  ? 'bg-red-500/20 border-red-500 text-red-400'
                  : 'bg-[#1a1a1a] border-[#2a2a2a] text-[#afafaf] hover:text-white hover:border-[#4a4a4a]'
              }`}
              title="Abandonar sessão"
            >
              <Square className="w-4 h-4" />
              {confirmAbandon && <span>Confirmar abandono?</span>}
            </button>
          </div>

          {/* Botão Exclusivo Flowtime */}
          {state.protocolId === 'flowtime' && state.phase === 'focus' && (
            <button
              type="button"
              onClick={finishFlowtime}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-full border border-[#2a2a2a] hover:border-[#4a4a4a] bg-[#1a1a1a] text-xs text-[#afafaf] hover:text-white transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Encerrar & Calcular Pausa (20%)</span>
            </button>
          )}

          {/* Scratchpad de Distrações */}
          {!isBreak && (
            <DistractionScratchpad
              distractions={state.distractions}
              onCapture={captureDistraction}
              isDarkZen={true}
            />
          )}
        </motion.div>
      </div>
    );
  }

  // ===========================================================================
  // TELA PADRÃO NEXUS FOCUS (Antes de acionar o temporizador / Pausado)
  // ===========================================================================
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-5 p-0 max-w-4xl mx-auto w-full"
    >
      {/* Cabeçalho Padrão igual às demais telas do Nexus Focus */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
            Foco
          </h1>
          <p className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Menos distração. Mais progresso. Ao iniciar, a tela entra automaticamente no modo escuro imersivo.
          </p>
        </div>
      </div>

      {/* Card Principal Glassmorphism (Seletor de Protocolo + Tarefa + Cronômetro + Controles) */}
      <div className="glass-card p-5 sm:p-7 flex flex-col items-center relative overflow-hidden">
        {/* Seletor de Protocolo */}
        {!isBreak && (
          <div className="flex flex-col items-center mb-5 w-full">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {(
                Object.keys(FOCUS_PROTOCOLS) as Exclude<FocusProtocolId, 'custom'>[]
              ).map((key) => {
                const proto = FOCUS_PROTOCOLS[key];
                const active = state.protocolId === key && !showCustomEditor;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setShowCustomEditor(false);
                      selectProtocol(key);
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      active
                        ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.45)]'
                        : 'glass-pill text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-500/40'
                    }`}
                  >
                    {proto.label}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setShowCustomEditor((prev) => !prev)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  state.protocolId === 'custom' || showCustomEditor
                    ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.45)]'
                    : 'glass-pill text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-500/40'
                }`}
                title="Personalizar tempo"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>
                  {state.protocolId === 'custom'
                    ? `${state.customFocusMinutes || 30}/${state.customBreakMinutes || 5} Custom`
                    : 'Personalizado'}
                </span>
              </button>
            </div>

            {showCustomEditor && (
              <form
                onSubmit={applyCustomProtocol}
                className="mt-3 flex flex-wrap items-center justify-center gap-2.5 glass-pill rounded-2xl px-4 py-2 text-xs"
              >
                <label className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300">
                  <span>Foco (min):</span>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={customMinutesInput}
                    onChange={(e) => setCustomMinutesInput(Number(e.target.value))}
                    className="w-14 bg-white/80 dark:bg-slate-900/70 border border-slate-200 dark:border-blue-500/30 rounded-lg px-2 py-1 text-slate-900 dark:text-white font-bold text-center tabular-nums focus:outline-none focus:border-blue-500"
                  />
                </label>
                <label className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300">
                  <span>Pausa (min):</span>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={customBreakInput}
                    onChange={(e) => setCustomBreakInput(Number(e.target.value))}
                    className="w-14 bg-white/80 dark:bg-slate-900/70 border border-slate-200 dark:border-blue-500/30 rounded-lg px-2 py-1 text-slate-900 dark:text-white font-bold text-center tabular-nums focus:outline-none focus:border-blue-500"
                  />
                </label>
                <button
                  type="submit"
                  className="px-3.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors cursor-pointer shadow-sm"
                >
                  Aplicar
                </button>
              </form>
            )}
          </div>
        )}

        {/* Vínculo de Tarefa / Categoria Editável */}
        <div className="w-full max-w-md mb-5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex-1 flex items-center bg-white/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-blue-500/25 hover:border-blue-500/50 rounded-2xl px-3.5 py-2.5 transition-colors shadow-sm">
              <ListTodo className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2.5 shrink-0" />
              <select
                value={state.taskId || ''}
                onChange={(e) => {
                  const selected = resolvedTasks.find(
                    (t) => t.id === e.target.value
                  );
                  linkTask(
                    selected ? selected.id : null,
                    selected ? selected.title : null,
                    selected?.category || state.category || 'Geral',
                    selected?.source || 'tasks'
                  );
                }}
                className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-800 dark:text-white focus:outline-none cursor-pointer truncate"
              >
                <option
                  value=""
                  className="bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300"
                >
                  Foco Livre (sem tarefa vinculada)
                </option>
                {resolvedTasks.map((task) => (
                  <option
                    key={`${task.source || 'tasks'}-${task.id}`}
                    value={task.id}
                    className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    {task.title}
                  </option>
                ))}
              </select>
            </div>

            {!state.taskId && (
              <div
                className="flex items-center bg-white/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-blue-500/25 hover:border-blue-500/50 rounded-2xl px-3.5 py-2.5 sm:w-36 transition-colors shadow-sm"
                title="Categoria do Foco Livre"
              >
                <Tag className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 mr-2 shrink-0" />
                <input
                  type="text"
                  value={state.category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Categoria"
                  maxLength={24}
                  className="w-full bg-transparent text-xs font-semibold text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* Anel do Cronômetro no estilo Nexus Focus */}
        <TimerRing
          displayMs={displayMs}
          targetDurationMs={state.targetDurationMs}
          phase={state.phase}
          isFlowtime={state.protocolId === 'flowtime'}
          isRunning={false}
        />

        {/* Card de Pausa Ativa (caso pausado durante o descanso) */}
        {isBreak && (
          <div className="mt-5 w-full max-w-md p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <Coffee className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 leading-relaxed">
                {breakTip}
              </p>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={skipBreak}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/60 dark:bg-white/10 hover:bg-white dark:hover:bg-white/15 border border-emerald-500/30 text-xs font-bold text-emerald-700 dark:text-emerald-300 transition-colors cursor-pointer"
              >
                <SkipForward className="w-3.5 h-3.5" />
                <span>Pular Pausa</span>
              </button>
            </div>
          </div>
        )}

        {/* Controles Principais */}
        <div className="flex items-center gap-4 mt-6">
          <button
            type="button"
            onClick={toggleSound}
            title={
              soundEnabled
                ? 'Desativar ruído marrom ambiente'
                : 'Ativar ruído marrom ambiente'
            }
            className={`p-3.5 rounded-full transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                : 'glass-pill text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-500/40'
            }`}
          >
            {soundEnabled ? (
              <Volume2 className="w-5 h-5" />
            ) : (
              <VolumeX className="w-5 h-5" />
            )}
          </button>

          <button
            type="button"
            onClick={start}
            className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-[0_6px_20px_rgba(37,99,235,0.4)] hover:shadow-[0_8px_25px_rgba(37,99,235,0.55)] active:scale-95 transition-all cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>{state.status === 'paused' ? 'Retomar Foco' : 'Iniciar Foco'}</span>
          </button>

          {state.status !== 'idle' && (
            <button
              type="button"
              onClick={handleAbandonClick}
              className={`flex items-center gap-1.5 px-4 py-3.5 rounded-full border text-xs font-bold transition-all cursor-pointer ${
                confirmAbandon
                  ? 'bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400'
                  : 'glass-pill text-slate-600 dark:text-slate-300 hover:text-rose-500 hover:border-rose-500/40'
              }`}
              title="Abandonar sessão"
            >
              <Square className="w-4 h-4" />
              {confirmAbandon && <span>Confirmar abandono?</span>}
            </button>
          )}
        </div>

        {/* Botão Flowtime (caso pausado durante Flowtime) */}
        {state.protocolId === 'flowtime' &&
          state.phase === 'focus' &&
          state.status === 'paused' && (
            <button
              type="button"
              onClick={finishFlowtime}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-full glass-pill hover:border-blue-500/40 text-xs font-bold text-blue-600 dark:text-blue-400 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Encerrar & Calcular Pausa (20%)</span>
            </button>
          )}

        {/* Scratchpad de Distrações (caso pausado durante o foco) */}
        {!isBreak && state.status === 'paused' && (
          <DistractionScratchpad
            distractions={state.distractions}
            onCapture={captureDistraction}
            isDarkZen={false}
          />
        )}
      </div>

      {/* Resumo de Foco de Hoje no padrão Glass-Card do Nexus Focus */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="block text-lg sm:text-xl font-black text-slate-900 dark:text-white tabular-nums leading-tight">
              {todaySummary.totalMinutes}m
            </span>
            <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
              Focados hoje
            </span>
          </div>
        </div>

        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Target className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="block text-lg sm:text-xl font-black text-slate-900 dark:text-white tabular-nums leading-tight">
              {todaySummary.completedSessions}
            </span>
            <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
              Blocos concluídos
            </span>
          </div>
        </div>

        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="block text-lg sm:text-xl font-black text-slate-900 dark:text-white tabular-nums leading-tight">
              {todaySummary.distractionsCaptured + state.distractions.length}
            </span>
            <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
              Distrações salvas
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
