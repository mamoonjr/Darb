export const API_URL = process.env.EXPO_PUBLIC_API_URL?.trim() || 'http://localhost:3000/api';
export const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL?.trim() || 'http://localhost:3000';

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
  REQUESTED: 'requested',
  ACCEPTED: 'accepted',
  DRIVER_ARRIVED: 'driverArrived',
  IN_PROGRESS: 'inProgress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};
