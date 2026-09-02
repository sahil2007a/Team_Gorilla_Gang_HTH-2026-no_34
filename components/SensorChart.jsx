import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Polyline, Line, Circle as SvgCircle } from 'react-native-svg';
import { Colors } from '../constants/colors';
import { Radius, Shadow, Spacing } from '../constants/spacing';
import { FontSize, FontWeight } from '../constants/typography';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_PADDING = 32;
const CHART_HEIGHT = 100;

export const SensorChart = ({ title, data = [], unit = '', color = Colors.primary, style }) => {
  if (!data.length) return null;

  const chartWidth = SCREEN_WIDTH - CHART_PADDING * 2 - 32;
  const values = data.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const xStep = chartWidth / (data.length - 1);
  const points = data.map((d, i) => ({
    x: i * xStep,
    y: CHART_HEIGHT - ((d.value - minVal) / range) * (CHART_HEIGHT - 16) - 8,
  }));

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  const labelStep = Math.ceil(data.length / 6);
  const labels = data.filter((_, i) => i % labelStep === 0 || i === data.length - 1);

  const currentValue = values[values.length - 1];

  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={[styles.currentValue, { color }]}>
          {currentValue}
          <Text style={styles.unit}>{unit}</Text>
        </Text>
      </View>
      <Svg width={chartWidth} height={CHART_HEIGHT + 20}>
        {/* Grid lines */}
        {[0, 0.5, 1].map((t, i) => (
          <Line
            key={i}
            x1={0}
            y1={CHART_HEIGHT - t * (CHART_HEIGHT - 16) - 8}
            x2={chartWidth}
            y2={CHART_HEIGHT - t * (CHART_HEIGHT - 16) - 8}
            stroke={Colors.border}
            strokeWidth={1}
            strokeDasharray="4 4"
          />
        ))}
        {/* Line */}
        <Polyline
          points={polylinePoints}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* End dot */}
        <SvgCircle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r={4}
          fill={color}
        />
      </Svg>
      {/* X-axis labels */}
      <View style={[styles.xLabels, { width: chartWidth }]}>
        {labels.map((d, i) => (
          <Text key={i} style={styles.xLabel}>{d.label}</Text>
        ))}
      </View>
      <View style={styles.rangeLegend}>
        <Text style={styles.rangeText}>Min: {minVal.toFixed(1)}{unit}</Text>
        <Text style={styles.rangeText}>Max: {maxVal.toFixed(1)}{unit}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  currentValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  unit: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.regular,
    color: Colors.textSecondary,
  },
  xLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  xLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  rangeLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  rangeText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
});
