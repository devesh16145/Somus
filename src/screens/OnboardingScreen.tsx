import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  PermissionsAndroid, ScrollView, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { LeapModule, MODELS } from '../modules/LeapModule';
import { useStore } from '../store';
import { RootStackParams } from '../App';
import { themes, accent, accentInk, font, alpha, ThemeMode } from '../theme';
import LiquidIcon from '../components/LiquidIcons';

type Nav = NativeStackNavigationProp<RootStackParams, 'Onboarding'>;
type Step = 'welcome' | 'sms_permission' | 'model_download';

export default function OnboardingScreen() {
  const nav = useNavigation<Nav>();
  const { setModelLoaded, setDownloading, setDownloadProgress, themeMode } = useStore();
  const t = themes[themeMode];
  const aink = accentInk(themeMode);

  const [step, setStep]               = useState<Step>('welcome');
  const [smsGranted, setSmsGranted]   = useState(false);
  const [downloading, setLocalDL]     = useState(false);
  const [progress, setProgress]       = useState(0);
  const [error, setError]             = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, [step]);

  useEffect(() => {
    LeapModule.isModelLoaded().then((loaded) => {
      if (loaded) { setModelLoaded(true); nav.replace('Main'); }
    });
  }, []);

  useEffect(() => {
    const sub = LeapModule.onModelProgress(({ progress: p }) => {
      setProgress(p); setDownloadProgress(p);
    });
    return () => sub.remove();
  }, []);

  async function requestSmsPermission() {
    setError(null);
    try {
      const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_SMS);
      const granted = result === 'granted';
      setSmsGranted(granted);
      if (granted) { fadeAnim.setValue(0); setStep('model_download'); }
      else setError('SMS access is required to automatically track your transactions.');
    } catch (e) { setError('Permission request failed. Please try again.'); }
  }

  async function downloadModel() {
    setError(null); setLocalDL(true); setDownloading(true); setProgress(0);
    try {
      const model = MODELS.DEFAULT;
      await LeapModule.downloadAndLoadModel(model.slug, model.quant);
      setProgress(1); setDownloadProgress(1); setModelLoaded(true);
      setLocalDL(false); setDownloading(false);
      nav.replace('Main');
    } catch (e: any) {
      setError(e?.message ?? 'Download failed. Check your internet connection.');
      setLocalDL(false); setDownloading(false);
    }
  }

  const s = getStyles(t, aink, themeMode);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
          {step === 'welcome' && (
            <View style={s.stepWrap}>
              <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', backgroundColor: alpha(accent.v, 0.1), paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, marginBottom: 24, borderWidth: 1, borderColor: alpha(accent.v, 0.2) }}>
                <LiquidIcon name="shield" size={14} color={aink} />
                <Text style={{ fontFamily: font.monoBold, fontSize: 11, color: aink, marginLeft: 6, letterSpacing: 0.5 }}>Privacy First</Text>
              </View>
              
              <Text style={[s.title, { letterSpacing: -1.0, fontSize: 38 }]}>Your data is yours.</Text>
              <Text style={[s.descSm, { marginTop: 4, marginBottom: 36, lineHeight: 24 }]}>
                Somus reads your SMS financial alerts on this device only. We never see your data—because we don't need to.
              </Text>

              <View style={{ gap: 24, marginBottom: 40 }}>
                <FeatureRow t={t} icon="chip" title="Zero-Cloud Architecture" sub="All transaction parsing happens 100% on your device. Your data never touches a server." />
                <FeatureRow t={t} icon="shield" title="End-to-End Privacy" sub="Automated categorizing without human eyes. Private by design, not just by policy." />
                <FeatureRow t={t} icon="home" title="Sandboxed by Android" sub="Your data lives in this app's private storage, isolated from other apps on your device." />
              </View>

              <TouchableOpacity style={s.btn} onPress={() => { fadeAnim.setValue(0); setStep('sms_permission'); }}>
                <Text style={s.btnText}>Get Started &#x2192;</Text>
              </TouchableOpacity>

              <TouchableOpacity style={{ alignSelf: 'center', marginTop: 20, marginBottom: 50 }}>
                <Text style={{ fontFamily: font.uiBold, fontSize: 14, color: aink }}>Learn about security</Text>
              </TouchableOpacity>

              <View style={{ gap: 12 }}>
                <CardIconRow t={t} aink={aink} icon="home" title="Local Storage" desc="SQLite database stored privately in this app's local storage, accessible only to Somus." />
                <CardIconRow t={t} aink={aink} icon="dots" title="No Syncing" desc="We intentionally removed cloud sync to eliminate the primary vector for data breaches." />
                <CardIconRow t={t} aink={aink} icon="chip" title="Open Logic" desc="Our parsing rules are transparent. You see exactly what the app sees and how it sorts." />
              </View>

              <View style={{ alignItems: 'center', marginTop: 60, marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#8b949e' }} />
                  <Text style={{ fontFamily: font.mono, fontSize: 11, color: t.mute }}>100% On-device · Zero Cloud Sync</Text>
                </View>
                <Text style={{ fontFamily: font.mono, fontSize: 10, color: t.mute }}>© 2026 Somus. Your privacy is our architecture.</Text>
              </View>
            </View>
          )}

          {step === 'sms_permission' && (
            <View style={s.stepWrap}>
              <Text style={s.stepTrack}>STEP 01 · 03</Text>
              <Text style={s.titleMd}>Allow SMS access</Text>
              <Text style={s.descSm}>
                Somus reads your inbox to detect bank messages and categorise spending automatically.
                Processed entirely on-device.
              </Text>

              <View style={s.card}>
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <LiquidIcon name="shield" size={24} color={t.ink} />
                </View>
                <Text style={{ fontFamily: font.monoBold, fontSize: 13, color: t.ink, marginBottom: 4 }}>READ_SMS</Text>
                <Text style={{ fontFamily: font.mono, fontSize: 12, color: t.mute }}>Required to scan incoming and legacy bank receipts.</Text>
              </View>

              {error && <Text style={s.error}>{error}</Text>}

              <View style={{ flex: 1 }} />
              <TouchableOpacity style={s.btn} onPress={requestSmsPermission}>
                <Text style={s.btnText}>Grant Access</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 'model_download' && (
            <View style={s.stepWrap}>
              <Text style={s.stepTrack}>STEP 02 · 03</Text>

              <Text style={s.titleMd}>Select AI Engine</Text>
              <Text style={[s.descSm, { marginBottom: 28 }]}>
                Choose the foundation model that powers Somus. Processing happens entirely on-device, preserving full privacy.
              </Text>

              <View style={{ gap: 14 }}>
                <TouchableOpacity style={[s.card, { marginTop: 0, padding: 18, borderColor: accent.v, backgroundColor: alpha(accent.v, 0.05) }]} activeOpacity={0.8}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={{ fontFamily: font.uiBold, fontSize: 16, color: t.ink }}>LFM 1.2B Instruct</Text>
                    <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: accent.v, alignItems: 'center', justifyContent: 'center' }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.bg }} />
                    </View>
                  </View>
                  <Text style={{ fontFamily: font.ui, fontSize: 13, color: t.mute, lineHeight: 18, marginBottom: 12 }}>Balanced foundation model optimized for mobile financial parsing and stable device thermals.</Text>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: alpha(t.ink, 0.05), borderRadius: 6 }}><Text style={{ fontFamily: font.monoBold, fontSize: 9, color: t.inkDim }}>~1.2 GB</Text></View>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: alpha(t.ink, 0.05), borderRadius: 6 }}><Text style={{ fontFamily: font.monoBold, fontSize: 9, color: t.inkDim }}>DEFAULT</Text></View>
                  </View>
                </TouchableOpacity>

                <View style={[s.card, { marginTop: 0, padding: 18, opacity: 0.6 }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ fontFamily: font.uiBold, fontSize: 16, color: t.ink }}>LFM Vision</Text>
                      <View style={{ paddingHorizontal: 6, paddingVertical: 3, backgroundColor: alpha(t.ink, 0.1), borderRadius: 6 }}>
                        <Text style={{ fontFamily: font.monoBold, fontSize: 9, color: t.inkDim, letterSpacing: 0.5 }}>COMING SOON</Text>
                      </View>
                    </View>
                    <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: t.rule }} />
                  </View>
                  <Text style={{ fontFamily: font.ui, fontSize: 13, color: t.mute, lineHeight: 18 }}>Vision-language model for camera receipt scanning. Available in a future release.</Text>
                </View>
              </View>

              <View style={{ flex: 1, minHeight: 40 }} />

              {downloading ? (
                <View style={{ marginTop: 22 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontFamily: font.mono, fontSize: 11, color: t.inkDim }}>downloading...</Text>
                    <Text style={{ fontFamily: font.monoBold, fontSize: 11, color: aink }}>
                      {Math.round(progress * 100)}% · {Math.round(progress * MODELS.DEFAULT.sizeMb)} / {MODELS.DEFAULT.sizeMb} MB
                    </Text>
                  </View>
                  <View style={{ height: 6, backgroundColor: t.chipBg, borderRadius: 3, overflow: 'hidden' }}>
                    <View style={{ width: `${Math.max(5, progress * 100)}%`, height: '100%', backgroundColor: accent.v, borderRadius: 3, boxShadow: `0 0 12px ${accent.v}` }} />
                  </View>
                </View>
              ) : (
                <>
                  {error && <Text style={s.error}>{error}</Text>}
                  <TouchableOpacity style={s.btn} onPress={downloadModel}>
                    <Text style={s.btnText}>Download Local Node</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureRow({ t, icon, title, sub }: any) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: t.rule }}>
        <LiquidIcon name={icon} size={20} color={t.ink} strokeWidth={1.5} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: font.uiBold, fontSize: 15, color: t.ink, marginBottom: 2 }}>{title}</Text>
        <Text style={{ fontFamily: font.mono, fontSize: 11, color: t.mute }}>{sub}</Text>
      </View>
    </View>
  );
}

function CardIconRow({ t, aink, icon, title, desc }: any) {
  return (
    <View style={{ backgroundColor: t.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: t.rule }}>
      <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: alpha(aink, 0.15), alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        <LiquidIcon name={icon} size={16} color={aink} />
      </View>
      <Text style={{ fontFamily: font.uiBold, fontSize: 14, color: t.ink, marginBottom: 6 }}>{title}</Text>
      <Text style={{ fontFamily: font.ui, fontSize: 13, color: t.mute, lineHeight: 20 }}>{desc}</Text>
    </View>
  );
}

function InfoRow({ t, label, value, valueColor, last }: any) {
  return (
    <View style={[{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 }, !last && { borderBottomWidth: 1, borderBottomColor: t.rule }]}>
      <Text style={{ fontFamily: font.mono, fontSize: 12, color: t.mute }}>{label}</Text>
      <Text style={{ fontFamily: font.monoBold, fontSize: 12, color: valueColor || t.ink }}>{value}</Text>
    </View>
  );
}

function getStyles(t: any, aink: string, mode: ThemeMode) {
  return StyleSheet.create({
    stepWrap: { flex: 1, paddingTop: 12 },
    stepTrack: { fontFamily: font.monoBold, fontSize: 10, color: aink, letterSpacing: 1.5, marginBottom: 24 },
    
    title: { fontFamily: font.display, fontSize: 44, fontWeight: '500', letterSpacing: -1.5, lineHeight: 48, color: t.ink, marginBottom: 12 },
    titleMd: { fontFamily: font.display, fontSize: 32, fontWeight: '500', letterSpacing: -1, color: t.ink, marginBottom: 12 },
    desc: { fontFamily: font.displayItalic, fontSize: 24, color: t.mute, lineHeight: 32 },
    descSm: { fontFamily: font.ui, fontSize: 14, color: t.inkDim, lineHeight: 22, maxWidth: 320 },

    blob: { alignSelf: 'flex-start', width: 92, height: 92, borderRadius: 28, backgroundColor: accent.v, alignItems: 'center', justifyContent: 'center', marginBottom: 24, boxShadow: `0 0 50px ${alpha(accent.v, 0.5)}` },
    blobText: { fontFamily: font.display, fontSize: 50, color: '#000', letterSpacing: -2, paddingBottom: 8 },
    blobBadge: { position: 'absolute', top: -10, right: -10, width: 30, height: 30, borderRadius: 15, backgroundColor: t.surface, borderWidth: 2, borderColor: t.bg, alignItems: 'center', justifyContent: 'center' },

    card: { backgroundColor: t.surface, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: t.rule, marginTop: 12 },
    
    btn: { width: '100%', paddingVertical: 16, backgroundColor: t.ink === '#f2f2f5' ? '#f2f2f5' : t.ink, borderRadius: 16, alignItems: 'center', marginTop: 24 },
    btnText: { fontFamily: font.display, fontSize: 15, fontWeight: '600', color: t.bg },

    error: { marginTop: 16, fontFamily: font.mono, fontSize: 12, color: '#FF4444', backgroundColor: alpha('#FF4444', 0.1), padding: 12, borderRadius: 8 },
  });
}
