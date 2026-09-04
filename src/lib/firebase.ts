import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  User as FirebaseUser 
} from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use default database safely, avoiding invalid AI Studio template database IDs
const rawDbId = (firebaseConfig as any).firestoreDatabaseId;
const databaseId = (rawDbId && rawDbId !== '(default)' && !rawDbId.startsWith('ai-studio-')) 
  ? rawDbId 
  : undefined;

export const db = databaseId 
  ? initializeFirestore(app, { experimentalForceLongPolling: true }, databaseId)
  : initializeFirestore(app, { experimentalForceLongPolling: true });

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Cache the access token in memory
let cachedAccessToken: string | null = null;

// Initialize auth state listener. Call this on app load.
export const initAuth = (
  onAuthSuccess?: (user: FirebaseUser, token?: string) => void,
  onAuthFailure?: () => void
) => {
  // Check for any redirect result if redirect login was used
  getRedirectResult(auth)
    .then((result) => {
      if (result) {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        cachedAccessToken = credential?.accessToken || null;
      }
    })
    .catch((err) => {
      console.warn('Redirect auth result warning:', err);
    });

  return onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
    if (user) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken || '');
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const mapAuthError = (error: any): { message: string; tip?: string } => {
  const code = error?.code || '';
  const rawMsg = error?.message || '';

  switch (code) {
    case 'auth/popup-closed-by-user':
      return { 
        message: 'A janela de login do Google foi fechada antes da conclusão.' 
      };
    case 'auth/popup-blocked':
      return { 
        message: 'A janela pop-up do Google foi bloqueada pelo navegador.', 
        tip: 'Permita pop-ups neste site ou utilize o login com E-mail e Senha.' 
      };
    case 'auth/unauthorized-domain':
      return { 
        message: 'Domínio não autorizado no Firebase Authentication.', 
        tip: 'Adicione este domínio em Firebase Console > Authentication > Configurações > Domínios autorizados.' 
      };
    case 'auth/operation-not-allowed':
      return { 
        message: 'O método de autenticação não está ativado no Firebase Console.', 
        tip: 'Ative o provedor Google / E-mail no painel do Firebase.' 
      };
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return { 
        message: 'E-mail ou senha incorretos. Verifique suas credenciais.' 
      };
    case 'auth/user-not-found':
      return { 
        message: 'Nenhum usuário cadastrado encontrado com este e-mail.' 
      };
    case 'auth/email-already-in-use':
      return { 
        message: 'Este endereço de e-mail já está cadastrado em outra conta.', 
        tip: 'Tente fazer login com sua senha existente ou com o Google.' 
      };
    case 'auth/weak-password':
      return { 
        message: 'A senha é muito fraca. Escolha uma senha com pelo menos 6 caracteres.' 
      };
    case 'auth/invalid-email':
      return { 
        message: 'O formato do e-mail digitado é inválido.' 
      };
    case 'auth/network-request-failed':
      return { 
        message: 'Falha de conexão com a internet. Verifique sua rede e tente novamente.' 
      };
    case 'auth/too-many-requests':
      return { 
        message: 'Muitas tentativas sem sucesso. Aguarde alguns instantes antes de tentar novamente.' 
      };
    default:
      if (rawMsg.includes('popup') || rawMsg.includes('blocked')) {
        return { 
          message: 'Pop-up de autenticação bloqueado ou fechado.', 
          tip: 'Permita pop-ups no seu navegador.' 
        };
      }
      return { 
        message: rawMsg ? `Erro de autenticação: ${rawMsg}` : 'Falha na autenticação. Tente novamente.' 
      };
  }
};

export const googleSignInWithScopes = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    cachedAccessToken = credential?.accessToken || null;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in with Google error:', error);
    throw error;
  }
};

export const loginWithEmail = async (email: string, pass: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email.trim(), pass);
    return { user: result.user };
  } catch (error: any) {
    console.error('Email sign in error:', error);
    throw error;
  }
};

export const registerWithEmail = async (email: string, pass: string, name: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    if (name.trim()) {
      await updateProfile(result.user, { displayName: name.trim() });
    }
    return { user: result.user };
  } catch (error: any) {
    console.error('Email registration error:', error);
    throw error;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logoutWithScopes = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  // Log detailed error for debugging without unhandled throws in React lifecycle
  console.warn(`[Firestore Safe Handler - ${operationType}] Path: ${path}`, errInfo.error);
}

