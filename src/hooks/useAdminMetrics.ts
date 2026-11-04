import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  registeredAt: string; // YYYY-MM-DD
  lastActiveAt: string | null; // YYYY-MM-DD
  subscriptionStartedAt: string | null;
  subscriptionEndedAt: string | null;
  paidThrough: string | null;
  nextRenewalAt: string | null;
  billingStatus: 'active' | 'overdue' | 'canceled' | 'none' | 'lifetime';
  couponApplied: 'NEXUSELITE' | 'FOCUS50' | string | null;
  lifetimeAccess: boolean;
  monthlyCents: number; // 0 para NEXUSELITE, 995 para FOCUS50 em ciclo promocional, 1990 padrão
  discountUntil: string | null;
  plan: string;
  role: string;
}

export interface AdminPaymentRecord {
  id: string;
  userId: string;
  payerEmail: string;
  amountCents: number;
  paidAt: string; // YYYY-MM-DD
  status: 'paid' | 'pending' | 'overdue';
  coupon: string | null;
  type: 'one_time' | 'subscription';
}

export interface AdminMetrics {
  loading: boolean;
  error: string | null;
  users: AdminUserRecord[];
  payments: AdminPaymentRecord[];
  totalUsers: number;
  activeUsersInWindow: (days: number) => number;
  subscriptions: {
    totalActive: number;
    nexusEliteCount: number; // Vitalício (taxa única R$ 1,00 / recorrência R$ 0,00)
    focus50Count: number; // 50% OFF (R$ 9,95/mês nos 3 primeiros ciclos)
    fullPriceCount: number; // Plano cheio (R$ 19,90/mês)
    overdueCount: number;
  };
  revenue: {
    mrrCents: number; // MRR recorrente real em centavos
    mrrFormatted: string; // Ex: "R$ 29,85"
    receivedMonthCents: number; // Pagamentos confirmados no mês atual
    receivedTotalCents: number; // Total histórico recebido
    focus50MrrCents: number;
    fullPriceMrrCents: number;
    nexusEliteOneTimeCents: number;
    arpuCents: number;
    discountSavingsCents: number;
  };
  refresh: () => Promise<void>;
}

const BASE_PLAN_CENTS = 1990; // R$ 19,90
const FOCUS50_PROMO_CENTS = 995; // R$ 9,95
const NEXUSELITE_ONETIME_CENTS = 100; // R$ 1,00

function toIsoDate(val: unknown): string | null {
  if (!val) return null;
  if (val instanceof Timestamp) {
    return val.toDate().toISOString().slice(0, 10);
  }
  if (typeof val === 'object' && val !== null && 'seconds' in val) {
    const sec = (val as { seconds: number }).seconds;
    return new Date(sec * 1000).toISOString().slice(0, 10);
  }
  if (typeof val === 'number') {
    return new Date(val).toISOString().slice(0, 10);
  }
  if (typeof val === 'string') {
    const parsed = Date.parse(val);
    if (!Number.isNaN(parsed)) {
      return new Date(parsed).toISOString().slice(0, 10);
    }
  }
  return null;
}

function addDaysIso(isoDate: string, days: number): string {
  const ms = Date.parse(isoDate + 'T12:00:00Z');
  if (Number.isNaN(ms)) return new Date().toISOString().slice(0, 10);
  return new Date(ms + days * 86_400_000).toISOString().slice(0, 10);
}

export function useAdminMetrics(): AdminMetrics {
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [payments, setPayments] = useState<AdminPaymentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const processSnapshots = useCallback(
    (
      usersDocs: Array<{ id: string; data: Record<string, any> }>,
      subsDocs: Array<{ id: string; data: Record<string, any> }>,
      paymentsDocs: Array<{ id: string; data: Record<string, any> }>
    ) => {
      const todayIso = new Date().toISOString().slice(0, 10);

      // Indexa assinaturas da coleção 'subscriptions' por userId e por payerEmail
      const subByUser = new Map<string, Record<string, any>>();
      const subByEmail = new Map<string, Record<string, any>>();

      for (const s of subsDocs) {
        const d = s.data;
        if (d.userId) subByUser.set(String(d.userId), { id: s.id, ...d });
        if (d.payerEmail) subByEmail.set(String(d.payerEmail).toLowerCase(), { id: s.id, ...d });
      }

      // Deduplica documentos de 'users' (caso exista espelho por e-mail e UID, prioriza o UID do Firebase Auth)
      const dedupedByEmail = new Map<string, { id: string; data: Record<string, any> }>();
      const noEmailDocs: Array<{ id: string; data: Record<string, any> }> = [];

      for (const docItem of usersDocs) {
        const emailRaw = String(
          docItem.data.email || (docItem.id.includes('@') ? docItem.id : '')
        )
          .trim()
          .toLowerCase();

        if (!emailRaw) {
          noEmailDocs.push(docItem);
          continue;
        }

        const existing = dedupedByEmail.get(emailRaw);
        if (!existing) {
          dedupedByEmail.set(emailRaw, docItem);
        } else {
          // Prioriza o documento cujo ID é um UID (não contém '@') e mescla campos
          const currentIsUid = !docItem.id.includes('@');
          const existingIsUid = !existing.id.includes('@');
          if (currentIsUid && !existingIsUid) {
            dedupedByEmail.set(emailRaw, {
              id: docItem.id,
              data: { ...existing.data, ...docItem.data },
            });
          } else {
            dedupedByEmail.set(emailRaw, {
              id: existing.id,
              data: { ...docItem.data, ...existing.data },
            });
          }
        }
      }

      const finalUserDocs = [...Array.from(dedupedByEmail.values()), ...noEmailDocs];

      const normalizedUsers: AdminUserRecord[] = finalUserDocs.map(({ id, data }) => {
        const email = String(data.email || (id.includes('@') ? id : '')).trim().toLowerCase();
        const linkedSub = subByUser.get(id) || (email ? subByEmail.get(email) : undefined);

        const rawName =
          data.displayName ||
          data.name ||
          (email ? email.split('@')[0].replace(/[._-]/g, ' ') : `Usuário ${id.slice(0, 6)}`);
        const formattedName = String(rawName)
          .split(' ')
          .filter(Boolean)
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');

        const registeredAt =
          toIsoDate(data.createdAt) ||
          toIsoDate(data.registeredAt) ||
          toIsoDate(data.updatedAt) ||
          todayIso;

        const lastActiveAt =
          toIsoDate(data.lastActiveAt) ||
          toIsoDate(data.lastLoginAt) ||
          toIsoDate(data.lastWaInteraction) ||
          toIsoDate(data.updatedAt) ||
          registeredAt;

        const rawCoupon = String(
          data.couponApplied ||
            data.coupon ||
            linkedSub?.coupon ||
            linkedSub?.couponCode ||
            ''
        )
          .trim()
          .toUpperCase();

        const isAdminMaster =
          data.role === 'admin' ||
          data.isAdmin === true ||
          email === 'phillipe.souza27@gmail.com';

        const lifetimeAccess =
          Boolean(data.lifetimeAccess) ||
          rawCoupon === 'NEXUSELITE' ||
          data.plan === 'lifetime' ||
          data.plan === 'elite' ||
          isAdminMaster;

        const isActiveSub =
          lifetimeAccess ||
          Boolean(data.isPremium) ||
          data.status === 'active' ||
          data.subscriptionStatus === 'authorized' ||
          data.subscriptionStatus === 'active' ||
          linkedSub?.status === 'authorized' ||
          linkedSub?.status === 'active';

        const couponApplied = rawCoupon
          ? rawCoupon
          : lifetimeAccess
          ? 'NEXUSELITE'
          : null;

        const subStartedAt =
          toIsoDate(data.subscriptionStartedAt) ||
          toIsoDate(data.upgradedAt) ||
          toIsoDate(linkedSub?.createdAt) ||
          (isActiveSub ? registeredAt : null);

        const discountUntil =
          couponApplied === 'FOCUS50' && subStartedAt
            ? toIsoDate(linkedSub?.promoEndsAt) || addDaysIso(subStartedAt, 90)
            : null;

        const isFocus50InPromo =
          couponApplied === 'FOCUS50' &&
          (!discountUntil || discountUntil >= todayIso) &&
          Number(linkedSub?.cyclesCompleted || 0) < 3;

        let monthlyCents = 0;
        if (isActiveSub) {
          if (lifetimeAccess || couponApplied === 'NEXUSELITE') {
            // NEXUSELITE: isento de recorrência mensal (R$ 0,00/mês)
            monthlyCents = 0;
          } else if (isFocus50InPromo) {
            // FOCUS50 nos 3 primeiros ciclos: R$ 9,95/mês
            monthlyCents = FOCUS50_PROMO_CENTS;
          } else if (typeof data.currentPrice === 'number' && data.currentPrice > 0) {
            monthlyCents = Math.round(data.currentPrice * 100);
          } else {
            monthlyCents = BASE_PLAN_CENTS;
          }
        }

        const nextRenewalAt = !isActiveSub
          ? null
          : lifetimeAccess
          ? null
          : toIsoDate(data.nextRenewalAt) ||
            toIsoDate(linkedSub?.nextPaymentDate) ||
            addDaysIso(subStartedAt || todayIso, 30);

        const paidThrough = !isActiveSub
          ? null
          : lifetimeAccess
          ? '2099-12-31'
          : nextRenewalAt || addDaysIso(todayIso, 30);

        let billingStatus: AdminUserRecord['billingStatus'] = 'none';
        if (lifetimeAccess) {
          billingStatus = 'lifetime';
        } else if (isActiveSub) {
          billingStatus = 'active';
        } else if (data.status === 'overdue' || data.subscriptionStatus === 'overdue') {
          billingStatus = 'overdue';
        } else if (data.status === 'canceled' || data.subscriptionStatus === 'cancelled') {
          billingStatus = 'canceled';
        }

        return {
          id,
          name: formattedName,
          email: email || 'Sem e-mail',
          registeredAt,
          lastActiveAt,
          subscriptionStartedAt: subStartedAt,
          subscriptionEndedAt: toIsoDate(data.subscriptionEndedAt) || null,
          paidThrough,
          nextRenewalAt,
          billingStatus,
          couponApplied,
          lifetimeAccess,
          monthlyCents,
          discountUntil,
          plan: String(data.plan || (lifetimeAccess ? 'elite' : isActiveSub ? 'pro' : 'free')),
          role: String(data.role || (isAdminMaster ? 'admin' : 'user')),
        };
      });

      const normalizedPayments: AdminPaymentRecord[] = paymentsDocs.map(({ id, data }) => {
        const rawAmount = Number(
          data.transactionAmount ?? data.amount ?? data.finalAmount ?? 0
        );
        const amountCents =
          rawAmount > 0 && rawAmount < 100
            ? Math.round(rawAmount * 100)
            : Math.round(rawAmount);

        return {
          id,
          userId: String(data.userId || ''),
          payerEmail: String(data.payerEmail || data.email || ''),
          amountCents,
          paidAt: toIsoDate(data.processedAt || data.createdAt || data.paidAt) || todayIso,
          status: 'paid',
          coupon: data.coupon ? String(data.coupon).toUpperCase() : null,
          type: data.billingMode === 'one_time_lifetime' ? 'one_time' : 'subscription',
        };
      });

      setUsers(normalizedUsers);
      setPayments(normalizedPayments);
      setLoading(false);
      setError(null);
    },
    []
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [usersSnap, subsSnap, paymentsSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'subscriptions')).catch(() => null),
        getDocs(query(collection(db, 'confirmed_payments'), orderBy('processedAt', 'desc'), limit(200))).catch(
          () => getDocs(collection(db, 'confirmed_payments')).catch(() => null)
        ),
      ]);

      const usersDocs = usersSnap.docs.map((d) => ({ id: d.id, data: d.data() }));
      const subsDocs = subsSnap ? subsSnap.docs.map((d) => ({ id: d.id, data: d.data() })) : [];
      const paymentsDocs = paymentsSnap
        ? paymentsSnap.docs.map((d) => ({ id: d.id, data: d.data() }))
        : [];

      processSnapshots(usersDocs, subsDocs, paymentsDocs);
    } catch (err: any) {
      console.error('[useAdminMetrics] Erro ao consultar Firestore:', err);
      setError(err?.message || 'Erro ao carregar métricas reais do Firestore.');
      setLoading(false);
    }
  }, [processSnapshots]);

  useEffect(() => {
    let usersCache: Array<{ id: string; data: Record<string, any> }> = [];
    let subsCache: Array<{ id: string; data: Record<string, any> }> = [];
    let paymentsCache: Array<{ id: string; data: Record<string, any> }> = [];

    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        usersCache = snap.docs.map((d) => ({ id: d.id, data: d.data() }));
        processSnapshots(usersCache, subsCache, paymentsCache);
      },
      (err) => {
        console.error('[useAdminMetrics] Listener users error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    const unsubSubs = onSnapshot(
      collection(db, 'subscriptions'),
      (snap) => {
        subsCache = snap.docs.map((d) => ({ id: d.id, data: d.data() }));
        if (usersCache.length > 0) {
          processSnapshots(usersCache, subsCache, paymentsCache);
        }
      },
      () => {
        // Ignora silenciosamente se a coleção ainda estiver vazia
      }
    );

    const unsubPayments = onSnapshot(
      collection(db, 'confirmed_payments'),
      (snap) => {
        paymentsCache = snap.docs.map((d) => ({ id: d.id, data: d.data() }));
        if (usersCache.length > 0) {
          processSnapshots(usersCache, subsCache, paymentsCache);
        }
      },
      () => {
        // Ignora silenciosamente se a coleção ainda estiver vazia
      }
    );

    return () => {
      unsubUsers();
      unsubSubs();
      unsubPayments();
    };
  }, [processSnapshots]);

  const activeUsersInWindow = useCallback(
    (days: number): number => {
      const nowMs = Date.now();
      const windowMs = days * 86_400_000;
      return users.filter((u) => {
        if (!u.lastActiveAt) return false;
        const lastMs = Date.parse(u.lastActiveAt + 'T15:00:00Z');
        return !Number.isNaN(lastMs) && nowMs - lastMs <= windowMs;
      }).length;
    },
    [users]
  );

  // Cálculo de assinaturas e receita real (MRR)
  const activeSubscribers = users.filter(
    (u) => u.billingStatus === 'active' || u.billingStatus === 'lifetime'
  );

  const nexusEliteUsers = activeSubscribers.filter(
    (u) => u.lifetimeAccess || u.couponApplied === 'NEXUSELITE'
  );
  const focus50Users = activeSubscribers.filter(
    (u) => !u.lifetimeAccess && u.couponApplied === 'FOCUS50' && u.monthlyCents === FOCUS50_PROMO_CENTS
  );
  const fullPriceUsers = activeSubscribers.filter(
    (u) => !u.lifetimeAccess && u.monthlyCents >= BASE_PLAN_CENTS
  );
  const overdueUsers = users.filter((u) => u.billingStatus === 'overdue');

  const focus50MrrCents = focus50Users.reduce((acc, u) => acc + u.monthlyCents, 0);
  const fullPriceMrrCents = fullPriceUsers.reduce((acc, u) => acc + u.monthlyCents, 0);
  const mrrCents = focus50MrrCents + fullPriceMrrCents; // NEXUSELITE tem recorrência R$ 0,00/mês

  const currentMonthPrefix = new Date().toISOString().slice(0, 7); // YYYY-MM
  const receivedMonthCents = payments
    .filter((p) => p.status === 'paid' && p.paidAt.startsWith(currentMonthPrefix))
    .reduce((acc, p) => acc + p.amountCents, 0);

  const receivedTotalCents = payments
    .filter((p) => p.status === 'paid')
    .reduce((acc, p) => acc + p.amountCents, 0);

  const recurringSubscribersCount = focus50Users.length + fullPriceUsers.length;
  const arpuCents = recurringSubscribersCount > 0 ? Math.round(mrrCents / recurringSubscribersCount) : 0;
  const discountSavingsCents = focus50Users.length * (BASE_PLAN_CENTS - FOCUS50_PROMO_CENTS);

  const mrrFormatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(mrrCents / 100);

  return {
    loading,
    error,
    users,
    payments,
    totalUsers: users.length,
    activeUsersInWindow,
    subscriptions: {
      totalActive: activeSubscribers.length,
      nexusEliteCount: nexusEliteUsers.length,
      focus50Count: focus50Users.length,
      fullPriceCount: fullPriceUsers.length,
      overdueCount: overdueUsers.length,
    },
    revenue: {
      mrrCents,
      mrrFormatted,
      receivedMonthCents,
      receivedTotalCents,
      focus50MrrCents,
      fullPriceMrrCents,
      nexusEliteOneTimeCents: nexusEliteUsers.length * NEXUSELITE_ONETIME_CENTS,
      arpuCents,
      discountSavingsCents,
    },
    refresh,
  };
}

