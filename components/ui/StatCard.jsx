import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { Radius, Shadow, Spacing } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';

export const StatCard = ({ label, value, unit, icon, color = Colors.primary, bgColor, trend, style }) => (
  <View style={[styles.card, style]}>
    {icon && (
      <View style={[styles.iconWrap, { backgroundColor: bgColor || Colors.primaryLight }]}>
        {icon}
      </View>
    )}
    <Text style={[styles.value, { color }]}>
      {value}
      {unit && <Text style={styles.unit}> {unit}</Text>}
    </Text>
    <Text style={styles.label}>{label}</Text>
    {trend !== undefined && (
      <Text style={[styles.trend, { color: trend >= 0 ? Colors.success : Colors.danger }]}>
        {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
      </Text>
    )}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'flex-start',
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    flex: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  value: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  unit: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.regular,
    color: Colors.textSecondary,
  },
  label: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: FontWeight.medium,
  },
  trend: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    marginTop: 4,
  },
});
