import { GOOGLE_MAPS_API_KEY, PLACES_COUNTRY } from '../constants';

const BASE = 'https://maps.googleapis.com/maps/api/place';

// Google Places Autocomplete — restricted to Jordan only via components=country:jo.
export async function autocomplete(query) {
  const input = (query || '').trim();
  if (input.length < 2 || !GOOGLE_MAPS_API_KEY) return [];

  try {
    const url =
      `${BASE}/autocomplete/json?input=${encodeURIComponent(input)}` +
      `&components=country:${PLACES_COUNTRY}` +
      `&language=ar&key=${GOOGLE_MAPS_API_KEY}`;
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
      `&fields=geometry,formatted_address&language=ar&key=${GOOGLE_MAPS_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    const loc = data.result?.geometry?.location;
    if (!loc) return null;
    return { lat: loc.lat, lng: loc.lng, address: data.result.formatted_address };
  } catch {
    return null;
  }
}
