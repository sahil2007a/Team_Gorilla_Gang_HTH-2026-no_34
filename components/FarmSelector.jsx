import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { Radius, Shadow, Spacing } from '../constants/spacing';
import { FontSize, FontWeight } from '../constants/typography';
import { ChevronDown, Leaf } from 'lucide-react-native';
import { useLanguage } from '../context/LanguageContext';

export const FarmSelector = ({ farm, onPress }) => {
  const { t } = useLanguage();
  if (!farm) return null;
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.iconWrap}>
        <Leaf size={16} color={Colors.primary} />
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{farm.name || t('My Farm')}</Text>
        <Text style={styles.subtitle}>
          {farm.area} {t(farm.areaUnit || 'Acres')} • {t(farm.cropName || '')}
        </Text>
      </View>
      <ChevronDown size={16} color={Colors.textSecondary} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  name: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  subtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
});
