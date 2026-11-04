import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
export const TOKEN_KEY = 'temu_estates_token';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const isLoginAttempt = error.config?.url?.includes('/auth/login');
    if (status === 401 && !isLoginAttempt) {
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event('temu:unauthorized'));
    }
    return Promise.reject(error);
  }
);

/** Turns a stored image path into something the browser can load. */
export function assetUrl(path) {
  if (!path) return '';
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  return `${API_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
}

export function apiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  return error?.response?.data?.error || error?.message || fallback;
}

export function apiFieldErrors(error) {
  const details = error?.response?.data?.details;
  return details && typeof details === 'object' ? details : {};
}
