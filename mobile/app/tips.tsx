import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, RADIUS, SPACING, SHADOWS } from '../src/constants/theme';
import { getPlantCareTips } from '../src/services/api';
import { PlantTip } from '../src/types';

export default function TipsScreen() {
  const [tips, setTips] = useState<PlantTip[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const data = await getPlantCareTips();
      setTips(data);
      if (data.length > 0) {
        setExpandedId(data[0].id); // Expand first tip by default
      }
    }
    load();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroBanner}>
        <Ionicons name="school-outline" size={28} color="#FFFFFF" style={{ marginBottom: 6 }} />
        <Text style={styles.heroTitle}>Agricultural Plant Care Guide</Text>
        <Text style={styles.heroSub}>
          Curated agronomic practices for leaf inspection, watering, tool hygiene, and disease prevention.
        </Text>
      </View>

      {tips.map((tip) => {
        const isExpanded = expandedId === tip.id;
        return (
          <View key={tip.id} style={styles.card}>
            <TouchableOpacity
              style={styles.cardHeader}
              onPress={() => toggleExpand(tip.id)}
              activeOpacity={0.8}
            >
              <View style={styles.iconCircle}>
                <Ionicons name="leaf" size={20} color={COLORS.primary} />
              </View>

              <View style={styles.headerTextCol}>
                <Text style={styles.categoryText}>{tip.category}</Text>
                <Text style={styles.tipTitle}>{tip.title}</Text>
                <Text style={styles.readTimeText}>{tip.readTimeMinutes} min read</Text>
              </View>

              <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>

            <Text style={styles.summaryText}>{tip.summary}</Text>

            {isExpanded && (
              <View style={styles.expandedSection}>
                {/* Key Points */}
                <Text style={styles.subHeading}>Key Guidelines:</Text>
                {tip.keyPoints.map((point, idx) => (
                  <View key={idx} style={styles.bulletRow}>
                    <Ionicons name="checkmark-circle" size={15} color={COLORS.secondary} style={styles.bulletIcon} />
                    <Text style={styles.bulletText}>{point}</Text>
                  </View>
                ))}

                {/* Practical Action Steps */}
                {tip.actionSteps && tip.actionSteps.length > 0 && (
                  <View style={styles.actionBox}>
                    <Text style={styles.actionBoxTitle}>Recommended Action Steps:</Text>
                    {tip.actionSteps.map((step, idx) => (
                      <View key={idx} style={styles.actionRow}>
                        <Text style={styles.actionNumber}>{idx + 1}.</Text>
                        <Text style={styles.actionText}>{step}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        );
      })}

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
  heroBanner: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroSub: {
    fontSize: 13,
    color: COLORS.accentLight,
    marginTop: 4,
    lineHeight: 18,
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
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.accentSuperLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  headerTextCol: {
    flex: 1,
    marginRight: SPACING.xs,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 1,
  },
  readTimeText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  summaryText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },
  expandedSection: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  subHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bulletIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
  },
  actionBox: {
    backgroundColor: '#F8FBF8',
    borderRadius: RADIUS.sm,
    padding: SPACING.sm + 2,
    marginTop: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.accentLight,
  },
  actionBoxTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 6,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  actionNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    marginRight: 6,
    width: 16,
  },
  actionText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
  },
});

