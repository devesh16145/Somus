import React, { useEffect } from 'react';
import { View, StatusBar, AppState } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initDb } from './database/Database';
import { useStore } from './store';
import { LeapModule } from './modules/LeapModule';
import { SmsOrchestrator } from './services/SmsOrchestrator';
import { TransactionRepository } from './database/TransactionRepository';
import { font, alpha, themes, accent, accentInk } from './theme';
import LiquidIcon from './components/LiquidIcons';

import OnboardingScreen from './screens/OnboardingScreen';
import DashboardScreen from './screens/DashboardScreen';
import TransactionsScreen from './screens/TransactionsScreen';
import TransactionDetailScreen from './screens/TransactionDetailScreen';
import SubscriptionsScreen from './screens/SubscriptionsScreen';
import GoalsScreen from './screens/GoalsScreen';
import SettingsScreen from './screens/SettingsScreen';
import { AddTransactionScreen, AddSubscriptionScreen, AddGoalScreen } from './components/ActionViews';

export type RootStackParams = {
  Onboarding: undefined;
  Main: undefined;
  TransactionDetail: { transactionId: string };
  AddTransaction: undefined;
  AddSubscription: undefined;
  AddGoal: undefined;
};

export type TabParams = {
  Dashboard: undefined;
  Transactions: undefined;
  Subscriptions: undefined;
  Goals: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParams>();
const Tab   = createBottomTabNavigator<TabParams>();

function TabNavigator() {
  const { themeMode } = useStore();
  const t = themes[themeMode];

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 24,
          left: 48,
          right: 48,
          backgroundColor: t.surface,
          borderTopWidth: 0,
          height: 64,
          borderRadius: 32,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.1,
          shadowRadius: 24,
          elevation: 10,
          paddingBottom: 0,
        },
        tabBarActiveTintColor: t.ink,
        tabBarInactiveTintColor: t.mute,
      }}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center', backgroundColor: focused ? alpha(accent.v, 0.15) : 'transparent', borderRadius: 20, paddingHorizontal: focused ? 18 : 0, paddingVertical: focused ? 8 : 0 }}>
              <LiquidIcon name="home" color={focused ? accent.v : color} size={focused ? 24 : 22} strokeWidth={focused ? 2 : 1.7} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Transactions"
        component={TransactionsScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center', backgroundColor: focused ? alpha(accent.v, 0.15) : 'transparent', borderRadius: 20, paddingHorizontal: focused ? 18 : 0, paddingVertical: focused ? 8 : 0 }}>
              <LiquidIcon name="basket" color={focused ? accent.v : color} size={focused ? 24 : 22} strokeWidth={focused ? 2 : 1.7} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Subscriptions"
        component={SubscriptionsScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center', backgroundColor: focused ? alpha(accent.v, 0.15) : 'transparent', borderRadius: 20, paddingHorizontal: focused ? 18 : 0, paddingVertical: focused ? 8 : 0 }}>
              <LiquidIcon name="bag" color={focused ? accent.v : color} size={focused ? 24 : 22} strokeWidth={focused ? 2 : 1.7} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Goals"
        component={GoalsScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center', backgroundColor: focused ? alpha(accent.v, 0.15) : 'transparent', borderRadius: 20, paddingHorizontal: focused ? 18 : 0, paddingVertical: focused ? 8 : 0 }}>
              <LiquidIcon name="disc" color={focused ? accent.v : color} size={focused ? 24 : 22} strokeWidth={focused ? 2 : 1.7} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center', backgroundColor: focused ? alpha(accent.v, 0.15) : 'transparent', borderRadius: 20, paddingHorizontal: focused ? 18 : 0, paddingVertical: focused ? 8 : 0 }}>
              <LiquidIcon name="cog" color={focused ? accent.v : color} size={focused ? 24 : 22} strokeWidth={focused ? 2 : 1.7} />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const { setModelLoaded, setTransactions, setPendingCount, themeMode } = useStore();

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
      <StatusBar barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={themes[themeMode].bg} />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen
            name="TransactionDetail"
            component={TransactionDetailScreen}
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen name="AddTransaction" component={AddTransactionScreen} options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="AddSubscription" component={AddSubscriptionScreen} options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="AddGoal" component={AddGoalScreen} options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
