/**
 * Join Request lifecycle (route-based carpool SSOT).
 */

const JOIN_STATUS = Object.freeze({
  REQUESTED: 'REQUESTED',
  PRICE_PROPOSED: 'PRICE_PROPOSED',
  PASSENGER_ACCEPTED: 'PASSENGER_ACCEPTED',
  CONFIRMED: 'CONFIRMED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
});

const JOIN_TRANSITIONS = Object.freeze({
  [JOIN_STATUS.REQUESTED]: [
    JOIN_STATUS.PRICE_PROPOSED,
    JOIN_STATUS.REJECTED,
    JOIN_STATUS.CANCELLED,
  ],
  [JOIN_STATUS.PRICE_PROPOSED]: [
    JOIN_STATUS.PASSENGER_ACCEPTED,
    JOIN_STATUS.REJECTED,
    JOIN_STATUS.CANCELLED,
  ],
  [JOIN_STATUS.PASSENGER_ACCEPTED]: [JOIN_STATUS.CONFIRMED, JOIN_STATUS.CANCELLED],
  [JOIN_STATUS.CONFIRMED]: [],
  [JOIN_STATUS.REJECTED]: [],
  [JOIN_STATUS.CANCELLED]: [],
});

function canTransitionJoin(from, to) {
  const allowed = JOIN_TRANSITIONS[from] || [];
  return allowed.includes(to);
}

function assertJoinTransition(from, to) {
  if (!canTransitionJoin(from, to)) {
    const err = new Error(`Invalid join transition: ${from} → ${to}`);
    err.code = 'INVALID_JOIN_TRANSITION';
    err.status = 400;
    throw err;
  }
}

/** Seats are reserved only after CONFIRMED (SSOT). */
function occupiesSeat(status) {
  return status === JOIN_STATUS.CONFIRMED;
}

module.exports = {
  JOIN_STATUS,
  JOIN_TRANSITIONS,
  canTransitionJoin,
  assertJoinTransition,
  occupiesSeat,
};
