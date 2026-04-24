import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView, Alert, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { themes, font, accent, accentInk, alpha } from '../theme';
import { useStore } from '../store';
import LiquidIcon, { CAT_ICON } from '../components/LiquidIcons';
import { PressableScale } from './VaultAnimations';
import { TransactionRepository } from '../database/TransactionRepository';
import { CATEGORY_LABELS } from '../types/Transaction';
import { TxCategory } from '../modules/LeapModule';

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as TxCategory[];

// ==========================================
// Category Picker Modal
// ==========================================
function CategoryPicker({ visible, selected, onSelect, onClose, t }: {
  visible: boolean; selected: TxCategory; onSelect: (c: TxCategory) => void; onClose: () => void; t: any;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: t.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '70%' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 }}>
            <Text style={{ fontFamily: font.uiBold, fontSize: 18, color: t.ink }}>Select Category</Text>
            <TouchableOpacity onPress={onClose}>
              <LiquidIcon name="plus" size={20} color={t.mute} style={{ transform: [{ rotate: '45deg' }] }} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={ALL_CATEGORIES}
            keyExtractor={(item) => item}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
            renderItem={({ item }) => {
              const isSelected = item === selected;
              return (
                <TouchableOpacity
                  onPress={() => { onSelect(item); onClose(); }}
                  style={{
                    flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 4,
                    borderRadius: 16, backgroundColor: isSelected ? alpha(accent.v, 0.15) : 'transparent',
                  }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.chipBg, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                    <LiquidIcon name={CAT_ICON[item] ?? 'dots'} size={16} color={isSelected ? accent.v : t.inkDim} />
                  </View>
                  <Text style={{ fontFamily: font.uiBold, fontSize: 15, color: isSelected ? accent.v : t.ink, flex: 1 }}>
                    {CATEGORY_LABELS[item]}
                  </Text>
                  {isSelected && <LiquidIcon name="check" size={18} color={accent.v} strokeWidth={2.5} />}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

// ==========================================
// Transaction Form
// ==========================================
export const AddTransactionScreen = ({ navigation }: any) => {
  const { themeMode, setTransactions } = useStore();
  const t = themes[themeMode];
  const aink = accentInk(themeMode);

  const [type, setType] = useState<'DEBIT' | 'CREDIT'>('DEBIT');
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState<TxCategory>('OTHER');
  const [showCatPicker, setShowCatPicker] = useState(false);

  function save() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { Alert.alert('Invalid amount'); return; }
    if (!merchant.trim()) { Alert.alert('Enter a merchant name'); return; }

    TransactionRepository.insert({
      smsId: `manual-${Date.now()}`,
      amount: amt,
      currencyCode: 'INR',
      merchant: merchant.trim(),
      category,
      type,
      accountReference: null,
      balance: null,
      balanceCurrencyCode: null,
      confidence: 1,
      rawSms: `Manual: ${merchant.trim()} ${amt}`,
      sender: 'MANUAL',
      smsDate: Date.now(),
      userVerified: true,
      userCategory: null,
    });

    const fresh = TransactionRepository.getAll(200);
    setTransactions(fresh);
    navigation.goBack();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <Header title="New Transaction" nav={navigation} t={t} />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <View style={s.tabWrap}>
          <TouchableOpacity style={[s.tab, type === 'DEBIT' && { backgroundColor: t.ink }]} onPress={() => setType('DEBIT')}>
            <Text style={[s.tabText, type === 'DEBIT' && { color: t.bg }]}>Expense</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.tab, type === 'CREDIT' && { backgroundColor: t.ink }]} onPress={() => setType('CREDIT')}>
            <Text style={[s.tabText, type === 'CREDIT' && { color: t.bg }]}>Income</Text>
          </TouchableOpacity>
        </View>

        <FormLabel label="Amount" t={t} />
        <TextInput
          style={[s.inputLg, { color: type === 'CREDIT' ? aink : t.ink, backgroundColor: t.surface, borderColor: t.rule }]}
          value={amount} onChangeText={setAmount}
          placeholder="0.00" placeholderTextColor={t.mute}
          keyboardType="decimal-pad"
        />

        <FormLabel label="Merchant / Sender" t={t} />
        <TextInput
          style={[s.input, { color: t.ink, backgroundColor: t.surface, borderColor: t.rule }]}
          value={merchant} onChangeText={setMerchant}
          placeholder="e.g. Starbucks" placeholderTextColor={t.mute}
        />

        <FormLabel label="Category" t={t} />
        <TouchableOpacity style={[s.selectBox, { backgroundColor: t.surface, borderColor: t.rule }]} onPress={() => setShowCatPicker(true)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <LiquidIcon name={CAT_ICON[category] ?? 'dots'} size={16} color={aink} />
            <Text style={{ fontFamily: font.uiBold, fontSize: 15, color: t.ink }}>{CATEGORY_LABELS[category]}</Text>
          </View>
          <LiquidIcon name="chevron" size={16} color={t.mute} style={{ transform: [{ rotate: '90deg' }] }} />
        </TouchableOpacity>

        <CategoryPicker visible={showCatPicker} selected={category} onSelect={setCategory} onClose={() => setShowCatPicker(false)} t={t} />

      </ScrollView>

      <View style={s.footer}>
        <PressableScale style={[s.btnSave, { backgroundColor: aink }]} onPress={save}>
          <Text style={[s.btnSaveText, { color: t.bg }]}>Save Transaction</Text>
        </PressableScale>
      </View>
    </SafeAreaView>
  );
};

// ==========================================
// Subscription Form
// ==========================================
export const AddSubscriptionScreen = ({ navigation }: any) => {
  const { themeMode, setTransactions } = useStore();
  const t = themes[themeMode];
  const aink = accentInk(themeMode);

  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [startDay, setStartDay] = useState(new Date().getDate().toString());
  const [startMonth, setStartMonth] = useState((new Date().getMonth() + 1).toString());
  const [startYear, setStartYear] = useState(new Date().getFullYear().toString());

  function save() {
    const amt = parseFloat(cost);
    if (!amt || amt <= 0) { Alert.alert('Invalid cost'); return; }
    if (!name.trim()) { Alert.alert('Enter a service name'); return; }

    const d = parseInt(startDay) || 1;
    const m = parseInt(startMonth) || 1;
    const y = parseInt(startYear) || new Date().getFullYear();
    const startDate = new Date(y, m - 1, d).getTime();

    TransactionRepository.insert({
      smsId: `sub-${Date.now()}`,
      amount: amt,
      currencyCode: 'INR',
      merchant: name.trim(),
      category: 'SUBSCRIPTION',
      type: 'DEBIT',
      accountReference: null,
      balance: null,
      balanceCurrencyCode: null,
      confidence: 1,
      rawSms: `Subscription: ${name.trim()} ${amt} ${cycle}`,
      sender: 'MANUAL',
      smsDate: startDate,
      userVerified: true,
      userCategory: null,
    });

    const fresh = TransactionRepository.getAll(200);
    setTransactions(fresh);
    navigation.goBack();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <Header title="Add Subscription" nav={navigation} t={t} />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <FormLabel label="Service Name" t={t} />
        <TextInput style={[s.input, { color: t.ink, backgroundColor: t.surface, borderColor: t.rule }]}
          value={name} onChangeText={setName}
          placeholder="e.g. Netflix" placeholderTextColor={t.mute} />

        <FormLabel label="Monthly Cost" t={t} />
        <TextInput style={[s.input, { color: t.ink, backgroundColor: t.surface, borderColor: t.rule }]}
          value={cost} onChangeText={setCost}
          placeholder="0.00" placeholderTextColor={t.mute} keyboardType="decimal-pad" />

        <FormLabel label="Billing Cycle" t={t} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity style={[s.pillBtn, cycle === 'monthly' ? { backgroundColor: t.ink } : { backgroundColor: t.chipBg }]} onPress={() => setCycle('monthly')}>
            <Text style={[s.pillBtnText, { color: cycle === 'monthly' ? t.bg : t.inkDim }]}>Monthly</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.pillBtn, cycle === 'yearly' ? { backgroundColor: t.ink } : { backgroundColor: t.chipBg }]} onPress={() => setCycle('yearly')}>
            <Text style={[s.pillBtnText, { color: cycle === 'yearly' ? t.bg : t.inkDim }]}>Yearly</Text>
          </TouchableOpacity>
        </View>

        <FormLabel label="Start Date" t={t} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TextInput style={[s.input, { flex: 1, color: t.ink, backgroundColor: t.surface, borderColor: t.rule, textAlign: 'center' }]}
            value={startDay} onChangeText={setStartDay}
            placeholder="DD" placeholderTextColor={t.mute} keyboardType="number-pad" maxLength={2} />
          <TextInput style={[s.input, { flex: 1, color: t.ink, backgroundColor: t.surface, borderColor: t.rule, textAlign: 'center' }]}
            value={startMonth} onChangeText={setStartMonth}
            placeholder="MM" placeholderTextColor={t.mute} keyboardType="number-pad" maxLength={2} />
          <TextInput style={[s.input, { flex: 2, color: t.ink, backgroundColor: t.surface, borderColor: t.rule, textAlign: 'center' }]}
            value={startYear} onChangeText={setStartYear}
            placeholder="YYYY" placeholderTextColor={t.mute} keyboardType="number-pad" maxLength={4} />
        </View>

      </ScrollView>

      <View style={s.footer}>
        <PressableScale style={[s.btnSave, { backgroundColor: aink }]} onPress={save}>
          <Text style={[s.btnSaveText, { color: t.bg }]}>Add Subscription</Text>
        </PressableScale>
      </View>
    </SafeAreaView>
  );
};




// ==========================================
// Floating Action Button Component
// ==========================================
export function FAB({ onPress }: { onPress: () => void }) {
  return (
    <PressableScale
      style={{
        position: 'absolute', bottom: 110, right: 24,
        width: 60, height: 60, borderRadius: 30, backgroundColor: accent.v,
        alignItems: 'center', justifyContent: 'center',
        elevation: 8, shadowColor: accent.v, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 10,
      }}
      onPress={onPress}
    >
      <LiquidIcon name="plus" size={28} color="#FFF" strokeWidth={2.5} />
    </PressableScale>
  );
}

// ==========================================
// Shared Helpers
// ==========================================
const Header = ({ title, nav, t }: any) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10 }}>
    <TouchableOpacity onPress={() => nav.goBack()} style={{ padding: 8, marginLeft: -8 }}>
      <LiquidIcon name="arrowRt" size={20} color={t.ink} style={{ transform: [{ rotate: '180deg' }] }} />
    </TouchableOpacity>
    <Text style={{ fontFamily: font.uiBold, fontSize: 18, color: t.ink, marginLeft: 8 }}>{title}</Text>
  </View>
);

const FormLabel = ({ label, t }: { label: string, t: any }) => (
  <Text style={{ fontFamily: font.monoBold, fontSize: 11, color: t.mute, letterSpacing: 1, marginTop: 24, marginBottom: 8 }}>{label.toUpperCase()}</Text>
);

const s = StyleSheet.create({
  scroll: { paddingHorizontal: 24, paddingBottom: 100 },
  tabWrap: { flexDirection: 'row', backgroundColor: alpha('#000', 0.05), borderRadius: 100, padding: 4, marginTop: 10 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 100 },
  tabText: { fontFamily: font.uiBold, fontSize: 13, color: '#666' },
  input: { fontFamily: font.ui, fontSize: 15, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16, borderWidth: 1 },
  inputLg: { fontFamily: font.display, fontSize: 32, paddingHorizontal: 16, paddingVertical: 16, borderRadius: 20, borderWidth: 1, letterSpacing: -1 },
  selectBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, borderRadius: 16, borderWidth: 1 },
  pillBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 100 },
  pillBtnText: { fontFamily: font.uiBold, fontSize: 13 },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: alpha('#000', 0.05) },
  btnSave: { paddingVertical: 16, borderRadius: 100, alignItems: 'center' },
  btnSaveText: { fontFamily: font.uiBold, fontSize: 16 },
});
