import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, isAdmin } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Route Guard Estrito para a rota /painel (Painel Administrativo)
 * 
 * Regra de Acesso:
 * - Valida se o usuário está autenticado no Firebase Auth
 * - Valida no Firestore se o perfil possui a flag administrativa (isAdmin: true, role: 'admin_pro' ou 'admin')
 * - Reconhece administradores credenciados do sistema (ex: phillipe.souza27@gmail.com)
 * 
 * Bloqueio:
 * - Se um utilizador comum, cliente premium ou usuário não autenticado tentar acessar /painel pela URL,
 *   bloqueia a tela e redireciona imediatamente para a rota principal do app (/).
 */
export function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { currentUser, isLoading: authLoading, isAdmin: authIsAdmin } = useAuth();
  const [isVerifyingFirestore, setIsVerifyingFirestore] = useState<boolean>(true);
  const [hasAdminPermission, setHasAdminPermission] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function checkAdminStatus() {
      // 1. Não autenticado no Firebase Auth
      if (!currentUser) {
        if (isMounted) {
          setHasAdminPermission(false);
          setIsVerifyingFirestore(false);
        }
        return;
      }

      const email = (currentUser.email || currentUser.providerData?.[0]?.email || '').trim().toLowerCase();

      // 2. Se já for identificado como admin na lista de credenciados
      if (authIsAdmin || isAdmin(email)) {
        if (isMounted) {
          setHasAdminPermission(true);
          setIsVerifyingFirestore(false);
        }
        return;
      }

      // 3. Verificação estrita no Firestore (perfil do usuário com flag isAdmin: true ou role: 'admin')
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          const firestoreAdmin = Boolean(
            data?.isAdmin === true || 
            data?.role === 'admin_pro' || 
            data?.role === 'admin'
          );

          if (isMounted) {
            setHasAdminPermission(firestoreAdmin);
            setIsVerifyingFirestore(false);
          }
          return;
        }
      } catch (err) {
        console.warn('[Admin Route Guard] Falha ao consultar permissões no Firestore:', err);
      }

      if (isMounted) {
        setHasAdminPermission(false);
        setIsVerifyingFirestore(false);
      }
    }

    if (!authLoading) {
      checkAdminStatus();
    }

    return () => {
      isMounted = false;
    };
  }, [currentUser, authLoading, authIsAdmin]);

  // Enquanto valida credenciais
  if (authLoading || isVerifyingFirestore) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#101b32] text-white">
        <div className="w-10 h-10 border-4 border-[#2662eb] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-300 text-sm font-medium tracking-wide">Validando credenciais administrativas...</p>
      </div>
    );
  }

  // Bloqueio: Se usuário não autenticado, usuário comum ou cliente premium sem permissão administrativa
  // Redireciona imediatamente para a rota principal do app (/)
  if (!currentUser || !hasAdminPermission) {
    console.warn('[Admin Route Guard] Acesso negado à rota /painel. Redirecionando para rota principal (/).');
    return <Navigate to="/" replace />;
  }

  // Acesso autorizado
  return <>{children}</>;
}
