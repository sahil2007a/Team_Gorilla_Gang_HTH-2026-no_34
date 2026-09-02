import { useLanguage } from '../context/LanguageContext';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

import { useRouter } from 'expo-router';
import { Colors } from '../constants/colors';
import { Spacing, Radius, Shadow } from '../constants/spacing';
import { FontSize, FontWeight } from '../constants/typography';
import { farmService } from '../services/farmService';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Badge } from '../components/ui/Badge';
import { ArrowLeft, Calendar, Users, Clock, Warehouse, Cpu } from 'lucide-react-native';

export default function HarvestScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const [harvest, setHarvest] = useState(null);

  useEffect(() => {
    farmService.getHarvestPlan('farm_001').then((r) => setHarvest(r.data));
  }, []);

  if (!harvest) return null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
            <ArrowLeft size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('Harvest Planning')}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Harvest Date Hero */}
        <View style={styles.heroCard}>
          <Badge label="Upcoming" variant="info" />
          <Text style={styles.heroLabel}>{t('Estimated Harvest Date')}</Text>
          <Text style={styles.heroDate}>{harvest.estimatedHarvestDate}</Text>
          <View style={styles.readinessRow}>
            <Text style={styles.readinessLabel}>{t('Harvest Readiness')}</Text>
            <Text style={styles.readinessValue}>{harvest.harvestReadiness}%</Text>
          </View>
          <ProgressBar progress={harvest.harvestReadiness} color={Colors.primary} height={10} />
        </View>

        {/* Key Stats */}
        <SectionHeader title={t('Planning Details')} style={{ marginTop: Spacing.base }} />
        <View style={styles.statsGrid}>
          <StatItem icon={<Users size={18} color={Colors.primary} />} label="Labor Required" value={`${harvest.requiredLabor} workers`} />
          <StatItem icon={<Clock size={18} color={Colors.warning} />} label="Duration" value={`${harvest.estimatedDurationDays} days`} />
        </View>
        <View style={[styles.statsGrid, { marginTop: Spacing.sm }]}>
          <StatItem icon={<Warehouse size={18} color={Colors.success} />} label="Storage Required" value={`${harvest.storageRequirementTonnes} tonnes`} />
          <StatItem icon={<Cpu size={18} color={Colors.info} />} label="Machinery" value={harvest.machinery.join(', ')} />
        </View>

        {/* Cost Estimate */}
        <SectionHeader title={t('Cost Estimate')} style={{ marginTop: Spacing.base }} />
        <View style={styles.costCard}>
          {Object.entries(harvest.costEstimate).map(([key, val]) => key !== 'total' && (
            <View key={key} style={styles.costRow}>
              <Text style={styles.costLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
              <Text style={styles.costValue}>₹{val.toLocaleString('en-IN')}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t('Total Estimated Cost')}</Text>
            <Text style={styles.totalValue}>₹{harvest.costEstimate.total.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        {/* Machinery */}
        <SectionHeader title={t('Required Machinery')} style={{ marginTop: Spacing.base }} />
        <View style={styles.machineryRow}>
          {harvest.machinery.map((m) => (
            <View key={m} style={styles.machineryChip}>
              <Text style={styles.machineryText}>{m}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button title={t('Plan Harvest')} onPress={() => {}} variant="primary" size="lg" />
          <Button title={t('View Storage Recommendation')} onPress={() => router.push('/logistics')} variant="outline" size="md" />
        </View>

        <View style={{ height: Spacing['2xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const StatItem = ({ icon, label, value }) => (
  <View style={statStyles.card}>
    <View style={statStyles.iconWrap}>{icon}</View>
    <Text style={statStyles.label}>{label}</Text>
    <Text style={statStyles.value}>{value}</Text>
  </View>
);

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: 4,
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  label: { fontSize: FontSize.xs, color: Colors.textSecondary },
  value: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.text },
});

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
    gap: Spacing.sm,
  },
  heroLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  heroDate: {
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.bold,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  readinessRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  readinessLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  readinessValue: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.primary },
  statsGrid: { flexDirection: 'row', gap: Spacing.sm },
  costCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  costLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  costValue: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
  },
  totalLabel: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.text },
  totalValue: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.primary },
  machineryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  machineryChip: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  machineryText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
  actions: { gap: Spacing.sm },
});
