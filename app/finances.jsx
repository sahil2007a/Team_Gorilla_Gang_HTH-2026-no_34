import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Plus,
  PlusCircle,
  Receipt,
  ArrowDownCircle,
  ArrowUpCircle,
  Trash2,
  X,
  Wallet,
  TrendingUp,
  TrendingDown,
  PieChart,
  Calendar,
  CheckCircle2,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/colors';
import { Radius, Shadow, Spacing } from '../constants/spacing';
import { FontSize, FontWeight } from '../constants/typography';
import { useLanguage } from '../context/LanguageContext';
import { apiClient } from '../services/api';

const EXPENSE_CATEGORIES = [
  'Fertilizers',
  'Seeds',
  'Pesticides',
  'Labor',
  'Machinery & Fuel',
  'Irrigation & Electricity',
  'Transport & Logistics',
  'Other Expense',
];

const INCOME_CATEGORIES = [
  'Crop Sale (Harvest)',
  'Government Subsidy (PM-KISAN)',
  'Dairy & Livestock',
  'Equipment Rental',
  'Contract Farming',
  'Other Income',
];

export default function FinancesScreen() {
  const { t, tb } = useLanguage();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All'); // 'All', 'Income', 'Expense'

  const [summary, setSummary] = useState({
    total_income: 0,
    total_expenses: 0,
    net_balance: 0,
    income_breakdown: [],
    expense_breakdown: [],
    entries: [],
  });

  // Modal State for Quick Add
  const [modalVisible, setModalVisible] = useState(false);
  const [entryType, setEntryType] = useState('expense');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [cropName, setCropName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchFinances();
  }, []);

  const fetchFinances = async () => {
    try {
      const data = await apiClient.get('/finances/summary');
      if (data) {
        setSummary({
          total_income: data.total_income || 0,
          total_expenses: data.total_expenses || 0,
          net_balance: data.net_balance || 0,
          income_breakdown: data.income_breakdown || [],
          expense_breakdown: data.expense_breakdown || [],
          entries: data.entries || [],
        });
      }
    } catch (err) {
      console.warn('Failed to load farmer finances:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchFinances();
  };

  const handleOpenAddModal = (type) => {
    setEntryType(type);
    setCategory(type === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
    setModalVisible(true);
  };

  const handleAddEntry = async () => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert(t('Required'), t('Please enter a valid positive amount.'));
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post('/finances/add', {
        type: entryType,
        category,
        amount: parseFloat(amount),
        crop_name: cropName.trim() || null,
        description: description.trim() || null,
      });
      setModalVisible(false);
      setAmount('');
      setCropName('');
      setDescription('');
      fetchFinances();
      Alert.alert(
        t('Success'),
        `${entryType === 'income' ? t('Income') : t('Expense')} ${t('recorded successfully!')}`
      );
    } catch (err) {
      Alert.alert(t('Error'), err.message || t('Failed to save transaction'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEntry = async (id) => {
    Alert.alert(
      t('Delete Transaction'),
      t('Are you sure you want to remove this record?'),
      [
        { text: t('Cancel'), style: 'cancel' },
        {
          text: t('Delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/finances/${id}`);
              fetchFinances();
            } catch (err) {
              Alert.alert(t('Error'), err.message || t('Failed to delete'));
            }
          },
        },
      ]
    );
  };

  const filteredEntries = summary.entries.filter((item) => {
    if (activeFilter === 'Income') return item.type === 'income';
    if (activeFilter === 'Expense') return item.type === 'expense';
    return true;
  });

  const totalIncome = summary.total_income || 0;
  const totalExpenses = summary.total_expenses || 0;
  const netBalance = summary.net_balance || 0;
  const savingsRate =
    totalIncome > 0 ? Math.max(0, Math.round((netBalance / totalIncome) * 100)) : 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Topbar */}
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.topbarTitle}>{t('Farm Finances & Ledger')}</Text>
        <TouchableOpacity
          style={styles.addHeaderBtn}
          onPress={() => handleOpenAddModal('expense')}
          activeOpacity={0.8}
        >
          <Plus size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* ── 1. HERO NET FARM SAVINGS CARD ── */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.walletIconWrap}>
              <Wallet size={20} color="#15803d" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroSub}>{t('Net Farm Savings (शिल्लक बचत)')}</Text>
              <Text
                style={[
                  styles.heroBalance,
                  { color: netBalance >= 0 ? '#15803d' : '#dc2626' },
                ]}
              >
                ₹{netBalance.toLocaleString('en-IN')}
              </Text>
            </View>
            {totalIncome > 0 && (
              <View style={styles.savingsRateBadge}>
                <Text style={styles.savingsRateText}>{savingsRate}% {t('Saved')}</Text>
              </View>
            )}
          </View>

          <View style={styles.heroDivider} />

          {/* Incomes & Expenses Row */}
          <View style={styles.totalsRow}>
            {/* Total Incomes */}
            <View style={styles.totalBlock}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <ArrowDownCircle size={16} color="#16a34a" />
                <Text style={styles.totalBlockLabel}>{t('Total Incomes (+ जमा)')}</Text>
              </View>
              <Text style={[styles.totalBlockVal, { color: '#15803d' }]}>
                +₹{totalIncome.toLocaleString('en-IN')}
              </Text>
            </View>

            <View style={styles.verticalDivider} />

            {/* Total Expenses */}
            <View style={styles.totalBlock}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <ArrowUpCircle size={16} color="#dc2626" />
                <Text style={styles.totalBlockLabel}>{t('Total Expenses (- खर्च)')}</Text>
              </View>
              <Text style={[styles.totalBlockVal, { color: '#dc2626' }]}>
                -₹{totalExpenses.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </View>

        {/* ── 2. QUICK ACTION BUTTONS ── */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#15803d' }]}
            onPress={() => handleOpenAddModal('income')}
            activeOpacity={0.8}
          >
            <PlusCircle size={18} color="#fff" />
            <Text style={styles.actionBtnText}>{t('+ Add Income')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#dc2626' }]}
            onPress={() => handleOpenAddModal('expense')}
            activeOpacity={0.8}
          >
            <PlusCircle size={18} color="#fff" />
            <Text style={styles.actionBtnText}>{t('+ Add Expense')}</Text>
          </TouchableOpacity>
        </View>

        {/* ── 3. CATEGORY BREAKDOWN CARDS ── */}
        {(summary.expense_breakdown?.length > 0 || summary.income_breakdown?.length > 0) && (
          <View style={styles.breakdownSection}>
            {summary.expense_breakdown?.length > 0 && (
              <View style={styles.breakdownCard}>
                <Text style={styles.breakdownTitle}>📉 {t('Top Expenses Breakdown')}</Text>
                {summary.expense_breakdown.slice(0, 4).map((cat, idx) => {
                  const pct = totalExpenses > 0 ? Math.round((cat.total / totalExpenses) * 100) : 0;
                  return (
                    <View key={idx} style={styles.catRow}>
                      <View style={styles.catInfo}>
                        <Text style={styles.catName}>{cat.category}</Text>
                        <Text style={styles.catAmount}>₹{cat.total.toLocaleString('en-IN')} ({pct}%)</Text>
                      </View>
                      <View style={styles.catBarBg}>
                        <View style={[styles.catBarFill, { width: `${pct}%`, backgroundColor: '#dc2626' }]} />
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {summary.income_breakdown?.length > 0 && (
              <View style={styles.breakdownCard}>
                <Text style={styles.breakdownTitle}>📈 {t('Income Sources Breakdown')}</Text>
                {summary.income_breakdown.slice(0, 4).map((cat, idx) => {
                  const pct = totalIncome > 0 ? Math.round((cat.total / totalIncome) * 100) : 0;
                  return (
                    <View key={idx} style={styles.catRow}>
                      <View style={styles.catInfo}>
                        <Text style={styles.catName}>{cat.category}</Text>
                        <Text style={styles.catAmount}>₹{cat.total.toLocaleString('en-IN')} ({pct}%)</Text>
                      </View>
                      <View style={styles.catBarBg}>
                        <View style={[styles.catBarFill, { width: `${pct}%`, backgroundColor: '#15803d' }]} />
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* ── 4. TRANSACTION HISTORY & FILTER TABS ── */}
        <View style={styles.historySectionHeader}>
          <Text style={styles.sectionTitle}>{t('Transaction History')}</Text>
          <Text style={styles.entriesCount}>
            {filteredEntries.length} {t('records')}
          </Text>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterTabs}>
          {['All', 'Income', 'Expense'].map((tab) => {
            const isSelected = activeFilter === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.filterTab, isSelected && styles.filterTabActive]}
                onPress={() => setActiveFilter(tab)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterTabText, isSelected && styles.filterTabTextActive]}>
                  {tab === 'All'
                    ? t('All Transactions')
                    : tab === 'Income'
                    ? `🟢 ${t('Incomes')}`
                    : `🔴 ${t('Expenses')}`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Entries List */}
        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 30 }} />
        ) : filteredEntries.length === 0 ? (
          <View style={styles.emptyCard}>
            <Receipt size={48} color="#9ca3af" />
            <Text style={styles.emptyTitle}>{t('No Transactions Recorded Yet')}</Text>
            <Text style={styles.emptySub}>
              {t('Use the buttons above to record your farm expenses and harvest sales.')}
            </Text>
          </View>
        ) : (
          filteredEntries.map((item) => {
            const isInc = item.type === 'income';
            return (
              <View key={item.id} style={styles.itemCard}>
                <View style={[styles.iconBg, { backgroundColor: isInc ? '#dcfce7' : '#fee2e2' }]}>
                  {isInc ? (
                    <ArrowDownCircle size={22} color="#15803d" />
                  ) : (
                    <ArrowUpCircle size={22} color="#dc2626" />
                  )}
                </View>

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.itemCategory}>
                    {item.category} {item.crop_name ? `• ${item.crop_name}` : ''}
                  </Text>
                  {item.description ? (
                    <Text style={styles.itemDesc}>{item.description}</Text>
                  ) : null}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <Calendar size={11} color={Colors.textMuted} />
                    <Text style={styles.itemDate}>{item.entry_date || 'Today'}</Text>
                  </View>
                </View>

                <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
                  <Text
                    style={[
                      styles.itemAmount,
                      { color: isInc ? '#15803d' : '#dc2626' },
                    ]}
                  >
                    {isInc ? '+' : '-'}₹{item.amount.toLocaleString('en-IN')}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleDeleteEntry(item.id)}
                    style={styles.deleteBtn}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Trash2 size={14} color="#9ca3af" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── 5. RECORD TRANSACTION MODAL ── */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {entryType === 'income' ? t('Log Farm Income') : t('Log Farm Expense')}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Type Switcher */}
            <View style={styles.typeSwitcher}>
              <TouchableOpacity
                style={[styles.typeBtn, entryType === 'expense' && styles.typeBtnExpenseActive]}
                onPress={() => {
                  setEntryType('expense');
                  setCategory(EXPENSE_CATEGORIES[0]);
                }}
              >
                <Text
                  style={[
                    styles.typeBtnText,
                    entryType === 'expense' && styles.typeBtnTextActive,
                  ]}
                >
                  🔴 {t('Expense')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeBtn, entryType === 'income' && styles.typeBtnIncomeActive]}
                onPress={() => {
                  setEntryType('income');
                  setCategory(INCOME_CATEGORIES[0]);
                }}
              >
                <Text
                  style={[
                    styles.typeBtnText,
                    entryType === 'income' && styles.typeBtnTextActive,
                  ]}
                >
                  🟢 {t('Income')}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {/* Amount Input */}
              <Text style={styles.inputLabel}>{t('Amount (₹)')} *</Text>
              <TextInput
                style={styles.amountInput}
                keyboardType="numeric"
                placeholder="e.g. 4500"
                value={amount}
                onChangeText={setAmount}
                placeholderTextColor={Colors.textMuted}
              />

              {/* Category Selector */}
              <Text style={styles.inputLabel}>{t('Category')} *</Text>
              <View style={styles.catGrid}>
                {(entryType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => {
                  const isSel = category === c;
                  return (
                    <TouchableOpacity
                      key={c}
                      style={[styles.catChip, isSel && styles.catChipActive]}
                      onPress={() => setCategory(c)}
                    >
                      <Text style={[styles.catChipText, isSel && styles.catChipTextActive]}>
                        {c}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Crop Name */}
              <Text style={styles.inputLabel}>{t('Crop Name (Optional)')}</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Cotton, Soybean, Tomato"
                value={cropName}
                onChangeText={setCropName}
                placeholderTextColor={Colors.textMuted}
              />

              {/* Description */}
              <Text style={styles.inputLabel}>{t('Notes / Description')}</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Purchase of 2 bags Urea, Mandi harvest sale"
                value={description}
                onChangeText={setDescription}
                placeholderTextColor={Colors.textMuted}
              />
            </ScrollView>

            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
              onPress={handleAddEntry}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>{t('Save Transaction')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topbarTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  addHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: Spacing.md,
  },

  // Hero Net Balance Card
  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.md,
    marginBottom: Spacing.md,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  walletIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSub: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  heroBalance: {
    fontSize: 28,
    fontWeight: '900',
    marginTop: 2,
  },
  savingsRateBadge: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  savingsRateText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803d',
  },
  heroDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: Spacing.md,
  },
  totalsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalBlock: {
    flex: 1,
  },
  totalBlockLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  totalBlockVal: {
    fontSize: 18,
    fontWeight: '900',
  },
  verticalDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 12,
  },

  // Action Buttons
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.md,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: Radius.lg,
    ...Shadow.sm,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },

  // Category Breakdown
  breakdownSection: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  breakdownCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  breakdownTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 8,
  },
  catRow: {
    marginBottom: 8,
  },
  catInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  catName: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text,
  },
  catAmount: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  catBarBg: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  catBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  // History Section
  historySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  entriesCount: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  filterTabs: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: Spacing.sm,
  },
  filterTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    backgroundColor: '#f1f5f9',
    borderRadius: Radius.full,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
  },
  filterTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  filterTabTextActive: {
    color: '#fff',
  },

  // Item Card
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  iconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemCategory: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.text,
  },
  itemDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  itemDate: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  itemAmount: {
    fontSize: 15,
    fontWeight: '900',
  },
  deleteBtn: {
    marginTop: 4,
    padding: 2,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.md,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    padding: Spacing.lg,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  typeSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: Radius.lg,
    padding: 4,
    marginBottom: Spacing.md,
  },
  typeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  typeBtnExpenseActive: {
    backgroundColor: '#dc2626',
  },
  typeBtnIncomeActive: {
    backgroundColor: '#15803d',
  },
  typeBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  typeBtnTextActive: {
    color: '#fff',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
    marginTop: 6,
  },
  amountInput: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    backgroundColor: '#f0fdf4',
    marginBottom: Spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: Colors.text,
    backgroundColor: '#f8fafc',
    marginBottom: Spacing.sm,
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  catChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  catChipActive: {
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
  },
  catChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  catChipTextActive: {
    color: '#15803d',
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 13,
    borderRadius: Radius.lg,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
});
