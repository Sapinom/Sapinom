import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';

interface Props {
  children: React.ReactNode;
  active?: boolean;
  intensity?: number;
  speed?: number;
  style?: ViewStyle;
}

export default function PulsingView({ children, active = true, intensity = 0.06, speed = 1500, style }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!active) {
      scale.setValue(1);
      return;
    }

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1 + intensity, duration: speed, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: speed, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [active]);

  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      {children}
    </Animated.View>
  );
}
