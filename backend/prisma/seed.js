const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Amman, Jordan baseline coordinates
const AMMAN = { lat: 31.9522, lng: 35.9106 };

async function main() {
  const password = await bcrypt.hash('password123', 10);

  const rider = await prisma.user.upsert({
    where: { email: 'rider@darb.app' },
    update: { phone: '+962790000001', name: 'أحمد الراكب', roles: ['RIDER'], activeRole: 'RIDER' },
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
    update: { phone: '+962790000003', name: 'مدير النظام', roles: ['ADMIN'], activeRole: 'ADMIN' },
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

  console.log('Seed complete:');
  console.log(`  Rider:   ${rider.email} / password123`);
  console.log(`  Driver:  ${driver.email} / password123`);
  console.log(`  Driver2: ${driver2.email} / password123`);
  console.log(`  Admin:   ${admin.email} / password123`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
