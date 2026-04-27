import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { LiquidDialog } from '../components/LiquidDialog';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { useFocusEffect } from '@react-navigation/native';

import { useStore } from '../store';
import { themes, accent, accentInk, font, alpha } from '../theme';
import LiquidIcon from '../components/LiquidIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParams } from '../App';
import { FAB, TopBar } from '../components/ActionViews';
import { GoalRepository } from '../database/GoalRepository';
import { Goal, currencySymbolFor, computeLoanProgress, LoanMeta } from '../types/Goal';

export default function GoalsScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParams>>();
  const { goals, setGoals, themeMode } = useStore();
  const t = themes[themeMode];
  const aink = accentInk(themeMode);

  const [addFundsModal, setAddFundsModal] = useState<Goal | null>(null);
  const [fundsAmount, setFundsAmount] = useState('');

  useFocusEffect(
    useCallback(() => {
      setGoals(GoalRepository.getAll());
    }, [])
  );

  const primary = goals.find(g => g.isPrimary) ?? goals[0] ?? null;
  const others = goals.filter(g => g.id !== primary?.id);
  const completed = goals.filter(g => g.completedAt != null);

  function getProgress(g: Goal): number {
    if (g.template === 'loan' && g.metadata) {
      try { return computeLoanProgress(JSON.parse(g.metadata)); } catch {}
    }
    if (g.targetAmount <= 0) return 0;
    return Math.min(100, Math.round((g.savedAmount / g.targetAmount) * 100));
  }

  function handleAddFunds() {
    if (!addFundsModal) return;
    const amt = parseFloat(fundsAmount);
    if (!amt || amt <= 0) { LiquidDialog.alert('Enter a valid amount'); return; }
    GoalRepository.addFunds(addFundsModal.id, amt);
    setGoals(GoalRepository.getAll());
    setAddFundsModal(null);
    setFundsAmount('');
  }

  function handleSetPrimary(g: Goal) {
    GoalRepository.setPrimary(g.id);
    setGoals(GoalRepository.getAll());
  }

  function handleDelete(g: Goal) {
    LiquidDialog.show({
      title: 'Delete Goal',
      message: `Remove "${g.name}"?`,
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          GoalRepository.delete(g.id);
          setGoals(GoalRepository.getAll());
        }},
      ],
    });
  }

  const s = getStyles(t, aink);

  // SVG Circular Progress
  const radius = 64;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const primaryPct = primary ? getProgress(primary) : 0;
  const strokeDashoffset = circumference - (primaryPct / 100) * circumference;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top']}>
      <TopBar />
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

        <View style={s.hero}>
          <Text style={s.heroLabel}>Your Aspirations</Text>
          <View style={s.heroRow}>
            <Text style={s.heroAmount}>
              {goals.length > 0
                ? `${Math.round(goals.reduce((sum, g) => sum + getProgress(g), 0) / goals.length)}%`
                : '0'}
            </Text>
            <View style={s.heroPill}>
              <Text style={s.heroPillText}>{goals.length} active</Text>
            </View>
          </View>
        </View>

        {/* ── Primary Goal Card ── */}
        {primary && (
          <View style={[s.card, { alignItems: 'center' }]}>
            <View style={{ width: 160, height: 160, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <Svg width={160} height={160} style={{ position: 'absolute' }}>
                <Circle cx="80" cy="80" r={radius} stroke={alpha(accent.v, 0.15)} strokeWidth={strokeWidth} fill="none" />
                <Circle
                  cx="80" cy="80" r={radius}
                  stroke={accent.v} strokeWidth={strokeWidth} fill="none"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  transform="rotate(-90 80 80)"
                />
              </Svg>
              <Text style={{ fontFamily: font.display, fontSize: 36, color: t.ink, letterSpacing: -1 }}>{primaryPct}%</Text>
              <Text style={{ fontFamily: font.monoBold, fontSize: 9, color: t.mute, letterSpacing: 1, marginTop: 4 }}>COMPLETE</Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: alpha(accent.v, 0.2), paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, marginBottom: 16 }}>
              <LiquidIcon name="star" size={12} color={aink} />
              <Text style={{ fontFamily: font.monoBold, fontSize: 10, color: aink, marginLeft: 6, letterSpacing: 0.5 }}>PRIMARY TARGET</Text>
            </View>

            <Text style={{ fontFamily: font.uiBold, fontSize: 22, color: t.ink, marginBottom: 8 }}>{primary.name}</Text>

            <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 8 }}>
              <Text style={{ fontFamily: font.display, fontSize: 32, fontWeight: '500', color: t.ink, letterSpacing: -1 }}>
                {currencySymbolFor(primary.currency)}{Math.round(primary.savedAmount).toLocaleString()}
              </Text>
              <Text style={{ fontFamily: font.mono, fontSize: 14, color: t.mute, marginLeft: 8 }}>
                / {currencySymbolFor(primary.currency)}{Math.round(primary.targetAmount).toLocaleString()}
              </Text>
            </View>

            {/* Priority badge */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: primary.priority === 'high' ? '#ef4444' : primary.priority === 'medium' ? accent.v : '#94a3b8', marginRight: 6 }} />
              <Text style={{ fontFamily: font.mono, fontSize: 10, color: t.mute, textTransform: 'uppercase' }}>{primary.priority} priority</Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
              <TouchableOpacity style={s.btnPrimary} onPress={() => { setAddFundsModal(primary); setFundsAmount(''); }}>
                <Text style={s.btnPrimaryText}>Add Funds</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.btnSecondary} onPress={() => nav.navigate('AddGoal', { goalId: primary.id })}>
                <Text style={s.btnSecondaryText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.btnSecondary} onPress={() => handleDelete(primary)}>
                <Text style={s.btnSecondaryText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Empty state ── */}
        {!primary && (
          <View style={[s.card, { alignItems: 'center', paddingVertical: 40 }]}>
            <LiquidIcon name="target" size={48} color={t.mute} strokeWidth={1.2} />
            <Text style={{ fontFamily: font.uiBold, fontSize: 18, color: t.ink, marginTop: 16, marginBottom: 8 }}>No goals yet</Text>
            <Text style={{ fontFamily: font.ui, fontSize: 14, color: t.mute, textAlign: 'center', lineHeight: 22 }}>
              Tap the + button to create your first savings goal, loan tracker, or travel fund.
            </Text>
          </View>
        )}

        {/* ── Other Goals ── */}
        {others.filter(g => !g.completedAt).length > 0 && (
          <View style={{ paddingHorizontal: 20 }}>
            {others.filter(g => !g.completedAt).map(g => (
              <GoalRow
                key={g.id} goal={g}
                pct={getProgress(g)}
                t={t}
                onAddFunds={() => { setAddFundsModal(g); setFundsAmount(''); }}
                onSetPrimary={() => handleSetPrimary(g)}
                onEdit={() => nav.navigate('AddGoal', { goalId: g.id })}
                onDelete={() => handleDelete(g)}
              />
            ))}
          </View>
        )}

        {/* ── Completed ── */}
        {completed.length > 0 && (
          <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
            <Text style={{ fontFamily: font.monoBold, fontSize: 10, color: t.mute, letterSpacing: 1, marginBottom: 12 }}>COMPLETED</Text>
            {completed.map(g => (
              <View key={g.id} style={[s.card, { backgroundColor: alpha('#a3e635', 0.1), alignItems: 'center', marginHorizontal: 0 }]}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: alpha('#a3e635', 0.3), alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <LiquidIcon name="check" size={24} color="#3f6212" strokeWidth={2.5} />
                </View>
                <Text style={{ fontFamily: font.uiBold, fontSize: 18, color: '#3f6212', marginBottom: 4 }}>{g.name}</Text>
                <Text style={{ fontFamily: font.display, fontSize: 22, color: '#3f6212' }}>
                  {currencySymbolFor(g.currency)}{Math.round(g.targetAmount).toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <FAB onPress={() => nav.navigate('AddGoal')} />

      {/* ── Add Funds Modal ── */}
      <Modal visible={!!addFundsModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: t.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 }}>
            <Text style={{ fontFamily: font.uiBold, fontSize: 18, color: t.ink, marginBottom: 20 }}>
              Add Funds to "{addFundsModal?.name}"
            </Text>
            <TextInput
              style={{ fontFamily: font.display, fontSize: 36, color: t.ink, backgroundColor: t.surface, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: t.rule, letterSpacing: -1, marginBottom: 20 }}
              value={fundsAmount} onChangeText={setFundsAmount}
              placeholder="0" placeholderTextColor={t.mute}
              keyboardType="decimal-pad" autoFocus
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity style={{ flex: 1, paddingVertical: 16, borderRadius: 100, alignItems: 'center', backgroundColor: t.chipBg }} onPress={() => setAddFundsModal(null)}>
                <Text style={{ fontFamily: font.uiBold, fontSize: 16, color: t.inkDim }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, paddingVertical: 16, borderRadius: 100, alignItems: 'center', backgroundColor: accent.v }} onPress={handleAddFunds}>
                <Text style={{ fontFamily: font.uiBold, fontSize: 16, color: '#051911' }}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── Goal Row Card ──
function GoalRow({ goal, pct, t, onAddFunds, onSetPrimary, onEdit, onDelete }: {
  goal: Goal; pct: number; t: any;
  onAddFunds: () => void; onSetPrimary: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const iconMap: Record<string, string> = { home: 'home', car: 'car', plane: 'plane', shield: 'shield', bag: 'bag' };
  const iconName = iconMap[goal.icon] || 'disc';
  const priorityColor = goal.priority === 'high' ? '#ef4444' : goal.priority === 'medium' ? accent.v : '#94a3b8';

  return (
    <View style={{
      backgroundColor: alpha(accent.v, 0.05), borderRadius: 24, padding: 16, marginBottom: 16,
      flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: t.rule,
    }}>
      <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center' }}>
        <LiquidIcon name={iconName as any} size={28} color={accent.v} strokeWidth={1.5} />
      </View>
      <View style={{ flex: 1, marginLeft: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ fontFamily: font.uiBold, fontSize: 15, color: t.ink, flex: 1 }} numberOfLines={1}>{goal.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: priorityColor }} />
            <Text style={{ fontFamily: font.monoBold, fontSize: 12, color: accent.v }}>{pct}%</Text>
          </View>
        </View>
        <View style={{ height: 6, backgroundColor: t.chipBg, borderRadius: 3, marginBottom: 10, overflow: 'hidden' }}>
          <View style={{ width: `${pct}%`, height: '100%', backgroundColor: accent.v, borderRadius: 3 }} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontFamily: font.mono, fontSize: 9, color: t.mute, letterSpacing: 0.5 }}>
            {currencySymbolFor(goal.currency)} {Math.round(goal.savedAmount).toLocaleString()} SAVED
          </Text>
          <Text style={{ fontFamily: font.mono, fontSize: 9, color: t.mute, letterSpacing: 0.5 }}>
            {currencySymbolFor(goal.currency)} {Math.round(goal.targetAmount).toLocaleString()} TARGET
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <TouchableOpacity onPress={onAddFunds} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, backgroundColor: alpha(accent.v, 0.15) }}>
            <Text style={{ fontFamily: font.monoBold, fontSize: 9, color: accent.v }}>+ FUNDS</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onEdit} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, backgroundColor: t.chipBg }}>
            <Text style={{ fontFamily: font.monoBold, fontSize: 9, color: t.inkDim }}>EDIT</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onSetPrimary} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, backgroundColor: t.chipBg }}>
            <Text style={{ fontFamily: font.monoBold, fontSize: 9, color: t.inkDim }}>★ PRIMARY</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, backgroundColor: alpha('#ef4444', 0.1) }}>
            <Text style={{ fontFamily: font.monoBold, fontSize: 9, color: '#ef4444' }}>DELETE</Text>
          </TouchableOpacity>
        </View>
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
    heroPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ecfccb', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginLeft: 14 },
    heroPillText: { fontFamily: font.monoBold, fontSize: 10, color: '#4d7c0f', letterSpacing: 0.5 },
    card: { marginHorizontal: 20, marginBottom: 16, padding: 24, backgroundColor: t.surface, borderRadius: 28, borderWidth: 1, borderColor: t.rule },
    cardTitle: { fontFamily: font.uiBold, fontSize: 16, color: t.ink },
    btnPrimary: { flex: 1.2, backgroundColor: accent.v, paddingVertical: 14, borderRadius: 100, alignItems: 'center' },
    btnPrimaryText: { fontFamily: font.uiBold, fontSize: 13, color: t.bg },
    btnSecondary: { flex: 1, backgroundColor: alpha(accent.v, 0.1), paddingVertical: 14, borderRadius: 100, alignItems: 'center' },
    btnSecondaryText: { fontFamily: font.uiBold, fontSize: 13, color: aink },
  });
}
