import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { getApiUrl } from '../lib/api';
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
export const adminEmails: string[] = [];
export const ADMIN_ACCOUNTS: string[] = [];
export const PRO_ACCOUNTS: string[] = [];
// O navegador não é autoridade para conceder privilégios.
export function isAdmin(_email?: string | null): boolean { return false; }
export function isWhitelistedPro(_email?: string | null): boolean { return false; }

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [adminAccess, setAdminAccess] = useState(false);
  const [userDocExists, setUserDocExists] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let unsubscribeFirestore: (() => void) | null = null;
    let generation = 0;
    let disposed = false;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      const session = ++generation;
      const isCurrentSession = () => !disposed && session === generation && auth.currentUser?.uid === user?.uid;
      setCurrentUser(user);
      setIsPremium(false);
      setAdminAccess(false);
      setUserDocExists(user ? null : false);
      setIsLoading(Boolean(user));
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
        unsubscribeFirestore = null;
      }

      if (user) {
        setCurrentUser(user);

        const userDocRef = doc(db, 'users', user.uid);
        const validate = async () => {
          try {
            const token = await user.getIdToken();
            const response = await fetch(getApiUrl('/api/auth/access'), {
              headers: { Authorization: `Bearer ${token}` },
              cache: 'no-store'
            });
            if (!response.ok) throw new Error('Access validation unavailable');
            const data = await response.json();
            if (!isCurrentSession()) return;
            setIsPremium(data.isPremium === true);
            setAdminAccess(data.isAdmin === true);
            setUserDocExists(data.userDocExists === true);
          } catch (err) {
            if (!isCurrentSession()) return;
            console.warn('[Auth] Server access check failed:', err);
            setIsPremium(false);
            setAdminAccess(false);
            setUserDocExists(false);
          } finally {
            if (isCurrentSession()) setIsLoading(false);
          }
        };
        // Atualiza o acesso quando o documento é alterado ou excluído.
        unsubscribeFirestore = onSnapshot(userDocRef, () => {
          if (!isCurrentSession()) return;
          setIsLoading(true);
          setIsPremium(false);
          setAdminAccess(false);
          void validate();
        }, () => {
          if (!isCurrentSession()) return;
          setIsPremium(false);
          setAdminAccess(false);
          setUserDocExists(false);
          setIsLoading(false);
        });
        void validate();
      } else {
        setCurrentUser(null);
        setIsPremium(false);
        setAdminAccess(false);
        setUserDocExists(false);
        setIsLoading(false);
      }
    });

    return () => {
      disposed = true;
      generation++;
      if (unsubscribeFirestore) unsubscribeFirestore();
      unsubscribeAuth();
    };
  }, []);

  const loginWithGoogle = async (): Promise<FirebaseUser | null> => {
    setIsLoading(true);
    try {
      const result = await signInWithGoogle();
      // onAuthStateChanged owns the session transition and resets the previous state.
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
    setAdminAccess(false);
    setUserDocExists(false);
    try {
      sessionStorage.removeItem('nexus-pending-payment');
    } catch (_) {}
    // Purga de Estado Absoluta: força destruição de toda memória do processo e recarrega /login
    window.location.href = '/login';
  };

  const userIsAdmin = adminAccess;

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
      <React.Fragment key={currentUser?.uid || "signed-out"}>{children}</React.Fragment>
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
