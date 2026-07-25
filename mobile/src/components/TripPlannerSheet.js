import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../constants';
import { useLanguage } from '../context/LanguageContext';
import { fetchNearbyPlaces, fetchPlaceCategories, resolvePlace, searchPlaces } from '../services/places';

function splitAddress(address) {
  if (!address) return { title: '', subtitle: '' };
  const parts = address.split(/[,،]/).map((p) => p.trim()).filter(Boolean);
  if (parts.length <= 1) return { title: parts[0] || '', subtitle: '' };
  return { title: parts[0], subtitle: parts.slice(1).join('، ') };
}

export default function TripPlannerSheet({
  pickup,
  dropoff,
  showDropoff = true,
  showReceiverPhone = false,
  receiverPhone = '',
  receiverLookup = null,
  lookingUpReceiver = false,
  onReceiverPhoneChange,
  onSearchReceiver,
  selectMode,
  onInputFocus,
  onSelectModeChange,
  onPickupSelect,
  onDropoffSelect,
  onUseCurrentLocation,
  embedded = false,
}) {
  const { t } = useTranslation();
  const { textAlign, row } = useLanguage();
  const [activeField, setActiveField] = useState('dropoff');
  const [pickupQuery, setPickupQuery] = useState(pickup?.address || '');
  const [dropoffQuery, setDropoffQuery] = useState(dropoff?.address || '');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [categories, setCategories] = useState([]);
  const debounceRef = useRef(null);
  const pickupRef = useRef(null);
  const dropoffRef = useRef(null);

  const near =
    pickup?.lat != null && pickup?.lng != null
      ? { lat: pickup.lat, lng: pickup.lng }
      : null;

  useEffect(() => {
    fetchPlaceCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    setPickupQuery(pickup?.address || '');
  }, [pickup?.address]);

  useEffect(() => {
    setDropoffQuery(dropoff?.address || '');
  }, [dropoff?.address]);

  useEffect(() => {
    if (selectMode === 'pickup') {
      setActiveField('pickup');
      pickupRef.current?.focus();
    } else if (selectMode === 'dropoff') {
      setActiveField('dropoff');
      setTimeout(() => dropoffRef.current?.focus(), 100);
    }
  }, [selectMode]);

  useEffect(() => {
    if (showDropoff && !dropoff) {
      setActiveField('dropoff');
    }
  }, [showDropoff, dropoff]);

  async function loadNearby() {
    if (!near) return;
    setSearching(true);
    try {
      setSuggestions(await fetchNearbyPlaces(near.lat, near.lng));
    } catch {
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  }

  function runSearch(text) {
    clearTimeout(debounceRef.current);
    const trimmed = text.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      if (trimmed.length === 0 && near) loadNearby();
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        setSuggestions(await searchPlaces(trimmed, near));
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }

  function searchCategory(term) {
    setActiveField('dropoff');
    onSelectModeChange?.('dropoff');
    setDropoffQuery(term);
    runSearch(term);
  }

  function handlePickupChange(text) {
    setActiveField('pickup');
    onSelectModeChange?.('pickup');
    setPickupQuery(text);
    runSearch(text);
  }

  function handleDropoffChange(text) {
    setActiveField('dropoff');
    onSelectModeChange?.('dropoff');
    setDropoffQuery(text);
    runSearch(text);
  }

  function focusPickup() {
    setActiveField('pickup');
    onSelectModeChange?.('pickup');
    onInputFocus?.('pickup');
    const q = pickupQuery.trim();
    if (q.length >= 2) runSearch(pickupQuery);
    else setSuggestions([]);
  }

  function focusDropoff() {
    setActiveField('dropoff');
    onSelectModeChange?.('dropoff');
    onInputFocus?.('dropoff');
    const q = dropoffQuery.trim();
    if (q.length >= 2) runSearch(dropoffQuery);
    else if (near) loadNearby();
  }

  async function pickSuggestion(item) {
    setSuggestions([]);
    setSearching(true);
    try {
      let details = null;
      if (item.lat != null && item.lng != null) {
        details = {
          lat: item.lat,
          lng: item.lng,
          address: item.description || [item.title, item.subtitle].filter(Boolean).join('، '),
        };
      } else {
        details = await resolvePlace(item);
      }
      if (!details) return;

      if (activeField === 'pickup') {
        onPickupSelect(details);
        setPickupQuery(details.address);
        if (showDropoff) {
          setActiveField('dropoff');
          onSelectModeChange?.('dropoff');
          setTimeout(() => dropoffRef.current?.focus(), 80);
        }
      } else {
        onDropoffSelect(details);
        setDropoffQuery(details.address);
        setSuggestions([]);
      }
    } finally {
      setSearching(false);
    }
  }

  function renderSuggestion(item, index) {
    const title = item.title || splitAddress(item.description).title;
    const subtitle = item.subtitle || splitAddress(item.description).subtitle;
    const icon = item.categoryIcon || '📍';
    const key = item.placeId || `${item.description}-${index}`;

    return (
      <TouchableOpacity key={key} style={[styles.resultRow, row]} onPress={() => pickSuggestion(item)}>
        <View style={styles.resultPin}>
          <Text style={styles.resultPinIcon}>{icon}</Text>
        </View>
        <View style={styles.resultText}>
          <View style={[styles.resultTitleRow, row]}>
            <Text style={[styles.resultTitle, { textAlign }]} numberOfLines={1}>
              {title}
            </Text>
            {item.category ? <Text style={styles.resultCategory}>{item.category}</Text> : null}
          </View>
          {subtitle ? (
            <Text style={[styles.resultSubtitle, { textAlign }]} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
          {item.distanceKm != null ? (
            <Text style={[styles.resultDistance, { textAlign }]}>
              {item.distanceKm} {t('kmAway')}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  }

  const activeQuery = activeField === 'pickup' ? pickupQuery : dropoffQuery;
  const showResults = suggestions.length > 0;
  const showNoResults = !searching && activeQuery.trim().length >= 2 && suggestions.length === 0;
  const searchingDropoff = activeField === 'dropoff';

  return (
    <View style={embedded ? styles.embedded : styles.sheet}>
      {!embedded ? <View style={styles.handle} /> : null}
      {!embedded ? <Text style={[styles.title, { textAlign }]}>{t('planYourTrip')}</Text> : null}

      <View style={[styles.inputsBlock, row]}>
        <View style={styles.routeRail}>
          <View style={styles.pickupDot} />
          <View style={styles.routeLine} />
          {showDropoff ? <View style={styles.dropoffSquare} /> : null}
        </View>

        <View style={styles.inputsCol}>
          <View style={[styles.fieldWrap, activeField === 'pickup' && styles.fieldWrapActive]}>
            <Text style={[styles.fieldLabel, { textAlign }]}>{t('fromLabel')}</Text>
            <TextInput
              ref={pickupRef}
              style={[styles.field, { textAlign }]}
              value={pickupQuery}
              onChangeText={handlePickupChange}
              onFocus={focusPickup}
              placeholder={t('currentLocation')}
              placeholderTextColor={COLORS.textSecondary}
              returnKeyType="next"
            />
            {onUseCurrentLocation ? (
              <TouchableOpacity style={[styles.useCurrentBtn, row]} onPress={onUseCurrentLocation}>
                <Text style={styles.useCurrentIcon}>📍</Text>
                <Text style={styles.useCurrentText}>{t('useCurrentLocation')}</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {showDropoff ? (
            <>
              <View style={styles.fieldDivider} />
              <View style={[styles.fieldWrap, activeField === 'dropoff' && styles.fieldWrapActive]}>
                <Text style={[styles.fieldLabel, { textAlign }]}>{t('toLabel')}</Text>
                <TextInput
                  ref={dropoffRef}
                  style={[styles.field, { textAlign }]}
                  value={dropoffQuery}
                  onChangeText={handleDropoffChange}
                  onFocus={focusDropoff}
                  placeholder={t('whereTo')}
                  placeholderTextColor={COLORS.textSecondary}
                  returnKeyType="search"
                  autoFocus={!dropoff}
                />
              </View>
            </>
          ) : null}
        </View>
      </View>

      {searchingDropoff && categories.length > 0 ? (
        <View style={styles.categoryRow}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryChip}
              onPress={() => searchCategory(cat.searchTerm)}
            >
              <Text style={styles.categoryChipIcon}>{cat.icon}</Text>
              <Text style={styles.categoryChipText}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {searching ? (
        <ActivityIndicator size="small" color={COLORS.primary} style={styles.loader} />
      ) : null}

      {showNoResults ? (
        <Text style={[styles.hint, { textAlign }]}>{t('noLocationResults')}</Text>
      ) : null}

      {!searching && searchingDropoff && activeQuery.trim().length < 2 && suggestions.length === 0 ? (
        <Text style={[styles.hint, { textAlign }]}>{t('selectDestinationHint')}</Text>
      ) : null}

      {showResults ? (
        <View style={styles.results}>{suggestions.map((item, index) => renderSuggestion(item, index))}</View>
      ) : null}

      {showReceiverPhone ? (
        <View style={styles.receiverBlock}>
          <Text style={[styles.receiverLabel, { textAlign }]}>{t('receiverPhone')}</Text>
          <View style={[styles.receiverRow, row]}>
            <TextInput
              style={[styles.receiverInput, { textAlign }]}
              value={receiverPhone}
              onChangeText={onReceiverPhoneChange}
              placeholder={t('phonePlaceholder')}
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="phone-pad"
              returnKeyType="search"
              onSubmitEditing={onSearchReceiver}
            />
            <TouchableOpacity
              style={styles.searchReceiverBtn}
              onPress={onSearchReceiver}
              disabled={lookingUpReceiver}
            >
              {lookingUpReceiver ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.searchReceiverText}>{t('searchReceiver')}</Text>
              )}
            </TouchableOpacity>
          </View>
          {receiverLookup?.exists ? (
            <Text style={[styles.receiverOk, { textAlign }]}>
              ✅ {t('receiverFound')}: {receiverLookup.user.name}
            </Text>
          ) : null}
          {receiverLookup?.external ? (
            <Text style={[styles.receiverExt, { textAlign }]}>ℹ️ {t('receiverExternal')}</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    marginTop: -20,
    minHeight: 220,
  },
  embedded: { paddingBottom: 8 },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    marginBottom: 14,
  },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 16 },
  inputsBlock: { alignItems: 'stretch', gap: 12, marginBottom: 8 },
  routeRail: {
    width: 20,
    alignItems: 'center',
    paddingTop: 22,
    paddingBottom: 22,
  },
  pickupDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: COLORS.success,
    backgroundColor: COLORS.surface,
  },
  routeLine: {
    flex: 1,
    width: 2,
    backgroundColor: COLORS.border,
    marginVertical: 4,
    minHeight: 28,
  },
  dropoffSquare: { width: 10, height: 10, backgroundColor: COLORS.error },
  inputsCol: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: COLORS.background,
  },
  fieldWrap: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 8 },
  fieldWrapActive: { backgroundColor: '#f0f6ff' },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  field: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    paddingVertical: 6,
    minHeight: 36,
  },
  useCurrentBtn: {
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  useCurrentIcon: { fontSize: 12 },
  useCurrentText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  fieldDivider: { height: 1, backgroundColor: COLORS.border },
  loader: { marginVertical: 12 },
  hint: { fontSize: 14, color: COLORS.textSecondary, marginVertical: 12 },
  results: { marginTop: 4 },
  resultRow: {
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  resultPin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultPinIcon: { fontSize: 16 },
  resultText: { flex: 1 },
  resultTitleRow: { alignItems: 'center', gap: 8, marginBottom: 2 },
  resultTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: COLORS.text },
  resultCategory: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
    backgroundColor: '#e8f0fe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  resultSubtitle: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  resultDistance: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8, marginTop: 4 },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryChipIcon: { fontSize: 14 },
  categoryChipText: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  receiverBlock: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  receiverLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  receiverRow: { alignItems: 'center', gap: 8 },
  receiverInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
    minHeight: 48,
  },
  searchReceiverBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchReceiverText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  receiverOk: { color: COLORS.success, marginTop: 8, fontSize: 14 },
  receiverExt: { color: COLORS.warning, marginTop: 8, fontSize: 14 },
});
