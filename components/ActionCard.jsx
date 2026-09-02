import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { Radius, Shadow, Spacing } from '../constants/spacing';
import { FontSize, FontWeight } from '../constants/typography';
import { Badge } from './ui/Badge';
import { ArrowRight, CheckCircle } from 'lucide-react-native';
import { useLanguage } from '../context/LanguageContext';

const priorityConfig = {
  high: { variant: 'high', label: 'High Priority', accent: Colors.danger },
  medium: { variant: 'medium', label: 'Medium', accent: Colors.warning },
  low: { variant: 'low', label: 'Low', accent: Colors.success },
  completed: { variant: 'completed', label: 'Done', accent: Colors.textMuted },
};

export const ActionCard = ({ task, onAction, onComplete }) => {
  const { t } = useLanguage();
  const scale = useRef(new Animated.Value(1)).current;
  const config = priorityConfig[task.status === 'completed' ? 'completed' : task.priority] || priorityConfig.medium;
  const isCompleted = task.status === 'completed';

  const handlePressIn = () =>
    Animated.spring(scale, { toValue: 0.98, useNativeDriver: true }).start();
  const handlePressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Animated.View style={[{ transform: [{ scale }] }]}>
      <View style={[styles.card, isCompleted && styles.completedCard]}>
        <View style={[styles.accent, { backgroundColor: config.accent }]} />
        <View style={styles.content}>
          <View style={styles.row}>
            <Text style={[styles.title, isCompleted && styles.completedText]}>{t(task.title)}</Text>
            <Badge label={t(config.label)} variant={config.variant} />
          </View>
          <Text style={[styles.description, isCompleted && styles.completedText]}>{t(task.description)}</Text>

          {!isCompleted && (
            <View style={styles.actions}>
              {task.actionLabel && (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => onAction && onAction(task)}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionBtnText}>{t(task.actionLabel)}</Text>
                  <ArrowRight size={13} color={Colors.primary} />
                </TouchableOpacity>
              )}
              {task.actionLabel === 'Mark Complete' && (
                <TouchableOpacity
                  style={styles.completeBtn}
                  onPress={() => onComplete && onComplete(task.id)}
                  activeOpacity={0.8}
                >
                  <CheckCircle size={14} color={Colors.textMuted} />
                  <Text style={styles.completeBtnText}>{t('Done')}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  completedCard: {
    opacity: 0.6,
    backgroundColor: Colors.surfaceMuted,
  },
  accent: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    flex: 1,
    marginRight: Spacing.sm,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  description: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtnText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  completeBtnText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
});
