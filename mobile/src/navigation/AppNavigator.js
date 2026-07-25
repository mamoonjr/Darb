import 'react-native-gesture-handler';
import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useTranslation } from 'react-i18next';
import CustomDrawerContent from './CustomDrawerContent';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import MyCardsScreen from '../screens/MyCardsScreen';
import MyRidesScreen from '../screens/MyRidesScreen';
import PaymentScreen from '../screens/PaymentScreen';
import PlaceholderScreen from '../screens/PlaceholderScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import WalletScreen from '../screens/WalletScreen';
import ReceiverRequestsScreen from '../screens/ReceiverRequestsScreen';
import RegisterScreen from '../screens/RegisterScreen';
import RideDetailScreen from '../screens/RideDetailScreen';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

function AuthStack() {
  const { t } = useTranslation();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: t('register') }} />
    </Stack.Navigator>
  );
}

function DrawerHome() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerPosition: isRTL ? 'right' : 'left',
        swipeEdgeWidth: 60,
        overlayColor: 'rgba(0,0,0,0.35)',
      }}
    >
      <Drawer.Screen name="HomeMain" component={HomeScreen} />
      <Drawer.Screen
        name="MyRides"
        component={MyRidesScreen}
        options={{
          title: t('myRides'),
          drawerItemStyle: { display: 'none' },
          headerShown: true,
          headerStyle: { backgroundColor: '#1a73e8' },
          headerTintColor: '#fff',
        }}
      />
      <Drawer.Screen
        name="Wallet"
        component={WalletScreen}
        options={{
          title: t('wallet'),
          drawerItemStyle: { display: 'none' },
          headerShown: true,
          headerStyle: { backgroundColor: '#1a73e8' },
          headerTintColor: '#fff',
        }}
      />
      <Drawer.Screen
        name="MyCards"
        component={MyCardsScreen}
        options={{
          title: t('myCards'),
          drawerItemStyle: { display: 'none' },
          headerShown: true,
          headerStyle: { backgroundColor: '#1a73e8' },
          headerTintColor: '#fff',
        }}
      />
      <Drawer.Screen
        name="InviteEarn"
        component={PlaceholderScreen}
        initialParams={{ title: t('inviteEarn') }}
        options={{
          title: t('inviteEarn'),
          drawerItemStyle: { display: 'none' },
          headerShown: true,
          headerStyle: { backgroundColor: '#1a73e8' },
          headerTintColor: '#fff',
        }}
      />
      <Drawer.Screen
        name="About"
        component={PlaceholderScreen}
        initialParams={{ title: t('aboutApp') }}
        options={{
          title: t('aboutApp'),
          drawerItemStyle: { display: 'none' },
          headerShown: true,
          headerStyle: { backgroundColor: '#1a73e8' },
          headerTintColor: '#fff',
        }}
      />
      <Drawer.Screen
        name="Help"
        component={PlaceholderScreen}
        initialParams={{ title: t('helpCenter') }}
        options={{
          title: t('helpCenter'),
          drawerItemStyle: { display: 'none' },
          headerShown: true,
          headerStyle: { backgroundColor: '#1a73e8' },
          headerTintColor: '#fff',
        }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: t('settings'),
          drawerItemStyle: { display: 'none' },
          headerShown: true,
          headerStyle: { backgroundColor: '#1a73e8' },
          headerTintColor: '#fff',
        }}
      />
      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: t('profile'),
          drawerItemStyle: { display: 'none' },
          headerShown: true,
          headerStyle: { backgroundColor: '#1a73e8' },
          headerTintColor: '#fff',
        }}
      />
    </Drawer.Navigator>
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
      <Stack.Screen name="Home" component={DrawerHome} options={{ headerShown: false }} />
      <Stack.Screen name="RideDetail" component={RideDetailScreen} options={{ title: t('activeRide') }} />
      <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: t('payment') }} />
      <Stack.Screen
        name="ReceiverRequests"
        component={ReceiverRequestsScreen}
        options={{ title: t('incomingPackages') }}
      />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        {user ? <MainStack /> : <AuthStack />}
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
