import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Modal, FlatList, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

import { useStore } from '../store';
import { TransactionRepository } from '../database/TransactionRepository';
import { CATEGORY_LABELS } from '../types/Transaction';
import { TxCategory } from '../modules/LeapModule';
import { RootStackParams } from '../App';
import { themes, accent, accentInk, font, alpha } from '../theme';
import LiquidIcon, { CAT_ICON } from '../components/LiquidIcons';

type Route = RouteProp<RootStackParams, 'TransactionDetail'>;
const ALL_CATS = Object.keys(CATEGORY_LABELS) as TxCategory[];

export default function TransactionDetailScreen() {
  const nav   = useNavigation();
  const route = useRoute<Route>();
  const { transactions, updateCategory, deleteTransaction, themeMode } = useStore();
  const t = themes[themeMode];
  const aink = accentInk(themeMode);

  const [showCatPicker, setShowCatPicker] = useState(false);

  const tx = transactions.find(t => t.id === route.params.transactionId);
  if (!tx) return null;

  const cat = tx.userCategory ?? tx.category;

  function applyCategory(newCat: TxCategory) {
    TransactionRepository.updateCategory(tx!.id, newCat);
    updateCategory(tx!.id, newCat);
    setShowCatPicker(false);
  }

  function promptDelete() {
    Alert.alert('Delete Transaction', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
          TransactionRepository.delete(tx!.id);
          deleteTransaction(tx!.id);
          nav.goBack();
      }}
    ]);
  }

  const s = getStyles(t, aink);

  const isDebit = tx.type === 'DEBIT';
  const confidencePct = Math.round(tx.confidence * 100);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top', 'bottom']}>
      {/* Nav */}
      <View style={s.navbar}>
        <TouchableOpacity onPress={() => nav.goBack()} style={s.navBtn}>
          <Text style={{ fontSize: 18, color: t.ink, transform: [{ rotate: '180deg' }], marginBottom: 2 }}>&#x203A;</Text>
        </TouchableOpacity>
        <Text style={{ fontFamily: font.mono, fontSize: 11, color: t.mute }}>tx_{tx.id.substring(0, 6)}</Text>
        <TouchableOpacity onPress={promptDelete} style={s.navBtn}>
          <LiquidIcon name="dots" size={16} color={t.ink} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={s.hero}>
          <View style={s.heroIconWrap}>
            <LiquidIcon name={CAT_ICON[cat] ?? 'dots'} size={32} color={accent.v} strokeWidth={1.6} />
          </View>
          <Text style={s.heroTarget}>{tx.type.toLowerCase()} · {tx.sender.toLowerCase()}</Text>
          <Text style={s.heroAmount}>
            {isDebit ? '\u2212' : '+'}{formatCurrency(tx.amount, tx.currencyCode)}
          </Text>
          <Text style={s.heroMerchant}>{tx.merchant || tx.sender || 'Unknown'}</Text>
          <Text style={s.heroDate}>{formatDate(tx.smsDate)} · {tx.city || 'local'}</Text>
        </View>

        {/* Confidence Pill */}
        <View style={s.confidenceCard}>
          <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: alpha(accent.v, 0.22), alignItems: 'center', justifyContent: 'center' }}>
            <LiquidIcon name="check" size={16} color={aink} />
          </View>
          <View style={{ flex: 1, paddingLeft: 12 }}>
            <Text style={{ fontFamily: font.uiBold, fontSize: 12, color: t.ink }}>AI classified · {confidencePct}% confidence</Text>
            <Text style={{ fontFamily: font.mono, fontSize: 10, color: t.mute, marginTop: 2 }}>category: {tx.category.toLowerCase()}</Text>
          </View>
        </View>

        {/* Detail rows */}
        <View style={s.detailsCard}>
          <DetailRow t={t} label="category" value={
            <TouchableOpacity onPress={() => setShowCatPicker(true)} style={s.catChip}>
              <Text style={{ fontFamily: font.uiBold, fontSize: 13, color: t.ink }}>{CATEGORY_LABELS[cat] ?? 'Unknown'}</Text>
              <Text style={{ fontFamily: font.mono, fontSize: 10, color: aink, marginLeft: 4 }}>edit</Text>
            </TouchableOpacity>
          } />
          <DetailRow t={t} label="type" value={tx.type} />
          {tx.accountReference && <DetailRow t={t} label="account" value={`····${tx.accountReference}`} />}
          {tx.balance != null && <DetailRow t={t} label="balance" value={formatCurrency(tx.balance, tx.balanceCurrencyCode ?? tx.currencyCode)} />}
          <DetailRow t={t} label="sender" value={tx.sender} />
          <DetailRow t={t} label="received" value={new Date(tx.smsDate).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} last />
        </View>

        {/* Raw SMS */}
        <View style={{ marginHorizontal: 16, marginTop: 16 }}>
          <Text style={{ fontFamily: font.mono, fontSize: 10, color: t.mute, marginBottom: 8, paddingLeft: 4, letterSpacing: 1, textTransform: 'uppercase' }}>original sms</Text>
          <View style={{ backgroundColor: t.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: t.rule }}>
            <Text style={{ fontFamily: font.mono, fontSize: 12, color: t.inkDim, lineHeight: 20 }}>{tx.rawSms}</Text>
          </View>
        </View>

      </ScrollView>

      {/* Category picker modal */}
      <Modal visible={showCatPicker} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <Text style={{ fontFamily: font.uiBold, fontSize: 18, color: t.ink, marginBottom: 16 }}>Change category</Text>
            <FlatList
              data={ALL_CATS} keyExtractor={c => c}
              renderItem={({ item }) => (
                <TouchableOpacity style={[s.catOption, item === cat && s.catOptionActive]} onPress={() => applyCategory(item)}>
                  <LiquidIcon name={CAT_ICON[item] ?? 'dots'} size={18} color={item === cat ? aink : t.ink} />
                  <Text style={{ flex: 1, fontFamily: font.uiBold, fontSize: 15, color: t.ink, marginLeft: 12 }}>{CATEGORY_LABELS[item]}</Text>
                  {item === cat && <LiquidIcon name="check" size={16} color={aink} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function DetailRow({ t, label, value, last }: any) {
  return (
    <View style={[{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 }, !last && { borderBottomWidth: 1, borderBottomColor: t.rule }]}>
      <Text style={{ fontFamily: font.mono, fontSize: 11, color: t.mute }}>{label}</Text>
      {typeof value === 'string' ? <Text style={{ fontFamily: font.uiBold, fontSize: 13, color: t.ink }}>{value}</Text> : value}
    </View>
  );
}

function getStyles(t: any, aink: string) {
  return StyleSheet.create({
    navbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
    navBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: t.surface, borderWidth: 1, borderColor: t.rule, alignItems: 'center', justifyContent: 'center' },

    hero: { paddingHorizontal: 24, paddingVertical: 20, alignItems: 'center' },
    heroIconWrap: { width: 72, height: 72, borderRadius: 22, backgroundColor: alpha(accent.v, 0.22), alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
    heroTarget: { fontFamily: font.mono, fontSize: 13, color: t.mute, marginBottom: 4 },
    heroAmount: { fontFamily: font.display, fontSize: 56, fontWeight: '500', letterSpacing: -2.5, color: t.ink, lineHeight: 64, includeFontPadding: false },
    heroMerchant: { fontFamily: font.uiBold, fontSize: 18, color: t.ink, marginTop: 14 },
    heroDate: { fontFamily: font.ui, fontSize: 12, color: t.mute, marginTop: 4 },

    confidenceCard: { marginHorizontal: 16, marginBottom: 16, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: t.surface, borderRadius: 16, borderWidth: 1, borderColor: t.rule, flexDirection: 'row', alignItems: 'center' },

    detailsCard: { marginHorizontal: 16, paddingHorizontal: 16, paddingVertical: 4, backgroundColor: t.surface, borderRadius: 20, borderWidth: 1, borderColor: t.rule },
    catChip: { flexDirection: 'row', alignItems: 'center' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalSheet: { backgroundColor: t.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 40, maxHeight: '80%' },
    modalHandle: { width: 40, height: 4, backgroundColor: t.rule, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 20 },
    catOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: t.rule },
    catOptionActive: { backgroundColor: alpha(accent.v, 0.08) },
  });
}

function formatCurrency(amount: number, currency: string): string {
  try { return new Intl.NumberFormat('en', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount); }
  catch { return `${currency} ${amount.toFixed(0)}`; }
}

function formatDate(ms: number) {
  const d = new Date(ms);
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' }) + ', ' + d.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' }).toLowerCase();
}
