import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../constants';

const TOKEN_KEY = 'darb_token';
const REFRESH_KEY = 'darb_refresh_token';

let refreshPromise = null;

async function getToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

async function getRefreshToken() {
  return SecureStore.getItemAsync(REFRESH_KEY);
}

async function setToken(token) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

async function setSession({ token, accessToken, refreshToken }) {
  const access = accessToken || token;
  if (access) await SecureStore.setItemAsync(TOKEN_KEY, access);
  if (refreshToken) await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
}

async function clearToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}

async function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) throw new Error('No refresh token');
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        await clearToken();
        throw new Error(data.error || 'Session expired');
      }
      await setSession(data);
      return data;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function request(path, options = {}, allowRetry = true) {
  const token = await getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (response.status === 401 && allowRetry && !path.startsWith('/auth/')) {
    try {
      await refreshSession();
      return request(path, options, false);
    } catch {
      // fall through to error below
    }
  }

  if (!response.ok) {
    const err = new Error(data.error || 'Request failed');
    if (data.code) err.code = data.code;
    throw err;
  }

  return data;
}

export const api = {
  getToken,
  getRefreshToken,
  setToken,
  setSession,
  clearToken,
  refreshSession,

  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  requestOtp: (phone) =>
    request('/auth/otp/request', { method: 'POST', body: JSON.stringify({ phone }) }),
  verifyOtp: (phone, code) =>
    request('/auth/otp/verify', { method: 'POST', body: JSON.stringify({ phone, code }) }),
  logout: async () => {
    const refreshToken = await getRefreshToken();
    try {
      if (refreshToken) {
        await request('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        }, false);
      }
    } catch {
      // ignore network errors on logout
    }
    await clearToken();
  },
  me: () => request('/auth/me'),
  switchRole: (role) =>
    request('/auth/switch-role', { method: 'POST', body: JSON.stringify({ role }) }),

  updatePushToken: (pushToken) =>
    request('/users/push-token', { method: 'PATCH', body: JSON.stringify({ pushToken }) }),

  searchUserByPhone: (phone) =>
    request(`/users/search?phone=${encodeURIComponent(phone)}`),

  searchPlaces: (q, lang = 'ar', lat, lng) => {
    let url = `/places/search?q=${encodeURIComponent(q)}&lang=${lang}`;
    if (lat != null && lng != null) {
      url += `&lat=${lat}&lng=${lng}`;
    }
    return request(url);
  },

  searchNearbyPlaces: (lat, lng, lang = 'ar') =>
    request(`/places/nearby?lat=${lat}&lng=${lng}&lang=${lang}`),

  getPlaceCategories: (lang = 'ar') => request(`/places/categories?lang=${lang}`),

  reversePlace: (lat, lng, lang = 'ar') =>
    request(`/places/reverse?lat=${lat}&lng=${lng}&lang=${lang}`),

  getNearbyDrivers: (lat, lng, radius) =>
    request(`/drivers/nearby?lat=${lat}&lng=${lng}${radius ? `&radius=${radius}` : ''}`),

  getDriverRequests: (lat, lng) =>
    request(`/drivers/requests?lat=${lat}&lng=${lng}`),

  createRide: (body) => request('/rides', { method: 'POST', body: JSON.stringify(body) }),
  getRides: () => request('/rides'),
  getRide: (id) => request(`/rides/${id}`),
  acceptRide: (id) => request(`/rides/${id}/accept`, { method: 'POST' }),
  declineRide: (id) => request(`/rides/${id}/decline`, { method: 'POST' }),
  updateRideStatus: (id, status) =>
    request(`/rides/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  approveBox: (id, location) =>
    request(`/rides/${id}/box/approve`, { method: 'POST', body: JSON.stringify(location) }),
  rejectBox: (id) => request(`/rides/${id}/box/reject`, { method: 'POST' }),
  uploadDeliveryProof: (id, image) =>
    request(`/rides/${id}/proof`, { method: 'POST', body: JSON.stringify({ image }) }),
  payRide: (id, paymentMethod) =>
    request(`/rides/${id}/pay`, { method: 'POST', body: JSON.stringify({ paymentMethod }) }),
  getPayment: (id) => request(`/rides/${id}/payment`),

  getWallet: () => request('/wallet'),
  getWalletTransactions: () => request('/wallet/transactions'),
  topUpWallet: (amount) =>
    request('/wallet/top-up', { method: 'POST', body: JSON.stringify({ amount }) }),
  getCards: () => request('/cards'),
  addCard: (body) => request('/cards', { method: 'POST', body: JSON.stringify(body) }),
  deleteCard: (id) => request(`/cards/${id}`, { method: 'DELETE' }),
  setDefaultCard: (id) => request(`/cards/${id}/default`, { method: 'PATCH' }),

  rateRide: (id, body) =>
    request(`/rides/${id}/rate`, { method: 'POST', body: JSON.stringify(body) }),
  updateDriverLocation: (lat, lng) =>
    request('/driver/location', { method: 'PATCH', body: JSON.stringify({ lat, lng }) }),
  updateDriverAvailability: (isAvailable) =>
    request('/driver/availability', { method: 'PATCH', body: JSON.stringify({ isAvailable }) }),
};
