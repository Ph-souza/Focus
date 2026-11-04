import { useState, useEffect, useCallback } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { doc, getDoc } from 'firebase/firestore';
import { app, auth, db } from '../lib/firebase';
import type { MpAdminMetricsPayload } from '../functions/getAdminMpMetrics';

const CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 horas

export interface UseMercadoPagoMetricsResult {
  data: MpAdminMetricsPayload | null;
  loading: boolean;
  error: string | null;
  fromCache: boolean;
  cacheAgeMinutes: number;
  refresh: (forceRefresh?: boolean) => Promise<void>;
}

/**
 * Custom Hook React: Consome a Firebase Callable Function `getAdminMpMetrics`
 * (com fallback transparente para a rota autenticada `/api/admin/mp-metrics` e cache `admin/metrics_cache`)
 * retornando o payload estruturado de MRR, Adesões Únicas (NEXUSELITE) e séries para gráficos.
 */
export function useMercadoPagoMetrics(): UseMercadoPagoMetricsResult {
  const [data, setData] = useState<MpAdminMetricsPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    try {
      // 1. Verificação rápida do documento de cache no Firestore ('admin/metrics_cache') se < 4h
      if (!forceRefresh) {
        try {
          const cacheSnap = await getDoc(doc(db, 'admin', 'metrics_cache'));
          if (cacheSnap.exists()) {
            const cacheDoc = cacheSnap.data();
            const updatedAtMs: number =
              typeof cacheDoc?.updatedAtMillis === 'number'
                ? cacheDoc.updatedAtMillis
                : cacheDoc?.updatedAt?.toMillis
                ? cacheDoc.updatedAt.toMillis()
                : 0;
            const ageMs = Date.now() - updatedAtMs;

            if (updatedAtMs > 0 && ageMs < CACHE_TTL_MS && cacheDoc?.payload) {
              setData({
                ...(cacheDoc.payload as MpAdminMetricsPayload),
                source: 'firestore_cache',
                fromCache: true,
                cacheAgeMinutes: Math.max(0, Math.round(ageMs / 60_000)),
              });
              setLoading(false);
              return;
            }
          }
        } catch {
          // Segue para chamada da Callable Function / Backend
        }
      }

      // 2. Invoca a Firebase Callable Function `getAdminMpMetrics`
      try {
        const functionsInstance = getFunctions(app, 'southamerica-east1');
        const getAdminMpMetricsFn = httpsCallable<
          { forceRefresh?: boolean },
          MpAdminMetricsPayload
        >(functionsInstance, 'getAdminMpMetrics');

        const response = await getAdminMpMetricsFn({ forceRefresh });
        if (response?.data) {
          setData(response.data);
          setLoading(false);
          return;
        }
      } catch (callableErr) {
        // Fallback automático para o endpoint autenticado no backend Render (/api/admin/mp-metrics)
        const currentUser = auth.currentUser;
        if (!currentUser) throw callableErr;

        const idToken = await currentUser.getIdToken();
        const apiBase =
          import.meta.env?.VITE_API_URL ||
          (window.location.hostname === 'localhost'
            ? 'http://localhost:3000'
            : 'https://nexus-focus.onrender.com');

        const res = await fetch(`${apiBase}/api/admin/mp-metrics`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ forceRefresh }),
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.error || `HTTP ${res.status} ao buscar métricas do Mercado Pago`);
        }

        const payload = (await res.json()) as MpAdminMetricsPayload;
        setData(payload);
        setLoading(false);
        return;
      }
    } catch (err: any) {
      console.error('[useMercadoPagoMetrics] Erro ao buscar métricas no Mercado Pago:', err);
      setError(err?.message || 'Não foi possível sincronizar métricas com o Mercado Pago.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchMetrics(false);
  }, [fetchMetrics]);

  return {
    data,
    loading,
    error,
    fromCache: Boolean(data?.fromCache),
    cacheAgeMinutes: data?.cacheAgeMinutes ?? 0,
    refresh: fetchMetrics,
  };
}

