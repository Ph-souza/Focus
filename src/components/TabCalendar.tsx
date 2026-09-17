import { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, ChevronLeft, ChevronRight, Check } from 'lucide-react';

export function TabCalendar() {
  const [selectedDay, setSelectedDay] = useState(26);
  const [filter, setFilter] = useState('Todos');
  
  const days = [
    { dayStr: 'Seg', dayNum: 26 },
    { dayStr: 'Ter', dayNum: 27 },
    { dayStr: 'Qua', dayNum: 28 },
    { dayStr: 'Qui', dayNum: 29 },
    { dayStr: 'Sex', dayNum: 30 },
    { dayStr: 'Sáb', dayNum: 31 },
    { dayStr: 'Dom', dayNum: 1 }
  ];

  const tasks = [
    { time: '09:00', title: 'Revisão do projeto', tag: 'Trabalho', duration: '1h', completed: true, tagColor: 'blue' },
    { time: '11:00', title: 'Estudo de inglês', tag: 'Estudos', duration: '1h', completed: true, tagColor: 'emerald' },
    { time: '14:00', title: 'Academia', tag: 'Pessoal', duration: '1h', completed: false, tagColor: 'amber' },
    { time: '16:00', title: 'Planejamento semanal', tag: 'Pessoal', duration: '1h', completed: false, tagColor: 'amber' },
    { time: '19:00', title: 'Leitura', tag: 'Pessoal', duration: '30min', completed: false, tagColor: 'amber' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-full p-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Agenda</h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Seus compromissos, em harmonia com seus objetivos.
          </p>
        </div>
        <button className="px-5 py-2.5 bg-[#3b82f6] dark:bg-[#6366f1] hover:bg-blue-600 dark:hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition-colors shadow-sm flex items-center gap-2">
          <Plus size={18} /> Nova atividade
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Main Content (Left, 2 cols width) */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          
          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 bg-white dark:bg-[#0b101e] border border-slate-200 dark:border-white/5 rounded-xl px-2 py-1 shadow-sm">
              <button className="p-1 hover:bg-slate-100 dark:hover:bg-white/5 rounded-md text-slate-500 dark:text-slate-400 transition-colors"><ChevronLeft size={16}/></button>
              <span className="font-bold text-sm text-slate-800 dark:text-white">Maio de 2025</span>
              <button className="p-1 hover:bg-slate-100 dark:hover:bg-white/5 rounded-md text-slate-500 dark:text-slate-400 transition-colors"><ChevronRight size={16}/></button>
            </div>
            
            <div className="flex items-center gap-2 bg-white dark:bg-[#0b101e] border border-slate-200 dark:border-white/5 rounded-xl p-1 shadow-sm">
              {['Todos', 'Trabalho', 'Pessoal', 'Estudos'].map(f => (
                <button 
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filter === f 
                      ? 'bg-[#3b82f6] dark:bg-[#6366f1] text-white shadow-sm' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Days Carousel */}
          <div className="flex justify-between items-center bg-white dark:bg-[#0b101e] border border-slate-200 dark:border-white/5 rounded-2xl p-2 shadow-sm">
            {days.map((d, i) => (
              <button 
                key={i}
                onClick={() => setSelectedDay(d.dayNum)}
                className={`flex flex-col items-center justify-center w-16 h-16 rounded-xl transition-all ${
                  selectedDay === d.dayNum 
                    ? 'bg-[#3b82f6] dark:bg-[#6366f1] text-white shadow-md scale-105' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
              >
                <span className={`text-[10px] font-bold uppercase ${selectedDay === d.dayNum ? 'text-blue-100 dark:text-indigo-200' : ''}`}>{d.dayStr}</span>
                <span className="text-xl font-black mt-0.5">{d.dayNum}</span>
              </button>
            ))}
            <button className="w-16 h-16 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
              <Plus size={20} />
            </button>
          </div>

          {/* Tasks List */}
          <div className="bg-white dark:bg-[#0b101e] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-sm text-slate-800 dark:text-white">Segunda-feira, 26 de maio</h2>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">5 atividades</span>
            </div>

            <div className="flex flex-col gap-2">
              {tasks.map((task, i) => (
                <div key={i} className={`flex items-center gap-4 p-4 rounded-2xl transition-colors group ${
                  task.completed 
                    ? 'bg-slate-50 dark:bg-white/5 opacity-70' 
                    : 'bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 border border-slate-100 dark:border-white/5 shadow-sm'
                }`}>
                  <button className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                    task.completed 
                      ? 'bg-[#3b82f6] dark:bg-[#6366f1] text-white' 
                      : 'border-2 border-slate-300 dark:border-slate-600 group-hover:border-[#3b82f6] dark:group-hover:border-[#6366f1]'
                  }`}>
                    {task.completed && <Check size={14} strokeWidth={3} />}
                  </button>
                  <span className={`text-xs font-bold w-12 ${task.completed ? 'text-slate-400 dark:text-slate-500' : 'text-slate-500 dark:text-slate-400'}`}>
                    {task.time}
                  </span>
                  <span className={`flex-1 font-semibold text-sm ${
                    task.completed ? 'text-slate-500 dark:text-slate-500 line-through' : 'text-slate-800 dark:text-slate-200'
                  }`}>
                    {task.title}
                  </span>
                  <span className={`text-[10px] font-bold text-slate-400 dark:text-slate-500`}>{task.duration}</span>
                  <div className={`px-3 py-1 text-[10px] font-bold rounded-full ${
                    task.tagColor === 'blue' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50' :
                    task.tagColor === 'emerald' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50' :
                    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50'
                  }`}>
                    {task.tag}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Widgets (Right, 1 col width) */}
        <div className="flex flex-col gap-6">
          
          {/* Progresso do dia */}
          <div className="bg-white dark:bg-[#0b101e] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm relative overflow-hidden">
            <h2 className="font-bold text-sm text-slate-800 dark:text-white mb-6">Progresso do dia</h2>
            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="10" className="text-slate-100 dark:text-slate-800" />
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="10" strokeDasharray="283" strokeDashoffset="113.2" strokeLinecap="round" className="text-[#3b82f6] dark:text-[#6366f1]" />
                </svg>
                <span className="absolute text-xl font-bold text-slate-800 dark:text-white">60%</span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>3 concluídas</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>2 pendentes</span>
                </div>
              </div>
            </div>
          </div>

          {/* Minicalendário */}
          <div className="bg-white dark:bg-[#0b101e] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-slate-800 dark:text-white">Maio 2025</h3>
              <div className="flex gap-1">
                <button className="text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"><ChevronLeft size={16}/></button>
                <button className="text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"><ChevronRight size={16}/></button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['D','S','T','Q','Q','S','S'].map((d, i) => (
                <span key={i} className="text-[10px] font-bold text-slate-400">{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {Array.from({length: 31}).map((_, i) => (
                <div 
                  key={i} 
                  className={`w-8 h-8 mx-auto flex items-center justify-center rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    (i + 1) === 26 
                      ? 'bg-[#3b82f6] dark:bg-[#6366f1] text-white shadow-sm font-bold' 
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'
                  }`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>

          {/* Quote Card */}
          <div className="mt-auto bg-[#f8fafc] dark:bg-[#111827] border border-slate-200 dark:border-white/5 rounded-3xl p-6 text-center shadow-sm">
            <p className="text-sm text-slate-600 dark:text-slate-400 italic font-medium leading-relaxed">
              "Tempo bem planejado é uma forma de autocuidado."
            </p>
            <span className="block mt-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              NEXUS FOCUS
            </span>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
