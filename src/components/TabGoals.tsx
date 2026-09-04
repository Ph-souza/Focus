import { useState } from 'react';
import { motion } from 'motion/react';
import { Target, TrendingUp, Plus } from 'lucide-react';
import { Goal, User } from '../types';
import { GoalModal } from './GoalModal';

interface TabGoalsProps {
  goals: Goal[];
  user: User;
}

export function TabGoals({ goals, user }: TabGoalsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto flex flex-col gap-6"
    >
      <GoalModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} user={user} />
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Caixinhas</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Gerencie e conquiste as suas metas financeiras.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-2 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-yellow-500/10 to-yellow-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          <Plus size={16} /> <span className="hidden sm:inline relative z-10">Nova Meta</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => {
          const progressPercentage = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
          
          return (
            <div key={goal.id} className="bg-white dark:bg-gradient-to-br dark:from-[#18181b] dark:to-[#09090b] p-6 rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)] border border-slate-200 dark:border-[#27272a]/80 relative group overflow-hidden transition-all hover:-translate-y-1 backdrop-blur-md">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-6 uppercase tracking-wider text-[11px] relative z-10">{goal.title}</h3>
              
              <div className="space-y-4 relative z-10">
                <div>
                  <div className="flex justify-between text-xs mb-3">
                    <span className="font-black text-slate-800 dark:text-white drop-shadow-sm text-lg">{formatCurrency(goal.currentAmount)}</span>
                    <span className="font-bold text-[#F59E0B] text-lg bg-[#F59E0B]/10 px-2 py-0.5 rounded-md drop-shadow-sm">{progressPercentage}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-[#27272a] rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercentage}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="bg-gradient-to-r from-[#F59E0B]/50 to-[#F59E0B] h-full rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                    ></motion.div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-50 dark:border-[#27272a]/50 flex items-center justify-between relative z-10">
                <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-[#afafaf] tracking-widest">
                  Faltam {formatCurrency(goal.targetAmount - goal.currentAmount)}
                </span>
                <button className="text-[#10B981] text-[10px] font-bold uppercase tracking-wider hover:text-emerald-400 transition-colors cursor-pointer flex items-center gap-1 group-hover:underline underline-offset-4 decoration-[#10B981]/50">
                  Detalhes
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
