import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, RADIUS, SPACING, SHADOWS } from '../../src/constants/theme';
import { getDiseaseById } from '../../src/services/api';
import { DiseaseDetail } from '../../src/types';

export default function DiseaseDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [disease, setDisease] = useState<DiseaseDetail | null>(null);

  useEffect(() => {
    async function load() {
      if (id) {
        const item = await getDiseaseById(id);
        setDisease(item);
      }
    }
    load();
  }, [id]);

  if (!disease) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={COLORS.textMuted} />
        <Text style={styles.notFoundTitle}>Disease Profile Not Found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Return to Library</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isHealthy = disease.category === 'Healthy';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Title Card */}
      <View style={styles.titleCard}>
        <View style={styles.badgeRow}>
          <View style={styles.plantBadge}>
            <Text style={styles.plantBadgeText}>{disease.plant}</Text>
          </View>
          {disease.isSupportedByModel ? (
            <View style={styles.aiBadge}>
              <Ionicons name="sparkles" size={12} color={COLORS.primary} style={{ marginRight: 3 }} />
              <Text style={styles.aiBadgeText}>Vision Model Supported</Text>
            </View>
          ) : (
            <View style={styles.eduBadge}>
              <Text style={styles.eduBadgeText}>Educational Profile</Text>
            </View>
          )}
        </View>

        <Text style={styles.diseaseName}>{disease.name}</Text>
        {disease.scientificName && (
          <Text style={styles.scientificName}>{disease.scientificName}</Text>
        )}

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Category</Text>
            <Text style={styles.metaValue}>{disease.category}</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Severity</Text>
            <Text
              style={[
                styles.metaValue,
                {
                  color: isHealthy
                    ? COLORS.healthy
                    : disease.severity === 'Critical'
                    ? COLORS.danger
                    : COLORS.warning,
                },
              ]}
            >
              {disease.severity}
            </Text>
          </View>
        </View>
      </View>

      {/* Description */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="book-outline" size={20} color={COLORS.primary} style={{ marginRight: 6 }} />
          <Text style={styles.sectionTitle}>Overview</Text>
        </View>
        <Text style={styles.bodyText}>{disease.description}</Text>
      </View>

      {/* Symptoms */}
      {disease.symptoms && disease.symptoms.length > 0 && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="eye-outline" size={20} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>Visible Leaf Symptoms</Text>
          </View>
          {disease.symptoms.map((s, i) => (
            <View key={i} style={styles.bulletRow}>
              <Ionicons name="ellipse" size={8} color={COLORS.danger} style={{ marginRight: 8, marginTop: 6 }} />
              <Text style={styles.bulletText}>{s}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Causes & Conditions */}
      {disease.causes && disease.causes.length > 0 && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="git-branch-outline" size={20} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>Pathology & Causes</Text>
          </View>
          {disease.causes.map((c, i) => (
            <View key={i} style={styles.bulletRow}>
              <Ionicons name="ellipse" size={8} color={COLORS.warning} style={{ marginRight: 8, marginTop: 6 }} />
              <Text style={styles.bulletText}>{c}</Text>
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

      {/* Prevention */}
      {disease.prevention && disease.prevention.length > 0 && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-outline" size={20} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>Prevention Strategies</Text>
          </View>
          {disease.prevention.map((p, i) => (
            <View key={i} style={styles.bulletRow}>
              <Ionicons name="shield-checkmark" size={16} color={COLORS.secondary} style={{ marginRight: 8, marginTop: 2 }} />
              <Text style={styles.bulletText}>{p}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Management */}
      {disease.management && disease.management.length > 0 && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="medical-outline" size={20} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>Recommended Management</Text>
          </View>
          {disease.management.map((m, i) => (
            <View key={i} style={styles.bulletRow}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.healthy} style={{ marginRight: 8, marginTop: 2 }} />
              <Text style={styles.bulletText}>{m}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Citations & Sources */}
      {disease.sources && disease.sources.length > 0 && (
        <View style={styles.sourcesCard}>
          <Text style={styles.sourcesTitle}>Verified Pathology Sources:</Text>
          {disease.sources.map((s, i) => (
            <Text key={i} style={styles.sourceItem}>
              • {s}
            </Text>
          ))}
        </View>
      )}

      {/* CTA Button */}
      <TouchableOpacity
        style={styles.scanBtn}
        onPress={() => router.replace('/(tabs)/scan')}
        activeOpacity={0.85}
      >
        <Ionicons name="camera" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
        <Text style={styles.scanBtnText}>Scan a Plant for this Disease</Text>
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
  notFoundTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
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
  titleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    gap: 6,
  },
  plantBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
  },
  plantBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentSuperLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
  },
  aiBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  eduBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
  },
  eduBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  diseaseName: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  scientificName: {
    fontSize: 14,
    fontStyle: 'italic',
    color: COLORS.textMuted,
    marginTop: 2,
    marginBottom: SPACING.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.xs,
  },
  metaItem: {
    flex: 1,
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  metaDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
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
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
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
  sourcesCard: {
    backgroundColor: '#F8FBF8',
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: SPACING.md,
  },
  sourcesTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  sourceItem: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADIUS.sm,
    ...SHADOWS.sm,
  },
  scanBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

