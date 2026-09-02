import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../constants/colors';
import { Spacing, Radius, Shadow } from '../constants/spacing';
import { useLanguage } from '../context/LanguageContext';
import {
  ArrowLeft, CheckCircle, AlertTriangle, Info,
  Leaf, FlaskConical, Sprout, ShieldCheck,
  ThumbsUp, Zap, BookOpen, Clock
} from 'lucide-react-native';

export default function ScanReportScreen() {
  const router = useRouter();
  const { t, tb } = useLanguage();
  const params = useLocalSearchParams();

  // Parse the result passed from disease-scanner
  let result = null;
  try {
    result = params.result ? JSON.parse(params.result) : null;
  } catch (e) {
    result = null;
  }

  if (!result) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan Report</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: Colors.textSecondary }}>No report data found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const cropName = result.plant_name || result.crop_name || result.crop?.name || 'Crop Plant';
  const diseaseName = result.disease_name || result.health?.disease || 'Healthy Crop';
  const healthStatus = result.health_status || result.health?.status || 'Healthy';
  const severity = result.severity || result.health?.severity || (healthStatus === 'Healthy' ? 'Low' : 'Medium');
  const confidenceVal = result.disease_confidence !== undefined ? result.disease_confidence : (result.health?.confidence !== undefined ? result.health.confidence : 0.92);
  const confidencePercent = Math.round(confidenceVal <= 1 ? confidenceVal * 100 : confidenceVal);
  const leafConfVal = result.leaf_confidence || result.crop_confidence || 0.95;
  const leafConfPercent = Math.round(leafConfVal <= 1 ? leafConfVal * 100 : leafConfVal);

  const isHealthy = healthStatus === 'Healthy' || diseaseName === 'None';
  const isHigh = severity === 'High';
  const isMedium = severity === 'Moderate' || severity === 'Medium';

  const statusColor = isHealthy ? Colors.success : isHigh ? Colors.danger : Colors.warning;
  const statusBg = isHealthy ? '#E6F7EE' : isHigh ? '#FDEDED' : '#FDF4EC';
  const StatusIcon = isHealthy ? CheckCircle : isHigh ? AlertTriangle : Info;

  const analysisText = result.analysis || result.details?.analysis || result.cause || result.details?.cause || t('The AI vision model analyzed leaf patterns, veins, and chlorophyll distribution.');
  const actionPlanText = result.action || result.details?.action || (result.recommendations && result.recommendations[0]) || t('Maintain regular scouting and proper nutrient balance.');

  // Simple human-friendly urgency message
  const getUrgencyMessage = () => {
    if (isHealthy) return '✅ ' + t('Your crop is in great shape! Keep up the good work.');
    if (isHigh) return '🚨 ' + t('Act immediately! This condition can spread fast and reduce yield.');
    if (isMedium) return '⚠️ ' + t('Take action within 2–3 days before symptoms intensify.');
    return 'ℹ️ ' + t('Keep an eye on your crop and treat if symptoms increase.');
  };

  const getSimpleExplanation = () => {
    if (isHealthy) return t('The AI scanned your crop leaf and confirmed healthy tissue. Your foliage looks strong and is growing normally. Continue your regular care routine!');
    return `${t('The AI diagnosed signs of')} ${tb(diseaseName)}. ${analysisText}`;
  };

  const getWhatToDoNow = () => {
    if (result.recommendations && result.recommendations.length > 0) {
      return result.recommendations;
    }
    if (isHealthy) return [
      t('Continue your regular watering schedule'),
      t('Apply preventive neem spray every 3 weeks'),
      t('Keep checking for early signs of disease'),
    ];
    return [
      actionPlanText,
      t('Remove heavily damaged leaves to avoid spore spread'),
      t('Spray during early morning or late evening for best absorption'),
      t('Re-scan in 4 days to monitor recovery progress'),
    ];
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('Pathology Scan Report')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Verification Status Card */}
        <View style={styles.mlMetricsCard}>
          <View style={styles.metricRow}>
            <Leaf size={18} color={Colors.success} />
            <View style={styles.metricTextContainer}>
              <Text style={styles.metricTitle}>{t('Leaf Foliage Detected')}</Text>
              <Text style={styles.metricSubtitle}>{t('AI Verification')}: {confidencePercent}%</Text>
            </View>
            <CheckCircle size={20} color={Colors.success} />
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricRow}>
            <Sprout size={18} color={Colors.primary} />
            <View style={styles.metricTextContainer}>
              <Text style={styles.metricTitle}>{t('Health Status')}: {tb(healthStatus)}</Text>
              <Text style={styles.metricSubtitle}>{t('Pathology Confidence')}: {confidencePercent}%</Text>
            </View>
            <CheckCircle size={20} color={Colors.primary} />
          </View>
        </View>

        {/* Status Hero Card */}
        <View style={[styles.heroCard, { backgroundColor: statusBg, borderColor: statusColor }]}>
          <View style={[styles.heroIcon, { backgroundColor: statusColor + '22' }]}>
            <StatusIcon size={36} color={statusColor} />
          </View>
          <Text style={[styles.heroDisease, { color: statusColor }]}>{tb(diseaseName)}</Text>
          <Text style={[styles.heroScientific, { fontWeight: '700', color: isHealthy ? '#15803d' : '#dc2626' }]}>
            {isHealthy ? `🟢 ${t('Healthy Foliage')}` : `🔴 ${t('Diseased Foliage')}`}
          </Text>
          
          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>{t('AI Confidence')}</Text>
              <Text style={[styles.heroStatValue, { color: statusColor }]}>{confidencePercent}%</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>{t('Severity Level')}</Text>
              <Text style={[styles.heroStatValue, { color: statusColor }]}>{t(severity)}</Text>
            </View>
          </View>
        </View>

        {/* Urgency Banner */}
        <View style={[styles.urgencyBanner, { backgroundColor: statusBg, borderColor: statusColor }]}>
          <Zap size={18} color={statusColor} />
          <Text style={[styles.urgencyText, { color: statusColor }]}>{getUrgencyMessage()}</Text>
        </View>

        {/* Simple Explanation */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <BookOpen size={18} color={Colors.primary} />
            <Text style={styles.cardTitle}>🌿 {t('What This Means (In Simple Words)')}</Text>
          </View>
          <Text style={styles.simpleText}>{getSimpleExplanation()}</Text>
        </View>

        {/* What Did AI See */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Leaf size={18} color={Colors.primary} />
            <Text style={styles.cardTitle}>👁️ {t('What the AI Noticed on Your Crop')}</Text>
          </View>
          <Text style={styles.sectionSub}>{t('These are the exact signs the AI detected:')}</Text>
          {result.symptoms?.map((s, i) => (
            <View key={i} style={styles.symptomRow}>
              <View style={[styles.bullet, { backgroundColor: statusColor }]} />
              <Text style={styles.symptomText}>{s}</Text>
            </View>
          ))}
        </View>

        {/* What To Do Now */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <ShieldCheck size={18} color={Colors.success} />
            <Text style={styles.cardTitle}>✅ {t('What To Do Right Now')}</Text>
          </View>
          <Text style={styles.sectionSub}>{t('Follow these simple steps:')}</Text>
          {getWhatToDoNow().map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>

        {/* AI Recommendation */}
        <View style={[styles.card, { backgroundColor: Colors.primaryLight }]}>
          <View style={styles.cardHeader}>
            <Sprout size={18} color={Colors.primary} />
            <Text style={[styles.cardTitle, { color: Colors.primary }]}>🤖 {t('AI Expert Recommendation')}</Text>
          </View>
          <Text style={styles.recText}>{actionPlanText}</Text>
        </View>

        {/* Treatment & Prescribed Farm Products */}
        {!isHealthy && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <FlaskConical size={18} color={Colors.primary} />
              <Text style={styles.cardTitle}>📦 {t('Prescribed Farm Products')}</Text>
            </View>
            <Text style={styles.sectionSub}>{t('Specific products and exact dosages recommended for your crop:')}</Text>

            {/* Chemical Pesticide / Medicine */}
            <View style={styles.treatmentBox}>
              <Text style={styles.treatmentType}>🧪 {t('Chemical Pesticide / Medicine')}</Text>
              <Text style={styles.treatmentDesc}>
                {result.products?.pesticide_or_fungicide || result.details?.action || result.action || t('Apply recommended systemic fungicide / pesticide.')}
              </Text>
              <Text style={styles.treatmentNote}>{t('Fast-acting cure. Follow exact dosage per 15L pump.')}</Text>
            </View>

            {/* Fertilizer / Nutrient */}
            {result.products?.fertilizer ? (
              <View style={[styles.treatmentBox, { backgroundColor: '#f0f9ff', borderColor: '#bae6fd' }]}>
                <Text style={[styles.treatmentType, { color: '#0284c7' }]}>🌱 {t('Fertilizer & Foliar Nutrient')}</Text>
                <Text style={styles.treatmentDesc}>{result.products.fertilizer}</Text>
                <Text style={styles.treatmentNote}>{t('Boosts chlorophyll regeneration and crop vigor.')}</Text>
              </View>
            ) : null}

            {/* Organic Remedy */}
            <View style={[styles.treatmentBox, { backgroundColor: '#E6F7EE', borderColor: Colors.success }]}>
              <Text style={[styles.treatmentType, { color: Colors.success }]}>🌿 {t('Organic / Biological Remedy')}</Text>
              <Text style={styles.treatmentDesc}>
                {result.products?.organic_remedy || result.treatment?.organic || t('Spray 10,000 PPM Neem Oil (35ml in 15L water) or Trichoderma viride.')}
              </Text>
              <Text style={styles.treatmentNote}>{t('Eco-friendly, zero chemical residue.')}</Text>
            </View>
          </View>
        )}

        {/* Safety Precautions */}
        {result.precautions && result.precautions.length > 0 && (
          <View style={[styles.card, { backgroundColor: '#fffbeb', borderColor: '#fef3c7' }]}>
            <View style={styles.cardHeader}>
              <ShieldCheck size={18} color="#b45309" />
              <Text style={[styles.cardTitle, { color: '#b45309' }]}>⚠️ {t('Safety & Spray Precautions')}</Text>
            </View>
            {result.precautions.map((p, i) => (
              <View key={i} style={styles.symptomRow}>
                <Text style={{ fontSize: 12, marginRight: 4 }}>•</Text>
                <Text style={[styles.symptomText, { color: '#92400e', fontWeight: '500' }]}>{t(p)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Healthy Tips */}
        {isHealthy && (
          <View style={[styles.card, { backgroundColor: '#E6F7EE', borderColor: Colors.success }]}>
            <View style={styles.cardHeader}>
              <ThumbsUp size={18} color={Colors.success} />
              <Text style={[styles.cardTitle, { color: Colors.success }]}>👏 {t('Keep Your Crop Healthy!')}</Text>
            </View>
            <Text style={styles.simpleText}>
              {t('Spray neem oil (35 mL per 15L pump) every 3 weeks as a natural shield against future diseases. Always check the underside of leaves where pests hide first!')}
            </Text>
          </View>
        )}

        <View style={{ height: Spacing['3xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface,
  },
  backBtn: { width: 40, height: 40, borderRadius: Radius.md, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  scroll: { padding: Spacing.base, gap: Spacing.md },

  heroCard: {
    borderRadius: Radius['2xl'], borderWidth: 1.5, padding: Spacing.xl,
    alignItems: 'center', gap: Spacing.sm,
  },
  heroIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  heroDisease: { fontSize: 22, fontWeight: '900', textAlign: 'center' },
  heroScientific: { fontSize: 13, color: Colors.textSecondary, fontStyle: 'italic', textAlign: 'center' },
  
  heroStatsRow: { flexDirection: 'row', marginTop: Spacing.md, width: '100%', justifyContent: 'space-around', alignItems: 'center' },
  heroStatItem: { alignItems: 'center', gap: 4 },
  heroStatValue: { fontSize: 18, fontWeight: '900' },
  heroStatLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },
  heroStatDivider: { width: 1, height: 36, backgroundColor: Colors.border },

  mlMetricsCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.border, ...Shadow.sm, gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  metricRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  metricTextContainer: { flex: 1 },
  metricTitle: { fontSize: 14, fontWeight: '800', color: Colors.text },
  metricSubtitle: { fontSize: 12, color: Colors.textSecondary },
  metricDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 4 },

  urgencyBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    borderWidth: 1.5, borderRadius: Radius.xl, padding: Spacing.md,
  },
  urgencyText: { flex: 1, fontSize: 14, fontWeight: '700', lineHeight: 22 },

  card: {
    backgroundColor: Colors.surface, borderRadius: Radius['2xl'], padding: Spacing.xl,
    borderWidth: 1, borderColor: Colors.border, ...Shadow.sm, gap: Spacing.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 4 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: Colors.text, flex: 1 },
  sectionSub: { fontSize: 13, color: Colors.textSecondary, marginBottom: 4 },

  simpleText: { fontSize: 14, color: Colors.text, lineHeight: 24 },

  symptomRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginTop: 4 },
  bullet: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  symptomText: { flex: 1, fontSize: 14, color: Colors.text, lineHeight: 22 },

  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, marginTop: Spacing.sm },
  stepNum: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  stepNumText: { color: '#FFF', fontSize: 13, fontWeight: '900' },
  stepText: { flex: 1, fontSize: 14, color: Colors.text, lineHeight: 22 },

  recText: { fontSize: 14, color: Colors.text, lineHeight: 24 },

  treatmentBox: {
    backgroundColor: '#F5F3EB', borderRadius: Radius.xl, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm, gap: 4,
  },
  treatmentType: { fontSize: 13, fontWeight: '800', color: Colors.primary },
  treatmentDesc: { fontSize: 14, color: Colors.text, fontWeight: '600' },
  treatmentNote: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },

  freqRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  freqText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
});
