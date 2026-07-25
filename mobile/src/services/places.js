import { GOOGLE_MAPS_API_KEY, PLACES_COUNTRY } from '../constants';
import i18n from '../i18n';
import { api } from './api';

const BASE = 'https://maps.googleapis.com/maps/api/place';

function placesLanguage() {
  return i18n.language === 'en' ? 'en' : 'ar';
}

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
    return (data.predictions || []).map((p) => {
      const main = p.structured_formatting?.main_text || p.description;
      const secondary = p.structured_formatting?.secondary_text || '';
      return {
        placeId: p.place_id,
        title: main,
        subtitle: secondary,
        description: secondary ? `${main}, ${secondary}` : main,
        category: null,
        categoryIcon: '📍',
      };
    });
  } catch {
    return [];
  }
}

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

async function searchViaBackend(query, near) {
  try {
    const { results } = await api.searchPlaces(
      query,
      placesLanguage(),
      near?.lat,
      near?.lng
    );
    return results || [];
  } catch {
    return [];
  }
}

export async function searchPlaces(query, near) {
  const input = (query || '').trim();
  if (input.length < 2) return [];

  if (GOOGLE_MAPS_API_KEY) {
    const google = await autocomplete(input);
    if (google.length) return google;
  }

  return searchViaBackend(input, near);
}

export async function fetchNearbyPlaces(lat, lng) {
  try {
    const { results } = await api.searchNearbyPlaces(lat, lng, placesLanguage());
    return results || [];
  } catch {
    return [];
  }
}

export async function fetchPlaceCategories() {
  try {
    const { categories } = await api.getPlaceCategories(placesLanguage());
    return categories || [];
  } catch {
    return [];
  }
}

export async function resolvePlace(item) {
  if (item.lat != null && item.lng != null) {
    return { lat: item.lat, lng: item.lng, address: item.description || '' };
  }
  if (item.placeId && GOOGLE_MAPS_API_KEY) {
    return placeDetails(item.placeId);
  }
  return null;
}
