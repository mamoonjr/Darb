import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Input, Screen } from '../components/UI';
import { COLORS } from '../constants';
import { useAuth } from '../context/AuthContext';
import { normalizePhone } from '../utils/phone';

export default function LoginScreen({ navigation }) {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [phone, setPhone] = useState('0790000001');
  const [password, setPassword] = useState('12345');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    try {
      await login(normalizePhone(phone), password);
    } catch (err) {
      const msg =
        err.message === 'Invalid credentials'
          ? t('invalidCredentials')
          : err.message === 'Network request failed' || err.message === 'Request failed'
            ? t('networkError')
            : err.message;
      Alert.alert(t('error'), msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>{t('appName')}</Text>
        <Text style={styles.tagline}>{t('tagline')}</Text>
      </View>

      <Input
        label={t('phone')}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        placeholder={t('phonePlaceholder')}
      />
      <Input label={t('password')} value={password} onChangeText={setPassword} secureTextEntry />

      <Button title={t('login')} onPress={handleLogin} loading={loading} style={styles.btn} />

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>{t('noAccount')} {t('register')}</Text>
      </TouchableOpacity>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  logo: { fontSize: 48, fontWeight: '800', color: COLORS.primary },
  tagline: { fontSize: 16, color: COLORS.textSecondary, marginTop: 8 },
  btn: { marginTop: 8, marginBottom: 24 },
  link: { textAlign: 'center', color: COLORS.primary, fontSize: 15 },
});
