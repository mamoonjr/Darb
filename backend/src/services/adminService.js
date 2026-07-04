const prisma = require('../config/database');

async function getDashboardStats() {
  const [totalUsers, totalDrivers, totalRides, activeRides, completedRides, revenue] =
    await Promise.all([
      prisma.user.count({ where: { role: 'RIDER' } }),
      prisma.user.count({ where: { role: 'DRIVER' } }),
      prisma.ride.count(),
      prisma.ride.count({
        where: { status: { in: ['REQUESTED', 'ACCEPTED', 'DRIVER_ARRIVED', 'IN_PROGRESS'] } },
      }),
      prisma.ride.count({ where: { status: 'COMPLETED' } }),
      prisma.payment.aggregate({
        where: { status: 'PAID' },
        _sum: { amount: true },
      }),
    ]);

  return {
    totalUsers,
    totalDrivers,
    totalRides,
    activeRides,
    completedRides,
    totalRevenue: revenue._sum.amount || 0,
  };
}

async function getAllUsers({ page = 1, limit = 20, role } = {}) {
  const where = role ? { role } : {};
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        driverProfile: {
          select: {
            vehicleMake: true,
            vehicleModel: true,
            vehiclePlate: true,
            isAvailable: true,
            rating: true,
            ratingCount: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page, limit };
}

async function toggleUserActive(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }
  if (user.role === 'ADMIN') {
    throw Object.assign(new Error('Cannot deactivate admin'), { status: 400 });
  }

  return prisma.user.update({
    where: { id: userId },
    data: { isActive: !user.isActive },
    select: { id: true, name: true, email: true, isActive: true },
  });
}

async function getAllRides({ page = 1, limit = 20, status } = {}) {
  const where = status ? { status } : {};
  const [rides, total] = await Promise.all([
    prisma.ride.findMany({
      where,
      include: {
        rider: { select: { id: true, name: true, phone: true } },
        driver: { select: { id: true, name: true, phone: true } },
        payment: true,
        review: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.ride.count({ where }),
  ]);

  return { rides, total, page, limit };
}

async function getActiveDrivers() {
  return prisma.driverProfile.findMany({
    where: { isAvailable: true, lat: { not: null }, lng: { not: null } },
    include: { user: { select: { id: true, name: true, phone: true } } },
  });
}

module.exports = {
  getDashboardStats,
  getAllUsers,
  toggleUserActive,
  getAllRides,
  getActiveDrivers,
};
