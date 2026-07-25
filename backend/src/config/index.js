require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT || '3000', 10),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  /** Separate secret for refresh JWTs when set; falls back to jwtSecret. */
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'dev-secret-change-me',
  /** Access token TTL (short-lived). */
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL || '15m',
  /** Refresh token TTL (long-lived). */
  refreshTokenTtl: process.env.REFRESH_TOKEN_TTL || '30d',
  /** OTP validity window in seconds. */
  otpTtlSeconds: parseInt(process.env.OTP_TTL_SECONDS || '300', 10),
  /** Max verify attempts per challenge. */
  otpMaxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10),
  /**
   * When true, OTP request responses include `devCode` (local/dev only).
   * Never enable in production.
   */
  otpDevExpose: process.env.OTP_DEV_EXPOSE === 'true',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  paymentProvider: process.env.PAYMENT_PROVIDER || 'mock',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  tapSecretKey: process.env.TAP_SECRET_KEY || '',
};
