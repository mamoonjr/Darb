/**
 * Minimal domain tests (no test runner required).
 * Run: node backend/src/domain/__tests__/runDomainChecks.js
 */

const domain = require('../index');
const plans = require('../../application/carpool/plans');

let passed = 0;
let failed = 0;

function check(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
  }
}

function expectThrow(fn, code) {
  try {
    fn();
    throw new Error('expected throw');
  } catch (err) {
    if (err.message === 'expected throw') throw err;
    if (code && err.code !== code) {
      throw new Error(`expected code ${code}, got ${err.code}`);
    }
  }
}

console.log('Domain checks\n');

check('draft → published allowed', () => {
  domain.assertRideTransition(domain.RIDE_STATUS.DRAFT, domain.RIDE_STATUS.PUBLISHED);
});

check('draft → started forbidden', () => {
  expectThrow(
    () => domain.assertRideTransition(domain.RIDE_STATUS.DRAFT, domain.RIDE_STATUS.STARTED),
    'INVALID_RIDE_TRANSITION'
  );
});

check('join requested → price proposed', () => {
  domain.assertJoinTransition(domain.JOIN_STATUS.REQUESTED, domain.JOIN_STATUS.PRICE_PROPOSED);
});

check('seat only after confirmed', () => {
  if (domain.occupiesSeat(domain.JOIN_STATUS.REQUESTED)) throw new Error('should not occupy');
  if (!domain.occupiesSeat(domain.JOIN_STATUS.CONFIRMED)) throw new Error('should occupy');
});

check('no fare on create', () => {
  expectThrow(() => domain.assertNoPriceOnRideCreation(12.5), 'FARE_NOT_ALLOWED_ON_CREATE');
  domain.assertNoPriceOnRideCreation(null);
});

check('landmarks must belong to ride', () => {
  const landmarks = [{ id: 'a' }, { id: 'b' }];
  domain.assertLandmarksBelongToRide(landmarks, 'a', 'b');
  expectThrow(() => domain.assertLandmarksBelongToRide(landmarks, 'a', 'z'), 'INVALID_LANDMARKS');
});

check('capacity guard', () => {
  domain.assertWithinCapacity({ confirmedSeats: 2, requestedSeats: 1, vehicleCapacity: 4 });
  expectThrow(
    () => domain.assertWithinCapacity({ confirmedSeats: 3, requestedSeats: 2, vehicleCapacity: 4 }),
    'CAPACITY_EXCEEDED'
  );
});

check('planPublishRide driver only', () => {
  expectThrow(() => plans.planPublishRide({ actorRole: 'RIDER', fareOnCreate: null }), 'DRIVER_ONLY_PUBLISH');
  const plan = plans.planPublishRide({ actorRole: 'DRIVER', fareOnCreate: null });
  if (plan.nextStatus !== domain.RIDE_STATUS.PUBLISHED) throw new Error('bad status');
});

check('planProposePrice', () => {
  const plan = plans.planProposePrice({
    actorRole: 'DRIVER',
    joinStatus: domain.JOIN_STATUS.REQUESTED,
    amount: 3.5,
  });
  if (plan.nextStatus !== domain.JOIN_STATUS.PRICE_PROPOSED) throw new Error('bad status');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
