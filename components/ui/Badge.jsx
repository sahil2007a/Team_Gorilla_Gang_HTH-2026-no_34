import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { Radius, Spacing } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';

const badgeConfig = {
  primary: { bg: Colors.primaryLight, text: Colors.primary },
  success: { bg: '#E6F7EE', text: Colors.success },
  warning: { bg: '#FEF6E4', text: Colors.warning },
  danger: { bg: '#FDECEA', text: Colors.danger },
  info: { bg: '#E8F0FE', text: Colors.info },
  muted: { bg: Colors.background, text: Colors.textSecondary },
  high: { bg: '#FDECEA', text: Colors.danger },
  medium: { bg: '#FEF6E4', text: Colors.warning },
  low: { bg: '#E6F7EE', text: Colors.success },
  completed: { bg: Colors.background, text: Colors.textMuted },
};

export const Badge = ({ label, variant = 'primary', dot = false, style }) => {
  const config = badgeConfig[variant] || badgeConfig.primary;
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, style]}>
      {dot && <View style={[styles.dot, { backgroundColor: config.text }]} />}
      <Text style={[styles.text, { color: config.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    gap: 4,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.2,
  },
});
