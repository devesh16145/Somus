import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { themes, accent, accentInk, font, alpha } from '../theme';
import { useStore } from '../store';
import LiquidIcon from '../components/LiquidIcons';

export default function SmsPermissionsScreen() {
  const nav = useNavigation();
  const { themeMode } = useStore();
  const t = themes[themeMode];
  const aink = accentInk(themeMode);

  const [scrapingEnabled, setScrapingEnabled] = useState(true);
  const [backgroundSync, setBackgroundSync] = useState(false);
  const [bankingOnly, setBankingOnly] = useState(true);

  const s = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 16 },
    headerTitle: { fontFamily: font.uiBold, fontSize: 18, color: t.ink, marginLeft: 8 },
    card: { marginHorizontal: 20, marginBottom: 16, padding: 20, backgroundColor: t.surface, borderRadius: 28, borderWidth: 1, borderColor: t.rule },
    settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
    settingTitle: { fontFamily: font.uiBold, fontSize: 16, color: t.ink, marginBottom: 4 },
    settingSub: { fontFamily: font.ui, fontSize: 13, color: t.mute, maxWidth: '85%' }
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={s.header}>
         <TouchableOpacity onPress={() => nav.goBack()} style={{ padding: 4 }}>
           <LiquidIcon name="arrowRt" size={24} color={t.ink} style={{ transform: [{ rotate: '180deg' }] }} />
         </TouchableOpacity>
         <Text style={s.headerTitle}>SMS Permissions</Text>
      </View>
      
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={s.card}>
           <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 }}>
             <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: alpha(aink, 0.15), alignItems: 'center', justifyContent: 'center' }}>
               <LiquidIcon name="dots" size={20} color={aink} />
             </View>
             <View style={{ flex: 1 }}>
               <Text style={{ fontFamily: font.uiBold, fontSize: 16, color: t.ink }}>Inbox Sync</Text>
               <Text style={{ fontFamily: font.ui, fontSize: 12, color: t.inkDim }}>Offline, on-device intelligence</Text>
             </View>
           </View>

           <View style={[s.settingRow, { borderBottomWidth: 1, borderBottomColor: t.rule }]}>
             <View style={{ flex: 1 }}>
               <Text style={s.settingTitle}>Private Scraping</Text>
               <Text style={s.settingSub}>Allows local AI to read transaction patterns from SMS safely.</Text>
             </View>
             <Switch value={scrapingEnabled} onValueChange={setScrapingEnabled} trackColor={{ true: aink }} />
           </View>

           <View style={[s.settingRow, { borderBottomWidth: 1, borderBottomColor: t.rule }]}>
             <View style={{ flex: 1 }}>
               <Text style={s.settingTitle}>Background Tracking</Text>
               <Text style={s.settingSub}>Automatically fetch messages and sync data seamlessly.</Text>
             </View>
             <Switch value={backgroundSync} onValueChange={setBackgroundSync} trackColor={{ true: aink }} />
           </View>

           <View style={s.settingRow}>
             <View style={{ flex: 1 }}>
               <Text style={s.settingTitle}>Banking Senders Only</Text>
               <Text style={s.settingSub}>Aggressive filtering to ignore personal messages completely.</Text>
             </View>
             <Switch value={bankingOnly} onValueChange={setBankingOnly} trackColor={{ true: aink }} />
           </View>
        </View>

        {/* Info Note */}
        <View style={[s.card, { backgroundColor: alpha('#a3e635', 0.1) }]}>
           <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <LiquidIcon name="shield" size={16} color={'#4d7c0f'} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={{ fontFamily: font.uiBold, fontSize: 14, color: '#3f6212', marginBottom: 6 }}>100% Local Processing</Text>
                <Text style={{ fontFamily: font.ui, fontSize: 13, color: '#4d7c0f', lineHeight: 20 }}>
                  We never upload SMS data to the cloud. All language inference parsing takes place on-device via your assigned local LFM module.
                </Text>
              </View>
           </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
