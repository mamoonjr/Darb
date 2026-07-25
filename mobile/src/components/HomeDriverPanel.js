import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RideMap from './RideMap';
import { Button, Card, Screen } from './UI';
import { COLORS } from '../constants';
import { useLanguage } from '../context/LanguageContext';
import { getCurrentLocation } from '../hooks/useLocationTracking';
import { statusKey } from '../utils/status';

function rideTypeLabel(type, t) {
  if (type === 'CARPOOL') return t('rideTypeCarpool');
  if (type === 'BOX_DELIVERY') return t('rideTypeBox');
  return t('rideTypeSingle');
}

export default function HomeDriverPanel({
  user,
  navigation,
  rides,
  loading,
  loadRides,
  incoming,
  incomingLoading,
  acceptingId,
  isAvailable,
  activeRide,
  driverActiveRides,
  pendingBoxes,
  onToggleAvailability,
  onAcceptIncoming,
  onDeclineIncoming,
}) {
  const { t } = useTranslation();
  const { textAlign, row, isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const [driverLocation, setDriverLocation] = useState(() => {
    const lat = user?.driverProfile?.lat;
    const lng = user?.driverProfile?.lng;
    return lat != null && lng != null ? { lat, lng } : null;
  });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const loc = await getCurrentLocation();
        if (active) setDriverLocation(loc);
      } catch {
        // Keep profile/seed coordinates as fallback.
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const accentBorder = isRTL
    ? { borderRightWidth: 4, borderRightColor: COLORS.primary }
    : { borderLeftWidth: 4, borderLeftColor: COLORS.primary };

  const warningAccent = isRTL
    ? { borderRightWidth: 4, borderRightColor: COLORS.warning }
    : { borderLeftWidth: 4, borderLeftColor: COLORS.warning };

  return (
    <Screen style={styles.screen}>
      <FlatList
        data={rides}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadRides} />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <View style={[styles.header, { paddingTop: insets.top + 8 }, row]}>
              <View style={styles.headerText}>
                <Text style={[styles.greeting, { textAlign }]}>{t('appName')}</Text>
                <Text style={[styles.driverName, { textAlign }]}>{user?.name}</Text>
              </View>
              <View style={[styles.statusPill, isAvailable ? styles.statusOnline : styles.statusOffline]}>
                <Text style={styles.statusText}>
                  {isAvailable ? t('driverOnline') : t('driverOffline')}
                </Text>
              </View>
            </View>

            {pendingBoxes.length > 0 && (
              <Card style={[styles.pendingCard, warningAccent]}>
                <Text style={[styles.pendingTitle, { textAlign }]}>
                  📦 {t('pendingBoxTitle')} ({pendingBoxes.length})
                </Text>
                <Button
                  title={t('incomingPackages')}
                  onPress={() => navigation.getParent()?.navigate('ReceiverRequests')}
                />
              </Card>
            )}

            <View style={styles.mapWrap}>
              <RideMap
                centerLocation={driverLocation}
                embedded
                showRoute={false}
                style={styles.map}
              />
            </View>

            <Button
              title={isAvailable ? t('goOffline') : t('goOnline')}
              onPress={onToggleAvailability}
              variant={isAvailable ? 'outline' : 'primary'}
              style={[styles.mainBtn, isAvailable && styles.offlineBtn]}
            />

            <Button
              title={t('carpoolPublish')}
              onPress={() => navigation.getParent()?.navigate('PublishRoute')}
              style={styles.mainBtn}
            />

            <Button
              title={t('carpoolBrowseRoutes')}
              variant="outline"
              onPress={() => navigation.getParent()?.navigate('RouteRides')}
              style={styles.mainBtn}
            />

            {isAvailable && (
              <Card style={[styles.incomingCard, accentBorder]}>
                <Text style={[styles.section, { textAlign }]}>
                  {t('incomingRequests')} {incoming.length > 0 ? `(${incoming.length})` : ''}
                </Text>
                {incomingLoading && incoming.length === 0 ? (
                  <Text style={[styles.metaHint, { textAlign }]}>{t('loading')}</Text>
                ) : null}
                {incoming.length === 0 && !incomingLoading ? (
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyIcon}>🚗</Text>
                    <Text style={[styles.metaHint, { textAlign }]}>{t('noRequestsNearby')}</Text>
                  </View>
                ) : null}
                {incoming.map((req) => (
                  <View key={req.id} style={styles.incomingItem}>
                    <Text style={[styles.rideStatus, { textAlign }]}>
                      {rideTypeLabel(req.rideType, t)} · {req.distanceKm?.toFixed?.(1) ?? '?'}{' '}
                      {t('kmAway')}
                    </Text>
                    <Text style={[styles.rideRoute, { textAlign }]}>{req.pickupAddress}</Text>
                    <Text style={styles.rideArrow}>↓</Text>
                    <Text style={[styles.rideRoute, { textAlign }]}>{req.dropoffAddress}</Text>
                    {req.fare != null && (
                      <Text style={[styles.fare, { textAlign }]}>
                        {req.fare} {t('jod')}
                      </Text>
                    )}
                    <View style={[styles.incomingActions, row]}>
                      <Button
                        title={t('acceptRide')}
                        onPress={() => onAcceptIncoming(req.id)}
                        loading={acceptingId === req.id}
                        style={styles.incomingBtn}
                      />
                      <Button
                        title={t('declineRide')}
                        variant="outline"
                        onPress={() => onDeclineIncoming(req.id)}
                        style={styles.incomingBtn}
                      />
                    </View>
                  </View>
                ))}
              </Card>
            )}

            {driverActiveRides.length > 0 && (
              <Card style={[styles.activeCard, accentBorder]}>
                <Text style={[styles.activeTitle, { textAlign }]}>
                  {t('activeRides')} ({driverActiveRides.length})
                </Text>
                {driverActiveRides.map((r) => (
                  <View key={r.id} style={styles.driverRideItem}>
                    <Text style={[styles.rideRoute, { textAlign }]}>
                      {rideTypeLabel(r.rideType, t)} · {t(statusKey(r.status))}
                    </Text>
                    <Text style={[styles.rideRoute, { textAlign }]}>
                      {r.pickupAddress} → {r.dropoffAddress}
                    </Text>
                    <Button
                      title={t('activeRide')}
                      variant="outline"
                      onPress={() => navigation.getParent()?.navigate('RideDetail', { rideId: r.id })}
                      style={styles.rideBtn}
                    />
                  </View>
                ))}
              </Card>
            )}

            {activeRide && (
              <Card style={[styles.activeCard, accentBorder]}>
                <Text style={[styles.activeTitle, { textAlign }]}>
                  {t('activeRide')} · {t(statusKey(activeRide.status))}
                </Text>
                <Button
                  title={t('activeRide')}
                  onPress={() => navigation.getParent()?.navigate('RideDetail', { rideId: activeRide.id })}
                />
              </Card>
            )}

            <Text style={[styles.section, styles.historyTitle, { textAlign }]}>
              {t('rideHistory')}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card style={styles.historyCard}>
            <Text style={[styles.rideStatus, { textAlign }]}>{t(statusKey(item.status))}</Text>
            <Text style={[styles.rideRoute, { textAlign }]} numberOfLines={2}>
              {item.pickupAddress}
            </Text>
            {item.dropoffAddress ? (
              <>
                <Text style={styles.rideArrow}>↓</Text>
                <Text style={[styles.rideRoute, { textAlign }]} numberOfLines={2}>
                  {item.dropoffAddress}
                </Text>
              </>
            ) : null}
            <Button
              title={t('openRide')}
              variant="outline"
              onPress={() => navigation.getParent()?.navigate('RideDetail', { rideId: item.id })}
              style={styles.rideBtn}
            />
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={[styles.empty, { textAlign }]}>{t('noRides')}</Text>
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 0, paddingTop: 0 },
  listContent: { paddingHorizontal: 20, paddingBottom: 32 },
  header: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  headerText: { flex: 1 },
  greeting: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  driverName: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginTop: 2 },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusOnline: { backgroundColor: '#d1fae5' },
  statusOffline: { backgroundColor: '#f3f4f6' },
  statusText: { fontSize: 12, fontWeight: '700', color: COLORS.text },
  mapWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  map: { height: 200, marginBottom: 0 },
  mainBtn: { marginBottom: 16 },
  offlineBtn: { borderColor: COLORS.error },
  section: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginBottom: 10 },
  historyTitle: { marginTop: 8, marginBottom: 12 },
  pendingCard: { marginBottom: 12 },
  pendingTitle: { fontSize: 16, fontWeight: '700', color: COLORS.warning, marginBottom: 8 },
  incomingCard: { marginBottom: 12 },
  incomingItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  incomingActions: { gap: 8, marginTop: 12 },
  incomingBtn: { flex: 1 },
  metaHint: { fontSize: 14, color: COLORS.textSecondary },
  emptyBox: { alignItems: 'center', paddingVertical: 16 },
  emptyIcon: { fontSize: 32, marginBottom: 8 },
  activeCard: { marginBottom: 12 },
  activeTitle: { fontSize: 16, fontWeight: '700', color: COLORS.primary, marginBottom: 8 },
  driverRideItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  historyCard: { marginBottom: 10 },
  rideStatus: { fontSize: 12, color: COLORS.primary, fontWeight: '700', marginBottom: 6 },
  rideRoute: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  rideArrow: { textAlign: 'center', color: COLORS.textSecondary, marginVertical: 4 },
  fare: { fontSize: 16, fontWeight: '700', color: COLORS.success, marginTop: 8 },
  rideBtn: { marginTop: 12 },
  empty: { color: COLORS.textSecondary },
});
