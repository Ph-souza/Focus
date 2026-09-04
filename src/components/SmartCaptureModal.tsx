import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, ChevronRight, Camera, Mic, MicOff } from 'lucide-react';

interface SmartCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (text: string, imageBase64?: string, mimeType?: string) => void;
}

export function SmartCaptureModal({ isOpen, onClose, onSubmit }: SmartCaptureModalProps) {
  const [text, setText] = useState('');
  const [imageBase64, setImageBase64] = useState<string | undefined>();
  const [mimeType, setMimeType] = useState<string | undefined>();
  const [imageName, setImageName] = useState<string | undefined>();
  const [isListening, setIsListening] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen && isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }
  }, [isOpen, isListening]);

  if (!isOpen) return null;

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Seu navegador não suporta reconhecimento de voz.");
      return;
    }
    
    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const speechResult = event.results[0][0].transcript;
        setText(prev => prev + (prev ? ' ' : '') + speechResult);
      };
      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
    }

    recognitionRef.current.start();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // The result is something like "data:image/jpeg;base64,/9j/4AAQSk..."
        const parts = base64String.split(';');
        if (parts.length > 1) {
          const mime = parts[0].split(':')[1];
          const base64 = parts[1].split(',')[1];
          setImageBase64(base64);
          setMimeType(mime);
          setImageName(file.name);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[24px] shadow-xl overflow-hidden p-6 z-10"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Captura Inteligente</h2>
            <button onClick={onClose} className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 text-center px-4 leading-relaxed">
            A inteligência analisará seu comando e criará a meta, despesa ou tarefa automaticamente.
          </p>

          <div className="mb-6 relative flex items-center gap-2">
             <input
               type="text"
               value={text}
               onChange={(e) => setText(e.target.value)}
               placeholder="Ex: Gastei 150 em compras hoje..."
               className="flex-1 bg-slate-50 dark:bg-[#121214] border border-slate-200 dark:border-slate-800 rounded-2xl py-4 px-4 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
             />
             <button 
               onClick={toggleListening}
               className={`p-4 border rounded-2xl transition-colors shrink-0 ${isListening ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/50 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 animate-pulse' : 'bg-slate-50 dark:bg-[#121214] border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
               title={isListening ? "Parar gravação" : "Usar comando de voz"}
             >
               {isListening ? <MicOff size={20} /> : <Mic size={20} />}
             </button>
             <button 
               onClick={() => fileInputRef.current?.click()}
               className="p-4 bg-slate-50 dark:bg-[#121214] border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
               title="Enviar comprovante ou foto"
             >
               <Camera size={20} />
             </button>
             <input 
               type="file" 
               accept="image/*" 
               ref={fileInputRef}
               className="hidden" 
               onChange={handleImageUpload}
             />
          </div>

          {imageName && (
            <div className="mb-4 flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
              <span className="text-xs text-blue-600 dark:text-blue-400 truncate pr-2">Anexo: {imageName}</span>
              <button 
                onClick={() => {
                  setImageBase64(undefined);
                  setMimeType(undefined);
                  setImageName(undefined);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="text-slate-400 hover:text-red-500"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <button 
            onClick={() => {
              if (text.trim() || imageBase64) {
                onSubmit(text, imageBase64, mimeType);
                setText('');
                setImageBase64(undefined);
                setMimeType(undefined);
                setImageName(undefined);
                onClose();
              }
            }}
            className="w-full bg-[#6366f1] hover:bg-indigo-500 text-white rounded-2xl py-4 font-bold text-sm shadow-[0_4px_14px_rgba(99,102,241,0.3)] transition-all flex items-center justify-center gap-2 mb-8"
          >
            <Sparkles size={16} /> Analisar Comando
          </button>

          <div>
             <div className="flex items-center gap-2 mb-4">
                <Sparkles size={14} className="text-[#6366f1]" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Ações Proativas Pessoais:</span>
             </div>
             
             <div className="space-y-3">
               {[
                 'Gastei 45 com almoço agora',
                 'Lembrar de pagar o contador amanhã às 10h',
                 'Adicionar um novo ganho extra de 250',
                 'Transferir 100 para a caixinha de Viagem'
               ].map((suggestion, idx) => (
                 <button
                   key={idx}
                   onClick={() => setText(suggestion)}
                   className="w-full flex items-center gap-3 text-left p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"
                 >
                   <ChevronRight size={14} className="text-slate-400 group-hover:text-[#6366f1]" />
                   <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{suggestion}</span>
                 </button>
               ))}
             </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
