import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { COLORS, RADIUS, SPACING, SHADOWS } from '../../src/constants/theme';
import { getScanHistory } from '../../src/services/storage';
import { getPlantCareTips } from '../../src/services/api';
import { ScanHistoryItem, PlantTip } from '../../src/types';

export default function HomeDashboard() {
  const router = useRouter();
  const [recentScans, setRecentScans] = useState<ScanHistoryItem[]>([]);
  const [totalScans, setTotalScans] = useState<number>(0);
  const [tips, setTips] = useState<PlantTip[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    try {
      const history = await getScanHistory();
      setTotalScans(history.length);
      setRecentScans(history.slice(0, 3));

      const loadedTips = await getPlantCareTips();
      setTips(loadedTips.slice(0, 3));
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Launch camera capture
  const handleLaunchCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        alert('Camera permission is required to photograph plant leaves.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        router.push({
          pathname: '/preview',
          params: { imageUri },
        });
      }
    } catch (err: any) {
      console.error('Camera launch error:', err);
      alert('Could not open camera: ' + (err.message || 'Unknown error'));
    }
  };

  // Launch gallery picker
  const handleLaunchGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        alert('Photo library permission is required to upload existing plant photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        router.push({
          pathname: '/preview',
          params: { imageUri },
        });
      }
    } catch (err: any) {
      console.error('Gallery launch error:', err);
      alert('Could not open gallery: ' + (err.message || 'Unknown error'));
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
    >
      {/* Top Agricultural Brand Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <View>
            <View style={styles.brandRow}>
              <Ionicons name="leaf" size={26} color="#74C69D" style={{ marginRight: 6 }} />
              <Text style={styles.brandTitle}>PlantCare AI</Text>
            </View>
            <Text style={styles.greetingText}>Diagnostic Assistance & Crop Health</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsIconBtn}
            onPress={() => router.push('/settings')}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Scan Counter Quick Stat */}
        <View style={styles.statsStrip}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalScans}</Text>
            <Text style={styles.statLabel}>Total Scans</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>20</Text>
            <Text style={styles.statLabel}>Supported Classes</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>MobileNetV2</Text>
            <Text style={styles.statLabel}>AI Model</Text>
          </View>
        </View>
      </View>

      {/* Primary Call-to-Action Card */}
      <View style={styles.ctaCard}>
        <View style={styles.ctaBadge}>
          <Text style={styles.ctaBadgeText}>AI Disease Detection</Text>
        </View>
        <Text style={styles.ctaQuestion}>Noticed something unusual on your plant?</Text>
        <Text style={styles.ctaSubtext}>
          Photograph an affected leaf clearly. Our deep learning model diagnoses supported conditions and suggests care steps.
        </Text>

        <View style={styles.ctaButtonRow}>
          <TouchableOpacity
            style={styles.analyzeBtn}
            onPress={handleLaunchCamera}
            activeOpacity={0.85}
          >
            <Ionicons name="camera" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.analyzeBtnText}>Analyze Leaf</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.galleryBtn}
            onPress={handleLaunchGallery}
            activeOpacity={0.8}
          >
            <Ionicons name="images-outline" size={20} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.galleryBtnText}>Gallery</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Navigation Cards */}
      <View style={styles.quickNavRow}>
        <TouchableOpacity
          style={styles.quickNavCard}
          onPress={() => router.push('/(tabs)/library')}
          activeOpacity={0.8}
        >
          <View style={[styles.navIconCircle, { backgroundColor: '#E8F5E9' }]}>
            <Ionicons name="book" size={22} color={COLORS.primary} />
          </View>
          <Text style={styles.navCardTitle}>Disease Library</Text>
          <Text style={styles.navCardSub}>24 curated conditions</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickNavCard}
          onPress={() => router.push('/(tabs)/monitor')}
          activeOpacity={0.8}
        >
          <View style={[styles.navIconCircle, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="trending-up" size={22} color="#2563EB" />
          </View>
          <Text style={styles.navCardTitle}>Monitor Plants</Text>
          <Text style={styles.navCardSub}>Track recovery over time</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Scans Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Diagnoses</Text>
        {recentScans.length > 0 && (
          <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
            <Text style={styles.seeAllText}>View All ({totalScans})</Text>
          </TouchableOpacity>
        )}
      </View>

      {recentScans.length === 0 ? (
        <View style={styles.emptyRecentCard}>
          <Ionicons name="leaf-outline" size={36} color={COLORS.accent} />
          <Text style={styles.emptyRecentTitle}>No scans performed yet</Text>
          <Text style={styles.emptyRecentText}>
            Take your first leaf photo to identify diseases and save results locally.
          </Text>
        </View>
      ) : (
        recentScans.map((scan) => (
          <TouchableOpacity
            key={scan.id}
            style={styles.scanCard}
            onPress={() => router.push(`/history/${scan.id}`)}
            activeOpacity={0.8}
          >
            {scan.imageUri ? (
              <Image source={{ uri: scan.imageUri }} style={styles.scanThumb} />
            ) : (
              <View style={[styles.scanThumb, styles.thumbPlaceholder]}>
                <Ionicons name="leaf" size={24} color={COLORS.primary} />
              </View>
            )}
            <View style={styles.scanCardDetails}>
              <View style={styles.scanPlantRow}>
                <Text style={styles.scanPlant}>{scan.plant}</Text>
                <View
                  style={[
                    styles.scanStatusPill,
                    {
                      backgroundColor: scan.is_healthy
                        ? COLORS.healthyBackground
                        : COLORS.dangerBackground,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.scanStatusText,
                      {
                        color: scan.is_healthy ? COLORS.healthy : COLORS.danger,
                      },
                    ]}
                  >
                    {scan.is_healthy ? 'Healthy' : 'Diseased'}
                  </Text>
                </View>
              </View>
              <Text style={styles.scanDisease} numberOfLines={1}>
                {scan.disease}
              </Text>
              <View style={styles.scanMetaRow}>
                <Text style={styles.scanDate}>{scan.dateFormatted}</Text>
                <Text style={styles.scanConfidence}>
                  {scan.confidence_percent}% confidence
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        ))
      )}

      {/* Curated Agricultural Health Tips Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Plant Care & Prevention</Text>
        <TouchableOpacity onPress={() => router.push('/tips')}>
          <Text style={styles.seeAllText}>All Guides</Text>
        </TouchableOpacity>
      </View>

      {tips.map((tip) => (
        <TouchableOpacity
          key={tip.id}
          style={styles.tipCard}
          onPress={() => router.push('/tips')}
          activeOpacity={0.8}
        >
          <View style={styles.tipIconWrap}>
            <Ionicons name="bulb-outline" size={22} color={COLORS.primary} />
          </View>
          <View style={styles.tipBody}>
            <Text style={styles.tipCategory}>{tip.category}</Text>
            <Text style={styles.tipTitle} numberOfLines={1}>
              {tip.title}
            </Text>
            <Text style={styles.tipSummary} numberOfLines={2}>
              {tip.summary}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
        </TouchableOpacity>
      ))}

      <View style={{ height: SPACING.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingBottom: SPACING.xxl,
  },
  headerBanner: {
    backgroundColor: COLORS.primary,
    paddingTop: 54,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
    borderBottomLeftRadius: RADIUS.lg,
    borderBottomRightRadius: RADIUS.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  greetingText: {
    fontSize: 13,
    color: COLORS.accentLight,
    marginTop: 2,
  },
  settingsIconBtn: {
    padding: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  statsStrip: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.accentLight,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  ctaCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: SPACING.md,
    marginTop: -SPACING.md,
    borderRadius: RADIUS.md,
    padding: SPACING.md + 2,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.md,
  },
  ctaBadge: {
    backgroundColor: COLORS.accentSuperLight,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.xs,
  },
  ctaBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  ctaQuestion: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 4,
    marginBottom: 6,
  },
  ctaSubtext: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  ctaButtonRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  analyzeBtn: {
    flex: 1.6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: RADIUS.sm,
  },
  analyzeBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  galleryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: COLORS.primary,
    borderWidth: 1.5,
    paddingVertical: 12,
    borderRadius: RADIUS.sm,
  },
  galleryBtnText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  quickNavRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.md,
  },
  quickNavCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.sm,
  },
  navIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  navCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  navCardSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xs + 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  emptyRecentCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: SPACING.md,
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  emptyRecentTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: SPACING.xs,
  },
  emptyRecentText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 240,
  },
  scanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.sm,
  },
  scanThumb: {
    width: 54,
    height: 54,
    borderRadius: 8,
    marginRight: SPACING.sm,
  },
  thumbPlaceholder: {
    backgroundColor: COLORS.accentSuperLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanCardDetails: {
    flex: 1,
  },
  scanPlantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scanPlant: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  scanStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  scanStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  scanDisease: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  scanMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  scanDate: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  scanConfidence: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.sm,
  },
  tipIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accentSuperLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  tipBody: {
    flex: 1,
    marginRight: SPACING.xs,
  },
  tipCategory: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 1,
  },
  tipSummary: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
});

