export interface PreapprovalPayloadOptions {
  payerEmail: string;
  cardToken?: string;
  hostedCheckout: boolean;
  backUrl: string;
  orderId: string;
  plan: "mensal" | "anual";
  coupon: string | null;
  userId: string;
  finalAmount: number;
  frequency: number;
  selectedPlanId?: string;
}

export function buildPreapprovalPayload(options: PreapprovalPayloadOptions) {
  const {
    payerEmail, cardToken, hostedCheckout, backUrl, orderId, plan,
    coupon, userId, finalAmount, frequency, selectedPlanId
  } = options;
  const recurringPlanId = !hostedCheckout && !coupon && plan === "mensal"
    ? selectedPlanId
    : undefined;
  const reason = `Nexus Focus Pro - Assinatura ${plan === "anual" ? "Anual" : "Mensal"}${coupon ? ` (Cupom ${coupon})` : ""}`;

  return {
    payer_email: payerEmail,
    ...(hostedCheckout ? {} : { card_token_id: cardToken }),
    back_url: backUrl,
    status: hostedCheckout ? "pending" : "authorized",
    external_reference: JSON.stringify({ orderId, plan, coupon, userId, price: finalAmount }),
    ...(!recurringPlanId ? {
      reason,
      auto_recurring: {
        frequency,
        frequency_type: "months",
        transaction_amount: finalAmount,
        currency_id: "BRL"
      }
    } : {}),
    ...(recurringPlanId ? { preapproval_plan_id: recurringPlanId } : {})
  };
}

function redactSensitiveFields(value: unknown, seen = new WeakSet<object>(), depth = 0): unknown {
  if (typeof value === "bigint") return value.toString();
  if (!value || typeof value !== "object") return value;
  if (depth > 6) return "[truncated]";
  if (seen.has(value)) return "[circular]";
  seen.add(value);
  if (Array.isArray(value)) return value.slice(0, 30).map(item => redactSensitiveFields(item, seen, depth + 1));
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).slice(0, 50).map(([key, child]) => {
    if (/token|authorization|email|card|payer/i.test(key)) return [key, "[redacted]"];
    return [key, redactSensitiveFields(child, seen, depth + 1)];
  }));
}

export function mercadoPagoErrorDetails(error: any) {
  const response = error?.response || error?.cause?.response;
  const responseData = response?.data ?? error?.cause?.data ?? error?.cause;
  return {
    status: error?.status ?? error?.statusCode ?? response?.status,
    code: error?.code ?? error?.cause?.code,
    message: error?.message,
    requestId: response?.headers?.["x-request-id"] ?? error?.headers?.["x-request-id"],
    response: redactSensitiveFields(responseData)
  };
}
