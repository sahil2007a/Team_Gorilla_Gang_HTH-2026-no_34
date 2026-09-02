import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { Radius, Shadow, Spacing } from '../constants/spacing';
import { FontSize, FontWeight } from '../constants/typography';
import { Badge } from './ui/Badge';
import { ProgressBar } from './ui/ProgressBar';
import { Thermometer, Droplets, Sun, Wind } from 'lucide-react-native';

const iconMap = {
  temperature: Thermometer,
  humidity: Droplets,
  soilMoisture: Droplets,
  light: Sun,
};

const colorMap = {
  temperature: Colors.danger,
  humidity: Colors.info,
  soilMoisture: Colors.primary,
  light: Colors.warning,
};

const bgMap = {
  temperature: '#FDECEA',
  humidity: '#E8F0FE',
  soilMoisture: Colors.primaryLight,
  light: '#FEF6E4',
};

export const SensorCard = ({ type, label, reading }) => {
  const pulse = useRef(new Animated.Value(1)).current;
  const IconComp = iconMap[type] || Thermometer;
  const color = colorMap[type] || Colors.primary;
  const bgColor = bgMap[type] || Colors.primaryLight;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.15, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const percent = reading
    ? Math.round(((reading.value - reading.min) / (reading.max - reading.min)) * 100)
    : 0;

  const statusVariant = reading?.status === 'normal' ? 'success' : reading?.status === 'low' ? 'warning' : 'danger';

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: bgColor }]}>
          <IconComp size={18} color={color} />
        </View>
        <View style={styles.statusDot}>
          <Animated.View style={[styles.dot, { backgroundColor: Colors.success, transform: [{ scale: pulse }] }]} />
        </View>
      </View>
      <Text style={[styles.value, { color }]}>
        {reading?.value}
        <Text style={styles.unit}>{reading?.unit}</Text>
      </Text>
      <Text style={styles.label}>{label}</Text>
      <ProgressBar progress={percent} color={color} height={4} style={{ marginVertical: 6 }} />
      <Badge label={reading?.status === 'normal' ? 'Normal' : reading?.status === 'low' ? 'Low' : 'High'} variant={statusVariant} />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    flex: 1,
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: { alignItems: 'center', justifyContent: 'center' },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  value: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    letterSpacing: -0.5,
  },
  unit: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.regular,
    color: Colors.textSecondary,
  },
  label: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
});
