'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import './painel.css';
import {
  AS_OF,
  DAY,
  demoUsers,
  demoPrices,
  demoPayments,
  demoUnpaidInvoices,
  telemetry,
  DemoUser,
  TelemetryItem
} from './mockData';

// Funções utilitárias de data e formatação
const stamp = (value: string | null | undefined): number =>
  value ? Date.parse(value + 'T15:00:00Z') : NaN;

const date = (value: string | null | undefined): string =>
  value
    ? new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo'
      }).format(stamp(value))
    : '—';

const paid = (user: DemoUser): boolean =>
  stamp(user.paidThrough) > AS_OF &&
  (!user.subscriptionEndedAt || stamp(user.subscriptionEndedAt) > AS_OF);

const isActive = (user: DemoUser, days: number): boolean =>
  stamp(user.lastActiveAt) <= AS_OF &&
  stamp(user.lastActiveAt) >= AS_OF - days * DAY;

const renewalDays = (user: DemoUser): number =>
  Math.round((stamp(user.nextRenewalAt) - AS_OF) / DAY);

const dueSoon = (user: DemoUser): boolean =>
  paid(user) && renewalDays(user) >= 0 && renewalDays(user) <= 7;

const daysText = (n: number): string => (n === 1 ? '1 dia' : `${n} dias`);

function relativeAccess(user: DemoUser): string {
  if (!user.lastActiveAt) return 'Nunca acessou';
  const d = Math.floor((AS_OF - stamp(user.lastActiveAt)) / DAY);
  return d === 0 ? 'Hoje' : d === 1 ? 'Ontem' : `Há ${daysText(d)}`;
}

function tenure(user: DemoUser): string {
  if (!user.subscriptionStartedAt) return '—';
  const end = Math.min(
    AS_OF,
    stamp(user.subscriptionEndedAt) || AS_OF,
    user.billingStatus === 'overdue' ? stamp(user.paidThrough) : AS_OF
  );
  const start = new Date(stamp(user.subscriptionStartedAt));
  const finish = new Date(end);
  let months =
    (finish.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    finish.getUTCMonth() -
    start.getUTCMonth();

  const anchorFor = (m: number) => {
    const d = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + m, 1, 15)
    );
    const max = new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)
    ).getUTCDate();
    d.setUTCDate(Math.min(start.getUTCDate(), max));
    return d.getTime();
  };

  if (anchorFor(months) > end) months--;
  months = Math.max(0, months);
  const days = Math.max(0, Math.floor((end - anchorFor(months)) / DAY));
  return months
    ? (months === 1 ? '1 mês' : `${months} meses`) +
        (days ? ` e ${daysText(days)}` : '')
    : daysText(days);
}

function status(user: DemoUser): [css: string, label: string] {
  if (user.billingStatus === 'none') return ['none', 'Sem assinatura'];
  if (paid(user)) return ['active', 'Ativa'];
  if (user.billingStatus === 'overdue') return ['overdue', 'Em atraso'];
  return ['canceled', 'Encerrada'];
}

const priceAt = (user: DemoUser, at: number): number => {
  const plan = demoPrices[user.id] || {
    monthlyCents: 1990,
    discountUntil: null
  };
  return plan.discountUntil && at < stamp(plan.discountUntil)
    ? Math.round(plan.monthlyCents / 2)
    : plan.monthlyCents;
};

const money = (cents: number): string =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
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
    webhookMs: webhooks ? durationWebhook / webhooks : null
  };
}

export default function PainelPage() {
  // Estados principais da página reativa
  const [activeTab, setActiveTab] = useState<'users' | 'infra' | 'finance'>('users');
  const [activityWindow, setActivityWindow] = useState<number>(30);
  const [infraWindow, setInfraWindow] = useState<'today' | 'month'>('today');
  const [selectedUser, setSelectedUser] = useState<DemoUser | null>(null);

  const dialogRef = useRef<HTMLDialogElement>(null);

  // Sincroniza o modal com o estado selectedUser
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

  // Navegação por teclado nas abas
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

  // --- CÁLCULOS DA ABA USUÁRIOS (useMemo) ---
  const usersSummary = useMemo(() => {
    const total = demoUsers.length;
    const subs = demoUsers.filter(paid).length;
    const newCount = demoUsers.filter(
      (u) => stamp(u.registeredAt) >= stamp('2026-09-01') && stamp(u.registeredAt) <= AS_OF
    ).length;
    const activeCount = demoUsers.filter((u) => isActive(u, activityWindow)).length;
    const subscriptionRatio =
      new Intl.NumberFormat('pt-BR', {
        style: 'percent',
        maximumFractionDigits: 0
      }).format(total ? subs / total : 0) + ' da base com assinatura ativa';
    const renewalCount = demoUsers.filter(dueSoon).length;
    const overdue = demoUsers.filter((u) => u.billingStatus === 'overdue' && !paid(u)).length;
    const sortedUsers = demoUsers
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
      sortedUsers
    };
  }, [activityWindow]);

  // --- CÁLCULOS DA ABA INFRAESTRUTURA (useMemo) ---
  const infraSummary = useMemo(() => {
    const today = aggregateTelemetry(telemetry.slice(-1));
    const month = aggregateTelemetry(telemetry);
    const monthly = infraWindow === 'month';
    const view = monthly ? month : today;
    const scope = monthly ? '1 a 21 de setembro' : 'Hoje · 21 de setembro';

    const week = telemetry.slice(-7);
    const max = Math.max(...week.map((row) => row.inputTokens + row.outputTokens));
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
      tokensWeek
    };
  }, [infraWindow]);

  // --- CÁLCULOS DA ABA FINANCEIRO (useMemo) ---
  const financeData = useMemo(() => {
    const active = demoUsers.filter(paid);
    const monthlyCents = active.reduce((sum, u) => sum + priceAt(u, AS_OF), 0);
    const confirmed = demoPayments.filter(
      (p) =>
        p.status === 'paid' &&
        stamp(p.paidAt) >= stamp('2026-09-01') &&
        stamp(p.paidAt) <= AS_OF
    );
    const received = confirmed.reduce((sum, p) => sum + p.amountCents, 0);
    const invoices = demoUnpaidInvoices.filter(
      (p) => p.status === 'overdue' && stamp(p.dueAt) < AS_OF
    );
    const overdue = invoices.reduce((sum, p) => sum + p.amountCents, 0);
    const upcoming = active.filter(
      (u) => stamp(u.nextRenewalAt) >= AS_OF && stamp(u.nextRenewalAt) < stamp('2026-10-01')
    );
    const expected = upcoming.reduce((sum, u) => sum + priceAt(u, stamp(u.nextRenewalAt)), 0);
    const discounted = active.filter((u) => priceAt(u, AS_OF) < 1990);

    const fullCount = active.length - discounted.length;
    const discountedRevenue = discounted.reduce((sum, u) => sum + priceAt(u, AS_OF), 0);
    const potential = received + expected + overdue;
    const arpu = active.length ? Math.round(monthlyCents / active.length) : 0;
    const discountValue = active.length * 1990 - monthlyCents;

    const sortedBilling = active
      .filter((u) => u.nextRenewalAt)
      .sort((a, b) => stamp(a.nextRenewalAt) - stamp(b.nextRenewalAt));

    return {
      active,
      monthlyCents,
      confirmed,
      received,
      overdue,
      expected,
      discounted,
      fullCount,
      discountedRevenue,
      potential,
      arpu,
      discountValue,
      sortedBilling
    };
  }, []);

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
            <span>Painel administrativo</span>
            <div
              className="avatar"
              title="Phillipe · Administrador"
              aria-label="Phillipe, administrador"
            >
              P
            </div>
          </div>
        </div>
      </header>

      <main className="workspace">
        <div className="title-row">
          <div>
            <p className="eyebrow">VISÃO DO NEGÓCIO</p>
            <h1>Seu negócio, em foco.</h1>
            <p className="subtitle">Usuários, operação e faturamento em um só lugar.</p>
          </div>
          <div className="date">
            Referência: <strong>21 set. 2026 · 12h</strong>
          </div>
        </div>

        <div className="demo" role="note">
          <strong>Modo demonstração</strong>
          <span className="divider">|</span>
          <span>Dados fictícios para visualizar o painel. Sem conexão com a base real.</span>
        </div>

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
              <p>Total da base</p>
              <div className="card-bottom" id="new-count">
                {usersSummary.newCount} cadastros em setembro
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
              <p>Com período pago vigente</p>
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
                <h2 id="users-title">Usuários e assinaturas</h2>
                <p>Cadastros mais recentes primeiro.</p>
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
                        Nenhum usuário cadastrado.
                      </td>
                    </tr>
                  ) : (
                    usersSummary.sortedUsers.map((user) => {
                      const userActive = isActive(user, activityWindow);
                      const initials = user.name
                        .split(' ')
                        .map((p) => p[0])
                        .slice(0, 2)
                        .join('');
                      const [badgeClass, badgeLabel] = status(user);

                      return (
                        <tr key={user.id}>
                          <td>
                            <div className="person">
                              <div className="person-avatar" aria-hidden="true">
                                {initials}
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
                            {date(user.nextRenewalAt)}
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
                Exibindo {usersSummary.total} de {usersSummary.total} usuários
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

          <div className="notes">
            <p>
              <strong>Como contamos os ativos?</strong> Usuários com pelo menos um acesso no
              período selecionado. Uma assinatura ativa não significa uso recente do app.
            </p>
            <p>
              <strong>Como contamos o tempo?</strong> Desde o início da assinatura atual. Para
              assinaturas encerradas, contamos até o fim do período contratado, sem incluir pausas
              anteriores.
            </p>
          </div>
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
              <p>Render, Firebase, Gemini e webhooks · métricas simuladas.</p>
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
                Tokens hoje <span className="tag">21 set.</span>
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
              <p>De 1 a 21 de setembro</p>
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
                      maximumFractionDigits: 2
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

          <div className="infra-grid">
            <article className="infra-card">
              <div className="infra-top">
                <div className="infra-brand">
                  <div className="service-icon">R</div>
                  <div>
                    <h2>Render</h2>
                    <p>Backend · API principal</p>
                  </div>
                </div>
                <span className="badge active">Operacional · exemplo</span>
              </div>
              <div className="resource-grid">
                <div>
                  <span className="resource-label">CPU utilizada</span>
                  <div className="resource-value">
                    32<span className="resource-unit">%</span>
                  </div>
                  <div
                    className="meter"
                    role="meter"
                    aria-label="CPU utilizada, simulada"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={32}
                  >
                    <span style={{ width: '32%' }} />
                  </div>
                </div>
                <div>
                  <span className="resource-label">Memória</span>
                  <div className="resource-value">
                    218 <span className="resource-unit">/ 512 MB</span>
                  </div>
                  <div
                    className="meter"
                    role="meter"
                    aria-label="Memória utilizada, simulada"
                    aria-valuemin={0}
                    aria-valuemax={512}
                    aria-valuenow={218}
                  >
                    <span style={{ width: '42.58%' }} />
                  </div>
                </div>
                <div>
                  <span className="resource-label">Disponibilidade hoje</span>
                  <div className="resource-value">
                    99,9<span className="resource-unit">%</span>
                  </div>
                </div>
                <div>
                  <span className="resource-label">Resposta da API hoje</span>
                  <div className="resource-value">
                    184 <span className="resource-unit">ms</span>
                  </div>
                </div>
              </div>
              <div className="resource-foot">
                Última amostra simulada: 21/09/2026, 12:00 · horário de Brasília.
              </div>
            </article>

            <article className="infra-card">
              <div className="infra-top">
                <div className="infra-brand">
                  <div className="service-icon fire">F</div>
                  <div>
                    <h2>Firebase</h2>
                    <p>Frontend · Hosting e autenticação</p>
                  </div>
                </div>
                <span className="badge active">Operacional · exemplo</span>
              </div>
              <div className="resource-grid">
                <div>
                  <span className="resource-label">Transferência no mês</span>
                  <div className="resource-value">
                    1,24 <span className="resource-unit">GB</span>
                  </div>
                </div>
                <div>
                  <span className="resource-label">Armazenamento do site</span>
                  <div className="resource-value">
                    48 <span className="resource-unit">MB</span>
                  </div>
                </div>
                <div>
                  <span className="resource-label">Erros de login hoje</span>
                  <div className="resource-value">2</div>
                </div>
                <div>
                  <span className="resource-label">Resposta do site hoje</span>
                  <div className="resource-value">
                    96 <span className="resource-unit">ms</span>
                  </div>
                </div>
              </div>
              <div className="resource-foot">
                Hosting e Auth representados com dados de exemplo. Plano e limites ainda não
                conectados.
              </div>
            </article>

            <article className="infra-card">
              <div className="infra-top">
                <div className="infra-brand">
                  <div className="service-icon ai">G</div>
                  <div>
                    <h2>Gemini</h2>
                    <p>Mentor IA · consumo e resposta</p>
                  </div>
                </div>
                <span className="badge active">Operacional · exemplo</span>
              </div>
              <div className="resource-grid">
                <div>
                  <span className="resource-label">Chamadas concluídas</span>
                  <div className="resource-value" id="gemini-success">
                    {number(infraSummary.view.calls)}
                  </div>
                </div>
                <div>
                  <span className="resource-label">Chamadas com erro</span>
                  <div className="resource-value" id="gemini-errors">
                    {number(infraSummary.view.errors)}
                  </div>
                </div>
                <div>
                  <span className="resource-label">Tokens de entrada</span>
                  <div className="resource-value" id="gemini-input">
                    {number(infraSummary.view.input)}
                  </div>
                </div>
                <div>
                  <span className="resource-label">Tokens de saída</span>
                  <div className="resource-value" id="gemini-output">
                    {number(infraSummary.view.output)}
                  </div>
                </div>
              </div>
              <div className="resource-foot" id="gemini-foot">
                {infraSummary.scope} · duração medida do envio até a resposta completa.
              </div>
            </article>

            <article className="infra-card">
              <div className="infra-top">
                <div className="infra-brand">
                  <div className="service-icon hook">W</div>
                  <div>
                    <h2>Webhooks</h2>
                    <p>Eventos recebidos pelo backend</p>
                  </div>
                </div>
                <span className="badge overdue">Revisar · exemplo</span>
              </div>
              <div className="resource-grid">
                <div>
                  <span className="resource-label">Processados com sucesso</span>
                  <div className="resource-value" id="webhook-success">
                    {number(infraSummary.view.webhooks)}
                  </div>
                </div>
                <div>
                  <span className="resource-label">Falhas no processamento</span>
                  <div className="resource-value" id="webhook-errors">
                    {number(infraSummary.view.webhookErrors)}
                  </div>
                </div>
                <div>
                  <span className="resource-label">Aguardando agora</span>
                  <div className="resource-value">1</div>
                </div>
                <div>
                  <span className="resource-label">Último evento simulado</span>
                  <div className="resource-value">11:58</div>
                </div>
              </div>
              <div className="resource-foot" id="webhook-foot">
                {infraSummary.scope} · fila e último evento mostram a posição atual simulada.
              </div>
            </article>
          </div>

          <div className="split">
            <section className="section">
              <div className="section-head">
                <div>
                  <h2>Consumo de tokens</h2>
                  <p>Últimos 7 dias · entrada e saída somadas.</p>
                </div>
              </div>
              <div
                className="chart"
                id="token-chart"
                role="img"
                aria-label={`Tokens por dia: ${infraSummary.week
                  .map(
                    (row) =>
                      `${row.day} de setembro, ${number(row.inputTokens + row.outputTokens)}`
                  )
                  .join('; ')}`}
              >
                {infraSummary.week.map((row) => {
                  const total = row.inputTokens + row.outputTokens;
                  const label = `${row.day}/09: ${number(total)} tokens`;
                  const barHeight = Math.round((total / infraSummary.max) * 130);

                  return (
                    <div
                      key={row.day}
                      className="bar-item"
                      tabIndex={0}
                      title={label}
                      aria-label={label}
                    >
                      <div className="bar" style={{ height: `${barHeight}px` }} />
                      <span className="bar-label">{row.day} set.</span>
                    </div>
                  );
                })}
              </div>
              <div className="chart-meta">
                <span>
                  Total em 7 dias: <strong id="tokens-week">{infraSummary.tokensWeek}</strong>
                </span>
                <span>Valores exatos ao passar o mouse ou focar</span>
              </div>
            </section>

            <section className="section">
              <div className="section-head">
                <div>
                  <h2>Mapa da infraestrutura</h2>
                  <p>Serviços incluídos nesta versão.</p>
                </div>
              </div>
              <div className="plain-body inventory">
                <div className="inventory-row">
                  <div>
                    Aplicação web<small>Entrega do frontend</small>
                  </div>
                  <span>Firebase Hosting</span>
                </div>
                <div className="inventory-row">
                  <div>
                    Identidade dos usuários<small>Cadastro e autenticação</small>
                  </div>
                  <span>Firebase Auth</span>
                </div>
                <div className="inventory-row">
                  <div>
                    API e regras do sistema<small>Backend e recebimento de eventos</small>
                  </div>
                  <span>Render</span>
                </div>
                <div className="inventory-row">
                  <div>
                    Inteligência artificial<small>Respostas do Mentor IA</small>
                  </div>
                  <span>Gemini API</span>
                </div>
                <div className="inventory-row">
                  <div>
                    Banco, filas e backups<small>Outros serviços ainda não informados</small>
                  </div>
                  <span className="integration-state">A mapear</span>
                </div>
                <div className="inventory-row">
                  <div>
                    Cobrança e pagamentos<small>Provedor ainda não informado</small>
                  </div>
                  <span className="integration-state">A conectar</span>
                </div>
              </div>
            </section>
          </div>

          <p className="metrics-caption">
            As médias usam chamadas concluídas com sucesso no período, ponderadas pela quantidade de
            chamadas. Erros e timeouts são contados separadamente. O tempo do webhook inclui o
            processamento; não é apenas o tempo de envio da confirmação HTTP.
          </p>
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
              <h2>Saúde financeira</h2>
              <p>Setembro de 2026 · até o dia 21 · valores brutos demonstrativos.</p>
            </div>
            <span className="count-label">Assinaturas mensais</span>
          </div>

          <section className="cards" aria-label="Resumo financeiro">
            <article className="card primary">
              <div className="card-top">Receita mensal prevista</div>
              <div className="metric money" id="mrr">
                {money(financeData.monthlyCents)}
              </div>
              <p>Valor mensal das assinaturas ativas</p>
              <div className="card-bottom">Descontos vigentes já considerados</div>
            </article>

            <article className="card">
              <div className="card-top">Recebido no mês</div>
              <div className="metric money" id="received">
                {money(financeData.received)}
              </div>
              <p>Pagamentos confirmados</p>
              <div className="card-bottom" id="payments-count">
                {financeData.confirmed.length} pagamentos confirmados em setembro
              </div>
            </article>

            <article className="card">
              <div className="card-top">Valor médio por assinante</div>
              <div className="metric money" id="arpu">
                {money(financeData.arpu)}
              </div>
              <p>Receita prevista ÷ assinantes ativos</p>
              <div className="card-bottom" id="paying-count">
                {financeData.active.length} assinantes ativos
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
                  <h2>Entradas de setembro</h2>
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
                        : '0%'
                    }}
                  />
                </div>

                <div className="revenue-line">
                  <span>Renovações previstas até o fim do mês</span>
                  <strong id="revenue-expected">{money(financeData.expected)}</strong>
                </div>
                <div className="revenue-progress">
                  <span
                    id="bar-expected"
                    style={{
                      width: financeData.potential
                        ? `${(financeData.expected / financeData.potential) * 100}%`
                        : '0%'
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
                        : '0%'
                    }}
                  />
                </div>

                <div className="finance-total">
                  <span>Total se todos os pagamentos forem confirmados</span>
                  <strong id="revenue-potential">{money(financeData.potential)}</strong>
                </div>
                <p className="metrics-caption">
                  A previsão depende das renovações e da recuperação dos atrasos. Não representa
                  dinheiro já recebido.
                </p>
              </div>
            </section>

            <section className="section">
              <div className="section-head">
                <div>
                  <h2>Composição das assinaturas</h2>
                  <p>Somente assinaturas com período pago vigente.</p>
                </div>
              </div>
              <div className="plain-body">
                <div className="plan-row">
                  <div>
                    <p>Plano mensal</p>
                    <span id="full-price-count">
                      {financeData.fullCount} assinantes × R$ 19,90/mês
                    </span>
                  </div>
                  <strong id="full-price-revenue">{money(financeData.fullCount * 1990)}</strong>
                </div>

                <div className="plan-row">
                  <div>
                    <p>Com cupom Focus50</p>
                    <span id="discount-count">
                      {financeData.discounted.length} assinantes × R$ 9,95/mês
                    </span>
                  </div>
                  <strong id="discount-revenue">
                    {money(financeData.discountedRevenue)}
                  </strong>
                </div>

                <div className="plan-row">
                  <div>
                    <p>Descontos ativos</p>
                    <span>Redução mensal em relação ao preço cheio</span>
                  </div>
                  <strong id="discount-value">{money(financeData.discountValue)}</strong>
                </div>

                <p className="notice-inline">
                  Neste exemplo, o plano custa R$ 19,90/mês. O cupom Focus50 reduz para R$ 9,95 durante
                  os 3 primeiros meses. Após o período, o valor mensal previsto será atualizado.
                </p>
              </div>
            </section>
          </div>

          <section className="section">
            <div className="section-head">
              <div>
                <h2>Próximas cobranças</h2>
                <p>Assinaturas ativas · por data de renovação.</p>
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
                        Nenhuma cobrança prevista.
                      </td>
                    </tr>
                  ) : (
                    financeData.sortedBilling.map((u) => {
                      const next = priceAt(u, stamp(u.nextRenewalAt));
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
                            <strong>{money(next)}</strong>
                          </td>
                          <td>
                            <span className="mobile-label">Condição</span>
                            {next < 1990 ? (
                              <>
                                <span className="badge none">Focus50 · 50% OFF</span>
                                <span className="secondary">
                                  Preço cheio a partir de{' '}
                                  {date(demoPrices[u.id]?.discountUntil)}
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

          <div className="notes">
            <p>
              <strong>Receita prevista não é saldo.</strong> O valor mensal considera o preço
              vigente das assinaturas ativas na data de referência. O recebido usa apenas
              pagamentos confirmados em setembro.
            </p>
            <p>
              <strong>Valores brutos.</strong> Taxas do meio de pagamento, impostos e estornos não
              estão descontados. Nesta demonstração não há pagamentos estornados.
            </p>
          </div>
        </div>

        <footer className="bottom">
          <span>Nexus Focus · Administração</span>
          <span>Demonstração · Nenhum dado real de usuário</span>
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
                  ['Data do cadastro', date(selectedUser.registeredAt)],
                  [
                    'Último acesso',
                    `${date(selectedUser.lastActiveAt)} · ${relativeAccess(selectedUser)}`
                  ],
                  ['Assinante desde', date(selectedUser.subscriptionStartedAt)],
                  ['Tempo de assinatura', tenure(selectedUser)],
                  ['Próxima renovação', date(selectedUser.nextRenewalAt)],
                  ['Período pago até', date(selectedUser.paidThrough)]
                ];
                if (selectedUser.subscriptionEndedAt) {
                  fields.push(['Fim da assinatura', date(selectedUser.subscriptionEndedAt)]);
                }

                const note =
                  selectedUser.billingStatus === 'overdue'
                    ? `Pagamento em atraso. O tempo exibido considera apenas o período pago, até ${date(
                        selectedUser.paidThrough
                      )}.`
                    : selectedUser.subscriptionEndedAt
                    ? `Assinatura encerrada. O tempo exibido foi calculado até ${date(
                        selectedUser.subscriptionEndedAt
                      )}.`
                    : selectedUser.billingStatus === 'none'
                    ? 'Este usuário criou uma conta, mas ainda não iniciou uma assinatura.'
                    : 'A próxima renovação é a data prevista de cobrança; a confirmação depende do pagamento.';

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
                    <p className="dialog-note">{note}</p>
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
