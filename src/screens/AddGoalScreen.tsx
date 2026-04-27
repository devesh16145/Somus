import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView, Modal, FlatList,
} from 'react-native';
import { LiquidDialog } from '../components/LiquidDialog';
import { SafeAreaView } from 'react-native-safe-area-context';
import { themes, font, accent, accentInk, alpha } from '../theme';
import { useStore } from '../store';
import LiquidIcon from '../components/LiquidIcons';
import { PressableScale } from '../components/VaultAnimations';
import { GoalRepository } from '../database/GoalRepository';
import {
  GoalTemplate, GoalPriority, GoalCurrency, LoanMeta, TravelMeta, EmergencyMeta, PurchaseMeta,
  GOAL_TEMPLATES, LOAN_TYPES, TRAVEL_DESTINATIONS, CURRENCY_OPTIONS, currencySymbolFor,
} from '../types/Goal';

type Step = 'template' | 'details' | 'priority';

export default function AddGoalScreen({ navigation, route }: any) {
  const { themeMode, setGoals, goals } = useStore();
  const t = themes[themeMode];
  const aink = accentInk(themeMode);

  const existingId: string | undefined = route?.params?.goalId;
  const existing = existingId ? goals.find((g) => g.id === existingId) ?? null : null;
  const isEdit = !!existing;

  // Parse existing metadata if present
  const existingMeta: any = (() => {
    const raw = existing?.metadata;
    if (!raw) return {};
    try { return JSON.parse(raw); } catch { return {}; }
  })();

  const [step, setStep] = useState<Step>(isEdit ? 'details' : 'template');
  const [template, setTemplate] = useState<GoalTemplate>(existing?.template ?? 'custom');

  // common
  const [name, setName] = useState(existing?.name ?? '');
  const [target, setTarget] = useState(existing ? String(existing.targetAmount) : '');
  const [currency, setCurrency] = useState<GoalCurrency>(existing?.currency ?? 'INR');
  const [showCurrPicker, setShowCurrPicker] = useState(false);

  // priority step
  const [priority, setPriority] = useState<GoalPriority>(existing?.priority ?? 'medium');
  const [isPrimary, setIsPrimary] = useState(existing?.isPrimary ?? false);

  // loan
  const [loanType, setLoanType] = useState<LoanMeta['loanType']>(existingMeta.loanType ?? 'home');
  const [interestRate, setInterestRate] = useState(existingMeta.interestRate != null ? String(existingMeta.interestRate) : '');
  const [emiAmount, setEmiAmount] = useState(existingMeta.emiAmount != null ? String(existingMeta.emiAmount) : '');
  const [tenureMonths, setTenureMonths] = useState(existingMeta.tenureMonths != null ? String(existingMeta.tenureMonths) : '');
  const [monthsPaid, setMonthsPaid] = useState(existingMeta.monthsPaid != null ? String(existingMeta.monthsPaid) : '');

  // travel
  const [destination, setDestination] = useState(existingMeta.destination ?? '');
  const [tripDate, setTripDate] = useState(existingMeta.tripDate ?? '');
  const [breakdown, setBreakdown] = useState(existingMeta.breakdown ?? '');

  // emergency
  const [monthlyExpenses, setMonthlyExpenses] = useState(existingMeta.monthlyExpenses != null ? String(existingMeta.monthlyExpenses) : '');
  const [bufferMonths, setBufferMonths] = useState(existingMeta.bufferMonths != null ? String(existingMeta.bufferMonths) : '6');

  // purchase
  const [itemName, setItemName] = useState(existingMeta.itemName ?? '');
  const [monthlySavings, setMonthlySavings] = useState(existingMeta.monthlySavingsPlan != null ? String(existingMeta.monthlySavingsPlan) : '');

  function save() {
    const amt = parseFloat(target);
    if (!name.trim()) { LiquidDialog.alert('Enter a goal name'); return; }
    if (!amt || amt <= 0) { LiquidDialog.alert('Enter a valid target amount'); return; }

    let metadata: string | null = null;
    let savedAmount = 0;
    let icon = GOAL_TEMPLATES.find(t => t.key === template)?.icon ?? 'disc';

    if (template === 'loan') {
      const meta: LoanMeta = {
        loanType,
        principal: amt,
        interestRate: parseFloat(interestRate) || 0,
        emiAmount: parseFloat(emiAmount) || 0,
        tenureMonths: parseInt(tenureMonths) || 0,
        monthsPaid: parseInt(monthsPaid) || 0,
      };
      savedAmount = meta.emiAmount * meta.monthsPaid;
      metadata = JSON.stringify(meta);
      icon = loanType === 'home' ? 'home' : loanType === 'car' ? 'car' : 'disc';
    } else if (template === 'travel') {
      const meta: TravelMeta = { destination, tripDate, breakdown };
      metadata = JSON.stringify(meta);
      icon = 'plane';
    } else if (template === 'emergency') {
      const me = parseFloat(monthlyExpenses) || 0;
      const bm = parseInt(bufferMonths) || 6;
      const meta: EmergencyMeta = { monthlyExpenses: me, bufferMonths: bm };
      metadata = JSON.stringify(meta);
      icon = 'shield';
    } else if (template === 'purchase') {
      const meta: PurchaseMeta = { itemName, monthlySavingsPlan: parseFloat(monthlySavings) || 0 };
      metadata = JSON.stringify(meta);
      icon = 'bag';
    }

    if (isEdit && existing) {
      GoalRepository.update(existing.id, {
        name: name.trim(), targetAmount: amt,
        // preserve existing savedAmount unless this is a loan (where it's derived)
        savedAmount: template === 'loan' ? savedAmount : existing.savedAmount,
        currency, priority, icon, metadata,
      });
      if (isPrimary && !existing.isPrimary) GoalRepository.setPrimary(existing.id);
    } else {
      GoalRepository.insert({
        name: name.trim(), template, targetAmount: amt, savedAmount,
        currency, priority, isPrimary, icon, metadata,
      });
      if (isPrimary) {
        const all = GoalRepository.getAll();
        const newest = all[0];
        if (newest) GoalRepository.setPrimary(newest.id);
      }
    }

    setGoals(GoalRepository.getAll());
    navigation.goBack();
  }

  function renderStepIndicator() {
    const steps: Step[] = ['template', 'details', 'priority'];
    const idx = steps.indexOf(step);
    return (
      <View style={{ flexDirection: 'row', paddingHorizontal: 24, paddingVertical: 16, gap: 8 }}>
        {steps.map((s, i) => (
          <View key={s} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: i <= idx ? accent.v : t.chipBg }} />
        ))}
      </View>
    );
  }

  // ───── STEP 1: Template Picker ──────────────
  function renderTemplatePicker() {
    return (
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}>
        <Text style={{ fontFamily: font.display, fontSize: 28, color: t.ink, letterSpacing: -1, marginBottom: 8 }}>
          Choose a template
        </Text>
        <Text style={{ fontFamily: font.ui, fontSize: 14, color: t.mute, marginBottom: 28, lineHeight: 22 }}>
          Templates pre-fill smart fields for common goal types.
        </Text>
        {GOAL_TEMPLATES.map((tpl) => {
          const selected = template === tpl.key;
          return (
            <TouchableOpacity
              key={tpl.key}
              onPress={() => setTemplate(tpl.key)}
              style={{
                flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 10,
                borderRadius: 20, borderWidth: 2,
                borderColor: selected ? accent.v : t.rule,
                backgroundColor: selected ? alpha(accent.v, 0.08) : t.surface,
              }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: selected ? alpha(accent.v, 0.2) : t.chipBg, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                <LiquidIcon name={tpl.icon as any} size={22} color={selected ? accent.v : t.inkDim} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: font.uiBold, fontSize: 16, color: t.ink, marginBottom: 2 }}>{tpl.label}</Text>
                <Text style={{ fontFamily: font.ui, fontSize: 12, color: t.mute }}>{tpl.desc}</Text>
              </View>
              {selected && <LiquidIcon name="check" size={18} color={accent.v} strokeWidth={2.5} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  }

  // ───── STEP 2: Details ──────────────────────
  function renderDetails() {
    return (
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontFamily: font.display, fontSize: 28, color: t.ink, letterSpacing: -1, marginBottom: 24 }}>
          {GOAL_TEMPLATES.find(tp => tp.key === template)?.label} Details
        </Text>

        {/* Goal Name */}
        <Label text="Goal Name" t={t} />
        <TextInput style={inputStyle(t)} value={name} onChangeText={setName}
          placeholder={template === 'loan' ? 'e.g. Home Loan' : template === 'travel' ? 'e.g. Japan Trip' : 'My Goal'}
          placeholderTextColor={t.mute} />

        {/* Currency */}
        <Label text="Currency" t={t} />
        <TouchableOpacity style={[selectStyle(t)]} onPress={() => setShowCurrPicker(true)}>
          <Text style={{ fontFamily: font.uiBold, fontSize: 15, color: t.ink }}>
            {currencySymbolFor(currency)}  {currency}
          </Text>
          <LiquidIcon name="chevron" size={14} color={t.mute} style={{ transform: [{ rotate: '90deg' }] }} />
        </TouchableOpacity>

        {/* Target Amount */}
        <Label text={template === 'loan' ? 'Total Loan Amount (Principal)' : 'Target Amount'} t={t} />
        <TextInput style={inputLgStyle(t)} value={target} onChangeText={setTarget}
          placeholder="0" placeholderTextColor={t.mute} keyboardType="decimal-pad" />

        {/* Template-specific fields */}
        {template === 'loan' && renderLoanFields()}
        {template === 'travel' && renderTravelFields()}
        {template === 'emergency' && renderEmergencyFields()}
        {template === 'purchase' && renderPurchaseFields()}

        {/* Currency Picker Modal */}
        <Modal visible={showCurrPicker} transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: t.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '60%' }}>
              <View style={{ padding: 20 }}>
                <Text style={{ fontFamily: font.uiBold, fontSize: 18, color: t.ink }}>Select Currency</Text>
              </View>
              <FlatList data={CURRENCY_OPTIONS} keyExtractor={i => i.code}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
                renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => { setCurrency(item.code); setShowCurrPicker(false); }}
                    style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, backgroundColor: currency === item.code ? alpha(accent.v, 0.1) : 'transparent' }}>
                    <Text style={{ fontFamily: font.monoBold, fontSize: 16, color: t.ink, width: 36 }}>{item.symbol}</Text>
                    <Text style={{ fontFamily: font.ui, fontSize: 15, color: t.ink, flex: 1 }}>{item.label}</Text>
                    <Text style={{ fontFamily: font.mono, fontSize: 12, color: t.mute }}>{item.code}</Text>
                  </TouchableOpacity>
                )} />
            </View>
          </View>
        </Modal>
      </ScrollView>
    );
  }

  function renderLoanFields() {
    return (
      <>
        <Label text="Loan Type" t={t} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {LOAN_TYPES.map(lt => (
            <TouchableOpacity key={lt.key} onPress={() => setLoanType(lt.key)}
              style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 100, backgroundColor: loanType === lt.key ? t.ink : t.chipBg }}>
              <Text style={{ fontFamily: font.uiBold, fontSize: 12, color: loanType === lt.key ? t.bg : t.inkDim }}>{lt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Label text="Interest Rate (%)" t={t} />
        <TextInput style={inputStyle(t)} value={interestRate} onChangeText={setInterestRate}
          placeholder="8.5" placeholderTextColor={t.mute} keyboardType="decimal-pad" />

        <Label text="EMI Amount (per month)" t={t} />
        <TextInput style={inputStyle(t)} value={emiAmount} onChangeText={setEmiAmount}
          placeholder="0" placeholderTextColor={t.mute} keyboardType="decimal-pad" />

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Label text="Tenure (months)" t={t} />
            <TextInput style={inputStyle(t)} value={tenureMonths} onChangeText={setTenureMonths}
              placeholder="240" placeholderTextColor={t.mute} keyboardType="number-pad" />
          </View>
          <View style={{ flex: 1 }}>
            <Label text="Months Paid" t={t} />
            <TextInput style={inputStyle(t)} value={monthsPaid} onChangeText={setMonthsPaid}
              placeholder="0" placeholderTextColor={t.mute} keyboardType="number-pad" />
          </View>
        </View>

        {/* Live calculation */}
        {parseFloat(emiAmount) > 0 && parseInt(monthsPaid) > 0 && (
          <View style={{ backgroundColor: alpha(accent.v, 0.08), borderRadius: 16, padding: 16, marginTop: 16 }}>
            <Text style={{ fontFamily: font.monoBold, fontSize: 10, color: accent.v, letterSpacing: 1, marginBottom: 8 }}>AUTO CALCULATION</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontFamily: font.ui, fontSize: 13, color: t.inkDim }}>Total Paid</Text>
              <Text style={{ fontFamily: font.monoBold, fontSize: 13, color: t.ink }}>{currencySymbolFor(currency)} {(parseFloat(emiAmount) * parseInt(monthsPaid)).toLocaleString()}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontFamily: font.ui, fontSize: 13, color: t.inkDim }}>Remaining</Text>
              <Text style={{ fontFamily: font.monoBold, fontSize: 13, color: t.ink }}>{currencySymbolFor(currency)} {Math.max(0, (parseFloat(target) || 0) - (parseFloat(emiAmount) * parseInt(monthsPaid))).toLocaleString()}</Text>
            </View>
            {parseInt(tenureMonths) > 0 && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: font.ui, fontSize: 13, color: t.inkDim }}>Months Left</Text>
                <Text style={{ fontFamily: font.monoBold, fontSize: 13, color: t.ink }}>{Math.max(0, parseInt(tenureMonths) - parseInt(monthsPaid))}</Text>
              </View>
            )}
          </View>
        )}
      </>
    );
  }

  function renderTravelFields() {
    return (
      <>
        <Label text="Destination" t={t} />
        <TextInput style={inputStyle(t)} value={destination} onChangeText={setDestination}
          placeholder="e.g. Japan" placeholderTextColor={t.mute} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8, marginBottom: 8 }}>
          {TRAVEL_DESTINATIONS.map(d => (
            <TouchableOpacity key={d} onPress={() => { setDestination(d); if (!name) setName(`${d} Trip`); }}
              style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100, marginRight: 8, backgroundColor: destination === d ? t.ink : t.chipBg }}>
              <Text style={{ fontFamily: font.ui, fontSize: 12, color: destination === d ? t.bg : t.inkDim }}>{d}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Label text="Trip Date (approx)" t={t} />
        <TextInput style={inputStyle(t)} value={tripDate} onChangeText={setTripDate}
          placeholder="e.g. Dec 2025" placeholderTextColor={t.mute} />

        <Label text="Budget Notes (optional)" t={t} />
        <TextInput style={[inputStyle(t), { minHeight: 80, textAlignVertical: 'top' }]} value={breakdown} onChangeText={setBreakdown}
          placeholder="Flights, hotels, food, activities..." placeholderTextColor={t.mute} multiline />
      </>
    );
  }

  function renderEmergencyFields() {
    return (
      <>
        <Label text="Monthly Expenses" t={t} />
        <TextInput style={inputStyle(t)} value={monthlyExpenses} onChangeText={(v) => {
          setMonthlyExpenses(v);
          const me = parseFloat(v) || 0;
          const bm = parseInt(bufferMonths) || 6;
          setTarget((me * bm).toString());
        }} placeholder="0" placeholderTextColor={t.mute} keyboardType="decimal-pad" />

        <Label text="Buffer Months" t={t} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {['3', '6', '9', '12'].map(m => (
            <TouchableOpacity key={m} onPress={() => {
              setBufferMonths(m);
              const me = parseFloat(monthlyExpenses) || 0;
              setTarget((me * parseInt(m)).toString());
            }} style={{ flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: bufferMonths === m ? t.ink : t.chipBg }}>
              <Text style={{ fontFamily: font.uiBold, fontSize: 14, color: bufferMonths === m ? t.bg : t.inkDim }}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {parseFloat(monthlyExpenses) > 0 && (
          <View style={{ backgroundColor: alpha(accent.v, 0.08), borderRadius: 16, padding: 16, marginTop: 16 }}>
            <Text style={{ fontFamily: font.monoBold, fontSize: 10, color: accent.v, letterSpacing: 1, marginBottom: 4 }}>TARGET</Text>
            <Text style={{ fontFamily: font.display, fontSize: 28, color: t.ink, letterSpacing: -1 }}>
              {currencySymbolFor(currency)} {(parseFloat(target) || 0).toLocaleString()}
            </Text>
            <Text style={{ fontFamily: font.ui, fontSize: 12, color: t.mute, marginTop: 4 }}>
              = {monthlyExpenses} × {bufferMonths} months
            </Text>
          </View>
        )}
      </>
    );
  }

  function renderPurchaseFields() {
    return (
      <>
        <Label text="Item Name" t={t} />
        <TextInput style={inputStyle(t)} value={itemName} onChangeText={setItemName}
          placeholder="e.g. MacBook Pro" placeholderTextColor={t.mute} />

        <Label text="Monthly Savings Plan" t={t} />
        <TextInput style={inputStyle(t)} value={monthlySavings} onChangeText={setMonthlySavings}
          placeholder="0" placeholderTextColor={t.mute} keyboardType="decimal-pad" />

        {parseFloat(monthlySavings) > 0 && parseFloat(target) > 0 && (
          <View style={{ backgroundColor: alpha(accent.v, 0.08), borderRadius: 16, padding: 16, marginTop: 16 }}>
            <Text style={{ fontFamily: font.monoBold, fontSize: 10, color: accent.v, letterSpacing: 1, marginBottom: 4 }}>ESTIMATED TIMELINE</Text>
            <Text style={{ fontFamily: font.display, fontSize: 28, color: t.ink, letterSpacing: -1 }}>
              {Math.ceil((parseFloat(target) || 0) / (parseFloat(monthlySavings) || 1))} months
            </Text>
          </View>
        )}
      </>
    );
  }

  // ───── STEP 3: Priority ─────────────────────
  function renderPriority() {
    const priorities: { key: GoalPriority; label: string; color: string }[] = [
      { key: 'high', label: 'High', color: '#ef4444' },
      { key: 'medium', label: 'Medium', color: accent.v },
      { key: 'low', label: 'Low', color: '#94a3b8' },
    ];
    return (
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}>
        <Text style={{ fontFamily: font.display, fontSize: 28, color: t.ink, letterSpacing: -1, marginBottom: 8 }}>
          Set Priority
        </Text>
        <Text style={{ fontFamily: font.ui, fontSize: 14, color: t.mute, marginBottom: 28, lineHeight: 22 }}>
          Higher priority goals appear at the top.
        </Text>

        {priorities.map(p => (
          <TouchableOpacity key={p.key} onPress={() => setPriority(p.key)}
            style={{
              flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 10,
              borderRadius: 20, borderWidth: 2,
              borderColor: priority === p.key ? p.color : t.rule,
              backgroundColor: priority === p.key ? alpha(p.color, 0.08) : t.surface,
            }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: p.color, marginRight: 14 }} />
            <Text style={{ fontFamily: font.uiBold, fontSize: 16, color: t.ink, flex: 1 }}>{p.label} Priority</Text>
            {priority === p.key && <LiquidIcon name="check" size={18} color={p.color} strokeWidth={2.5} />}
          </TouchableOpacity>
        ))}

        <TouchableOpacity onPress={() => setIsPrimary(!isPrimary)}
          style={{
            flexDirection: 'row', alignItems: 'center', padding: 18, marginTop: 20,
            borderRadius: 20, borderWidth: 2,
            borderColor: isPrimary ? accent.v : t.rule,
            backgroundColor: isPrimary ? alpha(accent.v, 0.1) : t.surface,
          }}>
          <LiquidIcon name="star" size={20} color={isPrimary ? accent.v : t.mute} />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={{ fontFamily: font.uiBold, fontSize: 16, color: t.ink }}>Set as Primary Goal</Text>
            <Text style={{ fontFamily: font.ui, fontSize: 12, color: t.mute, marginTop: 2 }}>Highlighted on your Goals dashboard</Text>
          </View>
          <View style={{ width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: isPrimary ? accent.v : t.rule, alignItems: 'center', justifyContent: 'center', backgroundColor: isPrimary ? accent.v : 'transparent' }}>
            {isPrimary && <LiquidIcon name="check" size={14} color="#fff" strokeWidth={3} />}
          </View>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ───── MAIN RENDER ──────────────────────────
  const isLast = step === 'priority';
  const isFirst = step === 'template';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 4 }}>
        <TouchableOpacity onPress={() => {
          if (step === 'details') {
            if (isEdit) navigation.goBack();
            else setStep('template');
          } else if (step === 'priority') setStep('details');
          else navigation.goBack();
        }} style={{ padding: 8, marginLeft: -8 }}>
          <LiquidIcon name="arrowRt" size={20} color={t.ink} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <Text style={{ fontFamily: font.uiBold, fontSize: 18, color: t.ink, marginLeft: 8 }}>{isEdit ? 'Edit Goal' : 'New Goal'}</Text>
      </View>

      {renderStepIndicator()}

      {step === 'template' && renderTemplatePicker()}
      {step === 'details' && renderDetails()}
      {step === 'priority' && renderPriority()}

      {/* Bottom Bar */}
      <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: alpha('#000', 0.05) }}>
        <PressableScale style={{ backgroundColor: accent.v, paddingVertical: 16, borderRadius: 100, alignItems: 'center' }}
          onPress={() => {
            if (step === 'template') setStep('details');
            else if (step === 'details') setStep('priority');
            else save();
          }}>
          <Text style={{ fontFamily: font.uiBold, fontSize: 16, color: '#051911' }}>
            {isLast ? (isEdit ? 'Save Changes' : 'Create Goal') : 'Continue'}
          </Text>
        </PressableScale>
      </View>
    </SafeAreaView>
  );
}

// Shared helpers
const Label = ({ text, t }: { text: string; t: any }) => (
  <Text style={{ fontFamily: font.monoBold, fontSize: 11, color: t.mute, letterSpacing: 1, marginTop: 24, marginBottom: 8 }}>{text.toUpperCase()}</Text>
);

const inputStyle = (t: any) => ({
  fontFamily: font.ui, fontSize: 15, paddingHorizontal: 16, paddingVertical: 14,
  borderRadius: 16, borderWidth: 1, borderColor: t.rule, backgroundColor: t.surface, color: t.ink,
});

const inputLgStyle = (t: any) => ({
  fontFamily: font.display, fontSize: 32, paddingHorizontal: 16, paddingVertical: 16,
  borderRadius: 20, borderWidth: 1, borderColor: t.rule, backgroundColor: t.surface, color: t.ink, letterSpacing: -1,
});

const selectStyle = (t: any) => ({
  flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const,
  paddingHorizontal: 16, paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderColor: t.rule, backgroundColor: t.surface,
});
