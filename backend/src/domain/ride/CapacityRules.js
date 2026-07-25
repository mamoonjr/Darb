/**
 * Capacity & landmark rules — route-based carpool SSOT.
 */

function assertWithinCapacity({ confirmedSeats, requestedSeats, vehicleCapacity }) {
  const next = Number(confirmedSeats || 0) + Number(requestedSeats || 0);
  if (next > Number(vehicleCapacity)) {
    const err = new Error('Vehicle capacity exceeded');
    err.code = 'CAPACITY_EXCEEDED';
    err.status = 400;
    throw err;
  }
}

/**
 * Passengers may only pick landmarks that belong to the published ride.
 * @param {Array<{ id: string }>} rideLandmarks
 * @param {string} originLandmarkId
 * @param {string} destinationLandmarkId
 */
function assertLandmarksBelongToRide(rideLandmarks, originLandmarkId, destinationLandmarkId) {
  const ids = new Set((rideLandmarks || []).map((l) => l.id));
  if (!ids.has(originLandmarkId) || !ids.has(destinationLandmarkId)) {
    const err = new Error('Origin and destination must be predefined ride landmarks');
    err.code = 'INVALID_LANDMARKS';
    err.status = 400;
    throw err;
  }
  if (originLandmarkId === destinationLandmarkId) {
    const err = new Error('Origin and destination landmarks must differ');
    err.code = 'SAME_LANDMARK';
    err.status = 400;
    throw err;
  }
}

/**
 * Reject free lat/lng join payloads on the carpool path (MVP).
 */
function assertNoFreeMapJoin({ pickupLat, pickupLng, dropoffLat, dropoffLng, originLandmarkId, destinationLandmarkId }) {
  const hasFreeCoords =
    pickupLat != null || pickupLng != null || dropoffLat != null || dropoffLng != null;
  if (hasFreeCoords && (!originLandmarkId || !destinationLandmarkId)) {
    const err = new Error('Carpool join requires landmark IDs only — no free map selection');
    err.code = 'FREE_MAP_JOIN_FORBIDDEN';
    err.status = 400;
    throw err;
  }
}

module.exports = {
  assertWithinCapacity,
  assertLandmarksBelongToRide,
  assertNoFreeMapJoin,
};
