import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Transaction, User, Goal } from '../types';
import { db } from '../lib/firebase';
import { collection, doc, writeBatch, increment, serverTimestamp } from 'firebase/firestore';
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
  Minus,
  Plane,
  Shield,
  ArrowRight
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
  // 1. Sincronização com Data Real do Sistema (new Date())
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState<boolean>(false);
  const [showBalance, setShowBalance] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [localTransactions, setLocalTransactions] = useState<Transaction[]>([]);

  // Form states for new transaction
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newType, setNewType] = useState<TransactionType>('expense');
  const [selectedMetaId, setSelectedMetaId] = useState<string>('');
  const [newCategory, setNewCategory] = useState('Alimentação');
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Formatar data para 'Mês AAAA' em pt-BR (ex: 'Set 2026') usando Intl.DateTimeFormat
  const formatMonthYear = (date: Date) => {
    const formatter = new Intl.DateTimeFormat('pt-BR', { month: 'short' });
    const month = formatter.format(date).replace('.', '');
    const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1);
    const year = date.getFullYear();
    return `${capitalizedMonth} ${year}`;
  };

  // Gerar opções de meses: últimos 3 meses, mês atual e próximos 3 meses
  const monthOptions = useMemo(() => {
    const options: Date[] = [];
    const now = new Date();
    for (let i = -3; i <= 3; i++) {
      options.push(new Date(now.getFullYear(), now.getMonth() + i, 1));
    }
    return options;
  }, []);

  // Sincronizar campo de data da transação com o mês selecionado
  useEffect(() => {
    const today = new Date();
    const isSameMonthAndYear = 
      selectedDate.getFullYear() === today.getFullYear() && 
      selectedDate.getMonth() === today.getMonth();

    if (isSameMonthAndYear) {
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const d = String(today.getDate()).padStart(2, '0');
      setNewDate(`${y}-${m}-${d}`);
    } else {
      const y = selectedDate.getFullYear();
      const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
      setNewDate(`${y}-${m}-01`);
    }
  }, [selectedDate, isAddModalOpen]);

  // Format currency in BRL
  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Selected month key in YYYY-MM format
  const selectedMonthKey = useMemo(() => {
    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }, [selectedDate]);

  // Combine Firestore transactions with local newly added ones
  const allTransactions = useMemo(() => {
    return [...localTransactions, ...transactions];
  }, [localTransactions, transactions]);

  // Transactions filtered by selected month, sorted newest first
  const monthTransactions = useMemo(() => {
    return allTransactions
      .filter(t => t.date && t.date.startsWith(selectedMonthKey))
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [allTransactions, selectedMonthKey]);

  // Financial metrics for selected month
  const totalIncome = useMemo(() => {
    return monthTransactions
      .filter(t => t.type === 'income' || t.type === 'receita')
      .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  }, [monthTransactions]);

  const totalExpense = useMemo(() => {
    return monthTransactions
      .filter(t => t.type === 'expense' || t.type === 'despesa' || t.type === 'investimento_meta')
      .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  }, [monthTransactions]);

  const balance = totalIncome - totalExpense;

  // Previous month key in YYYY-MM format
  const previousMonthKey = useMemo(() => {
    const prevDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1);
    const y = prevDate.getFullYear();
    const m = String(prevDate.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }, [selectedDate]);

  // Transactions filtered by previous month
  const previousMonthTransactions = useMemo(() => {
    return allTransactions.filter(t => t.date && t.date.startsWith(previousMonthKey));
  }, [allTransactions, previousMonthKey]);

  // Financial metrics for previous month
  const previousTotalIncome = useMemo(() => {
    return previousMonthTransactions
      .filter(t => t.type === 'income' || t.type === 'receita')
      .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  }, [previousMonthTransactions]);

  const previousTotalExpense = useMemo(() => {
    return previousMonthTransactions
      .filter(t => t.type === 'expense' || t.type === 'despesa' || t.type === 'investimento_meta')
      .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  }, [previousMonthTransactions]);

  const previousBalance = previousTotalIncome - previousTotalExpense;

  // 1. O Cálculo Base MoM (Variação Percentual) com tratamento de divisão por zero
  const calculateMoM = (current: number, previous: number): number => {
    if (previous === 0) {
      if (current > 0) return 100;
      if (current < 0) return -100;
      return 0;
    }
    return Math.round(((current - previous) / Math.abs(previous)) * 100);
  };

  const incomeMoM = useMemo(() => calculateMoM(totalIncome, previousTotalIncome), [totalIncome, previousTotalIncome]);
  const expenseMoM = useMemo(() => calculateMoM(totalExpense, previousTotalExpense), [totalExpense, previousTotalExpense]);
  const balanceMoM = useMemo(() => calculateMoM(balance, previousBalance), [balance, previousBalance]);

  // 2 & 3. Regras de Cor, Ícone e Formatação MoM
  const renderMoMBadge = (percent: number, type: 'income' | 'expense' | 'balance', customClass = '') => {
    const abs = Math.abs(percent);

    if (percent === 0) {
      return (
        <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg border w-max text-slate-500 dark:text-slate-400 bg-slate-500/10 border-slate-500/20 ${customClass}`}>
          <Minus size={13} strokeWidth={2.5} />
          <span>0%</span>
        </div>
      );
    }

    if (percent > 0) {
      // Despesas: Crescimento é negativo (gastar mais) -> Vermelho com seta para cima
      if (type === 'expense') {
        return (
          <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg border w-max text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20 ${customClass}`}>
            <ArrowUpRight size={13} strokeWidth={2.5} />
            <span>{abs}%</span>
          </div>
        );
      }
      // Receitas e Saldo: Crescimento é positivo -> Verde com seta para cima
      return (
        <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg border w-max text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20 ${customClass}`}>
          <ArrowUpRight size={13} strokeWidth={2.5} />
          <span>{abs}%</span>
        </div>
      );
    }

    // Queda (< 0): Seta para baixo
    // Despesas: Queda é positivo (gastar menos) -> Verde com seta para baixo
    if (type === 'expense') {
      return (
        <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg border w-max text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20 ${customClass}`}>
          <ArrowDownRight size={13} strokeWidth={2.5} />
          <span>{abs}%</span>
        </div>
      );
    }

    // Receitas e Saldo: Queda é negativo -> Vermelho com seta para baixo
    return (
      <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg border w-max text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20 ${customClass}`}>
        <ArrowDownRight size={13} strokeWidth={2.5} />
        <span>{abs}%</span>
      </div>
    );
  };

  const renderCompactMoMBadge = (percent: number, type: 'income' | 'expense' | 'balance') => {
    const abs = Math.abs(percent);

    if (percent === 0) {
      return (
        <span className="flex items-center gap-0.5 text-[10px] font-bold text-slate-400">
          <Minus size={10} strokeWidth={2.5} />
          <span>0%</span>
        </span>
      );
    }

    if (percent > 0) {
      const isGood = type !== 'expense';
      const color = isGood ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400';
      return (
        <span className={`flex items-center gap-0.5 text-[10px] font-bold ${color}`}>
          <ArrowUpRight size={11} strokeWidth={2.5} />
          <span>{abs}%</span>
        </span>
      );
    }

    const isGood = type === 'expense';
    const color = isGood ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400';
    return (
      <span className={`flex items-center gap-0.5 text-[10px] font-bold ${color}`}>
        <ArrowDownRight size={11} strokeWidth={2.5} />
        <span>{abs}%</span>
      </span>
    );
  };

  // Formatação de Data/Status: 'Hoje', 'Ontem', ou 'DD mmm' (ex: '24 mai')
  const formatDateStatus = (dateStr?: string): string => {
    if (!dateStr) return 'Hoje';
    try {
      const today = new Date();
      const todayYear = today.getFullYear();
      const todayMonth = today.getMonth();
      const todayDate = today.getDate();

      const parts = dateStr.split('-');
      if (parts.length >= 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2].slice(0, 2), 10);

        if (year === todayYear && month === todayMonth && day === todayDate) {
          return 'Hoje';
        }

        const yesterday = new Date(todayYear, todayMonth, todayDate - 1);
        if (year === yesterday.getFullYear() && month === yesterday.getMonth() && day === yesterday.getDate()) {
          return 'Ontem';
        }

        const txDate = new Date(year, month, day);
        if (!isNaN(txDate.getTime())) {
          const formatted = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' }).format(txDate);
          return formatted.replace('.', '');
        }
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Helper de ícone e estilo para metas/caixinhas
  const getGoalVisual = (goal: Goal) => {
    const titleLower = (goal.title || '').toLowerCase();
    const iconKey = (goal.icon || '').toLowerCase();

    if (titleLower.includes('viagem') || titleLower.includes('praia') || titleLower.includes('ferias') || titleLower.includes('chile') || iconKey === 'plane') {
      return {
        icon: <Plane className="w-5 h-5 stroke-[2.2]" />,
        bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
      };
    }
    if (titleLower.includes('reserva') || titleLower.includes('emergência') || titleLower.includes('emergencia') || iconKey === 'shield') {
      return {
        icon: <Shield className="w-5 h-5 stroke-[2.2]" />,
        bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
      };
    }
    if (titleLower.includes('carro') || titleLower.includes('veiculo') || titleLower.includes('moto') || iconKey === 'car') {
      return {
        icon: <Car className="w-5 h-5 stroke-[2.2]" />,
        bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
      };
    }
    return {
      icon: <Target className="w-5 h-5 stroke-[2.2]" />,
      bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
    };
  };

  // Monthly Evolution Data for BarChart (6 months leading up to selectedDate)
  const monthlyData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - i, 1);
      const mStr = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthName = mStr.charAt(0).toUpperCase() + mStr.slice(1);
      
      const monthExpense = allTransactions
        .filter(t => (t.type === 'expense' || t.type === 'despesa' || t.type === 'investimento_meta') && t.date && t.date.startsWith(mKey))
        .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

      months.push({
        month: monthName,
        despesas: monthExpense,
        isCurrent: i === 0
      });
    }
    return months;
  }, [allTransactions, selectedDate]);

  // Expenses grouped by category for Donut Chart (for the selected month)
  const categoryData = useMemo(() => {
    const expenses = monthTransactions.filter(t => t.type === 'expense' || t.type === 'despesa' || t.type === 'investimento_meta');
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
  }, [monthTransactions, totalExpense]);

  // Handle adding a new transaction using the selected or chosen date
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(newAmount.replace(',', '.'));
    if (!newTitle.trim() || isNaN(num) || num <= 0) return;

    if (newType === 'investimento_meta' && !selectedMetaId) {
      alert('Por favor, selecione uma meta para guardar o valor.');
      return;
    }

    const chosenDate = newDate || `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-01`;

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      title: newTitle.trim(),
      amount: num,
      type: newType,
      category: newType === 'investimento_meta' ? 'Investimentos' : newCategory,
      date: chosenDate,
      metaId: newType === 'investimento_meta' ? selectedMetaId : undefined
    };

    setLocalTransactions(prev => [newTx, ...prev]);

    // Automatically align selectedDate with the newly added transaction's month if different
    const [txYear, txMonth] = chosenDate.split('-');
    if (txYear && txMonth) {
      setSelectedDate(new Date(parseInt(txYear, 10), parseInt(txMonth, 10) - 1, 1));
    }

    if (user?.id) {
      try {
        const batch = writeBatch(db);

        // 1. Grava a transação no Firestore (para ficar no histórico de movimentações)
        const txDocRef = doc(collection(db, 'users', user.id, 'transactions'));
        batch.set(txDocRef, {
          title: newTx.title,
          amount: newTx.amount,
          type: newTx.type,
          category: newTx.category,
          date: newTx.date,
          metaId: newTx.metaId || null,
          createdAt: serverTimestamp()
        });

        // 2. Se for aporte em meta, atualiza a Meta na mesma operação (currentAmount e valorAcumulado)
        if (newType === 'investimento_meta' && selectedMetaId) {
          const goalRef = doc(db, 'users', user.id, 'goals', selectedMetaId);
          batch.update(goalRef, {
            currentAmount: increment(num),
            valorAcumulado: increment(num),
            updatedAt: serverTimestamp()
          });
        }

        await batch.commit();
      } catch (err) {
        console.error('Error adding transaction to Firestore:', err);
      }
    }

    setNewTitle('');
    setNewAmount('');
    setIsAddModalOpen(false);
  };

  // Icon selector based on category
  const getTransactionIcon = (cat?: string, type?: TransactionType) => {
    if (type === 'income' || type === 'receita') {
      return <Briefcase size={16} className="text-emerald-500" />;
    }
    if (type === 'investimento_meta') {
      return <Target size={16} className="text-blue-500" />;
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
                {/* Switcher de Tipo: [ Receita ] [ Despesa ] [ Guardar na Meta ] */}
                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setNewType('income')}
                    className={`py-2 text-[11px] font-bold rounded-lg transition-all text-center ${
                      newType === 'income' || newType === 'receita'
                        ? 'bg-emerald-500 text-white shadow-sm' 
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Receita
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType('expense')}
                    className={`py-2 text-[11px] font-bold rounded-lg transition-all text-center ${
                      newType === 'expense' || newType === 'despesa'
                        ? 'bg-rose-500 text-white shadow-sm' 
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Despesa
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewType('investimento_meta');
                      if (!selectedMetaId && goals.length > 0) {
                        setSelectedMetaId(goals[0].id);
                        if (!newTitle.trim()) {
                          setNewTitle(`Aporte: ${goals[0].title}`);
                        }
                      }
                      setNewCategory('Investimentos');
                    }}
                    className={`py-2 text-[11px] font-bold rounded-lg transition-all text-center ${
                      newType === 'investimento_meta'
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Guardar na Meta
                  </button>
                </div>

                {/* Dropdown de Metas Ativas quando Guardar na Meta está selecionado */}
                {newType === 'investimento_meta' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Destino do dinheiro (Meta)
                    </label>
                    {goals.length === 0 ? (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 font-medium">
                        Nenhuma meta ativa cadastrada. Crie uma meta para realizar aportes.
                      </div>
                    ) : (
                      <select
                        value={selectedMetaId}
                        onChange={(e) => {
                          const goalId = e.target.value;
                          setSelectedMetaId(goalId);
                          const chosen = goals.find(g => g.id === goalId);
                          if (chosen && (!newTitle.trim() || newTitle.startsWith('Aporte:'))) {
                            setNewTitle(`Aporte: ${chosen.title}`);
                          }
                        }}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/70 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-blue-500"
                      >
                        <option value="" disabled>Selecione a meta de destino...</option>
                        {goals.map((g) => {
                          const curr = g.currentAmount ?? g.valorAcumulado ?? 0;
                          return (
                            <option key={g.id} value={g.id}>
                              {g.title} ({formatCurrency(curr)} / {formatCurrency(g.targetAmount)})
                            </option>
                          );
                        })}
                      </select>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Título</label>
                  <input
                    type="text"
                    required
                    placeholder={newType === 'investimento_meta' ? 'Ex: Aporte Viagem' : 'Ex: Supermercado'}
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
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Data</label>
                    <input
                      type="date"
                      required
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/70 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {newType !== 'investimento_meta' && (
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
                      <option value="Moradia">Moradia</option>
                      <option value="Salário">Salário</option>
                      <option value="Investimentos">Investimentos</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 mt-2 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all active:scale-[0.98] cursor-pointer"
                >
                  {newType === 'investimento_meta' ? 'Guardar na Meta' : 'Salvar Transação'}
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
        
        {/* Header & Dynamic Month Selector Dropdown */}
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
            {/* Functional Month Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsMonthDropdownOpen(prev => !prev)}
                className="glass-card px-3 py-1.5 flex items-center gap-1.5 shadow-sm text-xs font-bold text-slate-800 dark:text-slate-200 hover:scale-[1.02] active:scale-95 transition-all"
                aria-label="Selecionar mês"
              >
                <Calendar size={13} className="text-blue-500" />
                <span>{formatMonthYear(selectedDate)}</span>
                <ChevronDown size={13} className={`text-slate-400 transition-transform ${isMonthDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Absolute Dropdown Menu */}
              {isMonthDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsMonthDropdownOpen(false)} 
                  />
                  <div className="absolute right-0 top-full mt-2 w-44 z-50 glass-card shadow-lg p-1.5 border border-white/80 dark:border-blue-500/30 rounded-2xl max-h-60 overflow-y-auto">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2.5 py-1">
                      Selecionar Mês
                    </div>
                    {monthOptions.map((opt, idx) => {
                      const isSelected = 
                        opt.getFullYear() === selectedDate.getFullYear() && 
                        opt.getMonth() === selectedDate.getMonth();
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSelectedDate(opt);
                            setIsMonthDropdownOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                            isSelected
                              ? 'bg-blue-600 text-white font-bold shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 font-medium'
                          }`}
                        >
                          <span>{formatMonthYear(opt)}</span>
                          {isSelected && <span className="text-[10px]">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
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
              <div className="mt-2">
                {renderMoMBadge(balanceMoM, 'balance')}
              </div>
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
              <div className="overflow-hidden flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block leading-tight">
                    Receitas
                  </span>
                  {renderCompactMoMBadge(incomeMoM, 'income')}
                </div>
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
              <div className="overflow-hidden flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block leading-tight">
                    Despesas
                  </span>
                  {renderCompactMoMBadge(expenseMoM, 'expense')}
                </div>
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
            {renderMoMBadge(expenseMoM, 'expense')}
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
                Nenhum gasto em {formatMonthYear(selectedDate)}
              </p>
              <p className="text-[11px] text-slate-400 max-w-[200px] mt-0.5">
                Adicione despesas neste mês para visualizar o gráfico por categoria.
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
              Transações ({formatMonthYear(selectedDate)})
            </h2>
            <button 
              onClick={() => onTabChange?.('transactions')}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Ver todas
            </button>
          </div>

          {monthTransactions.length === 0 ? (
            <div className="py-6 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-2">
                <Receipt size={18} />
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Nenhuma transação em {formatMonthYear(selectedDate)}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Suas movimentações deste período aparecerão aqui.
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
              {monthTransactions.slice(0, 6).map((t) => {
                const isIncome = t.type === 'income' || t.type === 'receita';
                const isGoalInvestment = t.type === 'investimento_meta';
                return (
                  <div key={t.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isIncome ? 'bg-emerald-500/15' : isGoalInvestment ? 'bg-blue-500/15' : 'bg-rose-500/15'
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
                        : isGoalInvestment
                        ? 'text-blue-600 dark:text-blue-400'
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
        {/* Desktop Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Finanças</h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
              Mais controle para um futuro maior.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Desktop Month Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsMonthDropdownOpen(prev => !prev)}
                className="glass-card px-4 py-2 flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 hover:scale-[1.02] active:scale-95 transition-all shadow-sm"
              >
                <Calendar size={14} className="text-blue-500" />
                <span>{formatMonthYear(selectedDate)}</span>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${isMonthDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isMonthDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsMonthDropdownOpen(false)} 
                  />
                  <div className="absolute right-0 top-full mt-2 w-48 z-50 glass-card shadow-lg p-1.5 border border-white/80 dark:border-blue-500/30 rounded-2xl max-h-60 overflow-y-auto">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2.5 py-1">
                      Selecionar Mês
                    </div>
                    {monthOptions.map((opt, idx) => {
                      const isSelected = 
                        opt.getFullYear() === selectedDate.getFullYear() && 
                        opt.getMonth() === selectedDate.getMonth();
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSelectedDate(opt);
                            setIsMonthDropdownOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                            isSelected
                              ? 'bg-blue-600 text-white font-bold shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 font-medium'
                          }`}
                        >
                          <span>{formatMonthYear(opt)}</span>
                          {isSelected && <span className="text-[10px]">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

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
            <h2 className="font-bold text-sm text-slate-600 dark:text-slate-300 mb-2">Saldo ({formatMonthYear(selectedDate)})</h2>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {formatCurrency(balance)}
            </h3>
            {renderMoMBadge(balanceMoM, 'balance', 'mt-4')}
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
            {renderMoMBadge(incomeMoM, 'income', 'mt-4')}
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
            {renderMoMBadge(expenseMoM, 'expense', 'mt-4')}
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
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">Gastos por categoria ({formatMonthYear(selectedDate)})</h2>
            </div>
            {categoryData.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center">
                <p className="text-xs font-semibold text-slate-500">Nenhuma despesa para exibir no mês de {formatMonthYear(selectedDate)}.</p>
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

        {/* 3. Cards Inferiores: Transações recentes & Caixinhas e metas (Grid responsivo 2 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Transações recentes */}
          <div className="glass-card p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                  Transações recentes
                </h2>
                <button
                  type="button"
                  onClick={() => onTabChange?.('transactions')}
                  className="text-xs font-semibold text-blue-500 hover:text-blue-600 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>Ver todas</span>
                  <ArrowRight size={12} />
                </button>
              </div>

              {monthTransactions.length === 0 ? (
                <div className="py-10 flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-2">
                    <Receipt size={18} />
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Nenhuma transação em {formatMonthYear(selectedDate)}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Suas movimentações deste mês aparecerão aqui.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(true)}
                    className="mt-3 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm active:scale-95 transition-all cursor-pointer"
                  >
                    + Nova transação
                  </button>
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-slate-100 dark:divide-white/5">
                  {monthTransactions.slice(0, 5).map((t) => {
                    const isIncome = t.type === 'income' || t.type === 'receita';
                    const isGoalInvestment = t.type === 'investimento_meta';
                    return (
                      <div key={t.id} className="flex items-center justify-between py-3.5 first:pt-1 last:pb-1">
                        {/* Esquerda: Data/Status */}
                        <span className="text-xs font-medium text-slate-400 w-16 sm:w-20 shrink-0">
                          {formatDateStatus(t.date)}
                        </span>

                        {/* Centro: Título da transação */}
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex-1 min-w-0 truncate px-4">
                          {t.title}
                        </span>

                        {/* Direita: Valor formatado */}
                        <span className={`text-sm font-bold shrink-0 ${
                          isIncome 
                            ? 'text-green-500 dark:text-green-400' 
                            : isGoalInvestment
                            ? 'text-blue-500 dark:text-blue-400'
                            : 'text-red-500 dark:text-red-400'
                        }`}>
                          {isIncome ? `+ ${formatCurrency(t.amount)}` : `- ${formatCurrency(t.amount)}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Caixinhas e metas */}
          <div className="glass-card p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                  Caixinhas e metas
                </h2>
                <button
                  type="button"
                  onClick={() => onTabChange?.('goals')}
                  className="text-xs font-semibold text-blue-500 hover:text-blue-600 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>Ver todas</span>
                  <ArrowRight size={12} />
                </button>
              </div>

              {goals.length === 0 ? (
                <div className="py-10 flex flex-col items-center justify-center text-center">
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
                    type="button"
                    onClick={() => onTabChange?.('goals')}
                    className="mt-3 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm active:scale-95 transition-all cursor-pointer"
                  >
                    + Criar Meta
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {goals.slice(0, 4).map((goal) => {
                    const target = goal.targetAmount || 1;
                    const current = goal.currentAmount || 0;
                    const percent = Math.min(100, Math.round((current / target) * 100));
                    const visual = getGoalVisual(goal);

                    return (
                      <div key={goal.id} className="flex items-center gap-3.5">
                        {/* Ícone */}
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${visual.bg}`}>
                          {visual.icon}
                        </div>

                        {/* Corpo textual e barra de progresso */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                              {goal.title}
                            </span>
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">
                              {percent}%
                            </span>
                          </div>

                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                            {formatCurrency(current)} / {formatCurrency(target)}
                          </p>

                          {/* Barra de progresso linear muito fina */}
                          <div className="w-full h-1.5 bg-slate-200/80 dark:bg-slate-700/60 rounded-full overflow-hidden mt-2">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all duration-500"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
