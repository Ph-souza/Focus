import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Transaction, User, Rotina } from '../types';
import { Bot, Target, ChevronRight, Plus, FileText, Wallet, Calendar, Bell } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface TabHomeProps {
  transactions: Transaction[];
  tasks: any[];
  rotinas: Rotina[];
  onTabChange: (tab: any) => void;
  user: User | null;
  onOpenProfile?: () => void;
  onOpenWhatsApp?: () => void;
  latestMentorFeedback?: string | null;
}

export function TabHome({ transactions, tasks, rotinas, onTabChange, user, latestMentorFeedback }: TabHomeProps) {
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Bom dia');
    else if (hour < 18) setGreeting('Boa tarde');
    else setGreeting('Boa noite');
  }, []);

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const completedTasks = tasks.filter(t => t.completed).length;
  const pendingTasks = tasks.filter(t => !t.completed).length;
  const totalTasks = tasks.length || 1; // avoid division by zero
  const progressPercent = Math.round((completedTasks / totalTasks) * 100);

  const chartData = [
    { name: 'Concluídas', value: completedTasks, color: '#3b82f6' },
    { name: 'Pendentes', value: pendingTasks, color: '#e2e8f0' },
  ];

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(date);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto flex flex-col gap-6 px-4 md:px-8 py-6"
    >
      {/* Header */}
      <div className="flex justify-between items-end mb-2">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {greeting}, {user?.name?.split(' ')[0] || 'Usuário'} <span className="text-2xl">👋</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Disciplina hoje, grandes resultados amanhã.</p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium capitalize">{formatDate(new Date())}</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 italic">"Pequenas ações diárias constroem grandes conquistas."</p>
        </div>
      </div>

      {/* Top Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 1. Resumo de Hoje */}
        <div className="bg-white dark:bg-white/5 backdrop-blur-md rounded-[24px] p-6 shadow-sm border border-slate-200 dark:border-white/10 flex flex-col justify-between group">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-sm text-slate-800 dark:text-slate-200">Resumo de Hoje</h2>
            <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 transition-colors">
              <Bell size={16} />
            </button>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={45}
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
                <span className="text-xl font-bold text-slate-800 dark:text-white">{progressPercent}%</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 text-xs font-medium">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>{completedTasks} concluídas</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                <span>{pendingTasks} pendentes</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>0 em atraso</span>
              </div>
            </div>
          </div>

          <button onClick={() => onTabChange('agenda')} className="mt-6 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors flex items-center gap-1">
            Ver agenda <ChevronRight size={14} />
          </button>
        </div>

        {/* 2. Saldo Disponível */}
        <div className="bg-white dark:bg-white/5 backdrop-blur-md rounded-[24px] p-6 shadow-sm border border-slate-200 dark:border-white/10 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute bottom-0 right-0 w-full h-24 opacity-20 pointer-events-none">
            {/* Soft wave/chart placeholder in background */}
            <svg viewBox="0 0 400 100" preserveAspectRatio="none" className="w-full h-full fill-blue-500">
              <path d="M0,100 C150,0 250,80 400,20 L400,100 L0,100 Z" />
            </svg>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4 relative z-10">
              <h2 className="font-bold text-sm text-slate-800 dark:text-slate-200">Saldo disponível</h2>
              <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 transition-colors">
                <Target size={16} />
              </button>
            </div>
            
            <div className="relative z-10">
              <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                R$ {balance.toFixed(2).replace('.', ',')}
              </h3>
              <div className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-md text-[11px] font-bold">
                <ArrowUpRight size={12} strokeWidth={3} />
                + 12% este mês
              </div>
            </div>
          </div>

          <button onClick={() => onTabChange('finance')} className="mt-8 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors flex items-center gap-1 relative z-10 text-right justify-end w-full">
            Ver finanças <ChevronRight size={14} />
          </button>
        </div>

        {/* 3. Insight do Mentor */}
        <div className="bg-[#f0f9ff] dark:bg-[#0a1128] border border-blue-100 dark:border-blue-900/50 rounded-[24px] p-6 shadow-sm relative overflow-hidden flex flex-col justify-between group">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-400/20 dark:bg-blue-600/20 rounded-full blur-3xl group-hover:bg-blue-400/30 dark:group-hover:bg-blue-600/30 transition-all duration-500 pointer-events-none"></div>
          
          <div>
            <div className="flex items-center gap-2 mb-4 relative z-10">
              <Bot size={18} className="text-blue-600 dark:text-blue-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Insight do Mentor</h3>
            </div>
            
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium relative z-10 italic">
              "Consistência vence motivação. Faça o que precisa ser feito, mesmo quando não parecer fácil."
            </p>
          </div>
          
          <button onClick={() => onTabChange('chat')} className="w-full mt-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center shadow-md shadow-blue-600/20 transition-all relative z-10 active:scale-[0.98]">
            Perguntar ao Mentor
          </button>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Próximas Atividades */}
        <div className="bg-white dark:bg-white/5 backdrop-blur-md rounded-[24px] p-6 shadow-sm border border-slate-200 dark:border-white/10 flex flex-col group">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-sm text-slate-800 dark:text-slate-200">Próximas atividades</h2>
            <button onClick={() => onTabChange('agenda')} className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors flex items-center gap-1">
              Ver todas <ChevronRight size={14} />
            </button>
          </div>

          <div className="flex flex-col gap-1">
            {/* Static list based on mockup for visualization */}
            {[
              { time: '09:00', title: 'Revisão do projeto', tag: 'Trabalho', tagColor: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' },
              { time: '11:00', title: 'Estudo de inglês', tag: 'Estudos', tagColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400' },
              { time: '14:00', title: 'Academia', tag: 'Pessoal', tagColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' },
              { time: '16:00', title: 'Planejamento semanal', tag: 'Pessoal', tagColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' },
            ].map((act, i) => (
              <div key={i} className="flex items-center gap-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl px-2 transition-colors cursor-pointer border-b border-slate-100 dark:border-white/5 last:border-0">
                <div className="flex items-center gap-2 min-w-[60px]">
                  <div className="w-1.5 h-1.5 rounded-full border border-slate-400 dark:border-slate-500"></div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{act.time}</span>
                </div>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200 flex-1 truncate">{act.title}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${act.tagColor}`}>
                  {act.tag}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Atalhos rápidos */}
        <div className="bg-white dark:bg-white/5 backdrop-blur-md rounded-[24px] p-6 shadow-sm border border-slate-200 dark:border-white/10 flex flex-col group">
          <h2 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-6">Atalhos rápidos</h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 h-full">
            <button onClick={() => onTabChange('tasks')} className="flex flex-col items-center justify-center gap-3 p-4 bg-slate-50 dark:bg-[#121216] border border-slate-100 dark:border-zinc-800/80 rounded-[16px] hover:border-blue-500 dark:hover:border-blue-500/50 transition-all group/btn active:scale-95">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                <Check size={18} strokeWidth={2.5} />
              </div>
              <div className="text-center">
                <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">Nova tarefa</span>
                <span className="block text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">Criar agora</span>
              </div>
            </button>
            
            <button className="flex flex-col items-center justify-center gap-3 p-4 bg-slate-50 dark:bg-[#121216] border border-slate-100 dark:border-zinc-800/80 rounded-[16px] hover:border-blue-500 dark:hover:border-blue-500/50 transition-all group/btn active:scale-95">
              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                <FileText size={18} strokeWidth={2.5} />
              </div>
              <div className="text-center">
                <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">Nova nota</span>
                <span className="block text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">Registrar ideia</span>
              </div>
            </button>
            
            <button onClick={() => onTabChange('finance')} className="flex flex-col items-center justify-center gap-3 p-4 bg-slate-50 dark:bg-[#121216] border border-slate-100 dark:border-zinc-800/80 rounded-[16px] hover:border-blue-500 dark:hover:border-blue-500/50 transition-all group/btn active:scale-95">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                <Wallet size={18} strokeWidth={2.5} />
              </div>
              <div className="text-center">
                <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">Adicionar gasto</span>
                <span className="block text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">Controlar finanças</span>
              </div>
            </button>
            
            <button onClick={() => onTabChange('finance')} className="flex flex-col items-center justify-center gap-3 p-4 bg-slate-50 dark:bg-[#121216] border border-slate-100 dark:border-zinc-800/80 rounded-[16px] hover:border-blue-500 dark:hover:border-blue-500/50 transition-all group/btn active:scale-95">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                <Target size={18} strokeWidth={2.5} />
              </div>
              <div className="text-center">
                <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">Nova meta</span>
                <span className="block text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">Definir objetivo</span>
              </div>
            </button>
          </div>
        </div>
      </div>
      
    </motion.div>
  );
}
