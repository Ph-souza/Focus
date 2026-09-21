import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { Transaction, User, Rotina, Task } from '../types';
import { 
  Bell, 
  Bot, 
  ArrowRight, 
  ArrowUpRight, 
  ArrowUp,
  ArrowDown,
  Clock, 
  Plus, 
  StickyNote, 
  Banknote, 
  Target, 
  ChevronRight,
  Calendar,
  BarChart3,
  Trophy,
  MessageSquare,
  CircleDot,
  Circle,
  Pin,
  Trash2,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { BalanceStatementModal } from './BalanceStatementModal';
import { NotificationsModal } from './NotificationsModal';

interface DailyNote {
  id: string;
  texto: string;
  date: string;
}

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

export function TabHome({ transactions, tasks, rotinas = [], onTabChange, user, onOpenProfile, latestMentorFeedback }: TabHomeProps) {
  const [greeting, setGreeting] = useState('');
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Integração com fluxo de Notas / Avisos do Dia
  const [dailyNotes, setDailyNotes] = useState<DailyNote[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_calendar_daily_notes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isAddingNotice, setIsAddingNotice] = useState(false);
  const [newNoticeText, setNewNoticeText] = useState('');

  const todayDateStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const saved = localStorage.getItem('nexus_calendar_daily_notes');
        if (saved) setDailyNotes(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // 3 últimas notas criadas para o dia atual
  const todayNotes = useMemo(() => {
    return dailyNotes.filter(n => n.date === todayDateStr).slice(0, 3);
  }, [dailyNotes, todayDateStr]);

  // 5 próximas atividades mais recentes (limitadas rigidamente a 5 na query do Firestore)
  const recentActivities = useMemo(() => {
    return rotinas.slice(0, 5);
  }, [rotinas]);

  const handleAddNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoticeText.trim()) return;
    const newNote: DailyNote = {
      id: `notice-${Date.now()}`,
      texto: newNoticeText.trim(),
      date: todayDateStr
    };
    const updated = [newNote, ...dailyNotes];
    setDailyNotes(updated);
    try {
      localStorage.setItem('nexus_calendar_daily_notes', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
    setNewNoticeText('');
    setIsAddingNotice(false);
  };

  const handleDeleteNotice = (id: string) => {
    const updated = dailyNotes.filter(n => n.id !== id);
    setDailyNotes(updated);
    try {
      localStorage.setItem('nexus_calendar_daily_notes', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Bom dia');
    else if (hour < 18) setGreeting('Boa tarde');
    else setGreeting('Boa noite');
  }, []);

  const totalIncome = transactions.filter(t => t.type === 'income' || t.type === 'receita').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense' || t.type === 'despesa' || t.type === 'investimento_meta').reduce((acc, t) => acc + t.amount, 0);
  const balance = totalIncome - totalExpense;

  // Cálculo MoM para Saldo
  const balanceMoM = useMemo(() => {
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

    const curTx = transactions.filter(t => t.date && t.date.startsWith(currentMonthKey));
    const prvTx = transactions.filter(t => t.date && t.date.startsWith(prevMonthKey));

    const curInc = curTx.filter(t => t.type === 'income' || t.type === 'receita').reduce((acc, t) => acc + t.amount, 0);
    const curExp = curTx.filter(t => t.type === 'expense' || t.type === 'despesa' || t.type === 'investimento_meta').reduce((acc, t) => acc + t.amount, 0);
    const curBal = curInc - curExp;

    const prvInc = prvTx.filter(t => t.type === 'income' || t.type === 'receita').reduce((acc, t) => acc + t.amount, 0);
    const prvExp = prvTx.filter(t => t.type === 'expense' || t.type === 'despesa' || t.type === 'investimento_meta').reduce((acc, t) => acc + t.amount, 0);
    const prvBal = prvInc - prvExp;

    if (prvBal === 0) {
      if (curBal > 0) return 100;
      if (curBal < 0) return -100;
      return 0;
    }
    return Math.round(((curBal - prvBal) / Math.abs(prvBal)) * 100);
  }, [transactions]);

  const pendingTasks = tasks.filter(t => !t.completed).length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = pendingTasks + completedTasks || 1;
  const progressPercent = Math.round((completedTasks / totalTasks) * 100);
  const strokeDashoffset = 251.2 - (251.2 * progressPercent) / 100;

  const todayStr = new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

  // Card Otimizado: Resumo de Hoje com metade da largura (do tamanho do Saldo Disponível) e 2 colunas internas
  const renderResumoDeHojeCards = () => (
    <div className="glass-card p-5 w-full lg:max-w-[calc(50%-12px)] mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
        
        {/* Coluna 1 (Esquerda) — Progresso */}
        <div className="flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">Resumo de Hoje</h3>
            <div className="flex items-center gap-4 mb-2">
              {/* Timer Circular de Progresso Compacto */}
              <div className="w-14 h-14 rounded-full border-[3.5px] border-blue-500 flex items-center justify-center font-bold text-sm text-slate-700 dark:text-slate-200 shadow-inner shrink-0">
                {progressPercent}%
              </div>
              {/* Legendas */}
              <div className="flex flex-col gap-1 text-[11px] text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500"></div> {completedTasks} concluídas</span>
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-400"></div> {pendingTasks} pendentes</span>
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500"></div> 0 em atraso</span>
              </div>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => onTabChange('calendar')}
            className="text-blue-500 text-xs font-medium hover:text-blue-600 flex items-center gap-1 mt-3 transition-colors cursor-pointer w-max"
          >
            Ver agenda <span>→</span>
          </button>
        </div>

        {/* Coluna 2 (Direita) — Avisos de Hoje (com borda divisória sutil) */}
        <div className="flex flex-col border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-700 pt-3 sm:pt-0 sm:pl-4 justify-between">
          <div>
            <div className="flex justify-between items-center mb-2.5">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <span className="text-yellow-500 text-xs">📌</span> Avisos de Hoje
              </h3>
              <button 
                type="button"
                onClick={() => setIsAddingNotice(prev => !prev)}
                className="bg-blue-50 dark:bg-blue-500/10 text-blue-500 p-1 rounded-md hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors cursor-pointer"
                title="Adicionar aviso"
                aria-label="Adicionar aviso"
              >
                <Plus size={15} />
              </button>
            </div>

            {/* Input inline para novo aviso rápido */}
            {isAddingNotice && (
              <form onSubmit={handleAddNotice} className="mb-2 flex items-center gap-1">
                <input 
                  type="text"
                  value={newNoticeText}
                  onChange={(e) => setNewNoticeText(e.target.value)}
                  placeholder="Novo aviso rápido..."
                  autoFocus
                  className="flex-1 text-[11px] px-2 py-1 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-blue-500/40 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button 
                  type="submit" 
                  disabled={!newNoticeText.trim()}
                  className="px-2 py-1 text-[11px] font-bold bg-blue-600 text-white rounded-lg disabled:opacity-50 transition-opacity cursor-pointer"
                >
                  Salvar
                </button>
              </form>
            )}

            {todayNotes.length > 0 ? (
              <ul className="space-y-1">
                {todayNotes.map((nota) => (
                  <li 
                    key={nota.id}
                    className="flex items-center justify-between gap-1.5 px-2 py-1 rounded-lg bg-white/40 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 text-[11px] text-slate-700 dark:text-slate-300 group"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0"></span>
                      <span className="truncate leading-tight font-medium">{nota.texto}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteNotice(nota.id)}
                      className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 cursor-pointer"
                      title="Apagar aviso"
                    >
                      <Trash2 size={11} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="h-full min-h-[58px] flex items-center justify-center text-slate-400 italic text-[11px] text-center bg-slate-50/50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 px-2.5 py-2">
                Nenhum aviso para hoje
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4 md:gap-6 p-0 md:p-8"
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

      {/* ========================================================= */}
      {/* MOBILE VIEW (Strictly matching the new Mobile UI Mockup)  */}
      {/* ========================================================= */}
      <div className="block md:hidden space-y-4">
        
        {/* Mobile Header */}
        <div className="flex items-center justify-between pt-1 pb-1">
          <div className="flex items-center gap-3">
            <button 
              onClick={onOpenProfile}
              className="w-11 h-11 rounded-full overflow-hidden bg-blue-500/10 border-2 border-white/80 dark:border-blue-500/30 shadow-sm shrink-0 cursor-pointer focus:outline-none"
            >
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-blue-600 dark:text-blue-400 bg-blue-500/15 text-sm">
                  {user?.name?.charAt(0) || 'P'}
                </div>
              )}
            </button>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-none mb-1">{greeting},</p>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-none tracking-tight">
                {user?.name?.split(' ')[0] || 'Phillipe'}
              </h1>
            </div>
          </div>

          <button 
            onClick={() => setIsNotificationsOpen(true)}
            className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-slate-700 dark:text-slate-200 shadow-sm relative transition-transform active:scale-95"
            aria-label="Notificações"
          >
            <Bell size={18} />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900"></span>
          </button>
        </div>

        {/* Cards Resumo de Hoje & Avisos de Hoje (Mobile) */}
        {renderResumoDeHojeCards()}

        {/* Card Saldo disponível / Finanças (Mobile) */}
        <div className="glass-card p-5 relative overflow-hidden">
          {/* Card Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
                <Banknote size={15} />
              </div>
              <span className="font-bold text-sm text-slate-900 dark:text-white">Saldo disponível</span>
            </div>
            <button onClick={() => onTabChange('finances')} className="text-slate-400 hover:text-blue-500 transition-colors" aria-label="Ir para finanças">
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Balance and Sparkline */}
          <div className="flex items-end justify-between mb-5">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5">Saldo disponível</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                R$ {balance ? balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '500,00'}
              </h3>
            </div>
            
            {/* Sparkline Bar Chart */}
            <div className="flex items-end gap-1.5 h-10 pb-1">
              {[35, 50, 40, 70, 55, 85, 100].map((h, i) => (
                <div 
                  key={i} 
                  className="w-1.5 rounded-full bg-blue-500/35 dark:bg-blue-500/50" 
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>

          {/* Receitas and Despesas Side-by-Side Pills */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/60 dark:bg-white/5 border border-slate-200/50 dark:border-white/10">
              <div className="w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <ArrowUp size={14} className="stroke-[2.5]" />
              </div>
              <div className="overflow-hidden">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block leading-tight">Receitas</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight mt-0.5 truncate">
                  R$ {totalIncome ? totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '1.250,00'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/60 dark:bg-white/5 border border-slate-200/50 dark:border-white/10">
              <div className="w-7 h-7 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <ArrowDown size={14} className="stroke-[2.5]" />
              </div>
              <div className="overflow-hidden">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block leading-tight">Despesas</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight mt-0.5 truncate">
                  R$ {totalExpense ? totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '750,00'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Insight do Mentor (Mobile) */}
        <div className="glass-card p-5 relative overflow-hidden flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-sm">
                <Bot size={18} />
              </div>
              <span className="font-bold text-sm text-slate-900 dark:text-white">Insight do Mentor</span>
            </div>
            <button onClick={() => onTabChange('chat')} className="text-slate-400 hover:text-blue-500 transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
            {latestMentorFeedback || "Você tem 3 tarefas prioritárias hoje. Comece pela reunião das 08:30 e reserve um bloco para revisar finanças."}
          </p>

          <button 
            onClick={() => onTabChange('chat')}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white/70 dark:bg-white/5 hover:bg-white/90 dark:hover:bg-white/10 border border-slate-200/60 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold transition-all shadow-sm active:scale-[0.99] group"
          >
            <div className="flex items-center gap-2">
              <MessageSquare size={15} />
              <span>Perguntar ao Mentor</span>
            </div>
            <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Próximas Atividades (Mobile) */}
        <div className="glass-card p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-sm text-slate-900 dark:text-white">Próximas atividades</h2>
            <button 
              onClick={() => onTabChange('calendar')} 
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Ver todas
            </button>
          </div>

          <div className="flex flex-col divide-y divide-slate-100 dark:divide-white/5">
            {recentActivities.length > 0 ? (
              recentActivities.map((act) => (
                <div key={act.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <CircleDot size={15} className="text-blue-500 shrink-0" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 w-11 shrink-0">{act.time || '09:00'}</span>
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{act.title}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{act.date || 'Hoje'}</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25 shrink-0">
                    {(act as any).category || 'Rotina'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-3 text-center">Nenhuma atividade agendada</p>
            )}
          </div>
        </div>

        {/* Atalhos Rápidos (Mobile) */}
        <div>
          <h2 className="font-bold text-sm text-slate-900 dark:text-white mb-2.5 px-0.5">Atalhos rápidos</h2>
          <div className="grid grid-cols-4 gap-2.5">
            <button 
              onClick={() => onTabChange('calendar')}
              className="glass-card p-3 flex flex-col items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.96] transition-all cursor-pointer shadow-sm group"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <Calendar size={18} />
              </div>
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Agenda</span>
            </button>

            <button 
              onClick={() => onTabChange('focus')}
              className="glass-card p-3 flex flex-col items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.96] transition-all cursor-pointer shadow-sm group"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <Target size={18} />
              </div>
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Foco</span>
            </button>

            <button 
              onClick={() => onTabChange('finances')}
              className="glass-card p-3 flex flex-col items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.96] transition-all cursor-pointer shadow-sm group"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <BarChart3 size={18} />
              </div>
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Finanças</span>
            </button>

            <button 
              onClick={() => onTabChange('more')}
              className="glass-card p-3 flex flex-col items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.96] transition-all cursor-pointer shadow-sm group"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <Trophy size={18} />
              </div>
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Metas</span>
            </button>
          </div>
        </div>

      </div>


      {/* ========================================================= */}
      {/* DESKTOP VIEW (Preserved from high-fidelity Desktop Overhaul) */}
      {/* ========================================================= */}
      <div className="hidden md:flex flex-col gap-6">
        
        {/* Desktop Header */}
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
                className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-900 transition-colors shadow-sm"
              >
                <Bell size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Grid Resumo de Hoje & Avisos de Hoje (Dois Cards Separados) */}
        {renderResumoDeHojeCards()}

        {/* Grid: Saldo disponível & Insight do Mentor */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Card 2: Saldo disponível */}
          <div className="glass-card p-6 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-2 relative z-10">
              <h2 className="font-bold text-sm text-slate-700 dark:text-slate-300">Saldo disponível</h2>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
                <Banknote size={16} />
              </div>
            </div>
            <div className="relative z-10">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">R$ {balance.toFixed(2).replace('.', ',')}</h3>
              <div className="mt-2">
                {(() => {
                  const abs = Math.abs(balanceMoM);
                  if (balanceMoM === 0) {
                    return (
                      <div className="flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-500/10 border border-slate-500/20 w-max px-2.5 py-1 rounded-lg">
                        <Minus size={13} strokeWidth={2.5} />
                        <span>0%</span>
                      </div>
                    );
                  }
                  if (balanceMoM > 0) {
                    return (
                      <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 w-max px-2.5 py-1 rounded-lg">
                        <ArrowUpRight size={13} strokeWidth={2.5} />
                        <span>{abs}%</span>
                      </div>
                    );
                  }
                  return (
                    <div className="flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 w-max px-2.5 py-1 rounded-lg">
                      <ArrowDownRight size={13} strokeWidth={2.5} />
                      <span>{abs}%</span>
                    </div>
                  );
                })()}
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
          <div className="glass-card p-6 relative overflow-hidden group flex flex-col justify-between">
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
          <div className="lg:col-span-2 glass-card p-6 relative overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-bold text-base text-slate-900 dark:text-white">Próximas atividades</h2>
              <button onClick={() => onTabChange('calendar')} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                Ver todas <ArrowRight size={14} />
              </button>
            </div>
            
            <div className="flex flex-col gap-2.5">
              {recentActivities.length > 0 ? (
                recentActivities.map((act) => (
                  <div key={act.id} className="flex items-center gap-4 p-3.5 hover:bg-white/50 dark:hover:bg-blue-500/10 rounded-2xl transition-colors border border-transparent hover:border-slate-200/40 dark:hover:border-blue-500/20 group">
                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400 w-12 flex items-center gap-1.5"><Clock size={12}/> {act.time || '09:00'}</div>
                    <div className="flex-1 font-semibold text-sm text-slate-800 dark:text-slate-100 group-hover:text-blue-500 transition-colors">{act.title}</div>
                    <div className="text-xs text-slate-400 dark:text-slate-500">{act.date || 'Hoje'}</div>
                    <div className="px-3 py-1 text-[10px] font-bold rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                      {(act as any).category || 'Rotina'}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">Nenhuma atividade recente encontrada.</p>
              )}
            </div>
          </div>

          {/* Atalhos Rápidos (1/3 width, 2x2 grid) */}
          <div className="glass-card p-6 relative overflow-hidden">
            <h2 className="font-bold text-base text-slate-900 dark:text-white mb-6">Atalhos rápidos</h2>
            
            <div className="grid grid-cols-2 gap-3 h-[calc(100%-48px)]">
              <button onClick={() => onTabChange('calendar')} className="flex flex-col items-center justify-center gap-3 bg-white/40 dark:bg-slate-900/40 hover:bg-white/80 dark:hover:bg-blue-950/40 border border-slate-200/50 dark:border-blue-500/20 hover:border-blue-500/50 dark:hover:border-blue-400/50 transition-all rounded-2xl group p-4 shadow-sm">
                <div className="w-11 h-11 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 shadow-sm flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all">
                  <Plus size={20} />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Nova tarefa</span>
              </button>
              <button onClick={() => onTabChange('more')} className="flex flex-col items-center justify-center gap-3 bg-white/40 dark:bg-slate-900/40 hover:bg-white/80 dark:hover:bg-blue-950/40 border border-slate-200/50 dark:border-blue-500/20 hover:border-blue-500/50 dark:hover:border-blue-400/50 transition-all rounded-2xl group p-4 shadow-sm">
                <div className="w-11 h-11 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 shadow-sm flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all">
                  <StickyNote size={20} />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Nova nota</span>
              </button>
              <button onClick={() => onTabChange('finances')} className="flex flex-col items-center justify-center gap-3 bg-white/40 dark:bg-slate-900/40 hover:bg-white/80 dark:hover:bg-blue-950/40 border border-slate-200/50 dark:border-blue-500/20 hover:border-blue-500/50 dark:hover:border-blue-400/50 transition-all rounded-2xl group p-4 shadow-sm">
                <div className="w-11 h-11 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 shadow-sm flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all">
                  <Banknote size={20} />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Adicionar gasto</span>
              </button>
              <button onClick={() => onTabChange('more')} className="flex flex-col items-center justify-center gap-3 bg-white/40 dark:bg-slate-900/40 hover:bg-white/80 dark:hover:bg-blue-950/40 border border-slate-200/50 dark:border-blue-500/20 hover:border-blue-500/50 dark:hover:border-blue-400/50 transition-all rounded-2xl group p-4 shadow-sm">
                <div className="w-11 h-11 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 shadow-sm flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all">
                  <Target size={20} />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Nova meta</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
