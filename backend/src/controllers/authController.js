const authService = require('../services/authService');
const otpService = require('../services/otpService');
const tokenService = require('../services/tokenService');

async function register(req, res) {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}

async function login(req, res) {
  try {
    const result = await authService.login(req.body.phone, req.body.password);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}

async function me(req, res) {
  try {
    const user = await authService.getProfile(req.user.id);
    res.json(user);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}

async function switchRole(req, res) {
  try {
    const result = await authService.switchRole(req.user.id, req.body.role);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}

async function requestOtp(req, res) {
  try {
    const result = await otpService.requestLoginOtp(req.body.phone);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}

async function verifyOtp(req, res) {
  try {
    const result = await otpService.verifyLoginOtp(req.body.phone, req.body.code);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}

async function refresh(req, res) {
  try {
    const result = await tokenService.rotateRefreshToken(req.body.refreshToken);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}

async function logout(req, res) {
  try {
    await tokenService.revokeRefreshToken(req.body.refreshToken);
    res.json({ ok: true });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}

module.exports = {
  register,
  login,
  me,
  switchRole,
  requestOtp,
  verifyOtp,
  refresh,
  logout,
};
