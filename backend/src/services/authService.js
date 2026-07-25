const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const { signToken, sanitizeUser, phoneLookupVariants, normalizePhone } = require('../utils/helpers');

// The token's `role` claim always mirrors `activeRole` so existing
// requireRole(...) guards keep working after a user switches roles.
function tokenFor(user) {
  return signToken({
    id: user.id,
    email: user.email,
    role: user.activeRole,
    activeRole: user.activeRole,
    roles: user.roles,
  });
}

async function register(data) {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: data.email }, { phone: data.phone }] },
  });
  if (existing) {
    throw Object.assign(new Error('Email or phone already registered'), { status: 409 });
  }

  const hashed = await bcrypt.hash(data.password, 10);
  const primaryRole = data.role || 'RIDER';
  // A driver can also act as a rider, so grant both roles up front.
  const roles = primaryRole === 'DRIVER' ? ['RIDER', 'DRIVER'] : [primaryRole];

  const user = await prisma.user.create({
    data: {
      email: data.email,
      phone: data.phone,
      name: data.name,
      password: hashed,
      role: primaryRole,
      roles,
      activeRole: primaryRole,
      ...(primaryRole === 'DRIVER' && {
        driverProfile: {
          create: {
            vehicleMake: data.vehicleMake || 'Toyota',
            vehicleModel: data.vehicleModel || 'Camry',
            vehiclePlate: data.vehiclePlate || 'ABC-1234',
            vehicleColor: data.vehicleColor || 'White',
          },
        },
      }),
    },
    include: { driverProfile: true },
  });

  return { user: sanitizeUser(user), token: tokenFor(user) };
}

async function login(phone, password) {
  const normalized = normalizePhone(phone);
  const variants = phoneLookupVariants(normalized);
  const user = await prisma.user.findFirst({
    where: { phone: { in: variants } },
    include: { driverProfile: true },
  });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw Object.assign(new Error('Invalid credentials'), { status: 401 });
  }
  if (!user.isActive) {
    throw Object.assign(new Error('Account suspended'), { status: 403 });
  }

  return { user: sanitizeUser(user), token: tokenFor(user) };
}

async function getProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { driverProfile: true },
  });
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }
  return sanitizeUser(user);
}

// Switch the caller's active role. The user must already OWN the target role.
async function switchRole(userId, targetRole) {
  if (!['RIDER', 'DRIVER'].includes(targetRole)) {
    throw Object.assign(new Error('Role must be RIDER or DRIVER'), { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { driverProfile: true },
  });
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }
  if (!user.roles.includes(targetRole)) {
    throw Object.assign(
      new Error('You do not have permission for this role'),
      { status: 403 }
    );
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { activeRole: targetRole },
    include: { driverProfile: true },
  });

  return { user: sanitizeUser(updated), token: tokenFor(updated) };
}

module.exports = { register, login, getProfile, switchRole };
