import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, User as UserIcon } from 'lucide-react';
import { User } from '../types';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onLogout: () => void;
  onOpenWhatsApp?: () => void;
  onSwitchToRealAccount?: () => void;
}

export function ProfileModal({ isOpen, onClose, user, onLogout, onOpenWhatsApp, onSwitchToRealAccount }: ProfileModalProps) {
  const [name, setName] = useState(user.name);
  const [dateOfBirth, setDateOfBirth] = useState(user.dateOfBirth || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(user.name);
      setDateOfBirth(user.dateOfBirth || '');
    }
  }, [isOpen, user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    
    // Fire and forget to allow optimistic UI update without hanging if offline
    setDoc(doc(db, 'users', user.id), {
      name,
      dateOfBirth
    }, { merge: true }).catch(err => {
      console.error("Delayed save error", err);
    });

    // Assume success for UI
    setTimeout(() => {
      setIsSaving(false);
      onClose();
    }, 400); // slight delay for visual feedback
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-colors"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-xl z-50 overflow-hidden border border-slate-100 dark:border-slate-700"
          >
            <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="font-bold text-slate-800 dark:text-slate-100">Configurações de Perfil</h2>
              <button 
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="flex flex-col items-center justify-center pb-2">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center overflow-hidden text-emerald-500 font-bold text-xl shadow-md">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    user?.name?.charAt(0) || 'U'
                  )}
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{user.email}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Nome
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <UserIcon size={18} />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Data de Nascimento
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Calendar size={18} />
                  </div>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <p className="mt-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                  Usado pela Mentoria Aurora para personalizar dicas para sua faixa etária.
                </p>
              </div>

              {/* WhatsApp Aurora Integration Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenWhatsApp) onOpenWhatsApp();
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                >
                  <div className="flex items-center gap-2 font-semibold">
                    <span className="text-base">💬</span>
                    <span>Integração WhatsApp - Aurora Sync</span>
                  </div>
                  <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                    Configurar
                  </span>
                </button>
              </div>
              
              <div className="pt-4 flex justify-between items-center mt-4 border-t border-slate-100 dark:border-slate-700/50">
                <button
                  type="button"
                  onClick={onLogout}
                  className="px-4 py-2 hover:bg-rose-50 text-rose-600 dark:hover:bg-rose-500/10 dark:text-rose-400 rounded-lg text-sm font-medium transition-colors"
                >
                  Sair da Conta
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}