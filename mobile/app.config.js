function env(key, fallback) {
  const value = process.env[key];
  if (value == null) return fallback;
  const trimmed = String(value).trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return fallback;
  return trimmed;
}

const PLACEHOLDER = /^(YOUR_|CHANGE_ME|xxx)/i;

const apiUrl = env('EXPO_PUBLIC_API_URL', 'http://localhost:3000/api');
const socketUrl = env('EXPO_PUBLIC_SOCKET_URL', 'http://localhost:3000');
const mapsApiKey = env('EXPO_PUBLIC_GOOGLE_MAPS_API_KEY', '');
const easProjectId = env('EAS_PROJECT_ID', '');
const hasMapsKey = mapsApiKey && !PLACEHOLDER.test(mapsApiKey);
const hasEasProject = /^[0-9a-f-]{36}$/i.test(easProjectId);

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  expo: {
    name: 'Darb',
    slug: 'darb',
    version: '2.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#1a73e8',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'app.darb.mobile',
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          'Darb needs your location to show pickup/dropoff and track rides.',
        NSLocationAlwaysAndWhenInUseUsageDescription:
          'Darb needs your location to track active rides.',
      },
      ...(hasMapsKey && {
        config: { googleMapsApiKey: mapsApiKey },
      }),
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#1a73e8',
      },
      package: 'app.darb.mobile',
      permissions: [
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'RECEIVE_BOOT_COMPLETED',
        'VIBRATE',
      ],
      ...(hasMapsKey && {
        config: { googleMaps: { apiKey: mapsApiKey } },
      }),
    },
    plugins: [
      'expo-asset',
      'expo-secure-store',
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission:
            'Allow Darb to use your location for ride tracking.',
        },
      ],
      [
        'expo-notifications',
        {
          icon: './assets/icon.png',
          color: '#1a73e8',
        },
      ],
    ],
    web: {
      favicon: './assets/favicon.png',
    },
    extra: {
      apiUrl,
      socketUrl,
      ...(hasEasProject && { eas: { projectId: easProjectId } }),
    },
  },
};
