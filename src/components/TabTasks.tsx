import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Trash2 } from 'lucide-react';
import { Task, User } from '../types';
import { TaskAnalyzer } from './TaskAnalyzer';
import { db } from '../lib/firebase';
import { doc, setDoc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

interface TabTasksProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  user: User;
}

export function TabTasks({ tasks, setTasks, user }: TabTasksProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTaskDeadline, setNewTaskDeadline] = useState<'Hoje' | 'Amanhã' | '3 dias'>('Hoje');

  const handleToggle = async (taskId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, `users/${user.id}/tasks`, taskId), {
        completed: !currentStatus
      });
    } catch (err) {
      console.error('Failed to update task', err);
    }
  };

  const handleDelete = async (taskId: string) => {
    const confirmed = window.confirm(`Deseja realmente excluir esta tarefa permanentemente? Não poderá ser desfeito.`);
    if (!confirmed) return;
    
    try {
      await deleteDoc(doc(db, `users/${user.id}/tasks`, taskId));
    } catch (err) {
      console.error('Failed to delete task', err);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    let dueParam: string | undefined;
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const currentDate = new Date().getDate();
    
    if (newTaskDeadline === 'Hoje') {
      dueParam = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(currentDate).padStart(2, '0')}`;
    } else if (newTaskDeadline === 'Amanhã') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      dueParam = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    } else if (newTaskDeadline === '3 dias') {
      const threeDays = new Date();
      threeDays.setDate(threeDays.getDate() + 3);
      dueParam = `${threeDays.getFullYear()}-${String(threeDays.getMonth() + 1).padStart(2, '0')}-${String(threeDays.getDate()).padStart(2, '0')}`;
    }

    try {
      const newId = crypto.randomUUID();
      await setDoc(doc(db, `users/${user.id}/tasks`, newId), {
        title: newTaskTitle,
        completed: false,
        priority: newTaskPriority,
        description: `Prioridade: ${newTaskPriority}`,
        deadline: dueParam || '',
        createdAt: serverTimestamp(),
        userId: user.id
      });
      setNewTaskTitle('');
    } catch (err) {
      console.error('Failed to create task', err);
      alert('Houve um erro ao tentar criar a tarefa.');
    }
  };

  const getDueDateString = (deadline?: string) => {
    if (!deadline) return 'Sem prazo';
    return `Vence em: ${deadline.split('-').reverse().join('/')}`;
  }

  const priorityLabels = {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta'
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full flex flex-col gap-8 pb-10 px-2"
    >
      <TaskAnalyzer tasks={tasks} />

      <div>
        <h2 className="text-sm font-bold text-slate-800 dark:text-white mb-6">Adicionar Nova Tarefa Diária</h2>
        
        <form onSubmit={handleAdd} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <input 
              type="text" 
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="O que precisa fazer?"
              className="w-full bg-transparent border-none py-2 text-slate-800 dark:text-white text-[13px] focus:outline-none placeholder:text-slate-400 font-medium"
            />
          </div>

          <div className="flex flex-col gap-3">
             <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Nível de Prioridade:</label>
             <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setNewTaskPriority('high')} 
                  className={`flex-1 py-3 rounded-xl text-[11px] font-bold transition-all ${newTaskPriority === 'high' ? 'bg-orange-500 text-white shadow-md' : 'bg-transparent text-slate-800 dark:text-slate-200'}`}
                >
                  Alta
                </button>
                <button 
                  type="button" 
                  onClick={() => setNewTaskPriority('medium')} 
                  className={`flex-1 py-3 rounded-xl text-[11px] font-bold transition-all ${newTaskPriority === 'medium' ? 'bg-orange-500 text-white shadow-md' : 'bg-transparent text-slate-800 dark:text-slate-200'}`}
                >
                  Média
                </button>
                <button 
                  type="button" 
                  onClick={() => setNewTaskPriority('low')} 
                  className={`flex-1 py-3 rounded-xl text-[11px] font-bold transition-all ${newTaskPriority === 'low' ? 'bg-orange-500 text-white shadow-md' : 'bg-transparent text-slate-800 dark:text-slate-200'}`}
                >
                  Baixa
                </button>
             </div>
          </div>

          <div className="flex flex-col gap-3">
             <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Previsão de Prazo:</label>
             <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setNewTaskDeadline('Hoje')} 
                  className={`flex-1 py-3 rounded-xl text-[11px] font-bold transition-all ${newTaskDeadline === 'Hoje' ? 'bg-indigo-500 text-white shadow-md' : 'bg-transparent text-slate-800 dark:text-slate-200'}`}
                >
                  Hoje
                </button>
                <button 
                  type="button" 
                  onClick={() => setNewTaskDeadline('Amanhã')} 
                  className={`flex-1 py-3 rounded-xl text-[11px] font-bold transition-all ${newTaskDeadline === 'Amanhã' ? 'bg-indigo-500 text-white shadow-md' : 'bg-transparent text-slate-800 dark:text-slate-200'}`}
                >
                  Amanhã
                </button>
                <button 
                  type="button" 
                  onClick={() => setNewTaskDeadline('3 dias')} 
                  className={`flex-1 py-3 rounded-xl text-[11px] font-bold transition-all ${newTaskDeadline === '3 dias' ? 'bg-indigo-500 text-white shadow-md' : 'bg-transparent text-slate-800 dark:text-slate-200'}`}
                >
                  3 dias
                </button>
             </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white rounded-[20px] py-4 font-bold text-[13px] shadow-[0_4px_14px_rgba(99,102,241,0.3)] transition-all mt-4"
          >
            Adicionar Tarefa
          </button>
        </form>
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-bold text-slate-800 dark:text-white mb-8">Suas Tarefas Agendadas</h2>
        
        <div className="flex flex-col gap-8">
          {tasks.map(task => {
            const isHigh = task.priority === 'high';
            const isLow = task.priority === 'low';
            const priorityColor = isHigh ? 'text-red-500' : isLow ? 'text-green-500' : 'text-amber-500';
            
            return (
              <div key={task.id} className="flex items-start gap-4 group">
                <div 
                  onClick={() => handleToggle(task.id, task.completed)}
                  className={`mt-1 w-6 h-6 rounded-full flex items-center justify-center shrink-0 cursor-pointer transition-colors ${task.completed ? 'bg-emerald-400' : 'bg-slate-50 border-[1.5px] border-slate-200 dark:bg-[#0f111a] dark:border-[#27272a]'}`}
                >
                  {task.completed && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-bold mb-1 transition-colors ${task.completed ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-800 dark:text-slate-100'}`}>
                    {task.title}
                  </p>
                  <p className={`text-[10px] font-semibold ${priorityColor}`}>
                    Prioridade {priorityLabels[task.priority || 'medium']} • {getDueDateString(task.deadline)}
                  </p>
                </div>
                <button 
                   onClick={() => handleDelete(task.id)}
                   className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 transition-all shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
          
          {tasks.length === 0 && (
            <div className="text-center py-6 text-slate-400 text-sm font-medium border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              Nenhuma tarefa agendada.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
