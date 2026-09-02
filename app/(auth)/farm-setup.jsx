import { useLanguage } from '../../context/LanguageContext';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';

import { WebView } from 'react-native-webview';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useCrop, SOIL_TYPES, INDIAN_STATES } from '../../context/CropContext';
import { Check, Store, Tractor, Home } from 'lucide-react-native';

const WATER_SOURCES = ['Well', 'Borewell', 'Canal', 'River', 'Rainwater', 'Tank'];
const WATER_AVAILABILITY = ['Low', 'Medium', 'High'];

const MARKET_PREFERENCES = [
  { id: 'apmc', label: 'Local APMC / Mandi', icon: Store, desc: 'Sell to local wholesale market' },
  { id: 'contract', label: 'Contract Farming', icon: Tractor, desc: 'Pre-agreed corporate buyer' },
  { id: 'dtc', label: 'Direct to Consumer', icon: Home, desc: 'Sell directly to local buyers' },
];

const SectionCard = ({ title, children, style }) => (
  <View style={[styles.card, style]}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const PickerGrid = ({ label, options, selected, onSelect, color }) => {
  const { t } = useLanguage();
  return (
    <View style={{ marginBottom: Spacing.lg }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.chipWrap}>
        {options.map((opt) => {
          const active = selected === opt;
          return (
            <TouchableOpacity
              key={opt}
              style={[styles.chip, active && { backgroundColor: color || Colors.primary, borderColor: color || Colors.primary }]}
              onPress={() => onSelect(opt)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{t(opt)}</Text>
              {active && <Check size={12} color="#fff" />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default function FarmSetupScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { saveFarm } = useCrop();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ── FARM FIELDS ──
  const [farmName, setFarmName] = useState('');
  const [area, setArea] = useState('');
  const [areaUnit, setAreaUnit] = useState('Acres');
  const [addressLine1, setAddressLine1] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [village, setVillage] = useState('');
  const [soilType, setSoilType] = useState('');
  const [waterAvail, setWaterAvail] = useState('');
  const [waterSource, setWaterSource] = useState('');
  const [marketPref, setMarketPref] = useState(null);

  // Map URL generation based on user input
  const mapQuery = [addressLine1, village, district, state].filter(Boolean).join(', ');
  const mapUrl = mapQuery 
    ? `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed` 
    : `https://maps.google.com/maps?q=India&output=embed`;

  const handleNext = async () => {
    if (!farmName || !area || !state || !district || !soilType || !marketPref) {
      setError('Please fill all required Farm details and select a market preference.');
      return;
    }

    setLoading(true);

    // Save Farm
    await saveFarm({
      id: `farm_${Date.now()}`,
      name: farmName,
      area: parseFloat(area),
      areaUnit,
      soilType,
      waterAvailability: waterAvail,
      waterSource,
      location: { address: addressLine1, state, district, village },
      lat: 21.1458,
      lng: 79.0882,
      preferredMarket: marketPref,
      registeredAt: new Date().toISOString(),
    });

    setLoading(false);
    // Move to next screen: Crop Setup
    router.push('/(auth)/crop-setup');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('1. Farm Setup')}</Text>
        <Text style={styles.headerSub}>{t('Register your land details')}</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          <SectionCard title={t('Basic Info')}>
            <Input label={t('Farm Name *')} value={farmName} onChangeText={setFarmName} placeholder="e.g. North Field, Deshmukh Farm" autoCapitalize="words" />
            <View style={styles.areaRow}>
              <View style={{ flex: 1 }}>
                <Input label={t('Total Area *')} value={area} onChangeText={setArea} placeholder="e.g. 5" keyboardType="decimal-pad" />
              </View>
              <View style={styles.unitToggle}>
                {['Acres', 'Hectares'].map((u) => (
                  <TouchableOpacity key={u} style={[styles.unitBtn, areaUnit === u && styles.unitBtnActive]} onPress={() => setAreaUnit(u)}>
                    <Text style={[styles.unitText, areaUnit === u && styles.unitTextActive]}>{t(u)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </SectionCard>

          {/* Location & Live Map */}
          <SectionCard title={t('Location')}>
            <Input label={t('Address Line 1')} value={addressLine1} onChangeText={setAddressLine1} placeholder="e.g. Plot 42, Main Road" />
            
            <View style={styles.row}>
              <View style={{ flex: 1 }}><Input label={t('District *')} value={district} onChangeText={setDistrict} placeholder="e.g. Nagpur" autoCapitalize="words" /></View>
              <View style={{ flex: 1, marginLeft: Spacing.sm }}><Input label={t('Village/Town')} value={village} onChangeText={setVillage} placeholder="e.g. Khapri" autoCapitalize="words" /></View>
            </View>

            <View style={{ marginBottom: Spacing.md }}>
              <Text style={styles.fieldLabel}>{t('State *')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                  {INDIAN_STATES.map((s) => (
                    <TouchableOpacity key={s} style={[styles.stateChip, state === s && styles.stateChipActive]} onPress={() => setState(s)}>
                      <Text style={[styles.stateChipText, state === s && styles.stateChipTextActive]}>{t(s)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
            
            {/* Live Google Maps Embed */}
            <View style={styles.mapContainer}>
              {Platform.OS === 'web' ? (
                <iframe src={mapUrl} style={{ width: '100%', height: '100%', border: 0 }} allowFullScreen="" loading="lazy" />
              ) : (
                <WebView 
                  source={{ uri: mapUrl }} 
                  style={{ flex: 1 }} 
                  scrollEnabled={false} 
                  showsVerticalScrollIndicator={false} 
                  showsHorizontalScrollIndicator={false}
                />
              )}
            </View>
            <Text style={styles.mapHelperText}>{t('Map updates automatically based on your address')}</Text>
          </SectionCard>

          {/* Soil & Water */}
          <SectionCard title={t('Soil & Water')}>
            <PickerGrid label={t('Soil Type *')} options={SOIL_TYPES} selected={soilType} onSelect={setSoilType} color="#8B5A2B" />
            <PickerGrid label={t('Water Availability')} options={WATER_AVAILABILITY} selected={waterAvail} onSelect={setWaterAvail} color={Colors.info} />
            <PickerGrid label={t('Primary Water Source')} options={WATER_SOURCES} selected={waterSource} onSelect={setWaterSource} color={Colors.info} />
          </SectionCard>

          {/* Sales Strategy */}
          <SectionCard title={t('Preferred Market *')}>
            {MARKET_PREFERENCES.map((m) => {
              const Icon = m.icon;
              const active = marketPref === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.marketTile, active && styles.marketTileActive]}
                  onPress={() => setMarketPref(m.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.marketIconBox, active && { backgroundColor: Colors.primary }]}>
                    <Icon size={20} color={active ? '#fff' : Colors.textSecondary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.marketLabel, active && { color: Colors.primary }]}>{t(m.label)}</Text>
                    <Text style={styles.marketDesc}>{t(m.desc)}</Text>
                  </View>
                  {active && <Check size={20} color={Colors.primary} />}
                </TouchableOpacity>
              )
            })}
          </SectionCard>

          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <Button
            title={t('Save Farm & Continue to Crop →')}
            onPress={handleNext}
            loading={loading}
            size="lg"
            style={{ marginTop: Spacing.lg }}
          />

          <View style={{ height: Spacing['4xl'] }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: Spacing.xl, paddingBottom: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: 24, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 },
  headerSub: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  scroll: { padding: Spacing.base },
  
  card: { backgroundColor: '#FFFFFF', borderRadius: Radius['2xl'], padding: Spacing.xl, marginBottom: Spacing.md, ...Shadow.sm, borderWidth: 1, borderColor: Colors.border },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.text, marginBottom: Spacing.md },
  row: { flexDirection: 'row' },
  
  // Area Row
  areaRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.md },
  unitToggle: { flexDirection: 'row', backgroundColor: Colors.background, borderRadius: Radius.full, padding: 3, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  unitBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full },
  unitBtnActive: { backgroundColor: Colors.primary },
  unitText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  unitTextActive: { color: '#FFF' },
  
  // Live Map
  mapContainer: { height: 180, borderRadius: Radius.xl, overflow: 'hidden', marginBottom: 8, borderWidth: 1, borderColor: Colors.border, backgroundColor: '#E8F5E9' },
  mapHelperText: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.lg },
  
  // State Chips
  stateChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  stateChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  stateChipText: { fontSize: 13, fontWeight: '600', color: Colors.text },
  stateChipTextActive: { color: '#FFF' },
  
  // General Chips
  fieldLabel: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginBottom: 8 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.background },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.text },
  chipTextActive: { color: '#FFF' },
  
  // Market Preference
  marketTile: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: Radius.xl, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.background, marginBottom: Spacing.md, gap: Spacing.md },
  marketTileActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  marketIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  marketLabel: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 2 },
  marketDesc: { fontSize: 12, color: Colors.textSecondary },
  
  errorText: { fontSize: 13, color: Colors.danger, textAlign: 'center', marginTop: Spacing.md },
});
