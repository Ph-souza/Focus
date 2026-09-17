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
        <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-sm transition-all shadow-[0_0_20px_rgba(59,130,246,0.5)] hover:shadow-[0_0_25px_rgba(59,130,246,0.7)] flex items-center gap-2 active:scale-95">
          <Plus size={18} /> Nova atividade
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Main Content (Left, 2 cols width) */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          
          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4 bg-white/70 dark:bg-slate-950/40 backdrop-blur-xl border border-slate-200/60 dark:border-blue-500/20 rounded-2xl px-3 py-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
              <button className="p-1 hover:bg-white/50 dark:hover:bg-blue-500/20 rounded-lg text-slate-500 dark:text-slate-400 hover:text-blue-500 transition-colors"><ChevronLeft size={16}/></button>
              <span className="font-bold text-sm text-slate-900 dark:text-white">Maio de 2025</span>
              <button className="p-1 hover:bg-white/50 dark:hover:bg-blue-500/20 rounded-lg text-slate-500 dark:text-slate-400 hover:text-blue-500 transition-colors"><ChevronRight size={16}/></button>
            </div>
            
            <div className="flex items-center gap-2 bg-white/70 dark:bg-slate-950/40 backdrop-blur-xl border border-slate-200/60 dark:border-blue-500/20 rounded-2xl p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
              {['Todos', 'Trabalho', 'Pessoal', 'Estudos'].map(f => (
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
          <div className="flex justify-between items-center bg-white/70 dark:bg-slate-950/40 backdrop-blur-xl border border-slate-200/60 dark:border-blue-500/20 rounded-3xl p-3 shadow-[0_10px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            {days.map((d, i) => (
              <button 
                key={i}
                onClick={() => setSelectedDay(d.dayNum)}
                className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl transition-all ${
                  selectedDay === d.dayNum 
                    ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.6)] scale-105' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className={`text-[10px] font-bold uppercase ${selectedDay === d.dayNum ? 'text-blue-100' : ''}`}>{d.dayStr}</span>
                <span className="text-xl font-black mt-0.5">{d.dayNum}</span>
              </button>
            ))}
            <button className="w-16 h-16 flex items-center justify-center text-slate-400 hover:text-blue-500 hover:bg-white/40 dark:hover:bg-white/5 rounded-2xl transition-colors">
              <Plus size={20} />
            </button>
          </div>

          {/* Tasks List */}
          <div className="bg-white/70 dark:bg-slate-950/40 backdrop-blur-xl border border-slate-200/60 dark:border-blue-500/20 rounded-3xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">Segunda-feira, 26 de maio</h2>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">5 atividades</span>
            </div>

            <div className="flex flex-col gap-2.5">
              {tasks.map((task, i) => (
                <div key={i} className={`flex items-center gap-4 p-4 rounded-2xl transition-colors group ${
                  task.completed 
                    ? 'bg-slate-100/40 dark:bg-slate-900/30 opacity-70' 
                    : 'bg-white/50 dark:bg-slate-900/40 hover:bg-white/80 dark:hover:bg-blue-950/30 border border-slate-200/50 dark:border-blue-500/15 shadow-sm hover:border-blue-500/30'
                }`}>
                  <button className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    task.completed 
                      ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]' 
                      : 'border-2 border-slate-300 dark:border-slate-600 group-hover:border-blue-500'
                  }`}>
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
                  <span className={`text-[10px] font-bold text-slate-400 dark:text-slate-500`}>{task.duration}</span>
                  <div className={`px-3 py-1 text-[10px] font-bold rounded-full ${
                    task.tagColor === 'blue' ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30' :
                    task.tagColor === 'emerald' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30' :
                    'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
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
          <div className="bg-white/70 dark:bg-slate-950/40 backdrop-blur-xl border border-slate-200/60 dark:border-blue-500/20 rounded-3xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden">
            <h2 className="font-bold text-sm text-slate-900 dark:text-white mb-6">Progresso do dia</h2>
            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="10" className="text-slate-200/60 dark:text-slate-800" />
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="10" strokeDasharray="283" strokeDashoffset="113.2" strokeLinecap="round" className="text-blue-600 dark:text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                </svg>
                <span className="absolute text-xl font-black text-slate-900 dark:text-white">60%</span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
                  <span>3 concluídas</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"></span>
                  <span>2 pendentes</span>
                </div>
              </div>
            </div>
          </div>

          {/* Minicalendário */}
          <div className="bg-white/70 dark:bg-slate-950/40 backdrop-blur-xl border border-slate-200/60 dark:border-blue-500/20 rounded-3xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Maio 2025</h3>
              <div className="flex gap-1">
                <button className="text-slate-400 hover:text-blue-500"><ChevronLeft size={16}/></button>
                <button className="text-slate-400 hover:text-blue-500"><ChevronRight size={16}/></button>
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
                  className={`w-8 h-8 mx-auto flex items-center justify-center rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                    (i + 1) === 26 
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
          <div className="mt-auto bg-white/70 dark:bg-slate-950/40 backdrop-blur-xl border border-slate-200/60 dark:border-blue-500/20 rounded-3xl p-6 text-center shadow-[0_10px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            <p className="text-sm text-slate-700 dark:text-slate-300 italic font-medium leading-relaxed">
              "Tempo bem planejado é uma forma de autocuidado."
            </p>
            <span className="block mt-4 text-[10px] font-bold text-blue-500 uppercase tracking-widest">
              NEXUS FOCUS
            </span>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
