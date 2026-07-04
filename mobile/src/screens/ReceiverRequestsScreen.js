import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Card, Screen } from '../components/UI';
import { COLORS } from '../constants';
import { useAuth } from '../context/AuthContext';
import { getCurrentLocation, reverseGeocode } from '../hooks/useLocationTracking';
import { api } from '../services/api';
import { getSocket } from '../services/socket';

// Incoming Darb Box requests where the current user is the receiver.
export default function ReceiverRequestsScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      const rides = await api.getRides();
      setRequests(
        rides.filter((r) => r.receiverId === user?.id && r.status === 'PENDING_RECEIVER_APPROVAL')
      );
    } catch (err) {
      Alert.alert(t('error'), err.message);
    }
  }, [user?.id, t]);

  useEffect(() => {
    load();
    const socket = getSocket();
    socket?.on('box:request', load);
    socket?.on('ride:updated', load);
    return () => {
      socket?.off('box:request', load);
      socket?.off('ride:updated', load);
    };
  }, [load]);

  async function accept(rideId) {
    setBusyId(rideId);
    try {
      const loc = await getCurrentLocation();
      await api.approveBox(rideId, {
        lat: loc.lat,
        lng: loc.lng,
        address: reverseGeocode(loc.lat, loc.lng),
      });
      Alert.alert(t('thanks'), t('boxApproved'));
      load();
    } catch (err) {
      Alert.alert(t('error'), err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function reject(rideId) {
    setBusyId(rideId);
    try {
      await api.rejectBox(rideId);
      load();
    } catch (err) {
      Alert.alert(t('error'), err.message);
    } finally {
      setBusyId(null);
    }
  }

  function renderItem({ item }) {
    return (
      <Card style={styles.card}>
        <Text style={styles.title}>📦 {item.packageDesc || t('rideTypeBox')}</Text>
        <Text style={styles.meta}>{t('sender')}: {item.rider?.name} — {item.rider?.phone}</Text>
        <Text style={styles.meta}>{t('pickup')}: {item.pickupAddress}</Text>
        <View style={styles.actions}>
          <Button title={t('approve')} onPress={() => accept(item.id)} loading={busyId === item.id} style={styles.btn} />
          <Button title={t('reject')} variant="outline" onPress={() => reject(item.id)} loading={busyId === item.id} style={styles.btn} />
        </View>
      </Card>
    );
  }

  return (
    <Screen>
      <Text style={styles.header}>{t('incomingPackages')}</Text>
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}>{t('noPackages')}</Text>}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 16, textAlign: 'right' },
  card: { borderLeftWidth: 4, borderLeftColor: COLORS.warning },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 8, textAlign: 'right' },
  meta: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 4, textAlign: 'right' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  btn: { flex: 1 },
  empty: { textAlign: 'center', color: COLORS.textSecondary, marginTop: 40 },
});
