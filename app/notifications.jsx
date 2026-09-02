import { useLanguage } from '../context/LanguageContext';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

import { useRouter } from 'expo-router';
import { Colors } from '../constants/colors';
import { Spacing, Radius } from '../constants/spacing';
import { FontSize } from '../constants/typography';
import { mockNotifications } from '../data/mockNotifications';
import { Bell, AlertTriangle, Droplet, CheckCircle2 } from 'lucide-react-native';
import { useAuth } from '../hooks/useAuth';

export default function NotificationsScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { farmer } = useAuth();
  const [notifications, setNotifications] = useState(mockNotifications);

  const getIcon = (iconName, priority) => {
    const color = priority === 'high' ? Colors.danger : Colors.primary;
    if (iconName === 'alert') return <AlertTriangle size={24} color={color} />;
    if (iconName === 'water') return <Droplet size={24} color={color} />;
    if (iconName === 'check') return <CheckCircle2 size={24} color={color} />;
    return <Bell size={24} color={color} />;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{farmer?.name?.[0] || 'R'}</Text>
        </View>
        <Text style={styles.brandName}>{t('Notifications')}</Text>
        <TouchableOpacity style={styles.notifBtn} activeOpacity={0.8}>
          <Bell size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {notifications.map((notif) => {
          const isHigh = notif.priority === 'high';
          return (
            <TouchableOpacity
              key={notif.id}
              style={[
                styles.card,
                isHigh ? styles.cardHigh : styles.cardNormal,
              ]}
              activeOpacity={0.9}
            >
              <View style={styles.iconBox}>
                {getIcon(notif.icon, notif.priority)}
              </View>
              <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, isHigh && styles.textHigh]}>
                  {notif.title}
                </Text>
                <Text style={[styles.cardBody, isHigh && styles.textHigh]}>
                  {notif.body}
                </Text>
                <Text style={[styles.cardTime, isHigh && styles.textHighTime]}>
                  {notif.time}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
        <View style={{ height: Spacing['2xl'] }} />
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
  notifBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { padding: Spacing.base, gap: Spacing.md },
  card: {
    flexDirection: 'row',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  cardHigh: {
    backgroundColor: '#FCECEC', // Soft red
  },
  cardNormal: {
    backgroundColor: '#F2F4EE', // Soft beige/gray matching mockup
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
  },
  cardBody: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  cardTime: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  textHigh: {
    color: Colors.danger,
  },
  textHighTime: {
    color: '#D47B7B', // Muted red for time
  },
});
