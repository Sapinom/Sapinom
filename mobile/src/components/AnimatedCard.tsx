import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';

interface Props {
  children: React.ReactNode;
  delay?: number;
  style?: ViewStyle;
  direction?: 'left' | 'right' | 'up';
}

export default function AnimatedCard({ children, delay = 0, style, direction = 'up' }: Props) {
  const translateX = useRef(new Animated.Value(direction === 'left' ? -60 : direction === 'right' ? 60 : 0)).current;
  const translateY = useRef(new Animated.Value(direction === 'up' ? 40 : 0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 350,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateX }, { translateY }] }]}>
      {children}
    </Animated.View>
  );
}
