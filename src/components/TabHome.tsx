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
  Trash2
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

export function TabHome({ transactions, tasks, onTabChange, user, onOpenProfile, latestMentorFeedback }: TabHomeProps) {
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

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const pendingTasks = tasks.filter(t => !t.completed).length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = pendingTasks + completedTasks || 1;
  const progressPercent = Math.round((completedTasks / totalTasks) * 100);
  const strokeDashoffset = 283 - (283 * progressPercent) / 100;

  const todayStr = new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

  // Componente Otimizado: Card Resumo de Hoje (Grid 2 Colunas com Progresso e Avisos de Hoje)
  const renderResumoDeHojeCard = () => (
    <div className="glass-card p-5 md:p-6 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-blue-500/5 pointer-events-none"></div>

      {/* 2. Layout em Grid (2 Colunas): grid-cols-1 md:grid-cols-2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10 h-full">
        {/* 3. Coluna 1 (Esquerda) — Progresso */}
        <div className="flex flex-col justify-between h-full">
          <div>
            {/* Título sem o ícone de sino redundante (QA-016) */}
            <h2 className="font-bold text-sm text-slate-900 dark:text-white mb-4">
              Resumo de Hoje
            </h2>

            <div className="flex items-center gap-4">
              {/* Circular Progress */}
              <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="45" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="10" 
                    className="text-slate-200/60 dark:text-slate-800" 
                  />
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="45" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="10" 
                    strokeDasharray="283" 
                    strokeDashoffset={strokeDashoffset} 
                    strokeLinecap="round" 
                    className="text-blue-600 dark:text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)] transition-all duration-1000 ease-out" 
                  />
                </svg>
                <span className="absolute text-lg font-black text-slate-900 dark:text-white">
                  {progressPercent}%
                </span>
              </div>
              
              {/* 3 Pílulas / Legendas */}
              <div className="flex flex-col gap-1.5 min-w-0">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] shrink-0"></span>
                  <span className="truncate">{completedTasks} concluídas</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)] shrink-0"></span>
                  <span className="truncate">{pendingTasks} pendentes</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                  <span className="truncate">0 em atraso</span>
                </div>
              </div>
            </div>
          </div>

          {/* Link 'Ver agenda ->' no rodapé da coluna */}
          <div className="mt-4 pt-2">
            <button 
              type="button"
              onClick={() => onTabChange('calendar')} 
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 group cursor-pointer"
            >
              <span>Ver agenda</span>
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* 4. Coluna 2 (Direita) — Avisos de Hoje */}
        <div className="flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-700 pt-4 md:pt-0 md:pl-6 h-full min-w-0">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Pin size={14} className="text-yellow-500 fill-yellow-500 shrink-0" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Avisos de Hoje
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsAddingNotice(prev => !prev)}
                className="w-6 h-6 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-colors active:scale-90 shrink-0 cursor-pointer"
                title="Adicionar aviso para hoje"
                aria-label="Adicionar aviso"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Input inline para novo aviso rápido */}
            {isAddingNotice && (
              <form onSubmit={handleAddNotice} className="mb-2.5 flex items-center gap-1.5">
                <input 
                  type="text"
                  value={newNoticeText}
                  onChange={(e) => setNewNoticeText(e.target.value)}
                  placeholder="Novo aviso rápido..."
                  autoFocus
                  className="flex-1 text-xs px-2.5 py-1.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-blue-500/40 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button 
                  type="submit" 
                  disabled={!newNoticeText.trim()}
                  className="px-2.5 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-xl disabled:opacity-50 transition-opacity cursor-pointer"
                >
                  Salvar
                </button>
              </form>
            )}

            {/* Lista compacta com as 3 últimas notas criadas para o dia atual */}
            {todayNotes.length > 0 ? (
              <ul className="space-y-1.5">
                {todayNotes.map((nota) => (
                  <li 
                    key={nota.id}
                    className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-white/40 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 text-xs text-slate-700 dark:text-slate-300 group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0"></span>
                      <span className="truncate leading-tight font-medium">{nota.texto}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteNotice(nota.id)}
                      className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 cursor-pointer"
                      title="Apagar aviso"
                    >
                      <Trash2 size={12} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-5 text-center text-slate-400 dark:text-slate-500 italic text-xs">
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

        {/* Card Resumo de Hoje (Mobile) */}
        {renderResumoDeHojeCard()}

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
            {/* Item 1 */}
            <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <CircleDot size={15} className="text-rose-500 shrink-0" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 w-11 shrink-0">08:30</span>
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Reunião com o time</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Alinhar objetivos do projeto</p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25 shrink-0">
                Alta
              </span>
            </div>

            {/* Item 2 */}
            <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <div className="w-3.5 h-3.5 rounded-full bg-blue-500 shrink-0 mx-0.5"></div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 w-11 shrink-0">10:00</span>
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Revisar finanças</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Verificar gastos e atualizar planilha</p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25 shrink-0">
                Média
              </span>
            </div>

            {/* Item 3 */}
            <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <Circle size={15} className="text-slate-400 shrink-0" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 w-11 shrink-0">14:00</span>
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Estudo / Curso</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">NEXUS Focus Academy</p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shrink-0">
                Baixa
              </span>
            </div>
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

        {/* Top Grid (3 columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Card 1: Resumo de Hoje (Otimizado: Grid 2 Colunas com Progresso e Avisos de Hoje) */}
          {renderResumoDeHojeCard()}

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
