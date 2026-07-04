const { verifyToken } = require('../utils/helpers');

function setupSocket(io) {
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
    socket.join(`user:${socket.user.id}`);

    socket.on('ride:join', (rideId) => {
      socket.join(`ride:${rideId}`);
    });

    socket.on('ride:leave', (rideId) => {
      socket.leave(`ride:${rideId}`);
    });

    socket.on('driver:location', (data) => {
      if (socket.user.role !== 'DRIVER') return;
      io.to(`ride:${data.rideId}`).emit('driver:location', {
        driverId: socket.user.id,
        lat: data.lat,
        lng: data.lng,
      });
    });

    socket.on('disconnect', () => {});
  });
}

module.exports = { setupSocket };
