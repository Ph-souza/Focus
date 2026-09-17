import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Rotina, User } from '../types';
import { db } from '../lib/firebase';
import { collection, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Calendar, 
  CalendarPlus, 
  User as UserIcon, 
  GraduationCap, 
  Clock, 
  X,
  Trash2 
} from 'lucide-react';

interface TabCalendarProps {
  rotinas?: Rotina[];
  user?: User | null;
}

interface ActivityItem {
  id: string;
  time: string;
  title: string;
  subtitle?: string;
  category: 'Trabalho' | 'Pessoal' | 'Estudos';
  completed: boolean;
  date?: string;
}

/**
 * Swipeable Activity Card for Mobile
 * Implements fluid Drag-to-Delete with red background restricted behind the right edge,
 * visible ONLY during swipe to preserve 100% pure glassmorphism at rest.
 */
function SwipeableActivityCard({
  activity,
  badge,
  onToggleComplete,
  onDelete
}: {
  activity: ActivityItem;
  badge: { icon: React.ReactNode; classes: string };
  onToggleComplete: (id: string, currentVal: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);

  const triggerDelete = () => {
    if (isDeleting) return;
    setIsDeleting(true);
    setTranslateX(-300);
    setTimeout(() => {
      onDelete(activity.id);
    }, 220);
  };

  // Touch gesture handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = 0;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const deltaX = e.touches[0].clientX - startXRef.current;
    if (deltaX <= 0) {
      const clamped = Math.max(deltaX, -90);
      currentXRef.current = clamped;
      setTranslateX(clamped);
    } else {
      currentXRef.current = 0;
      setTranslateX(0);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (currentXRef.current < -65) {
      triggerDelete();
    } else {
      setTranslateX(0);
      currentXRef.current = 0;
    }
  };

  // Mouse gesture handlers for desktop testing
  const handleMouseDown = (e: React.MouseEvent) => {
    startXRef.current = e.clientX;
    currentXRef.current = 0;
    setIsDragging(true);

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startXRef.current;
      if (deltaX <= 0) {
        const clamped = Math.max(deltaX, -90);
        currentXRef.current = clamped;
        setTranslateX(clamped);
      } else {
        currentXRef.current = 0;
        setTranslateX(0);
      }
    };

    const onMouseUp = () => {
      setIsDragging(false);
      if (currentXRef.current < -65) {
        triggerDelete();
      } else {
        setTranslateX(0);
        currentXRef.current = 0;
      }
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 1, height: 'auto' }}
      animate={isDeleting ? { opacity: 0, height: 0, marginBottom: 0, transition: { duration: 0.22, ease: 'easeInOut' } } : { opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0, marginBottom: 0, transition: { duration: 0.22 } }}
      className="relative overflow-hidden rounded-2xl flex-1 w-full select-none"
    >
      {/* 1. Camada de fundo (Aparece SOMENTE quando desliza) */}
      <div 
        onClick={triggerDelete}
        className={`absolute inset-y-0 right-0 w-20 bg-red-500 flex items-center justify-center text-white z-0 rounded-r-2xl cursor-pointer transition-opacity duration-200 ${
          translateX < -5 ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <Trash2 className="w-5 h-5" />
      </div>

      {/* 2. O Card Principal (Vidro translúcido que fica por cima cobrindo o vermelho) */}
      <div 
        className={`relative z-10 glass-card p-3 flex items-center justify-between gap-2.5 shadow-sm touch-pan-y cursor-grab active:cursor-grabbing ${
          isDragging ? '' : 'transition-transform duration-200 ease-out'
        }`}
        style={{ transform: `translateX(${translateX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        <div className="flex-1 min-w-0 pr-1 pointer-events-none">
          <h3 className={`text-xs font-bold truncate transition-colors ${
            activity.completed 
              ? 'line-through text-slate-400 dark:text-slate-500' 
              : 'text-slate-900 dark:text-white'
          }`}>
            {activity.title}
          </h3>
          {activity.subtitle && (
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {activity.subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Category Tag Pill */}
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border ${badge.classes}`}>
            {badge.icon}
            {activity.category}
          </span>

          {/* Checkbox Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete(activity.id, activity.completed);
            }}
            className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
              activity.completed
                ? 'bg-blue-600 text-white shadow-[0_0_8px_rgba(59,130,246,0.6)]'
                : 'border-2 border-slate-300 dark:border-slate-600 hover:border-blue-500'
            }`}
            aria-label={activity.completed ? 'Marcar como pendente' : 'Marcar como concluída'}
          >
            {activity.completed && <Check size={12} strokeWidth={3} />}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export function TabCalendar({ rotinas = [], user }: TabCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [filter, setFilter] = useState<'Todos' | 'Trabalho' | 'Pessoal' | 'Estudos'>('Todos');
  const [localStatuses, setLocalStatuses] = useState<Record<string, boolean>>({});
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newTime, setNewTime] = useState('09:00');
  const [newCategory, setNewCategory] = useState<'Trabalho' | 'Pessoal' | 'Estudos'>('Trabalho');
  const [localCreatedActivities, setLocalCreatedActivities] = useState<ActivityItem[]>([]);

  // Format date to YYYY-MM-DD
  const formatDateStr = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const selectedDateStr = formatDateStr(selectedDate);

  // Generate 7 days of the selected week (Mon to Sun)
  const weekDays = useMemo(() => {
    const base = new Date();
    const currentDay = base.getDay(); // 0 is Sun, 1 is Mon...
    const distanceToMonday = (currentDay + 6) % 7;
    const monday = new Date(base);
    monday.setDate(base.getDate() - distanceToMonday + currentWeekOffset * 7);

    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }, [currentWeekOffset]);

  const weekdayNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  // Default mock activities matching mockup pixel-by-pixel if date has no Firestore routines
  const defaultMockActivities: ActivityItem[] = useMemo(() => [
    { id: 'mock-1', time: '08:30', title: 'Reunião com o time', subtitle: 'Alinhar objetivos do projeto', category: 'Trabalho', completed: true },
    { id: 'mock-2', time: '10:00', title: 'Revisar finanças', subtitle: 'Verificar gastos e atualizar planilha', category: 'Pessoal', completed: true },
    { id: 'mock-3', time: '14:00', title: 'Estudo / Curso', subtitle: 'NEXUS Focus Academy', category: 'Estudos', completed: true },
    { id: 'mock-4', time: '16:00', title: 'Planejamento da semana', subtitle: 'Organizar prioridades', category: 'Trabalho', completed: false },
    { id: 'mock-5', time: '18:30', title: 'Leitura', subtitle: 'Ler 30 minutos', category: 'Pessoal', completed: false },
  ], []);

  // Merge Firestore rotinas for selected date with newly added local activities, excluding deleted ones
  const dayActivities: ActivityItem[] = useMemo(() => {
    const firestoreItems = rotinas
      .filter(r => r.date === selectedDateStr && !deletedIds.includes(r.id))
      .map(r => ({
        id: r.id,
        time: r.time || '09:00',
        title: r.title,
        subtitle: (r as any).subtitle || '',
        category: ((r as any).category || 'Trabalho') as 'Trabalho' | 'Pessoal' | 'Estudos',
        completed: localStatuses[r.id] !== undefined ? localStatuses[r.id] : !!r.completed,
        date: r.date
      }));

    const addedLocalItems = localCreatedActivities
      .filter(a => a.date === selectedDateStr && !deletedIds.includes(a.id));

    const combined = [...firestoreItems, ...addedLocalItems];

    if (combined.length === 0) {
      // Return non-deleted default activities with local toggle overrides
      return defaultMockActivities
        .filter(item => !deletedIds.includes(item.id))
        .map(item => ({
          ...item,
          completed: localStatuses[item.id] !== undefined ? localStatuses[item.id] : item.completed
        }));
    }

    return combined.sort((a, b) => a.time.localeCompare(b.time));
  }, [rotinas, selectedDateStr, localCreatedActivities, localStatuses, defaultMockActivities, deletedIds]);

  // Filter activities by active category pill
  const filteredActivities = useMemo(() => {
    if (filter === 'Todos') return dayActivities;
    return dayActivities.filter(a => a.category === filter);
  }, [dayActivities, filter]);

  // Progress metrics
  const totalTasks = dayActivities.length || 1;
  const completedTasks = dayActivities.filter(a => a.completed).length;
  const progressPercent = Math.round((completedTasks / totalTasks) * 100);
  const strokeCircumference = 125.6; // 2 * pi * 20
  const strokeDashoffset = strokeCircumference - (strokeCircumference * progressPercent) / 100;

  // Toggle routine completion status
  const handleToggleComplete = async (id: string, currentVal: boolean) => {
    const newVal = !currentVal;
    setLocalStatuses(prev => ({ ...prev, [id]: newVal }));

    if (user?.id && !id.startsWith('mock-')) {
      try {
        await updateDoc(doc(db, 'users', user.id, 'rotinas', id), {
          completed: newVal
        });
      } catch (err) {
        console.error('Error updating routine status in Firestore:', err);
      }
    }
  };

  // Delete activity handler (from Swipe to Delete or click)
  const handleDeleteActivity = async (id: string) => {
    setDeletedIds(prev => [...prev, id]);

    if (user?.id && !id.startsWith('mock-')) {
      try {
        await deleteDoc(doc(db, 'users', user.id, 'rotinas', id));
      } catch (err) {
        console.error('Error deleting routine from Firestore:', err);
      }
    }
  };

  // Add new activity
  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newActivity: ActivityItem = {
      id: `act-${Date.now()}`,
      title: newTitle.trim(),
      subtitle: newSubtitle.trim() || undefined,
      time: newTime || '09:00',
      category: newCategory,
      completed: false,
      date: selectedDateStr
    };

    setLocalCreatedActivities(prev => [newActivity, ...prev]);

    if (user?.id) {
      try {
        await addDoc(collection(db, 'users', user.id, 'rotinas'), {
          title: newActivity.title,
          subtitle: newActivity.subtitle || '',
          time: newActivity.time,
          category: newActivity.category,
          date: selectedDateStr,
          completed: false,
          createdAt: new Date()
        });
      } catch (err) {
        console.error('Error saving routine to Firestore:', err);
      }
    }

    setNewTitle('');
    setNewSubtitle('');
    setIsCreateModalOpen(false);
  };

  const getCategoryBadge = (category: 'Trabalho' | 'Pessoal' | 'Estudos') => {
    switch (category) {
      case 'Trabalho':
        return {
          icon: <Calendar size={11} />,
          classes: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
        };
      case 'Pessoal':
        return {
          icon: <UserIcon size={11} />,
          classes: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
        };
      case 'Estudos':
        return {
          icon: <GraduationCap size={11} />,
          classes: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
        };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4 md:gap-6 p-0 md:p-8"
    >
      {/* Create Activity Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card w-full max-w-sm p-6 shadow-2xl relative"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <CalendarPlus size={18} />
                  </div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Nova Atividade</h3>
                </div>
                <button 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="w-8 h-8 rounded-xl hover:bg-slate-200/50 dark:hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateActivity} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Título</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Reunião com o time"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/70 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Subtítulo / Descrição</label>
                  <input
                    type="text"
                    placeholder="Ex: Alinhar objetivos do projeto"
                    value={newSubtitle}
                    onChange={(e) => setNewSubtitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/70 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Horário</label>
                    <input
                      type="time"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/70 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Categoria</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/70 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-blue-500"
                    >
                      <option value="Trabalho">Trabalho</option>
                      <option value="Pessoal">Pessoal</option>
                      <option value="Estudos">Estudos</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 mt-2 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all active:scale-[0.98]"
                >
                  Adicionar à Agenda
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* MOBILE VIEW (Strictly matching Sprint 2 Mobile Mockup)    */}
      {/* ========================================================= */}
      <div className="block md:hidden space-y-4">
        
        {/* Mobile Header */}
        <div className="flex items-center justify-between pt-1 pb-1">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              Agenda
            </h1>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
              Seu dia em uma visão contínua
            </p>
          </div>

          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="w-11 h-11 rounded-2xl glass-card flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
            aria-label="Nova atividade"
          >
            <CalendarPlus size={20} />
          </button>
        </div>

        {/* Horizontal Days Carousel */}
        <div className="glass-card p-2 flex items-center justify-between gap-1 shadow-sm">
          <button 
            onClick={() => setCurrentWeekOffset(prev => prev - 1)}
            className="w-7 h-10 flex items-center justify-center text-slate-400 hover:text-blue-500 active:scale-90 transition-transform"
            aria-label="Semana anterior"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex-1 flex items-center justify-between gap-1">
            {weekDays.map((d, index) => {
              const isSelected = formatDateStr(d) === selectedDateStr;
              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(d)}
                  className={`flex flex-col items-center justify-center py-2 px-1.5 rounded-2xl transition-all duration-200 flex-1 min-w-[38px] ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-[0_0_18px_rgba(59,130,246,0.6)] scale-105'
                      : 'hover:bg-white/40 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span className={`text-[10px] font-bold uppercase tracking-tight ${isSelected ? 'text-blue-100' : 'text-slate-400 dark:text-slate-500'}`}>
                    {weekdayNames[index]}
                  </span>
                  <span className={`text-sm font-black mt-0.5 ${isSelected ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>
                    {d.getDate()}
                  </span>
                </button>
              );
            })}
          </div>

          <button 
            onClick={() => setCurrentWeekOffset(prev => prev + 1)}
            className="w-7 h-10 flex items-center justify-center text-slate-400 hover:text-blue-500 active:scale-90 transition-transform"
            aria-label="Próxima semana"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Progress Card ("Seu progresso hoje") */}
        <div className="glass-card p-4 relative overflow-hidden flex items-center justify-between gap-3 shadow-sm">
          {/* Circular Checkmark Badge */}
          <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 50 50">
              <circle 
                cx="25" 
                cy="25" 
                r="20" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="4" 
                className="text-slate-200/80 dark:text-slate-800" 
              />
              <circle 
                cx="25" 
                cy="25" 
                r="20" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="4" 
                strokeDasharray={strokeCircumference} 
                strokeDashoffset={strokeDashoffset} 
                strokeLinecap="round" 
                className="text-blue-600 dark:text-blue-400 drop-shadow-[0_0_6px_rgba(59,130,246,0.6)] transition-all duration-700" 
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Check size={16} strokeWidth={3} />
            </div>
          </div>

          {/* Progress Texts & Bar */}
          <div className="flex-1 min-w-0 pr-1">
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-none">
              Seu progresso hoje
            </p>
            <p className="text-xs font-bold text-slate-900 dark:text-white mt-1 leading-none">
              {completedTasks}/{totalTasks} tarefas concluídas
            </p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1.5 bg-slate-200/80 dark:bg-slate-800/80 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 shrink-0">
                {progressPercent}%
              </span>
            </div>
          </div>

          <ChevronRight size={16} className="text-slate-400 shrink-0" />
        </div>

        {/* Category Filters (Pills) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5 no-scrollbar">
          <button
            onClick={() => setFilter('Todos')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
              filter === 'Todos'
                ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.5)]'
                : 'glass-pill text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Todos
          </button>

          <button
            onClick={() => setFilter('Trabalho')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
              filter === 'Trabalho'
                ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.5)] font-bold'
                : 'glass-pill text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar size={13} />
            Trabalho
          </button>

          <button
            onClick={() => setFilter('Pessoal')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
              filter === 'Pessoal'
                ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.5)] font-bold'
                : 'glass-pill text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserIcon size={13} />
            Pessoal
          </button>

          <button
            onClick={() => setFilter('Estudos')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
              filter === 'Estudos'
                ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.5)] font-bold'
                : 'glass-pill text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <GraduationCap size={13} />
            Estudos
          </button>
        </div>

        {/* Timeline Activities List with Swipe to Delete */}
        <div className="space-y-3 pt-1 pb-4">
          {filteredActivities.length === 0 ? (
            <div className="glass-card p-6 text-center">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Nenhuma atividade cadastrada para esta categoria.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 relative">
              <AnimatePresence mode="popLayout">
                {filteredActivities.map((activity) => {
                  const badge = getCategoryBadge(activity.category);
                  return (
                    <motion.div
                      layout
                      key={activity.id}
                      className="flex items-center gap-2 relative"
                    >
                      {/* Time Column */}
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 w-11 shrink-0 text-right pr-1">
                        {activity.time}
                      </span>

                      {/* Timeline Node */}
                      <div className="relative flex flex-col items-center justify-center shrink-0 w-3.5">
                        <div className={`w-2.5 h-2.5 rounded-full transition-all ${
                          activity.completed
                            ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]'
                            : 'border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
                        }`} />
                      </div>

                      {/* Swipeable Activity Card */}
                      <SwipeableActivityCard
                        activity={activity}
                        badge={badge}
                        onToggleComplete={handleToggleComplete}
                        onDelete={handleDeleteActivity}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

      </div>


      {/* ========================================================= */}
      {/* DESKTOP VIEW (Preserved from high-fidelity Desktop Overhaul) */}
      {/* ========================================================= */}
      <div className="hidden md:flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Agenda</h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
              Seus compromissos, em harmonia com seus objetivos.
            </p>
          </div>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-sm transition-all shadow-[0_0_20px_rgba(59,130,246,0.5)] hover:shadow-[0_0_25px_rgba(59,130,246,0.7)] flex items-center gap-2 active:scale-95"
          >
            <Plus size={18} /> Nova atividade
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Content (Left, 2 cols width) */}
          <div className="xl:col-span-2 flex flex-col gap-6">
            {/* Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4 glass-card px-4 py-2">
                <button 
                  onClick={() => setCurrentWeekOffset(prev => prev - 1)}
                  className="p-1 hover:bg-white/50 dark:hover:bg-blue-500/20 rounded-lg text-slate-500 dark:text-slate-400 hover:text-blue-500 transition-colors"
                >
                  <ChevronLeft size={16}/>
                </button>
                <span className="font-bold text-sm text-slate-900 dark:text-white capitalize">
                  {selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </span>
                <button 
                  onClick={() => setCurrentWeekOffset(prev => prev + 1)}
                  className="p-1 hover:bg-white/50 dark:hover:bg-blue-500/20 rounded-lg text-slate-500 dark:text-slate-400 hover:text-blue-500 transition-colors"
                >
                  <ChevronRight size={16}/>
                </button>
              </div>
              
              <div className="flex items-center gap-2 glass-card p-1.5">
                {(['Todos', 'Trabalho', 'Pessoal', 'Estudos'] as const).map(f => (
                  <button 
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      filter === f 
                        ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' 
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Days Carousel */}
            <div className="flex justify-between items-center glass-card p-3">
              {weekDays.map((d, i) => {
                const isSelected = formatDateStr(d) === selectedDateStr;
                return (
                  <button 
                    key={i}
                    onClick={() => setSelectedDate(d)}
                    className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl transition-all ${
                      isSelected 
                        ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.6)] scale-105' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span className={`text-[10px] font-bold uppercase ${isSelected ? 'text-blue-100' : ''}`}>
                      {weekdayNames[i]}
                    </span>
                    <span className="text-xl font-black mt-0.5">{d.getDate()}</span>
                  </button>
                );
              })}
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="w-16 h-16 flex items-center justify-center text-slate-400 hover:text-blue-500 hover:bg-white/40 dark:hover:bg-white/5 rounded-2xl transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>

            {/* Tasks List */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-sm text-slate-900 dark:text-white capitalize">
                  {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                </h2>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {filteredActivities.length} atividades
                </span>
              </div>

              <div className="flex flex-col gap-2.5">
                <AnimatePresence mode="popLayout">
                  {filteredActivities.map((task) => (
                    <motion.div 
                      layout
                      key={task.id} 
                      className={`flex items-center gap-4 p-4 rounded-2xl transition-colors group ${
                        task.completed 
                          ? 'bg-slate-100/40 dark:bg-slate-900/30 opacity-70' 
                          : 'bg-white/50 dark:bg-slate-900/40 hover:bg-white/80 dark:hover:bg-blue-950/30 border border-slate-200/50 dark:border-blue-500/15 shadow-sm hover:border-blue-500/30'
                      }`}
                    >
                      <button 
                        onClick={() => handleToggleComplete(task.id, task.completed)}
                        className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          task.completed 
                            ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]' 
                            : 'border-2 border-slate-300 dark:border-slate-600 group-hover:border-blue-500'
                        }`}
                      >
                        {task.completed && <Check size={14} strokeWidth={3} />}
                      </button>
                      <span className={`text-xs font-bold w-12 ${task.completed ? 'text-slate-400 dark:text-slate-500' : 'text-slate-600 dark:text-slate-400'}`}>
                        {task.time}
                      </span>
                      <span className={`flex-1 font-semibold text-sm ${
                        task.completed ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-800 dark:text-slate-100'
                      }`}>
                        {task.title}
                      </span>
                      <div className={`px-3 py-1 text-[10px] font-bold rounded-full ${getCategoryBadge(task.category).classes} border`}>
                        {task.category}
                      </div>
                      <button
                        onClick={() => handleDeleteActivity(task.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100"
                        title="Apagar atividade"
                      >
                        <Trash2 size={16} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Sidebar Widgets (Right, 1 col width) */}
          <div className="flex flex-col gap-6">
            {/* Progresso do dia */}
            <div className="glass-card p-6 relative overflow-hidden">
              <h2 className="font-bold text-sm text-slate-900 dark:text-white mb-6">Progresso do dia</h2>
              <div className="flex items-center gap-6">
                <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="10" className="text-slate-200/60 dark:text-slate-800" />
                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="10" strokeDasharray={283} strokeDashoffset={283 - (283 * progressPercent) / 100} strokeLinecap="round" className="text-blue-600 dark:text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                  </svg>
                  <span className="absolute text-xl font-black text-slate-900 dark:text-white">{progressPercent}%</span>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
                    <span>{completedTasks} concluídas</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"></span>
                    <span>{totalTasks - completedTasks} pendentes</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Minicalendário Desktop */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white capitalize">
                  {selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </h3>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['D','S','T','Q','Q','S','S'].map((d, i) => (
                  <span key={i} className="text-[10px] font-bold text-slate-400">{d}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1 text-center">
                {Array.from({ length: 31 }).map((_, i) => (
                  <div 
                    key={i} 
                    onClick={() => {
                      const newD = new Date(selectedDate);
                      newD.setDate(i + 1);
                      setSelectedDate(newD);
                    }}
                    className={`w-8 h-8 mx-auto flex items-center justify-center rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                      (i + 1) === selectedDate.getDate()
                        ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.6)] font-black' 
                        : 'text-slate-700 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-white/10 hover:text-blue-500'
                    }`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>

            {/* Quote Card */}
            <div className="mt-auto glass-card p-6 text-center">
              <p className="text-sm text-slate-700 dark:text-slate-300 italic font-medium leading-relaxed">
                "Tempo bem planejado é uma forma de autocuidado."
              </p>
              <span className="block mt-4 text-[10px] font-bold text-blue-500 uppercase tracking-widest">
                NEXUS FOCUS
              </span>
            </div>

          </div>
        </div>
      </div>
    </motion.div>
  );
}
