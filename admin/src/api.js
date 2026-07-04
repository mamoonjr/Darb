const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const TOKEN_KEY = 'darb_admin_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/auth/me'),
  stats: () => request('/admin/stats'),
  users: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/admin/users?${q}`);
  },
  toggleUser: (id) => request(`/admin/users/${id}/toggle`, { method: 'PATCH' }),
  rides: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/admin/rides?${q}`);
  },
  activeDrivers: () => request('/admin/drivers/active'),
};
