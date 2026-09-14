import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Edit2, Check, X, AlertCircle } from 'lucide-react';
import { Transaction, User } from '../types';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

interface MonthlyBudgetWidgetProps {
  transactions: Transaction[];
  user: User;
}

export function MonthlyBudgetWidget({ transactions, user }: MonthlyBudgetWidgetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentBudget, setCurrentBudget] = useState<number>(() => {
    if (typeof user.monthlyBudget === 'number' && user.monthlyBudget > 0) {
      return user.monthlyBudget;
    }
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nexus_monthly_budget');
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed)) return parsed;
      }
    }
    return user.monthlyBudget || 0;
  });

  const [budgetInput, setBudgetInput] = useState(currentBudget > 0 ? currentBudget.toString() : '');

  // Sincronização em tempo real com o documento do Firestore (se disponível)
  useEffect(() => {
    if (!user?.id) return;
    const userDocRef = doc(db, 'users', user.id);
    const unsubscribe = onSnapshot(userDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (typeof data?.monthlyBudget === 'number') {
          setCurrentBudget(data.monthlyBudget);
        }
      }
    }, (err) => {
      console.warn('[MonthlyBudgetWidget] Snapshot listener warning:', err?.message);
    });

    return () => unsubscribe();
  }, [user?.id]);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const currentMonthExpenses = transactions
    .filter(t => {
      const d = new Date(t.date);
      return t.type === 'expense' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((acc, t) => acc + t.amount, 0);

  const percentage = currentBudget > 0 ? Math.min((currentMonthExpenses / currentBudget) * 100, 100) : 0;
  const isOverBudget = currentBudget > 0 && currentMonthExpenses > currentBudget;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const handleSave = (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      try {
        e.preventDefault();
        e.stopPropagation();
      } catch {}
    }

    // 1. Fechar imediatamente o modo de edição para alternar para a visualização limpa
    setIsEditing(false);

    try {
      const cleanInput = (budgetInput ?? '').toString().replace(',', '.').trim();
      const newVal = cleanInput === '' ? 0 : parseFloat(cleanInput);

      if (!isNaN(newVal) && newVal >= 0) {
        // 2. Atualização síncrona local imediata
        setCurrentBudget(newVal);
        setBudgetInput(newVal > 0 ? newVal.toString() : '');
        if (user) {
          user.monthlyBudget = newVal;
        }

        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('nexus_monthly_budget', newVal.toString());
          } catch {}
        }

        // 3. Persistência assíncrona desacoplada no Firestore
        if (user?.id) {
          setDoc(doc(db, `users/${user.id}`), { monthlyBudget: newVal }, { merge: true })
            .catch((err) => {
              console.warn('[MonthlyBudgetWidget] Firestore save notice:', err?.message);
            });
        }
      }
    } catch (err) {
      console.error('[MonthlyBudgetWidget] handleSave error:', err);
    }
  };

  const handleCancel = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      try {
        e.preventDefault();
        e.stopPropagation();
      } catch {}
    }
    setBudgetInput(currentBudget > 0 ? currentBudget.toString() : '');
    setIsEditing(false);
  };

  const handleStartEdit = (e?: React.MouseEvent) => {
    if (e) {
      try {
        e.preventDefault();
        e.stopPropagation();
      } catch {}
    }
    setBudgetInput(currentBudget > 0 ? currentBudget.toString() : '');
    setIsEditing(true);
  };

  return (
    <div className="bg-white dark:bg-[#121216] rounded-[24px] border border-slate-200 dark:border-zinc-800 shadow-[0_4px_25px_rgba(0,0,0,0.05)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6)] p-6 relative overflow-hidden backdrop-blur-md">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-zinc-200 dark:via-zinc-700/60 to-transparent pointer-events-none"></div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white flex items-center justify-center">
            <Target size={16} />
          </div>
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Orçamento Mensal</h3>
        </div>

        {!isEditing && (
          <button
            type="button"
            onClick={handleStartEdit}
            className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 transition-colors focus:outline-none cursor-pointer"
          >
            <Edit2 size={12} /> Editar
          </button>
        )}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {isEditing ? (
          <motion.div
            key="editing-budget-card"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <form onSubmit={handleSave} className="flex items-center gap-3 mb-2">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 text-sm font-medium">R$</span>
                <input
                  type="number"
                  step="0.01"
                  autoFocus
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSave(e);
                    } else if (e.key === 'Escape') {
                      handleCancel(e);
                    }
                  }}
                  placeholder="0.00"
                  className="w-full bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-[#27272a] rounded-xl pl-9 pr-4 py-2 text-slate-800 dark:text-slate-100 text-sm focus:ring-1 focus:ring-white focus:border-white focus:outline-none transition-all"
                />
              </div>
              <button
                type="button"
                onClick={handleSave}
                title="Salvar orçamento"
                className="w-10 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center transition-all active:scale-95 shadow-sm cursor-pointer"
              >
                <Check size={18} className="pointer-events-none" />
              </button>
              <button
                type="button"
                onClick={handleCancel}
                title="Cancelar edição"
                className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#27272a] hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
              >
                <X size={18} className="pointer-events-none" />
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="display-budget-card"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <div className="flex items-end justify-between mb-2">
              <div>
                <span className={`text-2xl font-black ${isOverBudget ? 'text-rose-500' : 'text-slate-800 dark:text-white'}`}>
                  {formatCurrency(currentMonthExpenses)}
                </span>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400 ml-1">
                  / {currentBudget > 0 ? formatCurrency(currentBudget) : 'Não definido'}
                </span>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-md ${isOverBudget ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400' : 'bg-slate-100 text-slate-600 dark:bg-[#27272a] dark:text-slate-400'}`}>
                {currentBudget > 0 ? `${percentage.toFixed(0)}%` : '-'}
              </span>
            </div>

            <div className="w-full h-3 bg-slate-100 dark:bg-[#09090b] rounded-full overflow-hidden mt-3 mb-1">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out ${isOverBudget ? 'bg-rose-500' : 'bg-white'}`}
                style={{ width: `${percentage}%` }}
              ></div>
            </div>

            {isOverBudget && (
              <p className="text-xs font-semibold text-rose-500 mt-2 flex items-center gap-1.5">
                <AlertCircle size={12} /> Você ultrapassou seu orçamento!
              </p>
            )}
            {!isOverBudget && currentBudget > 0 && percentage > 80 && (
              <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-300 mt-2 flex items-center gap-1.5">
                <AlertCircle size={12} /> Atenção! Você está perto do limite.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
