import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Card, Screen } from '../components/UI';
import { COLORS } from '../constants';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { statusKey } from '../utils/status';

export default function MyRidesScreen({ navigation }) {
  const { t } = useTranslation();
  const { textAlign } = useLanguage();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRides(await api.getRides());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Screen>
      <FlatList
        data={rides}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListEmptyComponent={<Text style={styles.empty}>{t('noRides')}</Text>}
        renderItem={({ item }) => (
          <Card style={styles.rideCard}>
            <Text style={[styles.status, { textAlign }]}>{t(statusKey(item.status))}</Text>
            <Text style={[styles.route, { textAlign }]} numberOfLines={2}>
              {item.pickupAddress}
            </Text>
            <Text style={styles.arrow}>↓</Text>
            <Text style={[styles.route, { textAlign }]} numberOfLines={2}>
              {item.dropoffAddress}
            </Text>
            <Button
              title={t('openRide')}
              variant="outline"
              onPress={() => navigation.getParent()?.navigate('RideDetail', { rideId: item.id })}
              style={styles.btn}
            />
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { textAlign: 'center', color: COLORS.textSecondary, marginTop: 40 },
  rideCard: { marginBottom: 10 },
  status: { fontSize: 12, color: COLORS.primary, fontWeight: '700', marginBottom: 8 },
  route: { fontSize: 14, color: COLORS.text },
  arrow: { textAlign: 'center', color: COLORS.textSecondary, marginVertical: 4 },
  btn: { marginTop: 12 },
});
