import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  increment,
  serverTimestamp,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { format } from 'date-fns';
import { db, auth } from '../lib/firebase';
import {
  ActiveTimerState,
  DailyFocusSummary,
  FOCUS_PROTOCOLS,
  FocusProtocolId,
  FocusSessionDoc,
  FocusSessionStatus,
} from '../types/focus';
import { playTransitionChime, unlockAudioContext } from '../utils/ambientNoise';

export const ACTIVE_TIMER_STORAGE_KEY = 'nexus_focus_active_timer_v1';
const MIN_ABANDON_SAVE_MS = 2 * 60 * 1000; // 2 minutes minimum to persist abandoned sessions

function getDefaultTimerState(uid?: string | null): ActiveTimerState {
  const proto = FOCUS_PROTOCOLS.classic;
  return {
    protocolId: 'classic',
    phase: 'focus',
    status: 'idle',
    startedAt: null,
    accumulatedMs: 0,
    targetDurationMs: proto.focusMinutes * 60 * 1000,
    sessionStartedAt: null,
    completedCycles: 0,
    taskId: null,
    taskTitle: null,
    taskCollection: null,
    category: 'Geral',
    distractions: [],
    customFocusMinutes: 30,
    customBreakMinutes: 5,
    ownerUid: uid || null,
  };
}

function loadPersistedState(uid?: string | null): ActiveTimerState {
  if (typeof window === 'undefined') return getDefaultTimerState(uid);
  try {
    const raw = window.localStorage.getItem(ACTIVE_TIMER_STORAGE_KEY);
    if (!raw) return getDefaultTimerState(uid);
    const parsed = JSON.parse(raw) as ActiveTimerState;

    // Prevent another logged-in account from inheriting a previous user's active timer
    if (uid && parsed.ownerUid && parsed.ownerUid !== uid) {
      return getDefaultTimerState(uid);
    }

    return {
      ...getDefaultTimerState(uid),
      ...parsed,
      distractions: Array.isArray(parsed.distractions) ? parsed.distractions : [],
      ownerUid: uid || parsed.ownerUid || null,
    };
  } catch {
    return getDefaultTimerState(uid);
  }
}

function persistState(state: ActiveTimerState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ACTIVE_TIMER_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
}

function computeElapsedMs(state: ActiveTimerState, now = Date.now()): number {
  if (state.status === 'running' && state.startedAt !== null) {
    return Math.max(0, now - state.startedAt + state.accumulatedMs);
  }
  return Math.max(0, state.accumulatedMs);
}

function computeDisplayMs(state: ActiveTimerState, now = Date.now()): number {
  const elapsed = computeElapsedMs(state, now);
  if (state.protocolId === 'flowtime' && state.phase === 'focus') {
    return elapsed;
  }
  return Math.max(0, state.targetDurationMs - elapsed);
}

function getProtocolConfig(state: ActiveTimerState) {
  if (state.protocolId === 'custom') {
    return {
      focusMinutes: state.customFocusMinutes || 30,
      shortBreakMinutes: state.customBreakMinutes || 5,
      longBreakMinutes: (state.customBreakMinutes || 5) * 3,
      cyclesBeforeLongBreak: 4,
      isProgressive: false,
    };
  }
  return FOCUS_PROTOCOLS[state.protocolId];
}

export function useFocusTimer(userId?: string) {
  const resolvedUid = userId || auth.currentUser?.uid || undefined;

  const [state, setState] = useState<ActiveTimerState>(() => loadPersistedState(resolvedUid));
  const [displayMs, setDisplayMs] = useState<number>(() =>
    computeDisplayMs(loadPersistedState(resolvedUid))
  );
  const [todaySummary, setTodaySummary] = useState<DailyFocusSummary>({
    totalMinutes: 0,
    completedSessions: 0,
    distractionsCaptured: 0,
  });

  const stateRef = useRef<ActiveTimerState>(state);
  stateRef.current = state;

  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const isTransitioningRef = useRef<boolean>(false);

  // Reload state if user identity changes
  useEffect(() => {
    if (!resolvedUid) return;
    setState((prev) => {
      if (prev.ownerUid && prev.ownerUid !== resolvedUid) {
        const fresh = loadPersistedState(resolvedUid);
        persistState(fresh);
        return fresh;
      }
      if (!prev.ownerUid) {
        const updated = { ...prev, ownerUid: resolvedUid };
        persistState(updated);
        return updated;
      }
      return prev;
    });
  }, [resolvedUid]);

  // Persist every state change to localStorage (Offline-First)
  useEffect(() => {
    persistState(state);
    setDisplayMs(computeDisplayMs(state));
  }, [state]);

  // Realtime Daily Summary listener from users/{uid}/focus_sessions
  useEffect(() => {
    if (!resolvedUid) {
      setTodaySummary({ totalMinutes: 0, completedSessions: 0, distractionsCaptured: 0 });
      return;
    }

    const todayKey = format(new Date(), 'yyyy-MM-dd');
    const sessionsRef = collection(db, 'users', resolvedUid, 'focus_sessions');
    const q = query(sessionsRef, where('dateKey', '==', todayKey));

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        if (auth.currentUser?.uid && auth.currentUser.uid !== resolvedUid) return;
        let totalMinutes = 0;
        let completedSessions = 0;
        let distractionsCaptured = 0;

        snap.docs.forEach((d) => {
          const data = d.data() as FocusSessionDoc;
          totalMinutes += Number(data.actualFocusMinutes || 0);
          if (data.status === 'completed') {
            completedSessions += 1;
          }
          distractionsCaptured += Number(data.distractionCount || data.distractions?.length || 0);
        });

        setTodaySummary({
          totalMinutes,
          completedSessions,
          distractionsCaptured,
        });
      },
      () => {
        // Silent fallback when offline
      }
    );

    return () => unsubscribe();
  }, [resolvedUid]);

  // Screen Wake Lock management while status === 'running'
  const acquireWakeLock = useCallback(async () => {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;
    try {
      if (wakeLockRef.current) return;
      const sentinel = await navigator.wakeLock.request('screen');
      wakeLockRef.current = sentinel;
      sentinel.addEventListener('release', () => {
        if (wakeLockRef.current === sentinel) {
          wakeLockRef.current = null;
        }
      });
    } catch {
      // Fallback silently if browser/OS denies Wake Lock
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (!wakeLockRef.current) return;
    try {
      await wakeLockRef.current.release();
    } catch {
      // Ignore release errors
    } finally {
      wakeLockRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (state.status === 'running') {
      acquireWakeLock();
    } else {
      releaseWakeLock();
    }
    return () => {
      releaseWakeLock();
    };
  }, [state.status, acquireWakeLock, releaseWakeLock]);

  // Firestore persistence helper (Economy rule: ONLY called on completed focus or abandoned >= 2 min)
  const recordFocusSessionToFirestore = useCallback(
    async (
      snapshot: ActiveTimerState,
      sessionStatus: FocusSessionStatus,
      elapsedMs: number
    ) => {
      const uid = resolvedUid || auth.currentUser?.uid;
      if (!uid) return;

      const actualDurationSeconds = Math.max(1, Math.round(elapsedMs / 1000));
      const actualFocusMinutes = Math.max(1, Math.round(elapsedMs / 60000));
      const targetMinutes =
        snapshot.protocolId === 'flowtime'
          ? actualFocusMinutes
          : Math.round(snapshot.targetDurationMs / 60000);

      const endedNow = new Date();
      const startedDate = snapshot.sessionStartedAt
        ? new Date(snapshot.sessionStartedAt)
        : new Date(endedNow.getTime() - elapsedMs);

      const payload: FocusSessionDoc = {
        userId: uid,
        protocolId: snapshot.protocolId,
        status: sessionStatus,
        taskId: snapshot.taskId || null,
        taskTitle: snapshot.taskTitle || null,
        category: snapshot.category || 'Geral',
        targetMinutes,
        actualFocusMinutes,
        actualDurationSeconds,
        distractions: snapshot.distractions || [],
        distractionCount: (snapshot.distractions || []).length,
        startedAt: startedDate.toISOString(),
        endedAt: endedNow.toISOString(),
        dateKey: format(endedNow, 'yyyy-MM-dd'),
        createdAt: serverTimestamp(),
      };

      try {
        await addDoc(collection(db, 'users', uid, 'focus_sessions'), payload);

        // Increment completedPomodoros & totalFocusMinutes on linked task when status === 'completed'
        if (sessionStatus === 'completed' && snapshot.taskId) {
          const targetCol = snapshot.taskCollection || 'tasks';
          const taskRef = doc(db, 'users', uid, targetCol, snapshot.taskId);
          await updateDoc(taskRef, {
            completedPomodoros: increment(1),
            totalFocusMinutes: increment(actualFocusMinutes),
          }).catch(async () => {
            // Fallback in case taskId lives in 'rotinas' when taskCollection wasn't explicitly set
            if (!snapshot.taskCollection) {
              const altRef = doc(db, 'users', uid, 'rotinas', snapshot.taskId!);
              await updateDoc(altRef, {
                completedPomodoros: increment(1),
                totalFocusMinutes: increment(actualFocusMinutes),
              }).catch(() => { });
            }
          });
        }
      } catch (err) {
        console.warn('Could not persist focus session to Firestore:', err);
      }
    },
    [resolvedUid]
  );

  // Handles natural completion of countdown phases (focus -> break, or break -> focus)
  const handleCountdownComplete = useCallback(
    (current: ActiveTimerState) => {
      if (isTransitioningRef.current) return;
      isTransitioningRef.current = true;

      playTransitionChime();

      if (current.phase === 'focus') {
        const elapsed = Math.max(current.targetDurationMs, computeElapsedMs(current));
        void recordFocusSessionToFirestore(current, 'completed', elapsed);

        const proto = getProtocolConfig(current);
        const nextCycles = current.completedCycles + 1;
        const isLongBreak = nextCycles % proto.cyclesBeforeLongBreak === 0;
        const nextPhase = isLongBreak ? 'long_break' : 'short_break';
        const breakMinutes = isLongBreak ? proto.longBreakMinutes : proto.shortBreakMinutes;

        setState({
          ...current,
          phase: nextPhase,
          status: 'running',
          startedAt: Date.now(),
          accumulatedMs: 0,
          targetDurationMs: breakMinutes * 60 * 1000,
          sessionStartedAt: Date.now(),
          completedCycles: nextCycles,
          distractions: [],
        });
      } else {
        // Break finished -> return to idle focus block ready for next round
        const proto = getProtocolConfig(current);
        setState({
          ...current,
          phase: 'focus',
          status: 'idle',
          startedAt: null,
          accumulatedMs: 0,
          targetDurationMs: proto.isProgressive ? 0 : proto.focusMinutes * 60 * 1000,
          sessionStartedAt: null,
          distractions: [],
        });
      }

      setTimeout(() => {
        isTransitioningRef.current = false;
      }, 150);
    },
    [recordFocusSessionToFirestore]
  );

  // Real-time synchronization function (used by tick interval + visibilitychange)
  const syncClock = useCallback(() => {
    const current = stateRef.current;
    if (current.status !== 'running') {
      setDisplayMs(computeDisplayMs(current));
      return;
    }

    const now = Date.now();
    const nextDisplay = computeDisplayMs(current, now);
    setDisplayMs(nextDisplay);

    const isProgressiveFocus = current.protocolId === 'flowtime' && current.phase === 'focus';
    if (!isProgressiveFocus && current.targetDurationMs > 0 && nextDisplay <= 0) {
      handleCountdownComplete(current);
    }
  }, [handleCountdownComplete]);

  // High-accuracy UI refresh interval (reads Date.now() delta, never decrements state)
  useEffect(() => {
    if (state.status !== 'running') return;
    syncClock();
    const intervalId = window.setInterval(syncClock, 250);
    return () => window.clearInterval(intervalId);
  }, [state.status, state.phase, state.protocolId, syncClock]);

  // Immediate resync when returning from background / lock screen (PWA & iOS Safari)
  useEffect(() => {
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        syncClock();
        if (stateRef.current.status === 'running') {
          acquireWakeLock();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);
    window.addEventListener('pageshow', handleVisibilityOrFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      window.removeEventListener('pageshow', handleVisibilityOrFocus);
    };
  }, [syncClock, acquireWakeLock]);

  // Controls
  const start = useCallback(() => {
    unlockAudioContext();
    const now = Date.now();
    setState((prev) => {
      if (prev.status === 'running') return prev;
      return {
        ...prev,
        status: 'running',
        startedAt: now,
        sessionStartedAt: prev.sessionStartedAt ?? now,
        ownerUid: resolvedUid || prev.ownerUid || null,
      };
    });
  }, [resolvedUid]);

  const pause = useCallback(() => {
    const now = Date.now();
    setState((prev) => {
      if (prev.status !== 'running') return prev;
      const elapsed = computeElapsedMs(prev, now);
      return {
        ...prev,
        status: 'paused',
        startedAt: null,
        accumulatedMs: elapsed,
      };
    });
  }, []);

  const abandon = useCallback(() => {
    const current = stateRef.current;
    const elapsed = computeElapsedMs(current, Date.now());

    // Persist abandoned focus session ONLY if focused for more than 2 minutes
    if (current.phase === 'focus' && elapsed >= MIN_ABANDON_SAVE_MS) {
      void recordFocusSessionToFirestore(current, 'abandoned', elapsed);
    }

    const proto = getProtocolConfig(current);
    setState({
      ...current,
      phase: 'focus',
      status: 'idle',
      startedAt: null,
      accumulatedMs: 0,
      targetDurationMs: proto.isProgressive ? 0 : proto.focusMinutes * 60 * 1000,
      sessionStartedAt: null,
      distractions: [],
    });
  }, [recordFocusSessionToFirestore]);

  const finishFlowtime = useCallback(() => {
    unlockAudioContext();
    const current = stateRef.current;
    if (current.protocolId !== 'flowtime' || current.phase !== 'focus') return;

    const now = Date.now();
    const elapsed = computeElapsedMs(current, now);
    playTransitionChime();

    // Save completed Flowtime session
    if (elapsed >= 1000) {
      void recordFocusSessionToFirestore(current, 'completed', elapsed);
    }

    // Calculate break = 20% of focused time, minimum 5 minutes
    const calculatedBreakMs = Math.max(5 * 60 * 1000, Math.round(elapsed * 0.2));

    setState({
      ...current,
      phase: 'short_break',
      status: 'running',
      startedAt: now,
      accumulatedMs: 0,
      targetDurationMs: calculatedBreakMs,
      sessionStartedAt: now,
      completedCycles: current.completedCycles + 1,
      distractions: [],
    });
  }, [recordFocusSessionToFirestore]);

  const skipBreak = useCallback(() => {
    setState((prev) => {
      if (prev.phase === 'focus') return prev;
      const proto = getProtocolConfig(prev);
      return {
        ...prev,
        phase: 'focus',
        status: 'idle',
        startedAt: null,
        accumulatedMs: 0,
        targetDurationMs: proto.isProgressive ? 0 : proto.focusMinutes * 60 * 1000,
        sessionStartedAt: null,
        distractions: [],
      };
    });
  }, []);

  const selectProtocol = useCallback(
    (
      protocolId: FocusProtocolId,
      customFocusMinutes?: number,
      customBreakMinutes?: number
    ) => {
      setState((prev) => {
        if (prev.status === 'running') return prev;
        const focusMins =
          protocolId === 'custom'
            ? customFocusMinutes ?? prev.customFocusMinutes ?? 30
            : FOCUS_PROTOCOLS[protocolId].focusMinutes;
        const breakMins =
          protocolId === 'custom'
            ? customBreakMinutes ?? prev.customBreakMinutes ?? 5
            : FOCUS_PROTOCOLS[protocolId].shortBreakMinutes;
        const isProgressive =
          protocolId !== 'custom' && Boolean(FOCUS_PROTOCOLS[protocolId].isProgressive);

        return {
          ...prev,
          protocolId,
          phase: 'focus',
          status: 'idle',
          startedAt: null,
          accumulatedMs: 0,
          targetDurationMs: isProgressive ? 0 : focusMins * 60 * 1000,
          sessionStartedAt: null,
          distractions: [],
          customFocusMinutes: protocolId === 'custom' ? focusMins : prev.customFocusMinutes,
          customBreakMinutes: protocolId === 'custom' ? breakMins : prev.customBreakMinutes,
        };
      });
    },
    []
  );

  const linkTask = useCallback(
    (
      taskId: string | null,
      taskTitle: string | null,
      category = 'Geral',
      taskCollection: 'tasks' | 'rotinas' | null = 'tasks'
    ) => {
      setState((prev) => ({
        ...prev,
        taskId,
        taskTitle,
        taskCollection: taskId ? taskCollection : null,
        category: category || prev.category || 'Geral',
      }));
    },
    []
  );

  const setCategory = useCallback((category: string) => {
    setState((prev) => ({
      ...prev,
      category,
    }));
  }, []);

  const captureDistraction = useCallback((note: string) => {
    const clean = note.trim();
    if (!clean) return;
    setState((prev) => ({
      ...prev,
      distractions: [...prev.distractions, clean],
    }));
  }, []);

  return {
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
  };
}

