import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { COLORS, RADIUS, SPACING, SHADOWS } from '../src/constants/theme';
import { analyzePlantImage, setActiveResultSession } from '../src/services/api';
import { saveScanItem } from '../src/services/storage';
import { ScanHistoryItem } from '../src/types';

export default function PreviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ imageUri?: string }>();
  const [currentUri, setCurrentUri] = useState<string>(params.imageUri || '');
  const [plantLabel, setPlantLabel] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStep, setAnalysisStep] = useState<string>('Validating photograph...');

  if (!currentUri) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="image-outline" size={64} color={COLORS.textMuted} />
        <Text style={styles.emptyTitle}>No image selected</Text>
        <TouchableOpacity style={styles.retakeBtn} onPress={() => router.back()}>
          <Text style={styles.retakeBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleRetake = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCurrentUri(result.assets[0].uri);
      }
    } catch (err: any) {
      alert('Could not retake photo: ' + (err.message || 'Unknown error'));
    }
  };

  const handleSelectFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCurrentUri(result.assets[0].uri);
      }
    } catch (err: any) {
      alert('Could not select photo: ' + (err.message || 'Unknown error'));
    }
  };

  const handleStartAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisStep('Uploading leaf image to backend...');

    try {
      // Step progression feedback
      setTimeout(() => setAnalysisStep('Preprocessing tensor with MobileNetV2...'), 500);
      setTimeout(() => setAnalysisStep('Evaluating symptoms against knowledge base...'), 1200);

      const response = await analyzePlantImage(currentUri);

      // Create history item
      const scanItem: ScanHistoryItem = {
        id: response.prediction_id || 'scan_' + Date.now().toString(),
        timestamp: response.timestamp || new Date().toISOString(),
        dateFormatted: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        imageUri: currentUri,
        plant: response.plant,
        disease: response.disease,
        class_id: response.class_id,
        confidence: response.confidence,
        confidence_percent: response.confidence_percent,
        confidence_level: response.confidence_level,
        is_healthy: response.is_healthy,
        is_confident: response.is_confident,
        uncertainty_message: response.uncertainty_message,
        plantLabel: plantLabel.trim() || undefined,
        disease_details: response.disease_details,
        top_predictions: response.top_predictions,
      };

      // Set in-memory active session for instant display
      setActiveResultSession(response, currentUri, plantLabel.trim());

      // Save to local storage safely
      try {
        await saveScanItem(scanItem);
      } catch (storageErr) {
        console.warn('Scan history save non-fatal issue:', storageErr);
      }

      setIsAnalyzing(false);

      // Navigate to detailed results cleanly without putting megabytes of data in the browser URL!
      router.replace('/results');
    } catch (err: any) {
      setIsAnalyzing(false);
      alert('Analysis failed: ' + (err.message || 'Unknown network error. Check backend.'));
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Preview Frame */}
        <View style={styles.imageCard}>
          <Image source={{ uri: currentUri }} style={styles.previewImage} resizeMode="cover" />
          <View style={styles.previewBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.previewBadgeText}>Ready to analyze</Text>
          </View>
        </View>

        {/* Retake & Replace Options */}
        <View style={styles.retakeRow}>
          <TouchableOpacity style={styles.secondaryOption} onPress={handleRetake} activeOpacity={0.7}>
            <Ionicons name="camera-reverse" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.secondaryOptionText}>Retake Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryOption}
            onPress={handleSelectFromGallery}
            activeOpacity={0.7}
          >
            <Ionicons name="images-outline" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.secondaryOptionText}>Choose Other</Text>
          </TouchableOpacity>
        </View>

        {/* Optional Plant Tagging for Health Monitoring (Feature 7) */}
        <View style={styles.tagCard}>
          <View style={styles.tagHeader}>
            <Ionicons name="bookmark-outline" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.tagTitle}>Assign Plant Label (Optional)</Text>
          </View>
          <Text style={styles.tagHelp}>
            Give this specimen a nickname to track changes over time (e.g., "Tomato Plant 1", "Balcony Rose").
          </Text>
          <TextInput
            style={styles.tagInput}
            placeholder="e.g. Tomato Plant 1, Garden Bed A"
            placeholderTextColor={COLORS.textMuted}
            value={plantLabel}
            onChangeText={setPlantLabel}
          />
        </View>

        {/* Pre-flight Quality Verification Checklist */}
        <View style={styles.checklistCard}>
          <Text style={styles.checklistTitle}>Leaf Image Checklist</Text>
          <View style={styles.checkItem}>
            <Ionicons name="checkmark" size={16} color={COLORS.healthy} style={{ marginRight: 8 }} />
            <Text style={styles.checkItemText}>Affected spots or symptoms clearly in focus</Text>
          </View>
          <View style={styles.checkItem}>
            <Ionicons name="checkmark" size={16} color={COLORS.healthy} style={{ marginRight: 8 }} />
            <Text style={styles.checkItemText}>Good natural lighting without heavy shadows</Text>
          </View>
          <View style={styles.checkItem}>
            <Ionicons name="checkmark" size={16} color={COLORS.healthy} style={{ marginRight: 8 }} />
            <Text style={styles.checkItemText}>Leaf fills at least 70% of the photograph</Text>
          </View>
        </View>

        {/* Primary Action Button */}
        <TouchableOpacity
          style={styles.analyzeButton}
          onPress={handleStartAnalysis}
          activeOpacity={0.85}
          disabled={isAnalyzing}
        >
          <Ionicons name="analytics" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.analyzeButtonText}>Diagnose with AI</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Analysis Loading Screen Modal (Feature 2 & 3) */}
      <Modal visible={isAnalyzing} transparent animationType="fade">
        <View style={styles.loadingModalOverlay}>
          <View style={styles.loadingModalBox}>
            <View style={styles.pulseIconCircle}>
              <Ionicons name="leaf" size={44} color={COLORS.primary} />
            </View>
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 16 }} />
            <Text style={styles.loadingTitle}>Analyzing Leaf Symptoms</Text>
            <Text style={styles.loadingSubtitle}>{analysisStep}</Text>
            <View style={styles.loadingFooter}>
              <Text style={styles.loadingDisclaimer}>
                Processing through MobileNetV2 neural vision model & disease pathology database
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  imageCard: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: '#000000',
    position: 'relative',
    ...SHADOWS.md,
  },
  previewImage: {
    width: '100%',
    height: 320,
  },
  previewBadge: {
    position: 'absolute',
    bottom: SPACING.sm,
    left: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 86, 49, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  previewBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  retakeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  secondaryOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
  },
  secondaryOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  tagCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  tagHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  tagTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  tagHelp: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    lineHeight: 16,
  },
  tagInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  checklistCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  checklistTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  checkItemText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: RADIUS.md,
    ...SHADOWS.md,
  },
  analyzeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  retakeBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
  },
  retakeBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  loadingModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  loadingModalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    ...SHADOWS.lg,
  },
  pulseIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.accentSuperLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 8,
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
    minHeight: 20,
  },
  loadingFooter: {
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  loadingDisclaimer: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 14,
  },
});

