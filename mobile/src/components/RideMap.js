import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { COLORS } from '../constants';

const DEFAULT_REGION = {
  latitude: 24.7136,
  longitude: 46.6753,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function RideMap({
  pickup,
  dropoff,
  driverLocation,
  showRoute = true,
  onMapPress,
  selecting = null,
  style,
}) {
  const mapRef = useRef(null);

  useEffect(() => {
    const coords = [pickup, dropoff, driverLocation].filter(
      (c) => c?.lat != null && c?.lng != null
    );
    if (coords.length > 0 && mapRef.current) {
      mapRef.current.fitToCoordinates(
        coords.map((c) => ({ latitude: c.lat, longitude: c.lng })),
        { edgePadding: { top: 60, right: 60, bottom: 60, left: 60 }, animated: true }
      );
    }
  }, [pickup, dropoff, driverLocation]);

  const routeCoords =
    pickup && dropoff
      ? [
          { latitude: pickup.lat, longitude: pickup.lng },
          { latitude: dropoff.lat, longitude: dropoff.lng },
        ]
      : [];

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={DEFAULT_REGION}
        showsUserLocation
        showsMyLocationButton
        onPress={(e) => onMapPress?.(e.nativeEvent.coordinate)}
      >
        {pickup && (
          <Marker
            coordinate={{ latitude: pickup.lat, longitude: pickup.lng }}
            title={pickup.address || 'Pickup'}
            pinColor={COLORS.success}
          />
        )}
        {dropoff && (
          <Marker
            coordinate={{ latitude: dropoff.lat, longitude: dropoff.lng }}
            title={dropoff.address || 'Dropoff'}
            pinColor={COLORS.error}
          />
        )}
        {driverLocation && (
          <Marker
            coordinate={{ latitude: driverLocation.lat, longitude: driverLocation.lng }}
            title="Driver"
            pinColor={COLORS.primary}
          />
        )}
        {showRoute && routeCoords.length === 2 && (
          <Polyline coordinates={routeCoords} strokeColor={COLORS.primary} strokeWidth={3} />
        )}
        {selecting && (
          <Marker
            coordinate={{ latitude: selecting.lat, longitude: selecting.lng }}
            pinColor={COLORS.warning}
          />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 280, borderRadius: 12, overflow: 'hidden', marginBottom: 16 },
  map: { flex: 1 },
});
