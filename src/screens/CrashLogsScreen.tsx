// src/screens/CrashLogsScreen.tsx
// ─────────────────────────────────────────────────────────────
// Browse local crash logs. Tap a row to view, swipe-share, or clear all.
// Privacy: nothing leaves the device unless the user explicitly shares.
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useStore } from '../store';
import { themes, accent, accentInk, font, alpha } from '../theme';
import LiquidIcon from '../components/LiquidIcons';
import { LiquidDialog } from '../components/LiquidDialog';
import { CrashLogger, CrashEntry } from '../services/CrashLogger';
import { PressableScale } from '../components/VaultAnimations';

export default function CrashLogsScreen() {
  const nav = useNavigation<any>();
  const { themeMode } = useStore();
  const t = themes[themeMode];
  const aink = accentInk(themeMode);

  const [entries, setEntries] = useState<CrashEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedBody, setSelectedBody] = useState<string>('');

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setEntries(await CrashLogger.list());
    setRefreshing(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  async function open(c: CrashEntry) {
    setSelectedId(c.id);
    setSelectedBody('Loading…');
    setSelectedBody(await CrashLogger.read(c.id));
  }

  function shareSelected() {
    if (selectedId) CrashLogger.share(selectedId);
  }

  async function deleteSelected() {
    if (!selectedId) return;
    await CrashLogger.delete(selectedId);
    setSelectedId(null);
    setSelectedBody('');
    refresh();
  }

  function confirmClearAll() {
    LiquidDialog.show({
      title: 'Clear all crash logs?',
      message: 'This permanently deletes every saved crash report from this device. It cannot be undone.',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear all', style: 'destructive', onPress: async () => {
          await CrashLogger.clearAll();
          setSelectedId(null);
          setSelectedBody('');
          refresh();
        }},
      ],
    });
  }

  async function generateTestCrash() {
    await CrashLogger._testWrite();
    refresh();
  }

  const s = getStyles(t, aink, themeMode);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={s.backBtn} activeOpacity={0.7}>
          <LiquidIcon name="chevron" size={18} color={t.ink} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Crash Logs</Text>
        <TouchableOpacity onPress={confirmClearAll} style={s.clearBtn} activeOpacity={0.7} disabled={entries.length === 0}>
          <Text style={[s.clearText, entries.length === 0 && { color: t.mute }]}>Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={aink} />}>

        {/* Privacy note */}
        <View style={s.card}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <View style={s.iconWrap}>
              <LiquidIcon name="chip" size={18} color={aink} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>Local-only</Text>
              <Text style={s.subnote}>
                Crashes are saved on this device. Nothing is uploaded. Tap a log to view; share manually if you want to send it.
              </Text>
            </View>
          </View>
        </View>

        {/* List */}
        {entries.length === 0 ? (
          <View style={[s.card, { alignItems: 'center', paddingVertical: 32 }]}>
            <LiquidIcon name="shield" size={28} color={t.mute} />
            <Text style={[s.subnote, { marginTop: 12, textAlign: 'center' }]}>No crashes recorded.</Text>
            <PressableScale onPress={generateTestCrash}>
              <View style={[s.secondaryBtn, { marginTop: 18 }]}>
                <Text style={s.secondaryBtnText}>Write test entry</Text>
              </View>
            </PressableScale>
          </View>
        ) : (
          <View style={{ marginHorizontal: 20 }}>
            {entries.map((c) => (
              <PressableScale key={c.id} onPress={() => open(c)}>
                <View style={[s.row, selectedId === c.id && { borderColor: aink, backgroundColor: alpha(aink, 0.08) }]}>
                  <View style={[s.tag, c.source === 'native' ? s.tagNative : s.tagJs]}>
                    <Text style={s.tagText}>{c.source.toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={s.rowName} numberOfLines={1}>{c.filename}</Text>
                    <Text style={s.rowMeta}>{new Date(c.ts).toLocaleString()} · {(c.size / 1024).toFixed(1)} KB</Text>
                  </View>
                  <LiquidIcon name="chevron" size={14} color={t.mute} style={{ transform: [{ rotate: '-90deg' }] }} />
                </View>
              </PressableScale>
            ))}
          </View>
        )}

        {/* Detail */}
        {selectedId && (
          <View style={[s.card, { marginTop: 8 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={s.cardTitle} numberOfLines={1}>{selectedId}</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity onPress={shareSelected} style={s.miniBtn} activeOpacity={0.7}>
                  <Text style={s.miniBtnText}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={deleteSelected} style={[s.miniBtn, s.miniBtnDanger]} activeOpacity={0.7}>
                  <Text style={[s.miniBtnText, { color: '#E06B4A' }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Text style={s.crashBody} selectable>{selectedBody}</Text>
            </ScrollView>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

function getStyles(t: any, aink: string, mode: 'dark' | 'light') {
  return StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 16 },
    backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: t.chipBg, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontFamily: font.uiBold, fontSize: 18, color: aink },
    clearBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 100, backgroundColor: t.chipBg },
    clearText: { fontFamily: font.uiBold, fontSize: 12, color: '#E06B4A' },

    card: { marginHorizontal: 20, marginBottom: 16, padding: 20, backgroundColor: t.surface, borderRadius: 24, borderWidth: 1, borderColor: t.rule },
    cardTitle: { fontFamily: font.uiBold, fontSize: 14, color: t.ink },
    subnote: { fontFamily: font.ui, fontSize: 12, color: t.mute, lineHeight: 17, marginTop: 6 },

    iconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: alpha(aink, 0.15), alignItems: 'center', justifyContent: 'center' },

    row: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.surface, borderRadius: 18, borderWidth: 1, borderColor: t.rule, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10 },
    rowName: { fontFamily: font.monoBold, fontSize: 12, color: t.ink },
    rowMeta: { fontFamily: font.mono, fontSize: 10, color: t.mute, marginTop: 3 },

    tag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    tagJs: { backgroundColor: alpha(accent.v, 0.22) },
    tagNative: { backgroundColor: alpha('#E06B4A', 0.22) },
    tagText: { fontFamily: font.monoBold, fontSize: 9, color: t.ink, letterSpacing: 0.5 },

    miniBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, backgroundColor: t.chipBg, borderWidth: 1, borderColor: t.rule },
    miniBtnDanger: { borderColor: alpha('#E06B4A', 0.4) },
    miniBtnText: { fontFamily: font.uiBold, fontSize: 11, color: t.ink },

    crashBody: { fontFamily: font.mono, fontSize: 10, color: t.ink, lineHeight: 15, paddingVertical: 4 },

    secondaryBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 100, backgroundColor: t.chipBg, borderWidth: 1, borderColor: t.rule },
    secondaryBtnText: { fontFamily: font.uiBold, fontSize: 12, color: t.ink },
  });
}
