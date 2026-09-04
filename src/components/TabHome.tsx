import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, ArrowDownRight, ArrowUpRight, Lightbulb, Bell, Heart, PiggyBank } from 'lucide-react';
import { Transaction, User } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TaskProgressWidget } from './TaskProgressWidget';
import { BalanceStatementModal } from './BalanceStatementModal';
import { NotificationsModal } from './NotificationsModal';

const FINANCIAL_TIPS = [
  "Pague a si mesmo primeiro: reserve uma parte do que ganha assim que receber, antes de pagar as contas.",
  "A regra das 24 horas: para evitar compras por impulso, espere um dia antes de comprar itens não essenciais.",
  "Revise suas assinaturas regularmente e cancele os serviços que você não usa há mais de um mês.",
  "Construa uma reserva de emergência suficiente para cobrir de 3 a 6 meses de seu custo de vida.",
  "O cartão de crédito é uma ferramenta, não uma extensão da sua renda. Evite pagar apenas o rotativo.",
  "Diversifique seus investimentos para reduzir os riscos. Não coloque todos os ovos na mesma cesta.",
  "Pequenos gastos diários (o cafezinho, o lanche) podem somar grandes quantias no fim do ano. Monitore-os.",
  "O melhor dia para começar a investir foi ontem. O segundo melhor é hoje. Aproveite os juros compostos.",
  "Sempre peça desconto em pagamentos à vista. O não você já tem!",
  "A educação financeira é o melhor ativo. Entender para onde vai seu dinheiro é o primeiro passo para a riqueza."
];

interface TabHomeProps {
  transactions: Transaction[];
  goals: any[];
  tasks: any[];
  onTabChange: (tab: any) => void;
  user: User | null;
  onOpenProfile?: () => void;
  onOpenWhatsApp?: () => void;
  latestMentorFeedback?: string | null;
}

export function TabHome({ transactions, goals, tasks, onTabChange, user, onOpenProfile, onOpenWhatsApp, latestMentorFeedback }: TabHomeProps) {
  const [dailyTip, setDailyTip] = useState('');
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  useEffect(() => {
    setDailyTip(FINANCIAL_TIPS[Math.floor(Math.random() * FINANCIAL_TIPS.length)]);
  }, []);
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const balance = totalIncome - totalExpense;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatShortCurrency = (val: number) => {
    if (val >= 1000) return `R$${(val / 1000).toFixed(1)}k`;
    return `R$${val}`;
  };

  const calculateMentorInsight = () => {
    if (!user?.dateOfBirth) return "Sua reserva cresceu 12% este mês. Se mantiver o ritmo, atingirá sua meta em Outubro!";

    const dob = new Date(user.dateOfBirth);
    const ageDiffMs = Date.now() - dob.getTime();
    const ageDate = new Date(ageDiffMs);
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);

    if (age >= 18 && age < 30) {
      return `Como você tem ${age} anos, o poder dos juros compostos é seu maior aliado. Invista na sua educação e em ativos de renda variável de longo prazo!`;
    } else if (age >= 30 && age < 50) {
      return `Você está numa fase crucial aos ${age} anos! Focar na estabilidade financeira e em diversificar investimentos garante uma transição tranquila.`;
    } else if (age >= 50) {
      return `Aos ${age} anos, preservar o patrimônio construído e focar em carteiras de renda fixa robustas pode lhe dar a segurança necessária.`;
    }

    return "Cuidar das finanças desde cedo é a chave para o sucesso. Invista de forma inteligente e construa seu futuro!";
  };

  const mentorInsight = calculateMentorInsight();

  // Charts real data calculation
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  const expenseByCategory = expenseTransactions.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];
  const calculatedExpenseCategories = Object.keys(expenseByCategory).map((key, index) => ({
    name: key,
    value: expenseByCategory[key],
    color: COLORS[index % COLORS.length]
  })).sort((a, b) => b.value - a.value);

  const displayExpenseCategories = calculatedExpenseCategories.length > 0
    ? calculatedExpenseCategories
    : [{ name: 'Sem Despesas', value: 1, color: '#27272a' }];

  const monthlyMap = transactions.reduce((acc, curr) => {
    const date = new Date(curr.date);
    const month = date.toLocaleString('pt-BR', { month: 'short' });
    if (!acc[month]) {
      acc[month] = { name: month.substring(0, 3).toUpperCase(), receitas: 0, despesas: 0 };
    }
    if (curr.type === 'income') acc[month].receitas += curr.amount;
    else acc[month].despesas += curr.amount;
    return acc;
  }, {} as Record<string, { name: string, receitas: number, despesas: number }>);

  const displayMonthlyData = Object.values(monthlyMap);
  if (displayMonthlyData.length === 0) {
    displayMonthlyData.push({ name: 'ATUAL', receitas: 0, despesas: 0 });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto flex flex-col gap-6"
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

      {/* Top Header & AI Insight */}
      <div className="flex flex-col gap-4">

        {/* Mobile Top Header (Hidden on md) */}
        <div className="md:hidden flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <button onClick={onOpenProfile} className="w-12 h-12 bg-[#6366f1] rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                user?.name?.substring(0, 2)?.toUpperCase() || 'US'
              )}
            </button>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-medium">Boa noite,</span>
              <span className="text-slate-800 dark:text-white font-bold text-base leading-tight">{user?.name || 'Usuário'}</span>
            </div>
          </div>
          <button
            onClick={() => setIsNotificationsOpen(true)}
            className="w-10 h-10 bg-slate-100 dark:bg-[#18181b] rounded-[14px] flex items-center justify-center relative shadow-sm"
          >
            <Bell size={20} className="text-[#f59e0b]" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border border-[#18181b]"></span>
          </button>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Boas-vindas, {user?.name.split(' ')[0] || 'Carlos'}</h2>
          <div className="flex gap-2">
            <button
              onClick={() => onTabChange('transactions')}
              className="px-4 py-2 bg-[#10B981] text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors shadow-sm cursor-pointer"
            >
              Nova Transação
            </button>
          </div>
        </div>

        {/* Daily Tip Card */}
        <AnimatePresence>
          {dailyTip && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="hidden md:flex bg-emerald-50 dark:bg-[#121214] border border-emerald-100 dark:border-[#27272a] p-4 rounded-xl gap-3 items-start md:items-center shadow-sm"
            >
              <div className="bg-emerald-100 dark:bg-[#10B981]/10 p-2 rounded-lg text-emerald-600 dark:text-[#10B981] shrink-0">
                <Lightbulb size={20} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-[#10B981] mb-0.5">Dica Financeira do Dia</p>
                <p className="text-sm text-emerald-800 dark:text-slate-200 font-medium leading-relaxed">{dailyTip}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Banner / Visão do Mentor */}
        <div className="hidden md:flex flex-col bg-[#0f111a] dark:bg-white border border-[#1f2231] dark:border-slate-200 p-4 rounded-[24px] text-white dark:text-slate-800 shadow-lg relative overflow-hidden mb-2">
          <div className="flex items-center justify-between mb-3 relative z-10 w-full">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-indigo-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Shield className="text-indigo-400 dark:text-indigo-600" size={16} />
              </div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-sm text-white dark:text-slate-800">Visão do Mentor</p>
                {latestMentorFeedback && (
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 dark:text-indigo-600 px-2 py-0.5 rounded-full font-bold border border-indigo-500/30 animate-pulse">
                    🎯 Última Sessão de Foco
                  </span>
                )}
              </div>
            </div>
            <button className="text-indigo-400 dark:text-indigo-500 hover:text-indigo-300 transition-colors p-1" onClick={() => setDailyTip('Nova dica gerada... (simulado)')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg>
            </button>
          </div>

          <div className="relative z-10 pl-11">
            <div className="flex items-start gap-1.5 mb-1 text-indigo-400 dark:text-indigo-600">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-400 dark:bg-indigo-600 shrink-0"></span>
              <p className="text-xs font-semibold leading-relaxed">
                {latestMentorFeedback ? 'Avaliação da sua Sessão:' : 'Recomendação Estratégica do Mentor:'}
              </p>
            </div>
            <p className="text-[#e2e8f0] dark:text-slate-700 text-xs leading-relaxed ml-3 font-medium">
              {latestMentorFeedback || mentorInsight}
            </p>
          </div>
        </div>

        {/* WhatsApp Integration Card */}
        <div className="bg-emerald-950/40 dark:bg-emerald-900/20 border border-emerald-500/30 dark:border-emerald-500/40 p-4 rounded-[24px] text-white dark:text-slate-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-lg shrink-0">
              💬
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-emerald-400 dark:text-emerald-300">
                  Mentor no WhatsApp
                </h4>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-medium border border-emerald-500/30">
                  Novo
                </span>
              </div>
              <p className="text-xs text-slate-300 dark:text-slate-400 leading-snug">
                Envie áudios ou textos no WhatsApp e insira gastos, receitas e lembretes instantaneamente no app.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenWhatsApp}
            className="w-full md:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <span>Conectar WhatsApp</span>
          </button>
        </div>
      </div>

      {/* Mobile Unified Balance Card (Hidden on md) */}
      <div
        className="md:hidden bg-gradient-to-br from-[#6366f1] to-[#4f46e5] rounded-[24px] p-5 text-white shadow-lg relative overflow-hidden mb-4 cursor-pointer"
        onClick={() => setIsStatementModalOpen(true)}
      >
        <div className="flex justify-between items-center mb-4 relative z-10">
          <p className="text-white/80 text-xs font-semibold flex items-center gap-1.5">
            Saldo Disponível
          </p>
          <span className="bg-white/20 text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full backdrop-blur-sm">Mentor</span>
        </div>
        <p className="text-3xl font-black mb-4 tracking-tight relative z-10">{formatCurrency(balance)}</p>

        <div className="flex bg-black/20 rounded-xl p-3 backdrop-blur-md relative z-10">
          <div className="flex-1 border-r border-white/10">
            <p className="text-white/70 text-[9px] font-bold uppercase tracking-wider mb-0.5">Receitas</p>
            <p className="font-bold text-sm">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="flex-1 pl-4">
            <p className="text-white/70 text-[9px] font-bold uppercase tracking-wider mb-0.5">Despesas</p>
            <p className="font-bold text-sm text-rose-300">{formatCurrency(totalExpense)}</p>
          </div>
        </div>

        {/* Background decorative elements */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#4f46e5] rounded-full blur-2xl"></div>
      </div>

      {/* Desktop Quick Stats Grid & Tasks */}
      <div className="hidden md:grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div
          className="lg:col-span-1 bg-white dark:bg-gradient-to-br dark:from-[#18181b] dark:to-[#09090b] p-8 rounded-[24px] border border-slate-200 dark:border-[#27272a]/80 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)] flex flex-col justify-center transition-all hover:-translate-y-1 relative overflow-hidden backdrop-blur-md group cursor-pointer h-[320px]"
          onClick={() => setIsStatementModalOpen(true)}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-[#10B981]/0 via-transparent to-[#10B981]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          <p className="text-slate-500 dark:text-[#afafaf] text-sm font-bold uppercase tracking-wider mb-4 relative z-10">Saldo Total</p>
          <p className="text-4xl font-black text-slate-800 dark:text-white drop-shadow-sm relative z-10">{formatCurrency(balance)}</p>
          <div className="mt-4 text-xs text-[#10B981] font-bold tracking-wide relative z-10">+R$ 1.200,00 este mês</div>
        </div>

        <div className="lg:col-span-1 flex flex-col gap-6 h-[320px]">
          <div className="flex-1 bg-white dark:bg-gradient-to-br dark:from-[#18181b] dark:to-[#09090b] p-6 rounded-[24px] border border-slate-200 dark:border-[#27272a]/80 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)] flex flex-col justify-center transition-all hover:-translate-y-1 relative overflow-hidden backdrop-blur-md group">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#10B981]/0 via-transparent to-[#10B981]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
            <p className="text-slate-500 dark:text-[#afafaf] text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 relative z-10">
              Receitas
              <ArrowUpRight size={14} className="text-[#10B981]" />
            </p>
            <p className="text-2xl font-black text-[#10B981] drop-shadow-sm relative z-10">{formatCurrency(totalIncome)}</p>
            <div className="mt-2 flex h-1.5 w-full bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800 relative z-10">
              <div className="h-full bg-gradient-to-r from-[#10B981]/50 to-[#10B981] w-4/5 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
            </div>
          </div>

          <div className="flex-1 bg-white dark:bg-gradient-to-br dark:from-[#18181b] dark:to-[#09090b] p-6 rounded-[24px] border border-slate-200 dark:border-[#27272a]/80 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)] flex flex-col justify-center transition-all hover:-translate-y-1 relative overflow-hidden backdrop-blur-md group">
            <div className="absolute inset-0 bg-gradient-to-tr from-rose-500/0 via-transparent to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
            <p className="text-slate-500 dark:text-[#afafaf] text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 relative z-10">
              Despesas
              <ArrowDownRight size={14} className="text-rose-500" />
            </p>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 drop-shadow-sm relative z-10">{formatCurrency(totalExpense)}</p>
            <div className="mt-2 flex h-1.5 w-full bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800 relative z-10">
              <div className="h-full bg-gradient-to-r from-rose-500/50 to-rose-500 w-2/5 shadow-[0_0_10px_rgba(244,63,94,0.5)]"></div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 h-[320px]">
          <TaskProgressWidget tasks={tasks} onNavigate={() => onTabChange('tasks')} />
        </div>
      </div>

      {/* Mobile Tasks List (Hidden on md) */}
      <div className="md:hidden mt-2 mb-8 px-1">
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-800/50 pb-2">
          <h3 className="font-bold text-sm text-slate-800 dark:text-white tracking-wide">Tarefas do Dia</h3>
          <span onClick={() => onTabChange('tasks')} className="text-[10px] font-bold text-blue-500 cursor-pointer">Organizar</span>
        </div>

        <div className="flex flex-col gap-5 mb-8">
          {tasks.filter(t => !t.completed).slice(0, 2).map((task) => (
            <div key={task.id} className="flex items-start gap-4">
              <div className="mt-1 w-1 h-8 rounded-full bg-slate-200 dark:bg-slate-700 relative">
                <div className={`absolute top-0 left-0 w-full rounded-full ${task.priority === 'high' ? 'h-full bg-red-400' : task.priority === 'medium' ? 'h-1/2 bg-amber-400' : 'h-1/3 bg-blue-400'}`}></div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">{task.title}</p>
                <p className={`text-[10px] font-semibold ${task.priority === 'high' ? 'text-red-500' : task.priority === 'medium' ? 'text-amber-500' : 'text-blue-500'}`}>
                  Prioridade {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'} • Vence em: {task.deadline}
                </p>
              </div>
            </div>
          ))}
          {tasks.filter(t => !t.completed).length === 0 && (
            <div className="text-center py-4 bg-slate-50 dark:bg-[#121214] border border-dashed border-slate-200 dark:border-[#27272a] rounded-2xl">
              <p className="text-xs text-slate-500 font-medium">Você concluiu tudo! 🎉</p>
            </div>
          )}
        </div>

        {/* Compact AI Banner / Visão do Mentor */}
        <div className="bg-[#0f111a] dark:bg-white border border-slate-800 dark:border-slate-200 p-3 rounded-[16px] text-white dark:text-slate-800 shadow-lg relative overflow-hidden mb-6">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 dark:bg-indigo-100 dark:text-indigo-600 flex items-center justify-center">
                <Shield size={10} />
              </div>
              <span className="text-[11px] font-bold tracking-wide">Visão do Mentor</span>
              {latestMentorFeedback && (
                <span className="text-[8px] bg-indigo-500/20 text-indigo-300 dark:text-indigo-600 px-1.5 py-0.5 rounded-full font-bold border border-indigo-500/30 animate-pulse">
                  🎯 Foco Recente
                </span>
              )}
            </div>
            <button className="text-indigo-400 dark:text-indigo-500 hover:opacity-80 transition-opacity">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
            </button>
          </div>

          <div className="bg-white/5 dark:bg-slate-100 rounded-md p-2">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
              <span className="text-[9px] font-bold text-indigo-400 dark:text-indigo-600">
                {latestMentorFeedback ? 'Avaliação da Sessão:' : 'Recomendação Estratégica do Mentor:'}
              </span>
            </div>
            <p className="text-[10px] text-slate-200 dark:text-slate-700 pl-3 leading-tight font-medium">
              {latestMentorFeedback || "Configure as notificações PWA para receber orientações do Mentor."}
            </p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          onClick={() => onTabChange('reports')}
          className="bg-white dark:bg-gradient-to-br dark:from-[#18181b] dark:to-[#09090b] p-7 rounded-[24px] border border-slate-200 dark:border-[#27272a]/80 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)] flex-col transition-all relative overflow-hidden backdrop-blur-md cursor-pointer hover:border-[#10B981]/50 group flex h-[380px]"
        >
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-6 uppercase tracking-wider text-[11px] relative z-10 group-hover:text-[#10B981] transition-colors">Receitas vs Despesas (Mensal)</h3>
          <div className="flex-1 w-full relative z-10 pointer-events-none">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayMonthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#afafaf', fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#afafaf', fontWeight: 600 }} tickFormatter={formatShortCurrency} />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                  contentStyle={{ borderRadius: '16px', border: '1px solid #27272a', backgroundColor: '#121214', color: '#fff', boxShadow: '0 20px 40px rgba(0,0,0,0.8)' }}
                  formatter={(value: number) => [formatCurrency(value), undefined]}
                />
                <Bar dataKey="receitas" name="Receitas" fill="#10B981" radius={[4, 4, 0, 0]} barSize={24} />
                <Bar dataKey="despesas" name="Despesas" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div
          onClick={() => onTabChange('reports')}
          className="bg-white dark:bg-[#0f111a] border border-slate-100 dark:border-[#1f2231] p-6 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-none flex flex-col transition-all relative overflow-hidden backdrop-blur-md cursor-pointer hover:border-[#10B981]/50 group mb-6 md:mb-0 h-[380px]"
        >
          <div className="hidden dark:block absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          <div className="flex justify-between items-center mb-10 relative z-10">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white tracking-wide">Distribuição de Despesas</h3>
          </div>

          <div className="flex-1 w-full flex items-center justify-between pointer-events-none relative z-10">

            <div className="relative w-1/2 h-full flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={displayExpenseCategories}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {displayExpenseCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#18181b', color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] text-slate-400 font-bold mb-1">Total</span>
                <span className="text-sm font-black text-slate-800 dark:text-white">{formatShortCurrency(totalExpense)}</span>
              </div>
            </div>

            {/* Custom Legend */}
            <div className="flex flex-col gap-4 w-1/2 pl-6 overflow-y-auto max-h-[220px] custom-scrollbar pointer-events-auto">
              {displayExpenseCategories.length > 0 && calculatedExpenseCategories.map((cat, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }}></div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                    {cat.name} <span className="font-bold block text-slate-800 dark:text-white">{formatShortCurrency(cat.value)}</span>
                  </p>
                </div>
              ))}
              {calculatedExpenseCategories.length === 0 && (
                <div className="text-[11px] text-slate-400">Nenhuma despesa</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Goals Horizontal List (Hidden on md) */}
      <div className="md:hidden mt-2 mb-6">
        <div className="flex justify-between items-center mb-4 px-1">
          <h3 className="font-bold text-sm text-slate-800 dark:text-white tracking-wide">Caixinhas de Metas</h3>
          <span onClick={() => onTabChange('goals')} className="text-[10px] font-bold text-blue-500 cursor-pointer">Ver todas</span>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x" style={{ scrollbarWidth: 'none' }}>
          {goals.length > 0 ? goals.map((goal, i) => {
            const percent = goal.targetAmount > 0
              ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
              : 0;
            const isCompleted = percent >= 100;
            const progressColor = isCompleted ? 'bg-emerald-400' : (i % 2 === 0 ? 'bg-yellow-400' : 'bg-orange-400');

            return (
              <div key={goal.id} className="bg-white dark:bg-[#0f111a] border border-slate-100 dark:border-[#1f2231] min-w-[160px] p-4 rounded-[24px] snap-center shrink-0 shadow-sm relative overflow-hidden">
                <div className={`absolute top-0 right-8 w-4 h-1 ${progressColor} rounded-full mt-4`}></div>
                <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-[#18181b] border border-slate-100 dark:border-[#27272a] flex items-center justify-center mb-4 text-xl">
                  {goal.icon || '🎯'}
                </div>
                <p className="text-slate-800 dark:text-white font-bold text-sm mb-4 truncate">{goal.title}</p>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mb-1">
                  <div className={`h-full ${progressColor} rounded-full`} style={{ width: `${percent}%` }}></div>
                </div>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 mb-4 font-bold">{percent}% da meta</p>

                <p className="text-[10px] text-slate-600 dark:text-slate-300 font-bold tracking-wide mb-3">Aportado {formatShortCurrency(goal.currentAmount)}</p>
                <div className="flex justify-center">
                  <span className="text-[10px] font-bold text-blue-500 cursor-pointer">Aportar</span>
                </div>
              </div>
            );
          }) : (
            <div className="bg-white dark:bg-[#0f111a] border border-slate-100 dark:border-[#1f2231] min-w-[160px] p-4 rounded-[24px] flex items-center justify-center snap-center shrink-0 shadow-sm opacity-80 dark:opacity-50">
              <p className="text-xs text-slate-400 font-medium tracking-wide">Nenhuma meta ativa</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
