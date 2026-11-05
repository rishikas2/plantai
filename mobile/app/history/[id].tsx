import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, RADIUS, SPACING, SHADOWS } from '../../src/constants/theme';
import { ConfidenceBadge } from '../../src/components/ConfidenceBadge';
import { getScanHistory, deleteScanItem } from '../../src/services/storage';
import { ScanHistoryItem } from '../../src/types';

export default function HistoryDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<ScanHistoryItem | null>(null);

  useEffect(() => {
    async function loadItem() {
      const list = await getScanHistory();
      const found = list.find((s) => s.id === id);
      setItem(found || null);
    }
    loadItem();
  }, [id]);

  if (!item) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="document-text-outline" size={64} color={COLORS.textMuted} />
        <Text style={styles.notFoundTitle}>Scan Record Not Found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Back to History</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const disease = item.disease_details;

  const handleDelete = () => {
    Alert.alert('Delete Scan', 'Delete this scan from your device history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteScanItem(item.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.imageCard}>
        {item.imageUri ? (
          <Image source={{ uri: item.imageUri }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Ionicons name="leaf" size={48} color={COLORS.primary} />
          </View>
        )}
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.rowTop}>
          <Text style={styles.plantName}>{item.plant}</Text>
          <Text style={styles.dateText}>{item.dateFormatted}</Text>
        </View>

        <Text style={styles.diseaseName}>{item.disease}</Text>

        {item.plantLabel ? (
          <View style={styles.specimenTag}>
            <Ionicons name="bookmark" size={12} color={COLORS.primary} style={{ marginRight: 4 }} />
            <Text style={styles.specimenTagText}>Specimen: {item.plantLabel}</Text>
          </View>
        ) : null}

        <View style={styles.badgeSection}>
          <ConfidenceBadge
            confidence={item.confidence}
            confidencePercent={item.confidence_percent}
            level={item.confidence_level}
          />
        </View>
      </View>

      {/* Symptoms */}
      {disease?.symptoms && disease.symptoms.length > 0 && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Identified Leaf Symptoms</Text>
          {disease.symptoms.map((s, i) => (
            <View key={i} style={styles.bulletRow}>
              <Ionicons name="ellipse" size={8} color={COLORS.danger} style={{ marginRight: 8, marginTop: 6 }} />
              <Text style={styles.bulletText}>{s}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Management */}
      {disease?.management && disease.management.length > 0 && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Recommended Care Steps</Text>
          {disease.management.map((m, i) => (
            <View key={i} style={styles.bulletRow}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.healthy} style={{ marginRight: 8, marginTop: 2 }} />
              <Text style={styles.bulletText}>{m}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Prevention */}
      {disease?.prevention && disease.prevention.length > 0 && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Prevention</Text>
          {disease.prevention.map((p, i) => (
            <View key={i} style={styles.bulletRow}>
              <Ionicons name="shield-checkmark" size={16} color={COLORS.secondary} style={{ marginRight: 8, marginTop: 2 }} />
              <Text style={styles.bulletText}>{p}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.deleteActionBtn} onPress={handleDelete} activeOpacity={0.8}>
          <Ionicons name="trash-outline" size={18} color={COLORS.danger} style={{ marginRight: 6 }} />
          <Text style={styles.deleteActionText}>Delete Scan</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.scanAgainBtn}
          onPress={() => router.replace('/(tabs)/scan')}
          activeOpacity={0.85}
        >
          <Ionicons name="camera-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.scanAgainText}>Scan Another</Text>
        </TouchableOpacity>
      </View>
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
  imageCard: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: '#000000',
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  image: {
    width: '100%',
    height: 250,
  },
  placeholder: {
    backgroundColor: COLORS.accentSuperLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  plantName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  diseaseName: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  specimenTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: COLORS.accentSuperLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    marginBottom: 8,
  },
  specimenTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  badgeSection: {
    marginTop: 4,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textSecondary,
  },
  btnRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  deleteActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.danger,
    paddingVertical: 12,
    borderRadius: RADIUS.sm,
  },
  deleteActionText: {
    color: COLORS.danger,
    fontWeight: '700',
    fontSize: 14,
  },
  scanAgainBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: RADIUS.sm,
  },
  scanAgainText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});

