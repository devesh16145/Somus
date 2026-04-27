import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LiquidDialog } from '../components/LiquidDialog';
import { themes, accent, accentInk, font, alpha } from '../theme';
import { useStore } from '../store';
import { SmsOrchestrator, AbortedError } from '../services/SmsOrchestrator';
import { SmsModule } from '../modules/SmsModule';
import { TransactionRepository } from '../database/TransactionRepository';
import LiquidIcon from '../components/LiquidIcons';
import { RootStackParams } from '../App';

const SIX_MONTHS_DAYS = 180;

function startOfDay(d: Date): Date { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function endOfDay(d: Date): Date { const x = new Date(d); x.setHours(23,59,59,999); return x; }
function fmtDate(ms: number): string {
  return new Date(ms).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function SyncSmsScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParams>>();
  const {
    modelLoaded, setTransactions, themeMode,
    importPhase: phase, importSmsTotal: smsTotal, importSmsRead: smsRead,
    importProcessed: processed, importTxFound: txFound, importErrorMsg: errorMsg,
    importStartMs, importEndMs,
    setImportPhase, setImportSmsTotal, setImportSmsRead, setImportProcessed,
    setImportTxFound, setImportErrorMsg, setImportAbort, setImportRange, resetImportState,
  } = useStore();
  const t = themes[themeMode];
  const aink = accentInk(themeMode);

  // Default: last 30 days
  const today = startOfDay(new Date());
  const defaultStart = new Date(today.getTime() - 30 * 86400000);

  const [startDate, setStartDate] = useState<Date>(importStartMs ? new Date(importStartMs) : defaultStart);
  const [endDate, setEndDate] = useState<Date>(importEndMs ? new Date(importEndMs) : today);
  const [pickerFor, setPickerFor] = useState<'from' | 'to' | null>(null);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewing, setPreviewing] = useState(false);

  const isRunning = phase === 'counting' || phase === 'reading' || phase === 'processing';
  const aborting = useStore((s) => s.importAbort) && isRunning;

  async function getCount() {
    if (isRunning) return;
    setPreviewing(true);
    setPreviewCount(null);
    try {
      const hasPerm = await SmsModule.hasPermission();
      if (!hasPerm) { LiquidDialog.alert('Permission required', 'Grant SMS access first.'); setPreviewing(false); return; }
      const startMs = startOfDay(startDate).getTime();
      const endMs = endOfDay(endDate).getTime();
      const n = await SmsModule.countInPeriod(startMs, endMs);
      setPreviewCount(n);
    } catch (e: any) {
      LiquidDialog.alert('Count failed', e?.message ?? 'Unknown error');
    }
    setPreviewing(false);
  }

  async function startSync() {
    if (!modelLoaded) {
      LiquidDialog.alert('AI model not loaded', 'Complete onboarding first.');
      return;
    }
    if (isRunning) return;

    const startMs = startOfDay(startDate).getTime();
    const endMs = endOfDay(endDate).getTime();

    resetImportState();
    setImportRange(startMs, endMs);
    setImportPhase('counting');

    try {
      await SmsOrchestrator.syncPeriod(startMs, endMs, {
        onSmsCount: (total) => {
          setImportSmsTotal(total);
          if (total === 0) setImportPhase('done'); else setImportPhase('reading');
        },
        onSmsRead: (read, total) => {
          setImportSmsRead(read);
          setImportSmsTotal(total);
          if (read >= total) setImportPhase('processing');
        },
        onProcessed: (proc, total, found) => {
          setImportProcessed(proc);
          setImportSmsTotal(total);
          setImportTxFound(found);
        },
        shouldAbort: () => useStore.getState().importAbort,
      });

      const fresh = TransactionRepository.getAll(200);
      setTransactions(fresh);
      setImportPhase('done');
    } catch (e: any) {
      if (e instanceof AbortedError || e?.name === 'AbortedError') {
        const fresh = TransactionRepository.getAll(200);
        setTransactions(fresh);
        setImportPhase('aborted');
      } else {
        setImportErrorMsg(e?.message ?? 'Sync failed');
        setImportPhase('error');
      }
    } finally {
      setImportAbort(false);
    }
  }

  function confirmAbort() {
    LiquidDialog.show({
      title: 'Abort sync?',
      message: 'Already-imported transactions will be kept. The current message in flight will finish processing.',
      buttons: [
        { text: 'Keep running', style: 'cancel' },
        { text: 'Abort', style: 'destructive', onPress: () => setImportAbort(true) },
      ],
    });
  }

  const progressPct = smsTotal > 0 ? Math.round((processed / smsTotal) * 100) : 0;
  const s = getStyles(t, aink);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={{ padding: 4 }}>
          <LiquidIcon name="arrowRt" size={24} color={t.ink} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Sync from SMS</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={s.hero}>
          <Text style={s.heroLabel}>Date Range</Text>
          <Text style={s.heroDesc}>Pick a window to scan. We'll only process bank-related messages, on-device.</Text>
        </View>

        <View style={s.card}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity style={s.dateBtn} onPress={() => !isRunning && setPickerFor('from')} activeOpacity={0.7} disabled={isRunning}>
              <Text style={s.dateLabel}>From</Text>
              <Text style={s.dateValue}>{fmtDate(startDate.getTime())}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.dateBtn} onPress={() => !isRunning && setPickerFor('to')} activeOpacity={0.7} disabled={isRunning}>
              <Text style={s.dateLabel}>To</Text>
              <Text style={s.dateValue}>{fmtDate(endDate.getTime())}</Text>
            </TouchableOpacity>
          </View>

          <View style={s.presetRow}>
            {[
              { label: '7d', days: 7 },
              { label: '30d', days: 30 },
              { label: '90d', days: 90 },
              { label: '180d', days: 180 },
            ].map((p) => (
              <TouchableOpacity
                key={p.label}
                style={s.preset}
                disabled={isRunning}
                onPress={() => {
                  const e = startOfDay(new Date());
                  const start = new Date(e.getTime() - p.days * 86400000);
                  setEndDate(e);
                  setStartDate(start);
                  setPreviewCount(null);
                }}>
                <Text style={s.presetText}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {previewCount !== null && !isRunning && (
            <View style={s.previewBlock}>
              <Text style={s.previewText}>~{previewCount.toLocaleString()} SMS in this window</Text>
              <Text style={s.previewNote}>at ~10s/sms · ~{Math.ceil((previewCount * 10) / 60)} min</Text>
            </View>
          )}

          {!isRunning && (
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <TouchableOpacity style={[s.actionBtn, { backgroundColor: t.chipBg }]} onPress={getCount} disabled={previewing}>
                <Text style={[s.actionBtnText, { color: t.ink }]}>{previewing ? 'Counting…' : 'Get Count'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.actionBtn, { backgroundColor: accent.v }]} onPress={startSync} disabled={!modelLoaded}>
                <Text style={[s.actionBtnText, { color: '#0D0D0D' }]}>{!modelLoaded ? 'AI not loaded' : 'Sync'}</Text>
              </TouchableOpacity>
            </View>
          )}

          {isRunning && (
            <View style={{ marginTop: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontFamily: font.mono, fontSize: 11, color: aborting ? '#ef4444' : t.inkDim }}>
                  {aborting ? 'aborting after current SMS…' : phase === 'counting' ? 'counting…' : phase === 'reading' ? `reading (${smsRead}/${smsTotal})` : 'inferencing…'}
                </Text>
                <Text style={{ fontFamily: font.monoBold, fontSize: 11, color: aink }}>
                  {progressPct}% · {processed}/{smsTotal}
                </Text>
              </View>
              <View style={{ height: 6, backgroundColor: t.chipBg, borderRadius: 3, overflow: 'hidden' }}>
                <View style={{ width: `${progressPct}%`, height: '100%', backgroundColor: aborting ? '#ef4444' : accent.v, borderRadius: 3 }} />
              </View>
              <Text style={{ fontFamily: font.mono, fontSize: 10, color: t.mute, marginTop: 6 }}>
                {txFound} transactions found · runs in background
              </Text>
              <TouchableOpacity
                style={[s.actionBtn, { marginTop: 14, backgroundColor: alpha('#ef4444', aborting ? 0.08 : 0.15) }]}
                onPress={confirmAbort}
                disabled={aborting}>
                <Text style={[s.actionBtnText, { color: aborting ? alpha('#ef4444', 0.6) : '#ef4444' }]}>
                  {aborting ? 'Aborting…' : 'Abort'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {phase === 'done' && !isRunning && (
            <Text style={[s.statusText, { color: aink, marginTop: 14 }]}>
              ✓ Imported {txFound} transactions from {smsTotal} messages.
            </Text>
          )}
          {phase === 'aborted' && !isRunning && (
            <Text style={[s.statusText, { color: t.mute, marginTop: 14 }]}>
              Aborted · kept {txFound} transactions from {processed} processed.
            </Text>
          )}
          {phase === 'error' && !isRunning && (
            <Text style={[s.statusText, { color: '#ef4444', marginTop: 14 }]}>
              {errorMsg ?? 'Sync failed.'}
            </Text>
          )}
        </View>

        <View style={[s.card, { backgroundColor: alpha(aink, 0.05) }]}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
            <LiquidIcon name="shield" size={16} color={aink} />
            <View style={{ flex: 1 }}>
              <Text style={[s.cardTitle, { color: aink }]}>Background-safe</Text>
              <Text style={s.cardDesc}>You can leave this screen and the sync keeps running. Come back anytime to see progress or abort.</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <CalendarPicker
        visible={pickerFor !== null}
        initial={pickerFor === 'from' ? startDate : endDate}
        minDate={pickerFor === 'to' ? startDate : new Date(Date.now() - SIX_MONTHS_DAYS * 86400000)}
        maxDate={pickerFor === 'from' ? endDate : new Date()}
        onClose={() => setPickerFor(null)}
        onSelect={(d) => {
          if (pickerFor === 'from') setStartDate(startOfDay(d));
          else setEndDate(startOfDay(d));
          setPickerFor(null);
          setPreviewCount(null);
        }}
        t={t}
        aink={aink}
      />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────
// Calendar picker
// ─────────────────────────────────────────────────────────────
function CalendarPicker({ visible, initial, minDate, maxDate, onSelect, onClose, t, aink }: {
  visible: boolean; initial: Date; minDate: Date; maxDate: Date;
  onSelect: (d: Date) => void; onClose: () => void; t: any; aink: string;
}) {
  const [view, setView] = useState<Date>(new Date(initial.getFullYear(), initial.getMonth(), 1));
  const [selected, setSelected] = useState<Date>(initial);

  useEffect(() => {
    if (visible) {
      setView(new Date(initial.getFullYear(), initial.getMonth(), 1));
      setSelected(initial);
    }
  }, [visible, initial.getTime()]);

  const year = view.getFullYear();
  const month = view.getMonth();
  const monthName = view.toLocaleDateString('en', { month: 'long', year: 'numeric' });

  // Day grid (Mon-Sun, leading blanks)
  const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
  const leading = (firstDow + 6) % 7; // shift so Mon=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < leading; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const minMs = startOfDay(minDate).getTime();
  const maxMs = startOfDay(maxDate).getTime();
  const selMs = startOfDay(selected).getTime();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: t.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 36 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <TouchableOpacity onPress={() => setView(new Date(year, month - 1, 1))} style={{ padding: 8 }}>
              <LiquidIcon name="chevron" size={18} color={t.inkDim} style={{ transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>
            <Text style={{ fontFamily: font.uiBold, fontSize: 16, color: t.ink }}>{monthName}</Text>
            <TouchableOpacity onPress={() => setView(new Date(year, month + 1, 1))} style={{ padding: 8 }}>
              <LiquidIcon name="chevron" size={18} color={t.inkDim} />
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 }}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <Text key={i} style={{ fontFamily: font.monoBold, fontSize: 10, color: t.mute, width: 36, textAlign: 'center' }}>{d}</Text>
            ))}
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {cells.map((cell, i) => {
              if (!cell) return <View key={i} style={{ width: '14.28%', height: 40 }} />;
              const cellMs = cell.getTime();
              const disabled = cellMs < minMs || cellMs > maxMs;
              const isSelected = cellMs === selMs;
              return (
                <TouchableOpacity
                  key={i}
                  disabled={disabled}
                  onPress={() => setSelected(cell)}
                  style={{ width: '14.28%', height: 40, alignItems: 'center', justifyContent: 'center' }}>
                  <View style={{
                    width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: isSelected ? accent.v : 'transparent',
                  }}>
                    <Text style={{
                      fontFamily: isSelected ? font.uiBold : font.ui,
                      fontSize: 13,
                      color: disabled ? alpha(t.mute, 0.4) : isSelected ? '#0D0D0D' : t.ink,
                    }}>{cell.getDate()}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
            <TouchableOpacity style={{ flex: 1, paddingVertical: 14, borderRadius: 16, backgroundColor: t.chipBg, alignItems: 'center' }} onPress={onClose}>
              <Text style={{ fontFamily: font.uiBold, fontSize: 14, color: t.ink }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1, paddingVertical: 14, borderRadius: 16, backgroundColor: accent.v, alignItems: 'center' }} onPress={() => onSelect(selected)}>
              <Text style={{ fontFamily: font.uiBold, fontSize: 14, color: '#0D0D0D' }}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function getStyles(t: any, aink: string) {
  return StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 16 },
    headerTitle: { fontFamily: font.uiBold, fontSize: 18, color: t.ink },

    hero: { paddingHorizontal: 22, paddingTop: 4, paddingBottom: 16 },
    heroLabel: { fontFamily: font.uiBold, fontSize: 13, color: t.inkDim, letterSpacing: 0.5, marginBottom: 6 },
    heroDesc: { fontFamily: font.ui, fontSize: 13, color: t.mute, lineHeight: 19 },

    card: { marginHorizontal: 20, marginBottom: 16, padding: 20, backgroundColor: t.surface, borderRadius: 24, borderWidth: 1, borderColor: t.rule },
    cardTitle: { fontFamily: font.uiBold, fontSize: 14, color: t.ink, marginBottom: 4 },
    cardDesc: { fontFamily: font.ui, fontSize: 12, color: t.inkDim, lineHeight: 18 },

    dateBtn: { flex: 1, padding: 14, backgroundColor: t.chipBg, borderRadius: 16 },
    dateLabel: { fontFamily: font.mono, fontSize: 10, color: t.mute, marginBottom: 4, letterSpacing: 0.5 },
    dateValue: { fontFamily: font.uiBold, fontSize: 14, color: t.ink },

    presetRow: { flexDirection: 'row', gap: 6, marginTop: 10 },
    preset: { flex: 1, paddingVertical: 8, borderRadius: 12, backgroundColor: 'transparent', borderWidth: 1, borderColor: t.rule, alignItems: 'center' },
    presetText: { fontFamily: font.monoBold, fontSize: 11, color: t.inkDim },

    previewBlock: { marginTop: 14, padding: 12, borderRadius: 12, backgroundColor: alpha(aink, 0.08) },
    previewText: { fontFamily: font.uiBold, fontSize: 14, color: aink, marginBottom: 2 },
    previewNote: { fontFamily: font.mono, fontSize: 10, color: t.mute },

    actionBtn: { flex: 1, paddingVertical: 14, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    actionBtnText: { fontFamily: font.uiBold, fontSize: 14 },

    statusText: { fontFamily: font.mono, fontSize: 12 },
  });
}
