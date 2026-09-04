import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, signInWithGoogle, signOutUser } from '../lib/firebase';

export interface AuthContextType {
  currentUser: FirebaseUser | null;
  isPremium: boolean;
  isLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

        const userDocRef = doc(db, 'users', user.uid);

        // Assure document exists in Firestore
        try {
          const snap = await getDoc(userDocRef);
          if (!snap.exists()) {
            await setDoc(userDocRef, {
              name: user.displayName || user.email?.split('@')[0] || 'Usuário',
              email: user.email || '',
              photoURL: user.photoURL || '',
              isPremium: false,
              createdAt: serverTimestamp()
            });
          }
        } catch (err) {
          console.warn('Notice ensuring user doc exists:', err);
        }

        // Realtime listener for isPremium status changes
        unsubscribeFirestore = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setIsPremium(Boolean(data?.isPremium));
          } else {
            setIsPremium(false);
          }
          setIsLoading(false);
        }, (err) => {
          console.error('Firestore user snapshot error:', err);
          setIsPremium(false);
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

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
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

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isPremium,
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
