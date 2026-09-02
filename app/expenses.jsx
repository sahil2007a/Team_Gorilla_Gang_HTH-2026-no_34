import { useLanguage } from '../context/LanguageContext';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';

import { useRouter } from 'expo-router';
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import { Colors } from '../constants/colors';
import { Spacing, Radius, Shadow } from '../constants/spacing';
import { FontSize, FontWeight } from '../constants/typography';
import { apiClient } from '../services/api';
import { SectionHeader } from '../components/ui/SectionHeader';
import { StatCard } from '../components/ui/StatCard';
import { ArrowLeft, Plus, Receipt } from 'lucide-react-native';

const CATEGORY_COLORS = {
  Seeds: '#F5A623',
  Fertilizers: '#4A7C3F',
  Pesticides: '#DC2626',
  Labor: '#7C3AED',
  Machinery: '#6B7F5A',
  Irrigation: '#4B88E1',
  Electricity: '#F59E0B',
  Other: '#6B7068',
};

const DonutChart = ({ categories = [], size = 160 }) => {
  if (!categories.length) return null;
  const r = 54;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  let offset = 0;
  const slices = categories.map((cat) => {
    const dash = (cat.percent / 100) * circumference;
    const gap = circumference - dash;
    const slice = { ...cat, dash, gap, offset };
    offset += dash;
    return slice;
  });

  return (
    <Svg width={size} height={size}>
      {slices.map((s, i) => (
        <SvgCircle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={s.color}
          strokeWidth={22}
          strokeDasharray={`${s.dash} ${s.gap}`}
          strokeDashoffset={-s.offset + circumference * 0.25}
        />
      ))}
    </Svg>
  );
};

export default function ExpensesScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const [data, setData] = useState({ expenses: [], total: 0, categories: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRealExpenses();
  }, []);

  const loadRealExpenses = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/finances/summary');
      const allEntries = res.entries || [];
      const expenseEntries = allEntries.filter((e) => e.type === 'expense');
      const totalExp = expenseEntries.reduce((sum, e) => sum + e.amount, 0);

      // Group by category
      const catMap = {};
      expenseEntries.forEach((e) => {
        catMap[e.category] = (catMap[e.category] || 0) + e.amount;
      });

      const catList = Object.keys(catMap).map((catName) => ({
        name: catName,
        amount: catMap[catName],
        percent: totalExp > 0 ? Math.round((catMap[catName] / totalExp) * 100) : 0,
        color: CATEGORY_COLORS[catName] || '#6B7068',
      }));

      setData({
        expenses: expenseEntries,
        total: totalExp,
        totalIncome: res.total_income || 0,
        netBalance: res.net_balance || 0,
        categories: catList,
      });
    } catch (e) {
      console.log('Error loading real expenses:', e);
      setData({ expenses: [], total: 0, totalIncome: 0, netBalance: 0, categories: [] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
            <ArrowLeft size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('Expenses')}</Text>
          <TouchableOpacity
            style={styles.addBtn}
            activeOpacity={0.8}
            onPress={() => router.push('/add-expense')}
          >
            <Plus size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Summary Stats */}
        <View style={styles.statsGrid}>
          <StatCard label={t('Total Expenses')} value={`₹${data.total.toLocaleString()}`} color="#dc2626" />
          <StatCard label={t('Total Incomes')} value={`₹${(data.totalIncome || 0).toLocaleString()}`} color="#15803d" />
        </View>

        {/* Expense Distribution */}
        {data.categories.length > 0 && (
          <>
            <SectionHeader title={t('Expense Distribution')} style={{ marginTop: Spacing.base }} />
            <View style={styles.chartCard}>
              <View style={styles.chartRow}>
                <DonutChart categories={data.categories} />
                <View style={styles.legend}>
                  {data.categories.map((cat, i) => (
                    <View key={i} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
                      <View style={styles.legendText}>
                        <Text style={styles.legendLabel}>{cat.name}</Text>
                        <Text style={styles.legendAmount}>
                          ₹{cat.amount.toLocaleString()} ({cat.percent}%)
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </>
        )}

        {/* Expense List */}
        <SectionHeader
          title={t('Logged Expenses')}
          action={
            <TouchableOpacity onPress={() => router.push('/add-expense')}>
              <Text style={styles.addText}>+ {t('Add New')}</Text>
            </TouchableOpacity>
          }
          style={{ marginTop: Spacing.base }}
        />

        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 30 }} />
        ) : data.expenses.length === 0 ? (
          <View style={styles.emptyCard}>
            <Receipt size={44} color="#9ca3af" />
            <Text style={styles.emptyTitle}>{t('No Expenses Logged Yet')}</Text>
            <Text style={styles.emptySub}>
              {t('All dummy data has been removed. Tap + to record your real farm expenses.')}
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => router.push('/add-expense')}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyBtnText}>{t('Add First Expense')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          data.expenses.map((exp) => (
            <View key={exp.id} style={styles.expenseItem}>
              <View style={[styles.categoryDot, { backgroundColor: CATEGORY_COLORS[exp.category] || '#6B7068' }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.expenseCategory}>{exp.category}</Text>
                <Text style={styles.expenseDesc}>
                  {exp.crop_name ? `${exp.crop_name} • ` : ''}
                  {exp.description || exp.entry_date}
                </Text>
                <Text style={styles.expenseDate}>{exp.entry_date}</Text>
              </View>
              <Text style={styles.expenseAmount}>-₹{exp.amount.toLocaleString()}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    padding: Spacing.md,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  chartCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  legend: {
    flex: 1,
    gap: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    flex: 1,
  },
  legendLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  legendAmount: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  addText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.sm,
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
    marginBottom: Spacing.md,
  },
  emptyBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  emptyBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  expenseItem: {
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
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  expenseCategory: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
  },
  expenseDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  expenseDate: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  expenseAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#dc2626',
  },
});
