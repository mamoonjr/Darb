import { GOOGLE_MAPS_API_KEY, PLACES_COUNTRY } from '../constants';
import i18n from '../i18n';

const BASE = 'https://maps.googleapis.com/maps/api/place';

function placesLanguage() {
  return i18n.language === 'en' ? 'en' : 'ar';
}

// Google Places Autocomplete — restricted to Jordan only via components=country:jo.
export async function autocomplete(query) {
  const input = (query || '').trim();
  if (input.length < 2 || !GOOGLE_MAPS_API_KEY) return [];

  try {
    const url =
      `${BASE}/autocomplete/json?input=${encodeURIComponent(input)}` +
      `&components=country:${PLACES_COUNTRY}` +
      `&language=${placesLanguage()}&key=${GOOGLE_MAPS_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    return (data.predictions || []).map((p) => ({
      placeId: p.place_id,
      description: p.description,
    }));
  } catch {
    return [];
  }
}

// Resolve a place_id to coordinates + formatted address.
export async function placeDetails(placeId) {
  if (!placeId || !GOOGLE_MAPS_API_KEY) return null;

  try {
    const url =
      `${BASE}/details/json?place_id=${placeId}` +
      `&fields=geometry,formatted_address&language=${placesLanguage()}&key=${GOOGLE_MAPS_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    const loc = data.result?.geometry?.location;
    if (!loc) return null;
    return { lat: loc.lat, lng: loc.lng, address: data.result.formatted_address };
  } catch {
    return null;
  }
}

// OpenStreetMap fallback when Google Places key is missing (Jordan only).
async function searchNominatim(query) {
  try {
    const lang = placesLanguage();
    const url =
      `https://nominatim.openstreetmap.org/search?format=json` +
      `&countrycodes=${PLACES_COUNTRY}&limit=6` +
      `&accept-language=${lang}` +
      `&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'DarbApp/2.0' },
    });
    const data = await res.json();
    return (data || []).map((item) => ({
      placeId: null,
      description: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    }));
  } catch {
    return [];
  }
}

// Unified place search — Google when configured, otherwise OpenStreetMap (Jordan).
export async function searchPlaces(query) {
  const input = (query || '').trim();
  if (input.length < 2) return [];

  if (GOOGLE_MAPS_API_KEY) {
    const google = await autocomplete(input);
    if (google.length) return google;
  }
  return searchNominatim(input);
}
