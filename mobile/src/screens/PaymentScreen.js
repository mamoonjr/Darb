import React, { useState } from 'react';

import { Alert, StyleSheet, Text, TouchableOpacity } from 'react-native';

import { useTranslation } from 'react-i18next';

import { Button, Card, Screen } from '../components/UI';

import { COLORS } from '../constants';

import { useLanguage } from '../context/LanguageContext';

import { api } from '../services/api';

import { localizeApiError } from '../utils/errors';



const METHODS = [

  { id: 'wallet', labelKey: 'payWallet', icon: '👛' },

  { id: 'card', labelKey: 'payCard', icon: '💳' },

  { id: 'mada', labelKey: 'payMada', icon: '🏦' },

  { id: 'apple_pay', labelKey: 'payApple', icon: '🍎' },

];



export default function PaymentScreen({ route, navigation }) {

  const { rideId, fare } = route.params;

  const { t } = useTranslation();

  const { textAlign, row } = useLanguage();

  const [method, setMethod] = useState('wallet');

  const [loading, setLoading] = useState(false);



  async function handlePay() {

    setLoading(true);

    try {

      await api.payRide(rideId, method);

      Alert.alert(t('paymentSuccess'), t('paymentSuccessMsg'), [

        { text: t('ok'), onPress: () => navigation.replace('RideDetail', { rideId }) },

      ]);

    } catch (err) {

      Alert.alert(t('error'), localizeApiError(err, t));

    } finally {

      setLoading(false);

    }

  }



  return (

    <Screen>

      <Card style={styles.amountCard}>

        <Text style={[styles.amountLabel, { textAlign }]}>{t('payment')}</Text>

        <Text style={styles.amount}>

          {fare} {t('jod')}

        </Text>

        <Text style={[styles.subtitle, { textAlign }]}>{t('selectPaymentMethod')}</Text>

      </Card>



      {METHODS.map((m) => (

        <TouchableOpacity

          key={m.id}

          style={[styles.method, row, method === m.id && styles.methodActive]}

          onPress={() => setMethod(m.id)}

        >

          <Text style={styles.methodIcon}>{m.icon}</Text>

          <Text style={[styles.methodLabel, { textAlign }, method === m.id && styles.methodLabelActive]}>

            {t(m.labelKey)}

          </Text>

        </TouchableOpacity>

      ))}



      <Button title={t('payNow')} onPress={handlePay} loading={loading} style={styles.payBtn} />

    </Screen>

  );

}



const styles = StyleSheet.create({

  amountCard: { marginBottom: 16, alignItems: 'center' },

  amountLabel: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 8 },

  amount: { fontSize: 36, fontWeight: '800', color: COLORS.primary, textAlign: 'center' },

  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 8 },

  method: {

    alignItems: 'center',

    backgroundColor: COLORS.surface,

    borderRadius: 14,

    padding: 16,

    marginBottom: 10,

    borderWidth: 2,

    borderColor: COLORS.border,

    gap: 12,

  },

  methodActive: { borderColor: COLORS.primary, backgroundColor: '#e8f0fe' },

  methodIcon: { fontSize: 24 },

  methodLabel: { fontSize: 16, color: COLORS.text, flex: 1, fontWeight: '600' },

  methodLabelActive: { color: COLORS.primary, fontWeight: '700' },

  payBtn: { marginTop: 20 },

});


