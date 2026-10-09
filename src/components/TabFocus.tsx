import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Play, 
  Pause,
  Square,
  SkipForward, 
  Target, 
  Clock, 
  TrendingUp, 
  Moon, 
  Bot,
  Calendar,
  Layers,
  Trophy,
  BarChart2,
  Sliders,
  CheckCircle2,
  ChevronRight,
  CheckSquare,
  Timer,
  Check,
  Folder
} from 'lucide-react';
import { DeepModeScreen } from './DeepModeScreen';

interface TabFocusProps {
  onTabChange?: (tab: any) => void;
}

export function TabFocus({ onTabChange }: TabFocusProps) {
  // Estado do Modo Profundo
  const [isDeepModeActive, setIsDeepModeActive] = useState(false);
  const [activeMode, setActiveMode] = useState<'pomodoro' | 'timer' | 'ritmo' | 'personalizado'>('pomodoro');
  
  const [totalTime, setTotalTime] = useState(25 * 60);
  const [timeRemaining, setTimeRemaining] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [session, setSession] = useState(1);
  
  // Carregar dados do localStorage
  const [projects, setProjects] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem('nexus_focus_projects_list') || '[]'); } catch { return []; }
  });
  
  const [tasks, setTasks] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem('nexus_focus_project_tasks') || '[]'); } catch { return []; }
  });

  // Filtramos apenas as tarefas pendentes de hoje
  const todayTasks = tasks.filter(t => t.status !== 'done' && (t.group === 'today' || t.date === 'Hoje' || t.date === 'today'));
  
  // Agrupando por projeto
  const tasksByProject = projects.map(p => ({
    ...p,
    tasks: todayTasks.filter(t => t.projectId === p.id)
  })).filter(p => p.tasks.length > 0);

  const [selectedTaskId, setSelectedTaskId] = useState<string | number>(todayTasks[0]?.id || '');

  useEffect(() => {
    if (!selectedTaskId && todayTasks.length > 0) {
      setSelectedTaskId(todayTasks[0].id);
    }
  }, [todayTasks, selectedTaskId]);

  const activeTask = tasks.find(t => t.id === selectedTaskId) || { title: 'Nenhuma tarefa pendente para hoje', description: '', status: 'todo', id: '' };
  
  const handleTaskComplete = (taskId: string | number) => {
    const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, status: 'done', completedAt: new Date().toISOString() } : t);
    setTasks(updatedTasks);
    localStorage.setItem('nexus_focus_project_tasks', JSON.stringify(updatedTasks));
    // Quando concluída, caso a ativa seja ela mesma, reseta
    if (taskId === selectedTaskId) {
      const nextPending = updatedTasks.find(t => t.status !== 'done' && (t.group === 'today' || t.date === 'Hoje'));
      setSelectedTaskId(nextPending?.id || '');
    }
  };

  const handleModeChange = (mode: 'pomodoro' | 'timer' | 'ritmo' | 'personalizado') => {
    setActiveMode(mode);
    setIsRunning(false);
    if (mode === 'pomodoro') {
      setTotalTime(25 * 60);
      setTimeRemaining(25 * 60);
    } else if (mode === 'timer') {
      setTotalTime(50 * 60);
      setTimeRemaining(50 * 60);
    } else if (mode === 'ritmo') {
      setTotalTime(90 * 60);
      setTimeRemaining(90 * 60);
    } else {
      setTotalTime(30 * 60);
      setTimeRemaining(30 * 60);
    }
  };

  useEffect(() => {
    let interval: any = null;
    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0) {
      setIsRunning(false);
      setSession(prev => (prev < 4 ? prev + 1 : 1));
      setTimeRemaining(totalTime);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeRemaining, totalTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const progressPercent = ((totalTime - timeRemaining) / totalTime) * 100;
  const visualProgressPercent = !isRunning && timeRemaining === totalTime ? 65 : progressPercent;
  const strokeDashoffset = circumference - (circumference * visualProgressPercent) / 100;

  const handleTogglePlay = () => setIsRunning(running => !running);
  const handleStop = () => { setIsRunning(false); setTimeRemaining(totalTime); };
  const handleSkip = () => { setIsRunning(false); setSession(prev => (prev < 4 ? prev + 1 : 1)); setTimeRemaining(totalTime); };

  const renderTaskList = () => (
    <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
      {tasksByProject.length === 0 ? (
        <div className="p-8 text-center text-sm font-medium text-slate-500 glass-card">
          Nenhuma tarefa agendada para hoje. Aproveite o dia livre!
        </div>
      ) : (
        tasksByProject.map(project => (
          <div key={project.id} className="mb-4">
            <div className="flex items-center gap-2 mb-3 px-1">
              <Folder size={15} className="text-blue-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                {project.name}
              </span>
            </div>
            <div className="flex flex-col gap-2.5">
              {project.tasks.map((task: any) => {
                const isSelected = selectedTaskId === task.id;
                return (
                  <label key={task.id} className={`flex items-center gap-3 p-3.5 rounded-2xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-blue-50/70 dark:bg-blue-900/20 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/20'
                      : 'bg-white/60 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-700/50 hover:border-blue-400/30 hover:bg-white/80'
                  }`}>
                    <input 
                      type="radio" 
                      name="focusTask" 
                      className="hidden" 
                      checked={isSelected}
                      onChange={() => {
                        setSelectedTaskId(task.id);
                        if (isRunning) {
                          setTimeRemaining(totalTime);
                        }
                      }} 
                    />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isSelected ? 'border-blue-500 bg-blue-500/10' : 'border-slate-300 dark:border-slate-600'
                    }`}>
                      {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm font-bold truncate ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'}`}>
                        {task.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200/50 dark:bg-slate-800 text-slate-500">
                          {task.tag || 'Geral'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          task.priority === 'high' ? 'bg-rose-500/15 text-rose-600' : 
                          task.priority === 'medium' ? 'bg-amber-500/15 text-amber-600' : 'bg-emerald-500/15 text-emerald-600'
                        }`}>
                          {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                        </span>
                      </div>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4 md:gap-6 p-0 md:p-8"
    >
      {/* MOBILE VIEW */}
      <div className="block md:hidden space-y-4">
        
        <div className="flex items-center justify-between pt-1 pb-1">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Foco</h1>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Concentre-se no que importa</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsDeepModeActive(true)}
              className="h-11 px-3 rounded-2xl glass-card flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Moon size={16} className="text-blue-500" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-0.5 no-scrollbar">
          <button onClick={() => handleModeChange('pomodoro')} className={`px-3.5 py-1.5 rounded-full text-xs flex items-center gap-1.5 shrink-0 ${activeMode === 'pomodoro' ? 'bg-blue-600 text-white font-bold' : 'glass-pill text-slate-600'}`}><Timer size={14} />Pomodoro</button>
          <button onClick={() => handleModeChange('timer')} className={`px-3.5 py-1.5 rounded-full text-xs flex items-center gap-1.5 shrink-0 ${activeMode === 'timer' ? 'bg-blue-600 text-white font-bold' : 'glass-pill text-slate-600'}`}><Clock size={14} />Timer</button>
        </div>

        {/* Central Timer */}
        <div className="glass-card p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-sm">
          <div className="relative w-56 h-56 flex flex-col items-center justify-center shrink-0">
            <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r={radius} fill="none" stroke="currentColor" strokeWidth="7" className="text-slate-200/80 dark:text-slate-800/80" />
              <circle cx="100" cy="100" r={radius} fill="none" stroke="currentColor" strokeWidth="6" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" className="text-blue-600 dark:text-blue-400 transition-all duration-500" />
            </svg>
            <div className="flex flex-col items-center justify-center relative z-10 text-center px-4">
              <span className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-1">Foco</span>
              <span className="text-4xl font-black text-slate-900 dark:text-white tabular-nums leading-none mt-1">{formatTime(timeRemaining)}</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-7 mt-4 relative z-10">
            <button onClick={handleStop} className="w-12 h-12 rounded-2xl glass-card flex items-center justify-center text-rose-500"><Square size={16} className="fill-rose-500" /></button>
            <button onClick={handleTogglePlay} className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg">
              {isRunning ? <Pause size={22} className="fill-current" /> : <Play size={22} className="fill-current ml-1" />}
            </button>
            <button onClick={handleSkip} className="w-12 h-12 rounded-2xl glass-card flex items-center justify-center text-blue-600"><SkipForward size={18} /></button>
          </div>
        </div>

        {/* Lista de Tarefas Mobile */}
        <div className="glass-card p-5 shadow-sm mt-2">
          <h2 className="text-sm font-black text-slate-900 dark:text-white mb-5 flex items-center gap-2">
            <Target size={16} className="text-blue-600" /> Selecionar tarefa
          </h2>
          {renderTaskList()}
        </div>

      </div>

      {/* DESKTOP VIEW */}
      <div className="hidden md:flex flex-col h-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Foco</h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Menos distração. Mais progresso.</p>
          </div>
          <button 
            onClick={() => setIsDeepModeActive(true)}
            className="flex items-center gap-2 px-4 py-2 glass-card text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-white shadow-sm cursor-pointer"
          >
            <Moon size={14} className="text-blue-500" /> Modo profundo
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Left Column (Timer) */}
          <div className="flex flex-col gap-8">
            <div className="glass-card p-8 flex flex-col items-center relative overflow-hidden">
              <div className="flex items-center gap-2 glass-pill p-1.5 rounded-2xl mb-12 relative z-10 w-max mx-auto shadow-sm">
                <button onClick={() => handleModeChange('pomodoro')} className={`px-6 py-2 rounded-xl font-bold text-xs ${activeMode === 'pomodoro' ? 'bg-blue-600 text-white' : 'text-slate-600'}`}>Pomodoro</button>
                <button onClick={() => handleModeChange('timer')} className={`px-6 py-2 rounded-xl font-bold text-xs ${activeMode === 'timer' ? 'bg-blue-600 text-white' : 'text-slate-600'}`}>Tarefa</button>
                <button onClick={() => handleModeChange('ritmo')} className={`px-6 py-2 rounded-xl font-bold text-xs ${activeMode === 'ritmo' ? 'bg-blue-600 text-white' : 'text-slate-600'}`}>Estatísticas</button>
              </div>

              <div className="relative w-72 h-72 flex flex-col items-center justify-center mb-10 shrink-0">
                <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-200/60 dark:text-slate-800" />
                  <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="6" strokeDasharray="289" strokeDashoffset={289 - (289 * visualProgressPercent) / 100} strokeLinecap="round" className="text-blue-600 transition-all duration-500" />
                </svg>
                <div className="flex flex-col items-center justify-center relative z-10">
                  <span className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-2">Foco</span>
                  <span className="text-7xl font-black text-slate-900 dark:text-white tabular-nums leading-none mb-6">{formatTime(timeRemaining)}</span>
                  
                  <div className="flex items-center gap-4">
                    <button onClick={handleTogglePlay} className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_6px_16px_rgba(37,99,235,0.22)]">
                      {isRunning ? <Pause size={24} className="fill-current" /> : <Play size={24} className="ml-1 fill-current" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <button onClick={handleStop} className="text-sm font-medium text-slate-500 hover:text-rose-500 flex items-center gap-2"><Square size={14} className="fill-current" /> Parar</button>
                <button onClick={handleSkip} className="text-sm font-medium text-slate-500 hover:text-slate-700 flex items-center gap-2"><SkipForward size={16} /> Pular</button>
              </div>
            </div>
            
            {/* Active task details */}
            {activeTask.id && (
              <div className="glass-card p-6 flex flex-col gap-4 border-l-4 border-l-blue-500">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-800 dark:text-white truncate pr-2 leading-tight">
                    {activeTask.title}
                  </h3>
                  <button 
                    onClick={() => handleTaskComplete(activeTask.id as string)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white text-xs font-bold transition-all cursor-pointer shrink-0 shadow-sm"
                  >
                    <Check size={14} className="stroke-[3]" /> Concluir tarefa
                  </button>
                </div>
                {activeTask.description && <p className="text-sm font-medium text-slate-500">{activeTask.description}</p>}
              </div>
            )}
          </div>

          {/* Right Column: Task Selection */}
          <div className="flex flex-col gap-6">
            <div className="glass-card p-8 h-full flex flex-col shadow-sm">
              <h2 className="font-black text-xl text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                <Target size={22} className="text-blue-600 dark:text-blue-400" />
                Selecione a Tarefa do Dia
              </h2>
              
              <div className="flex-1 rounded-2xl">
                {renderTaskList()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <DeepModeScreen
        isOpen={isDeepModeActive}
        onClose={() => setIsDeepModeActive(false)}
        taskTitle={activeTask.title}
        timeRemaining={timeRemaining}
        isRunning={isRunning}
        onTogglePlay={handleTogglePlay}
        onStop={handleStop}
      />
    </motion.div>
  );
}
