import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Modal, FlatList, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

import { useStore } from '../store';
import { TransactionRepository } from '../database/TransactionRepository';
import { CATEGORY_LABELS, CATEGORY_EMOJI } from '../types/Transaction';
import { TxCategory } from '../modules/LeapModule';
import { RootStackParams } from '../App';

type Route = RouteProp<RootStackParams, 'TransactionDetail'>;
const ALL_CATS = Object.keys(CATEGORY_LABELS) as TxCategory[];

export default function TransactionDetailScreen() {
  const nav   = useNavigation();
  const route = useRoute<Route>();
  const { transactions, updateCategory, deleteTransaction } = useStore();
  const [showCatPicker, setShowCatPicker] = useState(false);

  const tx = transactions.find(t => t.id === route.params.transactionId);
  if (!tx) return null;

  const cat = tx.userCategory ?? tx.category;

  function applyCategory(newCat: TxCategory) {
    TransactionRepository.updateCategory(tx!.id, newCat);
    updateCategory(tx!.id, newCat);
    setShowCatPicker(false);
  }

  return (
    <SafeAreaView style={d.container} edges={['top', 'bottom']}>
      <View style={d.navbar}>
        <TouchableOpacity onPress={() => nav.goBack()} style={d.backBtn}>
          <Text style={d.backText}>✕</Text>
        </TouchableOpacity>
        <Text style={d.navTitle}>Transaction</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={d.scroll}>
        {/* Amount hero */}
        <View style={d.heroCard}>
          <Text style={d.heroEmoji}>{CATEGORY_EMOJI[cat]}</Text>
          <Text style={[d.heroAmount, { color: tx.type === 'DEBIT' ? '#FF4444' : '#00FF94' }]}>
            {tx.type === 'DEBIT' ? '−' : '+'}{formatCurrency(tx.amount, tx.currencyCode)}
          </Text>
          <Text style={d.heroMerchant}>{tx.merchant || tx.sender || 'Unknown'}</Text>
          <Text style={d.heroDate}>{new Date(tx.smsDate).toLocaleString()}</Text>
        </View>

        {/* Details */}
        <View style={d.section}>
          <DetailRow label="Category" value={
            <TouchableOpacity onPress={() => setShowCatPicker(true)} style={d.catChip}>
              <Text style={d.catChipText}>{CATEGORY_LABELS[cat]}</Text>
              <Text style={d.catChipEdit}>Edit</Text>
            </TouchableOpacity>
          } />
          <DetailRow label="Type"     value={<Text style={d.val}>{tx.type}</Text>} />
          <DetailRow label="Currency" value={<Text style={d.val}>{tx.currencyCode}</Text>} />
          {tx.accountReference && (
            <DetailRow label="Account" value={<Text style={d.val}>····{tx.accountReference}</Text>} />
          )}
          {tx.balance != null && (
            <DetailRow label="Balance after" value={
              <Text style={d.val}>{formatCurrency(tx.balance, tx.balanceCurrencyCode ?? tx.currencyCode)}</Text>
            } />
          )}
          <DetailRow label="Sender" value={<Text style={d.val}>{tx.sender}</Text>} />
          <DetailRow label="AI confidence" value={
            <Text style={[d.val, { color: tx.confidence >= 0.8 ? '#00FF94' : '#FF8844' }]}>
              {Math.round(tx.confidence * 100)}%
            </Text>
          } />
          {tx.userVerified && (
            <DetailRow label="Verified by" value={<Text style={[d.val, { color: '#00FF94' }]}>You ✓</Text>} />
          )}
        </View>

        {/* Raw SMS */}
        <View style={d.section}>
          <Text style={d.sectionLabel}>Original SMS</Text>
          <View style={d.smsBox}>
            <Text style={d.smsText}>{tx.rawSms}</Text>
          </View>
        </View>

        {/* Delete */}
        <TouchableOpacity
          style={d.deleteBtn}
          onPress={() => {
            Alert.alert(
              'Delete Transaction',
              'Delete this transaction? This cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete', style: 'destructive',
                  onPress: () => {
                    TransactionRepository.delete(tx.id);
                    deleteTransaction(tx.id);
                    nav.goBack();
                  },
                },
              ]
            );
          }}>
          <Text style={d.deleteBtnText}>Delete Transaction</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Category picker modal */}
      <Modal visible={showCatPicker} animationType="slide" transparent>
        <View style={d.modalOverlay}>
          <View style={d.modalSheet}>
            <View style={d.modalHandle} />
            <Text style={d.modalTitle}>Change category</Text>
            <FlatList
              data={ALL_CATS}
              keyExtractor={c => c}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[d.catOption, item === cat && d.catOptionActive]}
                  onPress={() => applyCategory(item)}>
                  <Text style={d.catOptionEmoji}>{CATEGORY_EMOJI[item]}</Text>
                  <Text style={d.catOptionLabel}>{CATEGORY_LABELS[item]}</Text>
                  {item === cat && <Text style={d.catCheck}>✓</Text>}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <View style={d.detailRow}>
      <Text style={d.detailLabel}>{label}</Text>
      {value}
    </View>
  );
}

const d = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  navbar:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
               paddingHorizontal: 20, paddingVertical: 14 },
  backBtn:   { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1A1A1A',
               alignItems: 'center', justifyContent: 'center' },
  backText:  { fontSize: 16, color: '#FFFFFF' },
  navTitle:  { fontSize: 17, fontWeight: '600', color: '#FFFFFF' },
  scroll:    { padding: 20, paddingBottom: 60 },

  heroCard:    { backgroundColor: '#141414', borderRadius: 20, padding: 28,
                 alignItems: 'center', marginBottom: 24 },
  heroEmoji:   { fontSize: 48, marginBottom: 12 },
  heroAmount:  { fontSize: 36, fontWeight: '800', marginBottom: 6 },
  heroMerchant:{ fontSize: 18, color: '#FFFFFF', fontWeight: '600', marginBottom: 4 },
  heroDate:    { fontSize: 13, color: '#555' },

  section:      { marginBottom: 24 },
  sectionLabel: { fontSize: 12, color: '#555', marginBottom: 10,
                  textTransform: 'uppercase', letterSpacing: 1 },
  detailRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
               paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth,
               borderBottomColor: '#1A1A1A' },
  detailLabel:{ fontSize: 14, color: '#666' },
  val:        { fontSize: 14, color: '#FFFFFF', fontWeight: '500' },

  catChip:    { flexDirection: 'row', alignItems: 'center', gap: 8,
               backgroundColor: '#1A1A1A', borderRadius: 8,
               paddingHorizontal: 12, paddingVertical: 6 },
  catChipText:{ fontSize: 14, color: '#FFFFFF' },
  catChipEdit:{ fontSize: 12, color: '#00FF94' },

  smsBox:    { backgroundColor: '#141414', borderRadius: 12, padding: 14 },
  smsText:   { fontSize: 13, color: '#888', lineHeight: 20 },

  deleteBtn:     { marginTop: 12, backgroundColor: '#FF444415', borderWidth: 1,
                   borderColor: '#FF444440', borderRadius: 14, paddingVertical: 16,
                   alignItems: 'center' },
  deleteBtnText: { fontSize: 15, color: '#FF4444', fontWeight: '600' },

  modalOverlay:{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
                 justifyContent: 'flex-end' },
  modalSheet:  { backgroundColor: '#141414', borderTopLeftRadius: 24,
                 borderTopRightRadius: 24, paddingHorizontal: 20,
                 paddingBottom: 40, maxHeight: '80%' },
  modalHandle: { width: 40, height: 4, backgroundColor: '#333', borderRadius: 2,
                 alignSelf: 'center', marginTop: 12, marginBottom: 20 },
  modalTitle:  { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 16 },
  catOption:   { flexDirection: 'row', alignItems: 'center', gap: 14,
                 paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth,
                 borderBottomColor: '#222' },
  catOptionActive: { backgroundColor: '#00FF9408' },
  catOptionEmoji:  { fontSize: 22, width: 32 },
  catOptionLabel:  { flex: 1, fontSize: 15, color: '#FFFFFF' },
  catCheck:        { fontSize: 16, color: '#00FF94' },
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
