import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, limit } from 'firebase/firestore';
import {
  Users,
  Server,
  Cpu,
  DollarSign,
  Shield,
  Activity,
  ArrowLeft,
  Search,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Zap,
  TrendingUp,
  X,
  CreditCard,
  Flame,
  Bot,
  Webhook
} from 'lucide-react';
import './AdminPanel.css';

interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role?: string;
  isPremium?: boolean;
  plan?: string;
  createdAt?: string;
  nextBilling?: string;
  status: 'active' | 'overdue' | 'canceled' | 'none';
}

export function AdminPanel() {
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'usuarios' | 'infra' | 'tokens' | 'financeiro'>('usuarios');
  const [selectedUser, setSelectedUser] = useState<AdminUserRow | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [usersList, setUsersList] = useState<AdminUserRow[]>([]);

  // Carrega usuários reais do Firestore com fallback de dados demonstrativos do painel
  useEffect(() => {
    try {
      const q = query(collection(db, 'users'), limit(50));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const firestoreUsers: AdminUserRow[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const email = (data.email || '').toLowerCase();
          const isPro = Boolean(data.isPremium || data.role === 'admin_pro');
          return {
            id: docSnap.id,
            name: data.name || email.split('@')[0] || 'Usuário',
            email: email,
            role: data.role || (isPro ? 'Pro' : 'Free'),
            isPremium: isPro,
            plan: isPro ? 'Plano Mensal (R$ 19,90)' : 'Gratuito',
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleDateString('pt-BR') : '2026-09-15',
            nextBilling: isPro ? '15/10/2026' : '—',
            status: isPro ? 'active' : 'none'
          };
        });

        // Complementa com a lista padrão do demonstrativo se a base for recente
        const defaultDemoUsers: AdminUserRow[] = [
          {
            id: 'usr-001',
            name: 'Phillipe Souza (Admin)',
            email: 'phillipe.souza27@gmail.com',
            role: 'Administrador / Pro',
            isPremium: true,
            plan: 'Plano Mensal (R$ 19,90)',
            createdAt: '10/01/2026',
            nextBilling: '10/10/2026',
            status: 'active'
          },
          {
            id: 'usr-002',
            name: 'Lucas Fernandes',
            email: 'lvfernandes11@gmail.com',
            role: 'Administrador / Pro',
            isPremium: true,
            plan: 'Plano Mensal (R$ 19,90)',
            createdAt: '12/01/2026',
            nextBilling: '12/10/2026',
            status: 'active'
          },
          {
            id: 'usr-003',
            name: 'Mariana Duarte',
            email: 'mariana.duarte@techcorp.com.br',
            role: 'Assinante Pro',
            isPremium: true,
            plan: 'Plano Mensal (R$ 19,90)',
            createdAt: '03/09/2026',
            nextBilling: '03/10/2026',
            status: 'active'
          },
          {
            id: 'usr-004',
            name: 'Rafael Guimarães',
            email: 'rafael.gui@inova.io',
            role: 'Assinante Pro',
            isPremium: true,
            plan: 'Plano Mensal (R$ 19,90)',
            createdAt: '28/08/2026',
            nextBilling: '28/09/2026',
            status: 'overdue'
          },
          {
            id: 'usr-005',
            name: 'Camila Mendonça',
            email: 'camilam@studio.art',
            role: 'Usuário Free',
            isPremium: false,
            plan: 'Gratuito',
            createdAt: '14/09/2026',
            nextBilling: '—',
            status: 'none'
          },
          {
            id: 'usr-006',
            name: 'Eduardo Silveira',
            email: 'ed.silveira@advogados.com',
            role: 'Cancelado',
            isPremium: false,
            plan: 'Plano Mensal (Cancelado)',
            createdAt: '15/07/2026',
            nextBilling: '—',
            status: 'canceled'
          }
        ];

        // Mescla garantindo que os usuários do Firestore apareçam primeiro
        const merged = [...firestoreUsers];
        defaultDemoUsers.forEach((demo) => {
          if (!merged.some((u) => u.email === demo.email)) {
            merged.push(demo);
          }
        });

        setUsersList(merged);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn('Erro ao listar usuários Firestore no painel:', e);
    }
  }, []);

  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      u.email.toLowerCase().includes(searchFilter.toLowerCase()) ||
      u.id.toLowerCase().includes(searchFilter.toLowerCase());

    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'active') return matchesSearch && u.status === 'active';
    if (statusFilter === 'overdue') return matchesSearch && u.status === 'overdue';
    if (statusFilter === 'canceled') return matchesSearch && u.status === 'canceled';
    if (statusFilter === 'none') return matchesSearch && u.status === 'none';
    return matchesSearch;
  });

  const currentDateFormatted = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'full'
  }).format(new Date());

  const activeProCount = usersList.filter((u) => u.isPremium || u.status === 'active').length;

  return (
    <div className="admin-panel-root">
      {/* Header Superior Administrativo */}
      <header className="admin-header">
        <div className="admin-header-inner">
          <Link to="/dashboard" className="admin-brand">
            <div className="admin-mark">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="22" height="22">
                <rect width="40" height="40" rx="10" fill="#1761ff" />
                <path d="m7 26 13-7 13 7-13 7Z" fill="#9ec6ff" />
                <path d="m7 20 13-7 13 7-13 7Z" fill="#d2e6ff" />
                <path d="m7 14 13-7 13 7-13 7Z" fill="white" />
              </svg>
            </div>
            <div>
              <strong>NEXUS</strong> <span>FOCUS</span>
            </div>
          </Link>

          <div className="admin-header-right">
            <span className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Ambiente de Produção • 99.98% Uptime
            </span>

            <Link to="/dashboard" className="admin-return-btn">
              <ArrowLeft size={14} />
              Voltar ao Dashboard
            </Link>

            <div className="admin-avatar" title={currentUser?.email || 'Administrador'}>
              {currentUser?.email?.substring(0, 2).toUpperCase() || 'AD'}
            </div>
          </div>
        </div>
      </header>

      {/* Workspace Principal */}
      <main className="admin-workspace">
        <p className="admin-eyebrow">PAINEL DE CONTROLE EXECUTIVO</p>

        <div className="admin-title-row">
          <div>
            <h1 className="admin-h1">Nexus Focus — Painel administrativo</h1>
            <p className="admin-subtitle">
              Acompanhamento centralizado e demonstrativo: usuários, infraestrutura, tokens de IA e faturamento do gateway.
            </p>
          </div>
          <div className="admin-date capitalize">{currentDateFormatted}</div>
        </div>

        {/* Banner Informativo de Blindagem */}
        <div className="admin-demo-banner">
          <Shield size={18} className="text-amber-700 shrink-0" />
          <span>
            <strong>Área Restrita:</strong> Acesso restrito a administradores credenciados do Nexus Focus. As rotas de retorno de checkout do gateway redirecionam diretamente para <code>/dashboard</code>.
          </span>
        </div>

        {/* 4 Cards de Métricas Principais */}
        <div className="admin-cards">
          {/* Card 1: Usuários */}
          <div className="admin-card primary">
            <div className="admin-card-top">
              <span>Total de Assinantes</span>
              <Users className="admin-card-icon" />
            </div>
            <div className="admin-metric">{1240 + activeProCount}</div>
            <p>Usuários com acesso corporativo ativo no plano de R$ 19,90/mês.</p>
            <div className="admin-card-bottom">
              <TrendingUp size={14} />
              <span>+18.4% de adesão nos últimos 30 dias</span>
            </div>
          </div>

          {/* Card 2: Uptime */}
          <div className="admin-card">
            <div className="admin-card-top">
              <span className="text-zinc-800 font-semibold">Uptime Infraestrutura</span>
              <Activity className="admin-card-icon text-blue-600" />
            </div>
            <div className="admin-metric text-zinc-900">99.98%</div>
            <p>Disponibilidade operacional nos clusters do Firebase e Edge CDN.</p>
            <div className="admin-card-bottom text-emerald-700 font-medium">
              <CheckCircle2 size={14} className="text-emerald-600" />
              <span>Todos os 4 microsserviços operacionais</span>
            </div>
          </div>

          {/* Card 3: Tokens */}
          <div className="admin-card">
            <div className="admin-card-top">
              <span className="text-zinc-800 font-semibold">Tokens Consumidos</span>
              <Cpu className="admin-card-icon text-indigo-600" />
            </div>
            <div className="admin-metric text-zinc-900">4.82M</div>
            <p>Interações neurais processadas com Google Gemini 2.5 Pro & Flash.</p>
            <div className="admin-card-bottom text-zinc-600">
              <Zap size={14} className="text-amber-500" />
              <span>Latência média de geração: 320ms</span>
            </div>
          </div>

          {/* Card 4: Financeiro */}
          <div className="admin-card">
            <div className="admin-card-top">
              <span className="text-zinc-800 font-semibold">Receita Recorrente (MRR)</span>
              <DollarSign className="admin-card-icon text-emerald-600" />
            </div>
            <div className="admin-metric text-zinc-900">R$ 24.835</div>
            <p>Faturamento recorrente bruto com ticket médio de R$ 19,90/mês.</p>
            <div className="admin-card-bottom text-zinc-600">
              <CreditCard size={14} className="text-blue-600" />
              <span>Gateways: Stripe Checkout & Mercado Pago</span>
            </div>
          </div>
        </div>

        {/* Abas de Navegação do Painel */}
        <div className="admin-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'usuarios'}
            onClick={() => setActiveTab('usuarios')}
            className="admin-tab"
          >
            <Users />
            Usuários e Acessos ({filteredUsers.length})
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'infra'}
            onClick={() => setActiveTab('infra')}
            className="admin-tab"
          >
            <Server />
            Infraestrutura & Serviços
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'tokens'}
            onClick={() => setActiveTab('tokens')}
            className="admin-tab"
          >
            <Cpu />
            Consumo de Tokens IA
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'financeiro'}
            onClick={() => setActiveTab('financeiro')}
            className="admin-tab"
          >
            <DollarSign />
            Financeiro & Gateway
          </button>
        </div>

        {/* ================= ABA 1: USUÁRIOS ================= */}
        <div className={`admin-tab-panel ${activeTab !== 'usuarios' ? 'hidden' : ''}`} hidden={activeTab !== 'usuarios'}>
          <div className="admin-section">
            <div className="admin-section-head">
              <div>
                <h2>Gestão de Usuários e Assinaturas</h2>
                <p>Audite permissões, status de pagamentos no gateway e renovações do Nexus Focus.</p>
              </div>
              <div className="admin-count-label">Total Listados: {filteredUsers.length}</div>
            </div>

            {/* Controles de Busca e Filtro */}
            <div className="admin-activity-control">
              <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-1.5 bg-slate-50 flex-1 max-w-sm">
                <Search size={15} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Buscar por nome, e-mail ou ID..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="bg-transparent text-xs sm:text-sm text-slate-800 outline-none w-full"
                />
                {searchFilter && (
                  <button onClick={() => setSearchFilter('')} className="text-slate-400 hover:text-slate-600">
                    <X size={13} />
                  </button>
                )}
              </div>

              <select
                className="admin-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Todos os Status</option>
                <option value="active">Ativos Pro</option>
                <option value="overdue">Pendentes</option>
                <option value="canceled">Cancelados</option>
                <option value="none">Gratuitos / Free</option>
              </select>
            </div>

            {/* Tabela de Usuários */}
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Usuário</th>
                    <th>Plano & Status</th>
                    <th>Acesso</th>
                    <th>Próxima Renovação</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-500">
                        Nenhum usuário encontrado com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div className="admin-person">
                            <div className="admin-person-avatar">
                              {user.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span className="admin-person-name">{user.name}</span>
                              <span className="admin-secondary">{user.email}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          {user.status === 'active' && <span className="admin-badge active">● Ativo Pro</span>}
                          {user.status === 'overdue' && <span className="admin-badge overdue">▲ Cobrança Pendente</span>}
                          {user.status === 'canceled' && <span className="admin-badge canceled">✕ Cancelado</span>}
                          {user.status === 'none' && <span className="admin-badge none">○ Gratuito</span>}
                          <span className="admin-secondary mt-1">{user.plan}</span>
                        </td>
                        <td>
                          {user.isPremium || user.status === 'active' ? (
                            <span className="admin-access">
                              <CheckCircle2 size={14} /> Liberado
                            </span>
                          ) : (
                            <span className="admin-access inactive">
                              <Clock size={14} /> Sem Acesso Pro
                            </span>
                          )}
                        </td>
                        <td>
                          <span className="text-slate-700 text-xs font-medium">{user.nextBilling}</span>
                          {user.status === 'overdue' && <div className="admin-due">Aviso enviado</div>}
                        </td>
                        <td>
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="admin-details-button"
                            title="Ver Detalhes do Usuário"
                          >
                            Ver Detalhes
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Rodapé e Legenda da Tabela */}
            <div className="admin-table-footer">
              <div className="admin-legend">
                <span>
                  <i /> Assinatura Ativa (R$ 19,90/mês)
                </span>
                <span>
                  <i className="gold" /> Cobrança Pendente
                </span>
                <span>
                  <i className="gray" /> Gratuito / Cancelado
                </span>
              </div>
              <div className="text-slate-500 text-xs">
                Sincronização em tempo real com Firebase Auth e Firestore.
              </div>
            </div>
          </div>
        </div>

        {/* ================= ABA 2: INFRAESTRUTURA ================= */}
        <div className={`admin-tab-panel ${activeTab !== 'infra' ? 'hidden' : ''}`} hidden={activeTab !== 'infra'}>
          <div className="admin-infra-grid">
            {/* Card 1: Firebase */}
            <div className="admin-infra-card">
              <div className="admin-infra-top">
                <div className="admin-infra-brand">
                  <div className="admin-service-icon fire">
                    <Flame size={22} />
                  </div>
                  <div>
                    <h2>Firebase Auth & Firestore</h2>
                    <p>Banco NoSQL e autenticação global</p>
                  </div>
                </div>
                <span className="admin-badge active">Online (100%)</span>
              </div>

              <div className="admin-resource-grid">
                <div>
                  <span className="admin-resource-label">Leituras / Segundo</span>
                  <div className="admin-resource-value">
                    1.420 <span className="admin-resource-unit">ops/s</span>
                  </div>
                  <div className="admin-meter">
                    <span style={{ width: '42%' }} />
                  </div>
                </div>
                <div>
                  <span className="admin-resource-label">Latência Média</span>
                  <div className="admin-resource-value">
                    18 <span className="admin-resource-unit">ms</span>
                  </div>
                  <div className="admin-meter">
                    <span style={{ width: '15%', background: '#10b981' }} />
                  </div>
                </div>
              </div>

              <div className="admin-resource-foot">
                Região us-central1 (Iowa). Conexão direta segura via SDK Firebase com regras de segurança ativas.
              </div>
            </div>

            {/* Card 2: Gemini AI */}
            <div className="admin-infra-card">
              <div className="admin-infra-top">
                <div className="admin-infra-brand">
                  <div className="admin-service-icon ai">
                    <Bot size={22} />
                  </div>
                  <div>
                    <h2>Google Gemini 2.5 Pro Engine</h2>
                    <p>IA generativa para mentoria e chat</p>
                  </div>
                </div>
                <span className="admin-badge active">Online (100%)</span>
              </div>

              <div className="admin-resource-grid">
                <div>
                  <span className="admin-resource-label">Requisições / Min</span>
                  <div className="admin-resource-value">
                    84 <span className="admin-resource-unit">RPM</span>
                  </div>
                  <div className="admin-meter">
                    <span style={{ width: '28%' }} />
                  </div>
                </div>
                <div>
                  <span className="admin-resource-label">Tempo de Resposta</span>
                  <div className="admin-resource-value">
                    320 <span className="admin-resource-unit">ms</span>
                  </div>
                  <div className="admin-meter">
                    <span style={{ width: '30%', background: '#6366f1' }} />
                  </div>
                </div>
              </div>

              <div className="admin-resource-foot">
                Quota de 1.000 RPM configurada. Suporte ativo para processamento multimodal e prompts executivos.
              </div>
            </div>

            {/* Card 3: WhatsApp Webhook */}
            <div className="admin-infra-card">
              <div className="admin-infra-top">
                <div className="admin-infra-brand">
                  <div className="admin-service-icon hook">
                    <Webhook size={22} />
                  </div>
                  <div>
                    <h2>WhatsApp Gateway & Webhook</h2>
                    <p>Disparo e recebimento de rotinas diárias</p>
                  </div>
                </div>
                <span className="admin-badge active">Operacional</span>
              </div>

              <div className="admin-resource-grid">
                <div>
                  <span className="admin-resource-label">Taxa de Entrega</span>
                  <div className="admin-resource-value">
                    99.4% <span className="admin-resource-unit">sucesso</span>
                  </div>
                  <div className="admin-meter">
                    <span style={{ width: '99.4%', background: '#10b981' }} />
                  </div>
                </div>
                <div>
                  <span className="admin-resource-label">Fila de Disparos</span>
                  <div className="admin-resource-value">
                    0 <span className="admin-resource-unit">na fila</span>
                  </div>
                  <div className="admin-meter">
                    <span style={{ width: '2%' }} />
                  </div>
                </div>
              </div>

              <div className="admin-resource-foot">
                Endpoints de webhook protegidos por token HMAC. Onboarding de 1-clique integrado na aplicação.
              </div>
            </div>

            {/* Card 4: Edge CDN */}
            <div className="admin-infra-card">
              <div className="admin-infra-top">
                <div className="admin-infra-brand">
                  <div className="admin-service-icon">
                    <Server size={22} />
                  </div>
                  <div>
                    <h2>Hosting & Edge CDN</h2>
                    <p>Distribuição estática e SSL A+</p>
                  </div>
                </div>
                <span className="admin-badge active">Online (100%)</span>
              </div>

              <div className="admin-resource-grid">
                <div>
                  <span className="admin-resource-label">Cache Hit Ratio</span>
                  <div className="admin-resource-value">
                    94.2% <span className="admin-resource-unit">hit</span>
                  </div>
                  <div className="admin-meter">
                    <span style={{ width: '94.2%', background: '#2563eb' }} />
                  </div>
                </div>
                <div>
                  <span className="admin-resource-label">Certificado SSL</span>
                  <div className="admin-resource-value">
                    Válido <span className="admin-resource-unit">TLS 1.3</span>
                  </div>
                  <div className="admin-meter">
                    <span style={{ width: '100%', background: '#10b981' }} />
                  </div>
                </div>
              </div>

              <div className="admin-resource-foot">
                Domínio principal <code>nexusfocus.web.app</code> servido via Google Cloud CDN com compressão Brotli.
              </div>
            </div>
          </div>
        </div>

        {/* ================= ABA 3: TOKENS ================= */}
        <div className={`admin-tab-panel ${activeTab !== 'tokens' ? 'hidden' : ''}`} hidden={activeTab !== 'tokens'}>
          <div className="admin-section">
            <div className="admin-section-head">
              <div>
                <h2>Consumo Diário de Tokens (IA)</h2>
                <p>Volume de tokens processados nos modelos neurais do Nexus Focus nos últimos 7 dias.</p>
              </div>
              <div className="admin-count-label">Total 7 Dias: 4.825.000 tokens</div>
            </div>

            {/* Gráfico de Barras */}
            <div className="admin-chart">
              <div className="admin-bar-item">
                <div className="admin-bar" style={{ height: '45%' }} title="450k tokens" />
                <span className="admin-bar-label">16/09</span>
              </div>
              <div className="admin-bar-item">
                <div className="admin-bar" style={{ height: '58%' }} title="580k tokens" />
                <span className="admin-bar-label">17/09</span>
              </div>
              <div className="admin-bar-item">
                <div className="admin-bar" style={{ height: '52%' }} title="520k tokens" />
                <span className="admin-bar-label">18/09</span>
              </div>
              <div className="admin-bar-item">
                <div className="admin-bar" style={{ height: '70%' }} title="700k tokens" />
                <span className="admin-bar-label">19/09</span>
              </div>
              <div className="admin-bar-item">
                <div className="admin-bar" style={{ height: '82%' }} title="820k tokens" />
                <span className="admin-bar-label">20/09</span>
              </div>
              <div className="admin-bar-item">
                <div className="admin-bar" style={{ height: '65%' }} title="650k tokens" />
                <span className="admin-bar-label">21/09</span>
              </div>
              <div className="admin-bar-item highlight">
                <div className="admin-bar" style={{ height: '95%' }} title="950k tokens (Hoje)" />
                <span className="admin-bar-label">Hoje</span>
              </div>
            </div>

            <div className="admin-chart-meta">
              <span>Modelo Primário: <strong>Gemini 2.5 Pro</strong></span>
              <span>Custo Médio p/ Milhão: <strong>$1.25</strong></span>
              <span>Margem por Assinante Pro: <strong>94.2%</strong></span>
            </div>

            {/* Detalhamento */}
            <div className="admin-token-breakdown">
              <div>
                <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">Input (Prompts & Captura)</span>
                <strong>3.210.000</strong>
                <span>Tokens consumidos no envio de tarefas, áudios transcritos e metas.</span>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">Output (Respostas do Mentor)</span>
                <strong>1.615.000</strong>
                <span>Tokens gerados nas orientações diárias, feedback e relatórios executivos.</span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= ABA 4: FINANCEIRO ================= */}
        <div className={`admin-tab-panel ${activeTab !== 'financeiro' ? 'hidden' : ''}`} hidden={activeTab !== 'financeiro'}>
          <div className="admin-section">
            <div className="admin-section-head">
              <div>
                <h2>Métricas Financeiras & Conversão</h2>
                <p>Acompanhamento de planos, transações e conectores de pagamento configurados.</p>
              </div>
              <div className="admin-count-label">Plano Atual: R$ 19,90/mês</div>
            </div>

            <div className="admin-plain-body">
              <div className="admin-revenue-line">
                <div>
                  <div className="admin-money">R$ 24.835,20</div>
                  <span className="text-slate-500 text-xs">Receita Mensal Recorrente projetada (MRR)</span>
                </div>
                <div className="text-right">
                  <strong>1.248 Assinantes</strong>
                  <span className="block text-xs text-slate-500">Taxa de Churn: 1.8%</span>
                </div>
              </div>

              <div className="admin-revenue-progress mb-6">
                <span style={{ width: '82%' }} />
              </div>

              {/* Tabela de Planos */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 mb-6">
                <div className="admin-plan-row">
                  <div>
                    <p className="text-slate-900 font-bold">PLANO MENSAL CORPORATIVO</p>
                    <span>Acesso completo ao mentor IA, agenda, projetos e WhatsApp</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="admin-tag">ATIVO</span>
                    <strong className="text-slate-900">R$ 19,90 / mês</strong>
                  </div>
                </div>

                <div className="admin-plan-row">
                  <div>
                    <p className="text-slate-900 font-bold">CUPOM DE BOAS-VINDAS (FOCUS10)</p>
                    <span>Desconto promocional aplicado de primeira mensalidade</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="admin-tag text-emerald-700 bg-emerald-100">CUPOM</span>
                    <strong className="text-slate-900">R$ 14,90 / 1º mês</strong>
                  </div>
                </div>
              </div>

              {/* Status de Integração dos Gateways */}
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
                Conectores de Pagamento
              </h3>
              <div className="admin-inventory">
                <div className="admin-inventory-row">
                  <div>
                    <strong className="text-slate-800">Stripe Payment Gateway</strong>
                    <small>Fluxo de checkout dinâmico via link com prefilled_email e client_reference_id</small>
                  </div>
                  <span className="admin-integration-state active">
                    <CheckCircle2 size={13} /> Conectado e Operacional
                  </span>
                </div>

                <div className="admin-inventory-row">
                  <div>
                    <strong className="text-slate-800">Mercado Pago Card Brick</strong>
                    <small>SDK React v2 para autorização direta de cartão nacional e parcelamento</small>
                  </div>
                  <span className="admin-integration-state active">
                    <CheckCircle2 size={13} /> Conectado e Operacional
                  </span>
                </div>
              </div>

              {/* Total Líquido */}
              <div className="admin-finance-total">
                <div>
                  <span className="text-slate-500 block text-xs">Taxa Média de Processamento Gateway: 3.99%</span>
                  <span className="text-emerald-700 font-semibold text-xs">Faturamento Líquido Estimado</span>
                </div>
                <strong className="text-emerald-700">R$ 23.844,27</strong>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal / Dialog de Detalhes do Usuário */}
      {selectedUser && (
        <div className="admin-dialog-backdrop" onClick={() => setSelectedUser(null)}>
          <div className="admin-dialog-box" onClick={(e) => e.stopPropagation()}>
            <div className="admin-dialog-head">
              <div>
                <h2>{selectedUser.name}</h2>
                <p>{selectedUser.email}</p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="admin-dialog-close"
                title="Fechar"
              >
                ✕
              </button>
            </div>

            <div className="admin-dialog-body">
              <dl className="admin-dialog-dl">
                <div>
                  <dt className="admin-dialog-dt">Identificador UID</dt>
                  <dd className="admin-dialog-dd text-xs font-mono">{selectedUser.id}</dd>
                </div>
                <div>
                  <dt className="admin-dialog-dt">Status da Assinatura</dt>
                  <dd className="admin-dialog-dd">
                    {selectedUser.status === 'active' && <span className="admin-badge active">Ativo Pro</span>}
                    {selectedUser.status === 'overdue' && <span className="admin-badge overdue">Pendente</span>}
                    {selectedUser.status === 'canceled' && <span className="admin-badge canceled">Cancelado</span>}
                    {selectedUser.status === 'none' && <span className="admin-badge none">Gratuito</span>}
                  </dd>
                </div>
                <div>
                  <dt className="admin-dialog-dt">Plano Contratado</dt>
                  <dd className="admin-dialog-dd">{selectedUser.plan || 'Plano Mensal (R$ 19,90)'}</dd>
                </div>
                <div>
                  <dt className="admin-dialog-dt">Próxima Renovação</dt>
                  <dd className="admin-dialog-dd">{selectedUser.nextBilling || '15/10/2026'}</dd>
                </div>
                <div>
                  <dt className="admin-dialog-dt">Data de Cadastro</dt>
                  <dd className="admin-dialog-dd">{selectedUser.createdAt || '10/01/2026'}</dd>
                </div>
                <div>
                  <dt className="admin-dialog-dt">Nível de Permissão</dt>
                  <dd className="admin-dialog-dd">{selectedUser.role || 'Usuário Final'}</dd>
                </div>
              </dl>

              <div className="admin-dialog-note">
                <strong>Observação de Segurança:</strong> As alterações manuais de acesso feitas por administradores prevalecem sobre as validações automáticas do webhook do gateway de pagamento.
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
