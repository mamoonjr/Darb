const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const DEFAULT_PASSWORD = '12345';

// Amman, Jordan baseline coordinates
const AMMAN = { lat: 31.9522, lng: 35.9106 };

async function main() {
  const password = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  const rider = await prisma.user.upsert({
    where: { email: 'rider@darb.app' },
    update: { phone: '+962790000001', name: 'أحمد الراكب', roles: ['RIDER'], activeRole: 'RIDER', password },
    create: {
      email: 'rider@darb.app',
      phone: '+962790000001',
      name: 'أحمد الراكب',
      password,
      role: 'RIDER',
      roles: ['RIDER'],
      activeRole: 'RIDER',
    },
  });

  const driverProfileData = (lat, lng, make, model, plate, color) => ({
    vehicleMake: make,
    vehicleModel: model,
    vehiclePlate: plate,
    vehicleColor: color,
    isAvailable: true,
    lat,
    lng,
  });

  // Primary driver — also owns the RIDER role so role-switching can be demoed.
  const driver = await prisma.user.upsert({
    where: { email: 'driver@darb.app' },
    update: {
      phone: '+962790000002',
      name: 'محمد السائق',
      roles: ['RIDER', 'DRIVER'],
      activeRole: 'DRIVER',
      password,
      driverProfile: {
        upsert: {
          create: driverProfileData(AMMAN.lat, AMMAN.lng, 'Toyota', 'Camry', 'ABC-1234', 'White'),
          update: { isAvailable: true, lat: AMMAN.lat, lng: AMMAN.lng },
        },
      },
    },
    create: {
      email: 'driver@darb.app',
      phone: '+962790000002',
      name: 'محمد السائق',
      password,
      role: 'DRIVER',
      roles: ['RIDER', 'DRIVER'],
      activeRole: 'DRIVER',
      driverProfile: {
        create: driverProfileData(AMMAN.lat, AMMAN.lng, 'Toyota', 'Camry', 'ABC-1234', 'White'),
      },
    },
  });

  // Second nearby driver — useful for the live-proximity map and carpool matching.
  const driver2 = await prisma.user.upsert({
    where: { email: 'driver2@darb.app' },
    update: {
      phone: '+962790000004',
      name: 'خالد السائق',
      roles: ['RIDER', 'DRIVER'],
      activeRole: 'DRIVER',
      password,
      driverProfile: {
        upsert: {
          create: driverProfileData(AMMAN.lat + 0.012, AMMAN.lng + 0.009, 'Hyundai', 'Elantra', 'JOR-5678', 'Silver'),
          update: { isAvailable: true, lat: AMMAN.lat + 0.012, lng: AMMAN.lng + 0.009 },
        },
      },
    },
    create: {
      email: 'driver2@darb.app',
      phone: '+962790000004',
      name: 'خالد السائق',
      password,
      role: 'DRIVER',
      roles: ['RIDER', 'DRIVER'],
      activeRole: 'DRIVER',
      driverProfile: {
        create: driverProfileData(AMMAN.lat + 0.012, AMMAN.lng + 0.009, 'Hyundai', 'Elantra', 'JOR-5678', 'Silver'),
      },
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@darb.app' },
    update: { phone: '+962790000003', name: 'مدير النظام', roles: ['ADMIN'], activeRole: 'ADMIN', password },
    create: {
      email: 'admin@darb.app',
      phone: '+962790000003',
      name: 'مدير النظام',
      password,
      role: 'ADMIN',
      roles: ['ADMIN'],
      activeRole: 'ADMIN',
    },
  });

  const receiver = await prisma.user.upsert({
    where: { email: 'samah@darb.app' },
    update: {
      phone: '962791197079',
      name: 'سماح',
      roles: ['RIDER'],
      activeRole: 'RIDER',
      password,
      isActive: true,
    },
    create: {
      email: 'samah@darb.app',
      phone: '962791197079',
      name: 'سماح',
      password,
      role: 'RIDER',
      roles: ['RIDER'],
      activeRole: 'RIDER',
      isActive: true,
    },
  });

  // Reset every existing account to the unified demo password.
  await prisma.user.updateMany({ data: { password } });

  async function seedWalletAndCard(userId, balance, card) {
    const wallet = await prisma.wallet.upsert({
      where: { userId },
      create: { userId, balance },
      update: { balance },
    });

    await prisma.walletTransaction.deleteMany({ where: { walletId: wallet.id } });
    if (balance > 0) {
      await prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'TOP_UP',
          amount: balance,
          description: 'Demo wallet balance',
        },
      });
    }

    await prisma.savedCard.deleteMany({ where: { userId } });
    if (card) {
      await prisma.savedCard.create({
        data: { userId, ...card, isDefault: true },
      });
    }
  }

  const demoCard = {
    last4: '4242',
    brand: 'visa',
    expiryMonth: 12,
    expiryYear: 2028,
    holderName: 'Demo User',
  };

  await seedWalletAndCard(rider.id, 25, { ...demoCard, holderName: 'أحمد الراكب' });
  await seedWalletAndCard(receiver.id, 15, { ...demoCard, holderName: 'سماح' });

  console.log('Seed complete:');
  console.log(`  Rider:    ${rider.email} / ${DEFAULT_PASSWORD}`);
  console.log(`  Driver:   ${driver.email} / ${DEFAULT_PASSWORD}`);
  console.log(`  Driver2:  ${driver2.email} / ${DEFAULT_PASSWORD}`);
  console.log(`  Admin:    ${admin.email} / ${DEFAULT_PASSWORD}`);
  console.log(`  Receiver: ${receiver.email} (${receiver.phone}) / ${DEFAULT_PASSWORD}`);
  console.log(`  All users now use password: ${DEFAULT_PASSWORD}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
