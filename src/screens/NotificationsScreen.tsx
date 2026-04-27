import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { themes, accent, accentInk, font, alpha } from '../theme';
import { useStore } from '../store';
import LiquidIcon from '../components/LiquidIcons';

export default function NotificationsScreen() {
  const nav = useNavigation();
  const { themeMode } = useStore();
  const t = themes[themeMode];
  const aink = accentInk(themeMode);

  const [spendingAlerts, setSpendingAlerts] = useState(true);
  const [subReminders, setSubReminders] = useState(true);
  const [goalMilestones, setGoalMilestones] = useState(true);
  const [systemUpdates, setSystemUpdates] = useState(false);

  const s = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 16 },
    headerTitle: { fontFamily: font.uiBold, fontSize: 18, color: t.ink, marginLeft: 8 },
    card: { marginHorizontal: 20, marginBottom: 16, padding: 20, backgroundColor: t.surface, borderRadius: 28, borderWidth: 1, borderColor: t.rule },
    settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
    settingTitle: { fontFamily: font.uiBold, fontSize: 16, color: t.ink, marginBottom: 4 },
    settingSub: { fontFamily: font.ui, fontSize: 13, color: t.mute, maxWidth: '85%' }
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={s.header}>
         <TouchableOpacity onPress={() => nav.goBack()} style={{ padding: 4 }}>
           <LiquidIcon name="arrowRt" size={24} color={t.ink} style={{ transform: [{ rotate: '180deg' }] }} />
         </TouchableOpacity>
         <Text style={s.headerTitle}>Notifications</Text>
      </View>
      
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={s.card}>
           <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
             <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: alpha(aink, 0.15), alignItems: 'center', justifyContent: 'center' }}>
               <LiquidIcon name="bolt" size={20} color={aink} />
             </View>
             <View style={{ flex: 1 }}>
               <Text style={{ fontFamily: font.uiBold, fontSize: 16, color: t.ink }}>Alert Preferences</Text>
               <Text style={{ fontFamily: font.ui, fontSize: 12, color: t.inkDim }}>Manage your spending pulses</Text>
             </View>
           </View>

           <View style={[s.settingRow, { borderBottomWidth: 1, borderBottomColor: t.rule }]}>
             <View style={{ flex: 1 }}>
               <Text style={s.settingTitle}>Spending Alerts</Text>
               <Text style={s.settingSub}>Trigger warnings when approaching budget limits or high spend days.</Text>
             </View>
             <Switch value={spendingAlerts} onValueChange={setSpendingAlerts} trackColor={{ true: aink }} />
           </View>

           <View style={[s.settingRow, { borderBottomWidth: 1, borderBottomColor: t.rule }]}>
             <View style={{ flex: 1 }}>
               <Text style={s.settingTitle}>Subscription Reminders</Text>
               <Text style={s.settingSub}>Notify me 3 days before major subscription renewals.</Text>
             </View>
             <Switch value={subReminders} onValueChange={setSubReminders} trackColor={{ true: aink }} />
           </View>

           <View style={[s.settingRow, { borderBottomWidth: 1, borderBottomColor: t.rule }]}>
             <View style={{ flex: 1 }}>
               <Text style={s.settingTitle}>Goal Milestones</Text>
               <Text style={s.settingSub}>Celebrate when you cross 25%, 50%, and 100% of a saving goal.</Text>
             </View>
             <Switch value={goalMilestones} onValueChange={setGoalMilestones} trackColor={{ true: aink }} />
           </View>

           <View style={s.settingRow}>
             <View style={{ flex: 1 }}>
               <Text style={s.settingTitle}>System Updates</Text>
               <Text style={s.settingSub}>Receive engineering pings for AI optimization checks and backups.</Text>
             </View>
             <Switch value={systemUpdates} onValueChange={setSystemUpdates} trackColor={{ true: aink }} />
           </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
