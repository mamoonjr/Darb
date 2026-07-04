const reviewService = require('../services/reviewService');

async function rate(req, res) {
  try {
    const review = await reviewService.rateRide(req.params.id, req.user.id, req.body);
    res.status(201).json(review);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function driverReviews(req, res) {
  try {
    const reviews = await reviewService.getDriverReviews(req.params.driverId);
    res.json(reviews);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

module.exports = { rate, driverReviews };
