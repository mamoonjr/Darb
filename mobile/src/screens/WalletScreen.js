import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Card, Screen } from '../components/UI';
import { COLORS, CURRENCY } from '../constants';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { localizeApiError } from '../utils/errors';

const TOP_UP_AMOUNTS = [5, 10, 20, 50];

function formatAmount(value) {
  return Number(value || 0).toFixed(2);
}

function txLabel(type, t) {
  if (type === 'TOP_UP') return t('walletTopUp');
  if (type === 'RIDE_PAYMENT') return t('walletRidePayment');
  if (type === 'REFUND') return t('walletRefund');
  return type;
}

export default function WalletScreen({ navigation }) {
  const { t } = useTranslation();
  const { textAlign, row } = useLanguage();
  const [wallet, setWallet] = useState({ balance: 0 });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [topUpLoading, setTopUpLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [w, txs] = await Promise.all([api.getWallet(), api.getWalletTransactions()]);
      setWallet(w);
      setTransactions(txs);
    } catch (err) {
      Alert.alert(t('error'), localizeApiError(err, t));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleTopUp(amount) {
    setTopUpLoading(true);
    try {
      const updated = await api.topUpWallet(amount);
      setWallet(updated);
      setTopUpOpen(false);
      await load();
      Alert.alert(t('walletTopUpSuccess'), `${formatAmount(amount)} ${t('jod')}`);
    } catch (err) {
      Alert.alert(t('error'), localizeApiError(err, t));
    } finally {
      setTopUpLoading(false);
    }
  }

  return (
    <Screen>
      <Card style={styles.balanceCard}>
        <Text style={[styles.balanceLabel, { textAlign }]}>{t('walletBalance')}</Text>
        <Text style={styles.balanceValue}>
          {formatAmount(wallet.balance)} <Text style={styles.currency}>{t('jod')}</Text>
        </Text>
        <View style={[styles.actions, row]}>
          <Button title={t('walletTopUp')} onPress={() => setTopUpOpen(true)} style={styles.actionBtn} />
          <Button
            title={t('myCards')}
            variant="outline"
            onPress={() => navigation.navigate('MyCards')}
            style={styles.actionBtn}
          />
        </View>
      </Card>

      <Text style={[styles.sectionTitle, { textAlign }]}>{t('walletHistory')}</Text>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListEmptyComponent={<Text style={styles.empty}>{t('walletNoTransactions')}</Text>}
        renderItem={({ item }) => {
          const positive = item.amount >= 0;
          return (
            <Card style={styles.txCard}>
              <View style={[styles.txRow, row]}>
                <View style={styles.txInfo}>
                  <Text style={[styles.txTitle, { textAlign }]}>{txLabel(item.type, t)}</Text>
                  {item.description ? (
                    <Text style={[styles.txDesc, { textAlign }]}>{item.description}</Text>
                  ) : null}
                  <Text style={[styles.txDate, { textAlign }]}>
                    {new Date(item.createdAt).toLocaleString()}
                  </Text>
                </View>
                <Text style={[styles.txAmount, positive ? styles.positive : styles.negative]}>
                  {positive ? '+' : ''}
                  {formatAmount(item.amount)} {CURRENCY}
                </Text>
              </View>
            </Card>
          );
        }}
      />

      <Modal visible={topUpOpen} transparent animationType="slide" onRequestClose={() => setTopUpOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={[styles.modalTitle, { textAlign }]}>{t('walletTopUp')}</Text>
            <Text style={[styles.modalHint, { textAlign }]}>{t('walletTopUpHint')}</Text>
            <View style={styles.amountGrid}>
              {TOP_UP_AMOUNTS.map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={styles.amountChip}
                  onPress={() => handleTopUp(amount)}
                  disabled={topUpLoading}
                >
                  <Text style={styles.amountChipText}>
                    {amount} {t('jod')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Button title={t('cancel')} variant="outline" onPress={() => setTopUpOpen(false)} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  balanceCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    marginBottom: 20,
  },
  balanceLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 14, marginBottom: 8 },
  balanceValue: { color: '#fff', fontSize: 36, fontWeight: '800', marginBottom: 16 },
  currency: { fontSize: 18, fontWeight: '600' },
  actions: { gap: 10 },
  actionBtn: { flex: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 12 },
  empty: { textAlign: 'center', color: COLORS.textSecondary, marginTop: 24 },
  txCard: { paddingVertical: 12 },
  txRow: { justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  txInfo: { flex: 1 },
  txTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  txDesc: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  txDate: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4 },
  txAmount: { fontSize: 16, fontWeight: '800' },
  positive: { color: COLORS.success },
  negative: { color: COLORS.error },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  modalHint: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 20 },
  amountGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  amountChip: {
    width: '47%',
    backgroundColor: '#e8f0fe',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  amountChipText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
});
