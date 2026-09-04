import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

import { Task } from '../types';

export function TaskProgressWidget({ tasks, onNavigate }: { tasks: Task[], onNavigate?: () => void }) {
  const activeTasks = tasks.filter(t => !t.completed).slice(0, 4);

  return (
    <div 
      onClick={onNavigate}
      className="bg-white dark:bg-gradient-to-br dark:from-[#18181b] dark:to-[#09090b] p-7 rounded-[24px] border border-slate-200 dark:border-[#27272a]/80 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)] flex flex-col transition-all relative overflow-hidden backdrop-blur-md cursor-pointer hover:border-blue-500/50 group h-full"
    >
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
      
      <div className="flex items-center justify-between mb-6 relative z-10">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wider text-[11px] group-hover:text-blue-500 transition-colors">Progresso das Tarefas</h3>
      </div>

      <div className="flex flex-col gap-6 relative z-10 flex-1">
        {activeTasks.length > 0 ? (
          activeTasks.map((task, index) => (
            <div key={task.id} className="group/item">
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{task.title}</span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">0%</span>
              </div>
              
              <div className="h-2.5 w-full bg-slate-100 dark:bg-[#16161D] rounded-full overflow-hidden border border-slate-200 dark:border-white/5 relative">
                <motion.div 
                  initial={{ width: 0 }}
                  whileInView={{ width: '0%' }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 50, damping: 15, delay: 0.2 }}
                  className={`h-full rounded-full ${
                    index % 2 === 0
                      ? 'bg-blue-500 dark:bg-cyan-400 shadow-[0_0_10px_rgba(59,130,246,0.3)] dark:drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' 
                      : 'bg-indigo-500 dark:bg-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.3)] dark:drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]'
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
        <button className="bg-slate-50 dark:bg-[#14151B] border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 text-blue-600 dark:text-cyan-500 text-xs font-semibold px-4 py-1.5 rounded-full flex items-center gap-1.5 transition-all group-hover:bg-blue-50 dark:group-hover:bg-white/5">
          Mais Detalhes <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}
