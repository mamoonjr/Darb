/**
 * Domain layer entry — route-based carpool SSOT.
 * Pure business rules; no Express, Prisma, or HTTP.
 */

const RideLifecycle = require('./ride/RideLifecycle');
const JoinLifecycle = require('./ride/JoinLifecycle');
const PricingRules = require('./ride/PricingRules');
const CapacityRules = require('./ride/CapacityRules');

module.exports = {
  ...RideLifecycle,
  ...JoinLifecycle,
  ...PricingRules,
  ...CapacityRules,
};
