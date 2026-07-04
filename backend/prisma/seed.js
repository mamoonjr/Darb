const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 10);

  const rider = await prisma.user.upsert({
    where: { email: 'rider@darb.app' },
    update: {},
    create: {
      email: 'rider@darb.app',
      phone: '+966500000001',
      name: 'أحمد الراكب',
      password,
      role: 'RIDER',
    },
  });

  const driver = await prisma.user.upsert({
    where: { email: 'driver@darb.app' },
    update: {},
    create: {
      email: 'driver@darb.app',
      phone: '+966500000002',
      name: 'محمد السائق',
      password,
      role: 'DRIVER',
      driverProfile: {
        create: {
          vehicleMake: 'Toyota',
          vehicleModel: 'Camry',
          vehiclePlate: 'ABC-1234',
          vehicleColor: 'White',
          isAvailable: true,
          lat: 24.7136,
          lng: 46.6753,
        },
      },
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@darb.app' },
    update: {},
    create: {
      email: 'admin@darb.app',
      phone: '+966500000003',
      name: 'مدير النظام',
      password,
      role: 'ADMIN',
    },
  });

  console.log('Seed complete:');
  console.log(`  Rider:  ${rider.email} / password123`);
  console.log(`  Driver: ${driver.email} / password123`);
  console.log(`  Admin:  ${admin.email} / password123`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
