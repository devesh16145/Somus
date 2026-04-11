import React, { useEffect } from 'react';
import { StatusBar, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { initDb } from './database/Database';
import { useStore } from './store';
import { LeapModule } from './modules/LeapModule';
import { SmsOrchestrator } from './services/SmsOrchestrator';
import { TransactionRepository } from './database/TransactionRepository';

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
          backgroundColor: '#0D0D0D',
          borderTopColor: '#1A1A1A',
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 64,
        },
        tabBarActiveTintColor: '#00FF94',
        tabBarInactiveTintColor: '#555555',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarLabel: 'Overview', tabBarIcon: ({ color }) => <TabIcon glyph="◉" color={color} /> }}
      />
      <Tab.Screen
        name="Transactions"
        component={TransactionsScreen}
        options={{ tabBarLabel: 'Transactions', tabBarIcon: ({ color }) => <TabIcon glyph="≡" color={color} /> }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarLabel: 'Settings', tabBarIcon: ({ color }) => <TabIcon glyph="⚙" color={color} /> }}
      />
    </Tab.Navigator>
  );
}

function TabIcon({ glyph, color }: { glyph: string; color: string }) {
  const { Text } = require('react-native');
  return <Text style={{ color, fontSize: 18 }}>{glyph}</Text>;
}

export default function App() {
  const { setModelLoaded, setTransactions, prependTransaction } = useStore();

  useEffect(() => {
    // 1. Init database
    try { initDb(); } catch (e) { console.error('DB init failed', e); }

    // 2. Load existing transactions
    const txns = TransactionRepository.getAll(200);
    setTransactions(txns);

    // 3. Check if model is already downloaded
    LeapModule.isModelLoaded().then(setModelLoaded);

    // 4. Subscribe to live transactions from background service
    const sub = LeapModule.onLiveTransaction(({ transaction }) => {
      const saved = SmsOrchestrator.handleLiveTransaction(transaction);
      if (saved) prependTransaction(saved);
    });

    // 5. Don't auto-sync on open — let user trigger import from Settings
    //    Auto-sync blocks the AI model and prevents manual imports from working

    return () => { sub.remove(); };
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />
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
