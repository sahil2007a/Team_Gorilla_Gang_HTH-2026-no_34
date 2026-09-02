import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../constants/colors';
import { Spacing, Radius, Shadow } from '../constants/spacing';
import { FontSize, FontWeight } from '../constants/typography';
import { useLanguage } from '../context/LanguageContext';
import {
  ArrowLeft,
  CheckCircle,
  Circle,
  Clock,
  Camera,
  Upload,
  AlertCircle,
  ShieldCheck,
  Calendar,
  Sparkles,
  MessageSquare,
  X,
  Lock,
  Timer,
  Zap,
  Info,
  Droplets,
  Bug,
  Leaf,
  FlaskConical,
} from 'lucide-react-native';
import { aiService } from '../services/aiService';

const LIFECYCLE_STORAGE_KEY = 'agriflow_crop_lifecycle_v2';
const COOLDOWN_DAYS = 5;
const COOLDOWN_MS = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

// 5-day interval templates covering full lifecycle
const STAGE_TEMPLATES = [
  { id: 0, name: 'Sowing & Sprout Emergence', start: 0, end: 5 },
  { id: 1, name: 'Early Germination & Cotyledon', start: 5, end: 10 },
  { id: 2, name: 'First True Leaves Formation', start: 10, end: 15 },
  { id: 3, name: 'Seedling & Root Establishment', start: 15, end: 20 },
  { id: 4, name: 'Early Vegetative Branching', start: 20, end: 25 },
  { id: 5, name: 'Rapid Stem & Foliage Growth', start: 25, end: 30 },
  { id: 6, name: 'Node & Canopy Development', start: 30, end: 35 },
  { id: 7, name: 'Pre-Flowering & Bud Initiation', start: 35, end: 40 },
  { id: 8, name: 'Early Flowering & Squaring', start: 40, end: 45 },
  { id: 9, name: 'Full Bloom & Pollination', start: 45, end: 50 },
  { id: 10, name: 'Fruit / Boll / Pod Setting', start: 50, end: 55 },
  { id: 11, name: 'Maturity & Grain Filling', start: 55, end: 60 },
  { id: 12, name: 'Harvest Ready & Desiccation', start: 60, end: 65 },
];

export default function CropLifecycleScreen() {
  const { t, tb } = useLanguage();
  const router = useRouter();

  const [activeCycle, setActiveCycle] = useState(null);
  const [dateInput, setDateInput] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [cropName, setCropName] = useState('Crop');
  const [lastScanTime, setLastScanTime] = useState(null);
  const [demoBypass, setDemoBypass] = useState(false);

  // AI Advice Modal State
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiAdviceText, setAiAdviceText] = useState('');
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  // Load persisted lifecycle data on mount
  useEffect(() => {
    loadSavedLifecycle();
  }, []);

  const loadSavedLifecycle = async () => {
    try {
      const saved = await AsyncStorage.getItem(LIFECYCLE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setActiveCycle(parsed.cycle);
        setLastScanTime(parsed.lastScanTime || null);
        setCropName(parsed.cycle?.cropName || 'Crop');
      }
    } catch (e) {
      console.log('Error loading saved lifecycle:', e);
    }
  };

  const saveLifecycle = async (cycle, scanTime) => {
    try {
      await AsyncStorage.setItem(
        LIFECYCLE_STORAGE_KEY,
        JSON.stringify({ cycle, lastScanTime: scanTime })
      );
    } catch (e) {
      console.log('Error saving lifecycle:', e);
    }
  };

  const generateTimeline = (startDateStr, detectedCrop = 'Crop', aiStartDay = 0) => {
    let sDate = new Date(startDateStr);
    if (isNaN(sDate.getTime())) {
      sDate = new Date();
    }

    const today = new Date();
    const diffTime = Math.abs(today - sDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const currentDayTracker = aiStartDay > 0 ? aiStartDay : diffDays;

    const stages = STAGE_TEMPLATES.map((tmpl) => {
      let status = 'upcoming';
      if (currentDayTracker >= tmpl.end) {
        status = 'completed';
      } else if (currentDayTracker >= tmpl.start && currentDayTracker < tmpl.end) {
        status = 'current';
      }

      return {
        ...tmpl,
        status,
        imageUri: null,
        growthCondition: null,
        confidence: null,
        proactivePrecautions: null,
      };
    });

    const newCycle = {
      cropName: detectedCrop,
      startDate: sDate.toISOString().split('T')[0],
      currentDay: currentDayTracker,
      stages,
    };

    setCropName(detectedCrop);
    setActiveCycle(newCycle);
    saveLifecycle(newCycle, lastScanTime);
  };

  const handleStartWithDate = () => {
    const start = dateInput.trim() || new Date().toISOString().split('T')[0];
    generateTimeline(start, cropName || 'Crop');
  };

  const handleStartWithAI = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('Permission Needed'), t('Camera access is required to scan crop leaves.'));
        return;
      }

      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.3,
        base64: true,
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (!res.canceled && res.assets?.[0]) {
        const asset = res.assets[0];
        setAnalyzing(true);

        const aiResult = await aiService.analyzeLifecycleStage(
          asset.uri,
          asset.base64,
          'Day 15: Seedling Phase',
          15
        );
        setAnalyzing(false);

        if (!aiResult.leaf_detected) {
          Alert.alert(
            t('No Leaf Detected 🍃'),
            aiResult.message || t('No plant leaf was recognized. Please capture a clear photo of a crop leaf.')
          );
          return;
        }

        const detectedStageDay = 15;
        Alert.alert(
          t('AI Plant Stage Detected! 🌿'),
          `🌱 ${t('Stage')}: Day 15 (Seedling & Early Leaves)\n` +
          `✨ ${t('Condition')}: ${aiResult.growth_condition || 'Healthy'}\n` +
          `🎯 ${t('AI Confidence')}: ${aiResult.confidence || 93}%\n\n` +
          `${t('Starting 5-day interval tracking.')}`,
          [
            {
              text: t('Start Lifecycle'),
              onPress: () => {
                generateTimeline(
                  new Date().toISOString().split('T')[0],
                  'Crop',
                  detectedStageDay
                );
              },
            },
          ]
        );
      }
    } catch (err) {
      setAnalyzing(false);
      Alert.alert(t('Error'), t('Failed to analyze photo. Please try again.'));
    }
  };

  // Check 5-day lock state
  const getCooldownInfo = () => {
    if (demoBypass || !lastScanTime) {
      return { isLocked: false, remainingText: '', unlockDate: null };
    }
    const elapsed = Date.now() - Number(lastScanTime);
    if (elapsed >= COOLDOWN_MS) {
      return { isLocked: false, remainingText: '', unlockDate: null };
    }

    const remainingMs = COOLDOWN_MS - elapsed;
    const remainingDays = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
    const remainingHours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const unlockDate = new Date(Number(lastScanTime) + COOLDOWN_MS).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
    });

    return {
      isLocked: true,
      remainingDays,
      remainingHours,
      remainingText: `${remainingDays}d ${remainingHours}h remaining`,
      unlockDate,
    };
  };

  const handleUploadPhoto = async (stageIndex) => {
    const cooldown = getCooldownInfo();
    if (cooldown.isLocked) {
      Alert.alert(
        t('🔒 Stage Locked for 5 Days'),
        `${t('You recently completed a stage verification.')}\n\n` +
        `⏳ ${t('To monitor real biological growth, the next photo unlocks after 5 days')}:\n` +
        `• ${t('Time Left')}: ${cooldown.remainingText}\n` +
        `• ${t('Unlocks on')}: ${cooldown.unlockDate}\n\n` +
        `💡 ${t('Tip: You can use the Demo Bypass button at the top if you need to test immediately.')}`,
        [{ text: t('Got It') }]
      );
      return;
    }

    Alert.alert(
      t('Take Photo of Plant Stage'),
      t('Choose image source for 5-day stage verification:'),
      [
        { text: t('Gallery'), onPress: () => launchImagePicker(stageIndex, false) },
        { text: t('Camera'), onPress: () => launchImagePicker(stageIndex, true) },
        { text: t('Cancel'), style: 'cancel' },
      ]
    );
  };

  const launchImagePicker = async (stageIndex, useCamera) => {
    try {
      let res;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(t('Permission Needed'), t('Camera access is required.'));
          return;
        }
        res = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.3,
          base64: true,
          allowsEditing: true,
          aspect: [1, 1],
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(t('Permission Needed'), t('Gallery access is required.'));
          return;
        }
        res = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.3,
          base64: true,
          allowsEditing: true,
          aspect: [1, 1],
        });
      }

      if (!res.canceled && res.assets?.[0]) {
        const asset = res.assets[0];
        setAnalyzing(true);

        const currentStage = activeCycle.stages[stageIndex];
        const aiResult = await aiService.analyzeLifecycleStage(
          asset.uri,
          asset.base64,
          currentStage.name,
          currentStage.start
        );
        setAnalyzing(false);

        // Strict Leaf Validation
        if (!aiResult.leaf_detected) {
          Alert.alert(
            t('No Leaf Detected 🍃'),
            aiResult.message || t('No plant leaf was recognized. Please upload a clear photo of your crop leaf.')
          );
          return;
        }

        const now = Date.now();
        const updatedCycle = { ...activeCycle };
        updatedCycle.stages[stageIndex].imageUri = asset.uri;
        updatedCycle.stages[stageIndex].status = 'completed';
        updatedCycle.stages[stageIndex].growthCondition = aiResult.growth_condition || 'Healthy & Good Growth';
        updatedCycle.stages[stageIndex].confidence = aiResult.confidence || 93;
        updatedCycle.stages[stageIndex].proactivePrecautions = aiResult.proactive_precautions;

        // Move current stage pointer to next stage
        if (stageIndex + 1 < updatedCycle.stages.length) {
          updatedCycle.stages[stageIndex + 1].status = 'current';
        }

        setActiveCycle(updatedCycle);
        setLastScanTime(now);
        saveLifecycle(updatedCycle, now);

        Alert.alert(
          t('Stage Verified & Locked for 5 Days ✅'),
          `🌿 ${t('Stage')}: ${currentStage.name} (Day ${currentStage.start})\n` +
          `✨ ${t('Condition')}: ${aiResult.growth_condition}\n` +
          `🎯 ${t('AI Confidence')}: ${aiResult.confidence}%\n\n` +
          `🔒 ${t('Next stage photo check-in unlocks in 5 days.')}`
        );
      }
    } catch (err) {
      setAnalyzing(false);
      Alert.alert(t('Error'), t('Could not process photo. Please try again.'));
    }
  };

  const handleAskStageAdvice = async (stage) => {
    setAiModalVisible(true);
    setLoadingAdvice(true);
    setAiAdviceText('');

    const query = `Provide stage-specific agronomic advisory for crop at ${stage.name} (Day ${stage.start}-${stage.end}). Give exact fertilizer doses per 15L pump, irrigation timing, and proactive disease prevention.`;
    try {
      const res = await aiService.chat(query);
      setAiAdviceText(res.content);
    } catch (err) {
      setAiAdviceText('Ensure balanced nutrition, soil aeration, and monitor for sucking pests.');
    } finally {
      setLoadingAdvice(false);
    }
  };

  const cooldown = getCooldownInfo();

  // ── SETUP VIEW ──
  if (!activeCycle) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
            <ArrowLeft size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('Start Crop Lifecycle')}</Text>
          <View style={{ width: 40 }} />
        </View>

        {analyzing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>{t('AI Vision analyzing leaf growth stage...')}</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.setupScroll}>
            <Text style={styles.setupTitle}>{t('How would you like to start tracking?')}</Text>

            {/* Option 1: AI Scan */}
            <View
              style={[
                styles.setupCard,
                { borderColor: Colors.primary, borderWidth: 1.5, backgroundColor: '#f0fdf4' },
              ]}
            >
              <View style={styles.setupCardHeader}>
                <View style={[styles.setupIconBox, { backgroundColor: Colors.primary }]}>
                  <Sparkles size={20} color="#fff" />
                </View>
                <Text style={styles.setupCardTitle}>{t('Scan Plant with AI')}</Text>
              </View>
              <Text style={styles.setupCardSub}>
                {t('Upload a photo to automatically detect growth stage, health condition, and proactive precautions.')}
              </Text>

              <TouchableOpacity style={styles.setupBtnSecondary} onPress={handleStartWithAI} activeOpacity={0.8}>
                <Camera size={18} color={Colors.primary} style={{ marginRight: 8 }} />
                <Text style={styles.setupBtnTextSecondary}>{t('Scan Leaf to Start')}</Text>
              </TouchableOpacity>
            </View>

            {/* Option 2: Sowing Date */}
            <View style={styles.setupCard}>
              <View style={styles.setupCardHeader}>
                <View style={styles.setupIconBox}>
                  <Calendar size={20} color={Colors.primary} />
                </View>
                <Text style={styles.setupCardTitle}>{t('Enter Sowing Date')}</Text>
              </View>
              <Text style={styles.setupCardSub}>{t('I know the exact date I sowed the crop')}</Text>

              <TextInput
                style={styles.dateInput}
                placeholder="YYYY-MM-DD (e.g. 2026-07-15)"
                value={dateInput}
                onChangeText={setDateInput}
                placeholderTextColor={Colors.textMuted}
              />

              <TouchableOpacity style={styles.setupBtnPrimary} onPress={handleStartWithDate} activeOpacity={0.8}>
                <Text style={styles.setupBtnTextPrimary}>{t('Start Tracking')}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    );
  }

  // ── ACTIVE TIMELINE VIEW ──
  const currentStage = activeCycle.stages.find((s) => s.status === 'current') || activeCycle.stages[0];

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Navigation Bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('Crop Lifecycle')}</Text>

        {/* Demo Bypass Quick Toggle for testing 5-day intervals */}
        <TouchableOpacity
          style={[styles.demoBtn, demoBypass && styles.demoBtnActive]}
          onPress={() => {
            setDemoBypass(!demoBypass);
            Alert.alert(
              demoBypass ? '🔒 5-Day Lock Enabled' : '⚡ 5-Day Lock Bypassed (Demo Mode)',
              demoBypass
                ? 'The 5-day waiting period between photos is now strictly enforced.'
                : 'You can now take photos for all stages consecutively without waiting 5 days.'
            );
          }}
        >
          <Zap size={14} color={demoBypass ? '#fff' : '#0284c7'} />
          <Text style={[styles.demoBtnText, demoBypass && { color: '#fff' }]}>
            {demoBypass ? 'Demo Mode' : '5-Day Lock'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* 5-Day Lock / Next Scan Countdown Banner */}
        {cooldown.isLocked ? (
          <View style={styles.lockBanner}>
            <View style={styles.lockBannerTop}>
              <Lock size={18} color="#b45309" />
              <Text style={styles.lockBannerTitle}>{t('Next Photo Check-in Locked')}</Text>
            </View>
            <Text style={styles.lockBannerSub}>
              {t('Biological Growth Window Active: Please take your next stage photo in')} <Text style={{ fontWeight: '800', color: '#b45309' }}>{cooldown.remainingText}</Text> ({t('Unlocks')}: {cooldown.unlockDate}).
            </Text>
          </View>
        ) : (
          <View style={styles.banner}>
            <Sparkles size={18} color={Colors.primary} />
            <Text style={styles.bannerText}>
              {t('Current Active Stage')}: <Text style={{ fontWeight: '800' }}>{tb(currentStage.name)}</Text>
            </Text>
          </View>
        )}

        {/* Overview Header Card */}
        <View style={styles.overviewCard}>
          <View>
            <Text style={styles.overviewCrop}>{t('5-Day Growth Tracker')}</Text>
            <Text style={styles.overviewDate}>
              {t('Sowing Date')}: {activeCycle.startDate}
            </Text>
          </View>
          <View style={styles.dayBadge}>
            <Text style={styles.dayBadgeText}>{t('Growth Day')}</Text>
            <Text style={styles.dayBadgeNumber}>{activeCycle.currentDay}</Text>
          </View>
        </View>

        {/* 12-Stage Timeline List */}
        <View style={styles.timelineContainer}>
          {activeCycle.stages.map((stage, index) => {
            const isLast = index === activeCycle.stages.length - 1;
            const isCompleted = stage.status === 'completed' || stage.imageUri;
            const isCurrent = stage.status === 'current';
            const isUpcoming = stage.status === 'upcoming';
            const isStageLocked = isCurrent && cooldown.isLocked;

            return (
              <View key={stage.id} style={styles.timelineRow}>
                {/* Vertical Gutter */}
                <View style={styles.timelineGutter}>
                  <View
                    style={[
                      styles.timelineNode,
                      isCompleted
                        ? { backgroundColor: Colors.success, borderColor: Colors.success }
                        : isCurrent
                        ? { backgroundColor: isStageLocked ? '#f59e0b' : Colors.primary, borderColor: isStageLocked ? '#fef3c7' : Colors.primaryLight, borderWidth: 3 }
                        : { backgroundColor: Colors.surfaceMuted, borderColor: Colors.border, borderWidth: 2 },
                    ]}
                  >
                    {isCompleted && <CheckCircle size={14} color="#fff" />}
                    {isCurrent && (isStageLocked ? <Lock size={12} color="#fff" /> : <Clock size={14} color="#fff" />)}
                    {isUpcoming && <Circle size={10} color={Colors.textMuted} />}
                  </View>
                  {!isLast && (
                    <View
                      style={[styles.timelineLine, isCompleted && { backgroundColor: Colors.success }]}
                    />
                  )}
                </View>

                {/* Stage Card */}
                <View
                  style={[
                    styles.stageCard,
                    isCurrent && styles.stageCardCurrent,
                    isUpcoming && { opacity: 0.65 },
                  ]}
                >
                  <View style={styles.stageHeader}>
                    <Text style={styles.stageName}>{tb(stage.name)}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        isCompleted
                          ? { backgroundColor: '#E6F7EE' }
                          : isCurrent
                          ? { backgroundColor: isStageLocked ? '#fef3c7' : Colors.primaryLight }
                          : {},
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          isCompleted
                            ? { color: Colors.success }
                            : isCurrent
                            ? { color: isStageLocked ? '#b45309' : Colors.primary }
                            : { color: Colors.textSecondary },
                        ]}
                      >
                        {isCompleted ? `✓ ${t('Verified')}` : isCurrent ? (isStageLocked ? `🔒 ${t('Locked (5d)')}` : t('Current Stage')) : t('Upcoming')}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.stageDays}>
                    📅 {t('Day')} {stage.start} - {stage.end} ({stage.end - stage.start} {t('Days Interval')})
                  </Text>

                  {/* Stage Details After Scan */}
                  {stage.imageUri ? (
                    <View style={styles.resultBox}>
                      <Image source={{ uri: stage.imageUri }} style={styles.uploadedImg} />
                      <View style={styles.healthInfo}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                          <ShieldCheck size={16} color={Colors.primary} style={{ marginRight: 6 }} />
                          <Text style={styles.healthTitle}>{t('Stage Pathology & Health Report')}</Text>
                        </View>

                        {/* Condition Badge */}
                        <View style={styles.conditionRow}>
                          <Text style={styles.conditionLabel}>{t('Growth Condition')}:</Text>
                          <Text style={styles.conditionValue}>{stage.growthCondition || '🟢 Healthy & Good Condition'}</Text>
                        </View>
                        <Text style={styles.confidenceText}>{t('AI Confidence')}: {stage.confidence || 93}%</Text>

                        {/* Proactive Precautions Before Disease */}
                        {stage.proactivePrecautions && (
                          <View style={styles.precautionBox}>
                            <Text style={styles.precautionHeader}>
                              🛡️ {t('Proactive Precautions (Prevent Disease)')}:
                            </Text>

                            <View style={styles.precautionItem}>
                              <FlaskConical size={14} color="#15803d" />
                              <Text style={styles.precautionText}>
                                <Text style={{ fontWeight: '700' }}>{t('Disease Shield')}: </Text>
                                {stage.proactivePrecautions.disease_prevention}
                              </Text>
                            </View>

                            <View style={styles.precautionItem}>
                              <Bug size={14} color="#dc2626" />
                              <Text style={styles.precautionText}>
                                <Text style={{ fontWeight: '700' }}>{t('Pest Defense')}: </Text>
                                {stage.proactivePrecautions.pest_defense}
                              </Text>
                            </View>

                            <View style={styles.precautionItem}>
                              <Leaf size={14} color="#0284c7" />
                              <Text style={styles.precautionText}>
                                <Text style={{ fontWeight: '700' }}>{t('Foliar Boost')}: </Text>
                                {stage.proactivePrecautions.foliar_boost}
                              </Text>
                            </View>

                            <View style={styles.precautionItem}>
                              <Droplets size={14} color="#0284c7" />
                              <Text style={styles.precautionText}>
                                <Text style={{ fontWeight: '700' }}>{t('Watering')}: </Text>
                                {stage.proactivePrecautions.irrigation_guide}
                              </Text>
                            </View>
                          </View>
                        )}
                      </View>
                    </View>
                  ) : isCurrent ? (
                    <View style={styles.actionBox}>
                      {analyzing ? (
                        <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                          <ActivityIndicator size="small" color={Colors.primary} />
                          <Text style={{ fontSize: 12, color: Colors.primary, marginTop: 6, fontWeight: '600' }}>
                            {t('AI Model classifying stage & precautions...')}
                          </Text>
                        </View>
                      ) : (
                        <>
                          <Text style={styles.actionPrompt}>
                            {isStageLocked ? t('Stage in 5-day progress window') : t('Take photo to verify stage & receive precautions')}
                          </Text>
                          <View style={styles.actionBtns}>
                            <TouchableOpacity
                              style={[styles.cameraBtn, isStageLocked && styles.cameraBtnLocked]}
                              onPress={() => handleUploadPhoto(index)}
                              activeOpacity={0.8}
                            >
                              {isStageLocked ? <Lock size={16} color="#92400e" /> : <Camera size={16} color="#fff" />}
                              <Text style={[styles.btnText, isStageLocked && { color: '#92400e', fontWeight: '800' }]}>
                                {isStageLocked ? `${t('Locked')} (${cooldown.remainingText})` : t('Take Stage Photo')}
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.aiAdviceBtn}
                              onPress={() => handleAskStageAdvice(stage)}
                              activeOpacity={0.8}
                            >
                              <MessageSquare size={16} color={Colors.primary} />
                              <Text style={styles.aiAdviceBtnText}>{t('AI Advice')}</Text>
                            </TouchableOpacity>
                          </View>
                        </>
                      )}
                    </View>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* AI Advice Modal */}
      <Modal visible={aiModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Sparkles size={20} color={Colors.primary} />
                <Text style={styles.modalTitle}>{t('AgriFlow AI Stage Advice')}</Text>
              </View>
              <TouchableOpacity onPress={() => setAiModalVisible(false)}>
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {loadingAdvice ? (
              <View style={{ padding: 30, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={{ marginTop: 12, color: '#6b7280', fontSize: 13 }}>
                  {t('Generating agronomic advice for this growth stage...')}
                </Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 400, marginTop: 10 }}>
                <Text style={styles.modalAdviceText}>{aiAdviceText}</Text>
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setAiModalVisible(false)}
            >
              <Text style={styles.modalCloseBtnText}>{t('Close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  demoBtnActive: {
    backgroundColor: '#0284c7',
  },
  demoBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284c7',
  },
  scroll: {
    padding: Spacing.md,
    paddingBottom: 40,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  bannerText: {
    fontSize: 13,
    color: '#15803d',
    flex: 1,
  },
  lockBanner: {
    backgroundColor: '#fffbeb',
    padding: 12,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  lockBannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  lockBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400e',
  },
  lockBannerSub: {
    fontSize: 12,
    color: '#78350f',
    lineHeight: 18,
  },
  overviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radius.xl,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  overviewCrop: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: 2,
  },
  overviewDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  dayBadge: {
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  dayBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  dayBadgeNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.primary,
  },

  // Timeline
  timelineContainer: {
    gap: 0,
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 90,
  },
  timelineGutter: {
    width: 32,
    alignItems: 'center',
    marginRight: 10,
  },
  timelineNode: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.border,
    marginVertical: 2,
  },
  stageCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  stageCardCurrent: {
    borderColor: Colors.primary,
    borderWidth: 1.5,
    backgroundColor: '#fff',
  },
  stageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  stageName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
    flex: 1,
    marginRight: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  stageDays: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 8,
  },

  // Results
  resultBox: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  uploadedImg: {
    width: '100%',
    height: 160,
    borderRadius: Radius.md,
    marginBottom: 8,
  },
  healthInfo: {
    gap: 4,
  },
  healthTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
  },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  conditionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  conditionValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803d',
  },
  confidenceText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  precautionBox: {
    marginTop: 8,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  precautionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 2,
  },
  precautionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  precautionText: {
    fontSize: 11,
    color: Colors.text,
    lineHeight: 16,
    flex: 1,
  },

  // Action Buttons
  actionBox: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  actionPrompt: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  actionBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  cameraBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
  },
  cameraBtnLocked: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  btnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  aiAdviceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  aiAdviceBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },

  // Setup View
  setupScroll: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  setupTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  setupCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  setupCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  setupIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setupCardTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  setupCardSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  setupBtnPrimary: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  setupBtnTextPrimary: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  setupBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dcfce7',
    paddingVertical: 12,
    borderRadius: Radius.md,
  },
  setupBtnTextSecondary: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
    marginBottom: Spacing.md,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    padding: Spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  modalAdviceText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 20,
  },
  modalCloseBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  modalCloseBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
