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

// Initial bearing (degrees, 0-360) from point 1 to point 2.
function calculateBearing(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const toDeg = (r) => (r * 180) / Math.PI;
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

// Smallest absolute difference between two bearings (0-180).
function bearingDiff(a, b) {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

// Rough lat/lng bounding box around a point — used as a cheap SQL prefilter
// before refining matches with the precise haversine distance.
function boundingBox(lat, lng, radiusKm) {
  const latDelta = radiusKm / 111; // ~111 km per degree of latitude
  const cos = Math.cos((lat * Math.PI) / 180);
  const lngDelta = radiusKm / (111 * (Math.abs(cos) < 1e-6 ? 1e-6 : cos));
  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - Math.abs(lngDelta),
    maxLng: lng + Math.abs(lngDelta),
  };
}

module.exports = {
  signToken,
  verifyToken,
  sanitizeUser,
  calculateFare,
  calculateDistance,
  calculateBearing,
  bearingDiff,
  estimateMinutes,
  boundingBox,
};
