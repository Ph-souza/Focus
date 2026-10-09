export async function GET(request: Request) {
  return Response.json({
    status: "online",
    service: "Nexus Focus Coupon Validation Service",
    endpoint: "/api/coupons/validate",
    method: "POST"
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const backendUrl = process.env.RENDER_EXTERNAL_URL || process.env.VITE_API_URL || "https://nexus-focus.onrender.com";

    const res = await fetch(`${backendUrl}/api/coupons/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    return Response.json(data, { status: res.status });
  } catch (err: any) {
    return Response.json({
      success: false,
      error: err?.message || "Erro interno ao validar cupom"
    }, { status: 500 });
  }
}
