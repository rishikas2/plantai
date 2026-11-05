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
import { getScanHistory, deleteScanItem, clearAllScanHistory } from '../../src/services/storage';
import { ScanHistoryItem } from '../../src/types';

export default function HistoryScreen() {
  const router = useRouter();
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<ScanHistoryItem[]>([]);
  const [filterType, setFilterType] = useState<'All' | 'Diseased' | 'Healthy'>('All');

  const loadHistory = useCallback(async () => {
    const list = await getScanHistory();
    setHistory(list);
    applyFilter(list, filterType);
  }, [filterType]);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  const applyFilter = (items: ScanHistoryItem[], filter: 'All' | 'Diseased' | 'Healthy') => {
    setFilterType(filter);
    if (filter === 'All') {
      setFilteredHistory(items);
    } else if (filter === 'Diseased') {
      setFilteredHistory(items.filter((i) => !i.is_healthy));
    } else if (filter === 'Healthy') {
      setFilteredHistory(items.filter((i) => i.is_healthy));
    }
  };

  const handleDelete = (item: ScanHistoryItem) => {
    Alert.alert(
      'Delete Scan Record',
      `Are you sure you want to delete the record for ${item.plant} - ${item.disease}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteScanItem(item.id);
            await loadHistory();
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    if (history.length === 0) return;
    Alert.alert(
      'Clear All Scan History',
      'This will remove all saved scans from this device. Monitored plants will retain their labels.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await clearAllScanHistory();
            await loadHistory();
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: ScanHistoryItem }) => {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/history/${item.id}`)}
        activeOpacity={0.8}
      >
        {item.imageUri ? (
          <Image source={{ uri: item.imageUri }} style={styles.thumbnail} />
        ) : (
          <View style={[styles.thumbnail, styles.thumbPlaceholder]}>
            <Ionicons name="leaf" size={26} color={COLORS.primary} />
          </View>
        )}

        <View style={styles.cardBody}>
          <View style={styles.rowTop}>
            <Text style={styles.plantName}>{item.plant}</Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: item.is_healthy
                    ? COLORS.healthyBackground
                    : COLORS.dangerBackground,
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: item.is_healthy ? COLORS.healthy : COLORS.danger },
                ]}
              >
                {item.is_healthy ? 'Healthy' : 'Diseased'}
              </Text>
            </View>
          </View>

          <Text style={styles.diseaseName} numberOfLines={1}>
            {item.disease}
          </Text>

          {item.plantLabel ? (
            <View style={styles.tagWrap}>
              <Ionicons name="bookmark" size={10} color={COLORS.primary} style={{ marginRight: 3 }} />
              <Text style={styles.tagText}>{item.plantLabel}</Text>
            </View>
          ) : null}

          <View style={styles.rowBottom}>
            <Text style={styles.dateText}>{item.dateFormatted}</Text>
            <Text style={styles.confidenceText}>{item.confidence_percent}% confidence</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleDelete(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Scan History"
        subtitle={`${history.length} saved diagnostic records`}
        rightAction={
          history.length > 0 ? (
            <TouchableOpacity onPress={handleClearAll} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="trash-bin-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          ) : undefined
        }
      />

      {/* Filter Tabs */}
      {history.length > 0 && (
        <View style={styles.filterStrip}>
          {(['All', 'Diseased', 'Healthy'] as const).map((filter) => {
            const active = filterType === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[styles.filterTab, active && styles.filterTabActive]}
                onPress={() => applyFilter(history, filter)}
              >
                <Text style={[styles.filterTabText, active && styles.filterTabTextActive]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {filteredHistory.length === 0 ? (
        <EmptyState
          icon="time-outline"
          title={history.length === 0 ? 'No scans saved yet' : 'No matching scans'}
          description={
            history.length === 0
              ? 'Analyze plant leaf photos to build a searchable record of crop health.'
              : 'Try selecting a different filter above.'
          }
          actionLabel="Scan a Plant Now"
          onAction={() => router.push('/(tabs)/scan')}
        />
      ) : (
        <FlatList
          data={filteredHistory}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
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
  filterStrip: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    padding: SPACING.sm + 2,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.sm,
  },
  thumbnail: {
    width: 68,
    height: 68,
    borderRadius: RADIUS.sm,
    backgroundColor: '#000000',
  },
  thumbPlaceholder: {
    backgroundColor: COLORS.accentSuperLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    marginLeft: SPACING.sm + 2,
    marginRight: SPACING.xs,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  plantName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  diseaseName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 1,
  },
  tagWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  tagText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
  },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  dateText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  deleteBtn: {
    padding: SPACING.xs,
    marginLeft: 4,
  },
});

