import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowUpRight, ArrowDownRight, Filter } from 'lucide-react';
import { Transaction } from '../types';

interface BalanceStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  balance: number;
}

export function BalanceStatementModal({ isOpen, onClose, transactions, balance }: BalanceStatementModalProps) {
  const [filter, setFilter] = useState<'1d' | '7d'>('7d');

  const filteredTransactions = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filterDate = new Date(today);
    if (filter === '1d') {
      filterDate.setDate(filterDate.getDate() - 1);
    } else {
      filterDate.setDate(filterDate.getDate() - 7);
    }

    return transactions
      .filter(t => new Date(t.date) >= filterDate && new Date(t.date) <= new Date())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filter]);

  const summary = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, t) => {
        if (t.type === 'income') acc.income += t.amount;
        else acc.expense += t.amount;
        return acc;
      },
      { income: 0, expense: 0 }
    );
  }, [filteredTransactions]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(date);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        ></motion.div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-white dark:bg-[#0f111a] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white relative">
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"
            >
              <X size={18} />
            </button>
            <p className="text-white/80 text-xs font-semibold mb-1">Saldo Atual</p>
            <h2 className="text-3xl font-black tracking-tight">{formatCurrency(balance)}</h2>
          </div>

          {/* Filters */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#121214]">
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-slate-400" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Período</span>
            </div>
            <div className="flex bg-white dark:bg-[#18181b] border border-slate-200 dark:border-slate-800 rounded-lg p-1">
              <button
                onClick={() => setFilter('1d')}
                className={`text-xs font-bold px-3 py-1.5 rounded-md transition-colors ${filter === '1d' ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
              >
                24 Horas
              </button>
              <button
                onClick={() => setFilter('7d')}
                className={`text-xs font-bold px-3 py-1.5 rounded-md transition-colors ${filter === '7d' ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
              >
                7 Dias
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-4 px-6 pt-6 pb-2">
            <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl p-4 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 mb-1 text-emerald-600 dark:text-emerald-400">
                <ArrowUpRight size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Entradas</span>
              </div>
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(summary.income)}</p>
            </div>
            <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl p-4 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 mb-1 text-rose-600 dark:text-rose-400">
                <ArrowDownRight size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Saídas</span>
              </div>
              <p className="text-sm font-bold text-rose-700 dark:text-rose-300">{formatCurrency(summary.expense)}</p>
            </div>
          </div>

          {/* Transaction List */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Extrato do período</h3>
            {filteredTransactions.length > 0 ? (
              <div className="flex flex-col gap-3">
                {filteredTransactions.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#18181b] border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'}`}>
                        {t.type === 'income' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{t.description}</p>
                        <p className="text-[10px] text-slate-500 font-medium">{t.category} • {formatDate(t.date)}</p>
                      </div>
                    </div>
                    <div className={`text-sm font-bold whitespace-nowrap ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-slate-50 dark:bg-[#18181b] rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-slate-500 text-sm font-medium">Nenhuma transação neste período</p>
              </div>
            )}
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
