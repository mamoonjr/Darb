const { z } = require('zod');

const landmarkSchema = z.object({
  name: z.string().min(1).max(120),
  address: z.string().max(300).optional(),
  lat: z.number(),
  lng: z.number(),
  sequence: z.number().int().min(0).optional(),
});

const publishRideSchema = z.object({
  summary: z.string().max(300).optional(),
  vehicleCapacity: z.number().int().min(1).max(8).default(4),
  landmarks: z.array(landmarkSchema).min(2).max(20),
  distanceKm: z.number().positive().optional(),
  durationMin: z.number().int().positive().optional(),
  /** Must be omitted / null — enforced by domain */
  fare: z.number().optional(),
});

const joinRideSchema = z.object({
  originLandmarkId: z.string().min(1),
  destinationLandmarkId: z.string().min(1),
  seats: z.number().int().min(1).max(4).default(1),
});

const proposePriceSchema = z.object({
  amount: z.number().positive().max(500),
});

module.exports = {
  publishRideSchema,
  joinRideSchema,
  proposePriceSchema,
};
