import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Pause, Play, Square, X } from 'lucide-react';
import { FOCUS_QUOTES } from '../data/focusQuotes';
import styles from './DeepModeScreen.module.css';

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
    if (isOpen) {
      setQuoteIndex(Math.floor(Math.random() * FOCUS_QUOTES.length));
    }
  }, [isOpen]);

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
      className={styles.screen}
    >
      <div className={styles.layout}>
        <header className={styles.header}>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Sair do modo profundo"
            title="Sair do modo profundo (Esc)"
            className={styles.close}
          >
            <span aria-hidden="true" className="hidden text-xs sm:inline">Esc</span>
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <main className={styles.main}>
          <h1 id={titleId} className={styles.task}>
            <span className="sr-only">Modo profundo: </span>
            {taskTitle}
          </h1>

          <div
            role="timer"
            aria-live="off"
            aria-label={`${minutes} minutos e ${remainder} segundos restantes`}
            className={styles.timer}
          >
            {displayTime}
          </div>

          <p role="status" className={styles.visuallyHidden}>
            {isRunning ? 'Temporizador em andamento' : 'Temporizador pausado'}
          </p>

          <div className={styles.controls}>
            <button
              type="button"
              onClick={onTogglePlay}
              aria-label={isRunning ? 'Pausar foco' : 'Iniciar foco'}
              title={isRunning ? 'Pausar foco' : 'Iniciar foco'}
              className={`${styles.control} ${styles.primary}`}
            >
              {isRunning ? <Pause size={22} aria-hidden="true" /> : <Play size={22} aria-hidden="true" />}
            </button>
            <button
              type="button"
              onClick={onStop}
              aria-label="Parar e reiniciar o tempo da sessão"
              title="Parar e reiniciar o tempo da sessão"
              className={styles.control}
            >
              <Square size={19} aria-hidden="true" />
            </button>
          </div>
        </main>

        <footer aria-labelledby={insightId} className={styles.footer}>
          <h2 id={insightId} className={styles.insightLabel}>
            Insight do Mentor
          </h2>
          <p className={styles.quote}>
            “{FOCUS_QUOTES[quoteIndex]}”
          </p>
        </footer>
      </div>
    </dialog>,
    document.body,
  );
}
