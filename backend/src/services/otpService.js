const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const { otpTtlSeconds, otpMaxAttempts, otpDevExpose } = require('../config');
const { normalizePhone, phoneLookupVariants, findUserByPhone } = require('../utils/helpers');
const { issueSession } = require('./tokenService');

function generateOtpCode() {
  return String(crypto.randomInt(100000, 999999));
}

/**
 * Stub delivery channel. Production should call SMS provider here.
 * Never log the OTP code.
 */
async function deliverOtp(_phone, _code) {
  // Intentionally empty — wire Twilio / local SMS gateway later.
}

async function requestLoginOtp(phone) {
  const normalized = normalizePhone(phone);
  if (!normalized || normalized.length < 7) {
    throw Object.assign(new Error('Invalid phone'), { status: 400, code: 'INVALID_PHONE' });
  }

  const user = await findUserByPhone(prisma, normalized, {
    id: true,
    phone: true,
    isActive: true,
  });
  if (!user) {
    throw Object.assign(new Error('No account for this phone'), { status: 404, code: 'USER_NOT_FOUND' });
  }
  if (!user.isActive) {
    throw Object.assign(new Error('Account suspended'), { status: 403, code: 'ACCOUNT_INACTIVE' });
  }

  // Invalidate prior open challenges for this phone.
  await prisma.otpChallenge.updateMany({
    where: { phone: { in: phoneLookupVariants(normalized) }, consumedAt: null },
    data: { consumedAt: new Date() },
  });

  const code = generateOtpCode();
  const codeHash = await bcrypt.hash(code, 10);
  const challenge = await prisma.otpChallenge.create({
    data: {
      phone: user.phone,
      codeHash,
      purpose: 'LOGIN',
      expiresAt: new Date(Date.now() + otpTtlSeconds * 1000),
    },
  });

  await deliverOtp(user.phone, code);

  const payload = {
    challengeId: challenge.id,
    expiresIn: otpTtlSeconds,
    message: 'OTP sent',
  };
  if (otpDevExpose) {
    payload.devCode = code;
  }
  return payload;
}

async function verifyLoginOtp(phone, code) {
  const normalized = normalizePhone(phone);
  const variants = phoneLookupVariants(normalized);

  const challenge = await prisma.otpChallenge.findFirst({
    where: {
      phone: { in: variants },
      purpose: 'LOGIN',
      consumedAt: null,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!challenge) {
    throw Object.assign(new Error('No active OTP challenge'), { status: 400, code: 'OTP_MISSING' });
  }
  if (challenge.expiresAt.getTime() < Date.now()) {
    throw Object.assign(new Error('OTP expired'), { status: 400, code: 'OTP_EXPIRED' });
  }
  if (challenge.attempts >= otpMaxAttempts) {
    throw Object.assign(new Error('Too many OTP attempts'), { status: 429, code: 'OTP_LOCKED' });
  }

  const ok = await bcrypt.compare(String(code || ''), challenge.codeHash);
  if (!ok) {
    await prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { attempts: { increment: 1 } },
    });
    throw Object.assign(new Error('Invalid OTP'), { status: 401, code: 'OTP_INVALID' });
  }

  await prisma.otpChallenge.update({
    where: { id: challenge.id },
    data: { consumedAt: new Date() },
  });

  const user = await findUserByPhone(prisma, challenge.phone);
  if (!user || !user.isActive) {
    throw Object.assign(new Error('Account unavailable'), { status: 403, code: 'ACCOUNT_INACTIVE' });
  }

  const full = await prisma.user.findUnique({
    where: { id: user.id },
    include: { driverProfile: true },
  });

  return issueSession(full);
}

module.exports = {
  requestLoginOtp,
  verifyLoginOtp,
};
