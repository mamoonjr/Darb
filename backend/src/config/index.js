require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT || '3000', 10),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  paymentProvider: process.env.PAYMENT_PROVIDER || 'mock',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  tapSecretKey: process.env.TAP_SECRET_KEY || '',
};
