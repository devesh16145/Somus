// src/screens/AddBudgetScreen.tsx
// ─────────────────────────────────────────────────────────────
import React, { useMemo, useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { themes, font, accent, accentInk, alpha } from '../theme';
import { useStore } from '../store';
import LiquidIcon, { CAT_ICON } from '../components/LiquidIcons';
import { PressableScale } from '../components/VaultAnimations';
import { BudgetRepository } from '../database/BudgetRepository';
import { BudgetEngine } from '../services/BudgetEngine';
import { CATEGORY_LABELS } from '../types/Transaction';
import { TxCategory } from '../modules/LeapModule';
import { currencySymbolFor, CURRENCY_OPTIONS, GoalCurrency } from '../types/Goal';
import { Budget } from '../types/Budget';

type RouteParams = { budget?: Budget };

export default function AddBudgetScreen({ navigation, route }: any) {
  const existing: Budget | undefined = route?.params?.budget;
  const { themeMode, setActiveBudget } = useStore();
  const t = themes[themeMode];
  const aink = accentInk(themeMode);

  const suggested = useMemo(() => BudgetEngine.suggestFromHistory(3), []);

  const [name, setName] = useState(existing?.name ?? 'Monthly budget');
  const [limit, setLimit] = useState(existing ? String(existing.monthlyLimit) : '');
  const [currency, setCurrency] = useState<GoalCurrency>((existing?.currency as GoalCurrency) ?? 'INR');
  const [caps, setCaps] = useState<Partial<Record<TxCategory, string>>>(
    Object.fromEntries(
      Object.entries(existing?.categoryCaps ?? {}).map(([k, v]) => [k, String(v)]),
    ) as any,
  );
  const [excludeTransfers, setExcludeTransfers] = useState(existing?.excludeTransfers ?? true);
  const [excludeRefunds, setExcludeRefunds] = useState(existing?.excludeRefunds ?? true);

  function applySuggested() {
    if (suggested > 0) setLimit(String(suggested));
  }

  function applySuggestedCaps() {
    const lim = parseFloat(limit);
    if (!lim || lim <= 0) { Alert.alert('Set a monthly limit first'); return; }
    const sug = BudgetEngine.suggestCategoryCaps(3, lim);
    const next: Partial<Record<TxCategory, string>> = { ...caps };
    for (const [k, v] of Object.entries(sug)) next[k as TxCategory] = String(v);
    setCaps(next);
  }

  function save() {
    const lim = parseFloat(limit);
    if (!name.trim()) { Alert.alert('Enter a budget name'); return; }
    if (!lim || lim <= 0) { Alert.alert('Enter a valid monthly limit'); return; }

    const categoryCaps: Partial<Record<TxCategory, number>> = {};
    for (const [k, v] of Object.entries(caps)) {
      const n = parseFloat(v as string);
      if (n && n > 0) categoryCaps[k as TxCategory] = n;
    }

    if (existing) {
      BudgetRepository.update(existing.id, {
        name: name.trim(), monthlyLimit: lim, currency,
        categoryCaps, excludeTransfers, excludeRefunds,
      });
      setActiveBudget({ ...existing, name: name.trim(), monthlyLimit: lim, currency, categoryCaps, excludeTransfers, excludeRefunds });
    } else {
      const created = BudgetRepository.insert({
        name: name.trim(), monthlyLimit: lim, currency,
        categoryCaps, excludeTransfers, excludeRefunds, isActive: true,
      });
      setActiveBudget(created);
    }
    navigation.goBack();
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={[s.topBar, { borderBottomColor: t.rule }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.iconBtn}>
            <View style={{ transform: [{ rotate: '180deg' }] }}>
              <LiquidIcon name="chevron" size={22} color={t.ink} />
            </View>
          </TouchableOpacity>
          <Text style={[s.title, { color: t.ink }]}>{existing ? 'Edit budget' : 'New budget'}</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140 }} keyboardShouldPersistTaps="handled">

          <Label t={t} text="NAME" />
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Monthly budget"
            placeholderTextColor={t.mute}
            style={inputStyle(t)}
          />

          <Label t={t} text="MONTHLY LIMIT" />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={{ fontFamily: font.display, fontSize: 28, color: t.inkDim }}>{currencySymbolFor(currency)}</Text>
            <TextInput
              value={limit}
              onChangeText={setLimit}
              placeholder="0"
              placeholderTextColor={t.mute}
              keyboardType="numeric"
              style={[inputLgStyle(t), { flex: 1 }]}
            />
          </View>
          {suggested > 0 && (
            <TouchableOpacity onPress={applySuggested} activeOpacity={0.7} style={[s.chip, { backgroundColor: alpha(accent.v, 0.14), marginTop: 10, alignSelf: 'flex-start' }]}>
              <LiquidIcon name="refresh" size={11} color={accent.v} />
              <Text style={{ fontFamily: font.monoBold, fontSize: 11, color: aink }}>
                Suggest {currencySymbolFor(currency)}{suggested.toLocaleString()}
              </Text>
            </TouchableOpacity>
          )}

          <Label t={t} text="OPTIONS" />
          <ToggleRow
            t={t} aink={aink}
            icon="dots"
            label="Exclude transfers"
            sub="Self-transfers won't count against budget"
            value={excludeTransfers}
            onChange={setExcludeTransfers}
          />
          <ToggleRow
            t={t} aink={aink}
            icon="refresh"
            label="Exclude refunds"
            sub="Refund credits won't be treated as income"
            value={excludeRefunds}
            onChange={setExcludeRefunds}
          />

          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 28, marginBottom: 8 }}>
            <Text style={[s.sectionLabel, { color: t.mute }]}>CATEGORY CAPS · OPTIONAL</Text>
            <TouchableOpacity onPress={applySuggestedCaps} activeOpacity={0.7}>
              <Text style={{ fontFamily: font.monoBold, fontSize: 11, color: aink }}>&gt; suggest</Text>
            </TouchableOpacity>
          </View>
          <Text style={{ fontFamily: font.ui, fontSize: 12, color: t.mute, marginBottom: 12, lineHeight: 17 }}>
            Set limits for categories you want to watch. Leave blank to skip.
          </Text>

          {(Object.keys(CATEGORY_LABELS) as TxCategory[]).map((cat) => (
            <View key={cat} style={[s.capRow, { borderBottomColor: t.rule }]}>
              <View style={[s.capIcon, { backgroundColor: t.chipBg }]}>
                <LiquidIcon name={CAT_ICON[cat] ?? 'dots'} size={14} color={t.ink} />
              </View>
              <Text style={{ flex: 1, fontFamily: font.ui, fontSize: 14, color: t.ink }}>
                {CATEGORY_LABELS[cat]}
              </Text>
              <Text style={{ fontFamily: font.mono, fontSize: 12, color: t.mute, marginRight: 4 }}>
                {currencySymbolFor(currency)}
              </Text>
              <TextInput
                value={caps[cat] ?? ''}
                onChangeText={(v) => setCaps({ ...caps, [cat]: v })}
                placeholder="—"
                placeholderTextColor={t.mute}
                keyboardType="numeric"
                style={{
                  width: 86, textAlign: 'right',
                  fontFamily: font.monoBold, fontSize: 14, color: t.ink,
                  paddingVertical: 4,
                }}
              />
            </View>
          ))}

        </ScrollView>

        <View style={[s.footer, { backgroundColor: t.bg, borderTopColor: t.rule }]}>
          <PressableScale onPress={save} style={[s.saveBtn, { backgroundColor: accent.v }]}>
            <Text style={{ fontFamily: font.uiBold, fontSize: 14, color: '#051911' }}>
              {existing ? 'Save changes' : 'Create budget'}
            </Text>
          </PressableScale>
        </View>
      </SafeAreaView>
    </View>
  );
}

const Label = ({ t, text }: { t: any; text: string }) => (
  <Text style={[s.sectionLabel, { color: t.mute, marginTop: 22 }]}>{text}</Text>
);

const ToggleRow = ({ t, aink, icon, label, sub, value, onChange }: any) => (
  <View style={[s.toggleRow, { borderBottomColor: t.rule }]}>
    <View style={[s.capIcon, { backgroundColor: t.chipBg }]}>
      <LiquidIcon name={icon} size={14} color={t.ink} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={{ fontFamily: font.uiBold, fontSize: 14, color: t.ink }}>{label}</Text>
      <Text style={{ fontFamily: font.ui, fontSize: 11, color: t.mute, marginTop: 2 }}>{sub}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onChange}
      thumbColor={value ? accent.v : '#f0f0f0'}
      trackColor={{ false: alpha(t.mute, 0.3), true: alpha(accent.v, 0.35) }}
    />
  </View>
);

const inputStyle = (t: any) => ({
  fontFamily: font.ui, fontSize: 15, color: t.ink,
  paddingVertical: 10, paddingHorizontal: 0,
  borderBottomWidth: 1, borderBottomColor: t.rule, marginTop: 10,
});

const inputLgStyle = (t: any) => ({
  fontFamily: font.display, fontSize: 34, color: t.ink,
  paddingVertical: 6, paddingHorizontal: 0,
  borderBottomWidth: 1, borderBottomColor: t.rule, marginTop: 4,
});

const s = StyleSheet.create({
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 8, paddingVertical: 10, borderBottomWidth: 1,
  },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: font.display, fontSize: 22, letterSpacing: -0.4 },
  sectionLabel: { fontFamily: font.monoBold, fontSize: 10, letterSpacing: 1.5 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 100,
  },
  capRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1,
  },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1,
  },
  capIcon: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  footer: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24,
    borderTopWidth: 1,
  },
  saveBtn: {
    height: 52, borderRadius: 100,
    alignItems: 'center', justifyContent: 'center',
  },
});
