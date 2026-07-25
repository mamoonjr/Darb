import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeBottomSheet from '../components/HomeBottomSheet';
import HomeDriverPanel from '../components/HomeDriverPanel';
import RideMap from '../components/RideMap';
import { Button } from '../components/UI';
import { AIRPORT_DROPOFF, COLORS, RIDE_TIERS, RIDE_TYPES } from '../constants';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getCurrentLocation, reverseGeocode, useDriverPresence } from '../hooks/useLocationTracking';
import { addNotificationListener, addNotificationResponseListener } from '../services/notifications';
import { api } from '../services/api';
import { emitRiderLocation, getSocket } from '../services/socket';
import { localizeApiError } from '../utils/errors';
import { calculateDistanceKm, estimateFare } from '../utils/fare';
import { normalizePhone } from '../utils/phone';
import { statusKey } from '../utils/status';

const AMMAN_FALLBACK = { lat: 31.9522, lng: 35.9106, address: 'وسط عمّان' };

export default function HomeScreen({ navigation }) {
  const { t } = useTranslation();
  const { user, setUser } = useAuth();
  const { row, isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const stackNav = navigation.getParent();

  const [rides, setRides] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [loading, setLoading] = useState(false);
  const [incomingLoading, setIncomingLoading] = useState(false);
  const [acceptingId, setAcceptingId] = useState(null);
  const [requesting, setRequesting] = useState(false);
  const [pickup, setPickup] = useState(null);
  const [dropoff, setDropoff] = useState(null);
  const [selectMode, setSelectMode] = useState(null);
  const [nearbyDrivers, setNearbyDrivers] = useState([]);

  const [sheetMode, setSheetMode] = useState('default');
  const [selectedTier, setSelectedTier] = useState('ECONOMY');
  const [rideType, setRideType] = useState(RIDE_TYPES.SINGLE);
  const [seats, setSeats] = useState(1);
  const [receiverPhone, setReceiverPhone] = useState('');
  const [receiverLookup, setReceiverLookup] = useState(null);
  const [packageDesc, setPackageDesc] = useState('');
  const [lookingUp, setLookingUp] = useState(false);

  const isDriver = user?.activeRole === 'DRIVER';
  const isAvailable = user?.driverProfile?.isAvailable;

  useDriverPresence(isDriver && isAvailable);

  useEffect(() => {
    initLocation();
  }, []);

  async function initLocation() {
    try {
      const loc = await getCurrentLocation();
      setPickup({ ...loc, address: await reverseGeocode(loc.lat, loc.lng) });
      setDropoff(null);
    } catch {
      setPickup(AMMAN_FALLBACK);
      setDropoff(null);
    }
  }

  const loadRides = useCallback(async () => {
    setLoading(true);
    try {
      setRides(await api.getRides());
    } catch (err) {
      Alert.alert(t('error'), err.message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  const loadIncoming = useCallback(async () => {
    if (!isDriver || !isAvailable) {
      setIncoming([]);
      return;
    }
    setIncomingLoading(true);
    try {
      const loc = await getCurrentLocation();
      const { rides: data } = await api.getDriverRequests(loc.lat, loc.lng);
      setIncoming(data);
    } catch {
      // ignore
    } finally {
      setIncomingLoading(false);
    }
  }, [isDriver, isAvailable]);

  useEffect(() => {
    loadRides();
    const socket = getSocket();
    socket?.on('ride:accepted', loadRides);
    socket?.on('ride:updated', loadRides);
    socket?.on('box:request', loadRides);
    socket?.on('box:rejected', loadRides);
    socket?.on('ride:offer:closed', ({ rideId }) => {
      setIncoming((prev) => prev.filter((r) => r.id !== rideId));
    });
    return () => {
      socket?.off('ride:accepted', loadRides);
      socket?.off('ride:updated', loadRides);
      socket?.off('box:request', loadRides);
      socket?.off('box:rejected', loadRides);
      socket?.off('ride:offer:closed');
    };
  }, [loadRides]);

  useEffect(() => {
    if (!isDriver || !isAvailable) {
      setIncoming([]);
      return undefined;
    }
    loadIncoming();
    const socket = getSocket();
    const onOffer = (offer) => {
      setIncoming((prev) => (prev.some((r) => r.id === offer.id) ? prev : [offer, ...prev]));
    };
    socket?.on('ride:offer', onOffer);
    const interval = setInterval(loadIncoming, 20000);
    return () => {
      socket?.off('ride:offer', onOffer);
      clearInterval(interval);
    };
  }, [isDriver, isAvailable, loadIncoming]);

  useEffect(() => {
    if (!isDriver) return undefined;
    return addNotificationListener((n) => {
      if (n.request.content.data?.type === 'RIDE_OFFER') loadIncoming();
    }).remove;
  }, [isDriver, loadIncoming]);

  useEffect(() => {
    const onBoxPush = (notification) => {
      if (notification.request.content.data?.type === 'BOX_APPROVAL') {
        loadRides();
        Alert.alert(t('pendingBoxTitle'), t('boxNotificationBody'), [
          { text: t('skip'), style: 'cancel' },
          { text: t('incomingPackages'), onPress: () => stackNav?.navigate('ReceiverRequests') },
        ]);
      }
    };
    const received = addNotificationListener(onBoxPush);
    const response = addNotificationResponseListener((res) => {
      const type = res.notification.request.content.data?.type;
      const rideId = res.notification.request.content.data?.rideId;
      if (type === 'BOX_APPROVAL') stackNav?.navigate('ReceiverRequests');
      else if (rideId) stackNav?.navigate('RideDetail', { rideId });
    });
    return () => {
      received.remove();
      response.remove();
    };
  }, [loadRides, stackNav, t]);

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

  const activeRide = rides.find(
    (r) =>
      r.riderId === user?.id &&
      ['PENDING_RECEIVER_APPROVAL', 'REQUESTED', 'ACCEPTED', 'DRIVER_ARRIVED', 'IN_PROGRESS'].includes(
        r.status
      )
  );

  const driverActiveRides = isDriver
    ? rides.filter(
        (r) =>
          r.driverId === user?.id &&
          ['ACCEPTED', 'DRIVER_ARRIVED', 'IN_PROGRESS'].includes(r.status)
      )
    : [];

  const pendingBoxes = rides.filter(
    (r) => r.receiverId === user?.id && r.status === 'PENDING_RECEIVER_APPROVAL'
  );

  const tierMultiplier = RIDE_TIERS.find((x) => x.id === selectedTier)?.multiplier || 1;
  const tripStats = useMemo(() => {
    if (!pickup || !dropoff) return null;
    const distance = calculateDistanceKm(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);
    return {
      distance,
      minutes: Math.max(5, Math.round(distance * 3)),
      fare: estimateFare(distance, tierMultiplier),
    };
  }, [pickup, dropoff, tierMultiplier]);

  function handleServiceSelect(serviceId) {
    if (serviceId === 'receive') {
      stackNav?.navigate('ReceiverRequests');
      return;
    }
    if (serviceId === 'ride') {
      setRideType(RIDE_TYPES.SINGLE);
      setDropoff(null);
      setSelectMode('dropoff');
    }
    if (serviceId === 'airport') {
      setRideType(RIDE_TYPES.SINGLE);
      setDropoff(AIRPORT_DROPOFF);
      setSelectMode(null);
    }
    if (serviceId === 'send') {
      setRideType(RIDE_TYPES.BOX_DELIVERY);
      setDropoff(null);
      setSelectMode('dropoff');
    }
    setSheetMode('selection');
  }

  async function sharePickupLocation() {
    try {
      const loc = await getCurrentLocation();
      setPickup({ ...loc, address: await reverseGeocode(loc.lat, loc.lng) });
      setSelectMode(null);
    } catch {
      Alert.alert(t('error'), t('selectLocations'));
    }
  }

  async function handleMapPress(coordinate) {
    if (!selectMode) return;
    const address = await reverseGeocode(coordinate.latitude, coordinate.longitude);
    const point = { lat: coordinate.latitude, lng: coordinate.longitude, address };
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
      setReceiverLookup(await api.searchUserByPhone(normalizePhone(receiverPhone)));
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
        stackNav?.navigate('Payment', { rideId: ride.id, fare: ride.fare });
      } else {
        stackNav?.navigate('RideDetail', { rideId: ride.id });
      }
    } else if (ride.rideType === RIDE_TYPES.CARPOOL) {
      if (ride.matched) Alert.alert(t('appName'), t('carpoolMatched'));
      stackNav?.navigate('RideDetail', { rideId: ride.id });
    } else {
      stackNav?.navigate('Payment', { rideId: ride.id, fare: ride.fare });
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
        receiverPhone: receiverLookup.user?.phone || receiverPhone.trim(),
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
      setUser(await api.me());
      loadRides();
      if (!isAvailable) loadIncoming();
    } catch (err) {
      Alert.alert(t('error'), err.message);
    }
  }

  async function acceptIncoming(rideId) {
    setAcceptingId(rideId);
    try {
      await api.acceptRide(rideId);
      setIncoming((prev) => prev.filter((r) => r.id !== rideId));
      loadRides();
      navigation.getParent()?.navigate('RideDetail', { rideId });
    } catch (err) {
      Alert.alert(t('error'), localizeApiError(err, t));
    } finally {
      setAcceptingId(null);
    }
  }

  async function declineIncoming(rideId) {
    try {
      await api.declineRide(rideId);
      setIncoming((prev) => prev.filter((r) => r.id !== rideId));
    } catch (err) {
      Alert.alert(t('error'), err.message);
    }
  }

  if (isDriver) {
    return (
      <HomeDriverPanel
        user={user}
        navigation={navigation}
        rides={rides}
        loading={loading}
        loadRides={loadRides}
        incoming={incoming}
        incomingLoading={incomingLoading}
        acceptingId={acceptingId}
        isAvailable={isAvailable}
        activeRide={activeRide}
        driverActiveRides={driverActiveRides}
        pendingBoxes={pendingBoxes}
        onToggleAvailability={toggleAvailability}
        onAcceptIncoming={acceptIncoming}
        onDeclineIncoming={declineIncoming}
      />
    );
  }

  return (
    <View style={styles.root}>
      <RideMap
        fullScreen
        pickup={pickup}
        dropoff={
          rideType === RIDE_TYPES.BOX_DELIVERY && !receiverLookup?.external ? null : dropoff
        }
        nearbyDrivers={nearbyDrivers}
        onMapPress={handleMapPress}
        selecting={selectMode ? (selectMode === 'pickup' ? pickup : dropoff) : null}
        showsMyLocationButton={false}
      />

      <TouchableOpacity
        style={[styles.menuBtn, { top: insets.top + 12 }, isRTL ? styles.menuEnd : styles.menuStart]}
        onPress={() => navigation.openDrawer()}
      >
        <Text style={styles.menuIcon}>☰</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.shareChip,
          row,
          { top: insets.top + 12 },
          isRTL ? styles.menuStart : styles.menuEnd,
        ]}
        onPress={sharePickupLocation}
      >
        <Text style={styles.shareIcon}>↗</Text>
        <Text style={styles.shareText}>{t('shareCurrentLocation')}</Text>
      </TouchableOpacity>

      {pendingBoxes.length > 0 && (
        <View style={[styles.banner, { top: insets.top + 64 }]}>
          <Text style={styles.bannerText}>📦 {t('pendingBoxTitle')}</Text>
          <Button
            title={t('incomingPackages')}
            onPress={() => stackNav?.navigate('ReceiverRequests')}
          />
        </View>
      )}

      {activeRide ? (
        <View style={styles.activeBanner}>
          <Text style={styles.activeText}>
            {t('activeRide')} · {t(statusKey(activeRide.status))}
          </Text>
          <Button
            title={t('openRide')}
            onPress={() => stackNav?.navigate('RideDetail', { rideId: activeRide.id })}
          />
        </View>
      ) : (
        <HomeBottomSheet
          mode={sheetMode}
          onModeChange={setSheetMode}
          onServiceSelect={handleServiceSelect}
          pickup={pickup}
          dropoff={dropoff}
          rideType={rideType}
          seats={seats}
          onSeatsChange={setSeats}
          packageDesc={packageDesc}
          onPackageDescChange={setPackageDesc}
          receiverPhone={receiverPhone}
          receiverLookup={receiverLookup}
          lookingUpReceiver={lookingUp}
          onReceiverPhoneChange={(v) => {
            setReceiverPhone(v);
            setReceiverLookup(null);
          }}
          onSearchReceiver={lookupReceiver}
          selectMode={selectMode}
          onSelectModeChange={setSelectMode}
          onPickupSelect={(loc) => {
            setPickup(loc);
            setSelectMode('dropoff');
          }}
          onDropoffSelect={(loc) => {
            setDropoff(loc);
            setSelectMode(null);
          }}
          onUseCurrentLocation={sharePickupLocation}
          onOpenDestination={() => {
            setSelectMode('dropoff');
            setSheetMode('selection');
          }}
          onInputFocus={(field) => {
            setSheetMode('selection');
            if (field === 'dropoff') setSelectMode('dropoff');
            if (field === 'pickup') setSelectMode('pickup');
          }}
          selectedTier={selectedTier}
          onTierSelect={setSelectedTier}
          estimatedFare={tripStats?.fare}
          estimatedDistance={tripStats?.distance}
          estimatedMinutes={tripStats?.minutes}
          onConfirm={requestRide}
          confirming={requesting}
          showDropoff={rideType !== RIDE_TYPES.BOX_DELIVERY || receiverLookup?.external}
          showReceiverPhone={rideType === RIDE_TYPES.BOX_DELIVERY}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  menuBtn: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 10,
  },
  menuStart: { left: 16 },
  menuEnd: { right: 16 },
  menuIcon: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  shareChip: {
    position: 'absolute',
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 6,
    zIndex: 10,
    maxWidth: '55%',
  },
  shareIcon: { color: '#fff', fontSize: 14, fontWeight: '700' },
  shareText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  banner: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 12,
    zIndex: 10,
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  bannerText: { fontWeight: '700', marginBottom: 8, color: COLORS.warning },
  activeBanner: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
    zIndex: 20,
  },
  activeText: { fontSize: 16, fontWeight: '700', color: COLORS.primary, marginBottom: 12 },
});
