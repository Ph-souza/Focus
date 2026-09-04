import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bell, Info, AlertTriangle, CheckCircle } from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationsModal({ isOpen, onClose }: NotificationsModalProps) {
  const [notifications] = useState([
    { id: 1, title: 'Boleto próximo do vencimento', message: 'Sua conta de energia vence amanhã.', type: 'warning', date: 'Há 2h' },
    { id: 2, title: 'Meta atingida!', message: 'Você atingiu 50% da sua meta "Reserva de Emergência".', type: 'success', date: 'Há 1 dia' },
    { id: 3, title: 'Dica da Aurora', message: 'Notei que você reduziu os gastos com transporte este mês. Ótimo trabalho!', type: 'info', date: 'Há 2 dias' },
  ]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-20">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        ></motion.div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          className="relative w-full max-w-sm bg-white dark:bg-[#0f111a] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#121214] flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-800 dark:text-white">
              <Bell size={18} className="text-indigo-500" />
              <h2 className="font-bold text-sm tracking-wide">Notificações</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#18181b] rounded-full transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* List */}
          <div className="max-h-[60vh] overflow-y-auto w-full">
            {notifications.length > 0 ? (
              <div className="flex flex-col">
                {notifications.map(n => (
                  <div key={n.id} className="p-4 border-b border-slate-100 dark:border-slate-800/50 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-[#18181b] transition-colors cursor-pointer">
                    <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      n.type === 'warning' ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' :
                      n.type === 'success' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' :
                      'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400'
                    }`}>
                      {n.type === 'warning' ? <AlertTriangle size={14} /> :
                       n.type === 'success' ? <CheckCircle size={14} /> :
                       <Info size={14} />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-0.5">{n.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 leading-snug">{n.message}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{n.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">
                Sem notificações
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
