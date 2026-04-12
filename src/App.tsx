import React, { useEffect } from 'react';
import { View, StatusBar, AppState } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { initDb } from './database/Database';
import { useStore } from './store';
import { LeapModule } from './modules/LeapModule';
import { SmsOrchestrator } from './services/SmsOrchestrator';
import { TransactionRepository } from './database/TransactionRepository';
import { colors, font, alpha } from './theme';

import OnboardingScreen from './screens/OnboardingScreen';
import DashboardScreen from './screens/DashboardScreen';
import TransactionsScreen from './screens/TransactionsScreen';
import TransactionDetailScreen from './screens/TransactionDetailScreen';
import SettingsScreen from './screens/SettingsScreen';

export type RootStackParams = {
  Onboarding: undefined;
  Main: undefined;
  TransactionDetail: { transactionId: string };
};

export type TabParams = {
  Dashboard: undefined;
  Transactions: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParams>();
const Tab   = createBottomTabNavigator<TabParams>();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surfaceContainerLowest, // use a solid opaque color since transparency can look muddy
          borderTopWidth: 1,
          borderTopColor: colors.surfaceContainerHighest,
          paddingBottom: 24,
          paddingTop: 12,
          height: 80,
          borderTopLeftRadius: 48,
          borderTopRightRadius: 48,
          elevation: 0, // completely remove shadow for M3 feel
          position: 'absolute' as const,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: alpha(colors.onSurface, 0.50),
        tabBarLabelStyle: {
          fontFamily: font.label,
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.5,
          marginTop: 4,
        },
      }}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="view-dashboard-outline" color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Transactions"
        component={TransactionsScreen}
        options={{
          tabBarLabel: 'Transactions',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="receipt-text-outline" color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="cog-outline" color={color} focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function TabIcon({ name, color, focused }: { name: string; color: string; focused: boolean }) {
  return (
    <View style={{
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: focused ? colors.secondaryContainer : 'transparent',
      borderRadius: 32,
      paddingHorizontal: focused ? 24 : 0,
      paddingVertical: focused ? 6 : 0,
    }}>
      <Icon name={name} size={26} color={color} />
    </View>
  );
}

export default function App() {
  const { setModelLoaded, setTransactions, setPendingCount } = useStore();

  useEffect(() => {
    try { initDb(); } catch (e) { console.error('DB init failed', e); }

    const txns = TransactionRepository.getAll(200);
    setTransactions(txns);

    const refreshPending = async () => {
      try {
        const loaded = await LeapModule.isModelLoaded();
        setModelLoaded(loaded);
        if (!loaded) { setPendingCount(0); return; }
        setPendingCount(await SmsOrchestrator.getPendingCount());
      } catch {
        setPendingCount(0);
      }
    };

    let pollTimer: ReturnType<typeof setInterval> | null = null;
    const startPolling = () => {
      if (pollTimer) return;
      pollTimer = setInterval(refreshPending, 10_000);
    };
    const stopPolling = () => {
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    };

    refreshPending();
    startPolling();

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') { refreshPending(); startPolling(); }
      else stopPolling();
    });

    return () => { stopPolling(); sub.remove(); };
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen
            name="TransactionDetail"
            component={TransactionDetailScreen}
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
