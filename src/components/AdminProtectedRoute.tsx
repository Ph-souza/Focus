import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

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
 *   bloqueia a tela e redireciona imediatamente para a dashboard.
 */
export function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { currentUser, isLoading: authLoading, isAdmin: authIsAdmin } = useAuth();
  const isVerifyingFirestore = authLoading;
  const hasAdminPermission = Boolean(currentUser && authIsAdmin);

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
    console.warn('[Admin Route Guard] Acesso negado à rota /painel. Redirecionando para dashboard.');
    return <Navigate to={currentUser ? "/dashboard" : "/login"} replace />;
  }

  // Acesso autorizado
  return <>{children}</>;
}
