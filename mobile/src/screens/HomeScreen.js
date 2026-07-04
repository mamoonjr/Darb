import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import RideMap from '../components/RideMap';
import { Button, Card, Input, Screen } from '../components/UI';
import { COLORS, RIDE_TYPES } from '../constants';
import { useAuth } from '../context/AuthContext';
import { getCurrentLocation, reverseGeocode, useDriverPresence } from '../hooks/useLocationTracking';
import { api } from '../services/api';
import { emitRiderLocation, getSocket } from '../services/socket';
import { statusKey } from '../utils/status';

const DEFAULT_DROPOFF_OFFSET = 0.02;
// Amman, Jordan fallback if location permission is unavailable.
const AMMAN_FALLBACK = { lat: 31.9522, lng: 35.9106, address: 'وسط عمّان' };

const RIDE_TYPE_OPTIONS = [
  { id: RIDE_TYPES.SINGLE, labelKey: 'rideTypeSingle', icon: '🚗' },
  { id: RIDE_TYPES.CARPOOL, labelKey: 'rideTypeCarpool', icon: '👥' },
  { id: RIDE_TYPES.BOX_DELIVERY, labelKey: 'rideTypeBox', icon: '📦' },
];

export default function HomeScreen({ navigation }) {
  const { t } = useTranslation();
  const { user, setUser } = useAuth();

  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [pickup, setPickup] = useState(null);
  const [dropoff, setDropoff] = useState(null);
  const [selectMode, setSelectMode] = useState(null);
  const [nearbyDrivers, setNearbyDrivers] = useState([]);

  // Ride-type + Darb Box / carpool form state
  const [rideType, setRideType] = useState(RIDE_TYPES.SINGLE);
  const [seats, setSeats] = useState(1);
  const [receiverPhone, setReceiverPhone] = useState('');
  const [receiverLookup, setReceiverLookup] = useState(null);
  const [packageDesc, setPackageDesc] = useState('');
  const [lookingUp, setLookingUp] = useState(false);

  const isDriver = user?.activeRole === 'DRIVER';
  const isAvailable = user?.driverProfile?.isAvailable;

  // Online drivers broadcast their position for the live-proximity map.
  useDriverPresence(isDriver && isAvailable);

  useEffect(() => {
    initLocation();
  }, []);

  async function initLocation() {
    try {
      const loc = await getCurrentLocation();
      setPickup({ ...loc, address: reverseGeocode(loc.lat, loc.lng) });
      setDropoff({
        lat: loc.lat + DEFAULT_DROPOFF_OFFSET,
        lng: loc.lng + DEFAULT_DROPOFF_OFFSET,
        address: reverseGeocode(loc.lat + DEFAULT_DROPOFF_OFFSET, loc.lng + DEFAULT_DROPOFF_OFFSET),
      });
    } catch {
      setPickup(AMMAN_FALLBACK);
      setDropoff({
        lat: AMMAN_FALLBACK.lat + DEFAULT_DROPOFF_OFFSET,
        lng: AMMAN_FALLBACK.lng + DEFAULT_DROPOFF_OFFSET,
        address: 'الدوار السابع، عمّان',
      });
    }
  }

  const loadRides = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getRides();
      setRides(data);
    } catch (err) {
      Alert.alert(t('error'), err.message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadRides();
    const socket = getSocket();
    socket?.on('ride:requested', loadRides);
    socket?.on('ride:accepted', loadRides);
    socket?.on('ride:updated', loadRides);
    socket?.on('box:request', loadRides);
    socket?.on('box:rejected', loadRides);
    return () => {
      socket?.off('ride:requested', loadRides);
      socket?.off('ride:accepted', loadRides);
      socket?.off('ride:updated', loadRides);
      socket?.off('box:request', loadRides);
      socket?.off('box:rejected', loadRides);
    };
  }, [loadRides]);

  // Live proximity drivers (rider only)
  useEffect(() => {
    if (isDriver || !pickup) return undefined;
    let mounted = true;

    async function snapshot() {
      try {
        const { drivers } = await api.getNearbyDrivers(pickup.lat, pickup.lng);
        if (mounted) setNearbyDrivers(drivers);
      } catch {
        // ignore
      }
    }

    snapshot();
    emitRiderLocation(pickup.lat, pickup.lng);

    const socket = getSocket();
    const onLoc = (d) =>
      setNearbyDrivers((prev) => {
        const existing = prev.find((x) => x.driverId === d.driverId) || {};
        return [...prev.filter((x) => x.driverId !== d.driverId), { ...existing, ...d }];
      });
    const onOffline = ({ driverId }) =>
      setNearbyDrivers((prev) => prev.filter((x) => x.driverId !== driverId));

    socket?.on('drivers:location', onLoc);
    socket?.on('drivers:offline', onOffline);
    const interval = setInterval(snapshot, 20000);

    return () => {
      mounted = false;
      socket?.off('drivers:location', onLoc);
      socket?.off('drivers:offline', onOffline);
      clearInterval(interval);
    };
  }, [isDriver, pickup?.lat, pickup?.lng]);

  function handleMapPress(coordinate) {
    if (!selectMode) return;
    const point = {
      lat: coordinate.latitude,
      lng: coordinate.longitude,
      address: reverseGeocode(coordinate.latitude, coordinate.longitude),
    };
    if (selectMode === 'pickup') setPickup(point);
    else setDropoff(point);
    setSelectMode(null);
  }

  async function lookupReceiver() {
    if (receiverPhone.trim().length < 4) {
      Alert.alert(t('error'), t('receiverPhone'));
      return;
    }
    setLookingUp(true);
    try {
      const result = await api.searchUserByPhone(receiverPhone.trim());
      setReceiverLookup(result);
    } catch (err) {
      Alert.alert(t('error'), err.message);
      setReceiverLookup(null);
    } finally {
      setLookingUp(false);
    }
  }

  function navigateAfterCreate(ride) {
    if (ride.rideType === RIDE_TYPES.BOX_DELIVERY) {
      if (ride.status === 'REQUESTED') {
        navigation.navigate('Payment', { rideId: ride.id, fare: ride.fare });
      } else {
        navigation.navigate('RideDetail', { rideId: ride.id });
      }
    } else if (ride.rideType === RIDE_TYPES.CARPOOL) {
      if (ride.matched) Alert.alert(t('appName'), t('carpoolMatched'));
      navigation.navigate('RideDetail', { rideId: ride.id });
    } else {
      navigation.navigate('Payment', { rideId: ride.id, fare: ride.fare });
    }
  }

  async function requestRide() {
    if (rideType === RIDE_TYPES.BOX_DELIVERY) return requestBox();

    if (!pickup || !dropoff) {
      Alert.alert(t('error'), t('selectLocations'));
      return;
    }
    setRequesting(true);
    try {
      const ride = await api.createRide({
        rideType,
        pickupAddress: pickup.address,
        pickupLat: pickup.lat,
        pickupLng: pickup.lng,
        dropoffAddress: dropoff.address,
        dropoffLat: dropoff.lat,
        dropoffLng: dropoff.lng,
        ...(rideType === RIDE_TYPES.CARPOOL ? { seats } : {}),
      });
      navigateAfterCreate(ride);
      loadRides();
    } catch (err) {
      Alert.alert(t('error'), err.message);
    } finally {
      setRequesting(false);
    }
  }

  async function requestBox() {
    if (!pickup) {
      Alert.alert(t('error'), t('selectLocations'));
      return;
    }
    if (!receiverLookup) {
      Alert.alert(t('error'), t('searchReceiverFirst'));
      return;
    }
    // External receivers can't share GPS, so a destination is required.
    if (receiverLookup.external && !dropoff) {
      Alert.alert(t('error'), t('selectLocations'));
      return;
    }
    setRequesting(true);
    try {
      const body = {
        rideType: RIDE_TYPES.BOX_DELIVERY,
        pickupAddress: pickup.address,
        pickupLat: pickup.lat,
        pickupLng: pickup.lng,
        receiverPhone: receiverPhone.trim(),
        receiverName: receiverLookup.user?.name,
        packageDesc,
      };
      if (receiverLookup.external) {
        body.dropoffAddress = dropoff.address;
        body.dropoffLat = dropoff.lat;
        body.dropoffLng = dropoff.lng;
      }
      const ride = await api.createRide(body);
      navigateAfterCreate(ride);
      loadRides();
    } catch (err) {
      Alert.alert(t('error'), err.message);
    } finally {
      setRequesting(false);
    }
  }

  async function toggleAvailability() {
    try {
      await api.updateDriverAvailability(!isAvailable);
      const updated = await api.me();
      setUser(updated);
      loadRides();
    } catch (err) {
      Alert.alert(t('error'), err.message);
    }
  }

  const activeRide = rides.find(
    (r) =>
      r.riderId === user?.id &&
      ['PENDING_RECEIVER_APPROVAL', 'REQUESTED', 'ACCEPTED', 'DRIVER_ARRIVED', 'IN_PROGRESS'].includes(
        r.status
      )
  );

  const pendingBoxes = rides.filter(
    (r) => r.receiverId === user?.id && r.status === 'PENDING_RECEIVER_APPROVAL'
  );

  function renderRide({ item }) {
    return (
      <Card>
        <View style={styles.rideHeader}>
          <Text style={styles.rideStatus}>{t(statusKey(item.status))}</Text>
          <Text style={styles.rideType}>{rideTypeLabel(item.rideType, t)}</Text>
        </View>
        <Text style={styles.rideRoute}>{item.pickupAddress}</Text>
        <Text style={styles.rideArrow}>↓</Text>
        <Text style={styles.rideRoute}>{item.dropoffAddress}</Text>
        {item.fare != null && <Text style={styles.fare}>{item.fare} {t('sar')}</Text>}
        <Button
          title={t('activeRide')}
          variant="outline"
          onPress={() => navigation.navigate('RideDetail', { rideId: item.id })}
          style={styles.rideBtn}
        />
      </Card>
    );
  }

  const header = (
    <View>
      <Text style={styles.greeting}>{t('appName')} — {user?.name}</Text>

      {pendingBoxes.length > 0 && (
        <Card style={styles.pendingCard}>
          <Text style={styles.pendingTitle}>📦 {t('pendingBoxTitle')} ({pendingBoxes.length})</Text>
          <Button
            title={t('incomingPackages')}
            onPress={() => navigation.navigate('ReceiverRequests')}
          />
        </Card>
      )}

      {!isDriver && (
        <>
          <View style={styles.typeRow}>
            {RIDE_TYPE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={[styles.typeChip, rideType === opt.id && styles.typeChipActive]}
                onPress={() => setRideType(opt.id)}
              >
                <Text style={styles.typeIcon}>{opt.icon}</Text>
                <Text style={[styles.typeLabel, rideType === opt.id && styles.typeLabelActive]}>
                  {t(opt.labelKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <RideMap
            pickup={pickup}
            dropoff={rideType === RIDE_TYPES.BOX_DELIVERY && !receiverLookup?.external ? null : dropoff}
            nearbyDrivers={nearbyDrivers}
            onMapPress={handleMapPress}
            selecting={selectMode ? (selectMode === 'pickup' ? pickup : dropoff) : null}
            pickupTitle={rideType === RIDE_TYPES.BOX_DELIVERY ? t('pickup') : t('pickup')}
          />

          {!activeRide && (
            <View style={styles.locationBtns}>
              <Button
                title={selectMode === 'pickup' ? t('tapOnMap') : t('setPickup')}
                variant={selectMode === 'pickup' ? 'primary' : 'outline'}
                onPress={() => setSelectMode('pickup')}
                style={styles.locBtn}
              />
              {(rideType !== RIDE_TYPES.BOX_DELIVERY || receiverLookup?.external) && (
                <Button
                  title={selectMode === 'dropoff' ? t('tapOnMap') : t('setDropoff')}
                  variant={selectMode === 'dropoff' ? 'primary' : 'outline'}
                  onPress={() => setSelectMode('dropoff')}
                  style={styles.locBtn}
                />
              )}
            </View>
          )}

          {rideType === RIDE_TYPES.CARPOOL && !activeRide && (
            <Card>
              <Text style={styles.label}>{t('seats')}</Text>
              <View style={styles.seatsRow}>
                {[1, 2, 3, 4].map((n) => (
                  <TouchableOpacity
                    key={n}
                    style={[styles.seatChip, seats === n && styles.seatChipActive]}
                    onPress={() => setSeats(n)}
                  >
                    <Text style={[styles.seatText, seats === n && styles.seatTextActive]}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>
          )}

          {rideType === RIDE_TYPES.BOX_DELIVERY && !activeRide && (
            <Card>
              <Text style={styles.label}>{t('receiverPhone')}</Text>
              <View style={styles.lookupRow}>
                <View style={{ flex: 1 }}>
                  <Input
                    value={receiverPhone}
                    onChangeText={(v) => { setReceiverPhone(v); setReceiverLookup(null); }}
                    placeholder="+9627..."
                    keyboardType="phone-pad"
                  />
                </View>
                <Button title={t('searchReceiver')} onPress={lookupReceiver} loading={lookingUp} style={styles.lookupBtn} />
              </View>
              {receiverLookup?.exists && (
                <Text style={styles.receiverOk}>✅ {t('receiverFound')}: {receiverLookup.user.name}</Text>
              )}
              {receiverLookup?.external && (
                <Text style={styles.receiverExt}>ℹ️ {t('receiverExternal')}</Text>
              )}
              <Input
                label={t('packageDesc')}
                value={packageDesc}
                onChangeText={setPackageDesc}
                placeholder={t('packageDesc')}
              />
            </Card>
          )}
        </>
      )}

      {!isDriver && !activeRide && (
        <Button
          title={rideType === RIDE_TYPES.BOX_DELIVERY ? t('sendPackage') : t('requestRide')}
          onPress={requestRide}
          loading={requesting}
          style={styles.mainBtn}
        />
      )}

      {isDriver && (
        <Button
          title={isAvailable ? t('goOffline') : t('goOnline')}
          onPress={toggleAvailability}
          variant={isAvailable ? 'outline' : 'primary'}
          style={styles.mainBtn}
        />
      )}

      {activeRide && (
        <Card style={styles.activeCard}>
          <Text style={styles.activeTitle}>{t('activeRide')} · {t(statusKey(activeRide.status))}</Text>
          <Text style={styles.rideRoute}>{activeRide.pickupAddress} → {activeRide.dropoffAddress}</Text>
          <Button
            title={t('activeRide')}
            onPress={() => navigation.navigate('RideDetail', { rideId: activeRide.id })}
          />
        </Card>
      )}

      <Text style={styles.section}>{t('rideHistory')}</Text>
    </View>
  );

  return (
    <Screen>
      <FlatList
        data={rides}
        keyExtractor={(item) => item.id}
        renderItem={renderRide}
        ListHeaderComponent={header}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadRides} />}
        ListEmptyComponent={<Text style={styles.empty}>{t('noRides')}</Text>}
      />
    </Screen>
  );
}

function rideTypeLabel(type, t) {
  if (type === 'CARPOOL') return t('rideTypeCarpool');
  if (type === 'BOX_DELIVERY') return t('rideTypeBox');
  return t('rideTypeSingle');
}

const styles = StyleSheet.create({
  greeting: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 16, textAlign: 'right' },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  typeChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  typeChipActive: { borderColor: COLORS.primary, backgroundColor: '#e8f0fe' },
  typeIcon: { fontSize: 22 },
  typeLabel: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  typeLabelActive: { color: COLORS.primary, fontWeight: '700' },
  locationBtns: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  locBtn: { flex: 1 },
  mainBtn: { marginBottom: 20 },
  label: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 8, textAlign: 'right' },
  seatsRow: { flexDirection: 'row', gap: 8 },
  seatChip: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.surface,
  },
  seatChipActive: { borderColor: COLORS.primary, backgroundColor: '#e8f0fe' },
  seatText: { fontSize: 16, color: COLORS.textSecondary, fontWeight: '600' },
  seatTextActive: { color: COLORS.primary },
  lookupRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  lookupBtn: { marginTop: 0, paddingHorizontal: 16 },
  receiverOk: { color: COLORS.success, marginBottom: 8, textAlign: 'right' },
  receiverExt: { color: COLORS.warning, marginBottom: 8, textAlign: 'right' },
  pendingCard: { borderLeftWidth: 4, borderLeftColor: COLORS.warning },
  pendingTitle: { fontSize: 16, fontWeight: '700', color: COLORS.warning, marginBottom: 8, textAlign: 'right' },
  activeCard: { borderLeftWidth: 4, borderLeftColor: COLORS.primary },
  activeTitle: { fontSize: 16, fontWeight: '700', color: COLORS.primary, marginBottom: 8, textAlign: 'right' },
  section: { fontSize: 18, fontWeight: '600', color: COLORS.text, marginBottom: 12, textAlign: 'right' },
  rideHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  rideStatus: { fontSize: 12, color: COLORS.primary, fontWeight: '600', marginBottom: 8 },
  rideType: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  rideRoute: { fontSize: 14, color: COLORS.text, textAlign: 'right' },
  rideArrow: { textAlign: 'center', color: COLORS.textSecondary, marginVertical: 4 },
  fare: { fontSize: 16, fontWeight: '700', color: COLORS.success, marginTop: 8, textAlign: 'right' },
  rideBtn: { marginTop: 12 },
  empty: { textAlign: 'center', color: COLORS.textSecondary, marginTop: 40 },
});
