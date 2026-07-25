const fs = require('fs');
const path = require('path');
const prisma = require('../src/config/database');

async function main() {
  const before = await prisma.ride.count();

  const passengers = await prisma.ridePassenger.deleteMany({});
  const payments = await prisma.payment.deleteMany({});
  const reviews = await prisma.review.deleteMany({});
  const rides = await prisma.ride.deleteMany({});

  const uploadDir = path.join(__dirname, '..', 'uploads');
  let removedFiles = 0;
  if (fs.existsSync(uploadDir)) {
    for (const file of fs.readdirSync(uploadDir)) {
      if (file.startsWith('pod-')) {
        fs.unlinkSync(path.join(uploadDir, file));
        removedFiles += 1;
      }
    }
  }

  const after = await prisma.ride.count();
  console.log(
    JSON.stringify(
      {
        ridesBefore: before,
        ridesDeleted: rides.count,
        passengersDeleted: passengers.count,
        paymentsDeleted: payments.count,
        reviewsDeleted: reviews.count,
        proofImagesRemoved: removedFiles,
        ridesAfter: after,
      },
      null,
      2
    )
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
