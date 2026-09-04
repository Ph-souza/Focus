import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Phone, CheckCheck, Copy, Check, ShieldCheck, HelpCircle, Smartphone, AlertCircle, Bot } from 'lucide-react';
import { User, Transaction, Task } from '../types';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, setDoc, collection } from 'firebase/firestore';
import { getApiUrl } from '../lib/api';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

interface SimulatedMessage {
  id: string;
  sender: 'user' | 'aurora';
  text: string;
  timestamp: string;
  actionDone?: string;
}

export function WhatsAppModal({ isOpen, onClose, user }: WhatsAppModalProps) {
  const [activeTab, setActiveTab] = useState<'simulator' | 'setup' | 'guide'>('simulator');
  const [phoneNumber, setPhoneNumber] = useState<string>(() => {
    return localStorage.getItem('aurora_whatsapp_number') || '+55 (11) 99876-5432';
  });
  const [isSavedPhone, setIsSavedPhone] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  // Simulator state
  const [simText, setSimText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<SimulatedMessage[]>([
    {
      id: '1',
      sender: 'aurora',
      text: 'Olá! Sou a Aurora no seu WhatsApp. 💚 Você pode me enviar áudios ou mensagens de texto com seus gastos, receitas ou tarefas!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://sua-app.run.app';
  const webhookUrl = `${currentOrigin}/api/whatsapp/webhook`;
  const verifyToken = 'aurora_whatsapp_token';

  const handleSavePhone = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('aurora_whatsapp_number', phoneNumber);
    setIsSavedPhone(true);
    setTimeout(() => setIsSavedPhone(false), 2500);
  };

  const copyToClipboard = (text: string, type: 'url' | 'token') => {
    navigator.clipboard.writeText(text);
    if (type === 'url') {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || simText;
    if (!text.trim() || isSending) return;

    const userMsgId = Date.now().toString();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg: SimulatedMessage = {
      id: userMsgId,
      sender: 'user',
      text: text.trim(),
      timestamp: timeStr
    };

    setMessages(prev => [...prev, newMsg]);
    if (!textToSend) setSimText('');
    setIsSending(true);

    try {
      // Send to WhatsApp webhook route
      const res = await fetch(getApiUrl('/api/whatsapp/webhook'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: phoneNumber,
          text: text.trim(),
          userId: user?.id,
          currentDate: new Date().toISOString()
        })
      });

      const data = await res.json();

      let replyText = data.reply || 'Processado com sucesso!';
      let actionNotice = '';

      // If function calls created transactions or tasks, write to user's firestore
      if (data.functionCalls && data.functionCalls.length > 0 && user) {
        for (const call of data.functionCalls) {
          if (call.name === 'add_transaction') {
            const { title, amount, type, category, date } = call.args;
            const newTxId = Date.now().toString() + Math.random().toString(36).substring(2, 7);
            const newTx: Transaction = {
              id: newTxId,
              title: title || 'Lançamento WhatsApp',
              amount: Number(amount) || 0,
              type: (type === 'income' ? 'income' : 'expense'),
              category: category || 'Outros',
              date: date || new Date().toISOString().split('T')[0]
            };
            await setDoc(doc(db, `users/${user.id}/transactions`, newTxId), newTx);
            actionNotice = `💰 Transação de R$ ${Number(amount).toFixed(2)} salva no app!`;
          } else if (call.name === 'add_task') {
            const { title, description, priority, deadline } = call.args;
            const newTaskId = Date.now().toString() + Math.random().toString(36).substring(2, 7);
            const newTask: Task = {
              id: newTaskId,
              title: title || 'Tarefa WhatsApp',
              description: description || 'Adicionada via WhatsApp',
              priority: (priority as any) || 'medium',
              deadline: deadline || undefined,
              completed: false,
              createdAt: new Date().toISOString()
            };
            await setDoc(doc(db, `users/${user.id}/tasks`, newTaskId), newTask);
            actionNotice = `📝 Tarefa "${title}" registrada no app!`;
          }
        }
      }

      const auroraMsg: SimulatedMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'aurora',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionDone: actionNotice
      };

      setMessages(prev => [...prev, auroraMsg]);
    } catch (error) {
      console.error("WhatsApp webhook test failed", error);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'aurora',
          text: 'Desculpe, ocorreu um erro de conexão ao processar sua mensagem via WhatsApp.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="bg-emerald-600 dark:bg-emerald-700 text-white p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
                💬
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-base">Aurora no WhatsApp</h2>
                  <span className="bg-emerald-400/30 text-emerald-100 text-[10px] px-2 py-0.5 rounded-full font-semibold border border-emerald-300/30">
                    🟢 Webhook On
                  </span>
                </div>
                <p className="text-xs text-emerald-100">
                  Integração instantânea para lançamentos financeiros e tarefas
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-emerald-100 hover:text-white hover:bg-emerald-500/30 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Sub-header Navigation */}
          <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 shrink-0">
            <button
              onClick={() => setActiveTab('simulator')}
              className={`flex-1 py-3 px-4 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
                activeTab === 'simulator'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400 bg-white dark:bg-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Smartphone size={16} />
              Simulador WhatsApp
            </button>
            <button
              onClick={() => setActiveTab('setup')}
              className={`flex-1 py-3 px-4 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
                activeTab === 'setup'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400 bg-white dark:bg-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <ShieldCheck size={16} />
              Meu Número & Webhook
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`flex-1 py-3 px-4 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
                activeTab === 'guide'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400 bg-white dark:bg-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <HelpCircle size={16} />
              Guia de Integração
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'simulator' && (
              <div className="flex flex-col h-[420px] bg-[#efeae2] dark:bg-[#0b141a] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-inner relative">
                {/* Simulated WhatsApp Chat TopBar */}
                <div className="bg-[#075e54] dark:bg-[#202c33] text-white p-3 flex items-center gap-3 shrink-0">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-sm text-white">
                    A
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-xs leading-tight">Aurora AI Mentor</h3>
                    <p className="text-[10px] text-emerald-200">Online • WhatsApp Bot</p>
                  </div>
                  <span className="text-[10px] bg-emerald-800/60 px-2 py-0.5 rounded text-emerald-100">
                    {phoneNumber}
                  </span>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[82%] ${
                        msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                      }`}
                    >
                      <div
                        className={`p-3 rounded-xl text-xs relative shadow-sm ${
                          msg.sender === 'user'
                            ? 'bg-[#dcf8c6] dark:bg-[#005c4b] text-slate-900 dark:text-white rounded-tr-none'
                            : 'bg-white dark:bg-[#202c33] text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-100 dark:border-slate-700/50'
                        }`}
                      >
                        {msg.sender === 'aurora' && (
                          <div className="flex items-center gap-1 font-bold text-[10px] text-emerald-600 dark:text-emerald-400 mb-1">
                            <Bot size={12} /> Aurora AI
                          </div>
                        )}
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                        
                        {msg.actionDone && (
                          <div className="mt-2 pt-1.5 border-t border-emerald-200/50 dark:border-emerald-700/40 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                            {msg.actionDone}
                          </div>
                        )}

                        <div className="flex justify-end items-center gap-1 text-[9px] text-slate-400 dark:text-slate-400 mt-1">
                          <span>{msg.timestamp}</span>
                          {msg.sender === 'user' && <CheckCheck size={12} className="text-blue-500" />}
                        </div>
                      </div>
                    </div>
                  ))}

                  {isSending && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-[#202c33] p-2 rounded-lg w-fit border border-slate-100 dark:border-slate-800">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce delay-100" />
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce delay-200" />
                      <span className="text-[10px]">Aurora digitando...</span>
                    </div>
                  )}
                </div>

                {/* Quick Prompts */}
                <div className="p-2 bg-slate-100 dark:bg-[#111b21] border-t border-slate-200 dark:border-slate-800 flex gap-1.5 overflow-x-auto shrink-0">
                  <button
                    onClick={() => handleSendMessage("Gastei R$ 38,50 no almoço do restaurante")}
                    className="whitespace-nowrap text-[11px] bg-white dark:bg-[#202c33] hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-slate-700 dark:text-slate-200 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    💸 "Gastei R$ 38,50 no almoço"
                  </button>
                  <button
                    onClick={() => handleSendMessage("Lembrar de cancelar a assinatura do streaming dia 20")}
                    className="whitespace-nowrap text-[11px] bg-white dark:bg-[#202c33] hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-slate-700 dark:text-slate-200 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    📝 "Lembrar de cancelar streaming"
                  </button>
                  <button
                    onClick={() => handleSendMessage("Recebi R$ 2.500 de um projeto de freela")}
                    className="whitespace-nowrap text-[11px] bg-white dark:bg-[#202c33] hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-slate-700 dark:text-slate-200 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    💰 "Recebi R$ 2.500 de freela"
                  </button>
                </div>

                {/* Input Bar */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="p-2 bg-[#f0f2f5] dark:bg-[#202c33] flex items-center gap-2 shrink-0 border-t border-slate-200 dark:border-slate-800"
                >
                  <input
                    type="text"
                    value={simText}
                    onChange={(e) => setSimText(e.target.value)}
                    placeholder="Envie uma mensagem pelo WhatsApp (ex: Gastei 25 reais de uber)..."
                    className="flex-1 bg-white dark:bg-[#2a3942] border border-slate-200 dark:border-slate-700 rounded-full py-2 px-4 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={!simText.trim() || isSending}
                    className="w-9 h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-50 shrink-0"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'setup' && (
              <div className="space-y-5">
                {/* Linked Phone Number */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-2">
                    <Phone size={16} className="text-emerald-600 dark:text-emerald-400" />
                    Seu Número do WhatsApp Vinculado
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                    As mensagens vindas deste número de WhatsApp serão associadas à sua conta no Aura automaticamente.
                  </p>
                  <form onSubmit={handleSavePhone} className="flex gap-2">
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+55 (11) 99999-9999"
                      className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      {isSavedPhone ? <Check size={14} /> : null}
                      {isSavedPhone ? 'Salvo!' : 'Salvar Número'}
                    </button>
                  </form>
                </div>

                {/* Webhook Configuration Details */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400" />
                    URL do Webhook do Backend Aura
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Insira este endereço nas configurações do seu provedor de WhatsApp (Meta Cloud API, Evolution API, Z-API ou Twilio):
                  </p>

                  <div className="space-y-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                        Webhook Endpoint (POST & GET)
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="text"
                          readOnly
                          value={webhookUrl}
                          className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 select-all"
                        />
                        <button
                          type="button"
                          onClick={() => copyToClipboard(webhookUrl, 'url')}
                          className="p-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-colors text-xs flex items-center gap-1"
                        >
                          {copiedUrl ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                          <span>{copiedUrl ? 'Copiado' : 'Copiar'}</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                        Verify Token (Para Meta WhatsApp Cloud API)
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="text"
                          readOnly
                          value={verifyToken}
                          className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-700 dark:text-slate-300 select-all"
                        />
                        <button
                          type="button"
                          onClick={() => copyToClipboard(verifyToken, 'token')}
                          className="p-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-colors text-xs flex items-center gap-1"
                        >
                          {copiedToken ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                          <span>{copiedToken ? 'Copiado' : 'Copiar'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <div>
                    <strong>Modo de Teste Prático Instantâneo:</strong>
                    <p className="mt-0.5 text-[11px]">
                      Você pode testar e validar o webhook diretamente na aba <strong>Simulador WhatsApp</strong> acima! Ela executa chamadas reais para este mesmo endpoint e cria dados reais na sua conta.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'guide' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-2">
                    Como conectar um número do WhatsApp de forma gratuita ou via API
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    A Aurora está equipada com um webhook inteligente que aceita mensagens em diversos formatos JSON standard (Meta Cloud API, Evolution API, Z-API, Twilio ou custom webhooks).
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <h4 className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <span>1. Meta WhatsApp Cloud API (Oficial)</span>
                    </h4>
                    <ol className="list-decimal list-inside text-slate-600 dark:text-slate-300 space-y-1 text-[11px]">
                      <li>Crie um app no Meta for Developers (WhatsApp Product).</li>
                      <li>Vá em Configurações do Webhook e cole a <strong>URL do Webhook</strong> do Aura.</li>
                      <li>Use o Verify Token <code>aurora_whatsapp_token</code>.</li>
                      <li>Ative a inscrição no evento <code>messages</code>.</li>
                    </ol>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <h4 className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <span>2. Evolution API / Z-API / Baileys</span>
                    </h4>
                    <ol className="list-decimal list-inside text-slate-600 dark:text-slate-300 space-y-1 text-[11px]">
                      <li>Conecte seu WhatsApp com leitor de QR Code na sua instância.</li>
                      <li>Configure a URL de Webhook para enviar eventos do tipo <code>MESSAGES_UPSERT</code>.</li>
                      <li>Cadastre a URL do Aura. Prontinho!</li>
                    </ol>
                  </div>
                </div>

                <div className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px]">
                  <p className="text-slate-400 mb-1">// Exemplo de requisição POST aceita pelo webhook do Aura:</p>
                  <pre className="text-emerald-400 overflow-x-auto p-2 bg-slate-950 rounded border border-slate-800">
{`POST ${webhookUrl}
Content-Type: application/json

{
  "from": "${phoneNumber}",
  "text": "Gastei R$ 45,00 no almoço com mercado"
}`}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
