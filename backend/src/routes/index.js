const { Router } = require('express');
const authController = require('../controllers/authController');
const rideController = require('../controllers/rideController');
const paymentController = require('../controllers/paymentController');
const reviewController = require('../controllers/reviewController');
const walletController = require('../controllers/walletController');
const adminController = require('../controllers/adminController');
const userController = require('../controllers/userController');
const placesController = require('../controllers/placesController');
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
  topUpSchema,
  addCardSchema,
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

router.get('/places/search', authMiddleware, placesController.search);
router.get('/places/nearby', authMiddleware, placesController.nearby);
router.get('/places/categories', authMiddleware, placesController.categories);
router.get('/places/reverse', authMiddleware, placesController.reverse);

router.get('/drivers/nearby', authMiddleware, rideController.nearby);
router.get('/drivers/requests', authMiddleware, requireRole('DRIVER'), rideController.incomingRequests);

router.post('/rides', authMiddleware, requireRole('RIDER'), validate(createRideSchema), rideController.create);
router.get('/rides', authMiddleware, rideController.list);
router.get('/rides/:id', authMiddleware, rideController.getById);
router.post('/rides/:id/accept', authMiddleware, requireRole('DRIVER'), rideController.accept);
router.post('/rides/:id/decline', authMiddleware, requireRole('DRIVER'), rideController.decline);
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

router.get('/wallet', authMiddleware, walletController.getWallet);
router.get('/wallet/transactions', authMiddleware, walletController.getTransactions);
router.post('/wallet/top-up', authMiddleware, validate(topUpSchema), walletController.topUp);
router.get('/cards', authMiddleware, walletController.listCards);
router.post('/cards', authMiddleware, validate(addCardSchema), walletController.addCard);
router.delete('/cards/:id', authMiddleware, walletController.deleteCard);
router.patch('/cards/:id/default', authMiddleware, walletController.setDefaultCard);

router.get('/admin/stats', authMiddleware, requireRole('ADMIN'), adminController.stats);
router.get('/admin/users', authMiddleware, requireRole('ADMIN'), adminController.users);
router.patch('/admin/users/:id/toggle', authMiddleware, requireRole('ADMIN'), adminController.toggleUser);
router.get('/admin/rides', authMiddleware, requireRole('ADMIN'), adminController.rides);
router.get('/admin/drivers/active', authMiddleware, requireRole('ADMIN'), adminController.activeDrivers);

module.exports = router;
