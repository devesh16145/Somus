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
import { BudgetRepository } from '../database/BudgetRepository';
import { BudgetEngine } from '../services/BudgetEngine';
import { SmsOrchestrator } from '../services/SmsOrchestrator';
import { CATEGORY_LABELS, Transaction } from '../types/Transaction';
import { TxCategory } from '../modules/LeapModule';
import { RootStackParams } from '../App';
import { AnimatedNumber, StaggerFade, PressableScale } from '../components/VaultAnimations';
import { MoneyFlow } from '../components/MoneyFlow';

type Nav = NativeStackNavigationProp<RootStackParams>;

// ── Metrics ──────────────────────────────────────────────────
interface Metrics {
  monthSpend: number;
  monthIncome: number;
  categoryTotals: Record<string, number>;
  latestSubscription: Transaction | null;
  totalSpend: number;
}

const emptyMetrics: Metrics = {
  monthSpend: 0, monthIncome: 0, categoryTotals: {}, latestSubscription: null, totalSpend: 0,
};

export default function DashboardScreen() {
  const nav = useNavigation<Nav>();
  const {
    transactions, setTransactions,
    syncing, setSyncing, setSyncProgress,
    pendingCount, setPendingCount,
    themeMode, setThemeMode,
    activeBudget, setActiveBudget,
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
      try { setActiveBudget(BudgetRepository.getActive()); } catch {}
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

    setMetrics({ monthSpend, monthIncome, categoryTotals: thisMonthTotals, latestSubscription, totalSpend: monthSpend });
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

  function handleAddPress() {
    Alert.alert('Create New', 'What would you like to add?', [
      { text: 'Transaction', onPress: () => nav.navigate('AddTransaction') },
      { text: 'Subscription', onPress: () => nav.navigate('AddSubscription') },
      { text: 'Goal', onPress: () => nav.navigate('AddGoal') },
      { text: 'Cancel', style: 'cancel' }
    ]);
  }

  // Derived
  const currency = activeBudget?.currency ?? dominantCurrency(transactions);
  const totalCatSpend = Object.values(metrics.categoryTotals).reduce((s, v) => s + v, 0);
  const topCategories = Object.entries(metrics.categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5) as [TxCategory, number][];
  const recent = transactions.slice(0, 3);
  const net = metrics.monthIncome - metrics.monthSpend;

  const budgetStatus = activeBudget ? BudgetEngine.computeStatus(activeBudget, transactions) : null;
  const budgetLimit = activeBudget?.monthlyLimit ?? (metrics.monthIncome > 0 ? metrics.monthIncome : Math.max(metrics.monthSpend * 1.25, 1));
  const drawnPct = Math.min(Math.round((metrics.monthSpend / budgetLimit) * 100), 999);

  const capStatusByCat: Partial<Record<TxCategory, 'near' | 'over'>> = {};
  if (budgetStatus) {
    for (const c of budgetStatus.perCategory) {
      if (c.status === 'near' || c.status === 'over') capStatusByCat[c.category] = c.status;
    }
  }

  const paceColor = budgetStatus
    ? (budgetStatus.pace === 'overspending' ? '#E06B4A' : budgetStatus.pace === 'underspending' ? aink : aink)
    : t.mute;
  const paceLabel = budgetStatus
    ? (budgetStatus.pace === 'overspending' ? 'overspending' : budgetStatus.pace === 'underspending' ? 'underspending' : 'on track')
    : '';

  const glowOpacity = themeMode === 'dark' ? 0.18 : 0.35;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
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
      <View style={s.topBar}>
        <View style={s.topBarLeft}>
          <View style={{ width: 8 }} />
        </View>
        <View style={s.topBarRight}>
          <View style={[s.offlineChip, { backgroundColor: t.chipBg }]}>
            <LiquidIcon name="wifiOff" size={11} color={t.inkDim} strokeWidth={1.8} />
            <Text style={[s.offlineText, { color: t.inkDim }]}>offline</Text>
          </View>
          <TouchableOpacity
            style={[s.themeBtn, { backgroundColor: t.surface }]}
            onPress={async () => {
              setRefreshing(true);
              try {
                const count = await SmsOrchestrator.getPendingCount();
                setPendingCount(count);
                const fresh = TransactionRepository.getAll(200);
                setTransactions(fresh);
                loadData();
              } catch { /* */ }
              setRefreshing(false);
            }}
            activeOpacity={0.7}>
            <LiquidIcon
              name="refresh"
              size={14}
              color={refreshing ? accent.v : t.inkDim}
            />
          </TouchableOpacity>
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
          <TouchableOpacity
            style={[s.themeBtn, { backgroundColor: t.surface }]}
            onPress={() => nav.navigate('Settings')}
            activeOpacity={0.7}>
            <LiquidIcon name="cog" size={14} color={t.inkDim} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent.v} />
        }>

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
            <AnimatedNumber
             style={[s.balanceText, { color: t.ink }]}
             value={metrics.totalSpend}
             formatter={(val) => Math.round(val).toLocaleString()}
             delay={150}
            />
          </View>

          {budgetStatus ? (
            <Text style={[s.heroSubtitle, { color: t.inkDim }]}>
              {formatAmount(budgetStatus.remaining, currency)} left ·{' '}
              <Text style={{ color: aink, fontFamily: font.uiBold }}>
                ~{formatAmount(Math.max(0, budgetStatus.perDayAvailable), currency)}/day
              </Text>{' '}
              for {Math.max(0, budgetStatus.daysInMonth - budgetStatus.daysElapsed)} days
            </Text>
          ) : (
            <Text style={[s.heroSubtitle, { color: t.inkDim }]}>
              of {formatAmount(budgetLimit, currency)} est. ·{' '}
              <Text style={{ color: aink, fontFamily: font.uiBold }}>
                {net >= 0 ? '+' : '\u2212'}{formatAmount(Math.abs(net), currency)}
              </Text>{' '}
              net
            </Text>
          )}

          <View style={[s.budgetBarBg, { backgroundColor: t.chipBg }]}>
            <View style={[s.budgetBarFill, { width: `${Math.min(100, (metrics.monthSpend / budgetLimit) * 100)}%`, backgroundColor: budgetStatus?.pace === 'overspending' ? '#E06B4A' : accent.v }]} />
          </View>
          <View style={s.budgetLabels}>
            {budgetStatus ? (
              <Text style={[s.budgetLabel, { color: paceColor }]}>
                Day {budgetStatus.daysElapsed} of {budgetStatus.daysInMonth} · {paceLabel}
              </Text>
            ) : (
              <Text style={[s.budgetLabel, { color: t.mute }]}>{drawnPct}% drawn</Text>
            )}
            <Text style={[s.budgetLabel, { color: t.mute }]}>
              {daysLeftInMonth()} days remaining
            </Text>
          </View>

          {!activeBudget && (
            <TouchableOpacity
              onPress={() => nav.navigate('Main', { screen: 'Budget' } as any)}
              activeOpacity={0.7}
              style={[s.setBudgetChip, { backgroundColor: alpha(accent.v, 0.14) }]}>
              <LiquidIcon name="target" size={11} color={accent.v} />
              <Text style={{ fontFamily: font.monoBold, fontSize: 11, color: aink }}>
                Set a budget →
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <MoneyFlow
          income={metrics.monthIncome}
          budget={activeBudget?.monthlyLimit ?? null}
          expense={metrics.monthSpend}
          currency={currency}
          themeMode={themeMode}
        />

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

        <View style={s.ledgerSection}>
          <View style={s.ledgerHeader}>
            <Text style={[s.ledgerTitle, { color: t.ink }]}>Where it went</Text>
            <Text style={[s.ledgerLink, { color: aink }]}>&gt; all_cats</Text>
          </View>
          <View style={[s.ledgerList, { borderTopColor: t.ruleStrong }]}>
            {topCategories.length > 0 ? topCategories.map(([cat, amount]: any, idx: number) => {
              const pct = totalCatSpend > 0 ? (amount / totalCatSpend) * 100 : 0;
              const capState = capStatusByCat[cat as TxCategory];
              const dotColor = capState === 'over' ? '#E06B4A' : capState === 'near' ? '#D89A2A' : null;
              return (
                <StaggerFade key={cat} index={idx}>
                  <View style={s.ledgerRow}>
                    <Text style={{ fontFamily: font.monoBold, fontSize: 13, color: t.mute, width: 24 }}>{String(idx + 1).padStart(2, '0')}</Text>
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: alpha(accent.v, 0.1), alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <LiquidIcon name={CAT_ICON[cat] ?? 'dots'} size={16} color={accent.v} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <Text style={{ fontFamily: font.uiBold, fontSize: 15, color: t.ink }}>{CATEGORY_LABELS[cat] || cat}</Text>
                        {dotColor && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: dotColor }} />}
                      </View>
                      <View style={{ height: 4, backgroundColor: t.chipBg, borderRadius: 2, overflow: 'hidden' }}>
                         <View style={{ width: `${pct}%`, height: '100%', backgroundColor: dotColor ?? accent.v, borderRadius: 2 }} />
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end', marginLeft: 16 }}>
                      <Text style={{ fontFamily: font.uiBold, fontSize: 15, color: t.ink }}>{formatAmount(amount, currency)}</Text>
                      <Text style={{ fontFamily: font.mono, fontSize: 10, color: t.mute, marginTop: 2 }}>{pct.toFixed(1)}%</Text>
                    </View>
                  </View>
                </StaggerFade>
              );
            }) : (
              <View style={s.emptyBlock}>
                <Text style={[s.emptyText, { color: t.mute }]}>No spending yet this month.</Text>
              </View>
            )}
          </View>
        </View>

        <View style={[s.recentCard, { backgroundColor: t.surface, borderColor: t.rule }]}>
          <View style={s.recentHeader}>
            <Text style={[s.recentTitle, { color: t.ink }]}>Recent</Text>
            <Text style={[s.recentSub, { color: t.mute }]}>last 24h</Text>
          </View>
          {recent.length > 0 ? recent.map((tx: Transaction, idx: number) => {
              const isCredit = tx.type === 'CREDIT';
              return (
                <StaggerFade key={tx.id} index={idx + 4}>
                  <TouchableOpacity onPress={() => nav.navigate('TransactionDetail', { transactionId: tx.id })} activeOpacity={0.7} style={s.recentRow}>
                    <View style={[s.recentIcon, { backgroundColor: t.chipBg }]}>
                      <LiquidIcon name={CAT_ICON[tx.category] ?? 'dots'} size={18} color={t.mute} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: font.uiBold, fontSize: 15, color: t.ink, marginBottom: 2 }} numberOfLines={1}>{tx.merchant || tx.sender}</Text>
                      <Text style={{ fontFamily: font.ui, fontSize: 12, color: t.mute }}>{new Date(tx.smsDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} • {CATEGORY_LABELS[tx.category] || tx.category}</Text>
                    </View>
                    <Text style={{ fontFamily: font.monoBold, fontSize: 14, color: isCredit ? aink : t.ink }}>{isCredit ? '+' : '\u2212'}{formatAmount(tx.amount, tx.currencyCode)}</Text>
                  </TouchableOpacity>
                </StaggerFade>
              );
            }) : (
            <Text style={[s.emptyText, { color: t.mute }]}>No transactions yet.</Text>
          )}
        </View>
      </ScrollView>
      </SafeAreaView>
      <PressableScale 
        style={{ position: 'absolute', bottom: 100, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: accent.v, alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: accent.v, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 10 }} 
        onPress={handleAddPress}
      >
        <LiquidIcon name="plus" size={24} color="#FFF" strokeWidth={3} />
      </PressableScale>
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

function daysLeftInMonth(): number {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();
}

// ── Styles ────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1 },
  glowLayer: { position: 'absolute', top: 0, left: 0, right: 0 },
  topBar: { paddingVertical: 14, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topBarRight: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  offlineChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100, flexDirection: 'row', alignItems: 'center', gap: 4 },
  offlineText: { fontFamily: font.mono, fontSize: 10 },
  themeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingBottom: 120 },
  hero: { paddingTop: 28, paddingHorizontal: 22, paddingBottom: 22 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroMonth: { fontFamily: font.uiBold, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' },
  liveChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 100 },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveText: { fontFamily: font.mono, fontSize: 10 },
  heroAmountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 8 },
  heroCurrency: { fontFamily: font.ui, fontSize: 22 },
  balanceText: { fontFamily: font.display, fontSize: 78, letterSpacing: -3.5, lineHeight: 85 },
  heroSubtitle: { fontFamily: font.displayItalic, fontSize: 13, marginTop: 12, lineHeight: 20 },
  budgetBarBg: { height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 18 },
  budgetBarFill: { height: '100%', borderRadius: 3, backgroundColor: accent.v },
  budgetLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  budgetLabel: { fontFamily: font.mono, fontSize: 10 },
  setBudgetChip: {
    marginTop: 14, alignSelf: 'flex-start',
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 100,
  },
  pendingCard: { marginTop: 6, marginBottom: 16, marginHorizontal: 16, borderRadius: 20, paddingTop: 14, paddingRight: 14, paddingBottom: 14, paddingLeft: 16, borderWidth: 1 },
  pendingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pendingIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  pendingTitle: { fontFamily: font.uiBold, fontSize: 13 },
  pendingSub: { fontFamily: font.mono, fontSize: 10, marginTop: 2 },
  pendingBtn: { borderRadius: 100, paddingHorizontal: 14, paddingVertical: 8 },
  pendingBtnText: { fontFamily: font.uiBold, fontSize: 12 },
  pendingBarBg: { height: 4, borderRadius: 2, overflow: 'hidden', marginTop: 12 },
  pendingBarFill: { height: '100%', borderRadius: 2, backgroundColor: accent.v },
  ledgerSection: { paddingHorizontal: 20 },
  ledgerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 },
  ledgerTitle: { fontFamily: font.uiBold, fontSize: 17, letterSpacing: -0.4 },
  ledgerLink: { fontFamily: font.mono, fontSize: 10 },
  ledgerList: { borderTopWidth: 1 },
  ledgerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },

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
  // Empty
  emptyBlock: { paddingVertical: sp.xxl, alignItems: 'center' },
  emptyText: { fontFamily: font.ui, fontSize: 12, textAlign: 'center' },
});
