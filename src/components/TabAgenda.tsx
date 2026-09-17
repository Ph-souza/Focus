import { useState } from 'react';
import { motion } from 'motion/react';
import { Appointment, Task, Rotina, User } from '../types';
import { Plus, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface TabAgendaProps {
  appointments: Appointment[];
  tasks: Task[];
  rotinas: Rotina[];
  setTasks?: React.Dispatch<React.SetStateAction<Task[]>>;
  user: User | null;
}

export function TabAgenda({ appointments, tasks, rotinas, user }: TabAgendaProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const completedTasks = tasks.filter(t => t.completed).length || 3;
  const pendingTasks = tasks.filter(t => !t.completed).length || 2;
  const totalTasks = completedTasks + pendingTasks;
  const progressPercent = Math.round((completedTasks / totalTasks) * 100) || 60;

  const chartData = [
    { name: 'Concluídas', value: completedTasks, color: '#3b82f6' },
    { name: 'Pendentes', value: pendingTasks, color: '#e2e8f0' },
  ];

  const days = [
    { day: 'Seg', date: 26, active: true },
    { day: 'Ter', date: 27, active: false },
    { day: 'Qua', date: 28, active: false },
    { day: 'Qui', date: 29, active: false },
    { day: 'Sex', date: 30, active: false },
    { day: 'Sáb', date: 31, active: false },
    { day: 'Dom', date: 1, active: false },
  ];

  const mockAgenda = [
    { time: '09:00', title: 'Revisão do projeto', tag: 'Trabalho', duration: '1h', checked: true },
    { time: '11:00', title: 'Estudo de inglês', tag: 'Estudos', duration: '1h', checked: true },
    { time: '14:00', title: 'Academia', tag: 'Pessoal', duration: '1h', checked: false },
    { time: '16:00', title: 'Planejamento semanal', tag: 'Pessoal', duration: '1h', checked: false },
    { time: '19:00', title: 'Leitura', tag: 'Pessoal', duration: '30min', checked: false },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto flex flex-col gap-6 px-4 md:px-8 py-6"
    >
      {/* Header */}
      <div className="flex justify-between items-end mb-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">Agenda</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Seus compromissos, um dia de cada vez.</p>
        </div>
        <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-[12px] flex items-center gap-2 shadow-sm transition-colors">
          <Plus size={16} />
          Nova atividade
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        
        {/* Main Content (Left) */}
        <div className="flex flex-col gap-6">
          
          {/* Controls & Filter */}
          <div className="flex justify-between items-center bg-white dark:bg-white/5 backdrop-blur-md p-2 rounded-[20px] border border-slate-200 dark:border-white/10 shadow-sm">
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-500 transition-colors"><ChevronLeft size={18} /></button>
              <div className="flex gap-1">
                {days.map((d, i) => (
                  <button 
                    key={i} 
                    className={`flex flex-col items-center justify-center w-14 h-16 rounded-[14px] transition-all ${d.active ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400'}`}
                  >
                    <span className="text-[11px] font-medium">{d.day}</span>
                    <span className="text-lg font-bold">{d.date}</span>
                  </button>
                ))}
              </div>
              <button className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-500 transition-colors"><ChevronRight size={18} /></button>
            </div>
            
            <div className="hidden sm:flex gap-2 pr-2">
              <button className="px-4 py-2 rounded-[12px] bg-blue-600 text-white text-xs font-bold shadow-sm">Todos</button>
              <button className="px-4 py-2 rounded-[12px] hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 text-xs font-medium transition-colors flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span> Trabalho
              </button>
              <button className="px-4 py-2 rounded-[12px] hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 text-xs font-medium transition-colors flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Pessoal
              </button>
              <button className="px-4 py-2 rounded-[12px] hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 text-xs font-medium transition-colors flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Estudos
              </button>
            </div>
          </div>

          {/* Agenda List */}
          <div className="bg-white dark:bg-white/5 backdrop-blur-md rounded-[24px] p-6 shadow-sm border border-slate-200 dark:border-white/10">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-6">Segunda-feira, 26 de maio</h2>
            
            <div className="flex flex-col gap-2">
              {mockAgenda.map((item, i) => (
                <div key={i} className={`flex items-center gap-4 py-3 px-4 rounded-2xl border ${item.checked ? 'border-transparent bg-slate-50 dark:bg-white/5 opacity-60' : 'border-slate-100 dark:border-white/5 bg-transparent'} transition-all`}>
                  <button className={`w-5 h-5 rounded-md flex items-center justify-center border ${item.checked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 dark:border-slate-600 text-transparent hover:border-blue-500'}`}>
                    <Check size={12} strokeWidth={3} />
                  </button>
                  <span className={`text-sm font-bold ${item.checked ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-700 dark:text-slate-300'}`}>{item.time}</span>
                  <span className={`text-sm font-medium flex-1 ${item.checked ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-800 dark:text-slate-100'}`}>{item.title}</span>
                  <span className="text-xs font-medium text-slate-400">{item.duration}</span>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                    {item.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar (Widgets) */}
        <div className="flex flex-col gap-6">
          
          {/* Progresso do dia */}
          <div className="bg-white dark:bg-white/5 backdrop-blur-md rounded-[24px] p-6 shadow-sm border border-slate-200 dark:border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Progresso do dia</h3>
              <span className="text-[10px] text-slate-400 font-medium">5 de 5 atividades</span>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="relative w-20 h-20 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={40}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                      stroke="none"
                      cornerRadius={10}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-sm font-bold text-slate-800 dark:text-white">{progressPercent}%</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 text-[11px] font-medium">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>{completedTasks} concluídas</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                  <span>{pendingTasks} pendentes</span>
                </div>
              </div>
            </div>
          </div>

          {/* Calendário Mensal Widget */}
          <div className="bg-white dark:bg-white/5 backdrop-blur-md rounded-[24px] p-6 shadow-sm border border-slate-200 dark:border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Maio 2025</h3>
              <div className="flex gap-1">
                <button className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded-md text-slate-400"><ChevronLeft size={14} /></button>
                <button className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded-md text-slate-400"><ChevronRight size={14} /></button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-y-3 gap-x-1 text-center mb-2">
              {['D','S','T','Q','Q','S','S'].map((d, i) => (
                <span key={i} className="text-[10px] font-bold text-slate-400">{d}</span>
              ))}
              
              {/* Padding days */}
              <div className="text-transparent">0</div>
              <div className="text-transparent">0</div>
              <div className="text-transparent">0</div>
              <div className="text-transparent">0</div>
              
              {/* Actual days */}
              {Array.from({ length: 31 }).map((_, i) => {
                const day = i + 1;
                const isSelected = day === 26;
                const isToday = day === 15;
                const hasDot = [2, 8, 12, 19, 23, 26].includes(day);
                
                return (
                  <div key={day} className="flex justify-center items-center relative">
                    <button 
                      className={`w-7 h-7 rounded-full text-xs font-medium flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-blue-600 text-white shadow-sm' : 
                        isToday ? 'bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-white' : 
                        'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                      }`}
                    >
                      {day}
                    </button>
                    {hasDot && !isSelected && (
                      <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-blue-500"></span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-auto bg-[#f0f9ff] dark:bg-[#1a233a]/80 border border-blue-100 dark:border-blue-900/50 rounded-[24px] p-6 text-center italic relative overflow-hidden">
             <div className="absolute -top-10 -left-10 w-32 h-32 bg-blue-400/20 dark:bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
             <p className="text-xs text-slate-700 dark:text-slate-300 font-medium relative z-10 leading-relaxed">
               "Tempo bem planejado é uma forma de autocuidado."
             </p>
             <p className="text-[9px] text-blue-600 dark:text-blue-400 font-bold tracking-widest uppercase mt-3 relative z-10">
               Nexus Focus
             </p>
          </div>

        </div>

      </div>
    </motion.div>
  );
}
