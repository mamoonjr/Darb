import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AnimatedRegion, MarkerAnimated } from 'react-native-maps';
import { COLORS } from '../constants';
import { calculateBearing } from '../utils/geo';

// A reusable car marker that animates smoothly between coordinate updates and
// rotates toward the direction of travel. The AnimatedRegion is created once
// and reused (not recreated) so the native marker isn't torn down each update.
export default function CarMarker({ lat, lng, title, description, highlight }) {
  const coordinate = useRef(
    new AnimatedRegion({ latitude: lat, longitude: lng, latitudeDelta: 0, longitudeDelta: 0 })
  ).current;
  const prev = useRef({ lat, lng });
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const moved = prev.current.lat !== lat || prev.current.lng !== lng;
    if (moved) {
      const bearing = calculateBearing(prev.current.lat, prev.current.lng, lat, lng);
      if (!Number.isNaN(bearing)) setRotation(bearing);
    }
    prev.current = { lat, lng };
    coordinate
      .timing({ latitude: lat, longitude: lng, duration: 1000, useNativeDriver: false })
      .start();
  }, [lat, lng, coordinate]);

  return (
    <MarkerAnimated
      coordinate={coordinate}
      title={title}
      description={description}
      anchor={{ x: 0.5, y: 0.5 }}
      flat
      rotation={rotation}
    >
      <View style={[styles.marker, highlight && styles.highlight]}>
        <Text style={styles.emoji}>🚗</Text>
      </View>
    </MarkerAnimated>
  );
}

const styles = StyleSheet.create({
  marker: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: COLORS.primary,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  highlight: { borderColor: COLORS.success },
  emoji: { fontSize: 18 },
});
