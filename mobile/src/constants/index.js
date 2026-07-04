export const API_URL = process.env.EXPO_PUBLIC_API_URL?.trim() || 'http://localhost:3000/api';
export const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL?.trim() || 'http://localhost:3000';
export const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() || '';

// Country restriction for all Google Places lookups (Jordan only).
export const PLACES_COUNTRY = 'jo';

// Map baseline centered on Amman, Jordan.
export const JORDAN_REGION = {
  latitude: 31.9522,
  longitude: 35.9106,
  latitudeDelta: 0.3,
  longitudeDelta: 0.3,
};

export const RIDE_TYPES = {
  SINGLE: 'SINGLE',
  CARPOOL: 'CARPOOL',
  BOX_DELIVERY: 'BOX_DELIVERY',
};

export const COLORS = {
  primary: '#1a73e8',
  primaryDark: '#1557b0',
  background: '#f5f7fa',
  surface: '#ffffff',
  text: '#1a1a2e',
  textSecondary: '#6b7280',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  border: '#e5e7eb',
};

export const RIDE_STATUS_LABELS = {
  PENDING_RECEIVER_APPROVAL: 'pendingReceiverApproval',
  REQUESTED: 'requested',
  ACCEPTED: 'accepted',
  DRIVER_ARRIVED: 'driverArrived',
  IN_PROGRESS: 'inProgress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};
