const crypto = require('crypto');
const prisma = require('../config/database');
const {
  calculateDistance,
  calculateFare,
  calculateBearing,
  bearingDiff,
  estimateMinutes,
  boundingBox,
  findUserByPhone,
} = require('../utils/helpers');
const paymentService = require('./paymentService');

const NEARBY_RADIUS_KM = 5;
const CARPOOL_PICKUP_THRESHOLD_KM = 1.5;
const CARPOOL_DROPOFF_THRESHOLD_KM = 2.0;
const CARPOOL_BEARING_THRESHOLD_DEG = 45; // "same direction" tolerance
const DEFAULT_CARPOOL_SEATS = 4;

// Drivers who dismissed an offer — in-memory per modular-monolith spec.
const driverDeclinedOffers = new Map(); // driverId -> Set<rideId>

const ACTIVE_STATUSES = [
  'PENDING_RECEIVER_APPROVAL',
  'REQUESTED',
  'ACCEPTED',
  'DRIVER_ARRIVED',
  'IN_PROGRESS',
];

const rideInclude = {
  rider: { select: { id: true, name: true, phone: true, avatar: true } },
  driver: {
    select: { id: true, name: true, phone: true, avatar: true, driverProfile: true },
  },
  receiver: { select: { id: true, name: true, phone: true } },
  passengers: {
    include: { user: { select: { id: true, name: true, phone: true } } },
    orderBy: { createdAt: 'asc' },
  },
  payment: true,
  review: true,
};

function refetch(rideId) {
  return prisma.ride.findUnique({ where: { id: rideId }, include: rideInclude });
}

async function assertNoActiveRide(riderId) {
  const active = await prisma.ride.findFirst({
    where: { riderId, status: { in: ACTIVE_STATUSES } },
  });
  if (active) {
    throw Object.assign(new Error('You already have an active ride'), { status: 409 });
  }
}

// ---------------------------------------------------------------------------
// Ride creation (dispatches by type)
// ---------------------------------------------------------------------------

async function createRide(riderId, data) {
  const type = data.rideType || 'SINGLE';
  if (type === 'BOX_DELIVERY') return createBoxDelivery(riderId, data);
  if (type === 'CARPOOL') return createCarpoolRide(riderId, data);
  return createSingleRide(riderId, data);
}

async function createSingleRide(riderId, data) {
  await assertNoActiveRide(riderId);

  const distance = calculateDistance(
    data.pickupLat,
    data.pickupLng,
    data.dropoffLat,
    data.dropoffLng
  );

  const ride = await prisma.ride.create({
    data: {
      riderId,
      rideType: 'SINGLE',
      pickupAddress: data.pickupAddress,
      pickupLat: data.pickupLat,
      pickupLng: data.pickupLng,
      dropoffAddress: data.dropoffAddress,
      dropoffLat: data.dropoffLat,
      dropoffLng: data.dropoffLng,
      distance,
      fare: calculateFare(distance),
      estimatedMinutes: estimateMinutes(distance),
      totalSeats: 1,
      availableSeats: 0,
    },
  });

  await paymentService.createPayment(ride.id, ride.fare);
  return { ride: await refetch(ride.id) };
}

// ---------------------------------------------------------------------------
// Carpooling
// ---------------------------------------------------------------------------

async function recomputeCarpoolFares(rideId) {
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
    include: { passengers: true },
  });
  if (!ride) return;
  const total = ride.fare || 0;
  const seatSum = ride.passengers.reduce((s, p) => s + p.seats, 0) || 1;
  // Split proportionally to the number of seats each passenger booked.
  await Promise.all(
    ride.passengers.map((p) =>
      prisma.ridePassenger.update({
        where: { id: p.id },
        data: { fareShare: Math.round((total * (p.seats / seatSum)) * 100) / 100 },
      })
    )
  );
}

function findCarpoolMatch(candidates, riderId, data, seats) {
  const reqBearing = calculateBearing(
    data.pickupLat,
    data.pickupLng,
    data.dropoffLat,
    data.dropoffLng
  );
  return candidates.find((r) => {
    if (r.riderId === riderId) return false;
    if (r.passengers.some((p) => p.userId === riderId)) return false;
    if (r.availableSeats < seats) return false;
    const pickupClose =
      calculateDistance(r.pickupLat, r.pickupLng, data.pickupLat, data.pickupLng) <=
      CARPOOL_PICKUP_THRESHOLD_KM;
    const dropClose =
      calculateDistance(r.dropoffLat, r.dropoffLng, data.dropoffLat, data.dropoffLng) <=
      CARPOOL_DROPOFF_THRESHOLD_KM;
    // Same direction: the two routes must head roughly the same way.
    const rideBearing = calculateBearing(r.pickupLat, r.pickupLng, r.dropoffLat, r.dropoffLng);
    const sameDirection = bearingDiff(reqBearing, rideBearing) <= CARPOOL_BEARING_THRESHOLD_DEG;
    return pickupClose && dropClose && sameDirection;
  });
}

async function createCarpoolRide(riderId, data) {
  await assertNoActiveRide(riderId);
  const seats = data.seats || 1;

  const candidates = await prisma.ride.findMany({
    where: { rideType: 'CARPOOL', status: { in: ['REQUESTED', 'ACCEPTED'] } },
    include: { passengers: true },
  });

  const match = findCarpoolMatch(candidates, riderId, data, seats);

  if (match) {
    await prisma.ridePassenger.create({
      data: {
        rideId: match.id,
        userId: riderId,
        seats,
        pickupAddress: data.pickupAddress,
        pickupLat: data.pickupLat,
        pickupLng: data.pickupLng,
        dropoffAddress: data.dropoffAddress,
        dropoffLat: data.dropoffLat,
        dropoffLng: data.dropoffLng,
      },
    });
    await prisma.ride.update({
      where: { id: match.id },
      data: { availableSeats: { decrement: seats } },
    });
    await recomputeCarpoolFares(match.id);
    return { ride: await refetch(match.id), matched: true };
  }

  const distance = calculateDistance(
    data.pickupLat,
    data.pickupLng,
    data.dropoffLat,
    data.dropoffLng
  );
  const fare = calculateFare(distance);
  const totalSeats = data.totalSeats || DEFAULT_CARPOOL_SEATS;

  const ride = await prisma.ride.create({
    data: {
      riderId,
      rideType: 'CARPOOL',
      pickupAddress: data.pickupAddress,
      pickupLat: data.pickupLat,
      pickupLng: data.pickupLng,
      dropoffAddress: data.dropoffAddress,
      dropoffLat: data.dropoffLat,
      dropoffLng: data.dropoffLng,
      distance,
      fare,
      estimatedMinutes: estimateMinutes(distance),
      totalSeats,
      availableSeats: Math.max(0, totalSeats - seats),
      passengers: {
        create: {
          userId: riderId,
          seats,
          pickupAddress: data.pickupAddress,
          pickupLat: data.pickupLat,
          pickupLng: data.pickupLng,
          dropoffAddress: data.dropoffAddress,
          dropoffLat: data.dropoffLat,
          dropoffLng: data.dropoffLng,
          fareShare: fare,
        },
      },
    },
  });

  return { ride: await refetch(ride.id), matched: false };
}

// ---------------------------------------------------------------------------
// Darb Box (package delivery)
// ---------------------------------------------------------------------------

async function createBoxDelivery(riderId, data) {
  await assertNoActiveRide(riderId);
  if (!data.receiverPhone) {
    throw Object.assign(new Error('Receiver phone is required'), { status: 400 });
  }

  const receiver = await findUserByPhone(prisma, data.receiverPhone, {
    id: true,
    name: true,
    phone: true,
  });
  const external = !receiver;

  if (external && (data.dropoffLat == null || data.dropoffLng == null)) {
    throw Object.assign(
      new Error('Destination is required for unregistered receivers'),
      { status: 400 }
    );
  }

  const hasDropoff = data.dropoffLat != null && data.dropoffLng != null;
  const distance = hasDropoff
    ? calculateDistance(data.pickupLat, data.pickupLng, data.dropoffLat, data.dropoffLng)
    : null;

  // Registered receivers must approve and share GPS first; external receivers
  // are auto-approved (we only mock an SMS with a tracking link).
  const status = external ? 'REQUESTED' : 'PENDING_RECEIVER_APPROVAL';

  const ride = await prisma.ride.create({
    data: {
      riderId,
      rideType: 'BOX_DELIVERY',
      status,
      pickupAddress: data.pickupAddress,
      pickupLat: data.pickupLat,
      pickupLng: data.pickupLng,
      dropoffAddress: hasDropoff ? data.dropoffAddress : 'بانتظار موقع المستلم',
      dropoffLat: hasDropoff ? data.dropoffLat : data.pickupLat,
      dropoffLng: hasDropoff ? data.dropoffLng : data.pickupLng,
      distance,
      fare: distance != null ? calculateFare(distance) : null,
      estimatedMinutes: distance != null ? estimateMinutes(distance) : null,
      totalSeats: 1,
      availableSeats: 0,
      receiverId: receiver?.id || null,
      receiverPhone: receiver?.phone || data.receiverPhone,
      receiverName: data.receiverName || receiver?.name || null,
      packageDesc: data.packageDesc || null,
    },
  });

  if (ride.fare != null) {
    await paymentService.createPayment(ride.id, ride.fare);
  }

  // External receivers get a tracking code/link instead of an in-app approval.
  // SMS delivery is intentionally left as a future TODO (no third-party provider).
  let tracking = null;
  if (external) {
    const trackingCode = `DB-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    tracking = {
      trackingCode,
      trackingUrl: `https://track.darb.app/box/${ride.id}?code=${trackingCode}`,
    };
  }

  return {
    ride: await refetch(ride.id),
    external,
    pendingApproval: !external,
    ...(tracking || {}),
  };
}

async function approveBoxDelivery(rideId, receiverUserId, { lat, lng, address }) {
  const ride = await prisma.ride.findUnique({ where: { id: rideId } });
  if (!ride || ride.rideType !== 'BOX_DELIVERY') {
    throw Object.assign(new Error('Delivery not found'), { status: 404 });
  }
  if (ride.receiverId !== receiverUserId) {
    throw Object.assign(new Error('Only the receiver can approve this delivery'), { status: 403 });
  }
  if (ride.status !== 'PENDING_RECEIVER_APPROVAL') {
    throw Object.assign(new Error('Delivery is not awaiting approval'), { status: 400 });
  }

  const distance = calculateDistance(ride.pickupLat, ride.pickupLng, lat, lng);
  const fare = calculateFare(distance);

  await prisma.ride.update({
    where: { id: rideId },
    data: {
      status: 'REQUESTED',
      dropoffLat: lat,
      dropoffLng: lng,
      dropoffAddress: address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      distance,
      fare,
      estimatedMinutes: estimateMinutes(distance),
    },
  });

  await paymentService.createPayment(rideId, fare);
  return refetch(rideId);
}

async function rejectBoxDelivery(rideId, receiverUserId) {
  const ride = await prisma.ride.findUnique({ where: { id: rideId } });
  if (!ride || ride.rideType !== 'BOX_DELIVERY') {
    throw Object.assign(new Error('Delivery not found'), { status: 404 });
  }
  if (ride.receiverId !== receiverUserId) {
    throw Object.assign(new Error('Only the receiver can reject this delivery'), { status: 403 });
  }
  if (ride.status !== 'PENDING_RECEIVER_APPROVAL') {
    throw Object.assign(new Error('Delivery is not awaiting approval'), { status: 400 });
  }
  await prisma.ride.update({ where: { id: rideId }, data: { status: 'CANCELLED' } });
  return refetch(rideId);
}

async function saveDeliveryProof(rideId, driverId, imageUrl) {
  const ride = await prisma.ride.findUnique({ where: { id: rideId } });
  if (!ride) {
    throw Object.assign(new Error('Ride not found'), { status: 404 });
  }
  if (ride.rideType !== 'BOX_DELIVERY') {
    throw Object.assign(new Error('Proof of delivery only applies to Darb Box'), { status: 400 });
  }
  if (ride.driverId !== driverId) {
    throw Object.assign(new Error('Only the assigned driver can upload proof'), { status: 403 });
  }
  await prisma.ride.update({ where: { id: rideId }, data: { deliveryProofUrl: imageUrl } });
  return refetch(rideId);
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

async function getRideById(rideId, userId, role) {
  const ride = await refetch(rideId);
  if (!ride) {
    throw Object.assign(new Error('Ride not found'), { status: 404 });
  }
  const isOwner =
    ride.riderId === userId || ride.driverId === userId || ride.receiverId === userId;
  const isPassenger = ride.passengers?.some((p) => p.userId === userId);
  // A driver may open an unassigned, still-open ride so they can accept it.
  const isAvailableForDriver =
    role === 'DRIVER' && ride.driverId === null && ride.status === 'REQUESTED';
  if (role !== 'ADMIN' && !isOwner && !isPassenger && !isAvailableForDriver) {
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }
  return ride;
}

async function getUserRides(userId, role) {
  const where =
    role === 'DRIVER'
      ? { driverId: userId }
      : {
          OR: [
            { riderId: userId },
            { receiverId: userId },
            { passengers: { some: { userId } } },
          ],
        };

  return prisma.ride.findMany({
    where,
    include: rideInclude,
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

// Open ride requests near an online driver (pickup within radius).
async function getDriverIncomingRequests(driverId, lat, lng, radiusKm = NEARBY_RADIUS_KM) {
  if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) {
    return [];
  }

  const profile = await prisma.driverProfile.findUnique({ where: { userId: driverId } });
  if (!profile?.isAvailable) return [];

  const box = boundingBox(lat, lng, radiusKm);
  const declined = driverDeclinedOffers.get(driverId) || new Set();

  const rides = await prisma.ride.findMany({
    where: {
      driverId: null,
      status: 'REQUESTED',
      pickupLat: { gte: box.minLat, lte: box.maxLat },
      pickupLng: { gte: box.minLng, lte: box.maxLng },
      OR: [{ rideType: 'CARPOOL' }, { payment: { status: 'PAID' } }],
    },
    include: rideInclude,
    orderBy: { createdAt: 'desc' },
    take: 30,
  });

  return rides
    .filter((r) => !declined.has(r.id))
    .map((r) => ({
      ...r,
      distanceKm: calculateDistance(lat, lng, r.pickupLat, r.pickupLng),
    }))
    .filter((r) => r.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

function declineRideOffer(rideId, driverId) {
  if (!driverDeclinedOffers.has(driverId)) {
    driverDeclinedOffers.set(driverId, new Set());
  }
  driverDeclinedOffers.get(driverId).add(rideId);
}

async function offerRideToNearbyDrivers(ride, io) {
  if (!ride || ride.status !== 'REQUESTED' || ride.driverId) return;

  const isPayable =
    ride.rideType === 'CARPOOL' || ride.payment?.status === 'PAID';
  if (!isPayable) return;

  const { notifyDriverRideOffer } = require('./notificationService');
  const nearby = await getNearbyDrivers(ride.pickupLat, ride.pickupLng);

  for (const d of nearby) {
    if (driverDeclinedOffers.get(d.driverId)?.has(ride.id)) continue;
    await notifyDriverRideOffer(d.driverId, ride, d.distanceKm);
    io?.to(`user:${d.driverId}`).emit('ride:offer', {
      ...ride,
      distanceKm: d.distanceKm,
    });
  }
}

function closeRideOffer(rideId, io) {
  io?.emit('ride:offer:closed', { rideId });
}

// ---------------------------------------------------------------------------
// Live proximity drivers
// ---------------------------------------------------------------------------

async function getNearbyDrivers(lat, lng, radiusKm = NEARBY_RADIUS_KM) {
  const box = boundingBox(lat, lng, radiusKm);
  const drivers = await prisma.driverProfile.findMany({
    where: {
      isAvailable: true,
      lat: { gte: box.minLat, lte: box.maxLat },
      lng: { gte: box.minLng, lte: box.maxLng },
      user: { activeRole: 'DRIVER', isActive: true },
    },
    include: { user: { select: { id: true, name: true } } },
  });

  return drivers
    .filter((d) => d.lat != null && d.lng != null)
    .map((d) => ({
      driverId: d.userId,
      name: d.user.name,
      lat: d.lat,
      lng: d.lng,
      rating: d.rating,
      vehicleMake: d.vehicleMake,
      vehicleModel: d.vehicleModel,
      vehicleColor: d.vehicleColor,
      vehiclePlate: d.vehiclePlate,
      distanceKm: calculateDistance(lat, lng, d.lat, d.lng),
    }))
    .filter((d) => d.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

// ---------------------------------------------------------------------------
// Lifecycle transitions
// ---------------------------------------------------------------------------

const DRIVER_BUSY_STATUSES = ['ACCEPTED', 'DRIVER_ARRIVED', 'IN_PROGRESS'];

async function getActiveRidesForDriver(driverId) {
  return prisma.ride.findMany({
    where: {
      driverId,
      status: { in: DRIVER_BUSY_STATUSES },
    },
    select: { id: true, rideType: true, status: true },
    orderBy: { createdAt: 'asc' },
  });
}

// A driver may hold at most one active ride, unless pairing CARPOOL + BOX_DELIVERY.
function canDriverAcceptWhileBusy(activeRides, incomingType) {
  if (activeRides.length === 0) return true;
  if (activeRides.length >= 2) return false;
  if (incomingType === 'SINGLE') return false;

  const activeType = activeRides[0].rideType;
  if (activeType === 'SINGLE') return false;
  if (activeType === incomingType) return false;

  const types = new Set([activeType, incomingType]);
  return types.has('CARPOOL') && types.has('BOX_DELIVERY');
}

async function assertDriverCanAccept(driverId, incomingRideType) {
  const active = await getActiveRidesForDriver(driverId);
  if (canDriverAcceptWhileBusy(active, incomingRideType)) return;

  let code = 'DRIVER_DUAL_ONLY_BOX_CARPOOL';
  if (active.length >= 2) code = 'DRIVER_MAX_ACTIVE_RIDES';
  else if (incomingRideType === 'SINGLE' || active[0]?.rideType === 'SINGLE') code = 'DRIVER_BUSY_SINGLE';

  const messages = {
    DRIVER_MAX_ACTIVE_RIDES: 'Driver already has the maximum active rides',
    DRIVER_BUSY_SINGLE: 'Finish your current ride before accepting another',
    DRIVER_DUAL_ONLY_BOX_CARPOOL:
      'You can only run two rides together when one is carpool and one is a package delivery',
  };

  throw Object.assign(new Error(messages[code]), { status: 409, code });
}

async function acceptRide(rideId, driverId) {
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
    include: { payment: true },
  });
  if (!ride || ride.status !== 'REQUESTED') {
    throw Object.assign(new Error('Ride not available'), { status: 400 });
  }
  // Carpool settles per-passenger, so it is not gated on a single upfront payment.
  if (ride.rideType !== 'CARPOOL' && ride.payment?.status !== 'PAID') {
    throw Object.assign(new Error('Ride payment pending'), { status: 400 });
  }

  const driver = await prisma.user.findUnique({
    where: { id: driverId },
    include: { driverProfile: true },
  });
  if (!driver || !driver.roles.includes('DRIVER') || !driver.driverProfile?.isAvailable) {
    throw Object.assign(new Error('Driver not available'), { status: 400 });
  }

  await assertDriverCanAccept(driverId, ride.rideType);

  await prisma.ride.update({
    where: { id: rideId },
    data: { driverId, status: 'ACCEPTED' },
  });
  return refetch(rideId);
}

async function updateRideStatus(rideId, userId, role, status) {
  const ride = await prisma.ride.findUnique({ where: { id: rideId } });
  if (!ride) {
    throw Object.assign(new Error('Ride not found'), { status: 404 });
  }

  if (!getAllowedTransitions(ride.status, status, userId, role, ride)) {
    throw Object.assign(new Error('Invalid status transition'), { status: 400 });
  }

  // Enforce Proof of Delivery for Darb Box before it can be completed.
  if (status === 'COMPLETED' && ride.rideType === 'BOX_DELIVERY' && !ride.deliveryProofUrl) {
    throw Object.assign(
      new Error('Proof of delivery photo required before completing'),
      { status: 400 }
    );
  }

  await prisma.ride.update({
    where: { id: rideId },
    data: {
      status,
      ...(status === 'COMPLETED' ? { completedAt: new Date() } : {}),
    },
  });
  return refetch(rideId);
}

function getAllowedTransitions(current, next, userId, role, ride) {
  const transitions = {
    PENDING_RECEIVER_APPROVAL: ['CANCELLED'],
    REQUESTED: ['ACCEPTED', 'CANCELLED'],
    ACCEPTED: ['DRIVER_ARRIVED', 'CANCELLED'],
    DRIVER_ARRIVED: ['IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  };

  if (!transitions[current]?.includes(next)) return false;
  if (next === 'ACCEPTED') return role === 'DRIVER';
  if (next === 'CANCELLED') {
    return (
      ride.riderId === userId ||
      ride.driverId === userId ||
      ride.receiverId === userId
    );
  }
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
  const rides = await getActiveRidesForDriver(driverId);
  return rides[0] || null;
}

module.exports = {
  createRide,
  getRideById,
  getUserRides,
  getDriverIncomingRequests,
  declineRideOffer,
  offerRideToNearbyDrivers,
  closeRideOffer,
  getNearbyDrivers,
  acceptRide,
  updateRideStatus,
  approveBoxDelivery,
  rejectBoxDelivery,
  saveDeliveryProof,
  updateDriverLocation,
  updateDriverAvailability,
  getActiveRideForDriver,
  getActiveRidesForDriver,
  NEARBY_RADIUS_KM,
};
