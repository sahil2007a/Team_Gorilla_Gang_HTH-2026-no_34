import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { Colors } from '../constants/colors';
import { Radius, Shadow, Spacing } from '../constants/spacing';
import { FontSize, FontWeight } from '../constants/typography';
import { Droplets, Thermometer, Wind, RefreshCw, History, Clock, CheckCircle2 } from 'lucide-react-native';
import { useLanguage } from '../context/LanguageContext';
import { useLiveSensors } from '../hooks/useLiveSensors';

export const SoilWaterSensorLog = () => {
  const { t } = useLanguage();
  const { soilMoisture, temperature, humidity, recentEntries, hasData, deviceId, createdAt, refreshing, refresh } = useLiveSensors(10000, true);
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
    if (!isoString) return t('Just now');
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return t('Just now');
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <View style={styles.container}>
      {/* ── TOP LATEST LIVE SENSOR CARD ── */}
      <View style={styles.latestCard}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.liveDot, { backgroundColor: hasData ? '#16a34a' : '#f59e0b' }]} />
            <View>
              <Text style={styles.headerTitle}>{t('Current Live Telemetry')}</Text>
              <Text style={styles.headerSub}>
                {hasData ? `${deviceId} • ${t('Updated')}: ${formatTime(createdAt)}` : t('Supabase Connected • Awaiting 3-min sync')}
              </Text>
            </View>
          </View>

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

        {/* 3 Live Values */}
        <View style={styles.sensorsRow}>
          <View style={styles.sensorItem}>
            <View style={[styles.iconWrap, { backgroundColor: '#dcfce7' }]}>
              <Droplets size={20} color="#15803d" />
            </View>
            <Text style={styles.sensorLabel}>{t('Soil Moisture')}</Text>
            <Text style={[styles.sensorVal, { color: '#15803d' }]}>
              {soilMoisture !== null && soilMoisture !== undefined ? `${soilMoisture}%` : '--'}
            </Text>
          </View>

          <View style={styles.sensorItem}>
            <View style={[styles.iconWrap, { backgroundColor: '#fee2e2' }]}>
              <Thermometer size={20} color="#dc2626" />
            </View>
            <Text style={styles.sensorLabel}>{t('Temperature')}</Text>
            <Text style={[styles.sensorVal, { color: '#dc2626' }]}>
              {temperature !== null && temperature !== undefined ? `${temperature}°C` : '--'}
            </Text>
          </View>

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

      {/* ── 5-ENTRY LIVE SENSOR HISTORY TABLE (FIFO) ── */}
      <View style={styles.historyCard}>
        <View style={styles.historyHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <History size={18} color={Colors.primary} />
            <Text style={styles.historyTitle}>{t('3-Min Telemetry History (Last 5 Entries)')}</Text>
          </View>
          <View style={styles.fifoBadge}>
            <Text style={styles.fifoBadgeText}>FIFO • Max 5</Text>
          </View>
        </View>

        <Text style={styles.historySubtitle}>
          {t('Automatically keeps up to 5 latest entries. Oldest entry drops off when new data arrives.')}
        </Text>

        <View style={styles.tableHeader}>
          <Text style={[styles.tableColHeader, { flex: 1.4 }]}>🕒 {t('Time')}</Text>
          <Text style={[styles.tableColHeader, { flex: 1, textAlign: 'center' }]}>💧 {t('Soil')}</Text>
          <Text style={[styles.tableColHeader, { flex: 1, textAlign: 'center' }]}>🌡️ {t('Temp')}</Text>
          <Text style={[styles.tableColHeader, { flex: 1, textAlign: 'center' }]}>💨 {t('Hum')}</Text>
        </View>

        {recentEntries && recentEntries.length > 0 ? (
          recentEntries.slice(0, 5).map((entry, index) => (
            <View key={entry.id || index} style={[styles.tableRow, index === 0 && styles.tableRowNewest]}>
              <View style={[styles.tableCol, { flex: 1.4 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  {index === 0 && <View style={styles.newestDot} />}
                  <Text style={[styles.tableTimeText, index === 0 && { fontWeight: '800', color: Colors.primary }]}>
                    {formatTime(entry.createdAt)}
                  </Text>
                </View>
                <Text style={styles.tableDateText}>{formatDate(entry.createdAt)}</Text>
              </View>

              <Text style={[styles.tableCol, { flex: 1, textAlign: 'center', color: '#15803d', fontWeight: '800' }]}>
                {entry.soilMoisture !== null ? `${entry.soilMoisture}%` : '--'}
              </Text>

              <Text style={[styles.tableCol, { flex: 1, textAlign: 'center', color: '#dc2626', fontWeight: '800' }]}>
                {entry.temperature !== null ? `${entry.temperature}°C` : '--'}
              </Text>

              <Text style={[styles.tableCol, { flex: 1, textAlign: 'center', color: '#0284c7', fontWeight: '800' }]}>
                {entry.humidity !== null ? `${entry.humidity}%` : '--'}
              </Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyBox}>
            <Clock size={24} color={Colors.textMuted} />
            <Text style={styles.emptyText}>{t('Awaiting live sensor readings from Supabase...')}</Text>
            <Text style={styles.emptySub}>{t('Entries will appear here in 3-minute intervals.')}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  latestCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.md,
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

  // 5-Entry History Card
  historyCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    ...Shadow.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  fifoBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  fifoBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284c7',
  },
  historySubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: Spacing.sm,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: Radius.md,
    marginBottom: 4,
  },
  tableColHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tableRowNewest: {
    backgroundColor: '#f0fdf4',
    borderRadius: Radius.md,
  },
  newestDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16a34a',
  },
  tableCol: {
    fontSize: 13,
  },
  tableTimeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  tableDateText: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  emptyBox: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
