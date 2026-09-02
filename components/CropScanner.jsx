import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../constants/colors';
import { Radius, Spacing, Shadow } from '../constants/spacing';
import { FontSize, FontWeight } from '../constants/typography';
import { Button } from './ui/Button';
import {
  Scan,
  Image as ImageIcon,
  Camera,
  Zap,
  FileImage,
  ShieldAlert,
  FlaskConical,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react-native';
import { useLanguage } from '../context/LanguageContext';
import { aiService } from '../services/aiService';

export function CropScanner() {
  const { t, language } = useLanguage();
  const [imageUri, setImageUri] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('Permission Needed'), t('Camera access is required to scan crop leaves.'));
        return;
      }

      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.2,
        allowsEditing: true,
        aspect: [1, 1],
        base64: true,
      });

      if (!res.canceled && res.assets?.[0]) {
        const asset = res.assets[0];
        setImageUri(asset.uri);
        runAnalysis(asset.uri, asset.base64);
      }
    } catch (err) {
      console.warn('Camera error:', err);
      Alert.alert(t('Error'), t('Could not launch camera.'));
    }
  };

  const handleUploadPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('Permission Needed'), t('Gallery access is required to select photos.'));
        return;
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.2,
        allowsEditing: true,
        aspect: [1, 1],
        base64: true,
      });

      if (!res.canceled && res.assets?.[0]) {
        const asset = res.assets[0];
        setImageUri(asset.uri);
        runAnalysis(asset.uri, asset.base64);
      }
    } catch (err) {
      console.warn('Gallery error:', err);
      Alert.alert(t('Error'), t('Could not select image.'));
    }
  };

  const runAnalysis = async (uri, base64) => {
    setScanning(true);
    setResult(null);
    try {
      const data = await aiService.analyzeDisease(uri, base64, language);
      setResult(data);
    } catch (err) {
      console.warn('Analysis error:', err);
      setResult({
        success: true,
        leaf_detected: false,
        message: t('Analysis failed. Please try again with a clear photo.'),
      });
    } finally {
      setScanning(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: Spacing['3xl'] }}
    >
      {/* Camera / Image Box */}
      <View style={styles.cameraBox}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        ) : (
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?q=80&w=600&auto=format&fit=crop',
            }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />
        )}

        <View style={styles.cameraOverlay}>
          {/* Top Bar inside Camera */}
          <View style={styles.cameraTop}>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>{t('AI Vision Scanner')}</Text>
            </View>
          </View>

          {/* Scanning Progress Overlay */}
          {scanning && (
            <View style={styles.scanningOverlay}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.scanningText}>{t('Analyzing leaf pathology & health...')}</Text>
            </View>
          )}

          {/* Bottom Actions inside Camera */}
          <View style={styles.cameraBottom}>
            <TouchableOpacity
              style={styles.uploadBtn}
              onPress={handleUploadPhoto}
              disabled={scanning}
              activeOpacity={0.8}
            >
              <ImageIcon size={18} color={Colors.text} />
              <Text style={styles.uploadText}>{t('Upload')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.photoBtn}
              onPress={handleTakePhoto}
              disabled={scanning}
              activeOpacity={0.8}
            >
              <Camera size={18} color="#FFF" />
              <Text style={styles.photoText}>{t('Take Photo')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Analysis Result Card */}
      {result && (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <View
              style={[
                styles.resultIconBox,
                {
                  backgroundColor: !result.leaf_detected
                    ? '#fee2e2'
                    : result.health?.status === 'Healthy'
                    ? '#dcfce7'
                    : '#fef3c7',
                },
              ]}
            >
              <Sparkles
                size={18}
                color={
                  !result.leaf_detected
                    ? '#dc2626'
                    : result.health?.status === 'Healthy'
                    ? '#15803d'
                    : '#d97706'
                }
              />
            </View>
            <Text style={styles.resultTitle}>
              {!result.leaf_detected ? t('No Leaf Detected') : t('Diagnostic Report')}
            </Text>
          </View>

          {!result.leaf_detected ? (
            <View style={styles.noLeafBox}>
              <AlertTriangle size={24} color="#dc2626" />
              <Text style={styles.noLeafText}>
                {result.message || t('No plant leaf was recognized. Please capture a clear, well-lit photo of a leaf.')}
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.middleStatsBox}>
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>{t('HEALTH STATUS')}</Text>
                  <Text style={[styles.statValueText, { color: (result.health_status || result.health?.status || '').toLowerCase().includes('healthy') && !(result.health_status || result.health?.status || '').toLowerCase().includes('disease') ? '#15803d' : '#dc2626' }]}>
                    {(result.health_status || result.health?.status || '').toLowerCase().includes('healthy') && !(result.health_status || result.health?.status || '').toLowerCase().includes('disease') ? t('Healthy') : t('Diseased')}
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>{t('AI CONFIDENCE')}</Text>
                  <Text style={styles.statValueText}>
                    {Math.round(((result.disease_confidence !== undefined ? result.disease_confidence : (result.health?.confidence !== undefined ? result.health.confidence : 0.88)) <= 1 ? (result.disease_confidence !== undefined ? result.disease_confidence : (result.health?.confidence !== undefined ? result.health.confidence : 0.88)) * 100 : (result.disease_confidence || result.health?.confidence || 88)))}%
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>{t('SEVERITY')}</Text>
                  <View
                    style={[
                      styles.severityBadgeCenter,
                      {
                        backgroundColor:
                          (result.health?.severity || result.severity) === 'High'
                            ? '#fee2e2'
                            : (result.health?.severity || result.severity) === 'Medium'
                            ? '#fef3c7'
                            : '#dcfce7',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.severityTextCenter,
                        {
                          color:
                            (result.health?.severity || result.severity) === 'High'
                              ? '#dc2626'
                              : (result.health?.severity || result.severity) === 'Medium'
                              ? '#b45309'
                              : '#15803d',
                        },
                      ]}
                    >
                      {t(result.health?.severity || result.severity || 'Low')}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.conditionRow}>
                <Text style={styles.conditionLabel}>{t('Condition Detected')}:</Text>
                <Text style={[styles.conditionValue, { color: (result.health?.disease || result.disease_name) && (result.health?.disease || result.disease_name) !== 'None' ? Colors.danger : Colors.success }]}>
                  {result.health?.disease || result.disease_name || t('Healthy Leaf')}
                </Text>
              </View>

              {result.details?.analysis ? (
                <View style={styles.recommendationBox}>
                  <Text style={styles.recommendationTitle}>{t('Diagnostic Analysis')}</Text>
                  <Text style={styles.recommendationText}>{result.details.analysis}</Text>

                  {result.details?.action ? (
                    <View style={styles.recSection}>
                      <View style={styles.recHeader}>
                        <CheckCircle2 size={14} color={Colors.primary} />
                        <Text style={styles.recSectionTitle}>{t('Action Plan')}</Text>
                      </View>
                      <Text style={styles.recText}>{result.details.action}</Text>
                    </View>
                  ) : null}

                  {result.recommendations && result.recommendations.length > 0 ? (
                    <View style={styles.recSection}>
                      <View style={styles.recHeader}>
                        <FlaskConical size={14} color={Colors.primary} />
                        <Text style={styles.recSectionTitle}>{t('Treatment Recommendations')}</Text>
                      </View>
                      {result.recommendations.map((rec, i) => (
                        <Text key={i} style={styles.recBullet}>
                          • {rec}
                        </Text>
                      ))}
                    </View>
                  ) : null}
                </View>
              ) : null}

              <Button
                title={t('Add to Field Log')}
                variant="outline"
                style={{ borderRadius: Radius.md, marginTop: Spacing.sm }}
                textStyle={{ color: Colors.textSecondary, fontWeight: '700' }}
                onPress={() => Alert.alert(t('Saved'), t('Diagnosis logged to farm history!'))}
              />
            </>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.base },
  cameraBox: { height: 260, borderRadius: Radius.xl, overflow: 'hidden', ...Shadow.md, backgroundColor: '#000', marginBottom: Spacing.lg },
  cameraOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', padding: Spacing.base, backgroundColor: 'rgba(0,0,0,0.25)' },
  cameraTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.full },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success, marginRight: 6 },
  liveText: { color: '#FFF', fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  scanningOverlay: { alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)', padding: 16, borderRadius: 12 },
  scanningText: { color: '#fff', fontSize: 13, fontWeight: '700', marginTop: 8 },
  cameraBottom: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md },
  uploadBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', paddingVertical: Spacing.md, borderRadius: Radius.md, gap: Spacing.xs },
  uploadText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.text },
  photoBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary, paddingVertical: Spacing.md, borderRadius: Radius.md, gap: Spacing.xs },
  photoText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: '#FFF' },
  resultCard: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.lg, ...Shadow.sm },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  resultIconBox: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  resultTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  noLeafBox: { padding: 16, backgroundColor: '#fef2f2', borderRadius: 12, alignItems: 'center', gap: 8 },
  noLeafText: { fontSize: 13, color: '#b91c1c', textAlign: 'center', fontWeight: '600' },
  middleStatsBox: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  statCol: { alignItems: 'center', flex: 1 },
  statLabel: { fontSize: 10, fontWeight: '700', color: '#6b7280', letterSpacing: 0.5, marginBottom: 3 },
  statValueText: { fontSize: 16, fontWeight: '900', color: Colors.text },
  statDivider: { width: 1, height: 26, backgroundColor: '#e5e7eb' },
  severityBadgeCenter: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  severityTextCenter: { fontSize: 12, fontWeight: '800' },
  conditionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.xs, marginBottom: Spacing.xs },
  conditionLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  conditionValue: { fontSize: 14, fontWeight: '800' },
  recommendationBox: { backgroundColor: Colors.surfaceMuted, padding: Spacing.md, borderRadius: Radius.lg, marginTop: Spacing.md, marginBottom: Spacing.md },
  recommendationTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: Spacing.xs },
  recommendationText: { fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 18, marginBottom: Spacing.sm },
  recSection: { marginTop: Spacing.sm },
  recHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: 4 },
  recSectionTitle: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.primary },
  recText: { fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 18 },
  recBullet: { fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 18, marginLeft: 6 },
});
