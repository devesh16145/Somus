import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { themes, font, accent } from '../theme';
import { useStore } from '../store';
import LiquidIcon from '../components/LiquidIcons';

// ==========================================
// Generic Placeholder Screens for 'Add' flows
// ==========================================

function GenericAdd({ title, nav }: any) {
  const { themeMode } = useStore();
  const t = themes[themeMode];
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 20 }}>
         <TouchableOpacity onPress={() => nav.goBack()}>
           <LiquidIcon name="arrowRt" size={24} color={t.ink} style={{ transform: [{ rotate: '180deg' }] }} />
         </TouchableOpacity>
         <Text style={{ fontFamily: font.uiBold, fontSize: 18, color: t.ink, marginLeft: 16 }}>{title}</Text>
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: font.ui, color: t.mute }}>Future forms will be injected here.</Text>
      </View>
    </SafeAreaView>
  );
}

export const AddTransactionScreen = ({ navigation }: any) => <GenericAdd title="Add Transaction" nav={navigation} />;
export const AddSubscriptionScreen = ({ navigation }: any) => <GenericAdd title="Add Subscription" nav={navigation} />;
export const AddGoalScreen = ({ navigation }: any) => <GenericAdd title="Add Goal" nav={navigation} />;


// ==========================================
// Floating Action Button Component
// ==========================================

export function FAB({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity 
      activeOpacity={0.8}
      style={{
        position: 'absolute',
        bottom: 110,
        right: 24,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: accent.v,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 8,
        shadowColor: accent.v,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
      }} 
      onPress={onPress}
    >
      <LiquidIcon name="plus" size={28} color="#FFF" strokeWidth={2.5} />
    </TouchableOpacity>
  );
}
