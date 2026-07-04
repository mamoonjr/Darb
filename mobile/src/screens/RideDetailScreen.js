import React, { useCallback, useEffect, useState } from 'react';

import { Alert, StyleSheet, Text, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import RatingModal from '../components/RatingModal';

import RideMap from '../components/RideMap';

import { Button, Card, Screen } from '../components/UI';

import { COLORS } from '../constants';

import { useAuth } from '../context/AuthContext';

import { useDriverLocationTracking } from '../hooks/useLocationTracking';

import { api } from '../services/api';

import { getSocket, joinRide, leaveRide } from '../services/socket';

import { statusKey } from '../utils/status';



export default function RideDetailScreen({ route, navigation }) {

  const { rideId } = route.params;

  const { t } = useTranslation();

  const { user } = useAuth();

  const [ride, setRide] = useState(null);

  const [loading, setLoading] = useState(false);

  const [driverLocation, setDriverLocation] = useState(null);

  const [showRating, setShowRating] = useState(false);



  const isDriver = user?.id === ride?.driverId;

  const trackingEnabled =

    isDriver && ['ACCEPTED', 'DRIVER_ARRIVED', 'IN_PROGRESS'].includes(ride?.status);



  useDriverLocationTracking(rideId, trackingEnabled);



  const loadRide = useCallback(async () => {

    try {

      const data = await api.getRide(rideId);

      setRide(data);

      if (data.driver?.driverProfile?.lat) {

        setDriverLocation({

          lat: data.driver.driverProfile.lat,

          lng: data.driver.driverProfile.lng,

        });

      }

    } catch (err) {

      Alert.alert(t('error'), err.message);

    }

  }, [rideId, t]);



  useEffect(() => {

    loadRide();

    joinRide(rideId);

    const socket = getSocket();

    socket?.on('ride:updated', (updated) => {

      if (updated.id === rideId) {

        setRide(updated);

        if (updated.status === 'COMPLETED' && user?.id === updated.riderId && !updated.review) {

          setShowRating(true);

        }

      }

    });

    socket?.on('driver:location', (data) => {

      if (data.rideId === rideId || data.driverId === ride?.driverId) {

        setDriverLocation({ lat: data.lat, lng: data.lng });

      }

    });

    return () => leaveRide(rideId);

  }, [rideId, loadRide, user?.id, ride?.driverId]);



  async function handleAction(status) {

    setLoading(true);

    try {

      if (status === 'ACCEPTED') {

        await api.acceptRide(rideId);

      } else {

        await api.updateRideStatus(rideId, status);

      }

      const updated = await api.getRide(rideId);

      setRide(updated);

      if (status === 'COMPLETED' && user?.id === updated.riderId && !updated.review) {

        setShowRating(true);

      }

    } catch (err) {

      Alert.alert(t('error'), err.message);

    } finally {

      setLoading(false);

    }

  }



  async function handleRate(data) {

    try {

      await api.rateRide(rideId, data);

      setShowRating(false);

      Alert.alert(t('thanks'), t('ratingSubmitted'));

      loadRide();

    } catch (err) {

      Alert.alert(t('error'), err.message);

    }

  }



  if (!ride) {

    return (

      <Screen>

        <Text style={styles.loading}>{t('loading')}</Text>

      </Screen>

    );

  }



  const isRider = user?.id === ride.riderId;

  const isPendingDriver = user?.role === 'DRIVER' && ride.status === 'REQUESTED';

  const needsPayment = isRider && ride.payment?.status !== 'PAID' && ride.status === 'REQUESTED';



  return (

    <Screen>

      <Text style={styles.status}>{t(statusKey(ride.status))}</Text>



      <RideMap

        pickup={{ lat: ride.pickupLat, lng: ride.pickupLng, address: ride.pickupAddress }}

        dropoff={{ lat: ride.dropoffLat, lng: ride.dropoffLng, address: ride.dropoffAddress }}

        driverLocation={driverLocation}

        style={styles.map}

      />



      <Card>

        <Text style={styles.label}>{t('pickup')}</Text>

        <Text style={styles.address}>{ride.pickupAddress}</Text>

        <Text style={styles.label}>{t('dropoff')}</Text>

        <Text style={styles.address}>{ride.dropoffAddress}</Text>

      </Card>



      <Card>

        <View style={styles.row}>

          <Text style={styles.meta}>{t('fare')}</Text>

          <Text style={styles.value}>{ride.fare} {t('sar')}</Text>

        </View>

        <View style={styles.row}>

          <Text style={styles.meta}>{t('distance')}</Text>

          <Text style={styles.value}>{ride.distance} {t('km')}</Text>

        </View>

        <View style={styles.row}>

          <Text style={styles.meta}>{t('estimatedTime')}</Text>

          <Text style={styles.value}>{ride.estimatedMinutes} {t('min')}</Text>

        </View>

        {ride.payment && (

          <View style={styles.row}>

            <Text style={styles.meta}>{t('payment')}</Text>

            <Text style={[styles.value, ride.payment.status === 'PAID' && styles.paid]}>

              {t(ride.payment.status === 'PAID' ? 'paid' : 'pending')}

            </Text>

          </View>

        )}

      </Card>



      {ride.driver && (

        <Card>

          <Text style={styles.label}>{t('roleDriver')}</Text>

          <Text style={styles.address}>{ride.driver.name}</Text>

          {ride.driver.driverProfile && (

            <Text style={styles.meta}>

              ★ {ride.driver.driverProfile.rating} — {ride.driver.driverProfile.vehicleColor}{' '}

              {ride.driver.driverProfile.vehicleMake} — {ride.driver.driverProfile.vehiclePlate}

            </Text>

          )}

        </Card>

      )}



      {needsPayment && (

        <Button

          title={t('payNow')}

          onPress={() => navigation.navigate('Payment', { rideId: ride.id, fare: ride.fare })}

        />

      )}



      {isPendingDriver && ride.payment?.status === 'PAID' && (

        <Button title={t('acceptRide')} onPress={() => handleAction('ACCEPTED')} loading={loading} />

      )}



      {isDriver && ride.status === 'ACCEPTED' && (

        <Button title={t('driverArrived')} onPress={() => handleAction('DRIVER_ARRIVED')} loading={loading} />

      )}



      {isDriver && ride.status === 'DRIVER_ARRIVED' && (

        <Button title={t('startRide')} onPress={() => handleAction('IN_PROGRESS')} loading={loading} />

      )}



      {isDriver && ride.status === 'IN_PROGRESS' && (

        <Button title={t('completeRide')} onPress={() => handleAction('COMPLETED')} loading={loading} />

      )}



      {isRider && ['REQUESTED', 'ACCEPTED', 'DRIVER_ARRIVED'].includes(ride.status) && (

        <Button title={t('cancelRide')} variant="outline" onPress={() => handleAction('CANCELLED')} loading={loading} />

      )}



      {ride.status === 'COMPLETED' && (

        <Button title={t('home')} onPress={() => navigation.navigate('Home')} />

      )}



      <RatingModal

        visible={showRating}

        onSubmit={handleRate}

        onSkip={() => {

          setShowRating(false);

          navigation.navigate('Home');

        }}

      />

    </Screen>

  );

}



const styles = StyleSheet.create({

  loading: { textAlign: 'center', color: COLORS.textSecondary, marginTop: 40 },

  status: {

    fontSize: 20,

    fontWeight: '700',

    color: COLORS.primary,

    marginBottom: 12,

    textAlign: 'right',

  },

  map: { height: 220 },

  label: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 4, textAlign: 'right' },

  address: { fontSize: 16, color: COLORS.text, marginBottom: 12, textAlign: 'right' },

  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },

  meta: { color: COLORS.textSecondary, fontSize: 14 },

  value: { color: COLORS.text, fontWeight: '600', fontSize: 14 },

  paid: { color: COLORS.success },

});

