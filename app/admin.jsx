import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  ShieldCheck,
  User,
  Lock,
  LogOut,
  LayoutGrid,
  Banknote,
  Users,
  Scan,
  TrendingUp,
  TrendingDown,
  ArrowDownCircle,
  ArrowUpCircle,
  Bug,
  MapPin,
  Search,
  Wallet,
  PlusCircle,
  XCircle,
  X,
  Phone,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { adminClient, ADMIN_AUTH_KEY } from '../services/api';

const { width } = Dimensions.get('window');

export default function AdminScreen() {
  const router = useRouter();

  // Auth State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Admin Data State
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, finances, farmers, scans
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Farmers State
  const [farmers, setFarmers] = useState([]);
  const [farmerSearch, setFarmerSearch] = useState('');
  const [selectedFarmerFinances, setSelectedFarmerFinances] = useState(null);
  const [farmerModalVisible, setFarmerModalVisible] = useState(false);

  // Finances State
  const [finances, setFinances] = useState([]);
  const [financeTypeFilter, setFinanceTypeFilter] = useState('all'); // all, income, expense
  const [financeSummary, setFinanceSummary] = useState({ total_income: 0, total_expenses: 0, net_profit: 0 });

  // Scans State
  const [scans, setScans] = useState([]);
  const [scanSearch, setScanSearch] = useState('');

  useEffect(() => {
    checkAdminToken();
  }, []);

  const checkAdminToken = async () => {
    try {
      const token = await AsyncStorage.getItem(ADMIN_AUTH_KEY);
      if (token) {
        setIsAdminLoggedIn(true);
        loadDashboard();
      }
    } catch (e) {
      console.warn('Error reading admin token:', e);
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setLoginError('Please enter username and password');
      return;
    }
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await adminClient.login(username.trim(), password.trim());
      if (res.success) {
        setIsAdminLoggedIn(true);
        loadDashboard();
      } else {
        setLoginError(res.message || 'Invalid credentials');
      }
    } catch (err) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await adminClient.logout();
    setIsAdminLoggedIn(false);
    setUsername('');
    setPassword('');
  };

  // ── Loaders ──
  const loadDashboard = async () => {
    setLoading(true);
    try {
      const data = await adminClient.get('/admin/dashboard');
      setDashboardData(data);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  const loadFinances = async () => {
    setLoading(true);
    try {
      const data = await adminClient.get('/admin/finances');
      setFinances(data.entries || []);
      setFinanceSummary({
        total_income: data.total_income || 0,
        total_expenses: data.total_expenses || 0,
        net_profit: data.net_profit || 0,
      });
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to load finances');
    } finally {
      setLoading(false);
    }
  };

  const loadFarmers = async () => {
    setLoading(true);
    try {
      const param = farmerSearch ? `?search=${encodeURIComponent(farmerSearch)}` : '';
      const data = await adminClient.get(`/admin/farmers${param}`);
      setFarmers(data.farmers || []);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to load farmers');
    } finally {
      setLoading(false);
    }
  };

  const loadFarmerDetailFinances = async (farmerId) => {
    try {
      const data = await adminClient.get(`/admin/farmer-finances/${farmerId}`);
      setSelectedFarmerFinances(data);
      setFarmerModalVisible(true);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to fetch farmer finances');
    }
  };

  const loadScans = async () => {
    setLoading(true);
    try {
      const param = scanSearch ? `?search=${encodeURIComponent(scanSearch)}` : '';
      const data = await adminClient.get(`/admin/scans${param}`);
      setScans(data.scans || []);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to load scans');
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    if (tab === 'dashboard') loadDashboard();
    if (tab === 'finances') loadFinances();
    if (tab === 'farmers') loadFarmers();
    if (tab === 'scans') loadScans();
  };

  if (checkingAuth) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2d7a3a" />
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 1. ADMIN LOGIN VIEW
  // ─────────────────────────────────────────────────────────────
  if (!isAdminLoggedIn) {
    return (
      <SafeAreaView style={styles.loginBg}>
        <View style={styles.loginCard}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#1a2e1a" />
          </TouchableOpacity>
          <View style={styles.loginHeader}>
            <View style={styles.loginIconBg}>
              <ShieldCheck size={36} color="#2d7a3a" />
            </View>
            <Text style={styles.loginTitle}>Admin Portal</Text>
            <Text style={styles.loginSub}>AgriFlow Centralized Management</Text>
          </View>

          {loginError ? <Text style={styles.errorBanner}>{loginError}</Text> : null}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Admin Username</Text>
            <View style={styles.inputBox}>
              <User size={18} color="#6b7280" />
              <TextInput
                style={styles.inputField}
                placeholder="e.g. Agriflow"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputBox}>
              <Lock size={18} color="#6b7280" />
              <TextInput
                style={styles.inputField}
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loginLoading}>
            {loginLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.loginBtnText}>Access Admin Dashboard</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. LOGGED IN ADMIN DASHBOARD VIEW
  // ─────────────────────────────────────────────────────────────
  const filteredFinances = finances.filter((f) => {
    if (financeTypeFilter === 'all') return true;
    return f.type === financeTypeFilter;
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
          <ArrowLeft size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.headerTitle}>AgriFlow Admin Panel</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={styles.activeDot} />
            <Text style={styles.headerSub}>Connected to Live Database</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={16} color="#dc2626" />
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs Navigation */}
      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {[
            { key: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
            { key: 'finances', label: 'Finances', icon: Banknote },
            { key: 'farmers', label: 'Farmers', icon: Users },
            { key: 'scans', label: 'Scans', icon: Scan },
          ].map((t) => {
            const isAct = activeTab === t.key;
            const IconComp = t.icon;
            return (
              <TouchableOpacity
                key={t.key}
                style={[styles.tabItem, isAct && styles.tabItemActive]}
                onPress={() => switchTab(t.key)}
              >
                <IconComp size={16} color={isAct ? '#2d7a3a' : '#6b7280'} />
                <Text style={[styles.tabLabel, isAct && styles.tabLabelActive]}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Content Area */}
      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        {loading ? (
          <View style={{ padding: 40 }}>
            <ActivityIndicator size="large" color="#2d7a3a" />
          </View>
        ) : null}

        {/* ── TAB 1: DASHBOARD ── */}
        {activeTab === 'dashboard' && dashboardData && (
          <View>
            <Text style={styles.sectionHeader}>Financial Overview</Text>
            <View style={styles.financialStatsGrid}>
              <View style={[styles.finCard, { backgroundColor: '#e8f5ea', borderColor: '#a7f3d0' }]}>
                <ArrowDownCircle size={24} color="#15803d" />
                <Text style={styles.finCardValue}>₹{(dashboardData.total_income || 0).toLocaleString()}</Text>
                <Text style={styles.finCardLabel}>Total Farmer Revenue</Text>
              </View>
              <View style={[styles.finCard, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
                <ArrowUpCircle size={24} color="#dc2626" />
                <Text style={styles.finCardValue}>₹{(dashboardData.total_expenses || 0).toLocaleString()}</Text>
                <Text style={styles.finCardLabel}>Total Farmer Expenses</Text>
              </View>
            </View>

            <View style={[styles.netProfitCard, { backgroundColor: dashboardData.net_profit >= 0 ? '#f0fdf4' : '#fff1f2' }]}>
              <View>
                <Text style={styles.netProfitLabel}>Net Farmer Savings / Profit</Text>
                <Text style={[styles.netProfitValue, { color: dashboardData.net_profit >= 0 ? '#15803d' : '#b91c1c' }]}>
                  ₹{(dashboardData.net_profit || 0).toLocaleString()}
                </Text>
              </View>
              {dashboardData.net_profit >= 0 ? (
                <TrendingUp size={36} color="#15803d" />
              ) : (
                <TrendingDown size={36} color="#b91c1c" />
              )}
            </View>

            <Text style={styles.sectionHeader}>Platform Metrics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Users size={24} color="#2d7a3a" />
                <Text style={styles.statNumber}>{dashboardData.total_farmers || 0}</Text>
                <Text style={styles.statLabel}>Registered Farmers</Text>
              </View>
              <View style={styles.statCard}>
                <Scan size={24} color="#0284c7" />
                <Text style={styles.statNumber}>{dashboardData.total_scans || 0}</Text>
                <Text style={styles.statLabel}>Crop Scans Run</Text>
              </View>
              <View style={styles.statCard}>
                <Bug size={24} color="#dc2626" />
                <Text style={styles.statNumber}>{dashboardData.diseased_scans || 0}</Text>
                <Text style={styles.statLabel}>Diseases Detected</Text>
              </View>
              <View style={styles.statCard}>
                <Wallet size={24} color="#ca8a04" />
                <Text style={styles.statNumber}>{dashboardData.total_transactions || 0}</Text>
                <Text style={styles.statLabel}>Finance Entries</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── TAB 2: FINANCES ── */}
        {activeTab === 'finances' && (
          <View>
            <View style={styles.summaryBar}>
              <View style={styles.summaryCol}>
                <Text style={styles.summaryLabel}>Total Inflows (+)</Text>
                <Text style={[styles.summaryVal, { color: '#15803d' }]}>
                  ₹{financeSummary.total_income.toLocaleString()}
                </Text>
              </View>
              <View style={styles.summaryCol}>
                <Text style={styles.summaryLabel}>Total Outflows (-)</Text>
                <Text style={[styles.summaryVal, { color: '#dc2626' }]}>
                  ₹{financeSummary.total_expenses.toLocaleString()}
                </Text>
              </View>
              <View style={styles.summaryCol}>
                <Text style={styles.summaryLabel}>Net Farm Savings</Text>
                <Text style={[styles.summaryVal, { color: '#2d7a3a' }]}>
                  ₹{financeSummary.net_profit.toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={styles.filterRow}>
              {['all', 'income', 'expense'].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.filterChip, financeTypeFilter === t && styles.filterChipActive]}
                  onPress={() => setFinanceTypeFilter(t)}
                >
                  <Text style={[styles.filterChipText, financeTypeFilter === t && styles.filterChipTextActive]}>
                    {t.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionHeader}>Transactions ({filteredFinances.length})</Text>
            {filteredFinances.map((item) => {
              const isInc = item.type === 'income';
              return (
                <View key={item.id} style={styles.transactionCard}>
                  <View style={[styles.transIconBg, { backgroundColor: isInc ? '#dcfce7' : '#fee2e2' }]}>
                    <Text style={{ fontSize: 18 }}>{isInc ? '📈' : '📉'}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.transFarmerName}>{item.farmer_name || 'Farmer'}</Text>
                      <Text style={[styles.transAmount, { color: isInc ? '#15803d' : '#dc2626' }]}>
                        {isInc ? '+' : '-'}₹{item.amount.toLocaleString()}
                      </Text>
                    </View>
                    <Text style={styles.transCategory}>
                      {item.category} {item.crop_name ? `• ${item.crop_name}` : ''}
                    </Text>
                    {item.description ? <Text style={styles.transDesc}>{item.description}</Text> : null}
                    <Text style={styles.transDate}>
                      {item.entry_date} • 📍 {item.village}, {item.district}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ── TAB 3: FARMERS ── */}
        {activeTab === 'farmers' && (
          <View>
            <View style={styles.searchBar}>
              <Search size={18} color="#6b7280" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search farmers by name, phone, village..."
                value={farmerSearch}
                onChangeText={setFarmerSearch}
                onSubmitEditing={loadFarmers}
              />
            </View>

            <Text style={styles.sectionHeader}>Registered Farmers ({farmers.length})</Text>
            {farmers.map((f) => (
              <TouchableOpacity
                key={f.id}
                style={styles.farmerCard}
                onPress={() => loadFarmerDetailFinances(f.id)}
                activeOpacity={0.8}
              >
                <View style={styles.farmerAvatar}>
                  <Text style={styles.farmerAvatarText}>{f.name?.[0] || 'F'}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.fName}>{f.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <Phone size={12} color="#6b7280" />
                    <Text style={styles.fSub}>{f.mobile}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <MapPin size={12} color="#6b7280" />
                    <Text style={styles.fSub}>
                      {f.village}, {f.district}
                    </Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.viewLedgerBtn}>View Ledger →</Text>
                  <Text style={styles.joinedText}>Joined: {f.created_at?.split(' ')[0]}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── TAB 4: SCANS ── */}
        {activeTab === 'scans' && (
          <View>
            <View style={styles.searchBar}>
              <Search size={18} color="#6b7280" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search scans by crop, disease, status..."
                value={scanSearch}
                onChangeText={setScanSearch}
                onSubmitEditing={loadScans}
              />
            </View>

            <Text style={styles.sectionHeader}>Diagnostic Scans ({scans.length})</Text>
            {scans.map((s) => {
              const isHealthy = s.health_status === 'Healthy' || s.health_status === 'Healthy Plant';
              return (
                <View key={s.id} style={styles.scanCard}>
                  <View style={[styles.scanBadge, { backgroundColor: isHealthy ? '#dcfce7' : '#fee2e2' }]}>
                    <Text style={{ fontSize: 16 }}>{isHealthy ? '🌿' : '⚠️'}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={styles.scanCrop}>{s.crop_name || 'Crop Leaf'}</Text>
                      <Text
                        style={[
                          styles.scanStatus,
                          { color: isHealthy ? '#15803d' : '#b91c1c' },
                        ]}
                      >
                        {s.health_status} ({s.confidence}%)
                      </Text>
                    </View>
                    <Text style={styles.scanDisease}>
                      {s.disease_detected !== 'None' ? s.disease_detected : 'No disease found'}
                    </Text>
                    <Text style={styles.scanFarmer}>
                      Farmer: {s.farmer_name || 'Anonymous'} • 📍 {s.village || 'Nagpur'}
                    </Text>
                    <Text style={styles.scanDate}>{s.scanned_at}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* ── MODAL: Individual Farmer Finances Ledger ── */}
      <Modal visible={farmerModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Farmer Financial Ledger</Text>
              <TouchableOpacity onPress={() => setFarmerModalVisible(false)}>
                <XCircle size={26} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {selectedFarmerFinances && (
              <ScrollView style={{ maxHeight: 450 }}>
                <View style={styles.farmerDetailHeader}>
                  <Text style={styles.farmerDetailName}>{selectedFarmerFinances.farmer?.name}</Text>
                  <Text style={styles.farmerDetailSub}>
                    {selectedFarmerFinances.farmer?.village}, {selectedFarmerFinances.farmer?.district}
                  </Text>
                </View>

                <View style={styles.farmerSummaryRow}>
                  <View style={styles.farmerSummaryItem}>
                    <Text style={styles.fSumLabel}>Income</Text>
                    <Text style={[styles.fSumVal, { color: '#15803d' }]}>
                      +₹{selectedFarmerFinances.total_income?.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.farmerSummaryItem}>
                    <Text style={styles.fSumLabel}>Expenses</Text>
                    <Text style={[styles.fSumVal, { color: '#dc2626' }]}>
                      -₹{selectedFarmerFinances.total_expenses?.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.farmerSummaryItem}>
                    <Text style={styles.fSumLabel}>Net Savings</Text>
                    <Text style={[styles.fSumVal, { color: '#2d7a3a' }]}>
                      ₹{selectedFarmerFinances.net_balance?.toLocaleString()}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.sectionHeader, { marginTop: 16 }]}>Transaction History</Text>
                {selectedFarmerFinances.entries?.length === 0 ? (
                  <Text style={styles.emptyText}>No financial transactions recorded.</Text>
                ) : (
                  selectedFarmerFinances.entries?.map((e) => {
                    const isInc = e.type === 'income';
                    return (
                      <View key={e.id} style={styles.singleLedgerRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.singleLedgerCategory}>
                            {isInc ? '📈 ' : '📉 '}
                            {e.category} {e.crop_name ? `(${e.crop_name})` : ''}
                          </Text>
                          {e.description ? <Text style={styles.singleLedgerDesc}>{e.description}</Text> : null}
                          <Text style={styles.singleLedgerDate}>{e.entry_date}</Text>
                        </View>
                        <Text style={[styles.singleLedgerAmount, { color: isInc ? '#15803d' : '#dc2626' }]}>
                          {isInc ? '+' : '-'}₹{e.amount}
                        </Text>
                      </View>
                    );
                  })
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loginBg: { flex: 1, backgroundColor: '#1a2e1a', justifyContent: 'center', padding: 20 },
  loginCard: { backgroundColor: '#fff', borderRadius: 20, padding: 24, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  backButton: { marginBottom: 12 },
  loginHeader: { alignItems: 'center', marginBottom: 20 },
  loginIconBg: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#e8f5ea', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  loginTitle: { fontSize: 22, fontWeight: '800', color: '#1a2e1a' },
  loginSub: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  errorBanner: { backgroundColor: '#fee2e2', color: '#dc2626', padding: 10, borderRadius: 8, fontSize: 13, textAlign: 'center', marginBottom: 14 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  inputBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#d1d5db', borderRadius: 12, paddingHorizontal: 12, height: 48 },
  inputField: { flex: 1, marginLeft: 8, fontSize: 15, color: '#1f2937' },
  loginBtn: { backgroundColor: '#2d7a3a', borderRadius: 12, height: 50, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  topHeader: { backgroundColor: '#2d7a3a', paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerBackBtn: { padding: 4 },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  headerSub: { color: '#dcfce7', fontSize: 11, fontWeight: '500' },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80' },
  logoutBtn: { backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  logoutBtnText: { color: '#dc2626', fontSize: 12, fontWeight: '700' },
  tabBar: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  tabScroll: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  tabItem: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6' },
  tabItemActive: { backgroundColor: '#e8f5ea', borderWidth: 1, borderColor: '#a7f3d0' },
  tabLabel: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  tabLabelActive: { color: '#2d7a3a', fontWeight: '700' },
  content: { padding: 16 },
  sectionHeader: { fontSize: 16, fontWeight: '800', color: '#1f2937', marginVertical: 12 },
  financialStatsGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  finCard: { flex: 1, padding: 16, borderRadius: 14, borderWidth: 1.5 },
  finCardValue: { fontSize: 20, fontWeight: '900', color: '#1f2937', marginTop: 8 },
  finCardLabel: { fontSize: 11, color: '#6b7280', marginTop: 2, fontWeight: '600' },
  netProfitCard: { padding: 18, borderRadius: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderWidth: 1.5, borderColor: '#bbf7d0' },
  netProfitLabel: { fontSize: 12, color: '#6b7280', fontWeight: '700' },
  netProfitValue: { fontSize: 26, fontWeight: '900', marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: (width - 42) / 2, backgroundColor: '#fff', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  statNumber: { fontSize: 22, fontWeight: '800', color: '#1f2937', marginTop: 6 },
  statLabel: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  summaryBar: { flexDirection: 'row', backgroundColor: '#fff', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 14 },
  summaryCol: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 10, color: '#6b7280', fontWeight: '600' },
  summaryVal: { fontSize: 15, fontWeight: '800', marginTop: 4 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#e5e7eb' },
  filterChipActive: { backgroundColor: '#2d7a3a' },
  filterChipText: { fontSize: 11, fontWeight: '700', color: '#4b5563' },
  filterChipTextActive: { color: '#fff' },
  transactionCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center' },
  transIconBg: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  transFarmerName: { fontSize: 14, fontWeight: '700', color: '#1f2937' },
  transAmount: { fontSize: 15, fontWeight: '800' },
  transCategory: { fontSize: 12, color: '#4b5563', marginTop: 2 },
  transDesc: { fontSize: 11, color: '#6b7280', marginTop: 1 },
  transDate: { fontSize: 10, color: '#9ca3af', marginTop: 4 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 12, height: 44, borderRadius: 10, borderWidth: 1, borderColor: '#d1d5db', marginBottom: 12 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#1f2937' },
  farmerCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center' },
  farmerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e8f5ea', justifyContent: 'center', alignItems: 'center' },
  farmerAvatarText: { fontSize: 16, fontWeight: '800', color: '#2d7a3a' },
  fName: { fontSize: 15, fontWeight: '700', color: '#1f2937' },
  fSub: { fontSize: 12, color: '#6b7280' },
  viewLedgerBtn: { fontSize: 12, fontWeight: '700', color: '#2d7a3a' },
  joinedText: { fontSize: 10, color: '#9ca3af', marginTop: 4 },
  scanCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center' },
  scanBadge: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  scanCrop: { fontSize: 14, fontWeight: '700', color: '#1f2937' },
  scanStatus: { fontSize: 12, fontWeight: '700' },
  scanDisease: { fontSize: 13, color: '#4b5563', marginTop: 2 },
  scanFarmer: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  scanDate: { fontSize: 10, color: '#9ca3af', marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalBox: { width: '100%', backgroundColor: '#fff', borderRadius: 16, padding: 20, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1f2937' },
  farmerDetailHeader: { marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  farmerDetailName: { fontSize: 18, fontWeight: '800', color: '#1f2937' },
  farmerDetailSub: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  farmerSummaryRow: { flexDirection: 'row', backgroundColor: '#f9fafb', padding: 12, borderRadius: 10, marginBottom: 12 },
  farmerSummaryItem: { flex: 1, alignItems: 'center' },
  fSumLabel: { fontSize: 11, color: '#6b7280', fontWeight: '600' },
  fSumVal: { fontSize: 15, fontWeight: '800', marginTop: 4 },
  singleLedgerRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  singleLedgerCategory: { fontSize: 13, fontWeight: '700', color: '#1f2937' },
  singleLedgerDesc: { fontSize: 12, color: '#6b7280' },
  singleLedgerDate: { fontSize: 10, color: '#9ca3af', marginTop: 2 },
  singleLedgerAmount: { fontSize: 14, fontWeight: '800' },
  emptyText: { textAlign: 'center', padding: 20, color: '#9ca3af' },
});
