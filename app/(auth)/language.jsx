import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

import { useRouter, useNavigation } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { Button } from '../../components/ui/Button';
import { Check, ArrowLeft } from 'lucide-react-native';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../hooks/useAuth';

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English', flag: '🇮🇳' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
  { code: 'mr', label: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
];

export default function LanguageScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { language, changeLanguage, t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [selected, setSelected] = useState(language);

  // Synchronize initial state with context
  useEffect(() => {
    setSelected(language);
  }, [language]);

  const handleContinue = async () => {
    await changeLanguage(selected);
    
    // If authenticated, we likely came from Home Settings. Go back.
    if (isAuthenticated && navigation.canGoBack()) {
      router.back();
    } else if (isAuthenticated) {
      router.replace('/(tabs)');
    } else {
      router.push('/(auth)/login');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Optional Back Button for logged-in users */}
        {isAuthenticated && navigation.canGoBack() && (
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft color={Colors.text} size={24} />
          </TouchableOpacity>
        )}

        {/* Logo */}
        <View style={styles.logoSection}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoEmoji}>🌿</Text>
          </View>
          <Text style={styles.logoText}>AgriFlow</Text>
          <Text style={styles.tagline}>Smart Farming. Better Decisions.{'\n'}Higher Yield.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Select Language</Text>
          <Text style={styles.subtitle}>Choose your preferred language</Text>

          <View style={styles.languages}>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[styles.langOption, selected === lang.code && styles.langSelected]}
                onPress={() => setSelected(lang.code)}
                activeOpacity={0.8}
              >
                <View style={styles.langLeft}>
                  <Text style={styles.flag}>{lang.flag}</Text>
                  <View>
                    <Text style={[styles.langLabel, selected === lang.code && styles.langLabelSelected]}>
                      {lang.native}
                    </Text>
                    <Text style={styles.langSub}>{lang.label}</Text>
                  </View>
                </View>
                {selected === lang.code && (
                  <View style={styles.checkIcon}>
                    <Check size={14} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Button title={isAuthenticated ? "Save Language" : "Continue"} onPress={handleContinue} size="lg" style={{ marginTop: Spacing.lg }} />

        {!isAuthenticated && (
          <Text style={styles.footer}>You can change this later in Settings</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: {
    flexGrow: 1,
    padding: Spacing.base,
    paddingTop: Spacing.xl,
  },
  backBtn: {
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    alignSelf: 'flex-start',
  },
  logoSection: { alignItems: 'center', marginBottom: Spacing['2xl'] },
  logoIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  logoEmoji: { fontSize: 36 },
  logoText: {
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.extrabold,
    color: Colors.text,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 22,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.base,
  },
  languages: { gap: Spacing.sm },
  langOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  langSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  langLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  flag: { fontSize: 24 },
  langLabel: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  langLabelSelected: { color: Colors.primary },
  langSub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  checkIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    textAlign: 'center',
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: Spacing.base,
  },
});
