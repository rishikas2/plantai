import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

interface ConfidenceBadgeProps {
  confidence: number;          // 0.0 - 1.0
  confidencePercent?: number;  // 0 - 100
  level?: 'High' | 'Moderate' | 'Low';
  showBar?: boolean;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({
  confidence,
  confidencePercent,
  level,
  showBar = true,
}) => {
  const percent = confidencePercent ?? Math.round(confidence * 100);

  let badgeColor = COLORS.healthy;
  let badgeBg = COLORS.healthyBackground;
  let textLabel = 'High Confidence';

  if (percent < 58) {
    badgeColor = COLORS.danger;
    badgeBg = COLORS.dangerBackground;
    textLabel = 'Low Confidence';
  } else if (percent < 80) {
    badgeColor = COLORS.warning;
    badgeBg = COLORS.warningBackground;
    textLabel = 'Moderate Confidence';
  }

  const displayLevel = level ? `${level} Confidence` : textLabel;

  return (
    <View style={styles.container}>
      <View style={[styles.badge, { backgroundColor: badgeBg }]}>
        <View style={[styles.dot, { backgroundColor: badgeColor }]} />
        <Text style={[styles.badgeText, { color: badgeColor }]}>
          {percent}% • {displayLevel}
        </Text>
      </View>

      {showBar && (
        <View style={styles.barTrack}>
          <View
            style={[
              styles.barFill,
              {
                width: `${Math.min(Math.max(percent, 0), 100)}%`,
                backgroundColor: badgeColor,
              },
            ]}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.xs,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  barTrack: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
    width: '100%',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
});

