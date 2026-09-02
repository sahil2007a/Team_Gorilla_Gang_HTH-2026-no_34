import { useLanguage } from '../../context/LanguageContext';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Spacing, Radius, Shadow } from '../../constants/spacing';
import { FontSize } from '../../constants/typography';
import { useAuth } from '../../hooks/useAuth';
import {
  Settings, ChevronRight, Banknote, Tractor, Sparkles, Server, Globe, ShieldAlert
} from 'lucide-react-native';
import { Linking, Platform } from 'react-native';

const MENU_ITEMS = [
  { id: 'finance', label: 'Farm Finances & Ledger', icon: Banknote, route: '/finances' },
  { id: 'logistics', label: 'Farm Logistics', icon: Tractor, route: '/logistics' },
  { id: 'ai', label: 'Intelligence & AI', icon: Sparkles, route: '/(tabs)/ai' },
  { id: 'language', label: 'Language Settings', icon: Globe, route: '/(auth)/language' },
  { id: 'hardware', label: 'System Hardware & IoT', icon: Server, route: '/hardware' },
  { id: 'admin', label: 'Admin Portal', icon: ShieldAlert, route: '/admin' },
];

export default function MoreScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { farmer, logout } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.avatarSmall}>
          <Text style={styles.avatarSmallText}>{farmer?.name?.[0] || 'A'}</Text>
        </View>
        <Text style={styles.brandName}>{t('AgriFlow')}</Text>
        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.8}>
          <Settings size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          {/* Profile Section */}
          <View style={styles.profileSection}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>{farmer?.name?.[0]?.toUpperCase() || '?'}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{farmer?.name || t('Farmer')}</Text>
              <Text style={styles.profileRole}>{farmer?.mobile || ''}</Text>
            </View>
          </View>

          {/* Menu Items */}
          <View style={styles.menuContainer}>
            {MENU_ITEMS.map((item, index) => {
              const Icon = item.icon;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.menuRow, index < MENU_ITEMS.length - 1 && styles.menuRowBorder]}
                  onPress={() => {
                    if (item.route) router.push(item.route);
                    else if (item.action) item.action();
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuIconBox}>
                    <Icon size={20} color={Colors.primary} />
                  </View>
                  <Text style={styles.menuLabel}>{t(item.label)}</Text>
                  <ChevronRight size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={{ height: Spacing['3xl'] }} />
      </ScrollView>
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
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSmallText: {
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
  scroll: { padding: Spacing.base },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius['2xl'],
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginTop: Spacing.md,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    color: Colors.primary,
    fontSize: 22,
    fontWeight: '800',
  },
  profileInfo: { flex: 1 },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  profileRole: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  menuContainer: {
    paddingVertical: Spacing.sm,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4EE',
  },
  menuIconBox: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: '#F2F4EE', // Matching the pale green/gray from mockup
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
});
