import React from 'react';
import { motion } from 'motion/react';
import { User as UserIcon, Users, Sparkles } from 'lucide-react';
import { useLedger } from '../contexts/LedgerContext';

interface LedgerToggleProps {
  className?: string;
  size?: 'sm' | 'md';
}

export function LedgerToggle({ className = '', size = 'md' }: LedgerToggleProps) {
  const { isFamilyActive, hasFamilyLedger, switchLedger, familyLedger } = useLedger();

  const isSmall = size === 'sm';

  return (
    <div 
      className={`inline-flex items-center p-1 rounded-2xl bg-slate-100/80 dark:bg-zinc-900/80 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-sm relative ${className}`}
      role="tablist"
      aria-label="Alternar entre cofre pessoal e familiar"
    >
      {/* Opção Pessoal */}
      <button
        type="button"
        role="tab"
        aria-selected={!isFamilyActive}
        onClick={() => switchLedger('personal')}
        className={`relative z-10 flex items-center gap-1.5 rounded-xl font-bold transition-all duration-200 cursor-pointer select-none ${
          isSmall ? 'px-2.5 py-1 text-[11px]' : 'px-3.5 py-1.5 text-xs'
        } ${
          !isFamilyActive
            ? 'text-slate-900 dark:text-white'
            : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'
        }`}
      >
        <span className="text-sm">👤</span>
        <span>Pessoal</span>
      </button>

      {/* Opção Família */}
      <button
        type="button"
        role="tab"
        aria-selected={isFamilyActive}
        onClick={() => switchLedger('shared')}
        className={`relative z-10 flex items-center gap-1.5 rounded-xl font-bold transition-all duration-200 cursor-pointer select-none ${
          isSmall ? 'px-2.5 py-1 text-[11px]' : 'px-3.5 py-1.5 text-xs'
        } ${
          isFamilyActive
            ? 'text-white'
            : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'
        }`}
      >
        <span className="text-sm">👨‍👩‍👧</span>
        <span>Família</span>
        {!hasFamilyLedger && (
          <span className="ml-0.5 text-[9px] px-1 py-0.2 bg-blue-500/15 text-blue-600 dark:text-blue-400 rounded-full font-bold uppercase tracking-wider">
            Novo
          </span>
        )}
      </button>

      {/* Indicador Deslizante (Pill) Animado com Motion */}
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 450, damping: 32 }}
        className={`absolute top-1 bottom-1 rounded-xl shadow-sm pointer-events-none ${
          isFamilyActive
            ? 'right-1 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-[0_0_12px_rgba(59,130,246,0.4)]'
            : 'left-1 bg-white dark:bg-zinc-800 shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
        }`}
        style={{
          width: isFamilyActive 
            ? (isSmall ? 'calc(50% - 4px)' : 'calc(50% - 4px)')
            : (isSmall ? 'calc(50% - 4px)' : 'calc(50% - 4px)')
        }}
      />
    </div>
  );
}
