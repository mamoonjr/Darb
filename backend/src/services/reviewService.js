const prisma = require('../config/database');

async function rateRide(rideId, riderId, { rating, comment }) {
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
    include: { review: true, payment: true },
  });

  if (!ride) {
    throw Object.assign(new Error('Ride not found'), { status: 404 });
  }
  if (ride.riderId !== riderId) {
    throw Object.assign(new Error('Only the rider can rate this ride'), { status: 403 });
  }
  if (ride.status !== 'COMPLETED') {
    throw Object.assign(new Error('Can only rate completed rides'), { status: 400 });
  }
  if (ride.review) {
    throw Object.assign(new Error('Ride already rated'), { status: 409 });
  }
  if (!ride.driverId) {
    throw Object.assign(new Error('No driver assigned'), { status: 400 });
  }

  const review = await prisma.review.create({
    data: {
      rideId,
      riderId,
      driverId: ride.driverId,
      rating,
      comment: comment || null,
    },
  });

  const driverProfile = await prisma.driverProfile.findUnique({
    where: { userId: ride.driverId },
  });

  if (driverProfile) {
    const newCount = driverProfile.ratingCount + 1;
    const newRating =
      (driverProfile.rating * driverProfile.ratingCount + rating) / newCount;
    await prisma.driverProfile.update({
      where: { userId: ride.driverId },
      data: { rating: Math.round(newRating * 10) / 10, ratingCount: newCount },
    });
  }

  return review;
}

async function getDriverReviews(driverId, limit = 20) {
  return prisma.review.findMany({
    where: { driverId },
    include: { rider: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

module.exports = { rateRide, getDriverReviews };
