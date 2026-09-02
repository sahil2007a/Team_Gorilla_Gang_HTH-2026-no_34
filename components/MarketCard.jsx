import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { Radius, Shadow, Spacing } from '../constants/spacing';
import { FontSize, FontWeight } from '../constants/typography';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react-native';

export const MarketCard = ({ mandi }) => {
  const TrendIcon = mandi.trend === 'up' ? TrendingUp : mandi.trend === 'down' ? TrendingDown : Minus;
  const trendColor = mandi.trend === 'up' ? Colors.success : mandi.trend === 'down' ? Colors.danger : Colors.textMuted;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View>
          <Text style={styles.name}>{mandi.name}</Text>
          <Text style={styles.distance}>{mandi.distance}</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{mandi.price.toLocaleString('en-IN')}</Text>
          <TrendIcon size={14} color={trendColor} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  distance: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  price: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
});
