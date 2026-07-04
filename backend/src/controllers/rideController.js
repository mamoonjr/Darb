const rideService = require('../services/rideService');
const { notifyRideStatus } = require('../services/notificationService');

async function create(req, res) {
  try {
    const ride = await rideService.createRide(req.user.id, req.body);
    req.app.get('io')?.emit('ride:requested', ride);
    res.status(201).json(ride);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function list(req, res) {
  try {
    const rides = await rideService.getUserRides(req.user.id, req.user.role);
    res.json(rides);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function getById(req, res) {
  try {
    const ride = await rideService.getRideById(req.params.id, req.user.id, req.user.role);
    res.json(ride);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function accept(req, res) {
  try {
    const ride = await rideService.acceptRide(req.params.id, req.user.id);
    req.app.get('io')?.to(`ride:${ride.id}`).emit('ride:updated', ride);
    req.app.get('io')?.emit('ride:accepted', ride);
    notifyRideStatus(ride, 'ACCEPTED');
    res.json(ride);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function updateStatus(req, res) {
  try {
    const { status } = req.body;
    const ride = await rideService.updateRideStatus(
      req.params.id,
      req.user.id,
      req.user.role,
      status
    );
    req.app.get('io')?.to(`ride:${ride.id}`).emit('ride:updated', ride);
    notifyRideStatus(ride, status);
    res.json(ride);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function updateLocation(req, res) {
  try {
    const profile = await rideService.updateDriverLocation(
      req.user.id,
      req.body.lat,
      req.body.lng
    );
    const activeRide = await rideService.getActiveRideForDriver(req.user.id);
    const payload = {
      driverId: req.user.id,
      lat: req.body.lat,
      lng: req.body.lng,
      rideId: activeRide?.id,
    };
    if (activeRide) {
      req.app.get('io')?.to(`ride:${activeRide.id}`).emit('driver:location', payload);
    }
    req.app.get('io')?.emit('driver:location', payload);
    res.json(profile);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function updateAvailability(req, res) {
  try {
    const profile = await rideService.updateDriverAvailability(
      req.user.id,
      req.body.isAvailable
    );
    res.json(profile);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

module.exports = {
  create,
  list,
  getById,
  accept,
  updateStatus,
  updateLocation,
  updateAvailability,
};
