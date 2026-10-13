import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { db } from '../lib/firebase';
import { getApiUrl } from '../lib/api';
import { Ledger, LedgerType } from '../types';

export interface LedgerContextType {
  activeLedger: Ledger;
  ledgers: Ledger[];
  familyLedger: Ledger | null;
  isFamilyActive: boolean;
  hasFamilyLedger: boolean;
  isLoadingLedgers: boolean;
  isFamilyModalOpen: boolean;
  setIsFamilyModalOpen: (open: boolean) => void;
  inviteData: { code: string; url: string } | null;
  switchLedger: (type: LedgerType) => void;
  createFamilyVault: (name?: string) => Promise<{ inviteCode: string; inviteUrl: string; ledgerId: string }>;
  acceptFamilyInvite: (code: string) => Promise<{ success: boolean; ledgerId?: string; error?: string }>;
  pendingInviteCode: string | null;
  setPendingInviteCode: (code: string | null) => void;
}

const LedgerContext = createContext<LedgerContextType | undefined>(undefined);

export function LedgerProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const userId = currentUser?.uid;

  // Ledger padrão (Pessoal)
  const defaultPersonalLedger = useMemo<Ledger>(() => ({
    id: userId || 'personal',
    type: 'personal',
    role: 'owner',
    name: 'Pessoal'
  }), [userId]);

  const [activeLedger, setActiveLedger] = useState<Ledger>(defaultPersonalLedger);
  const [ledgers, setLedgers] = useState<Ledger[]>([defaultPersonalLedger]);
  const [isLoadingLedgers, setIsLoadingLedgers] = useState<boolean>(true);
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState<boolean>(false);
  const [inviteData, setInviteData] = useState<{ code: string; url: string } | null>(null);
  const [pendingInviteCode, setPendingInviteCode] = useState<string | null>(null);

  // Detecta parâmetro de convite na URL (?family_invite=CODIGO)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const inviteParam = params.get('family_invite') || params.get('invite');
      if (inviteParam) {
        setPendingInviteCode(inviteParam.trim().toUpperCase());
        setIsFamilyModalOpen(true);
      }
    } catch (_) {}
  }, []);

  // 1. Sincronização em tempo real do perfil do usuário para ler os cofres vinculados (ledgers)
  useEffect(() => {
    if (!userId) {
      setActiveLedger(defaultPersonalLedger);
      setLedgers([defaultPersonalLedger]);
      setIsLoadingLedgers(false);
      return;
    }

    const userDocRef = doc(db, 'users', userId);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const userLedgers: Ledger[] = data.ledgers || [];

        // Garante que o cofre pessoal esteja sempre presente na lista
        const hasPersonal = userLedgers.some(l => l.type === 'personal');
        const personalLedger: Ledger = {
          id: userId,
          type: 'personal',
          role: 'owner',
          name: 'Pessoal'
        };

        const mergedLedgers: Ledger[] = hasPersonal 
          ? userLedgers 
          : [personalLedger, ...userLedgers];

        setLedgers(mergedLedgers);

        // Se houver activeLedgerId salvo no perfil, respeita
        if (data.activeLedgerId) {
          const savedActive = mergedLedgers.find(l => l.id === data.activeLedgerId);
          if (savedActive) {
            setActiveLedger(savedActive);
          }
        } else {
          // Mantém o tipo atual de ledger ativo
          setActiveLedger(prev => {
            const currentMatch = mergedLedgers.find(l => l.id === prev.id);
            if (currentMatch) return currentMatch;
            const typeMatch = mergedLedgers.find(l => l.type === prev.type);
            return typeMatch || personalLedger;
          });
        }
      } else {
        setLedgers([defaultPersonalLedger]);
        setActiveLedger(defaultPersonalLedger);
      }
      setIsLoadingLedgers(false);
    }, (error) => {
      console.warn('[LedgerContext] Erro ao sincronizar cofres:', error);
      setIsLoadingLedgers(false);
    });

    return () => unsubscribe();
  }, [userId, defaultPersonalLedger]);

  // Identifica o cofre familiar se existir
  const familyLedger = useMemo(() => {
    return ledgers.find(l => l.type === 'shared') || null;
  }, [ledgers]);

  const hasFamilyLedger = Boolean(familyLedger);
  const isFamilyActive = activeLedger.type === 'shared';

  // Alterna entre Pessoal e Família
  const switchLedger = useCallback((type: LedgerType) => {
    if (type === 'shared') {
      if (familyLedger) {
        setActiveLedger(familyLedger);
      } else {
        // Se ainda não tem cofre compartilhado, abre modal para criar / convidar
        setIsFamilyModalOpen(true);
      }
    } else {
      const personal = ledgers.find(l => l.type === 'personal') || defaultPersonalLedger;
      setActiveLedger(personal);
    }
  }, [familyLedger, ledgers, defaultPersonalLedger]);

  // Cria cofre compartilhado e gera convite
  const createFamilyVault = useCallback(async (name?: string) => {
    if (!currentUser) throw new Error("Usuário não autenticado");
    const token = await currentUser.getIdToken();

    const response = await fetch(getApiUrl('/api/family/vault'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name: name || 'Cofre Familiar' })
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || "Não foi possível criar o cofre familiar.");
    }

    const newSharedLedger: Ledger = {
      id: data.ledgerId,
      type: 'shared',
      role: 'owner',
      name: name || 'Família'
    };

    setInviteData({
      code: data.inviteCode,
      url: data.inviteUrl
    });

    // Ativa imediatamente o cofre familiar recém-criado
    setActiveLedger(newSharedLedger);

    return {
      inviteCode: data.inviteCode,
      inviteUrl: data.inviteUrl,
      ledgerId: data.ledgerId
    };
  }, [currentUser]);

  // Aceita convite existente
  const acceptFamilyInvite = useCallback(async (code: string) => {
    if (!currentUser) throw new Error("Faça login para aceitar o convite.");
    const token = await currentUser.getIdToken();

    const response = await fetch(getApiUrl('/api/family/invite/accept'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ inviteCode: code })
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      return { success: false, error: data.error || "Código de convite inválido ou expirado." };
    }

    const acceptedSharedLedger: Ledger = {
      id: data.ledgerId,
      type: 'shared',
      role: 'guest',
      name: 'Família',
      ownerEmail: data.ownerEmail,
      ownerName: data.ownerName
    };

    setActiveLedger(acceptedSharedLedger);
    setPendingInviteCode(null);
    setIsFamilyModalOpen(false);

    return { success: true, ledgerId: data.ledgerId };
  }, [currentUser]);

  return (
    <LedgerContext.Provider
      value={{
        activeLedger,
        ledgers,
        familyLedger,
        isFamilyActive,
        hasFamilyLedger,
        isLoadingLedgers,
        isFamilyModalOpen,
        setIsFamilyModalOpen,
        inviteData,
        switchLedger,
        createFamilyVault,
        acceptFamilyInvite,
        pendingInviteCode,
        setPendingInviteCode
      }}
    >
      {children}
    </LedgerContext.Provider>
  );
}

export function useLedger(): LedgerContextType {
  const context = useContext(LedgerContext);
  if (!context) {
    throw new Error('useLedger deve ser utilizado dentro de um LedgerProvider');
  }
  return context;
}
