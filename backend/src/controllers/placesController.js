const placesService = require('../services/placesService');

async function search(req, res, next) {
  try {
    const q = (req.query.q || '').trim();
    const lang = req.query.lang === 'en' ? 'en' : 'ar';
    const lat = req.query.lat != null ? parseFloat(req.query.lat) : null;
    const lng = req.query.lng != null ? parseFloat(req.query.lng) : null;
    if (q.length < 2) {
      return res.json({ results: [] });
    }
    const results = await placesService.searchPlaces(q, lang, { lat, lng });
    res.json({ results });
  } catch (err) {
    next(err);
  }
}

async function nearby(req, res, next) {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const lang = req.query.lang === 'en' ? 'en' : 'ar';
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ error: 'lat and lng are required' });
    }
    const results = await placesService.searchNearbyPois(lat, lng, lang);
    res.json({ results });
  } catch (err) {
    next(err);
  }
}

async function categories(req, res) {
  const lang = req.query.lang === 'en' ? 'en' : 'ar';
  res.json({ categories: placesService.getPoiCategories(lang) });
}

async function reverse(req, res, next) {
  try {
    const { lat, lng } = req.query;
    const lang = req.query.lang === 'en' ? 'en' : 'ar';
    const address = await placesService.reverseGeocode(lat, lng, lang);
    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }
    res.json({ address, lat: parseFloat(lat), lng: parseFloat(lng) });
  } catch (err) {
    next(err);
  }
}

module.exports = { search, nearby, categories, reverse };
