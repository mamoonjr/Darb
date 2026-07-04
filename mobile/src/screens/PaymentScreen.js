import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Card, Screen } from '../components/UI';
import { COLORS } from '../constants';
import { api } from '../services/api';

const METHODS = [
  { id: 'card', labelKey: 'payCard', icon: '💳' },
  { id: 'mada', labelKey: 'payMada', icon: '🏦' },
  { id: 'apple_pay', labelKey: 'payApple', icon: '🍎' },
];

export default function PaymentScreen({ route, navigation }) {
  const { rideId, fare } = route.params;
  const { t } = useTranslation();
  const [method, setMethod] = useState('card');
  const [loading, setLoading] = useState(false);

  async function handlePay() {
    setLoading(true);
    try {
      await api.payRide(rideId, method);
      Alert.alert(t('paymentSuccess'), t('paymentSuccessMsg'), [
        { text: t('ok'), onPress: () => navigation.replace('RideDetail', { rideId }) },
      ]);
    } catch (err) {
      Alert.alert(t('error'), err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Text style={styles.title}>{t('payment')}</Text>
      <Card>
        <Text style={styles.amount}>{fare} {t('sar')}</Text>
        <Text style={styles.subtitle}>{t('selectPaymentMethod')}</Text>
      </Card>

      {METHODS.map((m) => (
        <TouchableOpacity
          key={m.id}
          style={[styles.method, method === m.id && styles.methodActive]}
          onPress={() => setMethod(m.id)}
        >
          <Text style={styles.methodIcon}>{m.icon}</Text>
          <Text style={[styles.methodLabel, method === m.id && styles.methodLabelActive]}>
            {t(m.labelKey)}
          </Text>
        </TouchableOpacity>
      ))}

      <Button title={t('payNow')} onPress={handlePay} loading={loading} style={styles.payBtn} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 20, textAlign: 'right' },
  amount: { fontSize: 32, fontWeight: '700', color: COLORS.primary, textAlign: 'center' },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8 },
  method: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  methodActive: { borderColor: COLORS.primary, backgroundColor: '#e8f0fe' },
  methodIcon: { fontSize: 24, marginRight: 12 },
  methodLabel: { fontSize: 16, color: COLORS.text, flex: 1, textAlign: 'right' },
  methodLabelActive: { color: COLORS.primary, fontWeight: '600' },
  payBtn: { marginTop: 20 },
});
