import React, { useState } from 'react';
import { Plus, Zap } from 'lucide-react';

interface DistractionScratchpadProps {
  distractions: string[];
  onCapture: (note: string) => void;
}

export const DistractionScratchpad: React.FC<DistractionScratchpadProps> = ({
  distractions,
  onCapture,
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
    <div className="w-full max-w-md mx-auto mt-6">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-[#2a2a2a] bg-[#161616] text-sm text-[#afafaf] hover:text-white hover:border-[#4a4a4a] transition-colors cursor-pointer"
        >
          <Zap className="w-4 h-4" />
          <span>Capturar distração rápida</span>
          {distractions.length > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-[#262626] text-white">
              {distractions.length}
            </span>
          )}
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 p-2 rounded-xl border border-[#4a4a4a] bg-[#1a1a1a]"
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
            className="flex-1 bg-transparent text-sm text-white placeholder-[#6b6b6b] px-2 focus:outline-none"
          />
          <button
            type="submit"
            className="p-2 rounded-lg bg-white text-[#111111] hover:bg-[#e5e5e5] transition-colors cursor-pointer"
            title="Salvar distração"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="px-2 py-1 text-xs text-[#afafaf] hover:text-white cursor-pointer"
          >
            Esc
          </button>
        </form>
      )}
    </div>
  );
};

