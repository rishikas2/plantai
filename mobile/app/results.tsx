import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, RADIUS, SPACING, SHADOWS } from '../src/constants/theme';
import { ConfidenceBadge } from '../src/components/ConfidenceBadge';
import { UncertaintyBanner } from '../src/components/UncertaintyBanner';
import { InferenceResponse } from '../src/types';
import { getActiveResultSession } from '../src/services/api';

export default function ResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    resultJson?: string;
    imageUri?: string;
    plantLabel?: string;
  }>();

  const [savedSuccess, setSavedSuccess] = useState<boolean>(true); // Already saved in preview step

  // Priority 1: Read from active in-memory session (prevents browser URL quota limits)
  const activeSession = getActiveResultSession();
  let result: InferenceResponse | null = activeSession?.response || null;
  let imageUri: string | undefined = activeSession?.imageUri;
  let plantLabel: string | undefined = activeSession?.plantLabel;

  // Priority 2: Fallback to route parameters if reloaded directly
  if (!result && params.resultJson) {
    try {
      result = JSON.parse(params.resultJson);
      imageUri = params.imageUri;
      plantLabel = params.plantLabel;
    } catch (e) {
      console.error('Failed to parse result json:', e);
    }
  }

  if (!result) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={COLORS.danger} />
        <Text style={styles.errorTitle}>Result data not found</Text>
        <TouchableOpacity style={styles.actionBtnPrimary} onPress={() => router.replace('/(tabs)/')}>
          <Text style={styles.actionBtnPrimaryText}>Return to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const disease = result.disease_details;
  const isHealthy = result.is_healthy;
  const displayImageUri = imageUri || params.imageUri;
  const displayPlantLabel = plantLabel || params.plantLabel;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `PlantCare AI Diagnosis for ${result?.plant}:\nCondition: ${result?.disease}\nConfidence: ${result?.confidence_percent}%\n${result?.disclaimer}`,
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* SECTION A: Detection Summary */}
      <View style={styles.summaryCard}>
        {displayImageUri && (
          <Image source={{ uri: displayImageUri }} style={styles.leafImage} resizeMode="cover" />
        )}

        <View style={styles.summaryContent}>
          {displayPlantLabel ? (
            <View style={styles.specimenTagPill}>
              <Ionicons name="bookmark" size={12} color={COLORS.primary} style={{ marginRight: 4 }} />
              <Text style={styles.specimenTagText}>Specimen: {displayPlantLabel}</Text>
            </View>
          ) : null}

          <View style={styles.headerTitleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.plantName}>{result.plant}</Text>
              <Text style={styles.diseaseName}>{result.disease}</Text>
              {disease?.scientificName && (
                <Text style={styles.scientificName}>({disease.scientificName})</Text>
              )}
            </View>

            <View
              style={[
                styles.healthStatusPill,
                {
                  backgroundColor: isHealthy
                    ? COLORS.healthyBackground
                    : COLORS.dangerBackground,
                },
              ]}
            >
              <Ionicons
                name={isHealthy ? 'shield-checkmark' : 'alert-circle'}
                size={16}
                color={isHealthy ? COLORS.healthy : COLORS.danger}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.healthStatusText,
                  { color: isHealthy ? COLORS.healthy : COLORS.danger },
                ]}
              >
                {isHealthy ? 'Healthy Plant' : 'Potentially Diseased'}
              </Text>
            </View>
          </View>

          {/* Confidence Indicator */}
          <View style={styles.confidenceSection}>
            <Text style={styles.confidenceLabel}>Model Confidence Score:</Text>
            <ConfidenceBadge
              confidence={result.confidence}
              confidencePercent={result.confidence_percent}
              level={result.confidence_level}
              showBar={true}
            />
            <Text style={styles.confidenceNote}>
              Scores reflect statistical vision model probability, not an absolute laboratory diagnosis.
            </Text>
          </View>

          {/* Uncertainty banner if threshold not met */}
          {!result.is_confident && (
            <UncertaintyBanner
              message={result.uncertainty_message}
              onRetake={() => router.replace('/(tabs)/scan')}
              onConsultExpert={() => router.push('/tips')}
            />
          )}

          {/* Alternative Candidates */}
          {result.top_predictions && result.top_predictions.length > 1 && (
            <View style={styles.alternativesBox}>
              <Text style={styles.alternativesTitle}>Ranked Possible Conditions:</Text>
              {result.top_predictions.slice(0, 3).map((pred, i) => (
                <View key={i} style={styles.altRow}>
                  <Text style={styles.altRank}>#{i + 1}</Text>
                  <Text style={styles.altName} numberOfLines={1}>
                    {pred.plant} • {pred.disease}
                  </Text>
                  <Text style={styles.altScore}>{pred.confidence_percent}%</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* SECTION B: Disease Overview */}
      {disease?.description && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text-outline" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>Disease Overview</Text>
          </View>
          <Text style={styles.bodyText}>{disease.description}</Text>
          {disease.category && (
            <View style={styles.categoryPill}>
              <Text style={styles.categoryText}>Category: {disease.category}</Text>
            </View>
          )}
        </View>
      )}

      {/* SECTION C: Common Symptoms */}
      {disease?.symptoms && disease.symptoms.length > 0 && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="eye-outline" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>Visible Leaf Symptoms</Text>
          </View>
          {disease.symptoms.map((symptom, idx) => (
            <View key={idx} style={styles.bulletRow}>
              <Ionicons name="ellipse" size={8} color={COLORS.danger} style={styles.bulletDot} />
              <Text style={styles.bulletText}>{symptom}</Text>
            </View>
          ))}
        </View>
      )}

      {/* SECTION D: Possible Causes & Favorable Conditions */}
      {disease?.causes && disease.causes.length > 0 && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="git-branch-outline" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>Possible Causes & Transmission</Text>
          </View>
          {disease.causes.map((cause, idx) => (
            <View key={idx} style={styles.bulletRow}>
              <Ionicons name="ellipse" size={8} color={COLORS.warning} style={styles.bulletDot} />
              <Text style={styles.bulletText}>{cause}</Text>
            </View>
          ))}
          {disease.favorableConditions && (
            <View style={styles.conditionsBox}>
              <Text style={styles.conditionsTitle}>Favorable Environmental Conditions:</Text>
              <Text style={styles.conditionsText}>{disease.favorableConditions}</Text>
            </View>
          )}
        </View>
      )}

      {/* SECTION E: Recommended Management (Safe & Practical Guidance) */}
      {disease?.management && disease.management.length > 0 && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="medical-outline" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>Recommended Management</Text>
          </View>
          {disease.management.map((item, idx) => (
            <View key={idx} style={styles.bulletRow}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.healthy} style={styles.checkIcon} />
              <Text style={styles.bulletText}>{item}</Text>
            </View>
          ))}
        </View>
      )}

      {/* SECTION F: Prevention Strategies */}
      {disease?.prevention && disease.prevention.length > 0 && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-outline" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>Prevention Strategies</Text>
          </View>
          {disease.prevention.map((item, idx) => (
            <View key={idx} style={styles.bulletRow}>
              <Ionicons name="shield-checkmark" size={16} color={COLORS.secondary} style={styles.checkIcon} />
              <Text style={styles.bulletText}>{item}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Educational Disclaimer */}
      <View style={styles.disclaimerCard}>
        <Ionicons name="information-circle-outline" size={20} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
        <Text style={styles.disclaimerText}>
          {result.disclaimer ||
            'PlantCare AI is an educational preliminary tool. For commercial farming decisions or persistent severe infections, consult local agricultural extension services.'}
        </Text>
      </View>

      {/* SECTION G: Next Actions */}
      <View style={styles.actionsCard}>
        <Text style={styles.actionsTitle}>Next Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.actionBtnPrimary}
            onPress={() => router.replace('/(tabs)/scan')}
            activeOpacity={0.85}
          >
            <Ionicons name="camera" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.actionBtnPrimaryText}>Scan Another Plant</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtnSecondary}
            onPress={() => router.push('/(tabs)/monitor')}
            activeOpacity={0.8}
          >
            <Ionicons name="trending-up" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.actionBtnSecondaryText}>Compare With History</Text>
          </TouchableOpacity>

          {disease && (
            <TouchableOpacity
              style={styles.actionBtnSecondary}
              onPress={() => router.push(`/disease/${disease.id}`)}
              activeOpacity={0.8}
            >
              <Ionicons name="book-outline" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
              <Text style={styles.actionBtnSecondaryText}>View Disease Details</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.actionBtnSecondary} onPress={handleShare} activeOpacity={0.8}>
            <Ionicons name="share-social-outline" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.actionBtnSecondaryText}>Share Diagnosis</Text>
          </TouchableOpacity>
        </View>
      </View>

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
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  leafImage: {
    width: '100%',
    height: 240,
    backgroundColor: '#000000',
  },
  summaryContent: {
    padding: SPACING.md,
  },
  specimenTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: COLORS.accentSuperLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.xs,
  },
  specimenTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  plantName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  diseaseName: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  scientificName: {
    fontSize: 13,
    fontStyle: 'italic',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  healthStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    marginLeft: 8,
  },
  healthStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  confidenceSection: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  confidenceLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  confidenceNote: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 6,
    lineHeight: 15,
  },
  alternativesBox: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    marginTop: SPACING.md,
  },
  alternativesTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  altRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  altRank: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    width: 24,
  },
  altName: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textPrimary,
  },
  altScore: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.textSecondary,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    marginTop: SPACING.sm,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs + 2,
  },
  bulletDot: {
    marginRight: 10,
    marginTop: 6,
  },
  checkIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },
  conditionsBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    marginTop: SPACING.sm,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.warning,
  },
  conditionsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 2,
  },
  conditionsText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#78350F',
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FBF8',
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: SPACING.md,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textSecondary,
  },
  actionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  actionsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  actionGrid: {
    gap: SPACING.sm,
  },
  actionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 13,
    borderRadius: RADIUS.sm,
  },
  actionBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  actionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingVertical: 12,
    borderRadius: RADIUS.sm,
  },
  actionBtnSecondaryText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },
});

