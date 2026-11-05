import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { COLORS, RADIUS, SPACING, SHADOWS } from '../../src/constants/theme';
import { Header } from '../../src/components/Header';

export default function ScanScreen() {
  const router = useRouter();

  const handleCameraCapture = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        alert('Camera permission is required to capture plant leaf photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        router.push({
          pathname: '/preview',
          params: { imageUri },
        });
      }
    } catch (err: any) {
      alert('Error launching camera: ' + (err.message || 'Unknown error'));
    }
  };

  const handleGalleryUpload = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        alert('Photo library permission is required to select photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        router.push({
          pathname: '/preview',
          params: { imageUri },
        });
      }
    } catch (err: any) {
      alert('Error picking photo: ' + (err.message || 'Unknown error'));
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Scan Leaf" subtitle="Deep learning plant disease diagnosis" />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Visual Target Frame Illustration */}
        <View style={styles.targetCard}>
          <View style={styles.viewfinder}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            <Ionicons name="leaf" size={64} color={COLORS.secondary} />
            <Text style={styles.targetHint}>Align single affected leaf inside</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.captureBtn}
            onPress={handleCameraCapture}
            activeOpacity={0.85}
          >
            <View style={styles.btnIconCircle}>
              <Ionicons name="camera" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.btnTextWrap}>
              <Text style={styles.captureBtnTitle}>Take Photo</Text>
              <Text style={styles.captureBtnSub}>Use camera in bright natural light</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.galleryBtn}
            onPress={handleGalleryUpload}
            activeOpacity={0.8}
          >
            <View style={[styles.btnIconCircle, { backgroundColor: COLORS.accentSuperLight }]}>
              <Ionicons name="images" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.btnTextWrap}>
              <Text style={styles.galleryBtnTitle}>Upload from Gallery</Text>
              <Text style={styles.galleryBtnSub}>Select an existing high-res leaf photo</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Photography Guidelines (Feature 2) */}
        <View style={styles.guidelinesCard}>
          <View style={styles.guideHeader}>
            <Ionicons name="information-circle" size={20} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.guideTitle}>Best Photography Practices</Text>
          </View>

          <View style={styles.guideItem}>
            <Ionicons name="checkmark-circle" size={16} color={COLORS.healthy} style={styles.guideCheck} />
            <Text style={styles.guideText}>
              <Text style={styles.guideHighlight}>Center the leaf:</Text> Keep the affected leaf clearly visible and fill most of the frame.
            </Text>
          </View>

          <View style={styles.guideItem}>
            <Ionicons name="checkmark-circle" size={16} color={COLORS.healthy} style={styles.guideCheck} />
            <Text style={styles.guideText}>
              <Text style={styles.guideHighlight}>Avoid shadows & glare:</Text> Diffuse natural morning daylight yields the most accurate color grading.
            </Text>
          </View>

          <View style={styles.guideItem}>
            <Ionicons name="checkmark-circle" size={16} color={COLORS.healthy} style={styles.guideCheck} />
            <Text style={styles.guideText}>
              <Text style={styles.guideHighlight}>Sharp focus:</Text> Tap your camera screen to lock focus on spots, halos, or lesions.
            </Text>
          </View>

          <View style={styles.guideItem}>
            <Ionicons name="checkmark-circle" size={16} color={COLORS.healthy} style={styles.guideCheck} />
            <Text style={styles.guideText}>
              <Text style={styles.guideHighlight}>Single subject:</Text> Avoid crowded backgrounds with soil, fingers, or irrelevant plants.
            </Text>
          </View>
        </View>
      </ScrollView>
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
  targetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.sm,
    marginBottom: SPACING.md,
  },
  viewfinder: {
    width: 220,
    height: 220,
    borderRadius: RADIUS.sm,
    backgroundColor: '#F8FBF8',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: COLORS.primary,
  },
  cornerTL: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 6,
  },
  cornerTR: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 6,
  },
  cornerBL: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 6,
  },
  cornerBR: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 6,
  },
  targetHint: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  actionSection: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  captureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    ...SHADOWS.md,
  },
  galleryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.sm,
  },
  btnIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  btnTextWrap: {
    flex: 1,
  },
  captureBtnTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  captureBtnSub: {
    fontSize: 12,
    color: COLORS.accentLight,
    marginTop: 2,
  },
  galleryBtnTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  galleryBtnSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  guidelinesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.sm,
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  guideTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  guideItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  guideCheck: {
    marginRight: 8,
    marginTop: 2,
  },
  guideText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  guideHighlight: {
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
});

