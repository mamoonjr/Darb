import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { api } from '../services/api';
import { emitDriverLocation, getSocket } from '../services/socket';

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

// Broadcasts an online driver's location (every ~4s) even when not on a ride,
// so nearby riders can see them on the live-proximity map.
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

export function reverseGeocode(lat, lng) {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}
