import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, RADIUS, SPACING, SHADOWS } from '../src/constants/theme';
import { getMonitoredPlants } from '../src/services/storage';
import { MonitoredPlant, ScanHistoryItem } from '../src/types';

export default function ComparisonScreen() {
  const router = useRouter();
  const { plantId } = useLocalSearchParams<{ plantId: string }>();
  const [plant, setPlant] = useState<MonitoredPlant | null>(null);

  useEffect(() => {
    async function load() {
      const list = await getMonitoredPlants();
      const found = list.find((p) => p.id === plantId);
      setPlant(found || null);
    }
    load();
  }, [plantId]);

  if (!plant || plant.scans.length < 2) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="git-compare-outline" size={64} color={COLORS.textMuted} />
        <Text style={styles.emptyTitle}>At least 2 scans required for comparison</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Return to Monitor</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const latestScan: ScanHistoryItem = plant.scans[0];
  const previousScan: ScanHistoryItem = plant.scans[1];

  const conditionChanged = latestScan.disease !== previousScan.disease;
  const confidenceDiff = Math.round(
    latestScan.confidence_percent - previousScan.confidence_percent
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Plant Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.tagBadge}>
          <Ionicons name="bookmark" size={14} color={COLORS.primary} style={{ marginRight: 4 }} />
          <Text style={styles.tagBadgeText}>{plant.label}</Text>
        </View>
        <Text style={styles.headerTitle}>Specimen Health Trajectory</Text>
        <Text style={styles.headerSub}>
          Side-by-side visual and diagnostic evaluation across observation dates.
        </Text>
      </View>

      {/* Side-by-Side Images */}
      <View style={styles.sideBySideContainer}>
        {/* Previous Scan Column */}
        <View style={styles.scanColumn}>
          <View style={styles.columnHeader}>
            <Text style={styles.colLabel}>PREVIOUS OBSERVATION</Text>
            <Text style={styles.colDate}>{previousScan.dateFormatted}</Text>
          </View>
          <View style={styles.imageBox}>
            {previousScan.imageUri ? (
              <Image source={{ uri: previousScan.imageUri }} style={styles.columnImage} resizeMode="cover" />
            ) : (
              <View style={[styles.columnImage, styles.placeholder]}>
                <Ionicons name="leaf" size={32} color={COLORS.primary} />
              </View>
            )}
          </View>
          <View style={styles.diagnosisPill}>
            <Text style={styles.diagTitle}>{previousScan.disease}</Text>
            <Text style={styles.diagScore}>{previousScan.confidence_percent}% confidence</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.vsDivider}>
          <View style={styles.vsCircle}>
            <Ionicons name="swap-horizontal" size={18} color="#FFFFFF" />
          </View>
        </View>

        {/* Latest Scan Column */}
        <View style={styles.scanColumn}>
          <View style={styles.columnHeader}>
            <Text style={styles.colLabel}>LATEST OBSERVATION</Text>
            <Text style={styles.colDate}>{latestScan.dateFormatted}</Text>
          </View>
          <View style={styles.imageBox}>
            {latestScan.imageUri ? (
              <Image source={{ uri: latestScan.imageUri }} style={styles.columnImage} resizeMode="cover" />
            ) : (
              <View style={[styles.columnImage, styles.placeholder]}>
                <Ionicons name="leaf" size={32} color={COLORS.primary} />
              </View>
            )}
          </View>
          <View style={styles.diagnosisPill}>
            <Text style={styles.diagTitle}>{latestScan.disease}</Text>
            <Text style={styles.diagScore}>{latestScan.confidence_percent}% confidence</Text>
          </View>
        </View>
      </View>

      {/* Analytical Comparison Breakdown */}
      <View style={styles.analysisCard}>
        <Text style={styles.cardHeading}>Comparative Observations</Text>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Condition Stability:</Text>
          <Text style={[styles.metricValue, { color: conditionChanged ? COLORS.warning : COLORS.healthy }]}>
            {conditionChanged ? 'Classification Changed' : 'Consistent Classification'}
          </Text>
        </View>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Confidence Shift:</Text>
          <Text style={styles.metricValue}>
            {confidenceDiff >= 0 ? `+${confidenceDiff}%` : `${confidenceDiff}%`}
          </Text>
        </View>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Health Classification:</Text>
          <Text style={styles.metricValue}>
            {previousScan.is_healthy ? 'Healthy' : 'Diseased'} ➔{' '}
            {latestScan.is_healthy ? 'Healthy' : 'Diseased'}
          </Text>
        </View>

        {/* Scientific Neutrality Explanation (Feature 7 Requirement) */}
        <View style={styles.neutralityNoteBox}>
          <Ionicons name="information-circle" size={20} color="#2563EB" style={{ marginRight: 8 }} />
          <Text style={styles.neutralityNoteText}>
            Differences in visual prediction may reflect genuine plant pathology progression, leaf age, natural healing, or variations in lighting angles and framing. PlantCare AI does not declare absolute recovery or decline without laboratory verification.
          </Text>
        </View>
      </View>

      {/* Action Footer */}
      <TouchableOpacity
        style={styles.scanNewBtn}
        onPress={() => router.replace('/(tabs)/scan')}
        activeOpacity={0.85}
      >
        <Ionicons name="camera" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
        <Text style={styles.scanNewBtnText}>Log Another Scan for this Plant</Text>
      </TouchableOpacity>
    </ScrollView>
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
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  backBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: COLORS.accentSuperLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    marginBottom: 4,
  },
  tagBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  headerSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  sideBySideContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  scanColumn: {
    flex: 1,
    padding: SPACING.xs,
  },
  columnHeader: {
    marginBottom: 6,
  },
  colLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  colDate: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 1,
  },
  imageBox: {
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    backgroundColor: '#000000',
    marginBottom: 8,
  },
  columnImage: {
    width: '100%',
    height: 160,
  },
  placeholder: {
    backgroundColor: COLORS.accentSuperLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diagnosisPill: {
    backgroundColor: COLORS.background,
    padding: 6,
    borderRadius: 6,
  },
  diagTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  diagScore: {
    fontSize: 11,
    color: COLORS.primary,
    marginTop: 2,
    fontWeight: '600',
  },
  vsDivider: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  analysisCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  cardHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  metricLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  neutralityNoteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: RADIUS.sm,
    padding: SPACING.sm + 2,
    marginTop: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  neutralityNoteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: '#1E40AF',
  },
  scanNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADIUS.sm,
    ...SHADOWS.sm,
  },
  scanNewBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

