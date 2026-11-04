import "dotenv/config";
import fs from "fs";
import path from "path";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, Firestore, FieldValue, DocumentReference } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// ============================================================================
// 1. INICIALIZAÇÃO DO FIREBASE ADMIN SDK
// ============================================================================
function initFirebaseAdmin(): { db: Firestore } {
  if (!getApps().length) {
    const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT;
    const candidatePaths = [
      process.env.GOOGLE_APPLICATION_CREDENTIALS,
      path.resolve(process.cwd(), "serviceAccountKey.json"),
      "C:/Users/phillipe.pimenta/Downloads/planner-com-ia-assistant-firebase-adminsdk-fbsvc-6dec991955.json"
    ].filter(Boolean) as string[];

    const existingKeyPath = candidatePaths.find((p) => fs.existsSync(p));

    if (rawJson) {
      const parsed = JSON.parse(rawJson);
      initializeApp({ credential: cert(parsed), projectId: parsed.project_id });
    } else if (existingKeyPath) {
      const parsed = JSON.parse(fs.readFileSync(existingKeyPath, "utf-8"));
      initializeApp({ credential: cert(parsed), projectId: parsed.project_id });
    } else {
      initializeApp({ projectId: "planner-com-ia-assistant" });
    }
  }
  return { db: getFirestore() };
}

// ============================================================================
// MAPEAMENTO OFICIAL DE COLEÇÕES DO NEXUS FOCUS
// ============================================================================
const USER_SUBCOLLECTIONS = [
  "tasks",         // Tarefas e projetos
  "transactions",  // Lançamentos financeiros
  "goals",         // Metas financeiras
  "rotinas",       // Blocos de rotina e agenda
  "appointments",  // Compromissos
  "chatMessages"   // Histórico do Mentor IA
] as const;

const ROOT_COLLECTIONS_TO_SCAN = [
  "users",
  "ledgers",
  "family_invites",
  "payment_orders",
  "confirmed_payments",
  "subscriptions",
  "whatsapp_tokens",
  "audit_logs",
  "logs",
  "processed_events",
  "coupons"
] as const;

const FIRESTORE_BATCH_LIMIT = 450; // Margem segura abaixo do limite rígido de 500 ops/batch do Firestore

/**
 * Executa deleção em lote (Batch Delete) respeitando o limite de 500 operações por commit do Firestore.
 */
async function commitBatchDeletions(
  db: Firestore,
  refs: DocumentReference[],
  dryRun = false
): Promise<number> {
  if (refs.length === 0) return 0;
  if (dryRun) return refs.length;

  let deletedCount = 0;
  for (let i = 0; i < refs.length; i += FIRESTORE_BATCH_LIMIT) {
    const chunk = refs.slice(i, i + FIRESTORE_BATCH_LIMIT);
    const batch = db.batch();
    for (const ref of chunk) {
      batch.delete(ref);
    }
    await batch.commit();
    deletedCount += chunk.length;
  }
  return deletedCount;
}

// ============================================================================
// 2. VARREDURA E VALIDAÇÃO DE DADOS RESIDUAIS (SCAN)
// ============================================================================
export interface ScanReport {
  timestamp: string;
  rootCollections: Record<string, number>;
  userDetails: Array<{
    docId: string;
    email?: string;
    plan?: string;
    subcollections: Record<string, number>;
    totalNestedDocs: number;
  }>;
  sharedLedgers: Array<{
    ledgerId: string;
    ownerUid?: string;
    transactionsCount: number;
    goalsCount: number;
  }>;
}

export async function scanEnvironmentResiduals(db: Firestore): Promise<ScanReport> {
  console.log("\n🔍 [1/2] Iniciando varredura de coleções raiz e subcoleções no Firestore...");

  const report: ScanReport = {
    timestamp: new Date().toISOString(),
    rootCollections: {},
    userDetails: [],
    sharedLedgers: []
  };

  for (const colName of ROOT_COLLECTIONS_TO_SCAN) {
    const snap = await db.collection(colName).get();
    report.rootCollections[colName] = snap.size;
  }

  // Inspeciona subcoleções de cada documento em `users`
  const usersSnap = await db.collection("users").get();
  for (const userDoc of usersSnap.docs) {
    const data = userDoc.data();
    const subCounts: Record<string, number> = {};
    let totalNested = 0;

    // Lista todas as subcoleções reais do documento (inclusive dinâmicas)
    const dynamicSubcollections = await userDoc.ref.listCollections();
    const subNames = Array.from(
      new Set([...USER_SUBCOLLECTIONS, ...dynamicSubcollections.map((c) => c.id)])
    );

    for (const subName of subNames) {
      const subSnap = await userDoc.ref.collection(subName).get();
      if (subSnap.size > 0) {
        subCounts[subName] = subSnap.size;
        totalNested += subSnap.size;
      }
    }

    report.userDetails.push({
      docId: userDoc.id,
      email: data.email,
      plan: data.plan,
      subcollections: subCounts,
      totalNestedDocs: totalNested
    });
  }

  // Inspeciona cofres compartilhados (`ledgers`)
  const ledgersSnap = await db.collection("ledgers").get();
  for (const ledgerDoc of ledgersSnap.docs) {
    const lData = ledgerDoc.data();
    const [txSnap, goalsSnap] = await Promise.all([
      ledgerDoc.ref.collection("transactions").get(),
      ledgerDoc.ref.collection("goals").get()
    ]);
    report.sharedLedgers.push({
      ledgerId: ledgerDoc.id,
      ownerUid: lData.ownerUid,
      transactionsCount: txSnap.size,
      goalsCount: goalsSnap.size
    });
  }

  console.log("\n📊 RESUMO DAS COLEÇÕES RAIZ:");
  console.table(report.rootCollections);

  if (report.userDetails.length > 0) {
    console.log("\n👤 DOCUMENTOS DE USUÁRIOS E SUBCOLEÇÕES ANINHADAS:");
    console.table(
      report.userDetails.map((u) => ({
        docId: u.docId,
        email: u.email || "-",
        plan: u.plan || "free",
        totalNestedDocs: u.totalNestedDocs,
        breakdown: JSON.stringify(u.subcollections)
      }))
    );
  }

  return report;
}

// ============================================================================
// 3. HARD RESET DE USUÁRIO MASTER (CASCADE BATCH DELETE SEM APAGAR AUTH)
// ============================================================================
export interface HardResetOptions {
  uid: string;
  dryRun?: boolean;
  preserveAdminRole?: boolean;
  resetGlobalTestLogs?: boolean;
}

export async function hardResetMasterUser(
  db: Firestore,
  options: HardResetOptions
) {
  const { uid, dryRun = false, preserveAdminRole = true, resetGlobalTestLogs = false } = options;

  // 1. Confirma que o usuário existe no Firebase Auth (e NUNCA deleta a conta do Auth)
  const auth = getAuth();
  let authUser: { uid: string; email?: string; displayName?: string } = { uid };
  try {
    const userRecord = await auth.getUser(uid);
    authUser = {
      uid: userRecord.uid,
      email: userRecord.email?.toLowerCase().trim(),
      displayName: userRecord.displayName || "Admin Master"
    };
    console.log(`✅ Conta Firebase Auth preservada: UID=${authUser.uid} (${authUser.email})`);
  } catch {
    const userSnap = await db.collection("users").doc(uid).get();
    if (userSnap.exists) {
      authUser.email = userSnap.data()?.email?.toLowerCase().trim();
    }
    console.warn(`⚠️ Registro Auth não consultado diretamente; operando com UID=${uid} (email=${authUser.email || "N/A"})`);
  }

  const refsToDelete: DocumentReference[] = [];
  const summary: Record<string, number> = {};

  const collectRefs = (label: string, docs: FirebaseFirestore.QueryDocumentSnapshot[]) => {
    if (docs.length > 0) {
      summary[label] = (summary[label] || 0) + docs.length;
      docs.forEach((d) => refsToDelete.push(d.ref));
    }
  };

  // 2. Varre subcoleções sob `users/{uid}` e, se existir documento espelho `users/{email}`, também sob ele
  const candidateUserDocIds = Array.from(
    new Set([uid, authUser.email].filter(Boolean) as string[])
  );

  for (const docId of candidateUserDocIds) {
    const userRef = db.collection("users").doc(docId);
    const dynamicCols = await userRef.listCollections();
    const allSubCols = Array.from(
      new Set([...USER_SUBCOLLECTIONS, ...dynamicCols.map((c) => c.id)])
    );

    for (const subCol of allSubCols) {
      const subSnap = await userRef.collection(subCol).get();
      collectRefs(`users/${docId}/${subCol}`, subSnap.docs);
    }
  }

  // 3. Cofres Familiares (`ledgers`) pertencentes ao usuário e suas subcoleções (`transactions`, `goals`)
  const ownedLedgersSnap = await db.collection("ledgers").where("ownerUid", "==", uid).get();
  for (const ledgerDoc of ownedLedgersSnap.docs) {
    const subCols = await ledgerDoc.ref.listCollections();
    for (const subCol of subCols) {
      const subSnap = await subCol.get();
      collectRefs(`ledgers/${ledgerDoc.id}/${subCol.id}`, subSnap.docs);
    }
    refsToDelete.push(ledgerDoc.ref);
    summary["ledgers (owned)"] = (summary["ledgers (owned)"] || 0) + 1;
  }

  // 4. Convites familiares (`family_invites`) criados pelo UID
  const invitesByOwner = await db.collection("family_invites").where("ownerUid", "==", uid).get();
  collectRefs("family_invites", invitesByOwner.docs);

  // 5. Ordens de pagamento, pagamentos confirmados e assinaturas de teste vinculadas ao UID/e-mail
  const ordersByUid = await db.collection("payment_orders").where("userId", "==", uid).get();
  collectRefs("payment_orders", ordersByUid.docs);

  const confirmedByUid = await db.collection("confirmed_payments").where("userId", "==", uid).get();
  collectRefs("confirmed_payments", confirmedByUid.docs);

  const subsByUid = await db.collection("subscriptions").where("userId", "==", uid).get();
  collectRefs("subscriptions (by uid)", subsByUid.docs);

  if (authUser.email) {
    const subsByEmail = await db.collection("subscriptions").where("payerEmail", "==", authUser.email).get();
    collectRefs("subscriptions (by email)", subsByEmail.docs);
  }

  // 6. Tokens de integração (WhatsApp) vinculados ao UID
  const waTokens = await db.collection("whatsapp_tokens").where("userId", "==", uid).get();
  collectRefs("whatsapp_tokens", waTokens.docs);

  // 7. Logs de auditoria e eventos de teste (opcional via --purge-logs)
  if (resetGlobalTestLogs) {
    for (const logCol of ["audit_logs", "logs", "processed_events"]) {
      const logSnap = await db.collection(logCol).get();
      collectRefs(logCol, logSnap.docs);
    }
  }

  // Deduplica referências antes do batch delete
  const uniqueRefsMap = new Map<string, DocumentReference>();
  for (const ref of refsToDelete) {
    uniqueRefsMap.set(ref.path, ref);
  }
  const uniqueRefs = Array.from(uniqueRefsMap.values());

  console.log(`\n🧹 Resumo de documentos vinculados ao usuário ${uid} (${dryRun ? "SIMULAÇÃO DRY-RUN" : "EXECUÇÃO REAL"}):`);
  console.table(summary);
  console.log(`Total de documentos aninhados/vinculados para exclusão: ${uniqueRefs.length}`);

  const totalDeleted = await commitBatchDeletions(db, uniqueRefs, dryRun);

  // 8. Reseta o documento raiz `users/{uid}` para um estado limpo de Go-Live (sem deletar a conta Auth)
  if (!dryRun) {
    const cleanMasterProfile: Record<string, any> = {
      uid,
      email: authUser.email || "",
      displayName: authUser.displayName || "Admin",
      role: preserveAdminRole ? "admin" : "user",
      plan: preserveAdminRole ? "elite" : "free",
      status: preserveAdminRole ? "active" : "inactive",
      isPremium: preserveAdminRole,
      lifetimeAccess: preserveAdminRole,
      onboardingCompleted: false,
      sharedLedgerId: FieldValue.delete(),
      whatsappNumber: FieldValue.delete(),
      iosShortcutToken: FieldValue.delete(),
      subscriptionId: FieldValue.delete(),
      subscriptionStatus: FieldValue.delete(),
      couponApplied: FieldValue.delete(),
      lastPaymentId: FieldValue.delete(),
      currentPrice: 0,
      hardResetAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };

    await db.collection("users").doc(uid).set(cleanMasterProfile, { merge: true });

    // Se havia documento duplicado indexado pelo e-mail (`users/{email}`), remove-o para evitar duplicidade
    if (authUser.email && authUser.email !== uid) {
      await db.collection("users").doc(authUser.email).delete().catch(() => { });
    }

    console.log(`✨ Hard Reset concluído! ${totalDeleted} documentos removidos e perfil 'users/${uid}' restaurado para estado limpo.`);
  } else {
    console.log(`ℹ️ [DRY-RUN] Nenhum dado foi apagado. Execute com --confirm para aplicar a limpeza.`);
  }

  return { totalDeleted, summary, dryRun };
}

// ============================================================================
// CLI RUNNER
// ============================================================================
async function main() {
  const args = process.argv.slice(2);
  const isScan = args.includes("--scan") || args.length === 0;
  const resetUidArg = args.find((a) => a.startsWith("--reset-uid="))?.split("=")[1];
  const resetEmailArg = args.find((a) => a.startsWith("--reset-email="))?.split("=")[1];
  const isConfirmed = args.includes("--confirm");
  const purgeLogs = args.includes("--purge-logs");

  const { db } = initFirebaseAdmin();

  if (isScan) {
    await scanEnvironmentResiduals(db);
  }

  let targetUid = resetUidArg;
  if (!targetUid && resetEmailArg) {
    const userRecord = await getAuth().getUserByEmail(resetEmailArg.trim().toLowerCase());
    targetUid = userRecord.uid;
  }

  if (targetUid) {
    await hardResetMasterUser(db, {
      uid: targetUid,
      dryRun: !isConfirmed,
      preserveAdminRole: true,
      resetGlobalTestLogs: purgeLogs
    });
  }
}

main().catch((err) => {
  console.error("❌ Erro na execução do utilitário Go-Live:", err);
  process.exit(1);
});

