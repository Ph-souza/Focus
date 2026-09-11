import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

import { Task } from '../types';

export function TaskProgressWidget({ tasks, onNavigate }: { tasks: Task[], onNavigate?: () => void }) {
  const activeTasks = tasks.filter(t => !t.completed).slice(0, 4);

  return (
    <div 
      onClick={onNavigate}
      className="bg-white dark:bg-[#121216] p-7 rounded-[24px] border border-slate-200 dark:border-zinc-800 shadow-[0_4px_25px_rgba(0,0,0,0.05)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex flex-col transition-all relative overflow-hidden backdrop-blur-md cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-700 group h-full"
    >
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-zinc-200 dark:via-zinc-700/60 to-transparent pointer-events-none"></div>
      
      <div className="flex items-center justify-between mb-6 relative z-10">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wider text-[11px] group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">Progresso das Tarefas</h3>
      </div>

      <div className="flex flex-col gap-6 relative z-10 flex-1">
        {activeTasks.length > 0 ? (
          activeTasks.map((task, index) => (
            <div key={task.id} className="group/item">
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{task.title}</span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">0%</span>
              </div>
              
              <div className="h-2.5 w-full bg-slate-100 dark:bg-[#18181b] rounded-full overflow-hidden border border-slate-200 dark:border-zinc-800 relative">
                <motion.div 
                  initial={{ width: 0 }}
                  whileInView={{ width: '0%' }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 50, damping: 15, delay: 0.2 }}
                  className={`h-full rounded-full ${
                    index % 2 === 0
                      ? 'bg-gradient-to-r from-zinc-500 to-white shadow-[0_0_8px_rgba(255,255,255,0.3)]' 
                      : 'bg-gradient-to-r from-zinc-600 to-zinc-200'
                  }`}
                />
              </div>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center flex-1">
            <p className="text-sm text-slate-500 dark:text-slate-400">Nenhuma tarefa pendente :)</p>
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-end relative z-10">
        <button className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white text-xs font-semibold px-4 py-1.5 rounded-full flex items-center gap-1.5 transition-all group-hover:bg-slate-100 dark:group-hover:bg-zinc-800 cursor-pointer">
          Mais Detalhes <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}
