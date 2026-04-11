import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  PermissionsAndroid, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { LeapModule, MODELS } from '../modules/LeapModule';
import { useStore } from '../store';
import { RootStackParams } from '../App';

type Nav = NativeStackNavigationProp<RootStackParams, 'Onboarding'>;

type Step = 'welcome' | 'sms_permission' | 'model_download' | 'done';

export default function OnboardingScreen() {
  const nav = useNavigation<Nav>();
  const { setModelLoaded, setDownloading, setDownloadProgress, modelLoaded } = useStore();

  const [step, setStep]               = useState<Step>('welcome');
  const [smsGranted, setSmsGranted]   = useState(false);
  const [downloading, setLocalDL]     = useState(false);
  const [progress, setProgress]       = useState(0);
  const [error, setError]             = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, [step]);

  // If model already loaded from a previous session, skip straight to main
  useEffect(() => {
    LeapModule.isModelLoaded().then((loaded) => {
      if (loaded) {
        setModelLoaded(true);
        nav.replace('Main');
      }
    });
  }, []);

  // Subscribe to download progress
  useEffect(() => {
    const sub = LeapModule.onModelProgress(({ progress: p }) => {
      setProgress(p);
      setDownloadProgress(p);
    });
    return () => sub.remove();
  }, []);

  // ── Handlers ──────────────────────────────────────────────────

  async function requestSmsPermission() {
    setError(null);
    try {
      const result = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
      ]);
      const granted =
        result[PermissionsAndroid.PERMISSIONS.READ_SMS] === 'granted' &&
        result[PermissionsAndroid.PERMISSIONS.RECEIVE_SMS] === 'granted';

      setSmsGranted(granted);
      if (granted) {
        fadeAnim.setValue(0);
        setStep('model_download');
      } else {
        setError('SMS access is required to automatically track your transactions.');
      }
    } catch (e) {
      setError('Permission request failed. Please try again.');
    }
  }

  async function downloadModel() {
    setError(null);
    setLocalDL(true);
    setDownloading(true);
    setProgress(0);
    try {
      const model = MODELS.DEFAULT;
      await LeapModule.downloadAndLoadModel(model.slug, model.quant);
      // Model loaded — force progress to 100% and transition
      setProgress(1);
      setDownloadProgress(1);
      setModelLoaded(true);
      setLocalDL(false);
      setDownloading(false);
      fadeAnim.setValue(0);
      setStep('done');
    } catch (e: any) {
      setError(e?.message ?? 'Download failed. Check your internet connection and try again.');
      setLocalDL(false);
      setDownloading(false);
    }
  }

  function goToApp() {
    nav.replace('Main');
  }

  // ── Renders ───────────────────────────────────────────────────

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>

          {step === 'welcome' && <WelcomeStep onNext={() => { fadeAnim.setValue(0); setStep('sms_permission'); }} />}

          {step === 'sms_permission' && (
            <PermissionStep
              onGrant={requestSmsPermission}
              error={error}
            />
          )}

          {step === 'model_download' && (
            <ModelDownloadStep
              downloading={downloading}
              progress={progress}
              error={error}
              onDownload={downloadModel}
            />
          )}

          {step === 'done' && <DoneStep onEnter={goToApp} />}

        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Step components ───────────────────────────────────────────

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <View style={s.stepContainer}>
      <View style={s.logoContainer}>
        <Text style={s.logoText}>S</Text>
      </View>
      <Text style={s.appName}>Somus</Text>
      <Text style={s.tagline}>Your finances.{'\n'}Completely private.</Text>

      <View style={s.featureList}>
        <FeatureRow icon="📱" title="Reads your SMS" sub="Automatically catches every transaction" />
        <FeatureRow icon="🤖" title="AI runs on your phone" sub="No cloud. No servers. No cost." />
        <FeatureRow icon="🔒" title="Zero data leaves your device" sub="Your money data is yours alone" />
        <FeatureRow icon="🌍" title="8 languages supported" sub="EN · AR · ZH · FR · DE · JA · KO · ES" />
      </View>

      <TouchableOpacity style={s.primaryBtn} onPress={onNext} activeOpacity={0.85}>
        <Text style={s.primaryBtnText}>Get Started</Text>
      </TouchableOpacity>

      <Text style={s.footNote}>
        Somus never transmits your SMS or financial data to any server.
      </Text>
    </View>
  );
}

function PermissionStep({ onGrant, error }: { onGrant: () => void; error: string | null }) {
  return (
    <View style={s.stepContainer}>
      <Text style={s.stepNumber}>01</Text>
      <Text style={s.stepTitle}>Allow SMS access</Text>
      <Text style={s.stepDesc}>
        Somus reads your inbox to detect bank messages and categorise spending automatically.
        Your messages are processed entirely on-device — never uploaded anywhere.
      </Text>

      <View style={s.permissionCard}>
        <Text style={s.permissionIcon}>✉</Text>
        <Text style={s.permissionName}>READ_SMS</Text>
        <Text style={s.permissionDesc}>Read incoming and existing SMS messages</Text>
      </View>
      <View style={s.permissionCard}>
        <Text style={s.permissionIcon}>📶</Text>
        <Text style={s.permissionName}>RECEIVE_SMS</Text>
        <Text style={s.permissionDesc}>Get notified when new SMS arrives</Text>
      </View>

      {error && <Text style={s.errorText}>{error}</Text>}

      <TouchableOpacity style={s.primaryBtn} onPress={onGrant} activeOpacity={0.85}>
        <Text style={s.primaryBtnText}>Grant SMS Access</Text>
      </TouchableOpacity>

      <Text style={s.footNote}>
        Android will show its standard permission dialog. Tap "Allow" on both.
      </Text>
    </View>
  );
}

function ModelDownloadStep({
  downloading, progress, error, onDownload,
}: {
  downloading: boolean;
  progress: number;
  error: string | null;
  onDownload: () => void;
}) {
  const pct = Math.round(progress * 100);
  const sizeMb = MODELS.DEFAULT.sizeMb;

  return (
    <View style={s.stepContainer}>
      <Text style={s.stepNumber}>02</Text>
      <Text style={s.stepTitle}>Download AI Model</Text>
      <Text style={s.stepDesc}>
        Somus uses {MODELS.DEFAULT.slug} — a {sizeMb}MB language model that runs
        entirely on your phone. This is a one-time download. After this, Somus works offline forever.
      </Text>

      <View style={s.modelCard}>
        <View style={s.modelCardRow}>
          <Text style={s.modelLabel}>Model</Text>
          <Text style={s.modelValue}>{MODELS.DEFAULT.slug}</Text>
        </View>
        <View style={s.modelCardRow}>
          <Text style={s.modelLabel}>Quantization</Text>
          <Text style={s.modelValue}>{MODELS.DEFAULT.quant}</Text>
        </View>
        <View style={s.modelCardRow}>
          <Text style={s.modelLabel}>Download size</Text>
          <Text style={s.modelValue}>~{sizeMb} MB</Text>
        </View>
        <View style={s.modelCardRow}>
          <Text style={s.modelLabel}>RAM usage</Text>
          <Text style={s.modelValue}>~1.1 GB</Text>
        </View>
        <View style={[s.modelCardRow, { borderBottomWidth: 0 }]}>
          <Text style={s.modelLabel}>Cloud calls</Text>
          <Text style={[s.modelValue, { color: '#00FF94' }]}>Zero</Text>
        </View>
      </View>

      {downloading && (
        <View style={s.progressContainer}>
          <View style={s.progressBar}>
            <View style={[s.progressFill, { width: `${Math.max(pct, 5)}%` }]} />
          </View>
          <Text style={s.progressText}>
            {pct >= 90
              ? 'Loading AI model into memory...'
              : pct > 0
                ? `${pct}%  ·  ${Math.round((pct / 100) * sizeMb)} MB of ${sizeMb} MB`
                : 'Preparing download...'}
          </Text>
          <ActivityIndicator color="#00FF94" style={{ marginTop: 8 }} />
        </View>
      )}

      {error && <Text style={s.errorText}>{error}</Text>}

      {!downloading && (
        <TouchableOpacity style={s.primaryBtn} onPress={onDownload} activeOpacity={0.85}>
          <Text style={s.primaryBtnText}>Download Model  ({sizeMb} MB)</Text>
        </TouchableOpacity>
      )}

      <Text style={s.footNote}>
        Connect to Wi-Fi before downloading. The model is stored locally and never re-downloaded.
      </Text>
    </View>
  );
}

function DoneStep({ onEnter }: { onEnter: () => void }) {
  return (
    <View style={s.stepContainer}>
      <View style={s.doneCircle}>
        <Text style={s.doneCheck}>✓</Text>
      </View>
      <Text style={s.stepTitle}>You're all set</Text>
      <Text style={s.stepDesc}>
        Somus is ready. Your AI model is loaded and running entirely on your device.
        Let's import your recent transactions.
      </Text>

      <TouchableOpacity style={s.primaryBtn} onPress={onEnter} activeOpacity={0.85}>
        <Text style={s.primaryBtnText}>Open Somus</Text>
      </TouchableOpacity>
    </View>
  );
}

function FeatureRow({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <View style={s.featureRow}>
      <Text style={s.featureIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={s.featureTitle}>{title}</Text>
        <Text style={s.featureSub}>{sub}</Text>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#0D0D0D' },
  scroll:         { flexGrow: 1, padding: 24 },
  stepContainer:  { flex: 1, paddingTop: 24 },

  logoContainer:  {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: '#00FF94', alignItems: 'center',
    justifyContent: 'center', marginBottom: 20,
  },
  logoText:       { fontSize: 36, fontWeight: '700', color: '#0D0D0D' },
  appName:        { fontSize: 32, fontWeight: '700', color: '#FFFFFF', marginBottom: 8 },
  tagline:        { fontSize: 22, color: '#888888', lineHeight: 32, marginBottom: 40 },

  featureList:    { gap: 20, marginBottom: 40 },
  featureRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  featureIcon:    { fontSize: 24, width: 32 },
  featureTitle:   { fontSize: 15, fontWeight: '600', color: '#FFFFFF', marginBottom: 2 },
  featureSub:     { fontSize: 13, color: '#666666' },

  stepNumber:     { fontSize: 13, color: '#00FF94', fontWeight: '700',
                    letterSpacing: 2, marginBottom: 12 },
  stepTitle:      { fontSize: 28, fontWeight: '700', color: '#FFFFFF', marginBottom: 16 },
  stepDesc:       { fontSize: 15, color: '#888888', lineHeight: 24, marginBottom: 32 },

  permissionCard: {
    backgroundColor: '#141414', borderRadius: 12,
    padding: 16, marginBottom: 12, gap: 4,
  },
  permissionIcon: { fontSize: 20, marginBottom: 4 },
  permissionName: { fontSize: 13, fontWeight: '700', color: '#FFFFFF',
                    fontFamily: Platform.OS === 'android' ? 'monospace' : 'Menlo' },
  permissionDesc: { fontSize: 13, color: '#666666' },

  modelCard: {
    backgroundColor: '#141414', borderRadius: 12,
    padding: 4, marginBottom: 24,
  },
  modelCardRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#222222',
  },
  modelLabel:  { fontSize: 14, color: '#666666' },
  modelValue:  { fontSize: 14, color: '#FFFFFF', fontWeight: '500' },

  progressContainer: { marginBottom: 24 },
  progressBar:  {
    height: 4, backgroundColor: '#222222', borderRadius: 2,
    overflow: 'hidden', marginBottom: 10,
  },
  progressFill: { height: '100%', backgroundColor: '#00FF94', borderRadius: 2 },
  progressText: { fontSize: 13, color: '#666666', textAlign: 'center' },

  doneCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#00FF9420', borderWidth: 2, borderColor: '#00FF94',
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  doneCheck: { fontSize: 36, color: '#00FF94' },

  primaryBtn: {
    backgroundColor: '#00FF94', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginBottom: 16,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#0D0D0D' },

  errorText:  {
    fontSize: 13, color: '#FF4444',
    backgroundColor: '#FF444420', borderRadius: 8,
    padding: 12, marginBottom: 16,
  },
  footNote:   { fontSize: 12, color: '#444444', textAlign: 'center', lineHeight: 18 },
});
