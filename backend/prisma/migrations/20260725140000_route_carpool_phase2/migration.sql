-- Phase 2: route-based carpool additive models
-- Applied via `prisma db push` locally; this file documents the intended SQL.

-- RideStatus: add carpool lifecycle values
ALTER TYPE "RideStatus" ADD VALUE IF NOT EXISTS 'DRAFT';
ALTER TYPE "RideStatus" ADD VALUE IF NOT EXISTS 'PUBLISHED';
ALTER TYPE "RideStatus" ADD VALUE IF NOT EXISTS 'RECEIVING_REQUESTS';
ALTER TYPE "RideStatus" ADD VALUE IF NOT EXISTS 'CONFIRMED';
ALTER TYPE "RideStatus" ADD VALUE IF NOT EXISTS 'STARTED';
ALTER TYPE "RideStatus" ADD VALUE IF NOT EXISTS 'RATED';
ALTER TYPE "RideStatus" ADD VALUE IF NOT EXISTS 'CLOSED';

-- RideProduct enum
DO $$ BEGIN
  CREATE TYPE "RideProduct" AS ENUM ('MARKETPLACE', 'ROUTE_CARPOOL');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- JoinRequestStatus enum
DO $$ BEGIN
  CREATE TYPE "JoinRequestStatus" AS ENUM (
    'REQUESTED',
    'PRICE_PROPOSED',
    'PASSENGER_ACCEPTED',
    'CONFIRMED',
    'REJECTED',
    'CANCELLED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Ride: marketplace fields become nullable; product + capacity
ALTER TABLE "Ride" ALTER COLUMN "riderId" DROP NOT NULL;
ALTER TABLE "Ride" ALTER COLUMN "pickupAddress" DROP NOT NULL;
ALTER TABLE "Ride" ALTER COLUMN "pickupLat" DROP NOT NULL;
ALTER TABLE "Ride" ALTER COLUMN "pickupLng" DROP NOT NULL;
ALTER TABLE "Ride" ALTER COLUMN "dropoffAddress" DROP NOT NULL;
ALTER TABLE "Ride" ALTER COLUMN "dropoffLat" DROP NOT NULL;
ALTER TABLE "Ride" ALTER COLUMN "dropoffLng" DROP NOT NULL;

ALTER TABLE "Ride" ADD COLUMN IF NOT EXISTS "product" "RideProduct" NOT NULL DEFAULT 'MARKETPLACE';
ALTER TABLE "Ride" ADD COLUMN IF NOT EXISTS "vehicleCapacity" INTEGER;

CREATE TABLE IF NOT EXISTS "Route" (
  "id" TEXT NOT NULL,
  "rideId" TEXT NOT NULL,
  "summary" TEXT,
  "polyline" JSONB,
  "distanceKm" DOUBLE PRECISION,
  "durationMin" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Route_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Route_rideId_key" ON "Route"("rideId");

CREATE TABLE IF NOT EXISTS "Landmark" (
  "id" TEXT NOT NULL,
  "routeId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "address" TEXT,
  "lat" DOUBLE PRECISION NOT NULL,
  "lng" DOUBLE PRECISION NOT NULL,
  "sequence" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Landmark_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Landmark_routeId_sequence_idx" ON "Landmark"("routeId", "sequence");

CREATE TABLE IF NOT EXISTS "JoinRequest" (
  "id" TEXT NOT NULL,
  "rideId" TEXT NOT NULL,
  "passengerId" TEXT NOT NULL,
  "originLandmarkId" TEXT NOT NULL,
  "destinationLandmarkId" TEXT NOT NULL,
  "seats" INTEGER NOT NULL DEFAULT 1,
  "status" "JoinRequestStatus" NOT NULL DEFAULT 'REQUESTED',
  "proposedPrice" DOUBLE PRECISION,
  "proposedAt" TIMESTAMP(3),
  "decidedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "JoinRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "JoinRequest_rideId_status_idx" ON "JoinRequest"("rideId", "status");
CREATE INDEX IF NOT EXISTS "JoinRequest_passengerId_status_idx" ON "JoinRequest"("passengerId", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "JoinRequest_rideId_passengerId_key" ON "JoinRequest"("rideId", "passengerId");

-- FKs (ignore if already present)
DO $$ BEGIN
  ALTER TABLE "Route" ADD CONSTRAINT "Route_rideId_fkey"
    FOREIGN KEY ("rideId") REFERENCES "Ride"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "Landmark" ADD CONSTRAINT "Landmark_routeId_fkey"
    FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "JoinRequest" ADD CONSTRAINT "JoinRequest_rideId_fkey"
    FOREIGN KEY ("rideId") REFERENCES "Ride"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "JoinRequest" ADD CONSTRAINT "JoinRequest_passengerId_fkey"
    FOREIGN KEY ("passengerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "JoinRequest" ADD CONSTRAINT "JoinRequest_originLandmarkId_fkey"
    FOREIGN KEY ("originLandmarkId") REFERENCES "Landmark"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "JoinRequest" ADD CONSTRAINT "JoinRequest_destinationLandmarkId_fkey"
    FOREIGN KEY ("destinationLandmarkId") REFERENCES "Landmark"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
