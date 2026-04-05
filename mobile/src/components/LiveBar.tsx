import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';

interface Props {
  percent: number;
  color: string;
  height?: number;
  bgColor?: string;
}

export default function LiveBar({ percent, color, height = 6, bgColor = 'rgba(255,255,255,0.08)' }: Props) {
  const width = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(width, {
      toValue: percent,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [percent]);

  return (
    <View style={[styles.bar, { height, backgroundColor: bgColor }]}>
      <Animated.View
        style={[
          styles.fill,
          {
            height,
            backgroundColor: color,
            width: width.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
              extrapolate: 'clamp',
            }),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { borderRadius: 4, overflow: 'hidden', width: '100%' },
  fill: { borderRadius: 4 },
});
