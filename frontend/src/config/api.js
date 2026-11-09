/**
 * Dynamic API Base URL resolver.
 * - In local dev (port 3000): points to backend on http://localhost:8080/api
 * - In production (Render, custom domain, etc.): points to relative /api on the current origin
 * - If VITE_API_URL environment variable is provided, uses that.
 */
export const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
    window.location.port === '3000'
  ) {
    return 'http://localhost:8080/api';
  }

  // Deployed production environment: use relative path
  return '/api';
};

export const API_URL = getApiUrl();
export default API_URL;
