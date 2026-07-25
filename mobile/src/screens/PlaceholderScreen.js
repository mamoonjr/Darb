import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen } from '../components/UI';
import { COLORS } from '../constants';
import { useLanguage } from '../context/LanguageContext';

export default function PlaceholderScreen({ route }) {
  const { t } = useTranslation();
  const { textAlign } = useLanguage();
  const title = route.params?.title || t('comingSoon');

  return (
    <Screen style={styles.center}>
      <Text style={styles.icon}>🚧</Text>
      <Text style={[styles.title, { textAlign }]}>{title}</Text>
      <Text style={[styles.sub, { textAlign }]}>{t('comingSoon')}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { justifyContent: 'center', alignItems: 'center' },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  sub: { fontSize: 16, color: COLORS.textSecondary },
});
