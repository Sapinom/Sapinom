import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Slider from '@react-native-community/slider';
import { useGame } from '../hooks/useGame';
import { COLORS } from '../data/constants';
import { fmt } from '../utils/random';

export default function BankScreen() {
  const { state, doLoan } = useGame();
  const [amount, setAmount] = useState(10000);
  const [months, setMonths] = useState(12);

  const rate = state.world.interestRate;
  const mr = rate / 12;
  const monthly = mr > 0 ? (amount * mr) / (1 - Math.pow(1 + mr, -months)) : amount / months;
  const totalDebt = state.loans.reduce((s, l) => s + l.remaining, 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>🏦 Banque</Text>

      {/* Debt summary */}
      <View style={styles.debtCard}>
        <Text style={styles.debtLabel}>Dette totale</Text>
        <Text style={[styles.debtAmount, totalDebt > 0 && { color: COLORS.red }]}>
          {fmt(totalDebt)}$
        </Text>
        <Text style={styles.debtSub}>
          Taux actuel: {(rate * 100).toFixed(1)}%
        </Text>
      </View>

      {/* Active loans */}
      {state.loans.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emprunts en cours</Text>
          {state.loans.map(l => {
            const pct = Math.round((1 - l.monthsLeft / l.totalMonths) * 100);
            return (
              <View key={l.id} style={styles.loanCard}>
                <View style={styles.loanHeader}>
                  <Text style={styles.loanAmount}>{fmt(l.amount)}$</Text>
                  <Text style={styles.loanMonths}>{l.monthsLeft} mois restants</Text>
                </View>
                <View style={styles.loanDetails}>
                  <Text style={styles.loanDetail}>Mensualité: {fmt(l.monthly)}$</Text>
                  <Text style={styles.loanDetail}>Taux: {(l.rate * 100).toFixed(1)}%</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${pct}%` }]} />
                </View>
                <Text style={styles.progressText}>{pct}% remboursé</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* New loan form */}
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>💰 Nouvel emprunt</Text>

        <Text style={styles.label}>Montant: {fmt(amount)}$</Text>
        <Slider
          minimumValue={1000}
          maximumValue={100000}
          step={1000}
          value={amount}
          onValueChange={setAmount}
          minimumTrackTintColor={COLORS.blue}
          maximumTrackTintColor="rgba(255,255,255,0.1)"
          thumbTintColor={COLORS.blue}
          style={{ marginBottom: 16 }}
        />

        <Text style={styles.label}>Durée: {months} mois</Text>
        <Slider
          minimumValue={6}
          maximumValue={60}
          step={6}
          value={months}
          onValueChange={setMonths}
          minimumTrackTintColor={COLORS.purple}
          maximumTrackTintColor="rgba(255,255,255,0.1)"
          thumbTintColor={COLORS.purple}
          style={{ marginBottom: 20 }}
        />

        <View style={styles.preview}>
          <Text style={styles.previewLabel}>Mensualité estimée</Text>
          <Text style={styles.previewAmount}>{fmt(Math.round(monthly))}$/mois</Text>
          <Text style={styles.previewSub}>
            Coût total: {fmt(Math.round(monthly * months))}$ (dont {fmt(Math.round(monthly * months - amount))}$ d'intérêts)
          </Text>
        </View>

        <TouchableOpacity
          style={styles.loanBtn}
          onPress={() => doLoan(amount, months)}
          activeOpacity={0.8}
        >
          <Text style={styles.loanBtnText}>Emprunter {fmt(amount)}$ 💰</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16, paddingBottom: 100 },
  title: { fontSize: 24, fontWeight: '900', color: COLORS.text, marginBottom: 16 },

  debtCard: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 20,
    alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  debtLabel: { fontSize: 13, color: COLORS.textDim, marginBottom: 4 },
  debtAmount: { fontSize: 32, fontWeight: '900', color: COLORS.green },
  debtSub: { fontSize: 12, color: COLORS.textDim, marginTop: 4 },

  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 10 },

  loanCard: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  loanHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  loanAmount: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  loanMonths: { fontSize: 13, color: COLORS.textDim },
  loanDetails: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  loanDetail: { fontSize: 12, color: COLORS.textDim },
  progressBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.blue, borderRadius: 3 },
  progressText: { fontSize: 11, color: COLORS.textDim, marginTop: 4, textAlign: 'right' },

  formCard: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  formTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 16 },
  label: { fontSize: 13, color: COLORS.textDim, marginBottom: 8 },

  preview: {
    backgroundColor: 'rgba(68,138,255,0.08)', borderRadius: 14, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(68,138,255,0.2)', marginBottom: 16,
  },
  previewLabel: { fontSize: 12, color: COLORS.textDim, marginBottom: 4 },
  previewAmount: { fontSize: 24, fontWeight: '900', color: COLORS.blue },
  previewSub: { fontSize: 11, color: COLORS.textDim, marginTop: 4, textAlign: 'center' },

  loanBtn: { backgroundColor: COLORS.blue, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  loanBtnText: { fontSize: 16, fontWeight: '800', color: 'white' },
});
