import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { currentUser, isPremium, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090b] text-white">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-zinc-400 text-sm font-medium tracking-wide">Validando credenciais...</p>
      </div>
    );
  }

  // 1. Se não houver currentUser: Redireciona para /login
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Se houver currentUser MAS isPremium for false: Redireciona para /checkout
  if (!isPremium) {
    return <Navigate to="/checkout" replace />;
  }

  // 3. Se houver currentUser E isPremium for true: Libera o acesso ao /dashboard
  return children ? <>{children}</> : null;
}
