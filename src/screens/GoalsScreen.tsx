import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { useStore } from '../store';
import { themes, accent, accentInk, font, alpha } from '../theme';
import LiquidIcon from '../components/LiquidIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParams } from '../App';
import { FAB } from '../components/ActionViews';

export default function GoalsScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParams>>();
  const { themeMode } = useStore();
  const t = themes[themeMode];
  const aink = accentInk(themeMode);

  const s = getStyles(t, aink);

  // SVG Circular Progress logic
  const radius = 64;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const progressPercent = 70;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>Somus Vault</Text>
          <TouchableOpacity>
            <LiquidIcon name="cog" size={24} color={aink} />
          </TouchableOpacity>
        </View>

        <View style={s.heroText}>
          <Text style={s.heroTitle}>Your Aspirations</Text>
          <Text style={s.heroSub}>Tracking your journey to financial freedom, Devesh.</Text>
        </View>

        {/* Primary Target Card */}
        <View style={[s.card, { alignItems: 'center' }]}>
          <View style={{ width: 160, height: 160, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Svg width={160} height={160} style={{ position: 'absolute' }}>
              <Circle cx="80" cy="80" r={radius} stroke={alpha(accent.v, 0.15)} strokeWidth={strokeWidth} fill="none" />
              <Circle
                cx="80" cy="80" r={radius}
                stroke={accent.v} strokeWidth={strokeWidth} fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                transform="rotate(-90 80 80)"
              />
            </Svg>
            <Text style={{ fontFamily: font.display, fontSize: 36, color: t.ink, letterSpacing: -1 }}>70%</Text>
            <Text style={{ fontFamily: font.monoBold, fontSize: 9, color: t.mute, letterSpacing: 1, marginTop: 4 }}>COMPLETE</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: alpha(accent.v, 0.2), paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, marginBottom: 16 }}>
             <LiquidIcon name="star" size={12} color={aink} />
             <Text style={{ fontFamily: font.monoBold, fontSize: 10, color: aink, marginLeft: 6, letterSpacing: 0.5 }}>PRIMARY TARGET</Text>
          </View>

          <Text style={{ fontFamily: font.uiBold, fontSize: 22, color: t.ink, marginBottom: 8 }}>Home Down Payment</Text>
          
          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 24 }}>
            <Text style={{ fontFamily: font.display, fontSize: 32, fontWeight: '500', color: t.ink, letterSpacing: -1 }}>$84,200</Text>
            <Text style={{ fontFamily: font.mono, fontSize: 14, color: t.mute, marginLeft: 8 }}>/ $120,000</Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
            <TouchableOpacity style={s.btnPrimary}>
              <Text style={s.btnPrimaryText}>Add Funds</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.btnSecondary}>
              <Text style={s.btnSecondaryText}>Edit Goal</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Success Card */}
        <View style={[s.card, { backgroundColor: alpha('#a3e635', 0.1), alignItems: 'center' }]}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: alpha('#a3e635', 0.3), alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
             <LiquidIcon name="check" size={24} color="#3f6212" strokeWidth={2.5} />
          </View>
          <Text style={{ fontFamily: font.uiBold, fontSize: 18, color: '#3f6212', marginBottom: 8 }}>Goal Reached!</Text>
          <Text style={{ fontFamily: font.ui, fontSize: 13, color: '#4d7c0f', textAlign: 'center', lineHeight: 20, marginBottom: 20 }}>
            Your <Text style={{ fontFamily: font.uiBold }}>Emergency Buffer</Text> is fully funded.{'\n'}You're protected for 6 months.
          </Text>
          <Text style={{ fontFamily: font.display, fontSize: 26, fontWeight: '500', color: '#3f6212', marginBottom: 12 }}>$25,000.00</Text>
          <Text style={{ fontFamily: font.monoBold, fontSize: 9, color: alpha('#4d7c0f', 0.6), letterSpacing: 0.5 }}>ARCHIVED JUNE 2024</Text>
        </View>

        {/* Progress Timeline (Bar Chart) */}
        <View style={s.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
            <View>
              <Text style={[s.cardTitle, { marginBottom: 4 }]}>Progress Timeline</Text>
              <Text style={{ fontFamily: font.ui, fontSize: 13, color: t.mute }}>Projected completion: March 2025</Text>
            </View>
            <View style={{ backgroundColor: alpha(aink, 0.1), paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
               <Text style={{ fontFamily: font.monoBold, fontSize: 9, color: aink }}>5 MONTHS</Text>
            </View>
          </View>

          <View style={{ height: 140, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <View style={{ position: 'absolute', top: 30, left: 0, right: 0, height: 1, backgroundColor: t.rule, borderStyle: 'dashed' }} />
            <View style={{ position: 'absolute', top: 90, left: 0, right: 0, height: 1, backgroundColor: t.rule, borderStyle: 'dashed' }} />
            
            {/* Chart Bars */}
            <Bar height="20%" t={t} />
            <Bar height="30%" t={t} />
            <Bar height="40%" t={t} />
            <Bar height="55%" t={t} />
            <Bar height="75%" t={t} />
            <Bar height="100%" color={accent.v} t={t} active />
            <Bar height="95%" t={t} outline />
            <Bar height="95%" t={t} outline />
          </View>
        </View>

        {/* Minor Cards */}
        <View style={{ paddingHorizontal: 20 }}>
          <GoalRow title="Europe Summer '25" amount="$5,400 SAVED" target="$12,000 TARGET" pct={45} icon="plane" bg="#1e293b" iconColor={accent.v} t={t} />
          <GoalRow title="Electric SUV" amount="$8,200 SAVED" target="$65,000 TARGET" pct={12} icon="car" bg="#0f172a" iconColor="#a3e635" t={t} />
        </View>

      </ScrollView>
      <FAB onPress={() => nav.navigate('AddGoal')} />
    </SafeAreaView>
  );
}

function Bar({ height, color, active, outline, t }: any) {
  if (outline) {
    return (
      <View style={{ width: '9%', height, borderWidth: 1, borderColor: t.rule, borderStyle: 'dashed', borderTopLeftRadius: 8, borderTopRightRadius: 8 }} />
    );
  }
  return (
    <View style={{ width: '9%', height, alignItems: 'center' }}>
      {active && (
        <View style={{ position: 'absolute', top: -28, backgroundColor: t.ink, paddingHorizontal: 6, paddingVertical: 4, borderRadius: 4 }}>
          <Text style={{ fontFamily: font.monoBold, fontSize: 8, color: t.bg }}>Today</Text>
        </View>
      )}
      <View style={{ width: '100%', height: '100%', backgroundColor: color || alpha(accent.v, 0.3), borderTopLeftRadius: 8, borderTopRightRadius: 8 }} />
    </View>
  );
}

function GoalRow({ title, amount, target, pct, icon, bg, iconColor, t }: any) {
  return (
    <View style={{ backgroundColor: alpha(accent.v, 0.05), borderRadius: 24, padding: 16, marginBottom: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: t.rule }}>
       <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
          <LiquidIcon name={icon} size={28} color={iconColor} strokeWidth={1.5} />
       </View>
       <View style={{ flex: 1, marginLeft: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontFamily: font.uiBold, fontSize: 15, color: t.ink }}>{title}</Text>
            <Text style={{ fontFamily: font.monoBold, fontSize: 12, color: accent.v }}>{pct}%</Text>
          </View>
          <View style={{ height: 6, backgroundColor: t.chipBg, borderRadius: 3, marginBottom: 10, overflow: 'hidden' }}>
             <View style={{ width: `${pct}%`, height: '100%', backgroundColor: iconColor, borderRadius: 3 }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: font.mono, fontSize: 9, color: t.mute, letterSpacing: 0.5 }}>{amount}</Text>
            <Text style={{ fontFamily: font.mono, fontSize: 9, color: t.mute, letterSpacing: 0.5 }}>{target}</Text>
          </View>
       </View>
    </View>
  );
}

function getStyles(t: any, aink: string) {
  return StyleSheet.create({
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10 },
    headerTitle: { fontFamily: font.uiBold, fontSize: 18, color: aink },

    heroText: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
    heroTitle: { fontFamily: font.display, fontSize: 32, color: t.ink, letterSpacing: -1, marginBottom: 6 },
    heroSub: { fontFamily: font.ui, fontSize: 14, color: t.inkDim, lineHeight: 22, maxWidth: 280 },

    card: { marginHorizontal: 20, marginBottom: 16, padding: 24, backgroundColor: t.surface, borderRadius: 28, borderWidth: 1, borderColor: t.rule },
    cardTitle: { fontFamily: font.uiBold, fontSize: 16, color: t.ink },

    btnPrimary: { flex: 1, backgroundColor: accent.v, paddingVertical: 14, borderRadius: 100, alignItems: 'center' },
    btnPrimaryText: { fontFamily: font.uiBold, fontSize: 14, color: t.bg },
    btnSecondary: { flex: 1, backgroundColor: alpha(accent.v, 0.1), paddingVertical: 14, borderRadius: 100, alignItems: 'center' },
    btnSecondaryText: { fontFamily: font.uiBold, fontSize: 14, color: aink },
  });
}
