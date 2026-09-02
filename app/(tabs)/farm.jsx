import { useLanguage } from '../../context/LanguageContext';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { useFarmData } from '../../hooks/useFarmData';
import { useAuth } from '../../hooks/useAuth';
import { useCrop } from '../../context/CropContext';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { SoilWaterSensorLog } from '../../components/SoilWaterSensorLog';
import { Bell, MapPin, ChevronDown, CheckCircle2, TrendingUp, CloudRain, Droplets, Calendar, Plus } from 'lucide-react-native';

const TABS = ['Overview', 'Soil & Water', 'Crop History'];

export default function FarmScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { farmer } = useAuth();
  const { activeCrop, farmSetup, crops, selectCrop } = useCrop();
  const [activeTab, setActiveTab] = useState('Overview');
  const { farm, loading } = useFarmData();

  const displayFarm = farmSetup || farm;
  const displayCrop = activeCrop;

  const tabs = [
    { id: 'Overview', label: t('Overview') },
    { id: 'Soil & Water', label: t('Soil & Water') },
    { id: 'Crop History', label: t('Crop History') },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar matching Image 3 */}
      <View style={styles.topBar}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{farmer?.name?.[0] || 'R'}</Text>
        </View>
        <View style={styles.logoBox}>
          <Text style={styles.brandName}>{t('AgriFlow')}</Text>
        </View>
        <TouchableOpacity
          style={styles.notifBtn}
          onPress={() => router.push('/notifications')}
          activeOpacity={0.8}
        >
          <Bell size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Farm Header */}
        <View style={styles.farmHeader}>
          <TouchableOpacity style={styles.farmSelectorRow} activeOpacity={0.7}>
            <Text style={styles.farmName}>{displayFarm?.name || t('My Farm')}</Text>
            <ChevronDown size={20} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.locationRow}>
            <MapPin size={14} color={Colors.textSecondary} />
            <Text style={styles.locationText}>
              {t(
                farmer?.village && farmer?.district
                  ? `${farmer.village}, ${farmer.district}`
                  : typeof farmer?.location === 'string' && farmer.location.trim()
                  ? farmer.location
                  : displayFarm?.location?.village && displayFarm?.location?.district
                  ? `${displayFarm.location.village}, ${displayFarm.location.district}`
                  : displayFarm?.location?.district
                  ? `${displayFarm.location.district}, ${displayFarm.location.state || 'Maharashtra'}`
                  : farmer?.district
                  ? `${farmer.district}, Maharashtra`
                  : 'Nagpur, Maharashtra'
              )}
            </Text>
          </View>
          <View style={styles.healthRow}>
            {displayFarm ? (
              <Text style={styles.healthScore}>
                {displayFarm.area} {t(displayFarm.areaUnit || 'Acres')}
                <Text style={styles.healthScoreMax}> · {t(displayFarm.soilType || '')}</Text>
              </Text>
            ) : (
              <Text style={styles.healthScore}>—</Text>
            )}
          </View>
        </View>

        {/* Multi-Crop Switcher */}
        {crops && crops.length > 0 && (
          <View style={styles.cropSwitcherSection}>
            <View style={styles.cropSwitcherHeader}>
              <Text style={styles.cropSwitcherTitle}>{t('My Crops')}</Text>
              <TouchableOpacity
                style={styles.addCropChip}
                onPress={() => router.push('/(auth)/crop-setup')}
                activeOpacity={0.8}
              >
                <Plus size={13} color={Colors.primary} />
                <Text style={styles.addCropChipText}>{t('+ Add Crop')}</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cropChipsScroll}>
              <View style={styles.cropChipsRow}>
                {crops.map((c) => {
                  const isActive = activeCrop?.id === c.id;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[
                        styles.cropChip,
                        isActive && { backgroundColor: c.bgColor || Colors.primaryLight, borderColor: c.color || Colors.primary, borderWidth: 2 }
                      ]}
                      onPress={() => selectCrop(c.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.cropChipEmoji}>{c.emoji}</Text>
                      <Text style={[styles.cropChipName, isActive && { color: c.color || Colors.primary, fontWeight: '800' }]}>
                        {t(c.name)}
                      </Text>
                      {isActive && (
                        <View style={[styles.activeDot, { backgroundColor: c.color || Colors.primary }]} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Active Crop Card */}
        {displayCrop && (
          <View style={[styles.cropCard, { borderColor: displayCrop.color, backgroundColor: displayCrop.bgColor }]}>
            <Text style={styles.cropCardEmoji}>{displayCrop.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cropCardName, { color: displayCrop.color }]}>{t(displayCrop.name)} — {displayCrop.variety}</Text>
              <Text style={styles.cropCardSub}>{displayCrop.fieldName} · {displayCrop.acreage} {t(displayCrop.areaUnit || 'Acres')} · {t(displayCrop.irrigationSystem || '')} {t('irrigation')}</Text>
              <View style={styles.cropCardProgress}>
                <View style={styles.cropProgressBg}>
                  <View style={[styles.cropProgressFill, { width: `${Math.min(100, Math.round((displayCrop.currentDay / displayCrop.durationDays) * 100))}%`, backgroundColor: displayCrop.color }]} />
                </View>
                <Text style={styles.cropProgressText}>{t('Day')} {displayCrop.currentDay}/{displayCrop.durationDays}</Text>
              </View>
            </View>
          </View>
        )}
        {!displayCrop && (!crops || crops.length === 0) && (
          <TouchableOpacity
            style={styles.addCropBtn}
            onPress={() => router.push('/(auth)/crop-setup')}
            activeOpacity={0.8}
          >
            <Text style={styles.addCropBtnText}>{t('+ Register a Crop')}</Text>
          </TouchableOpacity>
        )}


        {/* Segmented Control */}
        <View style={{ marginBottom: Spacing.xl }}>
          <SegmentedControl 
            options={tabs.map(tab => tab.label)} 
            selected={tabs.find(tab => tab.id === activeTab)?.label || t('Overview')} 
            onChange={(selectedLabel) => {
              const matched = tabs.find(tab => tab.label === selectedLabel);
              if (matched) setActiveTab(matched.id);
            }} 
          />
        </View>

        {/* ── OVERVIEW ── */}
        {activeTab === 'Overview' && (
          <View style={styles.tabContent}>
            {/* Yield Prediction */}
            {activeCrop ? (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <TrendingUp size={20} color={Colors.primary} />
                  <Text style={styles.cardTitle}>{t('Yield Prediction')}</Text>
                </View>
                <Text style={styles.yieldValue}>{t(activeCrop.name)}</Text>
                <Text style={styles.yieldSubtitle}>{t('Day')} {activeCrop.currentDay} / {activeCrop.durationDays}</Text>
              </View>
            ) : (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <TrendingUp size={20} color={Colors.primary} />
                  <Text style={styles.cardTitle}>{t('Yield Prediction')}</Text>
                </View>
                <Text style={{ color: Colors.textMuted, fontSize: 14, textAlign: 'center', padding: Spacing.md }}>
                  {t('Register a crop to see yield prediction.')}
                </Text>
              </View>
            )}

            {/* Upcoming Tasks */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>{t('Upcoming Tasks')}</Text>
            </View>
            <View style={styles.card}>
              <Text style={{ color: Colors.textMuted, fontSize: 14, textAlign: 'center', padding: Spacing.md }}>
                {t('No tasks yet. Add tasks to your farm diary.')}
              </Text>
            </View>

            {/* Recent Activities */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>{t('Recent Activities')}</Text>
            </View>
            <View style={styles.card}>
              <Text style={{ color: Colors.textMuted, fontSize: 14, textAlign: 'center', padding: Spacing.md }}>
                {t('No recent activities recorded.')}
              </Text>
            </View>
          </View>
        )}

        {/* ── SOIL & WATER TAB ── */}
        {activeTab === 'Soil & Water' && (
          <View style={styles.tabContent}>
            <View style={{ marginBottom: Spacing.sm }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.text, marginBottom: 4 }}>
                {t('Live Soil & Climate Telemetry')}
              </Text>
              <Text style={{ fontSize: 12, color: Colors.textSecondary }}>
                {t('Real-time sensor data streamed from Supabase IoT')}
              </Text>
            </View>
            <SoilWaterSensorLog />
          </View>
        )}

        {/* ── CROP HISTORY TAB ── */}
        {activeTab === 'Crop History' && (
          <View style={styles.placeholderBox}>
            <Text style={styles.placeholderText}>{t('Crop History & Past Yield Records')}</Text>
          </View>
        )}

        <View style={{ height: Spacing['3xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: FontSize.xs,
  },
  logoBox: {
    flex: 1,
    paddingLeft: Spacing.md,
  },
  brandName: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  notifBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { padding: Spacing.base, paddingTop: Spacing.sm },
  farmHeader: {
    marginBottom: Spacing.xl,
  },
  farmSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  farmName: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.md,
  },
  locationText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  healthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  healthScore: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  healthScoreMax: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
  },
  badgeExcellent: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  badgeText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: FontSize.xs,
  },
  tabContent: { gap: Spacing.lg },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius['2xl'],
    padding: Spacing.xl,
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: FontSize.base,
    fontWeight: '700',
    color: Colors.text,
  },
  yieldValue: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.text,
  },
  yieldSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: -Spacing.sm,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  seeAll: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  taskIconBox: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskInfo: { flex: 1 },
  taskTitle: {
    fontSize: FontSize.base,
    fontWeight: '700',
    color: Colors.text,
  },
  taskSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  activityIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F0FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityInfo: { flex: 1 },
  activityTitle: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  activityTime: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  placeholderBox: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  placeholderText: {
    color: Colors.textMuted,
  },
  // Crop card
  cropCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    marginBottom: Spacing.md,
  },
  cropCardEmoji: { fontSize: 32, marginTop: 2 },
  cropCardName: { fontSize: 15, fontWeight: '800' },
  cropCardSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 3, lineHeight: 18 },
  cropCardProgress: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.sm },
  cropProgressBg: { flex: 1, height: 6, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 3 },
  cropProgressFill: { height: '100%', borderRadius: 3 },
  cropProgressText: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary },
  addCropBtn: {
    padding: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    marginBottom: Spacing.md,
    backgroundColor: Colors.primaryLight,
  },
  addCropBtnText: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  cropSwitcherSection: {
    marginBottom: Spacing.md,
  },
  cropSwitcherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  cropSwitcherTitle: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addCropChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  addCropChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  cropChipsScroll: {
    paddingVertical: 4,
  },
  cropChipsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingRight: Spacing.base,
  },
  cropChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  cropChipEmoji: {
    fontSize: 18,
  },
  cropChipName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 2,
  },
});
