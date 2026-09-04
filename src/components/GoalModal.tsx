import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { User } from '../types';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export function GoalModal({ isOpen, onClose, user }: GoalModalProps) {
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  
  const handleSave = async () => {
    if (!title.trim() || !targetAmount.trim()) {
      alert("Por favor preencha título e valor alvo.");
      return;
    }
    const val = parseFloat(targetAmount.replace(',', '.'));
    if (isNaN(val) || val <= 0) {
      alert("Valor inválido.");
      return;
    }
    
    try {
      const newId = crypto.randomUUID();
      await setDoc(doc(db, `users/${user.id}/goals`, newId), {
        title: title.trim(),
        targetAmount: val,
        currentAmount: 0,
        deadline: '',
        type: 'financial',
        createdAt: serverTimestamp(),
        userId: user.id
      });
      setTitle('');
      setTargetAmount('');
      onClose();
    } catch (err) {
      console.error(err);
      alert("Erro ao criar meta.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-white dark:bg-[#18181b] rounded-2xl shadow-xl z-50 p-6 border border-slate-200 dark:border-slate-800"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Nova Meta</h3>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Título</label>
                <input 
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Reserva de Emergência"
                  className="w-full bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Valor Alvo (R$)</label>
                <input 
                  type="number"
                  step="0.01"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="1000.00"
                  className="w-full bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button 
                onClick={handleSave}
                className="w-full flex justify-center items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl py-3 font-bold transition-colors mt-2"
              >
                <Check size={18} /> Confirmar
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
