import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useGame } from '../hooks/useGame';
import { COLORS, WEATHER_EMOJI, WEATHER_NAME, SEASON_EMOJI, SEASON_NAME, ECO_COLOR, ECO_NAME, BIZ_EMOJI } from '../data/constants';
import CashCounter from '../components/CashCounter';
import FloatingProfit from '../components/FloatingProfit';
import AnimatedCard from '../components/AnimatedCard';
import PulsingView from '../components/PulsingView';
import LiveBar from '../components/LiveBar';
import WeatherScene from '../components/WeatherScene';
import { fmt } from '../utils/random';

export default function DashboardScreen() {
  const { state, togglePause, setSpeed } = useGame();
  const { player: p, world: w, businesses } = state;

  const xpNeeded = Math.floor(1000 * Math.pow(p.level, 1.5));
  const xpPct = Math.min(100, Math.round((p.xp / xpNeeded) * 100));
  const totalProfit = businesses.reduce((s, b) => s + b.lastRev - b.lastCost, 0);
  const speedBtns = [1, 2, 3];

  return (
    <View style={styles.root}>
      {/* Weather particles */}
      <WeatherScene weather={w.weather} />

      {/* Floating profit numbers */}
      <FloatingProfit value={Math.round(p.cash)} trigger={w.day} />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Player header */}
        <AnimatedCard delay={0} style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.playerName}>{p.name}</Text>
            <CashCounter value={Math.round(p.cash)} size={28} />
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>Niv. {p.level}</Text>
            <LiveBar percent={xpPct} color={COLORS.purple} height={5} />
          </View>
        </AnimatedCard>

        {/* Weather & day */}
        <AnimatedCard delay={80} style={styles.weatherCard}>
          <PulsingView active intensity={0.08} speed={2000}>
            <Text style={styles.weatherEmoji}>{WEATHER_EMOJI[w.weather] || '🌤️'}</Text>
          </PulsingView>
          <View style={{ flex: 1 }}>
            <Text style={styles.dayText}>Jour {w.day}</Text>
            <Text style={styles.seasonText}>
              {SEASON_EMOJI[w.season]} {SEASON_NAME[w.season]} • {WEATHER_NAME[w.weather]}
              {w.extreme ? ' ⚠️' : ''}
            </Text>
          </View>
        </AnimatedCard>

        {/* Economy strip */}
        <AnimatedCard delay={160} style={styles.ecoStrip}>
          <PulsingView active={w.ecoCycle !== 'stable'} intensity={0.04} speed={1200}>
            <View style={[styles.ecoChip, { borderColor: ECO_COLOR[w.ecoCycle] }]}>
              <Text style={[styles.ecoChipText, { color: ECO_COLOR[w.ecoCycle] }]}>
                📊 {ECO_NAME[w.ecoCycle]}
              </Text>
            </View>
          </PulsingView>
          <View style={styles.ecoChip}>
            <Text style={styles.ecoChipText}>💰 {w.consumption.toFixed(2)}</Text>
          </View>
          <View style={styles.ecoChip}>
            <Text style={styles.ecoChipText}>📉 {(w.unemployment * 100).toFixed(0)}%</Text>
          </View>
          <View style={styles.ecoChip}>
            <Text style={styles.ecoChipText}>🏦 {(w.interestRate * 100).toFixed(1)}%</Text>
          </View>
        </AnimatedCard>

        {/* Speed controls */}
        <AnimatedCard delay={240} style={styles.controls}>
          <TouchableOpacity
            style={[styles.pauseBtn, state.paused && styles.pauseBtnActive]}
            onPress={togglePause}
            activeOpacity={0.7}
          >
            <Text style={styles.pauseBtnText}>{state.paused ? '▶️' : '⏸'}</Text>
          </TouchableOpacity>
          {speedBtns.map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.speedBtn, state.speed === s && styles.speedBtnActive]}
              onPress={() => setSpeed(s)}
              activeOpacity={0.7}
            >
              <Text style={[styles.speedBtnText, state.speed === s && { color: 'white' }]}>
                x{s}
              </Text>
            </TouchableOpacity>
          ))}
        </AnimatedCard>

        {/* Active events */}
        {w.activeEvents.length > 0 && (
          <AnimatedCard delay={300} style={styles.section}>
            <Text style={styles.sectionTitle}>Événements actifs</Text>
            <View style={styles.eventBadges}>
              {w.activeEvents.map((e, i) => (
                <PulsingView key={i} active intensity={0.05} speed={1000}>
                  <View style={[styles.badge, e.impact === 'positive' ? styles.badgeGreen : e.impact === 'negative' ? styles.badgeRed : styles.badgeYellow]}>
                    <Text style={styles.badgeText}>{e.emoji} {e.name} ({e.daysLeft}j)</Text>
                  </View>
                </PulsingView>
              ))}
            </View>
          </AnimatedCard>
        )}

        {/* Profit summary */}
        {businesses.length > 0 ? (
          <AnimatedCard delay={350} style={styles.card}>
            <Text style={styles.sectionTitle}>💰 Profits du jour</Text>
            {businesses.map(b => {
              const profit = b.lastRev - b.lastCost;
              return (
                <View key={b.id} style={styles.profitLine}>
                  <Text style={styles.profitName}>{BIZ_EMOJI[b.type]} {b.name}</Text>
                  <Text style={[styles.profitVal, profit >= 0 ? styles.green : styles.red]}>
                    {profit >= 0 ? '+' : ''}{fmt(profit)}$/j
                  </Text>
                </View>
              );
            })}
            <View style={[styles.profitLine, { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 10, marginTop: 4 }]}>
              <Text style={[styles.profitName, { fontWeight: '800' }]}>Total</Text>
              <Text style={[styles.profitVal, { fontWeight: '800', fontSize: 16 }, totalProfit >= 0 ? styles.green : styles.red]}>
                {totalProfit >= 0 ? '+' : ''}{fmt(totalProfit)}$/j
              </Text>
            </View>
          </AnimatedCard>
        ) : (
          <AnimatedCard delay={350} style={styles.empty}>
            <PulsingView active intensity={0.1} speed={2000}>
              <Text style={styles.emptyEmoji}>🚀</Text>
            </PulsingView>
            <Text style={styles.emptyText}>Ouvre ton premier business{'\n'}dans l'onglet Marché !</Text>
          </AnimatedCard>
        )}

        {/* Recent events */}
        {w.eventLog.length > 0 && (
          <AnimatedCard delay={420} style={styles.card}>
            <Text style={styles.sectionTitle}>📰 Derniers événements</Text>
            {w.eventLog.slice(-3).reverse().map((e, i) => (
              <View key={i} style={styles.logItem}>
                <Text style={styles.logDay}>J{e.day}</Text>
                <Text style={styles.logEmoji}>{e.emoji}</Text>
                <Text style={styles.logText} numberOfLines={1}>{e.name}</Text>
              </View>
            ))}
          </AnimatedCard>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  playerName: { fontSize: 14, color: COLORS.textDim, marginBottom: 4 },
  levelBadge: { alignItems: 'center', width: 70 },
  levelText: { fontSize: 13, fontWeight: '800', color: COLORS.purple, marginBottom: 4 },

  weatherCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 16, marginBottom: 14,
  },
  weatherEmoji: { fontSize: 44 },
  dayText: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  seasonText: { fontSize: 13, color: COLORS.textDim, marginTop: 2 },

  ecoStrip: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  ecoChip: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  ecoChipText: { fontSize: 11, color: COLORS.textDim },

  controls: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  pauseBtn: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  pauseBtnActive: { backgroundColor: 'rgba(68,138,255,0.15)', borderColor: COLORS.blue },
  pauseBtnText: { fontSize: 18 },
  speedBtn: {
    paddingHorizontal: 20, paddingVertical: 14, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  speedBtnActive: { backgroundColor: COLORS.blue, borderColor: COLORS.blue },
  speedBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.textDim },

  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 10 },
  eventBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  badgeGreen: { backgroundColor: 'rgba(0,230,118,0.1)', borderColor: 'rgba(0,230,118,0.3)' },
  badgeRed: { backgroundColor: 'rgba(255,82,82,0.1)', borderColor: 'rgba(255,82,82,0.3)' },
  badgeYellow: { backgroundColor: 'rgba(255,215,64,0.1)', borderColor: 'rgba(255,215,64,0.3)' },
  badgeText: { fontSize: 11, color: COLORS.text },

  card: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 16, marginBottom: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  profitLine: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  profitName: { fontSize: 14, color: COLORS.text },
  profitVal: { fontSize: 14, fontWeight: '600', fontVariant: ['tabular-nums'] },
  green: { color: COLORS.green },
  red: { color: COLORS.red },

  empty: { alignItems: 'center', paddingVertical: 50 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: COLORS.textDim, textAlign: 'center', lineHeight: 22 },

  logItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  logDay: { fontSize: 11, color: COLORS.textDim, width: 30 },
  logEmoji: { fontSize: 16 },
  logText: { flex: 1, fontSize: 13, color: COLORS.text },
});
