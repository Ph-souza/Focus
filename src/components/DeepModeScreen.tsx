import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Pause, Play, Square, X } from 'lucide-react';
import { FOCUS_QUOTES } from '../data/focusQuotes';

export interface DeepModeScreenProps {
  isOpen: boolean;
  onClose: () => void;
  taskTitle: string;
  timeRemaining: number;
  isRunning: boolean;
  onTogglePlay: () => void;
  onStop: () => void;
}

// O temporizador pertence à aba de Foco. Este componente apenas o apresenta.
export function DeepModeScreen({
  isOpen,
  onClose,
  taskTitle,
  timeRemaining,
  isRunning,
  onTogglePlay,
  onStop,
}: DeepModeScreenProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const insightId = useId();
  const [quoteIndex, setQuoteIndex] = useState(() =>
    Math.floor(Math.random() * FOCUS_QUOTES.length),
  );

  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;

    // A camada modal nativa mantém o dashboard inerte e contém o foco do teclado.
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus({ preventScroll: true });

    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !isRunning || FOCUS_QUOTES.length < 2) return;

    // Mesma coleção da primeira tela de foco; sem chamadas a serviços de IA.
    const interval = window.setInterval(() => {
      setQuoteIndex(index => (index + 1) % FOCUS_QUOTES.length);
    }, 3 * 60 * 1000);

    return () => window.clearInterval(interval);
  }, [isOpen, isRunning]);

  if (!isOpen) return null;

  const seconds = Math.max(0, Math.floor(timeRemaining));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  const displayTime = `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-modal="true"
      onCancel={event => {
        event.preventDefault();
        onClose();
      }}
      className="fixed inset-0 z-[9999] m-0 h-dvh max-h-none w-screen max-w-none overflow-y-auto overscroll-contain border-0 bg-slate-950 p-0 text-slate-100 backdrop:bg-slate-950"
    >
      <div className="flex min-h-full flex-col">
        <header className="flex shrink-0 justify-end px-4 pt-4 sm:px-8 sm:pt-6">
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Sair do modo profundo"
            title="Sair do modo profundo (Esc)"
            className="flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full px-3 text-slate-400 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-400 motion-reduce:transition-none"
          >
            <span aria-hidden="true" className="hidden text-xs sm:inline">Esc</span>
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center px-4 py-8 text-center">
          <h1 id={titleId} className="mb-6 max-w-2xl break-words text-lg font-medium text-slate-300 sm:text-2xl">
            <span className="sr-only">Modo profundo: </span>
            {taskTitle}
          </h1>

          <div
            role="timer"
            aria-live="off"
            aria-label={`${minutes} minutos e ${remainder} segundos restantes`}
            className="select-none whitespace-nowrap font-mono text-[clamp(4rem,24vw,14rem)] font-semibold leading-none tracking-tighter text-white tabular-nums"
          >
            {displayTime}
          </div>

          <p role="status" className="sr-only">
            {isRunning ? 'Temporizador em andamento' : 'Temporizador pausado'}
          </p>

          <div className="mt-8 flex items-center justify-center gap-5">
            <button
              type="button"
              onClick={onTogglePlay}
              aria-label={isRunning ? 'Pausar foco' : 'Iniciar foco'}
              title={isRunning ? 'Pausar foco' : 'Iniciar foco'}
              className="flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-white/5 text-slate-200 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-400 motion-reduce:transition-none"
            >
              {isRunning ? <Pause size={22} aria-hidden="true" /> : <Play size={22} aria-hidden="true" />}
            </button>
            <button
              type="button"
              onClick={onStop}
              aria-label="Parar e reiniciar o tempo da sessão"
              title="Parar e reiniciar o tempo da sessão"
              className="flex h-12 w-12 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-400 motion-reduce:transition-none"
            >
              <Square size={19} aria-hidden="true" />
            </button>
          </div>
        </main>

        <footer aria-labelledby={insightId} className="mx-auto w-full max-w-2xl shrink-0 px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-4 text-center sm:px-8 sm:pb-12">
          <h2 id={insightId} className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
            Insight do Mentor
          </h2>
          <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
            “{FOCUS_QUOTES[quoteIndex]}”
          </p>
        </footer>
      </div>
    </dialog>,
    document.body,
  );
}
