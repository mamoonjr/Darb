const { z } = require('zod');

const registerSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(8),
  name: z.string().min(2),
  password: z.string().min(6),
  role: z.enum(['RIDER', 'DRIVER']).optional(),
  vehicleMake: z.string().optional(),
  vehicleModel: z.string().optional(),
  vehiclePlate: z.string().optional(),
  vehicleColor: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const createRideSchema = z.object({
  pickupAddress: z.string().min(3),
  pickupLat: z.number(),
  pickupLng: z.number(),
  dropoffAddress: z.string().min(3),
  dropoffLat: z.number(),
  dropoffLng: z.number(),
});

const updateLocationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

const updateAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
});

const paymentSchema = z.object({
  paymentMethod: z.enum(['card', 'apple_pay', 'mada']).optional(),
});

const rateRideSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

const pushTokenSchema = z.object({
  pushToken: z.string().min(1),
});

module.exports = {
  registerSchema,
  loginSchema,
  createRideSchema,
  updateLocationSchema,
  updateAvailabilitySchema,
  paymentSchema,
  rateRideSchema,
  pushTokenSchema,
};
