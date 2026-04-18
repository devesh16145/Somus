import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { RadialGradient, Stop, Circle } from 'react-native-svg';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import InsightsChart from '../components/InsightsChart';

import { useStore } from '../store';
import { TransactionRepository } from '../database/TransactionRepository';
import { SmsOrchestrator } from '../services/SmsOrchestrator';
import { CATEGORY_LABELS, Transaction } from '../types/Transaction';
import { TxCategory } from '../modules/LeapModule';
import { RootStackParams } from '../App';
import { colors, radii, font, sp, alpha } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParams>;

// MaterialCommunityIcons names closest to the HTML mock's Material Symbols
const CATEGORY_ICON: Record<TxCategory, string> = {
  FOOD_DINING:     'silverware-fork-knife',
  TRANSPORT:       'bus',
  SHOPPING:        'shopping',
  GROCERIES:       'cart',
  UTILITIES:       'lightbulb-outline',
  ENTERTAINMENT:   'controller',
  HEALTH_MEDICAL:  'medical-bag',
  TRAVEL:          'airplane',
  EDUCATION:       'book-open-variant',
  FUEL:            'gas-station',
  ATM_CASH:        'cash',
  TRANSFER:        'bank-transfer',
  SUBSCRIPTION:    'cellphone',
  INSURANCE:       'shield-check',
  RENT:            'home-city',
  OTHER:           'dots-horizontal',
};

// ── Metrics ───────────────────────────────────────────────────
interface Metrics {
  monthSpend: number;
  monthIncome: number;
  categoryTotals: Record<string, number>;
  allTimeSpend: number;
  allTimeIncome: number;
  diningThisMonth: number;
  diningPrevMonth: number;
  latestSubscription: Transaction | null;
  monthlyTrend: { month: string; spend: number; income: number }[];
}

const emptyMetrics: Metrics = {
  monthSpend: 0, monthIncome: 0, categoryTotals: {},
  allTimeSpend: 0, allTimeIncome: 0,
  diningThisMonth: 0, diningPrevMonth: 0,
  latestSubscription: null,
  monthlyTrend: [],
};

const CATEGORY_SLOT_COLORS = [
  { bg: alpha(colors.primaryContainer, 0.30), tint: colors.primary },
  { bg: alpha(colors.secondaryContainer, 0.50), tint: colors.secondary },
  { bg: alpha(colors.tertiaryContainer, 0.30), tint: colors.tertiary },
  { bg: alpha(colors.errorContainer, 0.20), tint: colors.error },
];

const ACTIVITY_AVATAR_TINTS = [
  colors.primary,
  colors.secondary,
  colors.tertiary,
  colors.error,
];

// ──────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const nav = useNavigation<Nav>();
  const {
    transactions, setTransactions,
    syncing, setSyncing, setSyncProgress,
    pendingCount, setPendingCount,
  } = useStore();

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
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
    const prevMonthEnd = monthStart - 1;

    const thisMonthTotals = TransactionRepository.getTotalSpentByCategory(monthStart, monthEnd);
    const prevMonthTotals = TransactionRepository.getTotalSpentByCategory(prevMonthStart, prevMonthEnd);

    const monthTxns = TransactionRepository.getByDateRange(monthStart, monthEnd);
    const monthSpend  = monthTxns.filter(t => t.type === 'DEBIT').reduce((s, t) => s + t.amount, 0);
    const monthIncome = monthTxns.filter(t => t.type === 'CREDIT').reduce((s, t) => s + t.amount, 0);

    const allTime = TransactionRepository.getAllTimeTotals();
    const latestSubscription = TransactionRepository.getLatestByCategory('SUBSCRIPTION');
    const monthlyTrend = TransactionRepository.getMonthlyTotals(6);

    setMetrics({
      monthSpend, monthIncome,
      categoryTotals: thisMonthTotals,
      allTimeSpend: allTime.totalSpend,
      allTimeIncome: allTime.totalIncome,
      diningThisMonth: thisMonthTotals['FOOD_DINING'] ?? 0,
      diningPrevMonth: prevMonthTotals['FOOD_DINING'] ?? 0,
      latestSubscription,
      monthlyTrend,
    });
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

  // ── Derived values ──────────────────────────────────────────
  const currency = dominantCurrency(transactions);
  const totalCategorySpend = Object.values(metrics.categoryTotals).reduce((s, v) => s + v, 0);
  const topCategories = Object.entries(metrics.categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4) as [TxCategory, number][];

  const recentTxns = transactions.slice(0, 4);

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* ── TopAppBar ── */}
      <View style={s.topBar}>
        <Text style={s.brand}>Somus</Text>
        <TouchableOpacity
          style={s.settingsBtn}
          onPress={() => nav.navigate('Main', { screen: 'Settings' } as any)}
          activeOpacity={0.7}>
          <Icon name="cog-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }>

        {/* ── Pending banner ── */}
        {(pendingCount > 0 || processProgress) && (
          <PendingBanner
            pendingCount={pendingCount}
            syncing={syncing}
            progress={processProgress}
            error={processError}
            onPress={processPending}
          />
        )}

        {/* ── Hero: Monthly Expenditure ── */}
        <View style={s.heroOuter}>
          <LinearGradient
            colors={[colors.primary, colors.primaryContainer]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.heroGradient}>
            <Svg style={StyleSheet.absoluteFill} viewBox="0 0 400 250">
              <RadialGradient id="blobA" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
                <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </RadialGradient>
              <RadialGradient id="blobB" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#ebf6c1" stopOpacity="0.25" />
                <Stop offset="100%" stopColor="#ebf6c1" stopOpacity="0" />
              </RadialGradient>
              <Circle cx={350} cy={20} r={140} fill="url(#blobA)" />
              <Circle cx={30} cy={210} r={110} fill="url(#blobB)" />
            </Svg>
            <View style={s.heroContent}>
              <Text style={s.heroLabel}>MONTHLY EXPENDITURE</Text>
              <Text style={s.heroAmount}>{formatAmount(metrics.monthSpend, currency)}</Text>
              <View style={s.heroButtons}>
                <TouchableOpacity
                  style={s.heroPrimaryBtn}
                  activeOpacity={0.85}
                  onPress={() => nav.navigate('Main', { screen: 'Transactions' } as any)}>
                  <Text style={s.heroPrimaryBtnText}>View Analytics</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.heroGhostBtn}
                  activeOpacity={0.85}
                  onPress={() => nav.navigate('Main', { screen: 'Settings' } as any)}>
                  <Text style={s.heroGhostBtnText}>Add Expense</Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* ── Insights Chart ── */}
        <InsightsChart data={metrics.monthlyTrend} currency={currency} />

        {/* ── Categories + Recent Activity ── */}
        <View style={s.twoColGrid}>
          {/* Spending Categories */}
          <View style={s.categoriesCol}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Spending Categories</Text>
              <TouchableOpacity
                onPress={() => nav.navigate('Main', { screen: 'Transactions' } as any)}>
                <Text style={s.sectionLink}>Full Report</Text>
              </TouchableOpacity>
            </View>

            {topCategories.length > 0 ? (
              <View style={s.catGrid}>
                {topCategories.map(([cat, amount], idx) => (
                  <CategoryCard
                    key={cat}
                    category={cat}
                    amount={amount}
                    percent={totalCategorySpend > 0 ? (amount / totalCategorySpend) * 100 : 0}
                    currency={currency}
                    colorIdx={idx}
                  />
                ))}
              </View>
            ) : (
              <EmptyBlock text="No spending yet this month." />
            )}
          </View>

          {/* Recent Activity */}
          <View style={s.activityCol}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Recent Activity</Text>
              <TouchableOpacity
                style={s.filterBtn}
                onPress={() => nav.navigate('Main', { screen: 'Transactions' } as any)}>
                <Icon name="filter-variant" size={16} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            {recentTxns.length > 0 ? (
              <View style={s.activityCard}>
                {recentTxns.map((tx, idx) => (
                  <ActivityRow
                    key={tx.id}
                    tx={tx}
                    colorIdx={idx}
                    onPress={() => nav.navigate('TransactionDetail', { transactionId: tx.id })}
                    isLast={idx === recentTxns.length - 1}
                  />
                ))}
              </View>
            ) : (
              <EmptyBlock text="No transactions yet. Tap Settings to import your SMS history." />
            )}
          </View>
        </View>

        {/* ── Upcoming Bills / Subscription Focus Card ── */}
        {metrics.latestSubscription && (
          <View style={s.billsCard}>
            <View style={s.billsLeft}>
              <View style={s.billsChip}>
                <Text style={s.billsChipText}>UPCOMING BILLS</Text>
              </View>
              <Text style={s.billsTitle} numberOfLines={1}>
                {metrics.latestSubscription.merchant || 'Subscription'}
              </Text>
              <Text style={s.billsBody}>
                Your monthly subscription will be deducted around{' '}
                {formatFullDate(metrics.latestSubscription.smsDate + 30 * 86400000)}.
                Last charged {formatAmount(metrics.latestSubscription.amount, metrics.latestSubscription.currencyCode)}.
              </Text>
            </View>
            <View style={s.billsRight}>
              <Text style={s.billsDueLabel}>DUE IN</Text>
              <Text style={s.billsDueValue}>
                {estimateDaysUntilNext(metrics.latestSubscription.smsDate)} Days
              </Text>
              <View style={s.billsDivider} />
              <TouchableOpacity
                style={s.billsBtn}
                activeOpacity={0.85}
                onPress={() => nav.navigate('TransactionDetail', { transactionId: metrics.latestSubscription!.id })}>
                <Text style={s.billsBtnText}>Manage Bills</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-components ────────────────────────────────────────────

function PendingBanner({
  pendingCount, syncing, progress, error, onPress,
}: {
  pendingCount: number;
  syncing: boolean;
  progress: { done: number; total: number; found: number } | null;
  error: string | null;
  onPress: () => void;
}) {
  const active = syncing && progress;
  const pct = active && progress.total > 0
    ? Math.round((progress.done / progress.total) * 100)
    : 0;

  return (
    <View style={s.pendingBanner}>
      <View style={s.pendingRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.pendingTitle}>
            {active
              ? `Processing ${progress.done} / ${progress.total}`
              : `${pendingCount} new message${pendingCount === 1 ? '' : 's'}`}
          </Text>
          <Text style={s.pendingSubtitle}>
            {active
              ? `${progress.found} transaction${progress.found === 1 ? '' : 's'} found · ~60–90s each`
              : 'Received since last sync. Inference takes ~60–90s each.'}
          </Text>
        </View>
        {!active && (
          <TouchableOpacity
            style={s.pendingBtn}
            onPress={onPress}
            activeOpacity={0.85}
            disabled={syncing || pendingCount === 0}>
            <Text style={s.pendingBtnText}>Process</Text>
          </TouchableOpacity>
        )}
      </View>
      {active && (
        <View style={s.pendingBarBg}>
          <View style={[s.pendingBarFill, { width: `${pct}%` }]} />
        </View>
      )}
      {error && <Text style={s.pendingError}>{error}</Text>}
    </View>
  );
}

function CategoryCard({
  category, amount, percent, currency, colorIdx,
}: {
  category: TxCategory;
  amount: number;
  percent: number;
  currency: string;
  colorIdx: number;
}) {
  const slot = CATEGORY_SLOT_COLORS[colorIdx % CATEGORY_SLOT_COLORS.length];
  return (
    <View style={s.catCard}>
      <View style={s.catCardHeader}>
        <View style={[s.catIconWrap, { backgroundColor: slot.bg }]}>
          <Icon name={CATEGORY_ICON[category]} size={20} color={slot.tint} />
        </View>
        <Text style={s.catPercent}>{percent.toFixed(0)}%</Text>
      </View>
      <Text style={s.catLabel}>{CATEGORY_LABELS[category].toUpperCase()}</Text>
      <Text style={s.catAmount}>{formatAmount(amount, currency)}</Text>
    </View>
  );
}

function ActivityRow({
  tx, colorIdx, onPress, isLast,
}: {
  tx: Transaction;
  colorIdx: number;
  onPress: () => void;
  isLast: boolean;
}) {
  const name = tx.merchant || tx.sender || 'Unknown';
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('') || '*';
  const tint = ACTIVITY_AVATAR_TINTS[colorIdx % ACTIVITY_AVATAR_TINTS.length];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.activityRow,
        pressed && { backgroundColor: colors.surfaceContainerLow },
      ]}>
      <View style={s.activityLeft}>
        <View style={s.activityAvatar}>
          <Text style={[s.activityInitials, { color: tint }]}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.activityMerchant} numberOfLines={1}>{name}</Text>
          <Text style={s.activityDate}>{formatDate(tx.smsDate)}</Text>
        </View>
      </View>
      <Text style={s.activityAmount}>
        {tx.type === 'DEBIT' ? '-' : '+'}{formatAmount(tx.amount, tx.currencyCode)}
      </Text>
    </Pressable>
  );
}

function EmptyBlock({ text }: { text: string }) {
  return (
    <View style={s.emptyBlock}>
      <Text style={s.emptyBlockText}>{text}</Text>
    </View>
  );
}

// ── Helpers ───────────────────────────────────────────────────

function dominantCurrency(txns: Transaction[]): string {
  if (!txns.length) return 'USD';
  const counts: Record<string, number> = {};
  for (const t of txns) counts[t.currencyCode] = (counts[t.currencyCode] ?? 0) + 1;
  return Object.entries(counts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? 'USD';
}

function formatAmount(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en', {
      style: 'currency', currency, maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(0)}`;
  }
}

function formatDate(ms: number): string {
  const d = new Date(ms);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  const time = d.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' });
  if (diffDays === 0) return `Today, ${time}`;
  if (diffDays === 1) return `Yesterday, ${time}`;
  return `${d.toLocaleDateString('en', { day: 'numeric', month: 'short' })}, ${time}`;
}

function formatFullDate(ms: number): string {
  return new Date(ms).toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

function estimateDaysUntilNext(lastMs: number): number {
  const nextApprox = lastMs + 30 * 24 * 60 * 60 * 1000;
  const diff = Math.ceil((nextApprox - Date.now()) / 86400000);
  return diff > 0 ? diff : 0;
}

// ── Styles (Material 3 Expressive) ────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // ── Top bar ──
  topBar: {
    height: 64,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
  },
  brand: {
    fontFamily: font.headline,
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  settingsBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },

  scroll: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 140 },

  // ── Pending banner ──
  pendingBanner: {
    backgroundColor: colors.tertiaryContainer,
    borderRadius: 20,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: alpha(colors.outlineVariant, 0.25),
  },
  pendingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pendingTitle: {
    fontFamily: font.headline,
    fontSize: 16, fontWeight: '700',
    color: colors.onTertiaryContainer, marginBottom: 4,
  },
  pendingSubtitle: {
    fontFamily: font.body,
    fontSize: 13, color: colors.onTertiaryContainer, opacity: 0.7, lineHeight: 18,
  },
  pendingBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.full,
    paddingHorizontal: 20, paddingVertical: 12,
  },
  pendingBtnText: { fontFamily: font.label, color: colors.onPrimary, fontSize: 14, fontWeight: '600' },
  pendingBarBg: {
    height: 6, backgroundColor: colors.surfaceContainerHighest,
    borderRadius: 3, overflow: 'hidden', marginTop: 14,
  },
  pendingBarFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  pendingError: { fontFamily: font.body, fontSize: 13, color: colors.error, marginTop: 12 },

  // ── Hero ──
  heroOuter: {
    borderRadius: 48, // rounded-xl (3rem)
    overflow: 'hidden',
    marginBottom: 32, // space-y-8
  },
  heroGradient: {
    position: 'relative',
    paddingHorizontal: 32,
    paddingVertical: 40,
    borderRadius: 48,
  },
  heroContent: {
    position: 'relative',
    zIndex: 10,
  },
  heroLabel: {
    fontFamily: font.label,
    fontSize: 14, // text-sm
    fontWeight: '600',
    color: colors.onPrimary,
    opacity: 0.9, // opacity-90
    letterSpacing: 1.5, // tracking-wider
  },
  heroAmount: {
    fontFamily: font.headline,
    fontSize: 57, // M3 Display Large
    fontWeight: '800', // font-extrabold
    color: colors.onPrimary,
    marginTop: 8, // mt-2
    letterSpacing: -1.5, // tracking-tight
    lineHeight: 64,
  },
  heroButtons: { flexDirection: 'row', gap: 16, marginTop: 32 },
  heroPrimaryBtn: {
    flex: 1, // Let button shrink/grow instead of forcing horizontal padding
    backgroundColor: colors.surfaceContainerLowest, // bg-surface-container-lowest
    paddingHorizontal: 28, // force text wrapping by increasing padding
    paddingVertical: 16,
    borderRadius: radii.full, // rounded-full
    minHeight: 76, // even larger M3 button
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroPrimaryBtnText: {
    fontFamily: font.label,
    color: colors.primary, // text-primary
    fontSize: 16, // big button text
    fontWeight: '700',
    textAlign: 'center', // allow text to wrap on 2 lines nicely
  },
  heroGhostBtn: {
    flex: 1, // Let button shrink/grow
    backgroundColor: alpha(colors.white, 0.20), // bg-white/20
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: radii.full,
    borderWidth: 1, // border border-white/10
    borderColor: alpha(colors.white, 0.15),
    minHeight: 76,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroGhostBtnText: {
    fontFamily: font.label,
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },

  // ── Categories + Activity ──
  twoColGrid: {
    gap: 32, // gap-8
    marginBottom: 32, // space-y-8
  },
  categoriesCol: { gap: 24 }, // space-y-6
  activityCol:   { gap: 24 }, // space-y-6

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: font.headline,
    fontSize: 22, // text-xl -> 22sp M3 Title Large
    fontWeight: '700', // font-bold
    color: colors.onBackground,
  },
  sectionLink: {
    fontFamily: font.label,
    fontSize: 15, // text-sm -> 15sp
    fontWeight: '600', // font-semibold
    color: colors.primary, // text-primary
  },
  filterBtn: {
    width: 32, height: 32, // w-8 h-8
    borderRadius: 16, // rounded-full
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center', justifyContent: 'center',
  },

  // Category grid
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16, // gap-4
  },
  catCard: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.surfaceContainerLow, // bg-surface-container-low
    borderRadius: 40, // very soft card boundaries
    padding: 24, // good padding
  },
  catCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16, // mb-4
  },
  catIconWrap: {
    width: 48, height: 48, // w-10 h-10 -> bumped to 48 M3 standard
    borderRadius: 24, // perfectly circular squircle
    alignItems: 'center', justifyContent: 'center',
  },
  catPercent: {
    fontFamily: font.label,
    fontSize: 13, // text-xs -> 13sp
    fontWeight: '700', // font-bold
    color: colors.onSurfaceVariant,
  },
  catLabel: {
    fontFamily: font.body,
    fontSize: 13, // text-xs -> 13sp
    fontWeight: '500', // font-medium
    color: colors.onSurfaceVariant,
    letterSpacing: -0.2, // tracking-tighter
    textTransform: 'uppercase', // uppercase
  },
  catAmount: {
    fontFamily: font.headline,
    fontSize: 20, // text-lg -> 20sp
    fontWeight: '700', // font-bold
    color: colors.onBackground,
    marginTop: 4, // mt-1
  },

  // Activity
  activityCard: {
    backgroundColor: colors.surfaceContainerLowest, // bg-surface-container-lowest
    borderRadius: 40, // very soft card boundaries
    padding: 8, // p-2
    gap: 4, // space-y-1
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20, // increased padding
    borderRadius: 32, // nicely rounded row
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16, // gap-4
    flex: 1,
  },
  activityAvatar: {
    width: 48, height: 48, // w-12 h-12
    borderRadius: 24, // rounded-full
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center', justifyContent: 'center',
  },
  activityInitials: {
    fontFamily: font.headline,
    fontSize: 16,
    fontWeight: '700', // font-bold
  },
  activityMerchant: {
    fontFamily: font.body,
    fontSize: 16, // text-sm -> 16sp M3 Body Large
    fontWeight: '700', // font-bold
    color: colors.onBackground,
  },
  activityDate: {
    fontFamily: font.body,
    fontSize: 13, // text-xs -> 13sp
    color: colors.onSurfaceVariant,
  },
  activityAmount: {
    fontFamily: font.headline,
    fontSize: 16, // text-sm -> 16sp
    fontWeight: '700', // font-bold
    color: colors.onBackground,
  },

  // Upcoming Bills
  billsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32, // gap-8
    backgroundColor: colors.surfaceContainerHigh,
    borderTopLeftRadius: 48,
    borderTopRightRadius: 16, // softer asymmetry
    borderBottomRightRadius: 48,
    borderBottomLeftRadius: 48,
    padding: 40, // very plush padding
  },
  billsLeft: { flex: 1, gap: 16 /* space-y-4 */ },
  billsChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary, // bg-primary
    paddingHorizontal: 12, // px-3
    paddingVertical: 4, // py-1
    borderRadius: radii.full,
  },
  billsChipText: {
    fontFamily: font.label,
    fontSize: 10, // text-[10px]
    fontWeight: '700', // font-bold
    color: colors.onPrimary,
    letterSpacing: 1.5, // tracking-widest
    textTransform: 'uppercase', // uppercase
  },
  billsTitle: {
    fontFamily: font.headline,
    fontSize: 32, // text-3xl -> 32sp M3 Headline Medium
    fontWeight: '800', // font-extrabold
    color: colors.onBackground,
    letterSpacing: -0.5, // tracking-tight
    lineHeight: 36,
  },
  billsBody: {
    fontFamily: font.body,
    fontSize: 14, // text-sm
    color: colors.onSurfaceVariant,
    lineHeight: 22,
  },
  billsRight: { alignItems: 'center', gap: 24 /* gap-6 */ },
  billsDueLabel: {
    fontFamily: font.label,
    fontSize: 11, // text-[10px] -> 11sp
    fontWeight: '700', // font-bold
    color: colors.onSurfaceVariant,
    letterSpacing: 1.5, // tracking-widest
    textTransform: 'uppercase', // uppercase
  },
  billsDueValue: {
    fontFamily: font.headline,
    fontSize: 36, // text-3xl -> 36sp M3 Display Small
    fontWeight: '900', // font-black
    color: colors.primary,
  },
  billsDivider: {
    width: 1, // w-px
    height: 48, // h-12
    backgroundColor: alpha(colors.outlineVariant, 0.30),
  },
  billsBtn: {
    backgroundColor: colors.primary, // bg-primary
    paddingHorizontal: 40, // px-8
    paddingVertical: 18, // py-4 -> slightly taller
    borderRadius: 20, // softer radius for button
    minHeight: 64, // M3 minimum height for large buttons
    justifyContent: 'center',
  },
  billsBtnText: {
    fontFamily: font.label,
    fontSize: 17, // text-sm -> 15sp -> bumped to 17sp
    fontWeight: '700', // font-bold
    color: colors.onPrimary,
  },

  // Empty
  emptyBlock: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
  },
  emptyBlockText: {
    fontFamily: font.body,
    fontSize: 14,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
});
