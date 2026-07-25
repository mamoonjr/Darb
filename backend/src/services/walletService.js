const prisma = require('../config/database');

async function getOrCreateWallet(userId) {
  return prisma.wallet.upsert({
    where: { userId },
    create: { userId, balance: 0 },
    update: {},
  });
}

async function getWallet(userId) {
  const wallet = await getOrCreateWallet(userId);
  return {
    balance: wallet.balance,
    currency: 'JOD',
    updatedAt: wallet.updatedAt,
  };
}

async function getTransactions(userId, limit = 30) {
  const wallet = await getOrCreateWallet(userId);
  return prisma.walletTransaction.findMany({
    where: { walletId: wallet.id },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

async function topUp(userId, amount, description) {
  if (amount <= 0 || amount > 500) {
    throw Object.assign(new Error('Invalid top-up amount'), { status: 400 });
  }

  const wallet = await getOrCreateWallet(userId);

  const [updated] = await prisma.$transaction([
    prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: amount } },
    }),
    prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'TOP_UP',
        amount,
        description: description || 'Wallet top-up',
      },
    }),
  ]);

  return {
    balance: updated.balance,
    currency: 'JOD',
    updatedAt: updated.updatedAt,
  };
}

async function deductForRide(userId, rideId, amount) {
  const wallet = await getOrCreateWallet(userId);

  if (wallet.balance < amount) {
    throw Object.assign(new Error('Insufficient wallet balance'), {
      status: 400,
      code: 'INSUFFICIENT_BALANCE',
    });
  }

  const [updated] = await prisma.$transaction([
    prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: { decrement: amount } },
    }),
    prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'RIDE_PAYMENT',
        amount: -amount,
        rideId,
        description: 'Ride payment',
      },
    }),
  ]);

  return updated.balance;
}

function detectCardBrand(number) {
  const digits = String(number).replace(/\D/g, '');
  if (digits.startsWith('4')) return 'visa';
  if (digits.startsWith('5')) return 'mastercard';
  if (digits.startsWith('3')) return 'amex';
  return 'card';
}

async function listCards(userId) {
  return prisma.savedCard.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
}

async function addCard(userId, data) {
  const digits = String(data.cardNumber).replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) {
    throw Object.assign(new Error('Invalid card number'), { status: 400 });
  }

  const last4 = digits.slice(-4);
  const brand = detectCardBrand(digits);
  const existing = await prisma.savedCard.count({ where: { userId } });
  const isDefault = existing === 0 || !!data.isDefault;

  if (isDefault) {
    await prisma.savedCard.updateMany({ where: { userId }, data: { isDefault: false } });
  }

  return prisma.savedCard.create({
    data: {
      userId,
      last4,
      brand,
      expiryMonth: data.expiryMonth,
      expiryYear: data.expiryYear,
      holderName: data.holderName.trim(),
      isDefault,
    },
  });
}

async function deleteCard(userId, cardId) {
  const card = await prisma.savedCard.findFirst({ where: { id: cardId, userId } });
  if (!card) {
    throw Object.assign(new Error('Card not found'), { status: 404 });
  }

  await prisma.savedCard.delete({ where: { id: cardId } });

  if (card.isDefault) {
    const next = await prisma.savedCard.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    if (next) {
      await prisma.savedCard.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  }

  return { ok: true };
}

async function setDefaultCard(userId, cardId) {
  const card = await prisma.savedCard.findFirst({ where: { id: cardId, userId } });
  if (!card) {
    throw Object.assign(new Error('Card not found'), { status: 404 });
  }

  await prisma.$transaction([
    prisma.savedCard.updateMany({ where: { userId }, data: { isDefault: false } }),
    prisma.savedCard.update({ where: { id: cardId }, data: { isDefault: true } }),
  ]);

  return prisma.savedCard.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
}

module.exports = {
  getWallet,
  getTransactions,
  topUp,
  deductForRide,
  listCards,
  addCard,
  deleteCard,
  setDefaultCard,
};
