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

module.exports = { updatePushToken };
