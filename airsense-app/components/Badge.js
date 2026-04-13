import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../styles/theme';

export default function Badge({ label, status = 'Safe' }) {
  let backgroundColor = theme.colors.green;
  
  if (status === 'Critical') backgroundColor = theme.colors.red;
  else if (status === 'Warning' || status === 'Moderate') backgroundColor = theme.colors.yellow;
  else if (status === 'Excellent' || status === 'Good') backgroundColor = theme.colors.green;

  return (
    <View style={[styles.container, { backgroundColor: backgroundColor + '33' }]}> 
      <View style={[styles.dot, { backgroundColor }]} />
      <Text style={[styles.label, { color: backgroundColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: theme.borderRadius.lg,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});
