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

  const strokeDashoffset =
    circumference - Math.min(1, Math.max(0, progress)) * circumference;

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
        className="-rotate-90 transform w-60 h-60 sm:w-64 sm:h-64"
      >
        {/* Trilha de fundo */}
        <circle
          stroke="#262626"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        {/* Progresso */}
        <circle
          stroke={phase === 'focus' ? '#ffffff' : '#afafaf'}
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
        />
      </svg>

      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-[11px] font-medium tracking-[0.2em] text-[#afafaf] mb-2">
          {phaseLabel}
        </span>
        <span
          className={`text-5xl sm:text-6xl font-light tracking-tight tabular-nums transition-opacity duration-300 ${isRunning ? 'text-white' : 'text-[#d4d4d4]'
            }`}
        >
          {formattedTime}
        </span>
      </div>
    </div>
  );
};

