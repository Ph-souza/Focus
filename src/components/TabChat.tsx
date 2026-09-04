import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Sparkles, CheckCircle2, Mic, MicOff } from 'lucide-react';
import { ChatMessage, Transaction, Task, TabType, User } from '../types';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getApiUrl } from '../lib/api';

interface TabChatProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  transactions: Transaction[];
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  onTabChange: (tab: TabType) => void;
  user: User;
  initialPrompt?: { text: string; imageBase64?: string; mimeType?: string } | null;
  onPromptHandled?: () => void;
}

export function TabChat({ messages, setMessages, transactions, tasks, setTasks, onTabChange, user, initialPrompt, onPromptHandled }: TabChatProps) {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [detectedSubscriptions, setDetectedSubscriptions] = useState<Transaction[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [imageBase64, setImageBase64] = useState<string | undefined>();
  const [mimeType, setMimeType] = useState<string | undefined>();
  const [showHistory, setShowHistory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isListening, setIsListening] = useState(false);
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

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const speechResult = event.results[0][0].transcript;
        setInputText(prev => prev + (prev ? ' ' : '') + speechResult);
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, detectedSubscriptions, isTyping]);

  useEffect(() => {
    if (initialPrompt) {
      handleSendContent(initialPrompt.text, initialPrompt.imageBase64, initialPrompt.mimeType);
      if (onPromptHandled) onPromptHandled();
    }
  }, [initialPrompt]);

  useEffect(() => {
    if (messages.length === 0) {
      const timer = setTimeout(() => {
        // Double check still 0 to avoid race condition with snapshot load
        if (messages.length === 0) {
          addMessageToDb(`Olá, ${user.name.split(' ')[0]}. Eu sou o Mentor Focus, sua inteligência de alta performance. Como posso direcionar seu foco e disciplina hoje?`, 'ai');
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [messages.length, user.name]);

  const addMessageToDb = async (text: string, sender: 'user' | 'ai') => {
    const msgId = Date.now().toString() + Math.random().toString(36).substring(2, 7);
    const newMsg = {
      text,
      sender,
      timestamp: new Date().toISOString(),
      userId: user.id
    };

    // Fire and forget to not block UI
    setDoc(doc(db, `users/${user.id}/chatMessages`, msgId), newMsg).catch(err => {
      console.error("Chat message save error", err);
    });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !imageBase64) return;
    
    const textToProcess = inputText;
    const base64ToProcess = imageBase64;
    const mimeToProcess = mimeType;

    setInputText('');
    setImageBase64(undefined);
    setMimeType(undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';

    await handleSendContent(textToProcess, base64ToProcess, mimeToProcess);
  };

  const handleSendContent = async (text: string, base64?: string, mime?: string) => {
    const currentText = text || 'Análise de Imagem';
    await addMessageToDb(currentText, 'user');
    
    setIsTyping(true);

    // Call Gemini API
    try {
      // Create user data context for AI
      const recentTransactions = transactions.slice(0, 10).map(t => `${t.date}: ${t.title} (${t.type === 'expense' ? '-' : '+'}R$ ${t.amount}) [${t.category}]`).join('\n');
      const recentTasks = tasks.slice(0, 5).map(t => `- ${t.title} (Status: ${t.completed ? 'Concluída' : 'Pendente'}, Prioridade: ${t.priority})`).join('\n');
      
      const userDataContext = `--- Dados do Usuário para Contexto (Últimos registros adicionados) ---
Últimas 10 Transações:
${recentTransactions || 'Nenhuma transação recente.'}

Últimas 5 Tarefas:
${recentTasks || 'Nenhuma tarefa pendente/recente.'}`;

      const historyFormatted = messages
        .filter(msg => msg.text && msg.text.trim())
        .slice(-20)
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text.trim() }]
        }));

      let userAgeContext = '';
      if (user.dateOfBirth) {
        const dob = new Date(user.dateOfBirth);
        const ageDiffMs = Date.now() - dob.getTime();
        const ageDate = new Date(ageDiffMs);
        const age = Math.abs(ageDate.getUTCFullYear() - 1970);
        userAgeContext = `A idade do usuário é ${age} anos. Personalize e filtre as sugestões considerando esta idade.`;
      }

      const response = await fetch(getApiUrl('/api/chat'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: currentText,
          message: currentText,
          history: historyFormatted,
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
      
      if (data.text) {
        await addMessageToDb(data.text, 'ai');
      } else if (data.functionCalls && data.functionCalls.length > 0) {
        await addMessageToDb('Executado com precisão. Informações registradas.', 'ai');
      }

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
    } catch (error) {
      console.error(error);
      addMessageToDb('Desculpe, tive um problema ao tentar processar sua mensagem.', 'ai');
    } finally {
      setIsTyping(false);
    }
  };

  const createAppointmentFromText = async (text: string) => {
    // Simple mock logic for appointment extraction
    const aptId = `apt-${Date.now()}`;
    const newApt = {
      title: text.length > 50 ? 'Novo Compromisso' : text.replace(/compromisso|reunião|reuniao|agenda/gi, '').trim() || 'Novo Compromisso',
      time: '12:00', // Mock time
      type: 'Agendado',
      day: new Date().getDate(), // Default to today
      userId: user.id,
      createdAt: serverTimestamp()
    };

    try {
      await setDoc(doc(db, `users/${user.id}/appointments`, aptId), newApt);
      addMessageToDb(`Pronto! Adicionei um compromisso na sua agenda para hoje: "${newApt.title}" às 12:00.`, 'ai');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${user.id}/appointments/${aptId}`);
    }
  };

  const createTaskFromText = async (text: string) => {
    const title = text.replace(/tarefa|lembrete/gi, '').trim() || 'Nova Tarefa via Aurora';
    
    if (!window.confirm(`Deseja que a Aurora crie a tarefa "${title}"?`)) {
      addMessageToDb(`Criação da tarefa "${title}" cancelada.`, 'ai');
      return;
    }

    try {
      const newTaskId = Date.now().toString() + Math.random().toString(36).substring(2, 9);
      const newTask = {
        title: title,
        completed: false,
        priority: 'medium',
        description: 'Criado via Aurora Sync Chat',
        userId: user.id,
        createdAt: serverTimestamp()
      };
      
      await setDoc(doc(db, `users/${user.id}/tasks`, newTaskId), newTask);

      addMessageToDb(`Criei a tarefa "${title}" para você. Dá uma olhada na aba de Tarefas!`, 'ai');
    } catch (err) {
      console.error(err);
      addMessageToDb(`Desculpe, não consegui criar a tarefa.`, 'ai');
    }
  };

  const analyzeSubscriptions = () => {
    const knownSubscriptions = ['netflix', 'spotify', 'amazon', 'gympass', 'hbo', 'disney'];
    const subs = transactions.filter(t => 
      t.type === 'expense' && knownSubscriptions.some(sub => t.title.toLowerCase().includes(sub))
    );
    
    setDetectedSubscriptions(subs);

    addMessageToDb(`Analisei suas transações e encontrei ${subs.length} gastos recorrentes (assinaturas) que totalizam R$${subs.reduce((a, b) => a + b.amount, 0).toFixed(2)} ao mês. Gostaria que eu criasse tarefas para ajudar você a revisar e cancelar as que não utiliza mais?`, 'ai');
  };

  const createCancellationTasks = async () => {
    if (!window.confirm(`Deseja criar ${detectedSubscriptions.length} tarefas de cancelamento?`)) {
      return;
    }

    const createdTasks: Task[] = [];
    
    for (const sub of detectedSubscriptions) {
      try {
        const title = `Avaliar cancelamento: ${sub.title} (R$${sub.amount})`;
        const newTaskId = Date.now().toString() + Math.random().toString(36).substring(2, 9);
        const newTask = {
          title: title,
          completed: false,
          priority: 'high',
          description: 'Revisão de Assinaturas',
          userId: user.id,
          createdAt: serverTimestamp()
        };
        
        await setDoc(doc(db, `users/${user.id}/tasks`, newTaskId), newTask);
      } catch (err) {
        console.error('Failed to create task for subscription', sub.title, err);
      }
    }
    
    setDetectedSubscriptions([]);
    
    await addMessageToDb(`Excelente! Adicionei tarefas na sua aba de Tarefas para você revisar suas assinaturas. Fique de olho e economize!`, 'ai');
    
    setTimeout(() => {
      onTabChange('tasks');
    }, 2500);
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

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const displayMessages = messages.filter(msg => {
    const msgDate = new Date(msg.timestamp);
    if (!showHistory) {
      return msgDate.toDateString() === new Date().toDateString();
    }
    return msgDate >= oneYearAgo;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto h-[calc(100vh-120px)] md:h-[calc(100vh-80px)] bg-slate-900 rounded-xl p-5 flex flex-col gap-4 text-white relative shadow-2xl overflow-hidden"
    >
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold italic shadow-sm">M</div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Mentor Focus</p>
            <p className="text-[10px] text-slate-400 italic">Alta Performance</p>
          </div>
        </div>
        <button 
          onClick={analyzeSubscriptions}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium cursor-pointer transition-colors border border-white/10"
        >
          <Sparkles size={14} className="text-blue-400" />
          <span>Escanear Assinaturas</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-3 justify-end overflow-hidden pb-4 z-10">
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar flex flex-col">
          {messages.length > 0 && (
            <div className="flex justify-center my-2">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="text-[10px] uppercase tracking-wider px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 transition-colors"
              >
                {showHistory ? "Ocultar Histórico" : "Ver histórico do último ano"}
              </button>
            </div>
          )}
          {displayMessages.length === 0 && !isTyping && (
             <div className="flex justify-center text-xs text-slate-500 italic my-4">
               Sem mensagens hoje.
             </div>
          )}
          {displayMessages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                key={msg.id} 
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[85%] p-3 text-[13px] leading-relaxed relative ${
                     isUser 
                      ? 'bg-blue-600 rounded-xl rounded-br-none text-white' 
                      : 'bg-slate-800 rounded-xl rounded-bl-none text-slate-200'
                  }`}
                >
                  {msg.text}
                </div>
              </motion.div>
            );
          })}
          
          {detectedSubscriptions.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="flex justify-start pl-11 mt-2"
            >
              <div className="bg-slate-800 border border-blue-500/30 rounded-xl p-3 w-full max-w-[85%]">
                <p className="text-xs font-medium text-slate-300 mb-2">Assinaturas detectadas:</p>
                <div className="space-y-1 mb-3">
                  {detectedSubscriptions.map(sub => (
                    <div key={sub.id} className="flex justify-between items-center text-xs bg-slate-900/50 p-2 rounded-lg">
                      <span className="text-slate-300 font-medium">{sub.title}</span>
                      <span className="text-rose-400">R${sub.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={createCancellationTasks}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <CheckCircle2 size={16} /> Criar tarefas de cancelamento
                </button>
              </div>
            </motion.div>
          )}

          {isTyping && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="max-w-[85%] p-3 text-[13px] leading-relaxed relative bg-slate-800 rounded-xl rounded-bl-none text-slate-200">
                <div className="flex space-x-1.5 items-center h-4">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <form onSubmit={handleSend} className="z-10 mt-auto flex flex-col gap-2">
        {imageBase64 && (
          <div className="flex items-center justify-between bg-blue-500/20 px-3 py-2 rounded-lg border border-blue-500/30 w-fit">
            <span className="text-xs text-blue-200">Imagem anexada</span>
            <button 
              type="button"
              onClick={() => {
                setImageBase64(undefined);
                setMimeType(undefined);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="text-slate-400 hover:text-red-400 ml-3"
            >
              x
            </button>
          </div>
        )}
        <div className="flex items-center gap-2 bg-white/10 p-2 rounded-lg backdrop-blur-sm border border-white/5 focus-within:border-blue-500/50 focus-within:bg-white/15 transition-all">
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
            className="p-1.5 text-slate-400 hover:text-white transition-colors"
            title="Enviar comprovante ou nota"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
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
            placeholder="Pergunte ou anexe notas..."
            className="flex-1 text-xs text-white bg-transparent border-none focus:ring-0 px-2 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={toggleListening}
            className={`p-1.5 transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-slate-400 hover:text-blue-500'}`}
            title={isListening ? "Parar gravação" : "Falar comando"}
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
          <button 
            type="submit"
            disabled={(!inputText.trim() && !imageBase64) || isTyping}
            className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors shadow-sm cursor-pointer ml-1"
          >
            <ArrowRight size={14} />
          </button>
        </div>
      </form>
      
      {/* Decorative Glow */}
      <div className="absolute -top-10 -right-10 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
    </motion.div>
  );
}
