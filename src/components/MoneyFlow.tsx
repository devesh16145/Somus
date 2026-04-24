import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { themes, accent, font, alpha, ThemeMode } from '../theme';

const GREEN = '#6FB58A';
const RED = '#E06B4A';

type BarSpec = {
  label: 'INCOME' | 'BUDGET' | 'SPENT';
  amount: number;
  pct: number;
  color: string;
  delay: number;
  note?: string;
};

interface Props {
  income: number;
  budget: number | null;
  expense: number;
  currency: string;
  themeMode: ThemeMode;
}

export function MoneyFlow({ income, budget, expense, currency, themeMode }: Props) {
  const t = themes[themeMode];
  if (income === 0 && expense === 0 && budget == null) return null;

  const max = Math.max(income, budget ?? 0, expense, 1);
  const overBudget = budget != null && expense > budget;

  const bars: BarSpec[] = [];
  if (income > 0) {
    bars.push({ label: 'INCOME', amount: income, pct: (income / max) * 100, color: GREEN, delay: 0 });
  }
  if (budget != null) {
    bars.push({
      label: 'BUDGET',
      amount: budget,
      pct: (budget / max) * 100,
      color: alpha(accent.v, 0.55),
      delay: 120,
    });
  }
  bars.push({
    label: 'SPENT',
    amount: expense,
    pct: (expense / max) * 100,
    color: overBudget ? RED : accent.v,
    delay: 240,
    note: budget != null
      ? overBudget
        ? `over by ${formatAmount(expense - budget, currency)}`
        : `${Math.round((expense / Math.max(1, budget)) * 100)}% of budget`
      : income > 0
        ? `${Math.round((expense / Math.max(1, income)) * 100)}% of income`
        : undefined,
  });

  return (
    <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.rule }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: t.ink }]}>This month</Text>
        <Text style={[styles.headerSub, { color: t.mute }]}>salary · budget · spend</Text>
      </View>
      {bars.map((b) => (
        <Bar key={b.label} {...b} currency={currency} t={t} />
      ))}
    </View>
  );
}

function Bar({ label, amount, pct, color, delay, note, currency, t }: BarSpec & { currency: string; t: any }) {
  const [w, setW] = useState(0);

  useEffect(() => {
    let raf: number;
    let startTs: number | null = null;
    const duration = 700;

    const tick = (now: number) => {
      if (startTs == null) startTs = now + delay;
      const elapsed = now - startTs;
      if (elapsed < 0) { raf = requestAnimationFrame(tick); return; }
      const e = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - e, 3);
      setW(eased * pct);
      if (e < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pct, delay]);

  return (
    <View style={{ marginTop: 12 }}>
      <View style={styles.row}>
        <Text style={[styles.label, { color: t.mute }]}>{label}</Text>
        <View style={styles.amountRow}>
          {note && <Text style={[styles.note, { color: t.mute }]}>{note}</Text>}
          <Text style={[styles.amount, { color: t.ink }]}>{formatAmount(amount, currency)}</Text>
        </View>
      </View>
      <View style={[styles.track, { backgroundColor: t.chipBg }]}>
        <View style={{
          width: `${Math.min(100, w)}%`,
          height: '100%',
          borderRadius: 5,
          backgroundColor: color,
        }} />
      </View>
    </View>
  );
}

function formatAmount(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  } catch { return `${currency} ${Math.round(amount)}`; }
}

const styles = StyleSheet.create({
  card: {
    marginTop: 4,
    marginHorizontal: 16,
    marginBottom: 6,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 18,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 2,
  },
  headerTitle: { fontFamily: font.uiBold, fontSize: 13 },
  headerSub: { fontFamily: font.mono, fontSize: 10 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  label: { fontFamily: font.monoBold, fontSize: 10, letterSpacing: 1.5 },
  amountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  note: { fontFamily: font.mono, fontSize: 10 },
  amount: { fontFamily: font.monoBold, fontSize: 14 },
  track: { height: 10, borderRadius: 5, overflow: 'hidden' },
});
