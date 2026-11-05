import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, RADIUS, SPACING, SHADOWS } from '../../src/constants/theme';
import { Header } from '../../src/components/Header';
import { getDiseases } from '../../src/services/api';
import { DiseaseDetail } from '../../src/types';

export default function LibraryScreen() {
  const router = useRouter();
  const [diseases, setDiseases] = useState<DiseaseDetail[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [filterSupportedOnly, setFilterSupportedOnly] = useState<boolean>(false);

  useEffect(() => {
    async function load() {
      const data = await getDiseases();
      setDiseases(data);
    }
    load();
  }, []);

  const categories = [
    'All',
    'Fungal',
    'Bacterial',
    'Viral',
    'Healthy',
    'Nutritional/Abiotic',
    'Oomycete / Water Mold',
  ];

  const filteredDiseases = diseases.filter((d) => {
    // Search filter
    const matchesSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.plant.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.scientificName && d.scientificName.toLowerCase().includes(searchQuery.toLowerCase()));

    // Category filter
    const matchesCategory =
      selectedCategory === 'All' ||
      d.category.toLowerCase() === selectedCategory.toLowerCase();

    // Model support filter
    const matchesSupported = !filterSupportedOnly || d.isSupportedByModel;

    return matchesSearch && matchesCategory && matchesSupported;
  });

  const renderItem = ({ item }: { item: DiseaseDetail }) => {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/disease/${item.id}`)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <View style={styles.plantRow}>
              <Text style={styles.plantText}>{item.plant}</Text>
              {item.isSupportedByModel ? (
                <View style={styles.supportedBadge}>
                  <Ionicons name="sparkles" size={10} color={COLORS.primary} style={{ marginRight: 2 }} />
                  <Text style={styles.supportedBadgeText}>AI Supported</Text>
                </View>
              ) : (
                <View style={styles.eduBadge}>
                  <Text style={styles.eduBadgeText}>Educational Only</Text>
                </View>
              )}
            </View>

            <Text style={styles.diseaseTitle}>{item.name}</Text>
            {item.scientificName && (
              <Text style={styles.scientificText}>{item.scientificName}</Text>
            )}
          </View>

          <View
            style={[
              styles.categoryPill,
              {
                backgroundColor: item.category === 'Healthy'
                  ? COLORS.healthyBackground
                  : item.category === 'Bacterial'
                  ? '#FEF3C7'
                  : item.category === 'Viral'
                  ? '#FEE2E2'
                  : '#EFF6FF',
              },
            ]}
          >
            <Text
              style={[
                styles.categoryPillText,
                {
                  color: item.category === 'Healthy'
                    ? COLORS.healthy
                    : item.category === 'Bacterial'
                    ? '#B45309'
                    : item.category === 'Viral'
                    ? '#B91C1C'
                    : '#1E40AF',
                },
              ]}
            >
              {item.category}
            </Text>
          </View>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.cardFooter}>
          <Text style={styles.symptomsCount}>
            {item.symptoms.length} symptoms documented
          </Text>
          <View style={styles.viewLink}>
            <Text style={styles.viewLinkText}>View Guide</Text>
            <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Disease Knowledge Base"
        subtitle={`${diseases.length} curated conditions`}
      />

      {/* Search Input Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search plant, disease, or pathogen..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Model Support Toggle Filter */}
        <TouchableOpacity
          style={[styles.toggleBtn, filterSupportedOnly && styles.toggleBtnActive]}
          onPress={() => setFilterSupportedOnly(!filterSupportedOnly)}
        >
          <Ionicons
            name={filterSupportedOnly ? 'checkmark-circle' : 'ellipse-outline'}
            size={14}
            color={filterSupportedOnly ? '#FFFFFF' : COLORS.primary}
            style={{ marginRight: 4 }}
          />
          <Text style={[styles.toggleBtnText, filterSupportedOnly && styles.toggleBtnTextActive]}>
            Model Predictable Only
          </Text>
        </TouchableOpacity>
      </View>

      {/* Category Pills Strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        {categories.map((cat) => {
          const active = selectedCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryTab, active && styles.categoryTabActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.categoryTabText, active && styles.categoryTabTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Disease List */}
      <FlatList
        data={filteredDiseases}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No matching diseases found</Text>
            <Text style={styles.emptySub}>Try adjusting your search terms or filters.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: COLORS.accentSuperLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    marginTop: 8,
    marginBottom: 4,
  },
  toggleBtnActive: {
    backgroundColor: COLORS.primary,
  },
  toggleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  toggleBtnTextActive: {
    color: '#FFFFFF',
  },
  categoryScroll: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
    backgroundColor: '#FFFFFF',
  },
  categoryTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
    marginRight: 6,
  },
  categoryTabActive: {
    backgroundColor: COLORS.primary,
  },
  categoryTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  categoryTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  plantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  plantText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    marginRight: 6,
  },
  supportedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentSuperLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.full,
  },
  supportedBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.primary,
  },
  eduBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.full,
  },
  eduBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  diseaseTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  scientificText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: COLORS.textMuted,
    marginTop: 1,
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.xs,
    marginLeft: 6,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  description: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginVertical: SPACING.xs,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  symptomsCount: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  viewLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    marginRight: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    marginTop: SPACING.lg,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: SPACING.sm,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },
});

