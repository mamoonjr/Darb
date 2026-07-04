import React from 'react';
import { Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import PaymentScreen from '../screens/PaymentScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ReceiverRequestsScreen from '../screens/ReceiverRequestsScreen';
import RegisterScreen from '../screens/RegisterScreen';
import RideDetailScreen from '../screens/RideDetailScreen';

const Stack = createNativeStackNavigator();

function AuthStack() {
  const { t } = useTranslation();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: t('register') }} />
    </Stack.Navigator>
  );
}

function MainStack() {
  const { t } = useTranslation();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1a73e8' },
        headerTintColor: '#fff',
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={({ navigation }) => ({
          title: t('home'),
          headerRight: () => (
            <Text
              onPress={() => navigation.navigate('Profile')}
              style={{ color: '#fff', fontSize: 16, marginRight: 8 }}
            >
              {t('profile')}
            </Text>
          ),
        })}
      />
      <Stack.Screen name="RideDetail" component={RideDetailScreen} options={{ title: t('activeRide') }} />
      <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: t('payment') }} />
      <Stack.Screen name="ReceiverRequests" component={ReceiverRequestsScreen} options={{ title: t('incomingPackages') }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: t('profile') }} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return user ? <MainStack /> : <AuthStack />;
}
