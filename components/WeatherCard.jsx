import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { Radius, Shadow, Spacing } from '../constants/spacing';
import { FontSize, FontWeight } from '../constants/typography';
import { Droplets, Wind, CloudRain, Thermometer } from 'lucide-react-native';
import { useLanguage } from '../context/LanguageContext';

const conditionEmoji = {
  partly_cloudy: '⛅',
  sunny: '☀️',
  rainy: '🌧️',
  cloudy: '☁️',
  stormy: '⛈️',
};

export const WeatherCard = ({ weather }) => {
  const { t } = useLanguage();
  if (!weather) return null;
  const emoji = conditionEmoji[weather.conditionCode] || '🌤️';

  return (
    <View style={styles.card}>
      <View style={styles.main}>
        <View>
          <Text style={styles.emoji}>{emoji}</Text>
          <Text style={styles.condition}>{t(weather.condition)}</Text>
          <Text style={styles.location}>{t(weather.location)}</Text>
        </View>
        <View style={styles.tempContainer}>
          <Text style={styles.temp}>{weather.temperature}°</Text>
          <Text style={styles.unit}>C</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Droplets size={14} color={Colors.info} />
          <Text style={styles.statValue}>{weather.humidity}%</Text>
          <Text style={styles.statLabel}>{t('Humidity')}</Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.statItem}>
          <CloudRain size={14} color={Colors.info} />
          <Text style={styles.statValue}>{weather.rainProbability}%</Text>
          <Text style={styles.statLabel}>{t('Rain')}</Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.statItem}>
          <Wind size={14} color={Colors.textSecondary} />
          <Text style={styles.statValue}>{weather.windSpeed}</Text>
          <Text style={styles.statLabel}>{t('km/h')}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  main: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  emoji: { fontSize: 28, marginBottom: 4 },
  condition: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  location: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  tempContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  temp: {
    fontSize: 52,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    letterSpacing: -2,
    lineHeight: 56,
  },
  unit: {
    fontSize: FontSize.xl,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  divider: { height: 1, backgroundColor: Colors.border, marginBottom: Spacing.md },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: { alignItems: 'center', gap: 3, flex: 1 },
  statValue: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  separator: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  },
});
