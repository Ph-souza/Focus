import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Activity, BadgePercent, Crown, LayoutDashboard, LoaderCircle, RefreshCw, Search, Users, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getApiUrl } from '../lib/api';
import './AdminConsole.css';

type UserRow = { id: string; name: string; email: string; phone: string; plan: string; status: string; createdAt: string | null; isPremium: boolean; hasLifetimeGrant: boolean };
type Coupon = { code: string; discountPercentage: number; remainingUses: number; usedCount: number; active: boolean };
type LogRow = { id: string; integration: string; severity: string; code: string; message: string; createdAt: string | null };
type Data = { metrics: { totalUsers: number; activeSubscriptions: number; transactions24h: number }; users: UserRow[]; coupons: Coupon[]; logs: LogRow[]; nextCursor: string | null; refreshedAt: string };
const emptyData: Data = { metrics: { totalUsers: 0, activeSubscriptions: 0, transactions24h: 0 }, users: [], coupons: [], logs: [], nextCursor: null, refreshedAt: '' };

export function AdminConsole() {
  const { currentUser } = useAuth();
  const [data, setData] = useState<Data>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState('');
  const [uses, setUses] = useState('');
  const [notice, setNotice] = useState('');
  const [section, setSection] = useState('overview');

  const request = useCallback(async (path: string, init?: RequestInit) => {
    if (!currentUser) throw new Error('Sessão expirada. Entre novamente.');
    const token = await currentUser.getIdToken();
    const response = await fetch(getApiUrl(path), { ...init, headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', ...(init?.headers || {}) }, cache: 'no-store' });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || 'Não foi possível concluir a operação.');
    return body;
  }, [currentUser]);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try { setData(await request('/api/admin/dashboard')); }
    catch (err) { setError(err instanceof Error ? err.message : 'Falha ao carregar dados.'); }
    finally { setLoading(false); }
  }, [request]);

  useEffect(() => { void load(); const timer = window.setInterval(() => void load(true), 30000); return () => window.clearInterval(timer); }, [load]);

  const visibleUsers = useMemo(() => data.users.filter((user) => (user.name + ' ' + user.email + ' ' + user.phone).toLowerCase().includes(query.toLowerCase())), [data.users, query]);
  const loadMore = async () => {
    if (!data.nextCursor) return; setLoading(true);
    try { const page = await request('/api/admin/dashboard?cursor=' + encodeURIComponent(data.nextCursor)); setData(current => ({ ...page, users: [...current.users, ...page.users] })); }
    catch (err) { setError(err instanceof Error ? err.message : 'Falha ao carregar mais utilizadores.'); }
    finally { setLoading(false); }
  };
  const grantElite = async (user: UserRow) => {
    if (!window.confirm('Conceder acesso Elite vitalício a ' + user.name + '? Esta ação será registrada e não altera pagamentos ou assinaturas existentes.')) return;
    setSaving(user.id); setNotice('');
    try { await request('/api/admin/users/' + encodeURIComponent(user.id) + '/grant-elite', { method: 'POST', body: '{}' }); setNotice('Acesso Elite concedido e auditado.'); await load(true); }
    catch (err) { setNotice(err instanceof Error ? err.message : 'Falha ao conceder Elite.'); }
    finally { setSaving(''); }
  };
  const saveCoupon = async (event: FormEvent) => {
    event.preventDefault(); setSaving('coupon'); setNotice('');
    try { await request('/api/admin/coupons', { method: 'POST', body: JSON.stringify({ code: couponCode, discountPercentage: Number(discount), remainingUses: Number(uses) }) }); setNotice('Cupom salvo. O histórico de usos foi preservado.'); setCouponCode(''); setDiscount(''); setUses(''); await load(true); }
    catch (err) { setNotice(err instanceof Error ? err.message : 'Falha ao guardar cupom.'); }
    finally { setSaving(''); }
  };
  const formatDate = (value: string | null) => value ? new Date(value).toLocaleDateString('pt-BR') : '—';

  return <div className="admin-shell">
    <aside className="admin-sidebar"><a className="admin-brand" href="/dashboard"><span className="admin-brand-mark">N</span><span>Nexus Focus<small>COMMAND CENTER</small></span></a><div className="admin-sidebar-label">ADMINISTRAÇÃO</div>
      <button className={section === 'overview' ? 'admin-nav active' : 'admin-nav'} onClick={() => setSection('overview')}><LayoutDashboard size={18}/> Visão geral</button>
      <button className={section === 'users' ? 'admin-nav active' : 'admin-nav'} onClick={() => setSection('users')}><Users size={18}/> Utilizadores</button>
      <button className={section === 'integrations' ? 'admin-nav active' : 'admin-nav'} onClick={() => setSection('integrations')}><Activity size={18}/> Integrações</button>
      <button className={section === 'coupons' ? 'admin-nav active' : 'admin-nav'} onClick={() => setSection('coupons')}><BadgePercent size={18}/> Cupons</button>
      <div className="admin-sidebar-bottom"><span className="admin-online-dot"/> Sessão administrativa<div className="admin-user-email">{currentUser?.email}</div><a href="/dashboard">Voltar ao app ↗</a></div>
    </aside>
    <main className="admin-main"><header className="admin-topbar"><div><div className="admin-eyebrow">NEXUS FOCUS / ADMIN</div><h1>{section === 'overview' ? 'Centro de comando' : section === 'users' ? 'Utilizadores' : section === 'integrations' ? 'Saúde do sistema' : 'Cupons e campanhas'}</h1></div><button className="admin-refresh" onClick={() => void load()} disabled={loading}><RefreshCw size={16} className={loading ? 'admin-spin' : ''}/> Atualizar</button></header>
      {error && <div className="admin-alert error">{error}<button onClick={() => void load()}>Tentar de novo</button></div>}
      {notice && <div className="admin-alert">{notice}<button onClick={() => setNotice('')}>Fechar</button></div>}
      {section === 'overview' && <>
        <div className="admin-kpis"><article className="admin-kpi"><span className="kpi-icon blue"><Users size={19}/></span><span className="kpi-label">TOTAL DE UTILIZADORES</span><strong>{data.metrics.totalUsers.toLocaleString('pt-BR')}</strong><small>Contagem no Firestore</small></article><article className="admin-kpi"><span className="kpi-icon green"><Crown size={19}/></span><span className="kpi-label">ASSINATURAS ATIVAS</span><strong>{data.metrics.activeSubscriptions.toLocaleString('pt-BR')}</strong><small>Ativas via provedor de pagamento</small></article><article className="admin-kpi"><span className="kpi-icon violet"><Zap size={19}/></span><span className="kpi-label">ATIVIDADE · 24 HORAS</span><strong>{data.metrics.transactions24h.toLocaleString('pt-BR')}</strong><small>Transações com registro recente</small></article></div>
        <section className="admin-panel"><div className="admin-panel-heading"><div><h2>Atividade recente</h2><p>Registos de utilizadores e acesso</p></div><button className="admin-link-button" onClick={() => setSection('users')}>Ver utilizadores →</button></div><UsersTable rows={data.users.slice(0, 8)} loading={loading} saving={saving} onGrant={grantElite} formatDate={formatDate}/></section>
        <section className="admin-panel"><div className="admin-panel-heading"><div><h2>Saúde do sistema</h2><p>Falhas recentes de integrações</p></div><button className="admin-link-button" onClick={() => setSection('integrations')}>Ver logs →</button></div><LogsTable rows={data.logs.slice(0, 5)} loading={loading} formatDate={formatDate}/></section>
      </>}
      {section === 'users' && <section className="admin-panel"><div className="admin-panel-heading"><div><h2>Gestão de utilizadores</h2><p>Concessões Elite são vitalícias e ficam registadas no histórico administrativo.</p></div><label className="admin-search"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Nome, e-mail ou WhatsApp"/></label></div><UsersTable rows={visibleUsers} loading={loading} saving={saving} onGrant={grantElite} formatDate={formatDate}/><div className="admin-table-foot">{data.users.length} registos carregados. {data.nextCursor && <button className="admin-link-button" disabled={loading} onClick={() => void loadMore()}>{loading ? "Carregando…" : "Carregar mais"}</button>}</div></section>}
      {section === 'integrations' && <section className="admin-panel"><div className="admin-panel-heading"><div><h2>Logs de integrações</h2><p>iOS Shortcuts, WhatsApp / Meta e Gemini</p></div><span className="admin-live-label"><span className="admin-online-dot"/> atualização a cada 30 s</span></div><LogsTable rows={data.logs} loading={loading} formatDate={formatDate}/><div className="admin-table-foot">Sem registos de falha não significa que cada integração esteja operacional; os logs dependem da instrumentação do backend.</div></section>}
      {section === 'coupons' && <><section className="admin-panel"><div className="admin-panel-heading"><div><h2>Criar ou atualizar cupom</h2><p>Editar o código preserva a contagem histórica de utilizações.</p></div></div><form className="coupon-form" onSubmit={saveCoupon}><label>Código<input required minLength={3} maxLength={32} value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} placeholder="FOCUS50"/></label><label>Desconto (%)<input required type="number" min="0" max="100" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="50"/></label><label>Usos restantes<input required type="number" min="0" step="1" value={uses} onChange={e => setUses(e.target.value)} placeholder="100"/></label><button className="admin-primary" disabled={saving === 'coupon'}>{saving === 'coupon' ? <LoaderCircle size={16} className="admin-spin"/> : null} Guardar cupom</button></form></section><section className="admin-panel"><div className="admin-panel-heading"><div><h2>Cupons ativos</h2><p>Saldo de usos e utilizações acumuladas</p></div></div><CouponsTable rows={data.coupons.filter(c => c.active)}/></section></>}
      <footer className="admin-footer">Dados consultados no servidor · última atualização: {data.refreshedAt ? new Date(data.refreshedAt).toLocaleTimeString('pt-BR') : '—'}</footer>
    </main>
  </div>;
}

function UsersTable({ rows, loading, saving, onGrant, formatDate }: { rows: UserRow[]; loading: boolean; saving: string; onGrant: (user: UserRow) => void; formatDate: (value: string | null) => string }) {
  return <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>UTILIZADOR</th><th>WHATSAPP</th><th>PLANO</th><th>ESTADO</th><th>REGISTO</th><th>AÇÃO</th></tr></thead><tbody>{loading && rows.length === 0 ? <tr><td colSpan={6} className="admin-empty">Carregando dados…</td></tr> : rows.length === 0 ? <tr><td colSpan={6} className="admin-empty">Nenhum utilizador encontrado.</td></tr> : rows.map(user => <tr key={user.id}><td><strong>{user.name}</strong><small>{user.email}</small></td><td>{user.phone || '—'}</td><td><span className="plan-pill">{user.plan}</span></td><td><span className={'status-pill ' + (user.status === 'blocked' ? 'blocked' : user.isPremium || user.hasLifetimeGrant ? 'active' : '')}>{user.status}</span></td><td>{formatDate(user.createdAt)}</td><td>{user.hasLifetimeGrant ? <span className="lifetime-label">Elite vitalício</span> : <button className="grant-button" disabled={saving === user.id} onClick={() => onGrant(user)}>{saving === user.id ? 'A conceder…' : 'Conceder Elite'}</button>}</td></tr>)}</tbody></table></div>;
}
function LogsTable({ rows, loading, formatDate }: { rows: LogRow[]; loading: boolean; formatDate: (value: string | null) => string }) {
  return <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>INTEGRAÇÃO</th><th>NÍVEL</th><th>CÓDIGO</th><th>DETALHE</th><th>DATA</th></tr></thead><tbody>{loading && rows.length === 0 ? <tr><td colSpan={5} className="admin-empty">Carregando logs…</td></tr> : rows.length === 0 ? <tr><td colSpan={5} className="admin-empty">Nenhuma falha registada.</td></tr> : rows.map(log => <tr key={log.id}><td><strong>{log.integration}</strong></td><td><span className="status-pill blocked">{log.severity}</span></td><td><code>{log.code}</code></td><td className="log-message">{log.message}</td><td>{formatDate(log.createdAt)}</td></tr>)}</tbody></table></div>;
}
function CouponsTable({ rows }: { rows: Coupon[] }) {
  return <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>CÓDIGO</th><th>DESCONTO</th><th>USOS RESTANTES</th><th>UTILIZADOS</th><th>ESTADO</th></tr></thead><tbody>{rows.length === 0 ? <tr><td colSpan={5} className="admin-empty">Nenhum cupom ativo.</td></tr> : rows.map(coupon => <tr key={coupon.code}><td><strong className="coupon-code">{coupon.code}</strong></td><td>{coupon.discountPercentage}%</td><td>{coupon.remainingUses}</td><td>{coupon.usedCount}</td><td><span className="status-pill active">Ativo</span></td></tr>)}</tbody></table></div>;
}
