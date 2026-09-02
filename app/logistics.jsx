import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/colors';
import { Spacing, Radius } from '../constants/spacing';
import { farmService } from '../services/farmService';
import {
  ArrowLeft,
  Truck,
  Warehouse,
  Users,
  Clock,
  Leaf,
  Calendar,
  CheckCircle2,
  Phone,
  PlusCircle,
  X,
  Navigation,
} from 'lucide-react-native';
import { useLanguage } from '../context/LanguageContext';

export default function LogisticsScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('harvest'); // harvest, transport, storage, labor
  const [bookingModal, setBookingModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [destination, setDestination] = useState('');
  const [pickupDate, setPickupDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadLogistics();
  }, []);

  const loadLogistics = async () => {
    setLoading(true);
    try {
      const res = await farmService.getLogistics('farm_001');
      setData(res.data || res);
    } catch (e) {
      console.warn('Logistics load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleBookVehicle = () => {
    if (!destination.trim()) {
      Alert.alert('Required', 'Please enter drop location / Mandi name');
      return;
    }
    Alert.alert(
      'Booking Confirmed! 🚜',
      `Vehicle "${selectedVehicle?.type}" scheduled for ${pickupDate} to ${destination}. Driver has been notified.`,
      [{ text: 'OK', onPress: () => setBookingModal(false) }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.topbarTitle}>{t('Farm Logistics & Harvest')}</Text>
          <Text style={styles.topbarSubtitle}>{t('Supply chain, transport & storage hub')}</Text>
        </View>
      </View>

      {/* Segmented Filter Tabs */}
      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {[
            { key: 'harvest', label: t('Harvest Plan'), icon: Leaf },
            { key: 'transport', label: t('Vehicles & Transport'), icon: Truck },
            { key: 'storage', label: t('Storage & Godowns'), icon: Warehouse },
            { key: 'labor', label: t('Labor Crews'), icon: Users },
          ].map((tab) => {
            const isAct = activeTab === tab.key;
            const Icon = tab.icon;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabItem, isAct && styles.tabItemActive]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.8}
              >
                <Icon size={16} color={isAct ? '#2d7a3a' : '#6b7280'} />
                <Text style={[styles.tabText, isAct && styles.tabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading || !data ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2d7a3a" />
          <Text style={styles.loadingText}>{t('Loading logistics data...')}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          
          {/* ── TAB 1: HARVEST PLAN ── */}
          {activeTab === 'harvest' && (
            <View>
              {/* Resource Summary Card */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>{t('Harvest Resource Plan')}</Text>
                <View style={styles.summaryGrid}>
                  <View style={styles.summaryItem}>
                    <Users size={20} color="#2d7a3a" />
                    <Text style={styles.summaryVal}>
                      {data.resources?.laborAssigned}/{data.resources?.laborNeeded}
                    </Text>
                    <Text style={styles.summaryLabel}>{t('Labor Assigned')}</Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryItem}>
                    <Clock size={20} color="#2563eb" />
                    <Text style={styles.summaryVal}>{data.resources?.durationDays} {t('Days')}</Text>
                    <Text style={styles.summaryLabel}>{t('Est. Window')}</Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryItem}>
                    <Warehouse size={20} color="#d97706" />
                    <Text style={styles.summaryVal}>{data.resources?.requiredStorageTonnes} {t('Tonnes')}</Text>
                    <Text style={styles.summaryLabel}>{t('Storage Needed')}</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.sectionHeader}>{t('Field-by-Field Readiness')}</Text>
              {data.blocks?.map((block) => (
                <View key={block.id} style={styles.blockCard}>
                  <View style={styles.blockHeader}>
                    <View>
                      <Text style={styles.blockName}>{block.name}</Text>
                      <Text style={styles.blockSub}>
                        {block.crop} • {block.acreage} {t('Acres')} • {t('Est.')} {block.estYield}
                      </Text>
                    </View>
                    <View style={styles.harvestDateBadge}>
                      <Calendar size={12} color="#2d7a3a" />
                      <Text style={styles.harvestDateText}>{block.estHarvest}</Text>
                    </View>
                  </View>

                  <View style={styles.progressWrap}>
                    <View style={styles.progressRow}>
                      <Text style={styles.progressLabel}>{t('Crop Maturity')}</Text>
                      <Text style={styles.progressValue}>{block.readiness}%</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${block.readiness}%`,
                            backgroundColor: block.readiness >= 90 ? '#15803d' : '#2d7a3a',
                          },
                        ]}
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* ── TAB 2: VEHICLES & TRANSPORT ── */}
          {activeTab === 'transport' && (
            <View>
              <Text style={styles.sectionHeader}>{t('Available Transport Fleet')}</Text>
              {data.vehicles?.map((v) => (
                <View key={v.id} style={styles.vehicleCard}>
                  <View style={styles.vehicleHeader}>
                    <View style={styles.vehicleIconBg}>
                      <Truck size={22} color="#2d7a3a" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.vehicleTitle}>{v.type}</Text>
                      <Text style={styles.vehicleSub}>
                        {t('Capacity')}: {v.capacity} • {v.rate}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            v.status === 'Available' ? '#dcfce7' : '#fee2e2',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          {
                            color: v.status === 'Available' ? '#15803d' : '#dc2626',
                          },
                        ]}
                      >
                        {v.status}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.driverRow}>
                    <Phone size={14} color="#6b7280" />
                    <Text style={styles.driverText}>{t('Driver')}: {v.driver}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.bookBtn}
                    onPress={() => {
                      setSelectedVehicle(v);
                      setBookingModal(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <Navigation size={16} color="#fff" />
                    <Text style={styles.bookBtnText}>{t('Schedule / Book Vehicle')}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* ── TAB 3: STORAGE & GODOWNS ── */}
          {activeTab === 'storage' && (
            <View>
              <Text style={styles.sectionHeader}>{t('Nearby Mandi & Cold Storage Godowns')}</Text>
              {data.warehouses?.map((w) => (
                <View key={w.id} style={styles.warehouseCard}>
                  <View style={styles.warehouseHeader}>
                    <View style={[styles.warehouseIconBg, { backgroundColor: w.tempControlled ? '#e0f2fe' : '#f3f4f6' }]}>
                      <Warehouse size={22} color={w.tempControlled ? '#0284c7' : '#4b5563'} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.warehouseTitle}>{w.name}</Text>
                      <Text style={styles.warehouseSub}>
                        📍 {w.distance} • {w.rate}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.warehouseMetaRow}>
                    <View style={styles.metaItem}>
                      <Text style={styles.metaItemLabel}>{t('Available Space')}</Text>
                      <Text style={styles.metaItemVal}>{w.capacityLeft}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Text style={styles.metaItemLabel}>{t('Facility Type')}</Text>
                      <Text style={[styles.metaItemVal, { color: w.tempControlled ? '#0284c7' : '#374151' }]}>
                        {w.tempControlled ? t('❄️ Temperature Controlled') : t('Standard Dry Godown')}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.reserveBtn}
                    onPress={() => Alert.alert('Space Reserved', `Contacted ${w.name}. Storage slot on hold.`)}
                    activeOpacity={0.8}
                  >
                    <CheckCircle2 size={16} color="#2d7a3a" />
                    <Text style={styles.reserveBtnText}>{t('Reserve Space')}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* ── TAB 4: LABOR CREWS ── */}
          {activeTab === 'labor' && (
            <View>
              <Text style={styles.sectionHeader}>{t('Harvesting Labor Teams')}</Text>
              {data.laborCrew?.map((l) => (
                <View key={l.id} style={styles.laborCard}>
                  <View style={styles.laborHeader}>
                    <View style={styles.laborIconBg}>
                      <Users size={22} color="#7c3aed" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.laborTitle}>{l.teamName}</Text>
                      <Text style={styles.laborSub}>
                        {l.members} {t('Workers')} • {l.dailyRate}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.laborSpec}>
                    🎯 {t('Specialization')}: {l.specialization}
                  </Text>
                  <Text style={styles.laborLeader}>
                    📞 {t('Team Leader')}: {l.leader}
                  </Text>

                  <TouchableOpacity
                    style={styles.callCrewBtn}
                    onPress={() => Alert.alert('Labor Request Sent', `Notified ${l.teamName} for upcoming harvesting.`)}
                    activeOpacity={0.8}
                  >
                    <Phone size={16} color="#fff" />
                    <Text style={styles.callCrewBtnText}>{t('Hire / Call Crew')}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* ── BOOKING MODAL ── */}
      <Modal visible={bookingModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('Schedule Transport')}</Text>
              <TouchableOpacity onPress={() => setBookingModal(false)}>
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              {selectedVehicle?.type} ({selectedVehicle?.capacity})
            </Text>

            <Text style={styles.inputLabel}>{t('Drop Destination / APMC Mandi')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('e.g. Wardha APMC Mandi, Gate 2')}
              value={destination}
              onChangeText={setDestination}
            />

            <Text style={styles.inputLabel}>{t('Pickup Date')}</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={pickupDate}
              onChangeText={setPickupDate}
            />

            <TouchableOpacity style={styles.confirmBtn} onPress={handleBookVehicle} activeOpacity={0.8}>
              <Text style={styles.confirmBtnText}>{t('Confirm Transport Booking')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e5e7eb' },
  backBtn: { padding: 4 },
  topbarTitle: { fontSize: 17, fontWeight: '800', color: '#1a2e1a' },
  topbarSubtitle: { fontSize: 11, color: '#6b7280', marginTop: 1 },
  tabBar: { backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e5e7eb' },
  tabScroll: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  tabItem: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6' },
  tabItemActive: { backgroundColor: '#e8f5ea', borderWidth: 1, borderColor: '#a7f3d0' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  tabTextActive: { color: '#2d7a3a', fontWeight: '700' },
  content: { padding: 16, paddingBottom: 40 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingText: { fontSize: 14, color: '#6b7280', marginTop: 12 },
  sectionHeader: { fontSize: 16, fontWeight: '800', color: '#1a2e1a', marginBottom: 12, marginTop: 4 },

  // Summary Card
  summaryCard: { backgroundColor: '#fff', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 16 },
  summaryTitle: { fontSize: 15, fontWeight: '800', color: '#1a2e1a', marginBottom: 12 },
  summaryGrid: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, height: 36, backgroundColor: '#e5e7eb' },
  summaryVal: { fontSize: 15, fontWeight: '800', color: '#1a2e1a', marginTop: 4 },
  summaryLabel: { fontSize: 11, color: '#6b7280', marginTop: 2 },

  // Blocks
  blockCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 12 },
  blockHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  blockName: { fontSize: 15, fontWeight: '800', color: '#1a2e1a' },
  blockSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  harvestDateBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#e8f5ea', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  harvestDateText: { fontSize: 12, fontWeight: '700', color: '#2d7a3a' },
  progressWrap: { marginTop: 12 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 12, fontWeight: '600', color: '#4b5563' },
  progressValue: { fontSize: 12, fontWeight: '800', color: '#2d7a3a' },
  progressBarBg: { height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },

  // Vehicles
  vehicleCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 12 },
  vehicleHeader: { flexDirection: 'row', alignItems: 'center' },
  vehicleIconBg: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#e8f5ea', justifyContent: 'center', alignItems: 'center' },
  vehicleTitle: { fontSize: 15, fontWeight: '800', color: '#1a2e1a' },
  vehicleSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusBadgeText: { fontSize: 11, fontWeight: '800' },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderColor: '#f3f4f6' },
  driverText: { fontSize: 12, color: '#4b5563' },
  bookBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#2d7a3a', borderRadius: 10, paddingVertical: 10, marginTop: 12 },
  bookBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Warehouses
  warehouseCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 12 },
  warehouseHeader: { flexDirection: 'row', alignItems: 'center' },
  warehouseIconBg: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  warehouseTitle: { fontSize: 15, fontWeight: '800', color: '#1a2e1a' },
  warehouseSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  warehouseMetaRow: { flexDirection: 'row', gap: 12, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderColor: '#f3f4f6' },
  metaItem: { flex: 1 },
  metaItemLabel: { fontSize: 11, color: '#9ca3af' },
  metaItemVal: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  reserveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 10, paddingVertical: 10, marginTop: 12 },
  reserveBtnText: { color: '#2d7a3a', fontSize: 13, fontWeight: '700' },

  // Labor
  laborCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 12 },
  laborHeader: { flexDirection: 'row', alignItems: 'center' },
  laborIconBg: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f5f3ff', justifyContent: 'center', alignItems: 'center' },
  laborTitle: { fontSize: 15, fontWeight: '800', color: '#1a2e1a' },
  laborSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  laborSpec: { fontSize: 12, color: '#374151', marginTop: 10 },
  laborLeader: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  callCrewBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#7c3aed', borderRadius: 10, paddingVertical: 10, marginTop: 12 },
  callCrewBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1a2e1a' },
  modalSubtitle: { fontSize: 13, color: '#6b7280', marginBottom: 16 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, fontSize: 14, marginBottom: 14 },
  confirmBtn: { backgroundColor: '#2d7a3a', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 6 },
  confirmBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
