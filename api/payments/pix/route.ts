export async function GET(request: Request) {
  return Response.json({
    status: "online",
    service: "Nexus Focus Pix Payments Gateway",
    endpoint: "/api/payments/pix",
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

    const res = await fetch(`${backendUrl}/api/payments/pix`, {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });

    const data = await res.json().catch(() => ({
      success: false,
      error: "Resposta inválida do servidor ao gerar Pix."
    }));

    return Response.json(data, { status: res.status });
  } catch (err: any) {
    return Response.json({
      success: false,
      error: err?.message || "Erro interno ao gerar cobrança Pix"
    }, { status: 500 });
  }
}
