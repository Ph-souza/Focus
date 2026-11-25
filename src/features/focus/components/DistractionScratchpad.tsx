import React, { useState } from 'react';
import { Plus, Zap } from 'lucide-react';

interface DistractionScratchpadProps {
  distractions: string[];
  onCapture: (note: string) => void;
  isDarkZen?: boolean;
}

export const DistractionScratchpad: React.FC<DistractionScratchpadProps> = ({
  distractions,
  onCapture,
  isDarkZen = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;
    onCapture(note);
    setNote('');
    setIsOpen(false);
  };

  return (
    <div className="w-full max-w-md mx-auto mt-5">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={
            isDarkZen
              ? 'w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-[#2a2a2a] bg-[#161616] text-sm text-[#afafaf] hover:text-white hover:border-[#4a4a4a] transition-colors cursor-pointer'
              : 'w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl glass-pill hover:border-blue-500/40 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer'
          }
        >
          <Zap className={`w-4 h-4 ${isDarkZen ? '' : 'text-blue-500'}`} />
          <span>Capturar distração rápida</span>
          {distractions.length > 0 && (
            <span
              className={
                isDarkZen
                  ? 'ml-1 px-2 py-0.5 text-xs rounded-full bg-[#262626] text-white'
                  : 'ml-1 px-2 py-0.5 text-[11px] font-bold rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25'
              }
            >
              {distractions.length}
            </span>
          )}
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className={
            isDarkZen
              ? 'flex items-center gap-2 p-2 rounded-xl border border-[#4a4a4a] bg-[#1a1a1a]'
              : 'flex items-center gap-2 p-2 rounded-xl bg-white/80 dark:bg-slate-900/70 border border-blue-500/40 shadow-sm'
          }
        >
          <input
            type="text"
            autoFocus
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                setIsOpen(false);
              }
            }}
            placeholder="Anote e volte ao foco (ex: pagar boleto)..."
            className={
              isDarkZen
                ? 'flex-1 bg-transparent text-sm text-white placeholder-[#6b6b6b] px-2 focus:outline-none'
                : 'flex-1 bg-transparent text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 px-2 focus:outline-none'
            }
          />
          <button
            type="submit"
            className={
              isDarkZen
                ? 'p-2 rounded-lg bg-white text-[#111111] hover:bg-[#e5e5e5] transition-colors cursor-pointer'
                : 'p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors cursor-pointer'
            }
            title="Salvar distração"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className={
              isDarkZen
                ? 'px-2 py-1 text-xs text-[#afafaf] hover:text-white cursor-pointer'
                : 'px-2 py-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer'
            }
          >
            Esc
          </button>
        </form>
      )}
    </div>
  );
};
