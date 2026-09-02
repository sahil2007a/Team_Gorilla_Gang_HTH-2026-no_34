import React, { useRef } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, Animated, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { Radius, Spacing } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  fullWidth = true,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();
  };

  const variantStyle = styles[variant] || styles.primary;
  const sizeStyle = styles[`size_${size}`] || styles.size_md;
  const textVariantStyle = textStyles[variant] || textStyles.primary;
  const textSizeStyle = textStyles[`size_${size}`] || textStyles.size_md;

  return (
    <Animated.View style={[{ transform: [{ scale }] }, fullWidth && { width: '100%' }]}>
      <TouchableOpacity
        style={[styles.base, variantStyle, sizeStyle, disabled && styles.disabled, style]}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled || loading}
        activeOpacity={0.9}
      >
        {loading ? (
          <ActivityIndicator color={variant === 'primary' ? '#fff' : Colors.primary} size="small" />
        ) : (
          <>
            {icon}
            <Text style={[textStyles.base, textVariantStyle, textSizeStyle, textStyle]}>{title}</Text>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: Radius.md,
  },
  primary: {
    backgroundColor: Colors.primary,
  },
  secondary: {
    backgroundColor: Colors.primaryLight,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: Colors.danger,
  },
  size_sm: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 36,
  },
  size_md: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    minHeight: 48,
  },
  size_lg: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.base,
    minHeight: 56,
  },
  disabled: {
    opacity: 0.5,
  },
});

const textStyles = StyleSheet.create({
  base: {
    fontWeight: FontWeight.semibold,
    textAlign: 'center',
  },
  primary: { color: '#fff' },
  secondary: { color: Colors.primary },
  outline: { color: Colors.primary },
  ghost: { color: Colors.primary },
  danger: { color: '#fff' },
  size_sm: { fontSize: FontSize.sm },
  size_md: { fontSize: FontSize.base },
  size_lg: { fontSize: FontSize.md },
});
