import React, { useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Animated, Dimensions, Platform,
} from 'react-native';
import { useIdleGame } from '../hooks/useIdleGame';
import {
  BUSINESS_DEFS, getBusinessCost, getRevenue, getIncomePerSecond,
} from '../engine/IdleEngine';
import { COLORS, WEATHER_EMOJI, SEASON_EMOJI, SEASON_NAME } from '../data/constants';

const { width: SW, height: SH } = Dimensions.get('window');

// Try haptics
let triggerHaptic = () => {};
try {
  const Haptics = require('expo-haptics');
  triggerHaptic = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
} catch {}

function fmt(n: number): string {
  if (n >= 1e12) return (n / 1e12).toFixed(1) + 'T';
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return Math.floor(n).toString();
}

// ============ TAP FLOAT ============
function TapFloat({ amount, x, y }: { amount: number; x: number; y: number }) {
  const ty = useRef(new Animated.Value(0)).current;
  const op = useRef(new Animated.Value(1)).current;
  const sc = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(ty, { toValue: -70, duration: 700, useNativeDriver: true }),
      Animated.sequence([
        Animated.spring(sc, { toValue: 1.4, useNativeDriver: true, friction: 4 }),
        Animated.timing(sc, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.delay(400),
        Animated.timing(op, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);
  return (
    <Animated.Text style={[styles.tapFloat, {
      left: x - 30, top: y - 15, opacity: op,
      transform: [{ translateY: ty }, { scale: sc }],
    }]}>
      +{fmt(amount)}$
    </Animated.Text>
  );
}

// ============ BUBBLE ============
function Bubble({ bubble, onPop }: { bubble: any; onPop: () => void }) {
  const scale = useRef(new Animated.Value(0)).current;
  const wobble = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 3 }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(wobble, { toValue: 10, duration: 600, useNativeDriver: true }),
        Animated.timing(wobble, { toValue: -10, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.bubble, {
      left: bubble.x * (SW - 80),
      top: bubble.y * (SH - 300) + 100,
      transform: [{ scale }, { translateY: wobble }],
    }]}>
      <TouchableOpacity onPress={onPop} activeOpacity={0.6} style={styles.bubbleInner}>
        <Text style={styles.bubbleEmoji}>{bubble.emoji}</Text>
        <Text style={styles.bubbleText}>
          {bubble.type === 'cash' ? `x${bubble.multiplier}` : bubble.type === 'frenzy' ? `x${bubble.multiplier}!` : `x${bubble.multiplier}`}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ============ ACHIEVEMENT POPUP ============
function AchievementPopup({ achievement, onDone }: { achievement: any; onDone: () => void }) {
  const slideY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(slideY, { toValue: 0, useNativeDriver: true, friction: 5 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]),
      Animated.delay(2000),
      Animated.parallel([
        Animated.timing(slideY, { toValue: -100, duration: 300, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]),
    ]).start(onDone);
  }, []);

  return (
    <Animated.View style={[styles.achievementPopup, {
      opacity, transform: [{ translateY: slideY }],
    }]}>
      <Text style={styles.achievementEmoji}>{achievement.emoji}</Text>
      <View>
        <Text style={styles.achievementTitle}>{achievement.name}</Text>
        <Text style={styles.achievementDesc}>{achievement.description} — +{fmt(achievement.reward)}$</Text>
      </View>
    </Animated.View>
  );
}

// ============ MAIN SCREEN ============
export default function IdleGameScreen() {
  const { state, tap, buy, hireManager, tapBiz, popBubble, clearAchievement } = useIdleGame();
  const [floats, setFloats] = React.useState<Array<{ id: number; amount: number; x: number; y: number }>>([]);
  const nextId = useRef(0);
  const tapScale = useRef(new Animated.Value(1)).current;
  const comboScale = useRef(new Animated.Value(1)).current;

  // Combo pulse effect
  useEffect(() => {
    if (state.comboMultiplier > 1) {
      Animated.sequence([
        Animated.timing(comboScale, { toValue: 1.3, duration: 80, useNativeDriver: true }),
        Animated.spring(comboScale, { toValue: 1, useNativeDriver: true, friction: 3 }),
      ]).start();
    }
  }, [state.comboMultiplier]);

  const handleTap = useCallback((evt: any) => {
    const amount = tap();
    triggerHaptic();

    Animated.sequence([
      Animated.timing(tapScale, { toValue: 0.85, duration: 40, useNativeDriver: true }),
      Animated.spring(tapScale, { toValue: 1, useNativeDriver: true, friction: 3 }),
    ]).start();

    const id = nextId.current++;
    const { locationX, locationY } = evt.nativeEvent;
    setFloats(prev => [...prev.slice(-10), { id, amount, x: locationX, y: locationY }]);
    setTimeout(() => setFloats(prev => prev.filter(f => f.id !== id)), 800);
  }, [tap]);

  const handlePopBubble = useCallback((bubbleId: number) => {
    triggerHaptic();
    const result = popBubble(bubbleId);
    if (result) {
      // could add more feedback
    }
  }, [popBubble]);

  const ips = getIncomePerSecond(state);
  const lastAch = state.lastAchievement
    ? state.achievements.find(a => a.id === state.lastAchievement)
    : null;

  return (
    <View style={styles.root}>
      {/* Achievement popup */}
      {lastAch && (
        <AchievementPopup achievement={lastAch} onDone={clearAchievement} />
      )}

      {/* Bonus bubbles */}
      {state.bubbles.map(b => (
        <Bubble key={b.id} bubble={b} onPop={() => handlePopBubble(b.id)} />
      ))}

      {/* TOP BAR */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.cashValue}>{fmt(state.cash)}$</Text>
          {ips > 0 && <Text style={styles.ipsText}>{fmt(ips)}$/sec</Text>}
        </View>
        <View style={styles.topRight}>
          <Text style={styles.weatherText}>{WEATHER_EMOJI[state.weather]} {SEASON_EMOJI[state.season]}</Text>
          <Text style={styles.dayText}>Jour {state.day} • {SEASON_NAME[state.season]}</Text>
        </View>
      </View>

      {/* Active buffs */}
      {state.buffs.length > 0 && (
        <View style={styles.buffBar}>
          {state.buffs.map((b, i) => (
            <View key={i} style={styles.buffChip}>
              <Text style={styles.buffText}>{b.emoji} x{b.multiplier} ({Math.ceil(b.timeLeft)}s)</Text>
            </View>
          ))}
        </View>
      )}

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

        {/* TAP BUTTON */}
        <Animated.View style={[styles.tapArea, { transform: [{ scale: tapScale }] }]}>
          <TouchableOpacity
            style={styles.tapButton}
            onPress={handleTap}
            activeOpacity={1}
          >
            <Text style={styles.tapEmoji}>🍋</Text>
            <Text style={styles.tapLabel}>TAP !</Text>
            <Text style={styles.tapVal}>+{fmt(state.tapValue)}$ / tap</Text>
          </TouchableOpacity>

          {/* Floating numbers */}
          {floats.map(f => (
            <TapFloat key={f.id} amount={f.amount} x={f.x} y={f.y} />
          ))}
        </Animated.View>

        {/* COMBO */}
        {state.comboMultiplier > 1 && (
          <Animated.View style={[styles.comboBar, { transform: [{ scale: comboScale }] }]}>
            <Text style={styles.comboText}>
              🔥 COMBO x{state.comboMultiplier}
            </Text>
            <View style={styles.comboFill}>
              <View style={[styles.comboFillInner, { width: `${(state.comboTimer / 0.4) * 100}%` }]} />
            </View>
          </Animated.View>
        )}

        {/* BUSINESSES */}
        {BUSINESS_DEFS.map(def => {
          const biz = state.businesses.find(b => b.defId === def.id)!;
          const unlocked = state.totalEarned >= def.unlockAt || biz.count > 0;
          if (!unlocked) {
            // Show as locked if close to unlocking
            if (state.totalEarned >= def.unlockAt * 0.3) {
              const pct = Math.min(100, Math.round((state.totalEarned / def.unlockAt) * 100));
              return (
                <View key={def.id} style={styles.lockedCard}>
                  <Text style={styles.lockedEmoji}>🔒</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.lockedName}>{def.emoji} {def.name}</Text>
                    <View style={styles.unlockBar}>
                      <View style={[styles.unlockFill, { width: `${pct}%` }]} />
                    </View>
                    <Text style={styles.lockedPct}>{pct}% — gagne {fmt(def.unlockAt)}$</Text>
                  </View>
                </View>
              );
            }
            return null;
          }

          const cost = getBusinessCost(def, biz.count);
          const canBuy = state.cash >= cost;
          const rev = getRevenue(state, biz);
          const canManager = !biz.hasManager && biz.count > 0 && state.cash >= def.managerCost;

          return (
            <View key={def.id} style={styles.bizCard}>
              <View style={styles.bizRow}>
                {/* Tap to start */}
                <TouchableOpacity
                  style={styles.bizTap}
                  onPress={() => { tapBiz(def.id); triggerHaptic(); }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.bizEmoji}>{def.emoji}</Text>
                  {biz.hasManager && <Text style={styles.autoTag}>AUTO</Text>}
                </TouchableOpacity>

                <View style={styles.bizInfo}>
                  <Text style={styles.bizName}>{def.name} <Text style={styles.bizCount}>x{biz.count}</Text></Text>
                  {biz.count > 0 && <Text style={styles.bizRev}>{fmt(rev)}$ / cycle</Text>}
                </View>

                {/* Buy */}
                <TouchableOpacity
                  style={[styles.buyBtn, canBuy && styles.buyBtnActive]}
                  onPress={() => { buy(def.id); triggerHaptic(); }}
                  disabled={!canBuy}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.buyText, canBuy && styles.buyTextActive]}>
                    {fmt(cost)}$
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Progress bar */}
              {biz.count > 0 && (
                <View style={styles.progBar}>
                  <View style={[
                    styles.progFill,
                    { width: `${Math.min(biz.progress * 100, 100)}%` },
                    biz.running && styles.progActive,
                  ]} />
                </View>
              )}

              {/* Manager */}
              {biz.count > 0 && !biz.hasManager && (
                <TouchableOpacity
                  style={[styles.mgrBtn, canManager && styles.mgrBtnActive]}
                  onPress={() => { hireManager(def.id); triggerHaptic(); }}
                  disabled={!canManager}
                  activeOpacity={0.7}
                >
                  <Text style={styles.mgrText}>🤵 Manager • {fmt(def.managerCost)}$</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {/* Achievements unlocked count */}
        <View style={styles.achSection}>
          <Text style={styles.achTitle}>
            🏆 {state.achievements.filter(a => a.unlocked).length}/{state.achievements.length} Achievements
          </Text>
          <View style={styles.achGrid}>
            {state.achievements.map(a => (
              <View key={a.id} style={[styles.achBadge, a.unlocked && styles.achUnlocked]}>
                <Text style={{ fontSize: 18, opacity: a.unlocked ? 1 : 0.2 }}>{a.emoji}</Text>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },

  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingHorizontal: 20, paddingTop: 55, paddingBottom: 12,
    backgroundColor: 'rgba(15,12,41,0.95)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  cashValue: { fontSize: 30, fontWeight: '900', color: COLORS.green, fontVariant: ['tabular-nums'] },
  ipsText: { fontSize: 12, color: COLORS.textDim, marginTop: 2 },
  topRight: { alignItems: 'flex-end' },
  weatherText: { fontSize: 20 },
  dayText: { fontSize: 11, color: COLORS.textDim, marginTop: 2 },

  buffBar: { flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingVertical: 6, backgroundColor: 'rgba(255,152,0,0.08)' },
  buffChip: { backgroundColor: 'rgba(255,152,0,0.15)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  buffText: { fontSize: 12, fontWeight: '700', color: '#ff9800' },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },

  // Tap
  tapArea: { marginBottom: 12, position: 'relative' },
  tapButton: {
    backgroundColor: 'rgba(255,193,7,0.1)', borderWidth: 2, borderColor: 'rgba(255,193,7,0.3)',
    borderRadius: 20, paddingVertical: 28, alignItems: 'center',
  },
  tapEmoji: { fontSize: 52 },
  tapLabel: { fontSize: 28, fontWeight: '900', color: '#ffc107', marginTop: 4 },
  tapVal: { fontSize: 13, color: COLORS.textDim, marginTop: 4 },
  tapFloat: { position: 'absolute', fontSize: 20, fontWeight: '900', color: COLORS.green, zIndex: 100 },

  // Combo
  comboBar: {
    backgroundColor: 'rgba(255,82,82,0.1)', borderRadius: 12,
    padding: 10, marginBottom: 12, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,82,82,0.3)',
  },
  comboText: { fontSize: 16, fontWeight: '900', color: COLORS.red, marginBottom: 4 },
  comboFill: { width: '100%', height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' },
  comboFillInner: { height: '100%', backgroundColor: COLORS.red, borderRadius: 2 },

  // Business
  bizCard: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14,
    padding: 12, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  bizRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bizTap: { width: 46, height: 46, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  bizEmoji: { fontSize: 28 },
  autoTag: {
    position: 'absolute', bottom: -2, fontSize: 7, fontWeight: '900',
    color: COLORS.green, backgroundColor: 'rgba(0,230,118,0.15)',
    paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3,
  },
  bizInfo: { flex: 1 },
  bizName: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  bizCount: { color: COLORS.textDim, fontWeight: '400' },
  bizRev: { fontSize: 11, color: COLORS.green, marginTop: 1 },
  buyBtn: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  buyBtnActive: { backgroundColor: COLORS.green },
  buyText: { fontSize: 13, fontWeight: '800', color: COLORS.textDim },
  buyTextActive: { color: '#000' },

  progBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden', marginTop: 8 },
  progFill: { height: '100%', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 3 },
  progActive: { backgroundColor: COLORS.blue },

  mgrBtn: {
    marginTop: 6, paddingVertical: 6, borderRadius: 8, alignItems: 'center',
    backgroundColor: 'rgba(179,136,255,0.08)', borderWidth: 1, borderColor: 'rgba(179,136,255,0.15)',
    opacity: 0.4,
  },
  mgrBtnActive: { opacity: 1 },
  mgrText: { fontSize: 11, fontWeight: '600', color: COLORS.purple },

  // Locked
  lockedCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 12,
    padding: 12, marginBottom: 8, opacity: 0.6,
  },
  lockedEmoji: { fontSize: 20 },
  lockedName: { fontSize: 13, color: COLORS.textDim, marginBottom: 6 },
  unlockBar: { height: 4, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' },
  unlockFill: { height: '100%', backgroundColor: COLORS.yellow, borderRadius: 2 },
  lockedPct: { fontSize: 10, color: COLORS.textDim, marginTop: 3 },

  // Achievements
  achSection: { marginTop: 16, padding: 14, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 14 },
  achTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 10 },
  achGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  achBadge: {
    width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  achUnlocked: { backgroundColor: 'rgba(255,215,64,0.1)', borderColor: 'rgba(255,215,64,0.3)' },

  // Bubble
  bubble: {
    position: 'absolute', zIndex: 50,
  },
  bubbleInner: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(255,215,64,0.15)', borderWidth: 2, borderColor: 'rgba(255,215,64,0.4)',
    justifyContent: 'center', alignItems: 'center',
  },
  bubbleEmoji: { fontSize: 24 },
  bubbleText: { fontSize: 10, fontWeight: '900', color: COLORS.yellow },

  // Achievement popup
  achievementPopup: {
    position: 'absolute', top: 50, left: 20, right: 20, zIndex: 200,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,215,64,0.15)', borderWidth: 1, borderColor: 'rgba(255,215,64,0.4)',
    borderRadius: 16, padding: 14,
  },
  achievementEmoji: { fontSize: 32 },
  achievementTitle: { fontSize: 15, fontWeight: '800', color: COLORS.yellow },
  achievementDesc: { fontSize: 12, color: COLORS.textDim, marginTop: 2 },
});
