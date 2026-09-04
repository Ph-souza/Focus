import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, ArrowUpRight, ArrowDownRight, Coffee, Monitor, Home, Briefcase, Trash2, Sparkles } from 'lucide-react';
import { Transaction, User } from '../types';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { getApiUrl } from '../lib/api';

import { MonthlyBudgetWidget } from './MonthlyBudgetWidget';

interface TabTransactionsProps {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  user: User;
}

export function TabTransactions({ transactions, setTransactions, user }: TabTransactionsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newType, setNewType] = useState<'income' | 'expense'>('expense');
  const [newCategory, setNewCategory] = useState('Outros');
  const [installments, setInstallments] = useState(1);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isSuggestingCategory, setIsSuggestingCategory] = useState(false);

  const incomeCategories = ['Salário', 'Investimento', 'Venda', 'Outros'];
  const expenseCategories = ['Alimentação', 'Transporte', 'Saúde', 'Moradia', 'Lazer', 'Serviços', 'Mercado', 'Outros'];
  const allCategories = Array.from(new Set([...incomeCategories, ...expenseCategories])).sort();

  const suggestCategory = async () => {
    if (!newTitle.trim()) return;
    setIsSuggestingCategory(true);
    try {
      const response = await fetch(getApiUrl('/api/categorize'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTitle,
          type: newType
        })
      });
      
      const data = await response.json();
      if (data.category && !data.error) {
        setNewCategory(data.category);
      }
    } catch (error) {
      console.error("Error suggesting category:", error);
    } finally {
      setIsSuggestingCategory(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newAmount) return;

    const amountNum = parseFloat(newAmount.replace(',', '.'));
    if (isNaN(amountNum)) return;

    setIsAdding(false);
    setNewTitle('');
    setNewAmount('');
    setNewCategory('Outros');
    
    // Save current values for loop
    const _installments = newType === 'expense' ? installments : 1;
    setInstallments(1);

    const baseTxId = Date.now();

    for (let i = 0; i < _installments; i++) {
      const txDate = new Date();
      txDate.setMonth(txDate.getMonth() + i);
      
      const txId = `${baseTxId}_${i}`;
      const newTx = {
        title: _installments > 1 ? `${newTitle} (${i + 1}/${_installments})` : newTitle,
        amount: Math.round((amountNum / _installments) * 100) / 100, // Handle float division
        type: newType,
        category: newCategory,
        date: txDate.toISOString().split('T')[0],
        userId: user.id,
        createdAt: serverTimestamp()
      };
      
      try {
        await setDoc(doc(db, `users/${user.id}/transactions`, txId), newTx);
      } catch(err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${user.id}/transactions/${txId}`);
      }
    }
  };

  const getIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('salário') || t.includes('freela')) return <Briefcase size={16} />;
    if (t.includes('mercado') || t.includes('jantar') || t.includes('ifood')) return <Coffee size={16} />;
    if (t.includes('aluguel') || t.includes('conta')) return <Home size={16} />;
    if (t.includes('internet') || t.includes('setup')) return <Monitor size={16} />;
    return <ArrowDownRight size={16} />;
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, `users/${user.id}/transactions`, id));
    } catch(err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.id}/transactions/${id}`);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto flex flex-col gap-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Transações</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Histórico de fluxo de caixa.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 bg-[#10B981] text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
        >
          <Plus size={16} /> <span className="hidden sm:inline">Nova Transação</span>
        </button>
      </div>

      {isAdding && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-white dark:bg-gradient-to-br dark:from-[#18181b] dark:to-[#09090b] p-6 rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)] border border-slate-100 dark:border-[#27272a]/80 overflow-hidden relative backdrop-blur-md"
        >
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-4 items-end relative z-10">
            <div className="flex-1 w-full">
              <label className="text-xs font-semibold text-slate-500 dark:text-[#afafaf] uppercase tracking-wider mb-2 block">Título</label>
              <input 
                type="text" 
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onBlur={suggestCategory}
                placeholder="Ex: Jantar restaurante"
                className="w-full bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-[#27272a] rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#10B981] focus:outline-none transition-all text-sm"
              />
            </div>
            <div className="flex-1 w-full">
              <label className="text-xs font-semibold text-slate-500 dark:text-[#afafaf] uppercase tracking-wider mb-2 block">Valor (R$)</label>
              <input 
                type="number" 
                step="0.01"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-[#27272a] rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#10B981] focus:outline-none transition-all text-sm"
              />
            </div>
            <div className="w-full md:w-auto">
              <label className="text-xs font-semibold text-slate-500 dark:text-[#afafaf] uppercase tracking-wider mb-2 block">Tipo</label>
              <select 
                value={newType}
                onChange={(e) => {
                  setNewType(e.target.value as 'income' | 'expense');
                  setNewCategory('Outros');
                }}
                className="w-full md:w-32 bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-[#27272a] rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#10B981] focus:outline-none transition-all text-sm"
              >
                <option value="expense">Despesa</option>
                <option value="income">Receita</option>
              </select>
            </div>
            <div className="w-full md:w-auto">
              <label className="text-xs font-semibold flex items-center gap-2 text-slate-500 dark:text-[#afafaf] uppercase tracking-wider mb-2 block">
                Categoria
                {isSuggestingCategory && <Sparkles size={12} className="text-[#10B981] animate-pulse" />}
              </label>
              <select 
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                disabled={isSuggestingCategory}
                className="w-full md:w-32 bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-[#27272a] rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#10B981] focus:outline-none transition-all text-sm disabled:opacity-50"
              >
                {(newType === 'income' ? incomeCategories : expenseCategories).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            {newType === 'expense' && (
              <div className="w-full md:w-auto">
                <label className="text-xs font-semibold text-slate-500 dark:text-[#afafaf] uppercase tracking-wider mb-2 block">Parcelas</label>
                <select 
                  value={installments}
                  onChange={(e) => setInstallments(parseInt(e.target.value))}
                  className="w-full md:w-24 bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-[#27272a] rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#10B981] focus:outline-none transition-all text-sm"
                >
                  <option value={1}>À vista</option>
                  {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                    <option key={num} value={num}>{num}x</option>
                  ))}
                </select>
              </div>
            )}
            <div className="w-full md:w-auto mt-4 md:mt-0">
              <button type="submit" className="w-full md:w-auto bg-slate-800 dark:bg-[#10B981] text-white px-6 py-2.5 rounded-xl font-medium hover:bg-slate-900 dark:hover:bg-emerald-600 transition-colors text-sm cursor-pointer">
                Salvar
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <MonthlyBudgetWidget transactions={transactions} user={user} />

      <div className="bg-white dark:bg-gradient-to-br dark:from-[#18181b] dark:to-[#09090b] rounded-[24px] border border-slate-200 dark:border-[#27272a]/80 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden relative backdrop-blur-md">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        <div className="p-4 border-b border-slate-100 dark:border-[#27272a] flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Transações Recentes</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-100 dark:bg-[#09090b] border-none text-slate-600 dark:text-slate-300 rounded-lg px-3 py-1.5 text-xs font-medium focus:ring-2 focus:ring-[#10B981] cursor-pointer"
            >
              <option value="all">Todas Categorias</option>
              {(filter === 'income' ? incomeCategories : filter === 'expense' ? expenseCategories : allCategories).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <div className="flex bg-slate-100 dark:bg-[#09090b] p-1 rounded-lg">
              <button
                onClick={() => { setFilter('all'); setCategoryFilter('all'); }}
                className={`flex-1 sm:flex-none px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${filter === 'all' ? 'bg-white dark:bg-[#27272a] text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-[#afafaf]'}`}
              >
                Todas
              </button>
              <button
                onClick={() => { setFilter('income'); setCategoryFilter('all'); }}
                className={`flex-1 sm:flex-none px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${filter === 'income' ? 'bg-white dark:bg-[#27272a] text-emerald-600 dark:text-[#10B981] shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-[#afafaf]'}`}
              >
                Receitas
              </button>
              <button
                onClick={() => { setFilter('expense'); setCategoryFilter('all'); }}
                className={`flex-1 sm:flex-none px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${filter === 'expense' ? 'bg-white dark:bg-[#27272a] text-rose-600 dark:text-rose-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-[#afafaf]'}`}
              >
                Despesas
              </button>
            </div>
          </div>
        </div>
        <div className="p-2 flex flex-col gap-1 overflow-hidden divide-y divide-slate-50 dark:divide-[#27272a]/50">
          <AnimatePresence mode="popLayout">
            {transactions.filter(tx => (filter === 'all' || tx.type === filter) && (categoryFilter === 'all' || tx.category === categoryFilter)).map((tx) => (
              <motion.div 
                layout
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.95, transition: { duration: 0.2 } }}
                transition={{ duration: 0.2 }}
                key={tx.id} 
                className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-[#27272a]/50 cursor-pointer transition-colors rounded-lg group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${tx.type === 'income' ? 'bg-emerald-50 dark:bg-[#10B981]/10 text-emerald-600 dark:text-[#10B981]' : 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'}`}>
                    {tx.type === 'income' ? <ArrowUpRight size={16} /> : getIcon(tx.title)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{tx.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {tx.category && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 dark:bg-[#27272a] text-slate-500 dark:text-[#afafaf] rounded-sm">
                          {tx.category}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 dark:text-[#afafaf]">{tx.date}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-bold text-xs ${tx.type === 'income' ? 'text-[#10B981]' : 'text-rose-500'}`}>
                    {tx.type === 'income' ? '+' : '-'} {formatCurrency(Math.abs(tx.amount))}
                  </span>
                  <button 
                    onClick={(e) => handleDelete(tx.id, e)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-md opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                    title="Excluir"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {transactions.filter(tx => (filter === 'all' || tx.type === filter) && (categoryFilter === 'all' || tx.category === categoryFilter)).length === 0 && (
            <div className="p-8 text-center text-slate-500 text-sm">
              Nenhuma transação encontrada com esses filtros.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
