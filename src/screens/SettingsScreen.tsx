import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LiquidDialog } from '../components/LiquidDialog';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useStore } from '../store';
import { MODELS } from '../modules/LeapModule';
import { TransactionRepository } from '../database/TransactionRepository';
import { themes, accent, accentInk, font, alpha, ThemeMode } from '../theme';
import LiquidIcon from '../components/LiquidIcons';
import { RootStackParams } from '../App';

export default function SettingsScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParams>>();
  const {
    modelLoaded, themeMode,
    importPhase: phase, importSmsTotal: smsTotal,
    importProcessed: processed, importTxFound: txFound, importErrorMsg: errorMsg,
  } = useStore();
  const t = themes[themeMode];
  const aink = accentInk(themeMode);

  const [txCount, setTxCount] = useState(0);

  useEffect(() => {
    setTxCount(TransactionRepository.getCount());
  }, []);

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

        {/* SMS Import Feature → SyncSms screen */}
        <TouchableOpacity style={s.card} onPress={() => nav.navigate('SyncSms')} activeOpacity={0.7}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: font.uiBold, fontSize: 15, color: t.ink }}>SMS Import & Sync</Text>
              <Text style={{ fontFamily: font.ui, fontSize: 12, color: t.mute, marginTop: 2 }}>
                {phase === 'idle' ? 'Pick a date range to extract transactions'
                  : phase === 'done' ? `Last run: ${txFound} tx from ${smsTotal} sms`
                  : phase === 'aborted' ? `Aborted: ${txFound} tx from ${processed} processed`
                  : phase === 'error' ? (errorMsg ?? 'Last run failed')
                  : `Running… ${progressPct}% (${processed}/${smsTotal})`}
              </Text>
            </View>
            <View style={{ paddingHorizontal: 10, paddingVertical: 6, backgroundColor: alpha(accent.v, 0.22), borderRadius: 100, marginRight: 8 }}>
              <Text style={{ fontFamily: font.monoBold, fontSize: 10, color: aink }}>{phase}</Text>
            </View>
            <LiquidIcon name="chevron" size={16} color={t.mute} style={{ transform: [{ rotate: '-90deg' }] }} />
          </View>
        </TouchableOpacity>

        {/* Global Navigation List */}
        <View style={[s.card, { paddingVertical: 8, paddingHorizontal: 0 }]}>
           <SettingRow t={t} icon="shield" name="SMS Permissions & Sync" sub="Private scraping, automated tracking" onPress={() => nav.navigate('SmsPermissions')} />
           <SettingRow t={t} icon="bolt" name="Notifications" sub="Spending alerts, system updates" onPress={() => nav.navigate('Notifications')} />
           <SettingRow t={t} icon="download" name="Backup & Restore" sub="Export portable file, import on reinstall" onPress={() => nav.navigate('Backup')} />
           <SettingRow t={t} icon="cog" name="Crash Logs" sub="Local-only diagnostics, share manually" last onPress={() => nav.navigate('CrashLogs')} />
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

  });
}
