import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Sparkles, X, MessageSquarePlus, Mic, MicOff } from 'lucide-react';
import { User, TabType, Transaction, Task } from '../types';
import { db } from '../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getApiUrl } from '../lib/api';

interface QuickChatProps {
  user: User;
  onOpenFullChat: () => void;
  activeTab: TabType;
  transactions?: Transaction[];
  tasks?: Task[];
}

export function QuickChat({ user, onOpenFullChat, activeTab, transactions = [], tasks = [] }: QuickChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [reply, setReply] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [imageBase64, setImageBase64] = useState<string | undefined>();
  const [mimeType, setMimeType] = useState<string | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

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

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const speechResult = event.results[0][0].transcript;
        setInputText(prev => prev + (prev ? ' ' : '') + speechResult);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

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
        const parts = base64String.split(';');
        if (parts.length > 1) {
          const mime = parts[0].split(':')[1];
          const base64 = parts[1].split(',')[1];
          setImageBase64(base64);
          setMimeType(mime);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !imageBase64) return;

    const currentText = inputText || 'Analisar imagem';
    setInputText('');
    const base64 = imageBase64;
    const mime = mimeType;
    setImageBase64(undefined);
    setMimeType(undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    setIsProcessing(true);
    setReply(null);

    const msgId = Date.now().toString() + Math.random().toString(36).substring(2, 7);
    
    // Fire and forget to not block UI
    setDoc(doc(db, `users/${user.id}/chatMessages`, msgId), {
      text: currentText,
      sender: 'user',
      timestamp: new Date().toISOString(),
      userId: user.id
    }).catch(err => {
      console.error("QuickChat save error", err);
    });

    // Call Gemini API
    try {
      let userAgeContext = '';
      if (user.dateOfBirth) {
        const dob = new Date(user.dateOfBirth);
        const ageDiffMs = Date.now() - dob.getTime();
        const ageDate = new Date(ageDiffMs);
        const age = Math.abs(ageDate.getUTCFullYear() - 1970);
        userAgeContext = `A idade do usuário é ${age} anos. Personalize e filtre as sugestões financeiras considerando esta idade.`;
      }

      // Create user data context for AI
      const recentTransactions = transactions.slice(0, 10).map(t => `${t.date}: ${t.title} (${t.type === 'expense' ? '-' : '+'}R$ ${t.amount}) [${t.category}]`).join('\n');
      const recentTasks = tasks.slice(0, 5).map(t => `- ${t.title} (Status: ${t.completed ? 'Concluída' : 'Pendente'}, Prioridade: ${t.priority})`).join('\n');
      
      const userDataContext = `--- Dados do Usuário para Contexto (Últimos registros adicionados) ---
Últimas 10 Transações:
${recentTransactions || 'Nenhuma transação recente.'}

Últimas 5 Tarefas:
${recentTasks || 'Nenhuma tarefa pendente/recente.'}`;

      const response = await fetch(getApiUrl('/api/chat'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: currentText,
          message: currentText,
          history: [], // Quick chat can have empty local history context to save time/tokens unless we fetch from DB
          userAgeContext,
          userDataContext,
          imageBase64: base64,
          imageMimeType: mime,
          currentDate: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Falha ao comunicar com o Mentor Focus');
      }

      const data = await response.json();
      
      if (data.functionCalls && Array.isArray(data.functionCalls)) {
        for (const call of data.functionCalls) {
          try {
            if (call.name === 'add_task') {
              const { title, description, priority, deadline } = call.args;
              const newTaskId = Date.now().toString() + Math.random().toString(36).substring(2, 9);
              const newTask = {
                id: newTaskId,
                title: title || 'Nova Tarefa via Mentor',
                completed: false,
                priority: priority || 'medium',
                deadline: deadline || '',
                description: description || '',
                createdAt: serverTimestamp()
              };
              await setDoc(doc(db, `users/${user.id}/tasks`, newTaskId), newTask);
            } else if (call.name === 'add_transaction') {
              const { title, amount, type, category, date } = call.args;
              const newTxId = Date.now().toString() + Math.random().toString(36).substring(2, 9);
              const newTx = {
                id: newTxId,
                title: title || 'Transação via Mentor',
                amount: Number(amount) || 0,
                type: type || 'expense',
                category: category || 'Outros',
                date: date || new Date().toISOString().split('T')[0],
                createdAt: serverTimestamp()
              };
              await setDoc(doc(db, `users/${user.id}/transactions`, newTxId), newTx);
            } else if (call.name === 'complete_task') {
              const { taskTitle } = call.args;
              if (taskTitle && tasks) {
                const targetTask = tasks.find(t => t.title.toLowerCase().includes(taskTitle.toLowerCase()));
                if (targetTask) {
                  await setDoc(doc(db, `users/${user.id}/tasks`, targetTask.id), {
                    ...targetTask,
                    completed: true
                  });
                }
              }
            }
          } catch (err) {
            console.error(`Erro ao executar function call ${call.name}:`, err);
          }
        }
      }

      const shortReply = data.text ? (data.text.length > 200 ? data.text.substring(0, 200) + "..." : data.text) : "Executado com precisão.";
      
      finalizeQuickChatResponse(shortReply);
    } catch (error) {
      console.error(error);
      finalizeQuickChatResponse('Ocorreu um erro ao processar sua solicitação pelo Mentor Focus.');
    }
  };

  const finalizeQuickChatResponse = async (aiResponse: string) => {
    setReply(aiResponse);
    setIsProcessing(false);

    const aiMsgId = Date.now().toString() + Math.random().toString(36).substring(2, 7);
    
    // Fire and forget
    setDoc(doc(db, `users/${user.id}/chatMessages`, aiMsgId), {
      text: aiResponse,
      sender: 'ai',
      timestamp: new Date().toISOString(),
      userId: user.id
    }).catch(err => { console.error(err) });

    setTimeout(() => {
      setReply(null);
      setIsOpen(false);
    }, 4000);
  };

  if (activeTab === 'chat') return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="hidden md:block fixed bottom-24 md:bottom-28 right-4 w-[calc(100vw-2rem)] md:w-72 md:right-8 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 p-4 z-50 overflow-hidden"
          >
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Sparkles size={16} />
                <span className="font-semibold text-sm">Adição Rápida</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={16} />
              </button>
            </div>
            
            {reply ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 p-3 rounded-lg text-center font-medium">
                {reply}
              </motion.div>
            ) : (
              <div className="flex flex-col gap-2">
                {imageBase64 && (
                  <div className="flex items-center justify-between bg-blue-500/20 px-3 py-1 rounded-lg border border-blue-500/30 w-fit">
                    <span className="text-[10px] text-blue-600 dark:text-blue-400">Imagem anexada</span>
                    <button 
                      type="button"
                      onClick={() => {
                        setImageBase64(undefined);
                        setMimeType(undefined);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="text-slate-400 hover:text-red-400 ml-2"
                    >
                      ×
                    </button>
                  </div>
                )}
                <form onSubmit={handleSend} className="relative flex items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden pr-1">
                  <input 
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="pl-3 pr-2 py-2.5 text-slate-400 hover:text-blue-500 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
                  </button>
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const form = e.currentTarget.closest('form');
                        if (form) {
                          form.requestSubmit();
                        }
                      }
                    }}
                    placeholder="Adicionar nota..."
                    className="w-full bg-transparent py-2.5 px-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none placeholder:text-slate-400"
                    autoFocus
                    disabled={isProcessing}
                  />
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`p-2 transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-slate-400 hover:text-blue-500'}`}
                    title={isListening ? "Parar gravação" : "Falar comando"}
                  >
                    {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                  </button>
                  <button
                    type="submit"
                    disabled={(!inputText.trim() && !imageBase64) || isProcessing}
                    className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shrink-0 ml-1"
                  >
                    <Send size={14} />
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hidden md:flex fixed bottom-20 md:bottom-8 right-4 md:right-8 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all items-center justify-center z-40"
        title="Mentor Focus"
      >
        {isOpen ? <X size={24} /> : <MessageSquarePlus size={24} />}
      </button>
    </>
  );
}
