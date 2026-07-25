import React, { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Card, Screen } from '../components/UI';
import { COLORS } from '../constants';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function ProfileScreen({ navigation }) {
  const { t } = useTranslation();
  const { user, logout, switchRole } = useAuth();
  const { textAlign, alignEnd } = useLanguage();
  const [switching, setSwitching] = useState(false);

  const activeRole = user?.activeRole || user?.role;
  const isAdmin = activeRole === 'ADMIN';
  const targetRole = activeRole === 'DRIVER' ? 'RIDER' : 'DRIVER';
  // Only offer switching to roles the user actually owns.
  const canSwitch = !isAdmin && (user?.roles || []).includes(targetRole);

  async function handleSwitch() {
    setSwitching(true);
    try {
      await switchRole(targetRole);
      Alert.alert(t('roleSwitched'), targetRole === 'DRIVER' ? t('roleDriver') : t('roleRider'));
    } catch (err) {
      Alert.alert(t('error'), err.message);
    } finally {
      setSwitching(false);
    }
  }

  return (
    <Screen>
      <Card style={styles.profileCard}>
        <Text style={[styles.name, { textAlign }]}>{user?.name}</Text>
        <Text style={[styles.meta, { textAlign }]}>{user?.email}</Text>
        <Text style={[styles.meta, { textAlign }]}>{user?.phone}</Text>
        <Text style={[styles.role, { textAlign }]}>
          {activeRole === 'DRIVER' ? t('roleDriver') : activeRole === 'ADMIN' ? t('roleAdmin') : t('roleRider')}
        </Text>
      </Card>

      <Card>
        <Text style={[styles.label, { textAlign }]}>{t('settings')}</Text>
        <Button title={t('openSettings')} variant="outline" onPress={() => navigation.navigate('Settings')} />
      </Card>

      {user?.driverProfile && (
        <Card>
          <Text style={[styles.label, { textAlign }]}>{t('roleDriver')}</Text>
          <Text style={[styles.meta, { textAlign }]}>
            {user.driverProfile.vehicleColor} {user.driverProfile.vehicleMake} {user.driverProfile.vehicleModel}
          </Text>
          <Text style={[styles.meta, { textAlign }]}>{user.driverProfile.vehiclePlate}</Text>
          <Text style={[styles.badge, user.driverProfile.isAvailable ? styles.online : styles.offline, { alignSelf: alignEnd }]}>
            {user.driverProfile.isAvailable ? t('available') : t('unavailable')}
          </Text>
        </Card>
      )}

      {canSwitch && (
        <Card>
          <Text style={[styles.label, { textAlign }]}>{t('accountMode')}</Text>
          <Button
            title={targetRole === 'DRIVER' ? t('switchToDriver') : t('switchToRider')}
            onPress={handleSwitch}
            loading={switching}
          />
        </Card>
      )}

      <Button title={t('logout')} variant="outline" onPress={logout} style={styles.logout} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileCard: { marginBottom: 12 },
  name: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  meta: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  role: { fontSize: 14, color: COLORS.primary, fontWeight: '600', marginTop: 8 },
  label: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 8 },
  badge: { marginTop: 12, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, overflow: 'hidden', fontSize: 13, fontWeight: '600' },
  online: { backgroundColor: '#d1fae5', color: COLORS.success },
  offline: { backgroundColor: '#fee2e2', color: COLORS.error },
  logout: { marginTop: 24 },
});
