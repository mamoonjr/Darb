/**
 * Pricing rules — route-based carpool SSOT.
 * Driver never sets price at ride creation; price comes after join request.
 */

function assertNoPriceOnRideCreation(proposedFare) {
  if (proposedFare != null && Number(proposedFare) > 0) {
    const err = new Error('Fare must not be set when creating/publishing a ride');
    err.code = 'FARE_NOT_ALLOWED_ON_CREATE';
    err.status = 400;
    throw err;
  }
}

function assertCanProposePrice({ joinStatus, amount, actorRole }) {
  if (actorRole !== 'DRIVER') {
    const err = new Error('Only the driver can propose a price');
    err.code = 'DRIVER_ONLY_PRICE';
    err.status = 403;
    throw err;
  }
  if (joinStatus !== 'REQUESTED' && joinStatus !== 'PRICE_PROPOSED') {
    const err = new Error('Price can only be proposed on an open join request');
    err.code = 'INVALID_PRICE_STATE';
    err.status = 400;
    throw err;
  }
  if (amount == null || Number(amount) <= 0) {
    const err = new Error('Proposed price must be a positive amount');
    err.code = 'INVALID_PRICE_AMOUNT';
    err.status = 400;
    throw err;
  }
}

function assertPassengerCanAcceptPrice({ joinStatus, actorRole }) {
  if (actorRole !== 'RIDER' && actorRole !== 'PASSENGER') {
    const err = new Error('Only the passenger can accept the proposed price');
    err.code = 'PASSENGER_ONLY_ACCEPT_PRICE';
    err.status = 403;
    throw err;
  }
  if (joinStatus !== 'PRICE_PROPOSED') {
    const err = new Error('No price proposal to accept');
    err.code = 'NO_PRICE_PROPOSAL';
    err.status = 400;
    throw err;
  }
}

module.exports = {
  assertNoPriceOnRideCreation,
  assertCanProposePrice,
  assertPassengerCanAcceptPrice,
};
