import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, isWhitelistedPro } from '../contexts/AuthContext';
import { ShieldAlert } from 'lucide-react';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { currentUser, isLoading } = useAuth();
  const location = useLocation();

  const userEmail = (currentUser?.email || currentUser?.providerData?.[0]?.email || '').trim().toLowerCase();
  const isAuthorizedAdmin = isWhitelistedPro(userEmail);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#101b32] text-white">
        <div className="w-10 h-10 border-4 border-[#2662eb] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-300 text-sm font-medium tracking-wide">Autenticando sessão administrativa...</p>
      </div>
    );
  }

  // 1. Não autenticado: redireciona para login
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Autenticado mas sem permissão administrativa: blindagem da rota
  // Redireciona para o dashboard comum e nunca permite acesso ao /painel
  if (!isAuthorizedAdmin) {
    console.warn(`[Segurança] Acesso negado ao /painel para o usuário: ${userEmail}`);
    return <Navigate to="/dashboard" replace />;
  }

  // 3. Administrador autenticado e autorizado
  return <>{children}</>;
}
