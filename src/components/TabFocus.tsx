import { motion } from 'motion/react';
import { Play, SkipForward, CheckSquare, Target, Clock, TrendingUp, Moon } from 'lucide-react';

export function TabFocus() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-full p-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Foco</h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Menos distração. Mais progresso.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Seg, 26 de maio de 2025</span>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-white/10 transition-colors shadow-sm">
            <Moon size={14} /> Modo profundo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Left Column (Timer & Stats) */}
        <div className="flex flex-col gap-8">
          
          {/* Timer Section */}
          <div className="bg-white dark:bg-[#0b101e] border border-slate-200 dark:border-white/5 rounded-[32px] p-8 shadow-sm flex flex-col items-center relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-32 bg-[#3b82f6]/10 dark:bg-[#6366f1]/10 rounded-full blur-3xl pointer-events-none"></div>
            
            {/* Type Tabs */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#111827] p-1.5 rounded-2xl mb-12 relative z-10 w-max mx-auto shadow-inner">
              <button className="px-6 py-2 rounded-xl bg-[#3b82f6] dark:bg-[#6366f1] text-white font-bold text-xs shadow-md">Pomodoro</button>
              <button className="px-6 py-2 rounded-xl text-slate-600 dark:text-slate-400 font-bold text-xs hover:text-slate-900 dark:hover:text-white transition-colors">Tarefa</button>
              <button className="px-6 py-2 rounded-xl text-slate-600 dark:text-slate-400 font-bold text-xs hover:text-slate-900 dark:hover:text-white transition-colors">Estatísticas</button>
            </div>

            {/* Giant Timer */}
            <div className="relative w-72 h-72 flex flex-col items-center justify-center mb-12 shrink-0">
              {/* Outer Glow */}
              <div className="absolute inset-0 rounded-full bg-[#3b82f6]/5 dark:bg-[#6366f1]/5 scale-110 blur-xl"></div>
              {/* SVG Ring */}
              <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-100 dark:text-[#1e293b]" />
                {/* Thick progress ring */}
                <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray="289" strokeDashoffset="50" strokeLinecap="round" className="text-[#3b82f6] dark:text-[#6366f1]" />
              </svg>
              
              <div className="flex flex-col items-center justify-center relative z-10">
                <span className="text-sm font-bold text-[#3b82f6] dark:text-[#6366f1] uppercase tracking-widest mb-2">Foco</span>
                <span className="text-7xl font-black text-slate-800 dark:text-white tracking-tighter tabular-nums leading-none mb-6">25:00</span>
                
                <div className="flex items-center gap-4">
                  <button className="w-16 h-16 rounded-full bg-[#3b82f6] dark:bg-[#6366f1] text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all">
                    <Play size={24} className="ml-1" fill="currentColor" />
                  </button>
                </div>
              </div>
            </div>

            <button className="text-sm font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors flex items-center gap-2">
              <SkipForward size={16} /> Pular
            </button>
            
            {/* Sessions today indicator */}
            <div className="w-full flex items-center justify-between mt-8 pt-6 border-t border-slate-100 dark:border-white/5">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Sessões hoje</span>
                <span className="text-lg font-black text-slate-800 dark:text-white">3/6</span>
              </div>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className={`w-12 h-2 rounded-full ${i <= 3 ? 'bg-[#3b82f6] dark:bg-[#6366f1]' : 'bg-slate-200 dark:bg-white/10'}`}></div>
                ))}
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-[#0b101e] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center">
                <Clock size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Tempo focado</span>
                <span className="text-xl font-bold text-slate-800 dark:text-white">1h 15min</span>
              </div>
            </div>
            
            <div className="bg-white dark:bg-[#0b101e] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center">
                <TrendingUp size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Produtividade</span>
                <span className="text-xl font-bold text-slate-800 dark:text-white">87%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Task context) */}
        <div className="flex flex-col gap-6">
          
          {/* Tarefa em Foco */}
          <div className="bg-white dark:bg-[#0b101e] border border-slate-200 dark:border-white/5 rounded-3xl p-8 shadow-sm h-full relative overflow-hidden">
            <h2 className="font-bold text-sm text-slate-800 dark:text-white mb-6 flex items-center gap-2">
              <Target size={16} className="text-[#3b82f6] dark:text-[#6366f1]" /> Tarefa em foco
            </h2>
            
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">Revisão do projeto</h3>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-bold rounded-lg border border-blue-200 dark:border-blue-800/50">Trabalho</span>
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">1 de 4 subtarefas concluídas (25%)</p>
              
              <div className="w-full h-1.5 bg-slate-100 dark:bg-white/5 rounded-full mt-4 overflow-hidden">
                <div className="h-full bg-[#3b82f6] dark:bg-[#6366f1] w-1/4 rounded-full"></div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {[
                { label: 'Ler briefing novamente', done: true },
                { label: 'Revisar pontos principais', done: false },
                { label: 'Atualizar documento', done: false },
                { label: 'Preparar apresentação', done: false },
              ].map((item, i) => (
                <label key={i} className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-colors ${
                  item.done 
                    ? 'bg-slate-50 dark:bg-white/5' 
                    : 'bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/5 hover:border-[#3b82f6] dark:hover:border-[#6366f1]/50'
                }`}>
                  <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border-2 transition-colors ${
                    item.done 
                      ? 'bg-[#3b82f6] border-[#3b82f6] dark:bg-[#6366f1] dark:border-[#6366f1] text-white' 
                      : 'border-slate-300 dark:border-slate-600 bg-transparent'
                  }`}>
                    {item.done && <CheckSquare size={14} strokeWidth={3} />}
                  </div>
                  <span className={`text-sm font-semibold ${item.done ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-800 dark:text-slate-200'}`}>
                    {item.label}
                  </span>
                </label>
              ))}
            </div>

            <button className="mt-6 w-full flex items-center gap-2 p-4 text-sm font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 border border-dashed border-slate-200 dark:border-white/10">
              <span className="w-5 h-5 flex items-center justify-center text-lg leading-none">+</span> Adicionar uma subtarefa...
            </button>
          </div>

          {/* Insight Foco */}
          <div className="bg-[#f0f9ff] dark:bg-[#0b101e] border border-blue-100 dark:border-[#6366f1]/30 rounded-3xl p-6 shadow-sm relative overflow-hidden group">
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-400/20 dark:bg-[#6366f1]/10 rounded-full blur-2xl group-hover:bg-[#6366f1]/20 transition-all duration-500"></div>
            <h3 className="font-bold text-xs text-slate-800 dark:text-slate-300 mb-2 uppercase tracking-widest flex items-center gap-2">
              <Bot size={14} /> Insight do Mentor
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium italic">
              "Foco não é fazer mais, é fazer o que realmente importa. Concentre-se nesta tarefa e evite interrupções pelas próximas meia hora."
            </p>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
