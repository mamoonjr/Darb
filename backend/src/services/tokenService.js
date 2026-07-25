const crypto = require('crypto');
const prisma = require('../config/database');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  sanitizeUser,
} = require('../utils/helpers');

function hashToken(raw) {
  return crypto.createHash('sha256').update(String(raw)).digest('hex');
}

function accessClaims(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.activeRole,
    activeRole: user.activeRole,
    roles: user.roles,
    typ: 'access',
  };
}

async function issueSession(user) {
  const accessToken = signAccessToken(accessClaims(user));
  const refreshToken = signRefreshToken({
    id: user.id,
    typ: 'refresh',
    jti: crypto.randomUUID(),
  });

  const decoded = verifyRefreshToken(refreshToken);
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(decoded.exp * 1000),
    },
  });

  return {
    user: sanitizeUser(user),
    token: accessToken,
    accessToken,
    refreshToken,
  };
}

async function rotateRefreshToken(rawRefreshToken) {
  let payload;
  try {
    payload = verifyRefreshToken(rawRefreshToken);
  } catch {
    throw Object.assign(new Error('Invalid or expired refresh token'), {
      status: 401,
      code: 'REFRESH_INVALID',
    });
  }
  if (payload.typ !== 'refresh') {
    throw Object.assign(new Error('Invalid refresh token'), {
      status: 401,
      code: 'REFRESH_INVALID',
    });
  }

  const tokenHash = hashToken(rawRefreshToken);
  const matched = await prisma.refreshToken.findFirst({
    where: {
      userId: payload.id,
      tokenHash,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (!matched) {
    throw Object.assign(new Error('Refresh token revoked or unknown'), {
      status: 401,
      code: 'REFRESH_REVOKED',
    });
  }

  await prisma.refreshToken.update({
    where: { id: matched.id },
    data: { revokedAt: new Date() },
  });

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    include: { driverProfile: true },
  });
  if (!user || !user.isActive) {
    throw Object.assign(new Error('Account unavailable'), {
      status: 403,
      code: 'ACCOUNT_INACTIVE',
    });
  }

  return issueSession(user);
}

async function revokeRefreshToken(rawRefreshToken) {
  if (!rawRefreshToken) return;
  let payload;
  try {
    payload = verifyRefreshToken(rawRefreshToken);
  } catch {
    return;
  }
  await prisma.refreshToken.updateMany({
    where: {
      userId: payload.id,
      tokenHash: hashToken(rawRefreshToken),
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });
}

async function revokeAllUserRefreshTokens(userId) {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

module.exports = {
  issueSession,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllUserRefreshTokens,
};
