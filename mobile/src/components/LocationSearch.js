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
import { resolvePlace, searchPlaces } from '../services/places';

export default function LocationSearch({
  variant = 'pickup',
  selectedAddress,
  placeholder,
  onSelect,
  onShareLocation,
  onMapPress,
  showShareBanner = false,
}) {
  const { t } = useTranslation();
  const { textAlign, row, isRTL } = useLanguage();
  const [query, setQuery] = useState(selectedAddress || '');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [sharing, setSharing] = useState(false);
  const debounceRef = useRef(null);

  const isPickup = variant === 'pickup';
  const defaultPlaceholder = isPickup ? t('enterPickupLocation') : t('enterDropoffLocation');

  useEffect(() => {
    setQuery(selectedAddress || '');
  }, [selectedAddress]);

  function handleChange(text) {
    setQuery(text);
    clearTimeout(debounceRef.current);

    if (text.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchPlaces(text);
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 350);
  }

  async function pickSuggestion(item) {
    setSuggestions([]);
    setSearching(true);
    try {
      if (item.lat != null && item.lng != null) {
        onSelect({ lat: item.lat, lng: item.lng, address: item.description });
        setQuery(item.description);
        return;
      }
      const details = await resolvePlace(item);
      if (details) {
        onSelect(details);
        setQuery(details.address);
      }
    } finally {
      setSearching(false);
    }
  }

  async function handleShareLocation() {
    if (!onShareLocation) return;
    setSharing(true);
    try {
      await onShareLocation();
    } finally {
      setSharing(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <View style={[styles.searchRow, row]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={[styles.input, { textAlign }]}
          value={query}
          onChangeText={handleChange}
          placeholder={placeholder || defaultPlaceholder}
          placeholderTextColor={COLORS.textSecondary}
          returnKeyType="search"
        />
        {onMapPress ? (
          <TouchableOpacity style={styles.mapChip} onPress={onMapPress}>
            <Text style={styles.mapChipIcon}>📍</Text>
            <Text style={styles.mapChipText}>{t('onMap')}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {searching ? (
        <ActivityIndicator size="small" color={COLORS.primary} style={styles.loader} />
      ) : null}

      {suggestions.length > 0 && (
        <View style={styles.list}>
          {suggestions.map((item, index) => (
            <TouchableOpacity
              key={item.placeId || `${item.description}-${index}`}
              style={styles.item}
              onPress={() => pickSuggestion(item)}
            >
              <Text style={styles.itemPin}>📍</Text>
              <Text style={[styles.itemText, { textAlign }]} numberOfLines={2}>
                {item.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {!searching && query.trim().length >= 2 && suggestions.length === 0 ? (
        <Text style={[styles.hint, { textAlign }]}>{t('noLocationResults')}</Text>
      ) : null}

      {showShareBanner && isPickup && onShareLocation ? (
        <View style={styles.banner}>
          <View style={[styles.bannerContent, row]}>
            <View style={styles.bannerTextWrap}>
              <Text style={[styles.bannerTitle, { textAlign }]}>{t('avoidPickupConfusion')}</Text>
              <TouchableOpacity
                style={styles.shareBtn}
                onPress={handleShareLocation}
                disabled={sharing}
              >
                {sharing ? (
                  <ActivityIndicator size="small" color={COLORS.text} />
                ) : (
                  <Text style={styles.shareBtnText}>{t('shareLocation')}</Text>
                )}
              </TouchableOpacity>
            </View>
            <Text style={styles.bannerWarn}>{isRTL ? '⚠️' : '⚠️'}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  searchRow: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 8,
  },
  searchIcon: { fontSize: 18, opacity: 0.55 },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    paddingVertical: 10,
    minHeight: 44,
  },
  mapChip: {
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mapChipIcon: { fontSize: 14 },
  mapChipText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600', marginTop: 2 },
  loader: { marginTop: 8 },
  list: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  itemPin: { fontSize: 16 },
  itemText: { flex: 1, fontSize: 14, color: COLORS.text },
  hint: { fontSize: 13, color: COLORS.textSecondary, marginTop: 8 },
  banner: {
    marginTop: 12,
    backgroundColor: '#FFE082',
    borderRadius: 14,
    padding: 14,
  },
  bannerContent: { alignItems: 'center', justifyContent: 'space-between' },
  bannerTextWrap: { flex: 1 },
  bannerTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 10 },
  shareBtn: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 120,
    alignItems: 'center',
  },
  shareBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  bannerWarn: { fontSize: 42, marginHorizontal: 8 },
});
