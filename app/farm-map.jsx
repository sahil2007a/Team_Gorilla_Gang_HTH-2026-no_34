import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRouter } from 'expo-router';
import MapView, { Marker, Polygon } from '../components/Map';
import { Colors } from '../constants/colors';
import { Spacing, Radius, Shadow } from '../constants/spacing';
import { FontSize, FontWeight } from '../constants/typography';
import { mockFarm } from '../data/mockFarm';
import { SectionHeader } from '../components/ui/SectionHeader';
import { ArrowLeft, MapPin, Droplets, Warehouse, Store } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const RealFarmMap = ({ farm }) => {
  const mapWidth = SCREEN_WIDTH - 32;
  const mapHeight = 250;

  // Approximate a polygon around the farm center for demonstration
  const lat = farm.location.lat;
  const lng = farm.location.lng;
  const offset = 0.002;
  const farmCoordinates = [
    { latitude: lat + offset, longitude: lng - offset },
    { latitude: lat + offset, longitude: lng + offset },
    { latitude: lat - offset, longitude: lng + offset },
    { latitude: lat - offset, longitude: lng - offset },
  ];

  return (
    <View style={{ borderRadius: 16, overflow: 'hidden' }}>
      {Platform.OS === 'web' ? (
        <iframe
          width="100%"
          height={mapHeight}
          style={{ border: 0 }}
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.015},${lat - 0.015},${lng + 0.015},${lat + 0.015}&layer=mapnik&marker=${lat},${lng}`}
          title="Farm Map"
        />
      ) : (
        <WebView
          style={{ width: mapWidth, height: mapHeight }}
          source={{ uri: `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.015},${lat - 0.015},${lng + 0.015},${lat + 0.015}&layer=mapnik&marker=${lat},${lng}` }}
          scrollEnabled={true}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default function FarmMapScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const farm = mockFarm;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
            <ArrowLeft size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('Farm Map')}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Map */}
        <View style={styles.mapCard}>
          <RealFarmMap farm={farm} />
        </View>

        {/* Legend */}
        <SectionHeader title={t('Map Legend')} style={{ marginTop: Spacing.base }} />
        <View style={styles.legendCard}>
          <LegendItem icon={<MapPin size={16} color={Colors.primary} />} label="Farm Boundary" desc="5 Acres — Soybean" />
          <LegendItem icon={<Droplets size={16} color={Colors.info} />} label="Water Source" desc={`Well — ${farm.waterSource.distanceMeters} m from farm`} />
          <LegendItem icon={<Warehouse size={16} color={Colors.warning} />} label="Storage Facility" desc={`${farm.storageDistanceKm} km from farm`} />
          <LegendItem icon={<Store size={16} color={Colors.success} />} label="Nagpur Mandi" desc={`${farm.mandiDistanceKm} km from farm`} />
        </View>

        {/* Location Info */}
        <SectionHeader title={t('Farm Location')} style={{ marginTop: Spacing.base }} />
        <View style={styles.locationCard}>
          <View style={styles.coordRow}>
            <Text style={styles.coordLabel}>{t('Latitude')}</Text>
            <Text style={styles.coordValue}>{farm.location.lat}° N</Text>
          </View>
          <View style={styles.coordRow}>
            <Text style={styles.coordLabel}>{t('Longitude')}</Text>
            <Text style={styles.coordValue}>{farm.location.lng}° E</Text>
          </View>
          <View style={styles.coordRow}>
            <Text style={styles.coordLabel}>{t('Village')}</Text>
            <Text style={styles.coordValue}>{farm.location.village}</Text>
          </View>
          <View style={styles.coordRow}>
            <Text style={styles.coordLabel}>{t('District')}</Text>
            <Text style={styles.coordValue}>{farm.location.district}, {farm.location.state}</Text>
          </View>
        </View>

        <View style={{ height: Spacing['2xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const LegendItem = ({ icon, label, desc }) => (
  <View style={legendStyles.row}>
    <View style={legendStyles.icon}>{icon}</View>
    <View>
      <Text style={legendStyles.label}>{label}</Text>
      <Text style={legendStyles.desc}>{desc}</Text>
    </View>
  </View>
);

const legendStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text },
  desc: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 1 },
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
  mapCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    ...Shadow.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mapFooter: {
    padding: Spacing.md,
    backgroundColor: Colors.background,
  },
  mapNote: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  legendCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  locationCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  coordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  coordLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  coordValue: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text },
});
