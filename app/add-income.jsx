import { useLanguage } from '../context/LanguageContext';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';

import { useRouter } from 'expo-router';
import { Colors } from '../constants/colors';
import { Spacing, Radius, Shadow } from '../constants/spacing';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useCrop } from '../context/CropContext';
import { ArrowLeft, Check, Wheat, ShoppingBag, Truck, Award, BarChart2, HelpCircle } from 'lucide-react-native';

import { apiClient } from '../services/api';

const INCOME_TYPES = [
  { id: 'crop_sale',   label: 'Crop Sale',      icon: Wheat,       color: '#4A7C3F', bg: '#E6F7EE' },
  { id: 'govt_subsidy',label: 'Govt. Subsidy',  icon: Award,       color: '#7C3AED', bg: '#EDE9FE' },
  { id: 'contract',    label: 'Contract Farm',   icon: ShoppingBag, color: '#F5A623', bg: '#FEF6E4' },
  { id: 'transport',   label: 'Transport',       icon: Truck,       color: '#4B88E1', bg: '#EAF2FB' },
  { id: 'investment',  label: 'Investment',      icon: BarChart2,   color: '#10B981', bg: '#D1FAE5' },
  { id: 'other',       label: 'Other',           icon: HelpCircle,  color: '#6B7068', bg: '#F5F3EB' },
];

const PURPOSE_OPTIONS = [
  'Harvest Sale', 'Advance Payment', 'Government Scheme', 'Insurance Claim',
  'Rental Income', 'Bonus', 'Loan', 'Other',
];

const PAYMENT_MODES = ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'NEFT'];

export default function AddIncomeScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { activeCrop } = useCrop();

  const [incomeType, setIncomeType] = useState(null);
  const [amount, setAmount] = useState('');
  const [fromWhom, setFromWhom] = useState('');
  const [purpose, setPurpose] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [quantity, setQuantity] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Auto-calculate amount when qty + price provided
  const autoAmount = quantity && pricePerUnit
    ? (parseFloat(quantity) * parseFloat(pricePerUnit)).toFixed(2)
    : '';

  const handleSave = async () => {
    if (!incomeType) { setError('Please select an income type.'); return; }
    const finalAmount = amount || autoAmount;
    if (!finalAmount || isNaN(parseFloat(finalAmount)) || parseFloat(finalAmount) <= 0) {
      setError('Please enter a valid income amount.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const selectedTypeObj = INCOME_TYPES.find((t) => t.id === incomeType);
      await apiClient.post('/finances/add', {
        type: 'income',
        category: selectedTypeObj?.label || 'Other',
        amount: parseFloat(finalAmount),
        crop_name: activeCrop?.name || null,
        description: `${purpose ? purpose + ' - ' : ''}${fromWhom || ''}${notes ? ' (' + notes + ')' : ''}`,
        entry_date: date,
      });
      setSaved(true);
      setTimeout(() => router.back(), 800);
    } catch (err) {
      setError(err.message || 'Failed to save income');
    } finally {
      setSaving(false);
    }
  };

  const selectedType = INCOME_TYPES.find((t) => t.id === incomeType);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('Add Income')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {activeCrop && (
            <View style={[styles.cropChip, { backgroundColor: activeCrop.bgColor }]}>
              <Text style={styles.cropChipEmoji}>{activeCrop.emoji}</Text>
              <Text style={[styles.cropChipText, { color: activeCrop.color }]}>
                {activeCrop.name} — {activeCrop.fieldName}
              </Text>
            </View>
          )}

          {/* Income Type */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('Income Type *')}</Text>
            <View style={styles.typeGrid}>
              {INCOME_TYPES.map((type) => {
                const Icon = type.icon;
                const active = incomeType === type.id;
                return (
                  <TouchableOpacity
                    key={type.id}
                    style={[styles.typeTile, active && { backgroundColor: type.bg, borderColor: type.color, borderWidth: 2 }]}
                    onPress={() => { setIncomeType(type.id); setError(''); }}
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

          {/* From Whom & Why */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('Who & Why')}</Text>
            <Input
              label={t('From Whom (Source) *')}
              value={fromWhom}
              onChangeText={setFromWhom}
              placeholder="e.g. Nagpur Mandi, Govt. Portal, Trader Name"
              autoCapitalize="words"
            />
            <Text style={styles.fieldLabel}>{t('Purpose / Reason')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                {PURPOSE_OPTIONS.map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.chip, purpose === p && styles.chipActive]}
                    onPress={() => setPurpose(p)}
                  >
                    <Text style={[styles.chipText, purpose === p && styles.chipTextActive]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <Input
              label={t('Custom Purpose (Optional)')}
              value={purpose}
              onChangeText={setPurpose}
              placeholder="e.g. First harvest payment, Insurance claim"
            />
          </View>

          {/* Amount - with auto calculator */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('Amount')}</Text>
            {incomeType === 'crop_sale' && (
              <>
                <Text style={styles.calcHint}>{t('💡 Auto-calculate from quantity × price')}</Text>
                <View style={styles.calcRow}>
                  <View style={{ flex: 1 }}>
                    <Input label={`Qty (${activeCrop?.areaUnit || 'Kg/Quintal'})`} value={quantity} onChangeText={setQuantity} placeholder="e.g. 20" keyboardType="decimal-pad" />
                  </View>
                  <Text style={styles.calcX}>×</Text>
                  <View style={{ flex: 1 }}>
                    <Input label={t('Price/Unit (₹)')} value={pricePerUnit} onChangeText={setPricePerUnit} placeholder="e.g. 2800" keyboardType="decimal-pad" />
                  </View>
                </View>
                {autoAmount ? (
                  <View style={styles.autoAmountBanner}>
                    <Text style={styles.autoAmountLabel}>{t('Calculated Amount')}</Text>
                    <Text style={styles.autoAmountValue}>₹ {parseFloat(autoAmount).toLocaleString('en-IN')}</Text>
                  </View>
                ) : null}
              </>
            )}
            <Input
              label={autoAmount ? 'Override Amount (₹) — Leave blank to use calculated' : 'Amount (₹) *'}
              value={amount}
              onChangeText={setAmount}
              placeholder={autoAmount || 'e.g. 56000'}
              keyboardType="decimal-pad"
              leftLabel="₹"
            />
            <Input label={t('Date')} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
          </View>

          {/* Payment Mode */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('Payment Mode')}</Text>
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

          {/* Notes */}
          <View style={styles.card}>
            <Input label={t('Notes (Optional)')} value={notes} onChangeText={setNotes} placeholder="e.g. Sold 20 quintal wheat at ₹2800/qtl to Ramesh Traders" multiline numberOfLines={3} />
          </View>

          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <Button
            title={saved ? '✓ Saved!' : `Save ${selectedType ? selectedType.label : 'Income'}`}
            onPress={handleSave}
            loading={saving}
            size="lg"
            style={{ marginTop: Spacing.sm, backgroundColor: saved ? Colors.success : Colors.success }}
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
  cropChip: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.sm, borderRadius: Radius.full, alignSelf: 'flex-start', marginBottom: Spacing.md, paddingHorizontal: Spacing.md },
  cropChipEmoji: { fontSize: 16 },
  cropChipText: { fontSize: 13, fontWeight: '700' },
  card: { backgroundColor: '#FFF', borderRadius: Radius['2xl'], padding: Spacing.xl, marginBottom: Spacing.md, ...Shadow.sm, borderWidth: 1, borderColor: Colors.border },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: Spacing.md },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  typeTile: { width: '30%', aspectRatio: 1.1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.border, gap: 4, position: 'relative' },
  typeBadge: { position: 'absolute', top: 5, right: 5, width: 14, height: 14, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  typeLabel: { fontSize: 10, fontWeight: '700', color: Colors.textSecondary, textAlign: 'center' },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginBottom: Spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.background },
  chipActive: { backgroundColor: Colors.success, borderColor: Colors.success },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.text },
  chipTextActive: { color: '#FFF' },
  calcHint: { fontSize: 12, color: Colors.textSecondary, marginBottom: Spacing.sm },
  calcRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  calcX: { fontSize: 20, fontWeight: '800', color: Colors.textMuted, paddingTop: Spacing.lg },
  autoAmountBanner: { backgroundColor: '#E6F7EE', borderRadius: Radius.lg, padding: Spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  autoAmountLabel: { fontSize: 13, color: Colors.success, fontWeight: '600' },
  autoAmountValue: { fontSize: 18, fontWeight: '800', color: Colors.success },
  errorText: { fontSize: 13, color: Colors.danger, textAlign: 'center', marginBottom: Spacing.sm },
});
