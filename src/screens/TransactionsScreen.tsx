import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useStore } from '../store';
import { TransactionRepository } from '../database/TransactionRepository';
import { SmsOrchestrator } from '../services/SmsOrchestrator';
import { CATEGORY_LABELS, CATEGORY_EMOJI, Transaction } from '../types/Transaction';
import { TxCategory } from '../modules/LeapModule';
import { RootStackParams } from '../App';

type Nav = NativeStackNavigationProp<RootStackParams>;

export default function TransactionsScreen() {
  const nav = useNavigation<Nav>();
  const { transactions, setTransactions, deleteTransactions } = useStore();
  const [search, setSearch]         = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'DEBIT' | 'CREDIT'>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  // Selection mode
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected]   = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        t.merchant.toLowerCase().includes(q) ||
        t.sender.toLowerCase().includes(q) ||
        (t.userCategory ?? t.category).toLowerCase().includes(q);
      const matchType = typeFilter === 'ALL' || t.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [transactions, search, typeFilter]);

  async function onRefresh() {
    setRefreshing(true);
    try {
      const n = await SmsOrchestrator.syncOnOpen();
      if (n > 0) setTransactions(TransactionRepository.getAll(200));
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
    setSelected(new Set(filtered.map(t => t.id)));
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
      'Delete All Transactions',
      `Delete all ${transactions.length} transactions? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All', style: 'destructive',
          onPress: () => {
            TransactionRepository.deleteAll();
            setTransactions([]);
            cancelSelection();
          },
        },
      ]
    );
  }, [transactions.length, setTransactions, cancelSelection]);

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header — switches between normal and selection mode */}
      {selecting ? (
        <View style={s.header}>
          <TouchableOpacity onPress={cancelSelection}>
            <Text style={s.cancelBtn}>Cancel</Text>
          </TouchableOpacity>
          <Text style={s.title}>{selected.size} selected</Text>
          <View style={s.headerActions}>
            <TouchableOpacity onPress={selectAll} style={s.headerBtn}>
              <Text style={s.headerBtnText}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={deleteSelected}
              style={[s.headerBtn, s.deleteBtn]}
              disabled={selected.size === 0}>
              <Text style={s.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={s.header}>
          <Text style={s.title}>Transactions</Text>
          <View style={s.headerActions}>
            {transactions.length > 0 && (
              <TouchableOpacity onPress={deleteAll} style={[s.headerBtn, s.deleteAllBtn]}>
                <Text style={s.deleteAllText}>Clear All</Text>
              </TouchableOpacity>
            )}
            <Text style={s.count}>{filtered.length}</Text>
          </View>
        </View>
      )}

      {/* Search */}
      <View style={s.searchBar}>
        <Text style={s.searchIcon}>&#x2315;</Text>
        <TextInput
          style={s.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search merchant, category..."
          placeholderTextColor="#444"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={s.clearBtn}>&#x2715;</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter pills */}
      <View style={s.filters}>
        {(['ALL', 'DEBIT', 'CREDIT'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[s.filterPill, typeFilter === f && s.filterPillActive]}
            onPress={() => setTypeFilter(f)}>
            <Text style={[s.filterText, typeFilter === f && s.filterTextActive]}>
              {f === 'ALL' ? 'All' : f === 'DEBIT' ? 'Spent' : 'Received'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={t => t.id}
        extraData={selected}
        renderItem={({ item }) => (
          <TxListItem
            tx={item}
            selecting={selecting}
            isSelected={selected.has(item.id)}
            onPress={() => {
              if (selecting) toggleSelect(item.id);
              else nav.navigate('TransactionDetail', { transactionId: item.id });
            }}
            onLongPress={() => {
              if (!selecting) onLongPress(item.id);
            }}
          />
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyText}>No transactions found</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
            tintColor="#00FF94" colors={['#00FF94']} />
        }
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        initialNumToRender={20}
      />
    </SafeAreaView>
  );
}

function TxListItem({ tx, selecting, isSelected, onPress, onLongPress }: {
  tx: Transaction; selecting: boolean; isSelected: boolean;
  onPress: () => void; onLongPress: () => void;
}) {
  const cat = tx.userCategory ?? tx.category;
  return (
    <TouchableOpacity
      style={[s.txRow, isSelected && s.txRowSelected]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}>
      {selecting ? (
        <View style={[s.checkbox, isSelected && s.checkboxSelected]}>
          {isSelected && <Text style={s.checkmark}>&#x2713;</Text>}
        </View>
      ) : (
        <View style={s.txIcon}>
          <Text style={{ fontSize: 18 }}>{CATEGORY_EMOJI[cat]}</Text>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={s.txMerchant} numberOfLines={1}>
          {tx.merchant || tx.sender || 'Unknown'}
        </Text>
        <Text style={s.txMeta}>
          {CATEGORY_LABELS[cat]}  ·  {formatDate(tx.smsDate)}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[s.txAmount, { color: tx.type === 'DEBIT' ? '#FF4444' : '#00FF94' }]}>
          {tx.type === 'DEBIT' ? '\u2212' : '+'}{formatCurrency(tx.amount, tx.currencyCode)}
        </Text>
        {!tx.userVerified && tx.confidence < 0.7 && (
          <View style={s.badge}><Text style={s.badgeText}>review</Text></View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
               paddingHorizontal: 20, paddingVertical: 16 },
  title:     { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
  count:     { fontSize: 13, color: '#555', backgroundColor: '#1A1A1A',
               paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },

  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerBtn:     { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8,
                   backgroundColor: '#1A1A1A' },
  headerBtnText: { fontSize: 13, color: '#FFFFFF', fontWeight: '600' },
  deleteBtn:     { backgroundColor: '#FF444430' },
  deleteBtnText: { fontSize: 13, color: '#FF4444', fontWeight: '600' },
  cancelBtn:     { fontSize: 15, color: '#00FF94', fontWeight: '600' },

  deleteAllBtn:  { backgroundColor: '#FF444415', borderWidth: 1, borderColor: '#FF444440' },
  deleteAllText: { fontSize: 12, color: '#FF4444', fontWeight: '600' },

  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#141414',
               borderRadius: 12, marginHorizontal: 20, marginBottom: 12,
               paddingHorizontal: 14, paddingVertical: 10, gap: 10 },
  searchIcon:{ fontSize: 18, color: '#555' },
  searchInput:{ flex: 1, fontSize: 15, color: '#FFFFFF', padding: 0 },
  clearBtn:  { fontSize: 14, color: '#555' },

  filters:   { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 16 },
  filterPill:{ paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
               backgroundColor: '#141414', borderWidth: 1, borderColor: '#222' },
  filterPillActive: { backgroundColor: '#00FF9420', borderColor: '#00FF94' },
  filterText:{ fontSize: 13, color: '#666' },
  filterTextActive: { color: '#00FF94', fontWeight: '600' },

  txRow:     { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14,
               borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#1A1A1A' },
  txRowSelected: { backgroundColor: '#00FF9410', borderRadius: 12 },
  txIcon:    { width: 42, height: 42, borderRadius: 12, backgroundColor: '#1A1A1A',
               alignItems: 'center', justifyContent: 'center' },
  txMerchant:{ fontSize: 15, color: '#FFFFFF', fontWeight: '500', marginBottom: 3 },
  txMeta:    { fontSize: 12, color: '#555' },
  txAmount:  { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  badge:     { backgroundColor: '#FF444420', borderRadius: 4,
               paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { fontSize: 10, color: '#FF4444' },

  checkbox:  { width: 26, height: 26, borderRadius: 8, borderWidth: 2,
               borderColor: '#444', alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { backgroundColor: '#00FF94', borderColor: '#00FF94' },
  checkmark: { fontSize: 14, color: '#000', fontWeight: '700' },

  empty:     { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: '#444', fontSize: 15 },
});

function formatCurrency(amount: number, currency: string): string {
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
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString('en', { day: 'numeric', month: 'short' });
}
