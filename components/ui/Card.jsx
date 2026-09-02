import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { Radius, Shadow, Spacing } from '../../constants/spacing';

export const Card = ({ children, style, variant = 'default', onPress, ...props }) => {
  const variantStyle = variant === 'elevated' ? styles.elevated : variant === 'flat' ? styles.flat : styles.default;
  return (
    <View style={[styles.card, variantStyle, style]} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
  },
  default: {
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  elevated: {
    ...Shadow.md,
  },
  flat: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
