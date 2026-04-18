import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, RefreshControl, Alert, ScrollView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useStore } from '../store';
import { TransactionRepository } from '../database/TransactionRepository';
import { CATEGORY_LABELS, CATEGORY_EMOJI, Transaction } from '../types/Transaction';
import { TxCategory } from '../modules/LeapModule';
import { RootStackParams } from '../App';
import { themes, accent, accentInk, font, alpha, ThemeMode } from '../theme';
import LiquidIcon, { CAT_ICON } from '../components/LiquidIcons';
import { FAB } from '../components/ActionViews';

type Nav = NativeStackNavigationProp<RootStackParams>;

export default function TransactionsScreen() {
  const nav = useNavigation<Nav>();
  const { transactions, setTransactions, deleteTransactions, themeMode } = useStore();
  const t = themes[themeMode];
  const aink = accentInk(themeMode);

  const [search, setSearch]         = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'DEBIT' | 'CREDIT'>('ALL');
  const [currencyFilter, setCurrencyFilter] = useState<string>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  // Selection mode
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected]   = useState<Set<string>>(new Set());

  const currencies = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(x => set.add(x.currencyCode));
    return Array.from(set).sort();
  }, [transactions]);

  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        tx.merchant.toLowerCase().includes(q) ||
        tx.sender.toLowerCase().includes(q) ||
        (tx.userCategory ?? tx.category).toLowerCase().includes(q);
      const matchType = typeFilter === 'ALL' || (typeFilter === 'DEBIT' ? tx.type === 'DEBIT' : tx.type === 'CREDIT');
      const matchCcy = currencyFilter === 'ALL' || tx.currencyCode === currencyFilter;
      return matchSearch && matchType && matchCcy;
    });
  }, [transactions, search, typeFilter, currencyFilter]);

  // Group by day
  const grouped = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    filtered.forEach(tx => {
      const d = formatDateDay(tx.smsDate);
      if (!groups[d]) groups[d] = [];
      groups[d].push(tx);
    });
    return groups;
  }, [filtered]);

  async function onRefresh() {
    setRefreshing(true);
    try {
      setTransactions(TransactionRepository.getAll(200));
    } catch {}
    setRefreshing(false);
  }

  const toggleSelect = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const onLongPress = useCallback((id: string) => {
    setSelecting(true);
    setSelected(new Set([id]));
  }, []);

  const cancelSelection = useCallback(() => {
    setSelecting(false);
    setSelected(new Set());
  }, []);

  const selectAll = useCallback(() => {
    setSelected(new Set(filtered.map(x => x.id)));
  }, [filtered]);

  const deleteSelected = useCallback(() => {
    const count = selected.size;
    Alert.alert(
      'Delete Transactions',
      `Delete ${count} transaction${count > 1 ? 's' : ''}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: () => {
            const ids = Array.from(selected);
            TransactionRepository.deleteMultiple(ids);
            deleteTransactions(ids);
            cancelSelection();
          },
        },
      ]
    );
  }, [selected, deleteTransactions, cancelSelection]);

  const deleteAll = useCallback(() => {
    Alert.alert(
      'Delete All',
      `Delete all ${transactions.length} transactions?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete All', style: 'destructive', onPress: () => {
          TransactionRepository.deleteAll();
          setTransactions([]);
          cancelSelection();
        }}
      ]
    );
  }, [transactions, setTransactions, cancelSelection]);

  const s = getStyles(t, aink);

  const filters = [
    { l: 'All', n: transactions.length, on: typeFilter === 'ALL' && currencyFilter === 'ALL', action: () => { setTypeFilter('ALL'); setCurrencyFilter('ALL'); } },
    { l: 'Spent', n: transactions.filter(x=>x.type==='DEBIT').length, on: typeFilter === 'DEBIT', action: () => { setTypeFilter('DEBIT'); setCurrencyFilter('ALL'); } },
    { l: 'Received', n: transactions.filter(x=>x.type==='CREDIT').length, on: typeFilter === 'CREDIT', action: () => { setTypeFilter('CREDIT'); setCurrencyFilter('ALL'); } },
    ...currencies.map(c => ({
      l: c, n: transactions.filter(x=>x.currencyCode===c).length, on: currencyFilter === c, action: () => { setCurrencyFilter(c); setTypeFilter('ALL'); }
    }))
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top']}>
      {/* Header */}
      {selecting ? (
        <View style={s.header}>
          <TouchableOpacity onPress={cancelSelection}><Text style={[s.headerBtnText, {color: aink}]}>Cancel</Text></TouchableOpacity>
          <Text style={s.titleSmall}>{selected.size} selected</Text>
          <View style={{flexDirection:'row', gap:10}}>
            <TouchableOpacity onPress={selectAll}><Text style={[s.headerBtnText, {color: t.inkDim}]}>All</Text></TouchableOpacity>
            <TouchableOpacity onPress={deleteSelected} disabled={selected.size===0}><Text style={[s.headerBtnText, {color: '#FF4444'}]}>Delete</Text></TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={s.headerGroup}>
          <View style={s.headerRow}>
            <Text style={s.title}>Transactions</Text>
            <View style={s.liveBadge}>
              <View style={s.liveDot} />
              <Text style={s.liveText}>live</Text>
            </View>
          </View>
          <Text style={s.subtitle}>
            {transactions.length} entries · {currencies.length} currencies
          </Text>
        </View>
      )}

      {/* Search Bar */}
      <View style={s.searchWrap}>
        <View style={s.searchBar}>
          <LiquidIcon name="search" size={15} color={t.mute} />
          <TextInput
            style={s.searchInput}
            value={search} onChangeText={setSearch}
            placeholder="search merchants…"
            placeholderTextColor={t.mute}
            autoCapitalize="none" autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={{color: t.mute, fontFamily: font.mono}}>clear</Text>
            </TouchableOpacity>
          )}
        </View>
        {!selecting && transactions.length > 0 && (
          <TouchableOpacity onPress={deleteAll} style={s.clearAllBtn} activeOpacity={0.7}>
            <LiquidIcon name="basket" size={16} color={'#FF4444'} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filters (Horizontal) */}
      <View style={{ paddingBottom: 12 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterScroll}>
          {filters.map(f => (
            <TouchableOpacity key={f.l} onPress={f.action} style={[s.filterChip, f.on && s.filterChipOn]}>
              <Text style={[s.filterChipText, f.on && { color: themeMode==='dark' ? '#0D0D0D' : '#ffffff' }]}>{f.l}</Text>
              <Text style={[s.filterChipNum, f.on && { color: themeMode==='dark' ? '#0D0D0D' : '#ffffff', opacity: 0.7 }]}>{f.n}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* List */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent.v} />}
        showsVerticalScrollIndicator={false}
      >
        {Object.entries(grouped).map(([day, txns]) => {
          const spend = txns.filter(x => x.type === 'DEBIT').reduce((acc, x) => acc + x.amount, 0);
          const ccy = txns[0]?.currencyCode ?? 'USD';
          return (
            <View key={day} style={s.dayCard}>
              <View style={s.dayHeader}>
                <Text style={s.dayLabel}>{day.toLowerCase()}</Text>
                <Text style={s.daySpend}>~{formatCurrency(spend, ccy)} spent</Text>
              </View>
              {txns.map((tx, i) => (
                <TxListRow
                  key={tx.id} tx={tx} t={t} aink={aink} index={i}
                  selecting={selecting} isSelected={selected.has(tx.id)}
                  onPress={() => selecting ? toggleSelect(tx.id) : nav.navigate('TransactionDetail', { transactionId: tx.id })}
                  onLongPress={() => { if (!selecting) onLongPress(tx.id); }}
                />
              ))}
            </View>
          );
        })}
        {filtered.length === 0 && (
          <View style={s.emptyBox}>
            <Text style={{ fontFamily: font.ui, color: t.mute, fontSize: 13 }}>No transactions found.</Text>
          </View>
        )}
      </ScrollView>
      <FAB onPress={() => nav.navigate('AddTransaction')} />
    </SafeAreaView>
  );
}

function TxListRow({ tx, t, aink, index, selecting, isSelected, onPress, onLongPress }: any) {
  const cat = tx.userCategory ?? tx.category;
  return (
    <TouchableOpacity
      activeOpacity={0.7} onPress={onPress} onLongPress={onLongPress}
      style={[{
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingVertical: 12, paddingHorizontal: 16,
        borderTopWidth: index === 0 ? 0 : 1, borderTopColor: t.rule,
        backgroundColor: isSelected ? alpha(accent.v, 0.1) : 'transparent',
      }]}
    >
      {selecting ? (
        <View style={{ width: 36, height: 36, borderRadius: 12, borderWidth: 2, borderColor: isSelected ? accent.v : t.ruleStrong, alignItems: 'center', justifyContent: 'center', backgroundColor: isSelected ? accent.v : 'transparent' }}>
          {isSelected && <LiquidIcon name="check" size={20} color={'#0D0D0D'} />}
        </View>
      ) : (
        <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: t.surfaceHi, alignItems: 'center', justifyContent: 'center' }}>
          <LiquidIcon name={CAT_ICON[cat] ?? 'dots'} size={15} color={tx.type === 'CREDIT' ? aink : t.ink} strokeWidth={1.7} />
        </View>
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontFamily: font.uiBold, fontSize: 14, color: t.ink }} numberOfLines={1}>
          {tx.merchant || tx.sender || 'Unknown'}
        </Text>
        <Text style={{ fontFamily: font.mono, fontSize: 10, color: t.mute, marginTop: 3 }} numberOfLines={1}>
          {tx.sender.toLowerCase()} · {tx.city?.toLowerCase() ?? 'somewhere'}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ fontFamily: font.monoBold, fontSize: 13, color: tx.type === 'CREDIT' ? aink : t.ink }}>
          {tx.type === 'CREDIT' ? '+' : '\u2212'}{formatCurrencyOnly(tx.amount, tx.currencyCode)}
        </Text>
        <Text style={{ fontFamily: font.mono, fontSize: 9, color: t.mute, marginTop: 2 }}>{tx.currencyCode}</Text>
      </View>
    </TouchableOpacity>
  );
}

function getStyles(t: any, aink: string) {
  return StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
    headerBtnText: { fontFamily: font.uiBold, fontSize: 14 },
    titleSmall: { fontFamily: font.uiBold, fontSize: 15, color: t.ink },
    
    headerGroup: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 6 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
    title: { fontFamily: font.uiBold, fontSize: 28, letterSpacing: -1.2, color: t.ink },
    liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: accent.v, boxShadow: `0 0 8px ${accent.v}` },
    liveText: { fontFamily: font.mono, fontSize: 10, color: t.mute },
    subtitle: { fontFamily: font.mono, fontSize: 11, color: t.mute, marginTop: 4 },

    searchWrap: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 14, gap: 10, alignItems: 'center' },
    searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: t.surface, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10, gap: 10, borderWidth: 1, borderColor: t.rule },
    searchInput: { flex: 1, padding: 0, fontFamily: font.mono, fontSize: 13, color: t.ink },
    clearAllBtn: { padding: 10, backgroundColor: alpha('#FF4444', 0.1), borderRadius: 12 },

    filterScroll: { paddingHorizontal: 20, gap: 6, paddingTop: 12 },
    filterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 100, backgroundColor: t.surface, borderWidth: 1, borderColor: t.rule },
    filterChipOn: { backgroundColor: accent.v, borderColor: accent.v },
    filterChipText: { fontFamily: font.uiBold, fontSize: 11, color: t.inkDim },
    filterChipNum: { fontFamily: font.mono, fontSize: 9, color: t.mute },

    dayCard: { marginHorizontal: 16, marginBottom: 12, backgroundColor: t.surface, borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: t.rule },
    dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
    dayLabel: { fontFamily: font.mono, fontSize: 11, color: t.inkDim, letterSpacing: 0.4, fontWeight: '500' },
    daySpend: { fontFamily: font.mono, fontSize: 11, color: t.mute },

    emptyBox: { alignItems: 'center', paddingTop: 60 }
  });
}

function formatCurrency(amount: number, currency: string): string {
  try { return new Intl.NumberFormat('en', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount); }
  catch { return `${currency} ${amount.toFixed(0)}`; }
}

function formatCurrencyOnly(amount: number, currency: string): string {
  try { return new Intl.NumberFormat('en', { style: 'decimal', maximumFractionDigits: 0 }).format(amount); }
  catch { return amount.toFixed(0); }
}

function formatDateDay(ms: number): string {
  const d = new Date(ms);
  const now = new Date();
  const diff = Math.floor((now.setHours(0,0,0,0) - d.setHours(0,0,0,0)) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString('en', { day: 'numeric', month: 'short' });
}
