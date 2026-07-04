import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Card, Screen } from '../components/UI';
import { COLORS } from '../constants';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, logout, switchRole } = useAuth();
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
      <Text style={styles.title}>{t('profile')}</Text>

      <Card>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.meta}>{user?.email}</Text>
        <Text style={styles.meta}>{user?.phone}</Text>
        <Text style={styles.role}>
          {activeRole === 'DRIVER' ? t('roleDriver') : activeRole === 'ADMIN' ? 'Admin' : t('roleRider')}
        </Text>
      </Card>

      {user?.driverProfile && (
        <Card>
          <Text style={styles.label}>{t('roleDriver')}</Text>
          <Text style={styles.meta}>
            {user.driverProfile.vehicleColor} {user.driverProfile.vehicleMake} {user.driverProfile.vehicleModel}
          </Text>
          <Text style={styles.meta}>{user.driverProfile.vehiclePlate}</Text>
          <Text style={[styles.badge, user.driverProfile.isAvailable ? styles.online : styles.offline]}>
            {user.driverProfile.isAvailable ? t('available') : t('unavailable')}
          </Text>
        </Card>
      )}

      {canSwitch && (
        <Card>
          <Text style={styles.label}>{t('accountMode')}</Text>
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
  title: { fontSize: 28, fontWeight: '700', color: COLORS.text, marginBottom: 24, textAlign: 'right' },
  name: { fontSize: 22, fontWeight: '700', color: COLORS.text, textAlign: 'right' },
  meta: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4, textAlign: 'right' },
  role: { fontSize: 14, color: COLORS.primary, fontWeight: '600', marginTop: 8, textAlign: 'right' },
  label: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 8, textAlign: 'right' },
  badge: { marginTop: 12, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, alignSelf: 'flex-end', overflow: 'hidden', fontSize: 13, fontWeight: '600' },
  online: { backgroundColor: '#d1fae5', color: COLORS.success },
  offline: { backgroundColor: '#fee2e2', color: COLORS.error },
  logout: { marginTop: 24 },
});
