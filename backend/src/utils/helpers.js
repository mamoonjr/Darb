const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');

function signToken(payload) {
  return jwt.sign(payload, jwtSecret, { expiresIn: '7d' });
}

function verifyToken(token) {
  return jwt.verify(token, jwtSecret);
}

function sanitizeUser(user) {
  const { password, ...safe } = user;
  return safe;
}

function calculateFare(distanceKm) {
  const baseFare = 5;
  const perKm = 2.5;
  return Math.round((baseFare + distanceKm * perKm) * 100) / 100;
}

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 100) / 100;
}

function estimateMinutes(distanceKm) {
  return Math.max(5, Math.round((distanceKm / 30) * 60));
}

module.exports = {
  signToken,
  verifyToken,
  sanitizeUser,
  calculateFare,
  calculateDistance,
  estimateMinutes,
};
