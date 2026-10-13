const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync('src/lib/mercadoPagoSubscriptions.ts', 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS }
}).outputText;
const moduleFixture = { exports: {} };
vm.runInNewContext(compiled, { exports: moduleFixture.exports, module: moduleFixture });
const { buildPreapprovalPayload, mercadoPagoErrorDetails } = moduleFixture.exports;

const base = {
  payerEmail: 'buyer@example.com',
  cardToken: 'sensitive-card-token',
  hostedCheckout: false,
  backUrl: 'https://nexusfocus.web.app/dashboard',
  orderId: 'order-123',
  plan: 'mensal',
  coupon: 'NEXUSELITE',
  userId: 'uid-123',
  finalAmount: 1,
  frequency: 1,
  selectedPlanId: 'valid-default-plan'
};

test('NEXUSELITE creates a custom monthly BRL 1 preapproval without a plan id', () => {
  const payload = buildPreapprovalPayload(base);
  assert.equal(payload.preapproval_plan_id, undefined);
  assert.equal(payload.auto_recurring.transaction_amount, 1);
  assert.equal(payload.auto_recurring.currency_id, 'BRL');
  assert.equal(payload.auto_recurring.frequency, 1);
  assert.equal(payload.auto_recurring.frequency_type, 'months');
  assert.equal(payload.status, 'authorized');
  assert.equal(payload.card_token_id, 'sensitive-card-token');
});

test('monthly checkout without coupon uses only the server-selected plan id', () => {
  const payload = buildPreapprovalPayload({ ...base, coupon: null });
  assert.equal(payload.preapproval_plan_id, 'valid-default-plan');
  assert.equal(payload.auto_recurring, undefined);
});

test('Mercado Pago diagnostics preserve gateway response while redacting payment credentials', () => {
  const details = mercadoPagoErrorDetails({
    message: 'Resource not found',
    status: 404,
    response: { status: 404, headers: { 'x-request-id': 'request-1' }, data: { message: 'Resource not found', payer_email: 'buyer@example.com', card_token_id: 'secret' } }
  });
  assert.equal(details.status, 404);
  assert.equal(details.requestId, 'request-1');
  assert.equal(details.response.message, 'Resource not found');
  assert.equal(details.response.payer_email, '[redacted]');
  assert.equal(details.response.card_token_id, '[redacted]');
});
