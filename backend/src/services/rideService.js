const prisma = require('../config/database');
const {
  calculateDistance,
  calculateFare,
  estimateMinutes,
} = require('../utils/helpers');
const paymentService = require('./paymentService');

const rideInclude = {
  rider: { select: { id: true, name: true, phone: true, avatar: true } },
  driver: { select: { id: true, name: true, phone: true, avatar: true, driverProfile: true } },
  payment: true,
  review: true,
};

async function createRide(riderId, data) {
  const activeRide = await prisma.ride.findFirst({
    where: {
      riderId,
      status: { in: ['REQUESTED', 'ACCEPTED', 'DRIVER_ARRIVED', 'IN_PROGRESS'] },
    },
  });
  if (activeRide) {
    throw Object.assign(new Error('You already have an active ride'), { status: 409 });
  }

  const distance = calculateDistance(
    data.pickupLat,
    data.pickupLng,
    data.dropoffLat,
    data.dropoffLng
  );

  return prisma.ride.create({
    data: {
      riderId,
      pickupAddress: data.pickupAddress,
      pickupLat: data.pickupLat,
      pickupLng: data.pickupLng,
      dropoffAddress: data.dropoffAddress,
      dropoffLat: data.dropoffLat,
      dropoffLng: data.dropoffLng,
      distance,
      fare: calculateFare(distance),
      estimatedMinutes: estimateMinutes(distance),
    },
    include: rideInclude,
  }).then(async (ride) => {
    await paymentService.createPayment(ride.id, ride.fare);
    return prisma.ride.findUnique({ where: { id: ride.id }, include: rideInclude });
  });
}

async function getRideById(rideId, userId, role) {
  const ride = await prisma.ride.findUnique({ where: { id: rideId }, include: rideInclude });
  if (!ride) {
    throw Object.assign(new Error('Ride not found'), { status: 404 });
  }
  const isOwner = ride.riderId === userId || ride.driverId === userId;
  // A driver may view an unassigned ride that is still open for acceptance
  // (mirrors the availability list in getUserRides), so they can open it to accept.
  const isAvailableForDriver =
    role === 'DRIVER' && ride.driverId === null && ride.status === 'REQUESTED';
  if (role !== 'ADMIN' && !isOwner && !isAvailableForDriver) {
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }
  return ride;
}

async function getUserRides(userId, role) {
  const where =
    role === 'DRIVER'
      ? {
          OR: [
            { driverId: userId },
            { driverId: null, status: 'REQUESTED', payment: { status: 'PAID' } },
          ],
        }
      : { riderId: userId };

  return prisma.ride.findMany({
    where,
    include: rideInclude,
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

async function acceptRide(rideId, driverId) {
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
    include: { payment: true },
  });
  if (!ride || ride.status !== 'REQUESTED') {
    throw Object.assign(new Error('Ride not available'), { status: 400 });
  }
  if (ride.payment?.status !== 'PAID') {
    throw Object.assign(new Error('Ride payment pending'), { status: 400 });
  }

  const driver = await prisma.user.findUnique({
    where: { id: driverId },
    include: { driverProfile: true },
  });
  if (!driver || driver.role !== 'DRIVER' || !driver.driverProfile?.isAvailable) {
    throw Object.assign(new Error('Driver not available'), { status: 400 });
  }

  return prisma.ride.update({
    where: { id: rideId },
    data: { driverId, status: 'ACCEPTED' },
    include: rideInclude,
  });
}

async function updateRideStatus(rideId, userId, role, status) {
  const ride = await prisma.ride.findUnique({ where: { id: rideId } });
  if (!ride) {
    throw Object.assign(new Error('Ride not found'), { status: 404 });
  }

  const allowed = getAllowedTransitions(ride.status, status, userId, role, ride);
  if (!allowed) {
    throw Object.assign(new Error('Invalid status transition'), { status: 400 });
  }

  return prisma.ride.update({
    where: { id: rideId },
    data: {
      status,
      ...(status === 'COMPLETED' ? { completedAt: new Date() } : {}),
    },
    include: rideInclude,
  });
}

function getAllowedTransitions(current, next, userId, role, ride) {
  const transitions = {
    REQUESTED: ['ACCEPTED', 'CANCELLED'],
    ACCEPTED: ['DRIVER_ARRIVED', 'CANCELLED'],
    DRIVER_ARRIVED: ['IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  };

  if (!transitions[current]?.includes(next)) return false;
  if (next === 'ACCEPTED') return role === 'DRIVER';
  if (next === 'CANCELLED') return ride.riderId === userId || ride.driverId === userId;
  if (['DRIVER_ARRIVED', 'IN_PROGRESS', 'COMPLETED'].includes(next)) {
    return ride.driverId === userId;
  }
  return false;
}

async function updateDriverLocation(driverId, lat, lng) {
  return prisma.driverProfile.update({
    where: { userId: driverId },
    data: { lat, lng },
  });
}

async function updateDriverAvailability(driverId, isAvailable) {
  return prisma.driverProfile.update({
    where: { userId: driverId },
    data: { isAvailable },
  });
}

async function getActiveRideForDriver(driverId) {
  return prisma.ride.findFirst({
    where: {
      driverId,
      status: { in: ['ACCEPTED', 'DRIVER_ARRIVED', 'IN_PROGRESS'] },
    },
  });
}

module.exports = {
  createRide,
  getRideById,
  getUserRides,
  acceptRide,
  updateRideStatus,
  updateDriverLocation,
  updateDriverAvailability,
  getActiveRideForDriver,
};
