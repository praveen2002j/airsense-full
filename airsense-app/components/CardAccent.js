import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function CardAccent({ color, radius = 20, width = 4 }) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.accent,
        {
          backgroundColor: color,
          width,
          borderTopLeftRadius: radius,
          borderBottomLeftRadius: radius,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
});
