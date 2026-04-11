import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useStore } from '../store';
import { TransactionRepository } from '../database/TransactionRepository';
import { SmsOrchestrator } from '../services/SmsOrchestrator';
import { CATEGORY_LABELS, CATEGORY_EMOJI, Transaction } from '../types/Transaction';
import { TxCategory } from '../modules/LeapModule';
import { RootStackParams } from '../App';

type Nav = NativeStackNavigationProp<RootStackParams>;

const { width: SW } = Dimensions.get('window');

// Current month range
function currentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const end   = now.getTime();
  return { start, end };
}

export default function DashboardScreen() {
  const nav = useNavigation<Nav>();
  const { transactions, setTransactions, syncing, setSyncing } = useStore();

  const [categoryTotals, setCategoryTotals] = useState<Record<string, number>>({});
  const [monthSpend, setMonthSpend]         = useState(0);
  const [monthIncome, setMonthIncome]       = useState(0);
  const [refreshing, setRefreshing]         = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [transactions])
  );

  function loadData() {
    const { start, end } = currentMonthRange();
    const totals = TransactionRepository.getTotalSpentByCategory(start, end);
    setCategoryTotals(totals);

    const all = TransactionRepository.getByDateRange(start, end);
    const debits  = all.filter(t => t.type === 'DEBIT').reduce((s, t) => s + t.amount, 0);
    const credits = all.filter(t => t.type === 'CREDIT').reduce((s, t) => s + t.amount, 0);
    setMonthSpend(debits);
    setMonthIncome(credits);
  }

  async function onRefresh() {
    setRefreshing(true);
    try {
      const n = await SmsOrchestrator.syncOnOpen();
      if (n > 0) {
        const fresh = TransactionRepository.getAll(200);
        setTransactions(fresh);
      }
    } catch {}
    setRefreshing(false);
  }

  const recentTxns = transactions.slice(0, 5);
  const topCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
  const totalCategorySpend = topCategories.reduce((s, [, v]) => s + v, 0);

  const { start } = currentMonthRange();
  const monthName = new Date(start).toLocaleString('default', { month: 'long' });

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00FF94"
            colors={['#00FF94']}
          />
        }>

        {/* ── Header ── */}
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>Good {greeting()}</Text>
            <Text style={s.subtitle}>{monthName} overview</Text>
          </View>
          <View style={s.aiDot}>
            <View style={s.aiDotInner} />
            <Text style={s.aiLabel}>AI</Text>
          </View>
        </View>

        {/* ── Month summary cards ── */}
        <View style={s.cardRow}>
          <SummaryCard
            label="Spent"
            amount={monthSpend}
            currency={dominantCurrency(transactions)}
            accent="#FF4444"
          />
          <SummaryCard
            label="Income"
            amount={monthIncome}
            currency={dominantCurrency(transactions)}
            accent="#00FF94"
          />
        </View>

        {/* ── Category breakdown ── */}
        {topCategories.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Where it went</Text>
            {topCategories.map(([cat, amount]) => (
              <CategoryBar
                key={cat}
                category={cat as TxCategory}
                amount={amount}
                total={totalCategorySpend}
                currency={dominantCurrency(transactions)}
              />
            ))}
          </View>
        )}

        {/* ── Recent transactions ── */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Recent</Text>
            <TouchableOpacity onPress={() => nav.navigate('Main', { screen: 'Transactions' } as any)}>
              <Text style={s.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          {recentTxns.length === 0 ? (
            <EmptyState />
          ) : (
            recentTxns.map(tx => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                onPress={() => nav.navigate('TransactionDetail', { transactionId: tx.id })}
              />
            ))
          )}
        </View>

        {/* ── Sync status ── */}
        <View style={s.syncRow}>
          <Text style={s.syncText}>
            {transactions.length} transactions  ·  pull to sync
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-components ────────────────────────────────────────────

function SummaryCard({
  label, amount, currency, accent,
}: {
  label: string; amount: number; currency: string; accent: string;
}) {
  return (
    <View style={[s.summaryCard, { borderLeftColor: accent, borderLeftWidth: 3 }]}>
      <Text style={s.summaryLabel}>{label}</Text>
      <Text style={[s.summaryAmount, { color: accent }]}>
        {formatAmount(amount, currency)}
      </Text>
    </View>
  );
}

function CategoryBar({
  category, amount, total, currency,
}: {
  category: TxCategory; amount: number; total: number; currency: string;
}) {
  const pct = total > 0 ? (amount / total) * 100 : 0;
  return (
    <View style={s.catRow}>
      <Text style={s.catEmoji}>{CATEGORY_EMOJI[category]}</Text>
      <View style={{ flex: 1 }}>
        <View style={s.catTopRow}>
          <Text style={s.catName}>{CATEGORY_LABELS[category]}</Text>
          <Text style={s.catAmount}>{formatAmount(amount, currency)}</Text>
        </View>
        <View style={s.catBarBg}>
          <View style={[s.catBarFill, { width: `${Math.min(pct, 100)}%` }]} />
        </View>
      </View>
    </View>
  );
}

function TransactionRow({ tx, onPress }: { tx: Transaction; onPress: () => void }) {
  const cat = tx.userCategory ?? tx.category;
  return (
    <TouchableOpacity style={s.txRow} onPress={onPress} activeOpacity={0.7}>
      <View style={s.txIcon}>
        <Text style={s.txEmoji}>{CATEGORY_EMOJI[cat]}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.txMerchant} numberOfLines={1}>
          {tx.merchant || tx.sender || 'Unknown'}
        </Text>
        <Text style={s.txDate}>{formatDate(tx.smsDate)}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[s.txAmount, { color: tx.type === 'DEBIT' ? '#FF4444' : '#00FF94' }]}>
          {tx.type === 'DEBIT' ? '−' : '+'}{formatAmount(tx.amount, tx.currencyCode)}
        </Text>
        {tx.confidence < 0.7 && (
          <Text style={s.lowConfidence}>low confidence</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

function EmptyState() {
  return (
    <View style={s.empty}>
      <Text style={s.emptyIcon}>📭</Text>
      <Text style={s.emptyTitle}>No transactions yet</Text>
      <Text style={s.emptyDesc}>
        Pull down to sync SMS, or go to Settings to import a time period.
      </Text>
    </View>
  );
}

// ── Helpers ───────────────────────────────────────────────────

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

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
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString('en', { day: 'numeric', month: 'short' });
}

// ── Styles ────────────────────────────────────────────────────

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#0D0D0D' },
  scroll:      { padding: 20, paddingBottom: 40 },

  header:      { flexDirection: 'row', justifyContent: 'space-between',
                 alignItems: 'center', marginBottom: 24 },
  greeting:    { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
  subtitle:    { fontSize: 14, color: '#555555', marginTop: 2 },

  aiDot:       { flexDirection: 'row', alignItems: 'center', gap: 6,
                 backgroundColor: '#141414', borderRadius: 20,
                 paddingHorizontal: 12, paddingVertical: 6 },
  aiDotInner:  { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00FF94' },
  aiLabel:     { fontSize: 12, color: '#00FF94', fontWeight: '700' },

  cardRow:     { flexDirection: 'row', gap: 12, marginBottom: 28 },
  summaryCard: { flex: 1, backgroundColor: '#141414', borderRadius: 14, padding: 16 },
  summaryLabel:{ fontSize: 12, color: '#555555', marginBottom: 6 },
  summaryAmount:{ fontSize: 22, fontWeight: '700' },

  section:     { marginBottom: 28 },
  sectionHeader:{ flexDirection: 'row', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: 14 },
  sectionTitle:{ fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 14 },
  seeAll:      { fontSize: 13, color: '#00FF94' },

  catRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  catEmoji:    { fontSize: 20, width: 28 },
  catTopRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  catName:     { fontSize: 14, color: '#CCCCCC' },
  catAmount:   { fontSize: 14, color: '#FFFFFF', fontWeight: '600' },
  catBarBg:    { height: 3, backgroundColor: '#222222', borderRadius: 2, overflow: 'hidden' },
  catBarFill:  { height: '100%', backgroundColor: '#00FF94', borderRadius: 2 },

  txRow:       { flexDirection: 'row', alignItems: 'center', gap: 14,
                 paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth,
                 borderBottomColor: '#1A1A1A' },
  txIcon:      { width: 40, height: 40, borderRadius: 12, backgroundColor: '#1A1A1A',
                 alignItems: 'center', justifyContent: 'center' },
  txEmoji:     { fontSize: 18 },
  txMerchant:  { fontSize: 15, color: '#FFFFFF', fontWeight: '500', marginBottom: 3 },
  txDate:      { fontSize: 12, color: '#555555' },
  txAmount:    { fontSize: 15, fontWeight: '700' },
  lowConfidence:{ fontSize: 10, color: '#888888', marginTop: 2 },

  empty:       { alignItems: 'center', paddingVertical: 40 },
  emptyIcon:   { fontSize: 40, marginBottom: 12 },
  emptyTitle:  { fontSize: 16, color: '#FFFFFF', fontWeight: '600', marginBottom: 8 },
  emptyDesc:   { fontSize: 14, color: '#555555', textAlign: 'center', lineHeight: 22 },

  syncRow:     { alignItems: 'center', paddingTop: 8 },
  syncText:    { fontSize: 12, color: '#333333' },
});
