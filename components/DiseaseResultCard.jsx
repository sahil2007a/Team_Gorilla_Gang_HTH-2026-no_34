import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { Radius, Shadow, Spacing } from '../constants/spacing';
import { FontSize, FontWeight } from '../constants/typography';
import { Badge } from './ui/Badge';
import { ProgressBar } from './ui/ProgressBar';
import { AlertTriangle, CheckCircle, Info, FlaskConical, Sparkles, Sprout, ShieldCheck, Award } from 'lucide-react-native';
import { Button } from './ui/Button';
import { useLanguage } from '../context/LanguageContext';

export const DiseaseResultCard = ({ result, onViewReport, onScanAnother, onAddExpense }) => {
  const { t } = useLanguage();
  if (!result) return null;

  const healthStatus = result.health_status || result.health?.status || 'Diseased Plant';
  const diseaseName = result.disease_name || result.health?.disease || (healthStatus === 'Healthy Plant' ? 'Healthy Foliage' : 'Fungal Leaf Spot');
  const severity = result.severity || result.health?.severity || (healthStatus === 'Healthy Plant' ? 'Low' : 'Medium');
  
  const confidenceVal = result.disease_confidence !== undefined ? result.disease_confidence : (result.health?.confidence !== undefined ? result.health.confidence : 0.89);
  const confidencePercent = Math.round(confidenceVal <= 1 ? confidenceVal * 100 : confidenceVal);
  
  const products = result.products || {
    pesticide_or_fungicide: 'Syngenta Amistar Top (Azoxystrobin + Difenoconazole, 15ml per 15L pump)',
    fertilizer: 'IFFCO 19:19:19 Water Soluble Fertilizer (75g in 15L water)',
    organic_remedy: 'Multiplex Multineem 10,000 PPM Neem Oil (35ml in 15L water)'
  };

  const precautions = result.precautions && result.precautions.length > 0 
    ? result.precautions 
    : ['Spray during early morning or late evening for maximum absorption', 'Wear protective gloves and mask when spraying'];

  const recommendations = result.recommendations && result.recommendations.length > 0 
    ? result.recommendations 
    : [
        'Apply partner fungicide (Bayer Nativo / Syngenta Amistar Top) to eradicate fungal spores and halt cellular spread',
        'Apply partner fertilizer (IFFCO 19:19:19 / Mahadhan) to rebuild chlorophyll and restore plant vigor',
        'Spray Multiplex Multineem 10,000 PPM for organic protective foliar shield'
      ];

  const isHealthy = healthStatus.toLowerCase().includes('healthy') && !healthStatus.toLowerCase().includes('disease');
  const SeverityIcon = isHealthy ? CheckCircle : severity === 'High' ? AlertTriangle : Info;

  const severityBg = isHealthy ? '#dcfce7' : severity === 'High' ? '#fee2e2' : '#fef3c7';
  const severityTextColor = isHealthy ? '#15803d' : severity === 'High' ? '#dc2626' : '#b45309';

  return (
    <View style={styles.card}>
      {/* Header with Condition & Health Status (No crop name) */}
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: isHealthy ? '#E6F7EE' : severity === 'High' ? '#FDECEA' : '#FEF6E4' }]}>
          <SeverityIcon size={26} color={isHealthy ? Colors.success : severity === 'High' ? Colors.danger : Colors.warning} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.diseaseName}>{t(diseaseName)}</Text>
          <Text style={[styles.cropSubtitle, { color: isHealthy ? '#15803d' : '#b45309' }]}>
            {isHealthy ? `🟢 ${t('Healthy Plant')}` : `🔴 ${t('Diseased Plant')}`}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* ── MIDDLE STATS BAR (Dynamic Confidence & Severity centered) ── */}
      <View style={styles.middleStatsBox}>
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>{t('AI CONFIDENCE')}</Text>
          <Text style={styles.statValue}>{confidencePercent}%</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>{t('SEVERITY LEVEL')}</Text>
          <View style={[styles.severityBadgeCenter, { backgroundColor: severityBg }]}>
            <Text style={[styles.severityTextCenter, { color: severityTextColor }]}>{t(severity)}</Text>
          </View>
        </View>
      </View>

      {/* Confidence Bar */}
      <View style={styles.progressWrap}>
        <ProgressBar
          progress={confidencePercent}
          color={confidencePercent > 85 ? Colors.success : Colors.warning}
          height={7}
        />
      </View>

      {/* Diagnostic Analysis from Mistral Pathologist */}
      {(result.analysis || result.details?.analysis) ? (
        <View style={styles.analysisBox}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Sparkles size={14} color={Colors.primary} />
            <Text style={styles.analysisTitle}>{t('Diagnostic Pathologist Observation')}</Text>
          </View>
          <Text style={styles.analysisText}>{result.analysis || result.details?.analysis}</Text>
        </View>
      ) : null}

      {/* ── PRESCRIBED PARTNER FARM PRODUCTS (Renowned Brands: Bayer, Syngenta, IFFCO, Mahadhan, UPL) ── */}
      {!isHealthy && (
        <View style={styles.productsContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm }}>
            <Text style={styles.sectionHeaderTitle}>📦 {t('Prescribed Farm Products')}</Text>
            <View style={styles.partnerBadge}>
              <Award size={12} color="#15803d" />
              <Text style={styles.partnerBadgeText}>AgriFlow Verified Partner Brands</Text>
            </View>
          </View>
          
          {/* Pesticide / Medicine (Bayer, Syngenta, UPL) */}
          {products.pesticide_or_fungicide ? (
            <View style={styles.productRow}>
              <View style={[styles.productIconWrap, { backgroundColor: '#fee2e2' }]}>
                <FlaskConical size={16} color="#dc2626" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.productTypeTitle}>{t('Partner Medicine / Fungicide')}</Text>
                <Text style={styles.productValueText}>{products.pesticide_or_fungicide}</Text>
              </View>
            </View>
          ) : null}

          {/* Fertilizer (IFFCO, Mahadhan, Coromandel) */}
          {products.fertilizer ? (
            <View style={styles.productRow}>
              <View style={[styles.productIconWrap, { backgroundColor: '#e0f2fe' }]}>
                <Sprout size={16} color="#0284c7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.productTypeTitle}>{t('Partner Fertilizer & Foliar Nutrient')}</Text>
                <Text style={styles.productValueText}>{products.fertilizer}</Text>
              </View>
            </View>
          ) : null}

          {/* Organic Remedy (Multiplex Multineem / Katyayani) */}
          {products.organic_remedy ? (
            <View style={styles.productRow}>
              <View style={[styles.productIconWrap, { backgroundColor: '#dcfce7' }]}>
                <CheckCircle size={16} color="#15803d" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.productTypeTitle}>{t('Partner Organic Biological Shield')}</Text>
                <Text style={styles.productValueText}>{products.organic_remedy}</Text>
              </View>
            </View>
          ) : null}
        </View>
      )}

      {/* ── SAFETY PRECAUTIONS ── */}
      {precautions.length > 0 && (
        <View style={styles.precautionsBox}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <ShieldCheck size={14} color="#b45309" />
            <Text style={styles.precautionsTitle}>{t('Safety & Spray Precautions')}</Text>
          </View>
          {precautions.map((p, i) => (
            <View key={i} style={styles.precautionRow}>
              <Text style={styles.precautionBullet}>⚠️</Text>
              <Text style={styles.precautionText}>{t(p)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* ── RECOMMENDED ACTION PLAN WITH RECOVERY REMEDIES ── */}
      <View style={styles.recSection}>
        <Text style={styles.recHeaderTitle}>🩺 {t('Recommended Recovery Action Plan')}</Text>
        {recommendations.map((rec, i) => (
          <View key={i} style={styles.recRow}>
            <View style={styles.recBullet} />
            <Text style={styles.recText}>{t(rec)}</Text>
          </View>
        ))}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Button title={t('View Full Report')} onPress={onViewReport} variant="primary" size="md" />
        <Button title={t('Scan Another')} onPress={onScanAnother} variant="outline" size="md" />
      </View>
      {onAddExpense && (
        <View style={{ marginTop: 8 }}>
          <Button title={t('Add to Expenses')} onPress={onAddExpense} variant="secondary" size="md" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadow.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  iconWrap: {
    width: 50,
    height: 50,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  diseaseName: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  cropSubtitle: {
    fontSize: FontSize.sm,
    marginTop: 2,
    fontWeight: '700',
  },
  divider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: Spacing.sm },

  // Middle Stats Box
  middleStatsBox: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  statCol: { alignItems: 'center', flex: 1 },
  statLabel: { fontSize: 10, fontWeight: '700', color: '#6b7280', letterSpacing: 0.5, marginBottom: 3 },
  statValue: { fontSize: 18, fontWeight: '900', color: Colors.text },
  statDivider: { width: 1, height: 28, backgroundColor: '#e5e7eb' },
  severityBadgeCenter: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  severityTextCenter: { fontSize: 13, fontWeight: '800' },

  progressWrap: { marginVertical: Spacing.sm },

  // Analysis Box
  analysisBox: {
    backgroundColor: '#f0fdf4',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  analysisTitle: { fontSize: 12, fontWeight: '800', color: Colors.primary },
  analysisText: { fontSize: 12, color: '#374151', lineHeight: 18 },

  // Linked Products
  productsContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionHeaderTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  partnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  partnerBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803d',
    textTransform: 'uppercase',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
    backgroundColor: '#ffffff',
    padding: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#edf2f7',
  },
  productIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productTypeTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  productValueText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 2,
    lineHeight: 16,
  },

  // Precautions Box
  precautionsBox: {
    backgroundColor: '#fffbeb',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  precautionsTitle: { fontSize: 12, fontWeight: '800', color: '#b45309' },
  precautionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 4 },
  precautionBullet: { fontSize: 11, marginTop: 1 },
  precautionText: { fontSize: 11, color: '#92400e', flex: 1, lineHeight: 16, fontWeight: '500' },

  // Recommendations
  recSection: { marginVertical: Spacing.xs },
  recHeaderTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: Spacing.xs },
  recRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 6 },
  recBullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary, marginTop: 6 },
  recText: { fontSize: 12, color: Colors.textSecondary, flex: 1, lineHeight: 18 },

  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
});
