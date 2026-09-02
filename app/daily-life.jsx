import { useLanguage } from '../context/LanguageContext';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image, Platform } from 'react-native';

import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../constants/colors';
import { Spacing, Radius, Shadow } from '../constants/spacing';
import { FontSize } from '../constants/typography';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useCrop } from '../context/CropContext';
import { ArrowLeft, Camera, ImagePlus, Plus, Droplets, Sun, Cloud, Wind, Check } from 'lucide-react-native';

const DAY_EXAMPLES = [
  { day: 0, label: 'Sowing Day', desc: 'Seeds placed in rows, soil covered. Ground level.' },
  { day: 1, label: 'Day 1', desc: 'Soil appears wet, seeds below surface, no visible sprout.' },
  { day: 2, label: 'Day 2', desc: 'Soil cracks visible where seeds are germinating.' },
  { day: 3, label: 'Day 3', desc: 'First small green shoot breaking through soil surface.' },
  { day: 4, label: 'Day 4', desc: 'Cotyledon (seed leaves) fully emerged, pale green.' },
  { day: 5, label: 'Day 5', desc: 'First true leaves starting to unfurl, deeper green color.' },
];

const WEATHER_OPTIONS = [
  { id: 'sunny',  label: 'Sunny',   icon: Sun,   color: '#F59E0B' },
  { id: 'cloudy', label: 'Cloudy',  icon: Cloud, color: '#6B7F5A' },
  { id: 'rainy',  label: 'Rainy',   icon: Droplets, color: '#4B88E1' },
  { id: 'windy',  label: 'Windy',   icon: Wind,  color: '#7C3AED' },
];

export default function DailyLifeScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { activeCrop } = useCrop();
  const [selectedDay, setSelectedDay] = useState(0);
  const [photo, setPhoto] = useState(null);
  const [weather, setWeather] = useState(null);
  const [note, setNote] = useState('');
  const [temp, setTemp] = useState('');
  const [humidity, setHumidity] = useState('');
  const [saved, setSaved] = useState(false);
  const [entries, setEntries] = useState([]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  };

  const handleSaveEntry = () => {
    const ex = DAY_EXAMPLES[selectedDay];
    setEntries((prev) => [
      {
        id: Date.now(),
        day: selectedDay,
        label: ex.label,
        photo,
        weather,
        note: note || ex.desc,
        temp,
        humidity,
        savedAt: new Date().toLocaleTimeString(),
      },
      ...prev,
    ]);
    setPhoto(null);
    setNote('');
    setTemp('');
    setHumidity('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('Daily Crop Life')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Active crop */}
        {activeCrop && (
          <View style={[styles.cropBanner, { backgroundColor: activeCrop.bgColor }]}>
            <Text style={styles.cropEmoji}>{activeCrop.emoji}</Text>
            <View>
              <Text style={[styles.cropName, { color: activeCrop.color }]}>{t(activeCrop.name)}</Text>
              <Text style={styles.cropSub}>{t('Day')} {activeCrop.currentDay} {t('since sowing')}</Text>
            </View>
          </View>
        )}

        {/* Day selector (0–5) */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('Select Day (0 – 5)')}</Text>
          <Text style={styles.sectionSub}>{t('Document early germination stages with photos')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: Spacing.md }}>
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              {DAY_EXAMPLES.map((d) => (
                <TouchableOpacity
                  key={d.day}
                  style={[styles.dayBtn, selectedDay === d.day && styles.dayBtnActive]}
                  onPress={() => setSelectedDay(d.day)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dayNum, selectedDay === d.day && styles.dayNumActive]}>
                    {d.day === 0 ? 'Day 0' : `Day ${d.day}`}
                  </Text>
                  <Text style={[styles.dayLabel, selectedDay === d.day && styles.dayLabelActive]}>{t(d.label)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Example card for selected day */}
          <View style={styles.exampleBox}>
            <Text style={styles.exampleTitle}>📌 {t('Example')} — {t(DAY_EXAMPLES[selectedDay].label)}</Text>
            <Text style={styles.exampleDesc}>{t(DAY_EXAMPLES[selectedDay].desc)}</Text>
          </View>
        </View>

        {/* Photo upload */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('Upload / Take Photo')}</Text>
          {photo ? (
            <View style={styles.photoPreview}>
              <Image source={{ uri: photo }} style={styles.photo} resizeMode="cover" />
              <TouchableOpacity style={styles.photoRemove} onPress={() => setPhoto(null)}>
                <Text style={styles.photoRemoveText}>{t('✕ Remove')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.photoBtns}>
              <TouchableOpacity style={styles.photoBtn} onPress={takePhoto} activeOpacity={0.8}>
                <Camera size={24} color={Colors.primary} />
                <Text style={styles.photoBtnText}>{t('Camera')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoBtn} onPress={pickImage} activeOpacity={0.8}>
                <ImagePlus size={24} color={Colors.info} />
                <Text style={styles.photoBtnText}>{t('Gallery')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Weather & Conditions */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('Today\'s Conditions')}</Text>
          <View style={styles.weatherRow}>
            {WEATHER_OPTIONS.map((w) => {
              const Icon = w.icon;
              const active = weather === w.id;
              return (
                <TouchableOpacity
                  key={w.id}
                  style={[styles.weatherBtn, active && { backgroundColor: w.color + '22', borderColor: w.color }]}
                  onPress={() => setWeather(w.id)}
                  activeOpacity={0.8}
                >
                  <Icon size={22} color={active ? w.color : Colors.textSecondary} />
                  <Text style={[styles.weatherLabel, active && { color: w.color, fontWeight: '800' }]}>{t(w.label)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.condRow}>
            <View style={{ flex: 1 }}>
              <Input label={t('Temp (°C)')} value={temp} onChangeText={setTemp} placeholder="e.g. 28" keyboardType="decimal-pad" />
            </View>
            <View style={{ flex: 1 }}>
              <Input label={t('Humidity (%)')} value={humidity} onChangeText={setHumidity} placeholder="e.g. 75" keyboardType="decimal-pad" />
            </View>
          </View>
          <Input label={t('Observation Note')} value={note} onChangeText={setNote} placeholder={t(DAY_EXAMPLES[selectedDay].desc)} multiline numberOfLines={3} />
        </View>

        <Button
          title={saved ? `✓ ${t('Saved!')}` : `${t('Save Day Entry →')}`}
          onPress={handleSaveEntry}
          size="lg"
          style={{ marginTop: Spacing.sm, backgroundColor: saved ? Colors.success : Colors.primary }}
        />

        {/* Past entries */}
        {entries.length > 0 && (
          <View style={{ marginTop: Spacing.xl }}>
            <Text style={styles.pastTitle}>{t('Past Entries')}</Text>
            {entries.map((e) => (
              <View key={e.id} style={styles.entryCard}>
                <View style={styles.entryLeft}>
                  {e.photo ? (
                    <Image source={{ uri: e.photo }} style={styles.entryThumb} />
                  ) : (
                    <View style={styles.entryThumbPlaceholder}>
                      <Text style={{ fontSize: 18 }}>{activeCrop?.emoji || '🌱'}</Text>
                    </View>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.entryLabel}>{e.label}</Text>
                  <Text style={styles.entryNote} numberOfLines={2}>{e.note}</Text>
                  <Text style={styles.entrySub}>{e.savedAt} {e.weather ? `· ${e.weather}` : ''}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: Spacing['3xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface,
  },
  backBtn: { width: 40, height: 40, borderRadius: Radius.md, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  scroll: { padding: Spacing.base },
  cropBanner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, borderRadius: Radius.xl, marginBottom: Spacing.md },
  cropEmoji: { fontSize: 32 },
  cropName: { fontSize: 16, fontWeight: '800' },
  cropSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  card: { backgroundColor: '#FFF', borderRadius: Radius['2xl'], padding: Spacing.xl, marginBottom: Spacing.md, ...Shadow.sm, borderWidth: 1, borderColor: Colors.border },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.text },
  sectionSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  dayBtn: { width: 70, height: 72, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.background, gap: 4 },
  dayBtnActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  dayNum: { fontSize: 15, fontWeight: '800', color: Colors.textSecondary },
  dayNumActive: { color: Colors.primary },
  dayLabel: { fontSize: 9, fontWeight: '600', color: Colors.textMuted },
  dayLabelActive: { color: Colors.primary },
  exampleBox: { backgroundColor: Colors.background, borderRadius: Radius.lg, padding: Spacing.md, marginTop: Spacing.md },
  exampleTitle: { fontSize: 13, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  exampleDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  photoBtns: { flexDirection: 'row', gap: Spacing.md },
  photoBtn: { flex: 1, height: 100, borderRadius: Radius.xl, borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.background },
  photoBtnText: { fontSize: 13, fontWeight: '700', color: Colors.text },
  photoPreview: { borderRadius: Radius.xl, overflow: 'hidden' },
  photo: { width: '100%', height: 200, borderRadius: Radius.xl },
  photoRemove: { alignItems: 'center', paddingTop: Spacing.sm },
  photoRemoveText: { fontSize: 13, color: Colors.danger, fontWeight: '700' },
  weatherRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  weatherBtn: { flex: 1, alignItems: 'center', gap: 4, padding: Spacing.sm, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.background },
  weatherLabel: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },
  condRow: { flexDirection: 'row', gap: Spacing.md },
  pastTitle: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: Spacing.md },
  entryCard: { flexDirection: 'row', gap: Spacing.md, backgroundColor: '#FFF', borderRadius: Radius.xl, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.sm, borderWidth: 1, borderColor: Colors.border },
  entryLeft: {},
  entryThumb: { width: 60, height: 60, borderRadius: Radius.md },
  entryThumbPlaceholder: { width: 60, height: 60, borderRadius: Radius.md, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  entryLabel: { fontSize: 14, fontWeight: '800', color: Colors.text },
  entryNote: { fontSize: 12, color: Colors.textSecondary, marginTop: 2, lineHeight: 18 },
  entrySub: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
});
