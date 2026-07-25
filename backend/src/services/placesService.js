const NOMINATIM = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'DarbApp/2.0 (Jordan ride-hailing)';

const JORDAN_VIEWBOX = '34.96,33.37,39.30,29.19';
const AMMAN_CENTER = { lat: 31.9522, lng: 35.9106 };

// POI category hints — improves search for shops, schools, hospitals, etc.
const POI_CATEGORIES = [
  {
    id: 'grocery',
    keywords: ['بقالة', 'سوبر', 'سوبرماركت', 'بقاله', 'grocery', 'supermarket', 'market'],
    labelAr: 'بقالة',
    labelEn: 'Grocery',
    icon: '🛒',
    osmTypes: ['supermarket', 'convenience', 'marketplace', 'greengrocer'],
  },
  {
    id: 'school',
    keywords: ['مدرسة', 'مدارس', 'مدرسه', 'جامعة', 'جامعه', 'كلية', 'school', 'university', 'college'],
    labelAr: 'مدرسة',
    labelEn: 'School',
    icon: '🏫',
    osmTypes: ['school', 'university', 'college', 'kindergarten'],
  },
  {
    id: 'hospital',
    keywords: ['مستشفى', 'مستشفى', 'مشفى', 'hospital', 'clinic', 'عيادة', 'صحة'],
    labelAr: 'مستشفى',
    labelEn: 'Hospital',
    icon: '🏥',
    osmTypes: ['hospital', 'clinic', 'doctors', 'pharmacy'],
  },
  {
    id: 'restaurant',
    keywords: ['مطعم', 'مطاعم', 'كافيه', 'مقهى', 'restaurant', 'cafe', 'coffee'],
    labelAr: 'مطعم',
    labelEn: 'Restaurant',
    icon: '🍽️',
    osmTypes: ['restaurant', 'cafe', 'fast_food'],
  },
  {
    id: 'mall',
    keywords: ['مول', 'مولات', 'مجمع', 'تسوق', 'mall', 'shopping'],
    labelAr: 'مول',
    labelEn: 'Mall',
    icon: '🏬',
    osmTypes: ['mall', 'department_store', 'commercial'],
  },
  {
    id: 'mosque',
    keywords: ['مسجد', 'جامع', 'mosque'],
    labelAr: 'مسجد',
    labelEn: 'Mosque',
    icon: '🕌',
    osmTypes: ['place_of_worship', 'mosque'],
  },
  {
    id: 'bank',
    keywords: ['بنك', 'صراف', 'bank', 'atm'],
    labelAr: 'بنك',
    labelEn: 'Bank',
    icon: '🏦',
    osmTypes: ['bank', 'atm'],
  },
  {
    id: 'gas',
    keywords: ['محطة', 'وقود', 'بنزين', 'gas', 'fuel', 'petrol'],
    labelAr: 'محطة وقود',
    labelEn: 'Gas station',
    icon: '⛽',
    osmTypes: ['fuel'],
  },
];

const POI_CLASSES = new Set(['amenity', 'shop', 'tourism', 'leisure', 'office', 'craft', 'healthcare']);

function detectCategory(query) {
  const q = (query || '').toLowerCase();
  return POI_CATEGORIES.find((cat) =>
    cat.keywords.some((kw) => q.includes(kw.toLowerCase()))
  );
}

function getCategoryForItem(item) {
  const type = item.type || '';
  const addr = item.address || {};
  const matched = POI_CATEGORIES.find((cat) => cat.osmTypes.includes(type));
  if (matched) return matched;

  const q = `${item.name || ''} ${item.display_name || ''}`.toLowerCase();
  return POI_CATEGORIES.find((cat) =>
    cat.keywords.some((kw) => q.includes(kw.toLowerCase()))
  );
}

function formatPlaceResult(item, lang = 'ar') {
  const addr = item.address || {};
  const category = getCategoryForItem(item);
  const categoryLabel = category
    ? lang === 'en'
      ? category.labelEn
      : category.labelAr
    : null;
  const categoryIcon = category?.icon || (POI_CLASSES.has(item.class) ? '📍' : '📍');

  const title =
    item.name ||
    addr.amenity ||
    addr.shop ||
    addr.building ||
    addr.leisure ||
    addr.tourism ||
    addr.hospital ||
    addr.office ||
    addr.road ||
    addr.neighbourhood ||
    addr.suburb ||
    addr.quarter ||
    addr.city_district ||
    addr.city ||
    addr.town ||
    addr.village;

  const subtitleParts = [];
  if (categoryLabel && categoryLabel !== title) subtitleParts.push(categoryLabel);
  if (addr.road && addr.road !== title) subtitleParts.push(addr.road);
  if (addr.neighbourhood && addr.neighbourhood !== title) subtitleParts.push(addr.neighbourhood);
  if (addr.suburb && addr.suburb !== title) subtitleParts.push(addr.suburb);
  const city = addr.city || addr.town || addr.village || addr.municipality;
  if (city && city !== title) subtitleParts.push(city);
  if (addr.state && addr.state !== city && addr.state !== title) subtitleParts.push(addr.state);
  if (addr.country) subtitleParts.push(addr.country);

  const subtitle = [...new Set(subtitleParts.map((p) => String(p).trim()).filter(Boolean))].join('، ');
  const description = subtitle ? `${title}، ${subtitle}` : String(title || '');

  if (!description) {
    const display = (item.display_name || '').split(',').map((s) => s.trim()).filter(Boolean);
    return {
      title: display[0] || '',
      subtitle: display.slice(1, 4).join('، '),
      description: display.slice(0, 3).join('، ') || item.display_name || '',
      category: categoryLabel || null,
      categoryIcon,
    };
  }

  return {
    title: String(title),
    subtitle,
    description,
    category: categoryLabel || null,
    categoryIcon,
  };
}

function localViewbox(lat, lng, delta = 0.12) {
  const la = parseFloat(lat);
  const ln = parseFloat(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return JORDAN_VIEWBOX;
  return `${ln - delta},${la + delta},${ln + delta},${la - delta}`;
}

function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function scoreItem(item, nearLat, nearLng) {
  let score = parseFloat(item.importance) || 0;
  if (POI_CLASSES.has(item.class)) score += 3;
  if (item.name) score += 2;
  if (item.type && getCategoryForItem(item)) score += 1.5;
  if (nearLat != null && nearLng != null) {
    const d = distanceKm(nearLat, nearLng, parseFloat(item.lat), parseFloat(item.lon));
    score += Math.max(0, 2 - d / 8);
  }
  return score;
}

async function nominatimFetch(path) {
  const res = await fetch(`${NOMINATIM}${path}`, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
  });
  if (!res.ok) return null;
  return res.json();
}

function buildQueries(query) {
  const base = (query || '').trim();
  const queries = [base];
  const hasJordan = /أردن|الاردن|jordan|عمان|amman|zarqa|الزرقاء|irbid|إربد/i.test(base);

  if (!hasJordan) {
    queries.push(`${base} عمان الأردن`);
    queries.push(`${base} Jordan`);
  }

  const cat = detectCategory(base);
  if (cat && !hasJordan) {
    queries.push(`${cat.labelAr} ${base} عمان`);
  }

  return [...new Set(queries.filter(Boolean))];
}

async function nominatimSearch(q, lang, { viewbox, limit = 10 } = {}) {
  const params = new URLSearchParams({
    format: 'json',
    addressdetails: '1',
    extratags: '1',
    namedetails: '1',
    countrycodes: 'jo',
    limit: String(limit),
    dedupe: '1',
    'accept-language': lang === 'en' ? 'en' : 'ar',
    viewbox: viewbox || JORDAN_VIEWBOX,
    q,
  });

  const data = await nominatimFetch(`/search?${params}`);
  return Array.isArray(data) ? data : [];
}

function mapResults(items, lang, nearLat, nearLng) {
  const seen = new Set();
  return items
    .map((item) => {
      const { title, subtitle, description, category, categoryIcon } = formatPlaceResult(item, lang);
      const key = item.place_id || description;
      if (!description || seen.has(key)) return null;
      seen.add(key);

      const lat = parseFloat(item.lat);
      const lng = parseFloat(item.lon);
      const distKm =
        nearLat != null && nearLng != null ? distanceKm(nearLat, nearLng, lat, lng) : null;

      return {
        placeId: String(item.place_id),
        title,
        subtitle,
        description,
        category,
        categoryIcon,
        lat,
        lng,
        distanceKm: distKm != null ? Math.round(distKm * 10) / 10 : null,
        _score: scoreItem(item, nearLat, nearLng),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b._score - a._score)
    .map(({ _score, ...rest }) => rest);
}

async function searchPlaces(query, lang = 'ar', options = {}) {
  const q = (query || '').trim();
  if (q.length < 2) return [];

  const nearLat = options.lat != null ? parseFloat(options.lat) : null;
  const nearLng = options.lng != null ? parseFloat(options.lng) : null;
  const viewbox =
    nearLat != null && nearLng != null
      ? localViewbox(nearLat, nearLng)
      : JORDAN_VIEWBOX;

  const queries = buildQueries(q);
  const batches = await Promise.all(
    queries.slice(0, 3).map((term) => nominatimSearch(term, lang, { viewbox, limit: 12 }))
  );

  const merged = batches.flat();
  const results = mapResults(merged, lang, nearLat ?? AMMAN_CENTER.lat, nearLng ?? AMMAN_CENTER.lng);
  return results.slice(0, 15);
}

async function searchNearbyPois(lat, lng, lang = 'ar', radiusKm = 2) {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];

  const viewbox = localViewbox(latitude, longitude, radiusKm / 80);
  const terms =
    lang === 'en'
      ? ['supermarket', 'school', 'hospital', 'restaurant', 'mall', 'pharmacy']
      : ['بقالة', 'مدرسة', 'مستشفى', 'مطعم', 'مول', 'صيدلية'];

  const batches = await Promise.all(
    terms.map((term) =>
      nominatimSearch(`${term} عمان`, lang, { viewbox, limit: 4 })
    )
  );

  return mapResults(batches.flat(), lang, latitude, longitude).slice(0, 12);
}

async function reverseGeocode(lat, lng, lang = 'ar') {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const params = new URLSearchParams({
    format: 'json',
    addressdetails: '1',
    'accept-language': lang === 'en' ? 'en' : 'ar',
    lat: String(latitude),
    lon: String(longitude),
  });

  const data = await nominatimFetch(`/reverse?${params}`);
  if (!data) return null;

  const { description } = formatPlaceResult(data, lang);
  return description || data.display_name || null;
}

function getPoiCategories(lang = 'ar') {
  return POI_CATEGORIES.map((cat) => ({
    id: cat.id,
    label: lang === 'en' ? cat.labelEn : cat.labelAr,
    icon: cat.icon,
    searchTerm: lang === 'en' ? cat.labelEn : cat.labelAr,
  }));
}

module.exports = {
  searchPlaces,
  searchNearbyPois,
  reverseGeocode,
  getPoiCategories,
};
