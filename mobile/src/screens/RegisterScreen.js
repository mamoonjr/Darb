import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Input, Screen } from '../components/UI';
import { COLORS } from '../constants';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function RegisterScreen({ navigation }) {
  const { t } = useTranslation();
  const { register } = useAuth();
  const { textAlign, row } = useLanguage();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'RIDER',
  });
  const [loading, setLoading] = useState(false);

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleRegister() {
    setLoading(true);
    try {
      await register(form);
    } catch (err) {
      Alert.alert(t('error'), err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Text style={[styles.title, { textAlign }]}>{t('createAccount')}</Text>

      <Input label={t('name')} value={form.name} onChangeText={(v) => update('name', v)} />
      <Input label={t('email')} value={form.email} onChangeText={(v) => update('email', v)} keyboardType="email-address" />
      <Input label={t('phone')} value={form.phone} onChangeText={(v) => update('phone', v)} keyboardType="phone-pad" />
      <Input label={t('password')} value={form.password} onChangeText={(v) => update('password', v)} secureTextEntry />

      <View style={[styles.roleRow, row]}>
        <TouchableOpacity
          style={[styles.roleBtn, form.role === 'RIDER' && styles.roleActive]}
          onPress={() => update('role', 'RIDER')}
        >
          <Text style={[styles.roleText, form.role === 'RIDER' && styles.roleTextActive]}>{t('roleRider')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.roleBtn, form.role === 'DRIVER' && styles.roleActive]}
          onPress={() => update('role', 'DRIVER')}
        >
          <Text style={[styles.roleText, form.role === 'DRIVER' && styles.roleTextActive]}>{t('roleDriver')}</Text>
        </TouchableOpacity>
      </View>

      <Button title={t('register')} onPress={handleRegister} loading={loading} style={styles.btn} />

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.link}>{t('haveAccount')} {t('login')}</Text>
      </TouchableOpacity>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '700', color: COLORS.text, marginBottom: 24 },
  roleRow: { gap: 12, marginBottom: 16 },
  roleBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  roleActive: { borderColor: COLORS.primary, backgroundColor: '#e8f0fe' },
  roleText: { color: COLORS.textSecondary, fontWeight: '600' },
  roleTextActive: { color: COLORS.primary },
  btn: { marginBottom: 24 },
  link: { textAlign: 'center', color: COLORS.primary, fontSize: 15 },
});
