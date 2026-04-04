import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions } from 'react-native';
import { useGame } from '../hooks/useGame';
import { COLORS } from '../data/constants';

const { width } = Dimensions.get('window');

export default function EventChoiceModal() {
  const { state, doResolveChoice } = useGame();
  const pending = state.pendingChoice;
  if (!pending) return null;

  const { event } = pending;

  return (
    <Modal transparent animationType="slide" visible={!!pending}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.emoji}>{event.emoji}</Text>
          <Text style={styles.title}>{event.name}</Text>
          <Text style={styles.desc}>{event.description}</Text>

          <View style={styles.divider} />

          <Text style={styles.question}>Que faites-vous ?</Text>

          {event.choices?.map((choice, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.choiceBtn, i === 0 && styles.choicePrimary]}
              onPress={() => doResolveChoice(i)}
              activeOpacity={0.7}
            >
              <Text style={styles.choiceEmoji}>{choice.emoji}</Text>
              <View style={styles.choiceText}>
                <Text style={styles.choiceLabel}>{choice.label}</Text>
                <Text style={styles.choiceOutcome}>{choice.outcomeText}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#1a1a3e',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  emoji: { fontSize: 48, textAlign: 'center', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.text, textAlign: 'center', marginBottom: 8 },
  desc: { fontSize: 15, color: COLORS.textDim, textAlign: 'center', lineHeight: 22, marginBottom: 16 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 16 },
  question: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 16 },
  choiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  choicePrimary: {
    borderColor: 'rgba(68,138,255,0.3)',
    backgroundColor: 'rgba(68,138,255,0.08)',
  },
  choiceEmoji: { fontSize: 28, marginRight: 14 },
  choiceText: { flex: 1 },
  choiceLabel: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  choiceOutcome: { fontSize: 12, color: COLORS.textDim, lineHeight: 17 },
});
