/**
 * api.js — Central fetch wrapper
 * Automatically injects Authorization: Bearer <token> on every request.
 * Fires a 'session-expired' event on 401 so App.jsx can auto-logout.
 */

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082';

export function getToken() {
  return localStorage.getItem('jwt_token');
}

export function setToken(token) {
  localStorage.setItem('jwt_token', token);
}

export function clearSession() {
  localStorage.removeItem('jwt_token');
  localStorage.removeItem('user');
}

export function isTokenExpired() {
  const token = getToken();
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

/**
 * Drop-in replacement for fetch().
 * Usage: apiFetch('/api/shipments', { method: 'GET' })
 */
export async function apiFetch(path, options = {}) {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE}${path}`, { ...options, headers });

  if (response.status === 401) {
    clearSession();
    window.dispatchEvent(new Event('session-expired'));
  }

  return response;
}
