import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { api } from '../services/api';
import { emitDriverLocation, getSocket } from '../services/socket';
import i18n from '../i18n';

export function useDriverLocationTracking(rideId, enabled) {
  const subscription = useRef(null);

  useEffect(() => {
    if (!enabled || !rideId) return undefined;

    let active = true;

    async function startTracking() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || !active) return;

      subscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 4000,
          distanceInterval: 10,
        },
        async (location) => {
          const { latitude: lat, longitude: lng } = location.coords;
          try {
            await api.updateDriverLocation(lat, lng);
            emitDriverLocation(rideId, lat, lng);
          } catch {
            // ignore transient network errors
          }
        }
      );
    }

    startTracking();

    return () => {
      active = false;
      subscription.current?.remove();
      subscription.current = null;
    };
  }, [rideId, enabled]);
}

export function useDriverPresence(enabled) {
  const subscription = useRef(null);

  useEffect(() => {
    if (!enabled) return undefined;
    let active = true;

    async function startPresence() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || !active) return;

      subscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 4000,
          distanceInterval: 20,
        },
        async (location) => {
          const { latitude: lat, longitude: lng } = location.coords;
          try {
            await api.updateDriverLocation(lat, lng);
          } catch {
            // ignore transient network errors
          }
          getSocket()?.emit('driver:location', { lat, lng });
        }
      );
    }

    startPresence();

    return () => {
      active = false;
      subscription.current?.remove();
      subscription.current = null;
    };
  }, [enabled]);
}

export async function getCurrentLocation() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission denied');
  }
  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  return {
    lat: location.coords.latitude,
    lng: location.coords.longitude,
  };
}

function formatExpoAddress(entry) {
  const parts = [
    entry.name,
    entry.street,
    entry.district,
    entry.subregion,
    entry.city,
    entry.region,
    entry.country,
  ]
    .map((p) => (p ? String(p).trim() : ''))
    .filter(Boolean);
  return [...new Set(parts)].join('، ');
}

export async function reverseGeocode(lat, lng) {
  try {
    const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    const formatted = results?.map(formatExpoAddress).find(Boolean);
    if (formatted) return formatted;
  } catch {
    // device geocoder unavailable
  }

  try {
    const lang = i18n.language === 'en' ? 'en' : 'ar';
    const { address } = await api.reversePlace(lat, lng, lang);
    if (address) return address;
  } catch {
    // backend fallback failed
  }

  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}
