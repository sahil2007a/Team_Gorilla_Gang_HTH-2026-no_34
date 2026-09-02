import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';

import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { useFarmData } from '../../hooks/useFarmData';
import { FarmHealthCard } from '../../components/FarmHealthCard';
import { WeatherCard } from '../../components/WeatherCard';
import { ActionCard } from '../../components/ActionCard';
import { QuickAction } from '../../components/QuickAction';
import { CropProgress } from '../../components/CropProgress';
import { FarmSelector } from '../../components/FarmSelector';
import { AIButton } from '../../components/AIButton';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { LiveSensorFeed } from '../../components/LiveSensorFeed';
import { TodayMandiTrades } from '../../components/TodayMandiTrades';
import { Bell, Scan, Cpu, CircleDollarSign, Sparkles, Plus, Wallet, Sprout, Globe, Banknote, TrendingUp, Store } from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { useCrop } from '../../context/CropContext';
import { useLanguage } from '../../context/LanguageContext';

export default function HomeScreen() {
  const router = useRouter();
  const { farmer } = useAuth();
  const { activeCrop, farmSetup, crops, selectCrop } = useCrop();
  const { t } = useLanguage();
  const { farm, crop, tasks, weather, loading, refreshing, refresh, completeTask } = useFarmData();

  // Prefer registered crop from context, fall back to mock
  const displayCrop = activeCrop || crop;
  const displayFarm = farmSetup || farm;

  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('Good Morning');
    if (hour < 17) return t('Good Afternoon');
    return t('Good Evening');
  };

  const handleTaskAction = (task) => {
    if (task.actionRoute) router.push(task.actionRoute);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.primary} />}
      >
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.avatar} onPress={() => router.push('/(tabs)/profile')} activeOpacity={0.8}>
            <Text style={styles.avatarText}>{farmer?.name?.[0] || 'R'}</Text>
          </TouchableOpacity>
          <View style={styles.logoBox}>
            <Text style={styles.logoIcon}>🌱</Text>
            <Text style={styles.brandName}>AgriFlow</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <TouchableOpacity
              style={styles.notifBtn}
              onPress={() => router.push('/(auth)/language')}
              activeOpacity={0.8}
            >
              <Globe size={22} color={Colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.notifBtn}
              onPress={() => router.push('/notifications')}
              activeOpacity={0.8}
            >
              <Bell size={22} color={Colors.text} />
              <View style={styles.notifDot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Greeting */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{getGreeting()} 👋,</Text>
          <Text style={styles.farmerName}>{farmer?.name || t('Rahul Desai')}</Text>
          <View style={styles.locationRow}>
            <Text style={styles.locationPin}>📍</Text>
            <Text style={styles.location}>
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
        </View>

        {/* Multi-Crop Switcher Bar */}
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

        {/* Active Crop Banner */}
        {activeCrop && (
          <View style={[styles.cropBanner, { backgroundColor: activeCrop.bgColor, borderColor: activeCrop.color }]}>
            <Text style={styles.cropBannerEmoji}>{activeCrop.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cropBannerName, { color: activeCrop.color }]}>{t(activeCrop.name)} · {activeCrop.fieldName}</Text>
              <Text style={styles.cropBannerSub}>{t('Day')} {activeCrop.currentDay} {t('of')} {activeCrop.durationDays} · {activeCrop.acreage} {t(activeCrop.areaUnit)}</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/farm')} activeOpacity={0.8}>
              <Text style={[styles.cropBannerAction, { color: activeCrop.color }]}>{t('Details →')}</Text>
            </TouchableOpacity>
          </View>
        )}
        {(!crops || crops.length === 0) && (
          <TouchableOpacity
            style={styles.addCropBanner}
            onPress={() => router.push('/(auth)/crop-setup')}
            activeOpacity={0.8}
          >
            <Plus size={16} color={Colors.primary} />
            <Text style={styles.addCropText}>{t('Register your crop to get personalized insights')}</Text>
          </TouchableOpacity>
        )}
        {/* Farm Selector */}
        <View style={styles.farmSelectorWrapper}>
          <FarmSelector farm={displayFarm} onPress={() => router.push('/(tabs)/farm')} />
        </View>

        {/* Farm Health */}
        <SectionHeader title={t('Overall Farm Health')} style={styles.sectionHeader} />
        {loading ? <SkeletonCard lines={4} /> : <FarmHealthCard farm={farm} />}

        {/* Today's Real-Time Mandi Trades (Nearby Farmers) */}
        <TodayMandiTrades />

        {/* Live IoT Sensor Telemetry from Supabase */}
        <SectionHeader title={t('Live IoT Sensor Telemetry')} style={styles.sectionHeader} />
        <LiveSensorFeed onNavigateHardware={() => router.push('/hardware')} />

        {/* Quick Actions */}
        <SectionHeader title={t('Quick Actions')} style={styles.sectionHeader} />
        <View style={styles.quickActionsGrid}>
          <View style={styles.quickActionRow}>
            <QuickAction
              icon={<Scan />}
              label={t('Scan Crop')}
              onPress={() => router.push('/disease-scanner?autoCamera=true')}
              color={Colors.primary}
              bgColor={Colors.surface}
            />
            <QuickAction
              icon={<Store />}
              label={t('APMC Mandis')}
              onPress={() => router.push('/market')}
              color="#2d7a3a"
              bgColor={Colors.surface}
            />
          </View>
          <View style={styles.quickActionRow}>
            <QuickAction
              icon={<CircleDollarSign />}
              label={t('Add Expense')}
              onPress={() => router.push('/add-expense')}
              color={Colors.danger}
              bgColor={Colors.surface}
            />
            <QuickAction
              icon={<Wallet />}
              label={t('Add Income')}
              onPress={() => router.push('/add-income')}
              color={Colors.success}
              bgColor={Colors.surface}
            />
          </View>
          <View style={styles.quickActionRow}>
            <QuickAction
              icon={<Sprout />}
              label={t('Life Cycle')}
              onPress={() => router.push('/crop-lifecycle')}
              color={Colors.primary}
              bgColor={Colors.surface}
            />
            <QuickAction
              icon={<Banknote />}
              label={t('Finances')}
              onPress={() => router.push('/finances')}
              color="#2d7a3a"
              bgColor={Colors.surface}
            />
          </View>
        </View>

        {/* Today's Actions */}
        <SectionHeader
          title={t('Today\'s Actions')}
          style={styles.sectionHeader}
          action={
            <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/(tabs)/more')}>
              <Text style={styles.seeAll}>{t('VIEW ALL')}</Text>
            </TouchableOpacity>
          }
        />
        {loading ? (
          <>
            <SkeletonCard lines={2} />
            <SkeletonCard lines={2} />
          </>
        ) : (
          <View style={styles.actionsContainer}>
            {pendingTasks.map((task) => (
              <ActionCard
                key={task.id}
                task={task}
                onAction={handleTaskAction}
                onComplete={completeTask}
              />
            ))}
            {completedTasks.slice(0, 1).map((task) => (
              <ActionCard key={task.id} task={task} />
            ))}
          </View>
        )}

        {/* Crop Progress */}
        <SectionHeader
          title={displayCrop ? `${displayCrop.emoji || ''} ${displayCrop.name} ${t('Progress')}` : t('Progress')}
          style={styles.sectionHeader}
        />
        {loading ? <SkeletonCard lines={5} /> : <CropProgress crop={displayCrop} />}

        <View style={{ height: Spacing['3xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.base },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: FontSize.sm,
  },
  logoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  logoIcon: { fontSize: 16 },
  brandName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  notifBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.danger,
    position: 'absolute',
    top: 6,
    right: 8,
  },
  header: {
    marginBottom: Spacing.md,
  },
  greeting: {
    fontSize: FontSize.lg,
    color: Colors.text,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  farmerName: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  locationPin: { fontSize: 14 },
  location: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  farmSelectorWrapper: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  cropBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    marginBottom: Spacing.md,
  },
  cropBannerEmoji: { fontSize: 28 },
  cropBannerName: { fontSize: 15, fontWeight: '800' },
  cropBannerSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  cropBannerAction: { fontSize: 13, fontWeight: '800' },
  addCropBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    marginBottom: Spacing.md,
    backgroundColor: Colors.primaryLight,
  },
  addCropText: { fontSize: 13, fontWeight: '600', color: Colors.primary, flex: 1 },
  sectionHeader: { marginTop: Spacing.xl },
  quickActionsGrid: {
    gap: Spacing.sm,
  },
  quickActionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionsContainer: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  seeAll: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
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
