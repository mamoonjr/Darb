import React, { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Input, Screen } from '../components/UI';
import { COLORS } from '../constants';
import { PRESET_ROUTE_LANDMARKS } from '../constants/landmarks';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { localizeApiError } from '../utils/errors';

export default function PublishRouteScreen({ navigation }) {
  const { t } = useTranslation();
  const { textAlign, row } = useLanguage();
  const [summary, setSummary] = useState('');
  const [capacity, setCapacity] = useState('4');
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);

  const ordered = useMemo(
    () => selected.map((name) => PRESET_ROUTE_LANDMARKS.find((l) => l.name === name)).filter(Boolean),
    [selected]
  );

  function toggleLandmark(name) {
    setSelected((prev) => {
      if (prev.includes(name)) return prev.filter((n) => n !== name);
      return [...prev, name];
    });
  }

  async function onPublish() {
    if (ordered.length < 2) {
      Alert.alert(t('error'), t('carpoolNeedTwoLandmarks'));
      return;
    }
    const vehicleCapacity = Math.min(8, Math.max(1, parseInt(capacity, 10) || 4));
    setLoading(true);
    try {
      const ride = await api.publishRouteRide({
        summary: summary.trim() || undefined,
        vehicleCapacity,
        landmarks: ordered.map((l, i) => ({
          name: l.name,
          lat: l.lat,
          lng: l.lng,
          sequence: i,
        })),
      });
      Alert.alert(t('ok'), t('carpoolPublished'));
      navigation.replace('RouteRideDetail', { rideId: ride.id });
    } catch (err) {
      Alert.alert(t('error'), localizeApiError(err, t));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.hint, { textAlign }]}>{t('carpoolPublishHint')}</Text>
        <Input
          label={t('carpoolRouteSummary')}
          value={summary}
          onChangeText={setSummary}
          placeholder={t('carpoolRouteSummaryPlaceholder')}
        />
        <Input
          label={t('carpoolCapacity')}
          value={capacity}
          onChangeText={setCapacity}
          keyboardType="number-pad"
        />

        <Text style={[styles.section, { textAlign }]}>{t('carpoolSelectLandmarks')}</Text>
        <Text style={[styles.meta, { textAlign }]}>{t('carpoolLandmarkOrderHint')}</Text>

        {PRESET_ROUTE_LANDMARKS.map((lm) => {
          const on = selected.includes(lm.name);
          const order = selected.indexOf(lm.name);
          return (
            <TouchableOpacity
              key={lm.name}
              style={[styles.chip, on && styles.chipOn]}
              onPress={() => toggleLandmark(lm.name)}
            >
              <View style={[styles.chipRow, row]}>
                <Text style={[styles.chipText, on && styles.chipTextOn, { textAlign }]}>
                  {on ? `${order + 1}. ` : ''}
                  {lm.name}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}

        <Button
          title={t('carpoolPublish')}
          onPress={onPublish}
          loading={loading}
          style={styles.publishBtn}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  hint: { color: COLORS.textSecondary, marginBottom: 16, lineHeight: 22 },
  section: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  meta: { color: COLORS.textSecondary, marginBottom: 12, fontSize: 13 },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    backgroundColor: COLORS.surface,
  },
  chipOn: { borderColor: COLORS.primary, backgroundColor: '#e8f0fe' },
  chipRow: { alignItems: 'center' },
  chipText: { fontSize: 15, color: COLORS.text, fontWeight: '600' },
  chipTextOn: { color: COLORS.primaryDark },
  publishBtn: { marginTop: 16 },
});
