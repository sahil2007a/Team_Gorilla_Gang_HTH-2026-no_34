import { useLanguage } from '../context/LanguageContext';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform, Image } from 'react-native';

import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../constants/colors';
import { Spacing, Radius, Shadow } from '../constants/spacing';
import { FontSize } from '../constants/typography';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useCrop } from '../context/CropContext';
import { ArrowLeft, Check, Wheat, Droplets, FlaskConical, Tractor, Users, Package, Zap, HelpCircle, Camera, ImagePlus } from 'lucide-react-native';

import { apiClient } from '../services/api';

const EXPENSE_TYPES = [
  { id: 'fertilizer', label: 'Fertilizers',  icon: FlaskConical, color: '#4A7C3F', bg: '#E6F7EE' },
  { id: 'seeds',      label: 'Seeds',         icon: Wheat,        color: '#F5A623', bg: '#FEF6E4' },
  { id: 'irrigation', label: 'Irrigation',    icon: Droplets,     color: '#4B88E1', bg: '#EAF2FB' },
  { id: 'labor',      label: 'Labor',         icon: Users,        color: '#7C3AED', bg: '#EDE9FE' },
  { id: 'machinery',  label: 'Machinery',     icon: Tractor,      color: '#6B7F5A', bg: '#E8EBE4' },
  { id: 'pesticide',  label: 'Pesticides',    icon: Package,      color: '#DC2626', bg: '#FEE2E2' },
  { id: 'electricity',label: 'Electricity',   icon: Zap,          color: '#F59E0B', bg: '#FEF3C7' },
  { id: 'other',      label: 'Other',         icon: HelpCircle,   color: '#6B7068', bg: '#F5F3EB' },
];

const PAYMENT_MODES = ['Cash', 'UPI', 'Bank Transfer', 'Credit', 'Cheque'];

export default function AddExpenseScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { activeCrop } = useCrop();

  const [photo, setPhoto] = useState(params.photoUri || null);

  const [expenseType, setExpenseType] = useState(null);
  const [amount, setAmount] = useState('');
  const [payee, setPayee] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!expenseType) { setError('Please select an expense type.'); return; }
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const selectedObj = EXPENSE_TYPES.find((e) => e.id === expenseType);
      await apiClient.post('/finances/add', {
        type: 'expense',
        category: selectedObj?.label || 'Other',
        amount: parseFloat(amount),
        crop_name: activeCrop?.name || null,
        description: notes || payee || paymentMode,
        entry_date: date,
      });
      setSaved(true);
      setTimeout(() => router.back(), 800);
    } catch (err) {
      setError(err.message || 'Failed to save expense');
    } finally {
      setSaving(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
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

  const selectedType = EXPENSE_TYPES.find((t) => t.id === expenseType);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('Add Expense')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Crop context chip */}
          {activeCrop && (
            <View style={[styles.cropChip, { backgroundColor: activeCrop.bgColor }]}>
              <Text style={styles.cropChipEmoji}>{activeCrop.emoji}</Text>
              <Text style={[styles.cropChipText, { color: activeCrop.color }]}>
                {activeCrop.name} — {activeCrop.fieldName}
              </Text>
            </View>
          )}

          {/* Type Selection */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('Expense Type *')}</Text>
            <View style={styles.typeGrid}>
              {EXPENSE_TYPES.map((type) => {
                const Icon = type.icon;
                const active = expenseType === type.id;
                return (
                  <TouchableOpacity
                    key={type.id}
                    style={[styles.typeTile, active && { backgroundColor: type.bg, borderColor: type.color, borderWidth: 2 }]}
                    onPress={() => { setExpenseType(type.id); setError(''); }}
                    activeOpacity={0.8}
                  >
                    {active && <View style={[styles.typeBadge, { backgroundColor: type.color }]}><Check size={8} color="#fff" /></View>}
                    <Icon size={22} color={active ? type.color : Colors.textSecondary} />
                    <Text style={[styles.typeLabel, active && { color: type.color, fontWeight: '800' }]}>{type.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Amount & Date */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('Amount & Date')}</Text>
            <Input
              label={t('Amount (₹) *')}
              value={amount}
              onChangeText={setAmount}
              placeholder="e.g. 2500"
              keyboardType="decimal-pad"
              leftLabel="₹"
            />
            <Input
              label={t('Date')}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
            />
          </View>

          {/* Paid To & Payment Mode */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('Payment Details')}</Text>
            <Input
              label={t('Paid To (Payee)')}
              value={payee}
              onChangeText={setPayee}
              placeholder="e.g. Raju Seeds Store, Labour Group"
              autoCapitalize="words"
            />
            <Text style={styles.fieldLabel}>{t('Payment Mode')}</Text>
            <View style={styles.chipRow}>
              {PAYMENT_MODES.map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[styles.chip, paymentMode === mode && styles.chipActive]}
                  onPress={() => setPaymentMode(mode)}
                >
                  <Text style={[styles.chipText, paymentMode === mode && styles.chipTextActive]}>{mode}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Photo Receipt / Evidence */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('Receipt / Photo')}</Text>
            {photo ? (
              <View style={styles.photoPreview}>
                <Image source={{ uri: photo }} style={styles.photo} resizeMode="cover" />
                <TouchableOpacity style={styles.photoRemove} onPress={() => setPhoto(null)}>
                  <Text style={styles.photoRemoveText}>{t('✕ Remove Photo')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.photoBtns}>
                <TouchableOpacity style={styles.photoBtn} onPress={takePhoto} activeOpacity={0.8}>
                  <Camera size={24} color={Colors.primary} />
                  <Text style={styles.photoBtnText}>{t('Take Photo')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoBtn} onPress={pickImage} activeOpacity={0.8}>
                  <ImagePlus size={24} color={Colors.info} />
                  <Text style={styles.photoBtnText}>{t('Gallery')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Notes */}
          <View style={styles.card}>
            <Input
              label={t('Notes (Optional)')}
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g. NPK 20:20:20 for Sector 1, 50 kg bag"
              multiline
              numberOfLines={3}
            />
          </View>

          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <Button
            title={saved ? '✓ Saved!' : `Save ${selectedType ? selectedType.label : 'Expense'}`}
            onPress={handleSave}
            loading={saving}
            size="lg"
            style={{ marginTop: Spacing.sm, backgroundColor: saved ? Colors.success : Colors.primary }}
          />
          <View style={{ height: Spacing['3xl'] }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  cropChip: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    padding: Spacing.sm, borderRadius: Radius.full, alignSelf: 'flex-start',
    marginBottom: Spacing.md, paddingHorizontal: Spacing.md,
  },
  cropChipEmoji: { fontSize: 16 },
  cropChipText: { fontSize: 13, fontWeight: '700' },
  card: {
    backgroundColor: '#FFF', borderRadius: Radius['2xl'], padding: Spacing.xl,
    marginBottom: Spacing.md, ...Shadow.sm, borderWidth: 1, borderColor: Colors.border,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: Spacing.md },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  typeTile: {
    width: '22%', aspectRatio: 0.85, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.background, borderRadius: Radius.lg, borderWidth: 1.5,
    borderColor: Colors.border, gap: 4, position: 'relative',
  },
  typeBadge: { position: 'absolute', top: 5, right: 5, width: 14, height: 14, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  typeLabel: { fontSize: 10, fontWeight: '700', color: Colors.textSecondary, textAlign: 'center' },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginBottom: Spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.background },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.text },
  chipTextActive: { color: '#FFF' },
  errorText: { fontSize: 13, color: Colors.danger, textAlign: 'center', marginBottom: Spacing.sm },
  photoBtns: { flexDirection: 'row', gap: Spacing.md },
  photoBtn: { flex: 1, height: 100, borderRadius: Radius.xl, borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.background },
  photoBtnText: { fontSize: 13, fontWeight: '700', color: Colors.text },
  photoPreview: { borderRadius: Radius.xl, overflow: 'hidden' },
  photo: { width: '100%', height: 200, borderRadius: Radius.xl },
  photoRemove: { alignItems: 'center', paddingTop: Spacing.sm },
  photoRemoveText: { fontSize: 13, color: Colors.danger, fontWeight: '700' },
});
