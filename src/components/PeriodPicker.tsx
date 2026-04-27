import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal, Pressable, StyleSheet,
} from 'react-native';
import { useStore } from '../store';
import { themes, accent, font, alpha } from '../theme';
import LiquidIcon from './LiquidIcons';

export type PeriodKind = 'week' | 'month' | 'quarter' | 'year' | 'fy';

export type PeriodSelection =
  | { kind: 'week'; year: number; week: number }
  | { kind: 'month'; year: number; month: number }
  | { kind: 'quarter'; year: number; quarter: number }
  | { kind: 'year'; year: number }
  | { kind: 'fy'; startYear: number };

const KIND_LABELS: Record<PeriodKind, string> = {
  week: 'Week', month: 'Month', quarter: 'Quarter', year: 'Year', fy: 'FY',
};

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTH_FULL  = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// Week 1 starts on the Monday on or before Jan 1 of given year
function weekStart(year: number, week: number): Date {
  const jan1 = new Date(year, 0, 1);
  const day = jan1.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  const w1 = new Date(year, 0, 1 + offset);
  return new Date(w1.getTime() + (week - 1) * 7 * 86400000);
}

function weekCount(year: number): number {
  const start = weekStart(year, 1);
  const end = new Date(year + 1, 0, 1);
  return Math.ceil((end.getTime() - start.getTime()) / (7 * 86400000));
}

function currentWeekNumber(now: Date): number {
  const y = now.getFullYear();
  const start = weekStart(y, 1).getTime();
  return Math.floor((now.getTime() - start) / (7 * 86400000)) + 1;
}

export function defaultSelection(kind: PeriodKind, now: Date = new Date()): PeriodSelection {
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (kind) {
    case 'week':    return { kind: 'week', year: y, week: currentWeekNumber(now) };
    case 'month':   return { kind: 'month', year: y, month: m };
    case 'quarter': return { kind: 'quarter', year: y, quarter: Math.floor(m / 3) + 1 };
    case 'year':    return { kind: 'year', year: y };
    case 'fy':      return { kind: 'fy', startYear: m >= 3 ? y : y - 1 };
  }
}

export function getPeriodRange(sel: PeriodSelection): {
  startMs: number; endMs: number; label: string; daysTotal: number; daysElapsed: number;
} {
  const now = Date.now();
  let start: Date, end: Date, label: string;
  switch (sel.kind) {
    case 'week': {
      start = weekStart(sel.year, sel.week);
      end = new Date(start.getTime() + 7 * 86400000);
      const last = new Date(end.getTime() - 86400000);
      const sameMonth = start.getMonth() === last.getMonth();
      label = sameMonth
        ? `W${sel.week} \u00B7 ${MONTH_NAMES[start.getMonth()]} ${start.getDate()}\u2013${last.getDate()}`
        : `W${sel.week} \u00B7 ${MONTH_NAMES[start.getMonth()]} ${start.getDate()}\u2013${MONTH_NAMES[last.getMonth()]} ${last.getDate()}`;
      break;
    }
    case 'month':
      start = new Date(sel.year, sel.month, 1);
      end = new Date(sel.year, sel.month + 1, 1);
      label = `${MONTH_FULL[sel.month]} ${sel.year}`;
      break;
    case 'quarter': {
      const qStart = (sel.quarter - 1) * 3;
      start = new Date(sel.year, qStart, 1);
      end = new Date(sel.year, qStart + 3, 1);
      label = `Q${sel.quarter} ${sel.year}`;
      break;
    }
    case 'year':
      start = new Date(sel.year, 0, 1);
      end = new Date(sel.year + 1, 0, 1);
      label = `${sel.year}`;
      break;
    case 'fy':
      start = new Date(sel.startYear, 3, 1);
      end = new Date(sel.startYear + 1, 3, 1);
      label = `FY${String(sel.startYear).slice(-2)}\u2013${String(sel.startYear + 1).slice(-2)}`;
      break;
  }
  const startMs = start.getTime();
  const endMs = end.getTime();
  const daysTotal = Math.max(1, Math.round((endMs - startMs) / 86400000));
  const elapsedRaw = Math.round((Math.min(now, endMs) - startMs) / 86400000);
  const daysElapsed = Math.max(1, Math.min(daysTotal, elapsedRaw));
  return { startMs, endMs, label, daysTotal, daysElapsed };
}

export default function PeriodPicker({
  value, onChange,
}: {
  value: PeriodSelection;
  onChange: (s: PeriodSelection) => void;
}) {
  const { themeMode } = useStore();
  const t = themes[themeMode];
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<PeriodKind>(value.kind);
  const initialYear =
    value.kind === 'fy' ? value.startYear :
    value.kind === 'year' ? value.year :
    (value as any).year ?? new Date().getFullYear();
  const [yearAnchor, setYearAnchor] = useState<number>(initialYear);

  const range = getPeriodRange(value);
  const now = new Date();
  const thisYear = now.getFullYear();

  function openSheet() {
    setTab(value.kind);
    setYearAnchor(initialYear);
    setOpen(true);
  }

  function pick(s: PeriodSelection) {
    onChange(s);
    setOpen(false);
  }

  return (
    <>
      <TouchableOpacity
        onPress={openSheet}
        activeOpacity={0.7}
        style={{
          alignSelf: 'flex-start',
          flexDirection: 'row', alignItems: 'center', gap: 8,
          paddingVertical: 6, paddingHorizontal: 12,
          borderRadius: 100,
          backgroundColor: t.surface, borderWidth: 1, borderColor: t.rule,
        }}>
        <Text style={{ fontFamily: font.uiBold, fontSize: 11, color: t.ink, letterSpacing: 0.3 }}>
          {range.label}
        </Text>
        <LiquidIcon name="chevron" size={11} color={t.inkDim} style={{ transform: [{ rotate: '90deg' }] }} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable onPress={() => setOpen(false)} style={styles.overlay} />
        <View style={[styles.sheet, { backgroundColor: t.bg, borderColor: t.rule }]}>
          <View style={[styles.handle, { backgroundColor: t.rule }]} />
          <Text style={[styles.title, { color: t.ink }]}>Select Period</Text>

          {/* Type tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsRow}>
            {(Object.keys(KIND_LABELS) as PeriodKind[]).map((k) => {
              const on = tab === k;
              return (
                <TouchableOpacity
                  key={k}
                  onPress={() => setTab(k)}
                  activeOpacity={0.7}
                  style={{
                    paddingVertical: 7, paddingHorizontal: 14, borderRadius: 100,
                    backgroundColor: on ? accent.v : t.surface,
                    borderWidth: 1, borderColor: on ? accent.v : t.rule,
                  }}>
                  <Text style={{
                    fontFamily: font.uiBold, fontSize: 11,
                    color: on ? '#0D0D0D' : t.inkDim,
                    letterSpacing: 0.3,
                  }}>{KIND_LABELS[k]}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Year navigator (used by week/month/quarter tabs) */}
          {(tab === 'week' || tab === 'month' || tab === 'quarter') && (
            <View style={styles.yearNav}>
              <TouchableOpacity
                onPress={() => setYearAnchor((y) => y - 1)}
                style={[styles.navBtn, { backgroundColor: t.surface, borderColor: t.rule }]}>
                <LiquidIcon name="chevron" size={16} color={t.inkDim} style={{ transform: [{ rotate: '180deg' }] }} />
              </TouchableOpacity>
              <Text style={[styles.yearText, { color: t.ink }]}>{yearAnchor}</Text>
              <TouchableOpacity
                disabled={yearAnchor >= thisYear}
                onPress={() => setYearAnchor((y) => Math.min(thisYear, y + 1))}
                style={[styles.navBtn, {
                  backgroundColor: t.surface, borderColor: t.rule,
                  opacity: yearAnchor >= thisYear ? 0.4 : 1,
                }]}>
                <LiquidIcon name="chevron" size={16} color={t.inkDim} />
              </TouchableOpacity>
            </View>
          )}

          {/* Options */}
          <ScrollView
            style={{ maxHeight: 360 }}
            contentContainerStyle={styles.gridWrap}
            showsVerticalScrollIndicator={false}>
            {tab === 'week'    && <WeekGrid    year={yearAnchor} value={value} onPick={pick} t={t} now={now} />}
            {tab === 'month'   && <MonthGrid   year={yearAnchor} value={value} onPick={pick} t={t} now={now} />}
            {tab === 'quarter' && <QuarterGrid year={yearAnchor} value={value} onPick={pick} t={t} now={now} />}
            {tab === 'year'    && <YearList    value={value} onPick={pick} t={t} now={now} />}
            {tab === 'fy'      && <FYList      value={value} onPick={pick} t={t} now={now} />}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

// ── Grids ────────────────────────────────────────────────────

function Cell({
  label, sub, on, disabled, onPress, t,
}: { label: string; sub?: string; on: boolean; disabled?: boolean; onPress: () => void; t: any }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[styles.cell, {
        backgroundColor: on ? accent.v : t.surface,
        borderColor: on ? accent.v : t.rule,
        opacity: disabled ? 0.35 : 1,
      }]}>
      <Text style={{
        fontFamily: font.uiBold, fontSize: 13,
        color: on ? '#0D0D0D' : t.ink,
      }}>{label}</Text>
      {sub && (
        <Text style={{
          fontFamily: font.mono, fontSize: 10, marginTop: 2,
          color: on ? alpha('#0D0D0D', 0.6) : t.mute,
        }}>{sub}</Text>
      )}
    </TouchableOpacity>
  );
}

function WeekGrid({ year, value, onPick, t, now }: any) {
  const total = weekCount(year);
  const items = useMemo(() => Array.from({ length: total }, (_, i) => i + 1), [total]);
  return (
    <View style={styles.grid}>
      {items.map((w) => {
        const start = weekStart(year, w);
        const last = new Date(start.getTime() + 6 * 86400000);
        const inFuture = start.getTime() > now.getTime();
        const on = value.kind === 'week' && value.year === year && value.week === w;
        const sameMonth = start.getMonth() === last.getMonth();
        const sub = sameMonth
          ? `${MONTH_NAMES[start.getMonth()]} ${start.getDate()}\u2013${last.getDate()}`
          : `${MONTH_NAMES[start.getMonth()]} ${start.getDate()}\u2013${MONTH_NAMES[last.getMonth()]} ${last.getDate()}`;
        return (
          <Cell
            key={w}
            label={`W${w}`}
            sub={sub}
            on={on}
            disabled={inFuture}
            onPress={() => onPick({ kind: 'week', year, week: w })}
            t={t}
          />
        );
      })}
    </View>
  );
}

function MonthGrid({ year, value, onPick, t, now }: any) {
  return (
    <View style={styles.grid}>
      {MONTH_NAMES.map((name, i) => {
        const inFuture = year > now.getFullYear() || (year === now.getFullYear() && i > now.getMonth());
        const on = value.kind === 'month' && value.year === year && value.month === i;
        return (
          <Cell
            key={name}
            label={name}
            on={on}
            disabled={inFuture}
            onPress={() => onPick({ kind: 'month', year, month: i })}
            t={t}
          />
        );
      })}
    </View>
  );
}

function QuarterGrid({ year, value, onPick, t, now }: any) {
  const currentQ = Math.floor(now.getMonth() / 3) + 1;
  return (
    <View style={styles.grid}>
      {[1, 2, 3, 4].map((q) => {
        const inFuture = year > now.getFullYear() || (year === now.getFullYear() && q > currentQ);
        const on = value.kind === 'quarter' && value.year === year && value.quarter === q;
        const startMonth = (q - 1) * 3;
        const sub = `${MONTH_NAMES[startMonth]}\u2013${MONTH_NAMES[startMonth + 2]}`;
        return (
          <Cell
            key={q}
            label={`Q${q}`}
            sub={sub}
            on={on}
            disabled={inFuture}
            onPress={() => onPick({ kind: 'quarter', year, quarter: q })}
            t={t}
          />
        );
      })}
    </View>
  );
}

function YearList({ value, onPick, t, now }: any) {
  const thisYear = now.getFullYear();
  const items = Array.from({ length: 8 }, (_, i) => thisYear - i);
  return (
    <View style={styles.grid}>
      {items.map((y) => (
        <Cell
          key={y}
          label={`${y}`}
          on={value.kind === 'year' && value.year === y}
          onPress={() => onPick({ kind: 'year', year: y })}
          t={t}
        />
      ))}
    </View>
  );
}

function FYList({ value, onPick, t, now }: any) {
  const m = now.getMonth();
  const y = now.getFullYear();
  const currentFY = m >= 3 ? y : y - 1;
  const items = Array.from({ length: 8 }, (_, i) => currentFY - i);
  return (
    <View style={styles.grid}>
      {items.map((sy) => (
        <Cell
          key={sy}
          label={`FY${String(sy).slice(-2)}\u2013${String(sy + 1).slice(-2)}`}
          sub={`Apr ${sy} \u2013 Mar ${sy + 1}`}
          on={value.kind === 'fy' && value.startYear === sy}
          onPress={() => onPick({ kind: 'fy', startYear: sy })}
          t={t}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingTop: 10, paddingBottom: 28,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginBottom: 12 },
  title: { fontFamily: font.uiBold, fontSize: 15, marginHorizontal: 20, marginBottom: 12 },
  tabsRow: { paddingHorizontal: 20, gap: 6, paddingBottom: 14 },
  yearNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 16, paddingVertical: 6, marginBottom: 4,
  },
  navBtn: {
    width: 36, height: 36, borderRadius: 18, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  yearText: { fontFamily: font.monoBold, fontSize: 16, minWidth: 64, textAlign: 'center' },
  gridWrap: { paddingHorizontal: 16, paddingBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 4 },
  cell: {
    minWidth: 70,
    paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 14, borderWidth: 1,
    alignItems: 'flex-start',
  },
});
