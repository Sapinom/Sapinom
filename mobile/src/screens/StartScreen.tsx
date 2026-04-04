import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { COLORS } from '../data/constants';
import { useGame } from '../hooks/useGame';

export default function StartScreen() {
  const [name, setName] = useState('');
  const { start } = useGame();

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.inner}>
        <Text style={styles.emoji}>🏙️</Text>
        <Text style={styles.title}>Business{'\n'}Simulator</Text>
        <Text style={styles.tagline}>Pars de zéro. Construis un empire.</Text>

        <TextInput
          style={styles.input}
          placeholder="Ton nom..."
          placeholderTextColor="#555"
          value={name}
          onChangeText={setName}
          maxLength={20}
          returnKeyType="go"
          onSubmitEditing={() => start(name || 'Joueur')}
        />

        <TouchableOpacity
          style={styles.btn}
          onPress={() => start(name || 'Joueur')}
          activeOpacity={0.8}
        >
          <Text style={styles.btnText}>Commencer 🚀</Text>
        </TouchableOpacity>

        <View style={styles.features}>
          <Text style={styles.feature}>🍽️ 8 types de business</Text>
          <Text style={styles.feature}>⛈️ Météo dynamique</Text>
          <Text style={styles.feature}>📈 Économie réaliste</Text>
          <Text style={styles.feature}>🎲 Événements aléatoires</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
  },
  inner: {
    alignItems: 'center',
    padding: 32,
  },
  emoji: { fontSize: 64, marginBottom: 16 },
  title: {
    fontSize: 40,
    fontWeight: '900',
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 46,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: COLORS.textDim,
    marginBottom: 40,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 18,
    fontSize: 18,
    color: COLORS.text,
    width: '100%',
    textAlign: 'center',
    marginBottom: 20,
  },
  btn: {
    backgroundColor: COLORS.blue,
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
  },
  btnText: { fontSize: 18, fontWeight: '800', color: 'white' },
  features: { gap: 8 },
  feature: { fontSize: 14, color: COLORS.textDim },
});
