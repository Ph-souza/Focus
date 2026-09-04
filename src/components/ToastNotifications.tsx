import { motion, AnimatePresence } from 'motion/react';
import { Bell, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { AppNotification } from '../types';

interface ToastNotificationsProps {
  notifications: AppNotification[];
  onDismiss: (id: string) => void;
}

export function ToastNotifications({ notifications, onDismiss }: ToastNotificationsProps) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none w-full max-w-sm">
      <AnimatePresence>
        {notifications.map((notif) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className="pointer-events-auto bg-white rounded-lg p-4 shadow-sm border border-slate-200 flex items-start gap-3"
          >
            <div className={`mt-0.5 rounded-full p-1.5 ${
              notif.type === 'success' ? 'bg-emerald-50 text-emerald-600' :
              notif.type === 'warning' ? 'bg-amber-50 text-amber-600' :
              'bg-blue-50 text-blue-600'
            }`}>
              {notif.type === 'success' && <CheckCircle size={18} />}
              {notif.type === 'warning' && <AlertTriangle size={18} />}
              {notif.type === 'info' && <Bell size={18} />}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-slate-800 text-sm">{notif.title}</h4>
              <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{notif.message}</p>
            </div>
            <button 
              onClick={() => onDismiss(notif.id)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
