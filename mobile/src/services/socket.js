import { io } from 'socket.io-client';
import { SOCKET_URL } from '../constants';
import { api } from './api';

let socket = null;

export async function connectSocket() {
  const token = await api.getToken();
  if (!token) return null;

  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

export function joinRide(rideId) {
  socket?.emit('ride:join', rideId);
}

export function leaveRide(rideId) {
  socket?.emit('ride:leave', rideId);
}

export function emitDriverLocation(rideId, lat, lng) {
  socket?.emit('driver:location', { rideId, lat, lng });
}
