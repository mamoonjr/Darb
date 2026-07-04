-- CreateEnum
CREATE TYPE "RideType" AS ENUM ('SINGLE', 'CARPOOL', 'BOX_DELIVERY');

-- AlterEnum
ALTER TYPE "RideStatus" ADD VALUE 'PENDING_RECEIVER_APPROVAL';

-- AlterTable
ALTER TABLE "Ride" ADD COLUMN     "deliveryProofUrl" TEXT,
ADD COLUMN     "packageDesc" TEXT,
ADD COLUMN     "receiverId" TEXT,
ADD COLUMN     "receiverName" TEXT,
ADD COLUMN     "receiverPhone" TEXT,
ADD COLUMN     "rideType" "RideType" NOT NULL DEFAULT 'SINGLE',
ADD COLUMN     "totalSeats" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "activeRole" "Role" NOT NULL DEFAULT 'RIDER',
ADD COLUMN     "roles" "Role"[] DEFAULT ARRAY['RIDER']::"Role"[];

-- CreateTable
CREATE TABLE "RidePassenger" (
    "id" TEXT NOT NULL,
    "rideId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seats" INTEGER NOT NULL DEFAULT 1,
    "pickupAddress" TEXT NOT NULL,
    "pickupLat" DOUBLE PRECISION NOT NULL,
    "pickupLng" DOUBLE PRECISION NOT NULL,
    "dropoffAddress" TEXT NOT NULL,
    "dropoffLat" DOUBLE PRECISION NOT NULL,
    "dropoffLng" DOUBLE PRECISION NOT NULL,
    "fareShare" DOUBLE PRECISION,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RidePassenger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RidePassenger_rideId_userId_key" ON "RidePassenger"("rideId", "userId");

-- AddForeignKey
ALTER TABLE "Ride" ADD CONSTRAINT "Ride_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RidePassenger" ADD CONSTRAINT "RidePassenger_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "Ride"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RidePassenger" ADD CONSTRAINT "RidePassenger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
