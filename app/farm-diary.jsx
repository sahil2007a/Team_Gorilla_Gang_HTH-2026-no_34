import { useLanguage } from '../context/LanguageContext';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

import { Colors } from '../constants/colors';
import { Spacing, Radius, Shadow } from '../constants/spacing';
import { FontSize } from '../constants/typography';
import { mockDiaryEntries } from '../data/mockTasks';
import { Calendar, Plus } from 'lucide-react-native';
import { useAuth } from '../hooks/useAuth';

export default function FarmDiaryScreen() {
  const { t } = useLanguage();
  const { farmer } = useAuth();
  const [entries, setEntries] = useState(mockDiaryEntries);

  const getTagStyle = (tagColor) => {
    if (tagColor === 'green') return { bg: '#E6F7EE', text: Colors.success };
    if (tagColor === 'pink') return { bg: '#FCECEC', text: '#D15B75' };
    if (tagColor === 'red') return { bg: Colors.danger, text: '#FFFFFF' };
    return { bg: Colors.surface, text: Colors.text };
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{farmer?.name?.[0] || 'R'}</Text>
        </View>
        <Text style={styles.brandName}>{t('Farm Diary')}</Text>
        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.8}>
          <Calendar size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.timelineContainer}>
          {entries.map((day, dayIndex) => {
            const isLastDay = dayIndex === entries.length - 1;
            return (
              <View key={day.id} style={styles.dayBlock}>
                {/* Timeline Line (hides for the last item's padding) */}
                {!isLastDay && <View style={styles.timelineLine} />}
                
                <View style={styles.dayHeader}>
                  <View style={[styles.dayDot, day.isToday ? styles.dotSolid : styles.dotHollow]} />
                  <Text style={styles.dayLabel}>{day.dayLabel}</Text>
                </View>
                
                <View style={styles.dayContent}>
                  {day.entries.map((entry) => {
                    const tagStyle = getTagStyle(entry.tagColor);
                    return (
                      <View key={entry.id} style={styles.entryCard}>
                        <View style={styles.entryHeaderRow}>
                          <View style={[styles.tagPill, { backgroundColor: tagStyle.bg }]}>
                            <Text style={[styles.tagText, { color: tagStyle.text }]}>{entry.tag}</Text>
                          </View>
                          <Text style={styles.entryTime}>{entry.time}</Text>
                        </View>
                        <Text style={styles.entryText}>{entry.text}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ height: Spacing['3xl'] }} />
      </ScrollView>

      <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
        <Plus size={24} color="#FFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: FontSize.xs,
  },
  brandName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { padding: Spacing.xl },
  timelineContainer: {
    paddingLeft: Spacing.xs,
  },
  dayBlock: {
    position: 'relative',
    paddingBottom: Spacing.xl,
  },
  timelineLine: {
    position: 'absolute',
    left: 5,
    top: 24,
    bottom: 0,
    width: 2,
    backgroundColor: Colors.border,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  dayDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  dotSolid: {
    backgroundColor: Colors.primary,
  },
  dotHollow: {
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: '#C0C6BE',
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  dayContent: {
    paddingLeft: 28,
  },
  entryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  entryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  tagPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  entryTime: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  entryText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    bottom: Spacing['2xl'],
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6A8760',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.md,
  },
});
