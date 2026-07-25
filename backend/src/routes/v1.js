const { Router } = require('express');
const carpoolController = require('../controllers/carpoolController');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  publishRideSchema,
  joinRideSchema,
  proposePriceSchema,
} = require('../validators/carpool');

const router = Router();

router.use(authMiddleware);

/** Passenger: browse published route rides */
router.get('/rides', carpoolController.list);
router.get('/rides/:id', carpoolController.getById);

/** Driver: publish route + landmarks (no fare) */
router.post(
  '/rides',
  requireRole('DRIVER'),
  validate(publishRideSchema),
  carpoolController.publish
);

router.post(
  '/rides/:id/open-requests',
  requireRole('DRIVER'),
  carpoolController.openRequests
);

router.post(
  '/rides/:id/start',
  requireRole('DRIVER'),
  carpoolController.start
);

router.post(
  '/rides/:id/complete',
  requireRole('DRIVER'),
  carpoolController.complete
);

/** Passenger: join by landmark IDs only */
router.post(
  '/rides/:id/join',
  requireRole('RIDER'),
  validate(joinRideSchema),
  carpoolController.join
);

/** Driver proposes price after join request */
router.post(
  '/join-requests/:id/propose-price',
  requireRole('DRIVER'),
  validate(proposePriceSchema),
  carpoolController.proposePrice
);

/** Passenger accepts price → confirmed */
router.post(
  '/join-requests/:id/accept-price',
  requireRole('RIDER'),
  carpoolController.acceptPrice
);

/** Driver reject or passenger cancel */
router.post('/join-requests/:id/reject', carpoolController.reject);

module.exports = router;
