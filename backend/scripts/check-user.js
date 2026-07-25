const { PrismaClient } = require('@prisma/client');
const { phoneLookupVariants } = require('../src/utils/helpers');

const phone = process.argv[2] || '0791197079';
const prisma = new PrismaClient();

async function main() {
  const variants = phoneLookupVariants(phone);
  const users = await prisma.user.findMany({
    where: { phone: { in: variants } },
    select: { id: true, name: true, phone: true, email: true, isActive: true },
  });
  console.log('lookup:', phone);
  console.log('variants:', variants);
  console.log('matches:', users.length);
  console.log('users:', users.length ? users : 'NOT FOUND');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
