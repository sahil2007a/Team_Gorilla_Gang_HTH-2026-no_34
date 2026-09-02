import { useLanguage } from '../../context/LanguageContext';
import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import MapView, { Marker } from '../../components/Map';

import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import { FontSize } from '../../constants/typography';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useCrop, CROP_CATALOG, IRRIGATION_SYSTEMS } from '../../context/CropContext';
import { Check, Droplets, Ruler, Calendar, Info, Sun, MapPin, ArrowLeft, Navigation } from 'lucide-react-native';

// ─── IMPORTANT ────────────────────────────────────────────────────────────────
// Replace the value below with your own Google Maps API key.
// Enable "Geocoding API" and "Maps SDK for Android / iOS" in Google Cloud Console.
// ──────────────────────────────────────────────────────────────────────────────
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

// Default region: Nagpur, Maharashtra, India
const DEFAULT_REGION = {
  latitude: 21.1458,
  longitude: 79.0882,
  latitudeDelta: 0.3,
  longitudeDelta: 0.3,
};

const SectionCard = ({ title, children }) => (
  <View style={styles.card}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

export default function CropSetupScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { saveCrop, farmSetup } = useCrop();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Selections
  const [selectedCropId, setSelectedCropId] = useState(null);
  const [cropVariety, setCropVariety] = useState('');
  const [acreage, setAcreage] = useState('');
  const [fieldName, setFieldName] = useState('');
  const [irrigationId, setIrrigationId] = useState(null);
  const [sowingDate, setSowingDate] = useState('');
  const [notes, setNotes] = useState('');
  const [otherCropName, setOtherCropName] = useState('');
  const [farmAddress, setFarmAddress] = useState(farmSetup?.location?.address || '');

  // Map state
  const [mapRegion, setMapRegion] = useState(DEFAULT_REGION);
  const [markerCoord, setMarkerCoord] = useState(null);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState('');
  const debounceRef = useRef(null);
  const mapRef = useRef(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const displayCatalog = [
    ...CROP_CATALOG,
    { id: 'other', name: 'Other', emoji: '🌱', duration: 100, stages: ['Sowing', 'Vegetative', 'Flowering', 'Harvest'], color: Colors.text, bgColor: Colors.border },
  ];
  const selectedCrop = displayCatalog.find((c) => c.id === selectedCropId);
  const farmArea = farmSetup?.area || 5;
  const areaUnit = farmSetup?.areaUnit || 'Acres';

  // ── Geocode the typed address via OpenStreetMap (Nominatim) REST API (FREE) ──
  const geocodeAddress = async (address) => {
    if (!address || address.trim().length < 3) return;
    if (!isMounted.current) return;
    setGeocoding(true);
    setGeocodeError('');
    try {
      const query = encodeURIComponent(
        [address, farmSetup?.location?.village, farmSetup?.location?.district, farmSetup?.location?.state, 'India']
          .filter(Boolean)
          .join(', ')
      );
      // Using Nominatim which is 100% free and requires no API key
      const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;
      
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'AgriFlowApp/1.0', // Nominatim requires a User-Agent
        }
      });
      const data = await res.json();

      if (!isMounted.current) return;

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);

        const newRegion = {
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };

        setMapRegion(newRegion);
        setMarkerCoord({ latitude: lat, longitude: lng });

        // Animate map to the new region
        mapRef.current?.animateToRegion(newRegion, 800);
      } else {
        setGeocodeError(t('Location not found. Try a more specific address.'));
      }
    } catch (e) {
      if (!isMounted.current) return;
      setGeocodeError(t('Could not load map. Check internet connection.'));
    } finally {
      if (isMounted.current) {
        setGeocoding(false);
      }
    }
  };

  // Debounce geocoding: wait 800ms after user stops typing
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!farmAddress || farmAddress.trim().length < 3) {
      setMarkerCoord(null);
      setGeocodeError('');
      return;
    }
    debounceRef.current = setTimeout(() => {
      geocodeAddress(farmAddress);
    }, 800);
    return () => clearTimeout(debounceRef.current);
  }, [farmAddress]);

  const handleSave = async () => {
    if (!selectedCropId) { setError(t('Please select a crop.')); return; }
    if (!acreage) { setError(t('Please enter the acreage for this crop.')); return; }
    if (!irrigationId) { setError(t('Please select an irrigation system.')); return; }
    if (!sowingDate) { setError(t('Please enter the sowing date.')); return; }

    setLoading(true);
    const today = new Date();
    const sow = new Date(sowingDate);
    const daysSinceSowing = Math.max(0, Math.floor((today - sow) / (1000 * 60 * 60 * 24)));

    await saveCrop({
      id: `crop_${Date.now()}`,
      cropId: selectedCropId,
      name: selectedCropId === 'other' ? (otherCropName || 'Custom Crop') : selectedCrop.name,
      emoji: selectedCrop.emoji,
      variety: cropVariety || `${selectedCropId === 'other' ? (otherCropName || 'Custom Crop') : selectedCrop.name} Standard`,
      fieldName: fieldName || 'Main Field',
      farmAddress,
      farmLatLng: markerCoord,
      acreage: parseFloat(acreage),
      areaUnit,
      irrigationSystem: irrigationId,
      sowingDate,
      durationDays: selectedCrop.duration,
      currentDay: Math.min(daysSinceSowing, selectedCrop.duration),
      expectedHarvestDate: (() => {
        const d = new Date(sowingDate);
        d.setDate(d.getDate() + selectedCrop.duration);
        return d.toISOString().split('T')[0];
      })(),
      currentStage: selectedCrop.stages[0] || 'Sowing',
      stages: selectedCrop.stages,
      notes,
      color: selectedCrop.color,
      bgColor: selectedCrop.bgColor,
      registeredAt: new Date().toISOString(),
    });
    setLoading(false);
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{t('Register Your Crop')}</Text>
          <Text style={styles.headerSub}>{t('Select the crop you are currently growing')}</Text>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* ── CROP SELECTION GRID ── */}
          <Text style={styles.gridLabel}>{t('Choose Your Crop')}</Text>
          <View style={styles.cropGrid}>
            {displayCatalog.map((crop) => {
              const active = selectedCropId === crop.id;
              return (
                <TouchableOpacity
                  key={crop.id}
                  style={[
                    styles.cropTile,
                    active && { borderColor: crop.color, borderWidth: 2.5, backgroundColor: crop.bgColor },
                  ]}
                  onPress={() => {
                    setSelectedCropId(crop.id);
                    setError('');
                  }}
                  activeOpacity={0.8}
                >
                  {active && (
                    <View style={[styles.checkBadge, { backgroundColor: crop.color }]}>
                      <Check size={10} color="#FFF" />
                    </View>
                  )}
                  <Text style={styles.cropEmoji}>{crop.emoji}</Text>
                  <Text style={[styles.cropName, active && { color: crop.color, fontWeight: '800' }]}>
                    {t(crop.name)}
                  </Text>
                  <Text style={styles.cropDuration}>{crop.duration}d</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Detailed Crop Info (Dynamic) */}
          {selectedCrop && (
            <>
              <View style={[styles.cropInfoCard, { borderColor: selectedCrop.color, backgroundColor: selectedCrop.bgColor }]}>
                <View style={styles.cropInfoHeader}>
                  <Text style={styles.cropInfoEmoji}>{selectedCrop.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cropInfoTitle, { color: selectedCrop.color }]}>
                      {selectedCropId === 'other' ? (otherCropName || t('Custom Crop')) : t(selectedCrop.name)} {t('Data')}
                    </Text>
                    <Text style={styles.cropInfoSub}>
                      {t('Standard lifecycle')}: {selectedCrop.duration} {t('days')}
                    </Text>
                  </View>
                </View>
                <View style={styles.cropInfoGrid}>
                  <View style={styles.cropInfoStat}>
                    <Droplets size={16} color={Colors.info} />
                    <Text style={styles.cropInfoStatText}>{t('Water Req: Medium')}</Text>
                  </View>
                  <View style={styles.cropInfoStat}>
                    <Sun size={16} color={Colors.warning} />
                    <Text style={styles.cropInfoStatText}>{t('Sunlight: Full Sun')}</Text>
                  </View>
                  <View style={styles.cropInfoStat}>
                    <Info size={16} color={Colors.primary} />
                    <Text style={styles.cropInfoStatText}>{selectedCrop.stages.length} {t('Growth Stages')}</Text>
                  </View>
                </View>
              </View>

              {/* Crop Details */}
              <SectionCard title={t('Crop Details')}>
                {selectedCropId === 'other' && (
                  <Input
                    label={t('Custom Crop Name *')}
                    value={otherCropName}
                    onChangeText={setOtherCropName}
                    placeholder="e.g. Turmeric, Ginger"
                    autoCapitalize="words"
                  />
                )}
                <Input
                  label={t('Variety / Name')}
                  value={cropVariety}
                  onChangeText={setCropVariety}
                  placeholder="e.g. JS 335, Premium"
                  autoCapitalize="words"
                />
                <Input
                  label={t('Field / Block Name')}
                  value={fieldName}
                  onChangeText={setFieldName}
                  placeholder="e.g. North Block, Field A"
                  autoCapitalize="words"
                />
              </SectionCard>

              {/* ── FARM LOCATION with Live Google Map ── */}
              <SectionCard title={t('Farm Location')}>
                <Input
                  label={t('Farm Address *')}
                  value={farmAddress}
                  onChangeText={setFarmAddress}
                  placeholder="e.g. Ramtek, Nagpur"
                  multiline
                />

                {/* Live Native Google Map */}
                <View style={styles.mapWrapper}>
                  {/* Loading spinner overlay */}
                  {geocoding && (
                    <View style={styles.mapLoadingOverlay}>
                      <ActivityIndicator size="large" color={Colors.primary} />
                      <Text style={styles.mapLoadingText}>{t('Locating on map...')}</Text>
                    </View>
                  )}

                  {Platform.OS === 'web' ? (
                    <iframe
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapRegion.longitude - 0.05},${mapRegion.latitude - 0.05},${mapRegion.longitude + 0.05},${mapRegion.latitude + 0.05}&layer=mapnik&marker=${markerCoord ? `${markerCoord.latitude},${markerCoord.longitude}` : ''}`}
                      title="Farm Location"
                    />
                  ) : (
                    <WebView
                      style={styles.map}
                      source={{ uri: `https://www.openstreetmap.org/export/embed.html?bbox=${mapRegion.longitude - 0.05},${mapRegion.latitude - 0.05},${mapRegion.longitude + 0.05},${mapRegion.latitude + 0.05}&layer=mapnik&marker=${markerCoord ? `${markerCoord.latitude},${markerCoord.longitude}` : ''}` }}
                      scrollEnabled={true}
                      showsHorizontalScrollIndicator={false}
                      showsVerticalScrollIndicator={false}
                    />
                  )}

                  {/* Address pill overlay on map */}
                  {farmAddress && !geocoding && (
                    <View style={styles.mapAddressPill}>
                      <Navigation size={12} color={Colors.primary} />
                      <Text style={styles.mapAddressPillText} numberOfLines={1}>
                        {farmAddress}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Error or hint below map */}
                {geocodeError ? (
                  <Text style={styles.mapError}>{geocodeError}</Text>
                ) : (
                  <Text style={styles.mapHelperText}>
                    {t('Map updates automatically as you type the address')}
                  </Text>
                )}

                {/* Location badge */}
                {markerCoord && (
                  <View style={styles.coordBadge}>
                    <MapPin size={14} color={Colors.primary} />
                    <Text style={styles.coordText}>
                      {markerCoord.latitude.toFixed(5)}°N, {markerCoord.longitude.toFixed(5)}°E
                    </Text>
                  </View>
                )}
              </SectionCard>

              {/* Acreage */}
              <SectionCard title={t('Area Allocation')}>
                <View style={styles.acreageHint}>
                  <Ruler size={14} color={Colors.textSecondary} />
                  <Text style={styles.acreageHintText}>
                    {t('Total farm')}: {farmArea} {t(areaUnit)}
                  </Text>
                </View>
                <Input
                  label={`${t('Acreage for')} ${selectedCropId === 'other' ? (otherCropName || t('Custom Crop')) : t(selectedCrop.name)} *`}
                  value={acreage}
                  onChangeText={setAcreage}
                  placeholder={`e.g. ${farmArea}`}
                  keyboardType="decimal-pad"
                  rightLabel={t(areaUnit)}
                />
              </SectionCard>

              {/* Irrigation System */}
              <SectionCard title={t('Irrigation System')}>
                <View style={styles.irrigationGrid}>
                  {IRRIGATION_SYSTEMS.map((sys) => {
                    const active = irrigationId === sys.id;
                    return (
                      <TouchableOpacity
                        key={sys.id}
                        style={[styles.irrigationTile, active && styles.irrigationTileActive]}
                        onPress={() => setIrrigationId(sys.id)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.irrigationEmoji}>{sys.emoji}</Text>
                        <Text style={[styles.irrigationLabel, active && styles.irrigationLabelActive]}>
                          {t(sys.label)}
                        </Text>
                        <Text style={styles.irrigationDesc}>{t(sys.desc)}</Text>
                        {active && (
                          <View style={styles.irrigationCheck}>
                            <Check size={10} color="#FFF" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </SectionCard>

              {/* Sowing Date */}
              <SectionCard title={t('Sowing Schedule')}>
                <Input
                  label={t('Sowing Date *')}
                  value={sowingDate}
                  onChangeText={setSowingDate}
                  placeholder="YYYY-MM-DD (e.g. 2026-06-28)"
                  keyboardType="numbers-and-punctuation"
                  leftIcon={<Calendar size={16} color={Colors.textSecondary} />}
                />
                {sowingDate.length === 10 && (
                  <View style={styles.harvestPreview}>
                    <Text style={styles.harvestLabel}>{t('📅 Expected Harvest:')}</Text>
                    <Text style={styles.harvestDate}>
                      {(() => {
                        try {
                          const d = new Date(sowingDate);
                          d.setDate(d.getDate() + selectedCrop.duration);
                          return d.toDateString();
                        } catch { return '—'; }
                      })()}
                    </Text>
                  </View>
                )}
                <Input
                  label={t('Additional Notes')}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Any special conditions, observations..."
                  multiline
                  numberOfLines={2}
                />
              </SectionCard>
            </>
          )}

          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <Button
            title={selectedCrop
              ? `${t('Register')} ${selectedCropId === 'other' ? (otherCropName || t('Custom Crop')) : t(selectedCrop.name)} →`
              : t('Select a crop to continue')}
            onPress={handleSave}
            loading={loading}
            size="lg"
            style={{ marginTop: Spacing.sm, opacity: selectedCrop ? 1 : 0.5 }}
          />

          <TouchableOpacity style={styles.skipBtn} onPress={() => router.replace('/(tabs)')} activeOpacity={0.7}>
            <Text style={styles.skipText}>{t('Skip for now →')}</Text>
          </TouchableOpacity>

          <View style={{ height: Spacing['4xl'] }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  backBtn: { padding: Spacing.xs, borderRadius: Radius.md },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
  headerSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  scroll: { padding: Spacing.base },
  gridLabel: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  cropGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  cropTile: {
    width: '22.5%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    position: 'relative',
    minHeight: 76,
    justifyContent: 'center',
  },
  checkBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropEmoji: { fontSize: 28, marginBottom: 4 },
  cropName: { fontSize: 10, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  cropDuration: { fontSize: 9, color: Colors.textMuted, marginTop: 2 },
  cropInfoCard: { borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1.5 },
  cropInfoHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  cropInfoEmoji: { fontSize: 32 },
  cropInfoTitle: { fontSize: 18, fontWeight: '800' },
  cropInfoSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  cropInfoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  cropInfoStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.md,
  },
  cropInfoStatText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  acreageHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.background,
    padding: Spacing.sm,
    borderRadius: Radius.md,
  },
  acreageHintText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  irrigationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  irrigationTile: {
    width: '30%',
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    position: 'relative',
    minHeight: 90,
    justifyContent: 'center',
  },
  irrigationTileActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  irrigationEmoji: { fontSize: 22, marginBottom: 4 },
  irrigationLabel: { fontSize: 12, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  irrigationLabelActive: { color: Colors.primary },
  irrigationDesc: { fontSize: 9, color: Colors.textMuted, textAlign: 'center', marginTop: 2 },
  irrigationCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  harvestPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primaryLight,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  harvestLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  harvestDate: { fontSize: 13, fontWeight: '800', color: Colors.primary },
  errorText: { fontSize: 13, color: Colors.danger, textAlign: 'center', marginBottom: Spacing.sm },
  skipBtn: { alignItems: 'center', paddingVertical: Spacing.md },
  skipText: { fontSize: 14, color: Colors.textMuted, fontWeight: '600' },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  // ── Map Styles ───────────────────────────────────────────────────────────────
  mapWrapper: {
    height: 220,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    backgroundColor: '#E8E3DC',
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapLoadingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.82)',
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  mapLoadingText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  mapAddressPill: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.93)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    ...Shadow.sm,
  },
  mapAddressPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  mapHelperText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
    fontStyle: 'italic',
    marginBottom: Spacing.sm,
  },
  mapError: {
    fontSize: 12,
    color: Colors.warning,
    marginTop: 4,
    marginBottom: Spacing.sm,
    fontWeight: '600',
  },
  coordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.md,
    alignSelf: 'flex-start',
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  coordText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    fontVariant: ['tabular-nums'],
  },
});
