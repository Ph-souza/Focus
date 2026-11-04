/**
 * Utilitário: Injeção de Custom Claim { admin: true } no Firebase Auth
 * Execução: npx tsx scripts/set-admin-claim.ts [UID_OU_EMAIL]
 */
import { initializeApp, cert, getApps, getApp, App } from 'firebase-admin/app';
import { getAuth, UserRecord } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const DEFAULT_MASTER_UID = 'GJ3oZLl3ZJSpH6oeEgpGKIVAvrm2';
const DEFAULT_MASTER_EMAIL = 'phillipe.souza27@gmail.com';

function initFirebaseAdmin(): App {
  if (getApps().length > 0) return getApp();

  const candidatePaths = [
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    path.resolve(process.cwd(), 'serviceAccountKey.json'),
    'C:/Users/phillipe.pimenta/Downloads/planner-com-ia-assistant-firebase-adminsdk-fbsvc-6dec991955.json',
  ].filter(Boolean) as string[];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      const parsed = JSON.parse(fs.readFileSync(candidate, 'utf-8'));
      return initializeApp({
        credential: cert(parsed),
        projectId: parsed.project_id,
      });
    }
  }

  const rawEnvKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (rawEnvKey) {
    const parsed = JSON.parse(rawEnvKey);
    return initializeApp({
      credential: cert(parsed),
      projectId: parsed.project_id,
    });
  }

  throw new Error('Credencial do Firebase Admin não encontrada.');
}

async function setAdminClaim() {
  initFirebaseAdmin();
  const auth = getAuth();
  const db = getFirestore();

  const arg = process.argv[2] || DEFAULT_MASTER_UID;
  let userRecord: UserRecord;

  if (arg.includes('@')) {
    userRecord = await auth.getUserByEmail(arg);
  } else {
    try {
      userRecord = await auth.getUser(arg);
    } catch {
      userRecord = await auth.getUserByEmail(DEFAULT_MASTER_EMAIL);
    }
  }

  const existingClaims = userRecord.customClaims || {};
  const updatedClaims = {
    ...existingClaims,
    admin: true,
    role: 'admin',
  };

  // 1. Injeta Custom Claim no token JWT do Firebase Auth
  await auth.setCustomUserClaims(userRecord.uid, updatedClaims);

  // 2. Sincroniza também o documento em users/{uid} para consistência
  await db.collection('users').doc(userRecord.uid).set(
    {
      role: 'admin',
      isAdmin: true,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  const verifiedUser = await auth.getUser(userRecord.uid);
  console.log('====================================================');
  console.log('CUSTOM CLAIM INJETADA COM SUCESSO');
  console.log('====================================================');
  console.log(`UID:           ${verifiedUser.uid}`);
  console.log(`Email:         ${verifiedUser.email}`);
  console.log(`Custom Claims: ${JSON.stringify(verifiedUser.customClaims)}`);
  console.log('====================================================');
  process.exit(0);
}

setAdminClaim().catch((err) => {
  console.error('Erro ao injetar Custom Claim:', err);
  process.exit(1);
});
