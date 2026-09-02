import { useLanguage } from '../context/LanguageContext';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/colors';
import { Spacing, Radius, Shadow } from '../constants/spacing';
import { FontSize, FontWeight } from '../constants/typography';
import { apiClient } from '../services/api';
import {
  ArrowLeft,
  MapPin,
  Search,
  X,
  Store,
  Truck,
  CheckCircle2,
  Building2,
  Navigation,
  Sparkles,
} from 'lucide-react-native';

const CROPS_LIST = [
  { name: 'Tomato', label: 'Tomato (टोमॅटो)', emoji: '🍅' },
  { name: 'Cotton', label: 'Cotton (कापूस)', emoji: '🌿' },
  { name: 'Soybean', label: 'Soybean (सोयाबीन)', emoji: '🌱' },
  { name: 'Wheat', label: 'Wheat (गहू)', emoji: '🌾' },
  { name: 'Chilli', label: 'Chilli (मिरची)', emoji: '🌶️' },
  { name: 'Onion', label: 'Onion (कांदा)', emoji: '🧅' },
  { name: 'Gram', label: 'Gram / Chana (हरभरा)', emoji: '🫘' },
  { name: 'Rice', label: 'Paddy / Rice (धान)', emoji: '🍚' },
  { name: 'Orange', label: 'Orange (संत्रा)', emoji: '🍊' },
  { name: 'Tur', label: 'Tur / Arhar (तूर)', emoji: '🥣' },
  { name: 'Maize', label: 'Maize / Corn (मका)', emoji: '🌽' },
];

export default function MarketScreen() {
  const { t, tb } = useLanguage();
  const router = useRouter();

  const [selectedCrop, setSelectedCrop] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadMarket(selectedCrop);
  }, [selectedCrop]);

  const loadMarket = async (cropFilter = null) => {
    setLoading(true);
    try {
      const endpoint = cropFilter ? `/market/prices?crop=${cropFilter}` : '/market/prices';
      const res = await apiClient.get(endpoint);
      setData(res);
    } catch (e) {
      console.warn('Market fetch error', e);
      setData({ prices: [] });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSelectCrop = (cropName) => {
    if (selectedCrop === cropName) {
      setSelectedCrop(null);
    } else {
      setSelectedCrop(cropName);
    }
  };

  const handleClearFilter = () => {
    setSelectedCrop(null);
    setSearchQuery('');
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMarket(selectedCrop);
  };

  const prices = data?.prices || [];

  // Filter list by search query (city, mandi, or crop)
  const filteredPrices = prices.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const cropMatch = p.crop_name?.toLowerCase().includes(q);
    const cityMatch = p.city?.toLowerCase().includes(q);
    const marketMatch = p.market?.toLowerCase().includes(q);
    const distMatch = p.district?.toLowerCase().includes(q);
    return cropMatch || cityMatch || marketMatch || distMatch;
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('APMC Mandi Directory')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Search size={18} color={Colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('Search city mandi or crop (e.g. Mumbai, Cotton)...')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.textMuted}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Horizontal Crop Filter Chips */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
          {/* 'All Crops' Chip */}
          <TouchableOpacity
            style={[styles.chip, selectedCrop === null && styles.chipActive]}
            onPress={handleClearFilter}
            activeOpacity={0.8}
          >
            <Text style={[styles.chipText, selectedCrop === null && styles.chipTextActive]}>
              🌾 {t('All Crops')}
            </Text>
          </TouchableOpacity>

          {/* Individual Crop Chips */}
          {CROPS_LIST.map((crop) => {
            const isSelected = selectedCrop === crop.name;
            return (
              <TouchableOpacity
                key={crop.name}
                style={[styles.chip, isSelected && styles.chipActive]}
                onPress={() => handleSelectCrop(crop.name)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                  {crop.emoji} {tb(crop.name)}
                </Text>
                {isSelected && (
                  <View style={styles.cancelDot}>
                    <X size={12} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Active Filter Notification / Clear Banner */}
        {selectedCrop ? (
          <View style={styles.selectedBanner}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Sparkles size={16} color="#15803d" />
                <Text style={styles.selectedBannerTitle}>
                  {t('Showing APMC Mandis for')} {tb(selectedCrop)}
                </Text>
              </View>
              <Text style={styles.selectedBannerSub}>
                {t('Major city markets where this crop is actively traded')}
              </Text>
            </View>

            <TouchableOpacity style={styles.clearFilterBtn} onPress={handleClearFilter} activeOpacity={0.8}>
              <X size={14} color="#15803d" />
              <Text style={styles.clearFilterText}>{t('Cancel Filter')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.overviewNotice}>
            <Store size={16} color={Colors.primary} />
            <Text style={styles.overviewNoticeText}>
              {t('Select any crop above to view all big cities’ APMC mandis trading that crop.')}
            </Text>
          </View>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingSub}>
              {selectedCrop ? `${t('Locating APMC Mandis for')} ${selectedCrop}...` : t('Loading APMC Mandi directory...')}
            </Text>
          </View>
        ) : filteredPrices.length === 0 ? (
          <View style={styles.emptyCard}>
            <Store size={44} color="#9ca3af" />
            <Text style={styles.emptyTitle}>{t('No APMC Mandis Found')}</Text>
            <Text style={styles.emptySub}>{t('Try clearing the search query or selecting another crop.')}</Text>
            {selectedCrop && (
              <TouchableOpacity style={styles.emptyResetBtn} onPress={handleClearFilter}>
                <Text style={styles.emptyResetText}>{t('Reset to All Crops')}</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          /* APMC Mandi Cards List (NO PRICING) */
          filteredPrices.map((item, index) => (
            <View key={`${item.market}_${index}`} style={styles.mandiCard}>
              {/* Card Header: City & Operating Status */}
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.cityText}>{item.city || item.district || 'City'}</Text>
                    {item.state ? <Text style={styles.stateTag}>{item.state}</Text> : null}
                  </View>
                  <View style={styles.mandiSubRow}>
                    <Building2 size={15} color={Colors.primary} />
                    <Text style={styles.mandiTitle} numberOfLines={1}>
                      {item.market}
                    </Text>
                  </View>
                </View>

                {/* Operating Badge */}
                <View style={styles.statusBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.statusText}>{t('Active Market')}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Crop Traded & Facility Info */}
              <View style={styles.cropSection}>
                <View style={styles.cropInfoRow}>
                  <Text style={styles.cropTitle}>
                    {item.emoji ? `${item.emoji} ` : '🌾 '}{item.crop_name} {item.variety ? `(${item.variety})` : ''}
                  </Text>
                </View>

                {item.distance && (
                  <View style={styles.distanceRow}>
                    <Navigation size={13} color={Colors.textSecondary} />
                    <Text style={styles.distanceText}>{item.distance}</Text>
                  </View>
                )}
              </View>

              {/* Card Footer: Market Facility & Verification */}
              <View style={styles.cardFooter}>
                <View style={styles.facilityBox}>
                  <Store size={13} color="#15803d" />
                  <Text style={styles.facilityText}>
                    {item.daily_volume ? `Regular Trading • Daily Capacity: ${item.daily_volume}` : 'Authorized APMC Trading Yard'}
                  </Text>
                </View>

                <View style={styles.verifiedBox}>
                  <CheckCircle2 size={13} color="#16a34a" />
                  <Text style={styles.verifiedText}>{t('Govt. Regulated')}</Text>
                </View>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  searchWrap: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: Radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
  },
  filterSection: {
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  chipsScroll: {
    paddingHorizontal: Spacing.md,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  chipTextActive: {
    color: '#fff',
  },
  cancelDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    padding: Spacing.md,
  },
  selectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0fdf4',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  selectedBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803d',
  },
  selectedBannerSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  clearFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.md,
  },
  clearFilterText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803d',
  },
  overviewNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  overviewNoticeText: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 10,
  },
  loadingSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.md,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: Spacing.md,
  },
  emptyResetBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  emptyResetText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  mandiCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cityText: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.text,
  },
  stateTag: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mandiSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  mandiTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803d',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16a34a',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803d',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 10,
  },
  cropSection: {
    gap: 4,
    marginBottom: 6,
  },
  cropInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cropTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  distanceText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.md,
  },
  facilityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  facilityText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  verifiedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16a34a',
  },
});
