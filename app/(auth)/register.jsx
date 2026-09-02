import { useLanguage } from '../../context/LanguageContext';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import { FontSize, FontWeight } from '../../constants/typography';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../hooks/useAuth';
import { User, Phone, MapPin, Lock, CreditCard } from 'lucide-react-native';

export default function RegisterScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { register } = useAuth();
  
  const [form, setForm] = useState({
    name: '',
    mobile: '',
    village: '',
    district: '',
    aadhaar: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateField = (field) => (val) => setForm((prev) => ({ ...prev, [field]: val }));

  const validate = () => {
    if (!form.name || form.name.length < 3) return 'Name must be at least 3 characters.';
    if (!/^\d{10}$/.test(form.mobile)) return 'Mobile number must be exactly 10 digits.';
    if (!form.village || form.village.length < 2) return 'Village is required.';
    if (!form.district || form.district.length < 2) return 'District is required.';
    if (form.aadhaar && !/^\d{12}$/.test(form.aadhaar)) return 'Aadhaar must be exactly 12 digits if provided.';
    if (form.password.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(form.password)) return 'Password must contain an uppercase letter.';
    if (!/\d/.test(form.password)) return 'Password must contain a number.';
    return null;
  };

  const handleRegister = async () => {
    setError('');
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setLoading(true);
    try {
      // Combine village and district to location string for the authService
      const villageClean = form.village.trim();
      const districtClean = form.district.trim();
      const location = `${villageClean}, ${districtClean}`;
      
      const result = await register({
        name: form.name.trim(),
        mobile: form.mobile.trim(),
        village: villageClean,
        district: districtClean,
        location: location,
        password: form.password,
        aadhaar: form.aadhaar ? form.aadhaar.trim() : undefined,
      });
      
      if (result.success) {
        router.replace('/(tabs)');
      } else {
        setError(result.error || 'Registration failed.');
        Alert.alert('Registration Failed', result.error || 'Please check your details and try again.');
      }
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backText}>{t('← Back')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.logoSection}>
            <View style={styles.logoIcon}>
              <Text style={styles.logoEmoji}>🌿</Text>
            </View>
            <Text style={styles.logoText}>{t('Farmer Registration')}</Text>
            <Text style={styles.tagline}>{t('Secure, Data-Driven Farming')}</Text>
          </View>

          <View style={styles.card}>
            <Input
              label={t('Full Name *')}
              value={form.name}
              onChangeText={updateField('name')}
              placeholder="Rajesh Deshmukh"
              autoCapitalize="words"
              leftIcon={<User size={18} color={Colors.textSecondary} />}
            />
            <Input
              label={t('Mobile Number *')}
              value={form.mobile}
              onChangeText={updateField('mobile')}
              placeholder="10 digit mobile number"
              keyboardType="phone-pad"
              maxLength={10}
              leftIcon={<Phone size={18} color={Colors.textSecondary} />}
            />
            
            <View style={{flexDirection:'row', gap: Spacing.sm}}>
              <View style={{flex: 1}}>
                <Input
                  label={t('Village *')}
                  value={form.village}
                  onChangeText={updateField('village')}
                  placeholder="Village"
                  leftIcon={<MapPin size={18} color={Colors.textSecondary} />}
                />
              </View>
              <View style={{flex: 1}}>
                <Input
                  label={t('District *')}
                  value={form.district}
                  onChangeText={updateField('district')}
                  placeholder="District"
                />
              </View>
            </View>

            <Input
              label={t('Aadhaar Number (Optional)')}
              value={form.aadhaar}
              onChangeText={updateField('aadhaar')}
              placeholder="12 digit Aadhaar"
              keyboardType="number-pad"
              maxLength={12}
              leftIcon={<CreditCard size={18} color={Colors.textSecondary} />}
            />

            <Input
              label={t('Password *')}
              value={form.password}
              onChangeText={updateField('password')}
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              secureTextEntry
              leftIcon={<Lock size={18} color={Colors.textSecondary} />}
            />

            {!!error && <Text style={styles.errorText}>{error}</Text>}

            <Button title={t('Register')} onPress={handleRegister} loading={loading} size="lg" style={{ marginTop: Spacing.sm }} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('Already have an account?')}</Text>
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
              <Text style={styles.loginLink}> {t('Sign In')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, padding: Spacing.base, paddingTop: Spacing.base },
  header: { marginBottom: Spacing.sm },
  backBtn: { padding: 4 },
  backText: {
    fontSize: FontSize.base,
    color: Colors.primary,
    fontWeight: FontWeight.medium,
  },
  logoSection: { alignItems: 'center', marginBottom: Spacing.xl },
  logoIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  logoEmoji: { fontSize: 28 },
  logoText: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.extrabold,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  errorText: {
    fontSize: FontSize.sm,
    color: Colors.danger,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.base,
  },
  footerText: { fontSize: FontSize.base, color: Colors.textSecondary },
  loginLink: {
    fontSize: FontSize.base,
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
});
