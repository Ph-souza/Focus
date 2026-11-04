/**
 * Firebase Callable Function (2nd Gen / Node.js)
 * Single Source of Truth de Faturamento: Mercado Pago SDK + Cache de 4h no Firestore (admin/metrics_cache)
 */
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { MercadoPagoConfig, Payment, PreApproval } from 'mercadopago';

if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();

// TTL de 4 horas em milissegundos (4 * 60 * 60 * 1000 = 14.400.000 ms)
const CACHE_TTL_MS = 4 * 60 * 60 * 1000;
const CACHE_DOC_PATH = 'admin/metrics_cache';

export interface MpAdminMetricsPayload {
  source: 'mercadopago_api' | 'firestore_cache';
  fromCache: boolean;
  cachedAt: string;
  expiresAt: string;
  cacheAgeMinutes: number;
  mrr: {
    totalAmount: number;
    totalCents: number;
    activeSubscriptionsCount: number;
    fullAccessCount: number; // R$ 19,90/mês
    fullAccessMrr: number;
    focus50Count: number; // R$ 9,95/mês (3 primeiros ciclos)
    focus50Mrr: number;
    arpu: number;
  };
  oneTimeAdhesions: {
    nexusEliteCount: number; // Taxa única de R$ 1,00 (Vitalício, R$ 0,00 MRR)
    nexusEliteTotalAmount: number;
    nexusEliteTotalCents: number;
    otherOneTimeCount: number;
    otherOneTimeAmount: number;
  };
  paymentsSummary: {
    approvedCount30d: number;
    grossApprovedAmount30d: number;
    recurringPaymentsAmount30d: number;
    oneTimePaymentsAmount30d: number;
  };
  charts: {
    planDistribution: Array<{
      name: string;
      code: 'FULL_ACCESS' | 'FOCUS50' | 'NEXUSELITE';
      subscribers: number;
      mrrContribution: number;
      oneTimeContribution: number;
    }>;
    dailyRevenueLast30d: Array<{
      date: string; // YYYY-MM-DD
      mrrNewOrRenewed: number;
      oneTimeElite: number;
      total: number;
    }>;
  };
  recentTransactions: Array<{
    id: string;
    dateApproved: string;
    payerEmail: string;
    amount: number;
    billingCategory: 'NEXUSELITE_ONETIME' | 'FOCUS50_RECURRING' | 'FULL_RECURRING' | 'OTHER';
    status: string;
  }>;
}

/**
 * Interpreta external_reference (JSON ou string) enviado ao Mercado Pago no checkout
 */
function parseExternalRef(raw: unknown): { userId?: string; coupon?: string; billingMode?: string } {
  if (!raw || typeof raw !== 'string') return {};
  const trimmed = raw.trim();
  if (trimmed.startsWith('{')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return {};
    }
  }
  return { coupon: trimmed.toUpperCase() };
}

/**
 * Busca e consolida métricas diretamente na API Oficial do Mercado Pago via SDK
 */
export async function fetchAndComputeMpMetrics(accessToken: string): Promise<Omit<MpAdminMetricsPayload, 'fromCache' | 'cacheAgeMinutes'>> {
  const mpClient = new MercadoPagoConfig({
    accessToken,
    options: { timeout: 15000 },
  });

  const preApprovalApi = new PreApproval(mpClient);
  const paymentApi = new Payment(mpClient);

  // 1. Busca assinaturas ativas (status = authorized) e pagamentos aprovados recentes em paralelo
  const thirtyDaysAgoIso = new Date(Date.now() - 30 * 86_400_000).toISOString();

  const [subsSearchResult, paymentsSearchResult] = await Promise.all([
    preApprovalApi
      .search({
        options: {
          status: 'authorized',
          limit: 100,
          sort: 'date_created',
          criteria: 'desc',
        },
      })
      .catch((err) => {
        console.warn('[MP Metrics] Aviso em preApproval.search:', err?.message);
        return { results: [] as any[] };
      }),
    paymentApi
      .search({
        options: {
          status: 'approved',
          sort: 'date_approved',
          criteria: 'desc',
          range: 'date_approved',
          begin_date: thirtyDaysAgoIso,
          end_date: new Date().toISOString(),
          limit: 100,
        } as any,
      })
      .catch((err) => {
        console.warn('[MP Metrics] Aviso em payment.search:', err?.message);
        return { results: [] as any[] };
      }),
  ]);

  const activePreApprovals: any[] = subsSearchResult?.results || [];
  const approvedPayments: any[] = paymentsSearchResult?.results || [];

  // =========================================================================
  // 2. LÓGICA DE NEGÓCIO: SEPARAÇÃO DE MRR (RECORRENTE) VS. RECEITA ÚNICA
  // =========================================================================
  let fullAccessCount = 0;
  let fullAccessMrr = 0;
  let focus50Count = 0;
  let focus50Mrr = 0;

  for (const sub of activePreApprovals) {
    const amount = Number(sub?.auto_recurring?.transaction_amount ?? 0);
    const ext = parseExternalRef(sub?.external_reference);
    const reason = String(sub?.reason || '').toUpperCase();

    // Ignora qualquer preapproval com valor <= R$ 1,00 caso tenha sido criado como teste vitalício
    if (amount <= 1.05 || ext.coupon === 'NEXUSELITE' || ext.billingMode === 'one_time_lifetime') {
      continue;
    }

    // Identifica assinatura promocional FOCUS50 (R$ 9,95/mês nos 3 primeiros ciclos)
    if (
      ext.coupon === 'FOCUS50' ||
      reason.includes('FOCUS50') ||
      (amount >= 8.0 && amount <= 12.0)
    ) {
      focus50Count += 1;
      focus50Mrr += amount;
    } else {
      // Assinatura no valor cheio padrão (R$ 19,90/mês)
      fullAccessCount += 1;
      fullAccessMrr += amount;
    }
  }

  const totalMrrAmount = Number((fullAccessMrr + focus50Mrr).toFixed(2));
  const totalMrrCents = Math.round(totalMrrAmount * 100);
  const activeSubscriptionsCount = fullAccessCount + focus50Count;
  const arpu =
    activeSubscriptionsCount > 0
      ? Number((totalMrrAmount / activeSubscriptionsCount).toFixed(2))
      : 0;

  // =========================================================================
  // 3. CLASSIFICAÇÃO DOS PAGAMENTOS APROVADOS (ADESÃO ÚNICA NEXUSELITE vs. CICLOS)
  // =========================================================================
  let nexusEliteCount = 0;
  let nexusEliteTotalAmount = 0;
  let otherOneTimeCount = 0;
  let otherOneTimeAmount = 0;
  let recurringPaymentsAmount30d = 0;

  const dailyMap = new Map<
    string,
    { date: string; mrrNewOrRenewed: number; oneTimeElite: number; total: number }
  >();

  // Inicializa os últimos 14 dias para garantir série contínua nos gráficos
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    dailyMap.set(d, { date: d, mrrNewOrRenewed: 0, oneTimeElite: 0, total: 0 });
  }

  const recentTransactions: MpAdminMetricsPayload['recentTransactions'] = [];

  for (const pay of approvedPayments) {
    const amount = Number(pay?.transaction_amount ?? 0);
    if (amount <= 0) continue;

    const ext = parseExternalRef(pay?.external_reference);
    const description = String(pay?.description || '').toUpperCase();
    const operationType = String(pay?.operation_type || '').toLowerCase();
    const dateApprovedIso = String(pay?.date_approved || pay?.date_created || new Date().toISOString());
    const dayKey = dateApprovedIso.slice(0, 10);

    const isNexusEliteOneTime =
      ext.coupon === 'NEXUSELITE' ||
      ext.billingMode === 'one_time_lifetime' ||
      description.includes('NEXUSELITE') ||
      description.includes('VITALÍCIO') ||
      description.includes('VITALICIO') ||
      (amount >= 0.9 && amount <= 1.5 && operationType !== 'recurring_payment');

    const isFocus50Recurring =
      !isNexusEliteOneTime &&
      (ext.coupon === 'FOCUS50' ||
        description.includes('FOCUS50') ||
        (amount >= 8.0 && amount <= 12.0));

    const isFullRecurring =
      !isNexusEliteOneTime &&
      !isFocus50Recurring &&
      (operationType === 'recurring_payment' || amount >= 18.0);

    let billingCategory: MpAdminMetricsPayload['recentTransactions'][number]['billingCategory'] =
      'OTHER';

    if (isNexusEliteOneTime) {
      billingCategory = 'NEXUSELITE_ONETIME';
      nexusEliteCount += 1;
      nexusEliteTotalAmount = Number((nexusEliteTotalAmount + amount).toFixed(2));
    } else if (isFocus50Recurring) {
      billingCategory = 'FOCUS50_RECURRING';
      recurringPaymentsAmount30d = Number((recurringPaymentsAmount30d + amount).toFixed(2));
    } else if (isFullRecurring) {
      billingCategory = 'FULL_RECURRING';
      recurringPaymentsAmount30d = Number((recurringPaymentsAmount30d + amount).toFixed(2));
    } else {
      otherOneTimeCount += 1;
      otherOneTimeAmount = Number((otherOneTimeAmount + amount).toFixed(2));
    }

    const bucket = dailyMap.get(dayKey) || {
      date: dayKey,
      mrrNewOrRenewed: 0,
      oneTimeElite: 0,
      total: 0,
    };

    if (isNexusEliteOneTime) {
      bucket.oneTimeElite = Number((bucket.oneTimeElite + amount).toFixed(2));
    } else {
      bucket.mrrNewOrRenewed = Number((bucket.mrrNewOrRenewed + amount).toFixed(2));
    }
    bucket.total = Number((bucket.total + amount).toFixed(2));
    dailyMap.set(dayKey, bucket);

    if (recentTransactions.length < 25) {
      recentTransactions.push({
        id: String(pay.id),
        dateApproved: dateApprovedIso,
        payerEmail: String(pay?.payer?.email || 'Cliente MP'),
        amount,
        billingCategory,
        status: String(pay.status || 'approved'),
      });
    }
  }

  const oneTimePaymentsAmount30d = Number(
    (nexusEliteTotalAmount + otherOneTimeAmount).toFixed(2)
  );
  const grossApprovedAmount30d = Number(
    (recurringPaymentsAmount30d + oneTimePaymentsAmount30d).toFixed(2)
  );

  const nowMs = Date.now();
  const cachedAt = new Date(nowMs).toISOString();
  const expiresAt = new Date(nowMs + CACHE_TTL_MS).toISOString();

  return {
    source: 'mercadopago_api',
    cachedAt,
    expiresAt,
    mrr: {
      totalAmount: totalMrrAmount,
      totalCents: totalMrrCents,
      activeSubscriptionsCount,
      fullAccessCount,
      fullAccessMrr: Number(fullAccessMrr.toFixed(2)),
      focus50Count,
      focus50Mrr: Number(focus50Mrr.toFixed(2)),
      arpu,
    },
    oneTimeAdhesions: {
      nexusEliteCount,
      nexusEliteTotalAmount,
      nexusEliteTotalCents: Math.round(nexusEliteTotalAmount * 100),
      otherOneTimeCount,
      otherOneTimeAmount,
    },
    paymentsSummary: {
      approvedCount30d: approvedPayments.length,
      grossApprovedAmount30d,
      recurringPaymentsAmount30d,
      oneTimePaymentsAmount30d,
    },
    charts: {
      planDistribution: [
        {
          name: 'Full Access (R$ 19,90/mês)',
          code: 'FULL_ACCESS',
          subscribers: fullAccessCount,
          mrrContribution: Number(fullAccessMrr.toFixed(2)),
          oneTimeContribution: 0,
        },
        {
          name: 'Cupom FOCUS50 (R$ 9,95/mês)',
          code: 'FOCUS50',
          subscribers: focus50Count,
          mrrContribution: Number(focus50Mrr.toFixed(2)),
          oneTimeContribution: 0,
        },
        {
          name: 'Vitalício NEXUSELITE (R$ 1,00 único)',
          code: 'NEXUSELITE',
          subscribers: nexusEliteCount,
          mrrContribution: 0, // Isento de recorrência mensal
          oneTimeContribution: nexusEliteTotalAmount,
        },
      ],
      dailyRevenueLast30d: Array.from(dailyMap.values()).sort((a, b) =>
        a.date.localeCompare(b.date)
      ),
    },
    recentTransactions,
  };
}

/**
 * Orquestrador com Cache de 4 Horas no Firestore (admin/metrics_cache)
 */
export async function getOrRefreshAdminMpMetrics(
  accessToken: string,
  forceRefresh = false
): Promise<MpAdminMetricsPayload> {
  const cacheRef = db.doc(CACHE_DOC_PATH);

  if (!forceRefresh) {
    const cacheSnap = await cacheRef.get();
    if (cacheSnap.exists) {
      const data = cacheSnap.data() as any;
      const updatedAtMs: number =
        typeof data?.updatedAtMillis === 'number'
          ? data.updatedAtMillis
          : data?.updatedAt instanceof Timestamp
          ? data.updatedAt.toMillis()
          : data?.cachedAt
          ? Date.parse(data.cachedAt)
          : 0;

      const ageMs = Date.now() - updatedAtMs;
      if (updatedAtMs > 0 && ageMs < CACHE_TTL_MS && data?.payload) {
        return {
          ...(data.payload as MpAdminMetricsPayload),
          source: 'firestore_cache',
          fromCache: true,
          cacheAgeMinutes: Math.max(0, Math.round(ageMs / 60_000)),
        };
      }
    }
  }

  // Cache expirado (> 4 horas) ou inexistente -> consulta API do Mercado Pago
  const freshPayload = await fetchAndComputeMpMetrics(accessToken);

  await cacheRef.set(
    {
      payload: freshPayload,
      updatedAt: FieldValue.serverTimestamp(),
      updatedAtMillis: Date.now(),
      ttlHours: 4,
    },
    { merge: true }
  );

  return {
    ...freshPayload,
    source: 'mercadopago_api',
    fromCache: false,
    cacheAgeMinutes: 0,
  };
}

/**
 * Firebase Callable Function: getAdminMpMetrics
 */
export const getAdminMpMetrics = onCall(
  {
    region: 'southamerica-east1',
    cors: true,
  },
  async (request) => {
    // 1. Validação de Autenticação e Custom Claim de Admin
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Usuário não autenticado.');
    }

    const token = request.auth.token;
    const isAdmin =
      token.admin === true ||
      token.isAdmin === true ||
      token.role === 'admin' ||
      token.email === 'phillipe.souza27@gmail.com';

    if (!isAdmin) {
      throw new HttpsError(
        'permission-denied',
        'Acesso restrito a administradores com Custom Claim { admin: true }.'
      );
    }

    const accessToken =
      process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN || '';

    if (!accessToken) {
      throw new HttpsError(
        'failed-precondition',
        'MERCADOPAGO_ACCESS_TOKEN não configurado no ambiente.'
      );
    }

    const forceRefresh = Boolean(request.data?.forceRefresh);
    return await getOrRefreshAdminMpMetrics(accessToken, forceRefresh);
  }
);

