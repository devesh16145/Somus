import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useStore } from '../store';
import { themes, accent, accentInk, font, alpha } from '../theme';
import LiquidIcon from '../components/LiquidIcons';
import { LiquidDialog } from '../components/LiquidDialog';
import { MODELS } from '../modules/LeapModule';

export default function AiManagementScreen() {
  const nav = useNavigation();
  const { themeMode, modelLoaded } = useStore();
  const t = themes[themeMode];
  const aink = accentInk(themeMode);

  const s = getStyles(t, aink);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
           <View style={{ flexDirection: 'row', alignItems: 'center' }}>
             <TouchableOpacity onPress={() => nav.goBack()} style={{ padding: 8 }}>
               <LiquidIcon name="arrowRt" size={20} color={aink} style={{ transform: [{ rotate: '180deg' }] }} />
             </TouchableOpacity>
             <Text style={s.headerTitle} numberOfLines={2}>Local AI{'\n'}Management</Text>
           </View>
           {modelLoaded && (
             <View style={s.fastMode}>
               <LiquidIcon name="check" size={10} color={aink} strokeWidth={2.5} />
               <Text style={s.fastModeText}>READY</Text>
             </View>
           )}
        </View>

        {/* Hero Copy */}
        <View style={s.hero}>
          <Text style={s.heroTitle}>Intelligence at the Edge</Text>
          <Text style={s.heroSub}>Manage your on-device language models for private, offline financial processing.</Text>
        </View>

        {/* Section: Downloaded Models */}
        <SectionHeader title="DOWNLOADED MODELS" t={t} />
        <View style={s.card}>
           <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
             <View style={[s.iconBox, { backgroundColor: aink }]}>
               <LiquidIcon name="chip" size={18} color={t.bg} />
             </View>
             <View style={{ marginLeft: 14 }}>
               <Text style={s.cardTitle}>LFM2 1.2B Instruct</Text>
               <View style={s.chipYellow}>
                 <Text style={s.chipYellowText}>{modelLoaded ? 'DOWNLOADED' : 'NOT LOADED'}</Text>
               </View>
             </View>
           </View>

           <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
             <InfoCol title="PARAMS" value="1.2B" t={t} />
             <InfoCol title="DISK SIZE" value={`~${MODELS.DEFAULT.sizeMb}MB`} t={t} />
             <InfoCol title="EST. RAM" value="~5GB" t={t} />
           </View>

           <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={[s.btnPrimary, { opacity: modelLoaded ? 1 : 0.5 }]}>
                <LiquidIcon name="check" size={14} color={t.bg} strokeWidth={2.5} />
                <Text style={s.btnPrimaryText}>Active</Text>
              </View>
           </View>
        </View>

        {/* Section: Cloud Repository */}
        <SectionHeader title="CLOUD REPOSITORY" t={t} />
        <View style={[s.card, { opacity: 0.65 }]}>
           <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
             <View style={[s.iconBox, { backgroundColor: alpha(aink, 0.15) }]}>
               <LiquidIcon name="search" size={18} color={aink} strokeWidth={2.5} />
             </View>
             <View style={{ marginLeft: 14, flex: 1 }}>
               <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                 <Text style={s.cardTitle}>LFM Vision</Text>
                 <View style={{ paddingHorizontal: 8, paddingVertical: 3, backgroundColor: alpha(t.ink, 0.1), borderRadius: 8 }}>
                   <Text style={{ fontFamily: font.monoBold, fontSize: 9, color: t.inkDim, letterSpacing: 0.5 }}>COMING SOON</Text>
                 </View>
               </View>
               <Text style={s.cardSub}>Receipt scanning via on-device VLM. Available in a future release.</Text>
             </View>
           </View>

           <TouchableOpacity
             style={[s.btnPrimary, { backgroundColor: alpha(aink, 0.15) }]}
             activeOpacity={0.7}
             onPress={() => LiquidDialog.show({
               title: 'Coming soon',
               message: 'Vision-language model support is in development. Download will be enabled when available.',
               buttons: [{ text: 'OK', style: 'cancel' }],
             })}
           >
             <Text style={[s.btnPrimaryText, { color: t.inkDim }]}>Unavailable</Text>
           </TouchableOpacity>
        </View>

        {/* Info Note */}
        <View style={[s.card, { backgroundColor: alpha('#ecfccb', 0.5) }]}>
           <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <View style={[s.iconBoxSmall, { backgroundColor: alpha('#a3e635', 0.5) }]}>
                 <LiquidIcon name="sun" size={14} color={'#4d7c0f'} />
              </View>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={{ fontFamily: font.uiBold, fontSize: 13, color: '#3f6212', marginBottom: 6 }}>Performance Note</Text>
                <Text style={{ fontFamily: font.ui, fontSize: 12, color: '#4d7c0f', lineHeight: 18 }}>
                  Larger models provide superior accuracy for complex receipt scanning and semantic categorization, but may consume significantly more battery during prolonged indexing sessions.
                </Text>
              </View>
           </View>
        </View>

        {/* Bottom Small Cards */}
        <View style={s.cardSmall}>
           <LiquidIcon name="bolt" size={16} color={aink} strokeWidth={2.5} />
           <View style={{ marginTop: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <Text style={{ fontFamily: font.display, fontSize: 28, color: t.ink }}>~10</Text>
                <Text style={{ fontFamily: font.mono, fontSize: 14, color: t.mute, marginLeft: 6 }}>sec/SMS</Text>
              </View>
              <Text style={{ fontFamily: font.monoBold, fontSize: 10, color: t.mute, letterSpacing: 1, marginTop: 4 }}>INFERENCE LATENCY</Text>
           </View>
        </View>

        <View style={[s.cardSmall, { marginBottom: 30 }]}>
           <LiquidIcon name="shield" size={16} color={'#65a30d'} strokeWidth={2.5} />
           <View style={{ marginTop: 24 }}>
              <Text style={{ fontFamily: font.uiBold, fontSize: 15, color: t.ink, marginBottom: 4 }}>100% Private</Text>
              <Text style={{ fontFamily: font.monoBold, fontSize: 10, color: t.mute, letterSpacing: 1 }}>ZERO-CLOUD SYNC</Text>
           </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ title, t }: { title: string, t: any }) {
  return <Text style={{ marginHorizontal: 22, marginTop: 20, marginBottom: 12, fontFamily: font.monoBold, fontSize: 11, color: t.mute, letterSpacing: 1.5 }}>{title}</Text>;
}

function InfoCol({ title, value, t }: { title: string, value: string, t: any }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontFamily: font.mono, fontSize: 9, color: t.mute, letterSpacing: 0.5 }}>{title}</Text>
      <Text style={{ fontFamily: font.uiBold, fontSize: 13, color: t.ink, marginTop: 4 }}>{value}</Text>
    </View>
  );
}

function getStyles(t: any, aink: string) {
  return StyleSheet.create({
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10, paddingTop: 14, paddingRight: 20, paddingBottom: 10 },
    headerTitle: { fontFamily: font.uiBold, fontSize: 18, color: t.ink, marginLeft: 4, lineHeight: 22 },
    
    fastMode: { flexDirection: 'row', alignItems: 'center', backgroundColor: alpha(aink, 0.15), paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, gap: 6 },
    fastModeText: { fontFamily: font.monoBold, fontSize: 9, color: aink, letterSpacing: 0.5 },

    hero: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 10 },
    heroTitle: { fontFamily: font.display, fontSize: 28, color: t.ink, letterSpacing: -1, marginBottom: 8 },
    heroSub: { fontFamily: font.ui, fontSize: 14, color: t.inkDim, lineHeight: 22, maxWidth: 300 },

    card: { marginHorizontal: 20, marginBottom: 16, padding: 20, backgroundColor: t.surface, borderRadius: 24, borderWidth: 1, borderColor: t.rule },
    cardTitle: { fontFamily: font.uiBold, fontSize: 16, color: t.ink },
    cardSub: { fontFamily: font.ui, fontSize: 11, color: t.mute, marginTop: 4 },

    iconBox: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    iconBoxSmall: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

    chipYellow: { backgroundColor: '#ecfccb', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 6 },
    chipYellowText: { fontFamily: font.monoBold, fontSize: 9, color: '#4d7c0f', letterSpacing: 0.5 },

    btnPrimary: { flex: 1, backgroundColor: aink, paddingVertical: 14, borderRadius: 100, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
    btnPrimaryText: { fontFamily: font.uiBold, fontSize: 14, color: t.bg },
    btnSecondary: { flex: 1, backgroundColor: t.chipBg, paddingVertical: 14, borderRadius: 100, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
    btnSecondaryText: { fontFamily: font.uiBold, fontSize: 14, color: t.inkDim },

    cardSmall: { marginHorizontal: 20, marginTop: 12, padding: 20, backgroundColor: t.surface, borderRadius: 22, borderWidth: 1, borderColor: t.rule },
  });
}
