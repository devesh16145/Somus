import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { themes, font, accent, accentInk, alpha } from '../theme';
import { useStore } from '../store';
import LiquidIcon from '../components/LiquidIcons';

// ==========================================
// Transaction Form
// ==========================================

export const AddTransactionScreen = ({ navigation }: any) => {
  const { themeMode } = useStore();
  const t = themes[themeMode];
  const aink = accentInk(themeMode);

  const [type, setType] = useState('DEBIT');
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');

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
          placeholder="$0.00" placeholderTextColor={t.mute} 
          keyboardType="decimal-pad"
        />

        <FormLabel label="Merchant / Sender" t={t} />
        <TextInput 
          style={[s.input, { color: t.ink, backgroundColor: t.surface, borderColor: t.rule }]} 
          value={merchant} onChangeText={setMerchant}
          placeholder="e.g. Starbucks" placeholderTextColor={t.mute} 
        />

        <FormLabel label="Category" t={t} />
        <TouchableOpacity style={[s.selectBox, { backgroundColor: t.surface, borderColor: t.rule }]}>
           <Text style={s.selectText}>Select Category...</Text>
           <LiquidIcon name="chevron" size={16} color={t.mute} style={{ transform: [{ rotate: '90deg' }] }} />
        </TouchableOpacity>

      </ScrollView>

      <View style={s.footer}>
         <TouchableOpacity style={[s.btnSave, { backgroundColor: aink }]} onPress={() => navigation.goBack()}>
            <Text style={[s.btnSaveText, { color: t.bg }]}>Save Transaction</Text>
         </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ==========================================
// Subscription Form
// ==========================================

export const AddSubscriptionScreen = ({ navigation }: any) => {
  const { themeMode } = useStore();
  const t = themes[themeMode];
  const aink = accentInk(themeMode);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <Header title="Add Subscription" nav={navigation} t={t} />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        
        <FormLabel label="Service Name" t={t} />
        <TextInput style={[s.input, { color: t.ink, backgroundColor: t.surface, borderColor: t.rule }]} placeholder="e.g. Netflix" placeholderTextColor={t.mute} />

        <FormLabel label="Monthly Cost" t={t} />
        <TextInput style={[s.input, { color: t.ink, backgroundColor: t.surface, borderColor: t.rule }]} placeholder="$0.00" placeholderTextColor={t.mute} keyboardType="decimal-pad" />

        <FormLabel label="Billing Cycle" t={t} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
           <TouchableOpacity style={[s.pillActive, { backgroundColor: t.ink }]}><Text style={[s.pillActiveText, { color: t.bg }]}>Monthly</Text></TouchableOpacity>
           <TouchableOpacity style={[s.pill, { backgroundColor: t.chipBg }]}><Text style={[s.pillText, { color: t.inkDim }]}>Yearly</Text></TouchableOpacity>
        </View>

      </ScrollView>

      <View style={s.footer}>
         <TouchableOpacity style={[s.btnSave, { backgroundColor: aink }]} onPress={() => navigation.goBack()}>
            <Text style={[s.btnSaveText, { color: t.bg }]}>Add Subscription</Text>
         </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ==========================================
// Goal Form
// ==========================================

export const AddGoalScreen = ({ navigation }: any) => {
  const { themeMode } = useStore();
  const t = themes[themeMode];
  const aink = accentInk(themeMode);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <Header title="New Goal" nav={navigation} t={t} />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        
        <FormLabel label="Goal Name" t={t} />
        <TextInput style={[s.input, { color: t.ink, backgroundColor: t.surface, borderColor: t.rule }]} placeholder="e.g. New Car" placeholderTextColor={t.mute} />

        <FormLabel label="Target Amount" t={t} />
        <TextInput style={[s.inputLg, { color: t.ink, backgroundColor: t.surface, borderColor: t.rule }]} placeholder="$0.00" placeholderTextColor={t.mute} keyboardType="decimal-pad" />

        <FormLabel label="Initial Savings (Optional)" t={t} />
        <TextInput style={[s.input, { color: t.ink, backgroundColor: t.surface, borderColor: t.rule }]} placeholder="$0.00" placeholderTextColor={t.mute} keyboardType="decimal-pad" />

      </ScrollView>

      <View style={s.footer}>
         <TouchableOpacity style={[s.btnSave, { backgroundColor: aink }]} onPress={() => navigation.goBack()}>
            <Text style={[s.btnSaveText, { color: t.bg }]}>Create Goal</Text>
         </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};


// ==========================================
// Floating Action Button Component
// ==========================================

export function FAB({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity 
      activeOpacity={0.8}
      style={{
        position: 'absolute', bottom: 110, right: 24,
        width: 60, height: 60, borderRadius: 30, backgroundColor: accent.v,
        alignItems: 'center', justifyContent: 'center',
        elevation: 8, shadowColor: accent.v, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 10,
      }} 
      onPress={onPress}
    >
      <LiquidIcon name="plus" size={28} color="#FFF" strokeWidth={2.5} />
    </TouchableOpacity>
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
  selectText: { fontFamily: font.ui, fontSize: 15, color: '#666' },

  pillActive: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 100 },
  pillActiveText: { fontFamily: font.uiBold, fontSize: 13 },
  pill: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 100 },
  pillText: { fontFamily: font.uiBold, fontSize: 13 },

  footer: { padding: 20, borderTopWidth: 1, borderTopColor: alpha('#000', 0.05) },
  btnSave: { paddingVertical: 16, borderRadius: 100, alignItems: 'center' },
  btnSaveText: { fontFamily: font.uiBold, fontSize: 16 },
});
