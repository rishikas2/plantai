import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, RADIUS, SPACING, SHADOWS } from '../../src/constants/theme';
import { Header } from '../../src/components/Header';
import { EmptyState } from '../../src/components/EmptyState';
import { getMonitoredPlants, deleteMonitoredPlant } from '../../src/services/storage';
import { MonitoredPlant } from '../../src/types';

export default function MonitorScreen() {
  const router = useRouter();
  const [plants, setPlants] = useState<MonitoredPlant[]>([]);

  const loadPlants = useCallback(async () => {
    const list = await getMonitoredPlants();
    setPlants(list);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPlants();
    }, [loadPlants])
  );

  const handleDeletePlant = (plant: MonitoredPlant) => {
    Alert.alert(
      'Stop Monitoring Plant',
      `Delete monitoring record for "${plant.label}"? Individual scan history will remain saved.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteMonitoredPlant(plant.id);
            await loadPlants();
          },
        },
      ]
    );
  };

  const renderPlant = ({ item }: { item: MonitoredPlant }) => {
    const totalScans = item.scans.length;
    const latestScan = item.scans[0];
    const previousScan = totalScans > 1 ? item.scans[1] : null;

    const conditionChanged =
      previousScan && previousScan.disease !== latestScan.disease;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.labelGroup}>
            <Ionicons name="bookmark" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.plantLabel}>{item.label}</Text>
          </View>
          <TouchableOpacity onPress={() => handleDeletePlant(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="trash-outline" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        <Text style={styles.plantSpecies}>Species: {item.plantType}</Text>

        {/* Thumbnail Preview Row */}
        <View style={styles.thumbsRow}>
          {latestScan?.imageUri && (
            <View style={styles.thumbWrapper}>
              <Image source={{ uri: latestScan.imageUri }} style={styles.thumbImg} />
              <View style={styles.thumbLabel}>
                <Text style={styles.thumbLabelText}>Latest</Text>
              </View>
            </View>
          )}

          {previousScan?.imageUri && (
            <View style={styles.thumbWrapper}>
              <Image source={{ uri: previousScan.imageUri }} style={styles.thumbImg} />
              <View style={styles.thumbLabel}>
                <Text style={styles.thumbLabelText}>Previous</Text>
              </View>
            </View>
          )}

          <View style={styles.statsCol}>
            <Text style={styles.statsNumber}>{totalScans}</Text>
            <Text style={styles.statsText}>Scans logged</Text>
            <Text style={styles.dateUpdated}>
              Last: {latestScan?.dateFormatted || 'Recently'}
            </Text>
          </View>
        </View>

        {/* Diagnosis Status Summary */}
        <View style={styles.diagnosisSummaryBox}>
          <View style={styles.diagRow}>
            <Text style={styles.diagLabel}>Current Status:</Text>
            <Text style={[styles.diagValue, { color: latestScan.is_healthy ? COLORS.healthy : COLORS.danger }]}>
              {latestScan.disease} ({latestScan.confidence_percent}%)
            </Text>
          </View>

          {previousScan && (
            <View style={styles.diagRow}>
              <Text style={styles.diagLabel}>Previous Status:</Text>
              <Text style={styles.diagPrevValue}>
                {previousScan.disease} ({previousScan.confidence_percent}%)
              </Text>
            </View>
          )}

          {conditionChanged && (
            <View style={styles.diffAlertPill}>
              <Ionicons name="information-circle" size={14} color="#B45309" style={{ marginRight: 4 }} />
              <Text style={styles.diffAlertText}>
                Prediction changed. This may reflect plant condition shifts, lighting variations, or angle differences.
              </Text>
            </View>
          )}
        </View>

        {/* Action Controls */}
        <View style={styles.cardActions}>
          {totalScans >= 2 ? (
            <TouchableOpacity
              style={styles.compareBtn}
              onPress={() =>
                router.push({
                  pathname: '/comparison',
                  params: {
                    plantId: item.id,
                  },
                })
              }
              activeOpacity={0.85}
            >
              <Ionicons name="git-compare-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.compareBtnText}>Side-by-Side Comparison</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.addScanBtn}
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/scan',
                })
              }
              activeOpacity={0.8}
            >
              <Ionicons name="camera-outline" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
              <Text style={styles.addScanBtnText}>Log 2nd Scan to Compare</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Plant Monitoring"
        subtitle="Track health trajectory over time"
      />

      {plants.length === 0 ? (
        <EmptyState
          icon="trending-up-outline"
          title="No plants monitored yet"
          description="When analyzing a leaf, assign a simple label (e.g., 'Tomato Plant 1') to track changes over time and view side-by-side progression."
          actionLabel="Scan & Label a Plant"
          onAction={() => router.push('/(tabs)/scan')}
        />
      ) : (
        <FlatList
          data={plants}
          keyExtractor={(item) => item.id}
          renderItem={renderPlant}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  labelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  plantLabel: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  plantSpecies: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
  },
  thumbsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  thumbWrapper: {
    position: 'relative',
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  },
  thumbImg: {
    width: 74,
    height: 74,
    backgroundColor: '#000000',
  },
  thumbLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingVertical: 2,
    alignItems: 'center',
  },
  thumbLabelText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statsCol: {
    flex: 1,
    paddingLeft: SPACING.xs,
  },
  statsNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
  },
  statsText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  dateUpdated: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  diagnosisSummaryBox: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm + 2,
    marginVertical: SPACING.xs,
  },
  diagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  diagLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  diagValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  diagPrevValue: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  diffAlertPill: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 6,
    marginTop: 6,
  },
  diffAlertText: {
    flex: 1,
    fontSize: 11,
    color: '#92400E',
    lineHeight: 15,
  },
  cardActions: {
    marginTop: SPACING.sm,
  },
  compareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
  },
  compareBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  addScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
  },
  addScanBtnText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 13,
  },
});

