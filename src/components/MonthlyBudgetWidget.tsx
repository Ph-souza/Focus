import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Edit2, Check, X, AlertCircle } from 'lucide-react';
import { Transaction, User } from '../types';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

interface MonthlyBudgetWidgetProps {
  transactions: Transaction[];
  user: User;
}

export function MonthlyBudgetWidget({ transactions, user }: MonthlyBudgetWidgetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [budgetInput, setBudgetInput] = useState(user.monthlyBudget?.toString() || '');

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const currentMonthExpenses = transactions
    .filter(t => {
      const d = new Date(t.date);
      return t.type === 'expense' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((acc, t) => acc + t.amount, 0);

  const budget = user.monthlyBudget || 0;
  const percentage = budget > 0 ? Math.min((currentMonthExpenses / budget) * 100, 100) : 0;
  const isOverBudget = budget > 0 && currentMonthExpenses > budget;
  
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const handleSave = async () => {
    const newVal = parseFloat(budgetInput.toString());
    
    if (!isNaN(newVal)) {
      try {
        await setDoc(doc(db, `users/${user.id}`), { monthlyBudget: newVal }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.id}`);
      }
    }
    setIsEditing(false);
  };

  return (
    <div className="bg-white dark:bg-gradient-to-br dark:from-[#18181b] dark:to-[#09090b] rounded-[24px] border border-slate-200 dark:border-[#27272a]/80 shadow-md p-6 relative overflow-hidden backdrop-blur-md">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#6366f1]/20 to-transparent"></div>
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
            <Target size={16} />
          </div>
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Orçamento Mensal</h3>
        </div>
        
        {!isEditing && (
          <button 
            onClick={() => {
              setBudgetInput(user.monthlyBudget?.toString() || '');
              setIsEditing(true);
            }}
            className="text-xs font-semibold text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1"
          >
            <Edit2 size={12} /> Editar
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 mb-2"
          >
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">R$</span>
              <input 
                type="number" 
                step="0.01"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                }}
                placeholder="0.00"
                className="w-full bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-[#27272a] rounded-xl pl-9 pr-4 py-2 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <button 
              onClick={handleSave}
              className="w-10 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center transition-colors"
            >
              <Check size={18} />
            </button>
            <button 
              onClick={() => { setIsEditing(false); setBudgetInput(user.monthlyBudget?.toString() || ''); }}
              className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#27272a] hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors"
            >
              <X size={18} />
            </button>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-end justify-between mb-2">
              <div>
                <span className={`text-2xl font-black ${isOverBudget ? 'text-rose-500' : 'text-slate-800 dark:text-white'}`}>
                  {formatCurrency(currentMonthExpenses)}
                </span>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400 ml-1">
                  / {budget > 0 ? formatCurrency(budget) : 'Não definido'}
                </span>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-md ${isOverBudget ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400' : 'bg-slate-100 text-slate-600 dark:bg-[#27272a] dark:text-slate-400'}`}>
                {budget > 0 ? `${percentage.toFixed(0)}%` : '-'}
              </span>
            </div>

            <div className="w-full h-3 bg-slate-100 dark:bg-[#09090b] rounded-full overflow-hidden mt-3 mb-1">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out ${isOverBudget ? 'bg-rose-500' : percentage > 80 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
            
            {isOverBudget && (
              <p className="text-xs font-semibold text-rose-500 mt-2 flex items-center gap-1.5">
                <AlertCircle size={12} /> Você ultrapassou seu orçamento!
              </p>
            )}
            {!isOverBudget && budget > 0 && percentage > 80 && (
              <p className="text-xs font-semibold text-amber-500 mt-2 flex items-center gap-1.5">
                <AlertCircle size={12} /> Atenção! Você está perto do limite.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
