import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, ArrowUpRight, ArrowDownRight, Coffee, Monitor, Home, Briefcase, Trash2, Sparkles, Receipt, ChevronDown } from 'lucide-react';
import { Transaction, User } from '../types';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, setDoc, deleteDoc, serverTimestamp, collection, query, orderBy, limit, startAfter, getDocs, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
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

  // Paginação por Cursor
  const [paginatedTransactions, setPaginatedTransactions] = useState<Transaction[]>([]);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingInitial, setIsLoadingInitial] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // 1. Carrega inicialmente apenas 20 itens (.limit(20)) ordenados por date desc
  useEffect(() => {
    if (!user?.id) {
      setPaginatedTransactions(transactions.slice(0, 20));
      return;
    }

    let isMounted = true;
    const fetchInitial = async () => {
      setIsLoadingInitial(true);
      try {
        const firstQuery = query(
          collection(db, 'users', user.id, 'transactions'),
          orderBy('date', 'desc'),
          limit(20)
        );
        const snapshot = await getDocs(firstQuery);
        if (isMounted) {
          const docs = snapshot.docs;
          if (docs.length > 0) {
            setLastVisible(docs[docs.length - 1]);
          } else {
            setLastVisible(null);
          }
          setHasMore(docs.length === 20);
          setPaginatedTransactions(docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
        }
      } catch (err) {
        console.error("Erro ao carregar transações paginadas:", err);
        if (isMounted) {
          setPaginatedTransactions(transactions.slice(0, 20));
        }
      } finally {
        if (isMounted) setIsLoadingInitial(false);
      }
    };

    fetchInitial();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // 2. Paginação baseada em cursor: busca próxima página de 20 itens com startAfter(lastVisible)
  const loadMore = async () => {
    if (!lastVisible || isLoadingMore || !hasMore || !user?.id) return;
    setIsLoadingMore(true);
    try {
      const nextQuery = query(
        collection(db, 'users', user.id, 'transactions'),
        orderBy('date', 'desc'),
        startAfter(lastVisible),
        limit(20)
      );
      const snapshot = await getDocs(nextQuery);
      const newDocs = snapshot.docs;
      if (newDocs.length < 20) {
        setHasMore(false);
      }
      if (newDocs.length > 0) {
        setLastVisible(newDocs[newDocs.length - 1]);
        const newItems = newDocs.map(d => ({ id: d.id, ...d.data() } as Transaction));
        setPaginatedTransactions(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNew = newItems.filter(item => !existingIds.has(item.id));
          return [...prev, ...uniqueNew];
        });
      }
    } catch (err) {
      console.error("Erro ao carregar mais transações:", err);
    } finally {
      setIsLoadingMore(false);
    }
  };

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
        setPaginatedTransactions(prev => [{ id: txId, ...newTx } as Transaction, ...prev]);
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
      setPaginatedTransactions(prev => prev.filter(tx => tx.id !== id));
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
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Transações e Fluxo Financeiro</h2>
          <p className="text-slate-500 dark:text-zinc-400 text-sm mt-0.5">Gestão em tempo real de receitas, despesas e orçamento inteligente.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-emerald-500/20 flex items-center gap-2 cursor-pointer active:scale-95"
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

      <div className="bg-white dark:bg-[#121216] rounded-[24px] border border-slate-200 dark:border-zinc-800 shadow-[0_4px_25px_rgba(0,0,0,0.05)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden relative backdrop-blur-md">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-zinc-200 dark:via-zinc-700/60 to-transparent pointer-events-none"></div>
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
            {paginatedTransactions.filter(tx => (filter === 'all' || tx.type === filter) && (categoryFilter === 'all' || tx.category === categoryFilter)).map((tx) => (
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
          
          {paginatedTransactions.filter(tx => (filter === 'all' || tx.type === filter) && (categoryFilter === 'all' || tx.category === categoryFilter)).length === 0 && !isLoadingInitial && (
            <div className="py-14 px-4 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700/80 flex items-center justify-center text-white mb-3 shadow-inner">
                <Receipt size={22} />
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Nenhuma movimentação encontrada</p>
              <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-xs mt-1 leading-relaxed">
                Não há registros com os filtros selecionados. Alterne as categorias ou registre uma nova transação acima.
              </p>
            </div>
          )}

          {/* Paginação baseada em cursor: Carregar mais */}
          {hasMore && (
            <div className="p-4 flex justify-center border-t border-slate-100 dark:border-[#27272a]">
              <button
                type="button"
                onClick={loadMore}
                disabled={isLoadingMore}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700/80 text-slate-700 dark:text-zinc-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isLoadingMore ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>Buscando próximas 20 transações...</span>
                  </>
                ) : (
                  <>
                    <span>Carregar mais (próximas 20)</span>
                  </>
                )}
              </button>
            </div>
          )}
          {!hasMore && paginatedTransactions.length > 0 && (
            <div className="p-3 text-center border-t border-slate-100 dark:border-[#27272a]/40 text-[11px] text-slate-400 dark:text-zinc-500 font-medium">
              Todas as transações foram carregadas ({paginatedTransactions.length} itens)
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
