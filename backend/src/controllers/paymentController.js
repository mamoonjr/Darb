const rideService = require('../services/rideService');
const paymentService = require('../services/paymentService');
const { notifyRideStatus } = require('../services/notificationService');

async function pay(req, res) {
  try {
    const { paymentMethod } = req.body;
    const payment = await paymentService.processPayment(
      req.params.id,
      req.user.id,
      paymentMethod || 'card'
    );
    const ride = await rideService.getRideById(
      req.params.id,
      req.user.id,
      req.user.role
    );
    req.app.get('io')?.emit('ride:requested', ride);
    notifyRideStatus(ride, 'REQUESTED');
    res.json({ payment, ride });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function getPayment(req, res) {
  try {
    const payment = await paymentService.getPayment(
      req.params.id,
      req.user.id,
      req.user.role
    );
    res.json(payment || { status: 'PENDING' });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

module.exports = { pay, getPayment };
