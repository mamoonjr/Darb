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
import { Button, Card, Input, Screen } from '../components/UI';
import { COLORS } from '../constants';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { localizeApiError } from '../utils/errors';

const BRAND_ICONS = {
  visa: '💳',
  mastercard: '💳',
  amex: '💳',
  card: '💳',
};

function brandLabel(brand, t) {
  if (brand === 'visa') return 'Visa';
  if (brand === 'mastercard') return 'Mastercard';
  if (brand === 'amex') return 'Amex';
  return t('cardGeneric');
}

export default function MyCardsScreen() {
  const { t } = useTranslation();
  const { textAlign, row } = useLanguage();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    cardNumber: '',
    holderName: '',
    expiryMonth: '',
    expiryYear: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCards(await api.getCards());
    } catch (err) {
      Alert.alert(t('error'), localizeApiError(err, t));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  function resetForm() {
    setForm({ cardNumber: '', holderName: '', expiryMonth: '', expiryYear: '' });
  }

  async function handleAddCard() {
    const digits = form.cardNumber.replace(/\D/g, '');
    if (digits.length < 13) {
      Alert.alert(t('error'), t('cardInvalidNumber'));
      return;
    }
    const expiryMonth = Number(form.expiryMonth);
    const expiryYear = Number(form.expiryYear);
    if (!expiryMonth || !expiryYear) {
      Alert.alert(t('error'), t('cardInvalidExpiry'));
      return;
    }

    setSaving(true);
    try {
      await api.addCard({
        cardNumber: digits,
        holderName: form.holderName.trim(),
        expiryMonth,
        expiryYear,
        isDefault: cards.length === 0,
      });
      setAddOpen(false);
      resetForm();
      await load();
      Alert.alert(t('thanks'), t('cardAdded'));
    } catch (err) {
      Alert.alert(t('error'), localizeApiError(err, t));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(cardId) {
    Alert.alert(t('cardDeleteTitle'), t('cardDeleteConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteCard(cardId);
            await load();
          } catch (err) {
            Alert.alert(t('error'), localizeApiError(err, t));
          }
        },
      },
    ]);
  }

  async function handleSetDefault(cardId) {
    try {
      setCards(await api.setDefaultCard(cardId));
    } catch (err) {
      Alert.alert(t('error'), localizeApiError(err, t));
    }
  }

  return (
    <Screen>
      <Button title={t('addCard')} onPress={() => setAddOpen(true)} style={styles.addBtn} />

      <FlatList
        data={cards}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListEmptyComponent={<Text style={styles.empty}>{t('noCards')}</Text>}
        renderItem={({ item }) => (
          <Card style={[styles.cardItem, item.isDefault && styles.cardDefault]}>
            <View style={[styles.cardRow, row]}>
              <Text style={styles.cardIcon}>{BRAND_ICONS[item.brand] || '💳'}</Text>
              <View style={styles.cardInfo}>
                <Text style={[styles.cardBrand, { textAlign }]}>
                  {brandLabel(item.brand, t)} •••• {item.last4}
                </Text>
                <Text style={[styles.cardMeta, { textAlign }]}>
                  {item.holderName} · {String(item.expiryMonth).padStart(2, '0')}/{item.expiryYear}
                </Text>
                {item.isDefault ? (
                  <Text style={[styles.defaultBadge, { textAlign }]}>{t('defaultCard')}</Text>
                ) : null}
              </View>
            </View>
            <View style={[styles.cardActions, row]}>
              {!item.isDefault ? (
                <Button
                  title={t('setDefaultCard')}
                  variant="outline"
                  onPress={() => handleSetDefault(item.id)}
                  style={styles.smallBtn}
                />
              ) : null}
              <Button
                title={t('delete')}
                variant="outline"
                onPress={() => handleDelete(item.id)}
                style={styles.smallBtn}
              />
            </View>
          </Card>
        )}
      />

      <Modal visible={addOpen} transparent animationType="slide" onRequestClose={() => setAddOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={[styles.modalTitle, { textAlign }]}>{t('addCard')}</Text>
            <Input
              label={t('cardNumber')}
              value={form.cardNumber}
              onChangeText={(v) => setForm((f) => ({ ...f, cardNumber: v }))}
              placeholder="4242 4242 4242 4242"
              keyboardType="number-pad"
            />
            <Input
              label={t('cardHolder')}
              value={form.holderName}
              onChangeText={(v) => setForm((f) => ({ ...f, holderName: v }))}
              placeholder={t('cardHolder')}
            />
            <View style={[styles.expiryRow, row]}>
              <View style={styles.expiryField}>
                <Input
                  label={t('cardExpiryMonth')}
                  value={form.expiryMonth}
                  onChangeText={(v) => setForm((f) => ({ ...f, expiryMonth: v }))}
                  placeholder="12"
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.expiryField}>
                <Input
                  label={t('cardExpiryYear')}
                  value={form.expiryYear}
                  onChangeText={(v) => setForm((f) => ({ ...f, expiryYear: v }))}
                  placeholder="2028"
                  keyboardType="number-pad"
                />
              </View>
            </View>
            <Text style={[styles.secureNote, { textAlign }]}>{t('cardSecureNote')}</Text>
            <Button title={t('saveCard')} onPress={handleAddCard} loading={saving} />
            <TouchableOpacity onPress={() => setAddOpen(false)} style={styles.cancelLink}>
              <Text style={styles.cancelText}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  addBtn: { marginBottom: 16 },
  empty: { textAlign: 'center', color: COLORS.textSecondary, marginTop: 40 },
  cardItem: { borderWidth: 1, borderColor: COLORS.border },
  cardDefault: { borderColor: COLORS.primary, backgroundColor: '#f0f6ff' },
  cardRow: { alignItems: 'center', gap: 12, marginBottom: 12 },
  cardIcon: { fontSize: 32 },
  cardInfo: { flex: 1 },
  cardBrand: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  cardMeta: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  defaultBadge: { fontSize: 12, color: COLORS.primary, fontWeight: '700', marginTop: 6 },
  cardActions: { gap: 8 },
  smallBtn: { flex: 1 },
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
    maxHeight: '90%',
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 16 },
  expiryRow: { gap: 12 },
  expiryField: { flex: 1 },
  secureNote: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 16 },
  cancelLink: { alignItems: 'center', marginTop: 12 },
  cancelText: { color: COLORS.primary, fontWeight: '600' },
});
