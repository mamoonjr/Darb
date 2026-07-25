const rideService = require('../services/rideService');
const { saveBase64Image } = require('../services/uploadService');
const {
  notifyRideStatus,
  notifyBoxReceiver,
  notifyBoxRejected,
  notifyBoxCancelled,
} = require('../services/notificationService');

async function create(req, res) {
  try {
    const { ride, matched, pendingApproval, external, trackingCode, trackingUrl } =
      await rideService.createRide(req.user.id, req.body);
    const io = req.app.get('io');

    if (matched) {
      // Rider joined an existing carpool
      io?.to(`ride:${ride.id}`).emit('ride:updated', ride);
    } else if (ride.status === 'REQUESTED') {
      await rideService.offerRideToNearbyDrivers(ride, io);
    }

    if (pendingApproval && ride.receiverId) {
      // Registered receiver: push + realtime request to their Receiver screen.
      await notifyBoxReceiver(ride);
      io?.to(`user:${ride.receiverId}`).emit('box:request', ride);
    }

    res.status(201).json({
      ...ride,
      matched: !!matched,
      // External receivers: tracking link only (SMS is a future TODO).
      ...(external ? { external: true, trackingCode, trackingUrl } : {}),
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function list(req, res) {
  try {
    const rides = await rideService.getUserRides(req.user.id, req.user.activeRole || req.user.role);
    res.json(rides);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function getById(req, res) {
  try {
    const ride = await rideService.getRideById(
      req.params.id,
      req.user.id,
      req.user.activeRole || req.user.role
    );
    res.json(ride);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function nearby(req, res) {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ error: 'lat and lng query params are required' });
    }
    const radius = req.query.radius ? parseFloat(req.query.radius) : undefined;
    const drivers = await rideService.getNearbyDrivers(lat, lng, radius);
    res.json({ drivers, radiusKm: radius || rideService.NEARBY_RADIUS_KM });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function accept(req, res) {
  try {
    const ride = await rideService.acceptRide(req.params.id, req.user.id);
    const io = req.app.get('io');
    rideService.closeRideOffer(ride.id, io);
    io?.to(`ride:${ride.id}`).emit('ride:updated', ride);
    io?.emit('ride:accepted', ride);
    notifyRideStatus(ride, 'ACCEPTED');
    res.json(ride);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}

async function updateStatus(req, res) {
  try {
    const { status } = req.body;
    const ride = await rideService.updateRideStatus(
      req.params.id,
      req.user.id,
      req.user.activeRole || req.user.role,
      status
    );
    const io = req.app.get('io');
    io?.to(`ride:${ride.id}`).emit('ride:updated', ride);
    if (status === 'CANCELLED' && ride.rideType === 'BOX_DELIVERY' && ride.receiverId) {
      await notifyBoxCancelled(ride, ride.receiverId === req.user.id);
      io?.to(`user:${ride.receiverId}`).emit('box:cancelled', ride);
      io?.to(`user:${ride.riderId}`).emit('box:cancelled', ride);
    } else {
      await notifyRideStatus(ride, status);
    }
    res.json(ride);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function incomingRequests(req, res) {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ error: 'lat and lng query params are required' });
    }
    const rides = await rideService.getDriverIncomingRequests(req.user.id, lat, lng);
    res.json({ rides, radiusKm: rideService.NEARBY_RADIUS_KM });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function decline(req, res) {
  try {
    rideService.declineRideOffer(req.params.id, req.user.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function approveBox(req, res) {
  try {
    const ride = await rideService.approveBoxDelivery(req.params.id, req.user.id, req.body);
    const io = req.app.get('io');
    await rideService.offerRideToNearbyDrivers(ride, io);
    io?.to(`ride:${ride.id}`).emit('ride:updated', ride);
    notifyRideStatus(ride, 'REQUESTED');
    res.json(ride);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function rejectBox(req, res) {
  try {
    const ride = await rideService.rejectBoxDelivery(req.params.id, req.user.id);
    const io = req.app.get('io');
    io?.to(`ride:${ride.id}`).emit('ride:updated', ride);
    io?.to(`user:${ride.riderId}`).emit('box:rejected', ride);
    await notifyBoxRejected(ride);
    res.json(ride);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function uploadProof(req, res) {
  try {
    const { relativePath } = saveBase64Image(req.body.image, `pod-${req.params.id}`);
    const url = `${req.protocol}://${req.get('host')}${relativePath}`;
    const ride = await rideService.saveDeliveryProof(req.params.id, req.user.id, url);
    req.app.get('io')?.to(`ride:${ride.id}`).emit('ride:updated', ride);
    res.json({ url, ride });
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
    const activeRides = await rideService.getActiveRidesForDriver(req.user.id);
    const payload = {
      driverId: req.user.id,
      lat: req.body.lat,
      lng: req.body.lng,
      rideId: activeRides[0]?.id,
    };
    const io = req.app.get('io');
    for (const ride of activeRides) {
      io?.to(`ride:${ride.id}`).emit('driver:location', { ...payload, rideId: ride.id });
    }
    // Fan out to nearby riders for the live-proximity map.
    io?.emit('driver:location', payload);
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
    if (!req.body.isAvailable) {
      req.app.get('io')?.emit('driver:offline', { driverId: req.user.id });
    }
    res.json(profile);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

module.exports = {
  create,
  list,
  getById,
  nearby,
  incomingRequests,
  decline,
  accept,
  updateStatus,
  approveBox,
  rejectBox,
  uploadProof,
  updateLocation,
  updateAvailability,
};
