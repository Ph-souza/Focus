import { motion } from 'motion/react';
import { ArrowUpRight, ArrowDownRight, Banknote, ChevronLeft, ChevronRight, TrendingUp, Target } from 'lucide-react';

export function TabFinances() {
  const transactions = [
    { name: 'Mercado Extra', date: '26 mai 2025', amount: '- R$ 120,00', color: 'text-rose-500', iconBg: 'bg-rose-100 dark:bg-rose-900/30 text-rose-500', icon: 'M' },
    { name: 'Salário', date: '25 mai 2025', amount: '+ R$ 3.500,00', color: 'text-emerald-500', iconBg: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500', icon: 'S' },
    { name: 'Uber', date: '24 mai 2025', amount: '- R$ 38,00', color: 'text-rose-500', iconBg: 'bg-slate-100 dark:bg-white/10 text-slate-500', icon: 'U' },
    { name: 'Netflix', date: '23 mai 2025', amount: '- R$ 55,90', color: 'text-rose-500', iconBg: 'bg-red-100 dark:bg-red-900/30 text-red-500', icon: 'N' },
  ];

  const goals = [
    { name: 'Viagem Europa', current: 4200, target: 10000, percent: 42, color: 'bg-blue-500' },
    { name: 'Novo Notebook', current: 2800, target: 8000, percent: 35, color: 'bg-emerald-500' },
    { name: 'Reserva de Emergência', current: 6000, target: 20000, percent: 30, color: 'bg-indigo-500' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-full p-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Finanças</h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Mais controle para um futuro maior.
          </p>
        </div>
        <div className="flex items-center gap-4 bg-white dark:bg-[#0b101e] border border-slate-200 dark:border-white/5 rounded-xl px-2 py-1 shadow-sm">
          <button className="p-1 hover:bg-slate-100 dark:hover:bg-white/5 rounded-md text-slate-500 dark:text-slate-400 transition-colors"><ChevronLeft size={16}/></button>
          <span className="font-bold text-sm text-slate-800 dark:text-white">Maio 2025</span>
          <button className="p-1 hover:bg-slate-100 dark:hover:bg-white/5 rounded-md text-slate-500 dark:text-slate-400 transition-colors"><ChevronRight size={16}/></button>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        
        {/* Top Cards (3 cols) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-[#0b101e] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm relative overflow-hidden group">
            <h2 className="font-bold text-sm text-slate-500 dark:text-slate-400 mb-2">Saldo disponível</h2>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">R$ 4.350,00</h3>
            <div className="flex items-center gap-1 mt-4 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 w-max px-2 py-1 rounded-md">
              <ArrowUpRight size={14} />
              <span>12% este mês</span>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10 text-[#3b82f6] dark:text-[#6366f1] group-hover:scale-110 transition-transform">
              <Banknote size={100} />
            </div>
          </div>

          <div className="bg-white dark:bg-[#0b101e] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start mb-2">
              <h2 className="font-bold text-sm text-slate-500 dark:text-slate-400">Receitas</h2>
              <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center">
                <ArrowUpRight size={16} strokeWidth={3} />
              </div>
            </div>
            <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">R$ 7.200,00</h3>
            <div className="flex items-center gap-1 mt-4 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <TrendingUp size={14} /> 8%
            </div>
          </div>

          <div className="bg-white dark:bg-[#0b101e] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start mb-2">
              <h2 className="font-bold text-sm text-slate-500 dark:text-slate-400">Despesas</h2>
              <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-500 flex items-center justify-center">
                <ArrowDownRight size={16} strokeWidth={3} />
              </div>
            </div>
            <h3 className="text-3xl font-black text-rose-600 dark:text-rose-400 tracking-tight">R$ 2.850,00</h3>
            <div className="flex items-center gap-1 mt-4 text-xs font-bold text-rose-600 dark:text-rose-400">
              <TrendingUp size={14} className="transform rotate-180" /> 5%
            </div>
          </div>
        </div>

        {/* Middle Charts (2 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Bar Chart */}
          <div className="bg-white dark:bg-[#0b101e] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-bold text-sm text-slate-800 dark:text-white">Evolução mensal</h2>
              <div className="flex gap-4 text-xs font-bold">
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400"><div className="w-2 h-2 rounded-full bg-current"></div> Receitas</span>
                <span className="flex items-center gap-1.5 text-blue-600 dark:text-[#3b82f6]"><div className="w-2 h-2 rounded-full bg-current"></div> Despesas</span>
              </div>
            </div>
            
            <div className="h-48 flex items-end justify-between gap-2 px-2 relative">
              {/* Y Axis Grid Lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                <div className="border-b border-slate-300 dark:border-white/20 w-full h-0"></div>
                <div className="border-b border-slate-300 dark:border-white/20 w-full h-0"></div>
                <div className="border-b border-slate-300 dark:border-white/20 w-full h-0"></div>
                <div className="border-b border-slate-300 dark:border-white/20 w-full h-0"></div>
              </div>
              
              {/* Bars */}
              {[
                { m: 'Jan', in: 80, out: 50 },
                { m: 'Fev', in: 65, out: 40 },
                { m: 'Mar', in: 90, out: 70 },
                { m: 'Abr', in: 85, out: 60 },
                { m: 'Mai', in: 70, out: 30 },
                { m: 'Jun', in: 0, out: 0 },
              ].map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-2 relative z-10 group cursor-pointer">
                  <div className="w-full flex items-end justify-center gap-1.5 h-full">
                    {d.in > 0 && <div className="w-3 md:w-5 bg-gradient-to-t from-emerald-500 to-emerald-300 rounded-t-sm transition-transform group-hover:scale-y-105 origin-bottom" style={{ height: `${d.in}%` }}></div>}
                    {d.out > 0 && <div className="w-3 md:w-5 bg-gradient-to-t from-[#3b82f6] to-blue-300 rounded-t-sm transition-transform group-hover:scale-y-105 origin-bottom" style={{ height: `${d.out}%` }}></div>}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">{d.m}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Donut Chart */}
          <div className="bg-white dark:bg-[#0b101e] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm">
            <h2 className="font-bold text-sm text-slate-800 dark:text-white mb-6">Gastos por categoria</h2>
            
            <div className="flex items-center gap-8 h-48">
              {/* Donut SVG */}
              <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Moradia 32% (blue) */}
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" strokeWidth="16" strokeDasharray="80 251" strokeDashoffset="0" className="transition-all hover:stroke-width-[20px]" />
                  {/* Alimentação 24% (emerald) */}
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="16" strokeDasharray="60 251" strokeDashoffset="-80" />
                  {/* Transporte 18% (amber) */}
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#f59e0b" strokeWidth="16" strokeDasharray="45 251" strokeDashoffset="-140" />
                  {/* Lazer 15% (rose) */}
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#f43f5e" strokeWidth="16" strokeDasharray="37 251" strokeDashoffset="-185" />
                  {/* Saúde 11% (indigo) */}
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#6366f1" strokeWidth="16" strokeDasharray="29 251" strokeDashoffset="-222" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs font-bold text-slate-500">Total</span>
                  <span className="text-lg font-black text-slate-900 dark:text-white">R$ 2.850</span>
                </div>
              </div>
              
              {/* Legend */}
              <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto pr-2">
                {[
                  { name: 'Moradia', pct: '32%', color: 'bg-blue-500' },
                  { name: 'Alimentação', pct: '24%', color: 'bg-emerald-500' },
                  { name: 'Transporte', pct: '18%', color: 'bg-amber-500' },
                  { name: 'Saúde', pct: '15%', color: 'bg-rose-500' },
                  { name: 'Lazer', pct: '11%', color: 'bg-indigo-500' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-sm ${item.color}`}></span>
                      {item.name}
                    </div>
                    <span className="text-slate-400">{item.pct}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Lists (2 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Transações recentes */}
          <div className="bg-white dark:bg-[#0b101e] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-sm text-slate-800 dark:text-white">Transações recentes</h2>
              <button className="text-xs font-bold text-[#3b82f6] dark:text-[#6366f1] hover:underline flex items-center gap-1">Ver todas <ChevronRight size={14} /></button>
            </div>
            
            <div className="flex flex-col gap-1">
              {transactions.map((tx, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer group">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${tx.iconBg}`}>
                    {tx.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-[#3b82f6] dark:group-hover:text-[#6366f1] transition-colors">{tx.name}</h3>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{tx.date}</span>
                  </div>
                  <div className={`text-sm font-bold ${tx.color}`}>
                    {tx.amount}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Caixinhas e Metas */}
          <div className="bg-white dark:bg-[#0b101e] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-sm text-slate-800 dark:text-white">Caixinhas e metas</h2>
              <button className="text-xs font-bold text-[#3b82f6] dark:text-[#6366f1] hover:underline flex items-center gap-1">Ver todas <ChevronRight size={14} /></button>
            </div>
            
            <div className="flex flex-col gap-4">
              {goals.map((goal, i) => (
                <div key={i} className="flex flex-col gap-2 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer border border-transparent dark:hover:border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400">
                        <Target size={16} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{goal.name}</span>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">R$ {goal.current} / R$ {goal.target}</span>
                      </div>
                    </div>
                    <span className="text-sm font-black text-slate-700 dark:text-slate-300">{goal.percent}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden mt-1">
                    <div className={`h-full ${goal.color} rounded-full`} style={{ width: `${goal.percent}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </motion.div>
  );
}
