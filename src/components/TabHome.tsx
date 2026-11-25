import { useAccountStorage } from '../hooks/useAccountStorage';
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { format, subDays } from 'date-fns';
import { Transaction, User, Rotina, Task } from '../types';
import { db, auth } from '../lib/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { 
  Bell, 
  Bot, 
  ArrowUp,
  ArrowDown,
  Plus, 
  StickyNote, 
  Banknote, 
  Target, 
  ChevronRight,
  Calendar,
  BarChart3,
  Trophy,
  MessageSquare,
  CircleDot,
  Trash2,
  Search,
  Sparkles,
  Image as ImageIcon,
  Folder,
  CheckSquare,
  FileText,
  Flame,
  LayoutGrid,
  Check,
  Smile,
  AlertTriangle,
  Pin,
  X
} from 'lucide-react';
import { BalanceStatementModal } from './BalanceStatementModal';
import { NotificationsModal } from './NotificationsModal';
import { AuraLogo } from './AuraLogo';
import { calculateHomeBalance } from '../lib/homeBalance';

interface DailyNote {
  id: string;
  texto: string;
  date: string;
  source?: 'daily' | 'quick';
}

interface DailyCheckin {
  mood: number; // 1 to 5
  energy: number; // 1 to 5
  note: string;
  updatedAt?: string;
}

interface HabitRecord {
  id: string;
  title: string;
  completedDates: string[]; // array of 'yyyy-MM-dd'
  createdAt?: any;
}

interface CoverPreset {
  id: string;
  url: string;
  author: string;
  label: string;
}

const COVER_PRESETS: CoverPreset[] = [
  {
    id: 'mountains-bw',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2000&q=85',
    author: 'Kalen Emsley',
    label: 'Montanhas Monocromáticas'
  },
  {
    id: 'alpine-peaks',
    url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=2000&q=85',
    author: 'Benjamin Voros',
    label: 'Picos Alpinos Noturnos'
  },
  {
    id: 'misty-ridge',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2000&q=85',
    author: 'Bailey Zindel',
    label: 'Vale Nebuloso'
  },
  {
    id: 'dark-summit',
    url: 'https://images.unsplash.com/photo-1542224566-6e85f2e6772f?auto=format&fit=crop&w=2000&q=85',
    author: 'kazuend',
    label: 'Cordilheira Escura'
  }
];

interface TabHomeProps {
  transactions: Transaction[];
  goals: any[];
  tasks: Task[];
  rotinas: Rotina[];
  onTabChange: (tab: any) => void;
  user: User | null;
  onOpenProfile?: () => void;
  onOpenWhatsApp?: () => void;
  latestMentorFeedback?: string | null;
}

export function TabHome({ transactions, tasks, rotinas = [], onTabChange, user, onOpenProfile, latestMentorFeedback }: TabHomeProps) {
  const accountStorage = useAccountStorage();
  const [greeting, setGreeting] = useState('Bom dia');
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const todayDateStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  // =========================================================================
  // 1. SINCRONIZAÇÃO REATIVA COM DADOS REAIS DO USUÁRIO (AccountStorage + Firestore)
  // =========================================================================
  const [coverIndex, setCoverIndex] = useState<number>(0);
  const [showFinanceRow, setShowFinanceRow] = useState<boolean>(false);
  const [localProjects, setLocalProjects] = useState<any[]>([]);
  const [localProjectTasks, setLocalProjectTasks] = useState<any[]>([]);
  const [dailyNotes, setDailyNotes] = useState<DailyNote[]>([]);
  const [quickNotes, setQuickNotes] = useState<{ id: string; text: string; createdAt: string }[]>([]);
  const [checkinsByDate, setCheckinsByDate] = useState<Record<string, DailyCheckin>>({});
  const [habits, setHabits] = useState<HabitRecord[]>([]);

  // Recarrega todos os dados do accountStorage sempre que o usuário autenticado estiver pronto
  const reloadAccountStorageData = () => {
    try {
      const savedCover = accountStorage.getItem('nexus_home_cover_idx');
      if (savedCover !== null) setCoverIndex(Number(savedCover) % COVER_PRESETS.length);

      const savedFinRow = accountStorage.getItem('nexus_home_show_finance_row');
      if (savedFinRow !== null) setShowFinanceRow(savedFinRow === 'true');

      const savedProj = accountStorage.getItem('nexus_focus_projects_list');
      setLocalProjects(savedProj ? JSON.parse(savedProj) : []);

      const savedProjTasks = accountStorage.getItem('nexus_focus_project_tasks');
      setLocalProjectTasks(savedProjTasks ? JSON.parse(savedProjTasks) : []);

      const savedDailyNotes = accountStorage.getItem('nexus_calendar_daily_notes');
      setDailyNotes(savedDailyNotes ? JSON.parse(savedDailyNotes) : []);

      const savedQuickNotes = accountStorage.getItem('nexus_quick_notes');
      setQuickNotes(savedQuickNotes ? JSON.parse(savedQuickNotes) : []);

      const savedCheckins = accountStorage.getItem('nexus_daily_checkins');
      setCheckinsByDate(savedCheckins ? JSON.parse(savedCheckins) : {});

      const savedHabits = accountStorage.getItem('nexus_daily_habits_real');
      setHabits(savedHabits ? JSON.parse(savedHabits) : []);
    } catch (e) {
      console.error('Erro ao carregar dados reais do accountStorage:', e);
    }
  };

  useEffect(() => {
    reloadAccountStorageData();
  }, [user?.id, accountStorage]);

  useEffect(() => {
    const handleStorageChange = () => reloadAccountStorageData();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [accountStorage]);

  // Sincronização opcional com Firestore para Hábitos e Check-ins (com fallback imediato no accountStorage)
  useEffect(() => {
    const activeUid = auth.currentUser?.uid || user?.id;
    if (!activeUid) return;

    const habitsCol = collection(db, 'users', activeUid, 'habits');
    const unsubHabits = onSnapshot(
      query(habitsCol, orderBy('createdAt', 'asc')),
      (snapshot) => {
        if (auth.currentUser?.uid !== activeUid) return;
        if (!snapshot.empty) {
          const docs = snapshot.docs.map(d => {
            const data = d.data();
            return {
              id: d.id,
              title: data.title || '',
              completedDates: Array.isArray(data.completedDates) ? data.completedDates : [],
              createdAt: data.createdAt
            } as HabitRecord;
          });
          setHabits(docs);
          accountStorage.setItem('nexus_daily_habits_real', JSON.stringify(docs));
        }
      },
      () => {
        // Caso as regras do Firestore restrinjam a subcoleção habits, o accountStorage mantém 100% funcional
      }
    );

    return () => unsubHabits();
  }, [user?.id, accountStorage]);

  const currentCover = COVER_PRESETS[coverIndex] || COVER_PRESETS[0];

  const handleCycleCover = () => {
    const nextIdx = (coverIndex + 1) % COVER_PRESETS.length;
    setCoverIndex(nextIdx);
    try {
      accountStorage.setItem('nexus_home_cover_idx', String(nextIdx));
    } catch (e) {
      console.error(e);
    }
  };

  // Barra de criação rápida (Tarefa | Nota)
  const [captureMode, setCaptureMode] = useState<'task' | 'note'>('task');
  const [captureText, setCaptureText] = useState('');
  const [selectedProjectForTask, setSelectedProjectForTask] = useState<string>('Sem projeto');
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchFilterText, setSearchFilterText] = useState('');
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);

  // =========================================================================
  // 2. WIDGET "COMO FOI HOJE?" (DADOS REAIS)
  // =========================================================================
  const hasTodayCheckinSaved = Boolean(checkinsByDate[todayDateStr]);
  const todayCheckin: DailyCheckin = checkinsByDate[todayDateStr] || {
    mood: 0,
    energy: 0,
    note: ''
  };

  const updateTodayCheckin = async (patch: Partial<DailyCheckin>) => {
    const updatedForToday: DailyCheckin = {
      mood: todayCheckin.mood || 4,
      energy: todayCheckin.energy || 4,
      note: todayCheckin.note || '',
      ...patch,
      updatedAt: new Date().toISOString()
    };
    const nextMap = {
      ...checkinsByDate,
      [todayDateStr]: updatedForToday
    };
    setCheckinsByDate(nextMap);
    try {
      accountStorage.setItem('nexus_daily_checkins', JSON.stringify(nextMap));
    } catch (e) {
      console.error(e);
    }

    const activeUid = auth.currentUser?.uid;
    if (activeUid) {
      try {
        await setDoc(doc(db, 'users', activeUid, 'checkins', todayDateStr), updatedForToday, { merge: true });
      } catch {
        // Fallback já garantido no accountStorage
      }
    }
  };

  // Últimos 14 dias reais de check-in
  const last14DaysCheckin = useMemo(() => {
    return Array.from({ length: 14 }).map((_, idx) => {
      const d = subDays(new Date(), 13 - idx);
      const dStr = format(d, 'yyyy-MM-dd');
      const entry = checkinsByDate[dStr];
      return {
        date: dStr,
        filled: Boolean(entry && (entry.mood > 0 || entry.energy > 0 || entry.note?.trim())),
        mood: entry?.mood || 0
      };
    });
  }, [checkinsByDate]);

  // =========================================================================
  // 3. WIDGET "HÁBITOS DE HOJE" (DADOS REAIS DO USUÁRIO + ROTINAS RECORRENTES)
  // =========================================================================
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState('');

  // Calcula histórico de 7 dias e ofensiva (streak) real a partir das datas concluídas
  const computedHabits = useMemo(() => {
    const last7Dates = Array.from({ length: 7 }).map((_, i) =>
      format(subDays(new Date(), 6 - i), 'yyyy-MM-dd')
    );

    return habits.map((h) => {
      const completedSet = new Set(h.completedDates || []);
      const completedToday = completedSet.has(todayDateStr);
      const history = last7Dates.map(d => completedSet.has(d));

      // Calcula streak real consecutivo até hoje (ou ontem, caso hoje ainda não marcado)
      let streak = 0;
      let cursor = completedToday ? new Date() : subDays(new Date(), 1);
      while (completedSet.has(format(cursor, 'yyyy-MM-dd'))) {
        streak++;
        cursor = subDays(cursor, 1);
      }

      return {
        ...h,
        completedToday,
        history,
        streak
      };
    });
  }, [habits, todayDateStr]);

  const saveHabitsLocal = (nextHabits: HabitRecord[]) => {
    setHabits(nextHabits);
    try {
      accountStorage.setItem('nexus_daily_habits_real', JSON.stringify(nextHabits));
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleHabit = async (habitId: string) => {
    let targetUpdated: HabitRecord | null = null;
    const updated = habits.map(h => {
      if (h.id !== habitId) return h;
      const dates = Array.isArray(h.completedDates) ? h.completedDates : [];
      const exists = dates.includes(todayDateStr);
      const nextDates = exists
        ? dates.filter(d => d !== todayDateStr)
        : [...dates, todayDateStr];
      targetUpdated = { ...h, completedDates: nextDates };
      return targetUpdated;
    });
    saveHabitsLocal(updated);

    const activeUid = auth.currentUser?.uid;
    if (activeUid && targetUpdated) {
      try {
        await setDoc(doc(db, 'users', activeUid, 'habits', habitId), {
          title: (targetUpdated as HabitRecord).title,
          completedDates: (targetUpdated as HabitRecord).completedDates
        }, { merge: true });
      } catch {
        // Fallback local já salvo
      }
    }
  };

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;
    const habitId = `hab-${Date.now()}`;
    const newHab: HabitRecord = {
      id: habitId,
      title: newHabitTitle.trim(),
      completedDates: []
    };
    const nextList = [...habits, newHab];
    saveHabitsLocal(nextList);
    setNewHabitTitle('');
    setIsAddingHabit(false);

    const activeUid = auth.currentUser?.uid;
    if (activeUid) {
      try {
        await setDoc(doc(db, 'users', activeUid, 'habits', habitId), {
          title: newHab.title,
          completedDates: [],
          createdAt: serverTimestamp()
        });
      } catch {
        // Fallback local já salvo
      }
    }
  };

  const handleDeleteHabit = async (e: React.MouseEvent, habitId: string) => {
    e.stopPropagation();
    const nextList = habits.filter(h => h.id !== habitId);
    saveHabitsLocal(nextList);

    const activeUid = auth.currentUser?.uid;
    if (activeUid) {
      try {
        await deleteDoc(doc(db, 'users', activeUid, 'habits', habitId));
      } catch {}
    }
  };

  // =========================================================================
  // 4. WIDGET DE AVISOS RÁPIDOS / LEMBRETES (Sincronizado com Agenda & Notas)
  // =========================================================================
  const [isAddingNotice, setIsAddingNotice] = useState(false);
  const [newNoticeText, setNewNoticeText] = useState('');

  // Atalho de teclado Ctrl+K / Cmd+K para busca rápida
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Lista real unificada de Avisos de Hoje (Agenda) + Notas Rápidas (Mais)
  const unifiedNotices = useMemo(() => {
    const todayDaily = dailyNotes
      .filter(n => n.date === todayDateStr)
      .map(n => ({
        id: n.id,
        texto: n.texto,
        dateLabel: 'Hoje',
        source: 'daily' as const
      }));

    const otherDaily = dailyNotes
      .filter(n => n.date !== todayDateStr)
      .slice(0, 4)
      .map(n => ({
        id: n.id,
        texto: n.texto,
        dateLabel: n.date === todayDateStr ? 'Hoje' : n.date.split('-').reverse().slice(0, 2).join('/'),
        source: 'daily' as const
      }));

    const fromQuickNotes = quickNotes.map(qn => ({
      id: qn.id,
      texto: qn.text,
      dateLabel: qn.createdAt || 'Nota',
      source: 'quick' as const
    }));

    // Evita textos duplicados quando salvo em ambos
    const seen = new Set<string>();
    const merged: typeof todayDaily = [];
    [...todayDaily, ...fromQuickNotes, ...otherDaily].forEach(item => {
      const key = item.texto.trim().toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(item);
      }
    });

    return merged;
  }, [dailyNotes, quickNotes, todayDateStr]);

  // 3 últimas notas para o card mobile
  const todayNotes = useMemo(() => {
    return unifiedNotices.slice(0, 3);
  }, [unifiedNotices]);

  // 5 próximas atividades mais recentes para o card mobile
  const recentActivities = useMemo(() => {
    return rotinas.slice(0, 5);
  }, [rotinas]);

  const handleAddNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoticeText.trim()) return;
    const textClean = newNoticeText.trim();
    const newNote: DailyNote = {
      id: `notice-${Date.now()}`,
      texto: textClean,
      date: todayDateStr
    };
    const updatedDaily = [newNote, ...dailyNotes];
    setDailyNotes(updatedDaily);
    try {
      accountStorage.setItem('nexus_calendar_daily_notes', JSON.stringify(updatedDaily));
    } catch (err) {
      console.error(err);
    }
    setNewNoticeText('');
    setIsAddingNotice(false);
  };

  const handleDeleteNotice = (id: string, source?: 'daily' | 'quick') => {
    if (source === 'quick') {
      const updatedQuick = quickNotes.filter(q => q.id !== id);
      setQuickNotes(updatedQuick);
      accountStorage.setItem('nexus_quick_notes', JSON.stringify(updatedQuick));
      return;
    }
    const updatedDaily = dailyNotes.filter(n => n.id !== id);
    setDailyNotes(updatedDaily);
    const updatedQuick = quickNotes.filter(q => q.id !== id);
    setQuickNotes(updatedQuick);
    try {
      accountStorage.setItem('nexus_calendar_daily_notes', JSON.stringify(updatedDaily));
      accountStorage.setItem('nexus_quick_notes', JSON.stringify(updatedQuick));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Bom dia');
    else if (hour < 18) setGreeting('Boa tarde');
    else setGreeting('Boa noite');
  }, []);

  // =========================================================================
  // 5. SUBMISSÃO DA CAIXA CENTRAL DE CAPTURA RÁPIDA (TAREFA | LEMBRETE/NOTA)
  // =========================================================================
  const handleQuickCaptureSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const raw = captureText.trim();
    if (!raw) return;

    if (captureMode === 'note') {
      const newNote: DailyNote = {
        id: `notice-${Date.now()}`,
        texto: raw,
        date: todayDateStr
      };
      const updatedNotes = [newNote, ...dailyNotes];
      setDailyNotes(updatedNotes);
      try {
        accountStorage.setItem('nexus_calendar_daily_notes', JSON.stringify(updatedNotes));
      } catch (err) {
        console.error(err);
      }
      setCaptureText('');
      return;
    }

    // Modo Tarefa: extrai #tag e !prioridade se informados
    let cleanTitle = raw;
    let priority: 'low' | 'medium' | 'high' = 'medium';
    if (/!alta|!high|!1/i.test(cleanTitle)) {
      priority = 'high';
      cleanTitle = cleanTitle.replace(/!(alta|high|1)/ig, '').trim();
    } else if (/!baixa|!low|!3/i.test(cleanTitle)) {
      priority = 'low';
      cleanTitle = cleanTitle.replace(/!(baixa|low|3)/ig, '').trim();
    } else if (/!media|!média|!2/i.test(cleanTitle)) {
      priority = 'medium';
      cleanTitle = cleanTitle.replace(/!(media|média|2)/ig, '').trim();
    }

    const tagMatch = cleanTitle.match(/#([\wÀ-ÿ-]+)/);
    const extractedTag = tagMatch ? tagMatch[1] : (selectedProjectForTask !== 'Sem projeto' ? selectedProjectForTask : 'Trabalho');
    cleanTitle = cleanTitle.replace(/#[\wÀ-ÿ-]+/g, '').trim() || raw;

    setCaptureText('');

    // 1. Se houver um projeto local selecionado (ou se o usuário tiver projetos em TabProjetos), sincroniza em nexus_focus_project_tasks
    const matchedProj = localProjects.find(p => p.name === selectedProjectForTask);
    if (matchedProj) {
      const newProjTask = {
        id: Date.now(),
        projectId: matchedProj.id,
        title: cleanTitle,
        group: 'today',
        status: 'todo',
        priority,
        tag: extractedTag,
        date: 'Hoje'
      };
      const updatedProjTasks = [newProjTask, ...localProjectTasks];
      setLocalProjectTasks(updatedProjTasks);
      try {
        accountStorage.setItem('nexus_focus_project_tasks', JSON.stringify(updatedProjTasks));
      } catch (err) {
        console.error(err);
      }
    }

    // 2. Salva no Firestore em `rotinas` (para aparecer na Agenda do dia) E em `tasks`
    const activeUid = auth.currentUser?.uid;
    if (activeUid) {
      const nowTime = format(new Date(), 'HH:mm');
      try {
        await addDoc(collection(db, 'users', activeUid, 'rotinas'), {
          title: cleanTitle,
          subtitle: selectedProjectForTask !== 'Sem projeto' ? selectedProjectForTask : '',
          time: nowTime,
          category: extractedTag === 'Pessoal' || extractedTag === 'Estudos' ? extractedTag : 'Trabalho',
          date: todayDateStr,
          completed: false,
          createdAt: serverTimestamp()
        });
      } catch (err) {
        console.error('Error adding quick task to rotinas:', err);
      }
    }
  };

  // =========================================================================
  // 6. WIDGET DE TAREFAS 100% CONECTADO AOS DADOS REAIS
  //    (Firestore `tasks` + Firestore `rotinas` da Agenda + Tarefas de `TabProjetos` + Prazos de Projetos)
  // =========================================================================
  const unifiedDesktopTasks = useMemo(() => {
    const items: {
      id: string;
      source: 'firestore-task' | 'firestore-rotina' | 'project-task';
      title: string;
      completed: boolean;
      projectLabel?: string;
      projectColor?: 'emerald' | 'amber' | 'blue' | 'purple';
      isOverdue: boolean;
      isToday: boolean;
      rawDate: string;
      dateLabel: string;
      timeLabel?: string;
      priority: 'low' | 'medium' | 'high';
    }[] = [];

    const formatShortDate = (dStr?: string) => {
      if (!dStr) return 'Hoje';
      if (dStr === todayDateStr || dStr.toLowerCase() === 'hoje' || dStr.toLowerCase() === 'today') return 'Hoje';
      const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');
      if (dStr === yesterdayStr) return 'Ontem';
      const parts = dStr.split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
      return dStr;
    };

    // 1. Rotinas reais da Agenda (Firestore `users/{uid}/rotinas`)
    rotinas.forEach(r => {
      const rDate = r.date || todayDateStr;
      const isOverdue = !r.completed && Boolean(rDate < todayDateStr);
      const isToday = rDate === todayDateStr;
      const cat = (r as any).category || (r as any).subtitle || 'Agenda';
      items.push({
        id: r.id,
        source: 'firestore-rotina',
        title: r.title,
        completed: Boolean(r.completed),
        projectLabel: cat,
        projectColor: cat === 'Trabalho' ? 'amber' : cat === 'Estudos' ? 'purple' : 'blue',
        isOverdue,
        isToday,
        rawDate: rDate,
        dateLabel: formatShortDate(rDate),
        timeLabel: typeof r.time === 'string' ? r.time.slice(0, 5) : undefined,
        priority: 'medium'
      });
    });

    // 2. Tarefas de Projetos reais (`TabProjetos` -> `nexus_focus_project_tasks`)
    localProjectTasks.forEach(pt => {
      const proj = localProjects.find(p => p.id === pt.projectId);
      const isDone = pt.status === 'done';
      const rawDate = pt.date || 'Hoje';
      const isToday = pt.group === 'today' || rawDate === 'Hoje' || rawDate === format(new Date(), 'dd/MM');
      items.push({
        id: String(pt.id),
        source: 'project-task',
        title: pt.title,
        completed: isDone,
        projectLabel: proj?.name || pt.tag || 'Projeto',
        projectColor: proj?.category === 'Trabalho' ? 'amber' : 'blue',
        isOverdue: false,
        isToday,
        rawDate: isToday ? todayDateStr : rawDate,
        dateLabel: rawDate,
        timeLabel: undefined,
        priority: pt.priority || 'medium'
      });
    });

    // 3. Tarefas gerais do Firestore (`users/{uid}/tasks`, ex: criadas pelo Mentor IA ou FocusMode)
    const existingTitles = new Set(items.map(i => i.title.trim().toLowerCase()));
    tasks.forEach(t => {
      // Evita duplicar caso a mesma tarefa já esteja em rotinas
      if (existingTitles.has(t.title.trim().toLowerCase())) return;
      const deadline = t.deadline || t.date || todayDateStr;
      const isOverdue = !t.completed && Boolean(deadline < todayDateStr);
      const isToday = deadline === todayDateStr;
      items.push({
        id: t.id,
        source: 'firestore-task',
        title: t.title,
        completed: Boolean(t.completed),
        projectLabel: t.description || 'Geral',
        projectColor: t.priority === 'high' ? 'amber' : 'blue',
        isOverdue,
        isToday,
        rawDate: deadline,
        dateLabel: formatShortDate(deadline),
        timeLabel: t.time ? t.time.slice(0, 5) : undefined,
        priority: t.priority || 'medium'
      });
    });

    // Ordenação inteligente:
    // 1º Pendentes atrasadas, 2º Pendentes de hoje, 3º Outras pendentes, 4º Concluídas
    return items.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
      if (a.isToday !== b.isToday) return a.isToday ? -1 : 1;
      return (a.timeLabel || '23:59').localeCompare(b.timeLabel || '23:59');
    });
  }, [tasks, rotinas, localProjectTasks, localProjects, todayDateStr]);

  const overdueCount = useMemo(() => {
    return unifiedDesktopTasks.filter(t => !t.completed && t.isOverdue).length;
  }, [unifiedDesktopTasks]);

  const todayPendingCount = useMemo(() => {
    return unifiedDesktopTasks.filter(t => !t.completed).length;
  }, [unifiedDesktopTasks]);

  const completedUnifiedCount = useMemo(() => {
    return unifiedDesktopTasks.filter(t => t.completed).length;
  }, [unifiedDesktopTasks]);

  const handleToggleUnifiedTask = async (item: typeof unifiedDesktopTasks[0]) => {
    const activeUid = auth.currentUser?.uid;
    if (item.source === 'project-task') {
      const updated = localProjectTasks.map(pt => {
        if (String(pt.id) === item.id) {
          return {
            ...pt,
            status: pt.status === 'done' ? 'todo' : 'done',
            completedAt: pt.status !== 'done' ? new Date().toISOString() : undefined
          };
        }
        return pt;
      });
      setLocalProjectTasks(updated);
      try {
        accountStorage.setItem('nexus_focus_project_tasks', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return;
    }

    if (!activeUid) return;
    try {
      if (item.source === 'firestore-task') {
        await updateDoc(doc(db, 'users', activeUid, 'tasks', item.id), {
          completed: !item.completed
        });
      } else if (item.source === 'firestore-rotina') {
        await updateDoc(doc(db, 'users', activeUid, 'rotinas', item.id), {
          completed: !item.completed
        });
      }
    } catch (err) {
      console.error('Error toggling task:', err);
    }
  };

  // Balance carries the entire history; the secondary indicators cover this month.
  const { balance, totalIncome, totalExpense } = calculateHomeBalance(
    transactions, format(new Date(), 'yyyy-MM-dd')
  );

  const totalTasks = todayPendingCount + completedUnifiedCount || 1;
  const progressPercent = Math.round((completedUnifiedCount / totalTasks) * 100);

  const completedHabitsCount = computedHabits.filter(h => h.completedToday).length;
  const firstName = user?.name?.split(' ')[0] || 'Usuário';

  // Card Resumo de Hoje (usado apenas no mobile via renderResumoDeHojeCards)
  const renderResumoDeHojeCards = () => (
    <div className="glass-card p-5 w-full mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
        
        {/* Coluna 1 (Esquerda) — Progresso */}
        <div className="flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">Resumo de Hoje</h3>
            <div className="flex items-center gap-4 mb-2">
              <div className="w-14 h-14 rounded-full border-[3.5px] border-blue-500 flex items-center justify-center font-bold text-sm text-slate-700 dark:text-slate-200 shadow-inner shrink-0">
                {progressPercent}%
              </div>
              <div className="flex flex-col gap-1 text-[11px] text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500"></div> {completedUnifiedCount} concluídas</span>
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-400"></div> {todayPendingCount} pendentes</span>
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500"></div> {overdueCount} em atraso</span>
              </div>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => onTabChange('calendar')}
            className="text-blue-500 text-xs font-medium hover:text-blue-600 flex items-center gap-1 mt-3 transition-colors cursor-pointer w-max"
          >
            Ver agenda <span>→</span>
          </button>
        </div>

        {/* Coluna 2 (Direita) — Avisos de Hoje */}
        <div className="flex flex-col border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-700 pt-3 sm:pt-0 sm:pl-4 justify-between">
          <div>
            <div className="flex justify-between items-center mb-2.5">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <span className="text-yellow-500 text-xs">📌</span> Avisos de Hoje
              </h3>
              <button 
                type="button"
                onClick={() => setIsAddingNotice(prev => !prev)}
                className="bg-blue-50 dark:bg-blue-500/10 text-blue-500 p-1 rounded-md hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors cursor-pointer"
                title="Adicionar aviso"
                aria-label="Adicionar aviso"
              >
                <Plus size={15} />
              </button>
            </div>
            {isAddingNotice && (
              <form onSubmit={handleAddNotice} className="mb-2 flex items-center gap-1">
                <input 
                  type="text"
                  value={newNoticeText}
                  onChange={(e) => setNewNoticeText(e.target.value)}
                  placeholder="Novo aviso rápido..."
                  autoFocus
                  className="flex-1 text-[11px] px-2 py-1 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-blue-500/40 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button 
                  type="submit" 
                  disabled={!newNoticeText.trim()}
                  className="px-2 py-1 text-[11px] font-bold bg-blue-600 text-white rounded-lg disabled:opacity-50 transition-opacity cursor-pointer"
                >
                  Salvar
                </button>
              </form>
            )}
            {todayNotes.length > 0 ? (
              <ul className="space-y-1">
                {todayNotes.map((nota) => (
                  <li 
                    key={nota.id}
                    className="flex items-center justify-between gap-1.5 px-2 py-1 rounded-lg bg-white/40 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 text-[11px] text-slate-700 dark:text-slate-300 group"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0"></span>
                      <span className="truncate leading-tight font-medium">{nota.texto}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteNotice(nota.id, nota.source)}
                      className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 cursor-pointer"
                      title="Apagar aviso"
                    >
                      <Trash2 size={11} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="h-full min-h-[58px] flex items-center justify-center text-slate-400 italic text-[11px] text-center bg-slate-50/50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 px-2.5 py-2">
                Nenhum aviso para hoje
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );

  const MOOD_EMOJIS = [
    { level: 1, emoji: '😞', label: 'Difícil' },
    { level: 2, emoji: '😕', label: 'Baixo' },
    { level: 3, emoji: '😐', label: 'Ok' },
    { level: 4, emoji: '🙂', label: 'Bom' },
    { level: 5, emoji: '😄', label: 'Ótimo' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4 md:gap-0 p-0"
    >
      <BalanceStatementModal
        isOpen={isStatementModalOpen}
        onClose={() => setIsStatementModalOpen(false)}
        transactions={transactions}
        balance={balance}
      />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      {/* Modal de Busca Rápida (Ctrl+K) */}
      <AnimatePresence>
        {isSearchModalOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              className="w-full max-w-lg glass-card overflow-hidden shadow-2xl border border-white/80 dark:border-blue-500/30"
            >
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200/70 dark:border-blue-500/20">
                <Search size={17} className="text-blue-500" />
                <input
                  type="text"
                  value={searchFilterText}
                  onChange={(e) => setSearchFilterText(e.target.value)}
                  placeholder="Buscar tarefas, hábitos, avisos ou projetos..."
                  autoFocus
                  className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                />
                <button
                  onClick={() => setIsSearchModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto p-3 space-y-1.5">
                {unifiedDesktopTasks
                  .filter(t => !searchFilterText.trim() || t.title.toLowerCase().includes(searchFilterText.toLowerCase()))
                  .slice(0, 6)
                  .map(item => (
                    <button
                      key={`${item.source}-${item.id}`}
                      onClick={() => {
                        setIsSearchModalOpen(false);
                        onTabChange(item.source === 'project-task' ? 'projects' : 'calendar');
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-blue-500/10 text-left transition-colors group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <CheckSquare size={14} className="text-blue-500 shrink-0" />
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">{item.title}</span>
                      </div>
                      <span className="text-[10px] font-medium text-slate-400">{item.dateLabel}</span>
                    </button>
                  ))}
                <div className="pt-2 border-t border-slate-200/60 dark:border-blue-500/15 flex items-center justify-between px-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Atalhos rápidos</span>
                  <div className="flex gap-2 font-semibold">
                    <button onClick={() => { setIsSearchModalOpen(false); onTabChange('projects'); }} className="hover:text-blue-500">Projetos</button>
                    <span>•</span>
                    <button onClick={() => { setIsSearchModalOpen(false); onTabChange('finances'); }} className="hover:text-blue-500">Finanças</button>
                    <span>•</span>
                    <button onClick={() => { setIsSearchModalOpen(false); onTabChange('focus'); }} className="hover:text-blue-500">Modo Foco</button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* MOBILE VIEW (Strictly preserved for Smartphones)          */}
      {/* ========================================================= */}
      <div className="block md:hidden space-y-4">
        
        {/* Mobile Header */}
        <div className="flex items-center justify-between pt-1 pb-1">
          <div className="flex items-center gap-3">
            <button 
              onClick={onOpenProfile}
              className="w-11 h-11 rounded-full overflow-hidden bg-blue-500/10 border-2 border-white/80 dark:border-blue-500/30 shadow-sm shrink-0 cursor-pointer focus:outline-none"
            >
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-blue-600 dark:text-blue-400 bg-blue-500/15 text-sm">
                  {user?.name?.charAt(0) || 'P'}
                </div>
              )}
            </button>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-none mb-1">{greeting},</p>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-none tracking-tight">
                {firstName}
              </h1>
            </div>
          </div>

          <button 
            onClick={() => setIsNotificationsOpen(true)}
            className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-slate-700 dark:text-slate-200 shadow-sm relative transition-transform active:scale-95"
            aria-label="Notificações"
          >
            <Bell size={18} />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900"></span>
          </button>
        </div>

        {/* Cards Resumo de Hoje & Avisos de Hoje (Mobile) */}
        {renderResumoDeHojeCards()}

        {/* Card Saldo disponível / Finanças (Mobile) */}
        <div className="glass-card p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
                <Banknote size={15} />
              </div>
              <span className="font-bold text-sm text-slate-900 dark:text-white">Saldo total</span>
            </div>
            <button onClick={() => onTabChange('finances')} className="text-slate-400 hover:text-blue-500 transition-colors" aria-label="Ir para finanças">
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="flex items-end justify-between mb-5">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5">Acumulado até hoje</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            
            <div className="flex items-end gap-1.5 h-10 pb-1">
              {[35, 50, 40, 70, 55, 85, 100].map((h, i) => (
                <div 
                  key={i} 
                  className="w-1.5 rounded-full bg-blue-500/35 dark:bg-blue-500/50" 
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/60 dark:bg-white/5 border border-slate-200/50 dark:border-white/10">
              <div className="w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <ArrowUp size={14} className="stroke-[2.5]" />
              </div>
              <div className="overflow-hidden">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block leading-tight">Receitas do mês</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight mt-0.5 truncate">
                  R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/60 dark:bg-white/5 border border-slate-200/50 dark:border-white/10">
              <div className="w-7 h-7 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <ArrowDown size={14} className="stroke-[2.5]" />
              </div>
              <div className="overflow-hidden">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block leading-tight">Despesas do mês</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight mt-0.5 truncate">
                  R$ {totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Insight do Mentor (Mobile) */}
        <div className="glass-card p-5 relative overflow-hidden flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-sm">
                <Bot size={18} />
              </div>
              <span className="font-bold text-sm text-slate-900 dark:text-white">Insight do Mentor</span>
            </div>
            <button onClick={() => onTabChange('chat')} className="text-slate-400 hover:text-blue-500 transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
            {latestMentorFeedback || "Você tem 3 tarefas prioritárias hoje. Comece pela reunião das 08:30 e reserve um bloco para revisar finanças."}
          </p>

          <button 
            onClick={() => onTabChange('chat')}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white/70 dark:bg-white/5 hover:bg-white/90 dark:hover:bg-white/10 border border-slate-200/60 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold transition-all shadow-sm active:scale-[0.99] group"
          >
            <div className="flex items-center gap-2">
              <MessageSquare size={15} />
              <span>Perguntar ao Mentor</span>
            </div>
            <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Próximas Atividades (Mobile) */}
        <div className="glass-card p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-sm text-slate-900 dark:text-white">Próximas atividades</h2>
            <button 
              onClick={() => onTabChange('calendar')} 
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Ver todas
            </button>
          </div>

          <div className="flex flex-col divide-y divide-slate-100 dark:divide-white/5">
            {recentActivities.length > 0 ? (
              recentActivities.map((act) => (
                <div key={act.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <CircleDot size={15} className="text-blue-500 shrink-0" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 w-11 shrink-0">{act.time || '09:00'}</span>
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{act.title}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{act.date || 'Hoje'}</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25 shrink-0">
                    {(act as any).category || 'Rotina'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-3 text-center">Nenhuma atividade agendada</p>
            )}
          </div>
        </div>

        {/* Atalhos Rápidos (Mobile) */}
        <div>
          <h2 className="font-bold text-sm text-slate-900 dark:text-white mb-2.5 px-0.5">Atalhos rápidos</h2>
          <div className="grid grid-cols-4 gap-2.5">
            <button 
              onClick={() => onTabChange('calendar')}
              className="glass-card p-3 flex flex-col items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.96] transition-all cursor-pointer shadow-sm group"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <Calendar size={18} />
              </div>
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Agenda</span>
            </button>

            <button 
              onClick={() => onTabChange('focus')}
              className="glass-card p-3 flex flex-col items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.96] transition-all cursor-pointer shadow-sm group"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <Target size={18} />
              </div>
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Foco</span>
            </button>

            <button 
              onClick={() => onTabChange('finances')}
              className="glass-card p-3 flex flex-col items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.96] transition-all cursor-pointer shadow-sm group"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <BarChart3 size={18} />
              </div>
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Finanças</span>
            </button>

            <button 
              onClick={() => onTabChange('more')}
              className="glass-card p-3 flex flex-col items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.96] transition-all cursor-pointer shadow-sm group"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <Trophy size={18} />
              </div>
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Metas</span>
            </button>
          </div>
        </div>

      </div>


      {/* ========================================================================= */}
      {/* DESKTOP VIEW (Identidade Visual Nexus Focus + Dados Reais + 4 Widgets)    */}
      {/* ========================================================================= */}
      <div className="hidden md:flex flex-col min-h-screen text-slate-900 dark:text-slate-100 relative pb-16 select-none">

        {/* ===================================================================== */}
        {/* 1. HERO BANNER COM CAPA & IDENTIDADE VISUAL NEXUS FOCUS               */}
        {/* ===================================================================== */}
        <div className="relative w-full h-[250px] lg:h-[275px] xl:h-[300px] overflow-hidden shrink-0">
          <img
            src={currentCover.url}
            alt={currentCover.label}
            className="w-full h-full object-cover object-center grayscale contrast-125 brightness-75 scale-[1.01] transition-all duration-700"
          />

          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/65 via-blue-950/35 to-[#f1f5f9] dark:to-[#030712]" />
          <div className="absolute inset-0 bg-radial from-blue-500/10 via-transparent to-black/40 pointer-events-none" />

          {/* Barra Superior */}
          <header className="relative z-20 flex items-center justify-between px-7 pt-3.5">
            {/* Brand Header Oficial Nexus Focus */}
            <button
              onClick={() => onTabChange('home')}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-slate-900/55 hover:bg-slate-900/75 backdrop-blur-xl border border-white/15 dark:border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all cursor-pointer group"
              title="Nexus Focus"
            >
              <div className="w-7 h-7 flex items-center justify-center text-blue-500">
                <AuraLogo className="w-6 h-6 drop-shadow-[0_0_10px_rgba(59,130,246,0.6)] group-hover:scale-105 transition-transform" />
              </div>
              <div className="flex items-center gap-1 text-left">
                <span className="text-xs font-black tracking-tight text-white leading-none">NEXUS</span>
                <span className="text-xs font-black tracking-tight text-blue-400 leading-none">FOCUS</span>
              </div>
            </button>

            {/* Ações à Direita */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsSearchModalOpen(true)}
                className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-900/60 hover:bg-slate-900/80 border border-white/20 dark:border-blue-500/30 text-white text-xs font-semibold backdrop-blur-xl transition-all cursor-pointer shadow-[0_4px_15px_rgba(0,0,0,0.25)] hover:border-blue-400/50"
              >
                <Search size={13} className="text-blue-400" />
                <span>Buscar</span>
                <kbd className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-500/20 text-blue-200 border border-blue-400/30 rounded">
                  Ctrl K
                </kbd>
              </button>

              <button
                type="button"
                onClick={() => onTabChange('projects')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900/60 hover:bg-slate-900/80 border border-white/20 dark:border-blue-500/30 text-white text-xs font-semibold backdrop-blur-xl transition-all cursor-pointer shadow-[0_4px_15px_rgba(0,0,0,0.25)] hover:border-blue-400/50"
              >
                <Sparkles size={13} className="text-blue-400" />
                <span>Próximas alterações</span>
              </button>

              <button
                type="button"
                onClick={() => setIsNotificationsOpen(true)}
                className="relative w-8 h-8 rounded-full bg-slate-900/60 hover:bg-slate-900/80 border border-white/20 dark:border-blue-500/30 flex items-center justify-center text-white backdrop-blur-xl transition-all cursor-pointer shadow-[0_4px_15px_rgba(0,0,0,0.25)] hover:border-blue-400/50"
                title="Notificações"
              >
                <Bell size={14} className="text-blue-300" />
                {(overdueCount + unifiedNotices.length) > 0 && (
                  <span className="absolute -top-1 -right-1 px-1 min-w-[16px] h-4 rounded-full bg-blue-500 text-white font-black text-[9px] flex items-center justify-center shadow-[0_0_10px_rgba(59,130,246,0.8)]">
                    {overdueCount + unifiedNotices.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={onOpenProfile}
                className="w-8 h-8 rounded-full overflow-hidden border-2 border-blue-400/60 bg-blue-600 flex items-center justify-center text-xs font-bold text-white shadow-[0_0_12px_rgba(59,130,246,0.5)] cursor-pointer hover:scale-105 transition-all"
                title="Perfil"
              >
                {user?.photoURL ? (
                  <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{firstName.charAt(0)}</span>
                )}
              </button>
            </div>
          </header>

          {/* Saudação Centralizada sobre a Montanha */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 mt-5 lg:mt-7">
            <h1 className="text-2xl lg:text-[30px] font-black text-white tracking-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
              {greeting}, <span className="text-blue-400 drop-shadow-[0_0_14px_rgba(59,130,246,0.45)]">{firstName}</span>. O que vamos fazer hoje?
            </h1>

            {/* Alerta Real de Tarefas Atrasadas / Pendentes */}
            <button
              type="button"
              onClick={() => onTabChange('calendar')}
              className="mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-slate-900/65 hover:bg-slate-900/85 border border-blue-400/30 backdrop-blur-xl text-[11px] font-bold text-amber-300 shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all cursor-pointer"
            >
              <AlertTriangle size={12} className="text-amber-400 shrink-0" />
              <span>
                {overdueCount > 0
                  ? `${overdueCount} ${overdueCount === 1 ? 'tarefa atrasada' : 'tarefas atrasadas'}`
                  : todayPendingCount > 0
                  ? `${todayPendingCount} ${todayPendingCount === 1 ? 'tarefa pendente hoje' : 'tarefas pendentes hoje'}`
                  : 'Tudo em dia por hoje'}
              </span>
            </button>
          </div>

          {/* Créditos da Foto e Botão "Trocar capa" */}
          <div className="absolute right-8 bottom-12 z-20 flex items-center gap-3 text-[11px] text-slate-200 font-medium drop-shadow">
            <span className="hidden sm:inline opacity-85">
              Foto de {currentCover.author} no Unsplash
            </span>
            <button
              type="button"
              onClick={handleCycleCover}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/65 hover:bg-slate-900/85 border border-white/20 dark:border-blue-500/30 text-white text-[11px] font-semibold backdrop-blur-xl transition-all cursor-pointer shadow-sm hover:border-blue-400/50"
            >
              <ImageIcon size={12} className="text-blue-400" />
              <span>Trocar capa</span>
            </button>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* 2. CAIXA CENTRAL DE CAPTURA RÁPIDA (Tarefa | Lembrete/Nota)           */}
        {/* ===================================================================== */}
        <div className="relative z-30 -mt-14 px-6">
          <div className="w-full max-w-[580px] mx-auto glass-card px-4 py-3 border border-white/85 dark:border-blue-500/35 shadow-[0_18px_45px_rgba(0,0,0,0.18)] dark:shadow-[0_18px_50px_rgba(0,0,0,0.75),0_0_25px_rgba(59,130,246,0.14)]">
            {/* Abas Tarefa / Nota */}
            <div className="flex items-center gap-4 border-b border-slate-200/70 dark:border-blue-500/20 pb-2 mb-2.5">
              <button
                type="button"
                onClick={() => setCaptureMode('task')}
                className={`flex items-center gap-1.5 text-xs font-bold pb-1.5 -mb-[9px] border-b-2 transition-all cursor-pointer ${
                  captureMode === 'task'
                    ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
                    : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <CheckSquare size={13} />
                <span>Tarefa</span>
              </button>

              <button
                type="button"
                onClick={() => setCaptureMode('note')}
                className={`flex items-center gap-1.5 text-xs font-bold pb-1.5 -mb-[9px] border-b-2 transition-all cursor-pointer ${
                  captureMode === 'note'
                    ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
                    : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Pin size={13} />
                <span>Aviso / Lembrete</span>
              </button>
            </div>

            {/* Form de Captura */}
            <form onSubmit={handleQuickCaptureSubmit}>
              <input
                id="desktop-quick-capture-input"
                type="text"
                value={captureText}
                onChange={(e) => setCaptureText(e.target.value)}
                placeholder={
                  captureMode === 'task'
                    ? 'O que precisa ser feito hoje?'
                    : 'Adicionar aviso rápido ou lembrete para hoje...'
                }
                className="w-full bg-transparent text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none py-1"
              />

              <div className="flex items-center justify-between mt-2 pt-0.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  {captureMode === 'task' ? (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsProjectDropdownOpen(prev => !prev)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl glass-pill hover:border-blue-500/40 text-[11px] text-slate-700 dark:text-slate-200 font-semibold transition-all cursor-pointer"
                      >
                        <Folder size={11} className="text-blue-500" />
                        <span>{selectedProjectForTask}</span>
                      </button>

                      {isProjectDropdownOpen && (
                        <div className="absolute left-0 mt-1.5 w-48 rounded-2xl glass-card border border-white/80 dark:border-blue-500/30 shadow-xl py-1.5 z-40">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProjectForTask('Sem projeto');
                              setIsProjectDropdownOpen(false);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400"
                          >
                            Sem projeto (Agenda)
                          </button>
                          {localProjects.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setSelectedProjectForTask(p.name);
                                setIsProjectDropdownOpen(false);
                              }}
                              className="w-full text-left px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 truncate"
                            >
                              {p.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Pin size={11} className="text-amber-500" /> Aparece no widget de Avisos & na Agenda
                    </span>
                  )}

                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Use <code className="text-blue-600 dark:text-blue-400 font-semibold">#tag</code> para categoria • <code className="text-blue-600 dark:text-blue-400 font-semibold">!</code> prioridade
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={!captureText.trim()}
                  className="w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white flex items-center justify-center shadow-[0_0_12px_rgba(59,130,246,0.5)] transition-all cursor-pointer shrink-0 active:scale-95"
                  title="Adicionar"
                >
                  <Plus size={15} strokeWidth={2.5} />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* 3. SEÇÃO "HOJE" + BOTÃO PERSONALIZAR + GRID DE 4 WIDGETS REAIS        */}
        {/* ===================================================================== */}
        <div className="w-full max-w-[1360px] mx-auto px-6 mt-5">
          {/* Cabeçalho da seção HOJE */}
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-blue-400">
                HOJE
              </span>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsCustomizeOpen(prev => !prev)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl glass-pill hover:border-blue-500/40 text-[11px] font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-sm"
              >
                <LayoutGrid size={12} className="text-blue-500" />
                <span>Personalizar</span>
              </button>

              {isCustomizeOpen && (
                <div className="absolute right-0 mt-1.5 w-64 rounded-2xl glass-card border border-white/80 dark:border-blue-500/30 shadow-2xl p-3.5 z-40 space-y-2.5">
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                    Widgets visíveis na Home
                  </p>
                  <label className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                    <span>Resumo Financeiro & Mentor</span>
                    <input
                      type="checkbox"
                      checked={showFinanceRow}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setShowFinanceRow(val);
                        accountStorage.setItem('nexus_home_show_finance_row', String(val));
                      }}
                      className="accent-blue-600"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      handleCycleCover();
                      setIsCustomizeOpen(false);
                    }}
                    className="w-full text-left text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline pt-1.5 border-t border-slate-200/60 dark:border-blue-500/20"
                  >
                    Alternar imagem de capa →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* GRID DE 4 WIDGETS CONECTADOS AOS DADOS REAIS */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5 items-stretch">

            {/* =============================================================== */}
            {/* WIDGET 1: COMO FOI HOJE? (Check-in Real por Data)               */}
            {/* =============================================================== */}
            <div className="glass-card p-4 flex flex-col justify-between relative overflow-hidden">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <Smile size={14} />
                    </div>
                    <h2 className="text-xs font-bold text-slate-900 dark:text-white">Como foi hoje?</h2>
                  </div>
                  {hasTodayCheckinSaved ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                      Salvo
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-400">Registrar</span>
                  )}
                </div>

                {/* Humor */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold w-12">Humor</span>
                  <div className="flex items-center gap-1 flex-1 justify-between">
                    {MOOD_EMOJIS.map((item) => {
                      const isSelected = todayCheckin.mood === item.level;
                      return (
                        <button
                          key={item.level}
                          type="button"
                          onClick={() => updateTodayCheckin({ mood: item.level })}
                          title={item.label}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center text-base transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-blue-500/15 dark:bg-blue-500/25 border-blue-500 scale-105 shadow-[0_0_12px_rgba(59,130,246,0.35)]'
                              : 'bg-white/50 dark:bg-white/[0.04] border-slate-200/70 dark:border-white/[0.08] opacity-75 hover:opacity-100 hover:border-blue-400/50'
                          }`}
                        >
                          {item.emoji}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Energia */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold w-12">Energia</span>
                  <div className="flex items-center gap-1 flex-1 justify-between">
                    {[1, 2, 3, 4, 5].map((lvl) => {
                      const isSelected = todayCheckin.energy === lvl;
                      return (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => updateTodayCheckin({ energy: lvl })}
                          title={`Energia ${lvl}/5`}
                          className={`w-8 h-8 rounded-xl flex items-end justify-center gap-0.5 p-1.5 transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-blue-500/15 dark:bg-blue-500/25 border-blue-500 scale-105 shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                              : 'bg-white/50 dark:bg-white/[0.04] border-slate-200/70 dark:border-white/[0.08] opacity-75 hover:opacity-100 hover:border-blue-400/50'
                          }`}
                        >
                          {[1, 2, 3, 4].map((bar) => (
                            <span
                              key={bar}
                              className={`w-1 rounded-full transition-all ${
                                bar <= Math.ceil((lvl / 5) * 4)
                                  ? isSelected
                                    ? 'bg-blue-600 dark:bg-blue-400'
                                    : 'bg-slate-400 dark:bg-slate-400'
                                  : 'bg-slate-200 dark:bg-slate-700'
                              }`}
                              style={{ height: `${bar * 25}%` }}
                            />
                          ))}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Input "Uma linha sobre o dia (opcional)" */}
                <div className="mb-3">
                  <input
                    type="text"
                    value={todayCheckin.note}
                    onChange={(e) => updateTodayCheckin({ note: e.target.value })}
                    placeholder="Uma linha sobre o dia (opcional)"
                    className="w-full px-3 py-1.5 rounded-xl bg-white/60 dark:bg-slate-900/50 border border-slate-200/80 dark:border-blue-500/20 text-xs font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Barra inferior de 14 pílulas de consistência real */}
              <div className="pt-2 border-t border-slate-200/60 dark:border-blue-500/15">
                <div className="grid grid-cols-14 gap-1">
                  {last14DaysCheckin.map((d) => (
                    <div
                      key={d.date}
                      title={`${d.date}${d.filled ? ' (Registrado)' : ''}`}
                      className={`h-1.5 rounded-full transition-colors ${
                        d.filled
                          ? 'bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.5)]'
                          : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* =============================================================== */}
            {/* WIDGET 2: HÁBITOS DE HOJE (100% Real, Sem Dados Mockados)       */}
            {/* =============================================================== */}
            <div className="glass-card p-4 flex flex-col justify-between relative overflow-hidden">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <Flame size={14} />
                    </div>
                    <h2 className="text-xs font-bold text-slate-900 dark:text-white">Hábitos de hoje</h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25">
                      {completedHabitsCount}/{computedHabits.length}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAddingHabit(prev => !prev)}
                    className="w-6 h-6 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/25 flex items-center justify-center text-blue-600 dark:text-blue-400 transition-colors cursor-pointer"
                    title="Adicionar novo hábito"
                  >
                    <Plus size={13} />
                  </button>
                </div>

                {isAddingHabit && (
                  <form onSubmit={handleCreateHabit} className="flex items-center gap-1.5 mb-2.5">
                    <input
                      type="text"
                      value={newHabitTitle}
                      onChange={(e) => setNewHabitTitle(e.target.value)}
                      placeholder="Ex: Treinar, Ler 20 páginas..."
                      autoFocus
                      className="flex-1 px-2.5 py-1.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-blue-500/40 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer shadow-sm"
                    >
                      OK
                    </button>
                  </form>
                )}

                {/* Lista Real de Hábitos */}
                <div className="space-y-1.5 max-h-[175px] overflow-y-auto pr-1">
                  {computedHabits.length > 0 ? (
                    computedHabits.map((hab, idx) => {
                      const checkColorClass = hab.completedToday
                        ? idx % 2 === 1
                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                          : 'bg-blue-600 border-blue-600 text-white shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                        : 'border-slate-300 dark:border-slate-600 bg-white/40 dark:bg-white/[0.03] group-hover:border-blue-500';

                      const dotColorClass = idx % 2 === 1 ? 'bg-emerald-500' : 'bg-blue-500';

                      return (
                        <div
                          key={hab.id}
                          onClick={() => handleToggleHabit(hab.id)}
                          className="flex items-center justify-between gap-2 py-1 px-1.5 rounded-xl hover:bg-white/50 dark:hover:bg-blue-500/10 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <button
                              type="button"
                              className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0 ${checkColorClass}`}
                            >
                              {hab.completedToday && <Check size={11} strokeWidth={3} />}
                            </button>

                            <span
                              className={`text-xs font-semibold truncate ${
                                hab.completedToday
                                  ? 'line-through text-slate-400 dark:text-slate-500'
                                  : 'text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              {hab.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <div className="flex items-center gap-0.5">
                              {hab.history.map((done, hIdx) => (
                                <span
                                  key={hIdx}
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    done ? dotColorClass : 'bg-slate-300 dark:bg-slate-700'
                                  }`}
                                />
                              ))}
                            </div>

                            <span
                              className={`text-[11px] font-bold flex items-center gap-0.5 min-w-[26px] justify-end ${
                                hab.streak > 0 ? 'text-amber-500 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'
                              }`}
                            >
                              {hab.streak > 0 ? `🔥${hab.streak}` : '0d'}
                            </span>

                            <button
                              type="button"
                              onClick={(e) => handleDeleteHabit(e, hab.id)}
                              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-opacity p-0.5"
                              title="Remover hábito"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-6 text-center flex flex-col items-center justify-center gap-2">
                      <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
                        Nenhum hábito cadastrado ainda.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsAddingHabit(true)}
                        className="px-3 py-1 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-600 dark:text-blue-400 text-[11px] font-bold border border-blue-500/30 cursor-pointer"
                      >
                        + Criar primeiro hábito
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2.5 mt-1.5 border-t border-slate-200/60 dark:border-blue-500/15 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium">Ofensiva diária</span>
                <button
                  type="button"
                  onClick={() => setIsAddingHabit(true)}
                  className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  + Novo hábito
                </button>
              </div>
            </div>

            {/* =============================================================== */}
            {/* WIDGET 3: TAREFAS REAIS (Agenda + Projetos + Tarefas Gerais)    */}
            {/* =============================================================== */}
            <div className="glass-card p-4 flex flex-col justify-between relative overflow-hidden">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="w-6 h-6 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <CheckSquare size={14} />
                    </div>
                    <h2 className="text-xs font-bold text-slate-900 dark:text-white">Tarefas</h2>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                      {todayPendingCount} pendente{todayPendingCount === 1 ? '' : 's'}
                      {overdueCount > 0 ? ` • ${overdueCount} atrasada${overdueCount > 1 ? 's' : ''}` : ''}
                    </span>
                  </div>
                </div>

                {/* Lista Real de Tarefas */}
                <div className="space-y-1.5 max-h-[165px] overflow-y-auto pr-1">
                  {unifiedDesktopTasks.length > 0 ? (
                    unifiedDesktopTasks.slice(0, 6).map((item) => (
                      <div
                        key={`${item.source}-${item.id}`}
                        onClick={() => handleToggleUnifiedTask(item)}
                        className="flex items-center justify-between gap-2 py-1 px-1.5 rounded-xl hover:bg-white/50 dark:hover:bg-blue-500/10 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <button
                            type="button"
                            className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                              item.completed
                                ? 'bg-blue-600 border-blue-600 text-white shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                                : 'border-slate-300 dark:border-slate-600 bg-white/40 dark:bg-transparent group-hover:border-blue-500'
                            }`}
                          >
                            {item.completed && <Check size={10} strokeWidth={3} />}
                          </button>

                          <span
                            className={`text-xs font-semibold truncate ${
                              item.completed
                                ? 'line-through text-slate-400 dark:text-slate-500'
                                : 'text-slate-800 dark:text-slate-100'
                            }`}
                          >
                            {item.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {item.projectLabel && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border ${
                                item.projectColor === 'amber'
                                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/25'
                                  : item.projectColor === 'purple'
                                  ? 'bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/25'
                                  : 'bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/25'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  item.projectColor === 'amber'
                                    ? 'bg-amber-500'
                                    : item.projectColor === 'purple'
                                    ? 'bg-purple-500'
                                    : 'bg-blue-500'
                                }`}
                              />
                              <span className="max-w-[70px] truncate">{item.projectLabel}</span>
                            </span>
                          )}

                          <span
                            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                              item.isOverdue
                                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25'
                                : 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/25'
                            }`}
                          >
                            <span>{item.dateLabel}</span>
                            {item.timeLabel && (
                              <span className="opacity-80 font-semibold">{item.timeLabel}</span>
                            )}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-xs font-medium text-slate-400 dark:text-slate-500">
                      Nenhuma tarefa cadastrada. Crie na caixa acima ou na Agenda!
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2.5 mt-1.5 border-t border-slate-200/60 dark:border-blue-500/15 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => onTabChange('calendar')}
                  className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Agenda ({rotinas.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => onTabChange('projects')}
                  className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Ver todas ({unifiedDesktopTasks.length})</span>
                  <span>→</span>
                </button>
              </div>
            </div>

            {/* =============================================================== */}
            {/* WIDGET 4: AVISOS RÁPIDOS / LEMBRETES (Conectado à Agenda/Notas) */}
            {/* =============================================================== */}
            <div className="glass-card p-4 flex flex-col justify-between relative overflow-hidden">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
                      <Pin size={14} />
                    </div>
                    <h2 className="text-xs font-bold text-slate-900 dark:text-white">Avisos & Lembretes</h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/25">
                      {unifiedNotices.length}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAddingNotice(prev => !prev)}
                    className="w-6 h-6 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/25 flex items-center justify-center text-blue-600 dark:text-blue-400 transition-colors cursor-pointer"
                    title="Novo aviso rápido"
                  >
                    <Plus size={13} />
                  </button>
                </div>

                {isAddingNotice && (
                  <form onSubmit={handleAddNotice} className="flex items-center gap-1.5 mb-2.5">
                    <input
                      type="text"
                      value={newNoticeText}
                      onChange={(e) => setNewNoticeText(e.target.value)}
                      placeholder="Escreva um lembrete rápido..."
                      autoFocus
                      className="flex-1 px-2.5 py-1.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-blue-500/40 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!newNoticeText.trim()}
                      className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold cursor-pointer shadow-sm"
                    >
                      Salvar
                    </button>
                  </form>
                )}

                {/* Lista Real de Avisos e Lembretes */}
                <div className="space-y-1.5 max-h-[165px] overflow-y-auto pr-1">
                  {unifiedNotices.length > 0 ? (
                    unifiedNotices.slice(0, 6).map((nota) => (
                      <div
                        key={nota.id}
                        className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-white/45 dark:bg-slate-900/40 border border-slate-200/60 dark:border-blue-500/15 hover:border-blue-500/35 transition-colors group"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.7)] shrink-0" />
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                            {nota.texto}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                            {nota.dateLabel}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteNotice(nota.id, nota.source)}
                            className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            title="Excluir lembrete"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center flex flex-col items-center justify-center gap-2">
                      <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
                        Nenhum aviso ou lembrete ativo.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsAddingNotice(true)}
                        className="px-3 py-1 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-600 dark:text-blue-400 text-[11px] font-bold border border-blue-500/30 cursor-pointer"
                      >
                        + Adicionar lembrete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2.5 mt-1.5 border-t border-slate-200/60 dark:border-blue-500/15 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsAddingNotice(true)}
                  className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  + Novo lembrete
                </button>
                <button
                  type="button"
                  onClick={() => onTabChange('calendar')}
                  className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Ver na Agenda</span>
                  <span>→</span>
                </button>
              </div>
            </div>

          </div>

          {/* Linha Opcional Personalizável: Resumo Financeiro & Insight do Mentor */}
          {showFinanceRow && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
              <div className="glass-card p-5 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Saldo Total Disponível</span>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                    R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h3>
                  <div className="flex items-center gap-4 mt-2 text-[11px] font-bold">
                    <span className="text-emerald-600 dark:text-emerald-400">
                      ↑ R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-rose-600 dark:text-rose-400">
                      ↓ R$ {totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onTabChange('finances')}
                  className="px-3.5 py-2 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-xs font-bold text-blue-600 dark:text-blue-400 cursor-pointer transition-colors"
                >
                  Abrir Finanças →
                </button>
              </div>

              <div className="glass-card p-5 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">
                    <Bot size={15} />
                    <span>Insight do Mentor IA</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-200 italic truncate font-medium">
                    {latestMentorFeedback || '"Consistência vence motivação. Foque nas prioridades de hoje."'}
                  </p>
                </div>
                <button
                  onClick={() => onTabChange('chat')}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shrink-0 cursor-pointer shadow-[0_0_15px_rgba(59,130,246,0.45)] transition-all"
                >
                  Conversar
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </motion.div>
  );
}
