import { Timestamp, FieldValue } from 'firebase/firestore';

export type FocusProtocolId =
  | 'classic'
  | 'deep_work'
  | 'ultradian'
  | 'flowtime'
  | 'custom';

export type TimerPhase = 'focus' | 'short_break' | 'long_break';

export type TimerStatus = 'idle' | 'running' | 'paused';

export type FocusSessionStatus = 'completed' | 'abandoned';

export interface FocusProtocolConfig {
  id: FocusProtocolId;
  label: string;
  shortLabel: string;
  focusMinutes: number; // 0 for progressive Flowtime
  shortBreakMinutes: number;
  longBreakMinutes: number;
  cyclesBeforeLongBreak: number;
  isProgressive?: boolean;
}

export const FOCUS_PROTOCOLS: Record<Exclude<FocusProtocolId, 'custom'>, FocusProtocolConfig> = {
  classic: {
    id: 'classic',
    label: '25/5 Clássico',
    shortLabel: '25/5',
    focusMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    cyclesBeforeLongBreak: 4,
  },
  deep_work: {
    id: 'deep_work',
    label: '50/10 Deep Work',
    shortLabel: '50/10',
    focusMinutes: 50,
    shortBreakMinutes: 10,
    longBreakMinutes: 20,
    cyclesBeforeLongBreak: 3,
  },
  ultradian: {
    id: 'ultradian',
    label: '90/20 Ultradiano',
    shortLabel: '90/20',
    focusMinutes: 90,
    shortBreakMinutes: 20,
    longBreakMinutes: 30,
    cyclesBeforeLongBreak: 2,
  },
  flowtime: {
    id: 'flowtime',
    label: 'Flowtime (Livre)',
    shortLabel: 'Livre',
    focusMinutes: 0,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    cyclesBeforeLongBreak: 4,
    isProgressive: true,
  },
};

export interface ActiveTimerState {
  protocolId: FocusProtocolId;
  phase: TimerPhase;
  status: TimerStatus;
  /** Epoch timestamp (ms) when the current running segment started; null if idle or paused */
  startedAt: number | null;
  /** Elapsed time (ms) accumulated before the current running segment */
  accumulatedMs: number;
  /** Target duration (ms) for countdown modes/breaks; 0 for progressive Flowtime focus */
  targetDurationMs: number;
  /** Epoch timestamp (ms) when this session originally began */
  sessionStartedAt: number | null;
  /** Number of completed focus blocks in the current cycle sequence */
  completedCycles: number;
  /** Optional linked Firestore task ID */
  taskId: string | null;
  /** Optional linked task title snapshot */
  taskTitle: string | null;
  /** Optional source collection of the linked task ('tasks' | 'rotinas') */
  taskCollection?: 'tasks' | 'rotinas' | null;
  /** Focus category (editable in Free Focus mode) */
  category: string;
  /** Quick notes / distractions captured during the active focus session */
  distractions: string[];
  /** Custom protocol durations if protocolId === 'custom' */
  customFocusMinutes?: number;
  customBreakMinutes?: number;
  /** Optional UID of the authenticated owner to prevent cross-account bleed */
  ownerUid?: string | null;
}

export interface FocusSessionDoc {
  id?: string;
  userId: string;
  protocolId: FocusProtocolId;
  status: FocusSessionStatus;
  taskId: string | null;
  taskTitle: string | null;
  category: string;
  targetMinutes: number;
  actualFocusMinutes: number;
  actualDurationSeconds: number;
  distractions: string[];
  distractionCount: number;
  startedAt: string; // ISO string
  endedAt: string; // ISO string
  dateKey: string; // YYYY-MM-DD local date for daily summary queries
  createdAt?: Timestamp | FieldValue;
}

export interface DailyFocusSummary {
  totalMinutes: number;
  completedSessions: number;
  distractionsCaptured: number;
}

