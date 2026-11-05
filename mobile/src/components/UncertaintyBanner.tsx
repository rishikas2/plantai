import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

interface UncertaintyBannerProps {
  message?: string | null;
  onRetake?: () => void;
  onConsultExpert?: () => void;
}

export const UncertaintyBanner: React.FC<UncertaintyBannerProps> = ({
  message,
  onRetake,
  onConsultExpert,
}) => {
  const defaultMsg =
    "We couldn't confidently identify the plant condition. Try taking a clearer photograph or consult an agricultural expert.";

  return (
    <View style={styles.banner}>
      <View style={styles.headerRow}>
        <Ionicons name="alert-circle" size={24} color={COLORS.warning} />
        <Text style={styles.title}>Uncertain Identification</Text>
      </View>

      <Text style={styles.body}>{message || defaultMsg}</Text>

      <View style={styles.tipsBox}>
        <Text style={styles.tipsTitle}>Tips for better accuracy:</Text>
        <Text style={styles.tipItem}>• Ensure only a single leaf fills the frame.</Text>
        <Text style={styles.tipItem}>• Use bright, diffuse daylight (avoid harsh shadows).</Text>
        <Text style={styles.tipItem}>• Ensure the camera focuses crisply on leaf lesions.</Text>
      </View>

      <View style={styles.buttonRow}>
        {onRetake && (
          <TouchableOpacity style={styles.secondaryBtn} onPress={onRetake} activeOpacity={0.8}>
            <Ionicons name="camera-reverse-outline" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.secondaryBtnText}>Retake Photo</Text>
          </TouchableOpacity>
        )}
        {onConsultExpert && (
          <TouchableOpacity style={styles.primaryBtn} onPress={onConsultExpert} activeOpacity={0.8}>
            <Ionicons name="book-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.primaryBtnText}>Care Advice</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1.5,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginVertical: SPACING.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
    marginLeft: SPACING.xs,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: '#78350F',
    marginVertical: SPACING.xs,
  },
  tipsBox: {
    backgroundColor: 'rgba(254, 243, 199, 0.6)',
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  tipsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 4,
  },
  tipItem: {
    fontSize: 12,
    lineHeight: 18,
    color: '#78350F',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: COLORS.primary,
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
  },
  primaryBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

