import React, { useEffect, useMemo, useRef, useState } from 'react';
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

  return (
    <div className="min-h-screen w-full bg-[#111111] text-white flex flex-col items-center justify-center px-4 pt-6 pb-24 transition-all duration-500">
      <div className="w-full max-w-xl flex flex-col items-center">
        {/* Seletor de Protocolo (oculto no Modo Zen e durante Pausas) */}
        {!isZenMode && !isBreak && (
          <div className="flex flex-col items-center mb-6 w-full">
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
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                      active
                        ? 'bg-white text-[#111111] border-white'
                        : 'bg-[#1a1a1a] text-[#afafaf] border-[#2a2a2a] hover:border-[#4a4a4a] hover:text-white'
                    }`}
                  >
                    {proto.label}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setShowCustomEditor((prev) => !prev)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5 transition-colors cursor-pointer ${
                  state.protocolId === 'custom' || showCustomEditor
                    ? 'bg-white text-[#111111] border-white'
                    : 'bg-[#1a1a1a] text-[#afafaf] border-[#2a2a2a] hover:border-[#4a4a4a] hover:text-white'
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
                className="mt-3 flex items-center gap-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3.5 py-2 text-xs"
              >
                <label className="flex items-center gap-1.5 text-[#afafaf]">
                  <span>Foco (min):</span>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={customMinutesInput}
                    onChange={(e) => setCustomMinutesInput(Number(e.target.value))}
                    className="w-14 bg-[#111111] border border-[#2a2a2a] rounded-lg px-2 py-1 text-white text-center tabular-nums focus:outline-none focus:border-[#4a4a4a]"
                  />
                </label>
                <label className="flex items-center gap-1.5 text-[#afafaf]">
                  <span>Pausa (min):</span>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={customBreakInput}
                    onChange={(e) => setCustomBreakInput(Number(e.target.value))}
                    className="w-14 bg-[#111111] border border-[#2a2a2a] rounded-lg px-2 py-1 text-white text-center tabular-nums focus:outline-none focus:border-[#4a4a4a]"
                  />
                </label>
                <button
                  type="submit"
                  className="px-3 py-1 rounded-lg bg-white text-[#111111] font-medium hover:bg-[#e5e5e5] transition-colors cursor-pointer"
                >
                  Aplicar
                </button>
              </form>
            )}
          </div>
        )}

        {/* Vínculo de Tarefa / Contexto (com Categoria Editável no Foco Livre) */}
        <div className="w-full max-w-md mb-6">
          {isZenMode ? (
            <div className="text-center">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#afafaf] mb-1">
                {state.category || 'Geral'}
              </p>
              <h2 className="text-lg font-medium text-white truncate px-4">
                {state.taskTitle || 'Sessão de Foco Livre'}
              </h2>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex-1 flex items-center bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#4a4a4a] rounded-xl px-3 py-2.5 transition-colors">
                <ListTodo className="w-4 h-4 text-[#afafaf] mr-2.5 shrink-0" />
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
                  className="w-full bg-transparent text-sm text-white focus:outline-none cursor-pointer truncate"
                >
                  <option value="" className="bg-[#1a1a1a] text-[#afafaf]">
                    Foco Livre (sem tarefa vinculada)
                  </option>
                  {resolvedTasks.map((task) => (
                    <option
                      key={`${task.source || 'tasks'}-${task.id}`}
                      value={task.id}
                      className="bg-[#1a1a1a] text-white"
                    >
                      {task.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Categoria editável quando Foco Livre está selecionado */}
              {!state.taskId && (
                <div
                  className="flex items-center bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#4a4a4a] rounded-xl px-3 py-2.5 sm:w-36 transition-colors"
                  title="Categoria do Foco Livre"
                >
                  <Tag className="w-3.5 h-3.5 text-[#afafaf] mr-2 shrink-0" />
                  <input
                    type="text"
                    value={state.category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Categoria"
                    maxLength={24}
                    className="w-full bg-transparent text-xs text-white placeholder-[#6b6b6b] focus:outline-none"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Anel do Cronômetro */}
        <TimerRing
          displayMs={displayMs}
          targetDurationMs={state.targetDurationMs}
          phase={state.phase}
          isFlowtime={state.protocolId === 'flowtime'}
          isRunning={state.status === 'running'}
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

        {/* Controles Principais */}
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

          {state.status === 'running' ? (
            <button
              type="button"
              onClick={pause}
              className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-white text-[#111111] font-medium hover:bg-[#e5e5e5] transition-colors cursor-pointer"
            >
              <Pause className="w-5 h-5 fill-current" />
              <span>Pausar</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={start}
              className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-white text-[#111111] font-medium hover:bg-[#e5e5e5] transition-colors cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>{state.status === 'paused' ? 'Retomar' : 'Iniciar'}</span>
            </button>
          )}

          {state.status !== 'idle' && (
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
          )}
        </div>

        {/* Botão Exclusivo Flowtime */}
        {state.protocolId === 'flowtime' &&
          state.phase === 'focus' &&
          state.status !== 'idle' && (
            <button
              type="button"
              onClick={finishFlowtime}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-full border border-[#2a2a2a] hover:border-[#4a4a4a] bg-[#1a1a1a] text-xs text-[#afafaf] hover:text-white transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Encerrar & Calcular Pausa (20%)</span>
            </button>
          )}

        {/* Scratchpad de Distrações (disponível durante o foco ativo/pausado) */}
        {!isBreak && state.status !== 'idle' && (
          <DistractionScratchpad
            distractions={state.distractions}
            onCapture={captureDistraction}
          />
        )}

        {/* Resumo do Dia (oculto automaticamente no Modo Zen para zero ruído visual) */}
        {!isZenMode && (
          <div className="w-full max-w-md mt-8 grid grid-cols-3 gap-2.5">
            <div className="rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] px-3.5 py-3 text-center">
              <span className="block text-lg font-medium text-white tabular-nums">
                {todaySummary.totalMinutes}m
              </span>
              <span className="block text-[11px] text-[#afafaf] mt-0.5">
                Focados hoje
              </span>
            </div>
            <div className="rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] px-3.5 py-3 text-center">
              <span className="block text-lg font-medium text-white tabular-nums">
                {todaySummary.completedSessions}
              </span>
              <span className="block text-[11px] text-[#afafaf] mt-0.5">
                Blocos concluídos
              </span>
            </div>
            <div className="rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] px-3.5 py-3 text-center">
              <span className="block text-lg font-medium text-white tabular-nums">
                {todaySummary.distractionsCaptured + state.distractions.length}
              </span>
              <span className="block text-[11px] text-[#afafaf] mt-0.5">
                Distrações salvas
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
