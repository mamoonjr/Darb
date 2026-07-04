import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { COLORS, JORDAN_REGION } from '../constants';
import CarMarker from './CarMarker';

export default function RideMap({
  pickup,
  dropoff,
  driverLocation,
  nearbyDrivers = [],
  showRoute = true,
  onMapPress,
  selecting = null,
  pickupTitle = 'Pickup',
  dropoffTitle = 'Dropoff',
  style,
}) {
  const mapRef = useRef(null);

  useEffect(() => {
    const coords = [pickup, dropoff, driverLocation].filter(
      (c) => c?.lat != null && c?.lng != null
    );
    if (coords.length >= 2 && mapRef.current) {
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
        initialRegion={JORDAN_REGION}
        showsUserLocation
        showsMyLocationButton
        onPress={(e) => onMapPress?.(e.nativeEvent.coordinate)}
      >
        {pickup && (
          <Marker
            coordinate={{ latitude: pickup.lat, longitude: pickup.lng }}
            title={pickup.address || pickupTitle}
            pinColor={COLORS.success}
          />
        )}
        {dropoff && (
          <Marker
            coordinate={{ latitude: dropoff.lat, longitude: dropoff.lng }}
            title={dropoff.address || dropoffTitle}
            pinColor={COLORS.error}
          />
        )}
        {driverLocation && (
          <CarMarker
            lat={driverLocation.lat}
            lng={driverLocation.lng}
            title="Driver"
            highlight
          />
        )}
        {nearbyDrivers.map((d) =>
          d?.lat != null && d?.lng != null ? (
            <CarMarker
              key={d.driverId}
              lat={d.lat}
              lng={d.lng}
              title={d.name || 'Driver'}
              description={d.vehicleModel ? `${d.vehicleColor || ''} ${d.vehicleModel}` : undefined}
            />
          ) : null
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
