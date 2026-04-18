import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable, RefreshControl, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Defs, Rect as SvgRect, RadialGradient, Stop } from 'react-native-svg';

import { useStore } from '../store';
import { themes, accent, accentInk, font, sp, alpha, ThemeMode } from '../theme';
import LiquidIcon, { CAT_ICON } from '../components/LiquidIcons';
import { TransactionRepository } from '../database/TransactionRepository';
import { SmsOrchestrator } from '../services/SmsOrchestrator';
import { CATEGORY_LABELS, Transaction } from '../types/Transaction';
import { TxCategory } from '../modules/LeapModule';
import { RootStackParams } from '../App';
import { FAB } from '../components/ActionViews';

type Nav = NativeStackNavigationProp<RootStackParams>;

// ── Metrics ──────────────────────────────────────────────────
interface Metrics {
  monthSpend: number;
  monthIncome: number;
  categoryTotals: Record<string, number>;
  latestSubscription: Transaction | null;
}

const emptyMetrics: Metrics = {
  monthSpend: 0, monthIncome: 0, categoryTotals: {}, latestSubscription: null,
};

export default function DashboardScreen() {
  const nav = useNavigation<Nav>();
  const {
    transactions, setTransactions,
    syncing, setSyncing, setSyncProgress,
    pendingCount, setPendingCount,
    themeMode, setThemeMode,
  } = useStore();

  const t = themes[themeMode];
  const aink = accentInk(themeMode);

  const [metrics, setMetrics] = useState<Metrics>(emptyMetrics);
  const [refreshing, setRefreshing] = useState(false);
  const [processError, setProcessError] = useState<string | null>(null);
  const [processProgress, setProcessProgress] =
    useState<{ done: number; total: number; found: number } | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadData();
      SmsOrchestrator.getPendingCount().then(setPendingCount).catch(() => {});
    }, [transactions]),
  );

  function loadData() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const monthEnd = now.getTime();

    const thisMonthTotals = TransactionRepository.getTotalSpentByCategory(monthStart, monthEnd);
    const monthTxns = TransactionRepository.getByDateRange(monthStart, monthEnd);
    const monthSpend = monthTxns.filter(tx => tx.type === 'DEBIT').reduce((s, tx) => s + tx.amount, 0);
    const monthIncome = monthTxns.filter(tx => tx.type === 'CREDIT').reduce((s, tx) => s + tx.amount, 0);
    const latestSubscription = TransactionRepository.getLatestByCategory('SUBSCRIPTION');

    setMetrics({ monthSpend, monthIncome, categoryTotals: thisMonthTotals, latestSubscription });
  }

  async function onRefresh() {
    setRefreshing(true);
    try {
      const fresh = TransactionRepository.getAll(200);
      setTransactions(fresh);
      setPendingCount(await SmsOrchestrator.getPendingCount());
    } catch { /* */ }
    setRefreshing(false);
  }

  async function processPending() {
    if (syncing) return;
    setProcessError(null);
    setSyncing(true);
    setProcessProgress({ done: 0, total: pendingCount, found: 0 });
    try {
      const found = await SmsOrchestrator.syncPending({
        onProcessed: (done, total, foundSoFar) => {
          setProcessProgress({ done, total, found: foundSoFar });
          setSyncProgress({ processed: done, total });
        },
      });
      const fresh = TransactionRepository.getAll(200);
      setTransactions(fresh);
      setPendingCount(await SmsOrchestrator.getPendingCount());
      setProcessProgress({ done: pendingCount, total: pendingCount, found });
    } catch (e: any) {
      setProcessError(e?.message ?? 'Processing failed');
    } finally {
      setSyncing(false);
      setSyncProgress(null);
      setTimeout(() => setProcessProgress(null), 2000);
    }
  }

  // Derived
  const currency = dominantCurrency(transactions);
  const totalCatSpend = Object.values(metrics.categoryTotals).reduce((s, v) => s + v, 0);
  const topCategories = Object.entries(metrics.categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5) as [TxCategory, number][];
  const recentTxns = transactions.slice(0, 3);
  const net = metrics.monthIncome - metrics.monthSpend;
  const budget = metrics.monthIncome > 0 ? metrics.monthIncome : Math.max(metrics.monthSpend * 1.25, 1);
  const drawnPct = Math.min(Math.round((metrics.monthSpend / budget) * 100), 999);

  const glowOpacity = themeMode === 'dark' ? 0.18 : 0.35;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      {/* ── Top-left radial accent glow ── */}
      <Svg
        width="100%"
        height={520}
        style={s.glowLayer}
        pointerEvents="none">
        <Defs>
          <RadialGradient id="bgGlow" cx="18%" cy="0%" rx="95%" ry="75%" fx="18%" fy="0%">
            <Stop offset="0%" stopColor={accent.v} stopOpacity={glowOpacity} />
            <Stop offset="55%" stopColor={accent.v} stopOpacity={glowOpacity * 0.35} />
            <Stop offset="100%" stopColor={accent.v} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <SvgRect x="0" y="0" width="100%" height="100%" fill="url(#bgGlow)" />
      </Svg>

      <SafeAreaView style={s.container}>
      {/* ── Top strip ── */}
      <View style={s.topBar}>
        <View style={s.topBarLeft}>
          <View style={[s.logoDot, { backgroundColor: accent.v }]}>
            <Text style={[s.logoLetter, { color: '#051911' }]}>s</Text>
          </View>
          <Text style={[s.brand, { color: t.ink }]}>somus</Text>
          <Text style={[s.version, { color: t.mute }]}>v1.0</Text>
        </View>
        <View style={s.topBarRight}>
          <View style={[s.offlineChip, { backgroundColor: t.chipBg }]}>
            <LiquidIcon name="wifiOff" size={11} color={t.inkDim} strokeWidth={1.8} />
            <Text style={[s.offlineText, { color: t.inkDim }]}>offline</Text>
          </View>
          <TouchableOpacity
            style={[s.themeBtn, { backgroundColor: t.surface }]}
            onPress={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
            activeOpacity={0.7}>
            <LiquidIcon
              name={themeMode === 'dark' ? 'sun' : 'moon'}
              size={14}
              color={t.inkDim}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent.v} />
        }>

        {/* ── Editorial Hero ── */}
        <View style={s.hero}>
          <View style={s.heroTop}>
            <Text style={[s.heroMonth, { color: t.mute }]}>
              {new Date().toLocaleDateString('en', { month: 'long' })} · month to date
            </Text>
            <View style={[s.liveChip, { backgroundColor: t.chipBg }]}>
              <View style={[s.liveDot, { backgroundColor: accent.v }]} />
              <Text style={[s.liveText, { color: t.inkDim }]}>live</Text>
            </View>
          </View>

          <View style={s.heroAmountRow}>
            <Text style={[s.heroCurrency, { color: t.inkDim }]}>{currencySymbol(currency)}</Text>
            <Text style={[s.heroAmount, { color: t.ink }]}>
              {Math.round(metrics.monthSpend).toLocaleString()}
            </Text>
          </View>

          <Text style={[s.heroSubtitle, { color: t.inkDim }]}>
            of {formatAmount(budget, currency)} budget ·{' '}
            <Text style={{ color: aink, fontFamily: font.uiBold }}>
              {net >= 0 ? '+' : '\u2212'}{formatAmount(Math.abs(net), currency)}
            </Text>{' '}
            net
          </Text>

          {/* Budget progress bar */}
          <View style={[s.budgetBarBg, { backgroundColor: t.chipBg }]}>
            <View style={[s.budgetBarFill, { width: `${Math.min(100, (metrics.monthSpend / budget) * 100)}%` }]} />
          </View>
          <View style={s.budgetLabels}>
            <Text style={[s.budgetLabel, { color: t.mute }]}>
              {drawnPct}% drawn
            </Text>
            <Text style={[s.budgetLabel, { color: t.mute }]}>
              {daysLeftInMonth()} days remaining
            </Text>
          </View>
        </View>

        {/* ── Pending banner ── */}
        {(pendingCount > 0 || processProgress) && (
          <PendingBanner
            t={t} aink={aink}
            pendingCount={pendingCount}
            syncing={syncing}
            progress={processProgress}
            error={processError}
            onPress={processPending}
          />
        )}

        {/* ── Where it went — numbered ledger ── */}
        <View style={s.ledgerSection}>
          <View style={s.ledgerHeader}>
            <Text style={[s.ledgerTitle, { color: t.ink }]}>Where it went</Text>
            <Text style={[s.ledgerLink, { color: aink }]}>&gt; all_cats</Text>
          </View>
          <View style={[s.ledgerList, { borderTopColor: t.ruleStrong }]}>
            {topCategories.length > 0 ? topCategories.map(([cat, amount], i) => {
              const pct = totalCatSpend > 0 ? (amount / totalCatSpend) * 100 : 0;
              return (
                <View key={cat} style={[s.ledgerRow, { borderBottomColor: t.rule }]}>
                  <Text style={[s.ledgerNum, { color: t.mute }]}>{String(i + 1).padStart(2, '0')}</Text>
                  <View style={[s.ledgerIcon, { backgroundColor: t.chipBg }]}>
                    <LiquidIcon name={CAT_ICON[cat] ?? 'dots'} size={14} color={t.ink} />
                  </View>
                  <View style={s.ledgerMid}>
                    <Text style={[s.ledgerCat, { color: t.ink }]}>{CATEGORY_LABELS[cat]}</Text>
                    <View style={[s.ledgerBarBg, { backgroundColor: t.chipBg }]}>
                      <View style={[s.ledgerBarFill, { width: `${pct * 3.4}%`, maxWidth: '100%' }]} />
                    </View>
                  </View>
                  <Text style={[s.ledgerAmt, { color: t.ink }]}>{formatAmount(amount, currency)}</Text>
                  <Text style={[s.ledgerPct, { color: t.mute }]}>{Math.round(pct)}%</Text>
                </View>
              );
            }) : (
              <View style={s.emptyBlock}>
                <Text style={[s.emptyText, { color: t.mute }]}>No spending yet this month.</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Recent quick-strip ── */}
        <View style={[s.recentCard, { backgroundColor: t.surface, borderColor: t.rule }]}>
          <View style={s.recentHeader}>
            <Text style={[s.recentTitle, { color: t.ink }]}>Recent</Text>
            <Text style={[s.recentSub, { color: t.mute }]}>last 24h</Text>
          </View>
          {recentTxns.length > 0 ? recentTxns.map((tx, i) => (
            <Pressable
              key={tx.id}
              onPress={() => nav.navigate('TransactionDetail', { transactionId: tx.id })}
              style={[s.recentRow, i > 0 && { borderTopColor: t.rule, borderTopWidth: 1 }]}>
              <View style={[s.recentIcon, { backgroundColor: t.chipBg }]}>
                <LiquidIcon name={CAT_ICON[tx.category] ?? 'dots'} size={13} color={t.inkDim} />
              </View>
              <View style={s.recentMid}>
                <Text style={[s.recentMerchant, { color: t.ink }]} numberOfLines={1}>{tx.merchant || tx.sender}</Text>
                <Text style={[s.recentMeta, { color: t.mute }]}>{tx.sender.toLowerCase()} · {formatDate(tx.smsDate)}</Text>
              </View>
              <Text style={[s.recentAmount, { color: tx.type === 'CREDIT' ? aink : t.ink }]}>
                {tx.type === 'CREDIT' ? '+' : '\u2212'}{formatAmount(tx.amount, tx.currencyCode)}
              </Text>
            </Pressable>
          )) : (
            <Text style={[s.emptyText, { color: t.mute }]}>No transactions yet.</Text>
          )}
        </View>
      </ScrollView>
      </SafeAreaView>
      <FAB onPress={() => {
        Alert.alert('Create New', 'What would you like to add?', [
          { text: 'Transaction', onPress: () => nav.navigate('AddTransaction') },
          { text: 'Subscription', onPress: () => nav.navigate('AddSubscription') },
          { text: 'Goal', onPress: () => nav.navigate('AddGoal') },
          { text: 'Cancel', style: 'cancel' }
        ]);
      }} />
    </View>
  );
}

// ── Pending banner ────────────────────────────────────────────
function PendingBanner({ t, aink, pendingCount, syncing, progress, error, onPress }: {
  t: any; aink: string;
  pendingCount: number; syncing: boolean;
  progress: { done: number; total: number; found: number } | null;
  error: string | null; onPress: () => void;
}) {
  const active = syncing && progress;
  const pct = active && progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <View style={[s.pendingCard, { backgroundColor: t.surface, borderColor: t.rule }]}>
      <View style={s.pendingRow}>
        <View style={[s.pendingIcon, { backgroundColor: alpha(accent.v, 0.13) }]}>
          <LiquidIcon name="chip" size={18} color={accent.v} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.pendingTitle, { color: t.ink }]}>
            {active ? `Processing ${progress.done} / ${progress.total}` : `${pendingCount} new message${pendingCount === 1 ? '' : 's'} pending`}
          </Text>
          <Text style={[s.pendingSub, { color: t.mute }]}>
            lfm2-1.2b · ~60–90s/sms · on-device
          </Text>
        </View>
        {!active && (
          <TouchableOpacity style={[s.pendingBtn, { backgroundColor: accent.v }]} onPress={onPress} activeOpacity={0.85}>
            <Text style={[s.pendingBtnText, { color: '#051911' }]}>Run →</Text>
          </TouchableOpacity>
        )}
      </View>
      {active && (
        <View style={[s.pendingBarBg, { backgroundColor: t.chipBg }]}>
          <View style={[s.pendingBarFill, { width: `${pct}%` }]} />
        </View>
      )}
      {error && <Text style={{ color: '#FF8FA8', fontSize: 12, marginTop: 8 }}>{error}</Text>}
    </View>
  );
}

// ── Helpers ───────────────────────────────────────────────────
function dominantCurrency(txns: Transaction[]): string {
  if (!txns.length) return 'USD';
  const c: Record<string, number> = {};
  for (const t of txns) c[t.currencyCode] = (c[t.currencyCode] ?? 0) + 1;
  return Object.entries(c).sort(([, a], [, b]) => b - a)[0]?.[0] ?? 'USD';
}

function formatAmount(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  } catch { return `${currency} ${amount.toFixed(0)}`; }
}

function currencySymbol(currency: string): string {
  try {
    const f = new Intl.NumberFormat('en', { style: 'currency', currency, maximumFractionDigits: 0 });
    return f.format(0).replace(/[\d\s.,]/g, '').trim();
  } catch { return currency; }
}

function formatDate(ms: number): string {
  const d = new Date(ms);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return `today, ${d.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' })}`;
  if (diff === 1) return 'yesterday';
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

function daysLeftInMonth(): number {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();
}

// ── Styles ────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1 },

  // Top-left accent glow overlay
  glowLayer: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
  },

  // Top bar — padding 14px 20px, no border
  topBar: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topBarRight: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  logoDot: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    boxShadow: `0 0 14px ${alpha(accent.v, 0.5)}`,
  },
  logoLetter: { fontFamily: font.uiBold, fontSize: 13, letterSpacing: -0.5 },
  brand: { fontFamily: font.uiBold, fontSize: 14, letterSpacing: -0.4 },
  version: { fontFamily: font.mono, fontSize: 10, marginLeft: 4 },
  offlineChip: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100,
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  offlineText: { fontFamily: font.mono, fontSize: 10 },
  themeBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },

  // Scroll: no horizontal padding — each section controls its own margin
  scroll: { paddingBottom: 120 },

  // Hero — padding 28 22 22
  hero: { paddingTop: 28, paddingHorizontal: 22, paddingBottom: 22 },
  heroTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  heroMonth: {
    fontFamily: font.uiBold,
    fontSize: 10, letterSpacing: 2, textTransform: 'uppercase',
  },
  liveChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 100,
  },
  liveDot: {
    width: 6, height: 6, borderRadius: 3,
    boxShadow: `0 0 8px ${accent.v}`,
  },
  liveText: { fontFamily: font.mono, fontSize: 10 },
  heroAmountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 8 },
  heroCurrency: { fontFamily: font.ui, fontSize: 22 },
  heroAmount: {
    fontFamily: font.display,
    fontSize: 78, letterSpacing: -3.5,
    lineHeight: 85,
    includeFontPadding: false,
  },
  heroSubtitle: {
    fontFamily: font.displayItalic,
    fontSize: 13, marginTop: 12, lineHeight: 20,
  },
  budgetBarBg: { height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 18 },
  budgetBarFill: {
    height: '100%', borderRadius: 3,
    backgroundColor: accent.v,
    boxShadow: `0 0 12px ${alpha(accent.v, 0.5)}`,
  },
  budgetLabels: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: 8,
  },
  budgetLabel: { fontFamily: font.mono, fontSize: 10 },

  // Pending — margin 6 16 16, padding 14 14 14 16
  pendingCard: {
    marginTop: 6, marginBottom: 16, marginHorizontal: 16,
    borderRadius: 20,
    paddingTop: 14, paddingRight: 14, paddingBottom: 14, paddingLeft: 16,
    borderWidth: 1,
  },
  pendingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pendingIcon: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  pendingTitle: { fontFamily: font.uiBold, fontSize: 13 },
  pendingSub: { fontFamily: font.mono, fontSize: 10, marginTop: 2 },
  pendingBtn: {
    borderRadius: 100, paddingHorizontal: 14, paddingVertical: 8,
  },
  pendingBtnText: { fontFamily: font.uiBold, fontSize: 12 },
  pendingBarBg: { height: 4, borderRadius: 2, overflow: 'hidden', marginTop: 12 },
  pendingBarFill: { height: '100%', borderRadius: 2, backgroundColor: accent.v },

  // Ledger — padding 0 20
  ledgerSection: { paddingHorizontal: 20 },
  ledgerHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'baseline', marginBottom: 10,
  },
  ledgerTitle: { fontFamily: font.uiBold, fontSize: 17, letterSpacing: -0.4 },
  ledgerLink: { fontFamily: font.mono, fontSize: 10 },
  ledgerList: { borderTopWidth: 1 },
  ledgerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1,
  },
  ledgerNum: {
    fontFamily: font.mono, fontSize: 10, width: 18,
    fontVariant: ['tabular-nums'],
  },
  ledgerIcon: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  ledgerMid: { flex: 1, minWidth: 0 },
  ledgerCat: { fontFamily: font.ui, fontSize: 13 },
  ledgerBarBg: { height: 2, borderRadius: 1, overflow: 'hidden', marginTop: 4 },
  ledgerBarFill: {
    height: '100%', borderRadius: 1,
    backgroundColor: accent.v,
    boxShadow: `0 0 8px ${alpha(accent.v, 0.5)}`,
  },
  ledgerAmt: {
    fontFamily: font.monoBold,
    fontSize: 13, fontVariant: ['tabular-nums'],
    minWidth: 50, textAlign: 'right',
  },
  ledgerPct: {
    fontFamily: font.mono,
    fontSize: 10, width: 26, textAlign: 'right',
  },

  // Recent — margin 20 16 0, padding 14
  recentCard: {
    marginTop: 20, marginHorizontal: 16,
    borderRadius: 20,
    padding: 14, borderWidth: 1,
  },
  recentHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8,
  },
  recentTitle: { fontFamily: font.uiBold, fontSize: 13 },
  recentSub: { fontFamily: font.mono, fontSize: 10 },
  recentRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10,
  },
  recentIcon: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  recentMid: { flex: 1, minWidth: 0 },
  recentMerchant: { fontFamily: font.ui, fontSize: 13 },
  recentMeta: { fontFamily: font.mono, fontSize: 9, marginTop: 2 },
  recentAmount: {
    fontFamily: font.monoBold,
    fontSize: 13, fontVariant: ['tabular-nums'],
  },

  // Empty
  emptyBlock: { paddingVertical: sp.xxl, alignItems: 'center' },
  emptyText: { fontFamily: font.ui, fontSize: 12, textAlign: 'center' },
});
