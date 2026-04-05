import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { COLORS } from '../data/constants';
import { fmt } from '../utils/random';

interface FloatingNumber {
  id: number;
  value: number;
  x: number;
}

let nextFloatId = 0;

export default function FloatingProfit({ value, trigger }: { value: number; trigger: number }) {
  const floats = useRef<FloatingNumber[]>([]);
  const [, setTick] = React.useState(0);
  const prevValue = useRef(value);
  const prevTrigger = useRef(trigger);

  useEffect(() => {
    if (trigger !== prevTrigger.current && value !== prevValue.current) {
      const diff = value - prevValue.current;
      if (Math.abs(diff) > 1) {
        floats.current.push({
          id: nextFloatId++,
          value: Math.round(diff),
          x: 30 + Math.random() * 40,
        });
        if (floats.current.length > 6) floats.current.shift();
        setTick(t => t + 1);
      }
      prevValue.current = value;
      prevTrigger.current = trigger;
    }
  }, [trigger, value]);

  return (
    <View style={styles.container} pointerEvents="none">
      {floats.current.map(f => (
        <FloatingItem key={f.id} value={f.value} x={f.x} onDone={() => {
          floats.current = floats.current.filter(ff => ff.id !== f.id);
        }} />
      ))}
    </View>
  );
}

function FloatingItem({ value, x, onDone }: { value: number; x: number; onDone: () => void }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -80, duration: 1500, useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.2, duration: 200, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.delay(800),
        Animated.timing(opacity, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
    ]).start(onDone);
  }, []);

  const color = value >= 0 ? COLORS.green : COLORS.red;
  const text = value >= 0 ? `+${fmt(value)}$` : `${fmt(value)}$`;

  return (
    <Animated.Text
      style={[
        styles.float,
        { color, left: `${x}%`, transform: [{ translateY }, { scale }], opacity },
      ]}
    >
      {text}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    overflow: 'hidden',
  },
  float: {
    position: 'absolute',
    top: '30%',
    fontSize: 20,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
