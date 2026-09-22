/**
 * Mock Data para o Painel Administrativo do Nexus Focus (/painel)
 * Extraído de app.js
 */

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  registeredAt: string;
  lastActiveAt: string | null;
  subscriptionStartedAt: string | null;
  paidThrough: string | null;
  nextRenewalAt: string | null;
  subscriptionEndedAt: string | null;
  billingStatus: 'active' | 'none' | 'overdue' | 'canceled';
}

export interface DemoPricePlan {
  monthlyCents: number;
  discountUntil: string | null;
}

export interface DemoPayment {
  id: string;
  userId: string;
  paidAt: string;
  amountCents: number;
  status: string;
}

export interface DemoUnpaidInvoice {
  id: string;
  userId: string;
  dueAt: string;
  amountCents: number;
  status: string;
}

export interface TelemetryItem {
  day: number;
  inputTokens: number;
  outputTokens: number;
  geminiSuccess: number;
  geminiErrors: number;
  geminiDurationMs: number;
  webhookSuccess: number;
  webhookErrors: number;
  webhookDurationMs: number;
}

export const AS_OF = Date.parse('2026-09-21T15:00:00Z');
export const DAY = 86400000;

export const demoUsers: DemoUser[] = [
  {
    id: 'demo-01',
    name: 'Ana Martins',
    email: 'ana.martins@example.com',
    registeredAt: '2026-09-20',
    lastActiveAt: '2026-09-21',
    subscriptionStartedAt: '2026-09-20',
    paidThrough: '2026-10-20',
    nextRenewalAt: '2026-10-20',
    subscriptionEndedAt: null,
    billingStatus: 'active',
  },
  {
    id: 'demo-02',
    name: 'Lucas Oliveira',
    email: 'lucas.oliveira@example.com',
    registeredAt: '2026-09-18',
    lastActiveAt: '2026-09-20',
    subscriptionStartedAt: null,
    paidThrough: null,
    nextRenewalAt: null,
    subscriptionEndedAt: null,
    billingStatus: 'none',
  },
  {
    id: 'demo-03',
    name: 'Mariana Costa',
    email: 'mariana.costa@example.com',
    registeredAt: '2026-09-12',
    lastActiveAt: '2026-09-21',
    subscriptionStartedAt: '2026-09-12',
    paidThrough: '2026-10-12',
    nextRenewalAt: '2026-10-12',
    subscriptionEndedAt: null,
    billingStatus: 'active',
  },
  {
    id: 'demo-04',
    name: 'Pedro Santos',
    email: 'pedro.santos@example.com',
    registeredAt: '2026-09-02',
    lastActiveAt: '2026-09-14',
    subscriptionStartedAt: '2026-09-03',
    paidThrough: '2026-10-03',
    nextRenewalAt: '2026-10-03',
    subscriptionEndedAt: null,
    billingStatus: 'active',
  },
  {
    id: 'demo-05',
    name: 'Camila Ferreira',
    email: 'camila.ferreira@example.com',
    registeredAt: '2026-08-25',
    lastActiveAt: '2026-09-19',
    subscriptionStartedAt: '2026-08-25',
    paidThrough: '2026-09-25',
    nextRenewalAt: '2026-09-25',
    subscriptionEndedAt: null,
    billingStatus: 'active',
  },
  {
    id: 'demo-06',
    name: 'Rafael Almeida',
    email: 'rafael.almeida@example.com',
    registeredAt: '2026-08-10',
    lastActiveAt: '2026-08-18',
    subscriptionStartedAt: '2026-08-10',
    paidThrough: '2026-09-10',
    nextRenewalAt: null,
    subscriptionEndedAt: '2026-09-10',
    billingStatus: 'canceled',
  },
  {
    id: 'demo-07',
    name: 'Beatriz Lima',
    email: 'beatriz.lima@example.com',
    registeredAt: '2026-07-23',
    lastActiveAt: '2026-09-21',
    subscriptionStartedAt: '2026-07-23',
    paidThrough: '2026-09-23',
    nextRenewalAt: '2026-09-23',
    subscriptionEndedAt: null,
    billingStatus: 'active',
  },
  {
    id: 'demo-08',
    name: 'Gabriel Rocha',
    email: 'gabriel.rocha@example.com',
    registeredAt: '2026-07-16',
    lastActiveAt: '2026-09-17',
    subscriptionStartedAt: '2026-07-16',
    paidThrough: '2026-09-16',
    nextRenewalAt: null,
    subscriptionEndedAt: null,
    billingStatus: 'overdue',
  },
  {
    id: 'demo-09',
    name: 'Juliana Ribeiro',
    email: 'juliana.ribeiro@example.com',
    registeredAt: '2026-06-26',
    lastActiveAt: '2026-09-18',
    subscriptionStartedAt: '2026-06-26',
    paidThrough: '2026-09-26',
    nextRenewalAt: '2026-09-26',
    subscriptionEndedAt: null,
    billingStatus: 'active',
  },
  {
    id: 'demo-10',
    name: 'Felipe Cardoso',
    email: 'felipe.cardoso@example.com',
    registeredAt: '2026-06-05',
    lastActiveAt: '2026-08-02',
    subscriptionStartedAt: '2026-06-05',
    paidThrough: '2026-10-05',
    nextRenewalAt: '2026-10-05',
    subscriptionEndedAt: null,
    billingStatus: 'active',
  },
  {
    id: 'demo-11',
    name: 'Larissa Souza',
    email: 'larissa.souza@example.com',
    registeredAt: '2026-05-28',
    lastActiveAt: '2026-09-20',
    subscriptionStartedAt: '2026-05-28',
    paidThrough: '2026-09-28',
    nextRenewalAt: '2026-09-28',
    subscriptionEndedAt: null,
    billingStatus: 'active',
  },
  {
    id: 'demo-12',
    name: 'Bruno Mendes',
    email: 'bruno.mendes@example.com',
    registeredAt: '2026-04-08',
    lastActiveAt: '2026-07-25',
    subscriptionStartedAt: '2026-04-08',
    paidThrough: '2026-08-08',
    nextRenewalAt: null,
    subscriptionEndedAt: '2026-08-08',
    billingStatus: 'canceled',
  },
];

export const demoPrices: Record<string, DemoPricePlan> = {
  'demo-01': {
    monthlyCents: 1990,
    discountUntil: '2026-12-20',
  },
  'demo-05': {
    monthlyCents: 1990,
    discountUntil: '2026-11-25',
  },
  'demo-09': {
    monthlyCents: 1990,
    discountUntil: '2026-09-26',
  },
};

export const demoPayments: DemoPayment[] = [
  {
    id: 'pay-01',
    userId: 'demo-01',
    paidAt: '2026-09-20',
    amountCents: 995,
    status: 'paid',
  },
  {
    id: 'pay-03',
    userId: 'demo-03',
    paidAt: '2026-09-12',
    amountCents: 1990,
    status: 'paid',
  },
  {
    id: 'pay-04',
    userId: 'demo-04',
    paidAt: '2026-09-03',
    amountCents: 1990,
    status: 'paid',
  },
  {
    id: 'pay-10',
    userId: 'demo-10',
    paidAt: '2026-09-05',
    amountCents: 1990,
    status: 'paid',
  },
];

export const demoUnpaidInvoices: DemoUnpaidInvoice[] = [
  {
    id: 'invoice-08',
    userId: 'demo-08',
    dueAt: '2026-09-16',
    amountCents: 1990,
    status: 'overdue',
  },
];

export const telemetry: TelemetryItem[] = Array.from({ length: 21 }, (_, i) => {
  const day = i + 1;
  const calls = 18 + ((i * 7) % 19);
  const errors = i % 6 === 0 ? 1 : 0;
  const webhookSuccess = 4 + (i % 8);
  return {
    day,
    inputTokens: 12000 + day * 410 + (i % 4) * 1100,
    outputTokens: 3600 + day * 130 + (i % 3) * 300,
    geminiSuccess: calls,
    geminiErrors: errors,
    geminiDurationMs: calls * (1420 + (i % 5) * 115),
    webhookSuccess,
    webhookErrors: i % 10 === 0 ? 1 : 0,
    webhookDurationMs: webhookSuccess * (160 + (i % 4) * 22),
  };
});
