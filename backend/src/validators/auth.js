const { z } = require('zod');

const registerSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(8),
  name: z.string().min(2),
  password: z.string().min(5),
  role: z.enum(['RIDER', 'DRIVER']).optional(),
  vehicleMake: z.string().optional(),
  vehicleModel: z.string().optional(),
  vehiclePlate: z.string().optional(),
  vehicleColor: z.string().optional(),
});

const loginSchema = z.object({
  phone: z.string().min(7),
  password: z.string().min(1),
});

const createRideSchema = z
  .object({
    rideType: z.enum(['SINGLE', 'CARPOOL', 'BOX_DELIVERY']).default('SINGLE'),
    pickupAddress: z.string().min(3),
    pickupLat: z.number(),
    pickupLng: z.number(),
    dropoffAddress: z.string().min(3).optional(),
    dropoffLat: z.number().optional(),
    dropoffLng: z.number().optional(),
    // Carpooling
    seats: z.number().int().min(1).max(6).optional(),
    totalSeats: z.number().int().min(1).max(6).optional(),
    // Darb Box
    receiverPhone: z.string().min(6).optional(),
    receiverName: z.string().max(120).optional(),
    packageDesc: z.string().max(300).optional(),
  })
  .refine(
    (d) =>
      d.rideType === 'BOX_DELIVERY'
        ? !!d.receiverPhone
        : d.dropoffLat != null && d.dropoffLng != null && !!d.dropoffAddress,
    { message: 'Missing required fields for the selected ride type' }
  );

const switchRoleSchema = z.object({
  role: z.enum(['RIDER', 'DRIVER']),
});

const boxApproveSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  address: z.string().min(3).optional(),
});

const deliveryProofSchema = z.object({
  image: z.string().min(16), // base64 data URL of the captured photo
});

const updateLocationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

const updateAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
});

const paymentSchema = z.object({
  paymentMethod: z.enum(['card', 'apple_pay', 'mada', 'wallet']).optional(),
});

const topUpSchema = z.object({
  amount: z.number().positive().max(500),
  description: z.string().max(200).optional(),
});

const addCardSchema = z.object({
  cardNumber: z.string().min(13).max(19),
  holderName: z.string().min(2).max(80),
  expiryMonth: z.number().int().min(1).max(12),
  expiryYear: z.number().int().min(2024).max(2040),
  isDefault: z.boolean().optional(),
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
  switchRoleSchema,
  boxApproveSchema,
  deliveryProofSchema,
  updateLocationSchema,
  updateAvailabilitySchema,
  paymentSchema,
  topUpSchema,
  addCardSchema,
  rateRideSchema,
  pushTokenSchema,
};
