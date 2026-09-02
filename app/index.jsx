import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';

import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../context/LanguageContext';
import { Colors } from '../constants/colors';
import { Spacing, Radius } from '../constants/spacing';
import { FontSize } from '../constants/typography';
import { Button } from '../components/ui/Button';

export default function IndexScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  // Automatically redirect if already authenticated, otherwise show onboarding
  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, loading, router]);

  if (loading || isAuthenticated) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background }} />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Hero Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?q=80&w=800&auto=format&fit=crop' }}
          style={styles.heroImage}
          resizeMode="cover"
        />
        {/* Placeholder for the overlay badge in the mockup */}
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>AgriFlow</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>{t('Welcome to AgriFlow')}</Text>
        <Text style={styles.description}>
          {t('Empowering your agricultural journey with AI-driven insights and precision management.')}
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          title={t('Get Started')}
          onPress={() => router.push('/(auth)/register')}
          size="lg"
          style={styles.primaryBtn}
        />
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push('/(auth)/login')}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryBtnText}>{t('Log In')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  imageContainer: {
    flex: 0.6,
    padding: Spacing.base,
    paddingTop: Spacing.xl,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    borderRadius: Radius['2xl'],
  },
  heroBadge: {
    position: 'absolute',
    bottom: Spacing.base,
    left: Spacing.xl,
    right: Spacing.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  heroBadgeText: {
    color: Colors.text,
    fontWeight: '800',
    fontSize: FontSize.sm,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: Spacing.sm,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  actions: {
    padding: Spacing.xl,
    paddingBottom: Spacing['2xl'],
    gap: Spacing.sm,
    marginTop: 'auto',
  },
  primaryBtn: {
    borderRadius: Radius.lg,
  },
  secondaryBtn: {
    backgroundColor: Colors.surfaceMuted,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  secondaryBtnText: {
    color: Colors.text,
    fontWeight: '700',
    fontSize: FontSize.md,
  },
});
