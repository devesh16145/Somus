import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { useStore } from '../store';
import { themes, accent, accentInk, font, alpha } from '../theme';
import LiquidIcon from '../components/LiquidIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParams } from '../App';
import { FAB } from '../components/ActionViews';
import { TransactionRepository } from '../database/TransactionRepository';
import { Transaction, effectiveCategory } from '../types/Transaction';

export default function SubscriptionsScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParams>>();
  const { transactions, themeMode } = useStore();
  const t = themes[themeMode];
  const aink = accentInk(themeMode);

  // Filter subscription transactions from the global store
  const subs = transactions.filter(tx => effectiveCategory(tx) === 'SUBSCRIPTION');

  const s = getStyles(t, aink);

  const totalMonthly = subs.reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>Subscriptions</Text>
          <TouchableOpacity>
            <LiquidIcon name="cog" size={24} color={aink} />
          </TouchableOpacity>
        </View>

        {/* Hero */}
        <View style={s.hero}>
          <Text style={s.heroLabel}>Active Subscriptions</Text>
          <View style={s.heroRow}>
            <Text style={s.heroAmount}>₹{Math.round(totalMonthly).toLocaleString()}</Text>
            <View style={s.heroPill}>
              <Text style={s.heroPillText}>{subs.length} active</Text>
            </View>
          </View>
        </View>

        {/* Your Subscriptions (from DB) */}
        {subs.length > 0 && (
          <View style={{ paddingHorizontal: 20, paddingTop: 4 }}>
            <Text style={[s.cardTitle, { marginBottom: 12 }]}>Your Subscriptions</Text>
            {subs.map((tx) => (
              <ServiceRow
                key={tx.id} t={t}
                icon="disc" iconColor={aink} bg={alpha(aink, 0.1)}
                name={tx.merchant}
                sub={new Date(tx.smsDate).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                amount={`₹${tx.amount.toLocaleString()}`}
                cycle={tx.type === 'DEBIT' ? 'Recurring' : 'One-time'}
              />
            ))}
          </View>
        )}

        {/* Suggestion Card */}
        <View style={[s.card, { backgroundColor: alpha(aink, 0.05) }]}>
          <View style={s.cardHeader}>
            <LiquidIcon name="sun" size={18} color={aink} />
            <Text style={[s.cardTitle, { color: aink }]}>Intelligent Suggestion</Text>
          </View>
          <Text style={s.cardDesc}>
            Add your subscriptions using the + button to track recurring expenses and get smart recommendations.
          </Text>
        </View>

      </ScrollView>
      <FAB onPress={() => nav.navigate('AddSubscription')} />
    </SafeAreaView>
  );
}

function ProgressRow({ label, amount, pct, color, t }: any) {
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={{ fontFamily: font.ui, fontSize: 13, color: t.inkDim }}>{label}</Text>
        <Text style={{ fontFamily: font.monoBold, fontSize: 13, color: t.ink }}>{amount}</Text>
      </View>
      <View style={{ height: 8, backgroundColor: t.chipBg, borderRadius: 4, overflow: 'hidden' }}>
        <View style={{ height: '100%', width: pct, backgroundColor: color, borderRadius: 4 }} />
      </View>
    </View>
  );
}

function ServiceRow({ t, icon, iconColor, bg, name, sub, subColor, amount, cycle }: any) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: t.surface, padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: t.rule }}>
      <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
        <LiquidIcon name={icon} size={20} color={iconColor} strokeWidth={2} />
      </View>
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={{ fontFamily: font.uiBold, fontSize: 15, color: t.ink, marginBottom: 2 }}>{name}</Text>
        <Text style={{ fontFamily: font.mono, fontSize: 11, color: subColor || t.mute }}>{sub}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ fontFamily: font.monoBold, fontSize: 15, color: t.ink, marginBottom: 2 }}>{amount}</Text>
        <Text style={{ fontFamily: font.mono, fontSize: 10, color: t.mute }}>{cycle}</Text>
      </View>
    </View>
  );
}

function getStyles(t: any, aink: string) {
  return StyleSheet.create({
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10 },
    headerTitle: { fontFamily: font.uiBold, fontSize: 18, color: aink },

    hero: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
    heroLabel: { fontFamily: font.uiBold, fontSize: 13, color: t.inkDim, letterSpacing: 0.5, marginBottom: 4 },
    heroRow: { flexDirection: 'row', alignItems: 'center' },
    heroAmount: { fontFamily: font.display, fontSize: 44, fontWeight: '500', color: t.ink, letterSpacing: -1.5, includeFontPadding: false },
    heroPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ecfccb', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginLeft: 14 },
    heroPillText: { fontFamily: font.uiBold, fontSize: 10, color: '#4d7c0f', marginLeft: 4 },

    card: { marginHorizontal: 20, marginBottom: 16, padding: 20, backgroundColor: t.surface, borderRadius: 24, borderWidth: 1, borderColor: t.rule },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    cardTitle: { fontFamily: font.uiBold, fontSize: 15, color: t.ink },
    cardDesc: { fontFamily: font.ui, fontSize: 13, color: t.inkDim, lineHeight: 20, marginBottom: 16 },
    cardActions: { flexDirection: 'row', gap: 10 },
    
    actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 100, alignItems: 'center', justifyContent: 'center' },
    actionBtnAlt: { flex: 0.7, backgroundColor: t.chipBg, paddingVertical: 12, borderRadius: 100, alignItems: 'center', justifyContent: 'center' },

    centerCard: { alignItems: 'center' },
    secIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: alpha('#a3e635', 0.2), alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    secBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 100, borderWidth: 1, borderColor: alpha('#000', 0.1), backgroundColor: alpha('#fff', 0.2) },
    secBtnText: { fontFamily: font.uiBold, fontSize: 12, color: '#3f6212' },
  });
}
