import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, ScatterChart, Scatter, ZAxis } from 'recharts';
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { Transaction } from '../types';

interface TabReportsProps {
  transactions: Transaction[];
}

export function TabReports({ transactions }: TabReportsProps) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatShortCurrency = (val: number) => {
    if (val >= 1000) return `R$${(val / 1000).toFixed(1)}k`;
    return `R$${val}`;
  };

  // Calcular métricas reais com base nas transações passadas
  const { totalIncome, totalExpense, netBalance, savingsRate, topExpenses, calculatedExpenseCategories, displayMonthlyData, scatterReceitasData, scatterDespesasData, recurringSubscriptions } = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyTransactions = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const income = monthlyTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
    const expense = monthlyTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
    const net = income - expense;
    const saveRate = income > 0 ? ((income - expense) / income) * 100 : 0;

    const top = [...transactions]
      .filter(t => t.type === 'expense')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Chart data: 
    const expenseByCategory = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
        return acc;
      }, {} as Record<string, number>);

    const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];
    const calculatedExpenseCats = Object.keys(expenseByCategory).map((key, index) => ({
      name: key,
      value: expenseByCategory[key],
      color: COLORS[index % COLORS.length]
    })).sort((a, b) => b.value - a.value);

    // monthly progress history: last 6 months or based on data
    const monthlyMap = transactions.reduce((acc, curr) => {
      const date = new Date(curr.date);
      const month = date.toLocaleString('pt-BR', { month: 'short' }).substring(0, 3).toUpperCase();
      const yr = date.getFullYear().toString().substring(2);
      const label = `${month}/${yr}`;
      if (!acc[label]) {
        acc[label] = { name: label, receitas: 0, despesas: 0, sortKey: curr.date };
      }
      if (curr.type === 'income') acc[label].receitas += curr.amount;
      else acc[label].despesas += curr.amount;
      
      // Keep earliest date for sorting
      if (curr.date < acc[label].sortKey) acc[label].sortKey = curr.date;
      return acc;
    }, {} as Record<string, { name: string, receitas: number, despesas: number, sortKey: string }>);

    const histData = Object.values(monthlyMap)
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey));

    if (histData.length === 0) {
      histData.push({ name: 'ATUAL', receitas: 0, despesas: 0, sortKey: '' });
    }

    const scatterReceitasData = histData.map(d => ({ name: d.name, value: d.receitas }));
    const scatterDespesasData = histData.map(d => ({ name: d.name, value: d.despesas }));

    // recurring subscriptions calculation
    const expenses = transactions.filter(t => t.type === 'expense');
    const titleCount: Record<string, number> = {};
    const titleAmount: Record<string, number> = {};
    
    const keywords = ['netflix', 'spotify', 'amazon', 'prime', 'adobe', 'apple', 'gym', 'academia', 'internet', 'plano', 'assinatura', 'mensalidade', 'vivo', 'claro', 'tim'];
    
    expenses.forEach(t => {
      const titleLower = t.title.toLowerCase();
      let isSub = keywords.some(k => titleLower.includes(k));
      
      if (!isSub) {
           const tAmount = t.amount;
           if (!titleCount[titleLower]) {
             titleCount[titleLower] = 1;
             titleAmount[titleLower] = tAmount;
           } else {
             if (titleAmount[titleLower] === tAmount) {
               titleCount[titleLower]++;
             }
           }
      } else {
         titleCount[titleLower] = (titleCount[titleLower] || 0) + 1;
         // Keep latest amount or max amount
         titleAmount[titleLower] = t.amount;
      }
    });
    
    const subs: {title: string, amount: number}[] = [];
    let totalSubAmount = 0;
    
    const keys = Object.keys(titleCount);
    for(const k of keys) {
      if (titleCount[k] > 1 || keywords.some(kw => k.includes(kw))) {
          const originalTitle = expenses.find(t => t.title.toLowerCase() === k)?.title || k;
          subs.push({
            title: originalTitle,
            amount: titleAmount[k]
          });
          totalSubAmount += titleAmount[k];
      }
    }
    const recurringSubscriptions = { subs: subs.sort((a,b) => b.amount - a.amount), totalSubAmount };

    return { 
      totalIncome: income, 
      totalExpense: expense, 
      netBalance: net, 
      savingsRate: saveRate, 
      topExpenses: top,
      calculatedExpenseCategories: calculatedExpenseCats.length > 0 ? calculatedExpenseCats : [{ name: 'Sem Despesas', value: 1, color: '#27272a' }],
      displayMonthlyData: histData,
      scatterReceitasData,
      scatterDespesasData,
      recurringSubscriptions
    };
  }, [transactions]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto flex flex-col gap-6"
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white drop-shadow-sm tracking-tight">Relatórios Detalhados</h2>
          <p className="text-slate-600 dark:text-[#afafaf] mt-1 text-sm">Visão detalhada e análises do seu comportamento financeiro neste mês.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Receita Card */}
        <div className="bg-white dark:bg-gradient-to-br dark:from-[#18181b] dark:to-[#09090b] p-5 rounded-[20px] border border-slate-200 dark:border-[#27272a]/80 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] relative overflow-hidden backdrop-blur-md">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          <p className="text-slate-500 dark:text-[#afafaf] text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5 relative z-10">
            Receita Mensal <ArrowUpRight size={14} className="text-[#10B981]" />
          </p>
          <p className="text-xl font-black text-[#10B981] drop-shadow-sm relative z-10">{formatCurrency(totalIncome)}</p>
        </div>

        {/* Despesa Card */}
        <div className="bg-white dark:bg-gradient-to-br dark:from-[#18181b] dark:to-[#09090b] p-5 rounded-[20px] border border-slate-200 dark:border-[#27272a]/80 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] relative overflow-hidden backdrop-blur-md">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          <p className="text-slate-500 dark:text-[#afafaf] text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5 relative z-10">
            Despesa Mensal <ArrowDownRight size={14} className="text-rose-500" />
          </p>
          <p className="text-xl font-black text-rose-500 drop-shadow-sm relative z-10">{formatCurrency(totalExpense)}</p>
        </div>

        {/* Saldo Líquido */}
        <div className="bg-white dark:bg-gradient-to-br dark:from-[#18181b] dark:to-[#09090b] p-5 rounded-[20px] border border-slate-200 dark:border-[#27272a]/80 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] relative overflow-hidden backdrop-blur-md">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          <p className="text-slate-500 dark:text-[#afafaf] text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5 relative z-10">
            Saldo Líquido
          </p>
          <p className={`text-xl font-black drop-shadow-sm relative z-10 ${netBalance >= 0 ? 'text-slate-800 dark:text-white' : 'text-rose-500'}`}>
            {formatCurrency(netBalance)}
          </p>
        </div>

        {/* Economia */}
        <div className="bg-white dark:bg-gradient-to-br dark:from-[#18181b] dark:to-[#09090b] p-5 rounded-[20px] border border-slate-200 dark:border-[#27272a]/80 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] relative overflow-hidden backdrop-blur-md">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          <p className="text-slate-500 dark:text-[#afafaf] text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5 relative z-10">
            Taxa de Economia {savingsRate > 0 ? <TrendingUp size={14} className="text-[#10B981]" /> : <TrendingDown size={14} className="text-rose-500" />}
          </p>
          <p className={`text-xl font-black drop-shadow-sm relative z-10 ${savingsRate > 0 ? 'text-[#10B981]' : 'text-slate-800 dark:text-white'}`}>
            {savingsRate.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 1: Receitas vs Despesas (Bar) - Repetido para detalhe */}
        <div className="bg-white dark:bg-gradient-to-br dark:from-[#18181b] dark:to-[#09090b] p-7 rounded-[24px] border border-slate-200 dark:border-[#27272a]/80 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)] flex flex-col transition-all relative overflow-hidden backdrop-blur-md">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-6 uppercase tracking-wider text-[11px] relative z-10">Histórico vs Despesas (Mensal)</h3>
          <div className="flex-1 h-[300px] w-full relative z-10">
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
                <Bar dataKey="receitas" name="Receitas" fill="#10B981" radius={[4, 4, 0, 0]} barSize={16} />
                <Bar dataKey="despesas" name="Despesas" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Evolução de Gastos vs. Receitas (Scatter) */}
        <div className="bg-white dark:bg-gradient-to-br dark:from-[#18181b] dark:to-[#09090b] p-7 rounded-[24px] border border-slate-200 dark:border-[#27272a]/80 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)] flex flex-col transition-all relative overflow-hidden backdrop-blur-md">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-6 uppercase tracking-wider text-[11px] relative z-10">Evolução Gastos vs Receitas</h3>
          <div className="flex-1 h-[300px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                <XAxis type="category" dataKey="name" allowDuplicatedCategory={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#afafaf', fontWeight: 600 }} dy={10} />
                <YAxis type="number" dataKey="value" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#afafaf', fontWeight: 600 }} tickFormatter={formatShortCurrency} />
                <ZAxis type="number" range={[100, 100]} />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ borderRadius: '16px', border: '1px solid #27272a', backgroundColor: '#121214', color: '#fff', boxShadow: '0 20px 40px rgba(0,0,0,0.8)' }}
                  formatter={(value: number) => [formatCurrency(value), undefined]}
                />
                <Scatter name="Receitas" data={scatterReceitasData} fill="#10B981" line shape="circle" />
                <Scatter name="Despesas" data={scatterDespesasData} fill="#EF4444" line shape="circle" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 3: Alocação de Despesas (Pie) */}
        <div className="bg-white dark:bg-gradient-to-br dark:from-[#18181b] dark:to-[#09090b] p-7 rounded-[24px] border border-slate-200 dark:border-[#27272a]/80 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)] flex flex-col transition-all relative overflow-hidden backdrop-blur-md">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-6 uppercase tracking-wider text-[11px] relative z-10">Alocação de Despesas por Categoria</h3>
          <div className="flex-1 h-[300px] w-full flex flex-col items-center justify-center gap-6">
            <div className="w-full h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={calculatedExpenseCategories}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {calculatedExpenseCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #27272a', backgroundColor: '#121214', color: '#fff', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.8)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Custom Legend */}
            <div className="w-full grid grid-cols-2 gap-y-3 gap-x-2">
              {calculatedExpenseCategories.map((cat, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }}></div>
                  <div className="overflow-hidden">
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate">{cat.name}</p>
                    <p className="text-[10px] text-slate-400 dark:text-[#afafaf] font-bold">{formatCurrency(cat.value)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Maiores Despesas da Conta */}
        <div className="bg-white dark:bg-gradient-to-br dark:from-[#18181b] dark:to-[#09090b] p-7 rounded-[24px] border border-slate-200 dark:border-[#27272a]/80 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)] flex flex-col transition-all relative overflow-hidden backdrop-blur-md">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-6 uppercase tracking-wider text-[11px] relative z-10 flex items-center justify-between">
            Top 5 Maiores Despesas
          </h3>
          <div className="flex-1 flex flex-col gap-4 relative z-10 overflow-auto pr-2 custom-scrollbar">
            {topExpenses.length > 0 ? (
              topExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-3 rounded-[16px] bg-slate-50 dark:bg-[#121214] border border-slate-100 dark:border-[#27272a] hover:-translate-y-0.5 transition-transform">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center flex-shrink-0">
                      <ArrowDownRight size={16} className="text-rose-500" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-800 dark:text-slate-200 line-clamp-1">{expense.title}</p>
                      <p className="text-[10px] text-slate-400 dark:text-[#afafaf] flex items-center gap-1 font-medium mt-0.5">
                        <Clock size={10} />
                        {new Date(expense.date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <span className="font-black text-rose-500 drop-shadow-sm text-sm whitespace-nowrap">
                    -{formatCurrency(expense.amount)}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex-1 flex items-center justify-center flex-col text-slate-400 dark:text-slate-500 text-sm">
                <p>Nenhuma despesa encontrada.</p>
              </div>
            )}
          </div>
        </div>

        {/* Assinaturas Recorrentes */}
        <div className="bg-white dark:bg-gradient-to-br dark:from-[#18181b] dark:to-[#09090b] p-7 rounded-[24px] border border-slate-200 dark:border-[#27272a]/80 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)] flex flex-col transition-all relative overflow-hidden backdrop-blur-md">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-2 uppercase tracking-wider text-[11px] relative z-10 flex items-center justify-between">
            Serviços e Assinaturas
          </h3>
          <p className="text-xs text-slate-500 mb-4 font-medium">Você gasta <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(recurringSubscriptions.totalSubAmount)}</span>/mês com estes serviços.</p>
          <div className="flex-1 flex flex-col gap-3 relative z-10 overflow-auto pr-2 custom-scrollbar">
            {recurringSubscriptions.subs.length > 0 ? (
              recurringSubscriptions.subs.map((sub, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-[16px] bg-slate-50 dark:bg-[#121214] border border-slate-100 dark:border-[#27272a]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                      <Clock size={14} className="text-indigo-500" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-800 dark:text-slate-200 capitalize truncate max-w-[120px]">{sub.title}</p>
                    </div>
                  </div>
                  <span className="font-bold text-slate-800 dark:text-white text-sm whitespace-nowrap">
                    {formatCurrency(sub.amount)}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex-1 flex items-center justify-center flex-col text-slate-400 dark:text-slate-500 text-sm">
                <p>Nenhuma assinatura identificada.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
