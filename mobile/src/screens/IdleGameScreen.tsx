import React, { useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Animated, Dimensions,
} from 'react-native';
import { useIdleGame } from '../hooks/useIdleGame';
import {
  BUSINESS_DEFS, getBusinessCost, getBusinessRevenue,
} from '../engine/IdleEngine';
import { COLORS, WEATHER_EMOJI, WEATHER_NAME, SEASON_EMOJI, SEASON_NAME } from '../data/constants';
import WeatherScene from '../components/WeatherScene';
import PulsingView from '../components/PulsingView';

const { width: SCREEN_W } = Dimensions.get('window');

function formatNum(n: number): string {
  if (n >= 1e12) return (n / 1e12).toFixed(1) + 'T';
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return Math.floor(n).toString();
}

// Floating tap number
function TapFloat({ amount, x, y }: { amount: number; x: number; y: number }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -60, duration: 800, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 800, useNativeDriver: true }),
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.3, useNativeDriver: true, friction: 3 }),
        Animated.timing(scale, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.Text
      style={[styles.tapFloat, {
        left: x - 30, top: y - 20,
        opacity, transform: [{ translateY }, { scale }],
      }]}
    >
      +{formatNum(amount)}$
    </Animated.Text>
  );
}

export default function IdleGameScreen() {
  const { state, tap, buy, hireManager, upgrade, tapBusiness } = useIdleGame();
  const [tapFloats, setTapFloats] = React.useState<Array<{ id: number; amount: number; x: number; y: number }>>([]);
  const nextFloatId = useRef(0);
  const tapBtnScale = useRef(new Animated.Value(1)).current;

  const handleTap = useCallback((evt: any) => {
    const amount = tap();
    const { locationX, locationY } = evt.nativeEvent;

    // Bounce animation
    Animated.sequence([
      Animated.timing(tapBtnScale, { toValue: 0.9, duration: 50, useNativeDriver: true }),
      Animated.spring(tapBtnScale, { toValue: 1, useNativeDriver: true, friction: 3 }),
    ]).start();

    // Float number
    const id = nextFloatId.current++;
    setTapFloats(prev => [...prev.slice(-8), { id, amount, x: locationX, y: locationY }]);
    setTimeout(() => setTapFloats(prev => prev.filter(f => f.id !== id)), 900);
  }, [tap]);

  // Available upgrades
  const availableUpgrades = state.upgrades.filter(
    u => !u.purchased && state.lifetimeEarned >= u.unlockAt
  );

  return (
    <View style={styles.root}>
      <WeatherScene weather={state.weather} />

      {/* Top bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.cashLabel}>💰 Cash</Text>
          <Text style={styles.cashValue}>{formatNum(state.cash)}$</Text>
        </View>
        <View style={styles.topRight}>
          <View style={styles.weatherBadge}>
            <Text style={styles.weatherText}>
              {WEATHER_EMOJI[state.weather]} {SEASON_EMOJI[state.season]}
            </Text>
          </View>
          <Text style={styles.dayText}>Jour {state.day}</Text>
        </View>
      </View>

      {/* Active event banner */}
      {state.activeEvents.length > 0 && (
        <View style={[styles.eventBanner, state.activeEvents[0].impact === 'positive' ? styles.eventBannerGreen : styles.eventBannerRed]}>
          <Text style={styles.eventBannerText}>
            {state.activeEvents[0].emoji} {state.activeEvents[0].name} — {state.activeEvents[0].effect} ({Math.ceil(state.activeEvents[0].timeLeft)}s)
          </Text>
        </View>
      )}

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

        {/* TAP BUTTON */}
        <Animated.View style={{ transform: [{ scale: tapBtnScale }] }}>
          <TouchableOpacity
            style={styles.tapButton}
            onPress={handleTap}
            activeOpacity={1}
          >
            <Text style={styles.tapEmoji}>🚚</Text>
            <Text style={styles.tapText}>TAP !</Text>
            <Text style={styles.tapAmount}>+{formatNum(state.cashPerTap)}$ par tap</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Tap floats */}
        {tapFloats.map(f => (
          <TapFloat key={f.id} amount={f.amount} x={f.x + SCREEN_W * 0.15} y={f.y + 80} />
        ))}

        {/* BUSINESSES */}
        <Text style={styles.sectionTitle}>🏢 Business</Text>

        {BUSINESS_DEFS.map(def => {
          const biz = state.businesses.find(b => b.defId === def.id)!;
          const unlocked = state.lifetimeEarned >= def.unlockAt || biz.count > 0;
          if (!unlocked) return null;

          const cost = getBusinessCost(def, biz.count);
          const canBuy = state.cash >= cost;
          const revenue = getBusinessRevenue(state, biz);
          const canManager = !biz.hasManager && state.cash >= def.managerCost && biz.count > 0;

          return (
            <View key={def.id} style={styles.bizCard}>
              <View style={styles.bizHeader}>
                {/* Tap to start cycle */}
                <TouchableOpacity
                  style={styles.bizEmoji}
                  onPress={() => tapBusiness(def.id)}
                  activeOpacity={0.7}
                >
                  <PulsingView active={biz.running} intensity={0.05} speed={800}>
                    <Text style={{ fontSize: 32 }}>{def.emoji}</Text>
                  </PulsingView>
                </TouchableOpacity>

                <View style={styles.bizInfo}>
                  <Text style={styles.bizName}>{def.name}</Text>
                  <Text style={styles.bizCount}>x{biz.count} • {formatNum(revenue)}$/cycle</Text>
                </View>

                {/* Buy button */}
                <TouchableOpacity
                  style={[styles.buyBtn, !canBuy && styles.buyBtnDisabled]}
                  onPress={() => buy(def.id)}
                  disabled={!canBuy}
                  activeOpacity={0.7}
                >
                  <Text style={styles.buyBtnText}>{formatNum(cost)}$</Text>
                </TouchableOpacity>
              </View>

              {/* Progress bar */}
              {biz.count > 0 && (
                <View style={styles.progressBar}>
                  <View style={[
                    styles.progressFill,
                    { width: `${Math.min(biz.progress * 100, 100)}%` },
                    biz.running && styles.progressFillActive,
                  ]} />
                </View>
              )}

              {/* Manager button */}
              {biz.count > 0 && !biz.hasManager && (
                <TouchableOpacity
                  style={[styles.managerBtn, !canManager && styles.managerBtnDisabled]}
                  onPress={() => hireManager(def.id)}
                  disabled={!canManager}
                  activeOpacity={0.7}
                >
                  <Text style={styles.managerBtnText}>
                    🤵 Manager ({formatNum(def.managerCost)}$)
                  </Text>
                </TouchableOpacity>
              )}
              {biz.hasManager && (
                <Text style={styles.managerActive}>🤵 Auto ✓</Text>
              )}
            </View>
          );
        })}

        {/* Next unlock hint */}
        {(() => {
          const next = BUSINESS_DEFS.find(d => {
            const b = state.businesses.find(bb => bb.defId === d.id)!;
            return b.count === 0 && state.lifetimeEarned < d.unlockAt;
          });
          if (!next) return null;
          const pct = Math.min(100, Math.round((state.lifetimeEarned / next.unlockAt) * 100));
          return (
            <View style={styles.unlockHint}>
              <Text style={styles.unlockText}>
                🔒 {next.emoji} {next.name} — gagne {formatNum(next.unlockAt)}$ pour débloquer
              </Text>
              <View style={styles.unlockBar}>
                <View style={[styles.unlockFill, { width: `${pct}%` }]} />
              </View>
            </View>
          );
        })()}

        {/* UPGRADES */}
        {availableUpgrades.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>⬆️ Améliorations</Text>
            {availableUpgrades.map(up => {
              const canBuy = state.cash >= up.cost;
              return (
                <TouchableOpacity
                  key={up.id}
                  style={[styles.upgradeCard, !canBuy && styles.upgradeDisabled]}
                  onPress={() => upgrade(up.id)}
                  disabled={!canBuy}
                  activeOpacity={0.7}
                >
                  <Text style={styles.upgradeEmoji}>{up.emoji}</Text>
                  <View style={styles.upgradeInfo}>
                    <Text style={styles.upgradeName}>{up.name}</Text>
                    <Text style={styles.upgradeDesc}>{up.description}</Text>
                  </View>
                  <Text style={[styles.upgradeCost, canBuy && { color: COLORS.green }]}>
                    {formatNum(up.cost)}$
                  </Text>
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {/* Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>📊 Stats</Text>
          <Text style={styles.stat}>Total gagné: {formatNum(state.totalEarned)}$</Text>
          <Text style={styles.stat}>Taps: {state.totalTaps}</Text>
          <Text style={styles.stat}>Saison: {SEASON_NAME[state.season]}</Text>
          <Text style={styles.stat}>Météo: {WEATHER_NAME[state.weather]}</Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 55, paddingBottom: 10,
    backgroundColor: 'rgba(15,12,41,0.9)',
  },
  cashLabel: { fontSize: 12, color: COLORS.textDim },
  cashValue: { fontSize: 28, fontWeight: '900', color: COLORS.green, fontVariant: ['tabular-nums'] },
  topRight: { alignItems: 'flex-end' },
  weatherBadge: { flexDirection: 'row', gap: 4 },
  weatherText: { fontSize: 22 },
  dayText: { fontSize: 12, color: COLORS.textDim, marginTop: 2 },

  eventBanner: {
    paddingVertical: 8, paddingHorizontal: 16, alignItems: 'center',
  },
  eventBannerGreen: { backgroundColor: 'rgba(0,230,118,0.15)' },
  eventBannerRed: { backgroundColor: 'rgba(255,82,82,0.15)' },
  eventBannerText: { fontSize: 13, fontWeight: '700', color: COLORS.text },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },

  // Tap button
  tapButton: {
    backgroundColor: 'rgba(255,152,0,0.15)',
    borderWidth: 2, borderColor: 'rgba(255,152,0,0.4)',
    borderRadius: 24, padding: 24,
    alignItems: 'center', marginBottom: 20,
  },
  tapEmoji: { fontSize: 48, marginBottom: 4 },
  tapText: { fontSize: 24, fontWeight: '900', color: '#ff9800' },
  tapAmount: { fontSize: 12, color: COLORS.textDim, marginTop: 4 },
  tapFloat: {
    position: 'absolute', fontSize: 18, fontWeight: '900',
    color: COLORS.green, zIndex: 100,
  },

  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 12, marginTop: 8 },

  // Business cards
  bizCard: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16,
    padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  bizHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bizEmoji: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  bizInfo: { flex: 1 },
  bizName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  bizCount: { fontSize: 12, color: COLORS.textDim, marginTop: 2 },
  buyBtn: {
    backgroundColor: COLORS.green, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  buyBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.08)' },
  buyBtnText: { fontSize: 13, fontWeight: '800', color: '#000' },

  progressBar: {
    height: 8, backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 4, overflow: 'hidden', marginTop: 10,
  },
  progressFill: {
    height: '100%', backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 4,
  },
  progressFillActive: { backgroundColor: COLORS.blue },

  managerBtn: {
    marginTop: 8, paddingVertical: 8, borderRadius: 10,
    backgroundColor: 'rgba(179,136,255,0.12)', borderWidth: 1, borderColor: 'rgba(179,136,255,0.3)',
    alignItems: 'center',
  },
  managerBtnDisabled: { opacity: 0.4 },
  managerBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.purple },
  managerActive: { fontSize: 12, color: COLORS.green, marginTop: 6 },

  // Unlock hint
  unlockHint: {
    backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12,
    padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  unlockText: { fontSize: 13, color: COLORS.textDim, marginBottom: 8 },
  unlockBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' },
  unlockFill: { height: '100%', backgroundColor: COLORS.yellow, borderRadius: 3 },

  // Upgrades
  upgradeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14,
    padding: 14, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  upgradeDisabled: { opacity: 0.5 },
  upgradeEmoji: { fontSize: 24 },
  upgradeInfo: { flex: 1 },
  upgradeName: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  upgradeDesc: { fontSize: 11, color: COLORS.textDim, marginTop: 2 },
  upgradeCost: { fontSize: 14, fontWeight: '700', color: COLORS.textDim },

  // Stats
  statsCard: {
    backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 14,
    padding: 14, marginTop: 16,
  },
  statsTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  stat: { fontSize: 12, color: COLORS.textDim, marginBottom: 4 },
});
