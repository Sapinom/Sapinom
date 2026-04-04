import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useGame } from '../hooks/useGame';
import { COLORS } from '../data/constants';

export default function EventsScreen() {
  const { state } = useGame();
  const log = state.world.eventLog;

  if (log.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>📰</Text>
        <Text style={styles.emptyTitle}>Aucun événement</Text>
        <Text style={styles.emptyText}>Les événements apparaîtront au fil du temps</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>📰 Événements</Text>

      {[...log].reverse().map((e, i) => (
        <View key={i} style={styles.item}>
          <View style={styles.itemLeft}>
            <Text style={styles.dayBadge}>J{e.day}</Text>
            <View style={[
              styles.dot,
              e.impact === 'positive' && styles.dotGreen,
              e.impact === 'negative' && styles.dotRed,
              e.impact === 'neutral' && styles.dotYellow,
            ]} />
          </View>
          <View style={styles.itemContent}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemEmoji}>{e.emoji}</Text>
              <Text style={styles.itemName}>{e.name}</Text>
            </View>
            <Text style={styles.itemDesc}>{e.desc}</Text>
          </View>
        </View>
      ))}
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

  item: {
    flexDirection: 'row', gap: 12, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  itemLeft: { alignItems: 'center', width: 40 },
  dayBadge: { fontSize: 11, color: COLORS.textDim, fontWeight: '600', marginBottom: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotGreen: { backgroundColor: COLORS.green },
  dotRed: { backgroundColor: COLORS.red },
  dotYellow: { backgroundColor: COLORS.yellow },
  itemContent: { flex: 1 },
  itemHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  itemEmoji: { fontSize: 16 },
  itemName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  itemDesc: { fontSize: 13, color: COLORS.textDim, lineHeight: 19 },
});
