import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, isWhitelistedPro } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { currentUser, isPremium, userDocExists, isLoading } = useAuth();
  const location = useLocation();

  const userEmail = (currentUser?.email || currentUser?.providerData?.[0]?.email || '').trim().toLowerCase();
  const isWhitelisted = isWhitelistedPro(userEmail);
  
  // BLOQUEIO ESTRITO DE INADIMPLENTES (P0 SECURITY GUARD):
  // Ninguém entra no painel /dashboard sem pagamento confirmado (isPremium === true) ou Admin/Whitelisted.
  const hasConfirmedPayment = isWhitelisted || isPremium;

  if (isLoading || (currentUser && userDocExists === null)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090b] text-white">
        <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-zinc-400 text-sm font-medium tracking-wide">Validando assinatura e credenciais...</p>
      </div>
    );
  }

  // 1. Se não houver currentUser: Redireciona para /login
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Se o usuário estiver logado MAS NÃO tiver pagamento confirmado: Bloqueio imediato para /checkout
  if (!hasConfirmedPayment) {
    return <Navigate to="/checkout" replace />;
  }

  // 3. Usuário com pagamento confirmado: Libera o acesso ao /dashboard
  return children ? <>{children}</> : null;
}
