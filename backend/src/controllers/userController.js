const prisma = require('../config/database');

async function updatePushToken(req, res) {
  try {
    const { pushToken } = req.body;
    await prisma.user.update({
      where: { id: req.user.id },
      data: { pushToken: pushToken || null },
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

// Darb Box receiver lookup by phone. Returns the user if registered, otherwise
// flags them as an external (unregistered) user.
async function searchByPhone(req, res) {
  try {
    const phone = String(req.query.phone || '').trim();
    if (phone.length < 4) {
      return res.status(400).json({ error: 'phone query is required' });
    }

    const user = await prisma.user.findUnique({
      where: { phone },
      select: { id: true, name: true, phone: true, avatar: true },
    });

    if (!user) {
      return res.json({ exists: false, found: false, external: true, phone });
    }
    if (user.id === req.user.id) {
      return res.status(400).json({ error: 'You cannot send a package to yourself' });
    }
    res.json({ exists: true, found: true, external: false, user });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

module.exports = { updatePushToken, searchByPhone };
