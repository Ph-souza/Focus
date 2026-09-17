import { useState } from 'react';
import { motion } from 'motion/react';
import { Transaction, User } from '../types';
import { Target, ArrowUpRight, ArrowDownRight, ChevronRight, ShieldCheck, Umbrella, Laptop } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface TabFinanceProps {
  transactions: Transaction[];
  setTransactions?: React.Dispatch<React.SetStateAction<Transaction[]>>;
  goals?: any[];
  user: User | null;
  onTabChange?: (tab: any) => void;
}

export function TabFinance({ transactions, user, onTabChange }: TabFinanceProps) {
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0) || 7200;
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0) || 2850;
  const balance = totalIncome - totalExpense;

  const barData = [
    { name: 'Jan', receitas: 6000, despesas: 2400 },
    { name: 'Fev', receitas: 6200, despesas: 2100 },
    { name: 'Mar', receitas: 5800, despesas: 2900 },
    { name: 'Abr', receitas: 6500, despesas: 2800 },
    { name: 'Mai', receitas: 7200, despesas: 2850 },
    { name: 'Jun', receitas: 0, despesas: 0 },
  ];

  const pieData = [
    { name: 'Moradia', value: 32, color: '#3b82f6' },
    { name: 'Alimentação', value: 24, color: '#10b981' },
    { name: 'Transporte', value: 15, color: '#8b5cf6' },
    { name: 'Saúde', value: 12, color: '#ec4899' },
    { name: 'Lazer', value: 10, color: '#f59e0b' },
    { name: 'Outros', value: 7, color: '#64748b' },
  ];

  const recentTransactions = [
    { id: 1, title: 'Mercado Extra', date: '25 mai 2025', amount: -120.00, icon: '🛒', type: 'expense' },
    { id: 2, title: 'Salário', date: '25 mai 2025', amount: 3500.00, icon: '💵', type: 'income' },
    { id: 3, title: 'Uber', date: '24 mai 2025', amount: -28.50, icon: '🚗', type: 'expense' },
    { id: 4, title: 'Netflix', date: '23 mai 2025', amount: -55.90, icon: '🎬', type: 'expense' },
  ];

  const goalsMock = [
    { id: 1, title: 'Viagem Europa', icon: <Umbrella size={18} className="text-blue-500" />, current: 4200, target: 10000, percent: 42 },
    { id: 2, title: 'Novo Notebook', icon: <Laptop size={18} className="text-slate-500" />, current: 2800, target: 8000, percent: 35 },
    { id: 3, title: 'Reserva de Emergência', icon: <ShieldCheck size={18} className="text-emerald-500" />, current: 6000, target: 20000, percent: 30 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto flex flex-col gap-6 px-4 md:px-8 py-6"
    >
      {/* Header */}
      <div className="flex justify-between items-end mb-2">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">Finanças</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Mais controle para um futuro maior.</p>
        </div>
        <select className="px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-[12px] outline-none cursor-pointer">
          <option>Maio 2025</option>
          <option>Abril 2025</option>
          <option>Março 2025</option>
        </select>
      </div>

      {/* Top Cards (Balance, Income, Expense) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Saldo */}
        <div className="bg-white dark:bg-white/5 backdrop-blur-md rounded-[24px] p-6 shadow-sm border border-slate-200 dark:border-white/10 flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-500/5 dark:bg-blue-500/10 rounded-tl-[100px] pointer-events-none"></div>
          <h2 className="font-bold text-xs text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Saldo disponível</h2>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-3">R$ {balance.toFixed(2).replace('.', ',')}</h3>
          <div className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-md text-[10px] font-bold w-fit">
            <ArrowUpRight size={12} strokeWidth={3} />
            + 12% este mês
          </div>
        </div>

        {/* Receitas */}
        <div className="bg-white dark:bg-white/5 backdrop-blur-md rounded-[24px] p-6 shadow-sm border border-slate-200 dark:border-white/10 flex justify-between items-center group">
          <div>
            <h2 className="font-bold text-xs text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Receitas</h2>
            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-3">R$ {totalIncome.toFixed(2).replace('.', ',')}</h3>
            <div className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
              <ArrowUpRight size={12} strokeWidth={3} />
              + 8%
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <ArrowUpRight size={24} />
          </div>
        </div>

        {/* Despesas */}
        <div className="bg-white dark:bg-white/5 backdrop-blur-md rounded-[24px] p-6 shadow-sm border border-slate-200 dark:border-white/10 flex justify-between items-center group">
          <div>
            <h2 className="font-bold text-xs text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Despesas</h2>
            <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400 mb-3">R$ {totalExpense.toFixed(2).replace('.', ',')}</h3>
            <div className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 text-[10px] font-bold">
              <ArrowDownRight size={12} strokeWidth={3} />
              - 5%
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-500">
            <ArrowDownRight size={24} />
          </div>
        </div>

      </div>

      {/* Middle Grid (Charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
        
        {/* Evolução Mensal */}
        <div className="bg-white dark:bg-white/5 backdrop-blur-md rounded-[24px] p-6 shadow-sm border border-slate-200 dark:border-white/10 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Evolução mensal</h3>
            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider">
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span> Receitas
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700"></span> Despesas
              </div>
            </div>
          </div>
          
          <div className="flex-1 min-h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barGap={4}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                <YAxis hide domain={[0, 'dataMax + 1000']} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="receitas" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={16} />
                <Bar dataKey="despesas" fill="#334155" radius={[4, 4, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gastos por categoria */}
        <div className="bg-white dark:bg-white/5 backdrop-blur-md rounded-[24px] p-6 shadow-sm border border-slate-200 dark:border-white/10">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-6">Gastos por categoria</h3>
          
          <div className="flex items-center gap-6 h-[200px]">
            <div className="relative w-40 h-40 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white leading-none mt-1">R$ 2.850</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-2.5 flex-1">
              {pieData.slice(0, 5).map((item, i) => (
                <div key={i} className="flex justify-between items-center text-[11px] font-medium">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                    <span className="text-slate-600 dark:text-slate-300">{item.name}</span>
                  </div>
                  <span className="text-slate-800 dark:text-slate-400 font-bold">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Transações Recentes */}
        <div className="bg-white dark:bg-white/5 backdrop-blur-md rounded-[24px] p-6 shadow-sm border border-slate-200 dark:border-white/10 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Transações recentes</h3>
            <button className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors flex items-center gap-1">
              Ver todas <ChevronRight size={14} />
            </button>
          </div>
          
          <div className="flex flex-col gap-1">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-3 px-2 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors border-b border-slate-100 dark:border-white/5 last:border-0">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-[12px] bg-slate-100 dark:bg-[#121216] flex items-center justify-center text-lg shadow-sm border border-slate-200/50 dark:border-white/5">
                    {tx.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{tx.title}</h4>
                    <p className="text-[11px] text-slate-400 font-medium">{tx.date}</p>
                  </div>
                </div>
                <div className={`text-sm font-bold ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                  {tx.type === 'income' ? '+' : ''} R$ {Math.abs(tx.amount).toFixed(2).replace('.', ',')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Caixinhas e metas */}
        <div className="bg-white dark:bg-white/5 backdrop-blur-md rounded-[24px] p-6 shadow-sm border border-slate-200 dark:border-white/10 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Caixinhas e metas</h3>
            <button onClick={() => onTabChange && onTabChange('goals')} className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors flex items-center gap-1">
              Ver todas <ChevronRight size={14} />
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {goalsMock.map((goal) => (
              <div key={goal.id} className="bg-slate-50 dark:bg-[#121216] border border-slate-100 dark:border-white/5 p-4 rounded-[16px] shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-[14px] bg-white dark:bg-white/5 flex items-center justify-center shadow-sm border border-slate-100 dark:border-white/5 shrink-0">
                  {goal.icon}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{goal.title}</h4>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{goal.percent}%</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium mb-2">R$ {goal.current.toLocaleString('pt-BR')} / R$ {goal.target.toLocaleString('pt-BR')}</p>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${goal.percent}%` }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </motion.div>
  );
}
