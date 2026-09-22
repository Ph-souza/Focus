import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, signInWithGoogle, signOutUser } from '../lib/firebase';

export interface AuthContextType {
  currentUser: FirebaseUser | null;
  isPremium: boolean;
  isAdmin: boolean;
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
          setIsLoading(false);
        }

        // 1. O ID do documento na coleção users tem OBRIGATORIAMENTE de ser o uid oficial do Firebase Auth
        const userDocRef = doc(db, 'users', user.uid);

        // Garante a existência e integridade do documento do usuário no Firestore
        try {
          const snap = await getDoc(userDocRef);

          // 2. Regra de Auto-Admin:
          // Antes de salvar no Firestore, verifique estritamente: if (user.email === 'phillipe.souza27@gmail.com').
          // Se for verdadeiro, adicione ao payload: role: 'admin' e isAdmin: true.
          // Se for falso, adicione: role: 'user' e isAdmin: false.
          let role = 'user';
          let isAdmin = false;

          if (user.email === 'phillipe.souza27@gmail.com') {
            role = 'admin';
            isAdmin = true;
          }

          // 3. Padronização de Dados:
          // O payload salvo deve conter apenas: name, email, photoURL, e createdAt (utilize serverTimestamp(), garantindo que não sobrescreve se já existir).
          const name = user.displayName || user.providerData?.[0]?.displayName || user.email?.split('@')[0] || 'Usuário';
          const email = user.email || '';
          const photoURL = user.photoURL || user.providerData?.[0]?.photoURL || '';

          const payload: Record<string, any> = {
            name,
            email,
            photoURL,
            role,
            isAdmin
          };

          // createdAt (utilize serverTimestamp(), garantindo que não sobrescreve se já existir)
          if (!snap.exists() || !snap.data()?.createdAt) {
            payload.createdAt = serverTimestamp();
          }

          // 1. Uso Obrigatório do UID (setDoc):
          // Substitua addDoc(collection(db, 'users')...) por setDoc(doc(db, 'users', user.uid), data, { merge: true }).
          // O ID do documento na coleção users tem obrigatoriamente que ser o user.uid do Firebase Auth.
          // O { merge: true } é vital para não sobrescrevermos assinaturas em logins futuros.
          await setDoc(userDocRef, payload, { merge: true });
        } catch (err) {
          console.warn('Notice ensuring user doc exists:', err);
          if (isPro) {
            setIsPremium(true);
          }
        }

        // Realtime listener for isPremium status changes
        unsubscribeFirestore = onSnapshot(userDocRef, (docSnap) => {
          if (isPro) {
            setIsPremium(true);
          } else if (docSnap.exists()) {
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
          } else {
            setIsPremium(false);
          }
          setIsLoading(false);
        });
      } else {
        setCurrentUser(null);
        setIsPremium(false);
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
      return result?.user || null;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    await signOutUser();
    setCurrentUser(null);
    setIsPremium(false);
  };

  const userEmail = (currentUser?.email || currentUser?.providerData?.[0]?.email || '').trim().toLowerCase();
  const userIsAdmin = isAdmin(userEmail);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isPremium,
        isAdmin: userIsAdmin,
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
