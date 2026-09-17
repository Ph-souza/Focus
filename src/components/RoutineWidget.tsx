import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Rotina } from '../types';
import { Calendar as CalendarIcon, Clock, CheckCircle2, Circle } from 'lucide-react';

interface RoutineWidgetProps {
  rotinas: Rotina[];
}

export function RoutineWidget({ rotinas }: RoutineWidgetProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Helper para formatar data (YYYY-MM-DD)
  const formatDate = (date: Date) => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };

  const selectedDateStr = formatDate(selectedDate);

  // Filtra as rotinas do dia selecionado e ordena por horário
  const dailyRoutines = useMemo(() => {
    return rotinas
      .filter(r => r.date === selectedDateStr)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [rotinas, selectedDateStr]);

  // Gera os dias da semana atual para o mobile
  const weekDays = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 (Sun) to 6 (Sat)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDay);

    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });
  }, []);

  const getDayName = (date: Date) => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return days[date.getDay()];
  };

  // Gera os dias do mês atual para o desktop
  const monthDays = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay();
    
    const days = [];
    // Espaços vazios no início
    for (let i = 0; i < startOffset; i++) {
      days.push(null);
    }
    // Dias do mês
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  }, [selectedDate]);

  return (
    <div className="flex flex-col gap-4">
      {/* ========================================== */}
      {/* MOBILE VIEW: Carrossel Horizontal          */}
      {/* ========================================== */}
      <div className="md:hidden flex flex-col gap-4 mb-2 mt-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="font-bold text-sm text-slate-800 dark:text-white tracking-wide flex items-center gap-2">
            <CalendarIcon size={16} className="text-[#6366f1]" />
            Minha Rotina
          </h3>
        </div>
        
        {/* Carrossel de Dias */}
        <div className="flex gap-2 overflow-x-auto pb-2 px-1 snap-x" style={{ scrollbarWidth: 'none' }}>
          {weekDays.map((date, i) => {
            const isSelected = formatDate(date) === selectedDateStr;
            const isToday = formatDate(date) === formatDate(new Date());
            
            return (
              <button
                key={i}
                onClick={() => setSelectedDate(date)}
                className={`snap-center shrink-0 flex flex-col items-center justify-center w-14 h-16 rounded-2xl border transition-all ${
                  isSelected 
                    ? 'bg-[#6366f1] border-[#6366f1] text-white shadow-md' 
                    : isToday
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400'
                      : 'bg-white dark:bg-[#121216] border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isSelected ? 'text-indigo-100' : ''}`}>
                  {getDayName(date)}
                </span>
                <span className="text-lg font-black leading-none">
                  {date.getDate()}
                </span>
                {rotinas.some(r => r.date === formatDate(date)) && (
                  <span className={`w-1 h-1 rounded-full mt-1 ${isSelected ? 'bg-white' : 'bg-[#6366f1]'}`}></span>
                )}
              </button>
            );
          })}
        </div>

        {/* Lista de Compromissos do Dia (Mobile) */}
        <div className="flex flex-col gap-3 px-1">
          {dailyRoutines.length > 0 ? (
            dailyRoutines.map((rotina) => (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                key={rotina.id}
                className="bg-white dark:bg-[#121216] border border-slate-200 dark:border-zinc-800 p-3.5 rounded-[16px] shadow-sm flex items-start gap-3 relative overflow-hidden"
              >
                <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${rotina.completed ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'}`}>
                  {rotina.completed ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-bold mb-0.5 ${rotina.completed ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-800 dark:text-white'}`}>
                    {rotina.title}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                    {rotina.time}
                  </p>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-6 bg-slate-50 dark:bg-[#121216] border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl">
              <p className="text-xs text-slate-500 font-medium">Nenhum compromisso para este dia.</p>
            </div>
          )}
        </div>
      </div>

      {/* ========================================== */}
      {/* DESKTOP VIEW: Grade Mensal                 */}
      {/* ========================================== */}
      <div className="hidden md:flex flex-col bg-white dark:bg-[#121216] p-6 rounded-[24px] border border-slate-200 dark:border-zinc-800 shadow-[0_4px_25px_rgba(0,0,0,0.05)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-sm text-slate-800 dark:text-white tracking-wide uppercase">Agenda do Mês</h3>
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-[#6366f1]">
              {selectedDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}
                className="w-8 h-8 rounded-full bg-slate-50 dark:bg-zinc-800 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors"
              >
                &lt;
              </button>
              <button 
                onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}
                className="w-8 h-8 rounded-full bg-slate-50 dark:bg-zinc-800 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors"
              >
                &gt;
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Grade do Calendário */}
          <div className="w-2/3">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, i) => (
                <div key={i} className="text-center text-[10px] font-bold text-slate-400 uppercase">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {monthDays.map((date, i) => {
                if (!date) return <div key={i} className="h-12"></div>;
                
                const dateStr = formatDate(date);
                const isSelected = dateStr === selectedDateStr;
                const isToday = dateStr === formatDate(new Date());
                const dayRoutines = rotinas.filter(r => r.date === dateStr);
                
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(date)}
                    className={`h-12 rounded-xl flex flex-col items-center justify-center relative transition-all hover:border-[#6366f1] border ${
                      isSelected 
                        ? 'bg-[#6366f1] text-white border-[#6366f1] shadow-md' 
                        : isToday
                          ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
                          : 'bg-transparent text-slate-700 dark:text-slate-300 border-transparent hover:bg-slate-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <span className="text-sm font-bold">{date.getDate()}</span>
                    {dayRoutines.length > 0 && (
                      <div className="flex gap-0.5 mt-1">
                        {dayRoutines.slice(0, 3).map((_, idx) => (
                          <div key={idx} className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-[#6366f1]'}`}></div>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lista lateral do dia selecionado */}
          <div className="w-1/3 border-l border-slate-100 dark:border-zinc-800 pl-6 flex flex-col">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
              {selectedDate.getDate()} de {selectedDate.toLocaleString('pt-BR', { month: 'long' })}
            </h4>
            <div className="flex flex-col gap-3 overflow-y-auto max-h-[220px] custom-scrollbar pr-2">
              {dailyRoutines.length > 0 ? (
                dailyRoutines.map((rotina) => (
                  <div key={rotina.id} className="flex gap-3 items-start group">
                    <div className="text-[10px] font-bold text-slate-400 mt-1 w-10 text-right shrink-0">{rotina.time}</div>
                    <div className="relative">
                      <div className="absolute top-1.5 -left-[5px] w-2.5 h-2.5 rounded-full bg-[#6366f1] border-2 border-white dark:border-[#121216] z-10"></div>
                      <div className="absolute top-4 left-[0px] w-px h-full bg-slate-200 dark:bg-zinc-800 group-last:hidden"></div>
                    </div>
                    <div className="bg-slate-50 dark:bg-zinc-900/50 p-3 rounded-lg flex-1 border border-slate-100 dark:border-zinc-800/60">
                      <p className="text-xs font-bold text-slate-800 dark:text-white leading-tight">{rotina.title}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 opacity-60 py-8">
                  <CalendarIcon size={24} strokeWidth={1.5} />
                  <p className="text-[10px] font-medium uppercase tracking-wider">Livre</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
