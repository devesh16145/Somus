import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useStore } from '../store';
import { LeapModule, MODELS } from '../modules/LeapModule';
import { SmsOrchestrator } from '../services/SmsOrchestrator';
import { TransactionRepository } from '../database/TransactionRepository';
import { themes, accent, accentInk, font, alpha, ThemeMode } from '../theme';
import LiquidIcon from '../components/LiquidIcons';
import { RootStackParams } from '../App';

type Period = '7d' | '30d' | '90d' | '180d' | 'custom';
const PERIODS: { label: string; value: Period; days: number }[] = [
  { label: '7d',   value: '7d',   days: 7   },
  { label: '30d',  value: '30d',  days: 30  },
  { label: '90d',  value: '90d',  days: 90  },
  { label: '180d', value: '180d', days: 180 },
  { label: 'Custom', value: 'custom', days: 0 },
];

type ImportPhase = 'idle' | 'counting' | 'reading' | 'processing' | 'done' | 'error';

export default function SettingsScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParams>>();
  const { modelLoaded, setTransactions, themeMode } = useStore();
  const t = themes[themeMode];
  const aink = accentInk(themeMode);

  const [selectedPeriod, setSelectedPeriod] = useState<Period>('30d');
  const [customDays, setCustomDays] = useState(60);
  const [txCount, setTxCount] = useState(0);

  // Import state
  const [phase, setPhase] = useState<ImportPhase>('idle');
  const [smsTotal, setSmsTotal] = useState(0);
  const [smsRead, setSmsRead] = useState(0);
  const [processed, setProcessed] = useState(0);
  const [txFound, setTxFound] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setTxCount(TransactionRepository.getCount());
  }, []);

  async function runImport() {
    if (!modelLoaded) {
      Alert.alert('AI model not loaded', 'Please complete onboarding first.');
      return;
    }
    const periodObj = PERIODS.find(p => p.value === selectedPeriod)!;
    const days = selectedPeriod === 'custom' ? customDays : periodObj.days;

    const end = Date.now();
    const start = end - days * 86400000;

    setPhase('counting');
    setSmsTotal(0); setSmsRead(0); setProcessed(0); setTxFound(0); setErrorMsg(null);

    try {
      const n = await SmsOrchestrator.syncPeriod(start, end, {
        onSmsCount: (total) => { setSmsTotal(total); if (total === 0) setPhase('done'); else setPhase('reading'); },
        onSmsRead: (read, total) => { setSmsRead(read); setSmsTotal(total); if (read >= total) setPhase('processing'); },
        onProcessed: (proc, total, found) => { setProcessed(proc); setSmsTotal(total); setTxFound(found); },
      });

      const fresh = TransactionRepository.getAll(200);
      setTransactions(fresh);
      setTxCount(fresh.length);
      setTxFound(n);
      setPhase('done');
    } catch (e: any) {
      setErrorMsg(e?.message ?? 'Import failed');
      setPhase('error');
    }
  }

  function resetImport() { setPhase('idle'); setErrorMsg(null); }

  const progressPct = smsTotal > 0 ? Math.round((processed / smsTotal) * 100) : 0;
  const s = getStyles(t, aink, themeMode);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={s.header}>
           <Text style={s.headerTitle}>Settings</Text>
        </View>

        {/* Local AI Management */}
        <TouchableOpacity style={s.card} onPress={() => nav.navigate('AiManagement')} activeOpacity={0.7}>
           <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: alpha(aink, 0.15), alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                 <LiquidIcon name="chip" size={20} color={aink} />
              </View>
              <View style={{ flex: 1 }}>
                 <Text style={{ fontFamily: font.uiBold, fontSize: 16, color: t.ink, marginBottom: 2 }}>Local AI Management</Text>
                 <Text style={{ fontFamily: font.ui, fontSize: 13, color: t.inkDim }}>{MODELS.DEFAULT.slug} • \u223E {MODELS.DEFAULT.sizeMb}MB</Text>
              </View>
              <LiquidIcon name="chevron" size={16} color={t.mute} style={{ transform: [{ rotate: '-90deg' }] }} />
           </View>
           
           <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={s.statsPill}>
                 <Text style={s.statsLabel}>Transactions</Text>
                 <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 4 }}>
                   <Text style={s.statsMain}>{txCount.toLocaleString()}</Text>
                   <Text style={s.statsSub}> on device</Text>
                 </View>
              </View>
              <View style={s.statsPill}>
                 <Text style={s.statsLabel}>Status</Text>
                 <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 4 }}>
                   <Text style={[s.statsMain, { color: modelLoaded ? '#4d7c0f' : t.mute }]}>{modelLoaded ? 'Loaded' : 'Not loaded'}</Text>
                 </View>
              </View>
           </View>
        </TouchableOpacity>

        {/* SMS Import Feature */}
        <View style={s.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <View>
              <Text style={{ fontFamily: font.uiBold, fontSize: 15, color: t.ink }}>SMS Import & Sync</Text>
              <Text style={{ fontFamily: font.ui, fontSize: 12, color: t.mute, marginTop: 2 }}>Extract transactions from your inbox</Text>
            </View>
            <View style={{ paddingHorizontal: 10, paddingVertical: 6, backgroundColor: alpha(accent.v, 0.22), borderRadius: 100 }}>
              <Text style={{ fontFamily: font.monoBold, fontSize: 10, color: aink }}>{phase}</Text>
            </View>
          </View>

          {(phase === 'idle' || phase === 'error' || phase === 'done') ? (
            <>
              <View style={s.pillRow}>
                {PERIODS.map((p) => {
                  const on = selectedPeriod === p.value;
                  return (
                    <TouchableOpacity key={p.value} style={[s.pill, on && s.pillOn]} onPress={() => setSelectedPeriod(p.value)}>
                      <Text style={[s.pillText, on && s.pillTextOn]}>{p.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              
              {selectedPeriod === 'custom' && (
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                  <View style={{ flex: 1, backgroundColor: t.chipBg, padding: 12, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                      <Text style={{ fontFamily: font.mono, fontSize: 10, color: t.mute, marginBottom: 4 }}>Period</Text>
                      <Text style={{ fontFamily: font.uiBold, fontSize: 13, color: t.ink }}>{customDays} days</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 4 }}>
                      <TouchableOpacity onPress={() => setCustomDays(Math.max(1, customDays - 1))} style={{ padding: 4 }}>
                         <LiquidIcon name="chevron" size={16} color={t.inkDim} style={{ transform: [{ rotate: '180deg' }] }} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setCustomDays(customDays + 1)} style={{ padding: 4 }}>
                         <LiquidIcon name="chevron" size={16} color={t.inkDim} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={{ flex: 1, backgroundColor: t.chipBg, padding: 12, borderRadius: 12, justifyContent: 'center' }}>
                    <Text style={{ fontFamily: font.mono, fontSize: 10, color: t.mute, marginBottom: 4 }}>To</Text>
                    <Text style={{ fontFamily: font.uiBold, fontSize: 13, color: t.ink }}>Today</Text>
                  </View>
                </View>
              )}

              {phase === 'error' && <Text style={{ color: '#ef4444', fontFamily: font.mono, fontSize: 11, marginTop: 12 }}>{errorMsg}</Text>}
              {phase === 'done' && <Text style={{ color: aink, fontFamily: font.mono, fontSize: 11, marginTop: 12 }}>Imported {txFound} transactions from {smsTotal} messages.</Text>}
              
              <TouchableOpacity style={s.importBtn} onPress={phase === 'done' ? resetImport : runImport} disabled={!modelLoaded}>
                <Text style={s.importBtnText}>
                  {!modelLoaded ? 'AI disabled' : phase === 'done' ? 'Reset state' : 'Run Extractor \u2192'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={{ marginTop: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontFamily: font.mono, fontSize: 10, color: t.inkDim }}>
                  {phase === 'counting' ? 'counting...' : phase === 'reading' ? 'reading sandbox...' : 'inferencing...'}
                </Text>
                <Text style={{ fontFamily: font.monoBold, fontSize: 10, color: aink }}>
                  {progressPct}% · {processed} / {smsTotal}
                </Text>
              </View>
              <View style={{ height: 6, backgroundColor: t.chipBg, borderRadius: 3, overflow: 'hidden' }}>
                <View style={{ width: `${progressPct}%`, height: '100%', backgroundColor: accent.v, borderRadius: 3, boxShadow: `0 0 12px ${accent.v}` }} />
              </View>
            </View>
          )}
        </View>

        {/* Global Navigation List */}
        <View style={[s.card, { paddingVertical: 8, paddingHorizontal: 0 }]}>
           <SettingRow t={t} icon="dots" name="SMS Permissions & Sync" sub="Private scraping, automated tracking" onPress={() => nav.navigate('SmsPermissions')} />
           <SettingRow t={t} icon="bag" name="Notifications" sub="Spending alerts, vault updates" last onPress={() => nav.navigate('Notifications')} />
        </View>

        {/* Footer */}
        <View style={{ alignItems: 'center', marginTop: 40, marginBottom: 20 }}>
           <Text style={{ fontFamily: font.monoBold, fontSize: 10, color: t.mute, letterSpacing: 0.5, marginBottom: 6 }}>v1.0.0</Text>
           <Text style={{ fontFamily: font.ui, fontSize: 11, color: alpha(t.mute, 0.7) }}>Private · on-device</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({ t, icon, name, sub, badge, badgeColor, last = false, onPress }: any) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: last ? 0 : 1, borderBottomColor: t.rule }}>
      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.chipBg, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
        <LiquidIcon name={icon} size={16} color={t.inkDim} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: font.uiBold, fontSize: 15, color: t.ink, marginBottom: 2 }}>{name}</Text>
        <Text style={{ fontFamily: font.ui, fontSize: 12, color: t.mute }}>{sub}</Text>
      </View>
      {badge && (
        <View style={{ backgroundColor: alpha(badgeColor, 0.15), paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginRight: 10 }}>
          <Text style={{ fontFamily: font.monoBold, fontSize: 9, color: badgeColor }}>{badge}</Text>
        </View>
      )}
      <LiquidIcon name="chevron" size={16} color={t.mute} style={{ transform: [{ rotate: '-90deg' }] }} />
    </TouchableOpacity>
  );
}

function getStyles(t: any, aink: string, mode: ThemeMode) {
  return StyleSheet.create({
    header: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 16 },
    headerTitle: { fontFamily: font.uiBold, fontSize: 18, color: aink },

    card: { marginHorizontal: 20, marginBottom: 16, padding: 20, backgroundColor: t.surface, borderRadius: 28, borderWidth: 1, borderColor: t.rule },

    statsPill: { flex: 1, backgroundColor: t.bg, borderRadius: 20, padding: 16 },
    statsLabel: { fontFamily: font.ui, fontSize: 11, color: t.mute },
    statsMain: { fontFamily: font.uiBold, fontSize: 16, color: t.ink },
    statsSub: { fontFamily: font.mono, fontSize: 10, color: t.mute },

    pillRow: { flexDirection: 'row', gap: 6 },
    pill: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12, backgroundColor: t.chipBg },
    pillOn: { backgroundColor: accent.v },
    pillText: { fontFamily: font.monoBold, fontSize: 11, color: t.inkDim },
    pillTextOn: { color: mode === 'dark' ? '#0D0D0D' : '#FFFFFF' },

    importBtn: { marginTop: 14, width: '100%', paddingVertical: 14, backgroundColor: t.ink === '#f2f2f5' ? '#f2f2f5' : t.ink, borderRadius: 16, alignItems: 'center' },
    importBtnText: { fontFamily: font.display, fontSize: 14, color: t.bg, fontWeight: '600' },
  });
}
