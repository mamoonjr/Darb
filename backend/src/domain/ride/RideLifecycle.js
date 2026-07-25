/**
 * Target Ride lifecycle (route-based carpool SSOT).
 * Legacy taxi statuses remain in Prisma until Phase 2/5 cutover.
 */

const RIDE_STATUS = Object.freeze({
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  RECEIVING_REQUESTS: 'RECEIVING_REQUESTS',
  CONFIRMED: 'CONFIRMED',
  STARTED: 'STARTED',
  COMPLETED: 'COMPLETED',
  RATED: 'RATED',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED',
});

/** Allowed transitions for the carpool Ride aggregate. */
const RIDE_TRANSITIONS = Object.freeze({
  [RIDE_STATUS.DRAFT]: [RIDE_STATUS.PUBLISHED, RIDE_STATUS.CANCELLED],
  [RIDE_STATUS.PUBLISHED]: [RIDE_STATUS.RECEIVING_REQUESTS, RIDE_STATUS.CANCELLED],
  [RIDE_STATUS.RECEIVING_REQUESTS]: [RIDE_STATUS.CONFIRMED, RIDE_STATUS.CANCELLED],
  [RIDE_STATUS.CONFIRMED]: [RIDE_STATUS.STARTED, RIDE_STATUS.CANCELLED],
  [RIDE_STATUS.STARTED]: [RIDE_STATUS.COMPLETED, RIDE_STATUS.CANCELLED],
  [RIDE_STATUS.COMPLETED]: [RIDE_STATUS.RATED],
  [RIDE_STATUS.RATED]: [RIDE_STATUS.CLOSED],
  [RIDE_STATUS.CLOSED]: [],
  [RIDE_STATUS.CANCELLED]: [],
});

function canTransitionRide(from, to) {
  const allowed = RIDE_TRANSITIONS[from] || [];
  return allowed.includes(to);
}

function assertRideTransition(from, to) {
  if (!canTransitionRide(from, to)) {
    const err = new Error(`Invalid ride transition: ${from} → ${to}`);
    err.code = 'INVALID_RIDE_TRANSITION';
    err.status = 400;
    throw err;
  }
}

/** Who may start / complete the ride (SSOT: driver only). */
function assertDriverControlsRideProgress(actorRole) {
  if (actorRole !== 'DRIVER') {
    const err = new Error('Only the driver can start or complete the ride');
    err.code = 'DRIVER_ONLY_ACTION';
    err.status = 403;
    throw err;
  }
}

module.exports = {
  RIDE_STATUS,
  RIDE_TRANSITIONS,
  canTransitionRide,
  assertRideTransition,
  assertDriverControlsRideProgress,
};
