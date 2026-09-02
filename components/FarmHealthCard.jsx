import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { Radius, Shadow, Spacing } from '../constants/spacing';
import { FontSize, FontWeight } from '../constants/typography';
import { ProgressBar } from './ui/ProgressBar';
import { Badge } from './ui/Badge';
import { Leaf, Droplets, ShieldCheck } from 'lucide-react-native';
import { useLanguage } from '../context/LanguageContext';

export const FarmHealthCard = ({ farm }) => {
  const { t } = useLanguage();
  if (!farm) return null;

  const getHealthColor = (score) => {
    if (score >= 80) return Colors.success;
    if (score >= 60) return Colors.warning;
    return Colors.danger;
  };

  const color = getHealthColor(farm.healthScore);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.cardTitle}>{t('Farm Health')}</Text>
          <View style={styles.scoreRow}>
            <Text style={[styles.score, { color }]}>{farm.healthScore}</Text>
            <Text style={styles.scoreMax}> / 100</Text>
          </View>
          <Badge label={t(farm.healthLabel || 'Good')} variant={farm.healthScore >= 80 ? 'success' : farm.healthScore >= 60 ? 'warning' : 'danger'} />
        </View>
        <View style={[styles.scoreCircle, { borderColor: color }]}>
          <Text style={[styles.circleScore, { color }]}>{farm.healthScore}</Text>
          <Text style={styles.circleLabel}>{t('Health')}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.metrics}>
        <View style={styles.metric}>
          <View style={styles.metricHeader}>
            <Leaf size={14} color={Colors.success} />
            <Text style={styles.metricLabel}>{t('Growth')}</Text>
          </View>
          <ProgressBar progress={farm.growthPercent} color={Colors.success} height={6} />
          <Text style={styles.metricValue}>{farm.growthPercent}%</Text>
        </View>

        <View style={styles.metric}>
          <View style={styles.metricHeader}>
            <Droplets size={14} color={Colors.info} />
            <Text style={styles.metricLabel}>{t('Water')}</Text>
          </View>
          <ProgressBar progress={farm.waterPercent} color={Colors.info} height={6} />
          <Text style={styles.metricValue}>{farm.waterPercent}%</Text>
        </View>

        <View style={styles.metric}>
          <View style={styles.metricHeader}>
            <ShieldCheck size={14} color={Colors.success} />
            <Text style={styles.metricLabel}>{t('Disease Risk')}</Text>
          </View>
          <Badge label={t(farm.diseaseRisk || 'Low')} variant={farm.diseaseRisk === 'Low' ? 'success' : farm.diseaseRisk === 'Medium' ? 'warning' : 'danger'} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    ...Shadow.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
    marginBottom: 4,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  score: {
    fontSize: 36,
    fontWeight: FontWeight.bold,
    letterSpacing: -1,
  },
  scoreMax: {
    fontSize: FontSize.base,
    color: Colors.textMuted,
  },
  scoreCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleScore: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  circleLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: Spacing.md,
  },
  metrics: {
    gap: Spacing.md,
  },
  metric: {
    gap: 6,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  metricValue: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    alignSelf: 'flex-end',
  },
});
