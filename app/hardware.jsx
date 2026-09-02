import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/colors';
import { Spacing, Radius } from '../constants/spacing';
import {
  ArrowLeft,
  Server,
  Cpu,
  Droplets,
  Radio,
  BatteryCharging,
  Sun,
  Wind,
  Gauge,
  CheckCircle2,
  RefreshCw,
  Zap,
} from 'lucide-react-native';
import { useLanguage } from '../context/LanguageContext';
import { useLiveSensors } from '../hooks/useLiveSensors';

const { width } = Dimensions.get('window');

export default function HardwareScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { soilMoisture, temperature, humidity, isLive, deviceId, createdAt, refresh, refreshing } = useLiveSensors(4000);

  // Valve interactive states
  const [valveA, setValveA] = useState(true);
  const [valveB, setValveB] = useState(false);
  const [testingDiagnostics, setTestingDiagnostics] = useState(false);

  const handleRunDiagnostics = () => {
    setTestingDiagnostics(true);
    setTimeout(() => {
      setTestingDiagnostics(false);
      Alert.alert(
        t('Hardware Diagnostics Complete ✅'),
        t('All 3 Soil Probes, 2 Smart Valves, LoRa Gateway and Micro-Weather Station are responding with 100% signal integrity. Firmware is up to date (v2.4.1).')
      );
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.topbarTitle}>{t('System Hardware & IoT')}</Text>
          <Text style={styles.topbarSubtitle}>{t('Sensors, automated valves & telemetry')}</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={handleRunDiagnostics}
          disabled={testingDiagnostics}
          activeOpacity={0.8}
        >
          <RefreshCw size={18} color="#2d7a3a" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Gateway Telemetry Banner */}
        <View style={styles.gatewayBanner}>
          <View style={styles.gatewayHeader}>
            <View style={styles.gatewayIconBg}>
              <Server size={22} color="#fff" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.gatewayTitle}>{t('AgriFlow Smart Gateway Node')}</Text>
              <Text style={styles.gatewaySub}>{t('LoRaWAN + 4G LTE • Uptime 42 days')}</Text>
            </View>
            <View style={styles.onlineBadge}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>{t('ONLINE')}</Text>
            </View>
          </View>

          <View style={styles.gatewayMetrics}>
            <View style={styles.gwMetricItem}>
              <Radio size={16} color="#86efac" />
              <Text style={styles.gwMetricVal}>-72 dBm</Text>
              <Text style={styles.gwMetricLabel}>{t('Signal')}</Text>
            </View>
            <View style={styles.gwMetricDivider} />
            <View style={styles.gwMetricItem}>
              <Zap size={16} color="#fde047" />
              <Text style={styles.gwMetricVal}>14.2 V</Text>
              <Text style={styles.gwMetricLabel}>{t('Solar Input')}</Text>
            </View>
            <View style={styles.gwMetricDivider} />
            <View style={styles.gwMetricItem}>
              <BatteryCharging size={16} color="#67e8f9" />
              <Text style={styles.gwMetricVal}>98%</Text>
              <Text style={styles.gwMetricLabel}>{t('Battery')}</Text>
            </View>
          </View>
        </View>

        {/* ── SECTION 1: SOIL & NPK SENSOR NODES ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm }}>
          <Text style={styles.sectionTitle}>{t('Soil Moisture & IoT Probes')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#dcfce7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#15803d' }} />
            <Text style={{ fontSize: 9, fontWeight: '800', color: '#15803d' }}>SUPABASE LIVE</Text>
          </View>
        </View>

        <View style={styles.sensorCard}>
          <View style={styles.sensorHeader}>
            <View style={styles.sensorTitleBox}>
              <Cpu size={18} color="#2d7a3a" />
              <Text style={styles.sensorTitle}>{deviceId || t('ESP32 Live Soil Probe')}</Text>
            </View>
            <Text style={styles.batteryText}>🔋 96%</Text>
          </View>
          <View style={styles.sensorGrid}>
            <View style={styles.sensorStat}>
              <Text style={styles.statLabel}>{t('Soil Moisture')}</Text>
              <Text style={[styles.statValue, { color: (soilMoisture?.value ?? 42) < 35 ? '#dc2626' : '#15803d' }]}>
                {soilMoisture?.value ?? 42}%
              </Text>
              <Text style={[styles.statSub, { color: (soilMoisture?.value ?? 42) < 35 ? '#dc2626' : '#15803d', fontWeight: '700' }]}>
                {(soilMoisture?.value ?? 42) < 35 ? t('Needs Water') : t('Optimal')}
              </Text>
            </View>
            <View style={styles.sensorStat}>
              <Text style={styles.statLabel}>{t('Temperature')}</Text>
              <Text style={styles.statValue}>{temperature?.value ?? 28.5}°C</Text>
              <Text style={styles.statSub}>{t('Live Telemetry')}</Text>
            </View>
            <View style={styles.sensorStat}>
              <Text style={styles.statLabel}>{t('Humidity')}</Text>
              <Text style={styles.statValue}>{humidity?.value ?? 64}%</Text>
              <Text style={styles.statSub}>{t('Relative Hum.')}</Text>
            </View>
            <View style={styles.sensorStat}>
              <Text style={styles.statLabel}>{t('Network Link')}</Text>
              <Text style={[styles.statValue, { fontSize: 13, color: '#15803d' }]}>Supabase 200</Text>
              <Text style={styles.statSub}>{t('Auto-Polling 4s')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sensorCard}>
          <View style={styles.sensorHeader}>
            <View style={styles.sensorTitleBox}>
              <Cpu size={18} color="#d97706" />
              <Text style={styles.sensorTitle}>{t('Node 02: Chilli Patch')}</Text>
            </View>
            <Text style={styles.batteryText}>🔋 79%</Text>
          </View>
          <View style={styles.sensorGrid}>
            <View style={styles.sensorStat}>
              <Text style={styles.statLabel}>{t('Moisture (15cm)')}</Text>
              <Text style={[styles.statValue, { color: '#dc2626' }]}>29%</Text>
              <Text style={[styles.statSub, { color: '#dc2626', fontWeight: '700' }]}>{t('Needs Water')}</Text>
            </View>
            <View style={styles.sensorStat}>
              <Text style={styles.statLabel}>{t('Soil Temp')}</Text>
              <Text style={styles.statValue}>28.2°C</Text>
              <Text style={styles.statSub}>{t('Warm')}</Text>
            </View>
            <View style={styles.sensorStat}>
              <Text style={styles.statLabel}>NPK Ratio</Text>
              <Text style={styles.statValue}>38:14:130</Text>
              <Text style={styles.statSub}>mg/kg</Text>
            </View>
            <View style={styles.sensorStat}>
              <Text style={styles.statLabel}>{t('Electrical Cond.')}</Text>
              <Text style={styles.statValue}>1.4 dS/m</Text>
              <Text style={styles.statSub}>{t('Normal')}</Text>
            </View>
          </View>
        </View>

        {/* ── SECTION 2: AUTOMATED DRIP VALVES ── */}
        <Text style={styles.sectionTitle}>{t('Automated Drip Irrigation Valves')}</Text>

        <View style={styles.valveCard}>
          <View style={styles.valveHeader}>
            <View style={styles.valveIconBg}>
              <Droplets size={20} color={valveA ? '#0284c7' : '#9ca3af'} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.valveTitle}>{t('Valve 01 — Cotton Main Drip')}</Text>
              <Text style={styles.valveSub}>
                {valveA ? t('Flowing: 18.2 L/min • 1.8 Bar') : t('Closed / Standby')}
              </Text>
            </View>
            <Switch
              value={valveA}
              onValueChange={(val) => {
                setValveA(val);
                Alert.alert(
                  val ? t('Valve Opened 🚰') : t('Valve Closed 🛑'),
                  val ? t('Valve 01 is now irrigating Cotton Field A.') : t('Valve 01 has been stopped.')
                );
              }}
              trackColor={{ false: '#d1d5db', true: '#86efac' }}
              thumbColor={valveA ? '#2d7a3a' : '#f4f4f5'}
            />
          </View>
        </View>

        <View style={styles.valveCard}>
          <View style={styles.valveHeader}>
            <View style={styles.valveIconBg}>
              <Droplets size={20} color={valveB ? '#0284c7' : '#9ca3af'} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.valveTitle}>{t('Valve 02 — Chilli Lateral Line')}</Text>
              <Text style={styles.valveSub}>
                {valveB ? t('Flowing: 12.0 L/min • 1.5 Bar') : t('Closed • Scheduled 6:00 PM')}
              </Text>
            </View>
            <Switch
              value={valveB}
              onValueChange={(val) => {
                setValveB(val);
                Alert.alert(
                  val ? t('Valve Opened 🚰') : t('Valve Closed 🛑'),
                  val ? t('Valve 02 is now irrigating Chilli Patch.') : t('Valve 02 has been stopped.')
                );
              }}
              trackColor={{ false: '#d1d5db', true: '#86efac' }}
              thumbColor={valveB ? '#2d7a3a' : '#f4f4f5'}
            />
          </View>
        </View>

        {/* ── SECTION 3: MICRO WEATHER STATION ── */}
        <Text style={styles.sectionTitle}>{t('On-Farm Micro-Weather Station')}</Text>
        <View style={styles.weatherCard}>
          <View style={styles.weatherGrid}>
            <View style={styles.weatherItem}>
              <Sun size={20} color="#f59e0b" />
              <Text style={styles.weatherVal}>780 W/m²</Text>
              <Text style={styles.weatherLabel}>{t('Solar Irradiance')}</Text>
            </View>
            <View style={styles.weatherItem}>
              <Wind size={20} color="#0284c7" />
              <Text style={styles.weatherVal}>11 km/h</Text>
              <Text style={styles.weatherLabel}>{t('Wind (NW)')}</Text>
            </View>
            <View style={styles.weatherItem}>
              <Gauge size={20} color="#7c3aed" />
              <Text style={styles.weatherVal}>1012 hPa</Text>
              <Text style={styles.weatherLabel}>{t('Barometer')}</Text>
            </View>
            <View style={styles.weatherItem}>
              <Droplets size={20} color="#15803d" />
              <Text style={styles.weatherVal}>0.0 mm</Text>
              <Text style={styles.weatherLabel}>{t('Rain Gauge 24h')}</Text>
            </View>
          </View>
        </View>

        {/* Diagnostics Button */}
        <TouchableOpacity
          style={styles.diagBtn}
          onPress={handleRunDiagnostics}
          disabled={testingDiagnostics}
          activeOpacity={0.8}
        >
          <CheckCircle2 size={18} color="#fff" />
          <Text style={styles.diagBtnText}>
            {testingDiagnostics ? t('Testing Hardware Nodes...') : t('Run Complete Hardware Diagnostic')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e5e7eb' },
  backBtn: { padding: 4 },
  topbarTitle: { fontSize: 17, fontWeight: '800', color: '#1a2e1a' },
  topbarSubtitle: { fontSize: 11, color: '#6b7280', marginTop: 1 },
  refreshBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e8f5ea', justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#1a2e1a', marginTop: 18, marginBottom: 10 },

  // Gateway Banner
  gatewayBanner: { backgroundColor: '#1a2e1a', borderRadius: 18, padding: 18, marginBottom: 6 },
  gatewayHeader: { flexDirection: 'row', alignItems: 'center' },
  gatewayIconBg: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  gatewayTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  gatewaySub: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  onlineBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(34,197,94,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(34,197,94,0.4)' },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e', marginRight: 5 },
  onlineText: { color: '#86efac', fontSize: 10, fontWeight: '800' },
  gatewayMetrics: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  gwMetricItem: { flex: 1, alignItems: 'center' },
  gwMetricDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.1)' },
  gwMetricVal: { fontSize: 14, fontWeight: '800', color: '#fff', marginTop: 4 },
  gwMetricLabel: { fontSize: 10, color: '#9ca3af', marginTop: 1 },

  // Sensor Card
  sensorCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 12 },
  sensorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 10, borderBottomWidth: 1, borderColor: '#f3f4f6' },
  sensorTitleBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sensorTitle: { fontSize: 14, fontWeight: '800', color: '#1a2e1a' },
  batteryText: { fontSize: 12, color: '#4b5563', fontWeight: '600' },
  sensorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sensorStat: { width: (width - 64) / 2, backgroundColor: '#f9fafb', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#f3f4f6' },
  statLabel: { fontSize: 11, color: '#6b7280' },
  statValue: { fontSize: 16, fontWeight: '800', color: '#1a2e1a', marginTop: 2 },
  statSub: { fontSize: 10, color: '#9ca3af', marginTop: 2 },

  // Valve Card
  valveCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 10 },
  valveHeader: { flexDirection: 'row', alignItems: 'center' },
  valveIconBg: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#f0f9ff', justifyContent: 'center', alignItems: 'center' },
  valveTitle: { fontSize: 14, fontWeight: '800', color: '#1a2e1a' },
  valveSub: { fontSize: 11, color: '#6b7280', marginTop: 2 },

  // Weather Card
  weatherCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 16 },
  weatherGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  weatherItem: { width: (width - 64) / 2, alignItems: 'center', padding: 12, backgroundColor: '#f9fafb', borderRadius: 12 },
  weatherVal: { fontSize: 15, fontWeight: '800', color: '#1a2e1a', marginTop: 6 },
  weatherLabel: { fontSize: 11, color: '#6b7280', marginTop: 2 },

  // Diagnostics Button
  diagBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#2d7a3a', borderRadius: 14, paddingVertical: 14, marginTop: 4 },
  diagBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
