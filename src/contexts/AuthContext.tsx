import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, signInWithGoogle, signOutUser } from '../lib/firebase';

export interface AuthContextType {
  currentUser: FirebaseUser | null;
  isPremium: boolean;
  isAdmin: boolean;
  userDocExists: boolean | null;
  isLoading: boolean;
  loginWithGoogle: () => Promise<FirebaseUser | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 2. Regra de Auto-Admin baseada no Email:
export const adminEmails = [
  'phillipe.souza27@gmail.com',
  'eumktdigital23@gmail.com'
];

// Contas de Administrador com acesso ao Painel Administrativo (/painel) e Acesso Pro Irrestrito
export const ADMIN_ACCOUNTS = [
  ...adminEmails,
  'lvfernandes11@gmail.com'
];

export function isAdmin(email?: string | null): boolean {
  if (!email || typeof email !== 'string') return false;
  const normalized = email.trim().toLowerCase();
  return adminEmails.includes(normalized) || ADMIN_ACCOUNTS.includes(normalized);
}

// Contas com acesso Pro / Vitalício garantido
export const PRO_ACCOUNTS = [
  ...ADMIN_ACCOUNTS
];

export function isWhitelistedPro(email?: string | null): boolean {
  if (!email || typeof email !== 'string') return false;
  return PRO_ACCOUNTS.includes(email.trim().toLowerCase()) || isAdmin(email);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [userDocExists, setUserDocExists] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let unsubscribeFirestore: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
        unsubscribeFirestore = null;
      }

      if (user) {
        setCurrentUser(user);

        const email = (user.email || user.providerData?.[0]?.email || '').trim().toLowerCase();
        const emailIsAdmin = adminEmails.includes(email);
        const isPro = isWhitelistedPro(email) || emailIsAdmin;

        // Se for conta Pro whitelisted ou Admin, ativa imediatamente sem esperar rede
        if (isPro) {
          setIsPremium(true);
          setUserDocExists(true);
          setIsLoading(false);
        }

        // 1. O ID do documento na coleção users tem OBRIGATORIAMENTE de ser o uid oficial do Firebase Auth
        const userDocRef = doc(db, 'users', user.uid);

        // Garante integridade do documento do usuário no Firestore apenas se já cadastrado ou for admin
        try {
          const snap = await getDoc(userDocRef);

          const name = user.displayName || user.providerData?.[0]?.displayName || user.email?.split('@')[0] || 'Usuário';
          const email = user.email || '';
          const photoURL = user.photoURL || user.providerData?.[0]?.photoURL || '';

          if (snap.exists()) {
            setUserDocExists(true);
            // Usuário já cadastrado no banco: sincroniza dados básicos
            await setDoc(userDocRef, {
              name,
              photoURL
            }, { merge: true });
          } else if (isPro) {
            setUserDocExists(true);
            // Contas Pro whitelisted / Administradores são criadas com acesso irrestrito
            await setDoc(userDocRef, {
              name,
              email,
              photoURL,
              isPremium: true,
              createdAt: serverTimestamp()
            }, { merge: true });
          } else {
            setUserDocExists(false);
          }
          // Se !snap.exists() e não for Pro, NÃO criamos o documento aqui.
          // O documento só será criado após a conclusão do checkout/onboarding.
        } catch (err) {
          console.warn('Notice ensuring user doc exists:', err);
          if (isPro) {
            setIsPremium(true);
            setUserDocExists(true);
          }
        }

        // Realtime listener for isPremium status changes
        unsubscribeFirestore = onSnapshot(userDocRef, (docSnap) => {
          const exists = docSnap.exists();
          setUserDocExists(isPro ? true : exists);

          if (isPro) {
            setIsPremium(true);
          } else if (exists) {
            const data = docSnap.data();
            setIsPremium(Boolean(data?.isPremium));
          } else {
            setIsPremium(false);
          }
          setIsLoading(false);
        }, (err) => {
          console.error('Firestore user snapshot error:', err);
          if (isPro) {
            setIsPremium(true);
            setUserDocExists(true);
          } else {
            setIsPremium(false);
            setUserDocExists(false);
          }
          setIsLoading(false);
        });
      } else {
        setCurrentUser(null);
        setIsPremium(false);
        setUserDocExists(false);
        setIsLoading(false);
      }
    });

    return () => {
      if (unsubscribeFirestore) unsubscribeFirestore();
      unsubscribeAuth();
    };
  }, []);

  const loginWithGoogle = async (): Promise<FirebaseUser | null> => {
    setIsLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result?.user) {
        setCurrentUser(result.user);
      }
      return result?.user || null;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOutUser();
    } catch (e) {
      console.warn('Erro ao deslogar:', e);
    }
    setCurrentUser(null);
    setIsPremium(false);
    setUserDocExists(false);
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (_) {}
    // Purga de Estado Absoluta: força destruição de toda memória do processo e recarrega /login
    window.location.href = '/login';
  };

  const userEmail = (currentUser?.email || currentUser?.providerData?.[0]?.email || '').trim().toLowerCase();
  const userIsAdmin = isAdmin(userEmail);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isPremium,
        isAdmin: userIsAdmin,
        userDocExists,
        isLoading,
        loginWithGoogle,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
}
