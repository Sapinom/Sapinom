import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Modal } from 'react-native';
import { useGame } from '../hooks/useGame';
import { BUSINESS_TEMPLATES } from '../data/businesses';
import { COLORS } from '../data/constants';
import { fmt } from '../utils/random';

export default function MarketScreen() {
  const { state, doOpenBusiness } = useGame();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [bizName, setBizName] = useState('');
  const [bizCity, setBizCity] = useState('Paris');

  const handleBuy = () => {
    if (!selectedType) return;
    const err = doOpenBusiness(selectedType, bizName, bizCity);
    if (err) {
      // Could show an alert, but for now just close
    }
    setSelectedType(null);
    setBizName('');
  };

  const types = Object.entries(BUSINESS_TEMPLATES);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>🛒 Marché</Text>
      <Text style={styles.subtitle}>Investis dans un nouveau business</Text>

      <View style={styles.grid}>
        {types.map(([key, t]) => {
          const canBuy = state.player.cash >= t.cost;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.card, !canBuy && styles.cardDisabled]}
              onPress={() => { if (canBuy) { setSelectedType(key); setBizName(t.name); } }}
              activeOpacity={0.7}
            >
              <Text style={styles.cardEmoji}>{t.emoji}</Text>
              <Text style={styles.cardName}>{t.name}</Text>
              <Text style={styles.cardCost}>{fmt(t.cost)}$</Text>
              <Text style={styles.cardRev}>~{fmt(t.dailyRevenue)}$/jour</Text>
              <Text style={styles.cardDesc} numberOfLines={2}>{t.description}</Text>
              <View style={[styles.buyTag, canBuy ? styles.buyTagGreen : styles.buyTagGray]}>
                <Text style={styles.buyTagText}>{canBuy ? 'Acheter' : 'Trop cher'}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Buy modal */}
      <Modal transparent animationType="slide" visible={!!selectedType}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            {selectedType && (
              <>
                <Text style={styles.modalEmoji}>{BUSINESS_TEMPLATES[selectedType].emoji}</Text>
                <Text style={styles.modalTitle}>Ouvrir un {BUSINESS_TEMPLATES[selectedType].name}</Text>
                <Text style={styles.modalCost}>{fmt(BUSINESS_TEMPLATES[selectedType].cost)}$</Text>

                <Text style={styles.label}>Nom du business</Text>
                <TextInput
                  style={styles.input}
                  value={bizName}
                  onChangeText={setBizName}
                  placeholder={BUSINESS_TEMPLATES[selectedType].name}
                  placeholderTextColor="#555"
                />

                <Text style={styles.label}>Ville</Text>
                <TextInput
                  style={styles.input}
                  value={bizCity}
                  onChangeText={setBizCity}
                  placeholder="Paris"
                  placeholderTextColor="#555"
                />

                <TouchableOpacity style={styles.confirmBtn} onPress={handleBuy} activeOpacity={0.8}>
                  <Text style={styles.confirmText}>Confirmer l'achat 💰</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setSelectedType(null)}>
                  <Text style={styles.cancelText}>Annuler</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16, paddingBottom: 100 },
  title: { fontSize: 24, fontWeight: '900', color: COLORS.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: COLORS.textDim, marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: {
    width: '48%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', alignItems: 'center',
  },
  cardDisabled: { opacity: 0.4 },
  cardEmoji: { fontSize: 36, marginBottom: 8 },
  cardName: { fontSize: 14, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  cardCost: { fontSize: 16, fontWeight: '700', color: COLORS.yellow, marginBottom: 2 },
  cardRev: { fontSize: 11, color: COLORS.green, marginBottom: 6 },
  cardDesc: { fontSize: 10, color: COLORS.textDim, textAlign: 'center', lineHeight: 14, marginBottom: 10, minHeight: 28 },
  buyTag: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10 },
  buyTagGreen: { backgroundColor: 'rgba(0,230,118,0.15)' },
  buyTagGray: { backgroundColor: 'rgba(255,255,255,0.06)' },
  buyTagText: { fontSize: 12, fontWeight: '700', color: COLORS.text },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#1a1a3e', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  modalEmoji: { fontSize: 48, textAlign: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, textAlign: 'center', marginBottom: 4 },
  modalCost: { fontSize: 24, fontWeight: '900', color: COLORS.yellow, textAlign: 'center', marginBottom: 20 },
  label: { fontSize: 13, color: COLORS.textDim, marginBottom: 6, marginTop: 8 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12, padding: 14, fontSize: 16, color: COLORS.text,
  },
  confirmBtn: { backgroundColor: COLORS.green, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  confirmText: { fontSize: 16, fontWeight: '800', color: '#000' },
  cancelBtn: { paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  cancelText: { fontSize: 14, color: COLORS.textDim },
});
