const prisma = require('../config/database');
const { paymentProvider } = require('../config');

async function createPayment(rideId, amount) {
  const existing = await prisma.payment.findUnique({ where: { rideId } });
  if (existing) return existing;

  return prisma.payment.create({
    data: { rideId, amount, provider: paymentProvider },
  });
}

async function processPayment(rideId, userId, paymentMethod) {
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
    include: { payment: true },
  });

  if (!ride) {
    throw Object.assign(new Error('Ride not found'), { status: 404 });
  }
  if (ride.riderId !== userId) {
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }
  if (ride.payment?.status === 'PAID') {
    return ride.payment;
  }

  const amount = ride.fare || 0;
  const transactionId = await chargeGateway(amount, paymentMethod);

  return prisma.payment.upsert({
    where: { rideId },
    create: {
      rideId,
      amount,
      status: 'PAID',
      provider: paymentProvider,
      transactionId,
      paymentMethod,
      paidAt: new Date(),
    },
    update: {
      status: 'PAID',
      transactionId,
      paymentMethod,
      paidAt: new Date(),
    },
  });
}

async function chargeGateway(amount, paymentMethod) {
  const { paymentProvider, stripeSecretKey, tapSecretKey } = require('../config');

  if (paymentProvider === 'stripe' && stripeSecretKey) {
    // Stripe integration placeholder — replace with real Stripe SDK call
    return `stripe_${Date.now()}`;
  }

  if (paymentProvider === 'tap' && tapSecretKey) {
    // Tap Payments integration placeholder
    return `tap_${Date.now()}`;
  }

  // Mock gateway — always succeeds in dev
  if (amount <= 0) {
    throw Object.assign(new Error('Invalid amount'), { status: 400 });
  }
  await new Promise((r) => setTimeout(r, 500));
  return `mock_${Date.now()}_${paymentMethod || 'card'}`;
}

async function getPayment(rideId, userId, role) {
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
    include: { payment: true },
  });
  if (!ride) {
    throw Object.assign(new Error('Ride not found'), { status: 404 });
  }
  if (role !== 'ADMIN' && ride.riderId !== userId && ride.driverId !== userId) {
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }
  return ride.payment;
}

module.exports = { createPayment, processPayment, getPayment };
