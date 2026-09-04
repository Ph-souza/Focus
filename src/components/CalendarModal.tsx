import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Appointment, Task, User } from '../types';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks?: Task[];
  appointments?: Appointment[];
  user?: User;
  onToggleTask?: (taskId: string, currentStatus: boolean) => void;
}

export function CalendarModal({ 
  isOpen, 
  onClose, 
  tasks = [], 
  appointments = [],
  user,
  onToggleTask 
}: CalendarModalProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState<number>(today.getDate());

  // Formata o ano, mês e dia para o padrão estrito ISO (YYYY-MM-DD)
  const formatToISODate = (year: number, monthIndex: number, day: number): string => {
    const y = year;
    const m = String(monthIndex + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Estado da data selecionada formatada estritamente no padrão ISO (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    formatToISODate(today.getFullYear(), today.getMonth(), today.getDate())
  );

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const handleSelectDay = (day: number) => {
    setSelectedDay(day);
    setSelectedDate(formatToISODate(currentYear, currentMonth, day));
  };

  const prevMonth = () => {
    let newYear = currentYear;
    let newMonth = currentMonth - 1;
    if (newMonth < 0) {
      newMonth = 11;
      newYear = currentYear - 1;
      setCurrentYear(newYear);
    }
    setCurrentMonth(newMonth);
    setSelectedDay(1);
    setSelectedDate(formatToISODate(newYear, newMonth, 1));
  };

  const nextMonth = () => {
    let newYear = currentYear;
    let newMonth = currentMonth + 1;
    if (newMonth > 11) {
      newMonth = 0;
      newYear = currentYear + 1;
      setCurrentYear(newYear);
    }
    setCurrentMonth(newMonth);
    setSelectedDay(1);
    setSelectedDate(formatToISODate(newYear, newMonth, 1));
  };

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  // Filtro Reativo: Escuta o array de tarefas global e retorna apenas aquelas com data correspondente a selectedDate
  const compromissosDoDia = useMemo(() => {
    return tasks.filter((task) => {
      if (!task) return false;
      const rawDate = (task.deadline || task.date || '').split('T')[0].trim();
      return rawDate === selectedDate;
    });
  }, [tasks, selectedDate]);

  // Filtro Reativo para compromissos legados/Google Calendar
  const appointmentsDoDia = useMemo(() => {
    return appointments.filter((apt) => {
      if (!apt) return false;
      if (apt.date) {
        return apt.date.split('T')[0].trim() === selectedDate;
      }
      return apt.day === selectedDay && currentMonth === today.getMonth() && currentYear === today.getFullYear();
    });
  }, [appointments, selectedDate, selectedDay, currentMonth, currentYear, today]);

  // Mapeamento de tarefas por data ISO para desenhar os marcadores visuais no grid do calendário
  const tasksCountByDate = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of tasks) {
      const d = (t.deadline || t.date || '').split('T')[0].trim();
      if (d) {
        map[d] = (map[d] || 0) + 1;
      }
    }
    for (const a of appointments) {
      const d = a.date 
        ? a.date.split('T')[0].trim() 
        : formatToISODate(currentYear, currentMonth, a.day);
      if (d) {
        map[d] = (map[d] || 0) + 1;
      }
    }
    return map;
  }, [tasks, appointments, currentYear, currentMonth]);

  const handleToggle = async (taskId: string, currentStatus: boolean) => {
    if (onToggleTask) {
      onToggleTask(taskId, currentStatus);
      return;
    }
    if (user?.id) {
      try {
        await updateDoc(doc(db, `users/${user.id}/tasks`, taskId), {
          completed: !currentStatus
        });
      } catch (err) {
        console.error('Erro ao atualizar status da tarefa:', err);
      }
    }
  };

  const totalCompromissos = compromissosDoDia.length + appointmentsDoDia.length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-4xl bg-white dark:bg-[#18181b] rounded-2xl shadow-2xl z-[100] border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row overflow-hidden max-h-[90vh]"
          >
            {/* Calendar Section (Painel Esquerdo) */}
            <div className="flex-1 p-6 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#09090b]/50 overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <CalendarIcon size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Seu Calendário</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Acompanhe seus compromissos e prazos</p>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="md:hidden w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex items-center justify-between mb-6 px-2">
                <button 
                  onClick={prevMonth}
                  className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
                >
                  <ChevronLeft size={18} className="text-slate-600 dark:text-slate-300" />
                </button>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {monthNames[currentMonth]} {currentYear}
                </h3>
                <button 
                  onClick={nextMonth}
                  className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
                >
                  <ChevronRight size={18} className="text-slate-600 dark:text-slate-300" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-2 text-center mb-2">
                {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map((d, i) => (
                  <span key={i} className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{d}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2 text-center">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-10 md:h-14"></div>
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dayISO = formatToISODate(currentYear, currentMonth, day);
                  const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
                  const count = tasksCountByDate[dayISO] || 0;
                  const isSelected = selectedDay === day;
                  
                  return (
                    <div 
                      key={day} 
                      onClick={() => handleSelectDay(day)}
                      className={`h-10 md:h-14 flex flex-col items-center justify-center rounded-xl cursor-pointer transition-all relative border font-medium ${
                        isSelected 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md scale-[1.02]' 
                          : isToday 
                            ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-400' 
                            : 'bg-white dark:bg-[#18181b] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-700'
                      }`}
                    >
                      <span>{day}</span>
                      {count > 0 && (
                        <div className="flex gap-0.5 mt-1">
                          {Array.from({ length: Math.min(3, count) }).map((_, idx) => (
                            <span 
                              key={idx} 
                              className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-500'}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Details Section (Painel Direito) */}
            <div className="w-full md:w-88 p-6 bg-white dark:bg-[#18181b] flex flex-col h-[45vh] md:h-auto">
              <div className="hidden md:flex justify-between items-center mb-4">
                <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
                  {selectedDate}
                </span>
                <button 
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 rounded-lg text-blue-600 dark:text-blue-400">
                      Dia {selectedDay}
                    </span>
                    Compromissos
                  </h3>
                  {totalCompromissos > 0 && (
                    <span className="text-xs text-slate-400 font-medium">
                      {totalCompromissos} {totalCompromissos === 1 ? 'item' : 'itens'}
                    </span>
                  )}
                </div>

                {totalCompromissos > 0 ? (
                  <div className="space-y-3">
                    {/* Renderização dos compromissos / tarefas filtradas por selectedDate */}
                    {compromissosDoDia.map((task) => {
                      const isCompleted = task.completed;
                      const time = task.time || (task.deadline && task.deadline.includes('T') ? task.deadline.split('T')[1].substring(0, 5) : null);

                      return (
                        <div 
                          key={task.id} 
                          className={`bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 transition-all hover:border-blue-400 dark:hover:border-blue-500 flex items-start gap-3 ${
                            isCompleted ? 'opacity-70 bg-slate-100/40 dark:bg-slate-900/20' : ''
                          }`}
                        >
                          {/* Checkbox de status */}
                          <button
                            type="button"
                            onClick={() => handleToggle(task.id, isCompleted)}
                            className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all ${
                              isCompleted
                                ? 'bg-emerald-500 text-white shadow-sm'
                                : 'border-2 border-slate-300 dark:border-slate-600 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-transparent'
                            }`}
                            title={isCompleted ? 'Marcar como pendente' : 'Marcar como concluído'}
                          >
                            <Check size={12} strokeWidth={3} className={isCompleted ? 'opacity-100' : 'opacity-0'} />
                          </button>

                          {/* Conteúdo do Card */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span 
                                className={`text-sm font-semibold truncate ${
                                  isCompleted 
                                    ? 'line-through text-slate-400 dark:text-slate-500' 
                                    : 'text-slate-800 dark:text-slate-100'
                                }`}
                              >
                                {task.title}
                              </span>

                              {/* Badge de prioridade */}
                              <span 
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap ${
                                  task.priority === 'high'
                                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                                    : task.priority === 'medium'
                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                }`}
                              >
                                {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                              {time && (
                                <div className="flex items-center gap-1 font-medium text-blue-600 dark:text-blue-400">
                                  <Clock size={12} />
                                  <span>{time}</span>
                                </div>
                              )}
                              {task.description && (
                                <span className="truncate text-slate-400 dark:text-slate-500">
                                  {task.description}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Renderização de Appointments (Google Calendar / Eventos legados) */}
                    {appointmentsDoDia.map((m, idx) => (
                      <div 
                        key={m.id || idx} 
                        className="bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 transition-all hover:border-blue-400"
                      >
                        <div className="flex justify-between items-start mb-1.5">
                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{m.title}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold whitespace-nowrap ml-2">
                            {m.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                          <Clock size={13} className="text-blue-500" />
                          <span>{m.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-48 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mb-3">
                      <CalendarIcon size={24} className="text-slate-300 dark:text-slate-600" />
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                      Nenhum compromisso marcado para este dia.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
