import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { Colors } from '../constants/colors';
import { Radius, Shadow, Spacing } from '../constants/spacing';
import { FontSize, FontWeight } from '../constants/typography';
import { Droplets, Thermometer, Wind, RefreshCw } from 'lucide-react-native';
import { useLanguage } from '../context/LanguageContext';
import { useLiveSensors } from '../hooks/useLiveSensors';

export const LiveSensorFeed = () => {
  const { t } = useLanguage();
  const { soilMoisture, temperature, humidity, hasData, deviceId, createdAt, refreshing, refresh } = useLiveSensors(10000, false);
  const spinValue = useRef(new Animated.Value(0)).current;

  const handleRefresh = () => {
    spinValue.setValue(0);
    Animated.timing(spinValue, {
      toValue: 1,
      duration: 700,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
    refresh();
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const formatTime = (isoString) => {
    if (!isoString) return t('Awaiting 3-min sync...');
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return t('Just now');
    }
  };

  return (
    <View style={styles.card}>
      {/* Header Bar with Live Indicator & Working Refresh Button */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.liveDot, { backgroundColor: hasData ? '#16a34a' : '#f59e0b' }]} />
          <View>
            <Text style={styles.headerTitle}>{t('Live Sensor Readings')}</Text>
            <Text style={styles.headerSub}>
              {hasData ? `${deviceId} • ${t('Updated')}: ${formatTime(createdAt)}` : t('Supabase Connected • Awaiting 3-min sync')}
            </Text>
          </View>
        </View>

        {/* Farmer Manual Refresh Button */}
        <TouchableOpacity
          style={[styles.refreshBtn, refreshing && styles.refreshBtnActive]}
          onPress={handleRefresh}
          disabled={refreshing}
          activeOpacity={0.7}
        >
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <RefreshCw size={18} color={Colors.primary} />
          </Animated.View>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      {/* 3 Main Sensor Cards */}
      <View style={styles.sensorsRow}>
        {/* 1. Soil Moisture */}
        <View style={styles.sensorItem}>
          <View style={[styles.iconWrap, { backgroundColor: '#dcfce7' }]}>
            <Droplets size={20} color="#15803d" />
          </View>
          <Text style={styles.sensorLabel}>{t('Soil Moisture')}</Text>
          <Text style={[styles.sensorVal, { color: '#15803d' }]}>
            {soilMoisture !== null && soilMoisture !== undefined ? `${soilMoisture}%` : '--'}
          </Text>
        </View>

        {/* 2. Temperature */}
        <View style={styles.sensorItem}>
          <View style={[styles.iconWrap, { backgroundColor: '#fee2e2' }]}>
            <Thermometer size={20} color="#dc2626" />
          </View>
          <Text style={styles.sensorLabel}>{t('Temperature')}</Text>
          <Text style={[styles.sensorVal, { color: '#dc2626' }]}>
            {temperature !== null && temperature !== undefined ? `${temperature}°C` : '--'}
          </Text>
        </View>

        {/* 3. Humidity */}
        <View style={styles.sensorItem}>
          <View style={[styles.iconWrap, { backgroundColor: '#e0f2fe' }]}>
            <Wind size={20} color="#0284c7" />
          </View>
          <Text style={styles.sensorLabel}>{t('Humidity')}</Text>
          <Text style={[styles.sensorVal, { color: '#0284c7' }]}>
            {humidity !== null && humidity !== undefined ? `${humidity}%` : '--'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    marginVertical: Spacing.xs,
    ...Shadow.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  headerTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  headerSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshBtnActive: {
    backgroundColor: '#dcfce7',
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: Spacing.sm,
  },
  sensorsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.xs,
  },
  sensorItem: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  sensorLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 4,
    textAlign: 'center',
  },
  sensorVal: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
});
