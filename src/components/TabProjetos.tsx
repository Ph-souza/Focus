import { motion } from 'motion/react';
import { Folder } from 'lucide-react';
import { User } from '../types';

interface TabProjetosProps {
  user?: User | null;
  onTabChange?: (tab: any) => void;
}

export function TabProjetos({ user, onTabChange }: TabProjetosProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6 p-0 md:p-8"
    >
      {/* Cabeçalho padrão */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Folder className="text-blue-500" size={28} />
            Projetos
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Seus projetos e tarefas
          </p>
        </div>
      </div>

      {/* Placeholder temporário */}
      <div className="glass-card p-12 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[380px]">
        {/* Glow de fundo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-16 h-16 rounded-3xl bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 shadow-[0_0_25px_rgba(59,130,246,0.3)] relative z-10">
          <Folder size={32} />
        </div>

        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 relative z-10">
          Módulo de Projetos em construção...
        </h3>

        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md leading-relaxed relative z-10">
          Em breve você poderá gerenciar fluxos completos, marcos e tarefas agrupadas por iniciativa de forma visual e intuitiva.
        </p>
      </div>
    </motion.div>
  );
}
