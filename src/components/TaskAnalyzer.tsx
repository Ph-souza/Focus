import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Layers, Zap, Loader2 } from 'lucide-react';
import { Task } from '../types';

interface TaskAnalyzerProps {
  tasks: Task[];
}

export function TaskAnalyzer({ tasks }: TaskAnalyzerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{ grouped: string[], automated: string[] } | null>(null);

  const analyzeTasks = () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);

    // Simulate Aurora analysis delay
    setTimeout(() => {
      // Very basic simulated logic for demonstration
      const taskTitles = tasks.map(t => t.title.toLowerCase());
      
      const suggestions = {
        grouped: [] as string[],
        automated: [] as string[]
      };

      if (taskTitles.some(t => t.includes('comprar') || t.includes('mercado'))) {
        suggestions.grouped.push("Agrupar idas ao supermercado e compras gerais em uma única 'Sessão de Compras'.");
      }
      
      if (taskTitles.some(t => t.includes('conta') || t.includes('pagar') || t.includes('boleto'))) {
        suggestions.automated.push("Configurar débito automático para contas frequentes ou centralizar os pagamentos no dia 5.");
      }

      if (taskTitles.some(t => t.includes('revisar') || t.includes('ler') || t.includes('estudar'))) {
        suggestions.grouped.push("Criar um bloco de foco (Timeboxing) diário de 1 hora para todas as atividades de revisão/estudo.");
      }

      if (suggestions.grouped.length === 0 && suggestions.automated.length === 0) {
        if (tasks.length > 2) {
           suggestions.grouped.push("Você tem várias tarefas esparsas. Que tal agrupar as de prioridade baixa para o final do dia?");
        } else {
           suggestions.grouped.push("Adicione mais tarefas para que a Aurora possa encontrar padrões de agrupamento.");
        }
      }

      setAnalysisResult(suggestions);
      setIsAnalyzing(false);
    }, 2000);
  };

  return (
    <div className="bg-gradient-to-br from-[#18181b] to-[#09090b] border border-indigo-500/20 shadow-lg rounded-3xl p-5 relative overflow-hidden mb-8">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none"></div>
      
      <div className="flex items-start justify-between relative z-10 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Sparkles size={16} />
          </div>
          <h2 className="text-sm font-bold text-white tracking-wide">Análise Inteligente Aurora</h2>
        </div>
        {!analysisResult && !isAnalyzing && (
          <button 
            onClick={analyzeTasks}
            className="text-[10px] font-bold bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
          >
            Analisar Padrões <Sparkles size={10} />
          </button>
        )}
      </div>

      <p className="text-xs text-slate-400 mb-4 relative z-10">
        A Aurora analisa a frequência das suas tarefas e sugere como você pode agrupá-las ou automatizá-las para economizar tempo.
      </p>

      <AnimatePresence mode="wait">
        {isAnalyzing ? (
          <motion.div 
            key="analyzing"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col items-center justify-center py-6 relative z-10"
          >
            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mb-3" />
            <p className="text-xs text-indigo-300 font-medium animate-pulse">Aurora está analisando seus padrões...</p>
          </motion.div>
        ) : analysisResult ? (
          <motion.div 
            key="results"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-3 relative z-10"
          >
            {analysisResult.grouped.length > 0 && (
              <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-3">
                <h4 className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5 mb-2">
                  <Layers size={12} /> Sugestões de Agrupamento
                </h4>
                <ul className="space-y-2">
                  {analysisResult.grouped.map((s, i) => (
                    <li key={i} className="text-[11px] text-slate-300 leading-relaxed flex items-start gap-1.5">
                      <span className="text-indigo-400 mt-0.5">•</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {analysisResult.automated.length > 0 && (
              <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-3 mt-2">
                <h4 className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5 mb-2">
                  <Zap size={12} /> Oportunidades de Automação
                </h4>
                <ul className="space-y-2">
                  {analysisResult.automated.map((s, i) => (
                    <li key={i} className="text-[11px] text-slate-300 leading-relaxed flex items-start gap-1.5">
                      <span className="text-emerald-400 mt-0.5">•</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button 
              onClick={() => setAnalysisResult(null)}
              className="mt-2 text-[10px] font-medium text-slate-500 hover:text-slate-300 self-end transition-colors"
            >
              Analisar novamente
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
