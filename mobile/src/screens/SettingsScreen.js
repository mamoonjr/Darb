import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import LanguageToggle from '../components/LanguageToggle';
import { Card, Screen } from '../components/UI';
import { COLORS } from '../constants';
import { useLanguage } from '../context/LanguageContext';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { textAlign, language } = useLanguage();

  return (
    <Screen>
      <Text style={[styles.title, { textAlign }]}>{t('settings')}</Text>

      <Card>
        <Text style={[styles.label, { textAlign }]}>{t('language')}</Text>
        <Text style={[styles.hint, { textAlign }]}>
          {language === 'ar' ? t('languageHintAr') : t('languageHintEn')}
        </Text>
        <LanguageToggle style={styles.langToggle} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '700', color: COLORS.text, marginBottom: 24 },
  label: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  hint: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 16 },
  langToggle: { marginBottom: 0 },
});
