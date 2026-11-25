import React from 'react';
import { TimerPhase } from '../../../types/focus';

interface TimerRingProps {
  displayMs: number;
  targetDurationMs: number;
  phase: TimerPhase;
  isFlowtime: boolean;
  isRunning: boolean;
}

export const TimerRing: React.FC<TimerRingProps> = ({
  displayMs,
  targetDurationMs,
  phase,
  isFlowtime,
  isRunning,
}) => {
  const totalSeconds =
    isFlowtime && phase === 'focus'
      ? Math.floor(displayMs / 1000)
      : Math.ceil(displayMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const radius = 128;
  const stroke = 6;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;

  // No modo Flowtime, o anel gira suavemente em ciclos de 60 minutos
  const progress =
    isFlowtime && phase === 'focus'
      ? ((displayMs / 60000) % 60) / 60
      : targetDurationMs > 0
      ? 1 - displayMs / targetDurationMs
      : 0;

  // Antes de acionar (idle), exibe um arco sutil de referência visual igual às outras telas
  const idlePreviewProgress = progress === 0 && !isRunning && !isFlowtime ? 1 : progress;
  const strokeDashoffset =
    circumference - Math.min(1, Math.max(0, idlePreviewProgress)) * circumference;

  const phaseLabel =
    phase === 'focus'
      ? isFlowtime
        ? 'FLOWTIME'
        : 'FOCO PROFUNDO'
      : phase === 'short_break'
      ? 'PAUSA CURTA'
      : 'PAUSA LONGA';

  return (
    <div className="relative flex items-center justify-center select-none">
      <svg
        height={radius * 2}
        width={radius * 2}
        viewBox={`0 0 ${radius * 2} ${radius * 2}`}
        className="-rotate-90 transform w-56 h-56 sm:w-64 sm:h-64"
      >
        {/* Trilha de fundo */}
        <circle
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className={
            isRunning
              ? 'stroke-[#262626] transition-colors duration-500'
              : 'stroke-slate-200/80 dark:stroke-slate-800/80 transition-colors duration-500'
          }
        />
        {/* Progresso */}
        <circle
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{
            strokeDashoffset,
            transition: 'stroke-dashoffset 0.5s linear',
          }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className={
            isRunning
              ? phase === 'focus'
                ? 'stroke-white transition-colors duration-500'
                : 'stroke-[#afafaf] transition-colors duration-500'
              : phase === 'focus'
              ? 'stroke-blue-600 dark:stroke-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.45)] transition-colors duration-500'
              : 'stroke-emerald-500 dark:stroke-emerald-400 transition-colors duration-500'
          }
        />
      </svg>

      <div className="absolute flex flex-col items-center justify-center text-center">
        <span
          className={`text-[11px] font-bold tracking-[0.2em] mb-2 transition-colors duration-300 ${
            isRunning
              ? 'text-[#afafaf] font-medium'
              : phase === 'focus'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-emerald-600 dark:text-emerald-400'
          }`}
        >
          {phaseLabel}
        </span>
        <span
          className={`text-5xl sm:text-6xl tracking-tight tabular-nums transition-all duration-300 ${
            isRunning
              ? 'font-light text-white'
              : 'font-black text-slate-900 dark:text-white'
          }`}
        >
          {formattedTime}
        </span>
      </div>
    </div>
  );
};
