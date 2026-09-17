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
              className="w-10 h-10 rounded-full bg-white/70 dark:bg-slate-950/40 backdrop-blur-xl border border-slate-200/60 dark:border-blue-500/20 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-900 transition-colors shadow-sm"
            >
              <Bell size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Top Grid (3 columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Resumo de Hoje */}
        <div className="bg-white/70 dark:bg-slate-950/40 backdrop-blur-xl border border-slate-200/60 dark:border-blue-500/20 shadow-[0_10px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent to-blue-500/5 pointer-events-none"></div>
          <div className="flex justify-between items-center mb-6 relative z-10">
            <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              Resumo de Hoje
            </h2>
            <button className="text-slate-400 hover:text-blue-500 transition-colors"><Bell size={16}/></button>
          </div>
          
          <div className="flex items-center gap-6 relative z-10">
            {/* Circular Progress */}
            <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="10" className="text-slate-200/60 dark:text-slate-800" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="10" strokeDasharray="283" strokeDashoffset={strokeDashoffset} strokeLinecap="round" className="text-blue-600 dark:text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)] transition-all duration-1000 ease-out" />
              </svg>
              <span className="absolute text-xl font-black text-slate-900 dark:text-white">{progressPercent}%</span>
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
                <span>{completedTasks} concluídas</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"></span>
                <span>{pendingTasks} pendentes</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>0 em atraso</span>
              </div>
            </div>
          </div>
          <div className="mt-6 text-right relative z-10">
            <button onClick={() => onTabChange('calendar')} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 justify-end w-full">
              Ver agenda <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Card 2: Saldo disponível */}
        <div className="bg-white/70 dark:bg-slate-950/40 backdrop-blur-xl border border-slate-200/60 dark:border-blue-500/20 shadow-[0_10px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-3xl p-6 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-2 relative z-10">
            <h2 className="font-bold text-sm text-slate-700 dark:text-slate-300">Saldo disponível</h2>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Banknote size={16} />
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">R$ {balance.toFixed(2).replace('.', ',')}</h3>
            <div className="flex items-center gap-1 mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 w-max px-2.5 py-1 rounded-lg">
              <ArrowUpRight size={14} />
              <span>12% este mês</span>
            </div>
          </div>
          
          {/* Sparkline Graph */}
          <div className="h-16 mt-4 flex items-end gap-1.5 relative z-10 opacity-90">
            {[30, 45, 25, 60, 40, 75, 50, 85, 65, 95].map((h, i) => (
              <div key={i} className="flex-1 bg-blue-500/20 dark:bg-blue-500/30 hover:bg-blue-500 dark:hover:bg-blue-400 rounded-t-sm transition-all shadow-[0_0_8px_rgba(59,130,246,0.2)]" style={{ height: `${h}%` }}></div>
            ))}
          </div>

          <div className="mt-4 text-right relative z-10">
            <button onClick={() => onTabChange('finances')} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 justify-end w-full">
              Ver finanças <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Card 3: Insight do Mentor */}
        <div className="bg-white/70 dark:bg-slate-950/40 backdrop-blur-xl border border-slate-200/60 dark:border-blue-500/20 shadow-[0_10px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-3xl p-6 relative overflow-hidden group flex flex-col justify-between">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
          
          <div>
            <div className="flex items-center gap-2 mb-4 relative z-10">
              <div className="w-8 h-8 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                <Bot size={16} />
              </div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">Insight do Mentor</h2>
            </div>
            
            <p className="text-[13px] text-slate-700 dark:text-slate-200 leading-relaxed font-medium relative z-10 mb-6 italic">
              {latestMentorFeedback || '"Consistência vence motivação. Faça o que precisa ser feito, mesmo quando não parecer fácil."'}
            </p>
          </div>

          <div className="relative z-10 mt-auto">
            <button 
              onClick={() => onTabChange('chat')} 
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.5)] hover:shadow-[0_0_25px_rgba(59,130,246,0.7)] transition-all active:scale-[0.98]"
            >
              Perguntar ao Mentor <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Grid (2 columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Próximas Atividades (2/3 width) */}
        <div className="lg:col-span-2 bg-white/70 dark:bg-slate-950/40 backdrop-blur-xl border border-slate-200/60 dark:border-blue-500/20 shadow-[0_10px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-3xl p-6 relative overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-base text-slate-900 dark:text-white">Próximas atividades</h2>
            <button onClick={() => onTabChange('calendar')} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
              Ver todas <ArrowRight size={14} />
            </button>
          </div>
          
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-4 p-3.5 hover:bg-white/50 dark:hover:bg-blue-500/10 rounded-2xl transition-colors border border-transparent hover:border-slate-200/40 dark:hover:border-blue-500/20 group">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 w-12 flex items-center gap-1.5"><Clock size={12}/> 09:00</div>
              <div className="flex-1 font-semibold text-sm text-slate-800 dark:text-slate-100 group-hover:text-blue-500 transition-colors">Revisar proposta do projeto</div>
              <div className="px-3 py-1 text-[10px] font-bold rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">Trabalho</div>
            </div>
            <div className="flex items-center gap-4 p-3.5 hover:bg-white/50 dark:hover:bg-blue-500/10 rounded-2xl transition-colors border border-transparent hover:border-slate-200/40 dark:hover:border-blue-500/20 group">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 w-12 flex items-center gap-1.5"><Clock size={12}/> 11:00</div>
              <div className="flex-1 font-semibold text-sm text-slate-800 dark:text-slate-100 group-hover:text-blue-500 transition-colors">Estudar para a prova</div>
              <div className="px-3 py-1 text-[10px] font-bold rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">Estudos</div>
            </div>
            <div className="flex items-center gap-4 p-3.5 hover:bg-white/50 dark:hover:bg-blue-500/10 rounded-2xl transition-colors border border-transparent hover:border-slate-200/40 dark:hover:border-blue-500/20 group">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 w-12 flex items-center gap-1.5"><Clock size={12}/> 14:00</div>
              <div className="flex-1 font-semibold text-sm text-slate-800 dark:text-slate-100 group-hover:text-blue-500 transition-colors">Reunião com o time</div>
              <div className="px-3 py-1 text-[10px] font-bold rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">Trabalho</div>
            </div>
            <div className="flex items-center gap-4 p-3.5 hover:bg-white/50 dark:hover:bg-blue-500/10 rounded-2xl transition-colors border border-transparent hover:border-slate-200/40 dark:hover:border-blue-500/20 group">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 w-12 flex items-center gap-1.5"><Clock size={12}/> 16:00</div>
              <div className="flex-1 font-semibold text-sm text-slate-800 dark:text-slate-100 group-hover:text-blue-500 transition-colors">Academia</div>
              <div className="px-3 py-1 text-[10px] font-bold rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">Pessoal</div>
            </div>
          </div>
        </div>

        {/* Atalhos Rápidos (1/3 width, 2x2 grid) */}
        <div className="bg-white/70 dark:bg-slate-950/40 backdrop-blur-xl border border-slate-200/60 dark:border-blue-500/20 shadow-[0_10px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-3xl p-6 relative overflow-hidden">
          <h2 className="font-bold text-base text-slate-900 dark:text-white mb-6">Atalhos rápidos</h2>
          
          <div className="grid grid-cols-2 gap-3 h-[calc(100%-48px)]">
            <button className="flex flex-col items-center justify-center gap-3 bg-white/40 dark:bg-slate-900/40 hover:bg-white/80 dark:hover:bg-blue-950/40 border border-slate-200/50 dark:border-blue-500/20 hover:border-blue-500/50 dark:hover:border-blue-400/50 transition-all rounded-2xl group p-4 shadow-sm">
              <div className="w-11 h-11 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 shadow-sm flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all">
                <Plus size={20} />
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Nova tarefa</span>
            </button>
            <button className="flex flex-col items-center justify-center gap-3 bg-white/40 dark:bg-slate-900/40 hover:bg-white/80 dark:hover:bg-blue-950/40 border border-slate-200/50 dark:border-blue-500/20 hover:border-blue-500/50 dark:hover:border-blue-400/50 transition-all rounded-2xl group p-4 shadow-sm">
              <div className="w-11 h-11 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 shadow-sm flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all">
                <StickyNote size={20} />
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Nova nota</span>
            </button>
            <button className="flex flex-col items-center justify-center gap-3 bg-white/40 dark:bg-slate-900/40 hover:bg-white/80 dark:hover:bg-blue-950/40 border border-slate-200/50 dark:border-blue-500/20 hover:border-blue-500/50 dark:hover:border-blue-400/50 transition-all rounded-2xl group p-4 shadow-sm">
              <div className="w-11 h-11 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 shadow-sm flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all">
                <Banknote size={20} />
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Adicionar gasto</span>
            </button>
            <button className="flex flex-col items-center justify-center gap-3 bg-white/40 dark:bg-slate-900/40 hover:bg-white/80 dark:hover:bg-blue-950/40 border border-slate-200/50 dark:border-blue-500/20 hover:border-blue-500/50 dark:hover:border-blue-400/50 transition-all rounded-2xl group p-4 shadow-sm">
              <div className="w-11 h-11 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 shadow-sm flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all">
                <Target size={20} />
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Nova meta</span>
            </button>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
