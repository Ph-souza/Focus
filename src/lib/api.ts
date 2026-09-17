/**
 * Centralized API Base URL configuration for decoupled deployment.
 * Points to the official Render backend (https://nexus-focus.onrender.com) in production,
 * and http://localhost:3000 in local development unless overridden by VITE_API_URL.
 */
const isLocal = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
);

export const API_URL = (
  !isLocal
    ? (import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_URL.includes('localhost')
        ? import.meta.env.VITE_API_URL
        : 'https://nexus-focus.onrender.com')
    : (import.meta.env.VITE_API_URL || 'http://localhost:3000')
).replace(/\/+$/, '');

export function getApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_URL}${normalizedPath}`;
}
