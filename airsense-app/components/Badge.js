import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../styles/theme';

export default function Badge({ label, status = 'Safe' }) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  let backgroundColor = theme.colors.green;

  if (status === 'Critical') backgroundColor = theme.colors.red;
  else if (status === 'Warning' || status === 'Moderate') backgroundColor = theme.colors.yellow;
  else if (status === 'Excellent' || status === 'Good') backgroundColor = theme.colors.green;

  return (
    <View style={[styles.container, { backgroundColor: backgroundColor + '20', borderColor: backgroundColor + '45' }]}>
      <View style={[styles.dot, { backgroundColor }]} />
      <Text style={[styles.label, { color: backgroundColor }]}>{label}</Text>
    </View>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.pill,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
});
