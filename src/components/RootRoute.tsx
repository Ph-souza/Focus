import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';

export function RootRoute() {
  const { currentUser, isLoading } = useAuth();
  const [isCheckingDoc, setIsCheckingDoc] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function evaluateRootAccess() {
      // 1. Aguarda resolução do Firebase Auth
      if (isLoading) return;

      // 2. Se o usuário NÃO estiver autenticado no Firebase Auth: Redirecione para /login
      if (!currentUser) {
        if (isMounted) {
          setRedirectPath('/login');
        }
        return;
      }

      // 3. Se o usuário ESTIVER autenticado no Firebase Auth:
      // Consulte a coleção users no Firestore buscando pelo documento do uid atual.
      setIsCheckingDoc(true);
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(userDocRef);

        if (!isMounted) return;

        // Se o documento existir (doc.exists()): Redirecione para /dashboard.
        // Se o documento NÃO existir (primeiro acesso com e-mail novo): Redirecione para /checkout.
        if (docSnap.exists()) {
          setRedirectPath('/dashboard');
        } else {
          setRedirectPath('/checkout');
        }
      } catch (error) {
        console.error('[RootRoute] Erro ao consultar documento users/{uid}:', error);
        if (!isMounted) return;
        // Fallback seguro em caso de indisponibilidade transitória
        setRedirectPath('/checkout');
      } finally {
        if (isMounted) {
          setIsCheckingDoc(false);
        }
      }
    }

    evaluateRootAccess();

    return () => {
      isMounted = false;
    };
  }, [currentUser, isLoading]);

  // 4. Estado de loading (spinner) enquanto o Firebase Auth e a consulta ao Firestore resolvem
  if (isLoading || isCheckingDoc || !redirectPath) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090b] text-white">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-zinc-400 text-sm font-medium tracking-wide">Carregando Nexus Focus...</p>
      </div>
    );
  }

  return <Navigate to={redirectPath} replace />;
}
