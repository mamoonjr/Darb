const { Router } = require('express');
const authController = require('../controllers/authController');
const rideController = require('../controllers/rideController');
const paymentController = require('../controllers/paymentController');
const reviewController = require('../controllers/reviewController');
const adminController = require('../controllers/adminController');
const userController = require('../controllers/userController');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  registerSchema,
  loginSchema,
  createRideSchema,
  switchRoleSchema,
  boxApproveSchema,
  deliveryProofSchema,
  updateLocationSchema,
  updateAvailabilitySchema,
  paymentSchema,
  rateRideSchema,
  pushTokenSchema,
} = require('../validators/auth');

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', app: 'Darb API', version: '2.0.0' });
});

router.post('/auth/register', validate(registerSchema), authController.register);
router.post('/auth/login', validate(loginSchema), authController.login);
router.get('/auth/me', authMiddleware, authController.me);
router.post('/auth/switch-role', authMiddleware, validate(switchRoleSchema), authController.switchRole);

router.patch('/users/push-token', authMiddleware, validate(pushTokenSchema), userController.updatePushToken);
router.get('/users/search', authMiddleware, userController.searchByPhone);

router.get('/drivers/nearby', authMiddleware, rideController.nearby);

router.post('/rides', authMiddleware, requireRole('RIDER'), validate(createRideSchema), rideController.create);
router.get('/rides', authMiddleware, rideController.list);
router.get('/rides/:id', authMiddleware, rideController.getById);
router.post('/rides/:id/accept', authMiddleware, requireRole('DRIVER'), rideController.accept);
router.patch('/rides/:id/status', authMiddleware, rideController.updateStatus);
router.post('/rides/:id/box/approve', authMiddleware, validate(boxApproveSchema), rideController.approveBox);
router.post('/rides/:id/box/reject', authMiddleware, rideController.rejectBox);
router.post('/rides/:id/proof', authMiddleware, requireRole('DRIVER'), validate(deliveryProofSchema), rideController.uploadProof);
router.post('/rides/:id/pay', authMiddleware, requireRole('RIDER'), validate(paymentSchema), paymentController.pay);
router.get('/rides/:id/payment', authMiddleware, paymentController.getPayment);
router.post('/rides/:id/rate', authMiddleware, requireRole('RIDER'), validate(rateRideSchema), reviewController.rate);
router.get('/drivers/:driverId/reviews', authMiddleware, reviewController.driverReviews);

router.patch('/driver/location', authMiddleware, requireRole('DRIVER'), validate(updateLocationSchema), rideController.updateLocation);
router.patch('/driver/availability', authMiddleware, requireRole('DRIVER'), validate(updateAvailabilitySchema), rideController.updateAvailability);

router.get('/admin/stats', authMiddleware, requireRole('ADMIN'), adminController.stats);
router.get('/admin/users', authMiddleware, requireRole('ADMIN'), adminController.users);
router.patch('/admin/users/:id/toggle', authMiddleware, requireRole('ADMIN'), adminController.toggleUser);
router.get('/admin/rides', authMiddleware, requireRole('ADMIN'), adminController.rides);
router.get('/admin/drivers/active', authMiddleware, requireRole('ADMIN'), adminController.activeDrivers);

module.exports = router;
