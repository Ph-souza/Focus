import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Transaction, User, Rotina, Task } from '../types';
import { Bell, Bot, ArrowRight, ArrowUpRight, ArrowDownRight, Clock, Plus, StickyNote, Banknote, Target, ChevronRight } from 'lucide-react';
import { BalanceStatementModal } from './BalanceStatementModal';
import { NotificationsModal } from './NotificationsModal';

interface TabHomeProps {
  transactions: Transaction[];
  goals: any[];
  tasks: Task[];
  rotinas: Rotina[];
  onTabChange: (tab: any) => void;
  user: User | null;
  onOpenProfile?: () => void;
  onOpenWhatsApp?: () => void;
  latestMentorFeedback?: string | null;
}

export function TabHome({ transactions, tasks, rotinas, onTabChange, user, onOpenProfile, latestMentorFeedback }: TabHomeProps) {
  const [greeting, setGreeting] = useState('');
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Bom dia');
    else if (hour < 18) setGreeting('Boa tarde');
    else setGreeting('Boa noite');
  }, []);

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const pendingTasks = tasks.filter(t => !t.completed).length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = pendingTasks + completedTasks || 1;
  const progressPercent = Math.round((completedTasks / totalTasks) * 100);
  const strokeDashoffset = 283 - (283 * progressPercent) / 100;

  const todayStr = new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6 p-8"
    >
      <BalanceStatementModal
        isOpen={isStatementModalOpen}
        onClose={() => setIsStatementModalOpen(false)}
        transactions={transactions}
        balance={balance}
      />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            {greeting}, {user?.name?.split(' ')[0] || 'Usuário'} <span className="text-2xl">👋</span>
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Disciplina hoje, grandes resultados amanhã.
          </p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 capitalize">{todayStr}</span>
            <button 
              onClick={() => setIsNotificationsOpen(true)}
              className="w-10 h-10 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors shadow-sm"
            >
              <Bell size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Top Grid (3 columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Resumo de Hoje */}
        <div className="bg-white dark:bg-[#0b101e] backdrop-blur-md rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-white/5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent to-slate-50/50 dark:to-[#6366f1]/5 pointer-events-none"></div>
          <div className="flex justify-between items-center mb-6 relative z-10">
            <h2 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
              Resumo de Hoje
            </h2>
            <button className="text-slate-400 hover:text-[#6366f1] transition-colors"><Bell size={16}/></button>
          </div>
          
          <div className="flex items-center gap-6 relative z-10">
            {/* Circular Progress */}
            <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="10" className="text-slate-100 dark:text-slate-800" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="10" strokeDasharray="283" strokeDashoffset={strokeDashoffset} strokeLinecap="round" className="text-[#3b82f6] dark:text-[#6366f1] transition-all duration-1000 ease-out" />
              </svg>
              <span className="absolute text-xl font-bold text-slate-800 dark:text-white">{progressPercent}%</span>
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>{completedTasks} concluídas</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>{pendingTasks} pendentes</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>0 em atraso</span>
              </div>
            </div>
          </div>
          <div className="mt-6 text-right relative z-10">
            <button onClick={() => onTabChange('calendar')} className="text-xs font-bold text-[#3b82f6] dark:text-[#6366f1] hover:underline flex items-center gap-1 justify-end w-full">
              Ver agenda <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Card 2: Saldo disponível */}
        <div className="bg-white dark:bg-[#0b101e] backdrop-blur-md rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-white/5 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-2 relative z-10">
            <h2 className="font-bold text-sm text-slate-800 dark:text-white">Saldo disponível</h2>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Banknote size={16} />
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">R$ {balance.toFixed(2).replace('.', ',')}</h3>
            <div className="flex items-center gap-1 mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 w-max px-2 py-1 rounded-md">
              <ArrowUpRight size={14} />
              <span>12% este mês</span>
            </div>
          </div>
          
          {/* Sparkline Graph */}
          <div className="h-16 mt-4 flex items-end gap-1 relative z-10 opacity-70">
            {[30, 45, 25, 60, 40, 75, 50, 85, 65, 95].map((h, i) => (
              <div key={i} className="flex-1 bg-blue-100 dark:bg-[#6366f1]/20 rounded-t-sm transition-all hover:bg-blue-300 dark:hover:bg-[#6366f1]/50" style={{ height: `${h}%` }}></div>
            ))}
          </div>

          <div className="mt-4 text-right relative z-10">
            <button onClick={() => onTabChange('finances')} className="text-xs font-bold text-[#3b82f6] dark:text-[#6366f1] hover:underline flex items-center gap-1 justify-end w-full">
              Ver finanças <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Card 3: Insight do Mentor */}
        <div className="bg-[#f0f9ff] dark:bg-[#111827] backdrop-blur-md rounded-3xl p-6 shadow-sm border border-blue-100 dark:border-white/5 relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-400/20 dark:bg-[#6366f1]/10 rounded-full blur-2xl group-hover:bg-blue-400/30 transition-all duration-500"></div>
          
          <div className="flex items-center gap-2 mb-4 relative z-10">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-[#6366f1] flex items-center justify-center">
              <Bot size={16} />
            </div>
            <h2 className="font-bold text-sm text-slate-800 dark:text-white">Insight do Mentor</h2>
          </div>
          
          <p className="text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium relative z-10 mb-6 italic">
            "Consistência vence motivação. Faça o que precisa ser feito, mesmo quando não parecer fácil."
          </p>

          <div className="mt-auto relative z-10">
            <button onClick={() => onTabChange('chat')} className="w-full py-3 rounded-xl bg-[#3b82f6] dark:bg-[#6366f1] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm hover:bg-blue-600 dark:hover:bg-indigo-500 transition-all">
              Perguntar ao Mentor <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Grid (2 columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Próximas Atividades (2/3 width) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0b101e] rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-white/5 relative overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-base text-slate-800 dark:text-white">Próximas atividades</h2>
            <button onClick={() => onTabChange('calendar')} className="text-xs font-bold text-[#3b82f6] dark:text-[#6366f1] hover:underline flex items-center gap-1">
              Ver todas <ArrowRight size={14} />
            </button>
          </div>
          
          <div className="flex flex-col gap-2">
            {/* Hardcoded sample list matching mockup for visual fidelity */}
            <div className="flex items-center gap-4 p-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors group">
              <div className="text-xs font-bold text-slate-400 dark:text-slate-500 w-12 flex items-center gap-1.5"><Clock size={12}/> 09:00</div>
              <div className="flex-1 font-semibold text-sm text-slate-800 dark:text-slate-200 group-hover:text-[#6366f1] transition-colors">Revisar proposta do projeto</div>
              <div className="px-3 py-1 text-[10px] font-bold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50">Trabalho</div>
            </div>
            <div className="flex items-center gap-4 p-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors group">
              <div className="text-xs font-bold text-slate-400 dark:text-slate-500 w-12 flex items-center gap-1.5"><Clock size={12}/> 11:00</div>
              <div className="flex-1 font-semibold text-sm text-slate-800 dark:text-slate-200 group-hover:text-[#6366f1] transition-colors">Estudar para a prova</div>
              <div className="px-3 py-1 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">Estudos</div>
            </div>
            <div className="flex items-center gap-4 p-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors group">
              <div className="text-xs font-bold text-slate-400 dark:text-slate-500 w-12 flex items-center gap-1.5"><Clock size={12}/> 14:00</div>
              <div className="flex-1 font-semibold text-sm text-slate-800 dark:text-slate-200 group-hover:text-[#6366f1] transition-colors">Reunião com o time</div>
              <div className="px-3 py-1 text-[10px] font-bold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50">Trabalho</div>
            </div>
            <div className="flex items-center gap-4 p-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors group">
              <div className="text-xs font-bold text-slate-400 dark:text-slate-500 w-12 flex items-center gap-1.5"><Clock size={12}/> 16:00</div>
              <div className="flex-1 font-semibold text-sm text-slate-800 dark:text-slate-200 group-hover:text-[#6366f1] transition-colors">Academia</div>
              <div className="px-3 py-1 text-[10px] font-bold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">Pessoal</div>
            </div>
          </div>
        </div>

        {/* Atalhos Rápidos (1/3 width, 2x2 grid) */}
        <div className="bg-white dark:bg-[#0b101e] rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-white/5 relative overflow-hidden">
          <h2 className="font-bold text-base text-slate-800 dark:text-white mb-6">Atalhos rápidos</h2>
          
          <div className="grid grid-cols-2 gap-3 h-[calc(100%-48px)]">
            <button className="flex flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/5 hover:border-[#3b82f6] dark:hover:border-[#6366f1]/50 transition-all rounded-2xl group">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#111827] shadow-sm flex items-center justify-center text-[#3b82f6] dark:text-[#6366f1] group-hover:scale-110 transition-transform">
                <Plus size={20} />
              </div>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Nova tarefa</span>
            </button>
            <button className="flex flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/5 hover:border-[#3b82f6] dark:hover:border-[#6366f1]/50 transition-all rounded-2xl group">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#111827] shadow-sm flex items-center justify-center text-[#3b82f6] dark:text-[#6366f1] group-hover:scale-110 transition-transform">
                <StickyNote size={20} />
              </div>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Nova nota</span>
            </button>
            <button className="flex flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/5 hover:border-[#3b82f6] dark:hover:border-[#6366f1]/50 transition-all rounded-2xl group">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#111827] shadow-sm flex items-center justify-center text-[#3b82f6] dark:text-[#6366f1] group-hover:scale-110 transition-transform">
                <Banknote size={20} />
              </div>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Adicionar gasto</span>
            </button>
            <button className="flex flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/5 hover:border-[#3b82f6] dark:hover:border-[#6366f1]/50 transition-all rounded-2xl group">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#111827] shadow-sm flex items-center justify-center text-[#3b82f6] dark:text-[#6366f1] group-hover:scale-110 transition-transform">
                <Target size={20} />
              </div>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Nova meta</span>
            </button>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
