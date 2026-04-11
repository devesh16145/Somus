import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ScrollView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useStore } from '../store';
import { LeapModule, MODELS } from '../modules/LeapModule';
import { SmsModule } from '../modules/SmsModule';
import { SmsOrchestrator } from '../services/SmsOrchestrator';
import { TransactionRepository } from '../database/TransactionRepository';

type Period = '7d' | '30d' | '90d' | '180d';
const PERIODS: { label: string; value: Period; days: number }[] = [
  { label: '7 days',   value: '7d',   days: 7   },
  { label: '30 days',  value: '30d',  days: 30  },
  { label: '3 months', value: '90d',  days: 90  },
  { label: '6 months', value: '180d', days: 180 },
];

type ImportPhase = 'idle' | 'counting' | 'reading' | 'processing' | 'done' | 'error';

export default function SettingsScreen() {
  const { modelLoaded, setTransactions } = useStore();
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('30d');
  const [smsCount, setSmsCount]             = useState<number | null>(null);
  const [txCount, setTxCount]               = useState(0);

  // Import state
  const [phase, setPhase]           = useState<ImportPhase>('idle');
  const [smsTotal, setSmsTotal]     = useState(0);
  const [smsRead, setSmsRead]       = useState(0);
  const [processed, setProcessed]   = useState(0);
  const [txFound, setTxFound]       = useState(0);
  const [errorMsg, setErrorMsg]     = useState<string | null>(null);

  useEffect(() => {
    setTxCount(TransactionRepository.getCount());
  }, []);

  async function previewCount() {
    const period = PERIODS.find(p => p.value === selectedPeriod)!;
    const end    = Date.now();
    const start  = end - period.days * 86400000;
    try {
      const count = await SmsModule.countInPeriod(start, end);
      setSmsCount(count);
    } catch {
      setSmsCount(null);
    }
  }

  async function runImport() {
    if (!modelLoaded) {
      Alert.alert('AI model not loaded', 'Please complete onboarding first.');
      return;
    }
    const period = PERIODS.find(p => p.value === selectedPeriod)!;
    const end    = Date.now();
    const start  = end - period.days * 86400000;

    // Reset state
    setPhase('counting');
    setSmsTotal(0);
    setSmsRead(0);
    setProcessed(0);
    setTxFound(0);
    setErrorMsg(null);

    try {
      const n = await SmsOrchestrator.syncPeriod(start, end, {
        onSmsCount: (total) => {
          setSmsTotal(total);
          if (total === 0) {
            setPhase('done');
          } else {
            setPhase('reading');
          }
        },
        onSmsRead: (read, total) => {
          setSmsRead(read);
          setSmsTotal(total);
          if (read >= total) {
            setPhase('processing');
          }
        },
        onProcessed: (proc, total, found) => {
          setProcessed(proc);
          setSmsTotal(total);
          setTxFound(found);
        },
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

  function resetImport() {
    setPhase('idle');
    setErrorMsg(null);
  }

  const isImporting = phase === 'counting' || phase === 'reading' || phase === 'processing';
  const progressPct = smsTotal > 0 ? Math.round((processed / smsTotal) * 100) : 0;

  return (
    <SafeAreaView style={st.container} edges={['top']}>
      <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>
        <Text style={st.title}>Settings</Text>

        {/* ── Import SMS ── */}
        <View style={st.card}>
          <Text style={st.cardTitle}>Import SMS history</Text>
          <Text style={st.cardDesc}>
            Scan your past messages for bank transactions. Runs entirely on-device.
          </Text>

          {/* Period selector - only when idle */}
          {(phase === 'idle' || phase === 'done' || phase === 'error') && (
            <>
              <Text style={st.fieldLabel}>Time period</Text>
              <View style={st.periodRow}>
                {PERIODS.map(p => (
                  <TouchableOpacity
                    key={p.value}
                    style={[st.periodBtn, selectedPeriod === p.value && st.periodBtnActive]}
                    onPress={() => { setSelectedPeriod(p.value); setSmsCount(null); }}>
                    <Text style={[st.periodBtnText, selectedPeriod === p.value && st.periodBtnTextActive]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {smsCount === null ? (
                <TouchableOpacity style={st.secondaryBtn} onPress={previewCount}>
                  <Text style={st.secondaryBtnText}>Preview count</Text>
                </TouchableOpacity>
              ) : (
                <Text style={st.previewText}>{smsCount} SMS found in this period</Text>
              )}
            </>
          )}

          {/* ── Import progress ── */}
          {isImporting && (
            <View style={st.progressSection}>
              {/* Phase indicator */}
              <View style={st.phaseRow}>
                <PhaseStep label="Count" active={phase === 'counting'} done={phase !== 'counting'} />
                <View style={st.phaseDash} />
                <PhaseStep label="Read SMS" active={phase === 'reading'} done={phase === 'processing'} />
                <View style={st.phaseDash} />
                <PhaseStep label="AI Scan" active={phase === 'processing'} done={false} />
              </View>

              {/* Progress bar */}
              {phase === 'processing' && smsTotal > 0 && (
                <View style={st.progressBarContainer}>
                  <View style={st.progressBar}>
                    <View style={[st.progressFill, { width: `${progressPct}%` }]} />
                  </View>
                  <Text style={st.progressPct}>{progressPct}%</Text>
                </View>
              )}

              {/* Stats */}
              <View style={st.statsGrid}>
                <StatBox label="SMS found" value={smsTotal} />
                <StatBox label="SMS read" value={smsRead} />
                <StatBox label="AI processed" value={processed} />
                <StatBox label="Transactions" value={txFound} accent />
              </View>

              {/* Current phase text */}
              <Text style={st.phaseText}>
                {phase === 'counting' && 'Counting SMS messages...'}
                {phase === 'reading' && `Reading SMS inbox... ${smsRead} / ${smsTotal}`}
                {phase === 'processing' && `AI scanning... ${processed} / ${smsTotal} SMS`}
              </Text>
            </View>
          )}

          {/* ── Done ── */}
          {phase === 'done' && (
            <View style={st.doneSection}>
              <Text style={st.doneIcon}>✓</Text>
              <Text style={st.doneTitle}>Import complete</Text>
              <Text style={st.doneDetail}>
                Scanned {smsTotal} SMS  ·  Found {txFound} transaction{txFound === 1 ? '' : 's'}
              </Text>
              <TouchableOpacity style={st.secondaryBtn} onPress={resetImport}>
                <Text style={st.secondaryBtnText}>Import again</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Error ── */}
          {phase === 'error' && (
            <View>
              <Text style={st.errorText}>{errorMsg}</Text>
              <TouchableOpacity style={st.secondaryBtn} onPress={resetImport}>
                <Text style={st.secondaryBtnText}>Try again</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Import button (idle only) ── */}
          {phase === 'idle' && (
            <TouchableOpacity
              style={[st.primaryBtn, !modelLoaded && st.primaryBtnDisabled]}
              onPress={runImport}
              disabled={!modelLoaded}>
              <Text style={st.primaryBtnText}>
                {modelLoaded ? 'Import Now' : 'AI model not loaded'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── AI Model ── */}
        <View style={st.card}>
          <Text style={st.cardTitle}>AI model</Text>
          <InfoRow label="Model"        value={MODELS.DEFAULT.slug} />
          <InfoRow label="Quantization" value={MODELS.DEFAULT.quant} />
          <InfoRow label="Size"         value={`~${MODELS.DEFAULT.sizeMb} MB`} />
          <InfoRow label="Status"       value={modelLoaded ? 'Loaded' : 'Not loaded'}
            valueColor={modelLoaded ? '#00FF94' : '#FF4444'} />
          <InfoRow label="Cloud calls"  value="None" valueColor="#00FF94" />
        </View>

        {/* ── Stats ── */}
        <View style={st.card}>
          <Text style={st.cardTitle}>Your data</Text>
          <InfoRow label="Transactions stored" value={String(txCount)} />
          <InfoRow label="Storage location"   value="On-device only" />
          <InfoRow label="Cloud backup"       value="Never" valueColor="#00FF94" />
        </View>

        {/* ── Privacy ── */}
        <View style={st.card}>
          <Text style={st.cardTitle}>Privacy</Text>
          <Text style={st.privacyText}>
            Somus processes all your SMS and financial data entirely on your device
            using the LFM2 AI model. No data is transmitted to any server.
            The internet connection is used solely for the one-time model download.
            {'\n\n'}
            Your SMS messages, transaction history, and spending patterns never
            leave your phone.
          </Text>
        </View>

        <Text style={st.version}>Somus v1.0.0  ·  {MODELS.DEFAULT.slug}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-components ────────────────────────────────────────────

function PhaseStep({ label, active, done }: { label: string; active: boolean; done: boolean }) {
  return (
    <View style={st.phaseStep}>
      <View style={[
        st.phaseDot,
        active && st.phaseDotActive,
        done && st.phaseDotDone,
      ]} />
      <Text style={[
        st.phaseLabel,
        active && st.phaseLabelActive,
        done && st.phaseLabelDone,
      ]}>{label}</Text>
    </View>
  );
}

function StatBox({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <View style={st.statBox}>
      <Text style={[st.statValue, accent && { color: '#00FF94' }]}>{value}</Text>
      <Text style={st.statLabel}>{label}</Text>
    </View>
  );
}

function InfoRow({
  label, value, valueColor,
}: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={st.infoRow}>
      <Text style={st.infoLabel}>{label}</Text>
      <Text style={[st.infoValue, valueColor ? { color: valueColor } : {}]}>{value}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#0D0D0D' },
  scroll:       { padding: 20, paddingBottom: 60 },
  title:        { fontSize: 28, fontWeight: '700', color: '#FFFFFF', marginBottom: 24 },

  card:         { backgroundColor: '#141414', borderRadius: 16, padding: 20, marginBottom: 16 },
  cardTitle:    { fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 6 },
  cardDesc:     { fontSize: 13, color: '#666', lineHeight: 20, marginBottom: 20 },

  fieldLabel:        { fontSize: 12, color: '#555', marginBottom: 10,
                       textTransform: 'uppercase', letterSpacing: 1 },
  periodRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  periodBtn:         { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                       backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#222' },
  periodBtnActive:   { backgroundColor: '#00FF9420', borderColor: '#00FF94' },
  periodBtnText:     { fontSize: 13, color: '#666' },
  periodBtnTextActive:{ color: '#00FF94', fontWeight: '600' },

  previewText:  { fontSize: 13, color: '#888', marginBottom: 14, textAlign: 'center' },

  // Progress section
  progressSection: { marginTop: 4 },
  phaseRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 20, gap: 4 },
  phaseStep:    { alignItems: 'center', gap: 4 },
  phaseDot:     { width: 10, height: 10, borderRadius: 5, backgroundColor: '#333' },
  phaseDotActive: { backgroundColor: '#00FF94' },
  phaseDotDone: { backgroundColor: '#00FF9460' },
  phaseDash:    { width: 24, height: 1, backgroundColor: '#333', marginBottom: 14 },
  phaseLabel:   { fontSize: 11, color: '#444' },
  phaseLabelActive: { color: '#00FF94', fontWeight: '600' },
  phaseLabelDone:   { color: '#666' },

  progressBarContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  progressBar:  { flex: 1, height: 6, backgroundColor: '#222', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#00FF94', borderRadius: 3 },
  progressPct:  { fontSize: 13, color: '#00FF94', fontWeight: '700', width: 40, textAlign: 'right' },

  statsGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  statBox:      { flex: 1, minWidth: '40%', backgroundColor: '#1A1A1A', borderRadius: 10,
                  padding: 12, alignItems: 'center' },
  statValue:    { fontSize: 20, fontWeight: '700', color: '#FFF', marginBottom: 2 },
  statLabel:    { fontSize: 11, color: '#555' },

  phaseText:    { fontSize: 13, color: '#666', textAlign: 'center', marginBottom: 4 },

  // Done
  doneSection:  { alignItems: 'center', paddingVertical: 12 },
  doneIcon:     { fontSize: 28, color: '#00FF94', marginBottom: 8 },
  doneTitle:    { fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 6 },
  doneDetail:   { fontSize: 13, color: '#666', marginBottom: 16 },

  errorText:  {
    fontSize: 13, color: '#FF4444',
    backgroundColor: '#FF444420', borderRadius: 8,
    padding: 12, marginBottom: 16,
  },

  primaryBtn:         { backgroundColor: '#00FF94', borderRadius: 12,
                        paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  primaryBtnDisabled: { backgroundColor: '#1A1A1A' },
  primaryBtnText:     { fontSize: 15, fontWeight: '700', color: '#0D0D0D' },
  secondaryBtn:       { borderWidth: 1, borderColor: '#333', borderRadius: 12,
                        paddingVertical: 12, alignItems: 'center', marginBottom: 12 },
  secondaryBtnText:   { fontSize: 14, color: '#888' },

  infoRow:    { flexDirection: 'row', justifyContent: 'space-between',
                paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: '#1F1F1F' },
  infoLabel:  { fontSize: 14, color: '#666' },
  infoValue:  { fontSize: 14, color: '#FFFFFF', fontWeight: '500' },

  privacyText:{ fontSize: 13, color: '#666', lineHeight: 22 },
  version:    { fontSize: 12, color: '#333', textAlign: 'center', marginTop: 8 },
});
