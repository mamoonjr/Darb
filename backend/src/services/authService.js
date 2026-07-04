const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const { signToken, sanitizeUser } = require('../utils/helpers');

async function register(data) {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: data.email }, { phone: data.phone }] },
  });
  if (existing) {
    throw Object.assign(new Error('Email or phone already registered'), { status: 409 });
  }

  const hashed = await bcrypt.hash(data.password, 10);
  const role = data.role || 'RIDER';

  const user = await prisma.user.create({
    data: {
      email: data.email,
      phone: data.phone,
      name: data.name,
      password: hashed,
      role,
      ...(role === 'DRIVER' && {
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

  const token = signToken({ id: user.id, role: user.role, email: user.email });
  return { user: sanitizeUser(user), token };
}

async function login(email, password) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { driverProfile: true },
  });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw Object.assign(new Error('Invalid credentials'), { status: 401 });
  }
  if (!user.isActive) {
    throw Object.assign(new Error('Account suspended'), { status: 403 });
  }

  const token = signToken({ id: user.id, role: user.role, email: user.email });
  return { user: sanitizeUser(user), token };
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

module.exports = { register, login, getProfile };
