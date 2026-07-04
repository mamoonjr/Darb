import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../constants';
import { useLanguage } from '../context/LanguageContext';

export default function LanguageToggle({ style }) {
  const { t } = useTranslation();
  const { language, setLanguage, row } = useLanguage();

  return (
    <View style={[styles.wrap, row, style]}>
      <TouchableOpacity
        style={[styles.btn, language === 'ar' && styles.btnActive]}
        onPress={() => setLanguage('ar')}
      >
        <Text style={[styles.text, language === 'ar' && styles.textActive]}>{t('arabic')}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.btn, language === 'en' && styles.btnActive]}
        onPress={() => setLanguage('en')}
      >
        <Text style={[styles.text, language === 'en' && styles.textActive]}>{t('english')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8, marginBottom: 20 },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  btnActive: { borderColor: COLORS.primary, backgroundColor: '#e8f0fe' },
  text: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  textActive: { color: COLORS.primary },
});
