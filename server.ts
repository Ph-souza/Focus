import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import path from "path";
import crypto from "crypto";
import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { MercadoPagoConfig, Payment, PreApproval } from "mercadopago";
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import webpush from "web-push";

// Firebase Admin SDK initialization (Singleton)
let adminApp: App;
if (!getApps().length) {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || "planner-com-ia-assistant";

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
const mpPreApproval = mpClient ? new PreApproval(mpClient) : null;

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

  // =========================================================================
  // Rota de Assinaturas Recorrentes (PreApproval / Subscriptions)
  // =========================================================================
  app.post("/api/subscriptions", async (req, res) => {
    try {
      const { token, email, userId, planId } = req.body || {};

      if (!token) {
        return res.status(400).json({ success: false, error: "Token do cartão não fornecido." });
      }

      if (!email || typeof email !== "string") {
        return res.status(400).json({ success: false, error: "E-mail do usuário não fornecido ou inválido." });
      }

      const payerEmail = email.trim().toLowerCase();
      console.log(`[Assinaturas MP] Criando assinatura para o cliente: ${payerEmail}`);

      if (!mpClient && !mpAccessToken) {
        return res.status(500).json({
          success: false,
          error: "MERCADOPAGO_ACCESS_TOKEN não configurado no servidor."
        });
      }

      const selectedPlanId = planId || process.env.MERCADOPAGO_PLAN_ID;
      const amount = Number(process.env.SUBSCRIPTION_AMOUNT || 29.90);
      const appUrl = process.env.APP_URL || "https://nexusfocus.web.app";

      // Montar corpo da requisição de PreApproval
      const preapprovalPayload: any = {
        payer_email: payerEmail,
        card_token_id: token,
        back_url: `${appUrl}/dashboard`,
        status: "authorized"
      };

      if (selectedPlanId) {
        preapprovalPayload.preapproval_plan_id = selectedPlanId;
      } else {
        preapprovalPayload.reason = "Nexus Focus Pro - Assinatura Mensal";
        preapprovalPayload.auto_recurring = {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: amount,
          currency_id: "BRL"
        };
      }

      let subscriptionResult: any = null;

      if (mpPreApproval) {
        subscriptionResult = await mpPreApproval.create({ body: preapprovalPayload });
      } else {
        const response = await fetch("https://api.mercadopago.com/preapproval", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${mpAccessToken}`
          },
          body: JSON.stringify(preapprovalPayload)
        });

        subscriptionResult = await response.json();

        if (!response.ok) {
          throw new Error(subscriptionResult?.message || subscriptionResult?.cause?.[0]?.description || "Falha na criação da assinatura no Mercado Pago");
        }
      }

      console.log("[Assinaturas MP] Resposta da criação no MP:", subscriptionResult);

      const subscriptionId = subscriptionResult?.id;
      const status = subscriptionResult?.status; // 'authorized', 'pending', etc.

      // Se a assinatura foi autorizada ou está pendente de confirmação bancária
      if (status === "authorized" || status === "pending") {
        // 1. Atualizar documento users/{payerEmail}
        const emailRef = adminDb.collection("users").doc(payerEmail);
        await emailRef.set({
          email: payerEmail,
          isPremium: true,
          role: "premium_user",
          plan: "pro_unlimited",
          subscriptionId: subscriptionId,
          subscriptionStatus: status,
          subscribedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });

        // 2. Se o userId (UID do Firebase Auth) foi enviado, atualizar users/{userId}
        if (userId && typeof userId === "string") {
          const userRef = adminDb.collection("users").doc(userId);
          await userRef.set({
            isPremium: true,
            subscriptionId: subscriptionId,
            subscriptionStatus: status,
            updatedAt: FieldValue.serverTimestamp()
          }, { merge: true });
        }

        // 3. Sincronizar qualquer outra conta matching pelo e-mail
        try {
          const querySnap = await adminDb.collection("users").where("email", "==", payerEmail).get();
          const batch = adminDb.batch();
          querySnap.forEach((docSnap) => {
            if (docSnap.id !== payerEmail && docSnap.id !== userId) {
              batch.set(docSnap.ref, {
                isPremium: true,
                subscriptionId: subscriptionId,
                subscriptionStatus: status,
                updatedAt: FieldValue.serverTimestamp()
              }, { merge: true });
            }
          });
          await batch.commit();
        } catch (e: any) {
          console.warn("[Assinaturas MP] Aviso na sincronização secundária:", e?.message);
        }

        return res.status(200).json({
          success: true,
          status,
          subscriptionId,
          message: "Assinatura ativada com sucesso!"
        });
      } else {
        return res.status(400).json({
          success: false,
          status,
          error: "Não foi possível autorizar o cartão para a assinatura recorrente."
        });
      }
    } catch (err: any) {
      console.error("[Assinaturas MP] Erro ao processar assinatura:", err);
      return res.status(500).json({
        success: false,
        error: err?.message || "Erro interno ao processar assinatura."
      });
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

  /**
   * Helper para envio de mensagens de saída para o WhatsApp via Meta Cloud API
   */
  async function sendWhatsAppTextMessage(to: string, messageText: string, phoneNumberId?: string): Promise<any> {
    const token = process.env.META_ACCESS_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_USER_ACCESS_TOKEN;
    const phoneId = phoneNumberId || process.env.META_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_NUMBER_ID || "1262215520309953";

    if (!token) {
      console.log(`[WhatsApp Outbound] Aviso: Token da Meta não configurado. Mensagem para ${to} não despachada na API externa.`);
      return null;
    }

    try {
      const url = `https://graph.facebook.com/v25.0/${phoneId}/messages`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "text",
          text: { body: messageText }
        })
      });

      const data = await res.json();
      if (!res.ok) {
        console.warn(`[WhatsApp Outbound] Erro retornado pela Meta ao enviar para ${to}:`, data);
      } else {
        console.log(`[WhatsApp Outbound] Resposta enviada com sucesso para [${to}] (ID: ${data.messages?.[0]?.id})`);
      }
      return data;
    } catch (err: any) {
      console.error(`[WhatsApp Outbound] Falha na requisição para a Meta:`, err?.message);
      return null;
    }
  }

  // =========================================================================
  // WhatsApp Webhook Verification (Meta WhatsApp Cloud API) - Painel Developers
  // =========================================================================
  app.get(["/api/webhooks/whatsapp", "/api/whatsapp/webhook"], (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    
    const configuredToken = process.env.META_WEBHOOK_VERIFY_TOKEN || process.env.META_WEBHOOK_VERIFY_TOKEN_TEST || "nexus_flow_whatsapp_secure_focus_5263";
    
    if (mode === "subscribe" && (token === configuredToken || token === process.env.META_WEBHOOK_VERIFY_TOKEN_TEST || token === "nexus_flow_whatsapp_secure_focus_5263")) {
      console.log("Meta WhatsApp Webhook verificado com sucesso!");
      return res.status(200).send(challenge);
    }
    
    return res.sendStatus(403);
  });

  // =========================================================================
  // Processamento Assíncrono do Webhook da Meta (Cloud API)
  // =========================================================================
  async function processMetaWebhookAsync(body: any) {
    try {
      // 1. Parsing do Payload e validação de segurança
      if (body?.object !== "whatsapp_business_account") {
        return;
      }

      const entry = body.entry?.[0];
      const change = entry?.changes?.[0];
      const value = change?.value;

      if (!value) {
        return;
      }

      // 2. Tratamento seguro de payloads de status (como 'sent', 'delivered', 'read')
      if (value.statuses && Array.isArray(value.statuses) && value.statuses.length > 0) {
        // Confirmação de status de entrega/leitura da Meta, ignorar sem erros
        return;
      }

      // 3. Validação de mensagens recebidas
      const messages = value.messages;
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return;
      }

      const messageObj = messages[0];
      const phoneId = value.metadata?.phone_number_id;

      // Ignora mensagens que não sejam do tipo texto (ex: mídias, contatos, localização)
      if (messageObj.type !== "text") {
        console.log(`[WhatsApp Webhook] Mensagem de tipo '${messageObj.type}' recebida. Apenas mensagens de texto são processadas no momento.`);
        return;
      }

      // 4. Extração de Dados
      // Capture o número de quem enviou: entry[0].changes[0].value.messages[0].from
      const from = messageObj.from;
      // Capture o texto da mensagem: entry[0].changes[0].value.messages[0].text.body
      const text = messageObj.text?.body || "";

      if (!from || !text) {
        return;
      }

      // 5. Log de Sucesso formatado para monitoramento na Render
      console.log(`Mensagem recebida de [${from}]: [${text}]`);

      // 6. Lógica do Token Mágico de Ativação (Handshake)
      // Verifica se o texto contém o padrão de ativação (ex: 'Meu código é: NEXUS-' ou formato NEXUS-[A-Z0-9]+)
      const tokenMatch = text.match(/NEXUS-[A-Z0-9]+/i);
      if (tokenMatch) {
        const tokenStr = tokenMatch[0].toUpperCase();
        console.log(`🔍 [WhatsApp Webhook] Token de ativação detectado: ${tokenStr}. Validando no Firestore...`);

        try {
          const tokenRef = adminDb.collection("whatsapp_tokens").doc(tokenStr);
          const tokenSnap = await tokenRef.get();

          if (tokenSnap.exists) {
            const tokenData = tokenSnap.data();
            let isValid = true;

            if (tokenData?.expiresAt) {
              const expiresDate = tokenData.expiresAt.toDate ? tokenData.expiresAt.toDate() : new Date(tokenData.expiresAt);
              if (new Date() > expiresDate) {
                isValid = false;
              }
            }

            if (isValid) {
              const uId = tokenData?.userId;
              if (uId) {
                // Atualiza o documento do usuário (users/{userId}) adicionando whatsappNumber
                await adminDb.collection("users").doc(uId).set({
                  whatsappNumber: from,
                  whatsappVerified: true,
                  updatedAt: FieldValue.serverTimestamp()
                }, { merge: true });

                console.log(`🎉 [WhatsApp Webhook] Usuário '${uId}' vinculado com sucesso ao número ${from}!`);

                // Deleta o token para segurança (uso único)
                await tokenRef.delete();

                // Envia resposta de confirmação imediata no WhatsApp
                await sendWhatsAppTextMessage(
                  from,
                  "Conexão estabelecida com sucesso! O Mentor Nexus Flow está ativo e pronto para organizar sua rotina.",
                  phoneId
                );
                return;
              }
            } else {
              console.warn(`⚠️ [WhatsApp Webhook] Token ${tokenStr} já está expirado.`);
              await sendWhatsAppTextMessage(
                from,
                "Este código de ativação já expirou. Por favor, gere um novo código no Dashboard do Nexus Focus.",
                phoneId
              );
              return;
            }
          } else {
            console.warn(`⚠️ [WhatsApp Webhook] Token ${tokenStr} não localizado no Firestore.`);
          }
        } catch (dbErr: any) {
          console.error("❌ [WhatsApp Webhook] Erro ao consultar token no Firestore:", dbErr?.message);
        }
        return;
      }

      // 7. Mensagem regular do usuário: Processar com a IA (Mentor Focus)
      try {
        // Buscar se este número pertence a um usuário cadastrado
        const userQuery = await adminDb.collection("users").where("whatsappNumber", "==", from).limit(1).get();

        if (userQuery.empty) {
          console.log(`[WhatsApp Webhook] Número não vinculado a nenhuma conta Nexus: ${from}`);
          await sendWhatsAppTextMessage(
            from,
            "Olá! Não localizamos uma conta Nexus Focus vinculada a este número de WhatsApp. Acesse seu painel no Nexus Focus e gere o código de ativação na aba WhatsApp.",
            phoneId
          );
          return;
        }

        const userDoc = userQuery.docs[0];
        const linkedUserId = userDoc.id;

        const apiKey = getGeminiApiKey();
        if (!apiKey) {
          console.error("❌ [WhatsApp Webhook] GEMINI_API_KEY não configurada.");
          return;
        }

        const ai = new GoogleGenAI({ apiKey });
        const systemInstruction = `${GLOBAL_SYSTEM_PROMPT}

Sua missão no WhatsApp é entender o texto enviado pelo usuário (lançamento financeiro, receita, despesa, lembrete ou tarefa) e acionar as ferramentas de criação de dados (add_transaction, add_task, complete_task). Confirme de forma direta, clara e curta o que foi registrado no aplicativo Nexus.
Data e hora atual: ${new Date().toISOString()}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: [{ role: 'user', parts: [{ text }] }],
          config: {
            systemInstruction,
            temperature: 0.5,
            tools: [{ functionDeclarations: [addTaskTool, addTransactionTool, completeTaskTool] }]
          }
        });

        const replyText = response.text || "Lançamento processado com sucesso.";
        const functionCalls = response.functionCalls || [];

        // Gravar ações decididas pela IA no Firestore do usuário
        if (functionCalls.length > 0) {
          for (const call of functionCalls) {
            if (call.name === "add_transaction") {
              const { title, amount, type, category, date } = call.args as any;
              const newTxId = Date.now().toString() + Math.random().toString(36).substring(2, 7);
              await adminDb.collection("users").doc(linkedUserId).collection("transactions").doc(newTxId).set({
                id: newTxId,
                title: title || "Lançamento WhatsApp",
                amount: Number(amount) || 0,
                type: (type === "income" ? "income" : "expense"),
                category: category || "Outros",
                date: date || new Date().toISOString().split("T")[0],
                createdAt: FieldValue.serverTimestamp()
              });
              console.log(`💰 [WhatsApp AI] Transação de R$ ${amount} salva para o usuário ${linkedUserId}.`);
            } else if (call.name === "add_task") {
              const { title, deadline } = call.args as any;
              const newTaskId = Date.now().toString() + Math.random().toString(36).substring(2, 7);
              await adminDb.collection("users").doc(linkedUserId).collection("tasks").doc(newTaskId).set({
                id: newTaskId,
                title: title || "Tarefa WhatsApp",
                completed: false,
                dueDate: deadline || new Date().toISOString().split("T")[0],
                createdAt: FieldValue.serverTimestamp()
              });
              console.log(`📋 [WhatsApp AI] Tarefa '${title}' criada para o usuário ${linkedUserId}.`);
            } else if (call.name === "complete_task") {
              const { taskTitle } = call.args as any;
              const tasksSnap = await adminDb.collection("users").doc(linkedUserId).collection("tasks").where("title", "==", taskTitle).limit(1).get();
              if (!tasksSnap.empty) {
                await tasksSnap.docs[0].ref.update({
                  completed: true,
                  completedAt: FieldValue.serverTimestamp()
                });
                console.log(`✅ [WhatsApp AI] Tarefa '${taskTitle}' concluída para o usuário ${linkedUserId}.`);
              }
            }
          }
        }

        // Envia a resposta final para o usuário no WhatsApp
        await sendWhatsAppTextMessage(from, replyText, phoneId);
      } catch (aiError: any) {
        console.error("❌ [WhatsApp Webhook] Erro no processamento de IA:", aiError?.message || aiError);
        await sendWhatsAppTextMessage(
          from,
          "Ops! Ocorreu uma oscilação momentânea ao processar sua solicitação. Tente enviar novamente.",
          phoneId
        );
      }
    } catch (globalErr: any) {
      console.error("❌ [WhatsApp Webhook] Erro crítico no processamento assíncrono:", globalErr);
    }
  }

  // =========================================================================
  // Rota Principal do Webhook do WhatsApp (POST)
  // Atende tanto à Meta Cloud API quanto ao Simulador interno do App
  // =========================================================================
  app.post(["/api/webhooks/whatsapp", "/api/whatsapp/webhook"], async (req, res) => {
    const body = req.body || {};

    // 1. REQUISIÇÃO DA META CLOUD API:
    // Retorno imediato (Best Practice Meta): Retorna 200 OK de imediato para evitar retentativas e timeouts
    if (body.object === "whatsapp_business_account") {
      res.sendStatus(200);

      // Processamento assíncrono não bloqueante
      setImmediate(() => {
        processMetaWebhookAsync(body).catch((err) => {
          console.error("[WhatsApp Webhook] Erro em processMetaWebhookAsync:", err);
        });
      });
      return;
    }

    // 2. REQUISIÇÃO DO SIMULADOR DO FRONTEND / TESTES DIRETOS:
    try {
      let text = "";
      let from = "whatsapp_user";
      let userId = body.userId;

      // Suporte a formatos de simulador ou provedores secundários
      if (body.data?.message) {
        from = body.data.key?.remoteJid?.split("@")[0] || body.sender || from;
        text = body.data.message.conversation || body.data.message.extendedTextMessage?.text || "";
      } else if (body.Body) {
        text = body.Body;
        from = body.From || from;
      } else {
        text = body.text || body.message || body.caption || "";
        from = body.from || body.sender || body.phone || from;
      }

      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Nenhuma mensagem de texto válida encontrada na requisição do WhatsApp" });
      }

      console.log(`Mensagem recebida de [${from}]: [${text}]`);

      // Verificação de Handshake (Ativação de Token)
      const tokenMatch = text.match(/NEXUS-[A-Z0-9]+/i);
      if (tokenMatch) {
        const tokenStr = tokenMatch[0].toUpperCase();
        const tokenRef = adminDb.collection("whatsapp_tokens").doc(tokenStr);
        const tokenSnap = await tokenRef.get();

        if (tokenSnap.exists) {
          const tokenData = tokenSnap.data();
          if (tokenData && tokenData.expiresAt) {
            const expiresDate = tokenData.expiresAt.toDate ? tokenData.expiresAt.toDate() : new Date(tokenData.expiresAt);
            if (new Date() <= expiresDate) {
              const uId = tokenData.userId;
              await adminDb.collection("users").doc(uId).set({
                whatsappNumber: from,
                whatsappVerified: true,
                updatedAt: FieldValue.serverTimestamp()
              }, { merge: true });

              await tokenRef.delete();

              return res.json({
                success: true,
                reply: "Conexão estabelecida com sucesso! O Mentor Nexus Flow está ativo e pronto para organizar sua rotina.",
                sender: from,
                timestamp: new Date().toISOString()
              });
            } else {
              return res.json({
                success: false,
                reply: "Este código de ativação já expirou. Por favor, gere um novo código no Dashboard.",
                sender: from
              });
            }
          }
        }
      }

      const apiKey = getGeminiApiKey();
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

      return res.json({
        success: true,
        reply: mentorReply,
        functionCalls: response.functionCalls || [],
        sender: from,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("WhatsApp Webhook Error:", error);
      return res.status(500).json({
        error: error.message || "Erro ao processar mensagem do WhatsApp",
        reply: "Ops! Não consegui processar essa mensagem agora. Tente novamente em instantes."
      });
    }
  });


  // Auto-seed Pro Admin Account into Cloud Firestore (only if Admin SDK credentials are provided)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const adminEmail = "phillipe.souza27@gmail.com";
      const emailRef = adminDb.collection("users").doc(adminEmail);
      await emailRef.set({
        email: adminEmail,
        isPremium: true,
        role: "admin_pro",
        plan: "pro_unlimited",
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });

      const matchingUsersSnap = await adminDb.collection("users").where("email", "==", adminEmail).get();
      const batch = adminDb.batch();
      matchingUsersSnap.forEach((docSnap) => {
        batch.set(docSnap.ref, {
          isPremium: true,
          role: "admin_pro",
          plan: "pro_unlimited",
          updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });
      });
      await batch.commit();
      console.log(`[Auto-Seed Pro] Conta ${adminEmail} garantida com sucesso como Pro no Firestore.`);
    } catch (seedErr: any) {
      console.warn("[Auto-Seed Pro] Aviso ao inicializar conta Pro:", seedErr?.message);
    }
  } else {
    console.log("[Auto-Seed Pro] Ambiente sem FIREBASE_SERVICE_ACCOUNT_KEY. Seed ignorado localmente.");
  }

  // WhatsApp - Handshake Token Generation
  app.post('/api/whatsapp/generate-token', async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ success: false, error: "userId é obrigatório" });
      }

      const randomPart = crypto.randomBytes(2).toString('hex').toUpperCase();
      const token = `NEXUS-${randomPart}`;
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await adminDb.collection("whatsapp_tokens").doc(token).set({
        userId,
        token,
        expiresAt,
        createdAt: FieldValue.serverTimestamp()
      });

      return res.json({ success: true, token, expiresAt });
    } catch (error: any) {
      console.error("[WhatsApp] Erro ao gerar token:", error);
      return res.status(500).json({ success: false, error: "Erro interno ao gerar token" });
    }
  });

  // Admin Route to ensure Pro status on demand
  app.post('/api/admin/activate-pro', async (req, res) => {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      return res.status(503).json({ success: false, error: "FIREBASE_SERVICE_ACCOUNT_KEY not configured" });
    }
    try {
      const { email } = req.body || {};
      const targetEmail = (email || "phillipe.souza27@gmail.com").trim().toLowerCase();

      const emailRef = adminDb.collection("users").doc(targetEmail);
      await emailRef.set({
        email: targetEmail,
        isPremium: true,
        role: "admin_pro",
        plan: "pro_unlimited",
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });

      const matchingUsersSnap = await adminDb.collection("users").where("email", "==", targetEmail).get();
      const batch = adminDb.batch();
      matchingUsersSnap.forEach((docSnap) => {
        batch.set(docSnap.ref, {
          isPremium: true,
          role: "admin_pro",
          plan: "pro_unlimited",
          updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });
      });
      await batch.commit();

      return res.json({ success: true, email: targetEmail, isPremium: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message });
    }
  });

  // Health Check Route
  app.get('/', (req, res) => res.status(200).json({ status: 'Nexus Focus API Online', version: '1.0' }));

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
