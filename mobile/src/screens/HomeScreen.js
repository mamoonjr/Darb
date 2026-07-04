import React, { useCallback, useEffect, useState } from 'react';

import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import RideMap from '../components/RideMap';

import { Button, Card, Screen } from '../components/UI';

import { COLORS } from '../constants';

import { useAuth } from '../context/AuthContext';

import { getCurrentLocation, reverseGeocode } from '../hooks/useLocationTracking';

import { api } from '../services/api';

import { getSocket } from '../services/socket';

import { statusKey } from '../utils/status';



const DEFAULT_DROPOFF_OFFSET = 0.02;



export default function HomeScreen({ navigation }) {

  const { t } = useTranslation();

  const { user, setUser } = useAuth();

  const [rides, setRides] = useState([]);

  const [loading, setLoading] = useState(false);

  const [requesting, setRequesting] = useState(false);

  const [pickup, setPickup] = useState(null);

  const [dropoff, setDropoff] = useState(null);

  const [selectMode, setSelectMode] = useState(null);

  const isDriver = user?.role === 'DRIVER';

  const isAvailable = user?.driverProfile?.isAvailable;



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

      const fallback = { lat: 24.7114, lng: 46.6742, address: 'برج المملكة، الرياض' };

      setPickup(fallback);

      setDropoff({ lat: 24.6877, lng: 46.7219, address: 'حي العليا، الرياض' });

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

    return () => {

      socket?.off('ride:requested', loadRides);

      socket?.off('ride:accepted', loadRides);

      socket?.off('ride:updated', loadRides);

    };

  }, [loadRides]);



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



  async function requestRide() {

    if (!pickup || !dropoff) {

      Alert.alert(t('error'), t('selectLocations'));

      return;

    }

    setRequesting(true);

    try {

      const ride = await api.createRide({

        pickupAddress: pickup.address,

        pickupLat: pickup.lat,

        pickupLng: pickup.lng,

        dropoffAddress: dropoff.address,

        dropoffLat: dropoff.lat,

        dropoffLng: dropoff.lng,

      });

      navigation.navigate('Payment', { rideId: ride.id, fare: ride.fare });

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



  const activeRide = rides.find((r) =>

    ['REQUESTED', 'ACCEPTED', 'DRIVER_ARRIVED', 'IN_PROGRESS'].includes(r.status)

  );



  function renderRide({ item }) {

    return (

      <Card>

        <Text style={styles.rideStatus}>{t(statusKey(item.status))}</Text>

        <Text style={styles.rideRoute}>{item.pickupAddress}</Text>

        <Text style={styles.rideArrow}>↓</Text>

        <Text style={styles.rideRoute}>{item.dropoffAddress}</Text>

        {item.fare && (

          <Text style={styles.fare}>{item.fare} {t('sar')}</Text>

        )}

        <Button

          title={t('activeRide')}

          variant="outline"

          onPress={() => navigation.navigate('RideDetail', { rideId: item.id })}

          style={styles.rideBtn}

        />

      </Card>

    );

  }



  return (

    <Screen>

      <Text style={styles.greeting}>

        {t('appName')} — {user?.name}

      </Text>



      {!isDriver && (

        <>

          <RideMap

            pickup={pickup}

            dropoff={dropoff}

            onMapPress={handleMapPress}

            selecting={selectMode ? (selectMode === 'pickup' ? pickup : dropoff) : null}

          />

          {!activeRide && (

            <View style={styles.locationBtns}>

              <Button

                title={selectMode === 'pickup' ? t('tapOnMap') : t('setPickup')}

                variant={selectMode === 'pickup' ? 'primary' : 'outline'}

                onPress={() => setSelectMode('pickup')}

                style={styles.locBtn}

              />

              <Button

                title={selectMode === 'dropoff' ? t('tapOnMap') : t('setDropoff')}

                variant={selectMode === 'dropoff' ? 'primary' : 'outline'}

                onPress={() => setSelectMode('dropoff')}

                style={styles.locBtn}

              />

            </View>

          )}

        </>

      )}



      {!isDriver && !activeRide && (

        <Button title={t('requestRide')} onPress={requestRide} loading={requesting} style={styles.mainBtn} />

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

          <Text style={styles.activeTitle}>{t('activeRide')}</Text>

          <Text style={styles.rideRoute}>{activeRide.pickupAddress} → {activeRide.dropoffAddress}</Text>

          <Button

            title={t('activeRide')}

            onPress={() => navigation.navigate('RideDetail', { rideId: activeRide.id })}

          />

        </Card>

      )}



      <Text style={styles.section}>{t('rideHistory')}</Text>

      <FlatList

        data={rides}

        keyExtractor={(item) => item.id}

        renderItem={renderRide}

        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadRides} />}

        ListEmptyComponent={<Text style={styles.empty}>{t('noRides')}</Text>}

      />

    </Screen>

  );

}



const styles = StyleSheet.create({

  greeting: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 20, textAlign: 'right' },

  locationBtns: { flexDirection: 'row', gap: 8, marginBottom: 12 },

  locBtn: { flex: 1 },

  mainBtn: { marginBottom: 20 },

  activeCard: { borderLeftWidth: 4, borderLeftColor: COLORS.primary },

  activeTitle: { fontSize: 16, fontWeight: '700', color: COLORS.primary, marginBottom: 8, textAlign: 'right' },

  section: { fontSize: 18, fontWeight: '600', color: COLORS.text, marginBottom: 12, textAlign: 'right' },

  rideStatus: { fontSize: 12, color: COLORS.primary, fontWeight: '600', marginBottom: 8, textAlign: 'right' },

  rideRoute: { fontSize: 14, color: COLORS.text, textAlign: 'right' },

  rideArrow: { textAlign: 'center', color: COLORS.textSecondary, marginVertical: 4 },

  fare: { fontSize: 16, fontWeight: '700', color: COLORS.success, marginTop: 8, textAlign: 'right' },

  rideBtn: { marginTop: 12 },

  empty: { textAlign: 'center', color: COLORS.textSecondary, marginTop: 40 },

});

