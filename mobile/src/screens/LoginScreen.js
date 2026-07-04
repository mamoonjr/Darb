import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Input, Screen } from '../components/UI';
import { COLORS } from '../constants';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [email, setEmail] = useState('rider@darb.app');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      Alert.alert(t('error'), err.message);
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

      <Input label={t('email')} value={email} onChangeText={setEmail} keyboardType="email-address" />
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
