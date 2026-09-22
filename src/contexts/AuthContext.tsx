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
          const isFirstLogin = !snap.exists();

          let userIsPremium = isPro || (snap.exists() ? Boolean(snap.data()?.isPremium) : false);

          // Guest Checkout Binding: se a conta ainda não for premium, verificar se há compra pelo e-mail
          if (!userIsPremium && email) {
            try {
              const emailDocRef = doc(db, 'users', email);
              const emailSnap = await getDoc(emailDocRef);
              if (emailSnap.exists() && emailSnap.data()?.isPremium) {
                userIsPremium = true;
                console.log('[Guest Checkout Binding] Licença Premium vinculada com sucesso a partir do e-mail:', email);
              }
            } catch (bindingErr) {
              console.warn('[Guest Checkout Binding] Verificação por e-mail:', bindingErr);
            }
          }

          // 2. Padronização dos dados do usuário
          const name = user.displayName || user.providerData?.[0]?.displayName || email.split('@')[0] || 'Usuário';
          const photoURL = user.photoURL || user.providerData?.[0]?.photoURL || '';

          const userData: Record<string, any> = {
            name,
            email,
            photoURL,
            role: emailIsAdmin ? 'admin' : 'user',
            isAdmin: emailIsAdmin
          };

          if (emailIsAdmin) {
            userData.isPremium = true;
            userData.plan = 'pro_unlimited';
            userIsPremium = true;
          } else if (userIsPremium) {
            userData.isPremium = true;
            userData.plan = snap.data()?.plan || 'pro_unlimited';
          }

          // createdAt com serverTimestamp() apenas se for o primeiro login
          if (isFirstLogin) {
            userData.createdAt = serverTimestamp();
            if (!emailIsAdmin && !userIsPremium) {
              userData.isPremium = false;
              userData.plan = 'free';
            }
          }

          // 1. Correção do Fluxo: setDoc(doc(db, 'users', user.uid), data, { merge: true })
          await setDoc(userDocRef, userData, { merge: true });
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
