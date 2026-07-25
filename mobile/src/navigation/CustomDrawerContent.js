import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../constants';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const MENU_ITEMS = [
  { key: 'myRides', route: 'MyRides', icon: '🕐' },
  { key: 'wallet', route: 'Wallet', icon: '💳' },
  { key: 'myCards', route: 'MyCards', icon: '🪪' },
  { key: 'inviteEarn', route: 'InviteEarn', icon: '🎁' },
  { key: 'aboutApp', route: 'About', icon: 'ℹ️' },
  { key: 'helpCenter', route: 'Help', icon: '❓' },
];

export default function CustomDrawerContent({ navigation }) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { textAlign, row, isRTL } = useLanguage();
  const initial = (user?.name || '?').trim().charAt(0).toUpperCase();

  function go(route) {
    navigation.closeDrawer();
    navigation.navigate(route);
  }

  return (
    <DrawerContentScrollView contentContainerStyle={styles.wrap}>
      <View style={[styles.profile, row]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={styles.profileText}>
          <Text style={[styles.name, { textAlign }]}>{user?.name}</Text>
          <Text style={[styles.phone, { textAlign }]}>{user?.phone}</Text>
        </View>
      </View>

      {MENU_ITEMS.map((item) => (
        <TouchableOpacity key={item.key} style={[styles.item, row]} onPress={() => go(item.route)}>
          <Text style={styles.itemIcon}>{item.icon}</Text>
          <Text style={[styles.itemLabel, { textAlign }]}>{t(item.key)}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={[styles.item, row]} onPress={() => go('Settings')}>
        <Text style={styles.itemIcon}>⚙️</Text>
        <Text style={[styles.itemLabel, { textAlign }]}>{t('settings')}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.item, row]} onPress={() => go('Profile')}>
        <Text style={styles.itemIcon}>👤</Text>
        <Text style={[styles.itemLabel, { textAlign }]}>{t('profile')}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logout} onPress={logout}>
        <Text style={styles.logoutText}>{t('logout')}</Text>
      </TouchableOpacity>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 56, paddingBottom: 24 },
  profile: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '800' },
  profileText: { flex: 1 },
  name: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  phone: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  item: {
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  itemIcon: { fontSize: 20, width: 28 },
  itemLabel: { flex: 1, fontSize: 16, fontWeight: '600', color: COLORS.text },
  logout: { marginTop: 24, marginHorizontal: 20, paddingVertical: 14 },
  logoutText: { color: COLORS.error, fontSize: 16, fontWeight: '700', textAlign: 'center' },
});
