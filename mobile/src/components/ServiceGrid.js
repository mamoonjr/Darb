import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../constants';
import { useLanguage } from '../context/LanguageContext';

const SERVICES = [
  { id: 'carpool', labelKey: 'serviceCarpool', icon: '🛣️' },
  { id: 'ride', labelKey: 'serviceRide', icon: '🚗' },
  { id: 'airport', labelKey: 'serviceAirport', icon: '✈️' },
  { id: 'send', labelKey: 'serviceSend', icon: '📦' },
];

export default function ServiceGrid({ onSelect }) {
  const { t } = useTranslation();
  const { textAlign } = useLanguage();

  return (
    <View style={styles.grid}>
      {SERVICES.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.cell}
          onPress={() => onSelect(item.id)}
          activeOpacity={0.85}
        >
          <Text style={styles.icon}>{item.icon}</Text>
          <Text style={[styles.label, { textAlign }]}>{t(item.labelKey)}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  cell: {
    width: '47%',
    backgroundColor: COLORS.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  icon: { fontSize: 28, marginBottom: 8 },
  label: { fontSize: 15, fontWeight: '700', color: COLORS.text },
});
