import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Smartphone, Sparkles } from 'lucide-react';
import { User } from '../types';
import { IosShortcutCard } from './IosShortcutCard';

interface IosShortcutModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export function IosShortcutModal({ isOpen, onClose, user }: IosShortcutModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-md glass-card p-5 sm:p-6 border border-purple-500/30 shadow-2xl relative overflow-hidden"
      >
        {/* Glow sutil */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer z-20"
          aria-label="Fechar modal"
        >
          <X size={18} />
        </button>

        {/* Card Component */}
        <IosShortcutCard user={user} className="border-0 shadow-none p-0 bg-transparent" />
      </motion.div>
    </div>
  );
}
