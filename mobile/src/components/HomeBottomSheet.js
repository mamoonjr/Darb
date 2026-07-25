import React, { useCallback, useMemo, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useTranslation } from 'react-i18next';
import { Button, Input } from './UI';
import ServiceGrid from './ServiceGrid';
import TripPlannerSheet from './TripPlannerSheet';
import { COLORS, CURRENCY, RIDE_TIERS } from '../constants';
import { useLanguage } from '../context/LanguageContext';

export default function HomeBottomSheet({
  mode,
  onModeChange,
  onServiceSelect,
  pickup,
  dropoff,
  rideType,
  seats,
  onSeatsChange,
  packageDesc,
  onPackageDescChange,
  receiverPhone,
  receiverLookup,
  lookingUpReceiver,
  onReceiverPhoneChange,
  onSearchReceiver,
  selectMode,
  onSelectModeChange,
  onPickupSelect,
  onDropoffSelect,
  onUseCurrentLocation,
  onOpenDestination,
  onInputFocus,
  selectedTier,
  onTierSelect,
  estimatedFare,
  estimatedDistance,
  estimatedMinutes,
  onConfirm,
  confirming,
  showDropoff,
  showReceiverPhone,
}) {
  const { t } = useTranslation();
  const { textAlign, row, isRTL } = useLanguage();
  const sheetRef = useRef(null);

  const snapPoints = useMemo(
    () => (mode === 'default' ? ['32%', '48%'] : ['62%', '92%']),
    [mode]
  );

  const openSelection = useCallback(() => {
    onOpenDestination?.();
    onModeChange('selection');
    sheetRef.current?.snapToIndex(1);
  }, [onModeChange, onOpenDestination]);

  const goBack = useCallback(() => {
    onModeChange('default');
    sheetRef.current?.snapToIndex(0);
  }, [onModeChange]);

  return (
    <BottomSheet
      ref={sheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose={false}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      handleIndicatorStyle={styles.handle}
      backgroundStyle={styles.sheetBg}
    >
      <BottomSheetScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {mode === 'default' ? (
          <>
            <TouchableOpacity style={styles.searchMock} onPress={openSelection} activeOpacity={0.9}>
              <Text style={styles.searchIcon}>🔍</Text>
              <Text style={[styles.searchText, { textAlign }]}>{t('whereTo')}</Text>
            </TouchableOpacity>
            <ServiceGrid
              onSelect={(serviceId) => {
                onServiceSelect(serviceId);
                openSelection();
              }}
            />
          </>
        ) : (
          <>
            <View style={[styles.selectionHeader, row]}>
              <TouchableOpacity onPress={goBack} style={styles.backBtn}>
                <Text style={styles.backIcon}>{isRTL ? '→' : '←'}</Text>
              </TouchableOpacity>
              <Text style={[styles.selectionTitle, { textAlign }]}>{t('planYourTrip')}</Text>
            </View>

            <TripPlannerSheet
              embedded
              pickup={pickup}
              dropoff={dropoff}
              showDropoff={showDropoff}
              showReceiverPhone={showReceiverPhone}
              receiverPhone={receiverPhone}
              receiverLookup={receiverLookup}
              lookingUpReceiver={lookingUpReceiver}
              onReceiverPhoneChange={onReceiverPhoneChange}
              onSearchReceiver={onSearchReceiver}
              selectMode={selectMode}
              onSelectModeChange={onSelectModeChange}
              onPickupSelect={onPickupSelect}
              onDropoffSelect={onDropoffSelect}
              onUseCurrentLocation={onUseCurrentLocation}
              onInputFocus={onInputFocus}
            />

            {rideType !== 'BOX_DELIVERY' && pickup && dropoff ? (
              <>
                <Text style={[styles.sectionLabel, { textAlign }]}>{t('chooseRideTier')}</Text>
                <View style={styles.tierRow}>
                  {RIDE_TIERS.map((tier) => {
                    const active = selectedTier === tier.id;
                    const price =
                      estimatedFare != null
                        ? (estimatedFare * tier.multiplier).toFixed(2)
                        : '—';
                    return (
                      <TouchableOpacity
                        key={tier.id}
                        style={[styles.tierCard, active && styles.tierCardActive]}
                        onPress={() => onTierSelect(tier.id)}
                      >
                        <Text style={styles.tierIcon}>{tier.icon}</Text>
                        <Text style={styles.tierName}>{t(tier.labelKey)}</Text>
                        <Text style={styles.tierPrice}>
                          {price} {CURRENCY}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {estimatedDistance != null ? (
                  <Text style={[styles.meta, { textAlign }]}>
                    {estimatedDistance} {t('km')} · ~{estimatedMinutes} {t('min')}
                  </Text>
                ) : null}
              </>
            ) : null}

            {rideType === 'CARPOOL' ? (
              <View style={styles.seatsWrap}>
                <Text style={[styles.sectionLabel, { textAlign }]}>{t('seats')}</Text>
                <View style={[styles.seatsRow, row]}>
                  {[1, 2, 3, 4].map((n) => (
                    <TouchableOpacity
                      key={n}
                      style={[styles.seatChip, seats === n && styles.seatChipActive]}
                      onPress={() => onSeatsChange(n)}
                    >
                      <Text style={[styles.seatText, seats === n && styles.seatTextActive]}>{n}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : null}

            {rideType === 'BOX_DELIVERY' ? (
              <Input
                label={t('packageDesc')}
                value={packageDesc}
                onChangeText={onPackageDescChange}
                placeholder={t('packageDesc')}
              />
            ) : null}

            <Button
              title={rideType === 'BOX_DELIVERY' ? t('sendPackage') : t('confirmRide')}
              onPress={onConfirm}
              loading={confirming}
              disabled={
                !pickup ||
                (showDropoff && !dropoff) ||
                (showReceiverPhone && !receiverLookup)
              }
              style={styles.confirmBtn}
            />
          </>
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetBg: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handle: { backgroundColor: COLORS.border, width: 44 },
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  searchMock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: 4,
  },
  searchIcon: { fontSize: 18, opacity: 0.6 },
  searchText: { flex: 1, fontSize: 17, color: COLORS.textSecondary, fontWeight: '600' },
  selectionHeader: { alignItems: 'center', marginBottom: 4, gap: 12 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backIcon: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  selectionTitle: { flex: 1, fontSize: 20, fontWeight: '800', color: COLORS.text },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginTop: 12,
    marginBottom: 8,
  },
  tierRow: { flexDirection: 'row', gap: 12 },
  tierCard: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 14,
    backgroundColor: COLORS.background,
  },
  tierCardActive: { borderColor: COLORS.primary, backgroundColor: '#e8f0fe' },
  tierIcon: { fontSize: 22, marginBottom: 6 },
  tierName: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  tierPrice: { fontSize: 16, fontWeight: '800', color: COLORS.primary, marginTop: 6 },
  meta: { fontSize: 13, color: COLORS.textSecondary, marginTop: 8 },
  seatsWrap: { marginTop: 8 },
  seatsRow: { gap: 8 },
  seatChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  seatChipActive: { borderColor: COLORS.primary, backgroundColor: '#e8f0fe' },
  seatText: { fontSize: 16, color: COLORS.textSecondary, fontWeight: '600' },
  seatTextActive: { color: COLORS.primary },
  confirmBtn: { marginTop: 16 },
});
