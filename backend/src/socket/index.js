const { verifyToken, calculateDistance } = require('../utils/helpers');
const { getNearbyDrivers, NEARBY_RADIUS_KM } = require('../services/rideService');

const STALE_DRIVER_MS = 15000; // drop drivers with no update in 15s
const SWEEP_INTERVAL_MS = 5000;

function setupSocket(io) {
  // In-memory presence registries (modular monolith; no Redis).
  const riderLocations = new Map(); // userId -> { lat, lng }
  const driverLocations = new Map(); // driverId -> { lat, lng, socketId, updatedAt }

  // Periodically evict stale drivers and tell riders they went offline.
  setInterval(() => {
    const now = Date.now();
    for (const [driverId, info] of driverLocations) {
      if (now - info.updatedAt > STALE_DRIVER_MS) {
        driverLocations.delete(driverId);
        io.emit('drivers:offline', { driverId });
      }
    }
  }, SWEEP_INTERVAL_MS);

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      socket.user = verifyToken(token);
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    const role = socket.user.activeRole || socket.user.role;
    socket.join(`user:${userId}`);

    socket.on('ride:join', (rideId) => socket.join(`ride:${rideId}`));
    socket.on('ride:leave', (rideId) => socket.leave(`ride:${rideId}`));

    // Rider shares its position so it keeps receiving nearby-driver updates.
    socket.on('rider:location', ({ lat, lng } = {}) => {
      if (lat == null || lng == null) return;
      riderLocations.set(userId, { lat, lng });
    });

    // Snapshot request: returns available drivers within the radius (ack style).
    socket.on('drivers:nearby', async (payload = {}, ack) => {
      const { lat, lng, radius } = payload;
      if (lat == null || lng == null) {
        if (typeof ack === 'function') ack({ drivers: [] });
        return;
      }
      riderLocations.set(userId, { lat, lng });
      try {
        const drivers = await getNearbyDrivers(lat, lng, radius);
        if (typeof ack === 'function') ack({ drivers });
        else socket.emit('drivers:nearby', { drivers });
      } catch (err) {
        if (typeof ack === 'function') ack({ drivers: [], error: err.message });
      }
    });

    // Driver location: relays to the active ride room AND fans out to any
    // nearby riders (within 5km) for the live-proximity map.
    socket.on('driver:location', (data = {}) => {
      // Only active drivers are tracked for proximity.
      if (role !== 'DRIVER') return;
      const { rideId, lat, lng } = data;
      if (lat == null || lng == null) return;
      driverLocations.set(userId, { lat, lng, socketId: socket.id, updatedAt: Date.now() });

      if (rideId) {
        io.to(`ride:${rideId}`).emit('driver:location', { driverId: userId, lat, lng, rideId });
      }

      for (const [riderId, loc] of riderLocations) {
        const distanceKm = calculateDistance(loc.lat, loc.lng, lat, lng);
        if (distanceKm <= NEARBY_RADIUS_KM) {
          io.to(`user:${riderId}`).emit('drivers:location', {
            driverId: userId,
            lat,
            lng,
            distanceKm,
          });
        }
      }
    });

    socket.on('driver:offline', () => {
      driverLocations.delete(userId);
      io.emit('drivers:offline', { driverId: userId });
    });

    socket.on('disconnect', () => {
      riderLocations.delete(userId);
      if (driverLocations.delete(userId)) {
        io.emit('drivers:offline', { driverId: userId });
      }
    });
  });
}

module.exports = { setupSocket };
