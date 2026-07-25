import * as SecureStore from 'expo-secure-store';

import { API_URL } from '../constants';



const TOKEN_KEY = 'darb_token';



async function getToken() {

  return SecureStore.getItemAsync(TOKEN_KEY);

}



async function setToken(token) {

  await SecureStore.setItemAsync(TOKEN_KEY, token);

}



async function clearToken() {

  await SecureStore.deleteItemAsync(TOKEN_KEY);

}



async function request(path, options = {}) {

  const token = await getToken();

  const headers = {

    'Content-Type': 'application/json',

    ...(token ? { Authorization: `Bearer ${token}` } : {}),

    ...options.headers,

  };



  const response = await fetch(`${API_URL}${path}`, { ...options, headers });

  const data = await response.json().catch(() => ({}));



  if (!response.ok) {

    const err = new Error(data.error || 'Request failed');
    if (data.code) err.code = data.code;
    throw err;

  }

  return data;

}



export const api = {

  getToken,

  setToken,

  clearToken,

  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

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

