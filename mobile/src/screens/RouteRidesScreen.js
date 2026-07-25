import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Screen } from '../components/UI';
import { COLORS } from '../constants';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { localizeApiError } from '../utils/errors';
import { statusKey } from '../utils/status';

export default function RouteRidesScreen({ navigation }) {
  const { t } = useTranslation();
  const { textAlign } = useLanguage();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRides(await api.listRouteRides());
    } catch (err) {
      Alert.alert(t('error'), localizeApiError(err, t));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <Screen>
      <FlatList
        data={rides}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading ? (
            <Text style={[styles.empty, { textAlign }]}>{t('carpoolNoRides')}</Text>
          ) : null
        }
        renderItem={({ item }) => {
          const landmarks = item.route?.landmarks || [];
          const first = landmarks[0]?.name || '—';
          const last = landmarks[landmarks.length - 1]?.name || '—';
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('RouteRideDetail', { rideId: item.id })}
            >
              <Text style={[styles.title, { textAlign }]}>
                {item.summary || `${first} → ${last}`}
              </Text>
              <Text style={[styles.meta, { textAlign }]}>
                {t('driver')}: {item.driver?.name || '—'} · {t(statusKey(item.status))}
              </Text>
              <Text style={[styles.meta, { textAlign }]}>
                {t('carpoolStops')}: {landmarks.length} · {t('seats')}:{' '}
                {item.availableSeats ?? item.vehicleCapacity ?? '—'}
              </Text>
              <Text style={[styles.stops, { textAlign }]}>
                {landmarks.map((l) => l.name).join(' → ')}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, flexGrow: 1 },
  empty: { color: COLORS.textSecondary, marginTop: 40, textAlign: 'center' },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 12,
  },
  title: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  meta: { color: COLORS.textSecondary, fontSize: 13, marginBottom: 2 },
  stops: { marginTop: 8, color: COLORS.primaryDark, fontWeight: '600', fontSize: 13 },
});
