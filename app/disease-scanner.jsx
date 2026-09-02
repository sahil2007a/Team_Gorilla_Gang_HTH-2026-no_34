import { useLanguage } from '../context/LanguageContext';
import React, { useState, useRef, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Animated, ActivityIndicator, Alert } from 'react-native';

import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../constants/colors';
import { Spacing, Radius, Shadow } from '../constants/spacing';
import { FontSize, FontWeight } from '../constants/typography';
import { aiService } from '../services/aiService';
import { DiseaseResultCard } from '../components/DiseaseResultCard';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Camera, Upload, Scan } from 'lucide-react-native';

export default function DiseaseScannerScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [image, setImage] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (params.autoCamera === 'true') {
      setTimeout(() => {
        handleCamera();
      }, 500);
    }
  }, [params.autoCamera]);

  useEffect(() => {
    if (scanning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
          Animated.timing(scanAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      scanAnim.setValue(0);
    }
  }, [scanning]);

  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.1,
      allowsEditing: true,
      aspect: [1, 1],
      base64: true,
    });
    if (!res.canceled && res.assets?.[0]) {
      setImage(res.assets[0].uri);
      setResult(null);
      analyzeImage(res.assets[0].uri, res.assets[0].base64);
    }
  };

  const handleUpload = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.1,
      allowsEditing: true,
      aspect: [1, 1],
      base64: true,
    });
    if (!res.canceled && res.assets?.[0]) {
      setImage(res.assets[0].uri);
      setResult(null);
      analyzeImage(res.assets[0].uri, res.assets[0].base64);
    }
  };

  const analyzeImage = async (uri, base64) => {
    setScanning(true);
    const res = await aiService.analyzeDisease(uri, base64);
    setScanning(false);
    
    if (!res.success || !res.leaf_detected) {
      Alert.alert(
        t('Scan Alert'),
        res.message || t('Leaf not detected. Please capture a clear image of a plant leaf.'),
        [{ text: t('OK'), onPress: handleReset }]
      );
      return;
    }

    setResult(res);
  };

  const handleReset = () => {
    setImage(null);
    setResult(null);
    setScanning(false);
  };

  const scanLineTranslate = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200],
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/');
              }
            }} 
            style={styles.backBtn} 
            activeOpacity={0.8}
          >
            <ArrowLeft size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('AI Crop Scanner')}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Camera Area */}
        <View style={styles.cameraArea}>
          {!image ? (
            <View style={styles.placeholder}>
              <View style={styles.placeholderIcon}>
                <Scan size={48} color={Colors.textMuted} />
              </View>
              <Text style={styles.placeholderTitle}>{t('Scan Your Crop')}</Text>
              <Text style={styles.placeholderSub}>{t('Take or upload a photo of your crop to detect diseases with AI')}</Text>
            </View>
          ) : (
            <View style={styles.imageContainer}>
              <Image source={{ uri: image }} style={styles.cropImage} />
              {scanning && (
                <View style={styles.scanOverlay}>
                  <Animated.View
                    style={[styles.scanLine, { transform: [{ translateY: scanLineTranslate }] }]}
                  />
                  <View style={styles.scanCorners}>
                    <View style={[styles.corner, styles.cornerTL]} />
                    <View style={[styles.corner, styles.cornerTR]} />
                    <View style={[styles.corner, styles.cornerBL]} />
                    <View style={[styles.corner, styles.cornerBR]} />
                  </View>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Scanning state */}
        {scanning && (
          <View style={styles.scanningCard}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.scanningText}>{t('Analyzing crop...')}</Text>
            <Text style={styles.scanningSubtext}>{t('AI is examining your crop for diseases')}</Text>
          </View>
        )}

        {/* Buttons */}
        {!scanning && !result && (
          <View style={styles.actionBtns}>
            <Button
              title={t('Take Photo')}
              onPress={handleCamera}
              variant="primary"
              size="lg"
              icon={<Camera size={18} color="#fff" />}
            />
            <Button
              title={t('Upload Image')}
              onPress={handleUpload}
              variant="outline"
              size="lg"
              icon={<Upload size={18} color={Colors.primary} />}
            />
          </View>
        )}

        {/* Result */}
        {result && !scanning && (
          <>
            <Text style={styles.resultLabel}>{t('Scan Results')}</Text>
            <DiseaseResultCard
              result={result}
              onViewReport={() => router.push({ pathname: '/scan-report', params: { result: JSON.stringify(result) } })}
              onScanAnother={handleReset}
              onAddExpense={() => router.push({ pathname: '/add-expense', params: { photoUri: image } })}
            />
          </>
        )}

        <View style={{ height: Spacing['2xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.base },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.base,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  cameraArea: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.base,
    height: 260,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  placeholderIcon: {
    width: 80,
    height: 80,
    borderRadius: Radius.lg,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  placeholderTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  placeholderSub: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  cropImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(27, 122, 75, 0.1)',
    overflow: 'hidden',
  },
  scanLine: {
    width: '100%',
    height: 2,
    backgroundColor: Colors.primary,
    opacity: 0.8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  scanCorners: {
    ...StyleSheet.absoluteFillObject,
  },
  corner: {
    width: 20,
    height: 20,
    borderColor: Colors.primary,
    position: 'absolute',
  },
  cornerTL: { top: 12, left: 12, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 4 },
  cornerTR: { top: 12, right: 12, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 4 },
  cornerBL: { bottom: 12, left: 12, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 12, right: 12, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 4 },
  scanningCard: {
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.base,
  },
  scanningText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
  scanningSubtext: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  actionBtns: { gap: Spacing.sm },
  resultLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
});
