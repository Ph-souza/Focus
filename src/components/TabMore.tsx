import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { 
  Folder, 
  Target, 
  FileText, 
  BarChart2, 
  Bot, 
  MessageCircle, 
  LogOut, 
  Moon, 
  Sun, 
  Lock, 
  HelpCircle, 
  ChevronRight, 
  User as UserIcon, 
  Search, 
  X, 
  Plus, 
  Trash2, 
  ShieldCheck,
  Shield,
  LifeBuoy,
  Database
} from 'lucide-react';

interface TabMoreProps {
  user: User | null;
  onTabChange: (tab: any) => void;
  onOpenProfile: () => void;
  onOpenWhatsApp: () => void;
  onToggleDarkMode: () => void;
  onLogout: () => void;
  isDarkMode: boolean;
}

interface NoteItem {
  id: string;
  text: string;
  createdAt: string;
}

export function TabMore({ 
  user, 
  onTabChange, 
  onOpenProfile, 
  onOpenWhatsApp, 
  onToggleDarkMode, 
  onLogout, 
  isDarkMode 
}: TabMoreProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modais complementares para máxima interatividade
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  // Estado das Notas rápidas com persistência local
  const [notes, setNotes] = useState<NoteItem[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_quick_notes');
      return saved ? JSON.parse(saved) : [
        { id: '1', text: 'Revisar metas trimestrais do Nexus Focus', createdAt: 'Hoje' }
      ];
    } catch {
      return [];
    }
  });
  const [newNoteText, setNewNoteText] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('nexus_quick_notes', JSON.stringify(notes));
    } catch (e) {
      console.error(e);
    }
  }, [notes]);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    const item: NoteItem = {
      id: Date.now().toString(),
      text: newNoteText.trim(),
      createdAt: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    };
    setNotes([item, ...notes]);
    setNewNoteText('');
  };

  const handleDeleteNote = (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
  };

  // 1. Definição das Ferramentas (Grid 2 colunas / 2x3)
  const ferramentas = [
    { 
      id: 'projetos', 
      name: 'Projetos', 
      desc: 'Seus projetos e tarefas', 
      icon: <Folder className="w-5 h-5 text-blue-500" />, 
      iconBg: 'bg-blue-500/15 border-blue-500/20',
      action: () => onTabChange('tasks') 
    },
    { 
      id: 'metas', 
      name: 'Metas', 
      desc: 'Acompanhe seus objetivos', 
      icon: <Target className="w-5 h-5 text-indigo-500" />, 
      iconBg: 'bg-indigo-500/15 border-indigo-500/20',
      action: () => onTabChange('goals') 
    },
    { 
      id: 'notas', 
      name: 'Notas', 
      desc: 'Ideias e anotações sempre por perto', 
      icon: <FileText className="w-5 h-5 text-sky-500" />, 
      iconBg: 'bg-sky-500/15 border-sky-500/20',
      action: () => setIsNotesModalOpen(true) 
    },
    { 
      id: 'relatorios', 
      name: 'Relatórios', 
      desc: 'Veja seu progresso em números', 
      icon: <BarChart2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />, 
      iconBg: 'bg-blue-600/15 border-blue-600/20',
      action: () => onTabChange('reports') 
    },
    { 
      id: 'mentor', 
      name: 'Mentor IA', 
      desc: 'Tire dúvidas e receba orientações', 
      icon: <Bot className="w-5 h-5 text-[#6366f1]" />, 
      iconBg: 'bg-[#6366f1]/15 border-[#6366f1]/20',
      action: () => onTabChange('chat') 
    },
    { 
      id: 'whatsapp', 
      name: 'Mentor no WhatsApp', 
      desc: 'Conectado • final 5240', 
      isWhatsApp: true,
      icon: <MessageCircle className="w-5 h-5 text-emerald-500" />, 
      iconBg: 'bg-emerald-500/15 border-emerald-500/20',
      action: onOpenWhatsApp 
    },
  ];

  // 2. Definição da Seção Conta (Lista Vertical)
  const conta = [
    { 
      id: 'profile', 
      name: 'Perfil', 
      desc: 'Seus dados e preferências', 
      icon: <UserIcon className="w-4 h-4 text-blue-500" />, 
      iconBg: 'bg-blue-500/10 border-blue-500/20',
      action: onOpenProfile 
    },
    { 
      id: 'privacy', 
      name: 'Privacidade', 
      desc: 'Seus dados e segurança', 
      icon: <Lock className="w-4 h-4 text-slate-500 dark:text-slate-400" />, 
      iconBg: 'bg-slate-500/10 border-slate-500/20',
      action: () => setIsPrivacyModalOpen(true) 
    },
    { 
      id: 'help', 
      name: 'Ajuda', 
      desc: 'Central de suporte', 
      icon: <HelpCircle className="w-4 h-4 text-sky-500" />, 
      iconBg: 'bg-sky-500/10 border-sky-500/20',
      action: () => setIsHelpModalOpen(true) 
    },
  ];

  // Filtro de busca inteligente em tempo real
  const filteredFerramentas = useMemo(() => {
    if (!searchQuery.trim()) return ferramentas;
    const q = searchQuery.toLowerCase();
    return ferramentas.filter(f => 
      f.name.toLowerCase().includes(q) || 
      f.desc.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const filteredConta = useMemo(() => {
    if (!searchQuery.trim()) return conta;
    const q = searchQuery.toLowerCase();
    return conta.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.desc.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const hasResults = 
    filteredFerramentas.length > 0 || 
    filteredConta.length > 0 || 
    (Boolean(user?.email === 'phillipe.souza27@gmail.com') && searchQuery.trim() !== '' && 'painel admin administracao'.includes(searchQuery.toLowerCase().trim()));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-5 p-0 md:p-6 max-w-3xl mx-auto pb-8"
    >
      {/* ========================================================= */}
      {/* 1. CABEÇALHO E BUSCA (Search Bar 100% largura)            */}
      {/* ========================================================= */}
      <div className="space-y-3.5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
            Mais
          </h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            Ferramentas e conta
          </p>
        </div>

        {/* Search Bar com estética translúcida glass */}
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar ferramentas, um recurso..."
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white/70 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500/60 transition-all backdrop-blur-md shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white p-0.5 rounded-full"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Empty State de Busca */}
      {!hasResults && (
        <div className="py-10 text-center glass-card p-6 rounded-2xl">
          <Search className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-50" />
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Nenhum recurso encontrado
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Não encontramos resultados para &quot;{searchQuery}&quot;.
          </p>
          <button 
            onClick={() => setSearchQuery('')}
            className="mt-3 px-3 py-1.5 text-[11px] font-bold text-blue-500 bg-blue-500/10 hover:bg-blue-500/20 rounded-xl transition-all"
          >
            Limpar busca
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. SEÇÃO DE FERRAMENTAS (Grid responsivo 2 colunas / 2x3)  */}
      {/* ========================================================= */}
      {filteredFerramentas.length > 0 && (
        <div className="space-y-2.5">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredFerramentas.map((item) => (
              <button
                key={item.id}
                onClick={item.action}
                type="button"
                className="glass-card p-4 flex flex-col items-start text-left shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all group relative overflow-hidden"
              >
                {/* Ícone com fundo temático translúcido */}
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border mb-3 transition-transform group-hover:scale-110 ${item.iconBg}`}>
                  {item.icon}
                </div>

                {/* Título Principal */}
                <h2 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors leading-tight">
                  {item.name}
                </h2>

                {/* Subtítulo discreto */}
                {item.isWhatsApp ? (
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)] animate-pulse" />
                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                      Conectado • final 5240
                    </span>
                  </div>
                ) : (
                  <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-1 leading-snug line-clamp-2">
                    {item.desc}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. SEÇÃO DE CONTA (Lista Vertical Empilhada 100% largura)  */}
      {/* ========================================================= */}
      {(filteredConta.length > 0 || (user?.email === 'phillipe.souza27@gmail.com' && (!searchQuery || 'painel admin administracao'.includes(searchQuery.toLowerCase())))) && (
        <div className="space-y-2 pt-1">
          <h2 className="font-bold text-xs text-slate-900 dark:text-white px-1">
            Conta
          </h2>

          <div className="flex flex-col gap-2">
            {filteredConta.map((item) => (
              <button
                key={item.id}
                onClick={item.action}
                type="button"
                className="glass-card p-3.5 flex items-center justify-between shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all text-left group w-full"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 transition-transform group-hover:scale-105 ${item.iconBg}`}>
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors leading-none">
                      {item.name}
                    </h3>
                    <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-1 leading-none">
                      {item.desc}
                    </p>
                  </div>
                </div>

                {/* Seta/Chevron apontando para a direita */}
                <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            ))}

            {/* 3. Regra de Renderização Estrita (Hardcoded): SÓ insere na DOM se o email for exatamente phillipe.souza27@gmail.com */}
            {user?.email === 'phillipe.souza27@gmail.com' && (!searchQuery || 'painel admin administracao'.includes(searchQuery.toLowerCase())) && (
              <Link
                to="/painel"
                className="glass-card p-3.5 flex items-center justify-between shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all text-left group w-full border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-500 shrink-0 group-hover:scale-105 transition-transform">
                    <Shield size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-xs text-blue-600 dark:text-blue-400 leading-none">
                        Painel Admin
                      </h3>
                      <span className="bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">
                        Admin
                      </span>
                    </div>
                    <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-1 leading-none">
                      Métricas globais e gestão do sistema
                    </p>
                  </div>
                </div>

                <ChevronRight size={16} className="text-blue-400 group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            )}

            {/* Botão Sair com alerta visual em vermelho (text-red-500) */}
            {(!searchQuery || 'sair encerrar sessao'.includes(searchQuery.toLowerCase())) && (
              <button
                onClick={onLogout}
                type="button"
                className="glass-card p-3.5 flex items-center justify-between shadow-sm hover:bg-red-500/10 hover:border-red-500/30 transition-all text-left group w-full border-red-500/20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/25 flex items-center justify-center text-red-500 shrink-0 group-hover:scale-105 transition-transform">
                    <LogOut size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-red-500 leading-none">
                      Sair
                    </h3>
                    <p className="text-[10px] font-medium text-red-400/80 mt-1 leading-none">
                      Encerrar sua sessão
                    </p>
                  </div>
                </div>

                <ChevronRight size={16} className="text-red-400 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAIS COMPLEMENTARES (Notas Rápidas, Ajuda, Privacidade) */}
      {/* ========================================================= */}
      
      {/* Modal de Notas Rápidas */}
      <AnimatePresence>
        {isNotesModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card w-full max-w-sm p-5 shadow-2xl relative"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/15 flex items-center justify-center text-sky-500">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Notas Rápidas</h3>
                    <p className="text-[10px] text-slate-400">Ideias salvas localmente</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsNotesModalOpen(false)}
                  className="w-8 h-8 rounded-xl hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form de nova nota */}
              <form onSubmit={handleAddNote} className="flex items-center gap-2 mb-4">
                <input
                  type="text"
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Escreva um pensamento rápido..."
                  className="flex-1 px-3 py-2 rounded-xl bg-white/70 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-all active:scale-95"
                >
                  <Plus size={16} />
                </button>
              </form>

              {/* Lista de notas */}
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {notes.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-6">Nenhuma nota adicionada ainda.</p>
                ) : (
                  notes.map((n) => (
                    <div key={n.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 flex items-center justify-between gap-2">
                      <p className="text-xs text-slate-800 dark:text-slate-200 flex-1 break-words">{n.text}</p>
                      <button
                        onClick={() => handleDeleteNote(n.id)}
                        className="text-slate-400 hover:text-red-500 p-1 transition-colors"
                        title="Apagar nota"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Ajuda & Suporte */}
      <AnimatePresence>
        {isHelpModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card w-full max-w-sm p-5 shadow-2xl relative"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/15 flex items-center justify-center text-sky-500">
                    <LifeBuoy size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Central de Ajuda</h3>
                    <p className="text-[10px] text-slate-400">Suporte e orientações</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsHelpModalOpen(false)}
                  className="w-8 h-8 rounded-xl hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 mb-4">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <p className="font-bold text-slate-900 dark:text-white mb-1">Como sincronizar com o WhatsApp?</p>
                  <p className="text-[11px] text-slate-400">Clique na opção &quot;Mentor no WhatsApp&quot; para escanear o QR Code e interagir com seu assistente diretamente no chat.</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <p className="font-bold text-slate-900 dark:text-white mb-1">Como registrar despesas do mês?</p>
                  <p className="text-[11px] text-slate-400">Acesse a aba Finanças e use o seletor de mês dinâmico no topo para visualizar e cadastrar gastos do período.</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsHelpModalOpen(false);
                  onOpenWhatsApp();
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all"
              >
                <MessageCircle size={15} />
                Falar com Suporte no WhatsApp
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Privacidade & Dados */}
      <AnimatePresence>
        {isPrivacyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ duration: 0.2 }}
              className="glass-card w-full max-w-2xl p-6 sm:p-8 md:p-10 shadow-2xl relative my-auto border border-white/20 dark:border-white/10 rounded-3xl"
            >
              {/* Cabeçalho do Modal */}
              <div className="flex items-start justify-between pb-6 mb-6 border-b border-slate-200/60 dark:border-white/10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shrink-0 shadow-inner">
                    <ShieldCheck size={28} />
                  </div>
                  <div>
                    <h2 className="font-black text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight leading-tight">
                      Privacidade & Dados
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                      Seus dados 100% seguros
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPrivacyModalOpen(false)}
                  className="w-10 h-10 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer shrink-0"
                  aria-label="Fechar modal"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Estrutura de Itens Explícitos de Segurança */}
              <div className="space-y-4 mb-8">
                {/* Item 1: Armazenamento Isolado */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/10 flex items-start gap-4 transition-all hover:border-blue-500/30">
                  <div className="w-11 h-11 rounded-2xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-500 shrink-0 mt-0.5 shadow-sm">
                    <Database size={22} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-snug">
                      Armazenamento Isolado
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed font-normal">
                      Suas informações financeiras e tarefas são separadas e armazenadas em um ambiente de nuvem seguro e exclusivo para sua conta.
                    </p>
                  </div>
                </div>

                {/* Item 2: Criptografia Avançada */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/10 flex items-start gap-4 transition-all hover:border-emerald-500/30">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-500 shrink-0 mt-0.5 shadow-sm">
                    <Lock size={22} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-snug">
                      Criptografia Avançada
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed font-normal">
                      Toda comunicação com o Mentor IA e o envio de dados são criptografados via HTTPS de ponta a ponta, protegidos pelo Firebase Security Rules.
                    </p>
                  </div>
                </div>

                {/* Item 3: Controle Total Seu */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/10 flex items-start gap-4 transition-all hover:border-indigo-500/30">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-500 shrink-0 mt-0.5 shadow-sm">
                    <Trash2 size={22} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-snug">
                      Controle Total Seu
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed font-normal">
                      Você é o dono dos seus dados. A qualquer momento, você pode exportar suas informações ou solicitar a exclusão permanente e irrecuperável da sua conta.
                    </p>
                  </div>
                </div>
              </div>

              {/* Botão Entendido de Largura Total */}
              <button
                onClick={() => setIsPrivacyModalOpen(false)}
                type="button"
                className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm sm:text-base shadow-[0_4px_20px_rgba(37,99,235,0.3)] hover:shadow-[0_6px_25px_rgba(37,99,235,0.4)] transition-all cursor-pointer active:scale-[0.99] text-center"
              >
                Entendido
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
