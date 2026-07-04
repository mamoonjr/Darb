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
import { placeDetails, searchPlaces } from '../services/places';

export default function LocationSearch({ label, selectedAddress, placeholder, onSelect }) {
  const { t } = useTranslation();
  const { textAlign } = useLanguage();
  const [query, setQuery] = useState(selectedAddress || '');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef(null);

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
    }, 400);
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
      const details = await placeDetails(item.placeId);
      if (details) {
        onSelect(details);
        setQuery(details.address);
      }
    } finally {
      setSearching(false);
    }
  }

  return (
    <View style={styles.wrap}>
      {label ? <Text style={[styles.label, { textAlign }]}>{label}</Text> : null}
      <TextInput
        style={[styles.input, { textAlign }]}
        value={query}
        onChangeText={handleChange}
        placeholder={placeholder || t('searchLocation')}
        placeholderTextColor={COLORS.textSecondary}
        returnKeyType="search"
      />
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
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  label: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  loader: { marginTop: 8 },
  list: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
  },
  item: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  itemText: { fontSize: 14, color: COLORS.text },
  hint: { fontSize: 13, color: COLORS.textSecondary, marginTop: 8 },
});
