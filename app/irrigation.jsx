import { useLanguage } from '../context/LanguageContext';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

import { useRouter } from 'expo-router';
import { Colors } from '../constants/colors';
import { Spacing, Radius, Shadow } from '../constants/spacing';
import { FontSize, FontWeight } from '../constants/typography';
import { farmService } from '../services/farmService';
import { aiService } from '../services/aiService';
import { Button } from '../components/ui/Button';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { StatCard } from '../components/ui/StatCard';
import { ArrowLeft, Droplets, Thermometer, CloudRain, Sprout, Zap, Radio } from 'lucide-react-native';
import { useLiveSensors } from '../hooks/useLiveSensors';

export default function IrrigationScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { soilMoisture, temperature, humidity, isLive, deviceId } = useLiveSensors(5000);
  const [sensors, setSensors] = useState(null);
  const [weather, setWeather] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [irrigating, setIrrigating] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const [s, w, r] = await Promise.all([
        farmService.getSensors('farm_001'),
        farmService.getWeather('farm_001'),
        aiService.getIrrigationRecommendation('farm_001'),
      ]);
      setSensors(s.data);
      setWeather(w.data);
      setRecommendation(r);
      setLoading(false);
    };
    fetch();
  }, []);

  const handleStartIrrigation = () => {
    setIrrigating(true);
    setTimeout(() => setIrrigating(false), 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
            <ArrowLeft size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('Smart Irrigation')}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Current Status */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xs }}>
          <SectionHeader title={t('Live IoT Status')} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#dcfce7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#15803d' }} />
            <Text style={{ fontSize: 9, fontWeight: '800', color: '#15803d' }}>SUPABASE</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            label="Soil Moisture"
            value={soilMoisture?.value ?? (sensors?.readings?.soilMoisture?.value || 42)}
            unit="%"
            icon={<Droplets size={18} color={Colors.primary} />}
            color={Colors.primary}
          />
          <StatCard
            label="Temperature"
            value={temperature?.value ?? (sensors?.readings?.temperature?.value || 29)}
            unit="°C"
            icon={<Thermometer size={18} color={Colors.danger} />}
            color={Colors.danger}
          />
        </View>
        <View style={[styles.statsGrid, { marginTop: Spacing.sm }]}>
          <StatCard
            label="Air Humidity"
            value={humidity?.value ?? 64}
            unit="%"
            icon={<CloudRain size={18} color={Colors.info} />}
            color={Colors.info}
          />
          <StatCard
            label="Growth Stage"
            value="Vegetative"
            icon={<Sprout size={18} color={Colors.success} />}
            color={Colors.success}
          />
        </View>

        {/* Soil Moisture Progress */}
        <View style={[styles.moistureCard, { marginTop: Spacing.base }]}>
          <View style={styles.moistureHeader}>
            <Text style={styles.moistureTitle}>{t('Soil Moisture Level')}</Text>
            <Badge 
              label={(soilMoisture?.value ?? 42) < 35 ? "Below Optimal" : (soilMoisture?.value ?? 42) > 75 ? "Waterlogged" : "Optimal"} 
              variant={(soilMoisture?.value ?? 42) < 35 ? "warning" : (soilMoisture?.value ?? 42) > 75 ? "danger" : "success"} 
            />
          </View>
          <ProgressBar
            progress={soilMoisture?.value ?? (sensors?.readings?.soilMoisture?.value || 42)}
            color={(soilMoisture?.value ?? 42) < 35 ? Colors.warning : Colors.success}
            height={10}
            style={{ marginVertical: Spacing.sm }}
          />
          <View style={styles.moistureRange}>
            <Text style={styles.rangeLabel}>{t('Current')}: {soilMoisture?.value ?? 42}%</Text>
            <Text style={styles.rangeLabel}>{t('Optimal: 40–70%')}</Text>
          </View>
        </View>

        {/* AI Recommendation */}
        {recommendation && (
          <>
            <SectionHeader title={t('AI Recommendation')} style={{ marginTop: Spacing.base }} />
            <View style={styles.recommendationCard}>
              <View style={styles.recHeader}>
                <View style={styles.recIcon}>
                  <Zap size={20} color={Colors.primary} />
                </View>
                <View style={styles.recContent}>
                  <Text style={styles.recTitle}>{recommendation.message}</Text>
                  <Text style={styles.recBody}>{recommendation.reason}</Text>
                </View>
              </View>
              <View style={styles.recStat}>
                <Text style={styles.recStatLabel}>{t('Estimated Water Required')}</Text>
                <Text style={styles.recStatValue}>{recommendation.estimatedWaterMm} mm</Text>
              </View>
            </View>
          </>
        )}

        {/* Actions */}
        <SectionHeader title={t('Actions')} style={{ marginTop: Spacing.base }} />
        <View style={styles.actions}>
          <Button
            title={irrigating ? 'Starting...' : 'Start Irrigation'}
            onPress={handleStartIrrigation}
            loading={irrigating}
            size="lg"
            variant="primary"
            icon={<Droplets size={18} color="#fff" />}
          />
          <Button
            title={t('Schedule Irrigation')}
            onPress={() => {}}
            size="lg"
            variant="outline"
          />
          <Button
            title={t('View Field Map')}
            onPress={() => router.push('/farm-map')}
            size="md"
            variant="ghost"
          />
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
  statsGrid: { flexDirection: 'row', gap: Spacing.sm },
  moistureCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  moistureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moistureTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  moistureRange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rangeLabel: { fontSize: FontSize.xs, color: Colors.textSecondary },
  recommendationCard: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  recHeader: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  recIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recContent: { flex: 1 },
  recTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
    marginBottom: 4,
  },
  recBody: { fontSize: FontSize.sm, color: Colors.text, lineHeight: 18 },
  recStat: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recStatLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  recStatValue: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.primary },
  actions: { gap: Spacing.sm },
});
