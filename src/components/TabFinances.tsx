import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Transaction, User, Goal } from '../types';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { 
  ArrowUp, 
  ArrowDown, 
  ArrowUpRight, 
  ArrowDownRight, 
  Eye, 
  EyeOff, 
  Calendar, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Receipt, 
  Target, 
  TrendingUp, 
  PieChart as PieChartIcon, 
  Briefcase, 
  ShoppingCart, 
  Utensils, 
  Car, 
  X,
  Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

interface TabFinancesProps {
  transactions?: Transaction[];
  goals?: Goal[];
  user?: User | null;
  onTabChange?: (tab: any) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Alimentação': '#f43f5e', // rose-500
  'Transporte': '#0ea5e9', // sky-500
  'Lazer': '#f59e0b', // amber-500
  'Educação': '#8b5cf6', // purple-500
  'Saúde': '#10b981', // emerald-500
  'Moradia': '#6366f1', // indigo-500
  'Salário': '#10b981', // emerald-500
  'Investimentos': '#3b82f6', // blue-500
  'Outros': '#94a3b8' // slate-400
};

export function TabFinances({ 
  transactions = [], 
  goals = [], 
  user, 
  onTabChange 
}: TabFinancesProps) {
  const [showBalance, setShowBalance] = useState(true);
  const [selectedMonth] = useState('Abr 2026');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [localTransactions, setLocalTransactions] = useState<Transaction[]>([]);

  // Form states for new transaction
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newType, setNewType] = useState<'income' | 'expense'>('expense');
  const [newCategory, setNewCategory] = useState('Alimentação');

  // Format currency in BRL
  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Combine Firestore transactions with local newly added ones
  const allTransactions = useMemo(() => {
    return [...localTransactions, ...transactions];
  }, [localTransactions, transactions]);

  // Financial metrics (Initialized at 0 clean state)
  const totalIncome = useMemo(() => {
    return allTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  }, [allTransactions]);

  const totalExpense = useMemo(() => {
    return allTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  }, [allTransactions]);

  const balance = totalIncome - totalExpense;

  // Monthly Evolution Data for BarChart
  const monthlyData = useMemo(() => {
    const months = ['Nov', 'Dez', 'Jan', 'Fev', 'Mar', 'Abr'];
    return months.map((m, idx) => {
      // If transactions exist, calculate sum, else keep clean 0
      const isCurrent = idx === months.length - 1;
      const monthExpenses = isCurrent ? totalExpense : 0;
      return {
        month: m,
        despesas: monthExpenses,
        isCurrent
      };
    });
  }, [totalExpense]);

  // Expenses grouped by category for Donut Chart
  const categoryData = useMemo(() => {
    const expenses = allTransactions.filter(t => t.type === 'expense');
    if (expenses.length === 0) return [];

    const map: Record<string, number> = {};
    expenses.forEach(t => {
      const cat = t.category || 'Outros';
      map[cat] = (map[cat] || 0) + (Number(t.amount) || 0);
    });

    return Object.entries(map).map(([name, value]) => ({
      name,
      value,
      percent: Math.round((value / (totalExpense || 1)) * 100),
      color: CATEGORY_COLORS[name] || CATEGORY_COLORS['Outros']
    })).sort((a, b) => b.value - a.value);
  }, [allTransactions, totalExpense]);

  // Handle adding a new transaction
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(newAmount.replace(',', '.'));
    if (!newTitle.trim() || isNaN(num) || num <= 0) return;

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      title: newTitle.trim(),
      amount: num,
      type: newType,
      category: newCategory,
      date: new Date().toISOString().split('T')[0]
    };

    setLocalTransactions(prev => [newTx, ...prev]);

    if (user?.id) {
      try {
        await addDoc(collection(db, 'users', user.id, 'transactions'), {
          title: newTx.title,
          amount: newTx.amount,
          type: newTx.type,
          category: newTx.category,
          date: newTx.date,
          createdAt: new Date()
        });
      } catch (err) {
        console.error('Error adding transaction to Firestore:', err);
      }
    }

    setNewTitle('');
    setNewAmount('');
    setIsAddModalOpen(false);
  };

  // Icon selector based on category
  const getTransactionIcon = (cat?: string, type?: 'income' | 'expense') => {
    if (type === 'income') {
      return <Briefcase size={16} className="text-emerald-500" />;
    }
    switch (cat) {
      case 'Alimentação':
      case 'Restaurante':
        return <Utensils size={16} className="text-amber-500" />;
      case 'Mercado':
        return <ShoppingCart size={16} className="text-rose-500" />;
      case 'Transporte':
        return <Car size={16} className="text-sky-500" />;
      default:
        return <Receipt size={16} className="text-purple-500" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4 md:gap-6 p-0 md:p-8"
    >
      {/* Create Transaction Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card w-full max-w-sm p-6 shadow-2xl relative"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Plus size={18} />
                  </div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Nova Transação</h3>
                </div>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-8 h-8 rounded-xl hover:bg-slate-200/50 dark:hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddTransaction} className="space-y-3.5">
                {/* Income / Expense Switcher */}
                <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setNewType('income')}
                    className={`py-2 text-xs font-bold rounded-lg transition-all ${
                      newType === 'income' 
                        ? 'bg-emerald-500 text-white shadow-sm' 
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Receita
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType('expense')}
                    className={`py-2 text-xs font-bold rounded-lg transition-all ${
                      newType === 'expense' 
                        ? 'bg-rose-500 text-white shadow-sm' 
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Despesa
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Título</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Supermercado"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/70 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Valor (R$)</label>
                    <input
                      type="text"
                      required
                      placeholder="0,00"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/70 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Categoria</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/70 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-blue-500"
                    >
                      <option value="Alimentação">Alimentação</option>
                      <option value="Transporte">Transporte</option>
                      <option value="Mercado">Mercado</option>
                      <option value="Lazer">Lazer</option>
                      <option value="Educação">Educação</option>
                      <option value="Saúde">Saúde</option>
                      <option value="Salário">Salário</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 mt-2 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all active:scale-[0.98]"
                >
                  Salvar Transação
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* MOBILE VIEW (Strictly matching Sprint 4 Mobile Mockup)    */}
      {/* ========================================================= */}
      <div className="block md:hidden space-y-4">
        
        {/* Header & Month Selector */}
        <div className="flex items-center justify-between pt-1 pb-1">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              Finanças
            </h1>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
              Controle hoje. Conquiste amanhã.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Month selector chip */}
            <div className="glass-card px-3 py-1.5 flex items-center gap-1.5 shadow-sm text-xs font-bold text-slate-800 dark:text-slate-200">
              <Calendar size={13} className="text-blue-500" />
              <span>{selectedMonth}</span>
              <ChevronDown size={13} className="text-slate-400" />
            </div>

            {/* Quick Add Button */}
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="w-9 h-9 rounded-xl glass-card flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm active:scale-95 transition-all"
              aria-label="Nova transação"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Card: Saldo Disponível */}
        <div className="glass-card p-5 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Saldo disponível
            </span>
            <button 
              onClick={() => setShowBalance(!showBalance)}
              className="text-slate-400 hover:text-blue-500 transition-colors p-1"
              aria-label="Alternar visibilidade do saldo"
            >
              {showBalance ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          </div>

          <div className="flex items-end justify-between mb-5">
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {showBalance ? formatCurrency(balance) : '••••••'}
              </h3>
            </div>

            {/* Mini Sparkline Bar Chart */}
            <div className="flex items-end gap-1.5 h-9 pb-1 opacity-80">
              {[25, 45, 30, 60, 40, 75, 100].map((h, i) => (
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
            {/* Receitas */}
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/60 dark:bg-white/5 border border-slate-200/50 dark:border-white/10">
              <div className="w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <ArrowUp size={14} className="stroke-[2.5]" />
              </div>
              <div className="overflow-hidden">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block leading-tight">
                  Receitas
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight mt-0.5 truncate">
                  {showBalance ? formatCurrency(totalIncome) : '••••'}
                </span>
              </div>
            </div>

            {/* Despesas */}
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/60 dark:bg-white/5 border border-slate-200/50 dark:border-white/10">
              <div className="w-7 h-7 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <ArrowDown size={14} className="stroke-[2.5]" />
              </div>
              <div className="overflow-hidden">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block leading-tight">
                  Despesas
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight mt-0.5 truncate">
                  {showBalance ? formatCurrency(totalExpense) : '••••'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Gráfico: Evolução Mensal (Recharts ResponsiveContainer) */}
        <div className="glass-card p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white">
              Evolução mensal
            </h2>
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <ArrowUpRight size={12} />
              <span>+12% vs. mar</span>
            </div>
          </div>

          <div className="w-full h-36 min-w-0">
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} 
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="glass-card p-2 text-[10px] font-bold shadow-lg">
                          <span>{formatCurrency(payload[0].value as number)}</span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="despesas" 
                  radius={[6, 6, 0, 0]}
                  fill="#3b82f6"
                >
                  {monthlyData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.isCurrent ? '#2563eb' : '#93c5fd'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Gráfico: Gastos por Categoria (Donut Recharts) */}
        <div className="glass-card p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white">
              Gastos por categoria
            </h2>
            <ChevronRight size={16} className="text-slate-400" />
          </div>

          {categoryData.length === 0 ? (
            <div className="py-6 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 mb-2 border border-dashed border-slate-300 dark:border-white/10">
                <PieChartIcon size={20} />
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Nenhum gasto registrado
              </p>
              <p className="text-[11px] text-slate-400 max-w-[200px] mt-0.5">
                Adicione despesas para visualizar o gráfico de categorias.
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              {/* Donut Chart with Center Text */}
              <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                <ResponsiveContainer width={140} height={140}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={42}
                      outerRadius={58}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-[11px] font-black text-slate-900 dark:text-white leading-tight">
                    {formatCurrency(totalExpense)}
                  </span>
                  <span className="text-[9px] text-slate-400 leading-tight mt-0.5">
                    em gastos
                  </span>
                </div>
              </div>

              {/* Compact Legend on Right */}
              <div className="flex-1 flex flex-col gap-1.5 pl-2 overflow-hidden">
                {categoryData.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5 min-w-0 pr-1">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 font-bold">
                      <span className="text-slate-400">{item.percent}%</span>
                      <span className="text-slate-900 dark:text-white">{formatCurrency(item.value)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 4. Transações Recentes */}
        <div className="glass-card p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white">
              Transações recentes
            </h2>
            <button 
              onClick={() => onTabChange?.('transactions')}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Ver todas
            </button>
          </div>

          {allTransactions.length === 0 ? (
            <div className="py-6 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-2">
                <Receipt size={18} />
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Nenhuma transação recente
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Suas movimentações cadastradas aparecerão aqui.
              </p>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="mt-3 px-3.5 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-sm active:scale-95 transition-all"
              >
                + Nova transação
              </button>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-slate-100 dark:divide-white/5">
              {allTransactions.slice(0, 4).map((t) => {
                const isIncome = t.type === 'income';
                return (
                  <div key={t.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isIncome ? 'bg-emerald-500/15' : 'bg-rose-500/15'
                      }`}>
                        {getTransactionIcon(t.category, t.type)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {t.title}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {t.date || 'Hoje'}
                        </p>
                      </div>
                    </div>

                    <span className={`text-xs font-bold shrink-0 ${
                      isIncome 
                        ? 'text-emerald-600 dark:text-emerald-400' 
                        : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {isIncome ? `+ ${formatCurrency(t.amount)}` : `- ${formatCurrency(t.amount)}`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 5. Caixinhas e Metas */}
        <div className="glass-card p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white">
              Caixinhas e metas
            </h2>
            <button 
              onClick={() => onTabChange?.('goals')}
              className="text-slate-400 hover:text-blue-500 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {goals.length === 0 ? (
            <div className="py-6 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-2">
                <Target size={18} />
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Nenhuma meta ativa
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Crie caixinhas para organizar seus objetivos financeiros.
              </p>
              <button 
                onClick={() => onTabChange?.('goals')}
                className="mt-3 px-3.5 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-sm active:scale-95 transition-all"
              >
                Criar Meta
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {goals.slice(0, 4).map((goal) => {
                const percent = Math.min(100, Math.round((goal.currentAmount / (goal.targetAmount || 1)) * 100));
                return (
                  <div key={goal.id} className="p-3 rounded-2xl bg-white/60 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 flex flex-col justify-between shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Target size={14} />
                      </div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {goal.title}
                      </span>
                    </div>

                    <div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                        {formatCurrency(goal.currentAmount)} de {formatCurrency(goal.targetAmount)}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 h-1.5 bg-slate-200/80 dark:bg-slate-800/80 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-600 rounded-full transition-all duration-500" 
                            style={{ width: `${percent}%` }} 
                          />
                        </div>
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                          {percent}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>


      {/* ========================================================= */}
      {/* DESKTOP VIEW (Preserved from high-fidelity Desktop Overhaul) */}
      {/* ========================================================= */}
      <div className="hidden md:flex flex-col h-full gap-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Finanças</h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
              Mais controle para um futuro maior.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all active:scale-95"
            >
              <Plus size={16} /> Nova transação
            </button>
          </div>
        </div>

        {/* Top Cards (3 cols) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 relative overflow-hidden group">
            <h2 className="font-bold text-sm text-slate-600 dark:text-slate-300 mb-2">Saldo disponível</h2>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {formatCurrency(balance)}
            </h3>
            <div className="flex items-center gap-1 mt-4 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 w-max px-2.5 py-1 rounded-lg">
              <ArrowUpRight size={14} />
              <span>12% este mês</span>
            </div>
          </div>

          <div className="glass-card p-6 relative overflow-hidden">
            <div className="flex justify-between items-start mb-2">
              <h2 className="font-bold text-sm text-slate-600 dark:text-slate-300">Receitas</h2>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-sm">
                <ArrowUpRight size={16} strokeWidth={3} />
              </div>
            </div>
            <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              {formatCurrency(totalIncome)}
            </h3>
            <div className="flex items-center gap-1 mt-4 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <TrendingUp size={14} /> 8%
            </div>
          </div>

          <div className="glass-card p-6 relative overflow-hidden">
            <div className="flex justify-between items-start mb-2">
              <h2 className="font-bold text-sm text-slate-600 dark:text-slate-300">Despesas</h2>
              <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-sm">
                <ArrowDownRight size={16} strokeWidth={3} />
              </div>
            </div>
            <h3 className="text-3xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
              {formatCurrency(totalExpense)}
            </h3>
            <div className="flex items-center gap-1 mt-4 text-xs font-bold text-rose-600 dark:text-rose-400">
              <TrendingUp size={14} className="transform rotate-180" /> 5%
            </div>
          </div>
        </div>

        {/* Middle Charts (2 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">Evolução mensal</h2>
              <div className="flex gap-4 text-xs font-bold">
                <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                  <div className="w-2 h-2 rounded-full bg-current"></div> Despesas
                </span>
              </div>
            </div>
            
            <div className="w-full h-48">
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} />
                  <Tooltip cursor={{ fill: 'transparent' }} content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="glass-card p-2 text-xs font-bold shadow-lg">
                          <span>{formatCurrency(payload[0].value as number)}</span>
                        </div>
                      );
                    }
                    return null;
                  }} />
                  <Bar dataKey="despesas" radius={[6, 6, 0, 0]} fill="#3b82f6">
                    {monthlyData.map((entry, index) => (
                      <Cell key={`desktop-cell-${index}`} fill={entry.isCurrent ? '#2563eb' : '#93c5fd'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Donut Chart */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">Gastos por categoria</h2>
            </div>
            {categoryData.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center">
                <p className="text-xs font-semibold text-slate-500">Nenhuma despesa para exibir no momento.</p>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-6 h-48">
                <div className="relative w-44 h-44 flex items-center justify-center shrink-0">
                  <ResponsiveContainer width={170} height={170}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        stroke="none"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`desktop-pie-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      {formatCurrency(totalExpense)}
                    </span>
                    <span className="text-[10px] text-slate-400">Total</span>
                  </div>
                </div>

                <div className="flex-1 flex flex-col gap-2">
                  {categoryData.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{item.name}</span>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
