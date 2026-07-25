import React, { useCallback, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Button, Card, Screen } from '../components/UI';
import { COLORS, CURRENCY } from '../constants';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { localizeApiError } from '../utils/errors';
import { statusKey } from '../utils/status';

export default function RouteRideDetailScreen({ route, navigation }) {
  const { rideId } = route.params;
  const { t } = useTranslation();
  const { user } = useAuth();
  const { textAlign, row } = useLanguage();
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(false);
  const [originId, setOriginId] = useState(null);
  const [destId, setDestId] = useState(null);
  const [priceDrafts, setPriceDrafts] = useState({});
  const [busy, setBusy] = useState(false);

  const isDriver = user?.id && ride?.driverId === user.id;
  const landmarks = ride?.route?.landmarks || [];
  const myJoin = ride?.joinRequests?.find((j) => j.passengerId === user?.id);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getRouteRide(rideId);
      setRide(data);
    } catch (err) {
      Alert.alert(t('error'), localizeApiError(err, t));
    } finally {
      setLoading(false);
    }
  }, [rideId, t]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function onJoin() {
    if (!originId || !destId) {
      Alert.alert(t('error'), t('carpoolPickLandmarks'));
      return;
    }
    if (originId === destId) {
      Alert.alert(t('error'), t('carpoolSameLandmark'));
      return;
    }
    setBusy(true);
    try {
      await api.joinRouteRide(rideId, {
        originLandmarkId: originId,
        destinationLandmarkId: destId,
        seats: 1,
      });
      Alert.alert(t('ok'), t('carpoolJoinSent'));
      await load();
    } catch (err) {
      Alert.alert(t('error'), localizeApiError(err, t));
    } finally {
      setBusy(false);
    }
  }

  async function onPropose(joinId) {
    const raw = priceDrafts[joinId];
    const amount = Number(raw);
    if (!amount || amount <= 0) {
      Alert.alert(t('error'), t('carpoolInvalidPrice'));
      return;
    }
    setBusy(true);
    try {
      await api.proposeJoinPrice(joinId, amount);
      Alert.alert(t('ok'), t('carpoolPriceProposed'));
      await load();
    } catch (err) {
      Alert.alert(t('error'), localizeApiError(err, t));
    } finally {
      setBusy(false);
    }
  }

  async function onAccept(joinId) {
    setBusy(true);
    try {
      await api.acceptJoinPrice(joinId);
      Alert.alert(t('ok'), t('carpoolPriceAccepted'));
      await load();
    } catch (err) {
      Alert.alert(t('error'), localizeApiError(err, t));
    } finally {
      setBusy(false);
    }
  }

  async function onReject(joinId) {
    setBusy(true);
    try {
      await api.rejectJoinRequest(joinId);
      await load();
    } catch (err) {
      Alert.alert(t('error'), localizeApiError(err, t));
    } finally {
      setBusy(false);
    }
  }

  async function onStart() {
    setBusy(true);
    try {
      await api.startRouteRide(rideId);
      await load();
    } catch (err) {
      Alert.alert(t('error'), localizeApiError(err, t));
    } finally {
      setBusy(false);
    }
  }

  async function onComplete() {
    setBusy(true);
    try {
      await api.completeRouteRide(rideId);
      await load();
    } catch (err) {
      Alert.alert(t('error'), localizeApiError(err, t));
    } finally {
      setBusy(false);
    }
  }

  if (!ride && loading) {
    return (
      <Screen style={styles.center}>
        <Text style={{ textAlign }}>{t('loading')}</Text>
      </Screen>
    );
  }

  if (!ride) {
    return (
      <Screen style={styles.center}>
        <Text style={{ textAlign }}>{t('error')}</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        <Text style={[styles.title, { textAlign }]}>
          {ride.summary || t('carpoolRouteRide')}
        </Text>
        <Text style={[styles.meta, { textAlign }]}>
          {t('driver')}: {ride.driver?.name || '—'} · {t(statusKey(ride.status))}
        </Text>
        <Text style={[styles.meta, { textAlign }]}>
          {t('seats')}: {ride.availableSeats ?? '—'} / {ride.vehicleCapacity ?? ride.totalSeats}
        </Text>

        <Card style={styles.card}>
          <Text style={[styles.section, { textAlign }]}>{t('carpoolStops')}</Text>
          {landmarks.map((lm, i) => (
            <Text key={lm.id} style={[styles.stop, { textAlign }]}>
              {i + 1}. {lm.name}
            </Text>
          ))}
        </Card>

        {!isDriver && !myJoin && ['PUBLISHED', 'RECEIVING_REQUESTS'].includes(ride.status) && (
          <Card style={styles.card}>
            <Text style={[styles.section, { textAlign }]}>{t('carpoolJoinTitle')}</Text>
            <Text style={[styles.meta, { textAlign }]}>{t('carpoolPickOrigin')}</Text>
            {landmarks.map((lm) => (
              <TouchableOpacity
                key={`o-${lm.id}`}
                style={[styles.pick, originId === lm.id && styles.pickOn]}
                onPress={() => setOriginId(lm.id)}
              >
                <Text style={[styles.pickText, { textAlign }]}>{lm.name}</Text>
              </TouchableOpacity>
            ))}
            <Text style={[styles.meta, { textAlign, marginTop: 10 }]}>{t('carpoolPickDest')}</Text>
            {landmarks.map((lm) => (
              <TouchableOpacity
                key={`d-${lm.id}`}
                style={[styles.pick, destId === lm.id && styles.pickOn]}
                onPress={() => setDestId(lm.id)}
              >
                <Text style={[styles.pickText, { textAlign }]}>{lm.name}</Text>
              </TouchableOpacity>
            ))}
            <Button title={t('carpoolSendJoin')} onPress={onJoin} loading={busy} style={styles.mt} />
          </Card>
        )}

        {myJoin && (
          <Card style={styles.card}>
            <Text style={[styles.section, { textAlign }]}>{t('carpoolMyJoin')}</Text>
            <Text style={[styles.meta, { textAlign }]}>
              {myJoin.originLandmark?.name} → {myJoin.destinationLandmark?.name}
            </Text>
            <Text style={[styles.meta, { textAlign }]}>{t(statusKey(myJoin.status))}</Text>
            {myJoin.proposedPrice != null && (
              <Text style={[styles.price, { textAlign }]}>
                {myJoin.proposedPrice} {CURRENCY}
              </Text>
            )}
            {myJoin.status === 'PRICE_PROPOSED' && (
              <Button
                title={t('carpoolAcceptPrice')}
                onPress={() => onAccept(myJoin.id)}
                loading={busy}
                style={styles.mt}
              />
            )}
            {['REQUESTED', 'PRICE_PROPOSED'].includes(myJoin.status) && (
              <Button
                title={t('cancel')}
                variant="outline"
                onPress={() => onReject(myJoin.id)}
                loading={busy}
                style={styles.mt}
              />
            )}
          </Card>
        )}

        {isDriver && (
          <Card style={styles.card}>
            <Text style={[styles.section, { textAlign }]}>{t('carpoolJoinRequests')}</Text>
            {(ride.joinRequests || []).length === 0 ? (
              <Text style={[styles.meta, { textAlign }]}>{t('carpoolNoJoins')}</Text>
            ) : (
              ride.joinRequests.map((jr) => (
                <View key={jr.id} style={styles.joinItem}>
                  <Text style={[styles.pickText, { textAlign }]}>
                    {jr.passenger?.name || '—'} · {t(statusKey(jr.status))}
                  </Text>
                  <Text style={[styles.meta, { textAlign }]}>
                    {jr.originLandmark?.name} → {jr.destinationLandmark?.name}
                  </Text>
                  {jr.proposedPrice != null && (
                    <Text style={[styles.meta, { textAlign }]}>
                      {jr.proposedPrice} {CURRENCY}
                    </Text>
                  )}
                  {jr.status === 'REQUESTED' && (
                    <View style={[styles.priceRow, row]}>
                      <TextInput
                        style={[styles.priceInput, { textAlign }]}
                        keyboardType="decimal-pad"
                        placeholder={t('carpoolPricePlaceholder')}
                        placeholderTextColor={COLORS.textSecondary}
                        value={priceDrafts[jr.id] || ''}
                        onChangeText={(v) =>
                          setPriceDrafts((prev) => ({ ...prev, [jr.id]: v }))
                        }
                      />
                      <Button
                        title={t('carpoolProposePrice')}
                        onPress={() => onPropose(jr.id)}
                        loading={busy}
                        style={styles.priceBtn}
                      />
                    </View>
                  )}
                  {['REQUESTED', 'PRICE_PROPOSED'].includes(jr.status) && (
                    <Button
                      title={t('reject')}
                      variant="outline"
                      onPress={() => onReject(jr.id)}
                      loading={busy}
                      style={styles.mt}
                    />
                  )}
                </View>
              ))
            )}
          </Card>
        )}

        {isDriver && ride.status === 'CONFIRMED' && (
          <Button title={t('carpoolStartRide')} onPress={onStart} loading={busy} style={styles.mt} />
        )}
        {isDriver && ride.status === 'STARTED' && (
          <Button
            title={t('carpoolCompleteRide')}
            onPress={onComplete}
            loading={busy}
            style={styles.mt}
          />
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  meta: { color: COLORS.textSecondary, marginBottom: 4, fontSize: 13 },
  card: { marginTop: 14 },
  section: { fontSize: 16, fontWeight: '700', marginBottom: 8, color: COLORS.text },
  stop: { fontSize: 14, color: COLORS.text, marginBottom: 4 },
  pick: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
  },
  pickOn: { borderColor: COLORS.primary, backgroundColor: '#e8f0fe' },
  pickText: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  mt: { marginTop: 12 },
  price: { fontSize: 22, fontWeight: '700', color: COLORS.primary, marginVertical: 8 },
  joinItem: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
    marginTop: 12,
  },
  priceRow: { alignItems: 'center', gap: 8, marginTop: 8 },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
    color: COLORS.text,
  },
  priceBtn: { minWidth: 110 },
});
