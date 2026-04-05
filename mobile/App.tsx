import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { IdleGameProvider, useIdleGame } from './src/hooks/useIdleGame';
import StartScreen from './src/screens/StartScreen';
import IdleGameScreen from './src/screens/IdleGameScreen';

function GameRouter() {
  const { state } = useIdleGame();

  if (!state.started || !state.playerName) {
    return <StartScreenIdle />;
  }

  return (
    <>
      <IdleGameScreen />
      <StatusBar style="light" />
    </>
  );
}

function StartScreenIdle() {
  const { start } = useIdleGame();
  const StartScreenComp = require('./src/screens/StartScreen').default;

  // Override the start screen to use idle game
  return <StartScreenWrapper onStart={start} />;
}

// Simple start screen that works with idle engine
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { COLORS } from './src/data/constants';

function StartScreenWrapper({ onStart }: { onStart: (name: string) => void }) {
  const [name, setName] = React.useState('');

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.inner}>
        <Text style={s.emoji}>🏙️</Text>
        <Text style={s.title}>Business{'\n'}Simulator</Text>
        <Text style={s.tagline}>Pars de zéro. Construis un empire.</Text>

        <TextInput
          style={s.input}
          placeholder="Ton nom..."
          placeholderTextColor="#555"
          value={name}
          onChangeText={setName}
          maxLength={20}
          returnKeyType="go"
          onSubmitEditing={() => onStart(name || 'Joueur')}
        />

        <TouchableOpacity style={s.btn} onPress={() => onStart(name || 'Joueur')} activeOpacity={0.8}>
          <Text style={s.btnText}>Commencer 🚀</Text>
        </TouchableOpacity>

        <View style={s.features}>
          <Text style={s.feature}>👆 Tap pour gagner</Text>
          <Text style={s.feature}>🏢 8 business à débloquer</Text>
          <Text style={s.feature}>⛈️ Météo dynamique</Text>
          <Text style={s.feature}>🎲 Événements aléatoires</Text>
          <Text style={s.feature}>🤵 Managers automatiques</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center' },
  inner: { alignItems: 'center', padding: 32 },
  emoji: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 40, fontWeight: '900', color: COLORS.text, textAlign: 'center', lineHeight: 46, marginBottom: 8 },
  tagline: { fontSize: 16, color: COLORS.textDim, marginBottom: 40 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16, padding: 18, fontSize: 18, color: COLORS.text, width: '100%', textAlign: 'center', marginBottom: 20,
  },
  btn: { backgroundColor: COLORS.blue, paddingVertical: 18, paddingHorizontal: 48, borderRadius: 16, width: '100%', alignItems: 'center', marginBottom: 40 },
  btnText: { fontSize: 18, fontWeight: '800', color: 'white' },
  features: { gap: 8 },
  feature: { fontSize: 14, color: COLORS.textDim },
});

export default function App() {
  return (
    <IdleGameProvider>
      <GameRouter />
    </IdleGameProvider>
  );
}
