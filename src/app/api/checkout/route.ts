export async function GET(request: Request) {
  return Response.json({
    status: "online",
    service: "Nexus Focus Checkout Preference Gateway (src/app)",
    endpoint: "/api/checkout",
    method: "POST"
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const backendUrl = (process.env.RENDER_EXTERNAL_URL || process.env.VITE_API_URL || "https://nexus-focus.onrender.com").replace(/\/+$/, "");

    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };
    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    const res = await fetch(`${backendUrl}/api/checkout`, {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });

    const data = await res.json().catch(() => ({
      success: false,
      error: "Resposta inválida do servidor de checkout."
    }));

    if (!res.ok) {
      console.error("❌ [src/app /api/checkout] Erro retornado pelo backend:", {
        status: res.status,
        data
      });
    }

    return Response.json(data, { status: res.status });
  } catch (err: any) {
    console.error("❌ [src/app /api/checkout] Exceção:", err);
    return Response.json({
      success: false,
      error: err?.message || "Erro interno ao processar preferência de checkout"
    }, { status: 500 });
  }
}
