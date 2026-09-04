/**
 * Centralized API Base URL configuration for decoupled deployment.
 * Defaults to http://localhost:3000 in development, or uses VITE_API_URL in production (Render).
 */
export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/+$/, '');

export function getApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_URL}${normalizedPath}`;
}
