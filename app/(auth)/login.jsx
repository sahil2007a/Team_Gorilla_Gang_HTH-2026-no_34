import { useLanguage } from '../../context/LanguageContext';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';

import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../hooks/useAuth';
import { Phone, Lock, Eye, EyeOff } from 'lucide-react-native';

export default function LoginScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { login } = useAuth();
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    if (!mobile || !password) {
      setError('Please enter mobile number and password.');
      return;
    }
    setLoading(true);
    try {
      const result = await login({ mobile, password });
      if (result.success) {
        router.replace('/(tabs)');
      } else {
        setError(result.error || 'Login failed. Try again.');
      }
    } catch (err) {
      setError(err.message || 'Login error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          <View style={styles.card}>
            {/* Header / Logo */}
            <View style={styles.headerRow}>
              <View style={styles.logoBox}>
                <Text style={styles.logoIcon}>🌱</Text>
              </View>
              <Text style={styles.brandName}>{t('AgriFlow')}</Text>
            </View>

            <Text style={styles.title}>{t('Welcome back')}</Text>
            <Text style={styles.subtitle}>{t('Sign in to manage your farm\'s performance.')}</Text>

            <Input
              label={t('Mobile Number')}
              value={mobile}
              onChangeText={setMobile}
              placeholder="Enter your mobile number"
              keyboardType="phone-pad"
              autoCapitalize="none"
              leftIcon={<Phone size={20} color={Colors.textSecondary} />}
              style={{ marginTop: Spacing.xl }}
            />

            <Input
              label={t('Password')}
              labelRight={
                <TouchableOpacity activeOpacity={0.7}>
                  <Text style={styles.forgotText}>{t('Forgot password?')}</Text>
                </TouchableOpacity>
              }
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password"
              secureTextEntry={!showPassword}
              leftIcon={<Lock size={20} color={Colors.textSecondary} />}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
                  {showPassword ? <EyeOff size={20} color={Colors.textSecondary} /> : <Eye size={20} color={Colors.textSecondary} />}
                </TouchableOpacity>
              }
            />

            {!!error && <Text style={styles.errorText}>{error}</Text>}

            <Button 
              title={t('Login ->')} 
              onPress={handleLogin} 
              loading={loading} 
              size="lg" 
              style={{ marginTop: Spacing.lg, borderRadius: Radius.lg }} 
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>{t('Don\'t have an account?')}</Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')} activeOpacity={0.7}>
                <Text style={styles.registerLink}>{t('Register')}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.adminAccessBox}>
              <TouchableOpacity
                style={styles.adminAccessBtn}
                onPress={() => router.push('/admin')}
                activeOpacity={0.8}
              >
                <Lock size={16} color="#2d7a3a" />
                <Text style={styles.adminAccessText}>Access In-App Admin Portal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1F291E' }, // Dark outer background
  scroll: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    padding: Spacing.xl,
    paddingTop: Spacing['3xl'],
    minHeight: '85%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  logoBox: {
    width: 48,
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  logoIcon: {
    fontSize: 24,
    color: '#FFF',
  },
  brandName: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.xs,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    marginBottom: Spacing.base,
    lineHeight: 24,
    paddingRight: Spacing.xl,
  },
  errorText: {
    fontSize: FontSize.sm,
    color: Colors.danger,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  forgotText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '700',
  },
  demoHint: {
    backgroundColor: Colors.surfaceMuted,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  demoText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing['2xl'],
  },
  footerText: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
  },
  registerLink: {
    fontSize: FontSize.base,
    color: Colors.primary,
    fontWeight: '700',
  },
  adminAccessBox: {
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  adminAccessBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#e8f5ea',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  adminAccessText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2d7a3a',
  },
});
