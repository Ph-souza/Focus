import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import path from "path";
import crypto from "crypto";
import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import webpush from "web-push";

// Firebase Admin SDK initialization (Singleton)
let adminApp: App;
if (!getApps().length) {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || "aura-sync-497100";

  if (serviceAccountKey) {
    try {
      const parsed = typeof serviceAccountKey === "string" && serviceAccountKey.trim().startsWith("{")
        ? JSON.parse(serviceAccountKey)
        : JSON.parse(Buffer.from(serviceAccountKey, "base64").toString("utf-8"));
      adminApp = initializeApp({
        credential: cert(parsed),
        projectId: parsed.project_id || projectId
      });
      console.log("[Firebase Admin] Inicializado com sucesso via Service Account Key.");
    } catch (e: any) {
      console.warn("[Firebase Admin] Falha ao processar FIREBASE_SERVICE_ACCOUNT_KEY, inicializando com projectId:", e?.message);
      adminApp = initializeApp({ projectId });
    }
  } else {
    adminApp = initializeApp({ projectId });
    console.log(`[Firebase Admin] Inicializado com projectId: ${projectId}`);
  }
} else {
  adminApp = getApps()[0];
}

const adminDb = getFirestore(adminApp);

// Mercado Pago setup
const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim() || process.env.MP_ACCESS_TOKEN?.trim() || "";
const mpWebhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim() || process.env.MP_WEBHOOK_SECRET?.trim() || "";

const mpClient = mpAccessToken ? new MercadoPagoConfig({ accessToken: mpAccessToken }) : null;
const mpPayment = mpClient ? new Payment(mpClient) : null;

/**
 * Valida a assinatura do Webhook do Mercado Pago (Header x-signature)
 * Formato x-signature: "ts=1700000000,v1=hash_hmac..."
 * Manifest template: "id:[data.id];request-id:[x-request-id];ts:[ts];"
 */
function verifyMercadoPagoSignature(
  xSignatureHeader: string | undefined,
  xRequestIdHeader: string | undefined,
  dataId: string | number,
  secret: string
): boolean {
  if (!xSignatureHeader || !secret) {
    return false;
  }

  try {
    const parts = xSignatureHeader.split(",").reduce((acc: Record<string, string>, part) => {
      const [k, v] = part.split("=").map((s) => s.trim());
      if (k && v) acc[k] = v;
      return acc;
    }, {});

    const ts = parts["ts"];
    const v1Hash = parts["v1"];

    if (!ts || !v1Hash) return false;

    const manifest = `id:${dataId};request-id:${xRequestIdHeader || ""};ts:${ts};`;
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(manifest);
    const expectedHash = hmac.digest("hex");

    if (v1Hash.length !== expectedHash.length) return false;
    return crypto.timingSafeEqual(Buffer.from(v1Hash, "hex"), Buffer.from(expectedHash, "hex"));
  } catch (err: any) {
    console.warn("[Webhook MP] Erro ao validar assinatura HMAC:", err?.message);
    return false;
  }
}

// Resolve GEMINI API Key safely from environment
const getGeminiApiKey = () => process.env.GEMINI_API_KEY?.trim() || process.env.VITE_GEMINI_API_KEY?.trim() || "";

// OpenAI setup (instantiated conditionally to prevent startup crashes when key is absent)
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

// Web Push setup
let vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
let vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (!vapidPublicKey || !vapidPrivateKey) {
  const keys = webpush.generateVAPIDKeys();
  vapidPublicKey = keys.publicKey;
  vapidPrivateKey = keys.privateKey;
  console.log("Generated VAPID keys locally for preview.");
}

webpush.setVapidDetails(
  "mailto:suporte@aurasync.com",
  vapidPublicKey,
  vapidPrivateKey
);

// In-memory store for subscriptions (in production, use Firestore)
const subscriptions: any[] = [];

// Tools for Gemini
const addTaskTool: FunctionDeclaration = {
  name: "add_task",
  description: "Adiciona uma nova tarefa na lista de tarefas do usuário. Use para compromissos, lembretes de cancelamento de assinaturas ou afazeres em geral.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "O título da tarefa." },
      description: { type: Type.STRING, description: "Uma breve descrição da tarefa." },
      priority: { type: Type.STRING, description: "Prioridade: 'low', 'medium' ou 'high'." },
      deadline: { type: Type.STRING, description: "A data de vencimento no formato YYYY-MM-DD (se aplicável)." }
    },
    required: ["title"]
  }
};

const completeTaskTool: FunctionDeclaration = {
  name: "complete_task",
  description: "Marca uma tarefa existente como concluída.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      taskTitle: { type: Type.STRING, description: "O nome ou título da tarefa a ser concluída" }
    },
    required: ["taskTitle"]
  }
};

const addTransactionTool: FunctionDeclaration = {
  name: "add_transaction",
  description: "Adiciona um novo gasto, transação ou dinheiro recebido na carteira do usuário.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "O nome / local da transação." },
      amount: { type: Type.NUMBER, description: "O valor da transação em Reais (Ex: 15.50)." },
      type: { type: Type.STRING, description: "Tipo da transação: 'income' (receita) ou 'expense' (despesa)." },
      category: { type: Type.STRING, description: "Categoria (ex: 'Alimentação', 'Transporte', 'Assinatura', 'Salário')." },
      date: { type: Type.STRING, description: "A data da transação no formato YYYY-MM-DD" }
    },
    required: ["title", "amount", "type", "category"]
  }
};

const GLOBAL_SYSTEM_PROMPT = `Você é o Mentor Focus, a inteligência artificial de alta performance do aplicativo Nexus. Seu papel é atuar como um mentor implacável, porém encorajador, focado em produtividade e disciplina. Suas regras: 1. Tom de voz direto, assertivo e maduro. 2. Use frases curtas e de impacto. 3. Evite excesso de emojis. 4. Ao falar de metas ou finanças, exija constância e chame o usuário para a responsabilidade. 5. Nunca se apresente como um modelo de linguagem, você é o Mentor Focus.`;

const CANDIDATE_MODELS = ["gemini-3.5-flash", "gemini-3.6-flash", "gemini-flash-latest"];

/**
 * Sanitiza o histórico de mensagens para o padrão estrito exigido pelo Google Gemini:
 * 1. Papéis (roles) mapeados exclusivamente para 'user' e 'model'.
 * 2. O primeiro turno no histórico OBRIGATORIAMENTE deve ser com role 'user'.
 * 3. Alternância estrita de turnos (user -> model -> user -> model...).
 * 4. Evita duplicação caso a última mensagem do histórico seja a mensagem atual que está sendo enviada.
 */
function sanitizeGeminiHistory(rawHistory: any[], currentText?: string): { role: 'user' | 'model'; parts: { text: string }[] }[] {
  if (!Array.isArray(rawHistory) || rawHistory.length === 0) {
    return [];
  }

  const validItems: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];

  for (const item of rawHistory) {
    if (!item) continue;

    let text = '';
    if (typeof item.parts === 'string') {
      text = item.parts;
    } else if (Array.isArray(item.parts) && item.parts.length > 0) {
      text = item.parts
        .map((p: any) => (typeof p === 'string' ? p : p?.text || ''))
        .filter(Boolean)
        .join(' ')
        .trim();
    } else if (typeof item.text === 'string') {
      text = item.text.trim();
    } else if (typeof item.content === 'string') {
      text = item.content.trim();
    }

    if (!text) continue;

    const rawRole = (item.role || item.sender || '').toString().toLowerCase();
    const role: 'user' | 'model' = (rawRole === 'model' || rawRole === 'ai' || rawRole === 'assistant' || rawRole === 'bot')
      ? 'model'
      : 'user';

    validItems.push({
      role,
      parts: [{ text }]
    });
  }

  // Remove a última mensagem caso seja mensagem de usuário igual ao texto enviado atualmente
  if (currentText && validItems.length > 0) {
    const lastItem = validItems[validItems.length - 1];
    if (lastItem.role === 'user' && lastItem.parts[0]?.text?.trim() === currentText.trim()) {
      validItems.pop();
    }
  }

  // O Gemini exige que a primeira mensagem no histórico seja com role 'user'
  while (validItems.length > 0 && validItems[0].role !== 'user') {
    validItems.shift();
  }

  // Garante a alternância estrita de papéis: user, model, user, model...
  const sanitized: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];
  for (const item of validItems) {
    if (sanitized.length === 0) {
      if (item.role === 'user') {
        sanitized.push(item);
      }
    } else {
      const prev = sanitized[sanitized.length - 1];
      if (prev.role === item.role) {
        prev.parts[0].text += `\n${item.parts[0].text}`;
      } else {
        sanitized.push(item);
      }
    }
  }

  return sanitized;
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // =========================================================================
  // Rota Mercado Pago: Guest Checkout Binding Webhook
  // =========================================================================
  
  // Endpoint de diagnóstico e status do Webhook (GET)
  app.get("/api/webhooks/mercadopago", (req, res) => {
    res.status(200).json({
      service: "Mercado Pago Webhook Gateway",
      status: "active",
      endpoint: "POST /api/webhooks/mercadopago",
      authConfigured: {
        hasAccessToken: Boolean(mpAccessToken),
        hasWebhookSecret: Boolean(mpWebhookSecret),
        firebaseAdminReady: Boolean(getApps().length)
      }
    });
  });

  // Endpoint principal do Webhook (POST)
  app.post("/api/webhooks/mercadopago", async (req, res) => {
    // 1. Responder status 200 IMEDIATAMENTE para evitar timeout e retentativas do Mercado Pago
    res.status(200).json({ received: true, status: "processing", timestamp: new Date().toISOString() });

    try {
      const body = req.body || {};
      const query = req.query || {};

      // Mercado Pago envia o ID via body.data.id, query['data.id'] ou query.id
      const rawId = body.data?.id || query["data.id"] || query.id;
      const topic = (body.type || body.action || query.topic || query.type || "").toString();

      if (!rawId) {
        console.log("[Webhook MP] Notificação recebida sem ID de recurso.");
        return;
      }

      // Filtra apenas eventos relacionados a pagamento
      if (topic && !topic.includes("payment") && topic !== "payment.created" && topic !== "payment.updated") {
        console.log(`[Webhook MP] Tópico ignorado (${topic}) para ID ${rawId}.`);
        return;
      }

      const paymentId = String(rawId);
      console.log(`[Webhook MP] Recebida notificação para o pagamento ID: ${paymentId}`);

      // 2. Validação da Origem da Requisição
      // A) Validação criptográfica via HMAC (x-signature) se o segredo estiver configurado
      const xSignature = req.headers["x-signature"] as string | undefined;
      const xRequestId = req.headers["x-request-id"] as string | undefined;

      if (mpWebhookSecret) {
        const isSignatureValid = verifyMercadoPagoSignature(xSignature, xRequestId, paymentId, mpWebhookSecret);
        if (!isSignatureValid) {
          console.warn(`[Webhook MP] ALERTA DE SEGURANÇA: Assinatura x-signature inválida para o pagamento ${paymentId}!`);
          return;
        }
        console.log(`[Webhook MP] Assinatura criptográfica x-signature validada para o pagamento ${paymentId}.`);
      }

      // B) Consulta autoritativa direta à API do Mercado Pago
      // Garante autenticidade total dos dados (status e payer.email) diretamente dos servidores do MP
      let paymentData: any = null;

      if (mpPayment) {
        try {
          paymentData = await mpPayment.get({ id: paymentId });
        } catch (apiErr: any) {
          console.error(`[Webhook MP] Falha ao consultar pagamento no SDK MP: ${apiErr?.message}`);
        }
      } else if (mpAccessToken) {
        try {
          const apiRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: { Authorization: `Bearer ${mpAccessToken}` }
          });
          if (apiRes.ok) {
            paymentData = await apiRes.json();
          } else {
            console.error(`[Webhook MP] API do MP retornou erro HTTP: ${apiRes.status}`);
          }
        } catch (fetchErr: any) {
          console.error(`[Webhook MP] Erro ao consultar API MP via fetch: ${fetchErr?.message}`);
        }
      } else {
        console.warn("[Webhook MP] MERCADOPAGO_ACCESS_TOKEN não configurado no .env! Utilizando payload bruto (modo preview).");
        paymentData = body.data || body;
      }

      if (!paymentData) {
        console.error(`[Webhook MP] Não foi possível obter os dados do pagamento ${paymentId}.`);
        return;
      }

      const paymentStatus = paymentData.status;
      console.log(`[Webhook MP] Pagamento ${paymentId} status: "${paymentStatus}"`);

      // 3. Processar apenas pagamentos aprovados ("approved")
      if (paymentStatus !== "approved") {
        console.log(`[Webhook MP] Pagamento ${paymentId} não está aprovado (status: "${paymentStatus}"). Ignorando.`);
        return;
      }

      // 4. Extrair o e-mail do cliente (payer.email)
      const rawEmail = paymentData.payer?.email || paymentData.external_reference || paymentData.metadata?.email;
      if (!rawEmail || typeof rawEmail !== "string") {
        console.error(`[Webhook MP] Pagamento ${paymentId} aprovado, porém sem e-mail do comprador!`, paymentData.payer);
        return;
      }

      const payerEmail = rawEmail.trim().toLowerCase();
      console.log(`[Webhook MP] Pagamento APROVADO! Aplicando Guest Checkout Binding para o e-mail: ${payerEmail}`);

      // 5. Firebase Admin SDK: Criar/atualizar documento na coleção 'users' com o ID sendo o e-mail
      const emailDocRef = adminDb.collection("users").doc(payerEmail);
      await emailDocRef.set({
        email: payerEmail,
        isPremium: true,
        role: "premium_user",
        plan: "pro_unlimited",
        lastPaymentId: paymentId,
        paymentMethod: paymentData.payment_method_id || "mercadopago",
        transactionAmount: paymentData.transaction_amount || 0,
        approvedAt: paymentData.date_approved || new Date().toISOString(),
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });

      console.log(`[Webhook MP] Documento users/${payerEmail} atualizado com isPremium: true com sucesso!`);

      // 6. Vinculação Adicional com Contas UID (Google Sign-In)
      // Se o usuário já tiver conta criada com o mesmo e-mail (onde o ID do documento é o UID),
      // atualizamos também o documento do UID para liberação em tempo real no Dashboard
      try {
        const matchingUsersSnap = await adminDb.collection("users").where("email", "==", payerEmail).get();
        const batch = adminDb.batch();
        let boundCount = 0;

        matchingUsersSnap.forEach((userDoc) => {
          if (userDoc.id !== payerEmail) {
            batch.set(userDoc.ref, {
              isPremium: true,
              lastPaymentId: paymentId,
              updatedAt: FieldValue.serverTimestamp()
            }, { merge: true });
            boundCount++;
          }
        });

        if (boundCount > 0) {
          await batch.commit();
          console.log(`[Webhook MP] Guest Checkout sincronizado com ${boundCount} conta(s) existente(s) do usuário (UIDs).`);
        }
      } catch (bindError: any) {
        console.warn("[Webhook MP] Erro ao sincronizar contas com UID:", bindError?.message);
      }

    } catch (error: any) {
      console.error("[Webhook MP] Erro inesperado ao processar webhook:", error);
    }
  });

  // Push Notification Endpoints
  app.get("/api/vapidPublicKey", (req, res) => {
    res.json({ publicKey: vapidPublicKey });
  });

  app.post("/api/notifications/subscribe", (req, res) => {
    const subscription = req.body;
    subscriptions.push(subscription);
    res.status(201).json({ success: true });
  });

  app.post("/api/notifications/send", async (req, res) => {
    const { title, body, url } = req.body;
    
    const notificationPayload = JSON.stringify({
      title,
      body,
      url: url || "/",
    });

    try {
      const promises = subscriptions.map((sub) =>
        webpush.sendNotification(sub, notificationPayload).catch((error) => {
          console.error("Error sending notification:", error);
        })
      );
      await Promise.all(promises);
      res.status(200).json({ success: true, message: "Notifications sent" });
    } catch (err) {
      res.status(500).json({ error: "Failed to send notifications" });
    }
  });

  // API route for categorization
  app.post("/api/categorize", async (req, res) => {
    try {
      const { title, type } = req.body;
      
      if (!title) {
        return res.status(400).json({ error: "No title provided" });
      }

      const apiKey = process.env.GEMINI_API_KEY?.trim() || process.env.VITE_GEMINI_API_KEY?.trim();
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const incomeCategories = ['Salário', 'Investimento', 'Venda', 'Outros'];
      const expenseCategories = ['Alimentação', 'Transporte', 'Saúde', 'Moradia', 'Lazer', 'Serviços', 'Mercado', 'Outros'];
      
      const categories = type === 'income' ? incomeCategories : expenseCategories;
      
      const prompt = `Classifique a seguinte transação: "${title}".
Tipo da transação: ${type === 'income' ? 'Receita' : 'Despesa'}.
Categorias disponíveis: ${categories.join(', ')}.
Responda APENAS com o nome exato da categoria que melhor se encaixa, sem nenhuma palavra adicional ou pontuação. Se não souber, responda "Outros".`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          temperature: 0.1, // low temperature for more deterministic output
        }
      });

      let suggestedCategory = response.text?.trim() || "Outros";
      if (!categories.includes(suggestedCategory)) {
        suggestedCategory = "Outros";
      }

      res.json({ category: suggestedCategory });
    } catch (error: any) {
      console.error("Gemini API Categorize Error:", error);
      res.status(500).json({ error: error.message || "Failed to categorize transaction" });
    }
  });

  // API route for Gemini chat & Mentor Focus
  app.post("/api/chat", async (req, res) => {
    console.log('Payload Recebido no Chat:', req.body);
    try {
      const { text, message, focusTime, history = [], userAgeContext, userDataContext, imageBase64, imageMimeType, currentDate } = req.body || {};
      const userText = (text || message || '').trim();

      const apiKey = process.env.GEMINI_API_KEY?.trim() || process.env.VITE_GEMINI_API_KEY?.trim();

      if (!apiKey) {
        console.error("❌ [API /api/chat] Erro: GEMINI_API_KEY (ou VITE_GEMINI_API_KEY) não encontrada nas variáveis de ambiente (.env).");
        return res.status(500).json({ error: "GEMINI_API_KEY não configurada no servidor (.env)" });
      }

      const genAI = new GoogleGenerativeAI(apiKey);

      // Tratamento especial para requisições de avaliação de foco (Focus Mode)
      if (focusTime !== undefined && focusTime !== null) {
        let feedback = "";
        let lastFocusErr: any = null;

        for (const modelName of CANDIDATE_MODELS) {
          try {
            const mentorModel = genAI.getGenerativeModel({
              model: modelName,
              systemInstruction: "Você é o Mentor Focus, uma IA de alta performance e mentoria do aplicativo Nexus Focus. Tom direto, assertivo, maduro, sem emojis. Exalte a disciplina do usuário por cumprir o tempo de foco e cobre a próxima meta em no máximo 2 frases curtas. Nunca diga que é uma IA."
            });

            const promptText = `O usuário finalizou um foco ininterrupto de ${focusTime} minutos. Gere o feedback imediato.`;
            const result = await mentorModel.generateContent(promptText);
            const response = await result.response;
            feedback = response.text()?.trim() || "";
            if (feedback) break;
          } catch (err: any) {
            lastFocusErr = err;
            console.warn(`Focus feedback com ${modelName} falhou: ${err.message || err}. Tentando próximo modelo...`);
          }
        }

        if (!feedback) {
          feedback = "Disciplina exemplar ao sustentar seu tempo de foco. Mantenha o ritmo inabalável e avance para o próximo objetivo agora.";
        }

        return res.json({ text: feedback, feedback: feedback, reply: feedback });
      }

      if (!userText && !imageBase64) {
        return res.status(400).json({ error: "No text or image provided" });
      }

      let systemInstruction = `${GLOBAL_SYSTEM_PROMPT}

Data e hora atual do sistema do usuário: ${currentDate || new Date().toISOString()}.
Se o usuário pedir para adicionar um compromisso, tarefa ou lançamento financeiro, chame as ferramentas necessárias (add_task, add_transaction, complete_task) e responda confirmando de forma direta e assertiva o que foi executado.`;

      if (userAgeContext) {
        systemInstruction += `\nIMPORTANTE DE CONTEXTO DO USUÁRIO: ${userAgeContext} SINTETIZE a sua resposta filtrando os conselhos que julgar adequados especificamente para a faixa etária informada.`;
      }
      
      if (userDataContext) {
        systemInstruction += `\n\n${userDataContext}`;
      }

      const sanitizedHistory = sanitizeGeminiHistory(history, userText);

      const promptParts: any[] = [];
      if (userText) promptParts.push(userText);
      if (imageBase64 && imageMimeType) {
        promptParts.push({
          inlineData: {
            data: imageBase64,
            mimeType: imageMimeType
          }
        });
      }

      let response: any = null;
      let lastError: any = null;

      for (const modelName of CANDIDATE_MODELS) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction,
            tools: [{ functionDeclarations: [addTaskTool, addTransactionTool, completeTaskTool] }] as any
          });

          if (sanitizedHistory.length > 0) {
            const chat = model.startChat({
              history: sanitizedHistory
            });
            const result = await chat.sendMessage(promptParts);
            response = await result.response;
          } else {
            const result = await model.generateContent(promptParts);
            response = await result.response;
          }

          if (response) {
            break;
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`Tentativa com modelo ${modelName} falhou: ${err.message || err}. Tentando próximo modelo...`);
        }
      }

      if (!response) {
        throw lastError || new Error("Falha ao comunicar com os modelos da IA.");
      }

      let functionCalls: any[] = [];
      try {
        if (typeof response.functionCalls === 'function') {
          functionCalls = response.functionCalls() || [];
        }
      } catch (fErr) {
        // Sem chamadas de função
      }

      // Fast-Track de Function Calling:
      // Se o Gemini acionou ferramentas (add_task, add_transaction, complete_task),
      // interrompe o fluxo imediatamente sem fazer uma segunda viagem (roundtrip) ao modelo.
      if (functionCalls && functionCalls.length > 0) {
        const fastTrackText = "Ação executada. Foco mantido.";
        return res.json({
          text: fastTrackText,
          feedback: fastTrackText,
          reply: fastTrackText,
          functionCalls
        });
      }

      let replyText = "";
      try {
        replyText = response.text()?.trim() || "";
      } catch (textErr) {
        // Sem texto na resposta
      }

      if (!replyText) {
        replyText = "Foco mantido. Prossiga para o próximo passo.";
      }

      return res.json({ 
        text: replyText,
        feedback: replyText,
        reply: replyText,
        functionCalls: []
      });
    } catch (error: any) {
      console.error('Erro na Rota Chat:', error);
      
      const errorMessage = error?.message || "";
      if (errorMessage.includes("leaked") || errorMessage.includes("403")) {
        return res.json({ text: "Minha API Key do Gemini foi reportada como vazada/inválida. Por favor, acesse as configurações do aplicativo e atualize sua GEMINI_API_KEY." });
      }

      res.status(500).json({ error: error.message || "Failed to communicate with AI" });
    }
  });

  // Mentor Focus Feedback Endpoint (Google Gemini SDK)
  app.post("/api/mentor/feedback", async (req, res) => {
    console.log('Payload Recebido no Mentor Feedback:', req.body);
    try {
      const { focusTime } = req.body || {};

      if (focusTime === undefined || focusTime === null) {
        console.warn("⚠️ [API /api/mentor/feedback] Requisição recebida sem o parâmetro 'focusTime'.");
        return res.status(400).json({ error: "O campo focusTime (em minutos) é obrigatório." });
      }

      const apiKey = process.env.GEMINI_API_KEY?.trim() || process.env.VITE_GEMINI_API_KEY?.trim();

      if (!apiKey) {
        console.error("❌ [API /api/mentor/feedback] Erro: GEMINI_API_KEY (ou VITE_GEMINI_API_KEY) não encontrada nas variáveis de ambiente (.env).");
        return res.status(500).json({ 
          error: "GEMINI_API_KEY não configurada no servidor. Verifique seu arquivo .env.",
          code: "MISSING_API_KEY"
        });
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      let generatedFeedback = "";

      for (const modelName of CANDIDATE_MODELS) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: "Você é o Mentor Focus, uma IA de alta performance e mentoria do aplicativo Nexus Focus. Tom direto, assertivo, maduro, sem emojis. Exalte a disciplina do usuário por cumprir o tempo de foco e cobre a próxima meta em no máximo 2 frases curtas. Nunca diga que é uma IA."
          });

          const userPrompt = `O usuário finalizou um foco ininterrupto de ${focusTime} minutos. Gere o feedback imediato.`;
          const result = await model.generateContent(userPrompt);
          const response = await result.response;
          generatedFeedback = response.text()?.trim() || "";
          if (generatedFeedback) break;
        } catch (err: any) {
          console.warn(`Feedback modelo ${modelName} falhou: ${err.message}. Tentando próximo modelo...`);
        }
      }

      if (!generatedFeedback) {
        generatedFeedback = "Disciplina exemplar ao sustentar seu tempo de foco. Mantenha o ritmo inabalável e avance para o próximo objetivo agora.";
      }

      return res.json({ feedback: generatedFeedback, text: generatedFeedback, reply: generatedFeedback });
    } catch (error: any) {
      console.error('Erro na Rota Mentor Feedback:', error);

      return res.status(500).json({ 
        error: "Falha ao gerar feedback do Mentor Focus via Gemini.", 
        details: error?.message || "Internal Server Error"
      });
    }
  });

  // WhatsApp Webhook Verification (Meta WhatsApp Cloud API)
  app.get("/api/whatsapp/webhook", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === "mentor_whatsapp_token") {
      console.log("WhatsApp Webhook verified successfully!");
      return res.status(200).send(challenge);
    }
    
    // Default GET status response
    return res.json({
      status: "active",
      service: "Mentor Focus WhatsApp Webhook Gateway",
      verifyToken: "mentor_whatsapp_token",
      documentation: "Envie mensagens POST em JSON com os campos { from, text, userId }"
    });
  });

  // WhatsApp Webhook Message Handler
  app.post("/api/whatsapp/webhook", async (req, res) => {
    try {
      const body = req.body || {};

      // Parse text and sender from various WhatsApp API providers (Meta Cloud API, Evolution, Z-API, Twilio, Direct)
      let text = "";
      let from = "whatsapp_user";
      let userId = body.userId;

      // Meta Cloud API Format
      if (body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
        const message = body.entry[0].changes[0].value.messages[0];
        from = message.from || from;
        if (message.type === "text") {
          text = message.text?.body || "";
        } else if (message.type === "audio") {
          text = "[Áudio do WhatsApp recebido]";
        }
      } 
      // Evolution API / Z-API / Baileys Format
      else if (body.data?.message) {
        from = body.data.key?.remoteJid?.split("@")[0] || body.sender || from;
        text = body.data.message.conversation || body.data.message.extendedTextMessage?.text || "";
      }
      // Twilio WhatsApp Format
      else if (body.Body) {
        text = body.Body;
        from = body.From || from;
      }
      // Direct / Simulator Standard Format
      else {
        text = body.text || body.message || body.caption || "";
        from = body.from || body.sender || body.phone || from;
      }

      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Nenhuma mensagem de texto válida encontrada na requisição do WhatsApp" });
      }

      const apiKey = process.env.GEMINI_API_KEY?.trim() || process.env.VITE_GEMINI_API_KEY?.trim();
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
      }

      const ai = new GoogleGenAI({ apiKey });

      const systemInstruction = `${GLOBAL_SYSTEM_PROMPT}

Sua missão no WhatsApp é entender o texto enviado pelo usuário (lançamento financeiro, receita, despesa, lembrete ou tarefa) e acionar as ferramentas de criação de dados (add_transaction, add_task, complete_task). Confirme de forma direta, clara e curta o que foi registrado no aplicativo Nexus.
Data e hora atual: ${body.currentDate || new Date().toISOString()}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [{ role: 'user', parts: [{ text }] }],
        config: {
          systemInstruction,
          temperature: 0.5,
          tools: [{ functionDeclarations: [addTaskTool, addTransactionTool, completeTaskTool] }]
        }
      });

      const mentorReply = response.text || "Lançamento processado com sucesso.";

      res.json({
        success: true,
        reply: mentorReply,
        functionCalls: response.functionCalls || [],
        sender: from,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("WhatsApp Webhook Error:", error);
      res.status(500).json({
        error: error.message || "Erro ao processar mensagem do WhatsApp",
        reply: "Ops! Não consegui processar essa mensagem agora. Tente novamente em instantes."
      });
    }
  });

  // Health Check Route
  app.get('/', (req, res) => res.status(200).json({ status: 'Nexus Focus API Online', version: '1.0' }));

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
