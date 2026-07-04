const adminService = require('../services/adminService');

async function stats(req, res) {
  try {
    const data = await adminService.getDashboardStats();
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function users(req, res) {
  try {
    const { page, limit, role } = req.query;
    const data = await adminService.getAllUsers({
      page: parseInt(page || '1', 10),
      limit: parseInt(limit || '20', 10),
      role,
    });
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function toggleUser(req, res) {
  try {
    const user = await adminService.toggleUserActive(req.params.id);
    res.json(user);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function rides(req, res) {
  try {
    const { page, limit, status } = req.query;
    const data = await adminService.getAllRides({
      page: parseInt(page || '1', 10),
      limit: parseInt(limit || '20', 10),
      status,
    });
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function activeDrivers(req, res) {
  try {
    const drivers = await adminService.getActiveDrivers();
    res.json(drivers);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

module.exports = { stats, users, toggleUser, rides, activeDrivers };
