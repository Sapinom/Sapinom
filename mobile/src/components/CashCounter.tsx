import React, { useEffect, useRef, useState } from 'react';
import { Text, Animated, StyleSheet } from 'react-native';
import { COLORS } from '../data/constants';
import { fmt } from '../utils/random';

interface Props {
  value: number;
  size?: number;
}

export default function CashCounter({ value, size = 32 }: Props) {
  const [display, setDisplay] = useState(value);
  const animValue = useRef(new Animated.Value(0)).current;
  const prevValue = useRef(value);

  useEffect(() => {
    const diff = value - prevValue.current;
    if (diff !== 0) {
      // Animate flash
      Animated.sequence([
        Animated.timing(animValue, { toValue: diff > 0 ? 1 : -1, duration: 150, useNativeDriver: false }),
        Animated.timing(animValue, { toValue: 0, duration: 300, useNativeDriver: false }),
      ]).start();

      // Smooth count
      const start = prevValue.current;
      const steps = 10;
      const step = diff / steps;
      let i = 0;
      const timer = setInterval(() => {
        i++;
        if (i >= steps) {
          setDisplay(value);
          clearInterval(timer);
        } else {
          setDisplay(Math.round(start + step * i));
        }
      }, 30);

      prevValue.current = value;
      return () => clearInterval(timer);
    }
  }, [value]);

  const color = animValue.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [COLORS.red, display >= 0 ? COLORS.green : COLORS.red, COLORS.green],
  });

  return (
    <Animated.Text style={[styles.cash, { fontSize: size, color }]}>
      {fmt(display)}$
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  cash: { fontWeight: '800', fontVariant: ['tabular-nums'] },
});
