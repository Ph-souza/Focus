import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';

export function RootRoute() {
  const { currentUser, isLoading, userDocExists } = useAuth();

  // 1. Estado de loading (spinner) enquanto o Firebase Auth e a verificação do documento resolvem
  if (isLoading || (currentUser && userDocExists === null)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090b] text-white">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-zinc-400 text-sm font-medium tracking-wide">Carregando Nexus Focus...</p>
      </div>
    );
  }

  // 2. Se o usuário NÃO estiver autenticado no Firebase Auth: Redirecione imediatamente para /login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // 3. Se o usuário ESTIVER autenticado no Firebase Auth:
  // Se o documento existir (doc.exists()): Redirecione para /dashboard.
  // Se o documento NÃO existir (primeiro acesso com e-mail novo): Redirecione imediatamente para /checkout.
  if (userDocExists === true) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/checkout" replace />;
}
