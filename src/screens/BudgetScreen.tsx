// src/screens/BudgetScreen.tsx
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { themes, font, accent, accentInk, alpha } from '../theme';
import { useStore } from '../store';
import LiquidIcon, { CAT_ICON } from '../components/LiquidIcons';
import { PressableScale, StaggerFade } from '../components/VaultAnimations';
import { BudgetRepository } from '../database/BudgetRepository';
import { BudgetEngine } from '../services/BudgetEngine';
import { CATEGORY_LABELS } from '../types/Transaction';
import { currencySymbolFor, GoalCurrency } from '../types/Goal';
import { RootStackParams } from '../App';

type Nav = NativeStackNavigationProp<RootStackParams>;

export default function BudgetScreen() {
  const nav = useNavigation<Nav>();
  const { themeMode, activeBudget, setActiveBudget, transactions } = useStore();
  const t = themes[themeMode];
  const aink = accentInk(themeMode);

  useFocusEffect(
    React.useCallback(() => {
      setActiveBudget(BudgetRepository.getActive());
    }, []),
  );

  const status = useMemo(() => {
    if (!activeBudget) return null;
    return BudgetEngine.computeStatus(activeBudget, transactions, new Date());
  }, [activeBudget, transactions]);

  function handleDelete() {
    if (!activeBudget) return;
    Alert.alert('Delete budget?', activeBudget.name, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: () => {
          BudgetRepository.delete(activeBudget.id);
          setActiveBudget(null);
        },
      },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={s.topBar}>
          <Text style={[s.title, { color: t.ink }]}>Budget</Text>
          {activeBudget && (
            <TouchableOpacity onPress={handleDelete} style={s.iconBtn} activeOpacity={0.7}>
              <LiquidIcon name="dots" size={18} color={t.inkDim} />
            </TouchableOpacity>
          )}
        </View>

        {!activeBudget ? (
          <EmptyState t={t} aink={aink} onCreate={() => nav.navigate('AddBudget')} />
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
            <View style={s.hero}>
              <Text style={[s.budgetName, { color: t.mute }]}>{activeBudget.name.toUpperCase()}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 6 }}>
                <Text style={[s.heroCurr, { color: t.inkDim }]}>{currencySymbolFor(activeBudget.currency as GoalCurrency)}</Text>
                <Text style={[s.heroAmt, { color: t.ink }]}>
                  {Math.round(status!.spent).toLocaleString()}
                </Text>
                <Text style={[s.heroLimit, { color: t.inkDim }]}>
                  / {Math.round(status!.limit).toLocaleString()}
                </Text>
              </View>

              <Text style={[s.heroSubtitle, { color: t.inkDim }]}>
                <Text style={{ color: t.ink }}>
                  {currencySymbolFor(activeBudget.currency as GoalCurrency)}{Math.round(status!.remaining).toLocaleString()}
                </Text>
                {' left · ~'}
                {currencySymbolFor(activeBudget.currency as GoalCurrency)}{Math.round(status!.perDayAvailable).toLocaleString()}
                {'/day for '}
                {Math.max(0, status!.daysInMonth - status!.daysElapsed)}
                {' days'}
              </Text>

              <View style={[s.barBg, { backgroundColor: t.chipBg }]}>
                <View style={[s.barFill, { width: `${Math.min(100, status!.percentUsed)}%` }]} />
              </View>

              <View style={s.paceRow}>
                <Text style={[s.paceLabel, { color: t.mute }]}>
                  Day {status!.daysElapsed} of {status!.daysInMonth}
                </Text>
                <Text style={[s.paceLabel, { color: paceColor(status!.pace, aink, t) }]}>
                  {paceLabel(status!.pace)}
                </Text>
              </View>
            </View>

            <View style={[s.optionsCard, { backgroundColor: t.surface, borderColor: t.rule }]}>
              <OptionRow t={t} label="Exclude transfers" value={activeBudget.excludeTransfers} />
              <View style={[s.hr, { backgroundColor: t.rule }]} />
              <OptionRow t={t} label="Exclude refunds" value={activeBudget.excludeRefunds} />
            </View>

            <View style={s.section}>
              <View style={s.sectionHeader}>
                <Text style={[s.sectionTitle, { color: t.ink }]}>Category caps</Text>
                <TouchableOpacity onPress={() => nav.navigate('AddBudget', { budget: activeBudget } as any)} activeOpacity={0.7}>
                  <Text style={[s.sectionLink, { color: aink }]}>&gt; edit</Text>
                </TouchableOpacity>
              </View>

              {status!.perCategory.length === 0 && (
                <Text style={{ fontFamily: font.ui, fontSize: 13, color: t.mute, paddingVertical: 16 }}>
                  No spending recorded this month yet.
                </Text>
              )}

              {status!.perCategory.map((c, idx) => (
                <StaggerFade key={c.category} index={idx}>
                  <View style={[s.capRow, { borderBottomColor: t.rule }]}>
                    <View style={[s.capIcon, { backgroundColor: t.chipBg }]}>
                      <LiquidIcon name={CAT_ICON[c.category] ?? 'dots'} size={14} color={t.ink} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[s.capCat, { color: t.ink }]} numberOfLines={1}>
                        {CATEGORY_LABELS[c.category] ?? c.category}
                      </Text>
                      {c.cap !== null && (
                        <View style={[s.capBarBg, { backgroundColor: t.chipBg }]}>
                          <View style={[
                            s.capBarFill,
                            { width: `${Math.min(100, c.percentUsed)}%`, backgroundColor: capColor(c.status, aink) },
                          ]} />
                        </View>
                      )}
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[s.capAmount, { color: t.ink }]}>
                        {currencySymbolFor(activeBudget.currency as GoalCurrency)}{Math.round(c.spent).toLocaleString()}
                      </Text>
                      {c.cap !== null ? (
                        <Text style={[s.capMeta, { color: capColor(c.status, aink) }]}>
                          of {Math.round(c.cap).toLocaleString()} · {Math.round(c.percentUsed)}%
                        </Text>
                      ) : (
                        <Text style={[s.capMeta, { color: t.mute }]}>no cap</Text>
                      )}
                    </View>
                  </View>
                </StaggerFade>
              ))}
            </View>
          </ScrollView>
        )}

        {activeBudget && (
          <PressableScale
            onPress={() => nav.navigate('AddBudget', { budget: activeBudget } as any)}
            style={[s.fab, { backgroundColor: accent.v }]}
          >
            <LiquidIcon name="plus" size={22} color="#051911" strokeWidth={2.5} />
          </PressableScale>
        )}
      </SafeAreaView>
    </View>
  );
}

function EmptyState({ t, aink, onCreate }: { t: any; aink: string; onCreate: () => void }) {
  return (
    <View style={{ flex: 1, paddingHorizontal: 24, paddingBottom: 120, justifyContent: 'center' }}>
      <View style={{ alignItems: 'center' }}>
        <View style={{
          width: 64, height: 64, borderRadius: 32,
          backgroundColor: alpha(accent.v, 0.13),
          alignItems: 'center', justifyContent: 'center',
          marginBottom: 20,
        }}>
          <LiquidIcon name="target" size={28} color={accent.v} strokeWidth={1.8} />
        </View>
        <Text style={{ fontFamily: font.display, fontSize: 26, color: t.ink, letterSpacing: -0.5, textAlign: 'center' }}>
          Set a budget
        </Text>
        <Text style={{ fontFamily: font.displayItalic, fontSize: 14, color: t.inkDim, textAlign: 'center', marginTop: 8, lineHeight: 21, paddingHorizontal: 20 }}>
          Track your month against a limit. Somus can suggest one from your last 3 months of spending.
        </Text>
        <PressableScale onPress={onCreate} style={{
          marginTop: 28, height: 48, paddingHorizontal: 22, borderRadius: 100,
          backgroundColor: accent.v, flexDirection: 'row', alignItems: 'center', gap: 8,
        }}>
          <Text style={{ fontFamily: font.uiBold, fontSize: 14, color: '#051911' }}>Create budget</Text>
          <LiquidIcon name="chevron" size={16} color="#051911" strokeWidth={2.5} />
        </PressableScale>
      </View>
    </View>
  );
}

function OptionRow({ t, label, value }: { t: any; label: string; value: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 14 }}>
      <Text style={{ fontFamily: font.ui, fontSize: 13, color: t.ink }}>{label}</Text>
      <Text style={{ fontFamily: font.monoBold, fontSize: 10, color: value ? accent.v : t.mute, letterSpacing: 1 }}>
        {value ? 'ON' : 'OFF'}
      </Text>
    </View>
  );
}

function paceLabel(p: string) {
  return p === 'on_track' ? 'on track' : p === 'overspending' ? 'overspending' : 'underspending';
}
function paceColor(p: string, aink: string, t: any) {
  return p === 'on_track' ? aink : p === 'overspending' ? '#E06B4A' : t.inkDim;
}
function capColor(status: string, aink: string) {
  return status === 'over' ? '#E06B4A' : status === 'near' ? '#D89A2A' : aink;
}

const s = StyleSheet.create({
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  title: { fontFamily: font.display, fontSize: 26, letterSpacing: -0.6 },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18 },

  hero: { paddingHorizontal: 22, paddingTop: 14, paddingBottom: 8 },
  budgetName: { fontFamily: font.monoBold, fontSize: 10, letterSpacing: 2 },
  heroCurr: { fontFamily: font.ui, fontSize: 22 },
  heroAmt: { fontFamily: font.display, fontSize: 58, letterSpacing: -2.5, lineHeight: 64 },
  heroLimit: { fontFamily: font.mono, fontSize: 16, marginLeft: 6 },
  heroSubtitle: { fontFamily: font.displayItalic, fontSize: 13, marginTop: 10, lineHeight: 20 },

  barBg: { height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 16 },
  barFill: { height: '100%', borderRadius: 3, backgroundColor: accent.v },

  paceRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  paceLabel: { fontFamily: font.mono, fontSize: 10 },

  optionsCard: { marginTop: 22, marginHorizontal: 16, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  hr: { height: 1 },

  section: { paddingHorizontal: 20, marginTop: 26 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 },
  sectionTitle: { fontFamily: font.uiBold, fontSize: 16, letterSpacing: -0.3 },
  sectionLink: { fontFamily: font.mono, fontSize: 10 },

  capRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1,
  },
  capIcon: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  capCat: { fontFamily: font.ui, fontSize: 14 },
  capBarBg: { height: 3, borderRadius: 2, overflow: 'hidden', marginTop: 6 },
  capBarFill: { height: '100%', borderRadius: 2 },
  capAmount: { fontFamily: font.monoBold, fontSize: 13, fontVariant: ['tabular-nums'] },
  capMeta: { fontFamily: font.mono, fontSize: 10, marginTop: 2 },

  fab: {
    position: 'absolute', bottom: 100, right: 24,
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
    elevation: 8,
    shadowColor: accent.v, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 10,
  },
});
