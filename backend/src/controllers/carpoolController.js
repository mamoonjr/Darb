const carpoolService = require('../services/carpoolService');
const { ok, fail } = require('../utils/apiResponse');

async function publish(req, res) {
  try {
    const ride = await carpoolService.publishRide(req.user.id, req.body);
    return ok(res, ride, 'Ride published', 201);
  } catch (err) {
    return fail(res, err);
  }
}

async function list(req, res) {
  try {
    const rides = await carpoolService.listPublishedRides();
    return ok(res, rides);
  } catch (err) {
    return fail(res, err);
  }
}

async function getById(req, res) {
  try {
    const ride = await carpoolService.getRide(req.params.id);
    return ok(res, ride);
  } catch (err) {
    return fail(res, err);
  }
}

async function openRequests(req, res) {
  try {
    const ride = await carpoolService.openForRequests(req.user.id, req.params.id);
    return ok(res, ride, 'Ride is receiving requests');
  } catch (err) {
    return fail(res, err);
  }
}

async function join(req, res) {
  try {
    const joinRequest = await carpoolService.joinRide(req.user.id, req.params.id, req.body);
    return ok(res, joinRequest, 'Join request submitted', 201);
  } catch (err) {
    return fail(res, err);
  }
}

async function proposePrice(req, res) {
  try {
    const joinRequest = await carpoolService.proposePrice(
      req.user.id,
      req.params.id,
      req.body.amount
    );
    return ok(res, joinRequest, 'Price proposed');
  } catch (err) {
    return fail(res, err);
  }
}

async function acceptPrice(req, res) {
  try {
    const joinRequest = await carpoolService.acceptPrice(req.user.id, req.params.id);
    return ok(res, joinRequest, 'Price accepted — booking confirmed');
  } catch (err) {
    return fail(res, err);
  }
}

async function reject(req, res) {
  try {
    const asDriver = (req.user.activeRole || req.user.role) === 'DRIVER';
    const joinRequest = await carpoolService.rejectJoin(req.user.id, req.params.id, asDriver);
    return ok(res, joinRequest, asDriver ? 'Join rejected' : 'Join cancelled');
  } catch (err) {
    return fail(res, err);
  }
}

async function start(req, res) {
  try {
    const ride = await carpoolService.startRide(req.user.id, req.params.id);
    return ok(res, ride, 'Ride started');
  } catch (err) {
    return fail(res, err);
  }
}

async function complete(req, res) {
  try {
    const ride = await carpoolService.completeRide(req.user.id, req.params.id);
    return ok(res, ride, 'Ride completed');
  } catch (err) {
    return fail(res, err);
  }
}

module.exports = {
  publish,
  list,
  getById,
  openRequests,
  join,
  proposePrice,
  acceptPrice,
  reject,
  start,
  complete,
};
