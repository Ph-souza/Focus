'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import './painel.css';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminMetrics, AdminUserRecord } from '../../hooks/useAdminMetrics';
import { useMercadoPagoMetrics } from '../../hooks/useMercadoPagoMetrics';
import { DAY, telemetry, TelemetryItem } from './mockData';

// Funções utilitárias de data e formatação em tempo real
const nowMs = (): number => Date.now();

const stamp = (value: string | null | undefined): number =>
  value ? Date.parse(value.length === 10 ? value + 'T15:00:00Z' : value) : NaN;

const date = (value: string | null | undefined): string => {
  if (!value || value === '2099-12-31') return '—';
  const parsed = stamp(value);
  if (Number.isNaN(parsed)) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
  }).format(parsed);
};

const paid = (user: AdminUserRecord): boolean =>
  user.billingStatus === 'active' || user.billingStatus === 'lifetime';

const isActive = (user: AdminUserRecord, days: number): boolean => {
  if (!user.lastActiveAt) return false;
  const last = stamp(user.lastActiveAt);
  if (Number.isNaN(last)) return false;
  return nowMs() - last <= days * DAY;
};

const renewalDays = (user: AdminUserRecord): number => {
  if (!user.nextRenewalAt || user.lifetimeAccess) return NaN;
  return Math.round((stamp(user.nextRenewalAt) - nowMs()) / DAY);
};

const dueSoon = (user: AdminUserRecord): boolean => {
  if (!paid(user) || user.lifetimeAccess) return false;
  const d = renewalDays(user);
  return !Number.isNaN(d) && d >= 0 && d <= 7;
};

const daysText = (n: number): string => (n === 1 ? '1 dia' : `${n} dias`);

function relativeAccess(user: AdminUserRecord): string {
  if (!user.lastActiveAt) return 'Nunca acessou';
  const d = Math.max(0, Math.floor((nowMs() - stamp(user.lastActiveAt)) / DAY));
  return d === 0 ? 'Hoje' : d === 1 ? 'Ontem' : `Há ${daysText(d)}`;
}

function tenure(user: AdminUserRecord): string {
  if (!user.subscriptionStartedAt) return '—';
  const currentTs = nowMs();
  const end = Math.min(
    currentTs,
    stamp(user.subscriptionEndedAt) || currentTs,
    user.billingStatus === 'overdue' && user.paidThrough
      ? stamp(user.paidThrough)
      : currentTs
  );
  const startMs = stamp(user.subscriptionStartedAt);
  if (Number.isNaN(startMs)) return '—';

  const days = Math.max(0, Math.floor((end - startMs) / DAY));
  const months = Math.floor(days / 30);
  const remDays = days % 30;

  return months > 0
    ? (months === 1 ? '1 mês' : `${months} meses`) +
        (remDays ? ` e ${daysText(remDays)}` : '')
    : daysText(days);
}

function status(user: AdminUserRecord): [css: string, label: string] {
  if (user.lifetimeAccess || user.billingStatus === 'lifetime') {
    return ['active', 'Vitalício · NEXUSELITE'];
  }
  if (user.billingStatus === 'none') return ['none', 'Sem assinatura'];
  if (user.billingStatus === 'active') {
    return user.couponApplied === 'FOCUS50'
      ? ['active', 'Ativa · FOCUS50']
      : ['active', 'Ativa'];
  }
  if (user.billingStatus === 'overdue') return ['overdue', 'Em atraso'];
  return ['canceled', 'Encerrada'];
}

const money = (cents: number): string =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);

const number = (n: number): string => new Intl.NumberFormat('pt-BR').format(n);

function aggregateTelemetry(rows: TelemetryItem[]) {
  const sum = (key: keyof TelemetryItem) =>
    rows.reduce((total, row) => total + row[key], 0);

  const calls = sum('geminiSuccess');
  const durationGemini = sum('geminiDurationMs');
  const webhooks = sum('webhookSuccess');
  const durationWebhook = sum('webhookDurationMs');

  return {
    input: sum('inputTokens'),
    output: sum('outputTokens'),
    calls,
    errors: sum('geminiErrors'),
    geminiMs: calls ? durationGemini / calls : null,
    webhooks,
    webhookErrors: sum('webhookErrors'),
    webhookMs: webhooks ? durationWebhook / webhooks : null,
  };
}

export default function PainelPage() {
  const { currentUser } = useAuth();
  const {
    loading,
    error,
    users,
    payments,
    totalUsers,
    activeUsersInWindow,
    subscriptions,
    revenue,
    refresh,
  } = useAdminMetrics();
  const {
    data: mpMetrics,
    loading: mpLoading,
    fromCache: mpFromCache,
    cacheAgeMinutes: mpCacheAgeMinutes,
    refresh: refreshMpMetrics,
  } = useMercadoPagoMetrics();

  // Estados principais da página reativa
  const [activeTab, setActiveTab] = useState<'users' | 'infra' | 'finance'>('users');
  const [activityWindow, setActivityWindow] = useState<number>(30);
  const [infraWindow, setInfraWindow] = useState<'today' | 'month'>('today');
  const [selectedUser, setSelectedUser] = useState<AdminUserRecord | null>(null);

  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (selectedUser) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [selectedUser]);

  const handleDialogClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      const r = dialogRef.current.getBoundingClientRect();
      if (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      ) {
        setSelectedUser(null);
      }
    }
  };

  const handleTabKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    current: 'users' | 'infra' | 'finance'
  ) => {
    const tabs: ('users' | 'infra' | 'finance')[] = ['users', 'infra', 'finance'];
    const index = tabs.indexOf(current);
    let nextIndex = index;

    if (e.key === 'ArrowRight') {
      nextIndex = (index + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (index + tabs.length - 1) % tabs.length;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = tabs.length - 1;
    } else {
      return;
    }

    e.preventDefault();
    const nextTab = tabs[nextIndex];
    setActiveTab(nextTab);
    const nextBtn = document.getElementById(`tab-${nextTab}`);
    nextBtn?.focus();
  };

  const currentMonthLabel = useMemo(() => {
    return new Intl.DateTimeFormat('pt-BR', {
      month: 'long',
      year: 'numeric',
      timeZone: 'America/Sao_Paulo',
    }).format(new Date());
  }, []);

  const formattedReferenceNow = useMemo(() => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    }).format(new Date());
  }, [users]);

  // --- CÁLCULOS REAIS DA ABA USUÁRIOS (useMemo) ---
  const usersSummary = useMemo(() => {
    const currentMonthPrefix = new Date().toISOString().slice(0, 7);
    const total = totalUsers;
    const subs = subscriptions.totalActive;
    const newCount = users.filter((u) => u.registeredAt.startsWith(currentMonthPrefix)).length;
    const activeCount = activeUsersInWindow(activityWindow);
    const subscriptionRatio =
      new Intl.NumberFormat('pt-BR', {
        style: 'percent',
        maximumFractionDigits: 0,
      }).format(total ? subs / total : 0) + ' da base com assinatura ativa';
    const renewalCount = users.filter(dueSoon).length;
    const overdue = subscriptions.overdueCount;
    const sortedUsers = users
      .slice()
      .sort((a, b) => stamp(b.registeredAt) - stamp(a.registeredAt));

    return {
      total,
      subs,
      newCount,
      activeCount,
      subscriptionRatio,
      renewalCount,
      overdue,
      sortedUsers,
    };
  }, [users, totalUsers, subscriptions, activityWindow, activeUsersInWindow]);

  // --- CÁLCULOS DA ABA INFRAESTRUTURA (useMemo) ---
  const infraSummary = useMemo(() => {
    const today = aggregateTelemetry(telemetry.slice(-1));
    const month = aggregateTelemetry(telemetry);
    const monthly = infraWindow === 'month';
    const view = monthly ? month : today;
    const scope = monthly ? `Acumulado · ${currentMonthLabel}` : 'Hoje · Tempo real';

    const week = telemetry.slice(-7);
    const max = Math.max(1, ...week.map((row) => row.inputTokens + row.outputTokens));
    const tokensWeek = number(
      week.reduce((sum, row) => sum + row.inputTokens + row.outputTokens, 0)
    );

    return {
      today,
      month,
      view,
      scope,
      week,
      max,
      tokensWeek,
    };
  }, [infraWindow, currentMonthLabel]);

  // --- CÁLCULOS REAIS DA ABA FINANCEIRO (Single Source of Truth: Mercado Pago API + Cache 4h) ---
  const financeData = useMemo(() => {
    const active = users.filter(paid);
    const monthlyCents = mpMetrics ? mpMetrics.mrr.totalCents : revenue.mrrCents;
    const received = mpMetrics
      ? Math.round(mpMetrics.paymentsSummary.grossApprovedAmount30d * 100)
      : revenue.receivedMonthCents;
    const overdue = subscriptions.overdueCount * 1990;
    const expected = monthlyCents;
    const potential = received + expected + overdue;

    const nexusEliteCount = mpMetrics
      ? mpMetrics.oneTimeAdhesions.nexusEliteCount
      : subscriptions.nexusEliteCount;
    const focus50Count = mpMetrics
      ? mpMetrics.mrr.focus50Count
      : subscriptions.focus50Count;
    const fullCount = mpMetrics
      ? mpMetrics.mrr.fullAccessCount
      : subscriptions.fullPriceCount;

    const discountedRevenue = mpMetrics
      ? Math.round(mpMetrics.mrr.focus50Mrr * 100)
      : revenue.focus50MrrCents;
    const fullPriceRevenue = mpMetrics
      ? Math.round(mpMetrics.mrr.fullAccessMrr * 100)
      : revenue.fullPriceMrrCents;
    const nexusEliteOneTimeCents = mpMetrics
      ? mpMetrics.oneTimeAdhesions.nexusEliteTotalCents
      : revenue.nexusEliteOneTimeCents;

    const arpu = mpMetrics
      ? Math.round(mpMetrics.mrr.arpu * 100)
      : revenue.arpuCents;
    const discountValue = focus50Count * 995;

    const sortedBilling = active
      .filter((u) => u.nextRenewalAt && !u.lifetimeAccess)
      .sort((a, b) => stamp(a.nextRenewalAt) - stamp(b.nextRenewalAt));

    return {
      active,
      monthlyCents,
      confirmedCount: mpMetrics ? mpMetrics.paymentsSummary.approvedCount30d : payments.length,
      received,
      overdue,
      expected,
      nexusEliteCount,
      focus50Count,
      fullCount,
      discountedRevenue,
      fullPriceRevenue,
      nexusEliteOneTimeCents,
      potential,
      arpu,
      discountValue,
      sortedBilling,
      mpFromCache,
      mpCacheAgeMinutes,
      mpLoading,
      refreshMpMetrics,
    };
  }, [
    users,
    payments,
    subscriptions,
    revenue,
    mpMetrics,
    mpFromCache,
    mpCacheAgeMinutes,
    mpLoading,
    refreshMpMetrics,
  ]);

  return (
    <>
      <header>
        <div className="header-inner">
          <div className="brand">
            <div className="mark" aria-hidden="true">
              <svg width="40" height="40" viewBox="0 0 40 40">
                <defs>
                  <linearGradient id="nexus-layer" x1="0" y1="0" x2="1" y2="1">
                    <stop stopColor="#fff" />
                    <stop offset="1" stopColor="#c6d8ee" />
                  </linearGradient>
                </defs>
                <path d="m7 25 13-7 13 7v3l-13 7-13-7Z" fill="#91a9c3" />
                <path d="m7 23 13-7 13 7-13 7Z" fill="#e7f0fb" />
                <path d="m7 18 13-7 13 7v3l-13 7-13-7Z" fill="#afc4dc" />
                <path d="m7 16 13-7 13 7-13 7Z" fill="url(#nexus-layer)" />
                <path d="m7 12 13-7 13 7-13 7Z" fill="#fff" />
              </svg>
            </div>
            <strong>
              NEXUS<span>FOCUS</span>
            </strong>
          </div>
          <div className="header-right">
            <span>Painel administrativo · Produção (Firestore)</span>
            <button
              type="button"
              onClick={() => void refresh()}
              style={{
                background: 'transparent',
                border: '1px solid rgba(145, 169, 195, 0.35)',
                color: 'inherit',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              {loading ? 'Sincronizando...' : 'Atualizar'}
            </button>
            <div
              className="avatar"
              title={currentUser?.email || 'Phillipe · Administrador'}
              aria-label={currentUser?.email || 'Phillipe, administrador'}
            >
              {currentUser?.email ? currentUser.email.substring(0, 2).toUpperCase() : 'P'}
            </div>
          </div>
        </div>
      </header>

      <main className="workspace">
        <div className="title-row">
          <div>
            <p className="eyebrow">VISÃO DO NEGÓCIO (PRODUÇÃO)</p>
            <h1>Seu negócio, em foco.</h1>
            <p className="subtitle">
              Usuários reais, assinaturas ativas e faturamento conectados ao Cloud Firestore.
            </p>
          </div>
          <div className="date">
            Sincronizado em: <strong>{formattedReferenceNow}</strong>
          </div>
        </div>

        {error && (
          <div className="demo" role="alert">
            <strong>Erro de leitura no Firestore</strong>
            <span className="divider">|</span>
            <span>{error}</span>
          </div>
        )}

        <nav className="tabs" role="tablist" aria-label="Áreas do painel">
          <button
            type="button"
            className="tab"
            role="tab"
            id="tab-users"
            aria-controls="panel-users"
            aria-selected={activeTab === 'users'}
            tabIndex={activeTab === 'users' ? 0 : -1}
            data-tab="users"
            onClick={() => setActiveTab('users')}
            onKeyDown={(e) => handleTabKeyDown(e, 'users')}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              aria-hidden="true"
            >
              <circle cx="9" cy="8" r="3" />
              <path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 4v3" />
            </svg>
            Usuários
          </button>

          <button
            type="button"
            className="tab"
            role="tab"
            id="tab-infra"
            aria-controls="panel-infra"
            aria-selected={activeTab === 'infra'}
            tabIndex={activeTab === 'infra' ? 0 : -1}
            data-tab="infra"
            onClick={() => setActiveTab('infra')}
            onKeyDown={(e) => handleTabKeyDown(e, 'infra')}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="7" rx="2" />
              <rect x="3" y="14" width="18" height="7" rx="2" />
              <path d="M6 6h2m-2 11h2m4-7v4" />
            </svg>
            Infraestrutura
          </button>

          <button
            type="button"
            className="tab"
            role="tab"
            id="tab-finance"
            aria-controls="panel-finance"
            aria-selected={activeTab === 'finance'}
            tabIndex={activeTab === 'finance' ? 0 : -1}
            data-tab="finance"
            onClick={() => setActiveTab('finance')}
            onKeyDown={(e) => handleTabKeyDown(e, 'finance')}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              aria-hidden="true"
            >
              <rect x="3" y="5" width="18" height="15" rx="2" />
              <path d="M3 10h18m-9 3v4m3-4v4m3-4v4" />
            </svg>
            Financeiro
          </button>
        </nav>

        {/* ================= PAINEL 1: USUÁRIOS ================= */}
        <div
          className="tab-panel"
          role="tabpanel"
          id="panel-users"
          aria-labelledby="tab-users"
          tabIndex={0}
          hidden={activeTab !== 'users'}
        >
          <section className="cards" aria-label="Resumo de usuários">
            <article className="card primary">
              <div className="card-top">
                Usuários cadastrados
                <svg
                  className="card-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  aria-hidden="true"
                >
                  <circle cx="9" cy="8" r="3" />
                  <path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 4v2" />
                </svg>
              </div>
              <div className="metric" id="total">
                {usersSummary.total}
              </div>
              <p>Total real da base (Firestore)</p>
              <div className="card-bottom" id="new-count">
                {usersSummary.newCount} cadastros no mês atual
              </div>
            </article>

            <article className="card">
              <div className="card-top">
                Ativos no app
                <svg
                  className="card-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  aria-hidden="true"
                >
                  <path d="M2 12h4l3-7 5 14 3-7h5" />
                </svg>
              </div>
              <div className="metric" id="active-count">
                {usersSummary.activeCount}
              </div>
              <p id="active-description">Com acesso nos últimos {activityWindow} dias</p>
              <div className="activity-control">
                <label htmlFor="activity-window">Período</label>
                <select
                  id="activity-window"
                  value={activityWindow}
                  onChange={(e) => setActivityWindow(Number(e.target.value))}
                >
                  <option value={7}>7 dias</option>
                  <option value={30}>30 dias</option>
                  <option value={90}>90 dias</option>
                </select>
              </div>
            </article>

            <article className="card">
              <div className="card-top">
                Assinaturas ativas
                <svg
                  className="card-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  aria-hidden="true"
                >
                  <rect x="3" y="4" width="18" height="16" rx="3" />
                  <path d="M3 9h18m-12 5 2 2 4-4" />
                </svg>
              </div>
              <div className="metric" id="subscription-count">
                {usersSummary.subs}
              </div>
              <p>
                {subscriptions.nexusEliteCount} NEXUSELITE · {subscriptions.focus50Count} FOCUS50 ·{' '}
                {subscriptions.fullPriceCount} Padrão
              </p>
              <div className="card-bottom" id="subscription-ratio">
                {usersSummary.subscriptionRatio}
              </div>
            </article>

            <article className="card">
              <div className="card-top">
                Próximas renovações
                <svg
                  className="card-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  aria-hidden="true"
                >
                  <rect x="3" y="5" width="18" height="16" rx="3" />
                  <path d="M7 2v6m10-6V2M3 11h18m-12 4h3m3 0h3" />
                </svg>
              </div>
              <div className="metric" id="renewal-count">
                {usersSummary.renewalCount}
              </div>
              <p>Hoje e nos próximos 7 dias</p>
              <div className="card-bottom" id="overdue-count">
                {usersSummary.overdue === 1
                  ? '1 assinatura em atraso'
                  : `${usersSummary.overdue} assinaturas em atraso`}
              </div>
            </article>
          </section>

          <section className="section" aria-labelledby="users-title">
            <div className="section-head">
              <div>
                <h2 id="users-title">Usuários e assinaturas (Produção)</h2>
                <p>Dados sincronizados em tempo real da coleção `users` do Firestore.</p>
              </div>
              <span className="count-label" id="table-count">
                {usersSummary.total} usuários
              </span>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Usuário</th>
                    <th scope="col">Cadastro</th>
                    <th scope="col">Último acesso</th>
                    <th scope="col">Assinatura</th>
                    <th scope="col">Próxima renovação</th>
                    <th scope="col">Tempo de assinatura</th>
                    <th scope="col">
                      <span aria-label="Detalhes">&nbsp;</span>
                    </th>
                  </tr>
                </thead>
                <tbody id="users">
                  {usersSummary.sortedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="empty">
                        {loading ? 'Carregando usuários do Firestore...' : 'Nenhum usuário cadastrado.'}
                      </td>
                    </tr>
                  ) : (
                    usersSummary.sortedUsers.map((user) => {
                      const userActive = isActive(user, activityWindow);
                      const initials = user.name
                        .split(' ')
                        .map((p) => p[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase();
                      const [badgeClass, badgeLabel] = status(user);

                      return (
                        <tr key={user.id}>
                          <td>
                            <div className="person">
                              <div className="person-avatar" aria-hidden="true">
                                {initials || 'U'}
                              </div>
                              <div>
                                <span className="person-name">{user.name}</span>
                                <span className="secondary">{user.email}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="mobile-label">Cadastro</span>
                            {date(user.registeredAt)}
                          </td>
                          <td>
                            <span className="mobile-label">Último acesso</span>
                            {date(user.lastActiveAt)}
                            <span className={`secondary access ${userActive ? '' : 'inactive'}`}>
                              {userActive ? 'Ativo no período' : 'Sem acesso no período'}
                            </span>
                          </td>
                          <td>
                            <span className="mobile-label">Assinatura</span>
                            <span className={`badge ${badgeClass}`}>{badgeLabel}</span>
                          </td>
                          <td>
                            <span className="mobile-label">Próxima renovação</span>
                            {user.lifetimeAccess ? 'Vitalício (Isento)' : date(user.nextRenewalAt)}
                            {dueSoon(user) && (
                              <div className="due">
                                {renewalDays(user) === 0
                                  ? 'Hoje'
                                  : `Em ${daysText(renewalDays(user))}`}
                              </div>
                            )}
                          </td>
                          <td>
                            <span className="mobile-label">Tempo de assinatura</span>
                            {tenure(user)}
                            {user.subscriptionEndedAt ? (
                              <span className="secondary">Até o encerramento</span>
                            ) : user.billingStatus === 'overdue' ? (
                              <span className="secondary">Até o fim do período pago</span>
                            ) : null}
                          </td>
                          <td>
                            <button
                              type="button"
                              className="details-button"
                              data-user={user.id}
                              onClick={() => setSelectedUser(user)}
                              aria-label={`Ver detalhes de ${user.name}`}
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                aria-hidden="true"
                              >
                                <path d="m9 5 7 7-7 7" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="table-footer">
              <span id="shown-count" aria-live="polite">
                Exibindo {usersSummary.total} de {usersSummary.total} usuários reais
              </span>
              <div className="legend">
                <span>
                  <i />
                  Ativo no período
                </span>
                <span>
                  <i className="gray" />
                  Sem acesso no período
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* ================= PAINEL 2: INFRAESTRUTURA ================= */}
        <div
          className="tab-panel"
          role="tabpanel"
          id="panel-infra"
          aria-labelledby="tab-infra"
          tabIndex={0}
          hidden={activeTab !== 'infra'}
        >
          <div className="panel-heading">
            <div>
              <h2>Operação do sistema</h2>
              <p>Render, Firebase, Gemini e webhooks de produção.</p>
            </div>
            <label className="scope-label" htmlFor="infra-window">
              Consumo e respostas
              <select
                id="infra-window"
                value={infraWindow}
                onChange={(e) => setInfraWindow(e.target.value as 'today' | 'month')}
              >
                <option value="today">Hoje</option>
                <option value="month">Mês atual</option>
              </select>
            </label>
          </div>

          <section className="cards" aria-label="Indicadores da infraestrutura">
            <article className="card primary">
              <div className="card-top">
                Tokens hoje <span className="tag"> Tempo real</span>
              </div>
              <div className="metric" id="tokens-today">
                {number(infraSummary.today.input + infraSummary.today.output)}
              </div>
              <p>Entrada + saída do Gemini</p>
              <div className="card-bottom" id="requests-today">
                {number(infraSummary.today.calls + infraSummary.today.errors)} chamadas no dia
              </div>
            </article>

            <article className="card">
              <div className="card-top">Tokens no mês</div>
              <div className="metric" id="tokens-month">
                {number(infraSummary.month.input + infraSummary.month.output)}
              </div>
              <p>Acumulado mensal</p>
              <div className="card-bottom" id="requests-month">
                {number(infraSummary.month.calls + infraSummary.month.errors)} chamadas no mês
              </div>
            </article>

            <article className="card">
              <div className="card-top">Resposta do Gemini</div>
              <div className="metric latency" id="gemini-latency">
                {infraSummary.view.geminiMs === null
                  ? '—'
                  : (infraSummary.view.geminiMs / 1000).toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }) + ' s'}
              </div>
              <p>Tempo médio por chamada</p>
              <div className="card-bottom" id="gemini-scope">
                {infraSummary.scope}
              </div>
            </article>

            <article className="card">
              <div className="card-top">Processamento de webhook</div>
              <div className="metric latency" id="webhook-latency">
                {infraSummary.view.webhookMs === null
                  ? '—'
                  : `${Math.round(infraSummary.view.webhookMs)} ms`}
              </div>
              <p>Recebimento até conclusão</p>
              <div className="card-bottom" id="webhook-scope">
                {infraSummary.scope}
              </div>
            </article>
          </section>
        </div>

        {/* ================= PAINEL 3: FINANCEIRO ================= */}
        <div
          className="tab-panel"
          role="tabpanel"
          id="panel-finance"
          aria-labelledby="tab-finance"
          tabIndex={0}
          hidden={activeTab !== 'finance'}
        >
          <div className="panel-heading">
            <div>
              <h2>Saúde financeira (Produção)</h2>
              <p>Métricas reais consolidadas do Firestore ({currentMonthLabel}).</p>
            </div>
            <span className="count-label">Assinaturas & Cupons</span>
          </div>

          <section className="cards" aria-label="Resumo financeiro">
            <article className="card primary">
              <div className="card-top">Receita mensal recorrente (MRR)</div>
              <div className="metric money" id="mrr">
                {money(financeData.monthlyCents)}
              </div>
              <p>Valor mensal das assinaturas recorrentes ativas</p>
              <div className="card-bottom">Descontos FOCUS50 e isenções NEXUSELITE aplicados</div>
            </article>

            <article className="card">
              <div className="card-top">Recebido no mês</div>
              <div className="metric money" id="received">
                {money(financeData.received)}
              </div>
              <p>Pagamentos confirmados no Firestore</p>
              <div className="card-bottom" id="payments-count">
                {financeData.confirmedCount} pagamentos registrados
              </div>
            </article>

            <article className="card">
              <div className="card-top">Ticket médio recorrente (ARPU)</div>
              <div className="metric money" id="arpu">
                {money(financeData.arpu)}
              </div>
              <p>MRR ÷ assinantes pagantes recorrentes</p>
              <div className="card-bottom" id="paying-count">
                {financeData.active.length} assinantes ativos totais
              </div>
            </article>

            <article className="card">
              <div className="card-top">Em atraso</div>
              <div className="metric money" id="overdue-money">
                {money(financeData.overdue)}
              </div>
              <p>Cobranças vencidas e não pagas</p>
              <div className="card-bottom">Não incluídas na receita recebida</div>
            </article>
          </section>

          <div className="split">
            <section className="section">
              <div className="section-head">
                <div>
                  <h2>Entradas do mês</h2>
                  <p>Recebido, previsto e pendente de pagamento.</p>
                </div>
              </div>
              <div className="plain-body">
                <div className="revenue-line">
                  <span>Já recebido</span>
                  <strong id="revenue-paid">{money(financeData.received)}</strong>
                </div>
                <div className="revenue-progress">
                  <span
                    id="bar-paid"
                    style={{
                      width: financeData.potential
                        ? `${(financeData.received / financeData.potential) * 100}%`
                        : '0%',
                    }}
                  />
                </div>

                <div className="revenue-line">
                  <span>MRR recorrente ativo</span>
                  <strong id="revenue-expected">{money(financeData.expected)}</strong>
                </div>
                <div className="revenue-progress">
                  <span
                    id="bar-expected"
                    style={{
                      width: financeData.potential
                        ? `${(financeData.expected / financeData.potential) * 100}%`
                        : '0%',
                    }}
                  />
                </div>

                <div className="revenue-line">
                  <span>Em atraso</span>
                  <strong id="revenue-late">{money(financeData.overdue)}</strong>
                </div>
                <div className="revenue-progress orange">
                  <span
                    id="bar-late"
                    style={{
                      width: financeData.potential
                        ? `${(financeData.overdue / financeData.potential) * 100}%`
                        : '0%',
                    }}
                  />
                </div>

                <div className="finance-total">
                  <span>Potencial consolidado no ciclo</span>
                  <strong id="revenue-potential">{money(financeData.potential)}</strong>
                </div>
              </div>
            </section>

            <section className="section">
              <div className="section-head">
                <div>
                  <h2>Composição das assinaturas por cupom</h2>
                  <p>Distribuição real entre Plano Padrão, FOCUS50 e NEXUSELITE.</p>
                </div>
              </div>
              <div className="plain-body">
                <div className="plan-row">
                  <div>
                    <p>Plano Full Access (Padrão)</p>
                    <span id="full-price-count">
                      {financeData.fullCount} assinantes × R$ 19,90/mês
                    </span>
                  </div>
                  <strong id="full-price-revenue">{money(financeData.fullPriceRevenue)}</strong>
                </div>

                <div className="plan-row">
                  <div>
                    <p>Cupom FOCUS50 (50% OFF · 3 ciclos)</p>
                    <span id="discount-count">
                      {financeData.focus50Count} assinantes × R$ 9,95/mês
                    </span>
                  </div>
                  <strong id="discount-revenue">{money(financeData.discountedRevenue)}</strong>
                </div>

                <div className="plan-row">
                  <div>
                    <p>Cupom NEXUSELITE (Vitalício · Taxa única R$ 1,00)</p>
                    <span id="elite-count">
                      {financeData.nexusEliteCount} membros vitalícios (R$ 0,00/mês recorrência)
                    </span>
                  </div>
                  <strong id="elite-revenue">{money(financeData.nexusEliteOneTimeCents)}</strong>
                </div>

                <div className="plan-row">
                  <div>
                    <p>Descontos promocionais ativos (FOCUS50)</p>
                    <span>Redução mensal em relação ao preço cheio</span>
                  </div>
                  <strong id="discount-value">{money(financeData.discountValue)}</strong>
                </div>

                <p className="notice-inline">
                  O plano Full Access custa R$ 19,90/mês. O cupom FOCUS50 aplica R$ 9,95/mês nos 3
                  primeiros ciclos com atualização automática para R$ 19,90/mês a partir do 4º mês. O
                  cupom NEXUSELITE concede acesso vitalício com taxa única de R$ 1,00.
                </p>
              </div>
            </section>
          </div>

          <section className="section">
            <div className="section-head">
              <div>
                <h2>Próximas cobranças recorrentes</h2>
                <p>Assinaturas ativas com renovação programada.</p>
              </div>
              <span className="count-label" id="next-billing-total">
                {financeData.sortedBilling.length} cobranças previstas
              </span>
            </div>

            <div className="table-wrap">
              <table className="revenue-table">
                <thead>
                  <tr>
                    <th scope="col">Assinante</th>
                    <th scope="col">Renovação</th>
                    <th scope="col">Valor previsto</th>
                    <th scope="col">Condição da próxima cobrança</th>
                  </tr>
                </thead>
                <tbody id="billing-rows">
                  {financeData.sortedBilling.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="empty">
                        Nenhuma cobrança recorrente pendente no momento.
                      </td>
                    </tr>
                  ) : (
                    financeData.sortedBilling.map((u) => {
                      return (
                        <tr key={u.id}>
                          <td>
                            <span className="person-name">{u.name}</span>
                            <span className="secondary">{u.email}</span>
                          </td>
                          <td>
                            <span className="mobile-label">Renovação</span>
                            {date(u.nextRenewalAt)}
                          </td>
                          <td>
                            <span className="mobile-label">Valor previsto</span>
                            <strong>{money(u.monthlyCents)}</strong>
                          </td>
                          <td>
                            <span className="mobile-label">Condição</span>
                            {u.couponApplied === 'FOCUS50' && u.monthlyCents < 1990 ? (
                              <>
                                <span className="badge none">FOCUS50 · 50% OFF</span>
                                <span className="secondary">
                                  Preço cheio a partir de {date(u.discountUntil)}
                                </span>
                              </>
                            ) : (
                              <span className="badge canceled">Mensal · preço cheio</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <footer className="bottom">
          <span>Nexus Focus · Administração</span>
          <span>Conectado ao Cloud Firestore (Produção)</span>
        </footer>
      </main>

      {/* MODAL / DIALOG DE DETALHES DO USUÁRIO */}
      <dialog
        id="user-dialog"
        ref={dialogRef}
        aria-labelledby="detail-name"
        onClick={handleDialogClick}
        onClose={() => setSelectedUser(null)}
      >
        {selectedUser && (
          <>
            <div className="dialog-head">
              <div>
                <p className="eyebrow">DETALHES DO USUÁRIO</p>
                <h2 id="detail-name">{selectedUser.name}</h2>
                <p id="detail-email">{selectedUser.email}</p>
              </div>
              <button
                className="close"
                type="button"
                aria-label="Fechar detalhes"
                onClick={() => setSelectedUser(null)}
              >
                ×
              </button>
            </div>

            <div className="dialog-body" id="detail-body">
              {(() => {
                const [badgeClass, badgeLabel] = status(selectedUser);
                const fields: [string, string][] = [
                  ['UID / ID', selectedUser.id],
                  ['Data do cadastro', date(selectedUser.registeredAt)],
                  [
                    'Último acesso',
                    `${date(selectedUser.lastActiveAt)} · ${relativeAccess(selectedUser)}`,
                  ],
                  ['Assinante desde', date(selectedUser.subscriptionStartedAt)],
                  ['Tempo de assinatura', tenure(selectedUser)],
                  [
                    'Próxima renovação',
                    selectedUser.lifetimeAccess
                      ? 'Vitalício (Isento)'
                      : date(selectedUser.nextRenewalAt),
                  ],
                  ['Cupom aplicado', selectedUser.couponApplied || 'Nenhum'],
                ];

                return (
                  <>
                    <span className={`badge ${badgeClass}`}>{badgeLabel}</span>
                    <dl>
                      {fields.map(([k, v]) => (
                        <div key={k}>
                          <dt>{k}</dt>
                          <dd>{v}</dd>
                        </div>
                      ))}
                    </dl>
                  </>
                );
              })()}
            </div>
          </>
        )}
      </dialog>
    </>
  );
}
