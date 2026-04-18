import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Text as SvgText, Line, Defs, LinearGradient, Stop } from 'react-native-svg';

import { colors, font, alpha } from '../theme';

const CHART_H = 160;
const BAR_W = 26;
const BAR_GAP = 5;
const GROUP_GAP = 14;
const LABEL_H = 24;
const ANIM_DURATION = 800;
const STAGGER_DELAY = 80;

interface MonthData {
  month: string;
  spend: number;
  income: number;
}

interface InsightsChartProps {
  data: MonthData[];
  currency: string;
}

interface BarState {
  spend: number;
  income: number;
}

export default function InsightsChart({ data, currency }: InsightsChartProps) {
  const screenW = Dimensions.get('window').width;
  const chartW = Math.max(screenW - 48, 300);

  const maxVal = Math.max(
    ...data.map(d => Math.max(d.spend, d.income)),
    1,
  );

  const groupW = BAR_W * 2 + BAR_GAP;
  const totalBarsW = data.length * groupW + (data.length - 1) * GROUP_GAP;
  const offsetX = (chartW - totalBarsW) / 2;

  // Animation state: each bar pair has { spend, income } as fraction 0..1
  const [progress, setProgress] = useState<BarState[]>(
    data.map(() => ({ spend: 0, income: 0 })),
  );
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    startTimeRef.current = null;
    setProgress(data.map(() => ({ spend: 0, income: 0 })));

    const animate = (ts: number) => {
      if (startTimeRef.current === null) startTimeRef.current = ts;
      const elapsed = ts - startTimeRef.current;

      const newProgress = data.map((d, i) => {
        const barStart = i * STAGGER_DELAY;
        const t = Math.min(1, Math.max(0, (elapsed - barStart) / ANIM_DURATION));
        // Ease out cubic
        const eased = 1 - Math.pow(1 - t, 3);
        return {
          spend: d.spend > 0 ? eased : 0,
          income: d.income > 0 ? eased : 0,
        };
      });

      setProgress(newProgress);

      const allDone = newProgress.every(
        (p, i) => {
          const barStart = i * STAGGER_DELAY;
          return (elapsed - barStart) >= ANIM_DURATION;
        },
      );

      if (!allDone) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    const timer = setTimeout(() => {
      rafRef.current = requestAnimationFrame(animate);
    }, 300);

    return () => {
      clearTimeout(timer);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [data]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Text style={styles.headerIconText}>📊</Text>
        </View>
        <Text style={styles.headerTitle}>SPENDING INSIGHTS</Text>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={styles.legendLabel}>Expenses</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.tertiary }]} />
          <Text style={styles.legendLabel}>Income</Text>
        </View>
      </View>

      <Svg width={chartW} height={CHART_H + LABEL_H}>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map((frac, i) => {
          const y = CHART_H - CHART_H * frac;
          return (
            <React.Fragment key={`grid-${i}`}>
              <Line
                x1={0} y1={y} x2={chartW} y2={y}
                stroke={alpha(colors.outlineVariant, 0.35)}
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <SvgText
                x={0} y={y - 4}
                fill={alpha(colors.onSurfaceVariant, 0.45)}
                fontSize={9}
                fontFamily={font.label}
              >
                {fmtCompact(maxVal * frac, currency)}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const x = offsetX + i * (groupW + GROUP_GAP);
          const p = progress[i] ?? { spend: 0, income: 0 };
          const spendH = (d.spend / maxVal) * CHART_H * p.spend;
          const incomeH = (d.income / maxVal) * CHART_H * p.income;
          return (
            <React.Fragment key={`bar-${i}`}>
              {spendH > 1 && (
                <>
                  <Defs>
                    <LinearGradient id={`sg${i}`} x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0%" stopColor={colors.primary} />
                      <Stop offset="100%" stopColor={colors.primaryContainer} />
                    </LinearGradient>
                  </Defs>
                  <Rect
                    x={x}
                    y={CHART_H - spendH}
                    width={BAR_W}
                    height={spendH}
                    fill={`url(#sg${i})`}
                    rx={6}
                  />
                </>
              )}
              {incomeH > 1 && (
                <>
                  <Defs>
                    <LinearGradient id={`ig${i}`} x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0%" stopColor={colors.tertiary} />
                      <Stop offset="100%" stopColor={colors.tertiaryFixed} />
                    </LinearGradient>
                  </Defs>
                  <Rect
                    x={x + BAR_W + BAR_GAP}
                    y={CHART_H - incomeH}
                    width={BAR_W}
                    height={incomeH}
                    fill={`url(#ig${i})`}
                    rx={6}
                  />
                </>
              )}
              {/* Month label */}
              <SvgText
                x={x + groupW / 2}
                y={CHART_H + 16}
                fill={colors.onSurfaceVariant}
                fontSize={11}
                fontFamily={font.label}
                fontWeight="600"
                textAnchor="middle"
              >
                {d.month}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Baseline */}
        <Line
          x1={0} y1={CHART_H} x2={chartW} y2={CHART_H}
          stroke={alpha(colors.outline, 0.3)}
          strokeWidth={1}
        />
      </Svg>

      <InsightSummary data={data} currency={currency} />
    </View>
  );
}

function InsightSummary({ data, currency }: { data: MonthData[]; currency: string }) {
  if (data.length < 2) {
    return (
      <View style={styles.summaryRow}>
        <Text style={styles.summaryPlaceholder}>
          Track expenses for 2+ months to unlock trend insights.
        </Text>
      </View>
    );
  }

  const latest = data[data.length - 1];
  const prev = data[data.length - 2];

  const spendDelta = prev.spend > 0
    ? ((latest.spend - prev.spend) / prev.spend) * 100
    : 0;
  const incomeDelta = prev.income > 0
    ? ((latest.income - prev.income) / prev.income) * 100
    : 0;
  const net = latest.income - latest.spend;

  return (
    <View style={styles.summaryRow}>
      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>SPENDING</Text>
        <Text style={[styles.summaryDelta, { color: spendDelta <= 0 ? colors.tertiary : colors.error }]}>
          {spendDelta <= 0 ? '↓' : '↑'} {Math.abs(spendDelta).toFixed(0)}%
        </Text>
        <Text style={styles.summaryValue}>{fmtCompact(latest.spend, currency)}</Text>
      </View>
      <View style={styles.summaryDivider} />
      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>INCOME</Text>
        <Text style={[styles.summaryDelta, { color: incomeDelta >= 0 ? colors.tertiary : colors.error }]}>
          {incomeDelta >= 0 ? '↑' : '↓'} {Math.abs(incomeDelta).toFixed(0)}%
        </Text>
        <Text style={styles.summaryValue}>{fmtCompact(latest.income, currency)}</Text>
      </View>
      <View style={styles.summaryDivider} />
      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>NET</Text>
        <Text style={[styles.summaryDelta, { color: net >= 0 ? colors.tertiary : colors.error }]}>
          {net >= 0 ? '+' : '-'}{fmtCompact(Math.abs(net), currency)}
        </Text>
        <Text style={styles.summaryValue}>{latest.month}</Text>
      </View>
    </View>
  );
}

function fmtCompact(value: number, currency: string): string {
  if (value <= 0) return '0';
  if (value >= 100000) return `${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  try {
    return new Intl.NumberFormat('en', {
      style: 'currency', currency, maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(0)}`;
  }
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: 40,
    padding: 28,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: alpha(colors.outlineVariant, 0.2),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  headerIcon: {
    width: 32, height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center', justifyContent: 'center',
  },
  headerIconText: { fontSize: 14 },
  headerTitle: {
    fontFamily: font.label,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  legend: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10, height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontFamily: font.label,
    fontSize: 12,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: alpha(colors.outlineVariant, 0.3),
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  summaryLabel: {
    fontFamily: font.label,
    fontSize: 9,
    fontWeight: '700',
    color: alpha(colors.onSurfaceVariant, 0.7),
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  summaryDelta: {
    fontFamily: font.headline,
    fontSize: 18,
    fontWeight: '700',
  },
  summaryValue: {
    fontFamily: font.label,
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: alpha(colors.outlineVariant, 0.3),
  },
  summaryPlaceholder: {
    fontFamily: font.body,
    fontSize: 13,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    flex: 1,
  },
});
