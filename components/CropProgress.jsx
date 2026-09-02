import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { Radius, Shadow, Spacing } from '../constants/spacing';
import { FontSize, FontWeight } from '../constants/typography';
import { ProgressBar } from './ui/ProgressBar';
import { Badge } from './ui/Badge';
import { CheckCircle, Circle, Clock } from 'lucide-react-native';
import { useLanguage } from '../context/LanguageContext';

const stageConfig = {
  completed: { icon: CheckCircle, color: Colors.success, bgColor: '#E6F7EE' },
  current: { icon: Clock, color: Colors.primary, bgColor: Colors.primaryLight },
  upcoming: { icon: Circle, color: Colors.textMuted, bgColor: Colors.background },
};

export const CropProgress = ({ crop }) => {
  const { t } = useLanguage();
  if (!crop) return null;

  const progressPercent = Math.round((crop.currentDay / crop.durationDays) * 100);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.cardTitle}>{t('Crop Progress')}</Text>
          <Text style={styles.cropName}>{t(crop.name)} — {crop.variety}</Text>
        </View>
        <Badge label={`${t('Day')} ${crop.currentDay}/${crop.durationDays}`} variant="primary" />
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.stageName}>{t(crop.currentStage)}</Text>
          <Text style={styles.progressPercent}>{progressPercent}%</Text>
        </View>
        <ProgressBar progress={progressPercent} color={Colors.primary} height={8} />
        <View style={styles.progressFooter}>
          <Text style={styles.progressLabel}>{t('Sowing')}: {crop.sowingDate}</Text>
          <Text style={styles.progressLabel}>{t('Harvest')}: {crop.expectedHarvestDate}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stagesScroll}>
        <View style={styles.stagesRow}>
          {crop.stages.map((stageItem, index) => {
            const isObject = typeof stageItem === 'object';
            const stage = isObject ? stageItem : {
              id: `stage_${index}`,
              name: stageItem,
              status: index === 0 ? 'current' : 'upcoming'
            };
            
            const config = stageConfig[stage.status] || stageConfig.upcoming;
            const IconComp = config.icon;
            return (
              <View key={stage.id} style={styles.stageItem}>
                {index > 0 && (
                  <View style={[styles.connector, { backgroundColor: stage.status !== 'upcoming' ? Colors.success : Colors.border }]} />
                )}
                <View style={[styles.stageIconWrap, { backgroundColor: config.bgColor }]}>
                  <IconComp size={16} color={config.color} />
                </View>
                <Text
                  style={[
                    styles.stageLabelText,
                    { color: stage.status === 'current' ? Colors.primary : stage.status === 'completed' ? Colors.success : Colors.textMuted },
                  ]}
                  numberOfLines={2}
                >
                  {t(stage.name)}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerStat}>
          <Text style={styles.footerLabel}>{t('Growth Performance')}</Text>
          <Text style={[styles.footerValue, { color: Colors.success }]}>{crop.growthPerformance}%</Text>
        </View>
        <View style={styles.footerStat}>
          <Text style={styles.footerLabel}>{t('Stage')}</Text>
          <Text style={[styles.footerValue, { color: Colors.primary }]}>{t(crop.currentStage)}</Text>
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
    ...Shadow.sm,
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
    marginBottom: 2,
  },
  cropName: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  progressSection: { marginBottom: Spacing.md },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  stageName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
  progressPercent: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  progressLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: Spacing.md,
  },
  stagesScroll: { marginBottom: Spacing.md },
  stagesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingBottom: 4,
  },
  stageItem: {
    alignItems: 'center',
    width: 72,
    position: 'relative',
  },
  connector: {
    position: 'absolute',
    top: 14,
    left: -36,
    width: 36,
    height: 2,
  },
  stageIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stageLabelText: {
    fontSize: 9,
    fontWeight: FontWeight.medium,
    textAlign: 'center',
    lineHeight: 12,
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.base,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerStat: { flex: 1 },
  footerLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  footerValue: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
});
