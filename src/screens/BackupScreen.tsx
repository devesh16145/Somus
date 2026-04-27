// src/screens/BackupScreen.tsx
// ─────────────────────────────────────────────────────────────
// Local backup & restore. Privacy-first: user picks where to save / what to load.
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useStore } from '../store';
import { themes, accent, accentInk, font, alpha } from '../theme';
import LiquidIcon from '../components/LiquidIcons';
import { LiquidDialog } from '../components/LiquidDialog';
import { BackupService } from '../services/BackupService';
import { TransactionRepository } from '../database/TransactionRepository';
import { GoalRepository } from '../database/GoalRepository';
import { BudgetRepository } from '../database/BudgetRepository';
import { PressableScale } from '../components/VaultAnimations';

type Phase = 'idle' | 'exporting' | 'importing' | 'done';

export default function BackupScreen() {
  const nav = useNavigation<any>();
  const { themeMode, setTransactions } = useStore();
  const t = themes[themeMode];
  const aink = accentInk(themeMode);

  const [phase, setPhase] = useState<Phase>('idle');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [counts, setCounts] = useState({ tx: 0, goals: 0, budgets: 0 });

  useEffect(() => { refreshCounts(); }, []);
  function refreshCounts() {
    try {
      setCounts({
        tx: TransactionRepository.getCount(),
        goals: GoalRepository.getCount(),
        budgets: BudgetRepository.getAll().length,
      });
    } catch {}
  }

  async function exportJson() {
    setPhase('exporting'); setStatusMsg('Building backup…');
    try {
      const r = await BackupService.exportJson();
      setStatusMsg(`Exported ${r.counts.tx} transactions, ${r.counts.goals} goals, ${r.counts.budgets} budgets · ${(r.bytes / 1024).toFixed(1)} KB`);
      setPhase('done');
    } catch (e: any) {
      setPhase('idle');
      LiquidDialog.alert('Export failed', e?.message ?? 'Unknown error');
    }
  }

  async function exportCsv() {
    setPhase('exporting'); setStatusMsg('Building CSV…');
    try {
      const r = await BackupService.exportCsv();
      setStatusMsg(`Exported ${r.rows} transactions · ${(r.bytes / 1024).toFixed(1)} KB`);
      setPhase('done');
    } catch (e: any) {
      setPhase('idle');
      LiquidDialog.alert('Export failed', e?.message ?? 'Unknown error');
    }
  }

  function startImport() {
    LiquidDialog.show({
      title: 'Import data',
      message: 'Pick a Somus JSON or CSV file. Existing entries with matching IDs are skipped — your current data won\u2019t be overwritten.',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Pick file', style: 'default', onPress: doImport },
      ],
    });
  }

  async function doImport() {
    setPhase('importing'); setStatusMsg('Reading file…');
    try {
      const r = await BackupService.pickAndImport();
      setStatusMsg(
        `Added ${r.added} · skipped ${r.skipped}` +
        (r.errors.length ? ` · ${r.errors.length} error(s)` : '')
      );
      // Refresh in-memory state
      const fresh = TransactionRepository.getAll(200);
      setTransactions(fresh);
      refreshCounts();
      setPhase('done');
      if (r.errors.length) {
        LiquidDialog.alert('Import completed with errors', r.errors.slice(0, 5).join('\n'));
      }
    } catch (e: any) {
      setPhase('idle');
      const msg = e?.message ?? 'Unknown error';
      if (!/cancel/i.test(msg) && !/no file selected/i.test(msg)) {
        LiquidDialog.alert('Import failed', msg);
      }
    }
  }

  const s = getStyles(t, aink, themeMode);
  const busy = phase === 'exporting' || phase === 'importing';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => nav.goBack()} style={s.backBtn} activeOpacity={0.7}>
            <LiquidIcon name="chevron" size={18} color={t.ink} style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Backup & Restore</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Snapshot */}
        <View style={s.card}>
          <Text style={s.cardTitle}>On-device data</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
            <Stat label="Transactions" value={counts.tx} t={t} aink={aink} />
            <Stat label="Goals" value={counts.goals} t={t} aink={aink} />
            <Stat label="Budgets" value={counts.budgets} t={t} aink={aink} />
          </View>
          <Text style={s.subnote}>
            Your data lives only on this device. Export a backup so you can restore after reinstall — or migrate to another finance app.
          </Text>
        </View>

        {/* Export JSON */}
        <View style={s.card}>
          <View style={s.rowBetween}>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>Full backup (JSON)</Text>
              <Text style={s.subnote}>
                Round-trip backup of transactions, goals, and budgets. Use this to restore Somus on a new device.
              </Text>
            </View>
            <View style={s.iconWrap}>
              <LiquidIcon name="download" size={20} color={aink} />
            </View>
          </View>
          <PressableScale onPress={exportJson} disabled={busy}>
            <View style={[s.primaryBtn, busy && { opacity: 0.5 }]}>
              <Text style={s.primaryBtnText}>{phase === 'exporting' ? 'Exporting…' : 'Export JSON \u2192'}</Text>
            </View>
          </PressableScale>
        </View>

        {/* Export CSV */}
        <View style={s.card}>
          <View style={s.rowBetween}>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>Transactions CSV</Text>
              <Text style={s.subnote}>
                Portable spreadsheet. Opens in Excel, Google Sheets, YNAB, Money Manager, and most finance apps.
              </Text>
            </View>
            <View style={s.iconWrap}>
              <LiquidIcon name="document" size={20} color={aink} />
            </View>
          </View>
          <PressableScale onPress={exportCsv} disabled={busy}>
            <View style={[s.secondaryBtn, busy && { opacity: 0.5 }]}>
              <Text style={s.secondaryBtnText}>{phase === 'exporting' ? 'Exporting…' : 'Export CSV \u2192'}</Text>
            </View>
          </PressableScale>
        </View>

        {/* Import */}
        <View style={s.card}>
          <View style={s.rowBetween}>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>Import</Text>
              <Text style={s.subnote}>
                Pick a Somus JSON backup or any compatible CSV (columns: date, merchant, amount, type, category). Duplicates are skipped automatically.
              </Text>
            </View>
            <View style={s.iconWrap}>
              <LiquidIcon name="upload" size={20} color={aink} />
            </View>
          </View>
          <PressableScale onPress={startImport} disabled={busy}>
            <View style={[s.secondaryBtn, busy && { opacity: 0.5 }]}>
              <Text style={s.secondaryBtnText}>{phase === 'importing' ? 'Importing…' : 'Choose file \u2192'}</Text>
            </View>
          </PressableScale>
        </View>

        {/* Status */}
        {(busy || statusMsg) && (
          <View style={[s.card, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
            {busy && <ActivityIndicator color={aink} />}
            <Text style={[s.subnote, { flex: 1, marginTop: 0, color: t.ink }]}>{statusMsg ?? '\u2014'}</Text>
          </View>
        )}

        {/* CSV schema reference */}
        <View style={[s.card, { backgroundColor: alpha(t.ink, 0.03) }]}>
          <Text style={[s.cardTitle, { fontSize: 13 }]}>CSV columns</Text>
          <Text style={s.mono}>date, iso_date, merchant, amount, type, category, currency, sender, sms_id, notes</Text>
          <Text style={[s.subnote, { marginTop: 10 }]}>
            Required for import: <Text style={{ fontFamily: font.monoBold, color: t.ink }}>amount</Text>, <Text style={{ fontFamily: font.monoBold, color: t.ink }}>category</Text>. Type defaults to DEBIT, currency to INR, date to today.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value, t, aink }: { label: string; value: number; t: any; aink: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: t.bg, borderRadius: 18, padding: 14 }}>
      <Text style={{ fontFamily: font.ui, fontSize: 11, color: t.mute }}>{label}</Text>
      <Text style={{ fontFamily: font.uiBold, fontSize: 22, color: aink, marginTop: 4 }}>{value.toLocaleString()}</Text>
    </View>
  );
}

function getStyles(t: any, aink: string, mode: 'dark' | 'light') {
  return StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 16 },
    backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: t.chipBg, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontFamily: font.uiBold, fontSize: 18, color: aink },

    card: { marginHorizontal: 20, marginBottom: 16, padding: 20, backgroundColor: t.surface, borderRadius: 24, borderWidth: 1, borderColor: t.rule },
    cardTitle: { fontFamily: font.uiBold, fontSize: 15, color: t.ink },
    subnote: { fontFamily: font.ui, fontSize: 12, color: t.mute, lineHeight: 17, marginTop: 8 },

    rowBetween: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
    iconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: alpha(aink, 0.15), alignItems: 'center', justifyContent: 'center' },

    primaryBtn: { paddingVertical: 14, borderRadius: 100, alignItems: 'center', backgroundColor: accent.v },
    primaryBtnText: { fontFamily: font.uiBold, fontSize: 14, color: mode === 'dark' ? '#0D0D0D' : '#0D0D0D', letterSpacing: 0.2 },

    secondaryBtn: { paddingVertical: 14, borderRadius: 100, alignItems: 'center', backgroundColor: t.chipBg, borderWidth: 1, borderColor: t.rule },
    secondaryBtnText: { fontFamily: font.uiBold, fontSize: 14, color: t.ink, letterSpacing: 0.2 },

    mono: { fontFamily: font.mono, fontSize: 11, color: t.inkDim, marginTop: 6, lineHeight: 16 },
  });
}
