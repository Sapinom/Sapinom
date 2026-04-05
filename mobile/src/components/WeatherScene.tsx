import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../data/constants';

const { width: SCREEN_W } = Dimensions.get('window');

interface Particle {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  char: string;
  size: number;
}

let particleId = 0;

export default function WeatherScene({ weather }: { weather: string }) {
  const particles = useRef<Particle[]>([]);
  const [, forceUpdate] = React.useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getParticleChar = () => {
    switch (weather) {
      case 'rain': return '💧';
      case 'storm': return '⚡';
      case 'snow': return '❄️';
      case 'heatwave': return '🔥';
      case 'flood': return '🌊';
      case 'sun': return '✨';
      default: return '';
    }
  };

  const spawnParticle = () => {
    const char = getParticleChar();
    if (!char) return;

    const p: Particle = {
      id: particleId++,
      x: new Animated.Value(Math.random() * SCREEN_W),
      y: new Animated.Value(-20),
      opacity: new Animated.Value(0.7),
      char,
      size: 10 + Math.random() * 14,
    };

    particles.current.push(p);
    if (particles.current.length > 15) particles.current.shift();
    forceUpdate(t => t + 1);

    const duration = weather === 'snow' ? 3000 + Math.random() * 2000 : 1500 + Math.random() * 1000;

    Animated.parallel([
      Animated.timing(p.y, {
        toValue: 200,
        duration,
        useNativeDriver: true,
      }),
      Animated.timing(p.opacity, {
        toValue: 0,
        duration,
        useNativeDriver: true,
      }),
      // Drift sideways for snow
      ...(weather === 'snow' ? [
        Animated.timing(p.x, {
          toValue: (p.x as any)._value + (Math.random() - 0.5) * 80,
          duration,
          useNativeDriver: true,
        }),
      ] : []),
    ]).start(() => {
      particles.current = particles.current.filter(pp => pp.id !== p.id);
    });
  };

  useEffect(() => {
    particles.current = [];
    if (intervalRef.current) clearInterval(intervalRef.current);

    const rate = weather === 'rain' ? 200 : weather === 'storm' ? 150 : weather === 'snow' ? 400 : weather === 'sun' ? 800 : 600;
    if (['rain', 'storm', 'snow', 'heatwave', 'flood', 'sun'].includes(weather)) {
      intervalRef.current = setInterval(spawnParticle, rate);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [weather]);

  if (!['rain', 'storm', 'snow', 'heatwave', 'flood', 'sun'].includes(weather)) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.current.map(p => (
        <Animated.Text
          key={p.id}
          style={[
            styles.particle,
            {
              fontSize: p.size,
              opacity: p.opacity,
              transform: [
                { translateX: p.x as any },
                { translateY: p.y },
              ],
            },
          ]}
        >
          {p.char}
        </Animated.Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 200,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
  },
});
