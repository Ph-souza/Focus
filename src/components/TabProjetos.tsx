import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Folder, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Edit3, 
  MoreHorizontal, 
  Trash2, 
  Copy, 
  Upload, 
  FileText, 
  Share2, 
  Sparkles,
  Tag,
  Check,
  X,
  Layers,
  ArrowRight,
  TrendingUp,
  Search
} from 'lucide-react';
import { User } from '../types';

export interface ProjectTask {
  id: string | number;
  projectId: string;
  title: string;
  group: 'today' | 'tomorrow' | 'week';
  status: 'todo' | 'doing' | 'done';
  priority: 'low' | 'medium' | 'high';
  tag: string;
  date: string;
  completedAt?: string;
}

export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  category: 'Geral' | 'Pessoal' | 'Trabalho' | 'Estudos';
  deadline: string;
  iconBg?: string;
  tags?: string[];
  members?: { name: string; role: string; avatar: string }[];
}

interface TabProjetosProps {
  user?: User | null;
  onTabChange?: (tab: any) => void;
}

const INITIAL_PROJECTS: ProjectItem[] = [
  {
    id: 'nexus-focus',
    name: 'Nexus Focus',
    description: 'Desenvolvimento e melhorias contínuas do app',
    category: 'Trabalho',
    deadline: '30 de setembro',
    tags: ['Desenvolvimento', 'Design', 'Backend', 'Marketing', 'Teste']
  },
  {
    id: 'marketing',
    name: 'Marketing',
    description: 'Conteúdo, campanhas e crescimento',
    category: 'Trabalho',
    deadline: '15 de outubro',
    tags: ['Marketing', 'Conteúdo', 'Copywriting']
  },
  {
    id: 'pessoal',
    name: 'Pessoal',
    description: 'Tarefas, rotinas e metas pessoais',
    category: 'Pessoal',
    deadline: 'Sem prazo',
    tags: ['Saúde', 'Hábitos', 'Finanças']
  },
  {
    id: 'estudos',
    name: 'Estudos',
    description: 'Cursos de tecnologia e inteligência artificial',
    category: 'Estudos',
    deadline: '28 de setembro',
    tags: ['IA', 'React', 'TypeScript']
  },
  {
    id: 'financeiro',
    name: 'Financeiro',
    description: 'Planejamento e organização orçamentária',
    category: 'Geral',
    deadline: '31 de outubro',
    tags: ['Investimentos', 'Orçamento']
  }
];

const INITIAL_TASKS: ProjectTask[] = [
  {
    id: 1,
    projectId: 'nexus-focus',
    title: 'Ajustar responsividade mobile',
    group: 'today',
    status: 'todo',
    priority: 'high',
    tag: 'Desenvolvimento',
    date: 'Hoje'
  },
  {
    id: 2,
    projectId: 'nexus-focus',
    title: 'Revisar tela de projetos e navegação',
    group: 'today',
    status: 'doing',
    priority: 'medium',
    tag: 'Design',
    date: 'Hoje'
  },
  {
    id: 3,
    projectId: 'nexus-focus',
    title: 'Testar fluxos principais da aplicação',
    group: 'today',
    status: 'todo',
    priority: 'medium',
    tag: 'Teste',
    date: 'Hoje'
  },
  {
    id: 4,
    projectId: 'nexus-focus',
    title: 'Implementar notificações push e automações',
    group: 'tomorrow',
    status: 'todo',
    priority: 'high',
    tag: 'Desenvolvimento',
    date: 'Amanhã'
  },
  {
    id: 5,
    projectId: 'nexus-focus',
    title: 'Revisar copy da landing page',
    group: 'tomorrow',
    status: 'todo',
    priority: 'medium',
    tag: 'Marketing',
    date: 'Amanhã'
  },
  {
    id: 6,
    projectId: 'nexus-focus',
    title: 'Otimizar performance e bundle da API',
    group: 'week',
    status: 'doing',
    priority: 'high',
    tag: 'Backend',
    date: '25/09'
  },
  {
    id: 7,
    projectId: 'nexus-focus',
    title: 'Criar novos tutoriais interativos',
    group: 'week',
    status: 'todo',
    priority: 'low',
    tag: 'Conteúdo',
    date: '26/09'
  },
  {
    id: 8,
    projectId: 'nexus-focus',
    title: 'Reunião de alinhamento com mentor',
    group: 'week',
    status: 'todo',
    priority: 'medium',
    tag: 'Reunião',
    date: '27/09'
  }
];

export function TabProjetos({ user, onTabChange }: TabProjetosProps) {
  // Estado de Projetos
  const [projects, setProjects] = useState<ProjectItem[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_focus_projects_list');
      return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
    } catch {
      return INITIAL_PROJECTS;
    }
  });

  // Estado de Tarefas
  const [tasks, setTasks] = useState<ProjectTask[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_focus_project_tasks');
      return saved ? JSON.parse(saved) : INITIAL_TASKS;
    } catch {
      return INITIAL_TASKS;
    }
  });

  const [selectedProjectId, setSelectedProjectId] = useState<string>('nexus-focus');
  const [projectCategoryFilter, setProjectCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'progress' | 'progress-asc' | 'deadline'>('recent');
  const [activeProjectTab, setActiveProjectTab] = useState<'tasks' | 'overview' | 'files' | 'notes'>('tasks');
  const [taskFilter, setTaskFilter] = useState<'all' | 'todo' | 'doing' | 'done'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Quick Add State
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [quickDate, setQuickDate] = useState('');

  // Modal Novo Projeto
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectCategory, setNewProjectCategory] = useState<'Geral' | 'Pessoal' | 'Trabalho' | 'Estudos'>('Trabalho');
  const [newProjectDeadline, setNewProjectDeadline] = useState('');

  // Modal / Feedback Rápido
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Sincronizar com localStorage
  useEffect(() => {
    try {
      localStorage.setItem('nexus_focus_projects_list', JSON.stringify(projects));
    } catch (e) {
      console.error('Erro ao salvar projetos no localStorage', e);
    }
  }, [projects]);

  useEffect(() => {
    try {
      localStorage.setItem('nexus_focus_project_tasks', JSON.stringify(tasks));
    } catch (e) {
      console.error('Erro ao salvar tarefas no localStorage', e);
    }
  }, [tasks]);

  const showNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 3500);
  };

  // Projeto selecionado
  const selectedProject = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId) || projects[0] || INITIAL_PROJECTS[0];
  }, [projects, selectedProjectId]);

  // Tarefas do projeto selecionado
  const selectedProjectTasks = useMemo(() => {
    return tasks.filter(t => t.projectId === selectedProject.id);
  }, [tasks, selectedProject.id]);

  // Cálculos de progresso do projeto selecionado
  const projectStats = useMemo(() => {
    const total = selectedProjectTasks.length;
    const done = selectedProjectTasks.filter(t => t.status === 'done').length;
    const doing = selectedProjectTasks.filter(t => t.status === 'doing').length;
    const todo = total - done - doing;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, doing, todo, percent };
  }, [selectedProjectTasks]);

  // Resumo global de todos os projetos
  const globalSummary = useMemo(() => {
    const totalProjects = projects.length;
    const todayTasksCount = tasks.filter(t => t.group === 'today' && t.status !== 'done').length;
    
    // Projetos com 100% de tarefas concluídas vs em andamento
    let completedProjects = 0;
    let inProgressProjects = 0;

    projects.forEach(p => {
      const pTasks = tasks.filter(t => t.projectId === p.id);
      if (pTasks.length > 0 && pTasks.every(t => t.status === 'done')) {
        completedProjects++;
      } else {
        inProgressProjects++;
      }
    });

    return { totalProjects, todayTasksCount, inProgressProjects, completedProjects };
  }, [projects, tasks]);

  // Projetos filtrados e ordenados
  const displayedProjects = useMemo(() => {
    let result = [...projects];

    if (projectCategoryFilter !== 'all') {
      result = result.filter(p => p.category.toLowerCase() === projectCategoryFilter.toLowerCase());
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      const aTasks = tasks.filter(t => t.projectId === a.id);
      const bTasks = tasks.filter(t => t.projectId === b.id);
      const aDone = aTasks.filter(t => t.status === 'done').length;
      const bDone = bTasks.filter(t => t.status === 'done').length;
      const aProgress = aTasks.length > 0 ? (aDone / aTasks.length) : 0;
      const bProgress = bTasks.length > 0 ? (bDone / bTasks.length) : 0;

      if (sortBy === 'progress') return bProgress - aProgress;
      if (sortBy === 'progress-asc') return aProgress - bProgress;
      return 0; // recent/default
    });

    return result;
  }, [projects, projectCategoryFilter, searchQuery, sortBy, tasks]);

  // Alternar checkbox de tarefa
  const handleToggleTask = (taskId: string | number) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const isDone = t.status === 'done';
        return {
          ...t,
          status: isDone ? 'todo' : 'done',
          completedAt: !isDone ? new Date().toISOString() : undefined
        };
      }
      return t;
    }));
  };

  // Quick Add submit
  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    const newTask: ProjectTask = {
      id: Date.now(),
      projectId: selectedProject.id,
      title: quickTitle.trim(),
      group: 'today',
      status: 'todo',
      priority: quickPriority,
      tag: 'Geral',
      date: quickDate ? formatDisplayDate(quickDate) : 'Hoje'
    };

    setTasks(prev => [newTask, ...prev]);
    setQuickTitle('');
    setQuickDate('');
    setIsQuickAddOpen(false);
    setTaskFilter('all');
    showNotification('Tarefa adicionada com sucesso!');
  };

  // Criar novo projeto
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    const newProj: ProjectItem = {
      id: `proj-${Date.now()}`,
      name: newProjectName.trim(),
      description: newProjectDesc.trim() || 'Sem descrição definida',
      category: newProjectCategory,
      deadline: newProjectDeadline ? formatDisplayDate(newProjectDeadline) : 'Sem prazo',
      tags: ['Geral', newProjectCategory]
    };

    setProjects(prev => [newProj, ...prev]);
    setSelectedProjectId(newProj.id);
    setNewProjectName('');
    setNewProjectDesc('');
    setNewProjectDeadline('');
    setIsNewProjectModalOpen(false);
    showNotification(`Projeto "${newProj.name}" criado!`);
  };

  // Excluir projeto
  const handleDeleteProject = (projId: string) => {
    if (projects.length <= 1) {
      alert('Você precisa ter pelo menos um projeto ativo.');
      return;
    }
    const confirmed = window.confirm(`Deseja excluir o projeto "${selectedProject.name}" e todas as suas tarefas?`);
    if (!confirmed) return;

    setProjects(prev => prev.filter(p => p.id !== projId));
    setTasks(prev => prev.filter(t => t.projectId !== projId));
    const nextProj = projects.find(p => p.id !== projId);
    if (nextProj) setSelectedProjectId(nextProj.id);
    showNotification('Projeto excluído.');
  };

  // Duplicar projeto
  const handleDuplicateProject = () => {
    const duplicatedProj: ProjectItem = {
      ...selectedProject,
      id: `proj-${Date.now()}`,
      name: `${selectedProject.name} (Cópia)`
    };

    const duplicatedTasks: ProjectTask[] = selectedProjectTasks.map(t => ({
      ...t,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      projectId: duplicatedProj.id,
      status: 'todo'
    }));

    setProjects(prev => [duplicatedProj, ...prev]);
    setTasks(prev => [...prev, ...duplicatedTasks]);
    setSelectedProjectId(duplicatedProj.id);
    showNotification(`Projeto duplicado com sucesso!`);
  };

  const formatDisplayDate = (dStr: string) => {
    try {
      const parts = dStr.split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
      return dStr;
    } catch {
      return dStr;
    }
  };

  // Tarefas filtradas pelo taskFilter
  const filteredTasks = useMemo(() => {
    return selectedProjectTasks.filter(t => {
      if (taskFilter === 'all') return true;
      return t.status === taskFilter;
    });
  }, [selectedProjectTasks, taskFilter]);

  // Agrupamentos de tarefas
  const taskGroups = useMemo(() => {
    return {
      today: {
        title: 'Hoje',
        tasks: filteredTasks.filter(t => t.group === 'today')
      },
      tomorrow: {
        title: 'Amanhã',
        tasks: filteredTasks.filter(t => t.group === 'tomorrow')
      },
      week: {
        title: 'Esta semana',
        tasks: filteredTasks.filter(t => t.group === 'week')
      }
    };
  }, [filteredTasks]);

  // Cálculo SVG Progress Ring
  const ringRadius = 46;
  const ringCircumference = 2 * Math.PI * ringRadius; // ~289.02
  const ringOffset = ringCircumference - (ringCircumference * projectStats.percent) / 100;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6 p-0 md:p-8 max-w-[1560px] mx-auto w-full pb-16"
    >
      {/* Toast de notificação suave */}
      <AnimatePresence>
        {notificationMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-50 px-4 py-3 rounded-2xl glass-card border border-blue-500/40 shadow-xl flex items-center gap-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100"
          >
            <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center">
              <Check size={14} className="stroke-[3]" />
            </div>
            {notificationMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ======================================================= */}
      {/* 1. HERO SECTION                                         */}
      {/* ======================================================= */}
      <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-500 mb-1.5">
            <Folder size={15} />
            <span>Módulo de Projetos</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Seus projetos, mais resultados.
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Organize suas ideias, divida em tarefas e acompanhe o progresso de forma simples e visual.
          </p>
        </div>

        <button
          onClick={() => setIsNewProjectModalOpen(true)}
          className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-[0_8px_22px_rgba(52,120,255,0.3)] hover:shadow-[0_12px_28px_rgba(52,120,255,0.45)] transition-all flex items-center gap-2 shrink-0 active:scale-95 cursor-pointer"
        >
          <Plus size={18} className="stroke-[2.5]" />
          <span>Novo projeto</span>
        </button>
      </section>

      {/* ======================================================= */}
      {/* 2. SUMMARY GRID (4 cards estatísticos)                 */}
      {/* ======================================================= */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Todos os projetos */}
        <div className="glass-card p-4 sm:p-5 flex items-center gap-3.5 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl shrink-0 font-bold">
            ◈
          </div>
          <div className="min-w-0">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block truncate leading-none">Todos os projetos</span>
            <strong className="text-2xl font-black text-slate-900 dark:text-white mt-1 block leading-tight tracking-tight">
              {globalSummary.totalProjects}
            </strong>
            <small className="text-[11px] text-slate-400 dark:text-slate-500 block leading-none mt-0.5">Projetos ativos</small>
          </div>
        </div>

        {/* Card 2: Tarefas de hoje */}
        <div className="glass-card p-4 sm:p-5 flex items-center gap-3.5 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xl shrink-0 font-bold">
            ▣
          </div>
          <div className="min-w-0">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block truncate leading-none">Tarefas de hoje</span>
            <strong className="text-2xl font-black text-slate-900 dark:text-white mt-1 block leading-tight tracking-tight">
              {globalSummary.todayTasksCount}
            </strong>
            <small className="text-[11px] text-slate-400 dark:text-slate-500 block leading-none mt-0.5">De todos os projetos</small>
          </div>
        </div>

        {/* Card 3: Em andamento */}
        <div className="glass-card p-4 sm:p-5 flex items-center gap-3.5 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl shrink-0 font-bold">
            ▷
          </div>
          <div className="min-w-0">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block truncate leading-none">Em andamento</span>
            <strong className="text-2xl font-black text-slate-900 dark:text-white mt-1 block leading-tight tracking-tight">
              {globalSummary.inProgressProjects}
            </strong>
            <small className="text-[11px] text-slate-400 dark:text-slate-500 block leading-none mt-0.5">Projetos</small>
          </div>
        </div>

        {/* Card 4: Concluídos */}
        <div className="glass-card p-4 sm:p-5 flex items-center gap-3.5 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center text-xl shrink-0 font-bold">
            ✓
          </div>
          <div className="min-w-0">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block truncate leading-none">Concluídos</span>
            <strong className="text-2xl font-black text-slate-900 dark:text-white mt-1 block leading-tight tracking-tight">
              {globalSummary.completedProjects}
            </strong>
            <small className="text-[11px] text-slate-400 dark:text-slate-500 block leading-none mt-0.5">Projetos</small>
          </div>
        </div>
      </section>

      {/* ======================================================= */}
      {/* 3. TOOLBAR: FILTERS & SORT                             */}
      {/* ======================================================= */}
      <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {[
            { id: 'all', label: 'Meus projetos' },
            { id: 'geral', label: 'Geral' },
            { id: 'pessoal', label: 'Pessoal' },
            { id: 'trabalho', label: 'Trabalho' },
            { id: 'estudos', label: 'Estudos' },
          ].map(f => {
            const isActive = projectCategoryFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setProjectCategoryFilter(f.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.35)]'
                    : 'glass-pill text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {f.label}
              </button>
            );
          })}

          <button
            onClick={() => setIsNewProjectModalOpen(true)}
            className="w-8 h-8 rounded-xl glass-pill flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-blue-500 transition-colors shrink-0 cursor-pointer"
            title="Adicionar projeto"
          >
            <Plus size={15} />
          </button>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Busca rápida */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar..."
              className="text-xs pl-8 pr-3 py-1.5 rounded-xl glass-pill text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 w-32 sm:w-44"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs px-3 py-1.5 rounded-xl glass-pill text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="recent">Mais recentes</option>
            <option value="progress">Maior progresso</option>
            <option value="progress-asc">Menor progresso</option>
            <option value="deadline">Prazo mais próximo</option>
          </select>
        </div>
      </section>

      {/* ======================================================= */}
      {/* 4. PROJECT CARDS (Horizontal Scroll / Grid)            */}
      {/* ======================================================= */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {displayedProjects.map((project) => {
          const isSelected = project.id === selectedProject.id;
          const pTasks = tasks.filter(t => t.projectId === project.id);
          const pDone = pTasks.filter(t => t.status === 'done').length;
          const pTotal = pTasks.length;
          const pProgress = pTotal > 0 ? Math.round((pDone / pTotal) * 100) : 0;

          return (
            <motion.article
              key={project.id}
              onClick={() => setSelectedProjectId(project.id)}
              whileHover={{ y: -2 }}
              className={`glass-card p-4 flex flex-col justify-between cursor-pointer transition-all duration-200 relative overflow-hidden group ${
                isSelected 
                  ? 'border-blue-500 ring-2 ring-blue-500/30 shadow-[0_8px_30px_rgba(59,130,246,0.2)]' 
                  : 'hover:border-slate-300 dark:hover:border-blue-500/40'
              }`}
            >
              {isSelected && (
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-bl-full pointer-events-none"></div>
              )}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                    {project.name.charAt(0)}
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    {project.category}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {project.name}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 min-h-[32px] leading-tight">
                  {project.description}
                </p>
              </div>

              <div className="mt-4 pt-1">
                {/* Progress bar */}
                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700/60 overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-500"
                    style={{ width: `${pProgress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  <span>{pDone}/{pTotal} tarefas</span>
                  <span className="truncate max-w-[90px]">{project.deadline}</span>
                </div>
              </div>
            </motion.article>
          );
        })}
      </section>

      {/* ======================================================= */}
      {/* 5. PROJECT MAIN CONTENT & SIDEBAR                       */}
      {/* ======================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        {/* ==================== COLUNA ESQUERDA (8 COLS) ==================== */}
        <article className="lg:col-span-8 glass-card p-5 sm:p-6 flex flex-col justify-between shadow-sm min-h-[550px]">
          <div>
            {/* Project Header */}
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/60 dark:border-slate-800">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-400 font-black flex items-center justify-center text-xl shadow-sm">
                  {selectedProject.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                    {selectedProject.name}
                  </h2>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                    {selectedProject.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button 
                  onClick={handleDuplicateProject}
                  className="px-3 py-1.5 rounded-xl glass-pill text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-500 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Duplicar projeto"
                >
                  <Copy size={13} />
                  <span className="hidden sm:inline">Duplicar</span>
                </button>
                <button 
                  onClick={() => setIsNewProjectModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl glass-pill text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-500 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Editar projeto"
                >
                  <Edit3 size={13} />
                  <span>Editar</span>
                </button>
              </div>
            </header>

            {/* Project Tabs */}
            <nav className="flex items-center gap-6 border-b border-slate-200/60 dark:border-slate-800 pt-3 mb-4">
              {[
                { id: 'tasks', label: 'Tarefas' },
                { id: 'overview', label: 'Visão geral' },
                { id: 'files', label: 'Arquivos' },
                { id: 'notes', label: 'Notas' }
              ].map(tab => {
                const isActive = activeProjectTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveProjectTab(tab.id as any)}
                    className={`pb-3 text-xs font-bold transition-all relative cursor-pointer ${
                      isActive 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    {tab.label}
                    {isActive && (
                      <motion.div 
                        layoutId="activeTabUnderline"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full"
                      />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* View: Tarefas */}
            {activeProjectTab === 'tasks' && (
              <>
                {/* Task Toolbar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
                    {[
                      { id: 'all', label: 'Todas' },
                      { id: 'todo', label: 'A fazer' },
                      { id: 'doing', label: 'Em andamento' },
                      { id: 'done', label: 'Concluídas' }
                    ].map(f => {
                      const isActive = taskFilter === f.id;
                      return (
                        <button
                          key={f.id}
                          onClick={() => setTaskFilter(f.id as any)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            isActive
                              ? 'bg-blue-500/15 text-blue-600 dark:bg-blue-500/25 dark:text-blue-400 border border-blue-500/30'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {f.label}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setIsQuickAddOpen(prev => !prev)}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto"
                  >
                    <Plus size={14} className="stroke-[2.5]" />
                    <span>Adicionar tarefa</span>
                  </button>
                </div>

                {/* Quick Add Form */}
                <AnimatePresence>
                  {isQuickAddOpen && (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      onSubmit={handleQuickAddSubmit}
                      className="mb-5 p-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-blue-500/40 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-2 overflow-hidden"
                    >
                      <input
                        type="text"
                        value={quickTitle}
                        onChange={(e) => setQuickTitle(e.target.value)}
                        placeholder="O que precisa ser feito?"
                        autoFocus
                        className="flex-1 text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />

                      <select
                        value={quickPriority}
                        onChange={(e) => setQuickPriority(e.target.value as any)}
                        className="text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
                      >
                        <option value="medium">Média</option>
                        <option value="high">Alta</option>
                        <option value="low">Baixa</option>
                      </select>

                      <input
                        type="date"
                        value={quickDate}
                        onChange={(e) => setQuickDate(e.target.value)}
                        className="text-xs px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
                      />

                      <div className="flex items-center gap-1.5">
                        <button
                          type="submit"
                          disabled={!quickTitle.trim()}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs transition-colors cursor-pointer shrink-0"
                        >
                          Salvar
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsQuickAddOpen(false)}
                          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>

                {/* Task Groups */}
                <div className="space-y-5">
                  {Object.entries(taskGroups).map(([key, group]) => {
                    if (group.tasks.length === 0 && taskFilter === 'all') return null;

                    return (
                      <div key={key} className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
                          <span>{group.title}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {group.tasks.length}
                          </span>
                        </div>

                        {group.tasks.length > 0 ? (
                          <div className="rounded-2xl overflow-hidden border border-slate-200/60 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/80 bg-white/40 dark:bg-slate-900/30">
                            {group.tasks.map((task) => {
                              const isDone = task.status === 'done';

                              return (
                                <div
                                  key={task.id}
                                  className={`flex items-center justify-between gap-3 p-3 transition-colors group ${
                                    isDone 
                                      ? 'bg-slate-50/50 dark:bg-slate-900/20 opacity-70' 
                                      : 'hover:bg-white/60 dark:hover:bg-slate-800/40'
                                  }`}
                                >
                                  {/* Left: Checkbox + Title */}
                                  <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleTask(task.id)}
                                      className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all cursor-pointer shrink-0 ${
                                        isDone
                                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                                          : 'border-slate-300 dark:border-slate-600 hover:border-blue-500'
                                      }`}
                                      aria-label="Concluir tarefa"
                                    >
                                      {isDone && <Check size={12} className="stroke-[3]" />}
                                    </button>

                                    <span className={`text-xs font-semibold truncate ${
                                      isDone 
                                        ? 'line-through text-slate-400 dark:text-slate-500' 
                                        : 'text-slate-800 dark:text-slate-200'
                                    }`}>
                                      {task.title}
                                    </span>
                                  </div>

                                  {/* Right: Tag, Priority, Date */}
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="hidden sm:inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                      {task.tag}
                                    </span>

                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                      task.priority === 'high' 
                                        ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25'
                                        : task.priority === 'low'
                                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25'
                                    }`}>
                                      {task.priority === 'high' ? '★ Alta' : task.priority === 'low' ? '★ Baixa' : '★ Média'}
                                    </span>

                                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium w-14 text-right">
                                      {task.date}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-4 text-center text-xs text-slate-400 italic rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/20">
                            Nenhuma tarefa neste filtro
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* View: Visão geral */}
            {activeProjectTab === 'overview' && (
              <div className="space-y-4 py-3">
                <div className="p-4 rounded-2xl bg-white/50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">Sobre o Projeto</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {selectedProject.description}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-white/50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Categoria</span>
                    <strong className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1 block">{selectedProject.category}</strong>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Prazo Final</span>
                    <strong className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1 block">{selectedProject.deadline}</strong>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Conclusão</span>
                    <strong className="text-sm font-bold text-emerald-500 mt-1 block">{projectStats.percent}%</strong>
                  </div>
                </div>
              </div>
            )}

            {/* View: Arquivos */}
            {activeProjectTab === 'files' && (
              <div className="py-8 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-3">
                  <Upload size={22} />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Nenhum arquivo anexado ainda</h4>
                <p className="text-xs text-slate-400 max-w-xs mt-1 mb-4">Envie documentos, especificações e anexos para manter tudo centralizado.</p>
                <button 
                  onClick={() => showNotification('Simulação: seletor de arquivos aberto.')}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
                >
                  Fazer upload de arquivo
                </button>
              </div>
            )}

            {/* View: Notas */}
            {activeProjectTab === 'notes' && (
              <div className="space-y-3 py-2">
                <div className="p-4 rounded-2xl bg-white/50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Anotações de Reunião & Sprint</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Definidas as prioridades da semana com foco no fluxo de tarefas rápidas e design horizontal refinado.
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400">Hoje</span>
                </div>
                <button 
                  onClick={() => showNotification('Nova nota criada no projeto.')}
                  className="w-full py-2.5 rounded-xl border border-dashed border-blue-500/40 text-blue-500 text-xs font-bold hover:bg-blue-500/5 transition-colors cursor-pointer"
                >
                  + Adicionar nova nota
                </button>
              </div>
            )}
          </div>
        </article>

        {/* ==================== COLUNA DIREITA (4 COLS SIDEBAR) ==================== */}
        <aside className="lg:col-span-4 flex flex-col gap-4">
          {/* Card 1: Progresso do Projeto com Anel SVG */}
          <section className="glass-card p-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-4">
              Progresso do projeto
            </h3>

            <div className="flex items-center gap-5">
              {/* Circular Progress Ring */}
              <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r={ringRadius}
                    fill="none"
                    strokeWidth="8"
                    className="text-slate-200/80 dark:text-slate-800/80 stroke-current"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r={ringRadius}
                    fill="none"
                    strokeWidth="8"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringOffset}
                    strokeLinecap="round"
                    className="text-blue-500 stroke-current transition-all duration-700 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]"
                  />
                </svg>
                <strong className="absolute text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  {projectStats.percent}%
                </strong>
              </div>

              {/* Progress Legend */}
              <ul className="space-y-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                  <strong className="text-slate-900 dark:text-white font-bold">{projectStats.done}</strong>
                  <span>Concluídas</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"></span>
                  <strong className="text-slate-900 dark:text-white font-bold">{projectStats.doing}</strong>
                  <span>Em andamento</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0"></span>
                  <strong className="text-slate-900 dark:text-white font-bold">{projectStats.todo}</strong>
                  <span>A fazer</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Card 2: Membros */}
          <section className="glass-card p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Membros
              </h3>
              <button 
                onClick={() => showNotification('Link de convite copiado para a área de transferência!')}
                className="text-xs font-bold text-blue-500 hover:text-blue-600 cursor-pointer"
              >
                ＋ Convidar
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-black flex items-center justify-center text-sm shadow-sm shrink-0">
                {user?.name?.charAt(0) || 'P'}
              </div>
              <div>
                <strong className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
                  {user?.name || 'Phillipe'}
                </strong>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                  Proprietário 👑
                </span>
              </div>
            </div>
          </section>

          {/* Card 3: Prazo */}
          <section className="glass-card p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Prazo
              </h3>
              <button 
                onClick={() => setIsNewProjectModalOpen(true)}
                className="text-slate-400 hover:text-blue-500 transition-colors cursor-pointer"
                title="Editar prazo"
              >
                <Edit3 size={13} />
              </button>
            </div>
            <strong className="text-sm font-black text-slate-900 dark:text-white block">
              {selectedProject.deadline}
            </strong>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Acompanhamento contínuo no Nexus Focus
            </p>
          </section>

          {/* Card 4: Etiquetas / Tags */}
          <section className="glass-card p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Etiquetas
              </h3>
              <button 
                onClick={() => showNotification('Editor de etiquetas ativado')}
                className="text-xs text-blue-500 hover:underline cursor-pointer"
              >
                +
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(selectedProject.tags || ['Desenvolvimento', 'Design', 'Backend', 'Marketing', 'Teste', 'Conteúdo']).map((tg) => (
                <span key={tg} className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  {tg}
                </span>
              ))}
            </div>
          </section>

          {/* Card 5: Ações Rápidas */}
          <section className="glass-card p-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
              Ações rápidas
            </h3>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => {
                  setActiveProjectTab('tasks');
                  setIsQuickAddOpen(true);
                }}
                className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-blue-500/10 hover:text-blue-500 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Plus size={14} />
                <span>Adicionar tarefa</span>
              </button>

              <button
                onClick={() => {
                  setActiveProjectTab('notes');
                  showNotification('Aba de notas do projeto selecionada');
                }}
                className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-blue-500/10 hover:text-blue-500 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <FileText size={14} />
                <span>Adicionar nota</span>
              </button>

              <button
                onClick={() => {
                  setActiveProjectTab('files');
                  showNotification('Aba de arquivos do projeto selecionada');
                }}
                className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-blue-500/10 hover:text-blue-500 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Upload size={14} />
                <span>Fazer upload de arquivo</span>
              </button>

              <button
                onClick={handleDuplicateProject}
                className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-blue-500/10 hover:text-blue-500 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Copy size={14} />
                <span>Duplicar projeto</span>
              </button>

              <button
                onClick={() => handleDeleteProject(selectedProject.id)}
                className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Excluir projeto</span>
              </button>
            </div>
          </section>
        </aside>
      </section>

      {/* ======================================================= */}
      {/* MODAL: NOVO PROJETO                                    */}
      {/* ======================================================= */}
      <AnimatePresence>
        {isNewProjectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md glass-card p-6 border border-blue-500/40 shadow-2xl relative"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center font-bold">
                    <Folder size={18} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Criar Novo Projeto</h3>
                </div>
                <button
                  onClick={() => setIsNewProjectModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Nome do Projeto
                  </label>
                  <input
                    type="text"
                    required
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Ex: Lançamento de Curso, Reforma..."
                    className="w-full text-xs px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Descrição
                  </label>
                  <textarea
                    rows={2}
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                    placeholder="Objetivo principal e detalhes do projeto"
                    className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Categoria
                    </label>
                    <select
                      value={newProjectCategory}
                      onChange={(e) => setNewProjectCategory(e.target.value as any)}
                      className="w-full text-xs px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
                    >
                      <option value="Trabalho">Trabalho</option>
                      <option value="Pessoal">Pessoal</option>
                      <option value="Estudos">Estudos</option>
                      <option value="Geral">Geral</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Prazo Final
                    </label>
                    <input
                      type="date"
                      value={newProjectDeadline}
                      onChange={(e) => setNewProjectDeadline(e.target.value)}
                      className="w-full text-xs px-2.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsNewProjectModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!newProjectName.trim()}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    Criar Projeto
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
