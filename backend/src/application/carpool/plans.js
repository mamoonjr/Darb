/**
 * Application-layer placeholders for carpool use cases (Phase 1).
 * Wired to persistence/APIs in Phases 2–5. Do not call from taxi controllers yet.
 */

const domain = require('../../domain');

/**
 * Describes the intended publish flow (no DB writes in Phase 1).
 */
function planPublishRide({ actorRole, fareOnCreate }) {
  if (actorRole !== 'DRIVER') {
    const err = new Error('Only drivers can publish rides');
    err.code = 'DRIVER_ONLY_PUBLISH';
    err.status = 403;
    throw err;
  }
  domain.assertNoPriceOnRideCreation(fareOnCreate);
  return {
    nextStatus: domain.RIDE_STATUS.PUBLISHED,
    requiresLandmarks: true,
    fareAllowed: false,
  };
}

function planJoinRequest({ originLandmarkId, destinationLandmarkId, rideLandmarks, freeCoords }) {
  domain.assertNoFreeMapJoin({
    ...freeCoords,
    originLandmarkId,
    destinationLandmarkId,
  });
  domain.assertLandmarksBelongToRide(rideLandmarks, originLandmarkId, destinationLandmarkId);
  return {
    nextStatus: domain.JOIN_STATUS.REQUESTED,
    occupiesSeat: false,
  };
}

function planProposePrice({ actorRole, joinStatus, amount }) {
  domain.assertCanProposePrice({ actorRole, joinStatus, amount });
  return {
    nextStatus: domain.JOIN_STATUS.PRICE_PROPOSED,
    amount: Number(amount),
  };
}

function planAcceptPrice({ actorRole, joinStatus }) {
  domain.assertPassengerCanAcceptPrice({ actorRole, joinStatus });
  domain.assertJoinTransition(joinStatus, domain.JOIN_STATUS.PASSENGER_ACCEPTED);
  return {
    nextStatus: domain.JOIN_STATUS.PASSENGER_ACCEPTED,
  };
}

function planConfirmJoin({
  joinStatus,
  confirmedSeats,
  requestedSeats,
  vehicleCapacity,
}) {
  domain.assertJoinTransition(joinStatus, domain.JOIN_STATUS.CONFIRMED);
  domain.assertWithinCapacity({ confirmedSeats, requestedSeats, vehicleCapacity });
  return {
    nextStatus: domain.JOIN_STATUS.CONFIRMED,
    occupiesSeat: true,
  };
}

module.exports = {
  planPublishRide,
  planJoinRequest,
  planProposePrice,
  planAcceptPrice,
  planConfirmJoin,
};
