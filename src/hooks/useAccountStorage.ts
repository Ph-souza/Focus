import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../lib/firebase';
import { createAccountStorage } from '../lib/accountStorage';

export function useAccountStorage(kind: 'local' | 'session' = 'local') {
  const { currentUser } = useAuth();
  const uid = currentUser?.uid || null;
  return useMemo(() => createAccountStorage(
    uid,
    () => auth.currentUser?.uid || null,
    kind === 'local' ? window.localStorage : window.sessionStorage,
    kind === 'local' ? import.meta.env.VITE_LEGACY_STORAGE_OWNER_UID : undefined
  ), [uid, kind]);
}
