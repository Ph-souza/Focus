export type AccountStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
const legacyKeys = new Set([
  'nexus_latest_mentor_feedback', 'nexus_monthly_budget', 'nexus_focus_projects_list',
  'nexus_focus_project_tasks', 'nexus_calendar_daily_notes', 'nexus_quick_notes',
  'nexus_welcome_seen', 'nexus_whatsapp_number'
]);

/** Bind each operation to the identity that mounted the component, never a later login. */
export function createAccountStorage(
  uid: string | null,
  activeUid: () => string | null,
  storage: AccountStorage,
  legacyOwnerUid?: string
): AccountStorage {
  const ownsSession = () => Boolean(uid && activeUid() === uid);
  const scopedKey = (key: string) => 'nexus:v2:' + encodeURIComponent(uid || '') + ':' + key;
  return {
    getItem(key) {
      if (!ownsSession()) return null;
      try {
        const value = storage.getItem(scopedKey(key));
        if (value !== null) return value;
        // Only the explicitly identified original account may recover unscoped legacy data.
        if (uid === legacyOwnerUid && legacyKeys.has(key)) {
          const old = storage.getItem(key);
          if (old !== null) {
            storage.setItem(scopedKey(key), old);
            return old;
          }
        }
      } catch {}
      return null;
    },
    setItem(key, value) {
      if (!ownsSession()) return;
      try { storage.setItem(scopedKey(key), value); } catch {}
    },
    removeItem(key) {
      if (!ownsSession()) return;
      try { storage.removeItem(scopedKey(key)); } catch {}
    }
  };
}
