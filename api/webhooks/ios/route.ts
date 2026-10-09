export async function GET(request: Request) {
  return Response.json({
    status: "online",
    service: "Nexus Focus iOS Shortcuts Webhook",
    method: "POST",
    endpoint: "/api/webhooks/ios",
    instructions: "Envie requisições POST com header Authorization: Bearer <token> ou token no body, contendo a mensagem ou comando no campo 'text'."
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
    let token = "";
    if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
      token = authHeader.slice(7).trim();
    }
    if (!token) {
      token = (request.headers.get("x-ios-token") || request.headers.get("x-shortcut-token") || body.token || body.iosShortcutToken || "") as string;
    }
    token = String(token || "").trim();

    if (!token) {
      return Response.json({
        success: false,
        error: "Token de acesso ausente. Informe seu token no cabeçalho Authorization: Bearer <token> ou no campo 'token' do JSON."
      }, { status: 401 });
    }

    // Encaminha para o servidor Express no Render ou backend ativo
    const backendUrl = process.env.APP_URL || process.env.VITE_API_URL || "https://nexus-focus.onrender.com";
    const res = await fetch(`${backendUrl}/api/webhooks/ios`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    return Response.json(data, { status: res.status });
  } catch (err: any) {
    return Response.json({
      success: false,
      error: err?.message || "Erro interno ao processar webhook iOS"
    }, { status: 500 });
  }
}
