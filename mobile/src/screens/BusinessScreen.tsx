import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Slider from '@react-native-community/slider';
import { useGame } from '../hooks/useGame';
import { BUSINESS_TEMPLATES } from '../data/businesses';
import { COLORS, BIZ_EMOJI } from '../data/constants';
import { fmt } from '../utils/random';

export default function BusinessScreen() {
  const { state, doHire, doUpgrade, doSetPrice } = useGame();
  const { businesses } = state;

  if (businesses.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🏢</Text>
        <Text style={styles.emptyTitle}>Aucun business</Text>
        <Text style={styles.emptyText}>Va dans le Marché pour en ouvrir un !</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>🏢 Mes Business</Text>

      {businesses.map(biz => {
        const tmpl = BUSINESS_TEMPLATES[biz.type];
        const profit = biz.lastRev - biz.lastCost;
        const upgradeCost = Math.round(tmpl.cost * biz.level * 1.5);
        const canUpgrade = state.player.cash >= upgradeCost && biz.level < 10;
        const canHire = biz.employees.length < tmpl.maxEmployees;

        return (
          <View key={biz.id} style={styles.card}>
            {/* Header */}
            <View style={styles.cardHeader}>
              <Text style={styles.cardEmoji}>{tmpl.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName}>{biz.name}</Text>
                <Text style={styles.cardSub}>
                  {tmpl.name} • {biz.city} • Niv.{biz.level}
                </Text>
              </View>
              <View style={styles.profitBadge}>
                <Text style={[styles.profitText, profit >= 0 ? styles.green : styles.red]}>
                  {profit >= 0 ? '+' : ''}{fmt(profit)}$
                </Text>
                <Text style={styles.profitLabel}>/jour</Text>
              </View>
            </View>

            {/* Stats */}
            <View style={styles.stats}>
              <View style={styles.stat}>
                <Text style={styles.statEmoji}>📈</Text>
                <Text style={styles.statVal}>{fmt(biz.lastRev)}$</Text>
                <Text style={styles.statLabel}>Revenu</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statEmoji}>📉</Text>
                <Text style={styles.statVal}>{fmt(biz.lastCost)}$</Text>
                <Text style={styles.statLabel}>Coûts</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statEmoji}>👥</Text>
                <Text style={styles.statVal}>{biz.employees.length}/{tmpl.maxEmployees}</Text>
                <Text style={styles.statLabel}>Équipe</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statEmoji}>⭐</Text>
                <Text style={styles.statVal}>{biz.reputation}</Text>
                <Text style={styles.statLabel}>Réputation</Text>
              </View>
            </View>

            {/* Reputation bar */}
            <View style={styles.repBar}>
              <View style={[styles.repFill, { width: `${biz.reputation}%` }]} />
            </View>

            {/* Price slider */}
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>💵 Prix: x{biz.price.toFixed(1)}</Text>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Slider
                  minimumValue={0.5}
                  maximumValue={2.0}
                  step={0.1}
                  value={biz.price}
                  onValueChange={(v: number) => doSetPrice(biz.id, v)}
                  minimumTrackTintColor={COLORS.blue}
                  maximumTrackTintColor="rgba(255,255,255,0.1)"
                  thumbTintColor={COLORS.blue}
                />
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.hireBtn, !canHire && styles.disabled]}
                onPress={() => doHire(biz.id)}
                disabled={!canHire}
                activeOpacity={0.7}
              >
                <Text style={styles.actionText}>👤+ Embaucher</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.upgradeBtn, !canUpgrade && styles.disabled]}
                onPress={() => doUpgrade(biz.id)}
                disabled={!canUpgrade}
                activeOpacity={0.7}
              >
                <Text style={styles.actionText}>⬆️ Améliorer ({fmt(upgradeCost)}$)</Text>
              </TouchableOpacity>
            </View>

            {/* Employees */}
            {biz.employees.length > 0 && (
              <View style={styles.empSection}>
                <Text style={styles.empTitle}>👥 Équipe</Text>
                {biz.employees.map(e => (
                  <View key={e.id} style={styles.empRow}>
                    <Text style={styles.empName}>{e.name}</Text>
                    <Text style={styles.empStat}>⚡{e.perf}</Text>
                    <Text style={styles.empStat}>😊{e.morale}</Text>
                    <Text style={styles.empStat}>💰{fmt(e.salary)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16, paddingBottom: 100 },
  title: { fontSize: 24, fontWeight: '900', color: COLORS.text, marginBottom: 16 },

  emptyContainer: { flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  emptyText: { fontSize: 14, color: COLORS.textDim },

  card: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 18,
    marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  cardEmoji: { fontSize: 36 },
  cardName: { fontSize: 17, fontWeight: '800', color: COLORS.text },
  cardSub: { fontSize: 12, color: COLORS.textDim, marginTop: 2 },
  profitBadge: { alignItems: 'flex-end' },
  profitText: { fontSize: 18, fontWeight: '800' },
  profitLabel: { fontSize: 10, color: COLORS.textDim },

  stats: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  stat: { alignItems: 'center' },
  statEmoji: { fontSize: 16, marginBottom: 2 },
  statVal: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  statLabel: { fontSize: 10, color: COLORS.textDim },

  repBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden', marginBottom: 12 },
  repFill: { height: '100%', backgroundColor: COLORS.yellow, borderRadius: 3 },

  priceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  priceLabel: { fontSize: 13, color: COLORS.text, fontWeight: '600' },

  actions: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  hireBtn: { backgroundColor: 'rgba(0,230,118,0.12)', borderWidth: 1, borderColor: 'rgba(0,230,118,0.3)' },
  upgradeBtn: { backgroundColor: 'rgba(68,138,255,0.12)', borderWidth: 1, borderColor: 'rgba(68,138,255,0.3)' },
  disabled: { opacity: 0.3 },
  actionText: { fontSize: 12, fontWeight: '700', color: COLORS.text },

  empSection: { marginTop: 8 },
  empTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  empRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  empName: { flex: 1, fontSize: 12, color: COLORS.text },
  empStat: { fontSize: 11, color: COLORS.textDim },
  green: { color: COLORS.green },
  red: { color: COLORS.red },
});
