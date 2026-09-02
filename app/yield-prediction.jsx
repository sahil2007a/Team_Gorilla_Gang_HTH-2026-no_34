import { useLanguage } from '../context/LanguageContext';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

import { useRouter } from 'expo-router';
import Svg, { Polyline, Line, Circle as SvgCircle, Polygon } from 'react-native-svg';
import { Colors } from '../constants/colors';
import { Spacing, Radius, Shadow } from '../constants/spacing';
import { FontSize, FontWeight } from '../constants/typography';
import { farmService } from '../services/farmService';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { ArrowLeft, BarChart2, AlertCircle } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const BarChart = ({ data }) => {
  const padding = 32 + 16;
  const width = SCREEN_WIDTH - padding;
  const height = 100;
  const maxVal = Math.max(...data.map((d) => d.value));
  const barW = (width / data.length) * 0.6;
  const gap = (width / data.length) * 0.4;

  return (
    <Svg width={width} height={height + 24}>
      {data.map((d, i) => {
        const barH = (d.value / maxVal) * (height - 16);
        const x = i * (barW + gap) + gap / 2;
        const y = height - barH - 8;
        return (
          <Polygon
            key={i}
            points={`${x},${y} ${x + barW},${y} ${x + barW},${height - 8} ${x},${height - 8}`}
            fill={i === data.length - 1 ? Colors.primary : Colors.primaryLight}
            rx={4}
          />
        );
      })}
    </Svg>
  );
};

const FactorRow = ({ factor }) => {
  const variantMap = { good: 'success', medium: 'warning', low: 'success' };
  return (
    <View style={factorStyles.row}>
      <Text style={factorStyles.label}>{factor.label}</Text>
      <View style={factorStyles.right}>
        <ProgressBar progress={factor.score} color={factor.status === 'good' ? Colors.success : factor.status === 'medium' ? Colors.warning : Colors.textMuted} height={6} style={{ width: 80 }} />
        <Badge label={factor.status === 'good' ? 'Good' : factor.status === 'medium' ? 'Medium' : 'Low'} variant={variantMap[factor.status]} />
      </View>
    </View>
  );
};

const factorStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  label: { fontSize: FontSize.sm, color: Colors.text, fontWeight: FontWeight.medium },
  right: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
});

export default function YieldPredictionScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const [data, setData] = useState(null);

  useEffect(() => {
    farmService.getYieldPrediction('farm_001').then((r) => setData(r.data));
  }, []);

  if (!data) return null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
            <ArrowLeft size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('Yield Prediction')}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Hero */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>{t('Expected Yield')}</Text>
          <Text style={styles.heroValue}>{data.expectedYieldPerAcre}</Text>
          <Text style={styles.heroUnit}>{data.expectedYieldUnit}</Text>

          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{data.totalExpectedProduction}</Text>
              <Text style={styles.heroStatLabel}>{t('Total Quintals')}</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Badge label={data.riskLevel} variant={data.riskLevel === 'Low' ? 'success' : data.riskLevel === 'High' ? 'danger' : 'warning'} />
              <Text style={styles.heroStatLabel}>{t('Risk Level')}</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{data.predictionConfidence}%</Text>
              <Text style={styles.heroStatLabel}>{t('Confidence')}</Text>
            </View>
          </View>

          <View style={styles.confidenceSection}>
            <Text style={styles.confidenceLabel}>{t('Prediction Confidence')}</Text>
            <ProgressBar progress={data.predictionConfidence} color={Colors.success} height={8} />
          </View>
        </View>

        {/* Growth Projection Chart */}
        <SectionHeader title={t('Production Projection')} style={{ marginTop: Spacing.base }} />
        <View style={styles.chartCard}>
          <BarChart data={data.monthlyTrend} />
          <View style={styles.xLabels}>
            {data.monthlyTrend.map((d, i) => (
              <Text key={i} style={styles.xLabel}>{d.month}</Text>
            ))}
          </View>
        </View>

        {/* Factors */}
        <SectionHeader title={t('Influencing Factors')} style={{ marginTop: Spacing.base }} />
        <View style={styles.factorsCard}>
          {data.factors.map((f) => (
            <FactorRow key={f.label} factor={f} />
          ))}
        </View>

        <View style={{ height: Spacing['2xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.base },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.base,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    ...Shadow.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  heroLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  heroValue: {
    fontSize: 56,
    fontWeight: FontWeight.extrabold,
    color: Colors.primary,
    letterSpacing: -2,
    lineHeight: 64,
  },
  heroUnit: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.base },
  heroStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.md,
  },
  heroStat: { alignItems: 'center', gap: 4, flex: 1 },
  heroStatValue: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
  heroStatLabel: { fontSize: FontSize.xs, color: Colors.textSecondary },
  heroStatDivider: { width: 1, height: 36, backgroundColor: Colors.border },
  confidenceSection: { gap: Spacing.sm },
  confidenceLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  chartCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  xLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 4,
  },
  xLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  factorsCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
