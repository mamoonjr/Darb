const { verifyToken } = require('../utils/helpers');

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const token = header.slice(7);
    req.user = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Guards a route by the caller's ACTIVE role. The token's `role` claim always
// mirrors `activeRole`, so a user who switched to DRIVER passes DRIVER guards
// and loses RIDER-only access until they switch back.
function requireRole(...roles) {
  return (req, res, next) => {
    const active = req.user.activeRole || req.user.role;
    if (!roles.includes(active)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

module.exports = { authMiddleware, requireRole };
