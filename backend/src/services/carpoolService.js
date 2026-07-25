const prisma = require('../config/database');
const domain = require('../domain');
const plans = require('../application/carpool/plans');

const RIDE_INCLUDE = {
  route: { include: { landmarks: { orderBy: { sequence: 'asc' } } } },
  joinRequests: {
    include: {
      passenger: { select: { id: true, name: true, phone: true } },
      originLandmark: true,
      destinationLandmark: true,
    },
    orderBy: { createdAt: 'desc' },
  },
  driver: { select: { id: true, name: true, phone: true, driverProfile: true } },
};

function httpError(message, status, code) {
  return Object.assign(new Error(message), { status, code });
}

async function getRouteRideOrThrow(rideId) {
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
    include: RIDE_INCLUDE,
  });
  if (!ride || ride.product !== 'ROUTE_CARPOOL') {
    throw httpError('Route ride not found', 404, 'RIDE_NOT_FOUND');
  }
  return ride;
}

async function publishRide(driverId, body) {
  plans.planPublishRide({ actorRole: 'DRIVER', fareOnCreate: body.fare });

  const landmarks = body.landmarks.map((l, i) => ({
    name: l.name,
    address: l.address || null,
    lat: l.lat,
    lng: l.lng,
    sequence: l.sequence != null ? l.sequence : i,
  }));

  const capacity = body.vehicleCapacity || 4;

  const ride = await prisma.ride.create({
    data: {
      product: 'ROUTE_CARPOOL',
      rideType: 'CARPOOL',
      status: 'PUBLISHED',
      driverId,
      riderId: null,
      fare: null,
      vehicleCapacity: capacity,
      totalSeats: capacity,
      availableSeats: capacity,
      route: {
        create: {
          summary: body.summary || null,
          distanceKm: body.distanceKm || null,
          durationMin: body.durationMin || null,
          landmarks: { create: landmarks },
        },
      },
    },
    include: RIDE_INCLUDE,
  });

  return ride;
}

async function listPublishedRides() {
  return prisma.ride.findMany({
    where: {
      product: 'ROUTE_CARPOOL',
      status: { in: ['PUBLISHED', 'RECEIVING_REQUESTS', 'CONFIRMED'] },
    },
    include: RIDE_INCLUDE,
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

async function getRide(rideId) {
  return getRouteRideOrThrow(rideId);
}

async function openForRequests(driverId, rideId) {
  const ride = await getRouteRideOrThrow(rideId);
  if (ride.driverId !== driverId) {
    throw httpError('Forbidden', 403, 'NOT_RIDE_DRIVER');
  }
  domain.assertRideTransition(ride.status, domain.RIDE_STATUS.RECEIVING_REQUESTS);
  return prisma.ride.update({
    where: { id: rideId },
    data: { status: 'RECEIVING_REQUESTS' },
    include: RIDE_INCLUDE,
  });
}

async function joinRide(passengerId, rideId, body) {
  const ride = await getRouteRideOrThrow(rideId);
  if (!['PUBLISHED', 'RECEIVING_REQUESTS'].includes(ride.status)) {
    throw httpError('Ride is not accepting join requests', 400, 'RIDE_NOT_OPEN');
  }
  if (ride.driverId === passengerId) {
    throw httpError('Driver cannot join own ride', 400, 'DRIVER_CANNOT_JOIN');
  }

  const landmarks = ride.route?.landmarks || [];
  plans.planJoinRequest({
    originLandmarkId: body.originLandmarkId,
    destinationLandmarkId: body.destinationLandmarkId,
    rideLandmarks: landmarks,
    freeCoords: {},
  });

  const existing = await prisma.joinRequest.findUnique({
    where: { rideId_passengerId: { rideId, passengerId } },
  });
  if (existing && !['REJECTED', 'CANCELLED'].includes(existing.status)) {
    throw httpError('Join request already exists', 409, 'JOIN_EXISTS');
  }

  const capacity = ride.vehicleCapacity || ride.totalSeats;
  const confirmedSeats = await prisma.joinRequest.aggregate({
    where: { rideId, status: 'CONFIRMED' },
    _sum: { seats: true },
  });
  domain.assertWithinCapacity({
    confirmedSeats: confirmedSeats._sum.seats || 0,
    requestedSeats: body.seats,
    vehicleCapacity: capacity,
  });

  const join = await prisma.$transaction(async (tx) => {
    if (ride.status === 'PUBLISHED') {
      await tx.ride.update({
        where: { id: rideId },
        data: { status: 'RECEIVING_REQUESTS' },
      });
    }

    if (existing) {
      return tx.joinRequest.update({
        where: { id: existing.id },
        data: {
          originLandmarkId: body.originLandmarkId,
          destinationLandmarkId: body.destinationLandmarkId,
          seats: body.seats,
          status: 'REQUESTED',
          proposedPrice: null,
          proposedAt: null,
          decidedAt: null,
        },
        include: {
          originLandmark: true,
          destinationLandmark: true,
          passenger: { select: { id: true, name: true, phone: true } },
        },
      });
    }

    return tx.joinRequest.create({
      data: {
        rideId,
        passengerId,
        originLandmarkId: body.originLandmarkId,
        destinationLandmarkId: body.destinationLandmarkId,
        seats: body.seats,
        status: 'REQUESTED',
      },
      include: {
        originLandmark: true,
        destinationLandmark: true,
        passenger: { select: { id: true, name: true, phone: true } },
      },
    });
  });

  return join;
}

async function proposePrice(driverId, joinRequestId, amount) {
  const join = await prisma.joinRequest.findUnique({
    where: { id: joinRequestId },
    include: { ride: true },
  });
  if (!join || join.ride.product !== 'ROUTE_CARPOOL') {
    throw httpError('Join request not found', 404, 'JOIN_NOT_FOUND');
  }
  if (join.ride.driverId !== driverId) {
    throw httpError('Forbidden', 403, 'NOT_RIDE_DRIVER');
  }

  plans.planProposePrice({
    actorRole: 'DRIVER',
    joinStatus: join.status,
    amount,
  });

  return prisma.joinRequest.update({
    where: { id: joinRequestId },
    data: {
      status: 'PRICE_PROPOSED',
      proposedPrice: Number(amount),
      proposedAt: new Date(),
    },
    include: {
      originLandmark: true,
      destinationLandmark: true,
      passenger: { select: { id: true, name: true, phone: true } },
    },
  });
}

async function acceptPrice(passengerId, joinRequestId) {
  const join = await prisma.joinRequest.findUnique({
    where: { id: joinRequestId },
    include: { ride: true },
  });
  if (!join || join.ride.product !== 'ROUTE_CARPOOL') {
    throw httpError('Join request not found', 404, 'JOIN_NOT_FOUND');
  }
  if (join.passengerId !== passengerId) {
    throw httpError('Forbidden', 403, 'NOT_JOIN_PASSENGER');
  }

  plans.planAcceptPrice({
    actorRole: 'RIDER',
    joinStatus: join.status,
  });

  const capacity = join.ride.vehicleCapacity || join.ride.totalSeats;
  const confirmedSeats = await prisma.joinRequest.aggregate({
    where: { rideId: join.rideId, status: 'CONFIRMED' },
    _sum: { seats: true },
  });

  plans.planConfirmJoin({
    joinStatus: 'PASSENGER_ACCEPTED',
    confirmedSeats: confirmedSeats._sum.seats || 0,
    requestedSeats: join.seats,
    vehicleCapacity: capacity,
  });

  return prisma.$transaction(async (tx) => {
    const updated = await tx.joinRequest.update({
      where: { id: joinRequestId },
      data: {
        status: 'CONFIRMED',
        decidedAt: new Date(),
      },
      include: {
        originLandmark: true,
        destinationLandmark: true,
        passenger: { select: { id: true, name: true, phone: true } },
      },
    });

    const confirmed = await tx.joinRequest.aggregate({
      where: { rideId: join.rideId, status: 'CONFIRMED' },
      _sum: { seats: true },
    });
    const used = confirmed._sum.seats || 0;
    await tx.ride.update({
      where: { id: join.rideId },
      data: {
        status: 'CONFIRMED',
        availableSeats: Math.max(0, capacity - used),
      },
    });

    return updated;
  });
}

async function rejectJoin(actorId, joinRequestId, asDriver) {
  const join = await prisma.joinRequest.findUnique({
    where: { id: joinRequestId },
    include: { ride: true },
  });
  if (!join || join.ride.product !== 'ROUTE_CARPOOL') {
    throw httpError('Join request not found', 404, 'JOIN_NOT_FOUND');
  }

  if (asDriver) {
    if (join.ride.driverId !== actorId) {
      throw httpError('Forbidden', 403, 'NOT_RIDE_DRIVER');
    }
    domain.assertJoinTransition(join.status, domain.JOIN_STATUS.REJECTED);
    return prisma.joinRequest.update({
      where: { id: joinRequestId },
      data: { status: 'REJECTED', decidedAt: new Date() },
    });
  }

  if (join.passengerId !== actorId) {
    throw httpError('Forbidden', 403, 'NOT_JOIN_PASSENGER');
  }
  domain.assertJoinTransition(join.status, domain.JOIN_STATUS.CANCELLED);
  return prisma.joinRequest.update({
    where: { id: joinRequestId },
    data: { status: 'CANCELLED', decidedAt: new Date() },
  });
}

async function startRide(driverId, rideId) {
  const ride = await getRouteRideOrThrow(rideId);
  if (ride.driverId !== driverId) {
    throw httpError('Forbidden', 403, 'NOT_RIDE_DRIVER');
  }
  domain.assertDriverControlsRideProgress('DRIVER');
  domain.assertRideTransition(ride.status, domain.RIDE_STATUS.STARTED);
  return prisma.ride.update({
    where: { id: rideId },
    data: { status: 'STARTED' },
    include: RIDE_INCLUDE,
  });
}

async function completeRide(driverId, rideId) {
  const ride = await getRouteRideOrThrow(rideId);
  if (ride.driverId !== driverId) {
    throw httpError('Forbidden', 403, 'NOT_RIDE_DRIVER');
  }
  domain.assertDriverControlsRideProgress('DRIVER');
  domain.assertRideTransition(ride.status, domain.RIDE_STATUS.COMPLETED);
  return prisma.ride.update({
    where: { id: rideId },
    data: { status: 'COMPLETED', completedAt: new Date() },
    include: RIDE_INCLUDE,
  });
}

module.exports = {
  publishRide,
  listPublishedRides,
  getRide,
  openForRequests,
  joinRide,
  proposePrice,
  acceptPrice,
  rejectJoin,
  startRide,
  completeRide,
};
